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

// --- Mock/Conceptual Imports for New Architecture ---
// In a real implementation, these would be imported from the respective libraries.

const useBffStreamingMutation = <T extends any>(mutation: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stream = useCallback(async function* (options: { variables: any }): AsyncGenerator<T, void, unknown> {
    setIsLoading(true);
    setError(null);
    console.log('BFF Streaming Mutation started:', { mutation, variables: options.variables });
    try {
      // Simulate a streaming response
      const formatted = `\`\`\`javascript\n// Formatted with AI!\nconst MyComponent = (props) => {\n  const { name, items } = props;\n\n  if (!items || items.length === 0) {\n    return <p>No items found for {name}</p>;\n  }\n\n  return (\n    <ul>\n      {items.map((item) => (\n        <li key={item.id}>{item.name}</li>\n      ))}\n    </ul>\n  );\n};\n\`\`\``;
      for (let i = 0; i < formatted.length; i += 10) {
        await new Promise(res => setTimeout(res, 20));
        yield formatted.substring(i, i + 10) as T;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown streaming error');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mutation]);

  return { stream, isLoading, error };
};

const useWorkerPool = () => {
  return {
    enqueueTask: async <P, R>(taskName: string, payload: P): Promise<R> => {
      if (taskName === 'markdownToHtml') {
        const { markdown } = payload as { markdown: string };
        // Simulate marked.js parsing
        const codeContent = markdown.replace(/^```[a-z]*\n|\n```$/g, '');
        const escaped = codeContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return Promise.resolve(`<pre><code>${escaped}</code></pre>` as R);
      }
      return Promise.reject('Unknown worker task');
    }
  };
};

const Button = (props: any) => <button {...props}>{props.children}</button>;
const CodeEditor = (props: any) => <textarea {...props} className="w-full h-full p-2 font-mono bg-gray-800 text-gray-200" />;
const Header = ({ icon, title, description }: any) => <div><h1 className="text-2xl font-bold flex items-center gap-2">{icon}{title}</h1><p className="text-gray-500">{description}</p></div>;
const Panel = ({ children, className }: any) => <div className={`flex flex-col ${className}`}>{children}</div>;
const PanelHeader = ({ children }: any) => <div className="p-2 border-b font-semibold">{children}</div>;
const PanelContent = ({ children, className }: any) => <div className={`flex-grow ${className}`}>{children}</div>;
const Spinner = (props: any) => <div>Loading...</div>;
const CodeBracketSquareIcon = () => <span>ðŸ”¥</span>;

// --- End Mock Imports ---

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

  return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
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
                setFormattedCode(prev => prev + chunk);
            }
        } catch (err) {
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
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputCode(e.target.value || '')}
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
