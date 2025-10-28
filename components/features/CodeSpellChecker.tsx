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

// Aligned imports with the new architectural directives and UI framework
import { Box, Grid, Typography, Button, Card, CardHeader, CardContent, Spinner } from '@/ui/core';
import { CodeEditor } from '@/ui/composite';
import { BeakerIcon, SparklesIcon } from '@/components/icons';

// Hooks for services and context
import { useWorker } from '@/hooks/useWorker';
import { useBff } from '@/hooks/useBff';
import { useNotification } from '@/contexts/NotificationContext';

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
    const { query: queryBff } = useBff();

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

    const { post: postToWorker, isLoading: isWorkerProcessing } = useWorker<SpellCheckWorkerRequest, SpellCheckWorkerResponse>(
        'spellCheckWorker.js',
        handleWorkerMessage
    );

    useEffect(() => {
        if (!postToWorker) return;

        const handler = setTimeout(() => {
            postToWorker({ type: 'SPELL_CHECK', payload: { code } });
        }, 500); // Debounce to avoid excessive checks while typing

        return () => clearTimeout(handler);
    }, [code, postToWorker]);

    const handleSuggestFix = useCallback(async (typo: Typo) => {
        setLoadingSuggestion(typo.index);
        try {
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
        <Box className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <header className="mb-6">
                <Typography as="h1" variant="h1" className="flex items-center">
                    <BeakerIcon />
                    <span className="ml-3">Code Spell Checker</span>
                </Typography>
                <Typography variant="subtitle1" color="secondary">
                    Finds common typos in code and suggests AI-powered fixes.
                </Typography>
            </header>
            <Grid container spacing={3} className="flex-grow min-h-0">
                <Grid item xs={12} md={8} className="flex flex-col min-h-0">
                    <CodeEditor
                        value={code}
                        onChange={setCode}
                        language="javascript"
                        highlights={highlights}
                        showLineNumbers={true}
                    />
                </Grid>
                <Grid item xs={12} md={4} className="flex flex-col min-h-0">
                    <Card className="flex flex-col h-full">
                        <CardHeader>
                            <Typography as="h3" variant="h3">Detected Typos ({typos.length})</Typography>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto p-4 space-y-3">
                            {isWorkerProcessing && typos.length === 0 && (
                                <Box className="flex justify-center items-center h-full">
                                    <Spinner />
                                </Box>
                            )}
                            {!isWorkerProcessing && typos.length === 0 && (
                                <Typography color="secondary" className="text-center pt-8">No typos found. Keep up the good work!</Typography>
                            )}
                            {typos.map((typo) => (
                                <Box key={typo.index} className="p-3 bg-background rounded-md border border-border">
                                    <Box className="flex justify-between items-start">
                                        <Box>
                                            <Typography as="p" className="font-mono text-red-500 font-bold">{typo.value}</Typography>
                                            <Typography color="secondary" variant="caption">Line: {typo.line}</Typography>
                                        </Box>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleSuggestFix(typo)}
                                            isLoading={loadingSuggestion === typo.index}
                                            icon={<SparklesIcon />}
                                        >
                                            Suggest Fix
                                        </Button>
                                    </Box>
                                    {suggestions[typo.index] && (
                                        <Box className="mt-2 pt-2 border-t border-border">
                                            <Typography variant="body2">
                                                <strong>Suggestion:</strong> <span className="font-mono text-green-600">{suggestions[typo.index]}</span>
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};
