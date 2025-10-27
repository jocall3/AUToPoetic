/**
 * @file The root component of the application shell.
 * @description This file orchestrates the main application structure, including providers for
 * state management, theming, and the workspace. It acts as the entry
 * point for the authenticated user experience, loading the appropriate workspace or
 * directing to the login view.
 * @copyright 2024 Citibank Demo Business Inc.
 * @author Elite AI Implementation Team
 * @security This component handles the root-level authentication check but delegates all
 * authentication logic and token handling to the `googleAuthService` and backend `AuthGateway`.
 * The client-side application operates in a zero-trust model and never stores long-lived secrets.
 * The Gemini API key is stored in localStorage as per user request.
 * @performance The main application is code-split, and this shell is designed to be a lightweight
 * container. The `WorkspaceManager` it loads is responsible for lazy-loading micro-frontends on demand.
 */

import React, { Suspense, useState, useEffect, createContext, useContext } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary'; // Assuming path from new architecture
import { GlobalStateProvider, useGlobalState } from './contexts/GlobalStateContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoadingIndicator } from './components/LoadingIndicator';
import { initGoogleAuth } from './services/googleAuthService';
import { AppUser } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

// Dynamically import heavyweight components
const WorkspaceManager = React.lazy(() => import('./components/WorkspaceManager'));
const LoginView = React.lazy(() => import('./components/LoginView'));

// Context for providing the Gemini API key to the application
export const AiApiKeyContext = createContext<string | null>(null);
export const useAiApiKey = () => useContext(AiApiKeyContext);

/**
 * @component ApiKeyModal
 * @description A modal to prompt the user for their Gemini API key if it's not already set.
 * @param {{ onSave: (key: string) => void }} props The component props.
 * @returns {React.ReactElement} The modal component.
 */
const ApiKeyModal: React.FC<{ onSave: (key: string) => void }> = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg p-6 sm:p-8 shadow-2xl w-full max-w-md animate-pop-in">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Enter Gemini API Key</h2>
        <p className="text-text-secondary mb-6">
          To use the AI features in this application, please provide your Google Gemini API key. You can create one in Google AI Studio.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key here"
          className="w-full p-3 bg-background border border-border rounded-md mb-4 text-text-primary focus:ring-2 focus:ring-primary"
        />
        <button onClick={handleSave} className="btn-primary w-full py-3 font-semibold">
          Save and Continue
        </button>
        <p className="text-xs text-text-secondary mt-4 text-center">Your API key is stored locally in your browser and is not sent to our servers.</p>
      </div>
    </div>
  );
};

/**
 * @component AuthenticatedShell
 * @description This component represents the main application view for an authenticated user.
 * It renders the primary `WorkspaceManager` and provides it with the Gemini API key via context.
 * @returns {React.ReactElement} The main shell UI for an authenticated user.
 */
const AuthenticatedShell: React.FC = () => {
  const [geminiApiKey] = useLocalStorage('gemini_api_key', '');
  
  return (
    <AiApiKeyContext.Provider value={geminiApiKey}>
        <Suspense fallback={<LoadingIndicator />}>
            <WorkspaceManager />
        </Suspense>
    </AiApiKeyContext.Provider>
  );
};

/**
 * @component AppContent
 * @description Determines whether to show the `LoginView` or the `AuthenticatedShell`
 * based on the user's authentication state. Also gates the authenticated view
 * behind the Gemini API key entry.
 * @returns {React.ReactElement} The rendered component based on authentication state.
 */
const AppContent: React.FC = () => {
  const { state } = useGlobalState();
  const { user, initialAuthChecked } = state.session;
  const [geminiApiKey, setGeminiApiKey] = useLocalStorage('gemini_api_key', '');
  const [isKeyProvided, setIsKeyProvided] = useState(!!geminiApiKey);

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    setIsKeyProvided(true);
  };

  if (!initialAuthChecked) {
    return <LoadingIndicator />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingIndicator />}>
        <LoginView />
      </Suspense>
    );
  }

  if (!isKeyProvided) {
    return <ApiKeyModal onSave={handleSaveApiKey} />;
  }

  return <AuthenticatedShell />;
};

/**
 * @component App
 * @description The root component of the application. It wraps the entire
 * application in necessary providers and initializes the Google authentication flow.
 * @returns {React.ReactElement} The fully-wrapped application.
 */
const App: React.FC = () => {
  const { dispatch } = useGlobalState();

  useEffect(() => {
    const handleUserChanged = (user: AppUser | null) => {
      dispatch({ type: 'SET_SESSION', payload: { user: user, isAuthenticated: !!user, initialAuthChecked: true } });
    };

    const initAuth = () => {
      if ((window as any).google) {
        initGoogleAuth(handleUserChanged);
      } else {
        handleUserChanged(null); // No google lib, definitely not logged in
      }
    };

    const gsiScript = document.getElementById('gsi-client');
    if ((window as any).google) {
      initAuth();
    } else if (gsiScript) {
      gsiScript.addEventListener('load', initAuth);
      return () => gsiScript.removeEventListener('load', initAuth);
    } else {
      // If script isn't even in the HTML, mark auth as checked and failed.
       dispatch({ type: 'SET_SESSION', payload: { initialAuthChecked: true, user: null, isAuthenticated: false } });
    }
  }, [dispatch]);

  return (
    <ErrorBoundary fallback={<div>Application has encountered a critical error.</div>}>
        <NotificationProvider>
          <div className="h-screen w-screen font-sans overflow-hidden bg-background text-text-primary">
            <AppContent />
          </div>
        </NotificationProvider>
    </ErrorBoundary>
  );
};

/**
 * Root component that wraps the App with the GlobalStateProvider.
 */
const Root: React.FC = () => (
    <GlobalStateProvider>
        <App />
    </GlobalStateProvider>
);

export default Root;
