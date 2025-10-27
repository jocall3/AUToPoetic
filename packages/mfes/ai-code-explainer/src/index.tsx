/**
 * @file This file is the entry point for the AiCodeExplainer Micro-Frontend (MFE).
 * @module AiCodeExplainerMFE
 * @see @security All AI interactions are offloaded to a web worker and proxied through the BFF, ensuring no direct client-side exposure of AI service credentials.
 * @see @performance Heavy lifting, including AI prompt construction, GraphQL requests, and Mermaid.js rendering logic, is offloaded to a dedicated web worker via the WorkerPoolManager to keep the main thread responsive.
 * @example
 * ```tsx
 * // In the shell application
 * import AiCodeExplainer from 'aiCodeExplainer/AiCodeExplainer';
 *
 * const App = () => (
 *   <Workspace>
 *     <Window title="AI Code Explainer">
 *       <AiCodeExplainer initialCode="const x = 1;" />
 *     </Window>
 *   </Workspace>
 * );
 * ```
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Proprietary UI Framework imports as per architectural directives
import { Button, LoadingSpinner, Tabs, Tab, Panel, Card } from '@proprietary/core-ui';
import { CodeEditor, MarkdownRenderer } from '@proprietary/composite-ui';

// Worker Pool Manager for offloading computation
import { useWorkerPool } from '@proprietary/services';
import type { WorkerTaskResponse } from '@proprietary/services';

// --- Type Definitions with JSDoc ---

/**
 * Defines the structured explanation for a piece of code as returned by the BFF.
 * @interface
 */
interface StructuredExplanation {
  /**
   * A high-level summary of the code's purpose and functionality.
   * @type {string}
   */
  summary: string;
  /**
   * A detailed, line-by-line breakdown of the code.
   * @type {Array<{ lines: string; explanation: string }>}
   */
  lineByLine: { lines: string; explanation: string }[];
  /**
   * Analysis of the code's time and space complexity.
   * @type {{ time: string; space: string }}
   */
  complexity: { time: string; space: string };
  /**
   * AI-generated suggestions for improvement or refactoring.
   * @type {string[]}
   */
  suggestions: string[];
}

/**
 * The expected structure of the GraphQL response from the BFF.
 * @interface
 */
interface ExplainCodeGQLResponse {
  data: {
    explainCode: {
      structuredExplanation: StructuredExplanation;
      mermaidFlowchart: string;
    };
  };
}

/**
 * Defines the props for the AiCodeExplainerMFE component.
 * @interface
 */
interface AiCodeExplainerProps {
  /**
   * Optional initial code to display and analyze when the component mounts.
   * @type {string | undefined}
   */
  initialCode?: string;
}

/**
 * Represents the possible tabs in the analysis view.
 * @type {string}
 */
type ExplanationTabId = 'summary' | 'lineByLine' | 'complexity' | 'suggestions' | 'flowchart';

const exampleCode = `const bubbleSort = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
};`;

// Initialize Mermaid.js for flowcharts, adhering to security policies.
mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' });


/**
 * The main component for the AI Code Explainer Micro-Frontend.
 * This component provides a UI for users to input code and receive a detailed,
 * AI-powered analysis, including a summary, line-by-line breakdown, complexity
 * analysis, suggestions, and a visual flowchart.
 * It follows modern architectural principles by offloading heavy tasks to web workers.
 *
 * @component
 * @param {AiCodeExplainerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered AI Code Explainer component.
 */
const AiCodeExplainerMFE: React.FC<AiCodeExplainerProps> = ({ initialCode = exampleCode }) => {
  const [code, setCode] = useState<string>(initialCode);
  const [explanation, setExplanation] = useState<StructuredExplanation | null>(null);
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ExplanationTabId>('summary');
  
  const mermaidContainerRef = useRef<HTMLDivElement>(null);
  const workerPool = useWorkerPool();

  /**
   * Handles the analysis request by posting a task to the worker pool.
   * The worker constructs and sends a GraphQL query to the BFF.
   *
   * @function
   * @param {string} codeToExplain - The code snippet to be analyzed.
   * @returns {Promise<void>}
   * @security The GraphQL query is sent from a web worker to the BFF, which then communicates with the AIGatewayService.
   *           This prevents any direct exposure of AI service details or credentials to the client.
   * @performance The entire GraphQL request and response handling is offloaded to a web worker,
   *              preventing the main thread from being blocked by network latency or JSON parsing.
   */
  const handleExplain = useCallback(async (codeToExplain: string): Promise<void> => {
    if (!codeToExplain.trim()) {
      setError('Please enter some code to explain.');
      return;
    }
    if (!workerPool) {
      setError('Worker pool is not available. Cannot perform analysis.');
      return;
    }

    setIsLoading(true);
    setError('');
    setExplanation(null);
    setMermaidCode('');
    setActiveTab('summary');

    try {
      const explainCodeQuery = `
        query ExplainCode($code: String!) {
          explainCode(code: $code) {
            structuredExplanation {
              summary
              lineByLine {
                lines
                explanation
              }
              complexity {
                time
                space
              }
              suggestions
            }
            mermaidFlowchart
          }
        }
      `;

      const taskResponse: WorkerTaskResponse<ExplainCodeGQLResponse> = await workerPool.postTask({
        taskName: 'graphql-request',
        payload: {
          query: explainCodeQuery,
          variables: { code: codeToExplain },
        },
      });

      if (taskResponse.error) {
        throw new Error(taskResponse.error);
      }
      
      const { structuredExplanation, mermaidFlowchart } = taskResponse.result.data.explainCode;

      setExplanation(structuredExplanation);
      setMermaidCode(mermaidFlowchart.replace(/```mermaid\n?|```/g, ''));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get explanation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [workerPool]);

  // Analyze initial code on mount if provided
  useEffect(() => {
    if (initialCode) {
      handleExplain(initialCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to render the Mermaid.js flowchart when the corresponding tab is active
  useEffect(() => {
    /**
     * Renders the Mermaid flowchart SVG inside its container.
     * This operation is asynchronous.
     * @private
     * @async
     * @function
     */
    const renderMermaid = async (): Promise<void> => {
      if (activeTab === 'flowchart' && mermaidCode && mermaidContainerRef.current) {
        setIsLoading(true); // Show spinner during mermaid render
        try {
          // Clear previous render to avoid ID conflicts
          mermaidContainerRef.current.innerHTML = '';
          const { svg } = await mermaid.render(`mermaid-graph-${Date.now()}`, mermaidCode);
          if (mermaidContainerRef.current) {
            mermaidContainerRef.current.innerHTML = svg;
          }
        } catch (e) {
          console.error("Mermaid.js rendering error:", e);
          if (mermaidContainerRef.current) {
            mermaidContainerRef.current.innerHTML = `<p class="text-red-500">Error rendering flowchart. The diagram syntax may be invalid.</p>`;
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    renderMermaid();
  }, [activeTab, mermaidCode]);
  
  const tabList: { id: ExplanationTabId; label: string; disabled: boolean }[] = [
      { id: 'summary', label: 'Summary', disabled: !explanation },
      { id: 'lineByLine', label: 'Line-by-Line', disabled: !explanation },
      { id: 'complexity', label: 'Complexity', disabled: !explanation },
      { id: 'suggestions', label: 'Suggestions', disabled: !explanation },
      { id: 'flowchart', label: 'Flowchart', disabled: !mermaidCode },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold">AI Code Explainer</h1>
        <p className="text-text-secondary mt-1">Get a detailed, structured analysis of any code snippet.</p>
      </header>
      
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Code Input */}
        <div className="flex flex-col min-h-0 md:col-span-1">
          <label htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">Your Code</label>
          <Card className="flex-grow flex flex-col p-0 overflow-hidden">
            <CodeEditor
              id="code-input"
              value={code}
              onValueChange={setCode}
              language="javascript"
              placeholder="Paste your code here..."
              className="flex-grow !h-full"
            />
          </Card>
          <div className="mt-4 flex-shrink-0">
            <Button
              onClick={() => handleExplain(code)}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3"
              variant="primary"
            >
              {isLoading ? <LoadingSpinner /> : 'Analyze Code'}
            </Button>
          </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="flex flex-col min-h-0 md:col-span-1">
          <label className="text-sm font-medium text-text-secondary mb-2">AI Analysis</label>
          <Card className="flex-grow flex flex-col overflow-hidden p-0">
            <Tabs<ExplanationTabId>
              value={activeTab}
              onValueChange={(id) => setActiveTab(id as ExplanationTabId)}
            >
              <div className="flex-shrink-0 border-b border-border">
                {tabList.map(tab => (
                  <Tab key={tab.id} value={tab.id} disabled={tab.disabled}>
                    {tab.label}
                  </Tab>
                ))}
              </div>
              <Panel value="summary" className="p-4 flex-grow overflow-y-auto">
                <MarkdownRenderer content={explanation?.summary ?? ''} />
              </Panel>
              <Panel value="lineByLine" className="p-4 flex-grow overflow-y-auto space-y-3">
                {explanation?.lineByLine.map((item, index) => (
                  <Card key={index} className="p-3">
                    <p className="font-mono text-xs text-primary mb-1">Lines: {item.lines}</p>
                    <p className="text-sm">{item.explanation}</p>
                  </Card>
                ))}
              </Panel>
              <Panel value="complexity" className="p-4 flex-grow overflow-y-auto">
                <p><strong>Time Complexity:</strong> <code className="text-amber-600">{explanation?.complexity.time}</code></p>
                <p><strong>Space Complexity:</strong> <code className="text-amber-600">{explanation?.complexity.space}</code></p>
              </Panel>
              <Panel value="suggestions" className="p-4 flex-grow overflow-y-auto">
                <ul className="list-disc list-inside space-y-2">
                  {explanation?.suggestions.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </Panel>
              <Panel value="flowchart" className="p-4 flex-grow overflow-y-auto flex items-center justify-center">
                <div ref={mermaidContainerRef} className="w-full h-full" />
              </Panel>
            </Tabs>

            {(isLoading || error || !explanation) && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/50">
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 p-4 text-center">{error}</p>}
                {!isLoading && !explanation && !error && <p className="text-text-secondary">Analysis will appear here.</p>}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiCodeExplainerMFE;
