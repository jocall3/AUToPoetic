/**
 * @module WindowingSystem
 * @description Provides a comprehensive, stateful windowing system for a desktop-like user interface.
 * This composite component manages the state, lifecycle, and rendering of multiple floating windows.
 * It is designed to be a core part of a pluggable WorkspaceManager system.
 *
 * @see {@link WorkspaceManager} - This component is a primary building block for desktop-style layouts.
 * @performance Manages window state efficiently using a reducer and a Map for O(1) lookups. Drag and resize operations are handled via direct state updates, with rendering optimized by React.
 * @security The content within windows is rendered as-is via the `children` prop. It is the responsibility of the consuming components to ensure that any user-generated content passed as children is properly sanitized to prevent XSS attacks.
 * @example
 * <WindowingSystemProvider>
 *   <MyApp />
 * </WindowingSystemProvider>
 *
 * // In MyApp.tsx
 * const { openWindow } = useWindowingSystem();
 * const openMyTool = () => {
 *   openWindow({
 *     id: 'my-tool',
 *     title: 'My Awesome Tool',
 *     children: <MyToolComponent />,
 *     position: { x: 100, y: 100 },
 *     size: { width: 400, height: 300 },
 *   });
 * };
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  FC,
  MouseEvent as ReactMouseEvent,
  useRef,
  useMemo,
} from 'react';

// --- TYPES AND INTERFACES ---

// Placeholder icons. In the new architecture, these would be imported from a 'ui-core' icon library.
const MinimizeIcon: FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
const MaximizeIcon: FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h15v15h-15z" /></svg>;
const RestoreIcon: FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5h11v11h-11z M4.5 4.5h11v11h-11z" /></svg>;
const CloseIcon: FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;


/**
 * @interface WindowState
 * @description Represents the state of a single window within the windowing system.
 */
export interface WindowState {
  /** A unique identifier for the window. */
  id: string;
  /** The content to display in the window's title bar. */
  title: ReactNode;
  /** An optional icon to display in the title bar. */
  icon?: ReactNode;
  /** The window's position (top-left corner) on the canvas. */
  position: { x: number; y: number };
  /** The window's dimensions. */
  size: { width: number; height: number };
  /** The stacking order of the window. Higher numbers are on top. */
  zIndex: number;
  /** True if the window is minimized to a taskbar or dock. */
  isMinimized: boolean;
  /** True if the window is maximized to fill the workspace. */
  isMaximized: boolean;
  /** The content to be rendered inside the window's body. */
  children: ReactNode;
  /** Stores position and size before maximizing, to allow for restoration. */
  previousState?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
}

/**
 * @typedef {Omit<WindowState, 'zIndex' | 'isMinimized' | 'isMaximized' | 'previousState'>} OpenWindowPayload
 * @description The payload required to open a new window. Core properties are required, while stateful properties are managed by the system.
 */
export type OpenWindowPayload = Omit<WindowState, 'zIndex' | 'isMinimized' | 'isMaximized' | 'previousState'>;


/**
 * @interface WindowingSystemContextType
 * @description Defines the shape of the context provided by the WindowingSystem.
 * It includes the state of all windows and functions to manage them.
 */
interface WindowingSystemContextType {
  /** An array of all current window states. */
  windows: WindowState[];
  /** An array of currently active (non-minimized) window states. */
  activeWindows: WindowState[];
  /** An array of currently minimized window states. */
  minimizedWindows: WindowState[];
  /** The ID of the currently focused window, if any. */
  focusedWindowId: string | null;
  /**
   * Opens a new window or focuses an existing one.
   * @param {OpenWindowPayload} payload - The configuration for the window to open.
   */
  openWindow: (payload: OpenWindowPayload) => void;
  /**
   * Closes a window.
   * @param {string} id - The ID of the window to close.
   */
  closeWindow: (id: string) => void;
  /**
   * Brings a window to the front and marks it as focused.
   * @param {string} id - The ID of the window to focus.
   */
  focusWindow: (id: string) => void;
  /**
   * Minimizes a window.
   * @param {string} id - The ID of the window to minimize.
   */
  minimizeWindow: (id: string) => void;
  /**
   * Toggles a window between its maximized and restored states.
   * @param {string} id - The ID of the window to toggle.
   */
  toggleMaximizeWindow: (id: string) => void;
  /**
   * Updates the state of a window, typically its position or size.
   * @param {string} id - The ID of the window to update.
   * @param {Partial<Pick<WindowState, 'position' | 'size'>>} updates - The new state values.
   */
  updateWindowState: (id: string, updates: Partial<Pick<WindowState, 'position' | 'size'>>) => void;
  /**
   * Retrieves the state of a specific window.
   * @param {string} id - The ID of the window to retrieve.
   * @returns {WindowState | undefined} The state of the window, or undefined if not found.
   */
  getWindowState: (id: string) => WindowState | undefined;
}

// --- REDUCER LOGIC ---

type WindowAction =
  | { type: 'OPEN'; payload: OpenWindowPayload }
  | { type: 'CLOSE'; payload: { id: string } }
  | { type: 'FOCUS'; payload: { id: string } }
  | { type: 'MINIMIZE'; payload: { id: string } }
  | { type: 'TOGGLE_MAXIMIZE'; payload: { id: string } }
  | { type: 'UPDATE'; payload: { id: string; updates: Partial<Pick<WindowState, 'position' | 'size'>> } };

interface WindowSystemState {
  windows: Map<string, WindowState>;
  zIndexCounter: number;
  lastPosition: { x: number; y: number };
  focusedWindowId: string | null;
}

const Z_INDEX_BASE = 100;
const CASCADE_OFFSET = 30;

const initialState: WindowSystemState = {
  windows: new Map(),
  zIndexCounter: Z_INDEX_BASE,
  lastPosition: { x: 50, y: 50 },
  focusedWindowId: null,
};

/**
 * @function windowReducer
 * @description Reducer function for managing the state of the windowing system. It handles all window lifecycle events in an immutable way.
 * @param {WindowSystemState} state - The current state.
 * @param {WindowAction} action - The action to perform.
 * @returns {WindowSystemState} The new state.
 */
function windowReducer(state: WindowSystemState, action: WindowAction): WindowSystemState {
  const newWindows = new Map(state.windows);
  let newZIndexCounter = state.zIndexCounter;
  let newLastPosition = state.lastPosition;
  let newFocusedWindowId = state.focusedWindowId;

  switch (action.type) {
    case 'OPEN': {
      const { id } = action.payload;
      const existingWindow = newWindows.get(id);

      if (existingWindow) {
        newZIndexCounter++;
        newWindows.set(id, {
          ...existingWindow,
          isMinimized: false,
          zIndex: newZIndexCounter,
        });
        newFocusedWindowId = id;
      } else {
        newZIndexCounter++;
        newLastPosition = {
          x: state.lastPosition.x + CASCADE_OFFSET,
          y: state.lastPosition.y + CASCADE_OFFSET,
        };
        const newWindow: WindowState = {
          ...action.payload,
          position: action.payload.position || newLastPosition,
          size: action.payload.size || { width: 800, height: 600 },
          isMinimized: false,
          isMaximized: false,
          zIndex: newZIndexCounter,
        };
        newWindows.set(id, newWindow);
        newFocusedWindowId = id;
      }
      break;
    }
    case 'CLOSE': {
      newWindows.delete(action.payload.id);
      if (state.focusedWindowId === action.payload.id) {
        newFocusedWindowId = null;
      }
      break;
    }
    case 'FOCUS': {
      const { id } = action.payload;
      const windowToFocus = newWindows.get(id);
      if (windowToFocus && id !== state.focusedWindowId) {
        newZIndexCounter++;
        newWindows.set(id, {
          ...windowToFocus,
          isMinimized: false,
          zIndex: newZIndexCounter,
        });
        newFocusedWindowId = id;
      } else if (windowToFocus?.isMinimized) {
        newZIndexCounter++;
        newWindows.set(id, {
            ...windowToFocus,
            isMinimized: false,
            zIndex: newZIndexCounter
        });
        newFocusedWindowId = id;
      }
      break;
    }
    case 'MINIMIZE': {
      const { id } = action.payload;
      const windowToMinimize = newWindows.get(id);
      if (windowToMinimize) {
        newWindows.set(id, { ...windowToMinimize, isMinimized: true });
        if (state.focusedWindowId === id) {
          newFocusedWindowId = null;
        }
      }
      break;
    }
    case 'TOGGLE_MAXIMIZE': {
      const { id } = action.payload;
      const windowToMaximize = newWindows.get(id);
      if (windowToMaximize) {
        if (windowToMaximize.isMaximized) {
          newWindows.set(id, {
            ...windowToMaximize,
            isMaximized: false,
            position: windowToMaximize.previousState?.position || windowToMaximize.position,
            size: windowToMaximize.previousState?.size || windowToMaximize.size,
            previousState: undefined,
          });
        } else {
          newWindows.set(id, {
            ...windowToMaximize,
            isMaximized: true,
            previousState: {
              position: windowToMaximize.position,
              size: windowToMaximize.size,
            },
          });
        }
      }
      break;
    }
    case 'UPDATE': {
      const { id, updates } = action.payload;
      const windowToUpdate = newWindows.get(id);
      if (windowToUpdate) {
        newWindows.set(id, { ...windowToUpdate, ...updates });
      }
      break;
    }
    default:
      return state;
  }

  return {
    windows: newWindows,
    zIndexCounter: newZIndexCounter,
    lastPosition: newLastPosition,
    focusedWindowId: newFocusedWindowId,
  };
}

// --- CONTEXT AND PROVIDER ---

const WindowingSystemContext = createContext<WindowingSystemContextType | undefined>(undefined);

/**
 * @hook useWindowingSystem
 * @description Custom hook to access the WindowingSystem context.
 * Provides a simple way for child components to interact with the window manager.
 * @returns {WindowingSystemContextType} The windowing system context.
 * @throws {Error} If used outside of a `WindowingSystemProvider`.
 */
export const useWindowingSystem = (): WindowingSystemContextType => {
  const context = useContext(WindowingSystemContext);
  if (!context) {
    throw new Error('useWindowingSystem must be used within a WindowingSystemProvider');
  }
  return context;
};

/**
 * @component WindowingSystemProvider
 * @description The main provider component for the windowing system. It wraps the application
 * part that needs windowing capabilities, manages all window states, and provides
 * the context for interacting with the windows.
 * @param {{ children: ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The provider component.
 */
export const WindowingSystemProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(windowReducer, initialState);
  const containerRef = useRef<HTMLDivElement>(null);

  const openWindow = useCallback((payload: OpenWindowPayload) => dispatch({ type: 'OPEN', payload }), []);
  const closeWindow = useCallback((id: string) => dispatch({ type: 'CLOSE', payload: { id } }), []);
  const focusWindow = useCallback((id: string) => dispatch({ type: 'FOCUS', payload: { id } }), []);
  const minimizeWindow = useCallback((id: string) => dispatch({ type: 'MINIMIZE', payload: { id } }), []);
  const toggleMaximizeWindow = useCallback((id: string) => dispatch({ type: 'TOGGLE_MAXIMIZE', payload: { id } }), []);
  const updateWindowState = useCallback((id: string, updates: Partial<Pick<WindowState, 'position' | 'size'>>) => {
    dispatch({ type: 'UPDATE', payload: { id, updates } });
  }, []);
  const getWindowState = useCallback((id: string) => state.windows.get(id), [state.windows]);
  
  const windows = useMemo(() => Array.from(state.windows.values()), [state.windows]);
  const activeWindows = useMemo(() => windows.filter(w => !w.isMinimized), [windows]);
  const minimizedWindows = useMemo(() => windows.filter(w => w.isMinimized), [windows]);

  const contextValue = useMemo(
    () => ({
      windows,
      activeWindows,
      minimizedWindows,
      focusedWindowId: state.focusedWindowId,
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      toggleMaximizeWindow,
      updateWindowState,
      getWindowState,
    }),
    [
      windows,
      activeWindows,
      minimizedWindows,
      state.focusedWindowId,
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      toggleMaximizeWindow,
      updateWindowState,
      getWindowState,
    ]
  );
  
  return (
    <WindowingSystemContext.Provider value={contextValue}>
      {children}
      <div
        ref={containerRef}
        className="window-canvas"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
      >
        {activeWindows.map(windowState => (
          <WindowComponent
            key={windowState.id}
            windowState={windowState}
            isFocused={state.focusedWindowId === windowState.id}
            onClose={() => closeWindow(windowState.id)}
            onFocus={() => focusWindow(windowState.id)}
            onMinimize={() => minimizeWindow(windowState.id)}
            onToggleMaximize={() => toggleMaximizeWindow(windowState.id)}
            onUpdate={updates => updateWindowState(windowState.id, updates)}
            containerRef={containerRef}
          />
        ))}
      </div>
    </WindowingSystemContext.Provider>
  );
};

// --- INDIVIDUAL WINDOW COMPONENT ---

interface WindowComponentProps {
  windowState: WindowState;
  isFocused: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onUpdate: (updates: Partial<Pick<WindowState, 'position' | 'size'>>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * @component WindowComponent
 * @description Renders a single draggable and resizable window. This component is internal to the WindowingSystem.
 * @param {WindowComponentProps} props - The props for the component.
 * @returns {JSX.Element} The window component.
 */
const WindowComponent: FC<WindowComponentProps> = ({
  windowState,
  isFocused,
  onClose,
  onFocus,
  onMinimize,
  onToggleMaximize,
  onUpdate,
}) => {
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const initialPos = useRef<{ x: number; y: number } | null>(null);
  
  const handleDragStart = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (windowState.isMaximized) return;
    e.preventDefault();
    onFocus();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: windowState.position.x, y: windowState.position.y };
    
    const handleDragMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current || !initialPos.current) return;
      const dx = moveEvent.clientX - dragStartPos.current.x;
      const dy = moveEvent.clientY - dragStartPos.current.y;
      onUpdate({ position: { x: initialPos.current.x + dx, y: initialPos.current.y + dy } });
    };

    const handleDragEnd = () => {
      dragStartPos.current = null;
      initialPos.current = null;
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }, [onFocus, onUpdate, windowState.isMaximized, windowState.position]);

  const windowClasses = [
    'absolute', 'flex', 'flex-col', 'rounded-lg', 'shadow-2xl', 'shadow-black/50', 'transition-all', 'duration-100',
    'bg-[var(--color-surface)]', 'border',
    isFocused ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]',
    windowState.isMaximized ? 'inset-0 !rounded-none' : ''
  ].join(' ');

  return (
    <div
      className={windowClasses}
      style={{
        left: windowState.isMaximized ? 0 : windowState.position.x,
        top: windowState.isMaximized ? 0 : windowState.position.y,
        width: windowState.isMaximized ? '100%' : windowState.size.width,
        height: windowState.isMaximized ? '100%' : windowState.size.height,
        zIndex: windowState.zIndex,
      }}
      onMouseDown={onFocus}
    >
      <header
        className={`flex items-center justify-between h-8 px-2 border-b rounded-t-lg select-none ${isFocused ? 'bg-[var(--color-primary)]/10 border-[var(--color-border)]' : 'bg-transparent border-[var(--color-border)]'} ${windowState.isMaximized ? '' : 'cursor-move'}`}
        onMouseDown={handleDragStart}
        onDoubleClick={onToggleMaximize}
      >
        <div className="flex items-center gap-2 text-xs truncate text-[var(--color-text-primary)]">
          {windowState.icon && <div className="w-4 h-4 flex-shrink-0">{windowState.icon}</div>}
          <span className="truncate font-medium">{windowState.title}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* These would be replaced by Core UI Buttons from '@devcore/ui-core' */}
          <button onClick={onMinimize} className="p-1 rounded hover:bg-black/10 text-[var(--color-text-secondary)]"><MinimizeIcon /></button>
          <button onClick={onToggleMaximize} className="p-1 rounded hover:bg-black/10 text-[var(--color-text-secondary)]">
            {windowState.isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-red-500/80 hover:text-white text-[var(--color-text-secondary)]"><CloseIcon /></button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-[var(--color-background)] rounded-b-lg">
        {windowState.children}
      </main>
       {/* Resizing handles could be added here for a complete implementation */}
    </div>
  );
};
