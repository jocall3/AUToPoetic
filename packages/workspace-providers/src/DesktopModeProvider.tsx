/**
 * @file Defines the DesktopModeProvider and its associated context and hooks.
 * @module DesktopModeProvider
 * @description This provider implements the state management logic for a traditional desktop metaphor
 * workspace. It manages window states, including position, size, stacking order (z-index), and
 * minimized/maximized states. It is designed to be a pluggable layout provider within the
 * larger WorkspaceManager system.
 * @see {Architectural Directive: Implement a Pluggable, Themeable, and Abstracted UI Framework}
 * @security This provider manages UI state only and does not handle sensitive data directly. All identifiers
 * and content are assumed to be handled by the consuming micro-frontends.
 * @performance State management is performed in React state. Performance may degrade with a very large
 * number of open windows due to the complexity of state updates. State update functions are memoized
 * with `useCallback` to prevent unnecessary re-renders of consumers.
 */

import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useMemo,
  ReactNode,
} from 'react';

// --- Type Definitions ---
// In a real monorepo, these would be imported from a shared types package, e.g., '@jester/core/types'.

/**
 * Defines the position of a window.
 * @property {number} x - The horizontal coordinate from the left edge of the container.
 * @property {number} y - The vertical coordinate from the top edge of the container.
 */
export type Position = { x: number; y: number };

/**
 * Defines the size of a window.
 * @property {number} width - The width of the window.
 * @property {number} height - The height of the window.
 */
export type Size = { width: number; height: number };

/**
 * Represents the state of a single window in the desktop layout.
 * It contains all the necessary properties to render and manage a window's lifecycle.
 * @property {string} id - The unique identifier for the window, typically a micro-frontend's ID.
 * @property {Position} position - The current top-left coordinates of the window.
 * @property {Size} size - The current width and height of the window.
 * @property {number} zIndex - The calculated stacking order of the window.
 * @property {boolean} isMinimized - Flag indicating if the window is minimized.
 * @property {boolean} isMaximized - Flag indicating if the window is maximized.
 * @property {Position} [previousPosition] - Stores the window's position before it was maximized.
 * @property {Size} [previousSize] - Stores the window's size before it was maximized.
 */
export interface DesktopWindowState {
  id: string;
  position: Position;
  size: Size;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  previousPosition?: Position;
  previousSize?: Size;
}

/**
 * Defines the shape of the context provided by `DesktopModeProvider`.
 * It exposes the current state of all windows and the actions to manage them.
 */
export interface DesktopModeContextType {
  /** A record of all managed windows, keyed by their unique ID, with their complete state. */
  windows: Record<string, DesktopWindowState>;
  /** An ordered array of window IDs representing the focus stack (last element is the most active). */
  focusOrder: string[];
  /** The ID of the currently active (top-most) window, or null if no window is active. */
  activeWindowId: string | null;
  /** Opens a new window or restores/focuses an existing one. */
  openWindow: (id: string, initialPosition?: Position, initialSize?: Size) => void;
  /** Closes a window, removing it from the workspace. */
  closeWindow: (id: string) => void;
  /** Brings a specific window to the front, making it active. */
  focusWindow: (id: string) => void;
  /** Minimizes a window to the taskbar. */
  minimizeWindow: (id: string) => void;
  /** Toggles the maximized state of a window. */
  toggleMaximizeWindow: (id: string) => void;
  /** Updates the state of a window, used for dragging and resizing. */
  updateWindowState: (id: string, updates: Partial<Omit<DesktopWindowState, 'id' | 'zIndex'>>) => void;
}

// --- Context Creation ---

const Z_INDEX_BASE = 100;
const NEW_WINDOW_OFFSET = 30;
const DEFAULT_WINDOW_SIZE: Size = { width: 800, height: 600 };

/**
 * @private
 * The internal React context for the Desktop Mode Provider.
 * Consumers should use the `useDesktopMode` hook instead of accessing this directly.
 */
const DesktopModeContext = createContext<DesktopModeContextType | undefined>(
  undefined
);

// --- Provider Component ---

/**
 * Provides the state and logic for a desktop-style workspace layout.
 * Manages window creation, deletion, focus, and state changes.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components that will have access to this context.
 * @example
 * <DesktopModeProvider>
 *   <DesktopLayout />
 * </DesktopModeProvider>
 */
export const DesktopModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<Record<string, Omit<DesktopWindowState, 'zIndex'>>>({});
  const [focusOrder, setFocusOrder] = useState<string[]>([]);

  const focusWindow = useCallback((id: string) => {
    setFocusOrder(prevOrder => {
      // If the window is already on top, no change is needed.
      if (prevOrder.length > 0 && prevOrder[prevOrder.length - 1] === id) {
        return prevOrder;
      }
      // Move the focused window's ID to the end of the array to give it focus.
      const newOrder = prevOrder.filter(windowId => windowId !== id);
      newOrder.push(id);
      return newOrder;
    });
  }, []);

  const openWindow = useCallback((id: string, initialPosition?: Position, initialSize?: Size) => {
    setWindows(prevWindows => {
      const existingWindow = prevWindows[id];
      if (existingWindow) {
        // If window exists, un-minimize it and focus it.
        return { ...prevWindows, [id]: { ...existingWindow, isMinimized: false } };
      } else {
        // Create a new window with a cascaded position.
        const openWindowsCount = Object.keys(prevWindows).length;
        const newWindow: Omit<DesktopWindowState, 'zIndex'> = {
          id,
          position: initialPosition || {
            x: 50 + openWindowsCount * NEW_WINDOW_OFFSET,
            y: 50 + openWindowsCount * NEW_WINDOW_OFFSET,
          },
          size: initialSize || DEFAULT_WINDOW_SIZE,
          isMinimized: false,
          isMaximized: false,
        };
        return { ...prevWindows, [id]: newWindow };
      }
    });
    // Always bring the opened/restored window to focus.
    focusWindow(id);
  }, [focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prevWindows => {
      const newWindows = { ...prevWindows };
      delete newWindows[id];
      return newWindows;
    });
    setFocusOrder(prevOrder => prevOrder.filter(windowId => windowId !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prevWindows => {
      if (!prevWindows[id]) return prevWindows;
      return { ...prevWindows, [id]: { ...prevWindows[id], isMinimized: true } };
    });
  }, []);

  const toggleMaximizeWindow = useCallback((id: string) => {
    setWindows(prevWindows => {
      const window = prevWindows[id];
      if (!window) return prevWindows;

      if (window.isMaximized) {
        // Restore to previous state
        return {
          ...prevWindows,
          [id]: {
            ...window,
            isMaximized: false,
            position: window.previousPosition || window.position,
            size: window.previousSize || window.size,
            previousPosition: undefined,
            previousSize: undefined,
          },
        };
      } else {
        // Maximize the window
        return {
          ...prevWindows,
          [id]: {
            ...window,
            isMaximized: true,
            previousPosition: window.position,
            previousSize: window.size,
            position: { x: 0, y: 0 }, // Position depends on layout consumer
            size: { width: 100, height: 100 }, // Size in % depends on layout consumer
          },
        };
      }
    });
    focusWindow(id);
  }, [focusWindow]);

  const updateWindowState = useCallback((id: string, updates: Partial<Omit<DesktopWindowState, 'id' | 'zIndex'>>) => {
    setWindows(prevWindows => {
      if (!prevWindows[id]) return prevWindows;
      return { ...prevWindows, [id]: { ...prevWindows[id], ...updates } };
    });
  }, []);

  const processedWindows = useMemo<Record<string, DesktopWindowState>>(() => {
    const newWindows: Record<string, DesktopWindowState> = {};
    const orderMap = new Map(focusOrder.map((id, index) => [id, index]));

    for (const id in windows) {
      newWindows[id] = {
        ...windows[id],
        zIndex: Z_INDEX_BASE + (orderMap.get(id) ?? -1),
      };
    }
    return newWindows;
  }, [windows, focusOrder]);

  const activeWindowId = useMemo(() => {
    // The active window is the last non-minimized window in the focus order.
    for (let i = focusOrder.length - 1; i >= 0; i--) {
      const id = focusOrder[i];
      if (windows[id] && !windows[id].isMinimized) {
        return id;
      }
    }
    return null;
  }, [focusOrder, windows]);

  const contextValue = useMemo<DesktopModeContextType>(() => ({
    windows: processedWindows,
    focusOrder,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    updateWindowState,
  }), [
    processedWindows,
    focusOrder,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    updateWindowState,
  ]);

  return (
    <DesktopModeContext.Provider value={contextValue}>
      {children}
    </DesktopModeContext.Provider>
  );
};

// --- Consumer Hook ---

/**
 * Custom hook to consume the `DesktopModeContext`.
 * This is the recommended way for components to access the desktop state and actions.
 * @returns {DesktopModeContextType} The context value.
 * @throws {Error} If used outside of a `DesktopModeProvider`.
 * @example
 * const { openWindows, openWindow } = useDesktopMode();
 */
export const useDesktopMode = (): DesktopModeContextType => {
  const context = useContext(DesktopModeContext);
  if (context === undefined) {
    throw new Error('useDesktopMode must be used within a DesktopModeProvider');
  }
  return context;
};
