/**
 * @file bootstrap.tsx
 * @description
 * This file serves as the primary entry point for mounting the federated micro-frontend shell application.
 * It is responsible for initializing core services, setting up the dependency injection container,
 * configuring all top-level application providers (such as Authentication, GraphQL, Theme, and Workspace),
 * and rendering the main App component into a specified DOM element.
 *
 * This module is designed to be dynamically imported by `index.tsx` to facilitate the asynchronous
 * loading patterns required by Webpack Module Federation.
 * @see ./index.tsx For the dynamic import implementation.
 * @see ./App.tsx For the shell's root React component.
 * @see ./config/container.ts For the dependency injection container setup.
 * @security This file initializes the `AuthProvider`, which is critical for the application's zero-trust
 *           security model. All providers must be configured to prevent exposure of sensitive information.
 * @performance The initialization logic within this module is critical for the application's startup
 *              performance, including Time to Interactive (TTI) and First Contentful Paint (FCP).
 *              Initialization of services like the ResourceOrchestrator and WorkerPoolManager should be
 *              non-blocking or deferred where possible.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Core application providers for DI, Auth, GraphQL, and UI
import { container } from './config/container';
import { DependencyInjectionProvider } from './providers/DependencyInjectionProvider';
import { AuthenticationProvider } from './providers/AuthenticationProvider';
import { GraphQLProvider } from './providers/GraphQLProvider';
import { NotificationProvider } from './providers/NotificationProvider';

// Providers from the new abstracted UI Framework
import { ThemeProvider } from '@jester-ui/core/theme';
import { WorkspaceProvider } from '@jester-ui/composite/workspace';

// Core singleton services to be initialized on startup
import { resourceOrchestrator } from './services/ResourceOrchestrator';
import { workerPoolManager } from './services/WorkerPoolManager';

/**
 * @function mount
 * @description Mounts the shell application into a given DOM element. This function orchestrates the
 *              initialization of all core services and providers, wrapping the main App component
 *              in the necessary context layers for the entire application to function correctly.
 *
 *              It pro-actively initializes the Resource Orchestrator and the Worker Pool Manager as per
 *              the architectural directives for a proactive, performant user experience.
 *
 * @param {HTMLElement} el - The DOM element into which the application shell will be rendered.
 * @returns {void}
 * @example
 * // In index.tsx
 * import('./bootstrap').then(({ mount }) => {
 *   const rootElement = document.getElementById('root');
 *   if (rootElement) {
 *     mount(rootElement);
 *   }
 * });
 */
const mount = (el: HTMLElement): void => {
  // Initialize core background services as per architectural directives.
  // These services will manage their own lifecycle from this point forward.
  resourceOrchestrator.initialize();
  workerPoolManager.initialize({ poolSize: navigator.hardwareConcurrency || 4 });

  const root = ReactDOM.createRoot(el);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <DependencyInjectionProvider container={container}>
          <NotificationProvider>
            <AuthenticationProvider>
              <GraphQLProvider>
                <ThemeProvider>
                  <WorkspaceProvider>
                    <App />
                  </WorkspaceProvider>
                </ThemeProvider>
              </GraphQLProvider>
            </AuthenticationProvider>
          </NotificationProvider>
        </DependencyInjectionProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

/**
 * @function devMount
 * @description A helper function for mounting the application in a development environment.
 *              It looks for a specific element ID ('_shell-dev-root') and mounts the app if found.
 *              This ensures the shell can run standalone for development and testing purposes,
 *              a common pattern in micro-frontend architectures.
 *
 * @returns {void}
 */
const devMount = (): void => {
    const devRoot = document.getElementById('_shell-dev-root');
    if (devRoot) {
        mount(devRoot);
    }
};

// Development-only mount logic.
// In a micro-frontend setup, we only want to auto-mount if we are in development and running standalone.
// In production, the container application (or the shell's own index.html) will call the `mount` function.
if (process.env.NODE_ENV === 'development') {
    devMount();
}

// Export the mount function for the container to use in production or federated environments.
export { mount };
