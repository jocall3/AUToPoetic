/**
 * @file This file defines the LoadingSpinner component, a core atomic UI element used to indicate a loading or processing state.
 * @module components/shared/LoadingSpinner
 * @see Core UI Library architectural directive.
 * @see ThemeEngine architectural directive for styling considerations.
 */

import React from 'react';

/**
 * @typedef {'sm' | 'md' | 'lg' | 'xl'} SpinnerSize
 * @description Defines the possible size variants for the LoadingSpinner component.
 */
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * @interface LoadingSpinnerProps
 * @description Defines the properties for the LoadingSpinner component.
 * It allows customization of size, text, accessibility labels, and styling.
 */
interface LoadingSpinnerProps {
  /**
   * @property {SpinnerSize} [size='md']
   * @description The size of the spinner.
   * - 'sm': Small size, suitable for inline indicators.
   * - 'md': Medium size, the default.
   * - 'lg': Large size, for more prominent loading states.
   * - 'xl': Extra-large size, for full-page loading overlays.
   * @default 'md'
   */
  size?: SpinnerSize;

  /**
   * @property {string} [text]
   * @description Optional text to display alongside the spinner. If provided, the component will arrange the spinner and text in a flex container.
   * @example "Loading data..."
   */
  text?: string;

  /**
   * @property {string} [className]
   * @description Additional CSS classes to apply to the root container of the component.
   * Useful for custom positioning, margins, or other layout adjustments.
   */
  className?: string;

  /**
   * @property {string} [ariaLabel='Loading...']
   * @description The ARIA label for the spinner, providing accessibility for screen readers.
   * It's crucial for accessibility when the spinner is used without visible text.
   * @default 'Loading...'
   * @security Ensure this label is descriptive and not user-generated to prevent potential injection issues, though unlikely in this context.
   */
  ariaLabel?: string;
}

/**
 * @function LoadingSpinner
 * @description A core UI component that displays an animated spinner to indicate a loading state.
 * This component is designed to be themeable, accessible, and versatile, fitting various loading contexts
 * from inline indicators to full-page overlays.
 *
 * @param {LoadingSpinnerProps} props - The properties for the LoadingSpinner.
 *
 * @returns {React.ReactElement} The rendered LoadingSpinner component.
 *
 * @example
 * // A default medium-sized spinner
 * <LoadingSpinner />
 *
 * @example
 * // A small spinner with custom text
 * <LoadingSpinner size="sm" text="Saving..." />
 *
 * @example
 * // A large spinner with a custom class for centering
 * <LoadingSpinner size="lg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
 *
 * @performance
 * This is a lightweight, pure CSS animation component. Performance impact is minimal.
 * The SVG is inline, avoiding extra network requests. The `animate-spin` utility from Tailwind CSS uses a simple CSS transform,
 * which is hardware-accelerated on most modern browsers. No re-renders will occur unless props change.
 *
 * @security
 * The `ariaLabel` prop is the only one that renders text content directly from props. While the risk is extremely low,
 * it's a good practice not to pass unsanitized user-generated content to this prop. The `text` prop is rendered as a
 * standard React child, which inherently protects against XSS.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
  ariaLabel = 'Loading...',
}) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const spinner = (
    <svg
      className={`animate-spin text-primary ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-live="polite"
    >
      <title>{ariaLabel}</title>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  if (text) {
    return (
      <div className={`flex items-center justify-center gap-3 text-text-secondary ${className}`} aria-label={ariaLabel}>
        {spinner}
        <span className="text-sm font-medium">{text}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`} aria-label={ariaLabel}>
        {spinner}
    </div>
  );
};
