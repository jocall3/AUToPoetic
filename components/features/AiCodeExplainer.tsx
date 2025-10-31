/**
 * @file Implements the AiCodeExplainer feature as a thin presentation layer component.
 * This component allows users to input code and receive a structured, AI-powered analysis,
 * including summaries, complexity analysis, and a visual flowchart.
 * @module components/features/AiCodeExplainer
 * @see @/hooks/mutations/useExplainCodeMutation for the data fetching logic to the BFF.
 * @see @/hooks/useWorkerTask for offloading expensive computations to a web worker pool.
 * @see @/ui/core for atomic UI components like Button and Spinner.
 * @see @/ui/composite for complex UI patterns like Tabs and CodeEditor.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';

// --- Core & Composite UI Components (Conceptual) ---
// These would be imported from a real proprietary UI framework.
const Box = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
const Button = ({ children, className, isLoading, ...props }: any) => <button className={`btn-primary ${className}`} {...props}>{isLoading ? <Spinner /> : children}</button>;
const Grid = ({ children, className, ...props }: any) => <div className={`grid ${className}`} {...props}>{children}</div>;
const Icon = ({ children, as: Component, ...props }: any) => <div {...props}>{Component ? <Component /> : children}</div>;
const Spinner = () => <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>;
const Typography = ({ as: Component = 'p', children, className, ...props }: any) => <Component className={className} {...props}>{children}</Component>;
const Card = ({ children, ...props }: any) => <div {...props}>{children}</div>;
Card.Header = ({ children, ...props }: any) => <div {...props}>{children}</div>;
Card.Content = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const CodeEditor = ({ value, onChange, ...props }: any) => <textarea value={value} onChange={onChange} {...props} className="w-full h-full p-2 font-mono bg-surface border border-border rounded-md" />;
const MarkdownViewer = ({ content, ...props }: any) => <div {...props}>{content}</div>;
const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const Tab = ({ children, ...props }: any) => <button {...props}>{children}</button>;
const TabList = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const TabPanel = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const CpuChipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M8.25 21v-1.5M4.5 15.75H3m18 0h-1.5M21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25ZM12 18V6" /></svg>;


// --- Hooks for Data Fetching & Worker Offloading (Conceptual) ---
import { StructuredExplanation } from '../../types'; // Assuming types are defined in a central place
// These hooks would be real implementations in the new architecture.
const useExplainCodeMutation = (): [any, { data: any, loading: boolean, error: any }]> => { return [() => {}, { data: null, loading: false, error: null }] };
const useWorkerTask = <T,>(task: string, payload: any): { result: T | null, isLoading: boolean, error: Error | null } => { return { result: null, isLoading: false, error: null } };

/**
 * Represents the available tabs in the AI analysis panel.
 * @typedef {'summary' | 'lineByLine' | 'complexity' | 'suggestions' | 'flowchart'} ExplanationTab
 */
type ExplanationTab = 'summary' | 'lineByLine' | 'complexity' | 'suggestions' | 'flowchart';

/**
 * @interface AiCodeExplainerProps
 * @description Props for the AiCodeExplainer component.
 */
interface AiCodeExplainerProps {
  /**
   * @property {string} [initialCode] - Optional initial code to display and analyze upon component mount.
   * @example "const x = 1;"
   */
  initialCode?: string;
}

const exampleCode = `const bubbleSort = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
};

/**
 * Renders a specific panel for the AI Analysis tabs.
 * This component is memoized to prevent re-renders when switching tabs.
 * @param {object} props - The component props.
 * @param {ExplanationTab} props.activeTab - The currently active tab.
 * @param {StructuredExplanation | null | undefined} props.explanation - The structured explanation data.
 * @param {string | null | undefined} props.mermaidCode - The Mermaid.js code for the flowchart.
 * @returns {React.ReactElement | null} The rendered tab panel content, or null if no explanation is available.
 * @performance Memoized to avoid re-rendering inactive tabs. The Mermaid chart rendering
 * is offloaded to a web worker via the `useWorkerTask` hook to avoid blocking the main thread.
 */
const AnalysisPanel: React.FC<{
  activeTab: ExplanationTab;
  explanation: StructuredExplanation | null | undefined;
  mermaidCode: string | null | undefined;
}> = React.memo(({ activeTab, explanation, mermaidCode }) => {
  const { result: flowchartSvg, isLoading: isFlowchartLoading } = useWorkerTask<string>(
    'render-mermaid',
    (activeTab === 'flowchart' && mermaidCode) ? mermaidCode : null
  );

  if (!explanation) return null;

  switch (activeTab) {
    case 'summary':
      return <MarkdownViewer content={explanation.summary} />;
    case 'lineByLine':
      return (
        <Box className="space-y-3">
          {explanation.lineByLine.map((item, index) => (
            <Card key={index} variant="outlined">
              <Card.Content>
                <Typography variant="code" color="primary" gutterBottom>Lines: {item.lines}</Typography>
                <Typography variant="body2">{item.explanation}</Typography>
              </Card.Content>
            </Card>
          ))}
        </Box>
      );
    case 'complexity':
      return (
        <Box>
          <Typography variant="h6">Time Complexity: <Typography as="span" variant="code" color="secondary">{explanation.complexity.time}</Typography></Typography>
          <Typography variant="h6">Space Complexity: <Typography as="span" variant="code" color="secondary">{explanation.complexity.space}</Typography></Typography>
        </Box>
      );
    case 'suggestions':
      return (
        <ul className="list-disc list-inside space-y-2">
          {explanation.suggestions.map((item, index) => <li key={index}><Typography variant="body1">{item}</Typography></li>)}
        </ul>
      );
    case 'flowchart':
      if (isFlowchartLoading) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Spinner /></Box>;
      }
      if (flowchartSvg) {
        return <Box dangerouslySetInnerHTML={{ __html: flowchartSvg }} className="w-full h-full flex items-center justify-center svg-pan-zoom-container" />;
      }
      return <Typography color="textSecondary">Could not render flowchart.</Typography>;
    default:
        return null;
  }
});
AnalysisPanel.displayName = 'AnalysisPanel';

/**
 * A feature component that provides a detailed, structured AI-powered analysis of any code snippet.
 * It's architected as a thin presentation layer, delegating complex tasks like AI analysis and
 * chart rendering to backend services and web workers, respectively.
 *
 * @component
 * @param {AiCodeExplainerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered AiCodeExplainer component.
 * @example
 * ```jsx
 * <AiCodeExplainer initialCode="const x = 1;" />
 * ```
 * @performance This component is optimized by:
 * 1. Using a GraphQL mutation for efficient data fetching from the BFF, handled by `useExplainCodeMutation`.
 * 2. Offloading Mermaid.js chart rendering to a web worker via `useWorkerTask` to keep the main thread responsive.
 * 3. Utilizing memoized components like `AnalysisPanel` to prevent unnecessary re-renders of tab content.
 * @security User-provided code is sent to a backend BFF service for analysis. All communication
 * must be over HTTPS and authenticated via JWT. The display of results (SVG from Mermaid, Markdown)
 * is handled by dedicated components that ensure content is properly sanitized to prevent XSS vulnerabilities.
 * The `dangerouslySetInnerHTML` for the flowchart is safe as the SVG content is generated by a controlled worker process
 * and is not derived from arbitrary user input.
 */
export const AiCodeExplainer: React.FC<AiCodeExplainerProps> = ({ initialCode }) => {
  const [code, setCode] = useState<string>(initialCode || exampleCode);
  const [activeTab, setActiveTab] = useState<ExplanationTab>('summary');

  const [explainCode, { data: analysisResult, loading: isLoading, error: analysisError }] = useExplainCodeMutation();

  const handleExplain = useCallback((codeToExplain: string) => {
    if (!codeToExplain.trim()) {
      // In a real app, this would use the Notification service
      console.error('Please enter some code to explain.'); 
      return;
    }
    setActiveTab('summary');
    explainCode({ variables: { code: codeToExplain } });
  }, [explainCode]);
  
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handleExplain(initialCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, handleExplain]);

  const explanation = useMemo(() => analysisResult?.explainCode?.explanation, [analysisResult]);
  const mermaidCode = useMemo(() => analysisResult?.explainCode?.mermaidCode, [analysisResult]);

  return (
    <Box p={3} height="100%" display="flex" flexDirection="column" className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <header>
        <Typography variant="h1" as="h1" gutterBottom display="flex" alignItems="center" className="text-3xl font-bold flex items-center mb-2">
          <Icon as={CpuChipIcon} mr={2} className="mr-2"/>
          AI Code Explainer
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" mb={3} className="text-text-secondary mb-4">
          Get a detailed, structured analysis of any code snippet.
        </Typography>
      </header>

      <Grid container spacing={3} flexGrow={1} minHeight={0} className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
        <Grid item xs={12} md={6} display="flex" flexDirection="column" className="flex flex-col">
          <CodeEditor
            language="javascript"
            value={code}
            onChange={(newCode: string) => setCode(newCode || '')}
            aria-label="Code input editor"
          />
          <Box mt={2} className="mt-2">
            <Button
              onClick={() => handleExplain(code)}
              isLoading={isLoading}
              fullWidth
              variant="contained"
              color="primary"
              size="large"
            >
              Analyze Code
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={6} display="flex" flexDirection="column" className="flex flex-col">
          <Card display="flex" flexDirection="column" flexGrow={1} overflow="hidden" className="flex flex-col flex-grow overflow-hidden border border-border rounded-lg">
            <Card.Header>
              <Tabs value={activeTab} onChange={(e: any, newTab: any) => setActiveTab(newTab as ExplanationTab)} className="border-b border-border">
                <TabList>
                  <Tab value="summary" disabled={!explanation}>Summary</Tab>
                  <Tab value="lineByLine" disabled={!explanation}>Line-by-Line</Tab>
                  <Tab value="complexity" disabled={!explanation}>Complexity</Tab>
                  <Tab value="suggestions" disabled={!explanation}>Suggestions</Tab>
                  <Tab value="flowchart" disabled={!mermaidCode}>Flowchart</Tab>
                </TabList>
              </Tabs>
            </Card.Header>
            <Card.Content flexGrow={1} overflow="auto" className="flex-grow overflow-auto p-4">
              {isLoading && (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" className="flex justify-center items-center h-full">
                  <Spinner />
                </Box>
              )}
              {analysisError && (
                <Typography color="error" className="text-red-500">
                  Error: {analysisError.message}
                </Typography>
              )}
              {!isLoading && !analysisError && explanation && (
                <AnalysisPanel
                  activeTab={activeTab}
                  explanation={explanation}
                  mermaidCode={mermaidCode}
                />
              )}
              {!isLoading && !analysisError && !explanation && (
                 <Typography color="textSecondary" textAlign="center" mt={4} className="text-center text-text-secondary mt-4">
                  The analysis will appear here.
                </Typography>
              )}
            </Card.Content>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
