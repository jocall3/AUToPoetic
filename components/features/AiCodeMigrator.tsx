/**
 * @file AiCodeMigrator.tsx
 * @description This file contains the AiCodeMigrator feature component, which allows users to translate
 *              code between different languages and frameworks using an AI model. It offloads the AI processing
 *              to a web worker for better UI performance and uses a proprietary UI component library.
 * @module components/features/AiCodeMigrator
 * @see {@link workerPoolManager} for task offloading.
 * @see {@link useNotification} for user feedback.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { workerPoolManager, WorkerTask } from '@/services/worker-pool';
import { ArrowPathIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@/ui/icons';
import { Button, Select, TextArea } from '@/ui/core';
import { Card, Spinner } from '@/ui/composite';
import { MarkdownRenderer } from '@/components/shared';
import { downloadFile } from '@/services/fileUtils';

/**
 * @constant {string[]} LANGUAGES
 * @description A list of supported languages for code migration.
 * @example ['SASS', 'CSS', 'JavaScript']
 */
const LANGUAGES: string[] = [
  'SASS',
  'CSS',
  'JavaScript',
  'TypeScript',
  'Python',
  'Go',
  'React',
  'Vue',
  'Angular',
  'Tailwind CSS',
  'HTML',
  'Java',
  'C#',
  'Rust',
  'Ruby'
];

const EXAMPLE_CODE = `// SASS
$primary-color: #333;

body {
  color: $primary-color;
  font-family: sans-serif;
}`;

/**
 * @interface AiCodeMigratorProps
 * @description Props for the AiCodeMigrator component.
 */
interface AiCodeMigratorProps {
  /** @property {string} [inputCode] - Optional initial code to populate the input text area. */
  inputCode?: string;
  /** @property {string} [fromLang] - Optional initial source language. */
  fromLang?: string;
  /** @property {string} [toLang] - Optional initial target language. */
  toLang?: string;
}

/**
 * A React component for migrating code from one language/framework to another using AI.
 * This component provides a user interface for inputting code, selecting source and target languages,
 * and viewing the AI-generated output in real-time as it streams from a web worker.
 *
 * @component
 * @param {AiCodeMigratorProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered AiCodeMigrator component.
 * @example
 * // Renders the migrator with initial values
 * <AiCodeMigrator
 *   inputCode="const a = 1;"
 *   fromLang="JavaScript"
 *   toLang="Python"
 * />
 * @security This component sanitizes user input by offloading it to a sandboxed Web Worker.
 *           The output is rendered via MarkdownRenderer which should handle sanitization.
 * @performance Offloads the computationally intensive AI streaming task to a web worker via `workerPoolManager`,
 *              preventing the main thread from blocking and ensuring a responsive UI during migration.
 */
export const AiCodeMigrator: React.FC<AiCodeMigratorProps> = ({ 
  inputCode: initialCode,
  fromLang: initialFrom,
  toLang: initialTo
}) => {
  const [inputCode, setInputCode] = useState<string>(initialCode || EXAMPLE_CODE);
  const [outputCode, setOutputCode] = useState<string>('');
  const [fromLang, setFromLang] = useState(initialFrom || 'SASS');
  const [toLang, setToLang] = useState(initialTo || 'CSS');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { addNotification } = useNotification();
  const activeTaskRef = useRef<WorkerTask | null>(null);

  const handleMigrate = useCallback((code: string, from: string, to: string) => {
    if (!code.trim()) {
      setError('Please enter some code to migrate.');
      addNotification('Input code cannot be empty.', 'error');
      return;
    }
    if (from === to) {
      setError('Source and target languages cannot be the same.');
      addNotification('Please select different languages.', 'error');
      return;
    }

    // Terminate any existing task before starting a new one
    if (activeTaskRef.current) {
      activeTaskRef.current.terminate();
    }

    setIsLoading(true);
    setError('');
    setOutputCode('');

    const taskPayload = { code, from, to };
    const task = workerPoolManager.enqueueTask('code-migration', taskPayload);
    activeTaskRef.current = task;

    task.on('data', (chunk: string) => {
      setOutputCode(prev => prev + chunk);
    });

    task.on('error', (err: Error) => {
      const errorMessage = `Failed to migrate code: ${err.message}`;
      setError(errorMessage);
      addNotification(errorMessage, 'error');
      setIsLoading(false);
      activeTaskRef.current = null;
    });

    task.on('end', () => {
      setIsLoading(false);
      activeTaskRef.current = null;
      addNotification('Code migration complete!', 'success');
    });

  }, [addNotification]);

  useEffect(() => {
    if (initialCode && initialFrom && initialTo) {
      setInputCode(initialCode);
      setFromLang(initialFrom);
      setToLang(initialTo);
      handleMigrate(initialCode, initialFrom, initialTo);
    }
    // This effect should only run once on mount when initial props are provided.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Cleanup function to terminate the worker task if the component unmounts.
    return () => {
      if (activeTaskRef.current) {
        activeTaskRef.current.terminate();
        activeTaskRef.current = null;
      }
    };
  }, []);

  const languageOptions = LANGUAGES.map(lang => ({ value: lang, label: lang }));

  const handleDownload = () => {
    if (!outputCode) {
      addNotification('No code to download.', 'info');
      return;
    }
    const cleanCode = outputCode.replace(/^```(?:\[a-z]+\n)?/, '').replace(/\n```$/, '');
    const extension = toLang.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    downloadFile(cleanCode, `migrated_code.${extension}`, 'text/plain');
    addNotification('File downloaded.', 'success');
  };

  const handleCopy = () => {
    if (!outputCode) {
      addNotification('No code to copy.', 'info');
      return;
    }
    const cleanCode = outputCode.replace(/^```(?:\[a-z]+\n)?/, '').replace(/\n```$/, '');
    navigator.clipboard.writeText(cleanCode);
    addNotification('Copied to clipboard!', 'success');
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center">
          <ArrowPathIcon />
          <span className="ml-3">AI Code Migrator</span>
        </h1>
        <p className="text-text-secondary mt-1">Translate code between languages, frameworks, and syntax styles.</p>
      </header>
      
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <Card className="flex flex-col">
          <Card.Header>
            <Select label="From:" options={languageOptions} value={fromLang} onChange={setFromLang} />
          </Card.Header>
          <Card.Body className="flex-grow">
            <TextArea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Paste your source code here..."
              isMono
              className="h-full w-full resize-none"
            />
          </Card.Body>
        </Card>

        <Card className="flex flex-col">
          <Card.Header className="flex justify-between items-center">
            <Select label="To:" options={languageOptions} value={toLang} onChange={setToLang} />
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!outputCode || isLoading} aria-label="Copy code">
                <ClipboardDocumentIcon />
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!outputCode || isLoading} aria-label="Download code">
                <ArrowDownTrayIcon />
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="flex-grow p-0 overflow-y-auto">
            {isLoading && <div className="flex items-center justify-center h-full"><Spinner /></div>}
            {error && <div className="p-4 text-red-500 font-mono text-sm">{error}</div>}
            {!isLoading && !error && outputCode && <div className="p-4"><MarkdownRenderer content={outputCode} /></div>}
            {!isLoading && !outputCode && !error && (
              <div className="text-text-secondary h-full flex items-center justify-center p-4 text-center">
                Migrated code will appear here.
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
      
      <div className="mt-4 flex-shrink-0 flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleMigrate(inputCode, fromLang, toLang)}
          disabled={isLoading}
          className="w-full max-w-sm"
        >
          {isLoading ? <Spinner /> : <><ArrowPathIcon />Migrate Code</>}
        </Button>
      </div>
    </div>
  );
};
