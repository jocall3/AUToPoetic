/**
 * @module AiUnitTestGenerator
 * @description This module provides the AiUnitTestGenerator micro-frontend, a tool for generating unit tests from source code using an AI backend service.
 * @security This component offloads all AI interactions to a Web Worker, which then communicates with a secure Backend-for-Frontend (BFF) via GraphQL. It does not handle any sensitive credentials directly. User input is treated as untrusted code and is passed to the worker for processing.
 * @performance The component uses a streaming approach to display results, improving perceived performance. All network requests and potential prompt construction logic are handled in a separate worker thread to keep the main UI thread responsive.
 * @see {WorkerPoolManager} for information on how tasks are managed.
 * @example
 * <AiUnitTestGenerator initialCode="const add = (a, b) => a + b;" />
 */

import React, { useState, useCallback, useEffect } from 'react';
import { generateUnitTestsStream } from '../../services/aiService';
import { BeakerIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * An example code snippet to display when the component is first loaded.
 * Used for demonstration purposes.
 * @const
 * @type {string}
 */
const EXAMPLE_CODE = `import React from 'react';

export const Greeting = ({ name }) => {
  if (!name) {
    return <div>Hello, Guest!</div>;
  }
  return <div>Hello, {name}!</div>;
};`;

/**
 * Props for the AiUnitTestGenerator component.
 * @interface AiUnitTestGeneratorProps
 * @property {string} [initialCode] - Optional initial code to populate the editor upon load.
 */
interface AiUnitTestGeneratorProps {
  initialCode?: string;
}

/**
 * The main component for the AI Unit Test Generator feature.
 * It provides a user interface for inputting code and displays the AI-generated unit tests.
 * All AI interactions are offloaded to a web worker to ensure a responsive UI.
 * @param {AiUnitTestGeneratorProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered AiUnitTestGenerator component.
 */
export const AiUnitTestGenerator: React.FC<AiUnitTestGeneratorProps> = ({ initialCode }) => {
  const [code, setCode] = useState<string>(initialCode || EXAMPLE_CODE);
  const [tests, setTests] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { addNotification } = useNotification();

  /**
   * Initiates the unit test generation process.
   * @function handleGenerate
   * @returns {void}
   */
  const handleGenerate = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to generate tests for.');
      addNotification('Source code cannot be empty.', 'error');
      return;
    }

    setIsLoading(true);
    setError('');
    setTests('');

    try {
      const stream = generateUnitTestsStream(code);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setTests(fullResponse);
      }
      addNotification('Test generation complete.', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      addNotification('Failed to generate tests.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [code, addNotification]);

  useEffect(() => {
    if (initialCode) {
      handleGenerate();
    }
  }, [initialCode, handleGenerate]);

  const cleanCodeForUtility = (markdown: string): string => {
    const codeBlockRegex = /```(?:[jt]sx?|javascript)?\n([\s\S]*?)```/;
    const match = markdown.match(codeBlockRegex);
    return match ? match[1].trim() : markdown.trim();
  };

  const handleCopy = useCallback(() => {
    if (!tests) return;
    navigator.clipboard.writeText(cleanCodeForUtility(tests));
    addNotification('Test code copied to clipboard!', 'success');
  }, [tests, addNotification]);

  const handleDownload = useCallback(() => {
    if (!tests) return;
    const content = cleanCodeForUtility(tests);
    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated.test.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('Downloading test file.', 'info');
  }, [tests, addNotification]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <BeakerIcon />
          <span className="ml-3">AI Unit Test Generator</span>
        </h1>
        <p className="text-text-secondary mt-1">Generate Vitest unit tests for your components and functions.</p>
      </header>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div className="flex flex-col h-full">
          <label htmlFor="source-code-input" className="text-sm font-medium text-text-secondary mb-2">Source Code</label>
          <textarea
            id="source-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Paste your code here..."
          />
          <button onClick={handleGenerate} disabled={isLoading} className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3">
            {isLoading ? <LoadingSpinner /> : 'Generate Tests'}
          </button>
        </div>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-text-secondary">Generated Tests</label>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} disabled={!tests || isLoading} className="p-1 text-text-secondary hover:text-primary disabled:opacity-50" title="Copy Code">
                <ClipboardDocumentIcon />
              </button>
              <button onClick={handleDownload} disabled={!tests || isLoading} className="p-1 text-text-secondary hover:text-primary disabled:opacity-50" title="Download File">
                <ArrowDownTrayIcon />
              </button>
            </div>
          </div>
          <div className="flex-grow p-1 bg-background border border-border rounded-lg overflow-auto">
            {isLoading && !tests && (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
                <span className="ml-2 text-text-secondary">AI is writing tests...</span>
              </div>
            )}
            {error && <div className="p-4 text-red-500 font-mono text-xs whitespace-pre-wrap">{error}</div>}
            {tests && <MarkdownRenderer content={tests} />}
            {!isLoading && !tests && !error && (
              <div className="flex items-center justify-center h-full text-text-secondary">
                Generated tests will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
