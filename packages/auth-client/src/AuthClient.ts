/**
 * @file Defines the AuthClient, a client-side library for managing OIDC-based authentication flows
 * with the AuthGateway microservice. This client handles token acquisition, storage, refresh, and session management
 * in a zero-trust model where the client never holds long-lived secrets.
 *
 * @module packages/auth-client/src/AuthClient
 * @see @security The client leverages oidc-client-ts for secure OIDC flow management, including PKCE. Tokens are stored in session storage.
 * @see @performance Caches the user session in memory and uses silent refresh to maintain sessions without disruptive page reloads.
 */

import { UserManager, User, UserManagerSettings } from 'oidc-client-ts';
import { jwtDecode } from 'jwt-decode';

/**
 * Configuration for the AuthClient. It maps directly to oidc-client-ts settings.
 * @interface
 */
export interface AuthClientConfig {
  /** The base URL of the AuthGateway microservice (OIDC authority). */
  authority: string;
  /** The OIDC client ID for this application. */
  client_id: string;
  /** The URL where the user is redirected after successful login. Must be registered with the AuthGateway. */
  redirect_uri: string;
  /** The URL where the user is redirected after successful logout. */
  post_logout_redirect_uri: string;
  /** The OIDC scopes to request. Defaults to 'openid profile email'. */
  scope?: string;
}

/**
 * Represents the decoded payload of a user's JWT.
 * @interface
 */
export interface UserSession {
  /** Subject (user ID). */
  sub: string;
  /** User's email address. */
  email?: string;
  /** User's full name. */
  name?: string;
  /** URL of the user's profile picture. */
  picture?: string;
  /** Expiration time (Unix timestamp). */
  exp: number;
  /** Issued at time (Unix timestamp). */
  iat: number;
  /** Issuer of the token. */
  iss: string;
  /** Audience of the token. */
  aud: string;
  [key: string]: any; // Allow other properties
}

/**
 * The authentication state of the client.
 * - `unauthenticated`: No valid session exists.
 * - `pending`: Authentication flow is in progress.
 * - `authenticated`: A valid session is established.
 */
export type AuthState = 'unauthenticated' | 'pending' | 'authenticated';

/**
 * Callback function type for auth state changes.
 */
export type AuthStateCallback = (state: AuthState, user: UserSession | null) => void;

/**
 * The client-side class for managing authentication against the AuthGateway.
 * It orchestrates the OIDC/OAuth2 authorization code flow with PKCE using oidc-client-ts.
 */
export class AuthClient {
  private userManager: UserManager;
  private session: UserSession | null = null;
  private authState: AuthState = 'pending';
  private subscribers: Set<AuthStateCallback> = new Set();

  /**
   * @param {AuthClientConfig} config - The configuration for the authentication client.
   */
  constructor(config: AuthClientConfig) {
    const settings: UserManagerSettings = {
      ...config,
      response_type: 'code',
      scope: config.scope || 'openid profile email',
      userStore: new (class {
        // Use sessionStorage for tokens
        getItem(key: string) { return sessionStorage.getItem(key); }
        setItem(key: string, value: string) { sessionStorage.setItem(key, value); }
        removeItem(key: string) { sessionStorage.removeItem(key); }
      })(),
      automaticSilentRenew: true,
      silent_redirect_uri: `${window.location.origin}/silent-refresh.html`, // Assumes this file exists
    };
    this.userManager = new UserManager(settings);

    this.userManager.events.addUserLoaded(this.onUserLoaded);
    this.userManager.events.addUserUnloaded(this.onUserUnloaded);
    this.userManager.events.addSilentRenewError(this.onSilentRenewError);

    this.initializeSession();
  }

  private onUserLoaded = (user: User) => {
    try {
      this.session = jwtDecode<UserSession>(user.access_token);
      this._updateAuthState('authenticated', this.session);
    } catch (e) {
      console.error("Failed to decode JWT on user load:", e);
      this.session = null;
      this._updateAuthState('unauthenticated', null);
    }
  };

  private onUserUnloaded = () => {
    this.session = null;
    this._updateAuthState('unauthenticated', null);
  };

  private onSilentRenewError = (error: Error) => {
    console.error("Silent renew error:", error);
    this.session = null;
    this._updateAuthState('unauthenticated', null);
  };

  /**
   * Initiates the login flow by redirecting to the AuthGateway.
   */
  public async login(): Promise<void> {
    return this.userManager.signinRedirect();
  }

  /**
   * Handles the redirect from the AuthGateway after login.
   * @returns {Promise<UserSession | null>} The user session object or null if failed.
   */
  public async handleLoginCallback(): Promise<UserSession | null> {
    this._updateAuthState('pending', null);
    try {
      const user = await this.userManager.signinRedirectCallback();
      if (user && !user.expired) {
        this.onUserLoaded(user);
        return this.session;
      }
      this.onUserUnloaded();
      return null;
    } catch (error) {
      console.error("Error handling login callback:", error);
      this.onUserUnloaded();
      return null;
    }
  }

  /**
   * Initiates the logout flow.
   */
  public async logout(): Promise<void> {
    return this.userManager.signoutRedirect();
  }

  /**
   * Retrieves the current JWT access token.
   * @returns {Promise<string | null>} The current JWT or null.
   */
  public async getJwt(): Promise<string | null> {
    const user = await this.userManager.getUser();
    return user && !user.expired ? user.access_token : null;
  }

  /**
   * Retrieves the current user session information.
   * @returns {UserSession | null} The decoded user session or null.
   */
  public getSession(): UserSession | null {
    return this.session;
  }

  /**
   * Checks if the user is currently authenticated.
   * @returns {boolean} True if authenticated.
   */
  public isAuthenticated(): boolean {
    return this.authState === 'authenticated';
  }

  /**
   * Subscribes a callback to authentication state changes.
   * @param {AuthStateCallback} callback - The function to call on state changes.
   * @returns {() => void} A function to unsubscribe.
   */
  public onAuthStateChanged(callback: AuthStateCallback): () => void {
    this.subscribers.add(callback);
    callback(this.authState, this.session); // Immediately notify
    return () => this.subscribers.delete(callback);
  }

  private async initializeSession(): Promise<void> {
    try {
      const user = await this.userManager.getUser();
      if (user && !user.expired) {
        this.onUserLoaded(user);
      } else {
        this.onUserUnloaded();
      }
    } catch (e) {
      console.error("Error initializing session:", e);
      this.onUserUnloaded();
    }
  }

  private _updateAuthState(newState: AuthState, user: UserSession | null): void {
    if (this.authState !== newState) {
      this.authState = newState;
      this.subscribers.forEach(callback => callback(this.authState, user));
    }
  }

  /**
   * Cleans up event listeners.
   */
  public destroy(): void {
    this.userManager.events.removeUserLoaded(this.onUserLoaded);
    this.userManager.events.removeUserUnloaded(this.onUserUnloaded);
    this.userManager.events.removeSilentRenewError(this.onSilentRenewError);
  }
}
