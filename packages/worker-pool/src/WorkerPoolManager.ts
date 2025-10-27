/**
 * @file Manages a pool of Web Workers to offload heavy computations from the main thread.
 * @module WorkerPoolManager
 * @see Proactive Resource Orchestration Layer and a Dedicated Web Worker Pool architectural directive.
 * @performance This service is critical for maintaining UI responsiveness by delegating
 *              long-running tasks to background threads. The pool size should be configured
 *              carefully to balance concurrency with system resource limitations.
 * @security Workers run in a separate global scope, which provides some isolation. However,
 *           the worker script itself must be trusted. All data passed to and from workers
 *           is serialized, so non-serializable data (like functions) cannot be passed.
 */

/**
 * Represents a task to be executed by a Web Worker.
 * The payload is generic to accommodate different types of tasks.
 * @template T The type of the payload data for the task.
 * @interface
 */
export interface WorkerTask<T = any> {
  /**
   * A unique identifier for the task, used to correlate requests with responses.
   * @type {string}
   */
  id: string;

  /**
   * The type of task to be performed. This string is used by the worker to
   * select the correct handler function.
   * @type {string}
   * @example 'markdown-to-html'
   * @example 'json-parse'
   */
  type: string;

  /**
   * The data required by the worker to perform the task.
   * This must be serializable.
   * @type {T}
   */
  payload: T;
}

/**
 * Represents the response sent back from a Web Worker to the main thread.
 * Contains the result of the computation or an error if one occurred.
 * @template R The type of the result data.
 * @interface
 */
export interface WorkerResponse<R = any> {
  /**
   * The unique identifier of the task this response corresponds to.
   * @type {string}
   */
  taskId: string;

  /**
   * The result of the successful computation. This property is present
   * only if the task completed without errors.
   * @type {R | undefined}
   */
  result?: R;

  /**
   * An error object if the task failed. This property is present
   * only if an error occurred during task execution.
   * @type {any | undefined}
   */
  error?: any;
}

/**
 * Internal representation of a worker within the pool, tracking its state.
 * @interface
 * @private
 */
interface ManagedWorker {
  /**
   * The Web Worker instance.
   * @type {Worker}
   */
  worker: Worker;

  /**
   * A flag indicating whether the worker is currently executing a task.
   * @type {boolean}
   */
  isBusy: boolean;

  /**
   * The ID of the task currently being processed by this worker.
   * Null if the worker is idle.
   * @type {string | null}
   */
  currentTaskId: string | null;
}

/**
 * Manages a pool of Web Workers to handle concurrent, off-thread computations.
 * This class implements a queue for tasks and distributes them to available workers,
 * managing the entire lifecycle and communication process.
 *
 * @class WorkerPoolManager
 * @example
 * // Get the singleton instance
 * const workerPool = WorkerPoolManager.getInstance();
 *
 * // Submit a task
 * async function parseMarkdown(markdownText) {
 *   try {
 *     const html = await workerPool.submitTask<string, string>('markdown-to-html', markdownText);
 *     console.log('Converted HTML:', html);
 *   } catch (error) {
 *     console.error('Markdown conversion failed:', error);
 *   }
 * }
 */
export class WorkerPoolManager {
  /**
   * Singleton instance of the WorkerPoolManager.
   * @private
   * @static
   * @type {WorkerPoolManager | null}
   */
  private static instance: WorkerPoolManager | null = null;

  /**
   * The pool of managed worker instances.
   * @private
   * @type {ManagedWorker[]}
   */
  private readonly workers: ManagedWorker[] = [];

  /**
   * The queue of tasks waiting for an available worker.
   * @private
   * @type {WorkerTask[]}
   */
  private readonly taskQueue: WorkerTask[] = [];

  /**
   * A map of pending task IDs to their Promise resolve/reject functions.
   * @private
   * @type {Map<string, { resolve: (result: any) => void; reject: (error: any) => void; }>}
   */
  private readonly pendingTasks = new Map<string, { resolve: (result: any) => void; reject: (error: any) => void; }>();

  /**
   * The maximum number of workers in the pool.
   * @private
   * @type {number}
   */
  private readonly poolSize: number;

  /**
   * The URL of the generic worker script.
   * @private
   * @type {URL}
   */
  private readonly workerScriptUrl: URL;

  /**
   * Private constructor to enforce the singleton pattern.
   * @private
   * @param {number} [poolSize] - The number of workers to create. Defaults to `navigator.hardwareConcurrency`.
   * @param {string} [workerScriptPath] - The path to the worker script. Defaults to './worker-script.js'.
   */
  private constructor(poolSize?: number, workerScriptPath: string = './worker-script.js') {
    this.poolSize = poolSize || navigator.hardwareConcurrency || 4;

    // Using import.meta.url is the modern way to resolve paths relative to the current module.
    // This is crucial for environments like Vite.
    this.workerScriptUrl = new URL(workerScriptPath, import.meta.url);

    this._initializePool();
  }

  /**
   * Gets the singleton instance of the WorkerPoolManager.
   * Ensures that only one worker pool is active throughout the application.
   * @public
   * @static
   * @param {number} [poolSize] - The number of workers, only used on first initialization.
   * @param {string} [workerScriptPath] - The path to the worker script, only used on first initialization.
   * @returns {WorkerPoolManager} The singleton instance.
   */
  public static getInstance(poolSize?: number, workerScriptPath?: string): WorkerPoolManager {
    if (!WorkerPoolManager.instance) {
      WorkerPoolManager.instance = new WorkerPoolManager(poolSize, workerScriptPath);
    }
    return WorkerPoolManager.instance;
  }

  /**
   * Initializes the worker pool by creating worker instances and setting up listeners.
   * @private
   */
  private _initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(this.workerScriptUrl, { type: 'module' });

        worker.onmessage = this._handleWorkerMessage.bind(this, i);
        worker.onerror = this._handleWorkerError.bind(this, i);

        this.workers.push({
          worker,
          isBusy: false,
          currentTaskId: null,
        });
      } catch (error) {
        console.error(`[WorkerPoolManager] Failed to create worker #${i}:`, error);
        // Depending on the desired robustness, we might want to stop initialization
        // or attempt to continue with fewer workers.
      }
    }
    console.log(`[WorkerPoolManager] Initialized with ${this.workers.length} workers.`);
  }

  /**
   * Submits a task to the worker pool for execution.
   * The task is queued and will be processed by the next available worker.
   *
   * @public
   * @template T The type of the payload data.
   * @template R The expected type of the result data.
   * @param {string} type - The type of task to perform (e.g., 'markdown-to-html').
   * @param {T} payload - The data for the task. Must be serializable.
   * @returns {Promise<R>} A promise that resolves with the result of the task or rejects with an error.
   * @throws {Error} If the worker pool has been terminated.
   */
  public submitTask<T, R>(type: string, payload: T): Promise<R> {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const task: WorkerTask<T> = { id, type, payload };

    const promise = new Promise<R>((resolve, reject) => {
      this.pendingTasks.set(id, { resolve, reject });
    });

    this._scheduleTask(task);

    return promise;
  }

  /**
   * Attempts to assign a task to an idle worker or adds it to the queue.
   * @private
   * @param {WorkerTask} task - The task to schedule.
   */
  private _scheduleTask(task: WorkerTask): void {
    const idleWorker = this.workers.find(w => !w.isBusy);

    if (idleWorker) {
      this._assignTaskToWorker(idleWorker, task);
    } else {
      this.taskQueue.push(task);
    }
  }

  /**
   * Assigns a task to a specific worker and sends it for processing.
   * @private
   * @param {ManagedWorker} managedWorker - The worker to assign the task to.
   * @param {WorkerTask} task - The task to be processed.
   */
  private _assignTaskToWorker(managedWorker: ManagedWorker, task: WorkerTask): void {
    managedWorker.isBusy = true;
    managedWorker.currentTaskId = task.id;
    managedWorker.worker.postMessage(task);
  }

  /**
   * Handles messages received from a worker. This is the callback for `worker.onmessage`.
   * @private
   * @param {number} workerIndex - The index of the worker that sent the message.
   * @param {MessageEvent<WorkerResponse>} event - The message event from the worker.
   */
  private _handleWorkerMessage(workerIndex: number, event: MessageEvent<WorkerResponse>): void {
    const response = event.data;
    const { taskId, result, error } = response;
    const managedWorker = this.workers[workerIndex];

    if (!taskId || !this.pendingTasks.has(taskId)) {
      console.warn(`[WorkerPoolManager] Received a message with an unknown or missing task ID:`, response);
      return;
    }

    const { resolve, reject } = this.pendingTasks.get(taskId)!;

    if (error) {
      reject(error);
    } else {
      resolve(result);
    }

    this.pendingTasks.delete(taskId);

    managedWorker.isBusy = false;
    managedWorker.currentTaskId = null;

    // Check for more tasks in the queue
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift()!;
      this._assignTaskToWorker(managedWorker, nextTask);
    }
  }

  /**
   * Handles critical errors from a worker instance. This is the callback for `worker.onerror`.
   * It rejects the task the worker was processing and attempts to replace the failed worker.
   * @private
   * @param {number} workerIndex - The index of the worker that errored.
   * @param {ErrorEvent} error - The error event.
   */
  private _handleWorkerError(workerIndex: number, error: ErrorEvent): void {
    console.error(`[WorkerPoolManager] A critical error occurred in worker #${workerIndex}:`, error);
    const managedWorker = this.workers[workerIndex];
    const taskId = managedWorker.currentTaskId;

    // Reject the pending task associated with this worker, if any
    if (taskId && this.pendingTasks.has(taskId)) {
      const { reject } = this.pendingTasks.get(taskId)!;
      reject(new Error(`Worker failed with error: ${error.message}`));
      this.pendingTasks.delete(taskId);
    }

    // Terminate the faulty worker and replace it to maintain pool health
    this._replaceWorker(workerIndex);
  }

  /**
   * Replaces a failed worker with a new instance.
   * @private
   * @param {number} workerIndex - The index of the worker to replace.
   */
  private _replaceWorker(workerIndex: number): void {
    const oldWorker = this.workers[workerIndex];
    if (oldWorker) {
      oldWorker.worker.terminate();
    }

    try {
      const newWorker = new Worker(this.workerScriptUrl, { type: 'module' });
      newWorker.onmessage = this._handleWorkerMessage.bind(this, workerIndex);
      newWorker.onerror = this._handleWorkerError.bind(this, workerIndex);

      this.workers[workerIndex] = {
        worker: newWorker,
        isBusy: false,
        currentTaskId: null,
      };
      console.log(`[WorkerPoolManager] Worker #${workerIndex} has been replaced.`);

      // Check if there's a task in the queue to assign to the new worker
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift()!;
        this._scheduleTask(nextTask); // Re-schedule to find an idle worker (our new one)
      }
    } catch (error) {
      console.error(`[WorkerPoolManager] Failed to replace worker #${workerIndex}:`, error);
      // If replacement fails, the pool size is effectively reduced.
      // We might want to remove it from the pool entirely.
      this.workers.splice(workerIndex, 1);
    }
  }

  /**
   * Terminates all workers in the pool and clears the task queue.
   * This should be called when the application is shutting down to clean up resources.
   * @public
   * @performance Call this method on component unmount or page unload to prevent memory leaks from active workers.
   */
  public terminate(): void {
    console.log('[WorkerPoolManager] Terminating all workers...');
    this.workers.forEach(managedWorker => {
      managedWorker.worker.terminate();
    });
    this.workers.length = 0; // Clear the array

    // Reject all pending tasks
    const terminationError = new Error("Worker pool was terminated.");
    this.pendingTasks.forEach(({ reject }) => reject(terminationError));
    this.pendingTasks.clear();
    this.taskQueue.length = 0;

    WorkerPoolManager.instance = null;
  }
}

/**
 * A singleton instance of the WorkerPoolManager for easy access across the application.
 * @type {WorkerPoolManager}
 */
export const workerPoolManager = WorkerPoolManager.getInstance();
