/**
 * @file Storybook stories for the core Input component.
 * @module ui-core/Input/stories
 *
 * @description
 * This file documents the various states and props of the Input component,
 * adhering to the architectural directive to create a living design system using Storybook.
 * Each story represents a specific use case or visual variant of the component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Input } from './Input';

// Mock icons for story demonstration purposes. In the actual application,
// these would be imported from a centralized icon library.
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;

/**
 * The `meta` object configures the Storybook UI for the Input component.
 * It defines the component's title in the sidebar, the component being documented,
 * and provides controls (`argTypes`) for interacting with its props in the Storybook canvas.
 */
const meta: Meta<typeof Input> = {
  title: 'Core UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'default',
      values: [
        { name: 'default', value: '#F5F7FA' }, // light theme background
        { name: 'dark', value: '#0f172a' }, // dark theme background
      ],
    },
    docs: {
        description: {
            component: 'The core Input component is a foundational element for all text-based form inputs. It is fully themeable, accessible, and supports various states, sizes, and icon placements.'
        }
    }
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['outline', 'filled'],
      description: 'The visual style of the input.',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the input.',
    },
    state: {
      control: 'radio',
      options: ['default', 'error', 'success', 'disabled'],
      description: 'The validation or interaction state.',
    },
    label: {
      control: 'text',
      description: 'The label displayed above the input.',
    },
    placeholder: {
      control: 'text',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below the input.',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message displayed below the input when state is "error".',
    },
    disabled: {
      control: 'boolean',
    },
    leftIcon: {
      control: 'boolean',
      mapping: {
        true: <UserIcon />,
        false: undefined,
      },
      description: 'Toggle a mock user icon on the left.',
    },
    rightIcon: {
      control: 'boolean',
      mapping: {
        true: <InfoIcon />,
        false: undefined,
      },
      description: 'Toggle a mock info icon on the right.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default state of the Input component.
 * This is the most basic representation, with only a placeholder text.
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter your name...',
  },
};

/**
 * An Input component with an associated `label`. The label is programmatically
 * linked to the input field for enhanced accessibility.
 */
export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

/**
 * This story demonstrates the different sizes available for the Input component: `sm`, `md`, and `lg`.
 * The layout is managed here to show all variants at once.
 */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input {...args} size="sm" placeholder="Small input" />
      <Input {...args} size="md" placeholder="Medium input (default)" />
      <Input {...args} size="lg" placeholder="Large input" />
    </div>
  ),
  args: {
    label: 'Your Name'
  }
};

/**
 * This story shows the different visual variants of the Input: `outline` (default) and `filled`.
 */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input {...args} variant="outline" placeholder="Outline variant (default)" />
      <Input {...args} variant="filled" placeholder="Filled variant" />
    </div>
  ),
  args: {
    label: 'Search'
  }
};

/**
 * An Input component can include `helperText` to provide additional context or instructions to the user.
 */
export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    helperText: 'Your password must be at least 8 characters long.',
  },
};

/**
 * The `error` state is used to indicate a validation failure. The `errorMessage` prop
 * takes precedence over `helperText` and is styled to draw the user's attention.
 */
export const ErrorState: Story = {
  args: {
    label: 'Confirm Password',
    type: 'password',
    placeholder: '••••••••',
    state: 'error',
    errorMessage: 'Passwords do not match.',
    helperText: 'This helper text will not be shown.',
  },
};

/**
 * The `success` state provides positive visual feedback, typically after successful
 * inline validation of the input's value.
 */
export const SuccessState: Story = {
    args: {
      label: 'Username',
      placeholder: 'jester-dev',
      defaultValue: 'autopoetic-ai',
      state: 'success',
      helperText: 'Username is available!',
    },
  };

/**
 * The `disabled` state prevents any user interaction with the input field.
 * This can be set via the `disabled` prop or by setting `state` to `disabled`.
 */
export const Disabled: Story = {
  args: {
    label: 'API Key',
    placeholder: 'Disabled input',
    value: 'pre-filled-and-disabled',
    state: 'disabled',
  },
};

/**
 * An Input component with an icon placed on the left side.
 * This is useful for inputs like usernames or search fields to provide visual context.
 */
export const WithLeftIcon: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    leftIcon: <UserIcon />,
  },
};

/**
 * An Input component with an icon placed on the right side.
 * This is often used for informational icons, password visibility toggles, or clear buttons.
 */
export const WithRightIcon: Story = {
  args: {
    label: 'Website',
    placeholder: 'https://example.com',
    rightIcon: <InfoIcon />,
    helperText: 'Enter the full URL of your website.'
  },
};

/**
 * An Input component demonstrating a more complex composition with icons on both sides.
 */
export const WithBothIcons: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    leftIcon: <UserIcon />,
    rightIcon: <InfoIcon />,
  },
};
