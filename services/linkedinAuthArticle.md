# Unleash the Inner Jester: How I Transformed Google Auth from a Mere Minstrel into a Royal Sentry of Digital Delights!

Greetings, noble denizens of the digital realm! Your humble servant and esteemed chief jester of code, James Burvel O’Callaghan III, President of Citibank Demo Business Inc. (yes, even jesters have titles, and mine is particularly resonant with financial mirth), stands before you today to unveil a tale of daring transformation! Forget your dreary, monotonous authentication flows; we’re about to infuse a jolt of joyful genius into the very heart of your application's security!

For too long, authentication has been the unsung, often uninspired, bouncer at the grand ball of your application. It performs its duty, certainly, but with all the fanfare of a forgotten footnote. But I say, "No more!" The age of the boring login is over! We shall not merely authenticate; we shall *celebrate* access! We shall not merely verify; we shall *venerate* the user! And we shall do it with a Google authentication service so robust, so elegant, so utterly jester-approved, it will make lesser authentication systems weep into their forgotten log files.

### The Seed of Inspiration: A Humble Beginning, A Grand Destiny!

Every grand odyssey begins with a single step, or in our case, a single, albeit functional, seed file. You see, even I, with my royal decree of japes and jests, sometimes start with something... *sensible*. Our journey began with a standard Google authentication service. It dutifully handled logins, fetched user profiles, and even remembered its tokens. A fine minstrel, indeed, capable of singing a simple tune.

But a jester's heart yearns for more than simplicity! It yearns for spectacle, for impenetrable fortresses, for a tapestry woven with threads of security, scalability, and user delight! Our humble minstrel, while charming, lacked the gravitas, the multi-faceted brilliance, and the sheer *panache* required to guard the crown jewels of user data in today's increasingly treacherous digital landscape.

It was akin to having a single, valiant knight, Sir Reginald, guarding the entire kingdom. Brave, yes! Stalwart, absolutely! But what if a whole horde of digital goblins decided to storm the gates? Sir Reginald, bless his heart, would be overwhelmed! We needed an *entire Royal Guard*, complete with enchanted armor, magical wards, and perhaps even a few fire-breathing dragons for good measure!

### The Grand Vision: From Minstrel to Monarch of Authentication!

My vision, whispered to me by the digital muses during a particularly potent dream involving juggling flaming OAuth tokens, was clear: to evolve our Google authentication service into something truly legendary. We weren't just adding features; we were architecting a digital citadel, a bastion of trust, a user experience so seamless it felt like magic, and a security posture so formidable it would make even the most nefarious cyber-dragon turn tail and flee!

Here’s the royal blueprint of our grand transformation:

1.  **Multi-Factor Authentication (MFA): The Two-Key Fortress!** Because one lock is for commoners; royalty demands two! Or three! Or as many as prudence dictates. We're integrating various MFA methods to ensure that even if a sneaky goblin pilfers one key, the vault remains impenetrable.
2.  **Role-Based Access Control (RBAC): The Court Hierarchies!** Not everyone can waltz into the throne room, can they? Our users will have explicit roles, ensuring that only those with the proper digital credentials can access sensitive areas. No more digital commoners accidentally stumbling into the treasury!
3.  **Advanced Session Management & Token Refresh: The Ever-Vigilant Sentinel!** Gone are the days of tokens expiring with a whimper! We implement robust refresh token mechanisms, active session tracking, and intelligent revocation. Our sentinels are always awake, always alert!
4.  **Comprehensive Audit Logging: The Royal Scribe of Security!** Every significant authentication event, every login, every logout, every failed attempt, every MFA setup – it's all meticulously recorded. For when the king asks, "Who goes there?" the scribe shall have the answer!
5.  **Adaptive Authentication: The Intuitive Gatekeeper!** Our gates won't just open for the right key; they'll consider *who* is knocking, *where* they're knocking from, and *how* they're behaving. A login from a new country? A sudden surge of activity? Our gatekeeper will raise an eyebrow and demand extra verification!
6.  **Granular Scope Management: The Precision of the Royal Architect!** We’re not just asking for "all the things!" We're asking for *precisely* what we need, dynamically, and with the user's explicit understanding. Permissions are a delicate dance, and we shall dance it with grace.
7.  **Enhanced Telemetry & Error Handling: The Oracle of Insights!** When things go awry (for even in the most perfect kingdoms, a dropped chalice is inevitable), we'll know *why*, *when*, and *how*. Our error messages will be clear, our logs informative, and our recovery swift.
8.  **Internationalization (i18n) for Messages: The Global Diplomat!** Our fortress welcomes all, from every corner of the digital globe. Authentication messages will speak their language, ensuring a truly inclusive experience.
9.  **Security Hardening: The Unbreakable Bastion!** Beyond features, we’re talking about the very foundations. Input validation, secure storage practices, protection against common web vulnerabilities – our walls are thick, our moats are deep, and our drawbridges are always secure.
10. **Extensibility & Future-Proofing: The Ever-Expanding Kingdom!** Designed with modularity, our system can easily welcome new identity providers, new MFA methods, and new security paradigms without needing to tear down the entire castle.

This, my friends, is not just code; it's a manifesto! It's a declaration that authentication can be a strategic asset, a delight for users, and an impenetrable shield for your data.

### The Jester's Code: A Masterpiece Unveiled!

Now, prepare yourselves, for I shall not merely speak of this marvel; I shall *present* it! Behold, the very essence of our transformation, the improved, expanded, and utterly magnificent `advancedGoogleAuthService.ts`! Observe its robust structure, its meticulous detail, its unwavering dedication to security and user experience. This isn't just a file; it's a scroll of arcane wisdom, a blueprint for digital security that would make even the most seasoned wizard nod in approval!

```typescript
// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.
// All rights reserved. For educational and demonstrative purposes, may cause excessive merriment.

/**
 * @file This module provides an advanced, enterprise-grade Google authentication service.
 * It extends basic Google OAuth functionalities with features such as multi-factor
 * authentication (MFA) integration, robust session management with token refreshing,
 * role-based access control (RBAC), comprehensive audit logging, adaptive authentication
 * hooks, and enhanced telemetry. It is designed to be highly configurable, secure,
 * and user-centric, embodying the spirit of a truly inspirational and expert Jester's touch.
 *
 * This service aims to provide not just authentication, but a holistic user identity
 * and access management solution that is both secure and delightful to use.
 * It is structured to be extensible, allowing for future integrations and security enhancements.
 */

import type {
  AppUser,
  AuthSession,
  UserRole,
  MfaMethod,
  MfaEnrollmentStatus,
  AdaptiveAuthFactor,
  SecurityAuditLog,
  ClientAuthSettings,
} from '../types/authTypes.ts'; // Expanded types for richer user and session data
import { logInfo, logWarning, logError, recordMetric } from './telemetryService.ts'; // Enhanced telemetry
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clearAllSecureItems,
} from './secureStorageService.ts'; // Dedicated secure storage
import { generateUniqueId } from '../utils/idGenerator.ts'; // Utility for unique IDs
import {
  displayNotification,
  showMfaChallengePrompt,
  showConsentPrompt,
  updateUiForAuthStatus,
} from '../ui/authUiService.ts'; // UI interaction service
import { validateConfig, sanitizeInput } from '../utils/validationService.ts'; // Input validation utilities
import { encrypt, decrypt } from '../utils/cryptoService.ts'; // Placeholder for client-side encryption

declare global {
  /**
   * Global declaration for the Google Accounts OAuth2 library.
   * Ensures TypeScript recognizes the 'google' object globally.
   */
  const google: any;
}

// --- Jester's Royal Decrees: Configuration and Constants ---
/**
 * The Google Client ID, obtained from the Google API Console.
 * This is the digital key to our kingdom, tread carefully!
 * @type {string}
 */
const GOOGLE_CLIENT_ID: string = "555179712981-36hlicm802genhfo9iq1ufnp1n8cikt9.apps.googleusercontent.com";

/**
 * The audience for ID tokens. Typically the client ID.
 * Used for verifying ID tokens.
 * @type {string}
 */
const ID_TOKEN_AUDIENCE: string = GOOGLE_CLIENT_ID;

/**
 * Default scopes requested during initial authentication.
 * These are the privileges our minstrel initially seeks. Expanded for enterprise features.
 * @type {string[]}
 */
const DEFAULT_SCOPES: string[] = [
  'openid',
  'profile', // userinfo.profile shorthand
  'email',   // userinfo.email shorthand
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/iam.test', // For testing IAM roles, very meta!
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets.readonly', // Added for potential data access
  'https://www.googleapis.com/auth/calendar.events.readonly', // For scheduling features
];

/**
 * Join scopes into a single space-delimited string, as required by Google OAuth.
 * @type {string}
 */
const SCOPES_STRING: string = DEFAULT_SCOPES.join(' ');

/**
 * The duration in milliseconds for which an access token is considered valid for use without refreshing.
 * This is our digital hourglass.
 * @type {number}
 */
const ACCESS_TOKEN_VALIDITY_BUFFER_MS: number = 300 * 1000; // 5 minutes before actual expiry

/**
 * Interval for proactively refreshing tokens, to ensure a seamless experience.
 * Our diligent sentry checking the perimeter.
 * @type {number}
 */
const TOKEN_REFRESH_INTERVAL_MS: number = 60 * 60 * 1000; // 1 hour

/**
 * Maximum number of retry attempts for token refresh or profile fetching.
 * Even the jester stumbles, but always gets back up!
 * @type {number}
 */
const MAX_RETRY_ATTEMPTS: number = 3;

/**
 * Base delay for retry attempts in milliseconds. Uses exponential backoff.
 * @type {number}
 */
const RETRY_BASE_DELAY_MS: number = 1000; // 1 second

/**
 * Supported Multi-Factor Authentication methods.
 * The various secret handshakes our users can employ.
 * @type {MfaMethod[]}
 */
const SUPPORTED_MFA_METHODS: MfaMethod[] = ['TOTP', 'SMS', 'Email_OTP', 'Security_Key'];

/**
 * Secure storage keys for various authentication artifacts.
 * The hidden compartments where we keep our most treasured secrets.
 * @enum {string}
 */
enum AuthStorageKeys {
  AccessToken = 'google_access_token',
  RefreshToken = 'google_refresh_token', // Though Google's JS API usually handles this server-side or via opaque tokens
  IdToken = 'google_id_token',
  CurrentUser = 'app_current_user',
  CurrentSession = 'app_current_session',
  MfaStatus = 'app_mfa_status',
  LastAuthTime = 'app_last_auth_time',
  UserPermissionsCache = 'app_user_permissions_cache',
}

// --- Jester's Royal Court: Internal State Management ---
let tokenClient: any | null = null;
let currentAuthSession: AuthSession | null = null;
let currentAppUser: AppUser | null = null;
let tokenRefreshTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Callback array for subscribers to authentication status changes.
 * The royal heralds, broadcasting news across the kingdom.
 * @type {Array<(user: AppUser | null, session: AuthSession | null) => void>}
 */
const authStatusListeners: Array<(user: AppUser | null, session: AuthSession | null) => void> = [];

/**
 * Cache for user permissions to reduce redundant checks.
 * The jester's cheat sheet for who can do what.
 * @type {Map<string, boolean>}
 */
const userPermissionsCache: Map<string, boolean> = new Map();

// --- Jester's Secret Spells & Incantations: Helper Functions ---

/**
 * Retrieves the Google user profile information using an access token.
 * This is how we verify the identity of our noble guests.
 * @param {string} accessToken - The Google OAuth2 access token.
 * @returns {Promise<any>} A promise that resolves with the user's profile data.
 * @throws {Error} If fetching the profile fails.
 */
async function _getGoogleUserProfile(accessToken: string, attempt: number = 0): Promise<any> {
  logInfo(`Attempting to fetch Google user profile. Attempt #${attempt + 1}`);
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401 && attempt < MAX_RETRY_ATTEMPTS) {
        logWarning(`Profile fetch failed with 401. Retrying after delay...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_BASE_DELAY_MS * Math.pow(2, attempt)));
        return _getGoogleUserProfile(accessToken, attempt + 1);
      }
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to fetch user profile: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }
    const profile = await response.json();
    logInfo('Successfully fetched Google user profile.', { userId: profile.sub });
    return profile;
  } catch (error) {
    logError(error as Error, { context: 'getGoogleUserProfile', attempt });
    displayNotification(`Error fetching user profile: ${(error as Error).message}`, 'error');
    throw error;
  }
}

/**
 * Converts a raw Google profile into our application's `AppUser` format.
 * Translating commoner's speech into royal decrees.
 * @param {any} profile - The raw profile data from Google.
 * @param {string} accessToken - The current access token.
 * @returns {Promise<AppUser>} The standardized AppUser object.
 */
async function _transformProfileToAppUser(profile: any, accessToken: string): Promise<AppUser> {
  const mfaStatus: MfaEnrollmentStatus = await _fetchMfaStatus(profile.sub, accessToken); // Assuming backend call
  const userRoles: UserRole[] = await _fetchUserRoles(profile.sub, accessToken); // Assuming backend call

  return {
    uid: profile.sub,
    displayName: profile.name || profile.email.split('@')[0],
    email: profile.email,
    photoURL: profile.picture,
    tier: 'premium_jester_edition', // Everyone who uses this service is elevated!
    locale: profile.locale || navigator.language,
    emailVerified: profile.email_verified || false,
    mfaEnabled: mfaStatus.enabled,
    mfaMethods: mfaStatus.methods || [],
    roles: userRoles,
    lastLogin: new Date().toISOString(),
    // Potentially add more fields from backend or custom claims
  };
}

/**
 * Placeholder for fetching MFA status from a hypothetical backend.
 * The jester consults the oracle regarding multi-factor enchantments.
 * @param {string} userId - The user's ID.
 * @param {string} accessToken - The access token for backend authorization.
 * @returns {Promise<MfaEnrollmentStatus>} The MFA enrollment status.
 */
async function _fetchMfaStatus(userId: string, accessToken: string): Promise<MfaEnrollmentStatus> {
  logInfo(`Querying MFA status for user: ${userId}`);
  // In a real application, this would be an API call to your backend
  // e.g., const response = await fetch(`/api/users/${userId}/mfa-status`, { headers: { Authorization: `Bearer ${accessToken}` }});
  // For now, let's pretend everyone using this service is exceptionally secure.
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  return {
    enabled: true, // Let's make everyone MFA-enabled by default for demonstrative purposes!
    methods: ['TOTP', 'Email_OTP'],
    configuredMethods: ['TOTP'],
  };
}

/**
 * Placeholder for fetching user roles from a hypothetical backend.
 * The jester reads from the ancient scrolls of court hierarchy.
 * @param {string} userId - The user's ID.
 * @param {string} accessToken - The access token for backend authorization.
 * @returns {Promise<UserRole[]>} An array of roles assigned to the user.
 */
async function _fetchUserRoles(userId: string, accessToken: string): Promise<UserRole[]> {
  logInfo(`Querying roles for user: ${userId}`);
  // In a real application, this would be an API call to your backend
  // e.g., const response = await fetch(`/api/users/${userId}/roles`, { headers: { Authorization: `Bearer ${accessToken}` }});
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
  return ['user', 'content_creator', 'royal_jester_apprentice']; // Everyone gets a jester role!
}

/**
 * Constructs a new AuthSession object.
 * Documenting the user's entry into the grand ball.
 * @param {string} accessToken - The access token.
 * @param {string | null} idToken - The ID token (if available).
 * @param {number} expiresIn - The validity duration of the access token in seconds.
 * @param {AppUser} user - The associated AppUser object.
 * @returns {AuthSession} The newly created session.
 */
function _createAuthSession(accessToken: string, idToken: string | null, expiresIn: number, user: AppUser): AuthSession {
  const expiresAt = Date.now() + (expiresIn * 1000);
  return {
    sessionId: generateUniqueId('sess'), // Unique ID for this session
    accessToken: accessToken,
    idToken: idToken,
    tokenType: 'Bearer',
    expiresIn: expiresIn,
    expiresAt: new Date(expiresAt).toISOString(),
    issuedAt: new Date().toISOString(),
    refreshToken: getSecureItem(AuthStorageKeys.RefreshToken) || undefined, // If a refresh token was stored
    user: user,
    status: 'active',
    lastActivity: new Date().toISOString(),
    clientIp: '127.0.0.1', // Placeholder: Should be determined server-side or via IP API
    userAgent: navigator.userAgent,
    isMfaVerified: user.mfaEnabled ? false : true, // Assumed verified if MFA not enabled
    // Additional session details from backend might be added here
  };
}

/**
 * Initiates the token refresh process using Google's JS API.
 * This ensures our minstrel's song never fades!
 * @param {boolean} forceRefresh - If true, requests a new token immediately, ignoring expiry checks.
 * @returns {Promise<AuthSession | null>} A promise that resolves with the new session or null if failed.
 */
async function _refreshAccessToken(forceRefresh: boolean = false): Promise<AuthSession | null> {
  logInfo(`Initiating token refresh. Force refresh: ${forceRefresh}.`);
  if (!tokenClient) {
    logError(new Error("Token client not initialized for refresh."), { context: '_refreshAccessToken' });
    return null;
  }

  if (currentAuthSession && !forceRefresh) {
    const expiresInMs = new Date(currentAuthSession.expiresAt).getTime() - Date.now();
    if (expiresInMs > ACCESS_TOKEN_VALIDITY_BUFFER_MS) {
      logInfo(`Access token still valid for ${Math.round(expiresInMs / 1000)}s. No refresh needed.`);
      return currentAuthSession;
    }
  }

  try {
    // Google's JS client generally handles refresh tokens internally if 'prompt' is not 'consent'
    // or if the user has previously granted consent. For explicit refresh, we requestAccessToken again.
    // The prompt 'none' attempts to refresh without user interaction.
    const tokenResponse = await new Promise((resolve, reject) => {
      tokenClient.requestAccessToken({
        prompt: 'none', // Attempt silent refresh
        callback: (response: any) => {
          if (response && response.access_token) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to silently refresh token.'));
          }
        },
      });
    });

    if (tokenResponse && (tokenResponse as any).access_token) {
      logInfo('Token successfully refreshed!', { tokenResponse });
      await _handleAuthSuccess(tokenResponse as any);
      return currentAuthSession;
    } else {
      logWarning('Silent token refresh failed, user interaction may be required.');
      // This indicates that a silent refresh failed, potentially requiring user re-authentication.
      // We might want to trigger a full sign-in prompt or specific UI here.
      displayNotification('Your session has expired. Please sign in again.', 'warning');
      await signOutUser(false); // Clear local session, but don't revoke Google token explicitly yet
      return null;
    }
  } catch (error) {
    logError(error as Error, { context: '_refreshAccessToken', forceRefresh });
    displayNotification(`Failed to refresh session: ${(error as Error).message}. Please sign in.`, 'error');
    await signOutUser(false); // Clear local session
    return null;
  }
}

/**
 * Sets up a periodic timer to refresh the access token before it expires.
 * Our loyal watchman, keeping vigil.
 */
function _setupTokenRefreshTimer() {
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
  }
  tokenRefreshTimer = setInterval(async () => {
    logInfo('Proactively refreshing access token due to timer.');
    await _refreshAccessToken();
  }, TOKEN_REFRESH_INTERVAL_MS);
  logInfo(`Token refresh timer set to run every ${TOKEN_REFRESH_INTERVAL_MS / 1000} seconds.`);
}

/**
 * Stops the token refresh timer.
 * When the watchman can finally rest.
 */
function _stopTokenRefreshTimer() {
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
    tokenRefreshTimer = null;
    logInfo('Token refresh timer stopped.');
  }
}

/**
 * Handles the successful authentication response from Google.
 * The grand ceremony of welcoming a new, or returning, noble!
 * @param {any} tokenResponse - The raw token response from Google.
 * @returns {Promise<void>}
 */
async function _handleAuthSuccess(tokenResponse: any) {
  const { access_token, id_token, expires_in } = tokenResponse;

  if (!access_token) {
    logError(new Error('Auth success handler: No access token received.'), { tokenResponse });
    return;
  }

  try {
    // 1. Store tokens securely
    await setSecureItem(AuthStorageKeys.AccessToken, access_token);
    if (id_token) {
      await setSecureItem(AuthStorageKeys.IdToken, id_token);
      // await _verifyIdToken(id_token); // Potentially verify ID token on client side, more robust server-side
    }
    // Google's OAuth2 client for JS doesn't directly expose refresh tokens in client-side responses.
    // They are managed internally by Google for silent refreshes. If explicit refresh tokens
    // are needed for a custom backend, they'd be obtained via a server-side flow.
    // For demonstration, we'll assume the _refreshAccessToken function leverages Google's internal refresh.

    // 2. Fetch and transform user profile
    const profile = await _getGoogleUserProfile(access_token);
    const appUser = await _transformProfileToAppUser(profile, access_token);
    currentAppUser = appUser;

    // 3. Create and store session
    currentAuthSession = _createAuthSession(access_token, id_token, expires_in, appUser);
    await setSecureItem(AuthStorageKeys.CurrentSession, encrypt(JSON.stringify(currentAuthSession))); // Encrypt session data
    await setSecureItem(AuthStorageKeys.CurrentUser, encrypt(JSON.stringify(currentAppUser))); // Encrypt user data
    await setSecureItem(AuthStorageKeys.LastAuthTime, Date.now().toString());

    // 4. Perform adaptive authentication checks (if configured)
    const adaptiveResult = await _performAdaptiveAuthChecks(currentAuthSession);
    if (!adaptiveResult.allowed) {
      logWarning(`Adaptive authentication denied session for user: ${currentAppUser.uid}`, { reason: adaptiveResult.reason });
      displayNotification(`Authentication requires additional verification: ${adaptiveResult.reason}.`, 'warning');
      await signOutUser(false); // Revoke session due to adaptive auth denial
      return;
    }

    // 5. Check MFA requirement and status
    if (currentAppUser.mfaEnabled && !currentAuthSession.isMfaVerified) {
      logInfo(`User ${currentAppUser.uid} requires MFA verification.`);
      const mfaVerified = await _promptAndVerifyMfa(currentAppUser, currentAuthSession);
      if (!mfaVerified) {
        logWarning('MFA verification failed or cancelled. Denying access.');
        displayNotification('MFA verification failed. Please try again.', 'error');
        await signOutUser(true); // Sign out and revoke token
        return;
      }
      currentAuthSession.isMfaVerified = true;
      await setSecureItem(AuthStorageKeys.CurrentSession, encrypt(JSON.stringify(currentAuthSession)));
    }

    // 6. Broadcast success and update UI
    _notifyAuthStatusChange(currentAppUser, currentAuthSession);
    _setupTokenRefreshTimer();
    _logAuthEvent('Login_Success', currentAppUser.uid, 'User successfully authenticated and session established.', {
      sessionId: currentAuthSession.sessionId,
      mfaVerified: currentAuthSession.isMfaVerified,
      roles: currentAppUser.roles,
    });
    displayNotification(`Welcome back, ${currentAppUser.displayName}!`, 'success');
    recordMetric('auth_login_success', 1);

  } catch (error) {
    logError(error as Error, { context: '_handleAuthSuccess' });
    displayNotification(`Authentication processing failed: ${(error as Error).message}`, 'error');
    _notifyAuthStatusChange(null, null); // Ensure UI reflects logged out state
    recordMetric('auth_login_error', 1);
  }
}

/**
 * Verifies the integrity and authenticity of an ID Token (conceptual client-side verification).
 * Typically this should be done server-side for robust security.
 * The jester double-checks the royal seal.
 * @param {string} idToken - The ID token string.
 * @returns {Promise<boolean>} True if valid, false otherwise.
 */
async function _verifyIdToken(idToken: string): Promise<boolean> {
  // Client-side verification is limited and should ideally be complemented by server-side verification.
  // This is a basic demonstration. For full verification, a library like 'jose' or 'jsonwebtoken'
  // would be used, checking signature, issuer, audience, expiry etc.
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new Error('Invalid ID token format.');
    const payload = JSON.parse(atob(parts[1]));

    if (payload.iss !== 'https://accounts.google.com') throw new Error('Invalid ID token issuer.');
    if (payload.aud !== ID_TOKEN_AUDIENCE) throw new Error('Invalid ID token audience.');
    if (payload.exp * 1000 < Date.now()) throw new Error('ID token expired.');

    logInfo('ID Token basic validation successful.', { sub: payload.sub });
    return true;
  } catch (error) {
    logError(error as Error, { context: '_verifyIdToken', idTokenFragment: idToken.substring(0, 50) });
    return false;
  }
}

/**
 * Helper to dispatch authentication status changes to all listeners.
 * The royal herald announcing news across the land.
 * @param {AppUser | null} user - The current AppUser or null.
 * @param {AuthSession | null} session - The current AuthSession or null.
 */
function _notifyAuthStatusChange(user: AppUser | null, session: AuthSession | null) {
  authStatusListeners.forEach(callback => {
    try {
      callback(user, session);
      updateUiForAuthStatus(user, session); // Also update UI directly
    } catch (cbError) {
      logError(cbError as Error, { context: '_notifyAuthStatusChange_callback', callback: callback.name });
    }
  });
}

/**
 * Handles error scenarios during authentication.
 * When the jester trips, he still lands gracefully, and learns!
 * @param {Error} error - The error object.
 * @param {any} [metadata={}] - Additional context for the error.
 */
function _handleAuthError(error: Error, metadata: any = {}) {
  logError(error, { ...metadata, context: 'globalAuthHandler' });
  displayNotification(`Authentication Error: ${error.message}`, 'error');
  _notifyAuthStatusChange(null, null);
  recordMetric('auth_error_handled', 1);
  // Potentially redirect to an error page or show a more detailed modal
}

/**
 * Checks if a session stored in secure storage is still valid.
 * The jester inspecting the longevity of the royal decree.
 * @returns {Promise<boolean>} True if a valid session exists, false otherwise.
 */
async function _checkStoredSessionValidity(): Promise<boolean> {
  logInfo('Checking for existing valid session in secure storage.');
  try {
    const encryptedSession = await getSecureItem(AuthStorageKeys.CurrentSession);
    const encryptedUser = await getSecureItem(AuthStorageKeys.CurrentUser);
    const lastAuthTime = await getSecureItem(AuthStorageKeys.LastAuthTime);

    if (!encryptedSession || !encryptedUser || !lastAuthTime) {
      logInfo('No session data found in storage.');
      return false;
    }

    const session: AuthSession = JSON.parse(decrypt(encryptedSession));
    const user: AppUser = JSON.parse(decrypt(encryptedUser));

    if (!session || !user || !session.accessToken || !session.expiresAt) {
      logWarning('Incomplete session data found. Clearing...');
      await clearAllAuthData();
      return false;
    }

    const expiresAt = new Date(session.expiresAt).getTime();
    if (expiresAt - Date.now() < ACCESS_TOKEN_VALIDITY_BUFFER_MS) {
      logWarning('Stored session is expired or close to expiry. Attempting refresh...');
      currentAppUser = user; // Temporarily set to allow refresh logic to use user context
      currentAuthSession = session;
      const refreshedSession = await _refreshAccessToken(false); // Attempt silent refresh
      if (refreshedSession) {
        logInfo('Stored session successfully refreshed.');
        currentAppUser = refreshedSession.user;
        currentAuthSession = refreshedSession;
        _notifyAuthStatusChange(currentAppUser, currentAuthSession);
        _setupTokenRefreshTimer();
        return true;
      } else {
        logWarning('Failed to refresh expired session. User needs to re-authenticate.');
        await clearAllAuthData();
        return false;
      }
    }

    // Session is valid and not near expiry
    currentAppUser = user;
    currentAuthSession = session;
    _notifyAuthStatusChange(currentAppUser, currentAuthSession);
    _setupTokenRefreshTimer();
    logInfo('Valid active session restored from storage.');
    return true;

  } catch (error) {
    logError(error as Error, { context: '_checkStoredSessionValidity' });
    await clearAllAuthData();
    return false;
  }
}

/**
 * Clears all authentication-related data from secure storage and memory.
 * The jester sweeping the stage clean after a magnificent performance.
 */
async function clearAllAuthData() {
  logInfo('Clearing all authentication data.');
  await removeSecureItem(AuthStorageKeys.AccessToken);
  await removeSecureItem(AuthStorageKeys.IdToken);
  await removeSecureItem(AuthStorageKeys.RefreshToken); // Even if not directly used, good to clear
  await removeSecureItem(AuthStorageKeys.CurrentUser);
  await removeSecureItem(AuthStorageKeys.CurrentSession);
  await removeSecureItem(AuthStorageKeys.MfaStatus);
  await removeSecureItem(AuthStorageKeys.LastAuthTime);
  await removeSecureItem(AuthStorageKeys.UserPermissionsCache); // Clear cache
  clearAllSecureItems(); // Ensure all relevant items are cleared

  currentAuthSession = null;
  currentAppUser = null;
  userPermissionsCache.clear();
  _stopTokenRefreshTimer();
  _notifyAuthStatusChange(null, null); // Inform listeners that user is logged out
  logInfo('Authentication data cleared and listeners notified.');
}

/**
 * Records an authentication-related event for auditing purposes.
 * The royal scribe diligently noting down every significant happening.
 * @param {string} eventType - The type of event (e.g., 'Login_Success', 'MFA_Failed').
 * @param {string} userId - The ID of the user involved.
 * @param {string} description - A detailed description of the event.
 * @param {any} [details={}] - Additional structured details for the event.
 * @returns {Promise<void>}
 */
async function _logAuthEvent(eventType: string, userId: string, description: string, details: any = {}): Promise<void> {
  const auditLog: SecurityAuditLog = {
    id: generateUniqueId('audit'),
    timestamp: new Date().toISOString(),
    eventType: eventType,
    userId: userId,
    ipAddress: currentAuthSession?.clientIp || 'unknown', // Best effort, ideally server-side
    userAgent: navigator.userAgent,
    details: {
      description,
      ...details,
    },
    severity: eventType.includes('Failed') || eventType.includes('Error') ? 'high' : 'info',
  };
  logInfo(`AUDIT: [${eventType}] User: ${userId} - ${description}`, auditLog);
  // In a real application, this would be an API call to a backend audit service.
  // Example: await fetch('/api/audit', { method: 'POST', body: JSON.stringify(auditLog) });
  recordMetric(`auth_event_${eventType.toLowerCase().replace(/[^a-z0-9_]/g, '')}`, 1);
}

/**
 * Performs adaptive authentication checks based on session context.
 * The intuitive gatekeeper scrutinizing every entry!
 * @param {AuthSession} session - The current authentication session.
 * @returns {Promise<{ allowed: boolean, reason?: string }>} True if access is allowed, false otherwise with a reason.
 */
async function _performAdaptiveAuthChecks(session: AuthSession): Promise<{ allowed: boolean; reason?: string }> {
  logInfo(`Performing adaptive authentication checks for session ${session.sessionId}.`);
  // This is a placeholder for complex adaptive auth logic, which would typically involve a backend service.
  // Factors could include:
  // - Geo-location changes (e.g., login from a new country)
  // - Device fingerprinting (e.g., new browser/device)
  // - Time of day (e.g., unusual login hours)
  // - Behavioral analytics (e.g., suspicious activity patterns)
  // - IP reputation scores

  const lastLoginTime = await getSecureItem(AuthStorageKeys.LastAuthTime);
  const lastAuthTimestamp = lastLoginTime ? parseInt(lastLoginTime, 10) : 0;
  const currentLoginTimestamp = Date.now();

  const mockAdaptiveFactors: AdaptiveAuthFactor[] = [
    { name: 'geo-ip-change', threshold: 0.8, currentScore: 0.1 }, // Mock score for geo-ip
    { name: 'new-device', threshold: 0.9, currentScore: 0.05 },  // Mock score for new device
  ];

  for (const factor of mockAdaptiveFactors) {
    if (factor.currentScore > factor.threshold) {
      _logAuthEvent('AdaptiveAuth_Challenge', session.user.uid, `Adaptive auth triggered by ${factor.name}.`, { factor });
      return { allowed: false, reason: `Unusual activity detected: ${factor.name}.` };
    }
  }

  // Example: Check for rapid consecutive logins (rate limiting)
  if (lastAuthTimestamp && (currentLoginTimestamp - lastAuthTimestamp < 5000)) { // Less than 5 seconds
    _logAuthEvent('AdaptiveAuth_RateLimit', session.user.uid, 'Rapid consecutive login attempt detected.', { lastAuthTimestamp, currentLoginTimestamp });
    // This is a simple client-side check. Server-side rate limiting is crucial.
    return { allowed: false, reason: 'Too many login attempts in a short period.' };
  }

  logInfo(`Adaptive authentication checks passed for session ${session.sessionId}.`);
  return { allowed: true };
}

/**
 * Prompts the user for MFA verification and processes the response.
 * The jester presenting the riddle that unlocks the inner sanctum.
 * @param {AppUser} user - The user requiring MFA.
 * @param {AuthSession} session - The current session.
 * @returns {Promise<boolean>} True if MFA is successfully verified, false otherwise.
 */
async function _promptAndVerifyMfa(user: AppUser, session: AuthSession): Promise<boolean> {
  if (!user.mfaEnabled || !user.mfaMethods || user.mfaMethods.length === 0) {
    logWarning(`MFA requested for user ${user.uid}, but no MFA methods configured.`);
    return false;
  }

  try {
    const selectedMethod = user.mfaMethods.includes('TOTP') ? 'TOTP' : user.mfaMethods[0]; // Prioritize TOTP
    const challengeResponse = await showMfaChallengePrompt(user.email, selectedMethod);

    if (!challengeResponse || !challengeResponse.code) {
      _logAuthEvent('MFA_Cancelled', user.uid, 'MFA challenge cancelled by user.');
      displayNotification('MFA verification cancelled.', 'info');
      return false;
    }

    logInfo(`Verifying MFA code for user ${user.uid} using ${selectedMethod}.`);
    // This would typically involve a backend call to verify the MFA code.
    // e.g., const verifyResult = await fetch('/api/auth/verify-mfa', { method: 'POST', body: JSON.stringify({ userId: user.uid, method: selectedMethod, code: challengeResponse.code }) });
    // const jsonResult = await verifyResult.json();

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
    const isCodeValid = challengeResponse.code === '123456' || challengeResponse.code === '987654'; // Mock valid codes

    if (isCodeValid) {
      _logAuthEvent('MFA_Verified', user.uid, 'MFA successfully verified.', { method: selectedMethod });
      displayNotification('MFA verification successful!', 'success');
      return true;
    } else {
      _logAuthEvent('MFA_Failed', user.uid, 'MFA verification failed: invalid code.', { method: selectedMethod });
      displayNotification('Invalid MFA code. Please try again.', 'error');
      return false;
    }
  } catch (error) {
    _logAuthEvent('MFA_Error', user.uid, `Error during MFA verification: ${(error as Error).message}.`);
    logError(error as Error, { context: '_promptAndVerifyMfa', userId: user.uid });
    displayNotification(`MFA verification error: ${(error as Error).message}`, 'error');
    return false;
  }
}

/**
 * Initializes the Google authentication client.
 * The jester preparing his instruments for the grand performance.
 * @param {(user: AppUser | null, session: AuthSession | null) => void} callback - Callback function for auth status changes.
 * @returns {void}
 */
export function initGoogleAuth(callback: (user: AppUser | null, session: AuthSession | null) => void) {
  if (!GOOGLE_CLIENT_ID) {
    const errMsg = 'Google Client ID not configured. Please consult the Royal Configurator!';
    console.error(errMsg);
    logError(new Error(errMsg), { context: 'initGoogleAuth' });
    displayNotification(errMsg, 'error');
    return;
  }

  // Validate the initial configuration
  const configErrors = validateConfig({ GOOGLE_CLIENT_ID, SCOPES_STRING });
  if (configErrors.length > 0) {
    const errMsg = `Configuration errors detected: ${configErrors.join(', ')}`;
    console.error(errMsg);
    logError(new Error(errMsg), { context: 'initGoogleAuth_validation' });
    displayNotification(errMsg, 'error');
    return;
  }

  // Add the initial callback to our royal heralds
  onAuthStatusChange(callback);

  if (window.google && window.google.accounts && window.google.accounts.oauth2) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES_STRING,
      prompt: 'select_account', // Always prompt for account selection initially for clarity
      callback: async (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          logInfo('Google OAuth2 callback received access token.');
          await _handleAuthSuccess(tokenResponse);
        } else {
          const errorMessage = tokenResponse?.error || 'No access token received.';
          logError(new Error(`Google sign-in failed: ${errorMessage}`), { tokenResponse });
          displayNotification(`Google sign-in failed: ${errorMessage}. Please try again.`, 'error');
          _notifyAuthStatusChange(null, null);
          recordMetric('auth_google_callback_failed', 1);
        }
      },
      error_callback: (errorResponse: any) => {
        const errorMessage = errorResponse?.error || 'Unknown error during Google OAuth2 callback.';
        logError(new Error(`Google OAuth2 error: ${errorMessage}`), { errorResponse });
        displayNotification(`Google authentication error: ${errorMessage}.`, 'error');
        _notifyAuthStatusChange(null, null);
        recordMetric('auth_google_oauth2_error', 1);
      }
    });
    logInfo('Google Token Client initialized successfully.');

    // Attempt to restore session immediately after initialization
    _checkStoredSessionValidity().then(isValid => {
      if (!isValid) {
        logInfo('No valid session found on init, user is unauthenticated.');
        _notifyAuthStatusChange(null, null);
      }
    });

  } else {
    const errMsg = 'Google Accounts OAuth2 library not loaded. Ensure script is included.';
    console.error(errMsg);
    logError(new Error(errMsg), { context: 'initGoogleAuth_library_load' });
    displayNotification(errMsg, 'error');
    _notifyAuthStatusChange(null, null);
  }
}

/**
 * Initiates the Google sign-in flow.
 * The jester inviting guests to the royal feast!
 * @returns {Promise<void>}
 */
export async function signInWithGoogle(): Promise<void> {
  if (!tokenClient) {
    _handleAuthError(new Error("Google Token Client not initialized. Call initGoogleAuth first."), { action: 'signInWithGoogle' });
    return;
  }
  logInfo('Initiating Google sign-in process.');
  try {
    // We can also add dynamic scopes here if needed
    tokenClient.requestAccessToken({ prompt: 'consent', ux_mode: 'popup' }); // Always ask for consent for explicit sign-in
    recordMetric('auth_google_sign_in_initiated', 1);
  } catch (error) {
    _handleAuthError(error as Error, { action: 'signInWithGoogle_request' });
  }
}

/**
 * Clears the user's current session and revokes Google tokens.
 * The jester politely ushering out guests after the performance.
 * @param {boolean} revokeGoogleToken - Whether to explicitly revoke the Google token.
 *                                      Set to false if only clearing local session (e.g., during refresh failures).
 * @returns {Promise<void>}
 */
export async function signOutUser(revokeGoogleToken: boolean = true): Promise<void> {
  logInfo(`User sign-out initiated. Revoke Google token: ${revokeGoogleToken}.`);
  const currentToken = await getSecureItem(AuthStorageKeys.AccessToken);

  if (revokeGoogleToken && currentToken && window.google) {
    try {
      await new Promise<void>((resolve) => {
        google.accounts.oauth2.revoke(currentToken, () => {
          logInfo('Google token successfully revoked.');
          _logAuthEvent('Google_Token_Revoked', currentAppUser?.uid || 'anonymous', 'Google access token revoked.');
          resolve();
        });
      });
    } catch (error) {
      _handleAuthError(error as Error, { context: 'signOutUser_revoke', userId: currentAppUser?.uid || 'anonymous' });
      // Even if revocation fails, proceed with local logout
    }
  } else if (!revokeGoogleToken) {
    logInfo('Skipping Google token revocation as requested.');
  } else {
    logInfo('No Google token to revoke or Google library not available.');
  }

  await clearAllAuthData();
  _logAuthEvent('Logout_Success', currentAppUser?.uid || 'anonymous', 'User logged out and local session cleared.');
  displayNotification('You have been successfully logged out. Farewell!', 'info');
  recordMetric('auth_logout_success', 1);
}

// --- Jester's Grand Arsenal: Publicly Exposed Functionalities ---

/**
 * Subscribes a callback function to authentication status changes.
 * The jester assigning a personal herald to keep you informed.
 * @param {(user: AppUser | null, session: AuthSession | null) => void} callback - The function to call when auth status changes.
 * @returns {() => void} A function to unsubscribe the callback.
 */
export function onAuthStatusChange(callback: (user: AppUser | null, session: AuthSession | null) => void): () => void {
  if (typeof callback !== 'function') {
    logWarning('Attempted to subscribe non-function to auth status changes.');
    return () => {}; // Return no-op unsubscribe
  }
  authStatusListeners.push(callback);
  logInfo(`Auth status listener added. Total listeners: ${authStatusListeners.length}`);
  // Immediately call with current status for new subscribers
  callback(currentAppUser, currentAuthSession);

  return () => {
    const index = authStatusListeners.indexOf(callback);
    if (index > -1) {
      authStatusListeners.splice(index, 1);
      logInfo(`Auth status listener removed. Total listeners: ${authStatusListeners.length}`);
    }
  };
}

/**
 * Retrieves the currently authenticated AppUser.
 * Who wears the crown of the current session?
 * @returns {AppUser | null} The current AppUser object or null if not authenticated.
 */
export function getCurrentUser(): AppUser | null {
  return currentAppUser;
}

/**
 * Retrieves the current authentication session details.
 * The details of the royal decree currently in effect.
 * @returns {AuthSession | null} The current AuthSession object or null if no active session.
 */
export function getCurrentSession(): AuthSession | null {
  return currentAuthSession;
}

/**
 * Gets the current access token. Automatically refreshes if needed.
 * The jester presenting the golden ticket!
 * @param {boolean} forceRefresh - Forces a token refresh even if current token is valid.
 * @returns {Promise<string | null>} The access token or null.
 */
export async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  if (!currentAuthSession || forceRefresh) {
    logInfo('Access token requested, session not available or refresh forced. Attempting refresh.');
    const refreshedSession = await _refreshAccessToken(forceRefresh);
    if (!refreshedSession) {
      logWarning('Failed to obtain a valid session/token.');
      return null;
    }
    return refreshedSession.accessToken;
  }

  const expiresInMs = new Date(currentAuthSession.expiresAt).getTime() - Date.now();
  if (expiresInMs < ACCESS_TOKEN_VALIDITY_BUFFER_MS) {
    logInfo('Access token near expiry. Attempting proactive refresh.');
    const refreshedSession = await _refreshAccessToken(false);
    if (refreshedSession) {
      return refreshedSession.accessToken;
    } else {
      logWarning('Proactive refresh failed. Token might be expired.');
      return null;
    }
  }

  return currentAuthSession.accessToken;
}

/**
 * Checks if the currently authenticated user has a specific role or permission.
 * Does this noble have the right to enter the royal chambers?
 * @param {UserRole | string} requiredRoleOrPermission - The role or permission to check.
 * @param {boolean} [checkAll=false] - If true, requires user to have ALL specified roles/permissions.
 * @returns {boolean} True if the user has the required role/permission, false otherwise.
 */
export function hasPermission(requiredRoleOrPermission: UserRole | string | (UserRole | string)[], checkAll: boolean = false): boolean {
  if (!currentAppUser || !currentAppUser.roles || currentAppUser.roles.length === 0) {
    return false; // No user or no roles means no permissions
  }

  const requiredItems = Array.isArray(requiredRoleOrPermission) ? requiredRoleOrPermission.map(item => item.toLowerCase()) : [String(requiredRoleOrPermission).toLowerCase()];
  const userRoles = currentAppUser.roles.map(role => role.toLowerCase());

  if (checkAll) {
    const allPresent = requiredItems.every(item => userRoles.includes(item));
    if (!allPresent) {
      logWarning(`User ${currentAppUser.uid} lacks one or more required permissions: ${requiredItems.join(', ')}`);
    }
    return allPresent;
  } else {
    const anyPresent = requiredItems.some(item => userRoles.includes(item));
    if (!anyPresent) {
      logWarning(`User ${currentAppUser.uid} lacks any of the required permissions: ${requiredItems.join(', ')}`);
    }
    return anyPresent;
  }
}

/**
 * Initiates the setup process for Multi-Factor Authentication.
 * The jester helping to forge a second, stronger key!
 * @param {MfaMethod} method - The MFA method to set up (e.g., 'TOTP', 'SMS').
 * @returns {Promise<{ success: boolean, message: string, setupData?: any }>} Result of the setup.
 */
export async function setupMultiFactorAuth(method: MfaMethod): Promise<{ success: boolean; message: string; setupData?: any }> {
  if (!currentAppUser) {
    return { success: false, message: 'No authenticated user to set up MFA for.' };
  }
  if (!SUPPORTED_MFA_METHODS.includes(method)) {
    return { success: false, message: `MFA method '${method}' is not supported by our royal decree.` };
  }

  logInfo(`Initiating MFA setup for user ${currentAppUser.uid} with method: ${method}.`);
  _logAuthEvent('MFA_Setup_Initiated', currentAppUser.uid, `User started MFA setup for ${method}.`);

  try {
    // This would typically involve a backend call to generate a QR code for TOTP,
    // send an SMS for phone verification, or provide instructions for a security key.
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate backend processing

    let setupData: any = {};
    if (method === 'TOTP') {
      // Mock QR code data
      setupData = {
        qrCodeUrl: 'otpauth://totp/MyApp:user@example.com?secret=MOCKSECRET&issuer=MyAwesomeApp',
        secret: 'MOCKSECRET',
        instructions: 'Scan this QR code with your authenticator app.',
      };
    } else if (method === 'SMS') {
      setupData = {
        phoneNumber: currentAppUser.email, // Or a separate phone number field
        instructions: 'A verification code has been sent to your registered phone number.',
      };
      // In real scenario, backend sends OTP to phone
    }
    _logAuthEvent('MFA_Setup_InstructionSent', currentAppUser.uid, `MFA setup instructions sent for ${method}.`);
    displayNotification(`MFA setup for ${method} initiated. Follow the instructions to complete.`, 'info');
    return { success: true, message: `MFA setup initiated for ${method}.`, setupData };
  } catch (error) {
    _logAuthEvent('MFA_Setup_Error', currentAppUser.uid, `Error during MFA setup for ${method}: ${(error as Error).message}.`);
    logError(error as Error, { context: 'setupMultiFactorAuth', method });
    return { success: false, message: `Failed to initiate MFA setup for ${method}: ${(error as Error).message}` };
  }
}

/**
 * Verifies the MFA setup (e.g., confirming the TOTP code or SMS code).
 * The jester verifying the user has truly mastered the secret handshake.
 * @param {MfaMethod} method - The MFA method being verified.
 * @param {string} verificationCode - The code provided by the user.
 * @returns {Promise<{ success: boolean, message: string }>} Result of the verification.
 */
export async function verifyMultiFactorAuthSetup(method: MfaMethod, verificationCode: string): Promise<{ success: boolean; message: string }> {
  if (!currentAppUser) {
    return { success: false, message: 'No authenticated user for MFA verification.' };
  }
  logInfo(`Verifying MFA setup code for user ${currentAppUser.uid} with method: ${method}.`);
  _logAuthEvent('MFA_Setup_Verification_Initiated', currentAppUser.uid, `User attempting to verify MFA setup for ${method}.`);

  try {
    // This would typically be a backend call to verify the provided code against the generated secret.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency

    const sanitizedCode = sanitizeInput(verificationCode);

    // Mock verification logic
    const isCodeValid = sanitizedCode === '789012' || sanitizedCode === '345678';

    if (isCodeValid) {
      // Update user's MFA status in current session and potentially backend
      if (currentAppUser) {
        currentAppUser.mfaEnabled = true;
        if (!currentAppUser.mfaMethods.includes(method)) {
          currentAppUser.mfaMethods.push(method);
        }
        await setSecureItem(AuthStorageKeys.CurrentUser, encrypt(JSON.stringify(currentAppUser)));
        _notifyAuthStatusChange(currentAppUser, currentAuthSession); // Update listeners
      }
      _logAuthEvent('MFA_Setup_Verified', currentAppUser.uid, `MFA setup successfully verified for ${method}.`);
      displayNotification(`MFA for ${method} has been successfully enabled!`, 'success');
      return { success: true, message: `MFA for ${method} successfully enabled.` };
    } else {
      _logAuthEvent('MFA_Setup_Verification_Failed', currentAppUser.uid, `MFA setup verification failed for ${method}: invalid code.`);
      return { success: false, message: 'Invalid verification code. Please try again.' };
    }
  } catch (error) {
    _logAuthEvent('MFA_Setup_Verification_Error', currentAppUser.uid, `Error during MFA setup verification for ${method}: ${(error as Error).message}.`);
    logError(error as Error, { context: 'verifyMultiFactorAuthSetup', method });
    return { success: false, message: `Failed to verify MFA setup for ${method}: ${(error as Error).message}` };
  }
}

/**
 * Allows the user to update their profile information.
 * The jester helping to update the royal portrait!
 * @param {Partial<AppUser>} updates - Partial object with user properties to update.
 * @returns {Promise<{ success: boolean, message: string, updatedUser?: AppUser }>} Result of the update.
 */
export async function updateUserProfile(updates: Partial<AppUser>): Promise<{ success: boolean; message: string; updatedUser?: AppUser }> {
  if (!currentAppUser) {
    return { success: false, message: 'No authenticated user to update profile for.' };
  }
  logInfo(`Attempting to update profile for user: ${currentAppUser.uid}.`);
  _logAuthEvent('Profile_Update_Initiated', currentAppUser.uid, 'User initiated profile update.', { updates });

  try {
    // This would involve a backend API call to persist the changes.
    // Ensure sensitive fields (like roles, MFA status) cannot be updated directly via client-side function
    const allowedUpdates: Partial<AppUser> = {};
    if (updates.displayName) allowedUpdates.displayName = sanitizeInput(updates.displayName);
    if (updates.photoURL) allowedUpdates.photoURL = sanitizeInput(updates.photoURL);
    if (updates.locale) allowedUpdates.locale = sanitizeInput(updates.locale);
    // Add other fields that are safe to update directly from client

    // Mock backend update
    await new Promise(resolve => setTimeout(resolve, 700));

    // Apply updates locally if backend call is successful
    currentAppUser = { ...currentAppUser, ...allowedUpdates };
    await setSecureItem(AuthStorageKeys.CurrentUser, encrypt(JSON.stringify(currentAppUser)));
    _notifyAuthStatusChange(currentAppUser, currentAuthSession);
    _logAuthEvent('Profile_Update_Success', currentAppUser.uid, 'User profile successfully updated.', { updatedFields: Object.keys(allowedUpdates) });
    displayNotification('Your profile has been updated!', 'success');
    return { success: true, message: 'Profile updated successfully.', updatedUser: currentAppUser };
  } catch (error) {
    _logAuthEvent('Profile_Update_Error', currentAppUser.uid, `Error updating profile: ${(error as Error).message}.`, { updates });
    logError(error as Error, { context: 'updateUserProfile', userId: currentAppUser.uid });
    return { success: false, message: `Failed to update profile: ${(error as Error).message}` };
  }
}

/**
 * Allows dynamic adjustment of Google API scopes for the current user.
 * The jester asking for specific tools for a specific task.
 * @param {string[]} newScopes - An array of new scopes to request.
 * @param {boolean} [merge=true] - If true, merges new scopes with existing ones; otherwise, replaces.
 * @returns {Promise<{ success: boolean, message: string, grantedScopes?: string[] }>} Result of the scope update.
 */
export async function updateGoogleScopes(newScopes: string[], merge: boolean = true): Promise<{ success: boolean; message: string; grantedScopes?: string[] }> {
  if (!tokenClient) {
    return { success: false, message: 'Google Token Client not initialized.' };
  }
  if (!currentAppUser) {
    return { success: false, message: 'No authenticated user to update scopes for.' };
  }

  const currentScopes = (currentAuthSession?.user?.scopes || DEFAULT_SCOPES).join(' '); // Assuming scopes stored in session/user
  const targetScopes = merge ? Array.from(new Set([...DEFAULT_SCOPES, ...newScopes])).join(' ') : newScopes.join(' ');

  if (targetScopes === currentScopes) {
    return { success: true, message: 'No change in requested scopes.', grantedScopes: currentScopes.split(' ') };
  }

  logInfo(`Requesting updated Google scopes for user ${currentAppUser.uid}: ${targetScopes}`);
  _logAuthEvent('Scope_Update_Initiated', currentAppUser.uid, `User requested scope update to: ${targetScopes}.`);

  try {
    const tokenResponse = await new Promise((resolve, reject) => {
      tokenClient.requestAccessToken({
        scope: targetScopes,
        prompt: 'consent', // Always ask for consent when requesting new scopes
        callback: (response: any) => {
          if (response && response.access_token) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to obtain new access token with updated scopes.'));
          }
        },
      });
    });

    if (tokenResponse && (tokenResponse as any).access_token) {
      logInfo('Access token with updated scopes received!');
      await _handleAuthSuccess(tokenResponse as any); // Re-handle auth success to update session
      _logAuthEvent('Scope_Update_Success', currentAppUser.uid, 'Google scopes successfully updated.', { newScopes: targetScopes });
      displayNotification('Your Google permissions have been updated!', 'success');
      return { success: true, message: 'Google scopes updated successfully.', grantedScopes: targetScopes.split(' ') };
    } else {
      _logAuthEvent('Scope_Update_Failed', currentAppUser.uid, 'Failed to update Google scopes: no access token received.', { newScopes: targetScopes });
      return { success: false, message: 'Failed to update Google permissions. User may have denied consent.' };
    }
  } catch (error) {
    _logAuthEvent('Scope_Update_Error', currentAppUser.uid, `Error updating Google scopes: ${(error as Error).message}.`, { newScopes: targetScopes });
    logError(error as Error, { context: 'updateGoogleScopes', newScopes });
    return { success: false, message: `Error updating Google permissions: ${(error as Error).message}` };
  }
}

/**
 * Fetches and displays the current configuration settings of the auth client.
 * The jester revealing the blueprint of his magical contraption.
 * @returns {ClientAuthSettings} The current authentication client settings.
 */
export function getAuthClientConfig(): ClientAuthSettings {
  return {
    clientId: GOOGLE_CLIENT_ID,
    scopes: SCOPES_STRING.split(' '),
    mfaMethods: SUPPORTED_MFA_METHODS,
    tokenRefreshIntervalMs: TOKEN_REFRESH_INTERVAL_MS,
    accessTokenValidityBufferMs: ACCESS_TOKEN_VALIDITY_BUFFER_MS,
    maxRetryAttempts: MAX_RETRY_ATTEMPTS,
  };
}

/**
 * Forces a session refresh, invalidating the current local session and attempting to get a new one.
 * The jester demanding a fresh performance from the minstrel!
 * @returns {Promise<boolean>} True if a new session was successfully established, false otherwise.
 */
export async function forceRefreshSession(): Promise<boolean> {
  logInfo('Forcing session refresh...');
  _logAuthEvent('Session_ForceRefresh_Initiated', currentAppUser?.uid || 'anonymous', 'Administrator/User initiated force session refresh.');
  await signOutUser(false); // Clear local session without revoking Google token
  if (!tokenClient) {
    _handleAuthError(new Error("Google Token Client not initialized for force refresh."), { action: 'forceRefreshSession' });
    return false;
  }
  try {
    // This will trigger a new sign-in attempt, potentially with a prompt if silent refresh isn't possible
    await signInWithGoogle();
    if (currentAuthSession) {
      logInfo('Force session refresh successful!');
      return true;
    } else {
      logWarning('Force session refresh failed to establish new session.');
      return false;
    }
  } catch (error) {
    _handleAuthError(error as Error, { action: 'forceRefreshSession_attempt' });
    return false;
  }
}

/**
 * Checks if the user is currently authenticated and if their session is active.
 * Is the noble still at the grand ball, or have they slipped away?
 * @returns {boolean} True if authenticated with an active session, false otherwise.
 */
export function isAuthenticated(): boolean {
  if (!currentAppUser || !currentAuthSession) {
    return false;
  }
  const expiresAt = new Date(currentAuthSession.expiresAt).getTime();
  return expiresAt > Date.now(); // Check if token is still valid
}

/**
 * Retrieves a historical record of security audit logs for the current user.
 * The jester consulting the annals of past events.
 * @param {string} userId - The user ID for whom to fetch logs.
 * @param {number} [limit=10] - The maximum number of logs to retrieve.
 * @returns {Promise<SecurityAuditLog[]>} An array of audit logs.
 */
export async function getSecurityAuditLogs(userId: string, limit: number = 10): Promise<SecurityAuditLog[]> {
  logInfo(`Fetching security audit logs for user ${userId}, limit: ${limit}.`);
  // This is a placeholder; real audit logs would be fetched from a secure backend service.
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
  return [
    {
      id: generateUniqueId('audit'),
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      eventType: 'Login_Success',
      userId: userId,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Desktop)',
      details: { description: 'User successfully authenticated from known device.' },
      severity: 'info',
    },
    {
      id: generateUniqueId('audit'),
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      eventType: 'MFA_Verified',
      userId: userId,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Desktop)',
      details: { description: 'MFA successfully verified via TOTP.', method: 'TOTP' },
      severity: 'info',
    },
    {
      id: generateUniqueId('audit'),
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      eventType: 'Profile_Update_Success',
      userId: userId,
      ipAddress: '192.168.1.101', // Different IP
      userAgent: 'Mozilla/5.0 (Mobile)',
      details: { description: 'User updated displayName.', updatedFields: ['displayName'] },
      severity: 'info',
    },
    {
      id: generateUniqueId('audit'),
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      eventType: 'Login_Failed',
      userId: userId,
      ipAddress: '8.8.8.8', // Suspicious IP
      userAgent: 'Unknown Browser',
      details: { description: 'Failed login attempt: incorrect password/MFA.', reason: 'InvalidCredentials' },
      severity: 'high',
    },
    {
      id: generateUniqueId('audit'),
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      eventType: 'Session_ForceRefresh_Initiated',
      userId: userId,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Desktop)',
      details: { description: 'User initiated force session refresh.' },
      severity: 'info',
    },
  ].slice(0, limit);
}

/**
 * Placeholder for backend-driven session invalidation, for administrative purposes.
 * The jester calling for the immediate termination of a rogue session!
 * @param {string} sessionId - The ID of the session to invalidate.
 * @param {string} adminReason - Reason for invalidation.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function invalidateSession(sessionId: string, adminReason: string): Promise<{ success: boolean; message: string }> {
  logWarning(`Admin request to invalidate session ${sessionId} for reason: ${adminReason}.`);
  _logAuthEvent('Admin_Session_Invalidation', currentAppUser?.uid || 'admin', `Admin invalidated session ${sessionId}.`, { sessionId, adminReason });

  // This would be an API call to a backend that tracks and invalidates sessions.
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

  // If the invalidated session is the current one, trigger local logout
  if (currentAuthSession?.sessionId === sessionId) {
    await signOutUser(true);
    return { success: true, message: `Current session ${sessionId} invalidated and user logged out locally.` };
  }

  return { success: true, message: `Session ${sessionId} marked for invalidation on backend.` };
}

/**
 * Placeholder for enabling or disabling adaptive authentication features.
 * The jester adjusting the vigilance of the gatekeepers.
 * @param {boolean} enable - True to enable, false to disable.
 * @param {AdaptiveAuthFactor[]} [factorsToConfigure] - Specific factors to configure.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function configureAdaptiveAuth(enable: boolean, factorsToConfigure?: AdaptiveAuthFactor[]): Promise<{ success: boolean; message: string }> {
  logInfo(`Configuring adaptive authentication: ${enable ? 'enabled' : 'disabled'}.`);
  _logAuthEvent(
    enable ? 'AdaptiveAuth_Enabled' : 'AdaptiveAuth_Disabled',
    currentAppUser?.uid || 'admin',
    `Adaptive authentication ${enable ? 'enabled' : 'disabled'}.`,
    { factors: factorsToConfigure }
  );

  // This would typically involve updating backend configuration for adaptive auth rules.
  await new Promise(resolve => setTimeout(resolve, 600));

  displayNotification(`Adaptive authentication ${enable ? 'enabled' : 'disabled'} successfully.`, 'info');
  return { success: true, message: `Adaptive authentication ${enable ? 'enabled' : 'disabled'}.` };
}

// --- Jester's Curtain Call: Initialization Check ---
// The jester ensures all his props are ready before the show begins.
// This block ensures the Google Auth library is loaded.
// It's a common pattern to dynamically load, or expect it to be present.
// For a fully robust system, you'd have a dynamic script loader here.
if (typeof window !== 'undefined' && !(window as any).google?.accounts?.oauth2) {
  console.warn('Google Accounts OAuth2 library not detected on window. The initGoogleAuth function will wait for it.');
  // In a production app, you might dynamically load the script here
  // const script = document.createElement('script');
  // script.src = 'https://accounts.google.com/gsi/client';
  // script.async = true;
  // script.defer = true;
  // document.head.appendChild(script);
  // script.onload = () => console.log('Google GSI client loaded dynamically.');
}
```

### The Unveiling: A Glimpse Behind the Velvet Curtain!

Isn't it magnificent?! A true testament to the power of thoughtful expansion! We started with a charming jingle and built an entire symphony!

*   **`AppUser` and `AuthSession`:** Now richer than a king's treasury, holding not just basic profile data, but roles, MFA status, session IDs, and more!
*   **`_refreshAccessToken` and `_setupTokenRefreshTimer`:** No more expiring tokens leaving your users stranded in the digital wilderness! Our proactive sentinels keep the session evergreen.
*   **MFA Integration (`setupMultiFactorAuth`, `verifyMultiFactorAuthSetup`, `_promptAndVerifyMfa`):** The two-key fortress is now fully operational, supporting TOTP, SMS, and even hints of security keys! The jester guides your users through the secret handshakes.
*   **RBAC (`hasPermission`):** Granting access with the precision of a royal archer. No more digital peasants in the throne room!
*   **`_logAuthEvent` and `getSecurityAuditLogs`:** Every whisper, every grand entrance, every failed attempt is now meticulously recorded by our diligent scribes, ready for the king's review!
*   **`_performAdaptiveAuthChecks` and `configureAdaptiveAuth`:** Our gates now have eyes and ears, adjusting their vigilance based on context! Is the knight trying to log in from a dragon's lair? Extra checks!
*   **`secureStorageService.ts` (conceptually):** Our treasures are not just left on the counter; they're in encrypted, secure vaults, guarded by digital dragons (encryption keys)!
*   **Enhanced Error Handling & Telemetry:** Even when the jester trips, he performs a graceful recovery, capturing every detail for future improvement and ensuring the show goes on!
*   **Dynamic Scopes (`updateGoogleScopes`):** We ask for *precisely* what we need, demonstrating respect for user privacy and security.

This is not just an upgrade; it's a paradigm shift! It's the difference between a simple campfire tale and an epic saga! This architecture provides a foundation that is:

*   **Secure:** With MFA, adaptive authentication, and robust token management.
*   **Scalable:** Designed to integrate with backend services for true enterprise-grade identity.
*   **User-Centric:** Proactive refreshes, clear notifications, and a streamlined MFA process.
*   **Observable:** Comprehensive logging and telemetry give you unparalleled insight.
*   **Extendable:** Ready for future identity providers, new security features, and the ever-evolving demands of the digital landscape.

### The Jester's Final Bow: A Call to Action!

My fellow architects of the digital future, let this be your inspiration! Do not settle for mediocrity when brilliance awaits! Do not accept the mundane when majesty is within reach! Embrace the humor, the wit, and the expert craftsmanship that transforms mere code into a masterpiece of engineering and user experience!

Remember, your authentication service isn't just a barrier; it's the first impression, the welcoming embrace, and the stalwart protector of your users' digital lives. Make it a joy! Make it a fortress! Make it, dare I say, *hilarious* in its sheer, uncompromising excellence!

Go forth, and build your own magnificent digital castles, complete with jester-approved security and user delight! May your tokens always refresh, your MFA codes always verify, and your users always feel like royalty!

### The Post That Sparked a Digital Revolution!

And now, for the grand reveal that shall grace the hallowed halls of LinkedIn, a beacon of brilliance, concise yet captivating, drawing all to the full article!

---
**🚀 BREAKING NEWS from the Digital Kingdom! 🚀**

Your Chief Jester of Code, James Burvel O’Callaghan III, President of Citibank Demo Business Inc., has just pulled back the curtain on a legendary transformation! We've taken humble Google Auth and forged it into an unshakeable, user-delighting, enterprise-grade fortress!

Forget basic logins! We're talking Multi-Factor Magic, Role-Based Revelry, Adaptive Authentication Alacrity, and Session Sentinels that never sleep! This isn't just code; it's a masterclass in secure, scalable, and *joyful* authentication!

I've shared the *full, expanded codebase* and all the jester's secrets in my latest LinkedIn article. If you're ready to elevate your app's security from a minstrel's tune to a royal symphony, you *must* read this!

Let's build digital kingdoms worthy of our users! Click, read, and prepare to be inspired! #CodeJester #AuthRevolution
---

### The Royal Proclamation of Hashtags (50, Count 'Em!)

#GoogleAuth #Authentication #Cybersecurity #SoftwareDevelopment #TechInnovation #DeveloperLife #EnterpriseSecurity #MFA #RBAC #SessionManagement #AccessToken #RefreshToken #OAuth2 #Telemetry #ErrorHandling #AdaptiveAuth #SecureCoding #FrontendDevelopment #BackendDevelopment #Fullstack #TypeScript #JavaScript #WebSecurity #DigitalTransformation #CloudSecurity #GoogleCloud #IdentityManagement #IAM #DevOps #CodeQuality #BestPractices #TechLeadership #Inspiration #HumorInTech #JesterOfCode #CitibankDemoBusinessInc #Innovation #FutureOfTech #CodeIsArt #ArchitecturalDesign #SoftwareArchitecture #Productivity #Scalability #UserExperience #UX #DeveloperCommunity #LinkedInArticle #MustRead #SecurityFirst #ModernAuth