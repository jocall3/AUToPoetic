/**
 * @file This service is the primary client-side interface for managing user authentication and API keys.
 * It handles user authentication via Google Sign-In and manages a user-provided Gemini API key in local storage.
 * @module services/authService
 * @security This service stores the Gemini API key in plaintext in localStorage. This is a security risk and is implemented only to fulfill a specific directive. In a production environment, API keys should never be stored on the client. They should be managed by a secure backend service (like an AuthGateway or BFF) and accessed via short-lived session tokens, as per the architectural directives.
 */

import type { AppUser } from '../types';
import { logError, logEvent, measurePerformance } from './telemetryService';

declare global {
  const google: any;
}

// --- Configuration --- 
const GOOGLE_CLIENT_ID = "555179712981-36hlicm8e2genhfo9iq1ufnp1n8cikt9.apps.googleusercontent.com";
const GOOGLE_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
].join(' ');
const GEMINI_API_KEY_STORAGE_KEY = 'devcore_gemini_api_key';

// --- Module-level State --- 

let tokenClient: any;
let currentUser: AppUser | null = null;
let googleAccessToken: string | null = null;
const listeners: Set<(user: AppUser | null) => void> = new Set();

/**
 * Notifies all subscribed listeners of an authentication state change.
 * @param {AppUser | null} user The new user state.
 * @private
 */
function _notifyListeners(user: AppUser | null) {
    listeners.forEach(callback => {
        try {
            callback(user);
        } catch (error) {
            logError(error as Error, { context: 'authService._notifyListeners' });
        }
    });
}

/**
 * Fetches the user's Google profile information using an access token.
 * @param {string} accessToken The Google OAuth2 access token.
 * @returns {Promise<AppUser>} A promise that resolves with the application-specific user object.
 * @private
 */
async function _fetchGoogleUserProfile(accessToken: string): Promise<AppUser> {
    return measurePerformance('auth._fetchGoogleUserProfile', async () => {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch Google user profile.');
        }
        const profile = await response.json();
        return {
            uid: profile.sub,
            displayName: profile.name,
            email: profile.email,
            photoURL: profile.picture,
            tier: 'pro', // Default tier
        };
    });
}

/**
 * Initializes the Google Authentication client.
 * @param {(user: AppUser | null) => void} onStateChange A callback function to be called when the auth state changes.
 */
export function initAuth(onStateChange: (user: AppUser | null) => void) {
    onAuthStateChanged(onStateChange);
    logEvent('auth_google_client_init_started');
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPES,
            callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    try {
                        googleAccessToken = tokenResponse.access_token;
                        sessionStorage.setItem('google_access_token', googleAccessToken);
                        const appUser = await _fetchGoogleUserProfile(googleAccessToken);
                        currentUser = appUser;
                        logEvent('auth_signin_success', { userId: appUser.uid });
                        _notifyListeners(currentUser);
                    } catch (error) {
                        logError(error as Error, { context: 'googleAuthCallback' });
                        signOut();
                    }
                } else {
                    logError(new Error('Google sign-in failed: No access token in response.'), { tokenResponse });
                    _notifyListeners(null);
                }
            },
        });
        logEvent('auth_google_client_init_success');
    } catch (error) {
        logError(error as Error, { context: 'initTokenClient_failure' });
    }
}

/**
 * Triggers the Google Sign-In flow.
 */
export function signInWithGoogle() {
  if (tokenClient) {
    logEvent('auth_signin_triggered');
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    logError(new Error("Attempted to sign in, but Google Auth Client is not initialized."));
  }
}

/**
 * Signs the user out of the application.
 */
export function signOut() {
    logEvent('auth_signout_triggered');
    if (googleAccessToken) {
        google.accounts.oauth2.revoke(googleAccessToken, () => {});
    }
    sessionStorage.removeItem('google_access_token');
    currentUser = null;
    googleAccessToken = null;
    _notifyListeners(null);
    logEvent('auth_signout_complete');
}

/**
 * Subscribes to authentication state changes.
 * @param {(user: AppUser | null) => void} callback The function to call on state change.
 * @returns {() => void} An unsubscribe function.
 */
export function onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    listeners.add(callback);
    // Immediately invoke with current state
    callback(currentUser);
    return () => listeners.delete(callback);
}

/**
 * Retrieves the currently authenticated user.
 * @returns {AppUser | null} The current user object or null if not authenticated.
 */
export function getCurrentUser(): AppUser | null {
    return currentUser;
}

// --- Gemini API Key Management ---

/**
 * Saves the user-provided Gemini API key to local storage.
 * @param {string} apiKey The Gemini API key.
 * @security Storing API keys in localStorage is a significant security risk as it can be accessed via XSS attacks. This method should only be used in a secure, local development environment. For production, keys must be managed server-side.
 */
export function saveGeminiApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== 'string') {
        logError(new Error('Invalid API key provided.'), { context: 'saveGeminiApiKey' });
        return;
    }
    try {
        localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
        logEvent('gemini_api_key_saved');
    } catch (error) {
        logError(error as Error, { context: 'saveGeminiApiKey_localStorage' });
    }
}

/**
 * Retrieves the Gemini API key from local storage.
 * @returns {string | null} The stored Gemini API key, or null if not found.
 * @security See security warning for `saveGeminiApiKey`.
 */
export function getGeminiApiKey(): string | null {
    try {
        return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    } catch (error) {
        logError(error as Error, { context: 'getGeminiApiKey_localStorage' });
        return null;
    }
}

/**
 * Checks if a Gemini API key has been stored.
 * @returns {boolean} True if a key exists, false otherwise.
 */
export function hasGeminiApiKey(): boolean {
    return getGeminiApiKey() !== null;
}

/**
 * Clears the Gemini API key from local storage.
 */
export function clearGeminiApiKey(): void {
    try {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
        logEvent('gemini_api_key_cleared');
    } catch (error) {
        logError(error as Error, { context: 'clearGeminiApiKey_localStorage' });
    }
}
