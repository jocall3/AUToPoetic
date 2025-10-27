/**
 * @file TechDebtSonar.tsx
 * @description A feature component that analyzes code for "code smells" and technical debt.
 * This component has been refactored to align with the new architectural directives, including
 * offloading computation to a web worker and utilizing the proprietary UI framework.
 * @copyright James Burvel O’Callaghan III
 * @license Apache-2.0
 */

import React, { useState, useCallback } from 'react';

// Architectural imports
import { workerPoolManager } from '../../services/workerPoolManager';
import type { CodeSmell } from '../../types.ts';
import { MagnifyingGlassIcon } from '../icons.tsx';

// Proprietary UI Framework components (assumed)
import { Button, Spinner } from '../../components/ui/core';
import { Panel, Accordion, Grid, Header, Text, Badge, TextArea } from '../../components/ui/composite';

const exampleCode = `class DataProcessor {
    process(data) {
        // Long method with multiple responsibilities
        if (data.type === 'A') {
            const results = [];
            for (let i = 0; i < data.items.length; i++) {
                // complex logic
                const item = data.items[i];
                if(item.value > 100) {
                   results.push({ ...item, status: 'processed' });
                }
            }
            return results;
        } else {
            // Duplicated logic
            const results = [];
            for (let i = 0; i < data.items.length; i++) {
                const item = data.items[i];
                 if(item.value > 100) {
                   results.push({ ...item, status: 'processed_special' });
                }
            }
            return results;
        }
    }
}`;

/**
 * @module TechDebtSonar
 * @description A feature component that analyzes code for "code smells" and technical debt.
 * @performance Offloads AI analysis to a dedicated web worker via the WorkerPoolManager to keep the main thread responsive.
 * @security The code is sent to a backend service for analysis; ensure no sensitive information is included in public-facing versions. The analysis itself happens on a secure, isolated backend.
 * @example
 * <TechDebtSonar />
 */
export const TechDebtSonar: React.FC = () => {
    const [code, setCode] = useState<string>(exampleCode);
    const [smells, setSmells] = useState<CodeSmell[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    /**
     * @function handleScan
     * @description Initiates a code smell analysis by enqueuing a task to the web worker pool.
     * Manages the loading and error states of the component during the analysis.
     * @performance The actual AI call (`detectCodeSmells`) is executed in a web worker,
     * preventing UI blocking during the potentially long-running analysis.
     * @returns {Promise<void>} A promise that resolves when the scan is complete.
     * @security The code payload is passed to a worker, which then communicates with the BFF. Standard API security protocols apply.
     * @throws {Error} Propagates errors from the worker task for UI display.
     */
    const handleScan = useCallback(async () => {
        if (!code.trim()) {
            setError('Please provide code to scan.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSmells([]);

        try {
            const result = await workerPoolManager.enqueueTask<CodeSmell[]>({
                task: 'detectCodeSmells',
                payload: code,
            });
            setSmells(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred in the worker.';
            setError(`Analysis failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    /**
     * Determines the color for a badge based on the smell type.
     * @param {string} smell - The type of code smell.
     * @returns {'error' | 'warning' | 'info'} The color variant for the Badge component.
     */
    const getSeverityVariant = (smell: string): 'error' | 'warning' | 'info' => {
        const lowerSmell = smell.toLowerCase();
        if (lowerSmell.includes('bug') || lowerSmell.includes('security') || lowerSmell.includes('critical')) {
            return 'error';
        }
        if (lowerSmell.includes('complex') || lowerSmell.includes('long method') || lowerSmell.includes('large class')) {
            return 'warning';
        }
        return 'info';
    };

    return (
        <Panel fullHeight>
            <Header
                icon={<MagnifyingGlassIcon />}
                title="Tech Debt Sonar"
                subtitle="Scan code to find code smells and areas with high complexity."
            />
            <Grid columns={2} gap={6} className="flex-grow min-h-0">
                <Panel.Section direction="column" className="min-h-0">
                    <Text as="label" htmlFor="code-to-analyze" variant="label">Code to Analyze</Text>
                    <TextArea
                        id="code-to-analyze"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        font="mono"
                        className="flex-grow resize-none"
                    />
                    <Button onClick={handleScan} disabled={isLoading} variant="primary" fullWidth className="mt-4">
                        {isLoading ? <Spinner /> : 'Scan for Code Smells'}
                    </Button>
                </Panel.Section>
                <Panel.Section direction="column" className="min-h-0">
                    <Text as="label" variant="label">Detected Smells</Text>
                    <Panel.Content scrollable>
                        {isLoading && (
                            <div className="flex justify-center items-center h-full">
                                <Spinner size="large" label="Analyzing..." />
                            </div>
                        )}
                        {error && <Text color="error">{error}</Text>}
                        {!isLoading && smells.length === 0 && !error && (
                            <div className="flex justify-center items-center h-full">
                                <Text variant="subtle">No smells detected, or scan not run.</Text>
                            </div>
                        )}
                        {smells.length > 0 && (
                            <Accordion type="multiple">
                                {smells.map((smell, i) => (
                                    <Accordion.Item key={i} value={`smell-${i}`}>
                                        <Accordion.Header>
                                            <div className="flex justify-between items-center w-full">
                                                <Text weight="bold">{smell.smell}</Text>
                                                <Badge variant={getSeverityVariant(smell.smell)}>Line: {smell.line}</Badge>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Content>
                                            <Text>{smell.explanation}</Text>
                                        </Accordion.Content>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        )}
                    </Panel.Content>
                </Panel.Section>
            </Grid>
        </Panel>
    );
};
