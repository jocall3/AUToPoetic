/**
 * @file Defines the core ThemeEngine service for dynamic, runtime theme management.
 * @module theme-engine/ThemeEngine
 * @see {Architectural Directive} Implement a Pluggable, Themeable, and Abstracted UI Framework
 */

import { ThemeDefinition, ThemeValidationError } from './types';
import { validateThemeDefinition } from './validator';

/**
 * Manages the registration, application, and dynamic switching of themes.
 * The ThemeEngine consumes structured theme definitions and injects them as CSS
 * custom properties into the DOM, allowing for runtime theme changes across the
 * entire application.
 * It is implemented as a Singleton to ensure a single source of truth for the active theme.
 *
 * @class ThemeEngine
 * @example
 * // Get the singleton instance
 * const themeEngine = ThemeEngine.getInstance();
 *
 * // Register a new theme
 * themeEngine.registerTheme('dark-mode', myDarkThemeDefinition);
 *
 * // Apply the theme
 * try {
 *   await themeEngine.applyTheme('dark-mode');
 *   console.log('Dark mode applied successfully!');
 * } catch (error) {
 *   console.error('Failed to apply theme:', error);
 * }
 *
 * // Subscribe to theme changes
 * const unsubscribe = themeEngine.subscribe((newTheme) => {
 *   console.log(`Theme changed to ${newTheme.name}`);
 * });
 *
 * // Later, to clean up
 * unsubscribe();
 */
export class ThemeEngine {
  /**
   * The singleton instance of the ThemeEngine.
   * @private
   * @static
   * @type {ThemeEngine}
   */
  private static instance: ThemeEngine;

  /**
   * A map of all registered themes, keyed by their unique name.
   * @private
   * @type {Map<string, ThemeDefinition>}
   */
  private registeredThemes: Map<string, ThemeDefinition> = new Map();

  /**
   * The currently active theme definition object.
   * @private
   * @type {(ThemeDefinition | null)}
   */
  private activeTheme: ThemeDefinition | null = null;

  /**
   * A set of listener functions to be called when the theme changes.
   * Implements the Observer pattern for theme updates.
   * @private
   * @type {Set<(theme: ThemeDefinition) => void>}
   */
  private themeChangeListeners: Set<(theme: ThemeDefinition) => void> = new Set();

  /**
   * The DOM ID for the style element that holds the theme's CSS variables.
   * @private
   * @static
   * @readonly
   */
  private static readonly STYLE_ELEMENT_ID = 'dynamic-theme-engine-styles';

  /**
   * Private constructor to enforce the Singleton pattern.
   * @private
   * @performance Initializes internal data structures. Trivial performance impact.
   */
  private constructor() {
    // The constructor is private to prevent direct instantiation.
  }

  /**
   * Retrieves the singleton instance of the ThemeEngine.
   *
   * @public
   * @static
   * @returns {ThemeEngine} The singleton instance.
   */
  public static getInstance(): ThemeEngine {
    if (!ThemeEngine.instance) {
      ThemeEngine.instance = new ThemeEngine();
    }
    return ThemeEngine.instance;
  }

  /**
   * Registers a new theme definition with the engine.
   *
   * @public
   * @param {ThemeDefinition} definition The theme definition object to register.
   * @throws {ThemeValidationError} If the theme definition is invalid or a theme with the same name already exists.
   * @example
   * const myTheme = { name: 'ocean-blue', mode: 'light', ... };
   * themeEngine.registerTheme(myTheme);
   */
  public registerTheme(definition: ThemeDefinition): void {
    const { isValid, errors } = validateThemeDefinition(definition);
    if (!isValid) {
      throw new ThemeValidationError(`Theme '${definition.name}' is invalid: ${errors.join(', ')}`);
    }

    if (this.registeredThemes.has(definition.name)) {
      throw new ThemeValidationError(`A theme with the name '${definition.name}' is already registered.`);
    }

    this.registeredThemes.set(definition.name, definition);
  }

  /**
   * Registers multiple themes at once.
   *
   * @public
   * @param {ThemeDefinition[]} themes An array of theme definition objects.
   * @throws {ThemeValidationError} If any of the theme definitions are invalid.
   */
  public registerThemes(themes: ThemeDefinition[]): void {
    themes.forEach(theme => this.registerTheme(theme));
  }

  /**
   * Applies a registered theme by its name.
   * This method finds the theme, generates CSS custom properties, injects them into the DOM,
   * updates the document's class for light/dark mode, and notifies all subscribers.
   *
   * @public
   * @param {string} name The unique name of the theme to apply.
   * @returns {Promise<void>} A promise that resolves when the theme has been successfully applied.
   * @throws {Error} If no theme with the given name is registered.
   * @performance DOM manipulation can cause a minor reflow. The impact is generally negligible on modern browsers.
   */
  public async applyTheme(name: string): Promise<void> {
    const themeToApply = this.registeredThemes.get(name);

    if (!themeToApply) {
      throw new Error(`Theme '${name}' is not registered.`);
    }

    this.activeTheme = themeToApply;
    this.applyThemeToDOM(themeToApply);
    this.updateDocumentMode(themeToApply.mode);
    this.notifyListeners();
  }

  /**
   * Retrieves the currently active theme definition.
   *
   * @public
   * @returns {(ThemeDefinition | null)} The active theme object, or null if no theme is active.
   */
  public getActiveTheme(): ThemeDefinition | null {
    return this.activeTheme;
  }

  /**
   * Retrieves the names of all themes registered with the engine.
   *
   * @public
   * @returns {string[]} An array of available theme names.
   */
  public getAvailableThemes(): string[] {
    return Array.from(this.registeredThemes.keys());
  }

  /**
   * Subscribes a listener function to be called whenever the theme changes.
   *
   * @public
   * @param {(theme: ThemeDefinition) => void} listener The callback function to execute on theme change.
   * @returns {() => void} A function to call to unsubscribe the listener.
   * @example
   * const unsubscribe = themeEngine.subscribe(newTheme => {
   *   document.body.style.transition = 'background-color 0.3s ease';
   * });
   * // later...
   * unsubscribe();
   */
  public subscribe(listener: (theme: ThemeDefinition) => void): () => void {
    this.themeChangeListeners.add(listener);
    // Return an unsubscribe function
    return () => {
      this.themeChangeListeners.delete(listener);
    };
  }

  /**
   * Generates a CSS string of custom properties from a theme definition.
   *
   * @private
   * @param {ThemeDefinition} theme The theme definition object.
   * @returns {string} A CSS string for `:root` containing all theme variables.
   */
  private generateCssVariables(theme: ThemeDefinition): string {
    const variables: string[] = [];
    
    const processObject = (obj: any, prefix: string[]) => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const newPrefix = [...prefix, key];
          if (typeof value === 'object' && value !== null) {
            processObject(value, newPrefix);
          } else {
            variables.push(`--${newPrefix.join('-')}: ${value};`);
          }
        }
      }
    };

    const { name, mode, ...tokens } = theme;
    processObject(tokens, ['theme']);

    return `:root {\n  ${variables.join('\n  ')}\n}`;
  }

  /**
   * Injects the generated CSS variables into a style tag in the document's head.
   *
   * @private
   * @param {ThemeDefinition} theme The theme to apply to the DOM.
   * @security Ensures that the injected content is CSS from a trusted theme definition, not user input.
   */
  private applyThemeToDOM(theme: ThemeDefinition): void {
    const css = this.generateCssVariables(theme);
    let styleElement = document.getElementById(ThemeEngine.STYLE_ELEMENT_ID) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = ThemeEngine.STYLE_ELEMENT_ID;
      document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = css;
  }

  /**
   * Updates the `<html>` element's class to reflect the current theme's mode ('light' or 'dark').
   *
   * @private
   * @param {('light' | 'dark')} mode The theme mode to apply.
   */
  private updateDocumentMode(mode: 'light' | 'dark'): void {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
  }

  /**
   * Notifies all subscribed listeners about the theme change.
   *
   * @private
   */
  private notifyListeners(): void {
    if (this.activeTheme) {
      this.themeChangeListeners.forEach(listener => listener(this.activeTheme!));
    }
  }
}
