/**
 * @file CodeFormatter.tsx
 * @module components/features/CodeFormatter
 * @description This file contains the CodeFormatter feature component, which allows users
 * to format code snippets using an AI-powered service. It has been refactored to align
 * with the new micro-frontend and microservice architecture.
 *
 * @security This component sends user-provided code to the backend BFF for processing.
 * The BFF is responsible for sanitizing and handling this data securely before passing it to any
 * downstream AI services. All communication is over authenticated GraphQL.
 *
 * @performance The component uses a streaming mutation to receive the formatted code,
 * improving perceived performance by rendering content as it arrives.
 * Markdown-to-HTML conversion for rendering the formatted code is offloaded to a
 * dedicated web worker to prevent blocking the main thread, as per architectural directives.
 *
 * @see services/worker/WorkerPoolManager.ts
 * @see hooks/useBffStreamingMutation.ts
 * @example
 * <CodeFormatter />
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useBffStreamingMutation } from 'hooks/useBffStreamingMutation'; // Assumed hook for BFF communication
import { useWorkerPool } from 'services/worker/WorkerPoolManager'; // Assumed service and hook

// Abstracted UI Components from proprietary UI framework
import { Button } from 'core-ui/Button';
import { CodeEditor } from 'composite-ui/CodeEditor';
import { Header } from 'composite-ui/Header';
import { Panel, PanelContent, PanelHeader } from 'composite-ui/Panel';
import { Spinner } from 'core-ui/Spinner';
import { CodeBracketSquareIcon } from 'core-ui/icons';

/**
 * A sample of unformatted code to serve as a placeholder for the user.
 * @type {string}
 */
const exampleCode = `const MyComponent = (props) => {
  const {name, items}=props
    if(!items || items.length === 0){
  return <p>No items found for {name}</p>;
    }
  return <ul>{items.map(item=> <li key={item.id}>{item.name}</li>)}</ul>
}`;

/**
 * GraphQL mutation for code formatting, sent to the BFF.
 * @type {string}
 */
const FORMAT_CODE_MUTATION = `
  mutation FormatCode($code: String!) {
    formatCode(code: $code)
  }
`;

/**
 * @interface WorkerizedMarkdownRendererProps
 * @description Props for the WorkerizedMarkdownRenderer component.
 */
interface WorkerizedMarkdownRendererProps {
  /** The raw markdown content to be rendered. */
  content: string;
}

/**
 * Renders Markdown content by offloading the parsing process to a web worker.
 * This component adheres to the architectural directive to move significant computations
 * off the main thread.
 *
 * @param {WorkerizedMarkdownRendererProps} props - The component props.
 * @returns {React.ReactElement} The rendered HTML or a spinner while parsing.
 * @example <WorkerizedMarkdownRenderer content="# Hello" />
 */
const WorkerizedMarkdownRenderer: React.FC<WorkerizedMarkdownRendererProps> = ({ content }) => {
  const [html, setHtml] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const workerPool = useWorkerPool();

  useEffect(() => {
    if (!content) {
      setHtml('');
      return;
    }

    let isCancelled = false;
    setIsParsing(true);

    workerPool.enqueueTask<{ markdown: string }, string>('markdownToHtml', { markdown: content })
      .then(parsedHtml => {
        if (!isCancelled) {
          setHtml(parsedHtml);
        }
      })
      .catch(err => {
        console.error('Markdown parsing worker failed:', err);
        if (!isCancelled) {
          setHtml('<p style="color: red;">Error parsing markdown content.</p>');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsParsing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [content, workerPool]);

  if (isParsing && !html) { // Only show spinner on initial parse
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }

  // NOTE: In a real UI library, we'd use a dedicated 'RichText' or 'HtmlContent' component
  // that is designed to be safe against XSS. `dangerouslySetInnerHTML` is used here
  // as per the original component's pattern, assuming the worker's markdown parser sanitizes output.
  return <div className="prose prose-sm max-w-none prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
};

/**
 * The CodeFormatter component provides a user interface for formatting code snippets using an AI service.
 * It features two side-by-side code editors for input and output, and leverages a streaming
 * GraphQL mutation to the BFF for the formatting logic.
 *
 * @returns {React.ReactElement} The rendered CodeFormatter feature.
 */
export const CodeFormatter: React.FC = () => {
    const [inputCode, setInputCode] = useState<string>(exampleCode);
    const [formattedCode, setFormattedCode] = useState<string>('');
    
    const { stream, isLoading, error } = useBffStreamingMutation<string>(FORMAT_CODE_MUTATION);

    /**
     * Handles the code formatting request. It initiates a streaming mutation to the BFF
     * and updates the state with the formatted code as it arrives.
     * @type {() => Promise<void>}
     */
    const handleFormat = useCallback(async () => {
        if (!inputCode.trim()) {
            return;
        }
        
        setFormattedCode('');

        const streamReader = stream({ variables: { code: inputCode } });

        try {
            for await (const chunk of streamReader) {
                // The BFF streams markdown which includes the code block delimiters.
                setFormattedCode(prev => prev + chunk);
            }
        } catch (err) {
            // Error is already handled by the useBffStreamingMutation hook
            console.error("Streaming failed in component:", err);
        }
    }, [inputCode, stream]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
            <Header
                icon={<CodeBracketSquareIcon />}
                title="AI Code Formatter"
                description="Clean up your code with AI-powered formatting, like a smart Prettier."
            />
            <div className="flex-grow flex flex-col min-h-0 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                    <Panel className="flex flex-col h-full">
                        <PanelHeader>Input</PanelHeader>
                        <PanelContent className="flex-grow !p-0">
                            <CodeEditor
                                language="javascript"
                                value={inputCode}
                                onChange={(value) => setInputCode(value || '')}
                            />
                        </PanelContent>
                    </Panel>
                    <Panel className="flex flex-col h-full">
                        <PanelHeader>Output</PanelHeader>
                        <PanelContent className="flex-grow overflow-y-auto">
                           {(isLoading && !formattedCode) && (
                                <div className="flex items-center justify-center h-full">
                                    <Spinner />
                                </div>
                            )}
                            {error && <p className="p-4 text-red-500">{error.message}</p>}
                            {formattedCode && <WorkerizedMarkdownRenderer content={formattedCode} />}
                            {!isLoading && !formattedCode && !error && (
                                <div className="text-text-secondary h-full flex items-center justify-center">
                                    Formatted code will appear here.
                                </div>
                            )}
                        </PanelContent>
                    </Panel>
                </div>
                 <div className="flex-shrink-0 mt-4 text-center">
                    <Button
                        onClick={handleFormat}
                        disabled={isLoading}
                        className="w-full max-w-sm"
                        size="large"
                    >
                        {isLoading ? <Spinner isCentered={true} /> : 'Format Code'}
                    </Button>
                 </div>
            </div>
        </div>
    );
};