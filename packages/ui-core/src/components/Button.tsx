/**
 * @file Contains the core, atomic Button component for the new UI framework.
 * @module ui-core/Button
 *
 * @description
 * This module exports a versatile, themeable, and fully accessible Button component.
 * It serves as a foundational building block for all interactive elements in the application,
 * replacing raw `<button>` elements to ensure consistency, accessibility, and adherence to the design system.
 *
 * The Button is designed using a Class-Variance-Authority (CVA) pattern, allowing for easy composition
 * of visual variants (e.g., `primary`, `secondary`) and sizes (e.g., `sm`, `md`, `lg`).
 * It supports `asChild` prop for component composition, allowing its styles and properties
 * to be passed to a child element, enhancing its flexibility.
 *
 * Comprehensive JSDoc is provided for all props and functionalities to facilitate ease of use and maintainability.
 *
 * @see The architectural directive for a 'Pluggable, Themeable, and Abstracted UI Framework'.
 * @see {@link https://cva.style/docs|CVA documentation}
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils'; // Assumes a utility function for merging Tailwind classes

/**
 * Defines the visual variants for the Button component using `class-variance-authority`.
 * This approach centralizes styling logic and makes the component themeable through CSS variables.
 * The class strings (e.g., `bg-primary`, `text-primary-foreground`) are expected to be mapped
 * to CSS custom properties defined by the `ThemeEngine`.
 *
 * @property {object} variants - Defines the styles for different button variants and sizes.
 * @property {object} defaultVariants - Sets the default style if no variant or size is specified.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * @interface ButtonProps
 * @description Props interface for the Button component.
 * Extends standard HTML button attributes and adds custom variants via `VariantProps`.
 *
 * @param {('default'|'destructive'|'outline'|'secondary'|'ghost'|'link'|null|undefined)} [variant] - The visual style of the button.
 * @param {('default'|'sm'|'lg'|'icon'|null|undefined)} [size] - The size of the button.
 * @param {boolean} [asChild=false] - If true, the button will not render its own DOM element, but will instead merge its props and behavior onto its immediate child component. This is useful for component composition.
 * @param {React.ReactNode} [leftIcon] - An optional icon to be displayed to the left of the button's children.
 * @param {React.ReactNode} [rightIcon] - An optional icon to be displayed to the right of the button's children.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * A foundational, themeable, and accessible button component.
 *
 * @component
 * @param {ButtonProps} props - The props for the Button component.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the underlying button element.
 * @returns {React.ReactElement} The rendered button element.
 *
 * @example
 * // Basic usage
 * <Button onClick={() => alert('Clicked!')}>Click Me</Button>
 *
 * @example
 * // Different variants and sizes
 * <Button variant="destructive" size="lg">Delete</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 *
 * @example
 * // With icons
 * <Button leftIcon={<Icon />}>Save Changes</Button>
 *
 * @example
 * // Composing with another component using `asChild`
 * <Button asChild variant="link">
 *   <a href="/login">Login</a>
 * </Button>
 *
 * @see {@link buttonVariants} for all available visual styles.
 *
 * @security
 * - When `asChild` is used, ensure the child component correctly forwards props and refs.
 * - Sanitize any user-generated content passed as `children` to prevent XSS vulnerabilities.
 * - `onClick` handlers should be designed to handle events securely and avoid exposing sensitive operations without proper authorization checks.
 *
 * @performance
 * - This component is highly optimized for performance. It uses `React.forwardRef` and memoization is left to the consumer where necessary.
 * - Rendering complex React nodes as `leftIcon` or `rightIcon` props will be slightly more expensive than simple text children. For performance-critical scenarios with thousands of buttons, consider optimizing the icon components.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {leftIcon && <span className="mr-2 -ml-1 h-5 w-5">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2 -mr-1 h-5 w-5">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
