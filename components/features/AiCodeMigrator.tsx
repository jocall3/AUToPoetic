/**
 * @file AiCodeMigrator.tsx
 * @description This file contains the AiCodeMigrator feature component, which allows users to translate
 *              code between different languages and frameworks using an AI model. It offloads the AI processing
 *              to a web worker for better UI performance and uses the centralized UI component library.
 * @module components/features/AiCodeMigrator
 * @see {@link services/workerPoolManager} for task offloading.
 * @see {@link contexts/NotificationContext} for user feedback.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';

// Centralized application services and contexts
import { useNotification } from '../../contexts/NotificationContext';
import { workerPoolManager } from '../../services/workerPoolManager'; // Assuming a singleton instance
import { downloadFile } from '../../services/fileUtils';

// Shared & Core UI Components
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ArrowPathIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '../icons';

// --- Mock UI Components (Placeholders for proprietary UI library) ---
// These would be imported from '@core-ui', '@composite-ui' etc.
const Button: React.FC<any> = ({ children, ...props }) => <button {...props}>{children}</button>;
const Select: React.FC<{ label: string; options: { value: string; label: string }[]; value: string; onChange: (value: string) => void; }> = ({ label, options, value, onChange }) => (
  <div className="flex items-center gap-2">
    <label className="text-sm font-medium text-text-secondary">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="p-2 bg-background border border-border rounded-md text-sm">
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);
const TextArea: React.FC<any> = (props) => <textarea {...props} />;
const Card: React.FC<{ children: React.ReactNode, className?: string }> & { Header: React.FC<any>, Body: React.FC<any> } = ({ children, className }) => <div className={`border border-border rounded-lg bg-surface flex flex-col ${className}`}>{children}</div>;
Card.Header = ({ children, className }) => <div className={`p-4 border-b border-border flex-shrink-0 ${className}`}>{children}</div>;
Card.Body = ({ children, className }) => <div className={`flex-grow p-4 overflow-auto ${className}`}>{children}</div>;
// --- End Mock UI Components ---

const LANGUAGES: string[] = [
  'SASS', 'CSS', 'JavaScript', 'TypeScript', 'Python', 'Go', 'React',
  'Vue', 'Angular', 'Tailwind CSS', 'HTML', 'Java', 'C#', 'Rust', 'Ruby'
];

const EXAMPLE_CODE = `// SASS
$primary-color: #333;

body {
  color: $primary-color;
  font-family: sans-serif;
}`;

interface AiCodeMigratorProps {
  inputCode?: string;
  fromLang?: string;
  toLang?: string;
}

/**
 * A React component for migrating code from one language/framework to another using AI.
 * This component provides a UI for inputting code, selecting source and target languages,
 * and viewing the AI-generated output in real-time as it streams from a web worker.
 *
 * @component
 * @param {AiCodeMigratorProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered AiCodeMigrator component.
 * @security This component offloads AI interaction to a sandboxed Web Worker.
 *           The output is rendered via MarkdownRenderer which should handle sanitization.
 * @performance Offloads the computationally intensive AI streaming task to a web worker,
 *              preventing the main thread from blocking and ensuring a responsive UI.
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
  const activeTaskController = useRef<AbortController | null>(null);

  const handleMigrate = useCallback(async (code: string, from: string, to: string) => {
    if (!code.trim()) {
      addNotification('Input code cannot be empty.', 'error');
      return;
    }
    if (from === to) {
      addNotification('Source and target languages cannot be the same.', 'error');
      return;
    }

    if (activeTaskController.current) {
      activeTaskController.current.abort();
    }

    const controller = new AbortController();
    activeTaskController.current = controller;

    setIsLoading(true);
    setError('');
    setOutputCode('');

    try {
      const stream = workerPoolManager.streamTask(
        'code-migration',
        { code, from, to },
        { signal: controller.signal }
      );

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setOutputCode(fullResponse);
      }
      addNotification('Code migration complete!', 'success');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage = `Failed to migrate code: ${(err as Error).message}`;
        setError(errorMessage);
        addNotification(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
      if (activeTaskController.current === controller) {
        activeTaskController.current = null;
      }
    }
  }, [addNotification]);

  useEffect(() => {
    if (initialCode && initialFrom && initialTo) {
      handleMigrate(initialCode, initialFrom, initialTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      activeTaskController.current?.abort();
    };
  }, []);

  const languageOptions = LANGUAGES.map(lang => ({ value: lang, label: lang }));

  const handleDownload = () => {
    if (!outputCode) {
      addNotification('No code to download.', 'info');
      return;
    }
    const cleanCode = outputCode.replace(/^```[^
]*\n/, '').replace(/\n```$/, '').trim();
    const extension = toLang.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '') || 'txt';
    downloadFile(cleanCode, `migrated_code.${extension}`, 'text/plain');
    addNotification('File downloaded.', 'success');
  };

  const handleCopy = () => {
    if (!outputCode) {
      addNotification('No code to copy.', 'info');
      return;
    }
    const cleanCode = outputCode.replace(/^```[^
]*\n/, '').replace(/\n```$/, '').trim();
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
        <Card>
          <Card.Header>
            <Select label="From:" options={languageOptions} value={fromLang} onChange={setFromLang} />
          </Card.Header>
          <Card.Body>
            <TextArea
              value={inputCode}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputCode(e.target.value)}
              placeholder="Paste your source code here..."
              className="h-full w-full resize-none bg-background font-mono text-sm"
            />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="flex justify-between items-center">
            <Select label="To:" options={languageOptions} value={toLang} onChange={setToLang} />
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} disabled={!outputCode || isLoading} aria-label="Copy code" className="p-2"><ClipboardDocumentIcon /></Button>
              <Button onClick={handleDownload} disabled={!outputCode || isLoading} aria-label="Download code" className="p-2"><ArrowDownTrayIcon /></Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {isLoading && !outputCode && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
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
      
      <div className="mt-6 flex-shrink-0 flex justify-center">
        <Button
          onClick={() => handleMigrate(inputCode, fromLang, toLang)}
          disabled={isLoading}
          className="btn-primary w-full max-w-sm py-3 flex items-center justify-center gap-2"
        >
          {isLoading ? <LoadingSpinner /> : <><ArrowPathIcon />Migrate Code</>}
        </Button>
      </div>
    </div>
  );
};