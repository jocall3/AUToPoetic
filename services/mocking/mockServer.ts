/**
 * @file Manages the lifecycle and configuration of a client-side mock API server.
 * @module services/mocking/mockServer
 * @description
 * This module provides a high-level interface for controlling a mock server implemented
 * as a browser service worker. It allows developers to start, stop, and configure the mock server
 * with dynamic routes during local development or testing. This enables frontend features to be
 * developed independently of the backend by intercepting API requests and returning mock responses.
 *
 * The core functionality relies on the `/mock-service-worker.js` file, which performs the actual
 * network interception. This module acts as the control panel for that worker.
 *
 * @example
 * // In a development setup file (e.g., main.dev.ts)
 * import { startMockServer, setMockRoutes } from './services/mocking/mockServer';
 *
 * async function setupDevelopmentEnvironment() {
 *   if (process.env.NODE_ENV === 'development') {
 *     await startMockServer();
 *     setMockRoutes([
 *       {
 *         path: '/api/users/:id',
 *         method: 'GET',
 *         response: {
 *           status: 200,
 *           body: { id: '1', name: 'John Doe' }
 *         }
 *       }
 *     ]);
 *   }
 * }
 *
 * setupDevelopmentEnvironment();
 *
 * @security
 * This module and the associated service worker are intended **for development and testing purposes only**.
 * They should be completely excluded from production builds to avoid exposing mock data and
 * interfering with real API calls. Enabling this in a production environment would be a
 * significant security risk and would break application functionality.
 */

/**
 * The URL path to the service worker script that implements the mock server logic.
 * @constant {string}
 */
const SERVICE_WORKER_URL = '/mock-service-worker.js';

/**
 * Holds the active service worker registration object.
 * This module-level variable maintains the state of the mock server's registration.
 * It is `null` when the server is stopped or not yet started.
 * @type {ServiceWorkerRegistration | null}
 */
let registration: ServiceWorkerRegistration | null = null;

/**
 * Defines the structure of a mock response to be sent by the service worker.
 * @interface MockResponse
 * @property {number} status - The HTTP status code to return (e.g., 200, 404, 500).
 * @property {any} body - The response body, which will be JSON.stringified by the service worker.
 * @property {Record<string, string>} [headers] - Optional HTTP headers to include in the response.
 */
export interface MockResponse {
    status: number;
    body: any;
    headers?: Record<string, string>;
}

/**
 * Defines a single mock API route for the service worker to intercept.
 * @interface MockRoute
 * @property {string} path - The URL path to intercept. Can include simple wildcards (`*`)
 *   which will be converted to a regex. E.g., `/api/users/*`.
 * @property {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} method - The HTTP method to match.
 * @property {MockResponse} response - The mock response to send when this route is matched.
 */
export interface MockRoute {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    response: MockResponse;
}

/**
 * Registers and starts the mock server service worker.
 * Checks for browser support before attempting registration.
 *
 * @async
 * @function startMockServer
 * @returns {Promise<void>} A promise that resolves when the service worker is successfully registered
 *   and activated, or rejects if registration fails.
 * @throws {Error} Throws an error if service workers are not supported by the browser,
 *   or if the service worker registration fails for any reason (e.g., script not found, network error).
 * @example
 * try {
 *   await startMockServer();
 *   console.log("Mock server is running.");
 * } catch (error) {
 *   console.error("Failed to start mock server:", error);
 * }
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register | MDN: ServiceWorkerContainer.register()}
 * @performance
 * Registering a service worker is a one-time setup cost. Once active, it introduces a very
 * small, negligible overhead to intercepted network requests, which is acceptable for development.
 * @security
 * This function should only be called in a development environment. The service worker URL
 * points to a script that must be publicly accessible from the root of the application.
 */
export const startMockServer = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
        try {
            registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
            console.log('Mock Service Worker registered with scope:', registration.scope);
        } catch (error) {
            console.error('Mock Service Worker registration failed:', error);
            throw new Error('Could not start mock server.');
        }
    } else {
        throw new Error('Service workers are not supported in this browser.');
    }
};

/**
 * Unregisters and stops the mock server service worker.
 * If no service worker is currently registered, this function does nothing.
 *
 * @async
 * @function stopMockServer
 * @returns {Promise<void>} A promise that resolves when the service worker is successfully unregistered.
 * @example
 * await stopMockServer();
 * console.log("Mock server stopped.");
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/unregister | MDN: ServiceWorkerRegistration.unregister()}
 */
export const stopMockServer = async (): Promise<void> => {
    if (registration) {
        await registration.unregister();
        registration = null;
        console.log('Mock Service Worker unregistered.');
    }
};

/**
 * Checks if the mock server service worker is currently registered and active.
 *
 * @function isMockServerRunning
 * @returns {boolean} `true` if the service worker is registered and has an active controller,
 *   `false` otherwise.
 * @example
 * if (isMockServerRunning()) {
 *   console.log('Mock server is active.');
 * }
 */
export const isMockServerRunning = (): boolean => {
    // The controller property will be non-null if a service worker is actively controlling the page.
    return !!registration && !!navigator.serviceWorker.controller;
};

/**
 * Sends a new set of mock routes to the active service worker.
 * This will overwrite any previously set routes.
 *
 * @function setMockRoutes
 * @param {MockRoute[]} routes - An array of mock route definitions.
 * @returns {void}
 * @example
 * const routes = [
 *   { path: '/api/test', method: 'GET', response: { status: 200, body: { ok: true } } }
 * ];
 * setMockRoutes(routes);
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/postMessage | MDN: ServiceWorker.postMessage()}
 */
export const setMockRoutes = (routes: MockRoute[]): void => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SET_ROUTES',
            routes
        });
        console.log('Mock routes sent to service worker:', routes);
    } else {
        console.warn('Mock server is not active. Routes were not set.');
    }
};
