/**
 * @file Web Worker for performing code diffing computations.
 * @description This worker offloads the potentially intensive task of calculating
 * the difference between two large code snippets from the main thread,
 * ensuring UI responsiveness. It is designed to be managed by the WorkerPoolManager.
 * It utilizes the 'diff' library to generate line-by-line differences.
 * @module workers/diff.worker
 * @see {@link ../services/worker-pool/WorkerPoolManager.ts}
 * @see {@link ../components/features/CodeDiffGhost.tsx}
 */

import * as Diff from 'diff';

/**
 * @interface DiffTaskPayload
 * @description Defines the payload expected for a 'compute-diff' task.
 */
interface DiffTaskPayload {
  oldCode: string;
  newCode: string;
}

/**
 * @interface WorkerTask
 * @description Defines the structure of messages from the WorkerPoolManager.
 */
interface WorkerTask {
  id: string;
  type: 'compute-diff'; // This worker only handles 'compute-diff'
  payload: DiffTaskPayload;
}

/**
 * @event onmessage
 * @description Event listener for messages sent to the Web Worker.
 * When a message with the type 'compute-diff' is received, it performs a line-by-line diff
 * on the provided `oldCode` and `newCode`. The result (either the diff changes
 * or an error) is then posted back to the main thread, correlated by the task ID.
 * @param {MessageEvent<WorkerTask>} event The message event containing the task data.
 * @performance This operation can be CPU-intensive for very large inputs. Offloading to a worker
 *              prevents blocking the main thread, which is critical for UI responsiveness.
 * @throws {Error} Internally catches errors during diff computation and posts them back to the main thread.
 */
self.onmessage = (event: MessageEvent<WorkerTask>) => {
  const { id, type, payload } = event.data;

  // This worker is specialized for diffing.
  if (type !== 'compute-diff') {
    console.warn(`[DiffWorker] Received task of unknown type: '${type}'. Ignoring.`);
    return;
  }

  try {
    if (typeof payload.oldCode !== 'string' || typeof payload.newCode !== 'string') {
      throw new Error('Invalid payload: oldCode and newCode must be strings.');
    }

    // Perform the diffing operation using the 'diff' library.
    const changes: Diff.Change[] = Diff.diffLines(payload.oldCode, payload.newCode);

    // Post the successful result back to the main thread, adhering to the WorkerResponse protocol.
    self.postMessage({
      taskId: id,
      result: changes,
      error: null,
    });

  } catch (error: any) {
    console.error(`[DiffWorker] Error processing task ${id}:`, error);

    // Post an error message back to the main thread.
    self.postMessage({
      taskId: id,
      result: null,
      error: {
        message: error.message || 'An unknown error occurred during diff computation.',
        stack: error.stack,
      },
    });
  }
};

// This ensures the file is treated as a module, which is good practice for TypeScript files, especially in a Vite/module worker setup.
export {};
