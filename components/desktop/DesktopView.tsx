/**
 * @file Renders the classic desktop metaphor workspace layout.
 * @module components/desktop/DesktopView
 * @see contexts/WorkspaceContext for the state management and logic this view consumes.
 * @see ui/composite/WindowingSystem/Window for the window component implementation.
 * @license Copyright James Burvel O’Callaghan III
 * @license President Citibank Demo Business Inc.
 */

import React from 'react';

// Components are now imported from the new proprietary UI framework libraries.
import { FeatureDock } from '../../ui/composite/FeatureDock/FeatureDock';
import { Window } from '../../ui/composite/WindowingSystem/Window';
import { Taskbar } from '../../ui/composite/Taskbar/Taskbar';

// State and logic are consumed from the WorkspaceContext via the useWorkspace hook.
import { useWorkspace } from '../../contexts/WorkspaceContext';

/**
 * The DesktopView component provides a classic desktop environment layout,
 * complete with a dock, a main area for windowed applications, and a taskbar.
 * It is a presentation-only component that consumes state and logic from the
 * WorkspaceContext. This allows it to be used as a pluggable layout within
 * a larger WorkspaceManager system, which might also support layouts like
 * 'Tiled' or 'Tabbed' modes.
 *
 * @component
 * @returns {React.ReactElement} The rendered desktop view.
 *
 * @example
 * // Used within a WorkspaceProvider that provides the necessary context.
 * <WorkspaceProvider>
 *   <DesktopView />
 * </WorkspaceProvider>
 *
 * @performance
 * This component is optimized for rendering performance. It receives already-computed
 * lists of open and minimized windows from the `useWorkspace` hook, preventing
 * unnecessary state calculations or filtering within the view layer. The `Window`
 * components are expected to be memoized and handle their own internal rendering logic,
 * including the lazy loading of micro-frontend applications.
 *
 * @security
 * This component does not handle any sensitive data directly. It serves as a layout
 * shell. All application content is rendered within sandboxed `Window` components which
 * are responsible for loading and displaying micro-frontends. The security of the
 * loaded applications is managed by the MicroFrontend loader and the WindowingSystem
 * composite UI component, which should enforce isolation.
 */
export const DesktopView: React.FC = () => {
    const {
        openWindows,
        minimizedWindows,
        activeWindowId,
        openApp,
        closeApp,
        minimizeApp,
        focusApp,
        restoreApp,
        updateAppWindowState,
        getApp,
    } = useWorkspace();

    return (
        <div className="h-full flex flex-col bg-transparent font-sans">
            {/* FeatureDock to launch new applications (micro-frontends) */}
            <FeatureDock onOpen={openApp} />

            {/* Main desktop area where windows are rendered */}
            <div className="flex-grow relative overflow-hidden" id="desktop-space">
                {openWindows.map(win => {
                    const app = getApp(win.id);
                    if (!app) {
                        // This case could happen if a micro-frontend manifest fails to load
                        // or if an app is closed while still in the render loop.
                        // The WorkspaceContext should handle this gracefully.
                        console.warn(`DesktopView: App metadata for ID '${win.id}' not found.`);
                        return null;
                    }

                    // The Window component is part of the new Composite UI library's WindowingSystem.
                    // It encapsulates all windowing behavior and the loading of the micro-frontend content.
                    return (
                        <Window
                            key={win.id}
                            app={app}
                            state={win}
                            isActive={win.id === activeWindowId}
                            onClose={() => closeApp(win.id)}
                            onMinimize={() => minimizeApp(win.id)}
                            onFocus={() => focusApp(win.id)}
                            onUpdate={updateAppWindowState}
                        />
                    );
                })}
            </div>

            {/* Taskbar for managing minimized and open applications */}
            <Taskbar
                minimizedApps={minimizedWindows.map(w => getApp(w.id)).filter(app => app !== undefined)}
                onRestore={restoreApp}
            />
        </div>
    );
};
