/**
 * @file CodeReviewBot.tsx
 * @description This file contains the CodeReviewBot feature component, a micro-frontend responsible for
 *              requesting and displaying AI-powered code reviews. It offloads the review request to a
 *              web worker to ensure a non-blocking UI experience.
 * @module components/features/CodeReviewBot
 * @see AiPersonalityForge.tsx for personality management.
 * @see services/WorkerPoolManager.ts for task offloading.
 * @security User-provided code is sent for analysis. Backend services (BFF, AIGatewayService) are responsible for sanitization and preventing prompt injection attacks.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useAiPersonalities } from '../../hooks/useAiPersonalities.ts';
import { formatSystemPromptToString } from '../../utils/promptUtils.ts';
// Proprietary UI Framework components as per architectural directives
import { Button as CoreButton } from '@our_ui/core/Button';
import { TextArea as CoreTextArea } from '@our_ui/core/TextArea';
import { Select as CoreSelect } from '@our_ui/core/Select';
import { Card as CompositeCard } from '@our_ui/composite/Card';
import { MarkdownRenderer } from '@our_ui/composite/MarkdownRenderer';
import { LoadingSpinner } from '@our_ui/core/LoadingSpinner';
import { Typography } from '@our_ui/core/Typography';
import { Icon } from '@our_ui/core/Icon';
import { Form } from '@our_ui/composite/Form';
// Worker pool manager for offloading heavy tasks
import { workerPoolManager } from '../../services/WorkerPoolManager.ts';
import type { SystemPrompt } from '../../types.ts';

/**
 * An example code snippet to be reviewed, demonstrating a common bug (`= 0` instead of `=== 0`).
 * @constant
 * @type {string}
 */
const exampleCode = `function UserList(users) {
  if (users.length = 0) {
    return "no users";
  } else {
    return (
      users.map(u => {
        return <li>{u.name}</li>
      })
    )
  }
}`;

/**
 * The CodeReviewBot component provides an interface for users to submit code snippets for an AI-powered review.
 * It allows selecting different AI personalities to tailor the review style and offloads the analysis
 * to a web worker to maintain UI responsiveness, in line with the new architecture.
 *
 * @component
 * @returns {React.ReactElement} The rendered CodeReviewBot feature component.
 * @example
 * <CodeReviewBot />
 */
export const CodeReviewBot: React.FC = () => {
    /**
     * State for the code input by the user.
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [code, setCode] = useState<string>(exampleCode);

    /**
     * State for storing the AI-generated review content, streamed from the worker.
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [review, setReview] = useState<string>('');

    /**
     * State to manage the loading status of the AI review process.
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * State for holding any error messages that occur during the process.
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [error, setError] = useState<string>('');

    /**
     * Fetches available AI personalities using a custom hook.
     * @type {[SystemPrompt[], Function]}
     */
    const [personalities] = useAiPersonalities();

    /**
     * State for the ID of the currently selected AI personality.
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [selectedPersonalityId, setSelectedPersonalityId] = useState<string>('default');

    /**
     * Memoized list of personality options for the select dropdown.
     * @type {{ label: string; value: string; }[]}
     */
    const personalityOptions = useMemo(() => [
        { label: 'Default', value: 'default' },
        ...personalities.map((p: SystemPrompt) => ({ label: p.name, value: p.id }))
    ], [personalities]);

    /**
     * Handles the 'Request Review' action.
     * Prepares the request, offloads it to the web worker pool, and streams the response back to the UI state.
     * @function
     * @async
     * @performance Offloads the AI request and response streaming to a web worker via `workerPoolManager`.
     * This prevents blocking the main UI thread during a potentially long-running operation, ensuring the
     * application remains responsive.
     * @returns {Promise<void>} A promise that resolves when the review process is complete.
     * @throws Will set the `error` state if the worker task fails or returns an error.
     */
    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to review.');
            return;
        }
        setIsLoading(true);
        setError('');
        setReview('');

        let systemInstruction: string | undefined = undefined;
        if (selectedPersonalityId !== 'default') {
            const personality = personalities.find(p => p.id === selectedPersonalityId);
            if (personality) {
                systemInstruction = formatSystemPromptToString(personality);
            }
        }

        try {
            // Offload the task to the worker pool as per architectural directives.
            const stream = await workerPoolManager.enqueueTask<AsyncGenerator<string>>(
                'reviewCode',
                { code, systemInstruction }
            );

            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setReview(fullResponse);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred in the worker.';
            setError(`Failed to get review: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [code, selectedPersonalityId, personalities]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <Typography.H1 className="flex items-center">
                    <Icon name="CpuChipIcon" className="mr-3" />
                    AI Code Review Bot
                </Typography.H1>
                <Typography.P variant="secondary" className="mt-1">
                    Get an automated code review from Gemini.
                </Typography.P>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 min-h-0">
                    <Form.Group className="flex-grow flex flex-col min-h-0">
                        <Form.Label htmlFor="code-input">Code to Review</Form.Label>
                        <CoreTextArea
                            id="code-input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Paste your code here..."
                            className="flex-grow resize-none font-mono text-sm"
                        />
                    </Form.Group>
                    <div className="flex-shrink-0 flex items-end justify-between gap-4">
                         <Form.Group className="flex-grow">
                            <Form.Label htmlFor="personality-select">Reviewer Personality</Form.Label>
                            <CoreSelect
                                id="personality-select"
                                value={selectedPersonalityId}
                                onValueChange={setSelectedPersonalityId}
                                options={personalityOptions}
                            />
                         </Form.Group>
                        <CoreButton
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="min-w-[150px]"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Request Review'}
                        </CoreButton>
                    </div>
                </div>

                <div className="flex flex-col min-h-0">
                     <Form.Label>AI Feedback</Form.Label>
                     <CompositeCard className="flex-grow flex flex-col overflow-hidden">
                        <CompositeCard.Content className="flex-grow overflow-y-auto">
                            {isLoading && !review && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                            {error && <Typography.P color="danger">{error}</Typography.P>}
                            {review && <MarkdownRenderer content={review} />}
                            {!isLoading && !review && !error && (
                                <div className="text-text-secondary h-full flex items-center justify-center">
                                    Review will appear here.
                                </div>
                            )}
                        </CompositeCard.Content>
                    </CompositeCard>
                </div>
            </div>
        </div>
    );
};
