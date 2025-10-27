import React, {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  GlobalStateProvider,
  useGlobalState,
} from './contexts/GlobalStateContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { initGoogleAuth, signInWithGoogle } from './services/googleAuthService';
import { ActionManager } from './components/ActionManager';
import { LeftSidebar } from './components/LeftSidebar';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import {
  Cog6ToothIcon,
  HomeIcon,
  FolderIcon,
  RectangleGroupIcon,
} from './components/icons';
import { WorkspaceManager } from './components/desktop/WorkspaceManager';
import { LoginView } from './components/LoginView';
import { ALL_FEATURES } from './components/features';
import { useTheme } from './hooks/useTheme';
import type { AppUser, SidebarItem, ViewType } from './types';
import './index.css';

// Settings Context for Gemini API Key
interface SettingsContextType {
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [geminiApiKey, setGeminiApiKeyState] = useState('');

  useEffect(() => {
    const storedKey = sessionStorage.getItem('gemini_api_key');
    if (storedKey) {
      setGeminiApiKeyState(storedKey);
    }
  }, []);

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    if (key) {
      sessionStorage.setItem('gemini_api_key', key);
    } else {
      sessionStorage.removeItem('gemini_api_key');
    }
  };

  const value = { geminiApiKey, setGeminiApiKey };

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

// Main Authenticated Application UI
const AuthenticatedApp: React.FC = () => {
  const { state, dispatch } = useGlobalState();
  const { activeView, viewProps, hiddenFeatures } = state;
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
      ...ALL_FEATURES.filter(
        (feature) =>
          !hiddenFeatures.includes(feature.id) &&
          !coreFeatures.includes(feature.id),
      ).map((feature) => ({
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
      <LeftSidebar
        items={sidebarItems}
        activeView={activeView}
        onNavigate={handleViewChange}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="relative flex-1 min-w-0 bg-surface/50 dark:bg-slate-900/50 overflow-hidden">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  Loading...
                </div>
              }
            >
              <WorkspaceManager activeView={activeView} viewProps={viewProps} />
            </Suspense>
          </ErrorBoundary>
          <ActionManager />
        </main>
        <StatusBar bgImageStatus="loaded" />
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

// Auth Gate to switch between Login and Authenticated App
const AuthGate: React.FC = () => {
  const { state } = useGlobalState();

  if (!state.user) {
    return <LoginView />;
  }

  return <AuthenticatedApp />;
};

// Root App component that handles auth initialization
const App: React.FC = () => {
  const { dispatch } = useGlobalState();
  useTheme(); // Initialize theme

  useEffect(() => {
    const handleUserChanged = (user: AppUser | null) => {
      dispatch({ type: 'SET_APP_USER', payload: user });
    };

    const initializeAuth = () => {
      if (window.google) {
        initGoogleAuth(handleUserChanged);
      } else {
        console.warn('Google Identity Services script not loaded yet.');
      }
    };

    const script = document.getElementById('gsi-client');
    if (window.google) {
      initializeAuth();
    } else if (script) {
      script.addEventListener('load', initializeAuth);
      return () => script.removeEventListener('load', initializeAuth);
    }
  }, [dispatch]);

  return <AuthGate />;
};

// Final export that wraps App in all necessary providers
const Root: React.FC = () => {
  return (
    <ErrorBoundary>
      <GlobalStateProvider>
        <NotificationProvider>
          <SettingsProvider>
            <div className="h-screen w-screen font-sans overflow-hidden bg-background text-text-primary">
              <App />
            </div>
          </SettingsProvider>
        </NotificationProvider>
      </GlobalStateProvider>
    </ErrorBoundary>
  );
};

export default Root;
