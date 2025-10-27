/**
 * @file components/features/AiPullRequestAssistant.tsx
 * @description This file contains the AiPullRequestAssistant feature component.
 * This component allows users to input a git diff, generate a structured pull request summary using AI,
 * and export a full technical specification document to their connected Google Docs account.
 * It adheres to the new architecture by offloading AI tasks to a web worker and using a GraphQL BFF for external service interactions.
 * 
 * @see {@link useAuth} for authentication state.
 * @see {@link useBffMutation} for interacting with the Backend-for-Frontend GraphQL API.
 * @see {@link useWorkerTask} for offloading computations to the web worker pool.
 * @see {@link useNotification} for displaying user feedback.
 * @security The component sends code (git diff) to a backend AI service for analysis.
 *           Users should be advised not to input sensitive or proprietary code.
 *           All external service interactions (e.g., Google Docs) are brokered by an authenticated BFF,
 *           ensuring no client-side exposure of long-lived tokens.
 * @performance AI analysis tasks, which can be computationally intensive, are delegated to a web worker.
 *              This ensures the main UI thread remains responsive during summary and spec generation.
 *              The UI shows loading states managed by the respective hooks (`useWorkerTask`, `useBffMutation`).
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';

// --- Core Architectural Hooks ---
// These hooks would be provided by a context that is connected to the DI container.
// import { useAuth } from 'src/hooks/useAuth';
// import { useBffMutation } from 'src/hooks/useBffMutation';
// import { useWorkerTask } from 'src/hooks/useWorkerTask';
// import { useNotification } from 'src/contexts/NotificationContext';
// --- Core UI Components ---
// import { VStack, Grid, Header, Text, TextArea, Button, Input, List, ListItem, Spinner, Card } from 'src/ui/core';

// MOCK: Fictional imports for demonstration as per architectural directives
const useAuth = () => ({ isAuthenticated: true });
const useBffMutation = (mutation: string) => {
  const [loading, setLoading] = useState(false);
  const mutate = async (options: { variables: any }) => {
    setLoading(true);
    console.log('BFF Mutation called:', mutation, 'with variables:', options.variables);
    await new Promise(res => setTimeout(res, 2000));
    setLoading(false);
    return { data: { exportSpecToDocs: { documentUrl: 'https://docs.google.com/document/d/example' } } };
  };
  return [mutate, { loading }];
};
const useWorkerTask = (workerName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const runTask = async <T,>(taskName: string, payload: any): Promise<T> => {
    setIsLoading(true);
    console.log(`Worker task '${taskName}' in pool '${workerName}' started with payload:`, payload);
    await new Promise(res => setTimeout(res, 2500));
    setIsLoading(false);
    return {
      title: 'feat: Enhance user enthusiasm',
      summary: 'This change introduces an enthusiasmLevel prop to the Greeter component, allowing the display of multiple exclamation points for a more energetic greeting.',
      changes: [
        'Added `enthusiasmLevel` prop with a default value of 1.',
        'Calculated the number of exclamation points based on `enthusiasmLevel`.',
        'Appended the generated punctuation to the greeting message.'
      ]
    } as T;
  };
  return { runTask, isLoading };
};
const useNotification = () => ({ addNotification: (message: string, type: string) => console.log(`Notification: [${type}] ${message}`) });
const VStack: React.FC<any> = ({ children, ...props }) => <div {...props}>{children}</div>;
const Grid: React.FC<any> = ({ children, ...props }) => <div {...props}>{children}</div>;
const Card: React.FC<any> = ({ children, ...props }) => <div {...props}>{children}</div>;
const Text: React.FC<any> = ({ children, ...props }) => <p {...props}>{children}</p>;
const Button: React.FC<any> = ({ children, ...props }) => <button {...props}>{children}</button>;
const TextArea: React.FC<any> = (props) => <textarea {...props} />;
const Input: React.FC<any> = (props) => <input {...props} />;
const List: React.FC<any> = ({ children, ...props }) => <ul {...props}>{children}</ul>;
const ListItem: React.FC<any> = ({ children, ...props }) => <li {...props}>{children}</li>;
const Spinner: React.FC<any> = () => <div>Loading...</div>;
const Header: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; className?: string }> = ({ icon, title, subtitle, className }) => (
    <header className={className}>
        <h1 className="text-3xl font-bold flex items-center">{icon}<span className="ml-3">{title}</span></h1>
        {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
    </header>
);
// --- End of Mock Imports ---

import { AiPullRequestAssistantIcon, DocumentIcon } from '../icons.tsx';
import type { StructuredPrSummary } from '../../types.ts';

const EXPORT_TO_DOCS_MUTATION = `
  mutation ExportPrSpecToDocs($diff: String!, $summary: PrSummaryInput!) {
    exportSpecToDocs(diff: $diff, summary: $summary) {
      success
      documentUrl
      message
    }
  }
`;

const exampleDiff = `--- a/src/components/Greeter.js
+++ b/src/components/Greeter.js
@@ -1,6 +1,7 @@
 function Greeter(props) {
-  return <h1>Hello, {props.name}!</h1>;
+  const { name, enthusiasmLevel = 1 } = props;
+  const punctuation = '!'.repeat(enthusiasmLevel);
+  return <h1>Hello, {name}{punctuation}</h1>;
 }`;

/**
 * @component AiPullRequestAssistant
 * @description A feature component that generates a pull request summary and technical specification from a git diff.
 * It utilizes a web worker for AI analysis to maintain UI responsiveness and a GraphQL mutation for secure external API interactions.
 * 
 * @param {object} props - The component props.
 * @param {string} [props.initialDiff] - An optional git diff string to pre-populate the component's input.
 * 
 * @returns {React.ReactElement} The rendered AiPullRequestAssistant component.
 * 
 * @example
 * // Renders the component with a pre-filled diff.
 * <AiPullRequestAssistant initialDiff="--- a/file.js\n+++ b/file.js\n@@ ..." />
 */
export const AiPullRequestAssistant: React.FC<{ initialDiff?: string }> = ({ initialDiff }) => {
    const [diff, setDiff] = useState<string>(initialDiff || exampleDiff);
    const [summary, setSummary] = useState<StructuredPrSummary | null>(null);
    const [error, setError] = useState<string>('');

    const { isAuthenticated } = useAuth();
    const { addNotification } = useNotification();
    const { runTask: runAiTask, isLoading: isGeneratingSummary } = useWorkerTask('ai-analysis');
    const [exportSpec, { loading: isExporting }] = useBffMutation(EXPORT_TO_DOCS_MUTATION);

    /**
     * @function handleGenerateSummary
     * @description Triggers the AI-powered summary generation by sending the diff to a web worker.
     * Offloads the intensive AI processing from the main thread.
     */
    const handleGenerateSummary = useCallback(async () => {
        if (!diff.trim()) {
            setError('Please provide a diff to generate a summary.');
            return;
        }
        setError('');
        setSummary(null);

        try {
            const result = await runAiTask<StructuredPrSummary>('generatePrSummary', { diff });
            setSummary(result);
            addNotification('PR summary generated successfully!', 'success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate summary: ${errorMessage}`);
            addNotification(`Error: ${errorMessage}`, 'error');
        }
    }, [diff, runAiTask, addNotification]);

    /**
     * @function handleExportToDocs
     * @description Exports the generated summary and diff as a technical specification to Google Docs.
     * This action is performed by sending a GraphQL mutation to the BFF, which then orchestrates
     * the AI spec generation and Google Docs API calls securely.
     */
    const handleExportToDocs = useCallback(async () => {
        if (!summary || !isAuthenticated) {
            addNotification('Please generate a summary first and ensure you are signed in.', 'error');
            return;
        }

        try {
            addNotification('Generating and exporting tech spec...', 'info');
            const { data } = await exportSpec({ variables: { diff, summary } });

            if (data.exportSpecToDocs.success) {
                addNotification('Successfully exported to Google Docs!', 'success');
                window.open(data.exportSpecToDocs.documentUrl, '_blank');
            } else {
                throw new Error(data.exportSpecToDocs.message || 'Export failed on the server.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            addNotification(`Failed to export: ${errorMessage}`, 'error');
        }
    }, [diff, summary, exportSpec, isAuthenticated, addNotification]);
    
    useEffect(() => {
        // If an initial diff is provided, automatically generate the summary on component mount.
        if (initialDiff) {
            handleGenerateSummary();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDiff]);

    const isLoading = isGeneratingSummary || isExporting;

    return (
        <VStack spacing={6} className="h-full p-4 sm:p-6 lg:p-8">
            <Header
                icon={<AiPullRequestAssistantIcon />}
                title="AI Pull Request Assistant"
                subtitle="Generate a PR summary from a git diff and export a full tech spec."
            />
            <Grid columns={{ base: 1, lg: 2 }} gap={6} className="flex-grow min-h-0">
                <VStack spacing={4} className="min-h-0">
                    <Text as="label" htmlFor="diff-input" className="text-sm font-medium text-text-secondary">Git Diff</Text>
                    <TextArea
                        id="diff-input"
                        value={diff}
                        onChange={(e) => setDiff(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                        placeholder={exampleDiff}
                    />
                    <Button onClick={handleGenerateSummary} isLoading={isGeneratingSummary} loadingText="Generating..." className="w-full flex items-center justify-center px-6 py-3">
                        Generate Summary
                    </Button>
                    {error && <Text color="red.500" size="sm" className="text-center">{error}</Text>}
                </VStack>

                <Card className="flex flex-col gap-4 min-h-0">
                    <Header title="Generated Summary" size="lg" as="h3" className="text-lg font-bold" />
                    <VStack spacing={4} className="flex-grow overflow-y-auto pr-2">
                        {isGeneratingSummary ? (
                            <div className="flex justify-center items-center h-full"><Spinner /></div>
                        ) : summary ? (
                            <>
                                <Input isReadOnly value={summary.title} placeholder="Generated Title" className="w-full font-bold p-2 bg-background rounded"/>
                                <TextArea isReadOnly value={summary.summary} placeholder="Generated Summary" className="w-full h-24 p-2 bg-background rounded resize-none"/>
                                <VStack spacing={2}>
                                    <Text as="h4" className="font-semibold">Changes:</Text>
                                    <List styleType="disc" pl={5} className="text-sm">
                                        {summary.changes.map((c, i) => <ListItem key={i}>{c}</ListItem>)}
                                    </List>
                                </VStack>
                            </>
                        ) : (
                            <Text className="text-text-secondary h-full flex items-center justify-center">
                                PR summary will appear here.
                            </Text>
                        )}
                    </VStack>
                     {summary && isAuthenticated && (
                        <div className="mt-auto pt-4 border-t border-border">
                            <Button onClick={handleExportToDocs} isLoading={isExporting} loadingText="Exporting..." variant="secondary" className="w-full flex items-center justify-center gap-2 py-2">
                                <DocumentIcon /> Export Tech Spec to Google Docs
                            </Button>
                        </div>
                     )}
                </Card>
            </Grid>
        </VStack>
    );
};
