/**
 * @file This service is the primary client-side interface for interacting with the AuthGateway microservice.
 * It manages the user's session, including handling OpenID Connect (OIDC) redirects, storing short-lived
 * JSON Web Tokens (JWTs), and orchestrating silent token refreshes. This service operates under a
 * Zero-Trust model, where this client never handles any long-lived secrets or third-party API tokens.
 *
 * @module services/authService
 * @see AuthGateway microservice documentation for endpoint details.
 * @security This service is critical for frontend security. It is responsible for storing the session JWT
 *           securely in memory and managing its lifecycle. It should not expose the JWT to insecure contexts
 *           (e.g., localStorage).
 */

// Import necessary types and services
import { logError, logEvent, measurePerformance } from './telemetryService';
import type { AppUser } from '../types'; // Assuming AppUser can be derived from JWT payload

/**
 * Represents the decoded payload of the session JWT.
 * This is for UI purposes only and should not be trusted for authorization decisions on the client.
 *
 * @interface JwtPayload
 * @property {string} sub - The subject (user ID).
 * @property {string} name - The user's display name.
 * @property {string} email - The user's email.
 * @property {string[]} roles - Array of user roles.
 * @property {number} iat - Issued at timestamp.
 * @property {number} exp - Expiration timestamp.
 */
interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Configuration constants. In a real app, these would come from an environment config.
const AUTH_GATEWAY_URL = '/auth'; // All auth requests are proxied through the BFF
const REFRESH_TOKEN_ENDPOINT = `${AUTH_GATEWAY_URL}/refresh`;
const LOGIN_ENDPOINT = `${AUTH_GATEWAY_URL}/login`;
const LOGOUT_ENDPOINT = `${AUTH_GATEWAY_URL}/logout`;
const TOKEN_REFRESH_BUFFER_SECONDS = 60; // Refresh 60 seconds before expiry

/**
 * A singleton class to manage the client-side authentication session.
 * It handles the OIDC flow, JWT storage, and token refresh logic.
 *
 * @class SessionManager
 */
class SessionManager {
  private static instance: SessionManager;
  private jwt: string | null = null;
  private user: AppUser | null = null;
  private refreshTimer: number | null = null;
  private onStateChangeCallback: ((user: AppUser | null) => void) | null = null;

  /**
   * Private constructor to enforce singleton pattern.
   * @private
   */
  private constructor() {
    logEvent('SessionManager_Instantiated');
  }

  /**
   * Gets the singleton instance of the SessionManager.
   * @returns {SessionManager} The singleton instance.
   */
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Subscribes a callback function to be invoked whenever the authentication state changes.
   * @param {(user: AppUser | null) => void} callback The function to call on state change.
   * @returns {() => void} An unsubscribe function.
   * @example
   * const unsubscribe = authService.onAuthStateChanged(user => {
   *   console.log('User state changed:', user);
   * });
   */
  public onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    this.onStateChangeCallback = callback;
    logEvent('SessionManager_AuthStateListenerAttached');
    // Immediately invoke with current state
    callback(this.user);

    return () => {
      this.onStateChangeCallback = null;
      logEvent('SessionManager_AuthStateListenerDetached');
    };
  }

  /**
   * Initiates the login process by redirecting the user to the AuthGateway's login endpoint.
   * The AuthGateway will then handle the OIDC flow with the identity provider.
   * @param {string} [redirectPath=window.location.pathname] - The path to redirect back to after successful login.
   * @performance This involves a full page redirect, which will re-initialize the application.
   * @security The use of redirects is a standard and secure part of the OIDC Authorization Code Flow.
   */
  public login(redirectPath: string = window.location.pathname): void {
    logEvent('SessionManager_LoginInitiated', { redirectPath });
    // Store the intended redirect path so we can return after the auth callback.
    sessionStorage.setItem('auth_redirect_path', redirectPath);
    window.location.href = `${LOGIN_ENDPOINT}?redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
  }

  /**
   * Handles the authentication callback from the AuthGateway.
   * This method should be called on the dedicated callback page (e.g., /auth/callback).
   * It fetches the JWT from the gateway and initializes the user session.
   * @returns {Promise<string>} The path to redirect to after handling the callback.
   * @throws {Error} if the authentication callback fails or the token is invalid.
   */
  public async handleAuthCallback(): Promise<string> {
    return measurePerformance('SessionManager.handleAuthCallback', async () => {
      try {
        logEvent('SessionManager_HandleAuthCallback_Start');
        const response = await fetch(`${AUTH_GATEWAY_URL}/token${window.location.search}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to exchange authorization code for token. Status: ${response.status}`);
        }

        const { accessToken } = await response.json();
        if (!accessToken) {
          throw new Error('No access token received from AuthGateway.');
        }

        this.setSession(accessToken);
        logEvent('SessionManager_HandleAuthCallback_Success');
        
        const redirectPath = sessionStorage.getItem('auth_redirect_path') || '/';
        sessionStorage.removeItem('auth_redirect_path');
        return redirectPath;
      } catch (error) {
        logError(error as Error, { context: 'handleAuthCallback' });
        this.clearSession();
        throw new Error(`Authentication callback failed: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Logs the user out by clearing the local session and redirecting to the AuthGateway's logout endpoint.
   * The AuthGateway will handle clearing its session and potentially logging out of the OIDC provider.
   */
  public logout(): void {
    logEvent('SessionManager_LogoutInitiated');
    const jwtToInvalidate = this.jwt;
    this.clearSession();

    // The redirect URI tells the AuthGateway where to send the user back after logout.
    const postLogoutRedirectUri = window.location.origin;
    
    // Invalidate token on the backend as well.
    if (jwtToInvalidate) {
        fetch(LOGOUT_ENDPOINT, { 
            method: 'POST', 
            headers: {'Authorization': `Bearer ${jwtToInvalidate}`} 
        }).catch(err => logError(err, {context: 'logout-fetch'}));
    }
    
    window.location.href = `${LOGOUT_ENDPOINT}?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;
  }

  /**
   * Retrieves the current session JWT.
   * @returns {string | null} The current JWT, or null if not authenticated.
   */
  public getJwt(): string | null {
    return this.jwt;
  }
  
  /**
   * Checks if the user is currently authenticated with a valid, non-expired token.
   * @returns {boolean} True if the user is authenticated, false otherwise.
   */
  public isAuthenticated(): boolean {
    if (!this.jwt) {
      return false;
    }
    try {
      const payload = this.decodeJwt(this.jwt);
      // Check if the token is expired (with a small buffer)
      return payload.exp * 1000 > Date.now() - 5000;
    } catch (error) {
      logError(error as Error, { context: 'isAuthenticated' });
      return false;
    }
  }

  /**
   * Retrieves the current user's information from the JWT payload.
   * @returns {AppUser | null} The current user object, or null if not authenticated.
   */
  public getCurrentUser(): AppUser | null {
    return this.user;
  }
  
  /**
   * Sets the current session using a new JWT. This is the core method for session management.
   * It decodes the token, sets up the user object, and schedules a refresh.
   * @param {string} newJwt The new JSON Web Token.
   * @private
   */
  private setSession(newJwt: string): void {
    try {
      const payload = this.decodeJwt(newJwt);
      this.jwt = newJwt;
      this.user = this.payloadToAppUser(payload);
      this.scheduleRefresh(payload.exp);

      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(this.user);
      }
      logEvent('SessionManager_SessionSet', { userId: this.user.uid, expires: new Date(payload.exp * 1000).toISOString() });
    } catch (error) {
      logError(error as Error, { context: 'setSession' });
      this.clearSession();
    }
  }

  /**
   * Clears all session information from memory and stops any running timers.
   * @private
   */
  private clearSession(): void {
    this.jwt = null;
    this.user = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(null);
    }
    logEvent('SessionManager_SessionCleared');
  }

  /**
   * Schedules a silent token refresh before the current JWT expires.
   * @param {number} expiryTimestamp The expiration timestamp (in seconds) of the current JWT.
   * @private
   */
  private scheduleRefresh(expiryTimestamp: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const nowSeconds = Date.now() / 1000;
    const expiresInSeconds = expiryTimestamp - nowSeconds;
    const refreshInSeconds = expiresInSeconds - TOKEN_REFRESH_BUFFER_SECONDS;

    if (refreshInSeconds > 0) {
      this.refreshTimer = window.setTimeout(() => {
        this.silentRefresh();
      }, refreshInSeconds * 1000);
      logEvent('SessionManager_RefreshScheduled', { inSeconds: refreshInSeconds });
    } else {
        logEvent('SessionManager_RefreshNotScheduled', { reason: 'Token already expired or too close to expiry.' });
    }
  }

  /**
   * Performs a silent token refresh by calling the AuthGateway's refresh endpoint.
   * This is typically done in the background without user interaction.
   * @private
   */
  private async silentRefresh(): Promise<void> {
    logEvent('SessionManager_SilentRefresh_Start');
    try {
      // The refresh request relies on a secure, HttpOnly cookie managed by the AuthGateway.
      const response = await fetch(REFRESH_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Silent refresh failed with status ${response.status}`);
      }

      const { accessToken } = await response.json();
      this.setSession(accessToken);
      logEvent('SessionManager_SilentRefresh_Success');
    } catch (error) {
      logError(error as Error, { context: 'silentRefresh' });
      // If silent refresh fails, the user is effectively logged out.
      this.clearSession();
    }
  }
  
  /**
   * Decodes a JWT payload without verifying the signature (signature verification happens server-side).
   * @param {string} token The JWT string.
   * @returns {JwtPayload} The decoded payload.
   * @throws {Error} if the token is malformed.
   * @private
   */
  private decodeJwt(token: string): JwtPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error(`Failed to decode JWT: ${(error as Error).message}`);
    }
  }

  /**
   * Maps a JWT payload to the application's AppUser type.
   * @param {JwtPayload} payload The decoded JWT payload.
   * @returns {AppUser} The application user object.
   * @private
   */
  private payloadToAppUser(payload: JwtPayload): AppUser {
    return {
      uid: payload.sub,
      displayName: payload.name,
      email: payload.email,
      photoURL: null, // This info might not be in the session JWT, could be fetched separately.
      tier: 'pro' // This could also be part of the JWT roles/claims.
    };
  }
}

/**
 * Singleton instance of the SessionManager.
 * Import this instance to interact with the authentication service throughout the application.
 * @example
 * import authService from './services/authService';
 * authService.login();
 */
const authService = SessionManager.getInstance();
export default authService;
