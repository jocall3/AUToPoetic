/**
 * @file BugReproducer.tsx
 * @module components/features/BugReproducer
 * @description This file contains the BugReproducer feature component.
 * This tool allows developers to paste a stack trace and relevant code context
 * to automatically generate a failing unit test that reproduces the bug.
 * It leverages AI to analyze the error and create a minimal, reproducible test case.
 * @version 2.0.0
 * @author Elite AI Implementation Team
 * @see {@link useBugReproducer} for the business logic and AI interaction hook.
 * @security This component interacts with a backend AI service. All inputs (stack trace, code)
 * are sent to the backend for processing. Ensure no sensitive production data or secrets are
 * pasted into the input fields.
 * @performance The AI generation process is computationally intensive and is handled by the backend.
 * The streaming response is handled efficiently to update the UI progressively without blocking the main thread.
 * Prompt construction is offloaded to a web worker via the WorkerPoolManager.
 */

import React, { useState, useCallback, useMemo } from 'react';

// Assumed service imports based on the new architecture
import { generateBugReproductionTestStream } from '../../services/aiService';

// Assumed UI framework imports
import { BugAntIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

// This custom hook encapsulates the business logic for the bug reproducer feature.
// In a real application, this would likely live in a separate `hooks` directory.
const useBugReproducer = () => {
    const [generatedTest, setGeneratedTest] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    /**
     * @function generateTest
     * @description Initiates a streaming request to the AI service to generate a bug reproduction test.
     * @param {string} stackTrace - The stack trace of the bug.
     * @param {string} context - Relevant code context for the bug.
     * @returns {Promise<void>}
     */
    const generateTest = useCallback(async (stackTrace: string, context: string) => {
        if (!stackTrace.trim()) {
            setError('Please provide a stack trace.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedTest('');
        try {
            // In the new architecture, this would make a GraphQL call to the BFF,
            // which then orchestrates calls to downstream microservices (e.g., AIGatewayService).
            // For this demonstration, we'll keep the direct service call but acknowledge the change.
            const stream = generateBugReproductionTestStream(stackTrace, context);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setGeneratedTest(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { generatedTest, isLoading, error, generateTest };
};


/**
 * An example stack trace provided as a default value for the input field.
 * @constant
 * @type {string}
 */
const exampleStackTrace: string = `TypeError: Cannot read properties of undefined (reading 'name')
    at UserProfile (UserProfile.jsx:5:21)
    at renderWithHooks (react-dom.development.js:14985:18)
    at mountIndeterminateComponent (react-dom.development.js:17811:13)
    at beginWork (react-dom.development.js:19049:16)`;

/**
 * An example code context provided as a default value for the input field.
 * @constant
 * @type {string}
 */
const exampleContext: string = `// The UserProfile component code:
const UserProfile = ({ user }) => <div>{user.name}</div>;`;

/**
 * @component BugReproducer
 * @description A feature component that generates a failing unit test from a stack trace and code context.
 * It provides a user interface with two text areas for input and a display area for the AI-generated test code.
 * @returns {React.ReactElement} The rendered BugReproducer component.
 * @example
 * ```tsx
 * <BugReproducer />
 * ```
 */
export const BugReproducer: React.FC = () => {
    /**
     * @state
     * @description The stack trace provided by the user.
     */
    const [stackTrace, setStackTrace] = useState<string>(exampleStackTrace);

    /**
     * @state
     * @description The relevant code context provided by the user.
     */
    const [context, setContext] = useState<string>(exampleContext);

    const {
        generatedTest,
        isLoading,
        error,
        generateTest,
    } = useBugReproducer();

    /**
     * @function handleGenerate
     * @description A callback function to trigger the AI test generation process.
     * It is memoized with useCallback to prevent unnecessary re-renders.
     * @performance This function initiates a call that is offloaded to a web worker
     * and subsequently to a backend service, so it does not block the main thread.
     */
    const handleGenerate = useCallback(() => {
        generateTest(stackTrace, context);
    }, [stackTrace, context, generateTest]);

    /**
     * @constant hasInputs
     * @description A memoized boolean value to determine if the required inputs are provided.
     * Used to enable or disable the generate button.
     */
    const hasInputs = useMemo(() => stackTrace.trim().length > 0, [stackTrace]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <BugAntIcon />
                    <span className="ml-3">Automated Bug Reproducer</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste a stack trace to automatically generate a failing unit test.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left Panel: Inputs */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col flex-1 min-h-0">
                        <label htmlFor="stack-trace" className="text-sm font-medium mb-2 text-text-secondary">Stack Trace</label>
                        <textarea
                            id="stack-trace"
                            value={stackTrace}
                            onChange={(e) => setStackTrace(e.target.value)}
                            className="flex-grow p-2 bg-surface border border-border rounded font-mono text-xs w-full resize-none"
                            placeholder="Paste your stack trace here..."
                        />
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                        <label htmlFor="context" className="text-sm font-medium mb-2 text-text-secondary">Relevant Code / Context (Optional)</label>
                        <textarea
                            id="context"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="flex-grow p-2 bg-surface border border-border rounded font-mono text-xs w-full resize-none"
                            placeholder="Provide any relevant code snippets..."
                        />
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading || !hasInputs} className="btn-primary w-full py-3 flex items-center justify-center">
                        {isLoading ? <LoadingSpinner /> : 'Generate Test'}
                    </button>
                </div>

                {/* Right Panel: Output */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium mb-2 text-text-secondary">Generated Test File</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-lg overflow-auto">
                        {isLoading && !generatedTest && (
                            <div className="flex justify-center items-center h-full">
                                <LoadingSpinner />
                                <span className='ml-2 text-text-secondary'>AI is analyzing the bug...</span>
                            </div>
                        )}
                        {error && (
                            <div className="p-4 text-red-500">
                                <p className="font-bold">An error occurred:</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {generatedTest && (
                            <MarkdownRenderer content={generatedTest} />
                        )}
                        {!isLoading && !error && !generatedTest && (
                           <div className="flex justify-center items-center h-full text-text-secondary">
                                <p>The generated test file will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
