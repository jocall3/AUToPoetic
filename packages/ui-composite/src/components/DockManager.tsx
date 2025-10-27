/**
 * @file DockManager.tsx
 * @module ui-composite/DockManager
 * @description This file contains the implementation of the DockManager composite UI component.
 * It provides a flexible, dockable layout system for workspace applications, allowing panels
 * to be docked to the sides of a central content area.
 *
 * @see The 'Implement a Pluggable, Themeable, and Abstracted UI Framework' architectural directive, which mandates the creation of a 'Composite UI' library for complex, stateful patterns like DockManager.
 * @see The 'WorkspaceManager' plugin system, for which this component provides a foundational layout management pattern.
 *
 * @security The content rendered within dock panels is provided by the consumer of this component.
 * It is the consumer's responsibility to ensure that the content is safe and sanitized.
 * This component itself does not introduce direct security vulnerabilities, but care should be taken with resizable elements to prevent layout-based denial-of-service (e.g., resizing to extreme values).
 *
 * @performance The DockManager manages layout state. Frequent opening, closing, or resizing of panels
 * will cause re-renders. The layout calculations are optimized, but consumers should be mindful
 * of the performance impact of rapidly changing panel configurations. Use of React.memo on panel
 * content is recommended to prevent unnecessary re-renders of panel children.
 */

import React, { useState, useMemo, useCallback, useEffect, createContext, useContext } from 'react';

// --- Type Definitions ---

/**
 * @typedef {'left' | 'right' | 'top' | 'bottom'} DockPosition
 * @description Defines the possible positions for a dockable panel within the layout.
 * @security This type is used for layout and has no direct security implications.
 * @performance Layout calculations will depend on this, but the type itself is performant.
 */
export type DockPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * @interface DockPanelState
 * @description Represents the state and configuration of a single dockable panel.
 * @security Content provided to the panel should be trusted. No direct security risks in this interface.
 * @performance Frequent updates to panel state may cause re-renders. Memoization should be used where appropriate.
 */
export interface DockPanelState {
  /** @property {string} id - A unique identifier for the panel. Required. */
  id: string;
  /** @property {React.ReactNode} content - The component to be rendered inside the panel's content area. Required. */
  content: React.ReactNode;
  /** @property {string} title - The title of the panel, displayed in its header or tab. Required. */
  title: string;
  /** @property {React.ReactNode} [icon] - An optional icon for the panel, displayed next to the title. */
  icon?: React.ReactNode;
  /** @property {DockPosition} position - The position of the panel in the dock manager. Required. */
  position: DockPosition;
  /** @property {number} size - The size of the panel (width for 'left'/'right', height for 'top'/'bottom') in pixels. Required. */
  size: number;
  /** @property {number} [minSize=50] - The minimum size the panel can be resized to in pixels. */
  minSize?: number;
  /** @property {number} [maxSize=800] - The maximum size the panel can be resized to in pixels. */
  maxSize?: number;
  /** @property {boolean} isOpen - Whether the panel is currently visible (expanded). Required. */
  isOpen: boolean;
  /** @property {number} order - The display order of the panel within its dock position group. Required. */
  order: number;
}

/**
 * @interface DockManagerContextType
 * @description Defines the API provided by the DockContext for managing panels from child components.
 */
export interface DockManagerContextType {
  /** The current state of all registered panels. */
  panels: DockPanelState[];
  /** Function to open (make visible) a panel by its ID. */
  openPanel: (id: string) => void;
  /** Function to close (hide) a panel by its ID. */
  closePanel: (id: string) => void;
  /** Function to toggle the visibility of a panel by its ID. */
  togglePanel: (id: string) => void;
  /** Function to get the current state of a specific panel. */
  getPanelState: (id: string) => DockPanelState | undefined;
  /** Function to update the properties of a panel. */
  updatePanel: (id: string, updates: Partial<DockPanelState>) => void;
}

// --- Context ---

/**
 * @const DockContext
 * @description A React context that provides access to the DockManager's state and control functions.
 * @example
 * const { openPanel } = useDockManager();
 * openPanel('project-explorer');
 */
const DockContext = createContext<DockManagerContextType | null>(null);

/**
 * @function useDockManager
 * @description Custom hook to easily access the DockManager's context from any child component.
 * @returns {DockManagerContextType} The context value, providing access to panel state and manipulation functions.
 * @throws {Error} If used outside of a DockManager component tree.
 */
export const useDockManager = (): DockManagerContextType => {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDockManager must be used within a DockManager component.');
  }
  return context;
};

// --- Child Components ---

interface DockedPanelProps {
  panel: DockPanelState;
  onClose: (id: string) => void;
  onResize: (id: string, newSize: number) => void;
}

/**
 * @component DockedPanel
 * @description Renders a single dockable panel with its header, content, and a resize handle.
 * @private This is an internal component exclusively used by the DockManager system.
 */
const DockedPanel: React.FC<DockedPanelProps> = ({ panel, onClose, onResize }) => {
  const isHorizontal = panel.position === 'top' || panel.position === 'bottom';

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startSize = panel.size;
    const startPosition = isHorizontal ? e.clientY : e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPosition = isHorizontal ? moveEvent.clientY : moveEvent.clientX;
      const delta = currentPosition - startPosition;

      let newSize;
      if (panel.position === 'right' || panel.position === 'bottom') {
        newSize = startSize - delta;
      } else {
        newSize = startSize + delta;
      }
      
      const clampedSize = Math.max(panel.minSize ?? 50, Math.min(newSize, panel.maxSize ?? 800));
      onResize(panel.id, clampedSize);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panel.id, panel.size, panel.position, panel.minSize, panel.maxSize, onResize, isHorizontal]);
  
  const getHandleClasses = () => {
    const base = 'absolute z-10 bg-blue-500/0 hover:bg-blue-500/50 transition-colors duration-200';
    switch(panel.position) {
        case 'top':    return `${base} h-1.5 cursor-row-resize w-full bottom-[-3px]`;
        case 'bottom': return `${base} h-1.5 cursor-row-resize w-full top-[-3px]`;
        case 'left':   return `${base} w-1.5 cursor-col-resize h-full right-[-3px]`;
        case 'right':  return `${base} w-1.5 cursor-col-resize h-full left-[-3px]`;
    }
  }

  return (
    <div
      className="bg-[--color-surface] flex flex-col text-[--color-text-primary] overflow-hidden relative"
      style={{
        width: isHorizontal ? 'auto' : `${panel.size}px`,
        height: isHorizontal ? `${panel.size}px` : 'auto',
      }}
    >
      <header className="flex items-center justify-between h-8 px-2 border-b border-[--color-border] flex-shrink-0 bg-[--color-surface] bg-opacity-50 select-none">
        <div className="flex items-center gap-2 text-xs font-semibold">
          {panel.icon}
          <span className="truncate">{panel.title}</span>
        </div>
        <button onClick={() => onClose(panel.id)} className="p-1 rounded hover:bg-[--color-background]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>
      <main className="flex-1 overflow-auto">
        {panel.content}
      </main>
      <div onMouseDown={onMouseDown} className={getHandleClasses()} />
    </div>
  );
};

interface DockGroupProps {
  panels: DockPanelState[];
  position: DockPosition;
  onClose: (id: string) => void;
  onResize: (id: string, newSize: number) => void;
}

/**
 * @component DockGroup
 * @description Renders a group of panels stacked in a specific dock position.
 * @private Internal component used by DockManager.
 */
const DockGroup: React.FC<DockGroupProps> = ({ panels, position, onClose, onResize }) => {
  if (panels.length === 0) return null;
  
  const isHorizontal = position === 'top' || position === 'bottom';
  const flexDirection = isHorizontal ? 'row' : 'column';

  let borderClass = '';
  if (position === 'top') borderClass = 'border-b';
  if (position === 'bottom') borderClass = 'border-t';
  if (position === 'left') borderClass = 'border-r';
  if (position === 'right') borderClass = 'border-l';

  return (
    <div
      className={`bg-[--color-surface] flex shrink-0 border-[--color-border] ${borderClass}`}
      style={{ flexDirection }}
    >
      {panels.sort((a, b) => a.order - b.order).map(panel => (
        <DockedPanel key={panel.id} panel={panel} onClose={onClose} onResize={onResize} />
      ))}
    </div>
  );
};


// --- Main DockManager Component ---

/**
 * @interface DockManagerProps
 * @description Props for the main DockManager component.
 */
export interface DockManagerProps {
  /** The initial configuration of all dockable panels for the workspace. */
  initialPanels?: DockPanelState[];
  /** The main content of the workspace that will be surrounded by the dockable panels. */
  children: React.ReactNode;
  /** Callback function invoked when the layout of panels changes (e.g., on open, close, resize). */
  onLayoutChange?: (panels: DockPanelState[]) => void;
}

/**
 * @component DockManager
 * @description A composite UI component that provides a flexible, stateful docking system
 * for web applications. It manages the layout of panels docked to the edges of a central
 * content area and provides a context for controlling panel states.
 *
 * @example
 * const myPanels: DockPanelState[] = [
 *   { id: 'explorer', title: 'Project Explorer', content: <Explorer />, position: 'left', size: 250, isOpen: true, order: 1 },
 *   { id: 'terminal', title: 'Terminal', content: <Terminal />, position: 'bottom', size: 200, isOpen: false, order: 1 },
 * ];
 *
 * function App() {
 *   return (
 *     <DockManager initialPanels={myPanels}>
 *       <MyMainEditorComponent />
 *     </DockManager>
 *   );
 * }
 */
export const DockManager: React.FC<DockManagerProps> = ({ initialPanels = [], children, onLayoutChange }) => {
  const [panels, setPanels] = useState<DockPanelState[]>(initialPanels);

  useEffect(() => {
    onLayoutChange?.(panels);
  }, [panels, onLayoutChange]);

  const openPanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, isOpen: true } : p));
  }, []);

  const closePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, isOpen: false } : p));
  }, []);

  const togglePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, isOpen: !p.isOpen } : p));
  }, []);
  
  const getPanelState = useCallback((id: string) => panels.find(p => p.id === id), [panels]);

  const updatePanel = useCallback((id: string, updates: Partial<DockPanelState>) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);
  
  const handleResize = useCallback((id: string, newSize: number) => {
    updatePanel(id, { size: newSize });
  }, [updatePanel]);

  const contextValue = useMemo<DockManagerContextType>(() => ({
    panels,
    openPanel,
    closePanel,
    togglePanel,
    getPanelState,
    updatePanel,
  }), [panels, openPanel, closePanel, togglePanel, getPanelState, updatePanel]);

  const groupedPanels = useMemo(() => {
    const groups: Record<DockPosition, DockPanelState[]> = {
      top: [], bottom: [], left: [], right: []
    };
    panels.forEach(panel => {
      if (panel.isOpen) {
        groups[panel.position].push(panel);
      }
    });
    return groups;
  }, [panels]);

  return (
    <DockContext.Provider value={contextValue}>
      <div className="w-full h-full flex flex-col bg-[--color-background] overflow-hidden">
        <DockGroup position="top" panels={groupedPanels.top} onClose={closePanel} onResize={handleResize} />
        <div className="flex flex-1 min-h-0">
          <DockGroup position="left" panels={groupedPanels.left} onClose={closePanel} onResize={handleResize} />
          <main className="flex-1 overflow-auto relative">
            {children}
          </main>
          <DockGroup position="right" panels={groupedPanels.right} onClose={closePanel} onResize={handleResize} />
        </div>
        <DockGroup position="bottom" panels={groupedPanels.bottom} onClose={closePanel} onResize={handleResize} />
      </div>
    </DockContext.Provider>
  );
};
