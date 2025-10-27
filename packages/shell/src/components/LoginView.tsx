/**
 * @file Renders the login view for the application shell.
 * @description This component serves as the primary entry point for unauthenticated users.
 * It provides a simple Google Sign-In button and an input for a Gemini API key to enable AI features.
 * @module LoginView
 * @security The Gemini API key is stored in localStorage, which is not secure for production secrets.
 * This implementation is for local development or demo purposes as per user request.
 * @performance This is a lightweight presentation component with minimal performance impact.
 */

import React, { useState } from 'react';
import { signInWithGoogle } from '../../../../services/googleAuthService';
import { CpuChipIcon, SparklesIcon } from '../../../../components/icons';

/**
 * A React functional component that renders the main login screen for the application.
 * It provides a user interface for signing in with Google and optionally providing a Gemini API key.
 *
 * @returns {React.ReactElement} The rendered login view component.
 * @example
 * <LoginView />
 */
const LoginView: React.FC = () => {
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem('gemini_api_key') || ''
  );

  /**
   * Handles the login process.
   * It saves the provided Gemini API key to localStorage and then initiates the Google Sign-In flow.
   */
  const handleLogin = (): void => {
    if (geminiApiKey.trim()) {
      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
    } else {
      // If the field is empty, remove any existing key.
      localStorage.removeItem('gemini_api_key');
    }
    signInWithGoogle();
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-background text-text-primary">
      <div className="w-full max-w-md p-8 space-y-8 bg-surface rounded-xl shadow-2xl border border-border">
        <div className="text-center">
          <div className="inline-block relative">
            <CpuChipIcon className="w-16 h-16 text-primary" />
            <SparklesIcon className="w-8 h-8 text-amber-400 absolute -right-2 -top-2" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
            Welcome to DevCore
          </h2>
          <p className="mt-2 text-text-secondary">
            Your AI-powered development environment.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="gemini-api-key" className="block text-sm font-medium text-text-secondary text-left mb-2">
              Gemini API Key (Optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <SparklesIcon className="w-5 h-5" />
              </span>
              <input
                id="gemini-api-key"
                name="gemini-api-key"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your key to enable AI features"
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleLogin}
              type="button"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-white" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.533,44,29.898,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
              </span>
              Sign in with Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-xs text-text-secondary text-center">
          Provide a Gemini API key to enable AI features. The key will be stored in your browser's local storage.
        </p>
      </div>
    </div>
  );
};

export default LoginView;
