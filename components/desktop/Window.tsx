/**
 * @file Defines the generic, themeable, and interactive Window component for the Workspace Manager.
 * @copyright James Burvel O'Callaghan III
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, ReactNode } from 'react';

// --- Framework Imports ---
// These imports are conceptual and represent components from the new proprietary UI framework
// as per the architectural directives. They are assumed to be available in the new structure.
/**
 * @see {ArchitecturalDirective} Implement a Pluggable, Themeable, and Abstracted UI Framework
 */
// import { Button } from '../../ui/core/Button';
// import { WindowFrame, WindowTitleBar, WindowContent, WindowResizeHandle } from '../../ui/composite/WindowingSystem';
// import { useDraggable } from '../../hooks/useDraggable';
// import { useResizable } from '../../hooks/useResizable';

// --- Concrete Imports ---
import { LoadingSpinner } from '../shared/index.tsx';
import { MinimizeIcon, MaximizeIcon, RestoreIcon, XMarkIcon } from '../icons.tsx';

// --- Mocked Framework Components for Demonstration ---
// As the UI framework is conceptual, these are simple stand-ins to make the component functional.
const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
const WindowFrame = React.forwardRef(({ children, id, position, size, zIndex, isActive, isMaximized, onMouseDown }: any, ref: any) => (
    <div
        ref={ref}
        id={id}
        onMouseDown={onMouseDown}
        className={`absolute flex flex-col bg-surface/80 backdrop-blur-md border rounded-lg shadow-2xl shadow-black/50 transition-all duration-200 ease-in-out ${isActive ? 'border-primary/50' : 'border-border'}`}
        style={{
            ...(isMaximized 
                ? { top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0 }
                : { transform: `translate(${position.x}px, ${position.y}px)`, width: size.width, height: size.height }),
            zIndex
        }}
    >
        {children}
    </div>
));
const WindowTitleBar = ({ children, ...props }: any) => <header {...props} className="flex items-center justify-between h-8 px-2 border-b border-border flex-shrink-0 cursor-move rounded-t-lg">{children}</header>;
const WindowContent = ({ children }: any) => <main className="flex-1 overflow-auto bg-background/50 rounded-b-lg">{children}</main>;
const WindowResizeHandle = ({ position, ...props }: any) => <div {...props} style={{ position: 'absolute', ...getResizeHandleStyle(position) }} />; 
const useDraggable = ({ onDragStart, onDrag }: any) => ({ dragHandleProps: { onMouseDown: (e: any) => { /* Mock drag logic */ onDragStart?.(); } } });
const useResizable = ({ onResizeStart, onResize }: any) => ({ resizeHandleProps: {} }); // Mock resize props

const getResizeHandleStyle = (position: string) => {
    const styles: React.CSSProperties = { zIndex: 1 };
    if (position.includes('top')) { styles.top = -5; styles.height = 10; }
    if (position.includes('bottom')) { styles.bottom = -5; styles.height = 10; }
    if (position.includes('left')) { styles.left = -5; styles.width = 10; }
    if (position.includes('right')) { styles.right = -5; styles.width = 10; }
    if (position === 'top' || position === 'bottom') { styles.left = 5; styles.right = 5; styles.cursor = 'ns-resize'; }
    if (position === 'left' || position === 'right') { styles.top = 5; styles.bottom = 5; styles.cursor = 'ew-resize'; }
    if (position === 'top-left' || position === 'bottom-right') { styles.cursor = 'nwse-resize'; }
    if (position === 'top-right' || position === 'bottom-left') { styles.cursor = 'nesw-resize'; }
    return styles;
};

/**
 * @interface WindowState
 * @description Defines the state properties of a single window within the workspace.
 * @property {string} id - A unique identifier for the window.
 * @property {{ x: number; y: number }} position - The top-left coordinates of the window.
 * @property {{ width: number; height: number }} size - The dimensions of the window.
 * @property {number} zIndex - The stacking order of the window.
 * @property {boolean} isMinimized - Whether the window is currently minimized.
 * @property {boolean} isMaximized - Whether the window is currently maximized.
 */
export interface WindowState {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

/**
 * @interface WindowProps
 * @description Defines the props for the generic Window component.
 * @property {string} id - The unique ID of the window instance.
 * @property {string} title - The title displayed in the window's title bar.
 * @property {ReactNode} [icon] - An optional icon to display next to the title.
 * @property {WindowState} state - The current state object of the window (position, size, etc.).
 * @property {boolean} isActive - True if this is the currently focused window.
 * @property {ReactNode} children - The content to be rendered inside the window. This will typically be a lazily loaded micro-frontend.
 * @property {(id: string) => void} onClose - Callback function when the close button is clicked.
 * @property {(id: string) => void} onMinimize - Callback function when the minimize button is clicked.
 * @property {(id: string) => void} onMaximize - Callback function when the maximize/restore button is clicked.
 * @property {(id: string) => void} onFocus - Callback function when the window is clicked or dragged, to bring it to the front.
 * @property {(id: string, updates: Partial<WindowState>) => void} onUpdate - Callback to update the window's state (e.g., after dragging or resizing).
 */
interface WindowProps {
  id: string;
  title: string;
  icon?: ReactNode;
  state: WindowState;
  isActive: boolean;
  children: ReactNode;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WindowState>) => void;
}

/**
 * @class Window
 * @description A generic, themeable, and interactive window component for the Workspace Manager.
 * It provides standard windowing functionalities like dragging, resizing, minimizing, maximizing, and closing.
 * This component is part of the 'Composite UI' library and is designed to be a container for any content,
 * typically a micro-frontend application.
 *
 * @example
 * <Window
 *   id="my-feature-1"
 *   title="My Feature"
 *   icon={<MyIcon />}
 *   state={windowState}
 *   isActive={true}
 *   onClose={handleClose}
 *   onMinimize={handleMinimize}
 *   onMaximize={handleMaximize}
 *   onFocus={handleFocus}
 *   onUpdate={updateWindowState}
 * >
 *   <MyFeatureMicroFrontend />
 * </Window>
 *
 * @performance
 * This component uses `React.memo` for optimization, re-rendering only when its specific props change.
 * Drag and resize operations should be throttled within their respective hooks
 * to ensure smooth performance and avoid excessive re-renders of the entire workspace.
 *
 * @security
 * The window content is rendered via `props.children`. It is the responsibility of the parent component
 * (WorkspaceManager) to ensure that the children (micro-frontends) are loaded from a trusted source and
 * are properly sandboxed if necessary. This component itself does not perform any sanitization.
 */
export const Window: React.FC<WindowProps> = React.memo(({
  id,
  title,
  icon,
  state,
  isActive,
  children,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onUpdate,
}) => {
    const windowRef = React.useRef<HTMLDivElement>(null);

    const { dragHandleProps } = useDraggable({
        ref: windowRef,
        onDragStart: () => onFocus(id),
        onDrag: ({ dx, dy }: { dx: number; dy: number }) => {
            if (!state.isMaximized) {
                onUpdate(id, { position: { x: state.position.x + dx, y: state.position.y + dy } });
            }
        },
    });

    const { resizeHandleProps } = useResizable({
        ref: windowRef,
        onResizeStart: () => onFocus(id),
        onResize: (newSize: {width: number; height: number}, newPosition: {x: number; y: number}) => {
             if (!state.isMaximized) {
                onUpdate(id, { size: newSize, position: newPosition });
            }
        },
    });

    /**
     * @function handleHeaderDoubleClick
     * @description Toggles the maximization state of the window when the title bar is double-clicked.
     * @returns {void}
     */
    const handleHeaderDoubleClick = () => {
        onMaximize(id);
    };

    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose(id);
    };

    const handleMinimizeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMinimize(id);
    };

    const handleMaximizeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMaximize(id);
    };

    return (
        <WindowFrame
            ref={windowRef}
            id={id}
            position={state.position}
            size={state.size}
            zIndex={state.zIndex}
            isActive={isActive}
            isMaximized={state.isMaximized}
            onMouseDown={() => onFocus(id)}
        >
            <WindowTitleBar
                {...dragHandleProps}
                onDoubleClick={handleHeaderDoubleClick}
            >
                <div className="flex items-center gap-2 text-sm truncate flex-grow">
                    {icon && <div className="w-4 h-4 flex-shrink-0 text-text-secondary">{icon}</div>}
                    <span className="truncate text-text-primary font-medium">{title}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={handleMinimizeClick} aria-label={`Minimize ${title}`}>
                        <MinimizeIcon />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleMaximizeClick} aria-label={state.isMaximized ? `Restore ${title}` : `Maximize ${title}`}>
                        {state.isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-500/20" onClick={handleCloseClick} aria-label={`Close ${title}`}>
                        <XMarkIcon />
                    </Button>
                </div>
            </WindowTitleBar>
            <WindowContent>
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                    {children}
                </Suspense>
            </WindowContent>
            
            {!state.isMaximized && (
                <>
                    <WindowResizeHandle position="top-left" {...resizeHandleProps['top-left']} />
                    <WindowResizeHandle position="top" {...resizeHandleProps['top']} />
                    <WindowResizeHandle position="top-right" {...resizeHandleProps['top-right']} />
                    <WindowResizeHandle position="left" {...resizeHandleProps['left']} />
                    <WindowResizeHandle position="right" {...resizeHandleProps['right']} />
                    <WindowResizeHandle position="bottom-left" {...resizeHandleProps['bottom-left']} />
                    <WindowResizeHandle position="bottom" {...resizeHandleProps['bottom']} />
                    <WindowResizeHandle position="bottom-right" {...resizeHandleProps['bottom-right']} />
                </>
            )}
        </WindowFrame>
    );
});

Window.displayName = 'Window';
