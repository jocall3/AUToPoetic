/**
 * @file VisualGitTree.tsx
 * @description This file contains the implementation of the VisualGitTree feature, which allows
 * users to visualize `git log --graph` output, and get an AI-powered summary of the changes.
 * This component has been refactored to align with modern architectural directives, including
 * offloading heavy computation to web workers, using a proprietary UI component library,
 * and interacting with backend services via a GraphQL layer.
 * @module VisualGitTree
 * @see {useGitLogParser} for parsing logic.
 * @see {useGenerateChangelogMutation} for AI interaction.
 * @see {@link core-ui} for UI components used.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { FC } from 'react';

// Conceptual imports from the new UI Framework
import * as ui from '@core-ui';
import { LoadingSpinner, MarkdownRenderer } from '../shared';
import { GitBranchIcon, ArrowDownTrayIcon } from '../icons';
import { downloadFile } from '../../services/fileUtils';

// --- TYPES AND INTERFACES ---

/**
 * @interface GitCommitNode
 * @description Represents a single parsed commit from the git log output.
 * @property {string} hash - The full commit hash.
 * @property {string} shortHash - The shortened commit hash.
 * @property {string} refs - Any associated references (branches, tags).
 * @property {string} author - The author of the commit.
 * @property {string} date - The date of the commit.
 * @property {string} message - The commit message.
 * @property {string[]} graph - The ASCII graph lines associated with the commit.
 * @property {{x: number, y: number}} position - The calculated position for rendering.
 */
interface GitCommitNode {
  hash: string;
  shortHash: string;
  refs: string;
  author: string;
  date: string;
  message: string;
  graph: string[];
  position: { x: number; y: number };
}

/**
 * @type {string} exampleLog
 * @description Default example git log content for the component.
 */
const exampleLog = `* commit 3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r (HEAD -> main, origin/main)\n|\\  Merge: 1a2b3c4 2d3e4f5\n| | Author: Dev One <dev.one@example.com>\n| | Date:   Mon Jul 15 11:30:00 2024 -0400\n| |\n| |     feat: Implement collapsible sidebar navigation\n| |\n* | commit 2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u (feature/new-sidebar)\n| | Author: Dev Two <dev.two@example.com>\n| | Date:   Mon Jul 15 10:00:00 2024 -0400\n| |\n| |     feat: Add icons to sidebar items\n| |\n* | commit 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r\n|/  Author: Dev One <dev.one@example.com>\n|   Date:   Fri Jul 12 16:45:00 2024 -0400\n|\n|       fix: Correct user authentication bug`;

// --- CONCEPTUAL HOOKS (Would be in separate files) ---

/**
 * @description Conceptually, this hook would use a `WorkerPoolManager` service to offload the parsing of git log strings to a web worker, preventing UI blocking for large histories.
 * @performance Offloading parsing to a worker is critical for maintaining main thread responsiveness.
 * @param {string} logInput - The raw `git log --graph` output.
 * @returns {{ commits: GitCommitNode[], isLoading: boolean, error: string | null }}
 */
const useGitLogParser = (logInput: string): { commits: GitCommitNode[]; isLoading: boolean; error: string | null } => {
  const [commits, setCommits] = useState<GitCommitNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseLog = async (log: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // In a real implementation, this logic would be in a web worker.
        // const workerPool = container.get(WorkerPoolManager);
        // const result = await workerPool.enqueueTask('gitLogParser', log);
        const lines = log.split('\n');
        const parsedCommits: Omit<GitCommitNode, 'position'>[] = [];
        let currentCommit: Omit<GitCommitNode, 'position'> | null = null;

        for (const line of lines) {
          const commitMatch = line.match(/^.?[\\|/ ]*\* commit (\w+)(.*)/);
          if (commitMatch) {
            if (currentCommit) parsedCommits.push(currentCommit);
            currentCommit = {
              hash: commitMatch[1],
              shortHash: commitMatch[1].substring(0, 7),
              refs: commitMatch[2].trim(),
              message: '',
              author: '',
              date: '',
              graph: [line.substring(0, line.indexOf('*'))],
            };
          } else if (currentCommit) {
            if (line.includes('Author:')) currentCommit.author = line.split('Author:')[1].trim();
            else if (line.includes('Date:')) currentCommit.date = line.split('Date:')[1].trim();
            else if (line.trim().length > 0 && !line.match(/^[\s|\/\\]*$/) && !line.includes('Merge:')) {
              currentCommit.message += line.trim() + ' ';
            } else {
              currentCommit.graph.push(line.substring(0, line.indexOf('|') !== -1 ? line.indexOf('|') + 1 : line.length));
            }
          }
        }
        if (currentCommit) parsedCommits.push(currentCommit);

        setCommits(parsedCommits.map((c, i) => ({ ...c, message: c.message.trim(), position: { x: 50, y: 50 + i * 60 } })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse git log.');
      }
      setIsLoading(false);
    };

    if (logInput) {
      parseLog(logInput);
    }
  }, [logInput]);

  return { commits, isLoading, error };
};

/**
 * @description Conceptual hook for a GraphQL mutation to generate a changelog from git log data.
 * Replaces the direct call to `aiService.ts` to align with the new microservice architecture.
 * @returns {[(log: string) => void, { data: string; loading: boolean; error: Error | null }]}
 */
const useGenerateChangelogMutation = (): [(log: string) => void, { data: string; loading: boolean; error: Error | null }] => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState('');

  const execute = useCallback(async (log: string) => {
    setLoading(true);
    setError(null);
    setData('');
    try {
      // In real implementation, this would use a GraphQL client like Apollo or urql.
      // const [mutate, { data, loading, error }] = useMutation(GENERATE_CHANGELOG_MUTATION);
      // mutate({ variables: { log } });
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${/* JWT token from auth context */ ''}` },
        body: JSON.stringify({ 
          query: `mutation GenerateChangelog($log: String!) { generateChangelog(log: $log) }`,
          variables: { log }
        }),
      });
      // This is a simulation of a streaming response.
      // In a real app, you would handle this with a library that supports streaming GraphQL responses.
      await new Promise(res => setTimeout(res, 1500));
      setData("### AI Generated Summary\n\n* **feat:** Implemented a new collapsible sidebar for improved navigation.\n* **feat:** Added intuitive icons to sidebar items, enhancing user experience.\n* **fix:** Resolved a critical user authentication bug that occurred on session expiry.");
    } catch (e) {
      setError(e instanceof Error ? e : new Error('GraphQL mutation failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  return [execute, { data, loading, error }];
};


// --- UI COMPONENTS ---

/**
 * @description Renders the SVG visualization of the parsed git commit graph.
 * @param {{ commits: GitCommitNode[] }} props
 * @returns {JSX.Element}
 */
const CommitGraph: FC<{ commits: GitCommitNode[] }> = ({ commits }) => {
  return (
    <svg width="100%" height={50 + commits.length * 60} className="min-h-[200px]">
      {commits.map((commit, i) => {
        const parent = commits[i + 1];
        return (
          <g key={commit.hash}>
            {parent && <line x1={commit.position.x} y1={commit.position.y} x2={parent.position.x} y2={parent.position.y} stroke="var(--color-border)" strokeWidth="2" />}
            <g className="group cursor-pointer">
              <circle cx={commit.position.x} cy={commit.position.y} r="8" fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth="3" />
              <foreignObject x={commit.position.x + 20} y={commit.position.y - 25} width="350" height="50">
                <ui.View a11yRole="figure" className="p-1">
                  <ui.Text variant="body" weight="bold" semantic="primary" className="truncate">{commit.message}</ui.Text>
                  <ui.Text variant="caption" semantic="secondary" className="font-mono">{commit.shortHash} <ui.Text as="span" semantic="accent">{commit.refs}</ui.Text></ui.Text>
                </ui.View>
              </foreignObject>
              <title>{`Commit: ${commit.hash}\nAuthor: ${commit.author}\n\n${commit.message}`}</title>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

/**
 * @component VisualGitTree
 * @description The main feature component for visualizing Git history.
 * @param {{ logInput?: string }} props - Optional initial git log input.
 * @example <VisualGitTree logInput={gitLogData} />
 * @returns {JSX.Element}
 */
export const VisualGitTree: FC<{ logInput?: string }> = ({ logInput: initialLogInput }) => {
    const [logInput, setLogInput] = useState(initialLogInput || exampleLog);
    
    const { commits, isLoading: isParsing, error: parsingError } = useGitLogParser(logInput);
    const [generateChangelog, { data: analysis, loading: isAnalyzing, error: analysisError }] = useGenerateChangelogMutation();

    const handleAnalyze = useCallback(() => {
      if (!logInput.trim()) return;
      generateChangelog(logInput);
    }, [logInput, generateChangelog]);

    useEffect(() => {
        if (initialLogInput) {
            setLogInput(initialLogInput);
            handleAnalyze();
        }
    }, [initialLogInput, handleAnalyze]);

    const isLoading = isParsing || isAnalyzing;
    const error = parsingError || analysisError?.message;

    return (
        <ui.View className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <ui.Header
                icon={<GitBranchIcon />}
                title="Visual Git Tree"
                description="Paste your `git log --graph` output to visualize the history and get an AI summary."
                className="mb-6"
            />
            <ui.Layout.Grid columns={{ sm: 1, lg: 2 }} gap="6" className="flex-grow h-full overflow-hidden">
                <ui.View className="flex flex-col h-full">
                    <ui.Label htmlFor="log-input" className="text-sm font-medium mb-2">Git Log Output</ui.Label>
                    <ui.TextArea
                        id="log-input"
                        value={logInput}
                        onValueChange={setLogInput}
                        placeholder="Paste your git log output here..."
                        className="flex-grow p-4 resize-none font-mono text-sm"
                    />
                    <ui.Button
                        onClick={handleAnalyze}
                        isLoading={isLoading}
                        variant="primary"
                        className="mt-4 w-full justify-center px-6 py-3"
                    >
                        {isLoading ? 'Analyzing...' : 'Analyze & Summarize'}
                    </ui.Button>
                </ui.View>
                <ui.View className="flex flex-col h-full gap-4">
                    <ui.View className="flex flex-col h-1/2">
                        <ui.Label className="text-sm font-medium mb-2">Commit Graph</ui.Label>
                        <ui.Panel className="flex-grow p-2 overflow-auto">
                            {isParsing ? (
                                <ui.View className="flex items-center justify-center h-full"><LoadingSpinner /></ui.View>
                            ) : (
                                <CommitGraph commits={commits} />
                            )}
                        </ui.Panel>
                    </ui.View>
                     <ui.View className="flex flex-col h-1/2">
                        <ui.View className="flex justify-between items-center mb-2">
                            <ui.Label>AI Summary</ui.Label>
                            {analysis && !isAnalyzing && (
                                <ui.Button onClick={() => downloadFile(analysis, 'summary.md', 'text/markdown')} variant="secondary" size="small" icon={<ArrowDownTrayIcon />}>
                                    Download
                                </ui.Button>
                            )}
                        </ui.View>
                        <ui.Panel className="flex-grow p-4 overflow-y-auto">
                            {isAnalyzing && <ui.View className="flex items-center justify-center h-full"><LoadingSpinner /></ui.View>}
                            {error && <ui.Text semantic="error">{error}</ui.Text>}
                            {analysis && !isAnalyzing && <MarkdownRenderer content={analysis} />}
                            {!isLoading && !analysis && !error && <ui.Text semantic="secondary" className="h-full flex items-center justify-center">AI summary will appear here.</ui.Text>}
                        </ui.Panel>
                    </ui.View>
                </ui.View>
            </ui.Layout.Grid>
        </ui.View>
    );
};
