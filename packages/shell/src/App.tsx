/**
 * @file The root component for the application shell.
 * @description This file orchestrates the main application structure, including routing,
 * providers for global state and theming, and the primary authenticated user experience.
 * It aligns with the federated micro-frontend architecture by acting as a lean host,
 * delegating feature rendering to the WorkspaceManager and authentication to the AuthClient.
 * @copyright 2024 Citibank Demo Business Inc.
 * @author Elite AI Implementation Team
 * @see The architectural directives for MFE, BFF, and Zero-Trust security.
 */

import React, { Suspense, useEffect, useCallback, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { GlobalStateProvider, useGlobalState } from './contexts/GlobalStateContext';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';
import { AuthClient } from '@devcore/auth-client'; // Assuming path from new architecture
import { useTheme } from '@devcore/theme-engine'; // Assuming path from new architecture

// --- Core Components of the Shell ---
import { LeftSidebar } from '../../components/LeftSidebar';
import { StatusBar } from '../../components/StatusBar';
import { CommandPalette } from '../../components/CommandPalette';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

// --- Icons for Sidebar ---
import { Cog6ToothIcon, HomeIcon, FolderIcon, RectangleGroupIcon } from '../../components/icons';

// --- Types ---
import type { AppUser, SidebarItem, ViewType } from '../../types';
import { ALL_FEATURES } from '../../components/features';

// --- Lazy Loaded Components for Code Splitting ---
const WorkspaceManager = React.lazy(() => import('../../packages/workspace-manager/src/WorkspaceManager'));
const LoginView = React.lazy(() => import('./components/LoginView'));

/**
 * @constant authClient
 * @description A singleton instance of the AuthClient for managing OIDC authentication flows with the AuthGateway.
 * The redirectUri must match the configuration in the AuthGateway.
 */
const authClient = new AuthClient({
  authGatewayUrl: '/api/auth', // This should be proxied to the AuthGateway microservice
  clientId: 'devcore-shell-client',
  redirectUri: `${window.location.origin}/AUToPoetic/callback`,
  postLogoutRedirectUri: `${window.location.origin}/AUToPoetic/`,
});

/**
 * @component AuthCallback
 * @description A view dedicated to handling the OAuth2 redirect from the AuthGateway.
 * It calls `handleLoginCallback` and then navigates the user to the application's root.
 * @returns {React.ReactElement} A loading indicator.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await authClient.handleLoginCallback();
        navigate('/');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown authentication error occurred.';
        addNotification(`Login failed: ${errorMessage}`, 'error');
        console.error('Authentication callback error:', error);
        navigate('/login'); // Redirect to login on failure
      }
    };
    processCallback();
  }, [navigate, addNotification]);

  return <LoadingSpinner text="Finalizing authentication..." className="h-screen" />;
};

/**
 * @component AuthenticatedApp
 * @description Renders the main authenticated UI shell, including the sidebar, status bar, and workspace.
 * @returns {React.ReactElement}
 */
const AuthenticatedApp: React.FC = () => {
  const { state, dispatch } = useGlobalState();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleNavigate = useCallback((view: ViewType, props: any = {}) => {
    // In a full MFE architecture, this would likely interact with a more robust routing or workspace management system.
    // For now, it updates a simple global state.
    // A more advanced implementation might use `openPlugin` from a workspace manager context.
    console.log(`Navigating to view: ${view}`);
  }, []);

  const sidebarItems: SidebarItem[] = useMemo(() => {
    // This logic should be driven by a feature registry service in a mature architecture.
    return [
      { id: 'home', label: 'Home', icon: <HomeIcon />, view: 'dashboard' },
      { id: 'project-explorer', label: 'Project Explorer', icon: <FolderIcon />, view: 'project-explorer' },
      { id: 'connections', label: 'Connections', icon: <RectangleGroupIcon />, view: 'connections' },
      { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon />, view: 'settings' },
    ];
  }, []);

  return (
    <div className="relative flex h-full w-full bg-background">
      <LeftSidebar items={sidebarItems} activeView={'dashboard'} onNavigate={handleNavigate} />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="relative flex-1 bg-surface/50 dark:bg-slate-900/50 overflow-hidden">
          <Suspense fallback={<LoadingSpinner />}>
            <WorkspaceManager />
          </Suspense>
        </main>
        <StatusBar bgImageStatus="loaded" />
      </div>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
};

/**
 * @component App
 * @description The main application component that orchestrates authentication state and renders
 * either the LoginView or the AuthenticatedApp. It initializes the theme and auth listeners.
 * @returns {React.ReactElement}
 */
const App: React.FC = () => {
  useTheme(); // Initialize and apply the theme from the theme-engine
  const { state, dispatch } = useGlobalState();

  useEffect(() => {
    // Subscribe to authentication state changes from the AuthClient
    const unsubscribe = authClient.onAuthStateChanged(async (authState) => {
      if (authState === 'authenticated') {
        const session = authClient.getSession();
        // In a real app, you might fetch additional user profile details from your BFF here.
        const user: AppUser = {
          uid: session?.sub ?? 'unknown',
          displayName: session?.name ?? null,
          email: session?.email ?? null,
          photoURL: session?.picture ?? null,
          tier: 'pro',
          roles: [], // Roles should be fetched from your BFF based on the user's session
        };
        dispatch({ type: 'SESSION_SET_STATE', payload: { status: 'authenticated', user } });
      } else {
        dispatch({ type: 'SESSION_SET_STATE', payload: { status: 'unauthenticated', user: null } });
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  if (state.session.status === 'pending') {
    return <LoadingSpinner text="Initializing session..." className="h-screen" />;
  }

  if (state.session.status === 'authenticated') {
    return <AuthenticatedApp />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginView onLogin={() => authClient.login()} />
    </Suspense>
  );
};

/**
 * @component Root
 * @description The absolute root component of the application. It sets up all global providers
 * and the router, creating the foundational context for the entire app.
 * @returns {React.ReactElement}
 */
const Root: React.FC = () => (
  <ErrorBoundary>
    <GlobalStateProvider>
      <NotificationProvider>
        <BrowserRouter basename="/AUToPoetic/">
          <Routes>
            <Route path="/callback" element={<AuthCallback />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </GlobalStateProvider>
  </ErrorBoundary>
);

export default Root;
