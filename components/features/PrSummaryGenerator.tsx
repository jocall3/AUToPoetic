/**
 * @file PrSummaryGenerator.tsx
 * @description This file contains the PrSummaryGenerator feature component, which allows users to
 * generate a structured Pull Request summary from a git diff using AI.
 * @module components/features/PrSummaryGenerator
 * @see AiPullRequestAssistant.tsx for a related feature.
 */

import React, { useState, useCallback } from 'react';
import { generatePrSummaryStructured } from '../../services/index.ts';
import type { StructuredPrSummary } from '../../types.ts';
import { AiPullRequestAssistantIcon, ClipboardDocumentIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';

/**
 * An example git diff string to populate the textarea by default.
 * @const
 * @type {string}
 */
const exampleDiff = `diff --git a/src/components/Button.tsx b/src/components/Button.tsx
index 1b2c3d4..5e6f7g8 100644
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1,7 +1,7 @@
 import React from 'react';
 
 interface ButtonProps {
-  text: string;
+  label: string;
   onClick: () => void;
 }
`;

/**
 * A display component for a single section of the PR summary.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the section.
 * @param {React.ReactNode} props.children - The content of the section.
 * @returns {React.ReactElement} The rendered section.
 * @example
 * <SummarySection title="Changes">
 *   <ul><li>Change 1</li></ul>
 * </SummarySection>
 */
const SummarySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-text-secondary text-sm mb-2">{title}</h4>
        <div className="p-3 bg-background rounded-md border border-border text-sm">
            {children}
        </div>
    </div>
);

/**
 * The PrSummaryGenerator component.
 * Allows users to paste a git diff and receive an AI-generated title, summary, and list of changes for a pull request.
 * It provides a user-friendly interface for interacting with the AI service that generates PR summaries.
 *
 * @component
 * @param {object} props - The component props.
 * @param {string} [props.diff] - An optional initial diff string to populate the input.
 * @returns {React.ReactElement} The rendered PrSummaryGenerator feature component.
 * @security This component interacts with an external AI service. The git diff content is sent to the service.
 *           Ensure that no sensitive information is included in the diffs if the AI service is not on a trusted infrastructure.
 * @performance The AI generation is an async operation. A loading state is used to provide feedback to the user.
 *              Large diffs may take longer to process.
 */
export const PrSummaryGenerator: React.FC<{ diff?: string }> = ({ diff: initialDiff }) => {
    const [diff, setDiff] = useState<string>(initialDiff || exampleDiff);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [summary, setSummary] = useState<StructuredPrSummary | null>(null);
    const { addNotification } = useNotification();

    /**
     * @function handleGenerateSummary
     * @description An asynchronous callback function to handle the "Generate Summary" button click.
     * It validates the input, sets loading states, calls the AI service, and updates the component's state
     * with the result or an error message.
     * @returns {Promise<void>}
     * @throws Will set an error state if the AI service call fails.
     */
    const handleGenerateSummary = useCallback(async () => {
        if (!diff.trim()) {
            setError('Please provide a diff to generate a summary.');
            addNotification('Diff input is empty.', 'error');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary(null);

        try {
            const result: StructuredPrSummary = await generatePrSummaryStructured(diff);
            setSummary(result);
            addNotification('PR Summary Generated!', 'success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate summary: ${errorMessage}`);
            addNotification('Failed to generate summary.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [diff, addNotification]);

    /**
     * @function handleCopy
     * @description Copies a given text to the clipboard and shows a notification.
     * @param {string} text - The text to be copied.
     * @param {string} label - A label for the notification message (e.g., "Title", "Summary").
     */
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        addNotification(`${label} copied to clipboard!`, 'info');
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <AiPullRequestAssistantIcon />
                    <span className="ml-3">PR Summary Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Generate a pull request summary from a git diff.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left side: Input */}
                <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col flex-1 min-h-0">
                        <label htmlFor="diff-input" className="text-sm font-medium text-text-secondary mb-2">Git Diff</label>
                        <textarea
                            id="diff-input"
                            value={diff}
                            onChange={e => setDiff(e.target.value)}
                            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                            placeholder="Paste your git diff here..."
                        />
                    </div>
                    <button onClick={handleGenerateSummary} disabled={isLoading} className="btn-primary w-full flex items-center justify-center px-6 py-3">
                        {isLoading ? <LoadingSpinner /> : 'Generate Summary'}
                    </button>
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                </div>

                {/* Right side: Output */}
                <div className="flex flex-col min-h-0">
                     <label className="text-sm font-medium text-text-secondary mb-2">Generated Summary</label>
                    <div className="flex flex-col bg-surface border border-border p-4 rounded-lg flex-grow min-h-0 overflow-y-auto pr-2 space-y-4">
                        {isLoading && (
                             <div className="flex items-center justify-center h-full text-text-secondary">
                                <LoadingSpinner />
                                <span className="ml-2">Generating summary...</span>
                             </div>
                        )}
                        {!isLoading && !summary && (
                            <div className="text-text-secondary h-full flex items-center justify-center">
                                PR summary will appear here.
                            </div>
                        )}
                        {summary && (
                            <>
                                <SummarySection title="Title">
                                    <div className="group flex justify-between items-start">
                                        <p className="font-bold">{summary.title}</p>
                                        <button onClick={() => handleCopy(summary.title, 'Title')} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-opacity">
                                            <ClipboardDocumentIcon />
                                        </button>
                                    </div>
                                </SummarySection>

                                <SummarySection title="Summary">
                                    <div className="group relative">
                                        <p>{summary.summary}</p>
                                         <button onClick={() => handleCopy(summary.summary, 'Summary')} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-opacity">
                                            <ClipboardDocumentIcon />
                                        </button>
                                    </div>
                                </SummarySection>
                                
                                <SummarySection title="Changes">
                                    <div className="group relative">
                                        <ul className="list-disc list-inside space-y-1">
                                            {summary.changes.map((change, index) => (
                                                <li key={index}>{change}</li>
                                            ))}
                                        </ul>
                                         <button onClick={() => handleCopy(summary.changes.map(c => `- ${c}`).join('\n'), 'Changes')} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-opacity">
                                            <ClipboardDocumentIcon />
                                        </button>
                                    </div>
                                </SummarySection>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
