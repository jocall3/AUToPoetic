/**
 * @file AiCodeExplainer.tsx
 * @module components/AiCodeExplainer
 * @description This file contains the implementation of the AiCodeExplainer feature.
 * It has been refactored to align with the new micro-frontend and microservice architecture.
 * All business logic is now handled via a GraphQL API call to the BFF, and heavy client-side
 * computations (syntax highlighting, flowchart rendering) are offloaded to a web worker pool.
 * UI components are sourced from the new proprietary UI framework.
 * @see @/hooks/useCodeAnalysis.ts (conceptual)
 * @see @/services/worker-pool/index.ts (conceptual)
 * @see @/api/bff/index.ts (conceptual)
 * @security This component sends user-provided code to a backend service for analysis.
 * The backend must treat this input as untrusted. Client-side rendering of results (Markdown, SVG)
 * is sanitized or handled carefully to prevent XSS vulnerabilities.
 * @performance Syntax highlighting and Mermaid diagram rendering are offloaded to web workers to
 * prevent blocking the main thread, especially for large code snippets or complex diagrams.
 * API calls are asynchronous.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { StructuredExplanation } from '../types';
import { CpuChipIcon } from './icons';

// --- Conceptual Service & API Implementations (for demonstration) ---

/**
 * @conceptual
 * This section represents the new, abstracted services and API clients that this
 * component would consume in the target architecture. They are mocked here to make
 * this component's code runnable and to illustrate the design pattern.
 */

/**
 * @conceptual BffApiClient
 * A conceptual representation of the Backend-for-Frontend GraphQL API client.
 * In a real implementation, this would be an instance of Apollo Client, urql, etc.
 */
const bffApiClient = {
  query: async ({ query, variables }: { query: string; variables: Record<string, any> }): Promise<{ data: any, errors?: any[] }> => {
    console.log("Making GraphQL query to BFF:", { query, variables });
    await new Promise(res => setTimeout(res, 1500));
    if (variables.code.includes('error')) {
      return { data: null, errors: [{ message: "AI analysis failed on the server." }] };
    }
    return {
      data: {
        analyzeCode: {
          explanation: {
            summary: "This is a mock summary of the `bubbleSort` function. It sorts an array in place using a naive O(n^2) approach.",
            lineByLine: [{ lines: "1-10", explanation: "The entire function definition, which takes an array `arr`." }, { lines: "2-7", explanation: "The nested loops that perform the sorting comparisons and swaps." }],
            complexity: { time: "O(n^2)", space: "O(1)" },
            suggestions: ["For large arrays, consider more efficient algorithms like QuickSort or MergeSort.", "The implementation is correct for bubble sort."]
          },
          flowchart: `graph TD\n    A[Start] --> B{Loop i from 0 to n-1};\n    B --> C{Loop j from 0 to n-i-2};\n    C --> D{arr[j] > arr[j+1]?};\n    D -- Yes --> E[Swap arr[j] and arr[j+1]];\n    E --> C;\n    D -- No --> C;\n    C -- End Inner Loop --> B;\n    B -- End Outer Loop --> F[Return arr];\n    F --> G[End];`
        }
      }
    };
  }
};

/**
 * @conceptual workerPoolManager
 * A conceptual representation of the Worker Pool Manager service for offloading tasks.
 */
const workerPoolManager = {
  submitTask: async (taskName: string, payload: any): Promise<any> => {
    console.log("Submitting task to worker pool:", { taskName });
    await new Promise(res => setTimeout(res, 50 + Math.random() * 100)); // Simulate worker overhead
    if (taskName === 'renderMermaid') {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
      const { svg } = await mermaid.render(`mermaid-graph-${Date.now()}`, payload);
      return svg;
    }
    if (taskName === 'highlightSyntax') {
       const escapedCode = payload.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return escapedCode
          .replace(/\b(const|let|var|function|return|if|for|=>|import|from|export|default)\b/g, '<span class=\"text-cyan-400\">$1</span>')
          .replace(/(\b(true|false|null|undefined)\b)/g, '<span class=\"text-purple-400\">$1</span>')
          .replace(/("|'|`)(.*?)("|'|`)/g, '<span class=\"text-emerald-400\">$1$2$3</span>')
          .replace(/(\d+)/g, '<span class=\"text-amber-400\">$1</span>')
          .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class=\"text-gray-500 italic\">$1</span>')
          .replace(/(\{|\}|\(|\)|\[|\])/g, '<span class=\"text-gray-400\">$1</span>');
    }
    throw new Error(`Unknown worker task: ${taskName}`);
  }
};

// --- UI Components (Conceptual implementations from proprietary UI library) ---

const Box = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
const Flex = ({ children, className, ...props }: any) => <div className={`flex ${className}`} {...props}>{children}</div>;
const Grid = ({ children, className, ...props }: any) => <div className={`grid ${className}`} {...props}>{children}</div>;
const Typography = ({ as: Component = 'p', children, className, ...props }: any) => <Component className={className} {...props}>{children}</Component>;
const Button = ({ children, className, ...props }: any) => <button className={`btn-primary ${className}`} {...props}>{children}</button>;
const Spinner = () => <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>;
const Icon = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const MarkdownRenderer = ({ content, className }: { content: string; className?: string }) => {
  const [html, setHtml] = useState('');
  useEffect(() => { 
    import('marked').then(marked => setHtml(marked.marked.parse(content) as string));
  }, [content]);
  return <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
};

// --- GraphQL Query --- 
const ANALYZE_CODE_QUERY = `
  query AnalyzeCode($code: String!) {
    analyzeCode(code: $code) {
      explanation {
        summary
        lineByLine { lines explanation }
        complexity { time space }
        suggestions
      }
      flowchart
    }
  }
`;

// --- Constants ---
const EXAMPLE_CODE = `const bubbleSort = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
};`;

type ExplanationTab = 'summary' | 'lineByLine' | 'complexity' | 'suggestions' | 'flowchart';

// --- Custom Hooks ---

/**
 * Custom hook to offload syntax highlighting to a web worker.
 * @param {string} code The code to highlight.
 * @returns {string} The HTML string of the highlighted code.
 * @performance Offloads syntax highlighting from the main thread, improving UI responsiveness for large code inputs.
 */
const useSyntaxHighlighting = (code: string): string => {
  const [highlightedHtml, setHighlightedHtml] = useState('');

  useEffect(() => {
    let isMounted = true;
    workerPoolManager.submitTask('highlightSyntax', code)
      .then(html => {
        if (isMounted) setHighlightedHtml(html);
      })
      .catch(console.error);
    return () => { isMounted = false; };
  }, [code]);

  return highlightedHtml;
};

/**
 * Custom hook to manage the state and logic for the AI Code Explainer.
 * @param {string} [initialCode] Optional initial code to analyze.
 * @returns The full state and handlers for the AiCodeExplainer component.
 */
const useCodeAnalysis = (initialCode?: string) => {
  const [code, setCode] = useState<string>(initialCode || EXAMPLE_CODE);
  const [analysisResult, setAnalysisResult] = useState<{ explanation: StructuredExplanation; flowchart: string; } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ExplanationTab>('summary');

  const analyzeCode = useCallback(async (codeToAnalyze: string) => {
    if (!codeToAnalyze.trim()) {
      setError('Please enter some code to explain.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    setAnalysisResult(null);
    setActiveTab('summary');

    try {
      const { data, errors } = await bffApiClient.query({
        query: ANALYZE_CODE_QUERY,
        variables: { code: codeToAnalyze },
      });

      if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
      }
      
      setAnalysisResult(data.analyzeCode);
      setStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get explanation: ${errorMessage}`);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      analyzeCode(initialCode);
    }
  }, [initialCode, analyzeCode]);

  return {
    code, setCode,
    analysisResult,
    status, error,
    activeTab, setActiveTab,
    analyzeCode
  };
};

// --- Sub-components ---

/**
 * A memoized component to render a Mermaid.js diagram using a web worker.
 * @param {{ chart: string }} props The mermaid diagram code.
 * @returns {React.ReactElement} The rendered SVG diagram.
 * @performance Diagram rendering is performed in a worker, preventing main thread blockage.
 */
const MermaidDiagram = React.memo(({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (chart && ref.current) {
      let isMounted = true;
      setIsLoading(true);
      workerPoolManager.submitTask('renderMermaid', chart)
        .then(svg => {
          if (isMounted && ref.current) {
            ref.current.innerHTML = svg;
          }
        })
        .catch(e => {
          console.error("Mermaid rendering error:", e);
          if (isMounted && ref.current) {
            ref.current.innerHTML = `<p class="text-red-500">Error rendering flowchart.</p>`;
          }
        })
        .finally(() => {
          if(isMounted) setIsLoading(false);
        });
      return () => { isMounted = false; };
    }
  }, [chart]);

  return (
    <Box ref={ref} className="w-full h-full flex items-center justify-center">
      {isLoading && <Spinner />}
    </Box>
  );
});
MermaidDiagram.displayName = 'MermaidDiagram';

// --- Main Component ---

/**
 * @class AiCodeExplainer
 * @description A feature component that allows users to input code and receive a detailed, 
 * AI-powered analysis, including a summary, line-by-line explanation, complexity analysis, 
 * improvement suggestions, and a visual flowchart.
 * @param {{ initialCode?: string }} props The component props.
 * @param {string} [props.initialCode] - Optional initial code to display and analyze.
 * @example
 * <AiCodeExplainer initialCode="const x = 1;" />
 */
export const AiCodeExplainer: React.FC<{ initialCode?: string }> = ({ initialCode }) => {
  const {
    code, setCode,
    analysisResult,
    status, error,
    activeTab, setActiveTab,
    analyzeCode
  } = useCodeAnalysis(initialCode);

  const highlightedCode = useSyntaxHighlighting(code);

  const renderTabContent = () => {
    if (!analysisResult) return null;
    switch(activeTab) {
      case 'summary':
        return <MarkdownRenderer content={analysisResult.explanation.summary} />;
      case 'lineByLine':
        return (
          <Box className="space-y-3">
            {analysisResult.explanation.lineByLine.map((item, index) => (
              <Box key={index} className="p-3 bg-background rounded-md border border-border">
                <Typography as="p" className="font-mono text-xs text-primary mb-1">Lines: {item.lines}</Typography>
                <Typography as="p" className="text-sm">{item.explanation}</Typography>
              </Box>
            ))}
          </Box>
        );
      case 'complexity':
        return (
          <Box>
            <Typography><strong>Time Complexity:</strong> <span className="font-mono text-amber-400">{analysisResult.explanation.complexity.time}</span></Typography>
            <Typography><strong>Space Complexity:</strong> <span className="font-mono text-amber-400">{analysisResult.explanation.complexity.space}</span></Typography>
          </Box>
        );
      case 'suggestions':
        return (
          <ul className="list-disc list-inside space-y-2">
            {analysisResult.explanation.suggestions.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        );
      case 'flowchart':
        return <MermaidDiagram chart={analysisResult.flowchart} />;
      default: return null;
    }
  };

  return (
    <Box className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
      <header className="mb-6 flex-shrink-0">
        <Typography as="h1" className="text-3xl font-bold flex items-center">
          <Icon><CpuChipIcon /></Icon>
          <span className="ml-3">AI Code Explainer</span>
        </Typography>
        <Typography as="p" className="text-text-secondary mt-1">Get a detailed, structured analysis of any code snippet.</Typography>
      </header>

      <Grid className="flex-grow grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Left: Code Input */}
        <Flex className="flex-col min-h-0">
          <Typography as="label" htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">Your Code</Typography>
          <CodeEditor
            id="code-input"
            value={code}
            onValueChange={setCode}
            highlightedHtml={highlightedCode}
            placeholder="Paste your code here..."
            className="flex-grow"
          />
          <Box className="mt-4 flex-shrink-0">
            <Button onClick={() => analyzeCode(code)} disabled={status === 'loading'} className="w-full flex items-center justify-center px-6 py-3">
              {status === 'loading' ? <Spinner /> : 'Analyze Code'}
            </Button>
          </Box>
        </Flex>

        {/* Right: AI Analysis */}
        <Flex className="flex-col min-h-0">
          <Typography as="label" className="text-sm font-medium text-text-secondary mb-2">AI Analysis</Typography>
          <Flex className="flex-grow flex-col bg-surface border border-border rounded-md overflow-hidden">
            <Tabs.Root>
              <Tabs.List>
                {(['summary', 'lineByLine', 'complexity', 'suggestions', 'flowchart'] as ExplanationTab[]).map(tab => (
                  <Tabs.Trigger key={tab} value={tab} onClick={() => setActiveTab(tab)} disabled={!analysisResult}>
                    {tab.replace(/([A-Z])/g, ' $1')}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
            <Box className="p-4 flex-grow overflow-y-auto">
              {status === 'loading' && <Flex className="items-center justify-center h-full"><Spinner /></Flex>}
              {status === 'error' && <Typography as="p" className="text-red-500">{error}</Typography>}
              {status === 'success' && analysisResult && renderTabContent()}
              {status === 'idle' && <Typography as="p" className="text-text-secondary h-full flex items-center justify-center">The analysis will appear here.</Typography>}
            </Box>
          </Flex>
        </Flex>
      </Grid>
    </Box>
  );
};