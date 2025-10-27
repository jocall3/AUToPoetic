/**
 * @file This is the main entry point for the DevCore AI Toolkit application.
 * @module index
 * @description Initializes the React application, sets up the root DOM element,
 * and wraps the main App component with essential global context providers.
 * This file orchestrates the initial rendering and setup of the entire
 * client-side application.
 * @copyright James Burvel O'Callaghan III
 * @license SPDX-License-Identifier: Apache-2.0
 * @see {@link ./App.tsx} for the main application component.
 * @see {@link ./contexts/GlobalStateContext.tsx} for the global state management.
 * @see {@link ./contexts/NotificationContext.tsx} for the notification system.
 * @security This file does not handle any sensitive data directly, but it initializes
 * providers that may eventually interact with authenticated services. All authentication
 * logic is handled within designated providers and services, not at this entry point.
 * @performance This file's execution is critical for the application's initial load time.
 * All providers wrapped here are designed to be lightweight on initialization.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { GlobalStateProvider } from './contexts/GlobalStateContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import './index.css';

/**
 * The root DOM element where the React application will be mounted.
 * A runtime check is performed to ensure this element exists in the DOM.
 * @constant {HTMLElement}
 * @throws {Error} If the element with the ID 'root' is not found in the document.
 * @example
 * // In index.html:
 * // <div id="root"></div>
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  // This is a critical failure, as the application cannot render without its mount point.
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
 * and a hierarchy of global providers for state management and other cross-cutting concerns.
 *
 * The provider hierarchy is structured as follows:
 * - React.StrictMode: Enables development-mode checks for potential problems in the application.
 * - GlobalStateProvider: Manages the core application state, such as the active view and user information.
 * - NotificationProvider: Manages and displays global notifications and alerts.
 * - App: The root component of the application's UI and logic.
 *
 * @description The rendering is initiated here, starting the application lifecycle.
 */
root.render(
  <React.StrictMode>
    <GlobalStateProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </GlobalStateProvider>
  </React.StrictMode>
);
