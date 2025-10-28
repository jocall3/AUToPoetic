/**
 * @file This is the main entry point for the DevCore AI Toolkit application.
 * @module index
 * @description Initializes the React application and sets up the root DOM element.
 * As per the new federated micro-frontend architecture, this entry point now bootstraps the 'shell' application.
 * It wraps the main shell component with essential global context providers, such as the ErrorBoundary and VaultProvider,
 * to ensure a consistent and resilient application environment.
 * @copyright James Burvel O'Callaghan III
 * @license SPDX-License-Identifier: Apache-2.0
 * @see {@link ./packages/shell/src/App.tsx} for the main shell application component.
 * @see {@link ./components/vault/VaultProvider.tsx} for the new simplified secrets management context.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import Shell from './packages/shell/src/App.tsx';
import { VaultProvider } from './components/vault/VaultProvider.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';

/**
 * The root DOM element where the React application will be mounted.
 * A runtime check is performed to ensure this element exists in the DOM.
 * @constant {HTMLElement}
 * @throws {Error} If the element with the ID 'root' is not found in the document.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Fatal Error: Could not find the root element with ID 'root' in the DOM. The application cannot be mounted.");
}

/**
 * Creates the React root instance for concurrent rendering.
 * This is the modern approach for initializing React applications since React 18.
 * @see {@link https://react.dev/reference/react-dom/client/createRoot}
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Renders the main application component tree into the root DOM element.
 * The entire application is wrapped in React's StrictMode for development checks,
 * and a hierarchy of global providers for error handling and secrets management.
 * Other providers like GlobalState and Notifications are handled within the Shell component itself.
 */
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <VaultProvider>
        <Shell />
      </VaultProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
