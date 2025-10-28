/**
 * @file Barrel file for the Composite UI library.
 * @module ui-composite/index
 * @description
 * This file serves as the public API for the `@devcore/composite-ui` package. It exports all
 * the composite, stateful UI components and their associated types, making them available
 * for consumption by other parts of the application, such as the shell or various micro-frontends.
 *
 * Adheres to the "Implement a Pluggable, Themeable, and Abstracted UI Framework" architectural
 * directive by providing a clear entry point for complex UI patterns.
 *
 * @see ./components/WindowingSystem.tsx
 * @see ./components/DockManager.tsx
 */

export * from './components/WindowingSystem';
export * from './components/DockManager';
