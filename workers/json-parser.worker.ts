/**
 * @file This Web Worker is dedicated to offloading computationally intensive JSON parsing
 * from the main thread. It conforms to the protocol expected by the WorkerPoolManager,
 * handling 'PARSE_JSON' tasks and ensuring UI responsiveness.
 * @module workers/json-parser
 * @see {services/worker/workerPoolManager.ts} for the manager that consumes this worker.
 */

// --- Type Definitions for Worker Communication ---

/**
 * @interface WorkerTask
 * @description The expected structure of an incoming task message from the WorkerPoolManager.
 * @template T - The type of the payload.
 */
interface WorkerTask<T = any> {
  /** The unique identifier for the task. */
  id: string;
  /** The type of task to be performed (e.g., 'PARSE_JSON'). */
  type: string;
  /** The data required for the task. */
  payload: T;
}

/**
 * @interface WorkerResponse
 * @description The structure of a response message sent back to the WorkerPoolManager.
 * @template R - The type of the result.
 */
interface WorkerResponse<R = any> {
  /** The unique identifier of the task this response corresponds to. */
  taskId: string;
  /** The result of the successful computation. */
  result?: R;
  /** An error object if the task failed. */
  error?: { message: string; stack?: string };
}

/**
 * @interface ParseJsonPayload
 * @description The specific payload expected for a 'PARSE_JSON' task.
 */
interface ParseJsonPayload {
  jsonString: string;
}

// --- Worker Implementation ---

/**
 * Logs a message to the worker's console for debugging purposes.
 * @param {string} message The message to log.
 * @param {any[]} [args] Additional arguments to log.
 */
const log = (message: string, ...args: any[]): void => {
  console.log(`[JSON_PARSER_WORKER] ${new Date().toISOString()}: ${message}`, ...args);
};

/**
 * Main message handler for the worker.
 * Listens for 'PARSE_JSON' tasks, processes them, and posts the result or an error back to the main thread.
 * @param {MessageEvent<WorkerTask<ParseJsonPayload>>} event The incoming message event from the main thread.
 * @listens MessageEvent
 */
self.onmessage = (event: MessageEvent<WorkerTask<ParseJsonPayload>>) => {
  const { id: taskId, type, payload } = event.data;

  if (type !== 'PARSE_JSON') {
    const errorResponse: WorkerResponse = {
      taskId,
      error: { message: `Unknown task type received: '${type}'. This worker only handles 'PARSE_JSON'.` },
    };
    log(`Error: Received unknown task type '${type}' for task ID ${taskId}.`);
    self.postMessage(errorResponse);
    return;
  }

  const { jsonString } = payload;

  if (typeof jsonString !== 'string') {
    const errorResponse: WorkerResponse = {
      taskId,
      error: { message: 'Invalid payload: jsonString must be a string.' },
    };
    log(`Error: Invalid payload for task ID ${taskId}. Input was not a string.`, { type: typeof jsonString });
    self.postMessage(errorResponse);
    return;
  }

  if (jsonString.trim() === '') {
    // For empty strings, we can either error or return a specific result like null.
    // Returning null is often more useful than an error for empty inputs.
    const successResponse: WorkerResponse<null> = {
      taskId,
      result: null,
    };
    log(`Parsed empty JSON string for task ID ${taskId} as null.`);
    self.postMessage(successResponse);
    return;
  }

  try {
    const parsedData = JSON.parse(jsonString);
    const successResponse: WorkerResponse<any> = {
      taskId,
      result: parsedData,
    };
    log(`Successfully parsed JSON for task ID ${taskId}.`, { dataLength: jsonString.length });
    self.postMessage(successResponse);
  } catch (e: any) {
    const errorResponse: WorkerResponse = {
      taskId,
      error: {
        message: `JSON parsing failed: ${e.message}`,
        stack: e.stack,
      },
    };
    log(`Error: JSON parsing failed for task ID ${taskId}.`, { errorMessage: e.message });
    self.postMessage(errorResponse);
  }
};

log('JSON Parsing Worker initialized and ready for tasks.');
