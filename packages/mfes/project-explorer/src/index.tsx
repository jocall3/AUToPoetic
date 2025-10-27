/**
 * @file Main entry point for the ProjectExplorer Micro-Frontend (MFE).
 * @module packages/mfes/project-explorer/src/index
 * @description
 * This file is responsible for bootstrapping the ProjectExplorer MFE. It provides a `mount` function
 * that the host application (shell) uses to render the MFE into a designated container.
 *
 * For standalone development, this script will also automatically mount the application
 * into a root element in the development HTML shell, allowing the MFE to be developed and
 * tested in isolation. This requires setting up all necessary providers (e.g., GraphQL, Theme, DI)
 * that would normally be provided by the host.
 * @see {@link ./App.tsx} - The root component of this MFE.
 * @security This is a client-side entry point. It contains no sensitive data but initiates the loading of all MFE assets.
 * @performance This is the initial chunk loaded for this MFE. Its size should be kept minimal by deferring provider and component logic to other files like App.tsx.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// The App component encapsulates the ProjectExplorer feature along with any
// necessary providers for standalone operation.
import App from './App';

// Define a type for the return value of mount for clarity and type safety.
type MountReturn = {
  unmount: () => void;
};

/**
 * Mounts the ProjectExplorer Micro-Frontend into a target DOM element.
 *
 * This function creates a React root and renders the main App component. It is designed
 * to be exported and consumed by a host application in a Module Federation architecture.
 *
 * @param {HTMLElement} el The DOM element to mount the application into.
 * @param {Record<string, unknown>} [initialProps={}] - Optional initial properties passed from the host application. These can be used to provide context, tokens, or initial data.
 * @returns {MountReturn} An object containing an `unmount` function to clean up the mounted application.
 * @throws {Error} If the provided `el` is not a valid HTMLElement.
 *
 * @example
 * // In the host application:
 * import { mount } from 'projectExplorer/ProjectExplorerApp'; // Consumed via Module Federation
 * const mfeContainerRef = useRef<HTMLDivElement>(null);
 *
 * useEffect(() => {
 *   if (mfeContainerRef.current) {
 *     const { unmount } = mount(mfeContainerRef.current, { userToken: 'some-jwt' });
 *     return () => unmount();
 *   }
 * }, []);
 *
 * // <div ref={mfeContainerRef} />
 */
const mount = (el: HTMLElement, initialProps: Record<string, unknown> = {}): MountReturn => {
  if (!(el instanceof HTMLElement)) {
    throw new Error('[ProjectExplorer MFE] The `mount` function requires a valid HTMLElement as its first argument.');
  }

  const root = ReactDOM.createRoot(el);
  root.render(
    <React.StrictMode>
      <App {...initialProps} />
    </React.StrictMode>
  );

  /**
   * Unmounts the React application from the target element.
   * @performance
   * The unmount function is critical for MFEs to allow the host application to
   * properly clean up resources, event listeners, and state when the MFE is no longer
   * needed. This prevents memory leaks and ensures a clean lifecycle within the host.
   */
  const unmount = () => {
    try {
      root.unmount();
    } catch (error) {
      console.error('[ProjectExplorer MFE] Error during unmount:', error);
    }
  };

  return { unmount };
};

// --- Standalone Development Mode ---
// This block enables the MFE to be run in isolation for development and testing.
// It looks for a specific DOM element and mounts the app, simulating how a host
// application would. This code is typically tree-shaken in production builds when
// consumed by the host, as `process.env.NODE_ENV` will not be 'development'.
if (process.env.NODE_ENV === 'development') {
  const devRoot = document.getElementById('root-project-explorer');

  if (devRoot) {
    // In standalone mode, we mount the MFE with some default or mocked props for testing.
    mount(devRoot, { isStandalone: true });
  } else {
    // This warning helps developers correctly set up their standalone development environment.
    console.warn(
      '[ProjectExplorer MFE] Could not find root element with id="root-project-explorer" for standalone mounting. Please ensure it exists in your development index.html.'
    );
  }
}

// Export the mount function for the host application to consume via Module Federation.
export { mount };
