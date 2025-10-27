/**
 * @file This module provides a comprehensive, pluggable telemetry service.
 * @module services/telemetryService
 * @description
 * This service is responsible for collecting, sanitizing, and dispatching telemetry data
 * such as events, errors, and performance metrics. It is designed to be the central
 * point for all observability within the application. It supports multiple backends
 * (e.g., console, HTTP endpoint) and enriches all data with common context like
 * user and session IDs.
 *
 * It replaces a simpler, console-only implementation with a more robust,
 * class-based, and extensible architecture, aligning with modern observability practices.
 */

// --- Types and Interfaces ---

/**
 * Defines the severity levels for log events.
 * @enum {string}
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

/**
 * Configuration options for initializing the telemetry service.
 * @interface TelemetryConfig
 */
export interface TelemetryConfig {
    /**
     * Globally enables or disables the telemetry service. Defaults to `true`.
     * @type {boolean}
     * @default true
     */
    isEnabled?: boolean;
    /**
     * An initial user ID to associate with all telemetry events.
     * @type {string | null}
     * @default null
     */
    initialUserId?: string | null;
    /**
     * An initial session ID. If not provided, one will be generated automatically.
     * @type {string | null}
     * @default null
     */
    initialSessionId?: string | null;
    /**
     * An array of telemetry backend instances to which data will be sent.
     * If not provided, a default `ConsoleTelemetryBackend` will be used.
     * @type {TelemetryBackend[]}
     */
    backends?: TelemetryBackend[];
    /**
     * A record of global context attributes to be included with every telemetry event.
     * Useful for application version, environment, etc.
     * @type {Record<string, any>}
     * @example { appVersion: '1.2.3', environment: 'production' }
     */
    globalContext?: Record<string, any>;
    /**
     * The maximum length for string values in payloads before they are truncated.
     * Prevents overly large payloads from being sent. Defaults to 500.
     * @type {number}
     * @default 500
     */
    maxPayloadStringLength?: number;
    /**
     * If `true`, performance metrics will only be sent for failed operations. Defaults to `false`.
     * @type {boolean}
     * @default false
     */
    logPerfFailuresOnly?: boolean;
    /**
     * If `true`, the service will log its own internal messages (e.g., session start/end) to the console.
     * Useful for debugging the telemetry system itself. Defaults to `false`.
     * @type {boolean}
     * @default false
     */
    logInternalMessages?: boolean;
}

/**
 * Defines the contract for a telemetry backend. Each backend is responsible for
 * sending telemetry data to a specific destination (e.g., console, HTTP endpoint).
 * @interface TelemetryBackend
 * @see ConsoleTelemetryBackend
 */
export interface TelemetryBackend {
    /** The unique name of the backend for identification. */
    name: string;
    /**
     * Sends a general event to the backend destination.
     * @param {string} eventName - The name of the event.
     * @param {Record<string, any>} payload - The specific data associated with the event.
     * @param {Record<string, any>} commonContext - The common context (user, session, etc.) for all events.
     */
    sendEvent(eventName: string, payload: Record<string, any>, commonContext: Record<string, any>): void;
    /**
     * Sends an error to the backend destination.
     * @param {Error} error - The error object.
     * @param {Record<string, any>} context - Additional context about the error.
     * @param {Record<string, any>} commonContext - The common context.
     */
    sendError(error: Error, context: Record<string, any>, commonContext: Record<string, any>): void;
    /**
     * Sends a performance metric to the backend destination.
     * @param {string} metricName - The name of the performance metric.
     * @param {number} durationMs - The duration of the operation in milliseconds.
     * @param {boolean} success - Whether the operation was successful.
     * @param {Record<string, any>} context - Additional context about the operation.
     * @param {Record<string, any>} commonContext - The common context.
     */
    sendPerformance(metricName: string, durationMs: number, success: boolean, context: Record<string, any>, commonContext: Record<string, any>): void;
    /**
     * Optional method to flush any buffered data. Useful for ensuring all data is sent before
     * the application closes.
     * @returns {Promise<void>}
     */
    flush?(): Promise<void>;
}


// --- Module-level State (Singleton Pattern) ---

let _config: Required<TelemetryConfig> = {
  isEnabled: true,
  initialUserId: null,
  initialSessionId: null,
  backends: [],
  globalContext: {},
  maxPayloadStringLength: 500,
  logPerfFailuresOnly: false,
  logInternalMessages: false,
};

let _currentUserId: string | null = null;
let _currentSessionId: string | null = null;
let _sessionStartTime: number | null = null;

// --- Private Helper Functions ---

/**
 * Logs internal telemetry messages to the console if `logInternalMessages` is enabled.
 * @private
 * @param {string} message - The internal message to log.
 * @param {Record<string, any>} [payload={}] - Additional data for the internal log.
 * @param {'log' | 'warn' | 'error'} [level='log'] - The console log level to use.
 */
function _logInternal(message: string, payload: Record<string, any> = {}, level: 'log' | 'warn' | 'error' = 'log') {
  if (!_config.logInternalMessages) return;
  console[level](`%c[TELEMETRY INTERNAL]%c ${message}`, 'color: #a78bfa; font-weight: bold;', 'color: inherit;', payload);
}

/**
 * Generates a UUID v4 for session IDs.
 * @private
 * @returns {string} A new UUID string.
 */
function _generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Sanitizes a payload by truncating long strings and handling Error objects.
 * Prevents overly large or problematic data from being sent to backends.
 * @private
 * @param {Record<string, any>} payload - The raw data payload.
 * @returns {Record<string, any>} The sanitized payload.
 * @performance
 * This function recursively traverses object properties. For very deep or large objects,
 * it could introduce a small overhead. It's designed to be efficient for typical event payloads.
 * @security
 * This function helps prevent log injection or overly verbose data leakage by truncating
 * long strings, but it does not sanitize against malicious content (e.g., XSS).
 * Sanitization should occur at the data source if necessary.
 */
const _sanitizePayload = (payload: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = payload[key];
            if (value instanceof Error) {
                sanitized[key] = { name: value.name, message: value.message, stack: value.stack };
            } else if (typeof value === 'string' && value.length > _config.maxPayloadStringLength) {
                sanitized[key] = `${value.substring(0, _config.maxPayloadStringLength)}... (truncated)`;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                sanitized[key] = _sanitizePayload(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
};

/**
 * Gathers the common context to be included with every telemetry event.
 * @private
 * @returns {Record<string, any>} An object with common contextual data.
 */
const _getCommonContext = (): Record<string, any> => {
  return {
    ..._config.globalContext,
    sessionId: _currentSessionId,
    userId: _currentUserId,
    sessionDurationMs: _sessionStartTime ? performance.now() - _sessionStartTime : undefined,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
};

/**
 * Dispatches a telemetry call to all registered backends.
 * @private
 * @param {keyof TelemetryBackend} method - The method to call on each backend.
 * @param {any[]} args - The arguments to pass to the backend method.
 */
const _sendToBackends = (method: keyof TelemetryBackend, ...args: any[]) => {
  if (!_config.isEnabled) return;

  _config.backends.forEach(backend => {
    try {
      const backendMethod = backend[method] as Function;
      if (typeof backendMethod === 'function') {
        backendMethod.apply(backend, args);
      }
    } catch (backendError) {
      console.error(`Telemetry backend '${backend.name}' failed while processing '${String(method)}'.`, { backendError, originalArgs: args });
    }
  });
};

// --- Public API ---

/**
 * Initializes the telemetry service with the given configuration. This should be
 * called once when the application starts.
 * @public
 * @param {TelemetryConfig} [config={}] - The configuration for the service.
 * @example
 * initializeTelemetry({
 *   isEnabled: process.env.NODE_ENV === 'production',
 *   initialUserId: 'user-123',
 *   globalContext: { appVersion: '2.0.1' },
 *   backends: [new ConsoleTelemetryBackend(), new HttpTelemetryBackend('https://my-telemetry-endpoint.com/log')]
 * });
 */
export const initializeTelemetry = (config: TelemetryConfig = {}) => {
  _config = { ..._config, ...config, backends: config.backends || _config.backends };

  if (_config.backends.length === 0) {
    _config.backends.push(new ConsoleTelemetryBackend());
    _logInternal('No backends provided. Defaulting to ConsoleTelemetryBackend.');
  }

  if (config.initialUserId) {
    setUserId(config.initialUserId);
  }
  if (config.initialSessionId) {
    _currentSessionId = config.initialSessionId;
  } else if (!_currentSessionId) {
    startSession();
  }

  _logInternal('Telemetry service initialized.', { config: { ..._config, backends: _config.backends.map(b => b.name) } });
};

/**
 * Starts a new user session for tracking telemetry events.
 * A new session ID is generated if one is not provided.
 * @public
 * @param {string} [newSessionId] - An optional specific ID for the new session.
 */
export const startSession = (newSessionId?: string) => {
  if (!_config.isEnabled) return;
  if (_currentSessionId) {
    endSession();
  }
  _currentSessionId = newSessionId || _generateUuid();
  _sessionStartTime = performance.now();
  logEvent('session_started', { sessionId: _currentSessionId, userId: _currentUserId });
  _logInternal('Session started.', { sessionId: _currentSessionId });
};

/**
 * Ends the current user session.
 * @public
 */
export const endSession = () => {
  if (!_config.isEnabled || !_currentSessionId) return;
  const duration = _sessionStartTime ? performance.now() - _sessionStartTime : 0;
  logEvent('session_ended', { sessionId: _currentSessionId, userId: _currentUserId, durationMs: duration });
  _logInternal('Session ended.', { sessionId: _currentSessionId, durationMs: duration });
  _currentSessionId = null;
  _sessionStartTime = null;
};

/**
 * Sets the user ID for the current session, associating all subsequent events with this user.
 * @public
 * @param {string | null} userId - The unique identifier for the user. Pass `null` to anonymize.
 */
export const setUserId = (userId: string | null) => {
  if (!_config.isEnabled) return;
  const previousUserId = _currentUserId;
  if (previousUserId !== userId) {
    _currentUserId = userId;
    logEvent('user_identified', { previousUserId, currentUserId: _currentUserId });
    _logInternal('User ID set.', { userId: _currentUserId });
  }
};

/**
 * Logs a general application event.
 * @public
 * @param {string} eventName - A descriptive name for the event (e.g., 'user_login', 'file_downloaded').
 * @param {Record<string, any>} [payload={}] - A payload of key-value pairs with additional data about the event.
 * @example
 * logEvent('file_downloaded', { fileId: 'doc-abc', size: 1024 });
 */
export const logEvent = (eventName: string, payload: Record<string, any> = {}) => {
  if (!_config.isEnabled) return;
  const commonContext = _getCommonContext();
  const sanitizedPayload = _sanitizePayload(payload);
  _sendToBackends('sendEvent', eventName, sanitizedPayload, commonContext);
};

/**
 * Logs an error that occurred in the application.
 * @public
 * @param {Error} error - The `Error` object that was caught.
 * @param {Record<string, any>} [context={}] - Additional context to help diagnose the error.
 * @example
 * try {
 *   // ... some failing code
 * } catch (e) {
 *   logError(e as Error, { component: 'FileUpload', stage: 'processing' });
 * }
 */
export const logError = (error: Error, context: Record<string, any> = {}) => {
  if (!_config.isEnabled) return;
  const commonContext = _getCommonContext();
  const sanitizedContext = _sanitizePayload(context);
  _sendToBackends('sendError', error, sanitizedContext, commonContext);
};

/**
 * Measures the execution time of a synchronous or asynchronous operation.
 * @public
 * @template T
 * @param {string} metricName - A descriptive name for the operation being measured (e.g., 'api_call_duration').
 * @param {() => Promise<T> | T} operation - The function to execute and measure.
 * @param {Record<string, any>} [context={}] - Additional context for the performance metric.
 * @returns {Promise<T>} The result of the operation.
 * @performance
 * Adds minimal overhead to the measured operation, primarily from `performance.now()` calls.
 * The overhead is negligible for most operations.
 * @example
 * const user = await measurePerformance('api.fetchUser', () => fetch('/api/user/123').then(res => res.json()));
 */
export const measurePerformance = async <T>(
  metricName: string,
  operation: () => Promise<T> | T,
  context: Record<string, any> = {}
): Promise<T> => {
  if (!_config.isEnabled) {
    return await Promise.resolve(operation());
  }

  const start = performance.now();
  let success = false;
  try {
    const result = await Promise.resolve(operation());
    success = true;
    return result;
  } finally {
    const end = performance.now();
    const duration = end - start;
    if (success || !_config.logPerfFailuresOnly) {
        const commonContext = _getCommonContext();
        const sanitizedContext = _sanitizePayload(context);
        _sendToBackends('sendPerformance', metricName, duration, success, sanitizedContext, commonContext);
    }
  }
};


// --- Default Backend Implementation ---

/**
 * A default telemetry backend that logs all data to the browser's console.
 * This is useful for development and as a fallback if no other backends are configured.
 * @class ConsoleTelemetryBackend
 * @implements {TelemetryBackend}
 */
export class ConsoleTelemetryBackend implements TelemetryBackend {
    public name: string = 'Console';

    /**
     * @inheritdoc
     */
    sendEvent(eventName: string, payload: Record<string, any>, commonContext: Record<string, any>): void {
        console.log(
            `%c[EVENT]%c ${eventName}`,
            'color: #84cc16; font-weight: bold;',
            'color: inherit;',
            { payload, commonContext }
        );
    }

    /**
     * @inheritdoc
     */
    sendError(error: Error, context: Record<string, any>, commonContext: Record<string, any>): void {
        console.error(
            `%c[ERROR]%c ${error.message}`,
            'color: #ef4444; font-weight: bold;',
            'color: inherit;',
            { error, context, commonContext }
        );
    }

    /**
     * @inheritdoc
     */
    sendPerformance(metricName: string, durationMs: number, success: boolean, context: Record<string, any>, commonContext: Record<string, any>): void {
        const color = success ? '#3b82f6' : '#f97316';
        const status = success ? 'SUCCESS' : 'FAILED';
        console[success ? 'info' : 'warn'](
            `%c[PERF ${status}]%c ${metricName}`,
            `color: ${color}; font-weight: bold;`,
            'color: inherit;',
            { duration: `${durationMs.toFixed(2)}ms`, context, commonContext }
        );
    }

    /**
     * @inheritdoc
     */
    async flush(): Promise<void> {
        // Console logging is immediate, so flush is a no-op.
        _logInternal('ConsoleBackend flushed (no-op).');
        return Promise.resolve();
    }
}
