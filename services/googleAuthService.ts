/**
 * @file This service handles user authentication via Google Sign-In.
 * As per the new architecture, it's responsible for initiating the client-side
 * Google OAuth flow and then exchanging the obtained Google token for a
 * short-lived session JWT from our backend AuthGateway. This JWT is then
 * used for all subsequent authenticated requests to the BFF.
 * @see AuthGateway microservice for server-side OIDC and session management.
 * @security This service now acts as a bridge to the backend authentication system,
 * ensuring that long-lived Google tokens are not stored or used directly by the client for API calls.
 * The client only holds the application-specific session JWT.
 * @performance All external calls are wrapped with telemetry to monitor latency. The GSI client is initialized only once.
 */

import type { AppUser } from '../types.ts';
import { logError, logEvent, measurePerformance } from './telemetryService.ts';

// These would be loaded from a configuration service or environment variables in a real app.
const AUTH_GATEWAY_URL = 'https://auth.jester.dev'; // Fictional URL for the new AuthGateway microservice
const BFF_URL = 'https://bff.jester.dev/graphql'; // Fictional URL for the BFF's GraphQL endpoint

declare global {
  // Provided by the Google GSI script loaded in index.html
  const google: any;
}

// The Google Client ID is a public identifier for our OAuth application.
const GOOGLE_CLIENT_ID = "555179712981-36hlicm802genhfo9iq1ufnp1n8cikt9.apps.googleusercontent.com";

// Scopes required by the application. The AuthGateway will use these when interacting with Google.
// The client requests them here to get the necessary consent from the user.
const GOOGLE_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.install',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/iam.test',
    'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
    'https://www.googleapis.com/auth/gmail.addons.current.message.action',
    'https://www.googleapis.com/auth/gmail.send'
].join(' ');

// In-memory reference to the Google Token Client from the GSI library.
let tokenClient: any;

// Callback to notify the application of user state changes.
let onUserChangedCallback: (user: AppUser | null) => void = () => {};

/**
 * Exchanges a Google OAuth access token for a session JWT from our backend AuthGateway.
 *
 * @param {string} googleAccessToken The access token obtained from Google Sign-In.
 * @returns {Promise<string>} A promise that resolves with the application-specific session JWT.
 * @throws {Error} If the token exchange fails.
 * @security This is a critical step in the zero-trust architecture. The client gets rid
 * of the Google token and uses the session JWT from this point forward.
 */
const exchangeGoogleTokenForSessionJwt = async (googleAccessToken: string): Promise<string> => {
    return measurePerformance('auth.exchangeGoogleToken', async () => {
        logEvent('auth_token_exchange_started');
        const response = await fetch(`${AUTH_GATEWAY_URL}/auth/google/exchange`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: googleAccessToken }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logError(new Error('Failed to exchange Google token for session JWT'), { status: response.status, body: errorBody });
            throw new Error(`Authentication with backend failed: ${response.statusText}`);
        }

        const { sessionJwt } = await response.json();
        logEvent('auth_token_exchange_success');
        return sessionJwt;
    });
};

/**
 * Fetches the current user's profile from our BFF using the session JWT.
 *
 * @param {string} sessionJwt The application-specific session JWT.
 * @returns {Promise<AppUser>} The user's profile data as defined by our application.
 * @throws {Error} If fetching the profile fails.
 */
const getAppUserProfile = async (sessionJwt: string): Promise<AppUser> => {
     return measurePerformance('auth.getAppUserProfile', async () => {
        logEvent('auth_get_profile_started');
        const response = await fetch(BFF_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionJwt}`,
            },
            body: JSON.stringify({ query: '{ me { uid displayName email photoURL tier } }' })
        });
        
        if (!response.ok) {
            logError(new Error('Failed to fetch app user profile'), { status: response.status });
            throw new Error('Failed to fetch user profile from application backend.');
        }

        const { data, errors } = await response.json();
        if (errors) {
            logError(new Error('GraphQL error fetching user profile'), { errors });
            throw new Error(`Error fetching user profile: ${errors[0].message}`);
        }
        
        logEvent('auth_get_profile_success', { userId: data.me.uid });
        return data.me;
    });
};

/**
 * Initializes the Google Authentication client.
 * This sets up the Google GSI library client and defines the callback for handling the token response.
 *
 * @param {(user: AppUser | null) => void} callback A function to be called when the user's authentication state changes.
 * @example
 * // In App.tsx
 * useEffect(() => {
 *   initGoogleAuth((user) => dispatch({ type: 'SET_APP_USER', payload: user }));
 * }, [dispatch]);
 */
export function initGoogleAuth(callback: (user: AppUser | null) => void) {
    if (!GOOGLE_CLIENT_ID) {
        const error = new Error('Google Client ID not configured.');
        logError(error, { context: 'initGoogleAuth' });
        console.error(error.message);
        return;
    }
    
    logEvent('auth_google_client_init_started');
    onUserChangedCallback = callback;
  
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPES,
            callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    try {
                        // Exchange Google token for our session JWT
                        const sessionJwt = await exchangeGoogleTokenForSessionJwt(tokenResponse.access_token);
                        sessionStorage.setItem('session_jwt', sessionJwt);

                        // Fetch our app's user profile using our JWT
                        const appUser = await getAppUserProfile(sessionJwt);

                        // DEPRECATED: Storing Google access token is against the new architecture.
                        sessionStorage.removeItem('google_access_token');

                        onUserChangedCallback(appUser);
                        logEvent('auth_signin_success', { userId: appUser.uid });
                    } catch (error) {
                        logError(error as Error, { context: 'googleAuthCallback' });
                        // If any step fails, ensure we are in a signed-out state.
                        await signOutUser(); 
                    }
                } else {
                    logError(new Error('Google sign-in failed: No access token in response.'), { tokenResponse });
                    onUserChangedCallback(null);
                }
            },
        });
        logEvent('auth_google_client_init_success');
    } catch (error) {
        logError(error as Error, { context: 'initTokenClient_failure' });
        console.error("Failed to initialize Google Token Client:", error);
    }
}

/**
 * Triggers the Google Sign-In popup or redirect flow.
 */
export function signInWithGoogle() {
  if (tokenClient) {
    logEvent('auth_signin_triggered');
    // 'prompt: consent' ensures the user is asked for permission, which is good practice for explicit sign-in actions.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    logError(new Error("Attempted to sign in, but Google Token Client is not initialized."));
  }
}

/**
 * Signs the user out of the application.
 * This involves clearing the local session JWT and notifying the backend to invalidate the session.
 * @returns {Promise<void>}
 */
export async function signOutUser(): Promise<void> {
    logEvent('auth_signout_triggered');
    const token = sessionStorage.getItem('session_jwt');
    
    // Clear local session artifacts
    sessionStorage.removeItem('session_jwt');
    sessionStorage.removeItem('google_access_token'); // Also clear the old one if it exists

    if (token) {
        try {
            // Notify the backend to invalidate the session. This is a "fire and forget" call.
            await fetch(`${AUTH_GATEWAY_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            logEvent('auth_signout_server_notified');
        } catch (error) {
            logError(error as Error, { context: 'signOut_notification_failed' });
        }
    }

    // The GSI library does not provide a simple programmatic sign-out from the Google account itself,
    // which is the desired behavior. We only terminate our application's session.
    // The old method of revoking the token is no longer feasible as we don't store the Google token.
    
    // Update the application state to reflect the user is signed out.
    onUserChangedCallback(null);
    logEvent('auth_signout_complete');
}
