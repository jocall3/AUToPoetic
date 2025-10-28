/**
 * @file AiStyleTransfer.tsx
 * @module components/features/AiStyleTransfer
 * @description
 * This module provides the `AiStyleTransfer` feature component. This component allows users
 * to input a code snippet and a style guide, and then uses an AI service (via a BFF GraphQL endpoint)
 * to rewrite the code according to the specified style. The component demonstrates the presentation
 * layer of a micro-frontend, adhering to the architectural directives of using a Core UI library,
 * offloading business logic to a backend, and providing comprehensive documentation.
 *
 * @security
 * This component handles user-provided code, which is sent to a backend service. All data transfer
 * to the BFF is performed over authenticated GraphQL endpoints. The backend is responsible for
 * sanitizing and validating inputs before passing them to any downstream AI service. The client-side
 * component itself does not execute or evaluate the provided code, mitigating XSS risks.
 *
 * @performance
 * The primary performance consideration is the real-time display of the AI's streaming response.
 * The component uses state updates for each received chunk. For very large code outputs, this could
 * potentially cause frequent re-renders. The use of `React.memo` for child components and ensuring
 * the `MarkdownRenderer` is efficient are key. The main computational load (AI processing) is
 * handled by the backend, so client-side performance is primarily related to rendering.
 *
 * @example
 * ```tsx
 * import { AiStyleTransfer } from './AiStyleTransfer';
 * // In a window or view container
 * <Window feature={...}>
 *   <AiStyleTransfer />
 * </Window>
 * ```
 */

import React, { useState, useCallback } from 'react';

// As per architectural directives, these would be from a proprietary UI framework
import { Button } from '@/ui/core/Button';
import { Flex } from '@/ui/core/Flex';
import { Grid } from '@/ui/core/Grid';
import { Panel } from '@/ui/core/Panel';
import { TextArea } from '@/ui/core/TextArea';
import { FeatureHeader } from '@/ui/composite/FeatureHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { SparklesIcon } from '@/ui/icons';

// Data fetching is handled by hooks that abstract GraphQL mutations to the BFF
import { useStyleTransferMutation } from '@/hooks/mutations/useStyleTransferMutation';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * @constant {string} exampleCode
 * @description Default example code to populate the input text area.
 * Demonstrates a function with a non-standard style.
 */
const exampleCode = `function my_func(x,y){return x+y;}`;

/**
 * @constant {string} exampleStyleGuide
 * @description Default example style guide to populate the style guide text area.
 * Provides clear, actionable rules for the AI to follow.
 */
const exampleStyleGuide = `- Use camelCase for function names.
- Use explicit 'return' statements on their own line if the function body is complex.
- Add a space after commas in argument lists.
- Use semicolons at the end of statements.
- Add JSDoc comments explaining the function, parameters, and return value.`;

/**
 * @component AiStyleTransfer
 * @description
 * A React functional component that provides a user interface for AI-powered code style transfer.
 * Users input their code and a style guide, and the component communicates with a backend service
 * to stream a rewritten version of the code that adheres to the new style.
 *
 * This component is designed as a thin presentation layer, delegating the AI interaction
 * to a backend service as per architectural guidelines. It utilizes a custom GraphQL hook
 * for data fetching and Core UI components for rendering.
 *
 * @returns {React.ReactElement} The rendered AI Style Transfer feature component.
 */
export const AiStyleTransfer: React.FC = () => {
    const [inputCode, setInputCode] = useState<string>(exampleCode);
    const [styleGuide, setStyleGuide] = useState<string>(exampleStyleGuide);
    const [outputCode, setOutputCode] = useState<string>('');

    const { addNotification } = useNotification();
    // This hook encapsulates the GraphQL mutation to the BFF for style transfer
    const { mutate: runStyleTransfer, isLoading, error } = useStyleTransferMutation();

    /**
     * @function handleGenerate
     * @description
     * A callback function that initiates the code style transfer process.
     * It validates the inputs, calls the GraphQL mutation, and handles the streaming response
     * by updating the component's state with each received chunk of rewritten code.
     * Errors during the process are displayed to the user via notifications.
     *
     * @performance
     * This function triggers state updates in a loop as data streams in. For very large
     * responses, this could be optimized by batching updates, but for typical code snippets,
     * the current approach provides good real-time feedback.
     *
     * @security
     * The input `code` and `styleGuide` are treated as plain text and sent to the backend.
     * No client-side evaluation of the code occurs.
     */
    const handleGenerate = useCallback(async () => {
        if (!inputCode.trim() || !styleGuide.trim()) {
            addNotification('Please provide both code and a style guide.', 'error');
            return;
        }

        setOutputCode('');

        try {
            const stream = runStyleTransfer({ code: inputCode, styleGuide });
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setOutputCode(fullResponse);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            addNotification(`Failed to transfer style: ${errorMessage}`, 'error');
            console.error("Style transfer failed:", err);
        }
    }, [inputCode, styleGuide, runStyleTransfer, addNotification]);

    return (
        <Panel as={Flex} direction="column" className="h-full p-4 sm:p-6 lg:p-8">
            <FeatureHeader
                icon={<SparklesIcon />}
                title="AI Code Style Transfer"
                description="Rewrite code to match a specific style guide using AI."
            />

            <Flex direction="column" gap="4" className="flex-grow min-h-0">
                <Grid columns={2} gap="4" className="flex-grow min-h-0">
                    <Flex direction="column" className="h-full">
                        <label htmlFor="input-code" className="text-sm font-medium text-text-secondary mb-2">Original Code</label>
                        <TextArea
                            id="input-code"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            className="flex-grow p-4 resize-y font-mono text-sm"
                            placeholder="Paste original code here..."
                        />
                    </Flex>
                    <Flex direction="column" className="h-full">
                        <label htmlFor="style-guide" className="text-sm font-medium text-text-secondary mb-2">Style Guide</label>
                        <TextArea
                            id="style-guide"
                            value={styleGuide}
                            onChange={(e) => setStyleGuide(e.target.value)}
                            className="flex-grow p-4 resize-y font-mono text-sm"
                            placeholder="Describe your coding style rules..."
                        />
                    </Flex>
                </Grid>

                <Flex justify="center" className="flex-shrink-0">
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        variant="primary"
                        className="w-full max-w-xs flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Rewrite Code'}
                    </Button>
                </Flex>

                <Flex direction="column" className="flex-grow min-h-0">
                    <label className="text-sm font-medium text-text-secondary mb-2">Rewritten Code</label>
                    <Panel className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !outputCode && (
                            <Flex align="center" justify="center" className="h-full">
                                <LoadingSpinner />
                            </Flex>
                        )}
                        {error && !isLoading && (
                            <div className="p-4 text-red-500">
                                An error occurred. Please check the notification tray or console for details.
                            </div>
                        )}
                        {outputCode && (
                            // The AI service is expected to return the code within a markdown block for syntax highlighting.
                            <MarkdownRenderer content={outputCode} />
                        )}
                        {!isLoading && !outputCode && !error && (
                            <Flex align="center" justify="center" className="h-full text-text-secondary">
                                Rewritten code will appear here.
                            </Flex>
                        )}
                    </Panel>
                </Flex>
            </Flex>
        </Panel>
    );
};
