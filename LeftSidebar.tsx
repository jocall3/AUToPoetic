/**
 * @file LeftSidebar.tsx
 * @description This file contains the implementation of the main application sidebar.
 * It is responsible for rendering navigation items, displaying user information, and handling logout.
 * This component is part of the application shell and is designed to be themeable and abstract,
 * consuming components from the core UI library.
 * @module components/LeftSidebar
 * @see @/ui/core/components/IconButton
 * @see @/ui/core/components/Tooltip
 * @see @/hooks/useAuth
 */

import React from 'react';

// Core Icon library
import { ArrowLeftOnRectangleIcon } from './icons.tsx';

// Application state and hooks
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';

// Types
import type { ViewType, SidebarItem } from '../types.ts';
import { signOutUser } from '../services/googleAuthService.ts';

/**
 * @interface TooltipProps
 * @description Props for the Tooltip component.
 */
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

/**
 * A reusable Tooltip component that appears on hover.
 * In a full UI framework, this would be imported from a shared library.
 * @param {TooltipProps} props - The properties for the Tooltip component.
 * @returns {React.ReactElement} The child element wrapped in a tooltip container.
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
 * @description Props for the LeftSidebar component.
 */
interface LeftSidebarProps {
  /**
   * @property {SidebarItem[]} items - An array of objects defining the items to display in the sidebar.
   */
  items: SidebarItem[];
  /**
   * @property {ViewType} activeView - The identifier of the currently active view, used for highlighting the active item.
   */
  activeView: ViewType;
  /**
   * @property {(view: ViewType, props?: any) => void} onNavigate - A callback function to be invoked when a sidebar item is clicked.
   * It receives the view identifier and optional props for the new view.
   */
  onNavigate: (view: ViewType, props?: any) => void;
}

/**
 * @component LeftSidebar
 * @description The primary navigation sidebar for the application.
 * It provides access to different features and application-level actions like settings and logout.
 * The component is built using the core UI library for consistency and theming.
 *
 * @param {LeftSidebarProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered sidebar component.
 *
 * @security
 * The logout functionality triggers a call to the `googleAuthService`,
 * which invalidates the user's server-side session and JWT. The client never handles secret revocation directly.
 *
 * @performance
 * The list of sidebar items is rendered directly. The component relies on memoized state from
 * `useGlobalState` to prevent unnecessary re-renders.
 */
export const LeftSidebar: React.FC<LeftSidebarProps> = ({ items, activeView, onNavigate }) => {
    const { state, dispatch } = useGlobalState();
    const { user } = state;
    const { addNotification } = useNotification();

    /**
     * @function handleLogout
     * @description Handles the user logout process. It calls the `signOutUser` function which
     * orchestrates session invalidation. It also provides user feedback via notifications.
     * @returns {Promise<void>}
     */
    const handleLogout = async (): Promise<void> => {
        try {
            await signOutUser();
            // The onAuthStateChanged listener in App.tsx will handle dispatching SET_APP_USER.
            addNotification('You have been successfully logged out.', 'info');
        } catch (error) {
            console.error("Failed to sign out:", error);
            addNotification('Failed to sign out. Please try again.', 'error');
            // As a fallback, ensure local state is cleared.
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
       <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center gap-2 pt-4">
        {items.map((item) => {
            const isActive = activeView === item.view;
            return (
                <Tooltip key={item.id} text={item.label}>
                  <button
                    aria-label={item.label}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ease-in-out ${
                        isActive 
                        ? 'bg-primary/10 text-primary scale-110 shadow-sm' 
                        : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-primary'}`
                    }
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        onNavigate(item.view, item.props);
                      }
                    }}
                  >
                    {item.icon}
                  </button>
                </Tooltip>
            );
        })}
      </div>
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
                  aria-label="Logout"
                  className="flex items-center justify-center w-12 h-12 rounded-xl text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  onClick={handleLogout}
                >
                  <ArrowLeftOnRectangleIcon />
                </button>
            </Tooltip>
         )}
      </div>
    </nav>
  );
};
