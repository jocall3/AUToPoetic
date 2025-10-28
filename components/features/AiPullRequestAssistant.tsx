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

// --- Core Architectural Hooks & Services (Conceptual Imports) ---
import { useAuth } from '@/hooks/useAuth';
import { useBffMutation } from '@/hooks/useBffMutation';
import { useWorkerTask } from '@/hooks/useWorkerTask';
import { useNotification } from '@/contexts/NotificationContext';

// --- Core & Composite UI Components (Conceptual Imports) ---
import { Page } from '@/ui/layout/Page';
import { Grid } from '@/ui/layout/Grid';
import { Flex } from '@/ui/layout/Flex';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/ui/core/Card';
import { Button } from '@/ui/core/Button';
import { TextArea } from '@/ui/core/TextArea';
import { Input } from '@/ui/core/Input';
import { List, ListItem } from '@/ui/core/List';
import { Spinner } from '@/ui/core/Spinner';
import { Alert } from '@/ui/core/Alert';
import { Text } from '@/ui/core/Text';
import { AiPullRequestAssistantIcon, DocumentIcon } from '../icons';

// --- Type Definitions ---
import type { StructuredPrSummary } from '../../types';

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
 * @interface AiPullRequestAssistantProps
 * @description Props for the AiPullRequestAssistant component.
 * @property {string} [initialDiff] - An optional git diff string to pre-populate the component's input.
 */
interface AiPullRequestAssistantProps {
  initialDiff?: string;
}

/**
 * @component AiPullRequestAssistant
 * @description A feature component that generates a pull request summary and technical specification from a git diff.
 * It utilizes a web worker for AI analysis to maintain UI responsiveness and a GraphQL mutation for secure external API interactions.
 * 
 * @param {AiPullRequestAssistantProps} props - The component props.
 * @returns {React.ReactElement} The rendered AiPullRequestAssistant component.
 * 
 * @example
 * // Renders the component with a pre-filled diff.
 * <AiPullRequestAssistant initialDiff="--- a/file.js\n+++ b/file.js\n@@ ..." />
 */
export const AiPullRequestAssistant: React.FC<AiPullRequestAssistantProps> = ({ initialDiff }) => {
    const [diff, setDiff] = useState<string>(initialDiff || exampleDiff);
    const [summary, setSummary] = useState<StructuredPrSummary | null>(null);
    const [error, setError] = useState<string>('');

    const { isAuthenticated } = useAuth();
    const { addNotification } = useNotification();
    const { runTask: runAiTask, isLoading: isGeneratingSummary } = useWorkerTask('ai-analysis');
    const [exportSpec, { loading: isExporting }] = useBffMutation(EXPORT_TO_DOCS_MUTATION);

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

    const handleExportToDocs = useCallback(async () => {
        if (!summary || !isAuthenticated) {
            addNotification('Please generate a summary first and ensure you are signed in.', 'error');
            return;
        }

        try {
            addNotification('Generating and exporting tech spec...', 'info');
            const { data } = await exportSpec({ variables: { diff, summary } });

            if (data?.exportSpecToDocs?.success) {
                addNotification('Successfully exported to Google Docs!', 'success');
                window.open(data.exportSpecToDocs.documentUrl, '_blank');
            } else {
                throw new Error(data?.exportSpecToDocs?.message || 'Export failed on the server.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            addNotification(`Failed to export: ${errorMessage}`, 'error');
        }
    }, [diff, summary, exportSpec, isAuthenticated, addNotification]);
    
    useEffect(() => {
        if (initialDiff) {
            handleGenerateSummary();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDiff]);

    const isLoading = isGeneratingSummary || isExporting;

    return (
        <Page>
            <Page.Header 
                icon={<AiPullRequestAssistantIcon />}
                title="AI Pull Request Assistant"
                subtitle="Generate a PR summary from a git diff and export a full tech spec."
            />
            <Page.Content as={Grid} columns={2} gap={6} className="flex-grow min-h-0">
                <Grid.Item as={Flex} direction="column" gap={4}>
                    <TextArea
                        label="Git Diff"
                        id="diff-input"
                        value={diff}
                        onValueChange={setDiff}
                        className="flex-grow resize-none font-mono text-sm"
                        placeholder={exampleDiff}
                    />
                    <Button onClick={handleGenerateSummary} isLoading={isGeneratingSummary} loadingText="Generating..." fullWidth>
                        Generate Summary
                    </Button>
                    {error && <Alert variant="destructive">{error}</Alert>}
                </Grid.Item>

                <Grid.Item as={Card} className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Generated Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto pr-2 space-y-4">
                        {isGeneratingSummary ? (
                            <Flex justify="center" align="center" className="h-full">
                                <Spinner text="AI is analyzing the diff..." />
                            </Flex>
                        ) : summary ? (
                            <>
                                <Input isReadOnly value={summary.title} label="Title" className="font-bold" />
                                <TextArea isReadOnly value={summary.summary} label="Summary" rows={5} />
                                <div>
                                    <Text as="h4" className="font-semibold mb-2">Changes:</Text>
                                    <List className="list-disc list-inside text-sm space-y-1">
                                        {summary.changes.map((c, i) => <ListItem key={i}>{c}</ListItem>)}
                                    </List>
                                </div>
                            </>
                        ) : (
                            <Flex justify="center" align="center" className="h-full">
                                <Text color="secondary">PR summary will appear here.</Text>
                            </Flex>
                        )}
                    </CardContent>
                     {summary && isAuthenticated && (
                        <CardFooter>
                            <Button onClick={handleExportToDocs} isLoading={isExporting} loadingText="Exporting..." variant="secondary" fullWidth icon={<DocumentIcon />}>
                                Export Tech Spec to Google Docs
                            </Button>
                        </CardFooter>
                     )}
                </Grid.Item>
            </Page.Content>
        </Page>
    );
};
