/**
 * @file CodeReviewBot.tsx
 * @description This file contains the CodeReviewBot feature component, a micro-frontend responsible for
 *              requesting and displaying AI-powered code reviews. It utilizes the central aiService to
 *              stream responses for a non-blocking UI experience.
 * @module components/features/CodeReviewBot
 * @see AiPersonalityForge.tsx for personality management.
 * @see services/aiService.ts for the underlying AI communication logic.
 * @security User-provided code is sent for analysis. Backend services (BFF, AIGatewayService) are responsible for sanitization and preventing prompt injection attacks.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useAiPersonalities } from '../../hooks/useAiPersonalities.ts';
import { formatSystemPromptToString } from '../../utils/promptUtils.ts';
import { reviewCodeStream } from '../../services/index.ts';
import type { SystemPrompt } from '../../types.ts';
import { CpuChipIcon } from '../icons.tsx';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index.tsx';

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
    const [code, setCode] = useState<string>(exampleCode);
    const [review, setReview] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [personalities] = useAiPersonalities();
    const [selectedPersonalityId, setSelectedPersonalityId] = useState<string>('default');

    const personalityOptions = useMemo(() => [
        { label: 'Default', value: 'default' },
        ...personalities.map((p: SystemPrompt) => ({ label: p.name, value: p.id }))
    ], [personalities]);

    /**
     * Handles the 'Request Review' action.
     * Prepares the request, calls the aiService to stream the response, and updates the UI state.
     * @function
     * @async
     * @performance The AI request and response streaming is handled by the aiService, which is designed
     * to be non-blocking for the main UI thread, ensuring the application remains responsive.
     * @returns {Promise<void>} A promise that resolves when the review process is complete.
     * @throws Will set the `error` state if the streaming operation fails.
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
            const stream = reviewCodeStream(code, systemInstruction);

            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setReview(fullResponse);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during the review process.';
            setError(`Failed to get review: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [code, selectedPersonalityId, personalities]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CpuChipIcon />
                    <span className="ml-3">AI Code Review Bot</span>
                </h1>
                <p className="text-text-secondary mt-1">
                    Get an automated code review from Gemini.
                </p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex-grow flex flex-col min-h-0">
                        <label htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">Code to Review</label>
                        <textarea
                            id="code-input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Paste your code here..."
                            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex-shrink-0 flex items-end justify-between gap-4">
                         <div className="flex-grow">
                            <label htmlFor="personality-select" className="text-sm font-medium text-text-secondary mb-2 block">Reviewer Personality</label>
                            <select
                                id="personality-select"
                                value={selectedPersonalityId}
                                onChange={(e) => setSelectedPersonalityId(e.target.value)}
                                className="w-full p-2 bg-surface border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                {personalityOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                         </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="btn-primary min-w-[150px] px-4 py-2 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Request Review'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col min-h-0">
                     <label className="text-sm font-medium text-text-secondary mb-2">AI Feedback</label>
                     <div className="flex-grow flex flex-col overflow-hidden bg-background border border-border rounded-lg">
                        <div className="flex-grow overflow-y-auto p-4">
                            {isLoading && !review && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                            {error && <p className="text-red-500">{error}</p>}
                            {review && <MarkdownRenderer content={review} />}
                            {!isLoading && !review && !error && (
                                <div className="text-text-secondary h-full flex items-center justify-center">
                                    Review will appear here.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
