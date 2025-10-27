/**
 * @file This service handles user authentication via Google Sign-In and manages the Gemini API key.
 * @description It is responsible for initiating the client-side Google OAuth flow,
 * fetching user profile data directly from Google, and storing the session. It also provides
 * a client-side mechanism for storing a user-provided Gemini API key.
 * @see The architectural directive to simplify login to only use Google Sign-In.
 * @security Google Access Tokens are stored in session storage for the duration of the session.
 * The Gemini API key is stored in local storage for persistence, which is not secure for production
 * environments but fulfills the requirement for a user-configurable API key slot in the app.
 * @performance All external calls are wrapped with telemetry to monitor latency. The GSI client is initialized only once.
 */

import type { AppUser } from '../types.ts';
import { logError, logEvent, measurePerformance } from './telemetryService.ts';

declare global {
  // Provided by the Google GSI script loaded in index.html
  const google: any;
}

// The Google Client ID is a public identifier for our OAuth application.
const GOOGLE_CLIENT_ID = "555179712981-36hlicm802genhfo9iq1ufnp1n8cikt9.apps.googleusercontent.com";

// Scopes required by the application.
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

// Storage key for the Gemini API key
const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';

// In-memory reference to the Google Token Client from the GSI library.
let tokenClient: any;

// Callback to notify the application of user state changes.
let onUserChangedCallback: (user: AppUser | null) => void = () => {};

/**
 * Fetches the current user's profile from Google's userinfo endpoint.
 *
 * @param {string} accessToken The access token obtained from Google Sign-In.
 * @returns {Promise<AppUser>} The user's profile data transformed into the application's AppUser format.
 * @throws {Error} If fetching or parsing the profile fails.
 */
const getGoogleUserProfile = async (accessToken: string): Promise<AppUser> => {
    return measurePerformance('auth.getGoogleUserProfile', async () => {
        logEvent('auth_get_google_profile_started');
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logError(new Error('Failed to fetch Google user profile'), { status: response.status, body: errorBody });
            throw new Error(`Failed to fetch user profile from Google: ${response.statusText}`);
        }

        const profile = await response.json();
        
        const appUser: AppUser = {
            uid: profile.sub,
            displayName: profile.name,
            email: profile.email,
            photoURL: profile.picture,
            // Tier and roles are defaulted as they do not come from Google's basic profile
            tier: 'pro',
            roles: [],
        };
        
        logEvent('auth_get_google_profile_success', { userId: appUser.uid });
        return appUser;
    });
};


/**
 * Initializes the Google Authentication client.
 * This sets up the Google GSI library client and defines the callback for handling the token response.
 *
 * @param {(user: AppUser | null) => void} callback A function to be called when the user's authentication state changes.
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
                        sessionStorage.setItem('google_access_token', tokenResponse.access_token);
                        const appUser = await getGoogleUserProfile(tokenResponse.access_token);
                        onUserChangedCallback(appUser);
                        logEvent('auth_signin_success', { userId: appUser.uid });
                    } catch (error) {
                        logError(error as Error, { context: 'googleAuthCallback' });
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
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    logError(new Error(
      new Error("Attempted to sign in, but Google Token Client is not initialized.")
    ));
  }
}

/**
 * Signs the user out of the application.
 * This involves clearing the local session and revoking the Google token.
 * @returns {Promise<void>}
 */
export async function signOutUser(): Promise<void> {
    logEvent('auth_signout_triggered');
    const token = sessionStorage.getItem('google_access_token');
    
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('session_jwt'); // Clear old jwt if present
    
    if (token && google) {
        google.accounts.oauth2.revoke(token, () => {
            logEvent('auth_google_token_revoked');
        });
    }
    
    onUserChangedCallback(null);
    logEvent('auth_signout_complete');
}

/**
 * Saves the user-provided Gemini API key to local storage.
 * @param {string} apiKey The Gemini API key.
 * @security Storing API keys in local storage is not secure for production applications.
 * This is implemented as per user request for a simple, client-side API key slot.
 */
export function saveGeminiApiKey(apiKey: string): void {
    try {
        localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
        logEvent('gemini_api_key_saved');
    } catch (error) {
        logError(error as Error, { context: 'saveGeminiApiKey' });
        console.error("Failed to save Gemini API key to local storage:", error);
    }
}

/**
 * Retrieves the Gemini API key from local storage.
 * @returns {string | null} The stored Gemini API key, or null if not found.
 */
export function getGeminiApiKey(): string | null {
    try {
        return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    } catch (error) {
        logError(error as Error, { context: 'getGeminiApiKey' });
        console.error("Failed to retrieve Gemini API key from local storage:", error);
        return null;
    }
}