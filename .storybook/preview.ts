import type { Preview, Decorator } from "@storybook/react";
import React, { useEffect } from "react";
import { MemoryRouter } from "react-router-dom";
import { GlobalStateProvider } from "../contexts/GlobalStateContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { VaultProvider } from "../components/vault/VaultProvider";
import { useTheme } from "../hooks/useTheme";
import '../index.css';

/**
 * A simple component wrapper that applies the current theme (light/dark mode)
 * to the root `<html>` element of the Storybook iframe.
 * This is necessary because the `useTheme` hook contains the side effect for this.
 */
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeState] = useTheme();

  useEffect(() => {
    const storybookRootHtml = document.documentElement;
    storybookRootHtml.classList.remove('light', 'dark');
    storybookRootHtml.classList.add(themeState.mode);
  }, [themeState.mode]);

  return <>{children}</>;
};

/**
 * A global decorator that wraps all stories in the necessary context providers.
 * This ensures that components that rely on these contexts (e.g., via `useGlobalState`,
 * `useNotification`, etc.) can render correctly in isolation within Storybook.
 */
const withProviders: Decorator = (Story) => (
  <GlobalStateProvider>
    <NotificationProvider>
      <VaultProvider>
        <MemoryRouter>
          <ThemeWrapper>
            <Story />
          </ThemeWrapper>
        </MemoryRouter>
      </VaultProvider>
    </NotificationProvider>
  </GlobalStateProvider>
);

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#F5F7FA', // From themes/light-theme.json
        },
        {
          name: 'dark',
          value: '#0f172a',  // From themes/dark-theme.json
        },
      ],
    },
    layout: 'fullscreen',
  },
  decorators: [
    withProviders,
  ],
};

export default preview;
