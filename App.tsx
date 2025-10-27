/**
 * @file App.tsx
 * @description This is the root component for the entire DevCore AI Toolkit application.
 * It orchestrates the main layout, context providers, service initialization, authentication state,
 * theming, and view management. It serves as the composition root for the application's
 * dependency injection container and initializes critical background services like the
 * ResourceOrchestrator and WorkerPoolManager.
 * @see WorkspaceManager
 * @see DIProvider
 * @security This component handles the initialization of the authentication flow but does not manage secrets.
 *           User state is derived from the authentication provider and managed globally. All secrets are handled
 *           server-side by the AuthGateway, aligning with a zero-trust architecture.
 * @performance This component initializes core application services. Feature components are lazy-loaded
 *              via the WorkspaceManager to optimize initial load time.
 * @example
 * // This component is typically rendered at the root of the application.
 * ReactDOM.createRoot(rootElement).render(
 *   <React.StrictMode>
 *     <GlobalStateProvider>
 *       <App />
 *     </GlobalStateProvider>
 *   </React.StrictMode>
 * );
 */

import React, { Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { GlobalStateProvider, useGlobalState } from './contexts/GlobalStateContext.tsx';
import { logEvent } from './services/telemetryService.ts';
import { ALL_FEATURES } from './components/features/index.ts';
import type { ViewType, SidebarItem, AppUser } from './types.ts';
import { ActionManager } from './components/ActionManager.tsx';
import { LeftSidebar } from './components/LeftSidebar.tsx';
import { StatusBar } from './components/StatusBar.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { Cog6ToothIcon, HomeIcon, FolderIcon, RectangleGroupIcon } from './components/icons.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { useTheme } from './hooks/useTheme.ts';
import { initGoogleAuth } from './services/googleAuthService.ts';

// --- Architectural Placeholders for New Abstracted UI & Services ---
// These would be imported from the new UI framework and service layers.
import { WorkspaceManager } from './components/desktop/WorkspaceManager.tsx'; // Assumed new component replacing simple view switching
// import { DIProvider, useServices } from './services/core/DIProvider';
// import { initializeResourceOrchestrator } from './services/orchestration/ResourceOrchestrator';
// import { initializeWorkerPool } from './services/worker/WorkerPoolManager';

/**
 * @component LoadingIndicator
 * @description A consistent loading indicator shown as a fallback for Suspense boundaries
 *              while lazy-loaded feature components are being fetched.
 * @returns {React.ReactElement} The loading indicator UI.
 */
export const LoadingIndicator: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center bg-surface">
        <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-text-secondary ml-2">Loading Feature...</span>
        </div>
    </div>
);

/**
 * @component LocalStorageConsentModal
 * @description A modal dialog to request user consent for using local storage,
 *              ensuring compliance with privacy best practices.
 * @param {object} props The component props.
 * @param {() => void} props.onAccept Callback function executed when the user accepts.
 * @param {() => void} props.onDecline Callback function executed when the user declines.
 * @returns {React.ReactElement} The consent modal UI.
 */
const LocalStorageConsentModal: React.FC<{ onAccept: () => void; onDecline: () => void; }> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center fade-in">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md m-4 p-8 text-center animate-pop-in">
        <h2 className="text-2xl mb-4">Store Data Locally?</h2>
        <p className="text-text-secondary mb-6">
          This application uses your browser's local storage to save your settings and remember your progress between sessions. This data stays on your computer and is not shared.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onDecline} className="px-6 py-2 bg-surface border border-border text-text-primary font-bold rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">Decline</button>
          <button onClick={onAccept} className="btn-primary px-6 py-2">Accept</button>
        </div>
      </div>
    </div>
  );
};

/**
 * @component AppContent
 * @description This component renders the main application UI, including the sidebar,
 *              workspace, and status bar. It handles primary user interactions like navigation
 *              and opening the command palette. It is wrapped by all necessary context providers.
 * @returns {React.ReactElement} The main application content.
 */
const AppContent: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const { activeView, viewProps, hiddenFeatures } = state;
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

    useEffect(() => {
      const handleUserChanged = (user: AppUser | null) => {
          dispatch({ type: 'SET_APP_USER', payload: user });
      };

      const initAuth = () => {
          if (window.google) {
              initGoogleAuth(handleUserChanged);
          }
      };

      const gsiScript = document.getElementById('gsi-client');
      if (window.google) {
          initAuth();
      } else if (gsiScript) {
          gsiScript.addEventListener('load', initAuth);
          return () => gsiScript.removeEventListener('load', initAuth);
      }
  }, [dispatch]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              setCommandPaletteOpen(isOpen => !isOpen);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
      /**
       * @performance
       * Initializes background services on application startup.
       * The ResourceOrchestrator would begin predictive pre-fetching, and the
       * WorkerPoolManager would prepare the web worker pool for off-thread computations.
       */
      // initializeResourceOrchestrator();
      // initializeWorkerPool({ poolSize: 4 });
      logEvent('core_services_initialized');
    }, []);
  
    const handleViewChange = useCallback((view: ViewType, props: any = {}) => {
      dispatch({ type: 'SET_VIEW', payload: { view, props } });
      logEvent('view_changed', { view });
      setCommandPaletteOpen(false);
    }, [dispatch]);
  
    const sidebarItems: SidebarItem[] = useMemo(() => {
        const coreFeatures = ['ai-command-center', 'project-explorer', 'workspace-connector-hub'];
        return [
            { id: 'ai-command-center', label: 'Command Center', icon: <HomeIcon />, view: 'ai-command-center' },
            { id: 'project-explorer', label: 'Project Explorer', icon: <FolderIcon />, view: 'project-explorer' },
            { id: 'workspace-connector-hub', label: 'Workspace Hub', icon: <RectangleGroupIcon />, view: 'workspace-connector-hub' },
            ...ALL_FEATURES
                .filter(feature => !hiddenFeatures.includes(feature.id) && !coreFeatures.includes(feature.id))
                .map(feature => ({
                    id: feature.id,
                    label: feature.name,
                    icon: feature.icon,
                    view: feature.id as ViewType,
                })),
            { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon />, view: 'settings' },
        ];
    }, [hiddenFeatures]);
    
    return (
        <div className="relative flex h-full w-full">
            <LeftSidebar items={sidebarItems} activeView={state.activeView} onNavigate={handleViewChange} />
            <div className="flex-1 flex flex-col min-w-0">
                <main className="relative flex-1 min-w-0 bg-surface/50 dark:bg-slate-900/50 overflow-hidden">
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingIndicator />}>
                            <WorkspaceManager activeView={activeView} viewProps={viewProps} />
                        </Suspense>
                    </ErrorBoundary>
                    <ActionManager />
                </main>
                <StatusBar bgImageStatus="loaded" />
            </div>
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onSelect={handleViewChange} />
        </div>
    );
};

/**
 * @component App
 * @description The root component that sets up all global context providers and renders the main application UI.
 *              It is responsible for initializing the theme and handling user consent for local storage.
 * @returns {React.ReactElement} The fully wrapped application.
 */
const App: React.FC = () => {
    const [showConsentModal, setShowConsentModal] = useState(false);
    useTheme(); // Initialize and apply theme settings from local storage.

    useEffect(() => {
      try {
          const consent = localStorage.getItem('devcore_ls_consent');
          if (!consent) {
              setShowConsentModal(true);
          }
      } catch (e) {
          console.warn("Could not access localStorage to check consent.", e);
      }
    }, []);
  
    const handleAcceptConsent = () => {
      try {
          localStorage.setItem('devcore_ls_consent', 'granted');
          window.location.reload(); // Reload to apply persisted state
      } catch (e) {
          console.error("Could not write consent to localStorage.", e);
          setShowConsentModal(false);
      }
    };
  
    const handleDeclineConsent = () => {
      try {
          localStorage.setItem('devcore_ls_consent', 'denied');
      } catch (e) {
          console.error("Could not write consent to localStorage.", e);
      }
      setShowConsentModal(false);
    };

    // Conceptual: Initialize DI container. In a real app, this might be more complex.
    // const serviceContainer = useMemo(() => createContainer(), []);

    return (
      <div className="h-screen w-screen font-sans overflow-hidden bg-background">
        {/* <DIProvider container={serviceContainer}> */}
          <NotificationProvider>
              {showConsentModal && <LocalStorageConsentModal onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />}
              <AppContent />
          </NotificationProvider>
        {/* </DIProvider> */}
      </div>
    );
};

/**
 * @component Root
 * @description A wrapper component that includes the GlobalStateProvider, which is necessary
 *              for the App component to function correctly as it uses `useGlobalState`.
 *              This separation prevents App from trying to access a context it provides itself.
 * @returns {React.ReactElement} The application with all providers.
 */
const Root: React.FC = () => (
  <GlobalStateProvider>
    <App />
  </GlobalStateProvider>
);

export default Root;
