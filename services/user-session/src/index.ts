export interface UserCredentials {
  username?: string;
  email?: string;
  password?: string;
  provider?: 'google' | 'github' | 'oidc';
  providerAuthCode?: string;
}

export interface AuthSession {
  jwt: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  refreshToken?: string;
  scopes: string[];
}

export interface UserSessionData {
  userId: string;
  displayName: string;
  email: string;
  roles: string[];
  profileData: Record<string, any>;
  sessionMetadata: {
    createdAt: string;
    expiresAt: string;
    lastActivity: string;
  };
}

export interface SessionValidationResult {
  isValid: boolean;
  userId: string | null;
  reason?: string;
  payload?: Record<string, any>;
}

export class UserSessionError extends Error {
  public readonly code: string;
  public readonly originalError?: unknown;

  constructor(message: string, code: string = 'USER_SESSION_ERROR', originalError?: unknown) {
    super(message);
    this.name = 'UserSessionError';
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, UserSessionError.prototype);
  }
}

export class AuthenticationFailedError extends UserSessionError {
  constructor(message: string = 'Authentication failed. Invalid credentials.', originalError?: unknown) {
    super(message, 'AUTHENTICATION_FAILED', originalError);
    this.name = 'AuthenticationFailedError';
  }
}

export class SessionInvalidError extends UserSessionError {
  constructor(message: string = 'Session is invalid or expired.', originalError?: unknown) {
    super(message, 'SESSION_INVALID', originalError);
    this.name = 'SessionInvalidError';
  }
}

export class AuthGatewayUnavailableError extends UserSessionError {
  constructor(message: string = 'Authentication Gateway service is currently unavailable.', originalError?: unknown) {
    super(message, 'AUTH_GATEWAY_UNAVAILABLE', originalError);
    this.name = 'AuthGatewayUnavailableError';
  }
}

enum LogLevel { DEBUG, INFO, WARN, ERROR, CRITICAL }
const _log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [UserSessionService] [${LogLevel[level]}] ${message}`;
  const fullContext = context ? JSON.stringify(context) : '';
  switch (level) {
    case LogLevel.ERROR: console.error(logMessage, fullContext); break;
    case LogLevel.WARN: console.warn(logMessage, fullContext); break;
    case LogLevel.INFO: console.info(logMessage, fullContext); break;
    case LogLevel.DEBUG: console.debug(logMessage, fullContext); break;
    default: console.log(logMessage, fullContext); break;
  }
};

const _measurePerformance = async <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
  const start = process.hrtime.bigint();
  try {
    const result = await operation();
    const end = process.hrtime.bigint();
    const durationNs = end - start;
    const durationMs = Number(durationNs) / 1_000_000;
    _log(LogLevel.DEBUG, `Operation '${operationName}' completed in ${durationMs.toFixed(3)}ms.`);
    return result;
  } catch (error) {
    _log(LogLevel.ERROR, `Operation '${operationName}' failed.`, { error: (error as Error)?.message });
    throw error;
  }
};

export interface IAuthGatewayService {
  authenticate(credentials: UserCredentials): Promise<AuthSession>;
  validate(jwt: string): Promise<SessionValidationResult>;
  refresh(jwt: string): Promise<AuthSession>;
  revoke(jwt: string): Promise<boolean>;
  fetchSessionData(jwt: string): Promise<UserSessionData>;
}

export class MockAuthGatewayService implements IAuthGatewayService {
  private readonly _mockUsers = new Map<string, { passwordHash: string; userData: UserSessionData }>();
  private readonly _mockJwts = new Map<string, { userId: string; expiresAt: number; revoked: boolean }>();
  private readonly _mockRefreshTokens = new Map<string, { userId: string; expiresAt: number; jwt: string }>();

  constructor() {
    this._mockUsers.set('jester@example.com', {
      passwordHash: 'hashed_password_jester123',
      userData: {
        userId: 'jester-123',
        displayName: 'Sir Jestalot',
        email: 'jester@example.com',
        roles: ['user', 'jester', 'admin'],
        profileData: {
          favoriteJoke: 'Why did the AI go to the doctor? Because it had a byte!',
        },
        sessionMetadata: {
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
      },
    });
    this._mockUsers.set('dev@example.com', {
      passwordHash: 'hashed_password_dev456',
      userData: {
        userId: 'dev-456',
        displayName: 'Lady Code',
        email: 'dev@example.com',
        roles: ['user', 'developer'],
        profileData: {
          preferredLanguage: 'TypeScript',
        },
        sessionMetadata: {
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
      },
    });
  }

  private async _simulateDelay(minMs: number = 50, maxMs: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * (maxMs - minMs) + minMs));
  }

  private _generateMockJwt(userId: string, expiresInMs: number, payload: Record<string, any> = {}): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const issuedAt = Date.now();
    const expiresAt = issuedAt + expiresInMs;
    const finalPayload = {
      sub: userId,
      iat: Math.floor(issuedAt / 1000),
      exp: Math.floor(expiresAt / 1000),
      ...payload
    };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(finalPayload));
    const mockSignature = btoa('mock-signature');
    const jwt = `${encodedHeader}.${encodedPayload}.${mockSignature}`;

    this._mockJwts.set(jwt, { userId, expiresAt, revoked: false });
    _log(LogLevel.DEBUG, `Mock JWT generated for ${userId}, expires in ${expiresInMs / 1000}s.`);
    return jwt;
  }

  private _decodeMockJwtPayload(jwt: string): Record<string, any> {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      return JSON.parse(atob(parts[1]));
    } catch (e) {
      _log(LogLevel.ERROR, `Failed to decode mock JWT payload.`, { jwt, error: e });
      throw new Error("Invalid JWT format for decoding.");
    }
  }

  async authenticate(credentials: UserCredentials): Promise<AuthSession> {
    return _measurePerformance('AuthGateway.authenticate', async () => {
      await this._simulateDelay();
      _log(LogLevel.INFO, `AuthGateway: Authenticating user...`);

      const email = credentials.email || credentials.username;
      const password = credentials.password;

      if (!email || !password) {
        throw new AuthenticationFailedError('Email/username and password are required.');
      }

      const userEntry = this._mockUsers.get(email);
      if (!userEntry || userEntry.passwordHash !== `hashed_password_${email.split('@')[0]}123`) {
        throw new AuthenticationFailedError('Invalid email or password.');
      }

      const jwtExpiresInMs = 3600 * 1000;
      const refreshTokenExpiresInMs = 7 * 24 * 3600 * 1000;

      const jwt = this._generateMockJwt(userEntry.userData.userId, jwtExpiresInMs);
      const refreshToken = this._generateMockJwt(userEntry.userData.userId, refreshTokenExpiresInMs, { type: 'refresh' });

      this._mockRefreshTokens.set(refreshToken, { userId: userEntry.userData.userId, expiresAt: Date.now() + refreshTokenExpiresInMs, jwt });
      
      _log(LogLevel.INFO, `AuthGateway: Authentication successful for ${email}.`);
      return {
        jwt,
        userId: userEntry.userData.userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + jwtExpiresInMs).toISOString(),
        refreshToken,
        scopes: userEntry.userData.roles,
      };
    });
  }

  async validate(jwt: string): Promise<SessionValidationResult> {
    return _measurePerformance('AuthGateway.validate', async () => {
      await this._simulateDelay();
      _log(LogLevel.INFO, `AuthGateway: Validating JWT...`);

      const jwtRecord = this._mockJwts.get(jwt);
      if (!jwtRecord) {
        return { isValid: false, userId: null, reason: 'JWT not found or malformed.' };
      }
      if (jwtRecord.revoked) {
        return { isValid: false, userId: null, reason: 'JWT has been revoked.' };
      }
      if (jwtRecord.expiresAt < Date.now()) {
        this._mockJwts.delete(jwt);
        return { isValid: false, userId: null, reason: 'JWT has expired.' };
      }

      const payload = this._decodeMockJwtPayload(jwt);
      return { isValid: true, userId: jwtRecord.userId, payload };
    });
  }

  async refresh(jwt: string): Promise<AuthSession> {
    return _measurePerformance('AuthGateway.refresh', async () => {
      await this._simulateDelay();
      _log(LogLevel.INFO, `AuthGateway: Refreshing JWT...`);

      const validationResult = await this.validate(jwt);
      if (validationResult.isValid) {
        if (validationResult.payload?.type === 'refresh') {
          const refreshTokenRecord = this._mockRefreshTokens.get(jwt);
          if (!refreshTokenRecord || refreshTokenRecord.revoked || refreshTokenRecord.expiresAt < Date.now()) {
            throw new SessionInvalidError('Invalid or expired refresh token.');
          }

          this._mockRefreshTokens.delete(jwt);
          this._mockJwts.get(refreshTokenRecord.jwt)!.revoked = true;

          const newJwtExpiresInMs = 3600 * 1000;
          const newRefreshTokenExpiresInMs = 7 * 24 * 3600 * 1000;

          const userEntry = Array.from(this._mockUsers.values()).find(u => u.userData.userId === refreshTokenRecord.userId);
          if (!userEntry) throw new SessionInvalidError('User not found during refresh.');

          const newJwt = this._generateMockJwt(refreshTokenRecord.userId, newJwtExpiresInMs);
          const newRefreshToken = this._generateMockJwt(refreshTokenRecord.userId, newRefreshTokenExpiresInMs, { type: 'refresh' });

          this._mockRefreshTokens.set(newRefreshToken, { userId: refreshTokenRecord.userId, expiresAt: Date.now() + newRefreshTokenExpiresInMs, jwt: newJwt });

          return {
            jwt: newJwt,
            userId: refreshTokenRecord.userId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + newJwtExpiresInMs).toISOString(),
            refreshToken: newRefreshToken,
            scopes: userEntry.userData.roles,
          };
        } else {
          throw new SessionInvalidError('Provided JWT is an access token and still valid. No refresh needed.');
        }
      } else {
        const payload = this._decodeMockJwtPayload(jwt);
        if (payload.type === 'refresh') {
             const refreshTokenRecord = this._mockRefreshTokens.get(jwt);
             if (!refreshTokenRecord || refreshTokenRecord.revoked || refreshTokenRecord.expiresAt < Date.now()) {
                throw new SessionInvalidError('Invalid or expired refresh token.');
             }
             const newJwtExpiresInMs = 3600 * 1000;
             const newRefreshTokenExpiresInMs = 7 * 24 * 3600 * 1000;

             const userEntry = Array.from(this._mockUsers.values()).find(u => u.userData.userId === refreshTokenRecord.userId);
             if (!userEntry) throw new SessionInvalidError('User not found during refresh.');

             const newJwt = this._generateMockJwt(refreshTokenRecord.userId, newJwtExpiresInMs);
             const newRefreshToken = this._generateMockJwt(refreshTokenRecord.userId, newRefreshTokenExpiresInMs, { type: 'refresh' });

             this._mockRefreshTokens.set(newRefreshToken, { userId: refreshTokenRecord.userId, expiresAt: Date.now() + newRefreshTokenExpiresInMs, jwt: newJwt });

             return {
                jwt: newJwt,
                userId: refreshTokenRecord.userId,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + newJwtExpiresInMs).toISOString(),
                refreshToken: newRefreshToken,
                scopes: userEntry.userData.roles,
             };
        } else {
            throw new SessionInvalidError(validationResult.reason || 'Invalid JWT for refresh. Please re-authenticate.');
        }
      }
    });
  }

  async revoke(jwt: string): Promise<boolean> {
    return _measurePerformance('AuthGateway.revoke', async () => {
      await this._simulateDelay();
      _log(LogLevel.INFO, `AuthGateway: Revoking JWT...`);

      const jwtRecord = this._mockJwts.get(jwt);
      if (!jwtRecord) {
        _log(LogLevel.WARN, `AuthGateway: Attempted to revoke non-existent JWT.`);
        return false;
      }

      jwtRecord.revoked = true;
      _log(LogLevel.INFO, `AuthGateway: JWT revoked for user ${jwtRecord.userId}.`);

      const payload = this._decodeMockJwtPayload(jwt);
      if (payload.type !== 'refresh') {
        const refreshTokenEntry = Array.from(this._mockRefreshTokens.entries()).find(([, entry]) => entry.jwt === jwt);
        if (refreshTokenEntry) {
          this._mockRefreshTokens.delete(refreshTokenEntry[0]);
          _log(LogLevel.INFO, `AuthGateway: Associated refresh token also removed.`);
        }
      }
      return true;
    });
  }

  async fetchSessionData(jwt: string): Promise<UserSessionData> {
    return _measurePerformance('AuthGateway.fetchSessionData', async () => {
      await this._simulateDelay();
      _log(LogLevel.INFO, `AuthGateway: Fetching session data...`);

      const validation = await this.validate(jwt);
      if (!validation.isValid) {
        throw new SessionInvalidError(validation.reason || 'JWT is invalid or expired.');
      }

      const userEntry = Array.from(this._mockUsers.values()).find(u => u.userData.userId === validation.userId);
      if (!userEntry) {
        throw new AuthenticationFailedError('User data not found for session.');
      }
      return userEntry.userData;
    });
  }
}

export interface IUserSessionService {
  createSession(credentials: UserCredentials): Promise<AuthSession>;
  validateSession(jwt: string): Promise<SessionValidationResult>;
  refreshSession(jwt: string): Promise<AuthSession>;
  getSessionData(jwt: string): Promise<UserSessionData>;
  deleteSession(jwt: string): Promise<boolean>;
}

export class UserSessionService implements IUserSessionService {
  private readonly _authGatewayService: IAuthGatewayService;

  constructor(authGatewayService: IAuthGatewayService) {
    this._authGatewayService = authGatewayService;
    _log(LogLevel.INFO, 'UserSessionService initialized.');
  }

  async createSession(credentials: UserCredentials): Promise<AuthSession> {
    return _measurePerformance('UserSessionService.createSession', async () => {
      _log(LogLevel.INFO, `Creating session for user: ${credentials.email || credentials.username}...`);
      try {
        const session = await this._authGatewayService.authenticate(credentials);
        _log(LogLevel.INFO, `Session created successfully for user ${session.userId}.`);
        return session;
      } catch (error) {
        _log(LogLevel.ERROR, `Failed to create session.`, { error: (error as Error)?.message });
        throw AuthGatewayUnavailableError.fromUnknown(error, 'AUTH_GATEWAY_AUTHENTICATE_FAILED');
      }
    });
  }

  async validateSession(jwt: string): Promise<SessionValidationResult> {
    return _measurePerformance('UserSessionService.validateSession', async () => {
      _log(LogLevel.INFO, `Validating session with JWT...`);
      try {
        const validationResult = await this._authGatewayService.validate(jwt);
        if (!validationResult.isValid) {
          _log(LogLevel.WARN, `Session validation failed: ${validationResult.reason}.`);
          throw new SessionInvalidError(validationResult.reason || 'Invalid session token.');
        }
        _log(LogLevel.INFO, `Session validated successfully for user ${validationResult.userId}.`);
        return validationResult;
      } catch (error) {
        _log(LogLevel.ERROR, `Failed to validate session.`, { error: (error as Error)?.message });
        throw AuthGatewayUnavailableError.fromUnknown(error, 'AUTH_GATEWAY_VALIDATE_FAILED');
      }
    });
  }

  async refreshSession(jwt: string): Promise<AuthSession> {
    return _measurePerformance('UserSessionService.refreshSession', async () => {
      _log(LogLevel.INFO, `Refreshing session with JWT...`);
      try {
        const newSession = await this._authGatewayService.refresh(jwt);
        _log(LogLevel.INFO, `Session refreshed successfully for user ${newSession.userId}.`);
        return newSession;
      } catch (error) {
        _log(LogLevel.ERROR, `Failed to refresh session.`, { error: (error as Error)?.message });
        throw AuthGatewayUnavailableError.fromUnknown(error, 'AUTH_GATEWAY_REFRESH_FAILED');
      }
    });
  }

  async getSessionData(jwt: string): Promise<UserSessionData> {
    return _measurePerformance('UserSessionService.getSessionData', async () => {
      _log(LogLevel.INFO, `Fetching session data with JWT...`);
      try {
        const sessionData = await this._authGatewayService.fetchSessionData(jwt);
        _log(LogLevel.INFO, `Session data fetched successfully for user ${sessionData.userId}.`);
        return sessionData;
      } catch (error) {
        _log(LogLevel.ERROR, `Failed to fetch session data.`, { error: (error as Error)?.message });
        throw AuthGatewayUnavailableError.fromUnknown(error, 'AUTH_GATEWAY_FETCH_DATA_FAILED');
      }
    });
  }

  async deleteSession(jwt: string): Promise<boolean> {
    return _measurePerformance('UserSessionService.deleteSession', async () => {
      _log(LogLevel.INFO, `Deleting session with JWT...`);
      try {
        const success = await this._authGatewayService.revoke(jwt);
        _log(LogLevel.INFO, `Session deletion reported as ${success ? 'successful' : 'failed'} for JWT.`);
        return success;
      } catch (error) {
        _log(LogLevel.ERROR, `Failed to delete session.`, { error: (error as Error)?.message });
        throw AuthGatewayUnavailableError.fromUnknown(error, 'AUTH_GATEWAY_REVOKE_FAILED');
      }
    });
  }
}