/**
 * @file This module defines the main application StatusBar and its constituent parts.
 * It has been refactored to align with the new abstracted UI framework directive,
 * breaking down the status bar into composable sections and items.
 * Comprehensive JSDoc has been added to all components, types, and functions
 * in accordance with architectural mandates.
 * @author Elite AI Implementation Team
 * @see App.tsx where this component is used.
 * @copyright James Burvel O'Callaghan III, President Citibank Demo Business Inc.
 */

import React, { useState, useEffect, type FC, type ReactNode } from 'react';
import { GitBranchIcon, BellIcon } from './icons.tsx';

/**
 * @typedef {'loading' | 'loaded' | 'error'} BgImageStatus
 * @description Represents the loading status of a background resource, used to display contextual messages in the status bar.
 * @security This type is for display logic only and has no direct security implications.
 * @performance This type drives re-renders of status messages. Changes should be batched if they occur frequently.
 */
export type BgImageStatus = 'loading' | 'loaded' | 'error';

/**
 * @component StatusMessage
 * @description Displays a message based on a given loading status. It shows a loading indicator, 
 * an error message that auto-hides, or nothing for a 'loaded' status.
 * This component is an internal part of the StatusBar.
 * 
 * @param {object} props - The component props.
 * @param {BgImageStatus} props.status - The current loading status.
 * @returns {React.ReactElement | null} The rendered status message component or null if not needed.
 * 
 * @example
 * <StatusMessage status="loading" />
 * 
 * @see StatusBar
 * @performance Manages its own visibility state with a `setTimeout` for error messages.
 * The impact is minimal but involves state changes that cause re-renders.
 */
const StatusMessage: FC<{ status: BgImageStatus }> = ({ status }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);
        if (status === 'error') {
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    if (!visible || status === 'loaded') {
        return null;
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span>Generating background...</span>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex items-center space-x-2 text-yellow-600">
                <span>Background failed. Using fallback.</span>
            </div>
        );
    }

    return null;
};

/**
 * @component Clock
 * @description A component that displays the current local time, updating every second.
 * This is an internal component for the StatusBar.
 * 
 * @returns {React.ReactElement} The rendered clock component.
 * 
 * @example
 * <Clock />
 * 
 * @see StatusBar
 * @performance Uses `setInterval` which triggers a re-render every second. While the performance
 * impact is minimal, this is a constant source of updates and should be used judiciously.
 */
const Clock: FC = () => {
    const [time, setTime] = useState(() => new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    return <span>{time.toLocaleTimeString()}</span>;
};

/**
 * @interface StatusBarItemProps
 * @description Props for the StatusBarItem component.
 */
interface StatusBarItemProps {
    /** Optional icon to display next to the label. */
    icon?: ReactNode;
    /** Optional text label to display. */
    label?: string;
    /** Optional click handler to make the item interactive. */
    onClick?: () => void;
    /** Additional CSS classes for styling, such as responsive visibility. */
    className?: string;
    /** Tooltip text to show on hover. */
    title?: string;
}

/**
 * @component StatusBarItem
 * @description A generic, reusable item for placement within the StatusBar. It can consist of an icon, a label, or both, and can be made interactive.
 * 
 * @param {StatusBarItemProps} props - The component props.
 * @returns {React.ReactElement} The rendered status bar item.
 * 
 * @example
 * <StatusBarItem icon={<GitBranchIcon />} label="main" onClick={() => console.log('Branch clicked!')} />
 * 
 * @security As a presentational component, it has no direct security risks. However, the `onClick` handler should not execute untrusted code.
 */
const StatusBarItem: FC<StatusBarItemProps> = ({ icon, label, onClick, className, title }) => (
    <div
        onClick={onClick}
        className={`flex items-center space-x-1 transition-colors ${onClick ? 'cursor-pointer hover:text-primary' : ''} ${className || ''}`}
        title={title || label}
    >
        {icon && <span className="flex items-center">{icon}</span>}
        {label && <span>{label}</span>}
    </div>
);

/**
 * @interface StatusBarSectionProps
 * @description Props for the StatusBarSection component.
 */
interface StatusBarSectionProps {
    /** The child elements to render within the section. Typically a set of StatusBarItem components. */
    children: ReactNode;
    /** The horizontal alignment of the items within the section. */
    align?: 'left' | 'right';
}

/**
 * @component StatusBarSection
 * @description A container for grouping `StatusBarItem` components, aligning them to the left or right within the main `StatusBar`.
 * 
 * @param {StatusBarSectionProps} props - The component props.
 * @returns {React.ReactElement} The rendered status bar section container.
 * 
 * @example
 * <StatusBarSection align="left">
 *   <StatusBarItem label="Ready" />
 * </StatusBarSection>
 */
const StatusBarSection: FC<StatusBarSectionProps> = ({ children, align = 'left' }) => {
    const alignmentClass = align === 'right' ? 'justify-end' : 'justify-start';
    return (
        <div className={`flex items-center space-x-4 ${alignmentClass}`}>
            {children}
        </div>
    );
};

/**
 * @component StatusBar
 * @description The main status bar for the application, displayed at the bottom of the viewport. It provides at-a-glance information 
 * about application state, such as git branch, system messages, and other contextual data.
 * It is composed of sections and items for a structured and extensible layout.
 * 
 * @param {object} props - The component props.
 * @param {BgImageStatus} props.bgImageStatus - The loading status of the main background image, used to display relevant status messages.
 * @returns {React.ReactElement} The rendered status bar component.
 * 
 * @example
 * <StatusBar bgImageStatus="loading" />
 * 
 * @security Displays application state but does not handle sensitive data directly. Care should be taken that information displayed here is not sensitive.
 * @performance This is a persistent component. Its internal components like `Clock` re-render frequently (every second), but this is optimized by React.
 */
export const StatusBar: FC<{ bgImageStatus: BgImageStatus }> = ({ bgImageStatus }) => {
  return (
    <footer className="w-full bg-surface/70 backdrop-blur-sm border-t border-border px-4 py-1 flex items-center justify-between text-xs text-text-secondary">
      <StatusBarSection align="left">
        <StatusBarItem icon={<GitBranchIcon />} label="main" onClick={() => {}} title="Current Git Branch" />
        <StatusMessage status={bgImageStatus} />
      </StatusBarSection>
      <StatusBarSection align="right">
        <Clock />
        <StatusBarItem label="Ready" className="hidden sm:block" />
        <StatusBarItem icon={<BellIcon />} label="0" onClick={() => {}} title="Notifications" />
        <StatusBarItem label="Powered by Gemini" className="hidden sm:block" />
      </StatusBarSection>
    </footer>
  );
};