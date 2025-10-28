/**
 * @file AccessibilityAuditor.tsx
 * @copyright James Burvel O'Callaghan III, President Citibank Demo Business Inc.
 * @description This file contains the AccessibilityAuditor feature component, which allows users to run an
 * accessibility audit on a given URL and receive AI-powered suggestions for fixing violations.
 * It has been refactored to align with the new micro-frontend and abstracted UI framework architecture.
 * @security This component loads external websites in an iframe, which can be a security risk.
 * The `sandbox="allow-scripts allow-same-origin"` attribute is used to mitigate some risks, but it's crucial
 * to ensure this feature is not used on untrusted sites in a production environment where CSP is not restrictive.
 * @performance The accessibility audit using `axe-core` runs on the main thread because it requires direct DOM access
 * to the iframe's content. This can cause brief UI freezes on very large or complex pages.
 * Offloading to a worker is not feasible without significant complexity (e.g., DOM serialization and a virtual DOM in the worker),
 * which is outside the current architectural scope.
 */

import React, { useState, useRef, useCallback } from 'react';
import type { AxeResults, Violation } from 'axe-core';

// Core service for running the accessibility audit on the client-side.
import { runAxeAudit } from '../../services/auditing/accessibilityService';

// Core UI components from the new proprietary UI framework.
import { EyeIcon, SparklesIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from './shared';

// Contexts for application-wide services like notifications.
import { useNotification } from '../../contexts/NotificationContext';

/**
 * Simulates a call to the Backend-for-Frontend (BFF) using a GraphQL-like structure.
 * In a real implementation, this would be part of a dedicated GraphQL client.
 * @param mutation The name of the GraphQL mutation to execute.
 * @param variables The variables to pass with the mutation.
 * @returns {Promise<any>} A promise that resolves with the mutation's result.
 * @throws {Error} If the network request or the AI service fails.
 * @security All communication to the BFF should be over HTTPS and require authentication (e.g., JWT).
 */
const callBff = async (mutation: string, variables: Record<string, any>): Promise<any> => {
    // This is a placeholder for a real BFF call.
    // It simulates network delay and returns a mocked response.
    console.log(`Calling BFF mutation '${mutation}' with variables:`, variables);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (mutation === 'suggestA11yFix') {
        const issue = variables.issue as Violation;
        return {
            data: {
                suggestA11yFix: `### Suggested Fix for **${issue.id}**\n\n**Problem:** ${issue.help}\n\n**Recommendation:** To resolve this issue, you should modify the affected element(s) located by the selector: \`${issue.nodes.map(n => n.target.join(', ')).join('; ')}\`.\n\n**Example Code:**\n\`\`\`html\n<!-- An AI-generated code example would appear here. -->\n\`\`\`\nThis is a mocked AI suggestion to demonstrate the flow.`
            }
        };
    }
    throw new Error(`Unknown mutation: ${mutation}`);
};

/**
 * An augmented version of the axe-core Violation type to include state
 * for the AI fix generation process, specific to this component's UI.
 */
type AuditedViolation = Violation & {
    /** Indicates if an AI-powered fix is currently being generated for this violation. */
    isFixLoading?: boolean;
    /** The AI-generated fix content, in Markdown format. */
    aiFix?: string;
};

/**
 * The main AccessibilityAuditor component.
 * A tool for auditing web pages for accessibility issues and providing AI-driven solutions.
 * @returns {React.ReactElement} The rendered component.
 */
export const AccessibilityAuditor: React.FC = () => {
    /**
     * @state The URL of the website to be audited, controlled by the user input field.
     */
    const [url, setUrl] = useState('https://react.dev');
    /**
     * @state The URL currently loaded into the iframe. This is updated only when the audit starts.
     */
    const [auditUrl, setAuditUrl] = useState('');
    /**
     * @state Holds the results of the accessibility audit from `axe-core`, with augmented violation data.
     */
    const [results, setResults] = useState<AxeResults | null>(null);
    /**
     * @state Manages the loading state of the main audit process (iframe loading and axe scan).
     */
    const [isLoading, setIsLoading] = useState(false);
    /**
     * @ref A reference to the iframe element used to display the target website.
     */
    const iframeRef = useRef<HTMLIFrameElement>(null);
    /**
     * @hook Provides access to the application's notification system.
     */
    const { addNotification } = useNotification();

    /**
     * Initiates the accessibility audit process.
     * It sets the iframe source and transitions the component into a loading state.
     * @function
     */
    const handleAudit = useCallback(() => {
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        setAuditUrl(targetUrl);
        setIsLoading(true);
        setResults(null);
    }, [url]);

    /**
     * Callback triggered when the iframe has finished loading its content.
     * If the component is in a loading state, it proceeds to run the `axe-core` audit.
     * @function
     * @performance This function calls `runAxeAudit`, which is a CPU-intensive task that runs on the main thread.
     * See file-level JSDoc for details on this performance consideration.
     */
    const handleIframeLoad = useCallback(async () => {
        if (isLoading && iframeRef.current?.contentWindow) {
            try {
                const auditResults = await runAxeAudit(iframeRef.current.contentWindow.document);
                setResults(auditResults);
                addNotification('Audit complete!', 'success');
            } catch (error) {
                console.error(error);
                addNotification('Could not audit this page. This may be due to security restrictions (CORS).', 'error');
            } finally {
                setIsLoading(false);
            }
        }
    }, [isLoading, addNotification]);

    /**
     * Fetches an AI-powered fix for a specific accessibility violation.
     * It updates the state of the specific violation to show a loading indicator and then the result.
     * @param {Violation} issue - The specific violation object from the audit results.
     * @param {number} index - The index of the violation in the results array.
     * @function
     */
    const handleGetFix = useCallback(async (issue: Violation, index: number) => {
        setResults(prevResults => {
            if (!prevResults) return null;
            const newViolations = [...prevResults.violations];
            newViolations[index] = { ...newViolations[index], isFixLoading: true };
            return { ...prevResults, violations: newViolations };
        });

        try {
            const response = await callBff('suggestA11yFix', { issue });
            const fix = response.data.suggestA11yFix;
            setResults(prevResults => {
                if (!prevResults) return null;
                const newViolations = [...prevResults.violations];
                newViolations[index] = { ...newViolations[index], isFixLoading: false, aiFix: fix };
                return { ...prevResults, violations: newViolations };
            });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Could not get suggestion.';
            addNotification(errorMessage, 'error');
            setResults(prevResults => {
                if (!prevResults) return null;
                const newViolations = [...prevResults.violations];
                newViolations[index] = { ...newViolations[index], isFixLoading: false, aiFix: `*Error: ${errorMessage}*` };
                return { ...prevResults, violations: newViolations };
            });
        }
    }, [addNotification]);

    // Using CSS classes to represent layout components from a hypothetical UI library.
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary gap-6">
            <header>
                <h1 className="text-3xl font-bold flex items-center"><EyeIcon /><span className="ml-3">Automated Accessibility Auditor</span></h1>
                <p className="text-text-secondary mt-1">Audit a live URL for accessibility issues and get AI-powered fixes.</p>
            </header>

            <div className="flex gap-2">
                <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="flex-grow p-2 bg-surface border border-border rounded-md" />
                <button onClick={handleAudit} disabled={isLoading} className="btn-primary px-6 py-2 min-w-[100px] flex justify-center items-center">{isLoading ? <LoadingSpinner/> : 'Audit'}</button>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="bg-background border-2 border-dashed border-border rounded-lg overflow-hidden flex flex-col">
                    <div className="flex-shrink-0 p-2 border-b border-border bg-surface text-xs text-text-secondary truncate">{auditUrl || 'No URL loaded'}</div>
                    <iframe ref={iframeRef} src={auditUrl} title="Audit Target" className="w-full h-full bg-white" onLoad={handleIframeLoad} sandbox="allow-scripts allow-same-origin"/>
                </div>
                
                <div className="bg-surface p-4 border border-border rounded-lg flex flex-col">
                    <h3 className="text-lg font-bold mb-2">Audit Results</h3>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                        {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner/></div>}
                        {results && results.violations.length === 0 && !isLoading && <p className="text-center text-text-secondary py-10">No violations found!</p>}
                        {results && (results.violations as AuditedViolation[]).map((violation, i) => (
                            <div key={`${violation.id}-${violation.nodes[0]?.target?.join(',')}`} className="p-3 bg-background border border-border rounded-md">
                                <p className="font-bold text-red-500">{violation.help}</p>
                                <p className="text-sm my-1 text-text-secondary">{violation.description}</p>
                                <button onClick={() => handleGetFix(violation, i)} disabled={violation.isFixLoading} className="text-xs flex items-center gap-1 text-primary font-semibold disabled:opacity-50">
                                    {violation.isFixLoading ? <LoadingSpinner/> : <SparklesIcon/>}
                                    {violation.isFixLoading ? 'Getting fix...' : 'Ask AI for a fix'}
                                </button>
                                {violation.aiFix && 
                                    <div className="mt-2 text-xs border-t border-border pt-2">
                                        <MarkdownRenderer content={violation.aiFix}/>
                                    </div>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
