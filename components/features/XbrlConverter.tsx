/**
 * @file Renders the XbrlConverter feature component, which leverages AI to convert JSON to XBRL-like XML.
 * @module components/features/XbrlConverter
 * @see module:services/workerPool/workerPoolManager for the underlying conversion logic.
 * @see module:hooks/useNotification for user feedback on actions.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { workerPoolManager } from '../../services/index.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { downloadFile } from '../../services/fileUtils.ts';
import { XbrlConverterIcon, ClipboardDocumentIcon, ArrowDownTrayIcon } from '../icons.tsx';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index.tsx';

const exampleJson = `{
  "company": "ExampleCorp",
  "year": 2024,
  "quarter": 2,
  "revenue": {
    "amount": 1500000,
    "currency": "USD"
  },
  "profit": {
    "amount": 250000,
    "currency": "USD"
  }
}`;

/**
 * @interface XbrlConverterProps
 * @description Props for the XbrlConverter component.
 * @property {string} [jsonInput] - Optional initial JSON string to populate the input field.
 */
interface XbrlConverterProps {
  jsonInput?: string;
}

/**
 * A React component that allows users to convert JSON data into a simplified, XBRL-like XML format.
 * The conversion is performed by an AI model, and the task is offloaded to a web worker for better performance.
 *
 * @param {XbrlConverterProps} props - The component props.
 *
 * @example
 * // Renders the converter with a default example
 * <XbrlConverter />
 *
 * @example
 * // Renders the converter with a pre-filled JSON string
 * const myJson = '{"data": "example"}';
 * <XbrlConverter jsonInput={myJson} />
 *
 * @security
 * - All AI interactions are offloaded to a Web Worker, isolating them from the main UI thread.
 * - The input JSON is treated as plain text and sent to the worker; no `eval()` or direct script execution is performed on the input.
 * - The output from the AI is sanitized and rendered as a string within a Markdown component, mitigating XSS risks.
 *
 * @performance
 * - The core AI conversion logic is executed in a dedicated Web Worker via the `workerPoolManager`. This prevents the main UI thread from blocking during potentially long-running AI tasks.
 * - The AI response is streamed back from the worker, allowing the UI to update progressively and improving perceived performance.
 */
export const XbrlConverter: React.FC<XbrlConverterProps> = ({ jsonInput: initialJsonInput }) => {
    const [jsonInput, setJsonInput] = useState<string>(initialJsonInput || exampleJson);
    const [xbrlOutput, setXbrlOutput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const { addNotification } = useNotification();

    /**
     * Cleans the AI-generated output by removing markdown code fences.
     * @param {string} rawOutput - The raw string from the AI, potentially wrapped in markdown.
     * @returns {string} The cleaned XML string.
     */
    const cleanXbrlOutput = (rawOutput: string): string => {
        return rawOutput.replace(/^```xml\n?|```$/g, '').trim();
    };

    /**
     * @function handleConvert
     * @description Initiates the JSON to XBRL conversion by submitting a task to the worker pool manager.
     * It handles UI state updates for loading, errors, and streams the response to the output field.
     * @param {string} jsonToConvert - The JSON string to be converted.
     * @returns {Promise<void>}
     */
    const handleConvert = useCallback(async (jsonToConvert: string) => {
        if (!jsonToConvert.trim()) {
            setError('Please enter valid JSON to convert.');
            return;
        }
        try {
            JSON.parse(jsonToConvert);
        } catch (e) {
            setError('Invalid JSON format. Please check your input.');
            return;
        }

        setIsLoading(true);
        setError('');
        setXbrlOutput('');

        try {
            const stream = workerPoolManager.streamTask('CONVERT_JSON_TO_XBRL', { json: jsonToConvert });
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setXbrlOutput(fullResponse);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to convert: ${errorMessage}`);
            addNotification('Conversion failed', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        if (initialJsonInput) {
            handleConvert(initialJsonInput);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialJsonInput]);

    const handleCopy = useCallback(() => {
        const codeToCopy = cleanXbrlOutput(xbrlOutput);
        navigator.clipboard.writeText(codeToCopy);
        addNotification('XBRL output copied to clipboard!', 'success');
    }, [xbrlOutput, addNotification]);

    const handleDownload = useCallback(() => {
        const codeToDownload = cleanXbrlOutput(xbrlOutput);
        downloadFile(codeToDownload, 'output.xml', 'application/xml');
        addNotification('XBRL file download started.', 'info');
    }, [xbrlOutput, addNotification]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <XbrlConverterIcon />
                    <span className="ml-3">JSON to XBRL Converter</span>
                </h1>
                <p className="text-text-secondary mt-1">Convert JSON data into a simplified XBRL-like XML format using AI.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col min-h-0">
                    <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">JSON Input</label>
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-text-secondary">XBRL-like XML Output</label>
                        {xbrlOutput && !isLoading && (
                            <div className="flex items-center gap-2">
                                <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600">
                                    <ClipboardDocumentIcon className="w-4 h-4" /> Copy
                                </button>
                                <button onClick={handleDownload} className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600">
                                    <ArrowDownTrayIcon className="w-4 h-4" /> Download
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="relative flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !xbrlOutput && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500 font-mono text-xs">{error}</p>}
                        {xbrlOutput && <MarkdownRenderer content={'```xml\n' + cleanXbrlOutput(xbrlOutput) + '\n```'} />}
                        {!isLoading && !xbrlOutput && !error && <div className="text-text-secondary h-full flex items-center justify-center">Output will appear here.</div>}
                    </div>
                </div>
            </div>
            <div className="flex-shrink-0 mt-6 text-center">
                <button
                    onClick={() => handleConvert(jsonInput)}
                    disabled={isLoading}
                    className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center px-6 py-3"
                >
                    {isLoading ? <LoadingSpinner /> : 'Convert to XBRL'}
                </button>
            </div>
        </div>
    );
};
