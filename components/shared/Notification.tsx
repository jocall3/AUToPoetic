/**
 * @file Defines the core Notification component for displaying dismissible alerts.
 * @module components/shared/Notification
 * @see contexts/NotificationContext.tsx
 * @description This component is part of the 'Core UI' library, designed to be themeable,
 * accessible, and self-contained. It replaces direct DOM manipulation within providers,
 * promoting a more modular and maintainable micro-frontend architecture.
 */

import React, { useState, useEffect, useMemo } from 'react';

// #region Icons
// Locally defined for component encapsulation, consistent with the project's icon style.

/**
 * @description Renders the success icon (check circle).
 * @returns {React.ReactElement} The SVG icon component.
 * @performance This is a static SVG, very lightweight.
 */
const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * @description Renders the error icon (x circle).
 * @returns {React.ReactElement} The SVG icon component.
 * @performance This is a static SVG, very lightweight.
 */
const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * @description Renders the info icon (information circle).
 * @returns {React.ReactElement} The SVG icon component.
 * @performance This is a static SVG, very lightweight.
 */
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * @description Renders the warning icon (exclamation triangle).
 * @returns {React.ReactElement} The SVG icon component.
 * @performance This is a static SVG, very lightweight.
 */
const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

/**
 * @description Renders the close icon (X mark).
 * @returns {React.ReactElement} The SVG icon component.
 * @performance This is a static SVG, very lightweight.
 */
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// #endregion Icons

/**
 * @typedef {'success' | 'error' | 'info' | 'warning'} NotificationType
 * @description Defines the semantic types for a notification.
 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * @interface NotificationProps
 * @description Props for the Notification component.
 */
export interface NotificationProps {
  /**
   * A unique identifier for the notification, used in the `onClose` callback.
   * @type {string | number}
   * @required
   */
  id: string | number;

  /**
   * The semantic type of the notification, determining its style and icon.
   * @type {NotificationType}
   * @default 'info'
   */
  type?: NotificationType;

  /**
   * An optional title for the notification.
   * @type {string}
   * @optional
   */
  title?: string;

  /**
   * The main message content of the notification.
   * @type {string}
   * @required
   */
  message: string;

  /**
   * A callback function invoked when the notification is requested to be closed,
   * either by user interaction or by the auto-dismiss timer.
   * @param {string | number} id - The ID of the notification to close.
   * @type {(id: string | number) => void}
   * @required
   */
  onClose: (id: string | number) => void;

  /**
   * The duration in milliseconds before the notification automatically closes.
   * If set to 0 or not provided, the notification will not auto-dismiss.
   * @type {number}
   * @default 4000
   * @optional
   */
  duration?: number;
}

/**
 * @description A themeable and accessible notification component for displaying alerts.
 * It handles its own show/hide animations and auto-dismissal logic.
 * @component
 * @param {NotificationProps} props - The props for the component.
 * @returns {React.ReactElement | null} A styled notification element or null if hidden.
 * @example
 * <Notification
 *   id="notif-1"
 *   type="success"
 *   title="Success!"
 *   message="Your action was completed successfully."
 *   onClose={(id) => console.log(`Closing notification ${id}`)}
 *   duration={5000}
 * />
 * @performance The component uses CSS transitions for animations and is lightweight.
 * It efficiently manages its own lifecycle via React hooks.
 */
export const Notification: React.FC<NotificationProps> = ({ 
  id,
  type = 'info',
  title,
  message,
  onClose,
  duration = 4000,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, id]);

  /**
   * @description Triggers the exit animation for the notification.
   */
  const handleClose = () => {
    setIsExiting(true);
  };

  /**
   * @description Called when the exit transition completes. This function invokes the
   * `onClose` prop to signal the parent that this component can be unmounted.
   */
  const handleAnimationEnd = () => {
    if (isExiting) {
      onClose(id);
    }
  };

  const iconMap: Record<NotificationType, React.ReactElement> = useMemo(() => ({
    success: <SuccessIcon />,
    error: <ErrorIcon />,
    info: <InfoIcon />,
    warning: <WarningIcon />,
  }), []);

  const icon = iconMap[type];

  const typeClasses = {
    info: 'bg-[var(--notification-info-bg)] border-[var(--notification-info-border)] text-[var(--notification-info-text)]',
    success: 'bg-[var(--notification-success-bg)] border-[var(--notification-success-border)] text-[var(--notification-success-text)]',
    error: 'bg-[var(--notification-error-bg)] border-[var(--notification-error-border)] text-[var(--notification-error-text)]',
    warning: 'bg-[var(--notification-warning-bg)] border-[var(--notification-warning-border)] text-[var(--notification-warning-text)]',
  };

  const animationClasses = isExiting
    ? 'opacity-0 translate-x-full'
    : 'opacity-100 translate-x-0';

  return (
    <div
      role="alert"
      aria-live="assertive"
      onTransitionEnd={handleAnimationEnd}
      className={`w-full max-w-sm p-4 border-l-4 rounded-md shadow-lg flex items-start gap-3 transform transition-all duration-300 ease-in-out animate-pop-in ${typeClasses[type]} ${animationClasses}`}
      style={{ boxShadow: 'var(--notification-shadow)' }}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-grow">
        {title && <h3 className="font-bold text-[var(--notification-text-title)]">{title}</h3>}
        <p className="text-sm text-[var(--notification-text-body)]">{message}</p>
      </div>
      <button
        onClick={handleClose}
        aria-label="Close notification"
        className="flex-shrink-0 p-1 -m-1 rounded-full text-current opacity-70 hover:opacity-100 hover:bg-black/10 transition-opacity"
      >
        <CloseIcon />
      </button>
    </div>
  );
};
