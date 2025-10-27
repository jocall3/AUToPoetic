/**
 * @file This module provides the `useTheme` hook, a core part of the proprietary UI framework's ThemeEngine.
 * It is responsible for managing the application's visual theme, including light/dark mode switching
 * and the application of dynamic, custom color themes. The hook persists theme state to local storage.
 *
 * @module hooks/useTheme
 * @see {@link ../services/ThemeEngine.ts} (conceptual) for service-layer logic.
 * @see {@link ./useLocalStorage.ts} for the persistence mechanism.
 */

import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { ThemeState, ColorTheme, Theme } from '../types';

/**
 * The default theme state for the application when no user preference is stored.
 * Defaults to a light mode with no custom colors applied.
 * @private
 */
const defaultThemeState: ThemeState = {
    mode: 'light',
    customColors: null,
};

/**
 * Applies a set of custom colors to the root HTML element as CSS variables.
 * If the provided colors object is null, it removes the custom color variables,
 * reverting the application to its default stylesheet-defined theme.
 *
 * @private
 * @param {ColorTheme | null} colors - The color theme object containing hex values, or null to clear custom colors.
 * @performance This function directly manipulates the DOM by setting CSS properties on the root element.
 * While efficient, frequent calls could lead to minor style recalculations. It is designed to be called
 * only when the theme state changes.
 * @security No direct security risks. The function only sets CSS properties based on provided color values.
 * Input sanitization for color values should be handled before calling this function if they come from untrusted user input.
 */
const applyColors = (colors: ColorTheme | null): void => {
    const root = window.document.documentElement;
    if (colors) {
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-surface', colors.surface);
        root.style.setProperty('--color-text-primary', colors.textPrimary);
        root.style.setProperty('--color-text-secondary', colors.textSecondary);
        root.style.setProperty('--color-text-on-primary', colors.textOnPrimary);
        root.style.setProperty('--color-border', colors.border);

        // Attempt to parse the primary color for an RGB version, useful for rgba() CSS functions.
        const rgb = colors.primary.match(/\w\w/g)?.map(x => parseInt(x, 16));
        if (rgb && rgb.length === 3) {
             root.style.setProperty('--color-primary-rgb', rgb.join(', '));
        } else {
             root.style.removeProperty('--color-primary-rgb');
        }
    } else {
        // Clear all inline styles to revert to the default theme defined in CSS.
        root.style.removeProperty('--color-primary');
        root.style.removeProperty('--color-background');
        root.style.removeProperty('--color-surface');
        root.style.removeProperty('--color-text-primary');
        root.style.removeProperty('--color-text-secondary');
        root.style.removeProperty('--color-text-on-primary');
        root.style.removeProperty('--color-border');
        root.style.removeProperty('--color-primary-rgb');
    }
};

/**
 * A custom React hook for managing and applying the application's theme.
 * It provides the current theme state and functions to modify it.
 * Theme state is persisted across sessions using local storage.
 *
 * @returns {[ThemeState, () => void, (colors: ColorTheme, mode: Theme) => void, () => void]} A tuple containing:
 * - `themeState`: The current state of the theme, including `mode` ('light' or 'dark') and `customColors`.
 * - `toggleTheme`: A function to switch between 'light' and 'dark' mode.
 * - `applyCustomTheme`: A function to apply a new set of custom colors and set the theme mode.
 * - `clearCustomTheme`: A function to remove any custom colors and revert to the default theme, while preserving the current mode.
 *
 * @example
 * ```tsx
 * import { useTheme } from './hooks/useTheme';
 *
 * const ThemeSwitcher = () => {
 *   const [themeState, toggleTheme, applyCustomTheme, clearCustomTheme] = useTheme();
 *
 *   const makeOceanTheme = () => {
 *     const oceanColors = {
 *       primary: '#0077b6',
 *       background: '#caf0f8',
 *       surface: '#ade8f4',
 *       textPrimary: '#03045e',
 *       textSecondary: '#023e8a',
 *       textOnPrimary: '#ffffff',
 *       border: '#90e0ef',
 *     };
 *     applyCustomTheme(oceanColors, 'light');
 *   };
 *
 *   return (
 *     <div>
 *       <p>Current mode: {themeState.mode}</p>
 *       <button onClick={toggleTheme}>Toggle Dark/Light Mode</button>
 *       <button onClick={makeOceanTheme}>Apply Ocean Theme</button>
 *       <button onClick={clearCustomTheme} disabled={!themeState.customColors}>
 *         Revert to Default Colors
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 * @see {@link ./useLocalStorage.ts}
 */
export const useTheme = (): [ThemeState, () => void, (colors: ColorTheme, mode: Theme) => void, () => void] => {
    const [themeState, setThemeState] = useLocalStorage<ThemeState>('devcore_theme_state', defaultThemeState);

    /**
     * This effect applies the theme to the DOM whenever the theme state changes.
     * It handles adding/removing the 'dark' or 'light' class to the root element
     * and applying custom colors as CSS variables.
     */
    useEffect(() => {
        const root = window.document.documentElement;
        // Ensure only one mode class is applied.
        root.classList.remove('light', 'dark');
        root.classList.add(themeState.mode);
        
        // Apply or clear custom color variables.
        applyColors(themeState.customColors);
    }, [themeState]);

    /**
     * Toggles the theme mode between 'light' and 'dark'.
     * Preserves any applied custom colors.
     */
    const toggleTheme = (): void => {
        setThemeState(prev => ({
            ...prev,
            mode: prev.mode === 'light' ? 'dark' : 'light'
        }));
    };
    
    /**
     * Applies a new custom color theme and sets the theme mode.
     * @param {ColorTheme} colors - The new set of colors to apply.
     * @param {Theme} mode - The theme mode ('light' or 'dark') to set.
     */
    const applyCustomTheme = (colors: ColorTheme, mode: Theme): void => {
        setThemeState({ mode, customColors: colors });
    };

    /**
     * Removes any applied custom colors, reverting to the default theme colors
     * defined in the stylesheet, while preserving the current 'light' or 'dark' mode.
     */
    const clearCustomTheme = (): void => {
        setThemeState(prev => ({ ...prev, customColors: null }));
    };

    return [themeState, toggleTheme, applyCustomTheme, clearCustomTheme];
};
