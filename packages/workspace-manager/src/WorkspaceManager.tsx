/**
 * @file packages/workspace-manager/src/WorkspaceManager.tsx
 * @module WorkspaceManager
 * @description This module provides the core logic and state management for the application's workspace.
 * It follows a provider pattern, managing active plugins (micro-frontends) and their state,
 * while deferring the actual rendering to a configurable layout provider. It is the central
 * orchestrator for the user's interactive environment, replacing the monolithic DesktopView.
 *
 * @see @core-ui/LoadingIndicator
 * @see @services/resource-orchestrator
 *
 * @security This component manages the lifecycle of dynamically loaded micro-frontends.
 * It is critical that the source of these plugins is trusted and that they are loaded
 * over secure channels. The component itself does not handle sensitive data but provides
 * the container in which plugins that might handle such data will run.
 *
 * @performance Manages the state of multiple active plugins. The state management logic is optimized
 * with `useCallback` and `useMemo` to prevent unnecessary re-renders of the workspace and its plugins.
 * The performance of opening a new plugin is dependent on the `usePluginLoader` implementation, which
 * should leverage the ResourceOrchestrator for pre-fetching and caching.
 */

import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useContext,
  ReactNode,
  Suspense,
  LazyExoticComponent,
} from 'react';

// TODO: Replace with the actual hook from the Resource Orchestrator service
// import { usePluginLoader } from '@services/resource-orchestrator';

// --- Type Definitions ---

/**
 * @interface ActivePlugin
 * @description Represents an active, running instance of a plugin within the workspace.
 * @property {string} id - The unique identifier for this instance, typically matching the plugin ID.
 * @property {LazyExoticComponent<React.FC<any>>} Component - The lazy-loaded React component to render.
 * @property {any} state - The current state of the plugin instance (e.g., position, size, minimized). This is managed by the layout provider.
 * @property {any} [props] - Optional props to pass to the plugin component instance.
 */
export interface ActivePlugin {
  id: string;
  Component: LazyExoticComponent<React.FC<any>>;
  state: any;
  props?: any;
}

/**
 * @interface WorkspaceManagerContextType
 * @description Defines the shape of the context provided by the WorkspaceManager.
 * It exposes the workspace state and actions to manipulate it.
 */
export interface WorkspaceManagerContextType {
  /** @property {Record<string, ActivePlugin>} activePlugins - A map of all currently active plugin instances, keyed by their ID. */
  activePlugins: Record<string, ActivePlugin>;
  /** @property {string[]} focusStack - An array of plugin IDs representing the focus order (last element is most focused). */
  focusStack: string[];
  /**
   * @function openPlugin
   * @description Opens a new plugin instance in the workspace or focuses it if already open.
   * This function is intended to be called by UI elements like docks, menus, or the command palette.
   * @param {string} pluginId - The ID of the plugin to open.
   * @param {any} [props] - Optional props to pass to the plugin instance upon opening.
   * @returns {void}
   * @example
   * const { openPlugin } = useWorkspaceManager();
   * openPlugin('ai-code-explainer', { initialCode: 'const x = 1;' });
   */
  openPlugin: (pluginId: string, props?: any) => void;
  /**
   * @function closePlugin
   * @description Closes an active plugin instance and removes it from the workspace.
   * @param {string} pluginId - The ID of the plugin instance to close.
   * @returns {void}
   */
  closePlugin: (pluginId: string) => void;
  /**
   * @function focusPlugin
   * @description Brings a plugin to the front, making it the active one in the current layout.
   * @param {string} pluginId - The ID of the plugin instance to focus.
   * @returns {void}
   */
  focusPlugin: (pluginId: string) => void;
  /**
   * @function updatePluginState
   * @description Updates the layout-specific state of a plugin instance. This is typically called by the layout renderer (e.g., to update window position).
   * @param {string} pluginId - The ID of the plugin instance to update.
   * @param {any} newState - The new state object to merge with the existing state.
   * @returns {void}
   */
  updatePluginState: (pluginId: string, newState: any) => void;
}

// --- Context ---

/**
 * @constant WorkspaceManagerContext
 * @description React context for providing workspace state and actions throughout the component tree.
 * This allows any component within the WorkspaceManager's subtree to interact with the workspace.
 */
const WorkspaceManagerContext = createContext<WorkspaceManagerContextType | undefined>(
  undefined,
);

// --- Provider Component ---

/**
 * @interface WorkspaceManagerProps
 * @description Props for the WorkspaceManager component.
 */
interface WorkspaceManagerProps {
  /** @property {ReactNode} children - The child components, which should include a layout renderer that consumes the context. */
  children: ReactNode;
}

// This is a placeholder for the actual plugin loading mechanism.
// In the new architecture, this would use a hook like `useResourceOrchestrator`
// to fetch micro-frontend manifests and components dynamically.
const usePluginLoader = (pluginId: string): LazyExoticComponent<React.FC<any>> | null => {
  // In a real scenario, this would look up the plugin's remote entry from a manifest.
  // For now, we simulate with a dynamic import map based on convention.
  const componentMap: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
    'ai-code-explainer': () => import(/* webpackIgnore: true */ '/@fs/src/components/features/AiCodeExplainer.tsx'),
    // ... more mappings would be here, loaded from a manifest
  };

  const componentImport = componentMap[pluginId];

  return useMemo(() => {
    if (!componentImport) {
        // A fallback or error component should be returned.
        console.error(`Plugin with ID '${pluginId}' not found in manifest.`);
        return React.lazy(() => Promise.resolve({ default: () => <div>Plugin '{pluginId}' not found.</div> }));
    }
    return React.lazy(componentImport);
  }, [pluginId, componentImport]);
};

/**
 * @component WorkspaceManager
 * @description The core provider component for managing workspace state.
 * It handles the logic for opening, closing, and managing plugins, but delegates
 * the visual rendering to its children, which should be a layout system
 * (e.g., DesktopLayout, TiledLayout) that consumes this context.
 *
 * @param {WorkspaceManagerProps} props - The component props.
 * @returns {React.ReactElement} The provider component wrapping its children.
 *
 * @example
 * <DesktopModeProvider>
 *   <WorkspaceManager>
 *     <LayoutRenderer />
 *   </WorkspaceManager>
 * </DesktopModeProvider>
 */
export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ children }) => {
  const [activePlugins, setActivePlugins] = useState<Record<string, ActivePlugin>>({});
  const [focusStack, setFocusStack] = useState<string[]>([]);

  const focusPlugin = useCallback((pluginId: string) => {
    setFocusStack(prevStack => {
      const newStack = prevStack.filter(id => id !== pluginId);
      newStack.push(pluginId);
      return newStack;
    });
  }, []);

  const openPlugin = useCallback(
    (pluginId: string, props?: any) => {
      if (activePlugins[pluginId]) {
        focusPlugin(pluginId);
        // If props are provided for an already open plugin, update them.
        if (props) {
          setActivePlugins(prev => ({
            ...prev,
            [pluginId]: { ...prev[pluginId], props },
          }));
        }
        return;
      }

      // This is where the ResourceOrchestrator interaction would happen.
      // For this example, we'll manually lazy load based on a conventional path.
      // TODO: Replace with `const Component = usePluginLoader(pluginId);`
      const Component = React.lazy(() => import(`../../components/features/${pluginId}.tsx`));

      if (!Component) {
        console.error(`Failed to load plugin component for ID: ${pluginId}`);
        return;
      }

      const newPlugin: ActivePlugin = {
        id: pluginId,
        Component,
        state: {}, // Layout provider will populate this with position, size, etc.
        props,
      };

      setActivePlugins(prev => ({ ...prev, [pluginId]: newPlugin }));
      focusPlugin(pluginId);
    },
    [activePlugins, focusPlugin],
  );

  const closePlugin = useCallback((pluginId: string) => {
    setActivePlugins(prevPlugins => {
      const { [pluginId]: _, ...remainingPlugins } = prevPlugins;
      return remainingPlugins;
    });
    setFocusStack(prevStack => prevStack.filter(id => id !== pluginId));
  }, []);

  const updatePluginState = useCallback((pluginId: string, newState: any) => {
    setActivePlugins(prevPlugins => {
      if (!prevPlugins[pluginId]) return prevPlugins;
      return {
        ...prevPlugins,
        [pluginId]: {
          ...prevPlugins[pluginId],
          state: {
            ...prevPlugins[pluginId].state,
            ...newState,
          },
        },
      };
    });
  }, []);

  const contextValue = useMemo<WorkspaceManagerContextType>(
    () => ({
      activePlugins,
      focusStack,
      openPlugin,
      closePlugin,
      focusPlugin,
      updatePluginState,
    }),
    [activePlugins, focusStack, openPlugin, closePlugin, focusPlugin, updatePluginState],
  );

  return (
    <WorkspaceManagerContext.Provider value={contextValue}>
      <Suspense fallback={<div>Loading Workspace...</div>}>{children}</Suspense>
    </WorkspaceManagerContext.Provider>
  );
};

// --- Hook ---

/**
 * @hook useWorkspaceManager
 * @description A custom hook for easy consumption of the WorkspaceManagerContext.
 * It provides access to the workspace state and the actions to manipulate it.
 * @returns {WorkspaceManagerContextType} The context value.
 * @throws {Error} If used outside of a WorkspaceManager provider, ensuring component composition is correct.
 * @example
 * const { openPlugin, activePlugins } = useWorkspaceManager();
 * return (
 *   <button onClick={() => openPlugin('my-plugin')}>Open My Plugin</button>
 * );
 * );
 */
export const useWorkspaceManager = (): WorkspaceManagerContextType => {
  const context = useContext(WorkspaceManagerContext);
  if (context === undefined) {
    throw new Error('useWorkspaceManager must be used within a WorkspaceManager provider');
  }
  return context;
};
