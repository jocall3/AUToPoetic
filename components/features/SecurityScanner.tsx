/**
 * @file SecurityScanner.tsx
 * @module components/features/SecurityScanner
 * @description This file contains the implementation of the SecurityScanner feature.
 * This component provides a user interface for scanning code snippets for potential security vulnerabilities.
 * It leverages both a client-side static analysis via a Web Worker and a server-side AI-powered analysis
 * via a GraphQL mutation to the Backend-for-Frontend (BFF).
 * @see @services/worker/useWorkerPool for Web Worker integration.
 * @see @services/bff/securityHooks for AI analysis API interaction.
 * @see @core/ui for UI components.
 */

import React, { useState, useCallback } from 'react';

// Conceptual imports from the new abstracted UI framework and service layers
import { Page } from '@core/ui/Page';
import { Grid } from '@core/ui/Grid';
import { Card } from '@core/ui/Card';
import { TextArea } from '@core/ui/TextArea';
import { Button } from '@core/ui/Button';
import { Accordion } from '@core/ui/Accordion';
import { Badge } from '@core/ui/Badge';
import { Spinner } from '@core/ui/Spinner';
import { Markdown } from '@core/ui/Markdown';
import { Icon } from '@core/ui/Icon';

import { useWorkerPool } from '@services/worker/useWorkerPool';
import { useAnalyzeVulnerabilitiesMutation } from '@services/bff/securityHooks';
import type { SecurityIssue, SecurityVulnerability } from '@domain/models/security';

/**
 * @type ScanResults
 * @description Represents the aggregated results from both static and AI security scans.
 */
type ScanResults = {
  staticIssues: SecurityIssue[];
  aiIssues: SecurityVulnerability[];
};

const EXAMPLE_CODE = `function UserProfile({ user }) {
  // TODO: remove this temporary api key
  const API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  const userContent = user.bio; // This might contain malicious scripts

  return (
    <div>
      <h2>{user.name}</h2>
      <div dangerouslySetInnerHTML={{ __html: userContent }} />
    </div>
  );
}`;

/**
 * @function SeverityBadge
 * @description A component to display a colored badge based on the severity level of an issue.
 * @param {object} props - The component props.
 * @param {string} props.severity - The severity level ('Critical', 'High', 'Medium', 'Low', 'Informational').
 * @returns {React.ReactElement} A Badge component.
 */
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const severityMap: { [key: string]: 'critical' | 'danger' | 'warning' | 'info' | 'neutral' } = {
    'Critical': 'critical',
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'info',
    'Informational': 'neutral',
  };
  return <Badge variant={severityMap[severity] || 'neutral'}>{severity}</Badge>;
};

/**
 * @component SecurityScanner
 * @description A feature component that allows users to input code and scan it for security vulnerabilities.
 * It displays results from both a fast, local static analysis and a more in-depth, AI-powered analysis.
 * @performance Offloads the static analysis task to a Web Worker via the WorkerPoolManager to avoid blocking the main thread.
 * AI analysis is handled by the BFF, keeping the client-side lightweight.
 * @example
 * return <SecurityScanner />
 */
export const SecurityScanner: React.FC = () => {
  const [code, setCode] = useState<string>(EXAMPLE_CODE);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string>('');

  const { enqueueTask } = useWorkerPool();
  const [runAiScan, { error: aiError }] = useAnalyzeVulnerabilitiesMutation();

  /**
   * @function handleScan
   * @description Initiates both the static and AI security scans concurrently.
   * The static scan is offloaded to a Web Worker, while the AI scan is a GraphQL mutation to the BFF.
   * It aggregates the results and updates the component's state.
   * @performance Utilizes `Promise.allSettled` to run scans in parallel, improving overall execution time.
   * The most computationally intensive client-side part (static scan) is moved off the main thread.
   * @throws Will set an error state if either of the scanning processes fail.
   */
  const handleScan = useCallback(async () => {
    if (!code.trim()) {
      setScanError('Please enter code to scan.');
      return;
    }

    setIsScanning(true);
    setScanError('');
    setScanResults(null);

    try {
      const [staticResult, aiResult] = await Promise.allSettled([
        enqueueTask<SecurityIssue[]>({ type: 'STATIC_SECURITY_SCAN', payload: { code } }),
        runAiScan({ variables: { code } }),
      ]);

      const newResults: ScanResults = { staticIssues: [], aiIssues: [] };
      let errors: string[] = [];

      if (staticResult.status === 'fulfilled') {
        newResults.staticIssues = staticResult.value;
      } else {
        errors.push(`Static scan failed: ${staticResult.reason.message}`);
      }

      if (aiResult.status === 'fulfilled') {
        newResults.aiIssues = aiResult.value.data.analyzeCodeForVulnerabilities;
      } else {
        errors.push(`AI scan failed: ${aiResult.reason.message}`);
      }

      if (aiError) {
        errors.push(`AI scan GraphQL error: ${aiError.message}`);
      }

      setScanResults(newResults);

      if (errors.length > 0) {
        setScanError(errors.join('\n'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during scanning.';
      setScanError(message);
    } finally {
      setIsScanning(false);
    }
  }, [code, enqueueTask, runAiScan, aiError]);

  return (
    <Page>
      <Page.Header
        icon={<Icon name="shield-check" />}
        title="AI Security Co-Pilot"
        description="Find vulnerabilities in your code with static analysis and AI."
      />
      <Page.Content>
        <Grid cols={1} lgCols={2} gap={6} className="h-full">
          <div className="flex flex-col">
            <TextArea
              label="Code to Scan"
              value={code}
              onValueChange={setCode}
              monospace
              className="flex-grow min-h-[200px]"
            />
            <Button onClick={handleScan} isLoading={isScanning} className="mt-4 w-full">
              Scan Code
            </Button>
          </div>
          <div className="flex flex-col">
            <Card className="flex-grow flex flex-col">
              <Card.Header>Scan Results</Card.Header>
              <Card.Content className="flex-grow overflow-y-auto">
                {isScanning && (
                  <div className="flex justify-center items-center h-full">
                    <Spinner text="Scanning..." />
                  </div>
                )}
                {scanError && <p className="text-danger">{scanError}</p>}
                {!isScanning && !scanResults && (
                  <p className="text-text-secondary text-center mt-8">No issues found. Run a scan to begin.</p>
                )}
                {scanResults && (
                  <div className="space-y-4">
                    {scanResults.staticIssues.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Static Analysis Findings</h4>
                        <Accordion type="multiple">
                          {scanResults.staticIssues.map((issue, i) => (
                            <Accordion.Item key={`static-${i}`} value={`static-${i}`}>
                              <Accordion.Trigger>
                                <span className="font-bold text-sm truncate">{issue.type}</span>
                                <SeverityBadge severity={issue.severity} />
                              </Accordion.Trigger>
                              <Accordion.Content className="text-xs">
                                Line {issue.line}: {issue.description}
                              </Accordion.Content>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </div>
                    )}
                    {scanResults.aiIssues.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Icon name="sparkles" /> AI-Powered Findings
                        </h4>
                        <Accordion type="multiple">
                          {scanResults.aiIssues.map((issue, i) => (
                            <Accordion.Item key={`ai-${i}`} value={`ai-${i}`}>
                              <Accordion.Trigger>
                                <span className="font-bold text-sm truncate">{issue.vulnerability}</span>
                                <SeverityBadge severity={issue.severity} />
                              </Accordion.Trigger>
                              <Accordion.Content className="text-xs space-y-2">
                                <p><strong>Description:</strong> {issue.description}</p>
                                <p><strong>Mitigation:</strong> {issue.mitigation}</p>
                                {issue.exploitSuggestion && (
                                  <div>
                                    <strong>Exploit Simulation:</strong>
                                    <div className="mt-1 rounded bg-background p-2">
                                      <Markdown content={'```bash\n' + issue.exploitSuggestion + '\n```'} />
                                    </div>
                                  </div>
                                )}
                              </Accordion.Content>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        </Grid>
      </Page.Content>
    </Page>
  );
};
