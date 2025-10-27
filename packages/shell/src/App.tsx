/**
 * @file The root component of the application shell.
 * @description This file orchestrates the main application structure, including providers for
 * state management, theming, authentication, and the workspace. It acts as the entry
 * point for the authenticated user experience, loading the appropriate workspace or
 * directing to the login view.
 * @copyright 2024 Citibank Demo Business Inc.
 * @author Elite AI Implementation Team
 * @see {@link ../main.tsx} for where this component is rendered.
 * @security This component handles the root-level authentication check but delegates all
 * authentication logic and token handling to the `AuthProvider` and the backend `AuthGateway`.
 * The client-side application operates in a zero-trust model and never stores long-lived secrets.
 * @performance The main application is code-split, and this shell is designed to be a lightweight
 * container. The `WorkspaceManager` it loads is responsible for lazy-loading micro-frontends on demand,
 * optimized by the `ResourceOrchestrator`.
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from '@core/ui/components';
import { ThemeProvider } from '@core/theme-engine';
import { GlobalStateProvider } from '@shell/contexts/GlobalStateProvider';
import { NotificationProvider } from '@shell/contexts/NotificationProvider';
import { AuthProvider, useAuth } from '@shell/auth';
import { WorkspaceProvider } from '@composite/ui/workspace';
import { DesktopModeProvider } from '@composite/ui/workspace-modes';
import { LoadingSpinner } from '@core/ui/components';
import { diContainer } from '@shell/di-container';
import { ServiceIdentifiers } from '@services/identifiers';
import { IResourceOrchestrator } from '@services/resource-orchestration';

// Dynamically import heavyweight components
const WorkspaceManager = React.lazy(() => import('@composite/ui/workspace').then(module => ({ default: module.WorkspaceManager })));
const LoginView = React.lazy(() => import('@shell/views/LoginView').then(module => ({ default: module.LoginView })));

/**
 * @component AuthenticatedShell
 * @description This component represents the main application view for an authenticated user.
 * It initializes background services and renders the primary `WorkspaceManager`.
 * It's displayed only after a user has successfully authenticated.
 * @example
 * <AuthenticatedShell />
 * @returns {React.ReactElement} The main shell UI for an authenticated user.
 * @performance This component triggers the `ResourceOrchestrator` to begin predictive pre-fetching
 * of micro-frontends and data based on user patterns, improving perceived performance.
 */
const AuthenticatedShell: React.FC = () => {
  React.useEffect(() => {
    /**
     * @see {@link IResourceOrchestrator} for more details on predictive pre-fetching.
     * @security The orchestrator operates on anonymized or permission-gated user navigation data.
     */
    const resourceOrchestrator = diContainer.get<IResourceOrchestrator>(ServiceIdentifiers.ResourceOrchestrator);
    resourceOrchestrator.start();

    return () => {
      resourceOrchestrator.stop();
    };
  }, []);

  return (
    <WorkspaceProvider layoutProvider={DesktopModeProvider}>
      <Suspense fallback={<LoadingSpinner size="large" label="Loading Workspace..." />}>
        <WorkspaceManager />
      </Suspense>
    </WorkspaceProvider>
  );
};

/**
 * @component AppContent
 * @description Determines whether to show the `LoginView` or the `AuthenticatedShell`
 * based on the user's authentication state provided by the `useAuth` hook.
 * This acts as the primary gatekeeper for the application's secure areas.
 * @returns {React.ReactElement} The rendered component based on authentication state.
 */
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner size="large" label="Initializing Session..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner size="large" />}>
      {isAuthenticated ? <AuthenticatedShell /> : <LoginView />}
    </Suspense>
  );
};

/**
 * @component App
 * @description The absolute root component of the application. It wraps the entire
 * application in necessary providers for error handling, theming, notifications,
 * global state, and authentication. This ensures that all core services and contexts
 * are available to every component in the tree.
 * @returns {React.ReactElement} The fully-wrapped application.
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div>Application has encountered a critical error.</div>}>
      <GlobalStateProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <div className="h-screen w-screen font-sans overflow-hidden bg-background text-text-primary">
                <AppContent />
              </div>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </GlobalStateProvider>
    </ErrorBoundary>
  );
};

export default App;
