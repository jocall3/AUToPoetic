/**
 * Behold! The Grand Telemetry Oracle of Data Divination!
 * This comprehensive service replaces mere whispers in the console with a majestic chorus
 * of meticulously captured insights, guiding our digital quest for perfection.
 * It's not just logging; it's chronicling the very pulse of our application's existence!
 * With a flick of the wrist and a dash of wit, we unveil the mysteries of user journeys,
 * performance sagas, and the occasional digital dragon of error.
 */

// --- Configuration & Initialization ---

/**
 * A grand tapestry of options for our telemetry's mystical workings.
 * Configure the stage, the players, and the very essence of data flow.
 * Each setting is a spell, enhancing the Oracle's prophetic abilities.
 */
export interface TelemetryConfig {
  /** Should the Oracle speak? Controls the entire telemetry mechanism. Defaults to true. */
  isEnabled?: boolean;
  /** Initial user ID, if known from the start of the saga. */
  initialUserId?: string;
  /** Initial session ID, a unique marker for this journey. If not provided, one will be conjured. */
  initialSessionId?: string;
  /** A collection of backends, ready to receive the sacred data scrolls. */
  backends?: TelemetryBackend[];
  /**
   * Global context that accompanies every single piece of data.
   * Think of it as the ever-present narrative of our application's environment:
   * "Hear ye, hear ye! This event occurred on 'Web App v1.2' in the 'Production Realm'!"
   */
  globalContext?: Record<string, any>;
  /**
   * Maximum length for string values in payloads before they are truncated for brevity.
   * The Oracle prefers conciseness in its pronouncements, lest the scrolls become too lengthy.
   * Defaults to 500 characters.
   */
  maxPayloadStringLength?: number;
  /**
   * If true, performance metrics will only log failures, not successes.
   * Sometimes, only the dramatic falls are worth noting, the triumphs speak for themselves.
   * Defaults to false, for a balanced perspective of glories and woes.
   */
  logPerfFailuresOnly?: boolean;
  /**
   * If true, the telemetry system will log internal messages (e.g., session starts/ends)
   * to the console for debugging the Oracle itself. Defaults to false for silent operation.
   */
  logInternalMessages?: boolean;
}

/**
 * The sacred contract for any Telemetry Backend.
 * Each backend is a diligent scribe, translating our events into their chosen dialect,
 * whether it be a server scroll, an analytics crystal ball, or a simple console parchment.
 */
export interface TelemetryBackend {
  /** The unique name of this backend, for identification in the Grand Register of Scribes. */
  name: string;
  /** Sends a general event, a fleeting moment captured. */
  sendEvent(eventName: string, payload: Record<string, any>, commonContext: Record<string, any>): void;
  /** Records an error, a stumble on the path, with its accompanying woes. */
  sendError(error: Error, context: Record<string, any>, commonContext: Record<string, any>): void;
  /** Chronicles a performance metric, the swiftness or sloth of our operations. */
  sendPerformance(metricName: string, durationMs: number, success: boolean, context: Record<string, any>, commonContext: Record<string, any>): void;
  /** Optionally flushes any pending data, ensuring no scroll is left unsealed. */
  flush?(): Promise<void>;
}

// Our grand ensemble of data scribes, awaiting their marching orders.
let _telemetryBackends: TelemetryBackend[] = [];

// The core configuration of our telemetry empire.
let _config: TelemetryConfig = {
  isEnabled: true,
  maxPayloadStringLength: 500,
  logPerfFailuresOnly: false,
  globalContext: {},
  logInternalMessages: false,
};

// The unique identifier for the current user, a hero on their quest.
let _currentUserId: string | null = null;
// The unique identifier for the current session, an epic chapter unfolding.
let _currentSessionId: string | null = null;
// The time our current session began, for calculating its venerable age.
let _sessionStartTime: number | null = null;

/**
 * Bestows upon the Telemetry Oracle its initial wisdom and sets the stage for data collection.
 * This must be called before the Oracle can truly begin its pronouncements.
 * If not called, a default ConsoleTelemetryBackend will be registered,
 * ensuring at least a whisper of telemetry is always heard.
 * @param config The foundational truths and settings for the telemetry system.
 */
export const initializeTelemetry = (config: TelemetryConfig) => {
  _config = { ..._config, ...config };

  // Register any pre-configured backends
  if (config.backends && config.backends.length > 0) {
    _telemetryBackends = []; // Clear any default or previous backends
    config.backends.forEach(backend => registerBackend(backend));
  } else if (_telemetryBackends.length === 0) {
    // If no backends provided and none registered, provide a sensible default.
    // The ConsoleBackend, our trusty town crier, is always ready to announce.
    registerBackend(new ConsoleTelemetryBackend());
  }

  // Set initial user/session if provided
  if (config.initialUserId) {
    setUserId(config.initialUserId);
  }
  if (config.initialSessionId) {
    _currentSessionId = config.initialSessionId;
  } else if (!_currentSessionId) {
    // If no initial session ID, start a new one automatically.
    startSession();
  }

  // Announce the Oracle's awakening!
  logInternal('Telemetry Oracle has awakened!', {
    config: {
      isEnabled: _config.isEnabled,
      backends: _telemetryBackends.map(b => b.name),
      hasInitialUserId: !!_currentUserId,
      hasInitialSessionId: !!_currentSessionId,
    }
  }, 'log');
};

/**
 * Enlists a new Telemetry Backend into our noble service.
 * Once registered, it will receive all future data transmissions.
 * @param backend An instance of a TelemetryBackend, ready to serve.
 */
export const registerBackend = (backend: TelemetryBackend) => {
  if (!_telemetryBackends.some(b => b.name === backend.name)) {
    _telemetryBackends.push(backend);
    logInternal('Backend Registered with the Oracle.', { name: backend.name });
  } else {
    logInternal('Backend Already Registered. The Oracle already knows this scribe.', { name: backend.name }, 'warn');
  }
};

/**
 * Removes a Telemetry Backend from service.
 * The Oracle bids farewell to this particular scribe.
 * @param backendName The name of the backend to dismiss.
 */
export const unregisterBackend = (backendName: string) => {
  const initialLength = _telemetryBackends.length;
  _telemetryBackends = _telemetryBackends.filter(b => b.name !== backendName);
  if (_telemetryBackends.length < initialLength) {
    logInternal('Backend Unregistered from the Oracle.', { name: backendName });
  } else {
    logInternal('Backend Not Found for Unregistration. Perhaps this scribe was but a phantom?', { name: backendName }, 'warn');
  }
};


// --- Internal Utility & Sanitization ---

/**
 * Cleanses the data payload, ensuring it's fit for transmission
 * and doesn't overwhelm our delicate backend systems with overly verbose details.
 * Truncates long strings and recursively sanitizes nested objects.
 * @param payload The raw data to be sanctified.
 * @returns The purified data, ready for its journey.
 */
const sanitizePayload = (payload: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    const maxLen = _config.maxPayloadStringLength || 500;

    for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = payload[key];
            // If it's an Error object, we extract its useful properties for clarity.
            if (value instanceof Error) {
                sanitized[key] = {
                    name: value.name,
                    message: value.message,
                    stack: value.stack,
                    // Include other enumerable properties from the error object
                    ...Object.keys(value).reduce((acc, errKey) => {
                        if (typeof (value as any)[errKey] !== 'function') {
                            acc[errKey] = (value as any)[errKey];
                        }
                        return acc;
                    }, {} as Record<string, any>)
                };
            }
            // Truncate long strings to avoid polluting the console or data store (e.g., base64 data)
            else if (typeof value === 'string' && value.length > maxLen) {
                sanitized[key] = `${value.substring(0, Math.floor(maxLen / 5))}... (truncated, length: ${value.length})`,
            }
            // Recursively sanitize nested objects (excluding Dates)
            else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
                 sanitized[key] = sanitizePayload(value);
            }
            // For arrays, attempt to sanitize elements if they are objects
            else if (Array.isArray(value)) {
                sanitized[key] = value.map(item =>
                    (typeof item === 'object' && item !== null && !(item instanceof Date)) ? sanitizePayload(item) : item
                );
            }
            else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
};

/**
 * Retrieves the common context that accompanies every data point.
 * This includes user, session, and global context, providing a rich narrative for each event.
 * @returns An object containing the current user, session, and global context.
 */
const _getCommonContext = (): Record<string, any> => {
  return {
    ..._config.globalContext,
    sessionId: _currentSessionId,
    userId: _currentUserId,
    sessionDurationMs: _sessionStartTime ? performance.now() - _sessionStartTime : undefined,
    timestamp: new Date().toISOString(),
  };
};

/**
 * The inner workings of our Oracle, sending data to all registered backends.
 * It ensures every scribe receives the message, irrespective of their native tongue.
 * @param method The method name on the TelemetryBackend interface to invoke.
 * @param args The arguments to pass to the backend method.
 */
const _sendToBackends = (method: keyof TelemetryBackend, ...args: any[]) => {
  if (!_config.isEnabled) return;

  _telemetryBackends.forEach(backend => {
    try {
      const backendMethod = backend[method] as Function;
      if (typeof backendMethod === 'function') {
        backendMethod.apply(backend, args);
      }
    } catch (backendError: any) {
      console.error(
        `%c[TELEMETRY ORACLE BACKEND ERROR]%c The scribe '${backend.name}' faltered while processing '${String(method)}'!`,
        'color: #f87171; font-weight: bold;',
        'color: inherit;',
        { backendError, originalArgs: args }
      );
    }
  });
};

/**
 * Logs internal telemetry messages, separate from application events.
 * Useful for debugging the telemetry system itself, akin to the Oracle
 * checking its own pulse to ensure its wisdom flows unimpeded.
 */
const logInternal = (message: string, payload: Record<string, any> = {}, level: 'log' | 'warn' | 'error' = 'log') => {
  if (!_config.logInternalMessages) return;

  const commonContext = _getCommonContext();
  const fullPayload = sanitizePayload({ ...payload, commonContext });

  const prefix = level === 'error' ? 'ERROR' : (level === 'warn' ? 'WARN' : 'INFO');
  const color = level === 'error' ? '#ef4444' : (level === 'warn' ? '#f97316' : '#a78bfa');

  console[level](
    `%c[TELEMETRY ORACLE - ${prefix}]%c ${message}`,
    `color: ${color}; font-weight: bold;`,
    'color: inherit;',
    fullPayload
  );
};


// --- User & Session Management ---

/**
 * Initiates a new user session, marking a fresh chapter in the user's journey.
 * A new session ID is generated if one isn't already active.
 * @param newSessionId Optional. A specific ID for the new session. If not provided, a UUID will be generated.
 */
export const startSession = (newSessionId?: string) => {
  if (!_config.isEnabled) return;

  if (_currentSessionId) {
    logInternal('Existing session found. The Oracle notes its conclusion before a new saga begins.', { previousSessionId: _currentSessionId });
    endSession(); // Ensure previous session is formally ended.
  }

  _currentSessionId = newSessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  _sessionStartTime = performance.now();
  trackEvent('session_started', { sessionId: _currentSessionId, userId: _currentUserId });
  logInternal('New Session Started! A fresh scroll is unrolled.', { sessionId: _currentSessionId, userId: _currentUserId });
};

/**
 * Concludes the current user session, marking the end of a chapter.
 * Any pending data might be flushed at this point, ensuring all tales are told.
 */
export const endSession = async () => {
  if (!_config.isEnabled || !_currentSessionId) {
    logInternal('No active session to end or telemetry disabled. The Oracle sees no active chapter to conclude.', {}, 'warn');
    return;
  }

  const duration = _sessionStartTime ? performance.now() - _sessionStartTime : 0;
  trackEvent('session_ended', { sessionId: _currentSessionId, userId: _currentUserId, durationMs: duration });
  logInternal('Session Ended. The scroll is rolled, the chapter complete.', { sessionId: _currentSessionId, userId: _currentUserId, durationMs: duration });

  _currentSessionId = null;
  _sessionStartTime = null;

  // Flush data from backends if they support it, ensuring no data is left unchronicled.
  await Promise.all(_telemetryBackends.filter(b => b.flush).map(b => b.flush!()));
};

/**
 * Establishes the identity of the user, a crucial figure in our digital saga.
 * @param userId The unique identifier for the user. Passing null will anonymize the user.
 */
export const setUserId = (userId: string | null) => {
  if (!_config.isEnabled) return;

  const previousUserId = _currentUserId;
  if (previousUserId !== userId) {
    _currentUserId = userId;
    trackEvent('user_identified', { previousUserId, currentUserId: _currentUserId });
    logInternal(`User ID Set. A new hero (${_currentUserId || 'anonymized'}) enters the Oracle's sight.`, { previousUserId, currentUserId: _currentUserId });
  }
};

/**
 * Updates the current session ID, useful for continuity across pages or tabs,
 * or when merging sessions.
 * @param sessionId The new session ID to use. Passing null will clear the session.
 */
export const setSessionId = (sessionId: string | null) => {
  if (!_config.isEnabled) return;

  const previousSessionId = _currentSessionId;
  if (previousSessionId !== sessionId) {
    _currentSessionId = sessionId;
    trackEvent('session_id_updated', { previousSessionId, currentSessionId: _currentSessionId });
    logInternal(`Session ID Updated. The Oracle shifts its focus to a new chapter (${_currentSessionId || 'cleared'}).`, { previousSessionId, currentSessionId: _currentSessionId });
  }
};


// --- Core Telemetry Functions ---

/**
 * Records a general application event, a significant happening in our digital realm.
 * The Oracle observes all, from button clicks to the loading of grand vistas.
 * @param eventName The name of the event, a concise description (e.g., 'user_login', 'item_added_to_cart').
 * @param payload Additional data detailing the event's circumstances.
 */
export const trackEvent = (eventName: string, payload: Record<string, any> = {}) => {
  if (!_config.isEnabled) return;

  const commonContext = _getCommonContext();
  const sanitizedPayload = sanitizePayload(payload);
  _sendToBackends('sendEvent', eventName, sanitizedPayload, commonContext);
};

/**
 * Captures an error, a glitch in the matrix, with all its surrounding context.
 * When the digital dragon roars, the Oracle takes note.
 * @param error The error object itself, the very essence of the digital ailment.
 * @param context Additional information to shed light on the error's origins and impact.
 */
export const captureError = (error: Error, context: Record<string, any> = {}) => {
  if (!_config.isEnabled) return;

  const commonContext = _getCommonContext();
  const sanitizedContext = sanitizePayload(context);
  _sendToBackends('sendError', error, sanitizedContext, commonContext);
};

/**
 * Measures the performance of an asynchronous or synchronous operation,
 * clocking the swiftness or sloth of our code. The Oracle notes whether
 * the task was a sprint or a leisurely stroll.
 * @param metricName The name of the performance metric being observed (e.g., 'api_call_duration', 'render_time').
 * @param operation The function whose execution time is to be measured. Can return a Promise or a direct value.
 * @param context Additional context related to the operation (e.g., 'api_endpoint', 'component_name').
 * @returns The result of the operation.
 */
export const measureOperation = async <T>(
  metricName: string,
  operation: () => Promise<T> | T,
  context: Record<string, any> = {}
): Promise<T> => {
  if (!_config.isEnabled) {
    // If telemetry is disabled, simply run the operation without measuring.
    return await Promise.resolve(operation());
  }

  const start = performance.now();
  let success = false;
  let result: T;
  let capturedError: Error | undefined;

  try {
    result = await Promise.resolve(operation()); // Ensure operation is awaited if it returns a promise
    success = true;
    return result;
  } catch (error: any) {
    capturedError = error;
    // Capture the error using our dedicated error logging system, not just a console log
    captureError(error, { ...context, metricName, operation_type: 'measureOperation', success: false });
    throw error; // Re-throw the error to ensure original control flow is maintained
  } finally {
    const end = performance.now();
    const duration = end - start;
    const commonContext = _getCommonContext();
    const sanitizedContext = sanitizePayload({ ...context, error: capturedError, success, operation_type: 'measureOperation' });

    if (success || !_config.logPerfFailuresOnly) {
      _sendToBackends('sendPerformance', metricName, duration, success, sanitizedContext, commonContext);
    }
  }
};

/**
 * Tracks a page view event, noting when a user gazes upon a new digital vista.
 * Each scroll to a new page is a new scene in their journey.
 * @param path The path of the viewed page (e.g., '/dashboard/settings', '/products/123').
 * @param payload Additional context about the page view (e.g., 'page_title', 'referrer').
 */
export const trackPageView = (path: string, payload: Record<string, any> = {}) => {
  trackEvent('page_view', { path, ...payload });
};

/**
 * Chronicles a specific user activity, a deed performed by our valiant user.
 * From the smallest interaction to the grandest quest completion.
 * @param activityType The type of activity (e.g., 'button_click', 'form_submit', 'item_favorited').
 * @param payload Additional details about the activity (e.g., 'button_id', 'form_name', 'item_sku').
 */
export const trackUserActivity = (activityType: string, payload: Record<string, any> = {}) => {
  trackEvent(`user_activity_${activityType}`, payload);
};

/**
 * Sends a custom metric, perhaps a rare or specialized data point not fitting
 * into the standard event structure. The Oracle is always keen for unique insights.
 * @param metricName The name of the custom metric (e.g., 'cpu_usage_percentage', 'memory_allocated_mb').
 * @param value The numerical value of the metric.
 * @param payload Additional context for the metric (e.g., 'threshold_exceeded', 'source_module').
 */
export const trackCustomMetric = (metricName: string, value: number, payload: Record<string, any> = {}) => {
  trackEvent('custom_metric', { metricName, value, ...payload });
};

// --- Default Backend (The Trusty Town Crier) ---

/**
 * The Console Telemetry Backend: Our trusty town crier, announcing all events
 * directly to the console with vibrant colors and clear pronouncements.
 * This is the default scribe if no other sophisticated chroniclers are employed,
 * ensuring the Oracle's wisdom is always heard, even if just by developers.
 */
export class ConsoleTelemetryBackend implements TelemetryBackend {
  public name: string = 'Console';

  sendEvent(eventName: string, payload: Record<string, any>, commonContext: Record<string, any>): void {
    console.log(
      `%c[ORACLE EVENT]%c ${eventName}`,
      'color: #84cc16; font-weight: bold;',
      'color: inherit;',
      { payload, commonContext }
    );
  }

  sendError(error: Error, context: Record<string, any>, commonContext: Record<string, any>): void {
    console.error(
      `%c[ORACLE ERROR]%c ${error.message}`,
      'color: #ef4444; font-weight: bold;',
      'color: inherit;',
      { error, context, commonContext, stack: error.stack }
    );
  }

  sendPerformance(metricName: string, durationMs: number, success: boolean, context: Record<string, any>, commonContext: Record<string, any>): void {
    const color = success ? '#3b82f6' : '#f97316';
    const status = success ? 'SUCCESS' : 'FAILED';
    console[success ? 'log' : 'warn'](
      `%c[ORACLE PERF ${status}]%c ${metricName}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;',
      { duration: `${durationMs.toFixed(2)}ms`, context, commonContext }
    );
  }

  async flush(): Promise<void> {
    // For console, flushing is a mere formality, as data is instantly displayed.
    // The town crier's announcements are heard in real-time!
    logInternal('Console Backend Flush (instantaneous)', {}, 'log');
  }
}

// Automatically initialize with a ConsoleBackend if no backends have been registered.
// This ensures that even without `initializeTelemetry` being called explicitly,
// events can be observed via the console, offering a rudimentary safety net.
// However, for advanced configuration and session management, `initializeTelemetry` is highly recommended.
if (_telemetryBackends.length === 0) {
    _telemetryBackends.push(new ConsoleTelemetryBackend());
    logInternal('Default ConsoleTelemetryBackend activated. The Oracle speaks through the command line!', {}, 'log');
}
