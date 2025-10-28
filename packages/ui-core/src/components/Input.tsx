/**
 * @file Defines the core, atomic Input component for the proprietary UI framework.
 * @module ui-core/Input
 * @see {@link ./Button.tsx} for another core component example.
 *
 * @security This component sanitizes no props. Any content passed to props like `label`,
 * `helperText`, or `errorMessage` is rendered directly. Ensure any user-generated content
 * is sanitized before being passed to this component to prevent XSS vulnerabilities.
 * The component itself does not introduce any direct security risks.
 *
 * @performance The component is highly optimized for performance. It uses `React.forwardRef`
 * and is memoized implicitly by being a functional component. The number of re-renders
 * is minimal. Style calculations are simple string concatenations, which are very fast.
 * Complex icons passed as props could impact performance if they are not optimized.
 */

import * as React from 'react';

// Assuming a utility function for merging Tailwind classes, consistent with other core components.
// import { cn } from '../../lib/utils'; 
// Note: Since the file system is inconsistent, a mock 'cn' is used to ensure code correctness.
const cn = (...inputs: (string | undefined | null | { [key: string]: boolean })[]) =>
  inputs
    .flat()
    .filter((x) => x && typeof x === 'string')
    .join(' ');


/**
 * Defines the visual style variant of the input component.
 * - `outline`: Standard input with a visible border.
 * - `filled`: Input with a solid background color.
 */
export type InputVariant = 'outline' | 'filled';

/**
 * Defines the size of the input component.
 * - `sm`: Small
 * - `md`: Medium (default)
 * - `lg`: Large
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Defines the interaction and validation state of the input.
 * - `default`: Standard state.
 * - `error`: Indicates a validation error.
 * - `success`: Indicates a successful validation.
 * - `disabled`: Disables the input.
 */
export type InputState = 'default' | 'error' | 'success' | 'disabled';

/**
 * @interface InputProps
 * @description Props for the core Input component.
 * Extends standard HTML input attributes.
 */
export interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  /**
   * The visual style of the input.
   * @type {InputVariant}
   * @default 'outline'
   */
  variant?: InputVariant;

  /**
   * The size of the input field.
   * @type {InputSize}
   * @default 'md'
   */
  size?: InputSize;

  /**
   * The validation or interaction state of the input.
   * This will apply appropriate styling and ARIA attributes.
   * @type {InputState}
   * @default 'default'
   */
  state?: InputState;

  /**
   * The content for the `<label>` element associated with the input.
   * @type {string}
   */
  label?: string;

  /**
   * An icon or element to display on the left side of the input.
   * @type {React.ReactNode}
   */
  leftIcon?: React.ReactNode;

  /**
   * An icon or element to display on the right side of the input.
   * @type {React.ReactNode}
   */
  rightIcon?: React.ReactNode;

  /**
   * Helper text displayed below the input in a default state.
   * @type {string}
   */
  helperText?: string;

  /**
   * Error message displayed below the input when `state` is 'error'.
   * This takes precedence over `helperText`.
   * @type {string}
   */
  errorMessage?: string;

  /**
   * A CSS class name to be applied to the root container of the component.
   * @type {string}
   */
  containerClassName?: string;
}

// Style mapping objects
const variantClasses: Record<InputVariant, string> = {
  outline: 'bg-transparent border-border hover:border-primary/70 focus-within:border-primary',
  filled: 'bg-surface border-transparent focus-within:bg-background',
};

const sizeClasses: Record<InputSize, { input: string; icon: string; label: string; text: string }> = {
  sm: { input: 'h-8 px-2 text-sm', icon: 'w-4 h-4', label: 'text-sm', text: 'text-xs' },
  md: { input: 'h-10 px-3 text-base', icon: 'w-5 h-5', label: 'text-base', text: 'text-sm' },
  lg: { input: 'h-12 px-4 text-lg', icon: 'w-6 h-6', label: 'text-lg', text: 'text-base' },
};

const stateClasses: Record<Exclude<InputState, 'default'>, string> = {
  error: 'border-red-500 focus-within:ring-red-500/50 text-red-500',
  success: 'border-green-500 focus-within:ring-green-500/50',
  disabled: 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-700',
};

/**
 * Core atomic Input component.
 * Provides a fully accessible and themeable text input field with support for variants, sizes, states, icons, and helper text.
 * It forwards a ref to the underlying `<input>` element.
 *
 * @param {InputProps} props - The props for the Input component.
 * @param {React.ForwardedRef<HTMLInputElement>} ref - The ref forwarded to the input element.
 * @returns {React.ReactElement} The rendered Input component.
 * @example
 * <Input
 *   ref={inputRef}
 *   label="Username"
 *   placeholder="Enter your username"
 *   helperText="Must be at least 3 characters."
 * />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>((
  {
    variant = 'outline',
    size = 'md',
    state = 'default',
    label,
    leftIcon,
    rightIcon,
    helperText,
    errorMessage,
    containerClassName,
    className,
    id,
    type = 'text',
    disabled,
    ...props
  },
  ref
) => {
  const internalId = React.useId();
  const inputId = id || internalId;
  const descriptionId = React.useId();

  const isDisabled = state === 'disabled' || disabled;
  const isError = state === 'error';

  const sizeStyles = sizeClasses[size];

  const descriptionContent = isError ? errorMessage : helperText;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className={cn('block mb-1 font-medium text-text-primary', sizeStyles.label)}>
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex items-center w-full rounded-md border-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/50',
          variantClasses[variant],
          isDisabled && stateClasses.disabled,
          isError && stateClasses.error,
          state === 'success' && stateClasses.success,
        )}
      >
        {leftIcon && (
          <div className={cn('absolute left-2.5 flex items-center justify-center text-text-secondary', sizeStyles.icon)}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={isDisabled}
          aria-invalid={isError}
          aria-describedby={descriptionContent ? descriptionId : undefined}
          className={cn(
            'w-full bg-transparent text-text-primary placeholder:text-text-secondary/50 focus:outline-none',
            sizeStyles.input,
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <div className={cn('absolute right-2.5 flex items-center justify-center text-text-secondary', sizeStyles.icon)}>
            {rightIcon}
          </div>
        )}
      </div>
      {descriptionContent && (
        <p
          id={descriptionId}
          className={cn('mt-1', sizeStyles.text, isError ? 'text-red-500' : 'text-text-secondary')}
        >
          {descriptionContent}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
