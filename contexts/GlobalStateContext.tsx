/**
 * @file Manages the global application state using React's Context and useReducer hook.
 *
 * @description
 * This file defines the shape of the global state, the actions that can modify it,
 * and the provider component that makes this state available to the entire application.
 * In line with the new architecture, this context is primarily responsible for client-side
 * UI state and session information derived from server-side authentication. It does not
 * store sensitive data or complex business logic.
 *
 * The state is partially persisted to localStorage to remember user preferences across sessions.
 *
 * @module contexts/GlobalStateContext
 * @see {@link useGlobalState} for consuming the context.
 * @see {@link GlobalStateProvider} for the provider component.
 *
 * @performance
 * The state is managed by a reducer, which is efficient for complex state updates.
 * The context value is memoized by `useReducer`. Consumers of this context will only
 * re-render if the part of the state they subscribe to changes.
 *
 * @security
 * This context does NOT store any long-lived secrets, API keys, or raw JWTs.
 * The `session.user` object should only contain non-sensitive, display-related information.
 * All authentication and secrets management is handled by the server-side AuthGateway.
 */

import React, { createContext, useReducer, useContext, useEffect } from 'react';
import type { ViewType, AppUser } from '../types';

// State shape interfaces

/**
 * @interface SessionState
 * @description Represents the authentication state of the current user session.
 */
interface SessionState {
  /** The authenticated user's profile information. Null if not authenticated. */
  user: AppUser | null;
  /** A boolean flag indicating if the user is currently authenticated. */
  isAuthenticated: boolean;
}

/**
 * @interface WorkspaceState
 * @description Represents the state of the main UI workspace.
 */
interface WorkspaceState {
  /** The currently active top-level view or micro-frontend. */
  activeView: ViewType;
  /** Props passed to the active view, enabling context-aware navigation. */
  viewProps: Record<string, any>;
}

/**
 * @interface UserPreferences
 * @description Stores user-specific preferences that are persisted locally.
 */
interface UserPreferences {
  /** A list of feature IDs that the user has chosen to hide from the UI. */
  hiddenFeatures: string[];
}

/**
 * @interface GlobalState
 * @description The complete shape of the global application state.
 */
interface GlobalState {
  session: SessionState;
  workspace: WorkspaceState;
  preferences: UserPreferences;
}

// Action types

/**
 * @type Action
 * @description A union type representing all possible actions that can be dispatched to update the global state.
 */
type Action =
  | { type: 'SET_SESSION'; payload: SessionState }
  | { type: 'SET_VIEW'; payload: { view: ViewType, props?: Record<string, any> } }
  | { type: 'TOGGLE_FEATURE_VISIBILITY'; payload: { featureId: string } };

/**
 * @const initialState
 * @description The default initial state for the application.
 */
const initialState: GlobalState = {
  session: {
    user: null,
    isAuthenticated: false,
  },
  workspace: {
    activeView: 'ai-command-center',
    viewProps: {},
  },
  preferences: {
    hiddenFeatures: [],
  },
};

/**
 * The reducer function that handles state transitions based on dispatched actions.
 * @param {GlobalState} state - The current state.
 * @param {Action} action - The action to be processed.
 * @returns {GlobalState} The new state.
 */
const reducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload,
      };
    case 'SET_VIEW':
      return {
        ...state,
        workspace: {
          ...state.workspace,
          activeView: action.payload.view,
          viewProps: action.payload.props || {},
        },
      };
    case 'TOGGLE_FEATURE_VISIBILITY': {
        const { featureId } = action.payload;
        const isHidden = state.preferences.hiddenFeatures.includes(featureId);
        const newHiddenFeatures = isHidden
            ? state.preferences.hiddenFeatures.filter(id => id !== featureId)
            : [...state.preferences.hiddenFeatures, featureId];
        return {
            ...state,
            preferences: {
                ...state.preferences,
                hiddenFeatures: newHiddenFeatures,
            },
        };
    }
    default:
      return state;
  }
};

/**
 * @const GlobalStateContext
 * @description The React context object for the global state.
 */
const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
}>({ 
  state: initialState,
  dispatch: () => null,
});

const LOCAL_STORAGE_KEY = 'devcore_preferences';
const CONSENT_KEY = 'devcore_ls_consent';

/**
 * Provides the global state to its children components.
 * It also handles persisting and hydrating user preferences from localStorage.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {React.ReactElement} The provider component.
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
            const storedPrefsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!storedPrefsJSON) return initial;
            
            const storedPrefs = JSON.parse(storedPrefsJSON);
            const hydratedState: GlobalState = {
              ...initial,
              preferences: {
                ...initial.preferences,
                hiddenFeatures: storedPrefs.hiddenFeatures || [],
              },
              workspace: {
                ...initial.workspace,
                activeView: storedPrefs.activeView || initial.workspace.activeView,
              }
            };
            
            return hydratedState;
        } catch (error) {
            console.error("Failed to parse preferences from localStorage", error);
            return initial;
        }
    });

    useEffect(() => {
        if (!canPersist) return;

        const handler = setTimeout(() => {
            try {
                // Only persist preferences and non-sensitive workspace state
                const stateToSave = { 
                    hiddenFeatures: state.preferences.hiddenFeatures,
                    activeView: state.workspace.activeView
                };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
            } catch (error) {
                console.error("Failed to save preferences to localStorage", error);
            }
        }, 500);
        
        return () => clearTimeout(handler);
    }, [state.preferences, state.workspace.activeView, canPersist]);


    return (
        <GlobalStateContext.Provider value={{ state, dispatch }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

/**
 * A custom hook to easily access the global state and dispatch function.
 * @returns {{state: GlobalState, dispatch: React.Dispatch<Action>}} The global state and dispatch function.
 * @example
 * const { state, dispatch } = useGlobalState();
 * dispatch({ type: 'SET_VIEW', payload: { view: 'settings' } });
 */
export const useGlobalState = () => useContext(GlobalStateContext);
