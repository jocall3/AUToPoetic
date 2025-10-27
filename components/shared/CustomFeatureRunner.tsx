/**
 * @file CustomFeatureRunner.tsx
 * @description This module provides a component for safely displaying and reviewing AI-generated custom features.
 * @module components/shared/CustomFeatureRunner
 * @see module:services/workerPool/workerPoolManager
 * @see module:types
 */

import React, { useState, useEffect } from 'react';
import type { CustomFeature } from '../../types';
// Assume the existence of a worker pool manager as per architectural directives.
import { workerPoolManager } from '../../services/workerPoolManager';
import { LoadingSpinner } from './LoadingSpinner';

interface CustomFeatureRunnerProps {
  /**
   * @property {CustomFeature} feature - The custom feature object to be displayed.
   * This object contains metadata and the raw code string of the generated component.
   */
  feature: CustomFeature;
}

/**
 * A safe component to display and review AI-generated features.
 *
 * It renders the feature's metadata and displays a syntax-highlighted version of the generated code.
 * All significant computations, such as syntax highlighting, are offloaded to a dedicated web worker pool
 * via the `workerPoolManager` service, adhering to architectural directives.
 *
 * @param {CustomFeatureRunnerProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered component for displaying a custom feature.
 *
 * @security
 * This component explicitly does NOT execute the provided `feature.code`. The code is treated as a string
 * and is only rendered for visual review. This prevents potential security vulnerabilities (e.g., XSS)
 * that could arise from dynamically executing untrusted, AI-generated code. The syntax-highlighted HTML
 * is inserted using `dangerouslySetInnerHTML`, but it is assumed that the syntax highlighting worker
 * properly sanitizes its output to prevent script injection.
 *
 * @performance
 * Syntax highlighting can be a CPU-intensive task for large code blocks. By offloading this computation
 * to a web worker, we keep the main UI thread responsive, preventing freezes and ensuring a smooth user experience.
 * A loading indicator is displayed while the worker processes the code.
 *
 * @example
 * ```tsx
 * const myFeature = {
 *   id: 'custom-1',
 *   name: 'My Custom Tool',
 *   description: 'A tool that does something amazing.',
 *   icon: 'SparklesIcon',
 *   code: 'const MyTool = () => <div>Amazing Tool</div>;'
 * };
 *
 * <CustomFeatureRunner feature={myFeature} />
 * ```
 */
export const CustomFeatureRunner: React.FC<CustomFeatureRunnerProps> = ({ feature }) => {
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feature || !feature.code) {
      setHighlightedCode('');
      setIsLoading(false);
      setError('No feature code provided to display.');
      return;
    }

    let isCancelled = false;
    const highlightCode = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // As per architectural directives, offload computation to the worker pool.
        const result = await workerPoolManager.submitTask({
          type: 'syntax-highlight',
          payload: {
            code: feature.code,
            language: 'tsx',
          },
        });

        if (!isCancelled) {
          setHighlightedCode(result.html);
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during syntax highlighting.';
          console.error("CustomFeatureRunner: Failed to highlight code in worker.", err);
          setError(errorMessage);
          // As a fallback, display the raw code without highlighting but escaped.
          setHighlightedCode(feature.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    highlightCode();

    return () => {
      isCancelled = true;
    };
  }, [feature]);

  return (
    <div className="p-4 h-full flex flex-col bg-background text-text-primary">
      <h2 className="text-xl font-bold">{feature.name}</h2>
      <p className="text-sm text-text-secondary mb-4">{feature.description}</p>
      
      <div className="flex-grow bg-surface border border-border rounded-md overflow-auto relative font-mono text-sm">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50">
            <LoadingSpinner />
          </div>
        )}
        
        {error && !isLoading && (
          <div className="p-4 text-red-500">
            <p><strong>Error displaying code:</strong> {error}</p>
          </div>
        )}

        {!isLoading && (
          <pre className="h-full w-full">
            <code
              className="language-tsx p-4 block h-full w-full"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        )}
      </div>

      <p className="text-xs text-center text-text-secondary mt-2">
        This is a preview of the generated code. A full component runner is not implemented for security reasons.
      </p>
    </div>
  );
};
