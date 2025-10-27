/**
 * @file Renders the login view for the application shell.
 * @description This component serves as the primary entry point for unauthenticated users.
 * It presents authentication options and initiates the server-side OIDC flow by redirecting
 * the user to the AuthGateway microservice. This adheres to the zero-trust security model
 * where the client application never handles long-lived credentials.
 * @module LoginView
 * @security This component initiates a redirect to a server-side authentication endpoint.
 * It does not handle any secrets or tokens on the client-side. The `AUTH_GATEWAY_URL`
 * should be configured via environment variables for different environments.
 * @performance This is a lightweight presentation component with minimal performance impact.
 * The authentication flow itself involves network redirects which have their own latency.
 */

import React from 'react';

// In a production environment, this would be sourced from a configuration file
// or environment variables provided by the build system.
const AUTH_GATEWAY_URL = 'http://localhost:4001';

/**
 * A React functional component that renders the main login screen for the application.
 * It provides a user interface for initiating the authentication process.
 *
 * @returns {React.ReactElement} The rendered login view component.
 * @example
 * <LoginView />
 */
const LoginView: React.FC = () => {

  /**
   * Initiates the server-side OIDC login flow by redirecting the user.
   * This function is triggered when the user clicks the "Sign in" button. It constructs
   * the appropriate URL for the AuthGateway service and redirects the browser to it,
   * kicking off the authentication dance with the identity provider (Google).
   *
   * @security This method follows the recommended OIDC Authorization Code Flow by redirecting
   * to a backend endpoint. The client never handles secrets.
   * @returns {void}
   */
  const handleLogin = (): void => {
    // Redirect to the backend AuthGateway to start the OIDC flow.
    // The gateway will handle the interaction with Google and then redirect
    // back to the application with a short-lived JWT upon successful authentication.
    window.location.href = `${AUTH_GATEWAY_URL}/auth/google`;
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-background text-text-primary">
      <div className="w-full max-w-md p-8 space-y-8 bg-surface rounded-xl shadow-2xl border border-border">
        <div className="text-center">
          {/* DevCore Application Icon */}
          <svg className="mx-auto h-12 w-auto text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
            Sign in to DevCore
          </h2>
          <p className="mt-2 text-text-secondary">
            Your AI-powered development environment.
          </p>
        </div>
        <div>
          <button
            onClick={handleLogin}
            type="button"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              {/* Google Icon SVG */}
              <svg className="h-5 w-5 text-white" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.533,44,29.898,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
            </span>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
