/**
 * @file This file contains the Jester's Resilient Component Loader (JRCL).
 * It provides a robust, resilient, and observable way to lazy-load React components,
 * handling common issues like chunk load errors with retries, caching, and preloading.
 * @see {@link ../articles/jesterComponentLoaderArticle.md} for the full architectural overview and philosophy.
 * @security This module mitigates availability risks from deployment-related chunk load errors by forcing a page reload.
 * @performance This module improves perceived performance by caching loaded components and providing a preloader hook.
 */

// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import React, { lazy, useEffect } from 'react';

// --- Utility: Jester's Telemetry Service (Mock) ---

/**
 * @interface JesterTelemetryEvent
 * @description Represents a single event logged by the Jester's Telemetry Service for component loading.
 * @property {'componentLoadFailed' | 'componentLoaded' | 'componentPreloaded' | 'errorCaught' | 'componentLoadStarted' | 'details'} type - The type of event.
 * @property {string} [componentName] - The name/key of the component associated with the event.
 * @property {string} [error] - An error message, if applicable.
 * @property {string} [stack] - The error stack trace, if available.
 * @property {Record<string, any>} [details] - Additional, arbitrary details about the event.
 * @property {number} timestamp - The Unix timestamp (milliseconds) when the event occurred.
 */
interface JesterTelemetryEvent {
    type: 'componentLoadFailed' | 'componentLoaded' | 'componentPreloaded' | 'errorCaught' | 'componentLoadStarted' | 'details';
    componentName?: string;
    error?: string;
    stack?: string;
    details?: Record<string, any>;
    timestamp: number;
}

/**
 * @class JesterTelemetryService
 * @description A mock telemetry service to track the performance of component loading operations.
 * In a real application, this service would integrate with an external monitoring system.
 * @example
 * jesterTelemetryService.reportEvent({ type: 'componentLoaded', componentName: 'MyComponent' });
 */
class JesterTelemetryService {
    private eventLog: JesterTelemetryEvent[] = [];

    /**
     * Reports a telemetry event, adding it to an in-memory log for demonstration.
     * @param {Omit<JesterTelemetryEvent, 'timestamp'>} event - The event object to report.
     * @returns {void}
     * @security Logs error stacks, which might contain sensitive information. Ensure logs are secured in production.
     */
    public reportEvent(event: Omit<JesterTelemetryEvent, 'timestamp'>): void {
        const fullEvent = { ...event, timestamp: Date.now() };
        this.eventLog.push(fullEvent);
        // In a real application, this would be an API call to a logging service.
        console.groupCollapsed(`Jester Telemetry: ${fullEvent.type} [${fullEvent.componentName || 'N/A'}]`);
        console.log("Event Details:", fullEvent);
        console.groupEnd();
    }
}

/**
 * The singleton instance of the JesterTelemetryService.
 * @type {JesterTelemetryService}
 */
const jesterTelemetryService = new JesterTelemetryService();

// --- Utility: Jester's Retry Mechanism ---

/**
 * @typedef {'linear' | 'exponential'} RetryStrategy
 * @description The strategy for calculating delay between retries.
 * 'linear' uses a constant delay, while 'exponential' doubles the delay on each attempt.
 */
type RetryStrategy = 'linear' | 'exponential';

/**
 * @interface JesterRetryOptions
 * @description Options for configuring the jester's retry mechanism.
 */
interface JesterRetryOptions {
    /** The maximum number of retry attempts. Defaults to 3. */
    maxRetries?: number;
    /** The initial delay in milliseconds before the first retry. Defaults to 1000. */
    delayMs?: number;
    /** The strategy to use for increasing delay. Defaults to 'exponential'. */
    strategy?: RetryStrategy;
    /** Callback function executed on each retry attempt. */
    onRetry?: (attempt: number, error: any) => void;
    /** Callback function executed if all retries are exhausted. */
    onFailure?: (error: any) => void;
    /** Callback function executed on success. */
    onSuccess?: () => void;
}

/**
 * Attempts a task multiple times with configurable retry logic and telemetry.
 * If all retries fail, it triggers a full page reload as a final recovery mechanism.
 * @template T - The type of the value returned by the function.
 * @param {() => Promise<T>} fn - The asynchronous function to attempt.
 * @param {string} operationName - A name for the operation for logging purposes.
 * @param {JesterRetryOptions} [options] - Configuration for the retry logic.
 * @returns {Promise<T>} A promise that resolves with the result of `fn` or rejects if all retries fail.
 * @throws {Error} Throws the last error received if all retries are exhausted.
 * @example
 * await jesterAttemptWithRetry(() => import('./MyModule'), 'MyModuleLoad');
 */
async function jesterAttemptWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string,
    options?: JesterRetryOptions
): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const initialDelay = options?.delayMs ?? 1000;
    const strategy = options?.strategy ?? 'exponential';

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await fn();
            options?.onSuccess?.();
            jesterTelemetryService.reportEvent({
                type: 'componentLoaded',
                componentName: operationName,
                details: { attempt: i + 1, status: 'success' }
            });
            return result;
        } catch (error: any) {
            options?.onRetry?.(i + 1, error);
            jesterTelemetryService.reportEvent({
                type: 'componentLoadFailed',
                componentName: operationName,
                error: error.message,
                details: { attempt: i + 1, stack: error.stack, status: 'retry' }
            });

            if (i < maxRetries - 1) {
                let delay = initialDelay;
                if (strategy === 'exponential') {
                    delay = initialDelay * Math.pow(2, i);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                options?.onFailure?.(error);
                jesterTelemetryService.reportEvent({
                    type: 'componentLoadFailed',
                    componentName: operationName,
                    error: error.message,
                    details: { attempt: i + 1, stack: error.stack, status: 'final-failure' }
                });

                console.error(`Jester's Gambit: All retries failed for '${operationName}'. Reloading page as a last resort.`);
                window.location.reload();
                throw error;
            }
        }
    }
    throw new Error("Jester's Retry: Unexpected logic error in retry mechanism.");
}

// --- Utility: Jester's Component Cache ---

/**
 * @interface ComponentCacheEntry
 * @description Represents an entry stored in the Jester's component cache.
 */
interface ComponentCacheEntry<T> {
    /** The React component itself. */
    component: T;
    /** The timestamp when the component was cached, used for expiration. */
    timestamp: number;
}

/**
 * @class JesterComponentCache
 * @description A cache for storing successfully loaded React components to improve performance on subsequent loads.
 * @performance Caching reduces network requests and improves component rendering time for frequently used components.
 */
class JesterComponentCache {
    private cache = new Map<string, ComponentCacheEntry<any>>();
    private readonly CACHE_LIFETIME_MS: number;

    constructor(lifetimeMs: number = 5 * 60 * 1000) { // 5 minutes default
        this.CACHE_LIFETIME_MS = lifetimeMs;
    }

    /**
     * Retrieves a component from the cache if it exists and is not expired.
     * @template T - The expected type of the React component.
     * @param {string} key - The unique key for the component.
     * @returns {T | undefined} The cached component or undefined.
     */
    get<T extends React.ComponentType<any>>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (entry && (Date.now() - entry.timestamp < this.CACHE_LIFETIME_MS)) {
            jesterTelemetryService.reportEvent({ type: 'componentLoaded', componentName: key, details: { status: 'cached-hit' } });
            return entry.component;
        }
        if (entry) {
            jesterTelemetryService.reportEvent({ type: 'componentLoaded', componentName: key, details: { status: 'cached-expired' } });
            this.cache.delete(key);
        }
        return undefined;
    }

    /**
     * Stores a component in the cache.
     * @template T - The type of the React component.
     * @param {string} key - The unique key for the component.
     * @param {T} component - The React component to cache.
     * @returns {void}
     */
    set<T extends React.ComponentType<any>>(key: string, component: T): void {
        this.cache.set(key, { component, timestamp: Date.now() });
        jesterTelemetryService.reportEvent({ type: 'componentLoaded', componentName: key, details: { status: 'cached-set' } });
    }

    /**
     * Checks if a component exists in the cache and is valid.
     * @param {string} key - The unique key for the component.
     * @returns {boolean}
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        return !!entry && (Date.now() - entry.timestamp < this.CACHE_LIFETIME_MS);
    }
}

const jesterComponentCache = new JesterComponentCache();

// --- Main: Jester's Resilient Component Loader ---

/**
 * @interface JesterLazyOptions
 * @description Additional options for the lazyWithJesterResilience function.
 */
interface JesterLazyOptions extends JesterRetryOptions {
    /** An optional key for caching this component. */
    cacheKey?: string;
    /** Callback executed when loading starts. */
    onLoadStart?: () => void;
    /** Callback executed when loading ends (success or failure). */
    onLoadEnd?: () => void;
    /** Callback executed on a loading error. */
    onError?: (error: any) => void;
}

/**
 * A resilient wrapper around `React.lazy` that incorporates retries, caching, and telemetry.
 * This is the replacement for the standard `React.lazy` to handle chunk load errors gracefully.
 * @template T - The type of the React component being loaded.
 * @param {() => Promise<{ [key: string]: T }>} componentImport - A function returning a dynamic import.
 * @param {string} [exportName='default'] - The named export of the component to load.
 * @param {JesterLazyOptions} [options] - Configuration for retry, caching, and lifecycle callbacks.
 * @returns {React.LazyExoticComponent<T>} A lazy-loaded React component with resilience.
 * @example
 * const MyComponent = lazyWithJesterResilience(() => import('./MyComponent'), 'MyComponent');
 */
export const lazyWithJesterResilience = <T extends React.ComponentType<any>>(
    componentImport: () => Promise<{ [key: string]: T }>,
    exportName: string = 'default',
    options?: JesterLazyOptions
): React.LazyExoticComponent<T> => {
    const cacheKey = options?.cacheKey ?? (componentImport.toString() + '::' + exportName);

    return lazy(async () => {
        options?.onLoadStart?.();
        jesterTelemetryService.reportEvent({ type: 'componentLoadStarted', componentName: cacheKey });

        const cachedComponent = jesterComponentCache.get<T>(cacheKey);
        if (cachedComponent) {
            options?.onLoadEnd?.();
            return { default: cachedComponent };
        }

        try {
            const loadedModule = await jesterAttemptWithRetry(
                async () => {
                    const module = await componentImport();
                    if (module[exportName]) {
                        return module;
                    }
                    throw new Error(`Jester's Lament: Named export '${exportName}' not found in module for '${cacheKey}'.`);
                },
                cacheKey,
                options
            );

            const component = loadedModule[exportName];
            jesterComponentCache.set(cacheKey, component);
            options?.onLoadEnd?.();
            return { default: component };
        } catch (error: any) {
            options?.onError?.(error);
            options?.onLoadEnd?.();
            jesterTelemetryService.reportEvent({ type: 'errorCaught', componentName: cacheKey, error: error.message, stack: error.stack });
            throw error;
        }
    });
};


// --- Enhancement: Jester's Preloader Mechanism ---

/**
 * A React hook for proactively loading components in the background.
 * This improves perceived performance by fetching components before they are needed.
 * @param {(() => Promise<any>)[]} componentImports - An array of component import functions.
 * @param {string[]} [exportNames=[]] - An array of corresponding export names.
 * @param {number} [delayMs=0] - Optional delay before preloading starts.
 * @performance This hook directly impacts performance by pre-fetching resources, reducing wait times on user interaction.
 * @example
 * useJesterPreloader([() => import('./HeavyComponent')], ['HeavyComponent'], 3000);
 */
export const useJesterPreloader = (
    componentImports: (() => Promise<any>)[],
    exportNames: string[] = [],
    delayMs: number = 0
): void => {
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            componentImports.forEach(async (importFn, index) => {
                const exportName = exportNames[index] || 'default';
                const cacheKey = importFn.toString() + '::' + exportName;

                if (jesterComponentCache.has(cacheKey)) {
                    return;
                }

                jesterTelemetryService.reportEvent({ type: 'componentPreloaded', componentName: cacheKey, details: { status: 'started' } });

                try {
                    const module = await jesterAttemptWithRetry(
                        () => importFn(),
                        cacheKey,
                        { maxRetries: 1, delayMs: 500, strategy: 'linear' }
                    );
                    if (module[exportName]) {
                        jesterComponentCache.set(cacheKey, module[exportName]);
                        jesterTelemetryService.reportEvent({ type: 'componentPreloaded', componentName: cacheKey, details: { status: 'success' } });
                    } else {
                        jesterTelemetryService.reportEvent({ type: 'componentPreloaded', componentName: cacheKey, details: { status: 'export-not-found' } });
                    }
                } catch (error: any) {
                    jesterTelemetryService.reportEvent({ type: 'componentPreloaded', componentName: cacheKey, details: { status: 'failed', error: error.message } });
                }
            });
        }, delayMs);

        return () => clearTimeout(timeoutId);
    }, [componentImports, exportNames, delayMs]);
};


// --- Enhancement: Jester's Component Boundary ---

/**
 * @interface JesterComponentErrorBoundaryProps
 * @description Props for the JesterComponentErrorBoundary.
 */
interface JesterComponentErrorBoundaryProps {
    /** The ReactNode to render when an error is caught. */
    fallback: React.ReactNode;
    /** The child components that the error boundary protects. */
    children: React.ReactNode;
    /** Optional callback invoked when an error is caught. */
    onError?: (error: Error, componentStack: string) => void;
}

/**
 * @interface JesterComponentErrorBoundaryState
 * @description State for the JesterComponentErrorBoundary.
 */
interface JesterComponentErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * An Error Boundary to gracefully handle rendering errors in child components,
 * preventing a full application crash and allowing for a fallback UI.
 * @class JesterComponentErrorBoundary
 * @extends React.Component
 */
export class JesterComponentErrorBoundary extends React.Component<
    JesterComponentErrorBoundaryProps,
    JesterComponentErrorBoundaryState
> {
    constructor(props: JesterComponentErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): JesterComponentErrorBoundaryState {
        jesterTelemetryService.reportEvent({ type: 'errorCaught', error: error.message, stack: error.stack, details: { source: 'getDerivedStateFromError' } });
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.props.onError?.(error, errorInfo.componentStack || '');
        jesterTelemetryService.reportEvent({ type: 'errorCaught', error: error.message, stack: errorInfo.componentStack, details: { source: 'componentDidCatch' } });
    }

    render() {
        if (this.state.hasError) {
            return React.isValidElement(this.props.fallback)
                ? React.cloneElement(this.props.fallback as React.ReactElement, { error: this.state.error })
                : this.props.fallback;
        }
        return this.props.children;
    }
}

// --- Enhancement: Jester's UI Components ---

/**
 * A themed loading spinner for use with React.Suspense fallback.
 * @returns {React.ReactElement}
 */
export const JesterLoadingSpinner: React.FC = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: 'var(--color-primary, #0047AB)' }}>
        <p>Loading...</p>
    </div>
);

/**
 * A themed error fallback component for use with the JesterComponentErrorBoundary.
 * @param {{ error?: Error }} props
 * @returns {React.ReactElement}
 */
export const JesterErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
    <div style={{ padding: '2rem', border: '2px dashed #ff4500', borderRadius: '8px', backgroundColor: '#ffe6e6', color: '#8b0000' }}>
        <h3>Alas, a jester's jest has gone awry!</h3>
        <p>It seems this component has stumbled. Please try again.</p>
        {error && <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8em', marginTop: '1rem' }}><code>{error.message}</code></pre>}
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Attempt a Jester's Reboot!
        </button>
    </div>
);
