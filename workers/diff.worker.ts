/**
 * @file Web Worker for performing code diffing computations.
 * This worker offloads the potentially intensive task of calculating
 * the difference between two large code snippets from the main thread,
 * ensuring UI responsiveness. It utilizes the 'diff' library to generate
 * line-by-line differences.
 */

// Import the 'diff' library. In a Vite setup, direct imports often work for workers.
import * as Diff from 'diff';

/**
 * @interface DiffWorkerInput
 * @description Defines the structure of messages expected by the diffing worker.
 * @property {string} oldCode The original code snippet.
 * @property {string} newCode The modified code snippet.
 * @property {string} [requestId] An optional unique identifier to correlate the request with its response.
 */
interface DiffWorkerInput {
  oldCode: string;
  newCode: string;
  requestId?: string;
}

/**
 * @interface DiffWorkerOutput
 * @description Defines the structure of messages posted back by the diffing worker.
 * @property {'diffResult' | 'diffError'} type The type of response, indicating success or failure.
 * @property {string} [requestId] The unique identifier correlating the response to the original request.
 * @property {Diff.Change[]} [diff] The array of diff changes, present if type is 'diffResult'.
 * @property {string} [error] An error message, present if type is 'diffError'.
 * @property {string} [stack] The stack trace of the error, present if type is 'diffError'.
 */
interface DiffWorkerOutput {
  type: 'diffResult' | 'diffError';
  requestId?: string;
  diff?: Diff.Change[];
  error?: string;
  stack?: string;
}

/**
 * @event onmessage
 * @description Event listener for messages sent to the Web Worker.
 * When a message is received, it attempts to perform a line-by-line diff
 * on the provided `oldCode` and `newCode`. The result (either the diff
 * or an error) is then posted back to the main thread.
 * @param {MessageEvent<DiffWorkerInput>} event The message event containing the input data.
 * @performance This operation can be CPU-intensive for very large inputs. Offloading to a worker
 *              prevents blocking the main thread.
 * @throws {Error} Internally catches errors during diff computation and posts them back.
 */
self.onmessage = (event: MessageEvent<DiffWorkerInput>) => {
  const { oldCode, newCode, requestId } = event.data;

  try {
    if (typeof oldCode !== 'string' || typeof newCode !== 'string') {
      throw new Error('Invalid input: oldCode and newCode must be strings.');
    }

    /**
     * Calculates the line-by-line difference between two code snippets.
     * @param {string} oldText The first text.
     * @param {string} newText The second text.
     * @returns {Diff.Change[]} An array of diff changes.
     * @see {@link https://www.npmjs.com/package/diff#diffLines | diff.diffLines}
     */
    const changes: Diff.Change[] = Diff.diffLines(oldCode, newCode);

    const output: DiffWorkerOutput = {
      type: 'diffResult',
      requestId,
      diff: changes,
    };

    /**
     * Posts a message back to the main thread with the diff result.
     * @param {DiffWorkerOutput} message The message containing the diff result.
     */
    self.postMessage(output);

  } catch (error: any) {
    console.error(`Diff Worker Error for request ID ${requestId || 'N/A'}:`, error);

    const output: DiffWorkerOutput = {
      type: 'diffError',
      requestId,
      error: error.message || 'An unknown error occurred during diff computation.',
      stack: error.stack,
    };

    /**
     * Posts an error message back to the main thread.
     * @param {DiffWorkerOutput} message The message containing the error details.
     */
    self.postMessage(output);
  }
};

/**
 * @example
 * // Example usage from the main thread (hypothetically):
 * // const diffWorker = new Worker('path/to/diff.worker.ts', { type: 'module' });
 * // diffWorker.postMessage({
 * //   oldCode: 'function add(a, b) {\n  return a + b;\n}',
 * //   newCode: 'function subtract(a, b) {\n  return a - b;\n}',
 * //   requestId: 'my-diff-request-123'
 * // });
 * // diffWorker.onmessage = (event) => {
 * //   if (event.data.type === 'diffResult') {
 * //     console.log('Diff result:', event.data.diff);
 * //   } else if (event.data.type === 'diffError') {
 * //     console.error('Diff error:', event.data.error);
 * //   }
 * // };
 * @see {@link ../components/features/CodeDiffGhost.tsx | CodeDiffGhost Component}
 */