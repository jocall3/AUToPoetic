/**
 * @file Implements a core UI loading spinner component.
 * @summary This component provides a consistent, themeable, and accessible loading indicator.
 * It's designed to be used across all micro-frontends to signal ongoing processes.
 * @module CoreUI/LoadingSpinner
 */

import React from 'react';

/**
 * @interface LoadingSpinnerProps
 * @summary Props for the LoadingSpinner component.
 * @security This component is purely presentational and has no security implications.
 * @performance The component uses CSS animations which are performant.
 */
export interface LoadingSpinnerProps {
  /**
   * @property {('xs' | 'sm' | 'md' | 'lg' | 'xl')} [size='md']
   * @summary Defines the size of the spinner. `xs` can be used as a drop-in for older spinners.
   * @example <LoadingSpinner size="lg" />
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * @property {string} [label='Loading...']
   * @summary Accessible label for screen readers. Not displayed visually.
   */
  label?: string;

  /**
   * @property {string} [className]
   * @summary Optional additional CSS classes to apply to the SVG spinner element.
   */
  className?: string;
}

/**
 * @function LoadingSpinner
 * @summary A standardized, themeable loading spinner for indicating background activity.
 * @description This atomic component is part of the Core UI library. It displays an SVG-based
 * spinner that uses CSS variables for theming and supports different sizes.
 * It includes appropriate ARIA attributes for accessibility by using a visually-hidden label.
 *
 * @param {LoadingSpinnerProps} props The component props.
 * @returns {React.ReactElement} The rendered loading spinner.
 *
 * @example <caption>Basic usage with default size</caption>
 * <LoadingSpinner />
 *
 * @example <caption>A larger spinner with a custom label</caption>
 * <LoadingSpinner size="lg" label="Processing data..." />
 *
 * @see The ThemeEngine service for color variable definitions (`--color-primary`).
 * @see The Core UI library documentation for other atomic components.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className = '',
}) => {
  const sizeMap: Record<string, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const spinnerClasses = `animate-spin text-primary ${sizeMap[size]} ${className}`;

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <svg
        className={spinnerClasses}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
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
    </div>
  );
};

export default LoadingSpinner;
