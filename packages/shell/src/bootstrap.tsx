/**
 * @file bootstrap.tsx
 * @description
 * This file serves as the primary entry point for mounting the federated micro-frontend shell application.
 * It is responsible for initializing core services, setting up all top-level application providers,
 * and rendering the main App component into a specified DOM element. This pattern is crucial for
 * a scalable and maintainable micro-frontend architecture.
 *
 * @see ./index.tsx For the dynamic import implementation that calls `mount`.
 * @see ./App.tsx For the shell's root React component which is wrapped by these providers.
 * @security This file initializes providers that manage sensitive state (e.g., Auth).
 *           The providers themselves are responsible for secure data handling.
 * @performance The initialization logic here is critical for application startup. Core services
 *              like a Resource Orchestrator should be initialized here in a non-blocking way.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '../../../ErrorBoundary';

// Providers from existing file structure, paths corrected based on the repo file tree.
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { VaultProvider } from '../../../components/vault/VaultProvider';

/**
 * @function mount
 * @description Mounts the shell application into a given DOM element. This function orchestrates the
 *              initialization of all core services and providers, wrapping the main App component
 *              in the necessary context layers for the entire application to function correctly.
 *
 *              In a full micro-frontend architecture, this would also initialize services like a
 *              Resource Orchestrator and a Worker Pool Manager to enable proactive, performant
 *              user experiences.
 *
 * @param {HTMLElement} el - The DOM element into which the application shell will be rendered.
 * @returns {void}
 * @example
 * // In index.tsx (conceptual)
 * import('./bootstrap').then(({ mount }) => {
 *   const rootElement = document.getElementById('root');
 *   if (rootElement) {
 *     mount(rootElement);
 *   }
 * });
 */
const mount = (el: HTMLElement): void => {
  // As per architectural directives, core singleton services would be initialized here.
  // Example:
  // resourceOrchestrator.initialize();
  // workerPoolManager.initialize({ poolSize: navigator.hardwareConcurrency || 4 });

  const root = ReactDOM.createRoot(el);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        {/*
          This provider hierarchy establishes the global context for the entire shell application.
          It ensures that core services like state management, notifications, and the vault
          are available to all components within the shell and its hosted micro-frontends.
        */}
        <GlobalStateProvider>
          <NotificationProvider>
            <VaultProvider>
              <App />
            </VaultProvider>
          </NotificationProvider>
        </GlobalStateProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

/**
 * @function devMount
 * @description A helper function for mounting the application in a development environment.
 *              It looks for a standard 'root' element and mounts the app if found.
 *              This ensures the shell can run standalone for development and testing.
 *
 * @returns {void}
 */
const devMount = (): void => {
    const devRoot = document.getElementById('root');
    if (devRoot) {
        mount(devRoot);
    } else {
        console.error('[Shell Bootstrap] Could not find root element with id="root" for standalone mounting.');
    }
};

// Development-only mount logic.
// In a federated setup, we only want to auto-mount if we are running the shell standalone in development.
// The host's index.html will be responsible for calling `mount` in production.
if (process.env.NODE_ENV === 'development') {
    devMount();
}

// Export the mount function for consumption by a host environment or dynamic importer.
export { mount };
