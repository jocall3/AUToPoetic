/**
 * @file App.tsx
 * @description The root component of the application shell.
 * This file orchestrates the main application structure, including providers for
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

import React, {
  Suspense,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

// Providers and State Management
import { ErrorBoundary } from './ErrorBoundary';
import {
  GlobalStateProvider,
  useGlobalState,
} from './contexts/GlobalStateContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useTheme } from './hooks/useTheme';

// Services
import { initGoogleAuth } from './services/googleAuthService';

// Components (Lazy Loaded)
const LoginView = React.lazy(() => import('./components/LoginView'));
const LeftSidebar = React.lazy(() => import('./components/LeftSidebar'));
const StatusBar = React.lazy(() => import('./components/StatusBar'));
const CommandPalette = React.lazy(() => import('./components/CommandPalette'));
const ActionManager = React.lazy(() => import('./components/ActionManager'));

// Dynamic Feature Loading
import { ALL_FEATURES } from './components/features';
import type { AppUser, SidebarItem, ViewType } from './types';
import './index.css';

// Icons
import {
  Cog6ToothIcon,
  HomeIcon,
  FolderIcon,
  RectangleGroupIcon,
} from './components/icons';

/**
 * A loading indicator for suspended components.
 */
const LoadingIndicator: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-background text-text-secondary">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="ml-4 text-lg">Loading Environment...</p>
  </div>
);

/**
 * The WorkspaceManager dynamically renders the active feature component.
 * @param {{ activeView: ViewType; viewProps: any }} props Component props.
 * @returns {React.ReactElement} The rendered feature or a fallback.
 */
const WorkspaceManager: React.FC<{ activeView: ViewType; viewProps: any }> = ({ activeView, viewProps }) => {
  const FeatureComponent = useMemo(() => {
    const feature = ALL_FEATURES.find(f => f.id === activeView);
    return feature ? feature.component : null;
  }, [activeView]);

  if (!FeatureComponent) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        <p>Feature "{activeView}" not found.</p>
      </div>
    );
  }

  return <FeatureComponent {...viewProps} />;
};

/**
 * The main UI for an authenticated user, containing the shell and workspace.
 */
const AuthenticatedApp: React.FC = () => {
  const { state, dispatch } = useGlobalState();
  const { activeView, viewProps, hiddenFeatures } = state.workspace;
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((isOpen) => !isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewChange = useCallback(
    (view: ViewType, props: any = {}) => {
      dispatch({ type: 'SET_VIEW', payload: { view, props } });
      setCommandPaletteOpen(false);
    },
    [dispatch],
  );

  const sidebarItems: SidebarItem[] = useMemo(() => {
    const coreFeatures = [
      'ai-command-center',
      'project-explorer',
      'workspace-connector-hub',
    ];
    const visibleFeatures = ALL_FEATURES.filter(
      (feature) =>
        !hiddenFeatures.includes(feature.id) &&
        !coreFeatures.includes(feature.id),
    );

    return [
      {
        id: 'ai-command-center',
        label: 'Command Center',
        icon: <HomeIcon />,
        view: 'ai-command-center',
      },
      {
        id: 'project-explorer',
        label: 'Project Explorer',
        icon: <FolderIcon />,
        view: 'project-explorer',
      },
      {
        id: 'workspace-connector-hub',
        label: 'Connections',
        icon: <RectangleGroupIcon />,
        view: 'workspace-connector-hub',
      },
      ...visibleFeatures.map((feature) => ({
        id: feature.id,
        label: feature.name,
        icon: feature.icon,
        view: feature.id as ViewType,
      })),
      {
        id: 'settings',
        label: 'Settings',
        icon: <Cog6ToothIcon />,
        view: 'settings',
      },
    ];
  }, [hiddenFeatures]);

  return (
    <div className="relative flex h-full w-full">
      <Suspense fallback={<div className="w-20 h-full bg-surface" />}>
        <LeftSidebar
          items={sidebarItems}
          activeView={activeView}
          onNavigate={handleViewChange}
        />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="relative flex-1 min-w-0 bg-surface/50 dark:bg-slate-900/50 overflow-hidden">
          <ErrorBoundary>
            <Suspense fallback={<LoadingIndicator />}>
              <WorkspaceManager activeView={activeView} viewProps={viewProps} />
            </Suspense>
          </ErrorBoundary>
          <Suspense fallback={null}>
            <ActionManager />
          </Suspense>
        </main>
        <Suspense fallback={<div className="h-8 w-full bg-surface" />}>
          <StatusBar bgImageStatus="loaded" />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </Suspense>
    </div>
  );
};

/**
 * Determines whether to show the LoginView or the AuthenticatedApp.
 */
const AuthGate: React.FC = () => {
  const { state } = useGlobalState();
  const { user, initialAuthChecked } = state.session;

  if (!initialAuthChecked) {
    return <LoadingIndicator />;
  }

  return (
    <Suspense fallback={<LoadingIndicator />}>
      {user ? <AuthenticatedApp /> : <LoginView />}
    </Suspense>
  );
};

/**
 * The main App component, responsible for auth initialization and theme setup.
 */
const App: React.FC = () => {
  const { dispatch } = useGlobalState();
  useTheme(); // Initialize and apply theme from local storage.

  useEffect(() => {
    const handleUserChanged = (user: AppUser | null) => {
      dispatch({ type: 'SET_APP_USER', payload: user });
    };

    const initializeAuth = () => {
      if (window.google) {
        initGoogleAuth(handleUserChanged);
      } else {
        console.warn('Google Identity Services script not ready.');
        // Mark auth as checked even if script fails to load.
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'unauthenticated' });
      }
    };

    const gsiScript = document.getElementById('gsi-client');
    if ((window as any).google) {
      initializeAuth();
    } else if (gsiScript) {
      gsiScript.addEventListener('load', initializeAuth);
      return () => gsiScript.removeEventListener('load', initializeAuth);
    } else {
       dispatch({ type: 'SET_SESSION_STATUS', payload: 'unauthenticated' });
    }
  }, [dispatch]);

  return <AuthGate />;
};

/**
 * The root component wrapping the application with all necessary providers.
 */
const Root: React.FC = () => (
  <ErrorBoundary>
    <GlobalStateProvider>
      <NotificationProvider>
        <div className="h-screen w-screen font-sans overflow-hidden bg-background text-text-primary">
          <App />
        </div>
      </NotificationProvider>
    </GlobalStateProvider>
  </ErrorBoundary>
);

export default Root;
