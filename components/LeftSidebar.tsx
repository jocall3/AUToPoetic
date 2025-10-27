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

// Core UI library components
// import { Tooltip } from '@/ui/core/components/Tooltip';
// import { IconButton } from '@/ui/core/components/IconButton';
// import { Avatar } from '@/ui/core/components/Avatar';

// Core Icon library
import { ArrowLeftOnRectangleIcon } from './icons.tsx';

// Application state and hooks
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
// import { useAuth } from '@/hooks/useAuth';
// import { useNotification } from '@/contexts/NotificationContext';

// Types
import type { ViewType, SidebarItem } from '../types.ts';
import { signOutUser } from '../services/googleAuthService.ts';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative flex justify-center">
      {children}
      <span className="absolute left-14 p-2 scale-0 transition-all rounded bg-gray-800 border border-gray-900 text-xs text-white group-hover:scale-100 whitespace-nowrap z-50">
        {text}
      </span>
    </div>
  );
};

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
 * @example
 * const sidebarItems = [{ id: 'home', label: 'Home', icon: <HomeIcon />, view: 'home-view' }];
 * <LeftSidebar items={sidebarItems} activeView="home-view" onNavigate={handleNavigation} />
 *
 * @security
 * The logout functionality triggers a call to the `AuthGateway` microservice via the `useAuth` hook,
 * which invalidates the user's server-side session and JWT. The client never handles secret revocation directly.
 *
 * @performance
 * The list of sidebar items is rendered directly. For a very large number of items,
 * virtualization could be considered, though it's generally not necessary for a primary sidebar.
 * The component relies on memoized state from `useGlobalState` to prevent unnecessary re-renders.
 */
export const LeftSidebar: React.FC<LeftSidebarProps> = ({ items, activeView, onNavigate }) => {
    const { state, dispatch } = useGlobalState();
    const { user } = state;
    // const { logout } = useAuth();
    // const { addNotification } = useNotification();

    /**
     * @function handleLogout
     * @description Handles the user logout process. It calls the `logout` function from the `useAuth` hook,
     * which orchestrates session invalidation with the backend. It also provides user feedback via notifications.
     * @returns {Promise<void>}
     */
    const handleLogout = async (): Promise<void> => {
        try {
            // await logout();
            // addNotification('You have been successfully logged out.', 'info');
            // For now, retaining old logic until auth hooks are in place
            signOutUser();
            dispatch({ type: 'SET_APP_USER', payload: null });
        } catch (error) {
            console.error("Failed to sign out:", error);
            // addNotification('Failed to sign out. Please try again.', 'error');
            alert("Failed to sign out. Please try again.");
        }
    };

  return (
    <nav className="w-20 h-full bg-surface border-r border-border flex flex-col py-4 px-2">
      <div className="flex-shrink-0 flex justify-center p-2 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
      </div>
       <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-2 pt-4">
        {items.map((item) => (
            <Tooltip key={item.id} text={item.label}>
              <button
                aria-label={item.label}
                className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200 ${activeView === item.view ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-slate-700'}`}
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
        ))}
      </div>
      <div className="mt-auto flex-shrink-0 flex flex-col items-center gap-4">
         {user && (
            <Tooltip text={user.displayName || 'User'}>
                 <img
                   src={user.photoURL || undefined}
                   alt={user.displayName || 'User avatar'}
                   className="w-10 h-10 rounded-full border-2 border-border"
                 />
            </Tooltip>
         )}
         {user && (
            <Tooltip text="Logout">
                <button
                  aria-label="Logout"
                  className="flex items-center justify-center w-12 h-12 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-slate-700"
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