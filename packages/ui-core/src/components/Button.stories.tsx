/**
 * @file Storybook stories for the core Button component.
 * @module ui-core/Button/stories
 * @description
 * This file contains the Storybook stories that document and demonstrate the usage,
 * variants, sizes, and states of the `Button` component. Each story represents a
 * specific use case or visual style, serving as a living design system and a guide
 * for developers.
 *
 * The stories cover:
 * - Default button state.
 * - All visual variants (primary, destructive, outline, secondary, ghost, link).
 * - All available sizes (small, default, large, icon).
 * - Interaction with icons (left and right).
 * - The `asChild` prop for component composition.
 * - Disabled state.
 *
 * @see {@link ./Button.tsx} for the component's implementation.
 * @see The architectural directive for "Automated Documentation and Design System Portal".
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// --- Helper Components for Stories ---

/**
 * A placeholder Mail icon for demonstration purposes within the stories.
 * In a real application, this would be imported from a centralized icon library.
 * @param {React.SVGProps<SVGSVGElement>} props - Standard SVG props.
 * @returns {React.ReactElement} The rendered SVG icon.
 */
const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

// --- Storybook Meta Configuration ---

/**
 * @typedef {import('@storybook/react').Meta<typeof Button>} Meta
 * @description The meta configuration for the Button component stories.
 * This defines the component being documented, its title in the Storybook UI,
 * default arguments, and how arguments are controlled and displayed.
 */
const meta: Meta<typeof Button> = {
  title: 'Core UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A foundational, themeable, and accessible button component that serves as a core interactive element.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button.',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as a child component, passing props to the first child.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button, preventing user interaction.',
    },
    children: {
      control: 'text',
      description: 'The content to be displayed inside the button.',
    },
    onClick: { action: 'clicked', description: 'Callback function for the click event.' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// --- Component Stories ---

/**
 * @story
 * @description The default story displays the primary button in its most common state.
 * This is the standard button used for the main call-to-action on a page.
 * @example
 * <Button>Primary Button</Button>
 */
export const Primary: Story = {
  args: {
    variant: 'default',
    size: 'default',
    children: 'Primary Button',
    disabled: false,
  },
};

/**
 * @story
 * @description The `destructive` variant is used for actions that can cause irreversible data loss, such as deleting an item. It draws the user's attention to the critical nature of the action.
 * @example
 * <Button variant="destructive">Delete Item</Button>
 */
export const Destructive: Story = {
  args: {
    ...Primary.args,
    variant: 'destructive',
    children: 'Destructive Button',
  },
};

/**
 * @story
 * @description The `outline` variant is a medium-emphasis button. It is typically used for secondary actions that are still important but should not compete with the primary action.
 * @example
 * <Button variant="outline">Secondary Action</Button>
 */
export const Outline: Story = {
  args: {
    ...Primary.args,
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * @story
 * @description The `secondary` variant is a low-emphasis button, often used for alternative, less frequent actions.
 * @example
 * <Button variant="secondary">Cancel</Button>
 */
export const Secondary: Story = {
  args: {
    ...Primary.args,
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * @story
 * @description The `ghost` variant is a very low-emphasis button, typically used for tertiary actions or within toolbars. It has a transparent background and becomes visible on hover.
 * @example
 * <Button variant="ghost">More Options</Button>
 */
export const Ghost: Story = {
  args: {
    ...Primary.args,
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * @story
 * @description The `link` variant styles the button to look like a hyperlink. It is useful for navigational actions within a sentence or for inline actions that should not have the prominence of a standard button.
 * @example
 * <Button variant="link">Read More</Button>
 */
export const Link: Story = {
  args: {
    ...Primary.args,
    variant: 'link',
    children: 'Link Button',
  },
};

/**
 * @story
 * @description Demonstrates the button with a `leftIcon`. Icons can be passed as React nodes. The button automatically handles spacing.
 * @example
 * <Button leftIcon={<MailIcon />}>Login with Email</Button>
 */
export const WithLeftIcon: Story = {
  args: {
    ...Primary.args,
    children: 'Login with Email',
    leftIcon: <MailIcon className="h-4 w-4" />,
  },
};

/**
 * @story
 * @description Demonstrates the button with a `rightIcon`.
 * @example
 * <Button rightIcon={<MailIcon />}>Get Started</Button>
 */
export const WithRightIcon: Story = {
  args: {
    ...Primary.args,
    children: 'Get Started',
    rightIcon: <MailIcon className="h-4 w-4" />,
  },
};

/**
 * @story
 * @description The `icon` size variant creates a square button, perfect for toolbars or icon-only actions. The `children` should be an icon component.
 * @example
 * <Button variant="outline" size="icon" aria-label="Send Email">
 *   <MailIcon />
 * </Button>
 */
export const IconOnly: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <MailIcon className="h-4 w-4" />,
    'aria-label': 'Icon Button',
  },
};

/**
 * @story
 * @description Demonstrates the button in its `disabled` state. A disabled button is not interactive and has reduced opacity.
 * @example
 * <Button disabled>Button is Disabled</Button>
 */
export const Disabled: Story = {
  args: {
    ...Primary.args,
    children: 'Disabled Button',
    disabled: true,
  },
};

/**
 * @story
 * @description The `asChild` prop allows the Button to pass its props and styling to its immediate child component, instead of rendering a `<button>` element. This is useful for composing the button's appearance onto other elements, like an anchor tag (`<a>`).
 * @example
 * <Button asChild variant="link">
 *   <a href="#">Login</a>
 * </Button>
 */
export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="#">I am an anchor tag</a>,
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates using the `asChild` prop to render the button as an anchor tag `<a>`. The button styles are applied to the anchor, but it retains its native `href` functionality.',
      },
    },
  },
};

/**
 * @story
 * @description This story showcases all available button sizes side-by-side for easy comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon">
        <MailIcon className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Displays all size variants: `sm`, `default`, `lg`, and `icon`.',
      },
    },
  },
};
