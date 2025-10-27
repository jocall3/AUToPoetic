/**
 * @file contexts/NotificationContext.tsx
 * @description Provides a context for managing and displaying application-wide notifications (toasts).
 * @module contexts/NotificationContext
 * @see {@link Toast} for the component used to render notifications.
 * @performance The provider uses `useCallback` for its context value to prevent unnecessary re-renders in consumers.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * @typedef {'success' | 'error' | 'info'} NotificationVariant
 * @description The type of notification, determining its visual style and icon.
 * @enum {string}
 */
export type NotificationVariant = 'success' | 'error' | 'info';

/**
 * @interface Notification
 * @description Represents a single notification object within the system.
 * @property {number} id - A unique identifier for the notification.
 * @property {string} message - The content of the notification message.
 * @property {NotificationVariant} variant - The variant of the notification.
 */
export interface Notification {
  id: number;
  message: string;
  variant: NotificationVariant;
}

/**
 * @interface NotificationContextType
 * @description Defines the shape of the context provided by NotificationProvider.
 * @property {(message: string, variant?: NotificationVariant) => void} addNotification - Function to add a new notification to the display queue.
 */
export interface NotificationContextType {
  /**
   * @function addNotification
   * @description Adds a new notification to be displayed to the user.
   * @param {string} message - The message content for the notification.
   * @param {NotificationVariant} [variant='info'] - The visual variant of the notification.
   * @returns {void}
   * @example
   * const { addNotification } = useNotification();
   * addNotification('Profile updated successfully!', 'success');
   * @performance This function is memoized with `useCallback` to prevent unnecessary re-renders in consumer components.
   */
  addNotification: (message: string, variant?: NotificationVariant) => void;
}

/**
 * @const {React.Context<NotificationContextType | undefined>} NotificationContext
 * @description The React context for the notification system.
 * @private
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * @function useNotification
 * @description Custom hook to easily access the NotificationContext.
 * @returns {NotificationContextType} The notification context, containing the `addNotification` function.
 * @throws {Error} If used outside of a `NotificationProvider`.
 * @example
 * const { addNotification } = useNotification();
 * // later in a component...
 * <button onClick={() => addNotification('Hello!', 'info')}>Show Notification</button>
 */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

/**
 * @interface NotificationProviderProps
 * @description Props for the NotificationProvider component.
 * @property {ReactNode} children - The child components that will have access to this context.
 */
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * @interface ToastProps
 * @description Props for the Toast component.
 * @private
 */
interface ToastProps {
  message: string;
  variant: NotificationVariant;
  onDismiss: () => void;
}

/**
 * @const {React.FC<ToastProps>} Toast
 * @description A placeholder for a Toast component from the new 'Composite UI' library.
 * It is designed to be themeable and abstract, receiving its styling from the ThemeEngine.
 * @private
 */
const Toast: React.FC<ToastProps> = ({ message, variant, onDismiss }) => {
    // In a real implementation, these styles would come from a theme engine
    // or be part of the component's encapsulated styles from the UI library.
    const variantStyles = {
        success: 'bg-green-500 border-green-600 text-white',
        error: 'bg-red-500 border-red-600 text-white',
        info: 'bg-blue-500 border-blue-600 text-white',
    };

    return (
        <div 
            role="alert" 
            className={`relative animate-pop-in shadow-lg rounded-lg font-medium p-4 border-b-4 flex justify-between items-center ${variantStyles[variant]}`}
        >
            <span>{message}</span>
            <button onClick={onDismiss} aria-label="Dismiss" className="ml-4 -mr-2 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};

/**
 * @class NotificationProvider
 * @description Provides the notification context to its children and renders the notification toasts.
 * Manages the state of active notifications, including adding and automatically removing them.
 * @param {NotificationProviderProps} props - The props for the component.
 * @example
 * // In App.tsx or a similar top-level component
 * <NotificationProvider>
 *   <MyApp />
 * </NotificationProvider>
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, variant: NotificationVariant = 'info') => {
    const id = Date.now() + Math.random(); // Add random to prevent collision with rapid calls
    setNotifications(prev => [...prev, { id, message, variant }]);
    
    // Auto-dismiss after a delay
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div 
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-[9999] space-y-3 w-full max-w-sm pointer-events-none"
      >
        {notifications.map(notification => (
           <div key={notification.id} className="pointer-events-auto">
             {/* This Toast component would be imported from the new UI framework library */}
             <Toast
               message={notification.message}
               variant={notification.variant}
               onDismiss={() => removeNotification(notification.id)}
             />
           </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
