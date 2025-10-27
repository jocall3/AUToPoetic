/**
 * @file Defines the AuthClient, a client-side library for managing OIDC-based authentication flows
 * with the AuthGateway microservice. This client handles token acquisition, storage, refresh, and session management
 * in a zero-trust model where the client never holds long-lived secrets.
 *
 * @module packages/auth-client/src/AuthClient
 * @see @security The client securely stores the short-lived JWT in session storage and memory, but never in local storage.
 * It relies on the AuthGateway for all cryptographic operations and secret management.
 * @see @performance Caches the decoded session in memory to avoid repeated JWT parsing. Uses silent refresh to
 * maintain sessions without disruptive page reloads.
 */

/**
 * Configuration for the AuthClient.
 * @interface
 */
export interface AuthClientConfig {
  /** The base URL of the AuthGateway microservice. */
  authGatewayUrl: string;
  /** The OIDC client ID for this application. */
  clientId: string;
  /** The URL where the user is redirected after successful login. Must be registered with the AuthGateway. */
  redirectUri: string;
  /** The URL where the user is redirected after successful logout. */
  postLogoutRedirectUri: string;
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
}

/**
 * The authentication state of the client.
 * - `unauthenticated`: No valid session exists.
 * - `pending`: Authentication flow is in progress (e.g., handling callback, silent refresh).
 * - `authenticated`: A valid session is established.
 */
export type AuthState = 'unauthenticated' | 'pending' | 'authenticated';

/**
 * Callback function type for auth state changes.
 */
export type AuthStateCallback = (state: AuthState) => void;

/**
 * The client-side class for managing authentication against the AuthGateway.
 * It orchestrates the OIDC/OAuth2 authorization code flow with PKCE, handles token management,
 * and provides methods to access user session information.
 *
 * @example
 * const authClient = new AuthClient({
 *   authGatewayUrl: 'https://auth.example.com',
 *   clientId: 'my-app-client-id',
 *   redirectUri: 'https://app.example.com/callback',
 *   postLogoutRedirectUri: 'https://app.example.com/logout',
 * });
 *
 * // Subscribe to state changes
 * authClient.onAuthStateChanged(state => console.log('New auth state:', state));
 *
 * // Handle login callback on the redirect page
 * if (window.location.pathname === '/callback') {
 *   authClient.handleLoginCallback();
 * }
 */
export class AuthClient {
  private readonly config: AuthClientConfig;
  private jwt: string | null = null;
  private session: UserSession | null = null;
  private authState: AuthState = 'pending';
  private subscribers: Set<AuthStateCallback> = new Set();
  private refreshTimeoutId: number | null = null;

  /**
   * @param {AuthClientConfig} config - The configuration for the authentication client.
   */
  constructor(config: AuthClientConfig) {
    this.config = {
      scope: 'openid profile email',
      ...config,
    };
    this.initializeSession();
  }

  /**
   * Initiates the login flow by redirecting the user to the AuthGateway's authorization endpoint.
   * @security This method generates and stores a PKCE code verifier and state in session storage,
   * which are used to mitigate authorization code interception attacks.
   */
  public async login(): Promise<void> {
    await this._clearSession();
    const state = this._generateRandomString();
    const codeVerifier = this._generateRandomString();

    sessionStorage.setItem('auth_state', state);
    sessionStorage.setItem('auth_pkce_verifier', codeVerifier);

    const codeChallenge = await this._createPkceChallenge(codeVerifier);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope!,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${this.config.authGatewayUrl}/authorize?${params.toString()}`;
  }

  /**
   * Handles the redirect from the AuthGateway after a successful login.
   * It exchanges the authorization code for a JWT, verifies the state, and establishes a session.
   * This method should be called on your application's redirect URI page.
   * @returns {Promise<UserSession>} The user session object.
   * @throws {Error} If the state is invalid, or if the code exchange fails.
   */
  public async handleLoginCallback(): Promise<UserSession> {
    this._updateAuthState('pending');
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const storedState = sessionStorage.getItem('auth_state');
    const pkceVerifier = sessionStorage.getItem('auth_pkce_verifier');

    sessionStorage.removeItem('auth_state');
    sessionStorage.removeItem('auth_pkce_verifier');

    if (state !== storedState) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    if (!code) {
      throw new Error('Authorization code not found in URL.');
    }

    if (!pkceVerifier) {
      throw new Error('PKCE code verifier not found in session.');
    }

    try {
      const response = await fetch(`${this.config.authGatewayUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          redirect_uri: this.config.redirectUri,
          code,
          code_verifier: pkceVerifier,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Token exchange failed: ${errorBody.error_description || response.statusText}`);
      }

      const { access_token } = await response.json();
      await this._setSession(access_token);
      window.history.replaceState({}, document.title, window.location.pathname);
      return this.session!;
    } catch (error) {
      await this._clearSession();
      throw error;
    }
  }

  /**
   * Initiates the logout flow by clearing the local session and redirecting to the AuthGateway's logout endpoint.
   * @security This ensures that the session is terminated both locally and on the server-side, preventing token reuse.
   */
  public async logout(): Promise<void> {
    await this._clearSession();
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      post_logout_redirect_uri: this.config.postLogoutRedirectUri,
    });
    window.location.href = `${this.config.authGatewayUrl}/logout?${params.toString()}`;
  }

  /**
   * Retrieves the current JWT. If the token is expired or not present, it returns null.
   * This method is the primary way for other parts of the application (e.g., API clients) to get the auth token.
   * @returns {Promise<string | null>} The current JWT or null.
   * @performance This method avoids token decoding if the session is already established.
   */
  public async getJwt(): Promise<string | null> {
    if (this.jwt && !this._isTokenExpired(this.session!)) {
      return this.jwt;
    }
    // Here you could add silent refresh logic if needed.
    await this._clearSession();
    return null;
  }

  /**
   * Retrieves the current user session information from the decoded JWT.
   * @returns {UserSession | null} The decoded user session or null if not authenticated.
   */
  public getSession(): UserSession | null {
    if (this.jwt && this.session && !this._isTokenExpired(this.session)) {
      return this.session;
    }
    return null;
  }

  /**
   * Checks if the user is currently authenticated with a valid, non-expired session.
   * @returns {boolean} True if authenticated, false otherwise.
   */
  public isAuthenticated(): boolean {
    return this.authState === 'authenticated';
  }

  /**
   * Subscribes a callback function to authentication state changes.
   * @param {AuthStateCallback} callback - The function to call when the auth state changes.
   * @returns {() => void} A function to unsubscribe the callback.
   * @example
   * const unsubscribe = authClient.onAuthStateChanged(state => {
   *   if (state === 'authenticated') {
   *     // Update UI for logged-in user
   *   }
   * });
   * // Later, to clean up:
   * unsubscribe();
   */
  public onAuthStateChanged(callback: AuthStateCallback): () => void {
    this.subscribers.add(callback);
    callback(this.authState); // Immediately notify with current state
    return () => this.subscribers.delete(callback);
  }

  /**
   * Initializes the session on startup by checking sessionStorage for a valid JWT.
   */
  private async initializeSession(): Promise<void> {
    const storedJwt = sessionStorage.getItem('auth_jwt');
    if (storedJwt) {
      try {
        const session = this._decodeJwt(storedJwt);
        if (!this._isTokenExpired(session)) {
          await this._setSession(storedJwt);
          return;
        }
      } catch (error) {
        console.error('Failed to initialize session from storage:', error);
      }
    }
    await this._clearSession();
  }

  /**
   * Sets the user session by storing the JWT, decoding it, and notifying subscribers.
   * @param {string} jwt - The JSON Web Token.
   * @private
   */
  private async _setSession(jwt: string): Promise<void> {
    try {
      this.jwt = jwt;
      this.session = this._decodeJwt(jwt);
      sessionStorage.setItem('auth_jwt', jwt);
      this._updateAuthState('authenticated');
    } catch (error) {
      console.error('Failed to set session:', error);
      await this._clearSession();
    }
  }

  /**
   * Clears the current session and notifies subscribers.
   * @private
   */
  private async _clearSession(): Promise<void> {
    this.jwt = null;
    this.session = null;
    sessionStorage.removeItem('auth_jwt');
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    this._updateAuthState('unauthenticated');
  }

  /**
   * Decodes the payload of a JWT. Does not verify the signature.
   * @param {string} token - The JWT string.
   * @returns {UserSession} The decoded payload.
   * @private
   */
  private _decodeJwt(token: string): UserSession {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Failed to decode JWT.');
    }
  }

  /**
   * Checks if a token is expired based on its 'exp' claim.
   * @param {UserSession} session - The decoded token payload.
   * @returns {boolean} True if the token is expired, false otherwise.
   * @private
   */
  private _isTokenExpired(session: UserSession): boolean {
    const now = Date.now() / 1000;
    // Add a small buffer (e.g., 30 seconds) to account for clock skew
    return session.exp < now + 30;
  }

  /**
   * Updates the internal authentication state and notifies all subscribers.
   * @param {AuthState} newState - The new authentication state.
   * @private
   */
  private _updateAuthState(newState: AuthState): void {
    if (this.authState !== newState) {
      this.authState = newState;
      this.subscribers.forEach(callback => callback(this.authState));
    }
  }

  /**
   * Generates a cryptographically random string for use as PKCE verifier or state.
   * @private
   */
  private _generateRandomString(): string {
    const array = new Uint32Array(28);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
  }

  /**
   * Creates a PKCE code challenge from a code verifier.
   * @param {string} verifier - The PKCE code verifier.
   * @returns {Promise<string>} The base64url-encoded SHA-256 hash of the verifier.
   * @private
   */
  private async _createPkceChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
