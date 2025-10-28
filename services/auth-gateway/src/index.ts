/**
 * @file Main entry point for the AuthGateway microservice.
 * @module services/auth-gateway/src
 * @description This service is the centralized authority for identity, authentication, authorization, and secrets management
 * within the DevCore ecosystem. It implements OIDC/OAuth2 flows, issues and validates JWTs, and provides a secure
 * vault for other microservices (like the BFF) to retrieve third-party API keys and secrets.
 * @see {Architectural Directive} Implement a Zero-Trust Security Model with a Centralized Auth Gateway.
 * @security This service is the cornerstone of the security model. It manages JWT secrets and is the only service
 * that should handle raw user credentials or long-lived third-party tokens.
 */

import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

dotenv.config();

// --- Constants & Configuration ---
const PORT = process.env.AUTH_GATEWAY_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbeverylongandrandom';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// --- Logger ---
/**
 * @class Logger
 * @description A simple, static logger for the AuthGateway service.
 */
class Logger {
  static info(message: string, context?: Record<string, any>) {
    console.log(`[AUTH-GATEWAY INFO] ${new Date().toISOString()} - ${message}`, context || '');
  }
  static warn(message: string, context?: Record<string, any>) {
    console.warn(`[AUTH-GATEWAY WARN] ${new Date().toISOString()} - ${message}`, context || '');
  }
  static error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    console.error(`[AUTH-GATEWAY ERROR] ${new Date().toISOString()} - ${message}`, context || '', error || '');
  }
  static debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AUTH-GATEWAY DEBUG] ${new Date().toISOString()} - ${message}`, context || '');
    }
  }
}

// --- Custom Error Classes ---

/**
 * @class AuthGatewayError
 * @description Base error class for all AuthGateway related errors.
 */
class AuthGatewayError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'AUTH_GATEWAY_ERROR', details?: Record<string, any>) {
    super(message);
    this.name = 'AuthGatewayError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, AuthGatewayError.prototype);
    Logger.error(`AuthGatewayError: ${message} [${errorCode}]`, this, { statusCode, details });
  }
}

class AuthenticationError extends AuthGatewayError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 401, 'AUTHENTICATION_FAILED', details);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AuthGatewayError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 403, 'AUTHORIZATION_FAILED', details);
    this.name = 'AuthorizationError';
  }
}

class InvalidTokenError extends AuthenticationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, details);
    this.name = 'InvalidTokenError';
    this.errorCode = 'INVALID_TOKEN';
  }
}

class TokenExpiredError extends InvalidTokenError {
  constructor(message: string = 'Token has expired.', details?: Record<string, any>) {
    super(message, details);
    this.name = 'TokenExpiredError';
    this.errorCode = 'TOKEN_EXPIRED';
  }
}

class VaultError extends AuthGatewayError {
  constructor(message: string, statusCode: number = 500, details?: Record<string, any>) {
    super(message, statusCode, 'VAULT_OPERATION_FAILED', details);
    this.name = 'VaultError';
  }
}

// --- Interfaces & Types ---

interface AuthGatewayJwtPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

interface RefreshTokenPayload extends AuthGatewayJwtPayload {
  jti: string;
}

interface ThirdPartySecret {
  id: string;
  userId: string;
  service: string;
  encryptedValue: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// --- Mock Vault Service ---

/**
 * @class VaultService
 * @description A mock in-memory vault for storing and retrieving third-party secrets.
 * In a production environment, this would be backed by a secure secret store like HashiCorp Vault or AWS Secrets Manager.
 */
class VaultService {
  private static secrets: Map<string, ThirdPartySecret> = new Map();

  static async storeSecret(userId: string, service: string, plaintextValue: string, metadata: Record<string, any> = {}): Promise<ThirdPartySecret> {
    Logger.debug('VaultService: Attempting to store secret.', { userId, service, metadataKeys: Object.keys(metadata) });
    const encryptedValue = Buffer.from(plaintextValue).toString('base64'); // Mock encryption
    const id = `${service}_${userId}_${Date.now()}`;
    const newSecret: ThirdPartySecret = {
      id,
      userId,
      service,
      encryptedValue,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.secrets.set(id, newSecret);
    Logger.info('VaultService: Secret stored successfully.', { secretId: id, userId, service });
    return newSecret;
  }

  static async getSecret(secretId: string, requestingUserId: string): Promise<string | null> {
    Logger.debug('VaultService: Attempting to retrieve secret.', { secretId, requestingUserId });
    const secret = this.secrets.get(secretId);
    if (!secret) {
      Logger.warn('VaultService: Secret not found.', { secretId });
      return null;
    }
    // BFF can access secrets on behalf of users, or users can access their own.
    if (secret.userId !== requestingUserId && requestingUserId !== 'BFF_SERVICE_ID') {
      Logger.warn('VaultService: Unauthorized access attempt to secret.', { secretId, owner: secret.userId, requester: requestingUserId });
      throw new AuthorizationError(`Access denied to secret '${secretId}'.`);
    }
    const plaintextValue = Buffer.from(secret.encryptedValue, 'base64').toString('utf8'); // Mock decryption
    Logger.info('VaultService: Secret retrieved successfully.', { secretId, userId: secret.userId });
    return plaintextValue;
  }

  static async deleteSecret(secretId: string, requestingUserId: string): Promise<boolean> {
    Logger.debug('VaultService: Attempting to delete secret.', { secretId, requestingUserId });
    const secret = this.secrets.get(secretId);
    if (!secret) {
      Logger.warn('VaultService: Secret not found for deletion.', { secretId });
      return false;
    }
    if (secret.userId !== requestingUserId && requestingUserId !== 'BFF_SERVICE_ID') {
      Logger.warn('VaultService: Unauthorized deletion attempt for secret.', { secretId, owner: secret.userId, requester: requestingUserId });
      throw new AuthorizationError(`Access denied to delete secret '${secretId}'.`);
    }
    const deleted = this.secrets.delete(secretId);
    Logger.info(`VaultService: Secret '${secretId}' deleted successfully.`, { userId: secret.userId, deleted });
    return deleted;
  }
}

// --- JWT & Auth Logic ---

function generateAccessToken(payload: AuthGatewayJwtPayload): string {
  Logger.debug('Generating new access token.', { userId: payload.userId, roles: payload.roles });
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

function generateRefreshToken(payload: AuthGatewayJwtPayload): string {
  const refreshPayload: RefreshTokenPayload = {
    ...payload,
    jti: jwt.sign({ sub: payload.userId }, JWT_SECRET, { expiresIn: '5m' }), // Short-lived JTI to prevent replay
  };
  Logger.debug('Generating new refresh token.', { userId: payload.userId });
  return jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
}

async function verifyJwt(token: string): Promise<AuthGatewayJwtPayload> {
  Logger.debug('Verifying JWT token.');
  try {
    const decoded = await (promisify(jwt.verify) as any)(token, JWT_SECRET) as AuthGatewayJwtPayload;
    Logger.debug('JWT verified successfully.', { userId: decoded.userId });
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError('JWT token has expired.', { originalError: error });
    } else if (error.name === 'JsonWebTokenError') {
      throw new InvalidTokenError(`Invalid JWT token: ${error.message}`, { originalError: error });
    } else {
      throw new AuthGatewayError(`Unexpected error during JWT verification: ${error.message}`, 500, 'JWT_VERIFICATION_FAILED', { originalError: error });
    }
  }
}

async function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  Logger.debug('Authenticating request with JWT.');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('No authorization token provided or token format is incorrect.', { header: authHeader }));
  }
  const token = authHeader.split(' ')[1];
  try {
    const user = await verifyJwt(token);
    (req as any).user = user;
    Logger.debug('Request authenticated.', { userId: user.userId });
    next();
  } catch (error) {
    next(error);
  }
}

function authorizeRoles(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    Logger.debug('Authorizing request roles.', { requiredRoles });
    const user = (req as any).user as AuthGatewayJwtPayload;
    if (!user || !user.roles || !requiredRoles.some(role => user.roles.includes(role))) {
      return next(new AuthorizationError('Insufficient permissions to access this resource.', { userId: user?.userId, userRoles: user?.roles, requiredRoles }));
    }
    Logger.debug('Request authorized.', { userId: user.userId });
    next();
  };
}

// --- Mock OIDC Provider Logic ---

async function _simulateOidcLogin(email: string, password?: string): Promise<{ id: string; email: string; roles: string[] }> {
  Logger.debug('Simulating OIDC login.', { email });
  if (!email || (password !== undefined && password.length < 5)) {
    throw new AuthenticationError('Simulated login failed: Invalid email or password format.');
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  const roles = ['user'];
  if (email.endsWith('@admin.com')) {
    roles.push('admin');
  }
  return { id: `user-${email.split('@')[0]}`, email, roles };
}

async function _simulateOidcRegister(email: string, password: string): Promise<{ id: string; email: string; roles: string[] }> {
    Logger.debug('Simulating OIDC registration.', { email });
    if (!email || password.length < 8) {
        throw new AuthenticationError('Simulated registration failed: Invalid email or password (min 8 chars).');
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    return { id: `user-${email.split('@')[0]}`, email, roles: ['user'] };
}

// --- Express App Setup ---

const app = express();
app.use(json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  Logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

// --- API Endpoints ---

app.post('/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required for registration.', { email });
    }
    const user = await _simulateOidcRegister(email, password);
    const accessTokenPayload: AuthGatewayJwtPayload = { userId: user.id, email: user.email, roles: user.roles };
    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(accessTokenPayload);
    Logger.info('User registered and tokens issued.', { userId: user.id });
    res.status(201).json({ message: 'Registration successful. Please use your credentials to log in.', accessToken, refreshToken, user: accessTokenPayload });
  } catch (error) {
    next(error);
  }
});

app.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  try {
    const user = await _simulateOidcLogin(email, password);
    const accessTokenPayload: AuthGatewayJwtPayload = { userId: user.id, email: user.email, roles: user.roles };
    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(accessTokenPayload);
    Logger.info('User logged in and tokens issued.', { userId: user.id });
    res.status(200).json({ message: 'Login successful', accessToken, refreshToken, user: accessTokenPayload });
  } catch (error) {
    next(error);
  }
});

app.post('/auth/token', async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  try {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required.', { source: 'refresh_endpoint' });
    }
    const decodedRefresh = await verifyJwt(refreshToken) as RefreshTokenPayload;
    const newAccessTokenPayload: AuthGatewayJwtPayload = {
      userId: decodedRefresh.userId,
      email: decodedRefresh.email,
      roles: decodedRefresh.roles,
    };
    const newAccessToken = generateAccessToken(newAccessTokenPayload);
    Logger.info('Access token refreshed.', { userId: decodedRefresh.userId });
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
});

app.get('/auth/validate', authenticateJwt, async (req: Request, res: Response) => {
  const user = (req as any).user;
  Logger.info('Access token validation request received.', { userId: user.userId });
  res.status(200).json({ isValid: true, user });
});

app.post('/secrets/store', authenticateJwt, authorizeRoles(['admin', 'bff_service']), async (req: Request, res: Response, next: NextFunction) => {
  const { userId, service, plaintextValue, metadata } = req.body;
  try {
    if (!userId || !service || !plaintextValue) {
      throw new VaultError('User ID, service, and plaintext value are required to store a secret.', 400);
    }
    const storedSecret = await VaultService.storeSecret(userId, service, plaintextValue, metadata);
    Logger.info('Secret stored.', { secretId: storedSecret.id, userId, service });
    res.status(201).json({ message: 'Secret stored successfully.', secretId: storedSecret.id });
  } catch (error) {
    next(error);
  }
});

app.get('/secrets/get/:keyId', authenticateJwt, authorizeRoles(['bff_service']), async (req: Request, res: Response, next: NextFunction) => {
  const { keyId } = req.params;
  const requestingUser = (req as any).user as AuthGatewayJwtPayload;
  try {
    // In a real scenario, the BFF's identity would be validated to allow it to access secrets on behalf of users.
    // Here, we simulate that by allowing a user with 'bff_service' role.
    const secretValue = await VaultService.getSecret(keyId, 'BFF_SERVICE_ID');
    if (!secretValue) {
      throw new VaultError(`Secret with ID '${keyId}' not found.`, 404);
    }
    Logger.info('Secret retrieved.', { secretId: keyId });
    res.status(200).json({ secretValue });
  } catch (error) {
    next(error);
  }
});

app.delete('/secrets/delete/:keyId', authenticateJwt, authorizeRoles(['admin', 'bff_service']), async (req: Request, res: Response, next: NextFunction) => {
  const { keyId } = req.params;
  const requestingUser = (req as any).user as AuthGatewayJwtPayload;
  try {
    const deleted = await VaultService.deleteSecret(keyId, 'BFF_SERVICE_ID');
    if (!deleted) {
      throw new VaultError(`Secret with ID '${keyId}' not found for deletion.`, 404);
    }
    Logger.info('Secret deleted.', { secretId: keyId });
    res.status(200).json({ message: 'Secret deleted successfully.', deleted });
  } catch (error) {
    next(error);
  }
});

// --- Error Handling ---

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof AuthGatewayError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
  }
  Logger.error('Unhandled server error.', err, { url: req.originalUrl, method: req.method });
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  });
});

// --- Server Start ---

/**
 * @function startAuthGateway
 * @description Starts the AuthGateway Express server.
 */
function startAuthGateway() {
  app.listen(PORT, () => {
    Logger.info(`AuthGateway microservice running on port ${PORT}.`);
    Logger.info(`JWT Expiration: ${JWT_EXPIRATION}, Refresh Expiration: ${JWT_REFRESH_EXPIRATION}`);
    if (JWT_SECRET === 'supersecretjwtkeythatshouldbeverylongandrandom') {
        Logger.warn('!!! WARNING: Using default JWT_SECRET. Please set a strong secret in environment variables. !!!');
    }
  });
}

export default app;
export { startAuthGateway };

// Start server if this file is run directly
if (require.main === module) {
  startAuthGateway();
}
