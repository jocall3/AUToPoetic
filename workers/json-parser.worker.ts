/**
 * @file This Web Worker is dedicated to offloading computationally intensive JSON parsing
 *       from the main thread, enhancing UI responsiveness and overall application performance.
 *       It listens for JSON strings, parses them, and posts the result back.
 */

/**
 * Type definition for messages received by the JSON parsing worker.
 * @interface JsonWorkerInput
 * @property {string} jsonString The JSON string to be parsed.
 * @property {string} [requestId] An optional unique identifier for the request,
 *                                 allowing the main thread to correlate responses.
 */
interface JsonWorkerInput {
  jsonString: string;
  requestId?: string;
}

/**
 * Type definition for messages posted back by the JSON parsing worker.
 * @interface JsonWorkerOutput
 * @property {any | null} parsedData The parsed JSON object if successful, otherwise `null`.
 * @property {string | null} error An error message if parsing failed, otherwise `null`.
 * @property {string} [requestId] The original request ID, echoed back for correlation.
 */
interface JsonWorkerOutput {
  parsedData: any | null;
  error: string | null;
  requestId?: string;
}

/**
 * Event listener for messages sent to the Web Worker.
 * When the main thread sends a message containing a JSON string, this listener
 * attempts to parse the string and sends the result (parsed data or an error)
 * back to the main thread.
 * @param {MessageEvent} event The message event containing data from the main thread.
 * @listens {MessageEvent}
 * @performance Parsing JSON, especially large strings, can be CPU-intensive.
 *            Offloading to a Web Worker prevents blocking the main thread,
 *            improving UI responsiveness.
 * @security This worker only processes data sent directly to it and does not access
 *           any external resources or global objects beyond basic JavaScript functions.
 *           Input validation is performed to prevent unexpected behavior.
 */
self.onmessage = (event: MessageEvent<JsonWorkerInput>) => {
  const { jsonString, requestId } = event.data;

  /**
   * Represents the response object to be sent back to the main thread.
   * @type {JsonWorkerOutput}
   */
  let response: JsonWorkerOutput;

  /**
   * Logs a message to the worker's console (which can be viewed in browser dev tools).
   * @param {string} message The message to log.
   * @param {any[]} [args] Additional arguments to log.
   */
  const logWorkerMessage = (message: string, ...args: any[]): void => {
    // In a production environment, this might integrate with a dedicated worker telemetry service.
    // For now, simple console logging is sufficient for demonstration and debugging.
    console.log(`[JSON_PARSER_WORKER] ${message}`, ...args);
  };

  if (typeof jsonString !== 'string') {
    response = {
      parsedData: null,
      error: 'Invalid input: jsonString must be a string.',
      requestId,
    };
    logWorkerMessage('Received non-string input.', { type: typeof jsonString, requestId });
  } else if (jsonString.trim() === '') {
    response = {
      parsedData: null,
      error: 'Invalid input: jsonString cannot be empty.',
      requestId,
    };
    logWorkerMessage('Received empty JSON string.', { requestId });
  } else {
    try {
      /**
       * The result of the JSON parsing operation.
       * @type {any}
       */
      const parsed = JSON.parse(jsonString);
      response = {
        parsedData: parsed,
        error: null,
        requestId,
      };
      logWorkerMessage('Successfully parsed JSON.', { requestId, dataLength: jsonString.length });
    } catch (e: any) {
      response = {
        parsedData: null,
        error: `JSON parsing failed: ${e.message}`,
        requestId,
      };
      logWorkerMessage('JSON parsing failed.', { requestId, errorMessage: e.message, dataLength: jsonString.length });
    }
  }

  // Post the response back to the main thread.
  self.postMessage(response);
};

// Add a simple initialization log for the worker.
logWorkerMessage('JSON Parsing Web Worker initialized and ready to receive messages.');
