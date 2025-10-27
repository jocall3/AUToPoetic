/**
 * @file Renders the AI Commit Message Generator feature.
 * @summary This component allows users to input a git diff and uses an AI model
 * to generate a conventional commit message. It supports streaming responses
 * for real-time feedback and provides an easy way to copy the generated message.
 * @security This component interacts with a third-party AI service. The git diff
 * provided by the user is sent to this service. Ensure no sensitive information
 * (e.g., keys, passwords) is included in the diffs.
 * @performance The component uses streaming for the AI response to improve perceived
 * performance by displaying the commit message as it's generated, rather than
 * waiting for the full response.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { generateCommitMessageStream } from '../../services/index.ts';
import { GitBranchIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';

/**
 * An example git diff provided to the user as a placeholder.
 * @constant
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
 * Props for the AiCommitGenerator component.
 * @interface AiCommitGeneratorProps
 */
interface AiCommitGeneratorProps {
  /**
   * An optional initial git diff string to populate the input field.
   * This is useful for pre-filling the generator from another feature.
   * @type {string}
   * @example
   * <AiCommitGenerator diff={gitDiffContent} />
   */
  diff?: string;
}

/**
 * A feature component that generates a conventional commit message from a git diff using AI.
 * It provides a text area for the diff input and displays the streamed AI response.
 *
 * @component
 * @param {AiCommitGeneratorProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered AI Commit Generator component.
 */
export const AiCommitGenerator: React.FC<AiCommitGeneratorProps> = ({ diff: initialDiff }) => {
    /**
     * State for the git diff input.
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [diff, setDiff] = useState<string>(initialDiff || exampleDiff);
    /**
     * State for the generated commit message.
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [message, setMessage] = useState<string>('');
    /**
     * State to track if the AI is currently generating a message.
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    const [isLoading, setIsLoading] = useState<boolean>(false);
    /**
     * State for storing any error messages.
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [error, setError] = useState<string>('');

    const { addNotification } = useNotification();

    /**
     * Handles the AI commit message generation process.
     * It validates the input, sets loading states, and streams the response
     * from the AI service into the message state.
     *
     * @function
     * @param {string} diffToAnalyze - The git diff to be analyzed by the AI.
     * @returns {Promise<void>}
     */
    const handleGenerate = useCallback(async (diffToAnalyze: string) => {
        if (!diffToAnalyze.trim()) {
            setError('Please paste a diff to generate a message.');
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const stream = generateCommitMessageStream(diffToAnalyze);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setMessage(fullResponse);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate message: ${errorMessage}`);
            addNotification('Failed to generate message.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    /**
     * Effect to automatically trigger generation if an initial diff is provided via props.
     * @effect
     */
    useEffect(() => {
        if (initialDiff) {
            setDiff(initialDiff);
            handleGenerate(initialDiff);
        }
    }, [initialDiff, handleGenerate]);
    
    /**
     * Copies the generated commit message to the user's clipboard and shows a notification.
     * @function
     */
    const handleCopy = () => {
        if (!message) return;
        navigator.clipboard.writeText(message);
        addNotification('Commit message copied to clipboard!', 'success');
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">AI Commit Message Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste your diff and let Gemini craft the perfect commit message.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <label htmlFor="diff-input" className="text-sm font-medium text-text-secondary mb-2">Git Diff</label>
                    <textarea
                        id="diff-input"
                        value={diff}
                        onChange={(e) => setDiff(e.target.value)}
                        placeholder="Paste your git diff here..."
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                     <button
                        onClick={() => handleGenerate(diff)}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Commit Message'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Message</label>
                    <div className="relative flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && (
                             <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                             </div>
                        )}
                        {error && <p className="text-red-500">{error}</p>}
                        {message && !isLoading && (
                            <>
                               <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 bg-surface hover:bg-gray-100 dark:hover:bg-slate-700 border border-border rounded-md text-xs">Copy</button>
                               <pre className="whitespace-pre-wrap font-sans text-text-primary">{message}</pre>
                            </>
                        )}
                         {!isLoading && !message && !error && (
                            <div className="text-text-secondary h-full flex items-center justify-center">
                                The commit message will appear here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
