/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @module accessibilityService
 * @description Provides services for running accessibility audits on DOM elements.
 * This service leverages the axe-core library to perform automated accessibility testing.
 */

import axe from 'axe-core';
import type { AxeResults, ElementContext, RunOptions } from 'axe-core';
import { logError, logEvent, measurePerformance } from '../telemetryService.ts';

// Re-exporting core types for consumers of this service.
export type AxeResult = AxeResults;

/**
 * @class AccessibilityService
 * @description A service class responsible for conducting accessibility audits using axe-core.
 * It encapsulates the configuration and execution of axe, providing a standardized
 * interface for accessibility testing across the application.
 *
 * @example
 * // In a React component (assuming Dependency Injection provides the 'auditor' instance):
 * const MyComponent = ({ auditor }: { auditor: AccessibilityService }) => {
 *   const myRef = React.useRef(null);
 *
 *   const handleAudit = async () => {
 *     if (myRef.current) {
 *       try {
 *         const results = await auditor.runAudit(myRef.current);
 *         console.log('Accessibility violations:', results.violations);
 *       } catch (error) {
 *         console.error('Audit failed:', error);
 *       }
 *     }
 *   };
 *
 *   return <div ref={myRef}><button onClick={handleAudit}>Audit Me</button></div>;
 * }
 */
export class AccessibilityService {
  /**
   * @constructor
   * @description Configures the axe-core engine upon instantiation.
   * This setup is applied globally to all subsequent axe runs initiated by this service.
   * Rules can be enabled/disabled here to tailor audits to the application's specific needs.
   */
  constructor() {
    logEvent('AccessibilityService.constructor', { detail: 'Configuring axe-core engine.' });
    // Configure axe-core to be less noisy in the console and disable rules
    // that are common false positives in single-page applications or component libraries.
    axe.configure({
      reporter: 'v2',
      rules: [
        // 'region' is often flagged in isolated components that aren't part of a full page landmark structure.
        { id: 'region', enabled: false }
      ]
    });
  }

  /**
   * @method runAudit
   * @description Executes an axe accessibility audit on a given DOM context.
   *
   * @param {ElementContext} context The DOM element or selector string to run the audit against.
   * This can be a document, a specific element, or a CSS selector.
   * @param {RunOptions} [options] Optional axe-core run options to customize this specific audit.
   * For example, to only check for specific rules or standards.
   *
   * @returns {Promise<AxeResult>} A promise that resolves with the accessibility audit results.
   * The result object contains arrays of violations, passes, incomplete, and inapplicable checks.
   *
   * @throws {Error} Throws an error if the axe-core engine fails to execute the audit,
   * which could happen if the context is invalid or an internal error occurs within axe.
   *
   * @performance
   * This is a computationally intensive operation that runs on the main thread.
   * It directly interacts with the live DOM to analyze rendered elements, computed styles, and more.
   * Due to this direct DOM dependency, it cannot be offloaded to a Web Worker, as DOM nodes
   * cannot be serialized and transferred. Running this on large or complex DOM trees
   * may cause temporary UI unresponsiveness. It is best used in development or controlled
   * testing environments, rather than being triggered frequently in production.
   *
   * @security
   * This function interacts directly with the DOM. When auditing untrusted content (e.g., in an iframe),
   * ensure the iframe has appropriate sandboxing attributes to prevent potential security risks.
   * The service itself does not introduce new vulnerabilities but operates on the provided DOM context.
   *
   * @example
   * // Auditing the entire document
   * const pageResults = await auditor.runAudit(document);
   *
   * // Auditing a specific component by its element reference
   * const componentElement = document.getElementById('my-component');
   * const componentResults = await auditor.runAudit(componentElement);
   *
   * // Auditing with specific options (e.g., only WCAG 2.1 AA)
   * const wcagResults = await auditor.runAudit(document, { runOnly: { type: 'tag', values: ['wcag21aa'] } });
   *
   * @see {@link https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#axerun-context-options-callback | axe.run API documentation}
   */
  public async runAudit(context: ElementContext, options?: RunOptions): Promise<AxeResult> {
    return measurePerformance('AccessibilityService.runAudit', async () => {
      const contextIdentifier = context instanceof Node ? context.nodeName : context.toString();
      logEvent('AccessibilityService.runAudit.start', { context: contextIdentifier });
      try {
        const defaultOptions: RunOptions = {
          resultTypes: ['violations', 'incomplete']
        };
        const finalOptions = { ...defaultOptions, ...options };

        const results = await axe.run(context, finalOptions);
        
        logEvent('AccessibilityService.runAudit.success', { 
            violations: results.violations.length, 
            incomplete: results.incomplete.length 
        });
        return results;
      } catch (error) {
        logError(error as Error, { 
            context: 'AccessibilityService.runAudit',
            detail: 'Axe audit failed to execute.'
        });
        throw new Error('Accessibility audit failed to execute.');
      }
    });
  }
}

// For non-DI environments or simple usage, a default instance can be provided.
// In a DI-managed architecture, the class itself would be exported and injected.
const accessibilityService = new AccessibilityService();

/**
 * @function runAxeAudit
 * @description A standalone function that uses a default instance of the AccessibilityService
 * to run an axe accessibility audit. This provides a simple, functional interface for one-off audits.
 *
 * @param {ElementContext} context The DOM element or selector string to run the audit on.
 * @returns {Promise<AxeResult>} A promise that resolves with the axe audit results.
 * @see AccessibilityService.runAudit
 * @deprecated Prefer instantiating or injecting `AccessibilityService` for better testability and lifecycle management.
 * This function is maintained for backward compatibility.
 */
export const runAxeAudit = (context: ElementContext): Promise<AxeResult> => {
  return accessibilityService.runAudit(context);
};
