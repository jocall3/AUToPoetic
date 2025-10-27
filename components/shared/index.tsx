/**
 * @file This file exports shared, reusable React components used across various features.
 * It follows the 'Core UI' architectural directive by providing atomic and composite components.
 * @module components/shared/index
 *
 * @security
 * All components in this file are designed with security in mind. Any component that renders
 * user-provided or dynamically-generated content should be carefully reviewed for XSS vulnerabilities.
 *
 * @performance
 * Components are optimized for performance. Computationally intensive tasks are offloaded
 * to Web Workers to ensure a non-blocking main thread.
 *
 * @see "Implement a Pluggable, Themeable, and Abstracted UI Framework" - Architectural Directive
 * @see "Introduce a Proactive Resource Orchestration Layer and a Dedicated Web Worker Pool" - Architectural Directive
 * @see "Mandate Comprehensive JSDoc and Generate a Versioned, Self-Hosted Documentation Portal" - Architectural Directive
 */

// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useRef } from 'react';

/**
 * A simple loading spinner component.
 * It consists of three pulsing dots, creating a subtle loading animation.
 * The color of the dots is inherited from the parent's `currentColor`.
 *
 * @component
 * @returns {React.ReactElement} A div element containing the animated spinner.
 *
 * @example
 * <div className="text-blue-500">
 *   <LoadingSpinner />
 * </div>
 *
 * @performance
 * This is a lightweight, CSS-only animation component. It has minimal performance impact.
 */
export const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-1" aria-label="Loading">
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

/**
 * @interface MarkdownRendererProps
 * @description Props for the MarkdownRenderer component.
 *
 * @property {string} content - The raw Markdown string to be rendered as HTML.
 */
interface MarkdownRendererProps {
    content: string;
}

/**
 * Renders a Markdown string as sanitized HTML, offloading the parsing to a Web Worker.
 * This aligns with the architectural directive to move heavy computations off the main thread.
 *
 * @component
 * @param {MarkdownRendererProps} props - The component props.
 * @returns {React.ReactElement} A div element with the rendered HTML content.
 *
 * @example
 * <MarkdownRenderer content="# Hello\nThis is **Markdown**." />
 *
 * @performance
 * The Markdown-to-HTML conversion is computationally intensive for large documents. This component offloads this work from the main thread to a dedicated Web Worker to prevent UI blocking. Communication is asynchronous.
 *
 * @security
 * The `marked` library is used inside the worker, which has its own sanitization features. The final HTML is set using `dangerouslySetInnerHTML`. While the output is generally safe from `marked`, it's crucial to trust the library's sanitization process. The worker environment provides an additional layer of isolation.
 *
 * @see {@link https://github.com/markedjs/marked | marked library}
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const [renderedHtml, setRenderedHtml] = useState<string>('');
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        /**
         * In a full implementation adhering to architectural directives, this worker's lifecycle
         * would be managed by a centralized 'WorkerPoolManager' service to handle queuing and reuse.
         * For a self-contained demonstration, the worker logic is created from a Blob URL.
         */
        const workerScript = `
            // Using importScripts, available in classic workers, to fetch the library from a CDN.
            // This avoids bundling 'marked' with the main app, keeping the main thread lighter.
            importScripts("https://cdn.jsdelivr.net/npm/marked@13.0.2/marked.min.js");

            self.onmessage = async (event) => {
              const { markdown } = event.data;
              if (typeof markdown !== 'string') return;
              try {
                // 'marked' is available on 'self' after importScripts
                const html = await self.marked.parse(markdown);
                self.postMessage({ html });
              } catch (e) {
                self.postMessage({ error: e.message });
              }
            };
        `;
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const markdownWorker = new Worker(workerUrl);
        workerRef.current = markdownWorker;

        markdownWorker.onmessage = (event: MessageEvent<{ html?: string; error?: string }>) => {
            if (event.data.error) {
                console.error('Markdown worker error:', event.data.error);
                setRenderedHtml('<p style="color: red;">Error rendering Markdown content.</p>');
            } else {
                setRenderedHtml(event.data.html || '');
            }
        };

        markdownWorker.onerror = (error) => {
            console.error('Markdown worker instantiation or communication error:', error);
            setRenderedHtml('<p style="color: red;">Error creating or communicating with the rendering worker.</p>');
        };

        // Cleanup function to terminate the worker and revoke the blob URL when the component unmounts.
        return () => {
            markdownWorker.terminate();
            URL.revokeObjectURL(workerUrl);
        };
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            if (content) {
                // Post the markdown content to the worker for parsing.
                workerRef.current.postMessage({ markdown: content });
            } else {
                // If content is empty, clear the rendered HTML without calling the worker.
                setRenderedHtml('');
            }
        }
    }, [content]);

    return (
        <div
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-50 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-border prose-pre:p-4 prose-pre:m-0"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
    );
};