/**
 * @file GlobalStateContext.tsx
 * @description This module defines the global state management for the application shell.
 * It utilizes React's Context and Reducer hooks to provide a centralized state store for
 * session information, workspace layout, and user settings. This context is fundamental
 * for orchestrating the behavior of the shell and the micro-frontends it hosts.
 *
 * @see The architectural directive on "Transition to a Federated Micro-Frontend"
 * @see The architectural directive on "Implement a Server-Side Zero-Trust Authentication"
 * @performance This context provider performs a single read from localStorage on initialization.
 * State updates are debounced before writing to localStorage to minimize disk I/O.
 * @security Session tokens (JWTs) are intentionally not persisted in localStorage by this
 * context. They should be managed in memory or secure storage by the authentication service.
 * Only non-sensitive UI state and user settings (like the Gemini API key) are persisted.
 */

import React, { createContext, useReducer, useContext, useEffect } from 'react';
import type { AppUser } from '../types';

// --- STATE SHAPE & TYPES ---

/**
 * @interface SessionState
 * @description Represents the authentication and session state of the user.
 * @property {'pending' | 'authenticated' | 'unauthenticated'} status - The current authentication status.
 * @property {AppUser | null} user - The authenticated user's profile information, typically from the IdP.
 * @property {string | null} token - The short-lived JWT for the current session. Stored in memory only.
 */
export interface SessionState {
  status: 'pending' | 'authenticated' | 'unauthenticated';
  user: AppUser | null;
  token: string | null;
}

/**
 * @interface WorkspaceApp
 * @description Represents a single open application (micro-frontend) instance within the workspace.
 * @property {string} instanceId - A unique identifier for this specific instance of an app.
 * @property {string} appId - The identifier of the application being displayed (e.g., 'ProjectExplorer').
 * @property {string} title - The title displayed in the application window's title bar.
 * @property {{ x: number; y: number }} position - The screen coordinates of the application window.
 * @property {{ width: number; height: number }} size - The dimensions of the application window.
 * @property {number} zIndex - The stacking order of the window.
 * @property {boolean} isMinimized - Flag indicating if the window is minimized to the taskbar.
 * @property {Record<string, any>} [props] - Initial properties passed to the application instance.
 */
export interface WorkspaceApp {
  instanceId: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  props?: Record<string, any>;
}

/**
 * @interface WorkspaceState
 * @description Manages the state of the visual workspace, including all open application instances.
 * @property {Record<string, WorkspaceApp>} apps - A map of all open application instances, keyed by `instanceId`.
 * @property {string | null} activeAppInstanceId - The `instanceId` of the currently focused application.
 * @property {number} zCounter - A counter to ensure new or focused windows get the highest z-index.
 */
export interface WorkspaceState {
  apps: Record<string, WorkspaceApp>;
  activeAppInstanceId: string | null;
  zCounter: number;
}

/**
 * @interface SettingsState
 * @description Holds user-configurable settings that persist across sessions.
 * @property {string[]} hiddenFeatures - An array of feature IDs that the user has chosen to hide.
 * @property {string | null} geminiApiKey - The user-provided Gemini API key for AI features.
 */
export interface SettingsState {
  hiddenFeatures: string[];
  geminiApiKey: string | null;
}

/**
 * @interface GlobalState
 * @description The root interface for the entire global state of the application shell.
 * @property {SessionState} session - Manages user authentication status.
 * @property {WorkspaceState} workspace - Manages the layout and state of open applications.
 * @property {SettingsState} settings - Manages persistent user settings.
 */
export interface GlobalState {
  session: SessionState;
  workspace: WorkspaceState;
  settings: SettingsState;
}

// --- ACTIONS ---

/**
 * @type Action
 * @description A union type representing all possible actions that can be dispatched to modify the global state.
 */
type Action =
  | { type: 'SESSION_SET_STATE'; payload: Partial<SessionState> }
  | { type: 'SESSION_LOGOUT' }
  | { type: 'WORKSPACE_OPEN_APP'; payload: { appId: string; title: string; props?: Record<string, any> } }
  | { type: 'WORKSPACE_CLOSE_APP'; payload: { instanceId: string } }
  | { type: 'WORKSPACE_FOCUS_APP'; payload: { instanceId: string } }
  | { type: 'WORKSPACE_MINIMIZE_APP'; payload: { instanceId: string } }
  | { type: 'WORKSPACE_UPDATE_APP'; payload: { instanceId: string; updates: Partial<WorkspaceApp> } }
  | { type: 'SETTINGS_TOGGLE_FEATURE_VISIBILITY'; payload: { featureId: string } }
  | { type: 'SETTINGS_SET_GEMINI_API_KEY'; payload: { apiKey: string | null } };

// --- INITIAL STATE & REDUCER ---

/**
 * @const {GlobalState} initialState
 * @description The default state of the application when it first loads or when state cannot be hydrated.
 */
const initialState: GlobalState = {
  session: {
    status: 'pending',
    user: null,
    token: null,
  },
  workspace: {
    apps: {},
    activeAppInstanceId: null,
    zCounter: 10, // Base z-index for windows
  },
  settings: {
    hiddenFeatures: [],
    geminiApiKey: null,
  },
};

/**
 * The main reducer function for managing global state transitions.
 * @param {GlobalState} state - The current state.
 * @param {Action} action - The action to be processed.
 * @returns {GlobalState} The new state after applying the action.
 * @example
 * dispatch({ type: 'SESSION_SET_STATE', payload: { status: 'authenticated', user: userData, token: jwt } });
 */
const reducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'SESSION_SET_STATE':
      return { ...state, session: { ...state.session, ...action.payload } };

    case 'SESSION_LOGOUT':
      return {
        ...state,
        session: { status: 'unauthenticated', user: null, token: null },
      };

    case 'WORKSPACE_OPEN_APP': {
      const { appId, title, props } = action.payload;
      const existingApp = Object.values(state.workspace.apps).find(
        app => app.appId === appId && !app.isMinimized
      );

      if (existingApp) {
        const newZCounter = state.workspace.zCounter + 1;
        return {
          ...state,
          workspace: {
            ...state.workspace,
            apps: {
              ...state.workspace.apps,
              [existingApp.instanceId]: {
                ...existingApp,
                zIndex: newZCounter,
                isMinimized: false,
              },
            },
            activeAppInstanceId: existingApp.instanceId,
            zCounter: newZCounter,
          },
        };
      }

      const instanceId = `${appId}-${Date.now()}`;
      const newZCounter = state.workspace.zCounter + 1;
      const openAppsCount = Object.keys(state.workspace.apps).length;
      const newApp: WorkspaceApp = {
        instanceId,
        appId,
        title,
        props,
        position: { x: 50 + openAppsCount * 20, y: 50 + openAppsCount * 20 },
        size: { width: 800, height: 600 },
        zIndex: newZCounter,
        isMinimized: false,
      };

      return {
        ...state,
        workspace: {
          ...state.workspace,
          apps: { ...state.workspace.apps, [instanceId]: newApp },
          activeAppInstanceId: instanceId,
          zCounter: newZCounter,
        },
      };
    }

    case 'WORKSPACE_CLOSE_APP': {
      const { instanceId } = action.payload;
      const { [instanceId]: _, ...remainingApps } = state.workspace.apps;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          apps: remainingApps,
          activeAppInstanceId: state.workspace.activeAppInstanceId === instanceId
            ? null
            : state.workspace.activeAppInstanceId,
        },
      };
    }

    case 'WORKSPACE_FOCUS_APP': {
      const { instanceId } = action.payload;
      const appToFocus = state.workspace.apps[instanceId];
      if (!appToFocus) return state;

      const newZCounter = state.workspace.zCounter + 1;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          apps: {
            ...state.workspace.apps,
            [instanceId]: {
              ...appToFocus,
              zIndex: newZCounter,
              isMinimized: false,
            },
          },
          activeAppInstanceId: instanceId,
          zCounter: newZCounter,
        },
      };
    }

    case 'WORKSPACE_MINIMIZE_APP': {
      const { instanceId } = action.payload;
      if (!state.workspace.apps[instanceId]) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          apps: {
            ...state.workspace.apps,
            [instanceId]: {
              ...state.workspace.apps[instanceId],
              isMinimized: true,
            },
          },
          activeAppInstanceId: state.workspace.activeAppInstanceId === instanceId
            ? null
            : state.workspace.activeAppInstanceId,
        },
      };
    }

    case 'WORKSPACE_UPDATE_APP': {
      const { instanceId, updates } = action.payload;
      if (!state.workspace.apps[instanceId]) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          apps: {
            ...state.workspace.apps,
            [instanceId]: {
              ...state.workspace.apps[instanceId],
              ...updates,
            },
          },
        },
      };
    }

    case 'SETTINGS_TOGGLE_FEATURE_VISIBILITY': {
      const { featureId } = action.payload;
      const isHidden = state.settings.hiddenFeatures.includes(featureId);
      const newHiddenFeatures = isHidden
        ? state.settings.hiddenFeatures.filter(id => id !== featureId)
        : [...state.settings.hiddenFeatures, featureId];
      return {
        ...state,
        settings: { ...state.settings, hiddenFeatures: newHiddenFeatures },
      };
    }

    case 'SETTINGS_SET_GEMINI_API_KEY':
      return {
        ...state,
        settings: {
          ...state.settings,
          geminiApiKey: action.payload.apiKey,
        },
      };

    default:
      return state;
  }
};

// --- CONTEXT & PROVIDER ---

const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
}>({ 
  state: initialState,
  dispatch: () => null,
});

const LOCAL_STORAGE_KEY = 'devcore_shell_snapshot';
const CONSENT_KEY = 'devcore_ls_consent';

/**
 * @component GlobalStateProvider
 * @description Provides the global state to all descendant components. It handles
 * the initialization of state, including hydration from localStorage if consent is granted,
 * and persists UI-related state changes back to localStorage.
 * @param {{ children: React.ReactNode }} props - The child components to render.
 * @returns {JSX.Element} The provider component.
 */
export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const canPersist = (() => {
    try {
      return localStorage.getItem(CONSENT_KEY) === 'granted';
    } catch (e) {
      return false;
    }
  })();

  const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
    if (!canPersist) return initial;

    try {
      const storedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!storedStateJSON) return initial;

      const storedState = JSON.parse(storedStateJSON);
      const hydratedState = { ...initial };

      if (storedState.workspace) hydratedState.workspace = storedState.workspace;
      if (storedState.settings) hydratedState.settings = { ...initial.settings, ...storedState.settings };

      return hydratedState;
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
      return initial;
    }
  });

  useEffect(() => {
    if (!canPersist) return;

    const handler = setTimeout(() => {
      try {
        // Persist only non-sensitive UI state.
        const stateToSave = {
          workspace: {
            ...state.workspace,
            // Don't persist active app ID or props passed on open.
            activeAppInstanceId: null,
            apps: Object.fromEntries(
              Object.entries(state.workspace.apps).map(([id, app]) => [
                id,
                { ...app, props: undefined }, // Remove transient props before saving
              ])
            ),
          },
          settings: state.settings,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [state.workspace, state.settings, canPersist]);


  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

/**
 * @hook useGlobalState
 * @description Custom hook to easily access the global state and dispatch function from any component.
 * @returns {{ state: GlobalState; dispatch: React.Dispatch<Action> }} The global state and dispatch function.
 * @example
 * const { state, dispatch } = useGlobalState();
 * console.log(state.session.user);
 */
export const useGlobalState = () => useContext(GlobalStateContext);
