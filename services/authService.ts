/**
 * @file This service is the primary client-side interface for the new zero-trust authentication system.
 * @module services/authService
 * @description This service acts as a singleton wrapper around the `@devcore/auth-client` library.
 * It is responsible for orchestrating the OIDC/OAuth2 authentication flow with the central `AuthGateway` microservice.
 * It replaces previous direct-to-provider authentication methods (like `googleAuthService`) and insecure
 * client-side secret management (`vaultService` for PATs).
 *
 * As per architectural directives, this service adheres to a zero-trust model:
 * - It does NOT handle or store any long-lived secrets (e.g., GitHub PATs, API keys).
 * - It initiates the OIDC Authorization Code Flow with PKCE, redirecting the user to the `AuthGateway`.
 * - It handles the callback from the `AuthGateway` to exchange an authorization code for a short-lived JWT.
 * - It manages the session JWT, providing it for authenticated requests to the Backend-for-Frontend (BFF).
 * - It handles session termination by clearing local tokens and redirecting to the `AuthGateway`'s logout endpoint.
 *
 * @see {AuthClient} from '@devcore/auth-client' for the core implementation.
 * @see The 'Implement a Zero-Trust Security Model' architectural directive.
 * @security This service manages the application's session JWT. The JWT is stored in memory and session storage
 *           for the duration of the browser session, which is more secure than local storage.
 * @performance The service is lightweight. Most operations involve redirects or single, secure API calls to the AuthGateway.
 */

import { AuthClient, AuthState, AuthStateCallback, UserSession } from '@devcore/auth-client';
import { logError, logEvent, measurePerformance } from './telemetryService';

/**
 * Configuration for the AuthClient.
 * In a real application, these values would be loaded from environment variables.
 * @private
 */
const authConfig = {
  authGatewayUrl: import.meta.env.VITE_AUTH_GATEWAY_URL || 'http://localhost:3001',
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || 'devcore-client',
  redirectUri: `${window.location.origin}/auth/callback`,
  postLogoutRedirectUri: `${window.location.origin}/`,
  scope: 'openid profile email offline_access',
};

/**
 * The singleton instance of the AuthClient.
 * This instance is exported and used throughout the application to manage authentication.
 * @constant
 */
export const authService = new AuthClient(authConfig);

/**
 * A wrapper function to initiate the login process.
 * This function redirects the user to the AuthGateway's login page.
 * @returns {Promise<void>}
 * @example
 * import { signIn } from '@/services/authService';
 * <button onClick={signIn}>Sign In</button>
 */
export const signIn = (): Promise<void> => {
  logEvent('auth_signin_triggered');
  return measurePerformance('auth.signIn', () => authService.login());
};

/**
 * A wrapper function to handle the redirect from the AuthGateway after login.
 * This should be called on the application's callback page (e.g., `/auth/callback`).
 * @returns {Promise<UserSession>} A promise that resolves with the user's session information.
 * @throws {Error} If the callback handling fails (e.g., invalid state, code exchange error).
 */
export const handleAuthCallback = (): Promise<UserSession> => {
  logEvent('auth_callback_handling_started');
  return measurePerformance('auth.handleAuthCallback', async () => {
    try {
      const session = await authService.handleLoginCallback();
      logEvent('auth_callback_handling_success', { userId: session.sub });
      return session;
    } catch (error) {
      logError(error as Error, { context: 'handleAuthCallback' });
      // Re-throw the error to be handled by the calling component (e.g., to show an error UI)
      throw error;
    }
  });
};

/**
 * A wrapper function to initiate the logout process.
 * This will clear the local session and redirect the user to the AuthGateway's logout endpoint.
 * @returns {Promise<void>}
 */
export const signOut = (): Promise<void> => {
  logEvent('auth_signout_triggered');
  return measurePerformance('auth.signOut', () => authService.logout());
};

/**
 * Subscribes to authentication state changes.
 * @param {AuthStateCallback} callback The function to call when the auth state changes.
 * @returns {() => void} A function to unsubscribe the listener.
 * @example
 * useEffect(() => {
 *   const unsubscribe = onAuthStateChanged(state => {
 *     console.log('New auth state:', state);
 *   });
 *   return unsubscribe;
 * }, []);
 */
export const onAuthStateChanged = (callback: AuthStateCallback): (() => void) => {
  return authService.onAuthStateChanged(callback);
};

/**
 * Retrieves the currently authenticated user's session information from the decoded JWT.
 * @returns {UserSession | null} The decoded user session object, or null if not authenticated.
 */
export const getCurrentUser = (): UserSession | null => {
  return authService.getSession();
};

/**
 * Checks if the user is currently authenticated with a valid, non-expired session.
 * @returns {boolean} `true` if authenticated, `false` otherwise.
 */
export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};

/**
 * Retrieves the current session JWT for making authenticated API calls to the BFF.
 * @returns {Promise<string | null>} The JWT string, or null if the user is not authenticated or the token is expired.
 */
export const getJwt = (): Promise<string | null> => {
  return authService.getJwt();
};
