/**
 * @file Entry point for the ThemeDesigner Micro-Frontend.
 * @module ThemeDesignerMFE/index
 * @description
 * This file handles the bootstrapping of the ThemeDesigner application. It supports two modes of operation:
 * 1.  **Standalone Mode:** When run directly in development, it mounts the application into a local 'root' DOM element.
 * 2.  **Federated Mode:** When consumed by a host application (shell), it exports a `mount` function, allowing the host
 *     to render the ThemeDesigner MFE into a specified container element.
 *
 * This pattern is crucial for achieving independent deployability and development as part of a federated micro-frontend architecture.
 *
 * @security This file itself does not handle sensitive data but is responsible for initializing the application context,
 * which may include services that interact with authenticated APIs. The actual authentication logic is handled by the shell
 * and the BFF/AuthGateway layer.
 * @performance In a more complex setup, this file would dynamically import a `bootstrap.tsx` file, allowing Webpack to negotiate
 * shared dependencies before executing app logic. This combined approach is clear and sufficient for many cases.
 * @example
 * // In a host application's component:
 * import { mount } from 'themeDesigner/ThemeDesignerApp';
 * import React, { useRef, useEffect } from 'react';
 *
 * const ThemeDesignerHost = () => {
 *   const mfeRef = useRef(null);
 *
 *   useEffect(() => {
 *     if (mfeRef.current) {
 *       const { unmount } = mount(mfeRef.current);
 *       return () => unmount(); // Clean up on component unmount
 *     }
 *   }, []);
 *
 *   return <div ref={mfeRef} />;
 * };
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// 'App' is the root component of this Micro-Frontend.
// It is assumed to exist in './App.tsx' and provide all necessary contexts (e.g., ThemeProvider).
import App from './App';

/**
 * Renders the ThemeDesigner micro-frontend into a specified DOM element.
 *
 * This function creates a new React root and renders the main `App` component. It's designed to be
 * called by a host application in a federated architecture. It returns an `unmount` function
 * to clean up the MFE when it's no longer needed.
 *
 * @param {Element} el The DOM element where the micro-frontend should be mounted.
 * @returns {{unmount: () => void}} An object with an `unmount` function to clean up the React root.
 * @performance Creates a new React root for each mount, ensuring isolation from the host application's React tree.
 *              The returned unmount function is critical for preventing memory leaks in the host when the MFE is removed.
 * @security Assumes the provided DOM element `el` is a safe and trusted mounting point within the host application's DOM.
 *           The MFE itself should be sandboxed or come from a trusted source.
 */
const mount = (el: Element): { unmount: () => void } => {
  const root = ReactDOM.createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  /**
   * Cleans up the mounted micro-frontend instance.
   *
   * This should be called by the host application when the MFE is no longer needed.
   * @performance Prevents memory leaks by properly unmounting the React component tree.
   */
  const unmount = () => {
    try {
      root.unmount();
    } catch (error) {
      console.error('Error while unmounting ThemeDesigner MFE:', error);
    }
  };

  return { unmount };
};

// --- Standalone Execution ---

/**
 * This block checks if the micro-frontend is running in standalone mode (typically for development).
 * If it finds a specific element in the DOM (e.g., an element with ID 'theme-designer-mfe-root'),
 * it mounts the application into it. This allows the MFE to be developed and tested in isolation.
 *
 * The check for `process.env.NODE_ENV === 'development'` ensures this code only runs
 * in a development environment, preventing it from executing when federated into a production host.
 * @see {@link mount}
 */
if (process.env.NODE_ENV === 'development') {
  // A unique ID for standalone mode to avoid conflicts with the host's root element.
  const devRoot = document.querySelector('#theme-designer-mfe-root');

  if (devRoot) {
    mount(devRoot);
  } else {
    // Fallback to a generic '#root' if the specific one isn't found.
    const genericRoot = document.querySelector('#root');
    if (genericRoot) {
      mount(genericRoot);
    } else {
      console.error(
        '[ThemeDesignerMFE] Could not find a root element for standalone mounting. ' +
        'Please ensure an element with id "theme-designer-mfe-root" or "root" exists in your index.html.'
      );
    }
  }
}

/**
 * Export the `mount` function to make it available for consumption by the host application
 * via Module Federation.
 * @export {mount}
 */
export { mount };
