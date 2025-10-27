/**
 * @module components/LeftSidebar
 * @description Provides the primary vertical navigation sidebar for the application.
 * It displays navigation items, the current user's avatar, and a logout control.
 * This component is designed to be highly configurable via its props, receiving an
 * array of `SidebarItem` objects to render.
 * @security This component handles the user-facing logout action. The `handleLogout`
 * function is responsible for initiating the logout process by calling a centralized
 * `authService`, which communicates with the backend `AuthGateway`. It ensures that
 * client-side session data is cleared upon logout.
 * @performance The component memoizes its `Tooltip` sub-component and relies on React's
 * reconciliation for rendering the list of items. Performance is generally O(n) where n
 * is the number of sidebar items. Re-renders are primarily triggered by changes in
 * `activeView` or the `user` state from the global context.
 */

import React from 'react';
import type { ViewType, SidebarItem } from '../types';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { authService } from '../services'; // Abstracted auth service adapter
import { ArrowLeftOnRectangleIcon } from './icons';

/**
 * @interface TooltipProps
 * @property {string} text - The text content to display within the tooltip.
 * @property {React.ReactNode} children - The element that the tooltip is attached to.
 */
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

/**
 * A reusable Tooltip component that appears on hover.
 * It displays a text label to the right of its child element.
 * @param {TooltipProps} props - The properties for the Tooltip component.
 * @returns {React.ReactElement} The child element wrapped in a tooltip container.
 * @example
 * <Tooltip text="Click me!">
 *   <button>Hover Over Me</button>
 * </Tooltip>
 */
const Tooltip: React.FC<TooltipProps> = React.memo(({ text, children }) => {
  return (
    <div className="group relative flex justify-center">
      {children}
      <span className="absolute left-16 p-2 w-max scale-0 transition-all rounded bg-slate-800 border border-slate-700 shadow-lg text-xs text-white group-hover:scale-100 whitespace-nowrap z-50">
        {text}
      </span>
    </div>
  );
});
Tooltip.displayName = 'Tooltip';

/**
 * @interface LeftSidebarProps
 * @property {SidebarItem[]} items - An array of sidebar items to render.
 * @property {ViewType} activeView - The ID of the currently active view.
 * @property {(view: ViewType, props?: any) => void} onNavigate - Callback function to handle navigation.
 */
interface LeftSidebarProps {
  items: SidebarItem[];
  activeView: ViewType;
  onNavigate: (view: ViewType, props?: any) => void;
}

/**
 * The main sidebar component for application navigation.
 * It displays a list of clickable icons for navigating between different features
 * (micro-frontends) and core views like Settings. It also shows the authenticated
 * user's avatar and a logout button.
 *
 * @param {LeftSidebarProps} props - The properties for the LeftSidebar component.
 * @returns {React.ReactElement} A navigation sidebar element.
 * @see {@link module:types~SidebarItem} for the structure of navigation items.
 * @example
 * const sidebarItems = [
 *   { id: 'home', label: 'Home', icon: <HomeIcon />, view: 'home' },
 *   { id: 'settings', label: 'Settings', icon: <SettingsIcon />, view: 'settings' }
 * ];
 * <LeftSidebar
 *   items={sidebarItems}
 *   activeView={'home'}
 *   onNavigate={(view) => console.log('Navigating to', view)}
 * />
 */
export const LeftSidebar: React.FC<LeftSidebarProps> = ({ items, activeView, onNavigate }) => {
    const { state, dispatch } = useGlobalState();
    const { user } = state;

    /**
     * Handles the user logout process.
     * This function calls the centralized authentication service to log the user out,
     * which will invalidate the session on the server-side via the AuthGateway.
     * It then clears the user from the global state, updating the UI to a logged-out view.
     * @async
     * @returns {Promise<void>}
     * @throws {Error} Logs any errors that occur during the logout process to the console.
     */
    const handleLogout = async (): Promise<void> => {
        try {
            await authService.logout();
            dispatch({ type: 'SET_APP_USER', payload: null });
        } catch (error) {
            console.error("Failed to sign out:", error);
            // Still clear local state as a best effort even if server call fails
            dispatch({ type: 'SET_APP_USER', payload: null });
        }
    };

    return (
        <nav className="w-20 h-full bg-surface border-r border-border flex flex-col items-center py-4 px-2 shadow-md">
            {/* App Logo */}
            <div className="flex-shrink-0 w-full flex justify-center p-2 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center gap-2 pt-4">
                {items.map((item) => {
                    const isActive = activeView === item.view;
                    return (
                        <Tooltip key={item.id} text={item.label}>
                            <button
                                onClick={() => {
                                    if (item.action) {
                                        item.action();
                                    } else {
                                        onNavigate(item.view, item.props);
                                    }
                                }}
                                aria-label={item.label}
                                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ease-in-out
                                  ${
                                    isActive 
                                    ? 'bg-primary/10 text-primary scale-110 shadow-sm' 
                                    : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-primary'}`
                                }
                            >
                                {item.icon}
                            </button>
                        </Tooltip>
                    );
                })}
            </div>

            {/* User and Logout */}
            <div className="mt-auto flex-shrink-0 w-full flex flex-col items-center gap-4">
                {user && (
                    <Tooltip text={user.displayName || 'User Profile'}>
                        <img 
                            src={user.photoURL || `https://avatar.vercel.sh/${user.email || user.uid}.svg`} 
                            alt={user.displayName || 'User Avatar'} 
                            className="w-10 h-10 rounded-full border-2 border-border object-cover" 
                        />
                    </Tooltip>
                )}
                {user && (
                    <Tooltip text="Logout">
                        <button
                            onClick={handleLogout}
                            aria-label="Logout"
                            className="flex items-center justify-center w-12 h-12 rounded-xl text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        >
                            <ArrowLeftOnRectangleIcon />
                        </button>
                    </Tooltip>
                )}
            </div>
        </nav>
    );
};
