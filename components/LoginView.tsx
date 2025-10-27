import React from 'react';
import { CpuChipIcon, SparklesIcon } from './icons.tsx';

/**
 * @file LoginView.tsx
 * @description Provides the user interface for initiating the server-side authentication flow.
 * This component is displayed when no authenticated user session is detected.
 *
 * @module components/LoginView
 *
 * @security
 * This component adheres to the Zero-Trust architecture directive by offloading all
 * authentication logic to a server-side AuthGateway. It does not handle any credentials,
 * tokens, or secrets directly. Its sole responsibility is to redirect the user to the
 * secure, server-side gateway for authentication via OIDC. This prevents any client-side
 * exposure of secrets.
 *
 * @performance
 * This is a lightweight, static component with minimal performance overhead. It has no
 * internal state management or complex rendering logic, ensuring a fast initial paint
 * for unauthenticated users.
 *
 * @example
 * import { LoginView } from './LoginView';
 * // ...
 * return <LoginView />;
 */
export const LoginView: React.FC = () => {
  /**
   * Initiates the server-side OIDC login flow by redirecting the user's browser.
   * @function handleLogin
   * @security This function redirects to a relative URL ('/api/auth/login'), assuming the AuthGateway
   * is proxied through the same domain as the frontend application. This abstraction
   * avoids CORS issues and keeps the authentication endpoint configuration on the server.
   * The backend will handle the entire OIDC dance with the identity provider (e.g., Google),
   * ultimately redirecting the user back to the application with a secure, short-lived JWT.
   * @returns {void}
   */
  const handleLogin = (): void => {
    // The URL of the AuthGateway's login endpoint.
    // This endpoint will initiate the OIDC flow.
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-text-primary p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-block">
          <div className="flex items-center justify-center text-primary">
            <CpuChipIcon className="w-16 h-16" />
            <SparklesIcon className="w-10 h-10 -ml-4 -mt-4 text-amber-400" />
          </div>
        </div>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
          DevCore AI Toolkit
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Welcome to your secure, client-side AI development environment.
        </p>

        <div className="mt-10">
          <button
            onClick={handleLogin}
            className="w-full rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-text-on-primary shadow-lg transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Sign in with SSO
          </button>
        </div>

        <p className="mt-8 text-xs text-text-secondary">
          By signing in, you will be redirected to our secure authentication gateway.
          Your credentials are never handled by this client application.
        </p>
      </div>
    </div>
  );
};
