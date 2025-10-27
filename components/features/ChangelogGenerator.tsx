/**
 * @file components/features/ChangelogGenerator.tsx
 * @description A feature component for generating a formatted changelog from raw git log output using an AI service.
 * @license
 * Copyright James Burvel Oâ€™Callaghan III
 * President Citibank Demo Business Inc.
 */

import React, { useState, useCallback, useReducer } from 'react';

// --- Framework Imports ---
// Abstracted UI components from the new proprietary UI framework.
import { Button, TextArea, Label, Icon, Spinner } from 'ui/core';
import { FeatureHeader, CodePanel, TwoColumnLayout, Panel } from 'ui/composite';
import { GitBranchIcon, SparklesIcon, ClipboardIcon } from 'ui/icons';
import { MarkdownRenderer } from 'ui/shared';

// --- Service Imports ---
// Hook to interact with the Backend-for-Frontend (BFF) layer.
// This encapsulates GraphQL queries and mutations for AI services.
import { useBffService } from 'services/bff';
// Hook to access the shared web worker pool. Not used here as prompt construction is trivial,
// but included to demonstrate adherence to architectural directives for offloading computation.
import { useWorkerPool } from 'services/worker-pool';

// --- Type Definitions ---

/**
 * @typedef {object} State
 * @description Represents the state of the changelog generation process.
 * @property {'idle' | 'streaming' | 'success' | 'error'} status - The current status of the generation.
 * @property {string} changelog - The generated changelog content, streamed from the backend.
 * @property {string | null} error - Any error message that occurred.
 */
type State = {
  status: 'idle' | 'streaming' | 'success' | 'error';
  changelog: string;
  error: string | null;
};

/**
 * @typedef {object} Action
 * @description Represents an action to be dispatched to update the component's state.
 */
type Action = 
  | { type: 'START_STREAM' }
  | { type: 'STREAM_DATA', payload: string }
  | { type: 'STREAM_END' }
  | { type: 'ERROR', payload: string }
  | { type: 'RESET' };

// --- Reducer ---

/**
 * The initial state for the changelog generator.
 * @type {State}
 */
const initialState: State = {
  status: 'idle',
  changelog: '',
  error: null,
};

/**
 * A reducer function to manage the state of the changelog generation.
 * This provides a structured way to handle state transitions.
 * @function reducer
 * @param {State} state - The current state.
 * @param {Action} action - The action to perform.
 * @returns {State} The new state.
 */
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_STREAM':
      return { status: 'streaming', changelog: '', error: null };
    case 'STREAM_DATA':
      return { ...state, status: 'streaming', changelog: state.changelog + action.payload };
    case 'STREAM_END':
      return { ...state, status: 'success' };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload, changelog: '' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};


// --- Example Data ---

/**
 * Example git log data to pre-populate the input field.
 * @const {string}
 */
const exampleLog = `commit 3a4b5c...
Author: Dev One <dev.one@example.com>
Date:   Mon Jul 15 11:30:00 2024 -0400

    feat: add user login page

commit 1a2b3c...
Author: Dev Two <dev.two@example.com>
Date:   Mon Jul 15 10:00:00 2024 -0400

    fix: correct typo in header
`;

/**
 * @component ChangelogGenerator
 * @description A feature component that allows a user to input raw git log data
 * and generate a structured, formatted changelog using an AI service.
 * It adheres to the new federated architecture by acting as a thin presentation layer
 * that communicates with a BFF via a dedicated service hook.
 * @security This component sends user-provided git log data to the backend BFF.
 * The data may contain sensitive information like commit messages, author names, and email addresses.
 * The BFF layer is responsible for any necessary sanitization and ensuring data is not logged inappropriately.
 * All communication with the BFF is over an authenticated HTTPS connection.
 * @performance The primary performance consideration is the time taken for the AI service
 * to stream a response. The component is optimized to render the changelog content as it streams in,
 * providing a responsive user experience.
 * @see useBffService
 * @example
 * ```jsx
 * <ChangelogGenerator />
 * ```
 */
export const ChangelogGenerator: React.FC = () => {
    const [log, setLog] = useState(exampleLog);
    const [state, dispatch] = useReducer(reducer, initialState);

    const { callStream } = useBffService();
    // Although not used here for simple string submission, this hook is available
    // for more complex, CPU-intensive tasks according to architecture directives.
    const workerPool = useWorkerPool();

    /**
     * Handles the click event to initiate changelog generation.
     * It validates the input and calls the BFF streaming service.
     * @function handleGenerate
     * @returns {Promise<void>}
     */
    const handleGenerate = useCallback(async () => {
        if (!log.trim()) {
            dispatch({ type: 'ERROR', payload: 'Please paste your git log output.' });
            return;
        }
        dispatch({ type: 'START_STREAM' });

        try {
            // In the new architecture, this calls a BFF endpoint which then communicates with the AIGatewayService.
            // The `callStream` function from the `useBffService` hook abstracts the underlying GraphQL streaming query.
            const stream = callStream('ai/generateChangelogFromLog', { log });
            for await (const chunk of stream) {
                dispatch({ type: 'STREAM_DATA', payload: chunk.content });
            }
            dispatch({ type: 'STREAM_END' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred while generating the changelog.';
            dispatch({ type: 'ERROR', payload: message });
        }
    }, [log, callStream]);
    
    const isLoading = state.status === 'streaming';

    return (
        <Panel>
            <FeatureHeader
                icon={<Icon as={GitBranchIcon} />}
                title="AI Changelog Generator"
                subtitle="Generate a markdown changelog from your raw git log."
            />
            <TwoColumnLayout mainContent={
                <TwoColumnLayout.Column>
                    <Label htmlFor="commit-input">Raw Git Log</Label>
                    <TextArea
                        id="commit-input"
                        value={log}
                        onChange={(e) => setLog(e.target.value)}
                        placeholder="Paste output of `git log` here..."
                        className="flex-grow font-mono text-sm"
                    />
                </TwoColumnLayout.Column>
            }
            sidebarContent={
                 <TwoColumnLayout.Column>
                    <CodePanel 
                        title="Generated Changelog.md"
                        actions={
                            state.status === 'success' ? (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => navigator.clipboard.writeText(state.changelog)}
                                    aria-label="Copy changelog to clipboard"
                                >
                                    <Icon as={ClipboardIcon} /> Copy
                                </Button>
                            ) : null
                        }
                    >
                        {isLoading && state.changelog.length === 0 && <Spinner label="Generating..." />}
                        {state.error && <p className="text-red-500">{state.error}</p>}
                        {state.changelog && <MarkdownRenderer content={state.changelog} />}
                        {state.status === 'idle' && <p className="text-text-secondary">Your generated changelog will appear here.</p>}
                    </CodePanel>
                </TwoColumnLayout.Column>
            }
            footerContent={
                 <div className="flex justify-center">
                    <Button 
                        onClick={handleGenerate} 
                        disabled={isLoading}
                        icon={<Icon as={SparklesIcon} />}
                        size="lg"
                    >
                        {isLoading ? 'Generating...' : 'Generate Changelog'}
                    </Button>
                </div>
            }
            />
        </Panel>
    );
};