/**
 * @file components/features/CodeSpellChecker.tsx
 * @description This file implements the CodeSpellChecker feature as a micro-frontend component.
 * It offloads typo detection to a web worker and uses AI for correction suggestions.
 * @module CodeSpellChecker
 * @see {@link WorkerPoolManager} for worker management.
 * @see {@link BffService} for AI interactions.
 * @security This component processes user-provided code. While rendering is done in a controlled
 * manner, any execution of user code is strictly prohibited. AI interactions are sent to a secure BFF.
 * @performance Typo detection is offloaded to a web worker to prevent blocking the main thread.
 * The check is debounced to avoid excessive worker calls during typing.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Assuming new UI framework components from proprietary libraries
import { Button, Container, Header, Text, Title } from 'ui/core';
import { CodeEditor, LoadingSpinner } from 'ui/composite';
import { BeakerIcon, SparklesIcon } from '../icons.tsx';

// Assuming a hook to interact with the WorkerPoolManager service
import { useWorker } from 'hooks/useWorker.ts';
// Assuming a hook for GraphQL calls to the BFF
import { useBff } from 'hooks/useBff.ts';
import { useNotification } from 'contexts/NotificationContext.tsx';

/**
 * @interface Typo
 * @description Represents a detected typo with its position and value.
 * @property {string} value The misspelled word.
 * @property {number} index The starting index of the typo in the code string.
 * @property {number} line The line number where the typo occurs.
 */
interface Typo {
  value: string;
  index: number;
  line: number;
}

/**
 * @interface Highlight
 * @description Defines a highlight to be rendered by the CodeEditor component.
 * @property {number} start The starting index of the highlight.
 * @property {number} end The ending index of the highlight.
 * @property {string} message A tooltip message for the highlight.
 * @property {'error' | 'warning' | 'info'} type The type of highlight.
 */
interface Highlight {
  start: number;
  end: number;
  message: string;
  type: 'error' | 'warning' | 'info';
}

// Define the structure of messages sent to and from the spell-check worker.
type SpellCheckWorkerRequest = { type: 'SPELL_CHECK'; payload: { code: string } };
type SpellCheckWorkerResponse = { type: 'SPELL_CHECK_RESULT'; payload: { typos: Typo[] } };

// Example code for initial state
const exampleCode = `funtion myFunction() {
  consle.log("Hello World");
  const myVarable = docment.getElementById("root");
  // This is a React componnet with a speling eror.
}`;

/**
 * @component CodeSpellChecker
 * @description A feature component that finds and highlights common typos in code,
 * offloading the detection logic to a web worker and offering AI-powered suggestions.
 * It uses a proprietary UI component library for rendering.
 * @example
 * <CodeSpellChecker />
 */
export const CodeSpellChecker: React.FC = () => {
    const [code, setCode] = useState<string>(exampleCode);
    const [typos, setTypos] = useState<Typo[]>([]);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [suggestions, setSuggestions] = useState<Record<string, string>>({});
    const [loadingSuggestion, setLoadingSuggestion] = useState<number | null>(null);

    const { addNotification } = useNotification();
    const { post: postToWorker, isLoading: isWorkerProcessing } = useWorker<SpellCheckWorkerRequest, SpellCheckWorkerResponse>('spellCheckWorker.js');
    const { query: queryBff } = useBff();

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    /**
     * @function handleWorkerMessage
     * @description Callback to handle messages received from the spell-check worker.
     * Updates the component's state with the detected typos.
     * @param {MessageEvent<SpellCheckWorkerResponse>} event - The message event from the worker.
     * @performance Updates state in a single call to avoid multiple re-renders.
     */
    const handleWorkerMessage = useCallback((event: MessageEvent<SpellCheckWorkerResponse>) => {
        if (event.data.type === 'SPELL_CHECK_RESULT') {
            const detectedTypos = event.data.payload.typos;
            setTypos(detectedTypos);

            const newHighlights = detectedTypos.map(typo => ({
                start: typo.index,
                end: typo.index + typo.value.length,
                message: `Possible typo: '${typo.value}'`,
                type: 'warning' as const
            }));
            setHighlights(newHighlights);
        }
    }, []);

    // This effect establishes the worker and the message handler.
    useEffect(() => {
        if (!postToWorker) return;
        const workerInstance = postToWorker({ type: 'SPELL_CHECK', payload: { code } }, handleWorkerMessage, true);
        return () => workerInstance?.terminate();
    }, [postToWorker, handleWorkerMessage, code]);

    /**
     * @function triggerSpellCheck
     * @description Sends the current code to the web worker for spell checking.
     * This function is debounced to avoid overwhelming the worker during rapid typing.
     * @param {string} currentCode The code to be checked.
     */
    const triggerSpellCheck = useCallback((currentCode: string) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            postToWorker({ type: 'SPELL_CHECK', payload: { code: currentCode } });
        }, 500); // 500ms debounce delay
    }, [postToWorker]);

    // Effect to trigger spell check when code changes.
    useEffect(() => {
        triggerSpellCheck(code);
    }, [code, triggerSpellCheck]);

    /**
     * @function handleSuggestFix
     * @description Fetches an AI-powered correction suggestion for a specific typo from the BFF.
     * @param {Typo} typo - The typo object for which to get a suggestion.
     * @security The typo and surrounding code context are sent to the BFF, which then communicates
     * with the AI service. The client never communicates directly with the AI.
     */
    const handleSuggestFix = useCallback(async (typo: Typo) => {
        setLoadingSuggestion(typo.index);
        try {
            // GraphQL query to the BFF
            const response = await queryBff(`
                query SuggestTypoFix($word: String!, $context: String!) {
                    suggestTypoFix(word: $word, context: $context) {
                        suggestion
                    }
                }
            `, {
                word: typo.value,
                context: code.substring(Math.max(0, typo.index - 50), Math.min(code.length, typo.index + typo.value.length + 50))
            });

            if (response.data?.suggestTypoFix) {
                setSuggestions(prev => ({ ...prev, [typo.index]: response.data.suggestTypoFix.suggestion }));
            } else {
                throw new Error(response.errors?.[0]?.message || 'No suggestion received from AI.');
            }
        } catch (error) {
            addNotification(`AI suggestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setLoadingSuggestion(null);
        }
    }, [code, queryBff, addNotification]);

    return (
        <Container fullHeight={true} className="p-4 sm:p-6 lg:p-8">
            <Header>
                <Title icon={<BeakerIcon />}>Code Spell Checker</Title>
                <Text variant="secondary">Finds common typos in code and suggests AI-powered fixes.</Text>
            </Header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <CodeEditor
                        value={code}
                        onChange={setCode}
                        language="javascript"
                        highlights={highlights}
                        showLineNumbers={true}
                    />
                </div>
                <div className="lg:col-span-1 flex flex-col bg-surface border border-border rounded-lg">
                    <Header className="p-4 border-b border-border">
                        <Title as="h3" className="text-lg">Detected Typos ({typos.length})</Title>
                    </Header>
                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {isWorkerProcessing && typos.length === 0 && (
                            <div className="flex justify-center items-center h-full">
                                <LoadingSpinner />
                            </div>
                        )}
                        {!isWorkerProcessing && typos.length === 0 && (
                            <Text variant="secondary" className="text-center pt-8">No typos found. Keep up the good work!</Text>
                        )}
                        {typos.map((typo) => (
                            <div key={typo.index} className="p-3 bg-background rounded-md border border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-mono text-red-500 font-bold">{typo.value}</p>
                                        <Text variant="secondary" size="sm">Line: {typo.line}</Text>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleSuggestFix(typo)}
                                        loading={loadingSuggestion === typo.index}
                                        icon={<SparklesIcon />}
                                    >
                                        Suggest Fix
                                    </Button>
                                </div>
                                {suggestions[typo.index] && (
                                    <div className="mt-2 pt-2 border-t border-border">
                                        <Text size="sm">
                                            <strong>Suggestion:</strong> <span className="font-mono text-green-600">{suggestions[typo.index]}</span>
                                        </Text>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
};
