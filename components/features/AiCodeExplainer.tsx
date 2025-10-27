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

// --- Core & Composite UI Components ---
import { Box } from '@/ui/core/Box';
import { Button } from '@/ui/core/Button';
import { Grid } from '@/ui/core/Grid';
import { Icon } from '@/ui/core/Icon';
import { Spinner } from '@/ui/core/Spinner';
import { Typography } from '@/ui/core/Typography';
import { Card, CardContent, CardHeader } from '@/ui/composite/Card';
import { CodeEditor } from '@/ui/composite/CodeEditor';
import { MarkdownViewer } from '@/ui/composite/MarkdownViewer';
import { Tabs, Tab, TabList, TabPanel } from '@/ui/composite/Tabs';
import { CpuChipIcon } from '@/ui/icons/CpuChipIcon';

// --- Hooks for Data Fetching & Worker Offloading ---
import { useExplainCodeMutation, StructuredExplanation } from '@/hooks/mutations/useExplainCodeMutation';
import { useWorkerTask } from '@/hooks/useWorkerTask';

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
};`;

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
              <CardContent>
                <Typography variant="code" color="primary" gutterBottom>Lines: {item.lines}</Typography>
                <Typography variant="body2">{item.explanation}</Typography>
              </CardContent>
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
      console.error('Please enter some code to explain.'); // In a real app, this would use the Notification service
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
  }, [initialCode, handleExplain]);

  const explanation = useMemo(() => analysisResult?.explainCode?.explanation, [analysisResult]);
  const mermaidCode = useMemo(() => analysisResult?.explainCode?.mermaidCode, [analysisResult]);

  return (
    <Box p={3} height="100%" display="flex" flexDirection="column">
      <header>
        <Typography variant="h1" gutterBottom display="flex" alignItems="center">
          <Icon as={CpuChipIcon} mr={2} />
          AI Code Explainer
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" mb={3}>
          Get a detailed, structured analysis of any code snippet.
        </Typography>
      </header>

      <Grid container spacing={3} flexGrow={1} minHeight={0}>
        <Grid item xs={12} md={6} display="flex" flexDirection="column">
          <CodeEditor
            language="javascript"
            value={code}
            onChange={(newCode) => setCode(newCode || '')}
            aria-label="Code input editor"
          />
          <Box mt={2}>
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

        <Grid item xs={12} md={6} display="flex" flexDirection="column">
          <Card display="flex" flexDirection="column" flexGrow={1} overflow="hidden">
            <CardHeader>
              <Tabs value={activeTab} onChange={(e, newTab) => setActiveTab(newTab as ExplanationTab)}>
                <TabList>
                  <Tab value="summary" disabled={!explanation}>Summary</Tab>
                  <Tab value="lineByLine" disabled={!explanation}>Line-by-Line</Tab>
                  <Tab value="complexity" disabled={!explanation}>Complexity</Tab>
                  <Tab value="suggestions" disabled={!explanation}>Suggestions</Tab>
                  <Tab value="flowchart" disabled={!mermaidCode}>Flowchart</Tab>
                </TabList>
              </Tabs>
            </CardHeader>
            <CardContent flexGrow={1} overflow="auto">
              {isLoading && (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Spinner />
                </Box>
              )}
              {analysisError && (
                <Typography color="error">
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
                 <Typography color="textSecondary" textAlign="center" mt={4}>
                  The analysis will appear here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
};
