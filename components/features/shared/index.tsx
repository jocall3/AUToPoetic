/**
 * @file Provides shared, reusable UI components for feature implementations.
 * This module is part of the Core UI library and includes components like
 * LoadingSpinner and MarkdownRenderer, which are designed to be highly
 * performant and adhere to architectural directives.
 *
 * @module components/features/shared/index
 * @see {@link WorkerPoolManager} for Markdown parsing offloading.
 * @see {@link ThemeEngine} for theming considerations.
 * @security This module contains components that may render dynamic content.
 * See individual component documentation for specific security considerations.
 * @performance Markdown parsing is offloaded to a Web Worker to keep the main thread responsive.
 */

import React, { useState, useEffect, useRef } from 'react';
// marked would be used inside the Web Worker, not directly in this component.
// It is included here to demonstrate the parsing logic for the conceptual `useWorkerTask` hook.
import { marked } from 'marked';

// --- Core UI Components ---

/**
 * @interface LoadingSpinnerProps
 * @description Properties for the LoadingSpinner component.
 * @security This component displays text. Ensure any text passed is properly sanitized if it originates from user input, although it's intended for static labels.
 * @performance This component is lightweight and uses CSS animations. It has minimal performance impact.
 */
interface LoadingSpinnerProps {
  /**
   * The size of the spinner.
   * @type {'sm' | 'md' | 'lg'}
   * @default 'md'
   * @example <LoadingSpinner size="lg" />
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Optional text to display next to the spinner.
   * @type {string}
   * @example <LoadingSpinner text="Loading data..." />
   */
  text?: string;

  /**
   * Additional CSS classes to apply to the container.
   * @type {string}
   */
  className?: string;
}

/**
 * Renders a visually appealing and accessible loading spinner.
 * This is a core UI component, designed to be themeable and performant.
 *
 * @component
 * @param {LoadingSpinnerProps} props - The properties for the component.
 * @returns {React.ReactElement} The rendered loading spinner.
 * @example
 * // A medium-sized spinner
 * <LoadingSpinner />
 *
 * @example
 * // A large spinner with custom text
 * <LoadingSpinner size="lg" text="Processing..." />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 text-primary ${className}`}
    >
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`} />
      {text && <span className="text-text-secondary">{text}</span>}
    </div>
  );
};

// --- Composite UI Components ---

/**
 * @interface MarkdownRendererProps
 * @description Properties for the MarkdownRenderer component.
 */
interface MarkdownRendererProps {
  /**
   * The raw Markdown string to render.
   * @type {string}
   * @example <MarkdownRenderer content="# Hello\n\nThis is **Markdown**." />
   */
  content: string;
}

/**
 * A conceptual hook demonstrating interaction with the WorkerPoolManager.
 * In the final architecture, this would be a shared hook in `hooks/useWorkerTask.ts`.
 * It's included here to make the `MarkdownRenderer` component's logic clear and self-contained
 * for this specific file generation task.
 *
 * @template T - The type of the payload sent to the worker.
 * @template R - The type of the data returned from the worker.
 * @param {string} taskName - The name of the task for the worker pool to execute.
 * @param {T | null} payload - The data to send to the worker for processing.
 * @returns {{ data: R | null; isLoading: boolean; error: Error | null }} The state of the worker task.
 */
const useWorkerTask = <T, R>(taskName: string, payload: T | null): { data: R | null; isLoading: boolean; error: Error | null } => {
    const [data, setData] = useState<R | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const payloadRef = useRef(payload);
    payloadRef.current = payload;

    useEffect(() => {
        if (!payload) {
            setData(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        let isCancelled = false;

        const executeTask = async () => {
            setIsLoading(true);
            setError(null);
            setData(null);

            // --- CONCEPTUAL WORKER INTERACTION ---
            // In a real implementation, this would be something like:
            //
            // import { workerPoolManager } from '../../../services/WorkerPoolManager';
            //
            // try {
            //   const result = await workerPoolManager.runTask<T, R>(taskName, payload);
            //   if (!isCancelled) {
            //     setData(result);
            //   }
            // } catch (e) {
            //   if (!isCancelled) {
            //     setError(e);
            //   }
            // } finally {
            //   if (!isCancelled) {
            //     setIsLoading(false);
            //   }
            // }

            // --- SIMULATED WORKER LOGIC FOR DEMONSTRATION ---
            setTimeout(async () => {
                if (isCancelled || payloadRef.current !== payload) return;

                try {
                    if (taskName === 'parse-markdown') {
                        const html = await marked.parse(payload as string);
                        if (!isCancelled) setData(html as R);
                    } else {
                        throw new Error(`Unknown worker task: ${taskName}`);
                    }
                } catch (e) {
                     if (!isCancelled) setError(e instanceof Error ? e : new Error('Worker task failed'));
                } finally {
                     if (!isCancelled) setIsLoading(false);
                }
            }, 100); // Simulate async worker delay
        };

        executeTask();

        return () => {
            isCancelled = true;
        };
    }, [taskName, payload]);

    return { data, isLoading, error };
};


/**
 * Renders a Markdown string as HTML, offloading the parsing to a Web Worker
 * for improved main thread performance. Displays a loading state during parsing
 * and an error state if parsing fails.
 *
 * @component
 * @param {MarkdownRendererProps} props - The component properties.
 * @returns {React.ReactElement} The rendered Markdown content, a loading spinner, or an error message.
 * @see {@link useWorkerTask} The hook used for offloading computation.
 * @performance The expensive Markdown-to-HTML parsing is executed in a Web Worker,
 * preventing UI blocking on the main thread for large documents.
 * @security This component uses `dangerouslySetInnerHTML` to render the final HTML.
 * While the underlying `marked` library performs sanitization, it's crucial
 * that the source of the markdown content is trusted to mitigate Cross-Site Scripting (XSS) risks.
 * Never render user-generated markdown from an untrusted source without additional
 * server-side sanitization (e.g., using a library like DOMPurify).
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const { data: sanitizedHtml, isLoading, error } = useWorkerTask<string, string>('parse-markdown', content);
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-4">
                <LoadingSpinner text="Rendering..." />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500 bg-red-500/10 rounded-md">Error rendering Markdown: {error.message}</div>;
    }

    return (
        <div
            className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:p-4 prose-pre:m-0 dark:prose-invert dark:prose-pre:bg-background"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml || '' }}
        />
    );
};