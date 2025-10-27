/**
 * @file packages/theme-engine/src/hooks/useTheme.ts
 * @description This file contains the primary React hook for interacting with the application's theme.
 * @copyright 2024 James Burvel O'Callaghan III, President of Citibank Demo Business Inc.
 * @license Apache-2.0
 */

import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import type { ThemeContextType } from '../types';

/**
 * @module useTheme
 * @description A custom React hook for accessing the theme context provided by the `ThemeProvider`.
 * This hook is the primary consumer-facing API for interacting with the `ThemeEngine`,
 * providing access to the current theme state and functions to manipulate it.
 *
 * @security This hook itself does not handle sensitive data. However, theme definitions consumed
 * by the underlying `ThemeEngine` service could be fetched from external sources. The `ThemeEngine`
 * is responsible for validating and sanitizing any theme data before it is applied to the
 * application's DOM to prevent Cross-Site Scripting (XSS) vulnerabilities (e.g., through
 * maliciously crafted color values or font URLs injected into CSS variables).
 *
 * @performance This hook is highly performant. It relies on React's `useContext`, which will only
 * trigger a re-render in consuming components when the context value itself changes. The `ThemeProvider`
 * is optimized to prevent unnecessary re-renders by memoizing its context value.
 *
 * @example
 * ```tsx
 * import { useTheme } from '@devcore/theme-engine';
 *
 * const ThemeSwitcher = () => {
 *   const { activeTheme, isDarkMode, setTheme, toggleThemeMode, availableThemes } = useTheme();
 *
 *   return (
 *     <div>
 *       <h1>Current Theme: {activeTheme.name}</h1>
 *       <p>Mode: {isDarkMode ? 'Dark' : 'Light'}</p>
 *       <button onClick={toggleThemeMode}>Toggle Mode</button>
 *       <select value={activeTheme.id} onChange={(e) => setTheme(e.target.value)}>
 *         {availableThemes.map(theme => (
 *           <option key={theme.id} value={theme.id}>{theme.name}</option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * };
 * ```
 *
 * @returns {ThemeContextType} The theme context value, which is an object containing:
 * - `activeTheme` {ThemeDefinition}: The currently active theme definition object.
 * - `availableThemes` {ThemeDefinition[]}: A list of all available theme definitions.
 * - `isDarkMode` {boolean}: A boolean flag indicating if the current theme mode is 'dark'.
 * - `setTheme` {(themeId: string) => void}: A function to set the active theme by its unique ID. Persists the choice.
 * - `toggleThemeMode` {() => void}: A function to toggle the theme mode between 'light' and 'dark'. Persists the choice.
 * - `applyPreviewTheme` {(theme: ThemeDefinition) => void}: Applies a temporary theme for previewing, without persisting the change. Used by tools like `ThemeDesigner`.
 * - `clearPreviewTheme` {() => void}: Reverts any preview theme and restores the last persisted active theme.
 * @throws {Error} If the hook is used outside of a `ThemeProvider`.
 *
 * @see {@link ThemeProvider} for the provider component that supplies this context.
 * @see {@link ThemeContextType} for the detailed structure of the returned value.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider. Ensure your component tree is wrapped in <ThemeProvider>.');
  }

  return context;
};
