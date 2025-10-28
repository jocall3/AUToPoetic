/**
 * @file Renders the AI Commit Message Generator feature.
 * @module features/AiCommitGenerator
 * @description This micro-frontend component allows users to input a git diff and uses an AI model
 *              to generate a conventional commit message. It streams the response for real-time feedback.
 * @see {@link useGenerateCommitMessageStream} for the AI interaction logic.
 * @see {@link @core-ui/Button} and other UI components for the view layer.
 * @security This component sends code (git diff) to a backend service for analysis. Users should
 *           be advised not to input sensitive or proprietary code. The BFF handles all secure communication.
 * @performance The AI generation is an asynchronous, network-bound operation. The component uses
 *              a streaming hook to display the commit message as it's generated, improving
 *              perceived performance.
 */

import React, { useState, useCallback, useEffect } from 'react';

// --- Architectural Imports ---
// Abstracted UI components from the new proprietary UI framework.
import { Button } from '@/ui/core/Button';
import { TextArea } from '@/ui/core/TextArea';
import { Panel, PanelContent, PanelHeader } from '@/ui/composite/Panel';
import { Header } from '@/ui/composite/Header';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Text } from '@/ui/core/Text';
import { GitBranchIcon, ClipboardDocumentIcon } from '@/components/icons';

// Data fetching is now handled by hooks that abstract GraphQL mutations to the BFF.
import { useGenerateCommitMessageStream } from '@/hooks/useAiBffService'; // Conceptual hook
import { useNotification } from '@/contexts/NotificationContext';

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
 * @component AiCommitGenerator
 * @description A feature component that generates a conventional commit message from a git diff using AI.
 *              It provides a text area for the diff input and displays the streamed AI response.
 * @param {{ diff?: string }} props - The component props.
 * @param {string} [props.diff] - An optional initial git diff to populate the input.
 * @returns {React.ReactElement} The rendered AI Commit Message Generator component.
 */
export const AiCommitGenerator: React.FC<{ diff?: string }> = ({ diff: initialDiff }) => {
    const [diff, setDiff] = useState<string>(initialDiff || exampleDiff);
    const [message, setMessage] = useState<string>('');
    const { addNotification } = useNotification();
    
    // The new hook encapsulates the streaming logic, loading, and error states.
    const { stream, isLoading, error } = useGenerateCommitMessageStream();

    /**
     * Initiates the AI commit message generation process.
     * @function handleGenerate
     * @returns {Promise<void>}
     */
    const handleGenerate = useCallback(async () => {
        if (!diff.trim()) {
            addNotification('Please paste a diff to generate a message.', 'error');
            return;
        }
        setMessage(''); // Clear previous message
        try {
            const streamGenerator = stream({ diff });
            let fullResponse = '';
            for await (const chunk of streamGenerator) {
                fullResponse += chunk;
                setMessage(fullResponse);
            }
        } catch (e) {
            // The hook itself might set the `error` state, but we can also handle it here if needed.
            console.error("Failed to generate commit message:", e);
        }
    }, [diff, stream, addNotification]);

    useEffect(() => {
        if (initialDiff) {
            setDiff(initialDiff);
            handleGenerate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDiff]);
    
    /**
     * Copies the generated commit message to the clipboard.
     * @function handleCopy
     * @returns {void}
     */
    const handleCopy = () => {
        if (!message) return;
        navigator.clipboard.writeText(message);
        addNotification('Commit message copied to clipboard!', 'success');
    };

    return (
        <Panel className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <Header
                icon={<GitBranchIcon />}
                title="AI Commit Message Generator"
                subtitle="Paste your diff and let AI craft the perfect commit message."
                className="mb-6"
            />
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="diff-input" className="text-sm font-medium text-text-secondary mb-2">Git Diff</label>
                    <TextArea
                        id="diff-input"
                        value={diff}
                        onChange={(e) => setDiff(e.target.value)}
                        placeholder="Paste your git diff here..."
                        className="flex-grow p-4 resize-none font-mono text-sm"
                    />
                     <Button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full justify-center py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Commit Message'}
                    </Button>
                    {error && <Text className="text-red-500 text-xs mt-1 text-center">{error.message}</Text>}
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Message</label>
                    <div className="relative flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {(isLoading && !message) && (
                             <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                             </div>
                        )}
                        {message && (
                            <>
                               <Button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 text-xs" variant="secondary">
                                   <ClipboardDocumentIcon /> Copy
                                </Button>
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
        </Panel>
    );
};
