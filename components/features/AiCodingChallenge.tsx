import React, { useState, useCallback, useEffect } from 'react';
import { generateCodingChallengeStream } from '../../services/index.ts';
import { BeakerIcon } from '../icons.tsx';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index.tsx';

/**
 * @fileoverview A feature component that generates AI-powered coding challenges.
 * @module AiCodingChallenge
 * @security This component interacts with the AI service, which is a trusted internal service. All user inputs are treated as prompts and not executed.
 * @performance Offloads the AI interaction to a service layer, with streaming to improve perceived performance during content generation.
 */

/**
 * A React functional component that allows users to generate unique coding challenges.
 * It fetches challenges from an AI service and displays them in a user-friendly format.
 * The component automatically generates a new challenge upon initial load.
 *
 * @returns {React.ReactElement} The rendered AI Coding Challenge component.
 * @example
 * <Window feature={{...}} ... >
 *   <AiCodingChallenge />
 * </Window>
 */
export const AiCodingChallenge: React.FC = () => {
    const [challenge, setChallenge] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    /**
     * @function handleGenerate
     * @description Fetches a new coding challenge from the AI service and updates the component's state.
     * It handles the streaming response to provide real-time updates to the UI.
     * @performance Uses async/await and streaming for non-blocking UI and better user experience.
     * @throws {Error} Catches and sets an error state if the AI service call fails.
     * @returns {Promise<void>}
     */
    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setChallenge('');
        try {
            const stream = generateCodingChallengeStream(null);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setChallenge(fullResponse);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate challenge: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Generate a challenge on initial load for a better user experience
        handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleGenerate]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <BeakerIcon />
                        <span className="ml-3">AI Coding Challenge Generator</span>
                    </h1>
                    <p className="text-text-secondary mt-1">Generate a unique coding problem to test your skills.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="btn-primary flex items-center justify-center px-6 py-3"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate New Challenge'}
                </button>
            </header>
            <div className="flex-grow p-4 bg-surface border border-border rounded-md overflow-y-auto">
                {isLoading && (
                     <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                     </div>
                )}
                {error && <p className="text-red-500">{error}</p>}
                {challenge && !isLoading && (
                    <MarkdownRenderer content={challenge} />
                )}
                 {!isLoading && !challenge && !error && (
                    <div className="text-text-secondary h-full flex items-center justify-center">
                        Click "Generate New Challenge" to start.
                    </div>
                )}
            </div>
        </div>
    );
};
