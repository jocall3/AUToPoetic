/**
 * @file Manages client-side performance monitoring and tracing.
 * @module services/profiling/performanceService
 * @see {@link WorkerPerformanceUtil} for use inside Web Workers.
 * @security This service collects performance data. Ensure that no Personally Identifiable Information (PII)
 * is included in trace names or associated metadata to prevent data leakage.
 * @performance This service introduces a slight overhead when tracing is active. It should be disabled
 * in production environments unless actively debugging a performance issue. The overhead is minimal
 * but measurable in high-frequency operations.
 */

/**
 * @interface PerformanceTraceEntry
 * @description Defines the structure for a single performance measurement entry.
 * It's more detailed than the browser's PerformanceEntry, allowing for custom
 * categories and metadata.
 */
export interface PerformanceTraceEntry {
  /**
   * The unique name identifying the measurement.
   * @example "Component.Render"
   */
  name: string;
  /**
   * The category of the measurement, used for filtering and grouping.
   * @example "React"
   */
  category: string;
  /**
   * The start time of the measurement, relative to the performance timeline origin.
   * Uses `performance.now()`.
   */
  startTime: number;
  /**
   * The duration of the measurement in milliseconds.
   */
  duration: number;
  /**
   * The type of entry, aligned with browser performance APIs.
   */
  entryType: 'mark' | 'measure';
  /**
   * Optional metadata associated with the trace for additional context.
   * @example { componentName: 'UserProfile', renderCount: 3 }
   */
  data?: Record<string, any>;
  /**
   * Indicates if the trace entry originated from a Web Worker.
   * @default false
   */
  fromWorker?: boolean;
}

/**
 * @class PerformanceService
 * @description A singleton service for managing client-side performance tracing.
 * It provides methods to start, stop, and record performance marks and measures,
 * including tracing asynchronous operations and collecting data from Web Workers.
 * This service is designed to be managed by a Dependency Injection container.
 *
 * @example
 * ```typescript
 * import { performanceService } from './services/profiling/performanceService';
 *
 * // Start a tracing session
 * performanceService.startTracing();
 *
 * // Trace an asynchronous function
 * await performanceService.trace('API.fetchUserData', 'API', async () => {
 *   await fetch('/api/user');
 * });
 *
 * // Stop tracing and get the results
 * const traceData = performanceService.stopTracing();
 * console.log(traceData);
 * ```
 */
export class PerformanceService {
  private static instance: PerformanceService;
  private isTracing: boolean = false;
  private collectedEntries: PerformanceTraceEntry[] = [];
  private readonly TRACE_PREFIX = 'devcore-trace-';

  /**
   * Private constructor to enforce the singleton pattern.
   * @private
   */
  private constructor() {}

  /**
   * Retrieves the singleton instance of the PerformanceService.
   * @returns {PerformanceService} The singleton instance.
   */
  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Starts a new performance tracing session.
   * Clears any existing marks and measures from the browser's performance timeline
   * that were created by this service.
   * @returns {void}
   * @performance Calling this method clears previous performance data managed by this service.
   */
  public startTracing(): void {
    if (this.isTracing) {
      console.warn('Performance tracing is already active. Ignoring call to startTracing.');
      return;
    }
    this.clearBrowserPerformanceEntries();
    this.collectedEntries = [];
    this.isTracing = true;
    console.log('Performance tracing started.');
  }

  /**
   * Stops the current performance tracing session and returns the collected data.
   * Also clears marks and measures from the browser's performance timeline.
   * @returns {PerformanceTraceEntry[]} An array of collected performance trace entries.
   */
  public stopTracing(): PerformanceTraceEntry[] {
    if (!this.isTracing) {
      console.warn('Performance tracing is not active. Returning empty array.');
      return [];
    }
    this.isTracing = false;
    console.log(`Performance tracing stopped. Collected ${this.collectedEntries.length} entries.`);
    this.clearBrowserPerformanceEntries();
    return this.collectedEntries;
  }

  /**
   * Records a performance mark, a single point in time.
   * @param {string} name - The name for the mark.
   * @returns {void}
   * @example
   * ```typescript
   * performanceService.mark('RenderStart');
   * // ... rendering logic ...
   * performanceService.mark('RenderEnd');
   * ```
   */
  public mark(name: string): void {
    if (!this.isTracing) return;
    performance.mark(`${this.TRACE_PREFIX}${name}`);
  }

  /**
   * Creates a performance measure between two marks and stores it.
   * @param {string} name - The name for the measure.
   * @param {string} category - The category for this measure (e.g., 'React', 'API').
   * @param {string} startMark - The name of the starting mark.
   * @param {string} endMark - The name of the ending mark.
   * @param {Record<string, any>} [data] - Optional metadata to associate with the measure.
   * @returns {void}
   * @example
   * ```typescript
   * performanceService.measure('ComponentRender', 'React', 'RenderStart', 'RenderEnd');
   * ```
   */
  public measure(name: string, category: string, startMark: string, endMark: string, data?: Record<string, any>): void {
    if (!this.isTracing) return;
    try {
      const measureName = `${this.TRACE_PREFIX}${name}`;
      const startMarkName = `${this.TRACE_PREFIX}${startMark}`;
      const endMarkName = `${this.TRACE_PREFIX}${endMark}`;

      const measureEntry = performance.measure(measureName, startMarkName, endMarkName);

      this.collectedEntries.push({
          name,
          category,
          startTime: measureEntry.startTime,
          duration: measureEntry.duration,
          entryType: 'measure',
          data,
      });
    } catch (e) {
      console.error(`Failed to create performance measure '${name}' from '${startMark}' to '${endMark}'.`, e);
    }
  }

  /**
   * Traces the execution of a function (synchronous or asynchronous).
   * Automatically creates start and end marks and measures the duration.
   * This is the preferred way to trace operations.
   * @template T
   * @param {string} name - The name for the trace.
   * @param {string} category - The category for this trace.
   * @param {() => T | Promise<T>} operation - The function to execute and trace.
   * @param {Record<string, any>} [data] - Optional metadata.
   * @returns {Promise<T>} A promise that resolves with the result of the operation.
   * @example
   * ```typescript
   * const users = await performanceService.trace('fetchUsers', 'API', () => api.fetchUsers());
   * ```
   */
  public async trace<T>(name: string, category: string, operation: () => T | Promise<T>, data?: Record<string, any>): Promise<T> {
    if (!this.isTracing) {
      return await Promise.resolve(operation());
    }

    const startMark = `${name}_start_${performance.now()}`;
    const endMark = `${name}_end_${performance.now()}`;

    this.mark(startMark);
    try {
      return await Promise.resolve(operation());
    } finally {
      this.mark(endMark);
      this.measure(name, category, startMark, endMark, data);
    }
  }

  /**
   * Adds pre-collected performance entries, typically from a Web Worker.
   * This allows the main thread's PerformanceService to be the single source of truth for all trace data.
   * @param {PerformanceTraceEntry[]} entries - An array of trace entries from a worker.
   * @returns {void}
   */
  public addWorkerEntries(entries: PerformanceTraceEntry[]): void {
    if (!this.isTracing) return;
    const workerEntries = entries.map(entry => ({ ...entry, fromWorker: true }));
    this.collectedEntries.push(...workerEntries);
  }

  /**
   * Clears all marks and measures created by this service from the browser's performance buffer.
   * @private
   */
  private clearBrowserPerformanceEntries(): void {
    const entries = performance.getEntries().filter(e => e.name.startsWith(this.TRACE_PREFIX));
    for (const entry of entries) {
      if (entry.entryType === 'mark') {
        performance.clearMarks(entry.name);
      } else if (entry.entryType === 'measure') {
        performance.clearMeasures(entry.name);
      }
    }
  }
}

/**
 * Singleton instance of the PerformanceService for easy access.
 * In a DI-based architecture, this would be provided by the container.
 */
export const performanceService = PerformanceService.getInstance();

/**
 * @class WorkerPerformanceUtil
 * @description A utility class for performance tracing inside Web Workers.
 * It buffers performance entries and provides a method to post them to the main thread.
 * This class should be instantiated within each Web Worker.
 *
 * @example
 * ```typescript
 * // In worker.ts
 * import { WorkerPerformanceUtil } from './services/profiling/performanceService';
 *
 * const perfUtil = new WorkerPerformanceUtil();
 *
 * self.onmessage = async (event) => {
 *   if (event.data.type === 'START_TRACING') {
 *     perfUtil.startTracing();
 *   }
 *   if (event.data.type === 'DO_WORK') {
 *     const result = await perfUtil.trace('heavyComputation', 'worker', () => {
 *       // ... do heavy work ...
 *       return 42;
 *     });
 *     self.postMessage({ type: 'RESULT', payload: result });
 *   }
 *   if (event.data.type === 'STOP_TRACING') {
 *     perfUtil.stopTracingAndPost();
 *   }
 * };
 * ```
 */
export class WorkerPerformanceUtil {
    private isTracing: boolean = false;
    private entries: PerformanceTraceEntry[] = [];

    /**
     * Starts a tracing session within the worker.
     * @returns {void}
     */
    public startTracing(): void {
        this.isTracing = true;
        this.entries = [];
    }

    /**
     * Stops the tracing session and posts the collected data to the main thread.
     * @returns {void}
     */
    public stopTracingAndPost(): void {
        this.isTracing = false;
        // Post the collected entries back to the main thread.
        // `self` is the global scope in a Web Worker.
        self.postMessage({
            type: 'PERFORMANCE_DATA',
            payload: this.entries,
        });
        this.entries = [];
    }

    /**
     * Traces a synchronous or asynchronous operation within the worker.
     * @template T
     * @param {string} name - The name for the trace.
     * @param {string} category - The category for this trace.
     * @param {() => T | Promise<T>} operation - The function to execute and trace.
     * @param {Record<string, any>} [data] - Optional metadata.
     * @returns {Promise<T>} A promise that resolves with the result of the operation.
     */
    public async trace<T>(name: string, category: string, operation: () => T | Promise<T>, data?: Record<string, any>): Promise<T> {
        if (!this.isTracing) {
            return await Promise.resolve(operation());
        }

        const startTime = performance.now();
        try {
            return await Promise.resolve(operation());
        } finally {
            const endTime = performance.now();
            this.entries.push({
                name,
                category,
                startTime,
                duration: endTime - startTime,
                entryType: 'measure',
                data
            });
        }
    }
}
