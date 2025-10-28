/**
 * @file TechDebtSonar.tsx
 * @description A feature component that analyzes code for "code smells" and technical debt.
 * This component has been refactored to align with the new architectural directives, including
 * offloading computation to a web worker and utilizing the proprietary UI framework.
 * @copyright James Burvel O'Callaghan III
 * @license Apache-2.0
 */

import React, { useState, useCallback } from 'react';

// Architectural imports
import { useNotification } from '../../contexts/NotificationContext';
import { useWorkerTask } from '../../hooks/useWorkerTask';
import type { CodeSmell } from '../../types';
import { MagnifyingGlassIcon, SparklesIcon } from '../icons';
import { LoadingSpinner } from '../shared';

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
 * @performance Offloads AI analysis to a dedicated web worker via the `useWorkerTask` hook to keep the main thread responsive.
 * @security The code is sent to a backend service for analysis; ensure no sensitive information is included in public-facing versions. The analysis itself happens on a secure, isolated backend.
 * @example
 * <TechDebtSonar />
 */
export const TechDebtSonar: React.FC = () => {
    const [code, setCode] = useState<string>(exampleCode);
    const [smells, setSmells] = useState<CodeSmell[]>([]);
    const { addNotification } = useNotification();
    const { result, isLoading, error, execute } = useWorkerTask<CodeSmell[]>('detectCodeSmells');

    /**
     * @function handleScan
     * @description Initiates a code smell analysis by executing a task in the web worker pool.
     * Manages the loading and error states of the component during the analysis.
     * @performance The actual AI call (`detectCodeSmells`) is executed in a web worker,
     * preventing UI blocking during the potentially long-running analysis.
     * @returns {Promise<void>} A promise that resolves when the scan is complete.
     * @security The code payload is passed to a worker, which then communicates with the BFF. Standard API security protocols apply.
     * @throws {Error} Propagates errors from the worker task for UI display.
     */
    const handleScan = useCallback(async () => {
        if (!code.trim()) {
            addNotification('Please provide code to scan.', 'warning');
            return;
        }
        setSmells([]);
        const scanResult = await execute(code);
        if (scanResult) {
            setSmells(scanResult);
            addNotification(`Analysis complete. Found ${scanResult.length} potential code smells.`, 'info');
        }
    }, [code, execute, addNotification]);

    /**
     * Determines the color for a badge based on the smell type.
     * @param {string} smell - The type of code smell.
     * @returns {'critical' | 'high' | 'medium' | 'low' | 'info'} The color variant for the Badge component.
     */
    const getSeverityVariant = (severity: string): 'critical' | 'high' | 'medium' | 'low' | 'info' => {
        const lowerSeverity = severity.toLowerCase();
        switch (lowerSeverity) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'info';
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <MagnifyingGlassIcon />
                    <span className="ml-3">Tech Debt Sonar</span>
                </h1>
                <p className="text-text-secondary mt-1">Scan code to find code smells, areas with high complexity, and get AI-powered suggestions.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 min-h-0">
                    <label htmlFor="code-to-analyze" className="text-sm font-medium text-text-secondary">Code to Analyze</label>
                    <textarea
                        id="code-to-analyze"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                        spellCheck="false"
                    />
                    <button onClick={handleScan} disabled={isLoading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> Scan for Code Smells</>}
                    </button>
                </div>
                <div className="flex flex-col min-h-0">
                    <label className="text-sm font-medium text-text-secondary">Detected Smells</label>
                    <div className="flex-grow p-2 bg-background border border-border rounded-lg overflow-y-auto mt-2">
                        {isLoading && (
                            <div className="flex justify-center items-center h-full">
                                <LoadingSpinner />
                                <span className='ml-2 text-text-secondary'>Analyzing...</span>
                            </div>
                        )}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {!isLoading && !error && result && result.length === 0 && (
                            <div className="flex justify-center items-center h-full">
                                <p className="text-text-secondary">No smells detected. Looks clean!</p>
                            </div>
                        )}
                        {result && result.length > 0 && (
                            <div className="space-y-2">
                                {result.map((smell, i) => (
                                    <details key={i} className="bg-surface rounded-md border border-border overflow-hidden">
                                        <summary className="p-3 cursor-pointer hover:bg-surface-hover flex justify-between items-center text-sm">
                                            <span className="font-semibold truncate pr-4">{smell.smell}</span>
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-${getSeverityVariant(smell.severity)}-500/10 text-${getSeverityVariant(smell.severity)}-500`}>{smell.severity}</span>
                                                <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-gray-500/10 text-text-secondary">Line: {smell.line}</span>
                                            </div>
                                        </summary>
                                        <div className="p-3 border-t border-border text-sm text-text-secondary">
                                            <p>{smell.explanation}</p>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
