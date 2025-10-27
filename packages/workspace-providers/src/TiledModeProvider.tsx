/**
 * @file Implements the TiledModeProvider for the WorkspaceManager.
 * This provider is responsible for arranging micro-frontends in a non-overlapping, tiled layout.
 * It manages the layout as a tree structure, allowing for horizontal and vertical splits.
 * @module TiledModeProvider
 * @see @core/workspace-manager/WorkspaceManagerContext.ts for context interaction.
 * @performance This component uses a reducer for state management and memoization to optimize rendering of the tile tree. The recursive nature of rendering is efficient for deep layouts.
 * @security This component renders micro-frontends loaded from remote sources. It assumes a `RemoteComponent` wrapper exists that handles sandboxing and security concerns for these remotes.
 */

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';

// Assume these are imported from a central workspace management module
// import { useWorkspaceManager } from '@core/workspace-manager';
// import { RemoteComponent } from '@core/ui-composite';

// #region Mocks and Placeholders for standalone viability
/**
 * @typedef {object} AppInstance
 * Represents an instance of an open application/micro-frontend.
 */
interface AppInstance {
  id: string; // Instance ID
  featureId: string; // Feature/MFE ID
}

/**
 * Mock of the useWorkspaceManager hook for demonstration.
 * In the real architecture, this would provide the list of open apps.
 * @returns {{ openApps: AppInstance[], activeAppId: string | null }}
 */
const useWorkspaceManager = () => {
  const [apps, setApps] = React.useState<AppInstance[]>([]);
  useEffect(() => {
    // Simulate opening an app on mount
    setApps([{ id: 'instance-1', featureId: 'AiCodeExplainer' }]);
  }, []);
  return { openApps: apps, activeAppId: apps.length > 0 ? apps[0].id : null };
};

/**
 * Mock of the RemoteComponent used to render micro-frontends.
 * @param {{ featureId: string }} props - Component properties.
 * @returns {React.ReactElement} A placeholder element.
 */
const RemoteComponent = ({ featureId }: { featureId: string }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
    <p>Micro-frontend: {featureId}</p>
  </div>
);

// #endregion

/** @typedef {'horizontal' | 'vertical'} LayoutDirection */
type LayoutDirection = 'horizontal' | 'vertical';

/** @typedef {string} TileId - A unique identifier for a tile. */
type TileId = string;

/**
 * @interface TileLeaf
 * @description Represents a leaf node in the layout tree, which contains an application instance.
 */
interface TileLeaf {
  id: TileId;
  appInstanceId: string;
  featureId: string;
}

/**
 * @interface TileParent
 * @description Represents a parent node in the layout tree, which splits its children.
 */
interface TileParent {
  id: TileId;
  direction: LayoutDirection;
  splitPercentage: number;
  children: [Tile, Tile];
}

/** @typedef {TileLeaf | TileParent} Tile - A node in the layout tree. */
type Tile = TileLeaf | TileParent;

/**
 * @interface LayoutState
 * @description The state of the tiled layout.
 */
interface LayoutState {
  root: Tile | null;
  focusedTileId: TileId | null;
}

/**
 * @typedef {object} LayoutContextProps
 * @description The value provided by the TiledModeContext.
 */
interface LayoutContextProps {
  state: LayoutState;
  dispatch: React.Dispatch<LayoutAction>;
  closeTile: (tileId: TileId) => void;
}

const TiledModeContext = createContext<LayoutContextProps | null>(null);

/**
 * Custom hook to access the tiled mode layout context.
 * @returns {LayoutContextProps} The context value.
 * @throws {Error} If used outside of a TiledModeProvider.
 */
export const useTiledMode = (): LayoutContextProps => {
  const context = useContext(TiledModeContext);
  if (!context) {
    throw new Error('useTiledMode must be used within a TiledModeProvider');
  }
  return context;
};

/**
 * @typedef {object} AddAction
 * @property {'ADD'} type
 * @property {AppInstance} payload.app
 */
/**
 * @typedef {object} RemoveAction
 * @property {'REMOVE'} type
 * @property {TileId} payload.tileId
 */
type LayoutAction = 
  | { type: 'ADD'; payload: { app: AppInstance } }
  | { type: 'REMOVE'; payload: { tileId: TileId } };

const initialState: LayoutState = {
  root: null,
  focusedTileId: null,
};

/**
 * Reducer to manage the tiled layout state tree.
 * @param {LayoutState} state - The current layout state.
 * @param {LayoutAction} action - The action to perform.
 * @returns {LayoutState} The new layout state.
 */
const layoutReducer = (state: LayoutState, action: LayoutAction): LayoutState => {
  switch (action.type) {
    case 'ADD': {
      const { app } = action.payload;
      const newLeaf: TileLeaf = { id: `tile-${app.id}`, appInstanceId: app.id, featureId: app.featureId };

      if (!state.root) {
        return { root: newLeaf, focusedTileId: newLeaf.id };
      }

      // For simplicity, this example splits the root. A more complex implementation
      // would split the currently focused tile.
      const oldRoot = state.root;
      const newRoot: TileParent = {
        id: `node-${Date.now()}`,
        direction: 'horizontal',
        splitPercentage: 50,
        children: [oldRoot, newLeaf],
      };
      return { root: newRoot, focusedTileId: newLeaf.id };
    }
    case 'REMOVE': {
      // Complex logic to remove a node and restructure the tree would go here.
      // For this example, we'll keep it simple.
      if (state.root && 'children' in state.root) {
        // If we close one of two root children, the other becomes the new root.
        const newRoot = (state.root as TileParent).children.find(c => c.id !== action.payload.tileId) || null;
        return { root: newRoot, focusedTileId: newRoot ? newRoot.id : null };
      } else if (state.root?.id === action.payload.tileId) {
        // If we close the only root tile.
        return { root: null, focusedTileId: null };
      }
      return state;
    }
    default:
      return state;
  }
};

/**
 * @interface TileProps
 * @description Props for the recursive TileComponent renderer.
 */
interface TileProps {
  tile: Tile;
}

/**
 * Recursively renders the layout tree.
 * @param {TileProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered tile or split container.
 */
const TileComponent: React.FC<TileProps> = React.memo(({ tile }) => {
  if ('appInstanceId' in tile) {
    // This is a leaf node, render the component
    return (
      <div className="tile-leaf w-full h-full bg-gray-900 overflow-hidden border border-gray-700 rounded">
        <header className="h-6 bg-gray-700 px-2 text-xs flex items-center justify-between text-gray-300">
          <span>{tile.featureId}</span>
        </header>
        <main className="w-full h-[calc(100%-1.5rem)]">
          <RemoteComponent featureId={tile.featureId} />
        </main>
      </div>
    );
  }

  // This is a parent node, render a split container
  const isHorizontal = tile.direction === 'horizontal';
  return (
    <div className={`tile-parent w-full h-full flex ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
      <div style={{ [isHorizontal ? 'width' : 'height']: `${tile.splitPercentage}%` }} className="p-1">
        <TileComponent tile={tile.children[0]} />
      </div>
      <div className="w-2 h-full bg-gray-700 cursor-col-resize tile-splitter" />
      <div style={{ [isHorizontal ? 'width' : 'height']: `${100 - tile.splitPercentage}%` }} className="p-1">
        <TileComponent tile={tile.children[1]} />
      </div>
    </div>
  );
});

/**
 * Provides the tiled layout context and renders the tiled workspace.
 * It syncs with the WorkspaceManager to reflect the set of open applications.
 * @param {React.PropsWithChildren} props - The component props.
 * @returns {React.ReactElement} The provider component.
 * @example
 * <WorkspaceManager>
 *   <TiledModeProvider />
 * </WorkspaceManager>
 */
export const TiledModeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { openApps } = useWorkspaceManager();
  const [state, dispatch] = useReducer(layoutReducer, initialState);

  useEffect(() => {
    // Naive sync: add any apps from workspace manager that aren't in our layout.
    const layoutAppIds = new Set<string>();
    const collectIds = (tile: Tile | null) => {
      if (!tile) return;
      if ('appInstanceId' in tile) {
        layoutAppIds.add(tile.appInstanceId);
      } else {
        collectIds(tile.children[0]);
        collectIds(tile.children[1]);
      }
    };
    collectIds(state.root);

    openApps.forEach(app => {
      if (!layoutAppIds.has(app.id)) {
        dispatch({ type: 'ADD', payload: { app } });
      }
    });

    // Naive sync for closed apps is more complex and omitted for brevity.
  }, [openApps, state.root]);

  const closeTile = useCallback((tileId: TileId) => {
    // Here you would also interact with useWorkspaceManager's closeApp function
    dispatch({ type: 'REMOVE', payload: { tileId } });
  }, []);

  const contextValue = useMemo(() => ({ state, dispatch, closeTile }), [state, closeTile]);

  return (
    <TiledModeContext.Provider value={contextValue}>
      <div className="w-full h-full bg-gray-800 p-1">
        {state.root ? (
          <TileComponent tile={state.root} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p>No applications open in Tiled Mode.</p>
          </div>
        )}
      </div>
      {children}
    </TiledModeContext.Provider>
  );
};
