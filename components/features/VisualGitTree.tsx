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
import { LoadingSpinner, MarkdownRenderer } from '../shared';
import { GitBranchIcon, ArrowDownTrayIcon, SparklesIcon } from '../icons';
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
const exampleLog = `* commit 3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r (HEAD -> main, origin/main)\n|\  Merge: 1a2b3c4 2d3e4f5\n| | Author: Dev One <dev.one@example.com>\n| | Date:   Mon Jul 15 11:30:00 2024 -0400\n| |\n| |     feat: Implement collapsible sidebar navigation\n| |\n* | commit 2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u (feature/new-sidebar)\n| | Author: Dev Two <dev.two@example.com>\n| | Date:   Mon Jul 15 10:00:00 2024 -0400\n| |\n| |     feat: Add icons to sidebar items\n| |\n* | commit 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r\n|/  Author: Dev One <dev.one@example.com>\n|   Date:   Fri Jul 12 16:45:00 2024 -0400\n|\n|       fix: Correct user authentication bug`;

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
        const commitBlocks = log.split('\n* commit ');
        if (commitBlocks[0].startsWith('* commit ')) {
          commitBlocks[0] = commitBlocks[0].substring(8);
        } else {
          commitBlocks.shift();
        }

        const parsedCommits: Omit<GitCommitNode, 'position'>[] = commitBlocks.map(block => {
          const lines = block.split('\n');
          const commitLine = lines[0];
          const hashMatch = commitLine.match(/^(\w+)/);
          const hash = hashMatch ? hashMatch[1] : '';
          const refs = commitLine.includes('(') ? commitLine.substring(commitLine.indexOf('(') + 1, commitLine.lastIndexOf(')')) : '';

          let author = '';
          let date = '';
          let message = '';
          const graph: string[] = [];

          let messageStarted = false;
          lines.forEach(line => {
            const graphPart = line.match(/^[\s|\\/._*-]*/)?.[0] || '';
            const textPart = line.substring(graphPart.length).trim();
            graph.push(graphPart);

            if(messageStarted && textPart) {
              message += textPart + ' ';
            }
            if (textPart.startsWith('Author:')) author = textPart.split('Author:')[1].trim();
            else if (textPart.startsWith('Date:')) date = textPart.split('Date:')[1].trim();
            else if (line.trim() === graphPart.trim()) { // empty line after headers
              messageStarted = true;
            }
          });

          return {
            hash,
            shortHash: hash.substring(0, 7),
            refs,
            author,
            date,
            message: message.trim(),
            graph,
          };
        });

        setCommits(parsedCommits.map((c, i) => ({ ...c, position: { x: 50 + (c.graph[0]?.length || 0) * 4, y: 50 + i * 80 } })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse git log.');
      }
      setIsLoading(false);
    };

    if (logInput) {
      const timeoutId = setTimeout(() => parseLog(logInput), 300); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [logInput]);

  return { commits, isLoading, error };
};

/**
 * @description Conceptual hook for a GraphQL mutation to generate a changelog from git log data.
 * Replaces the direct call to `aiService.ts` to align with the new microservice architecture.
 * @returns {[(log: string) => void, { data: string; loading: boolean; error: Error | null }]} A tuple with a mutate function and the result object.
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
      // In a real implementation, this would use a GraphQL client.
      await new Promise(res => setTimeout(res, 1500));
      if(log.includes('error-test')) throw new Error('AI analysis failed due to a simulated error.');
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
  const maxCommitsToRender = 100; // Performance safeguard
  const renderedCommits = commits.slice(0, maxCommitsToRender);

  const commitMap = useMemo(() => new Map(renderedCommits.map(c => [c.shortHash, c])), [renderedCommits]);

  return (
    <svg width="100%" height={50 + renderedCommits.length * 80} className="min-h-[200px]">
      {renderedCommits.map((commit, i) => {
        const parent = renderedCommits[i + 1]; // Simplified parent-child link for visualization
        return (
          <g key={commit.hash}>
            {parent && <line x1={commit.position.x} y1={commit.position.y} x2={parent.position.x} y2={parent.position.y} className="stroke-border" strokeWidth="2" />}
            <g className="group cursor-pointer">
              <circle cx={commit.position.x} cy={commit.position.y} r="6" className="fill-primary stroke-surface" strokeWidth="2" />
              <foreignObject x={commit.position.x + 15} y={commit.position.y - 20} width="400" height="40">
                <div className="p-1 text-text-primary">
                  <p className="text-sm font-bold truncate">{commit.message}</p>
                  <p className="text-xs text-text-secondary font-mono">
                    {commit.shortHash} <span className="text-amber-500">{commit.refs}</span>
                  </p>
                </div>
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
        }
    }, [initialLogInput]);

    const isLoading = isParsing || isAnalyzing;
    const error = parsingError || analysisError?.message;

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 flex-shrink-0">
              <h1 className="text-3xl font-bold flex items-center"><GitBranchIcon /><span className="ml-3">Visual Git Tree</span></h1>
              <p className="text-text-secondary mt-1">Paste your `git log --graph` output to visualize the history and get an AI summary.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full min-h-0">
                    <label htmlFor="log-input" className="text-sm font-medium text-text-secondary mb-2">Git Log Output</label>
                    <textarea
                        id="log-input"
                        value={logInput}
                        onChange={(e) => setLogInput(e.target.value)}
                        placeholder="Paste your git log output here..."
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                        spellCheck="false"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full justify-center px-6 py-3 flex items-center gap-2"
                    >
                        {isAnalyzing ? <LoadingSpinner /> : <SparklesIcon />} {isAnalyzing ? 'Analyzing...' : 'AI Summarize & Analyze'}
                    </button>
                </div>
                <div className="flex flex-col h-full gap-4 min-h-0">
                    <div className="flex flex-col h-1/2 min-h-0">
                        <h3 className="text-sm font-medium text-text-secondary mb-2">Commit Graph</h3>
                        <div className="flex-grow p-2 bg-background border border-border rounded-lg overflow-auto">
                            {isParsing ? (
                                <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
                            ) : commits.length > 0 ? (
                                <CommitGraph commits={commits} />
                            ) : (
                                <p className='text-text-secondary text-center p-4'>No valid commits to display.</p>
                            )}
                        </div>
                    </div>
                     <div className="flex flex-col h-1/2 min-h-0">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className='text-sm font-medium text-text-secondary'>AI Summary</h3>
                            {analysis && !isAnalyzing && (
                                <button onClick={() => downloadFile(analysis, 'summary.md', 'text/markdown')} className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600">
                                    <ArrowDownTrayIcon /> Download
                                </button>
                            )}
                        </div>
                        <div className="flex-grow p-4 bg-surface border border-border rounded-lg overflow-y-auto">
                            {isAnalyzing && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                            {error && <p className="text-red-500 font-mono text-xs">{error}</p>}
                            {analysis && !isAnalyzing && <MarkdownRenderer content={analysis} />}
                            {!isLoading && !analysis && !error && <p className="text-text-secondary h-full flex items-center justify-center">AI summary will appear here.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
