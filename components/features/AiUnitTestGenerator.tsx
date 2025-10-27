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
import { BeakerIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@/ui/core/Icons'; // Imagined icon library
import { Button, Panel, Header, Tooltip, ButtonGroup } from '@/ui/core'; // Imagined core UI library
import { CodeEditor, CodeViewer, TwoPanelLayout, LoadingIndicator, EmptyState, ErrorState } from '@/ui/composite'; // Imagined composite UI library
import { useNotification } from '@/ui/ThemeEngine'; // Imagined notification service from the ThemeEngine
import { workerPoolManager } from '@/services/WorkerPoolManager'; // Worker pool manager service
import { TaskMessage } from '@/types'; // Shared types for worker communication

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
  /**
   * @state
   * @description The source code input by the user, for which tests will be generated.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [code, setCode] = useState<string>(initialCode || EXAMPLE_CODE);

  /**
   * @state
   * @description The AI-generated unit test code, received as a stream and accumulated.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [tests, setTests] = useState<string>('');

  /**
   * @state
   * @description The loading state of the AI generation process.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * @state
   * @description Any error message that occurs during the generation process.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [error, setError] = useState<string>('');

  /**
   * @state
   * @description A unique ID for the current worker task, used to correlate messages.
   * @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]}
   */
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const { addNotification } = useNotification();

  /**
   * Cleans the AI-generated markdown to extract only the raw code for download or copying.
   * @function cleanCodeForUtility
   * @param {string} markdown - The markdown content from the AI.
   * @returns {string} The extracted code block content.
   * @performance A simple string manipulation with negligible performance impact.
   */
  const cleanCodeForUtility = (markdown: string): string => {
    const codeBlockRegex = /```(?:[jt]sx?|javascript)?\n([\s\S]*?)```/;
    const match = markdown.match(codeBlockRegex);
    return match ? match[1].trim() : markdown.trim();
  };

  /**
   * Initiates the unit test generation process by posting a task to the worker pool.
   * This function sets up the initial state for loading and clears previous results.
   * @function handleGenerate
   * @returns {void}
   * @security User-provided code is sent to a sandboxed worker, isolating it from the main thread. The worker is responsible for secure communication with the BFF.
   * @performance Offloads the entire generation process to a web worker, keeping the UI thread free. The initial task posting is negligible.
   */
  const handleGenerate = useCallback(() => {
    if (!code.trim()) {
      setError('Please enter some code to generate tests for.');
      addNotification('Source code cannot be empty.', 'error');
      return;
    }

    if (currentTaskId) {
      workerPoolManager.terminateTask(currentTaskId);
    }

    setIsLoading(true);
    setError('');
    setTests('');

    const taskId = `unit-test-${Date.now()}`;
    setCurrentTaskId(taskId);

    workerPoolManager.postTask<string>({
      taskId,
      type: 'GENERATE_UNIT_TESTS_STREAM',
      payload: code,
    });
  }, [code, currentTaskId, addNotification]);

  /**
   * An effect hook to listen for messages from the web worker.
   * It handles incoming stream chunks, errors, and completion signals from the active task.
   * @effect
   */
  useEffect(() => {
    if (!currentTaskId) return;

    /**
     * Processes messages from the worker pool, updating the component's state accordingly.
     * @handler
     * @param {MessageEvent<TaskMessage<string>>} event - The message event from the worker.
     */
    const handleWorkerMessage = (event: MessageEvent<TaskMessage<string>>) => {
      const { taskId, type, payload, error } = event.data;
      if (taskId !== currentTaskId) return; // Ignore messages from stale tasks

      switch (type) {
        case 'STREAM_CHUNK':
          setTests(prev => prev + payload);
          break;
        case 'STREAM_ERROR':
          setError(error || 'An unknown error occurred in the worker.');
          addNotification('Failed to generate tests.', 'error');
          setIsLoading(false);
          setCurrentTaskId(null);
          break;
        case 'STREAM_COMPLETE':
          setIsLoading(false);
          setCurrentTaskId(null);
          addNotification('Test generation complete.', 'success');
          break;
      }
    };

    workerPoolManager.addEventListener('message', handleWorkerMessage);

    return () => {
      workerPoolManager.removeEventListener('message', handleWorkerMessage);
      if (currentTaskId) {
        workerPoolManager.terminateTask(currentTaskId);
      }
    };
  }, [currentTaskId, addNotification]);

  /**
   * Copies the generated test code to the user's clipboard.
   * @function handleCopy
   * @returns {void}
   */
  const handleCopy = useCallback(() => {
    if (!tests) return;
    navigator.clipboard.writeText(cleanCodeForUtility(tests));
    addNotification('Test code copied to clipboard!', 'success');
  }, [tests, addNotification]);

  /**
   * Triggers a file download of the generated test code.
   * @function handleDownload
   * @returns {void}
   */
  const handleDownload = useCallback(() => {
    if (!tests) return;
    const content = cleanCodeForUtility(tests);
    // A real implementation would use a service from the Infrastructure layer
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
    <TwoPanelLayout>
      <TwoPanelLayout.Left>
        <Panel className="h-full flex flex-col">
          <Header title="Source Code" />
          <CodeEditor
            value={code}
            onChange={setCode}
            language="javascript"
            className="flex-grow"
          />
          <Panel.Footer>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              icon={<BeakerIcon />}
              className="w-full"
              aria-label="Generate Unit Tests"
            >
              {isLoading ? 'Generating...' : 'Generate Unit Tests'}
            </Button>
          </Panel.Footer>
        </Panel>
      </TwoPanelLayout.Left>

      <TwoPanelLayout.Right>
        <Panel className="h-full flex flex-col">
          <Header title="Generated Tests">
            <ButtonGroup>
              <Tooltip content="Copy Code">
                <Button variant="ghost" onClick={handleCopy} disabled={isLoading || !tests} aria-label="Copy generated tests">
                  <ClipboardDocumentIcon />
                </Button>
              </Tooltip>
              <Tooltip content="Download File">
                <Button variant="ghost" onClick={handleDownload} disabled={isLoading || !tests} aria-label="Download generated tests">
                  <ArrowDownTrayIcon />
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Header>
          <Panel.Content className="p-0">
            {isLoading && !tests && <LoadingIndicator text="AI is generating tests..." />}
            {error && <ErrorState message={error} />}
            {tests && <CodeViewer code={`\`\`\`tsx\n${cleanCodeForUtility(tests)}\n\`\`\``} language="javascript" className="flex-grow" />}
            {!isLoading && !tests && !error && <EmptyState message="The generated tests will appear here." />}
          </Panel.Content>
        </Panel>
      </TwoPanelLayout.Right>
    </TwoPanelLayout>
  );
};
