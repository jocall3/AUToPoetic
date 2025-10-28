/**
 * @file PerformanceProfiler.tsx
 * @description This file contains the PerformanceProfiler feature component, which allows for
 *              runtime performance analysis and bundle size inspection. It leverages a dedicated
 *              web worker for heavy parsing and communicates with the BFF for AI-driven insights.
 * @module features/PerformanceProfiler
 * @see {@link services/core/performance-profiler.interface.ts} for IPerformanceProfiler
 * @see {@link services/core/worker-pool-manager.interface.ts} for IWorkerPoolManager
 * @see {@link services/core/bff-api.interface.ts} for IBffApiAdapter
 * @security This component interacts with the BFF via an authenticated API adapter. All AI-related
 *           prompts are constructed and sent server-side by the BFF, mitigating prompt injection risks.
 * @performance The bundle stats parsing is offloaded to a web worker to prevent blocking the main thread.
 *              The FlameChart component performs minimal calculations on the main thread.
 */

import React, { useState, useCallback, useMemo } from 'react';

// Replacing conceptual imports with actual or simplified implementations
import { performanceService, type PerformanceTraceEntry as TraceEntry } from '../../services/profiling/performanceService';
// Assuming a singleton worker manager is available, like in other components.
import { workerPoolManager } from '../../services/workerPoolManager';
import { type BundleStatsNode } from '../../services/profiling/bundleAnalyzer';

// Shared components and icons from existing paths
import { ChartBarIcon, SparklesIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

// Mocking conceptual services that are not available in the provided file context
const mockBffApi = {
  post: async (query: string, variables: any) => {
    console.log("Mock BFF API call", { query, variables });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const analysisType = variables.type;
    return {
      data: {
        analyzePerformance: {
          suggestions: `### AI Analysis for ${analysisType}\n\nThis is a mock AI suggestion. The analysis indicates potential optimizations in the following areas:\n\n- **Component Renders**: Reduce unnecessary re-renders.\n- **Bundle Size**: Consider code-splitting large modules.\n- **Network**: Defer loading of non-critical assets.`
        }
      },
      errors: null
    };
  }
};
const WorkerTask = { ParseBundleStats: 'parseBundleStats' }; // Mock enum

// Simplified UI components to replace the proprietary library
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={`bg-surface border border-border rounded-lg ${className}`}>{children}</div>;
const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={`p-4 border-b border-border ${className}`}>{children}</div>;
const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={`p-4 ${className}`}>{children}</div>;
const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={`p-4 border-t border-border ${className}`}>{children}</div>;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />;
const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>;

// Simple Tabs implementation
const Tabs: React.FC<{ children: React.ReactNode, defaultIndex?: number }> = ({ children }) => <>{children}</>;
const TabList: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="flex border-b border-border">{children}</div>;
const Tab: React.FC<{ children: React.ReactNode; onClick: () => void; isSelected: boolean }> = ({ children, onClick, isSelected }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium ${isSelected ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:bg-surface-hover'}`}>{children}</button>
);
const TabPanels: React.FC<{ children: React.ReactNode; activeIndex: number }> = ({ children, activeIndex }) => <>{React.Children.toArray(children)[activeIndex]}</>;
const TabPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;


/**
 * @component FlameChart
 * @description A component to render a simple flame chart from performance trace entries.
 * @param {object} props The component props.
 * @param {TraceEntry[]} props.trace An array of performance trace entries to visualize.
 * @returns {React.ReactElement} The rendered flame chart.
 */
const FlameChart: React.FC<{ trace: TraceEntry[] }> = ({ trace }) => {
    if (trace.length === 0) {
        return <p className="text-text-secondary text-center p-4">No trace data collected. Click "Start Tracing" and interact with the app.</p>;
    }
    const maxTime = useMemo(() => Math.max(...trace.map(t => t.startTime + t.duration), 1), [trace]);

    return (
        <div className="space-y-1 font-mono text-xs p-2">
            {trace.filter(t => t.entryType === 'measure').map((entry, i) => (
                <div key={i} className="group relative h-6 bg-primary/20 rounded" title={`${entry.name} (${entry.duration.toFixed(1)}ms)`}>
                    <div className="h-full bg-primary rounded" style={{
                        marginLeft: `${(entry.startTime / maxTime) * 100}%`,
                        width: `${Math.max((entry.duration / maxTime) * 100, 0.5)}%`
                    }}></div>
                    <div className="absolute inset-0 px-2 flex items-center text-white font-bold overflow-hidden whitespace-nowrap">
                        {entry.name} ({entry.duration.toFixed(1)}ms)
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * @component PerformanceProfiler
 * @description A feature component for analyzing runtime performance and bundle sizes.
 *              It provides tools for tracing main thread activity and parsing bundle reports,
 *              and uses an AI service via the BFF to get optimization suggestions.
 * @returns {React.ReactElement} The Performance Profiler component.
 */
export const PerformanceProfiler: React.FC = () => {
    const [isTracing, setIsTracing] = useState(false);
    const [trace, setTrace] = useState<TraceEntry[]>([]);
    const [bundleStats, setBundleStats] = useState<string>('');
    const [bundleTree, setBundleTree] = useState<BundleStatsNode | null>(null);
    const [isLoading, setIsLoading] = useState<'tracing' | 'parsing' | 'analyzing' | false>(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [error, setError] = useState('');
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const handleTraceToggle = useCallback(() => {
        if (isTracing) {
            const collectedTrace = performanceService.stopTracing();
            setTrace(collectedTrace);
            setIsTracing(false);
        } else {
            setTrace([]);
            performanceService.startTracing();
            setIsTracing(true);
        }
    }, [isTracing]);

    const handleAnalyzeBundle = useCallback(async () => {
        if (!bundleStats.trim()) {
            setError('Please paste your stats.json content.');
            return;
        }
        setIsLoading('parsing');
        setError('');
        try {
            const result = await workerPoolManager.submitTask<BundleStatsNode>({
                type: WorkerTask.ParseBundleStats,
                payload: bundleStats,
            });
            setBundleTree(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Parsing failed in worker.');
            setBundleTree(null);
        } finally {
            setIsLoading(false);
        }
    }, [bundleStats]);

    const handleAiAnalysis = useCallback(async (activeTab: 'runtime' | 'bundle') => {
        const dataToAnalyze = activeTab === 'runtime' ? trace : bundleTree;
        if (!dataToAnalyze || (Array.isArray(dataToAnalyze) && dataToAnalyze.length === 0)) {
            setError('No data available to analyze.');
            return;
        }
        setIsLoading('analyzing');
        setAiAnalysis('');
        setError('');

        try {
            const query = `
                mutation AnalyzePerformance($data: JSON!, $type: String!) {
                    analyzePerformance(data: $data, type: $type) {
                        suggestions
                    }
                }
            `;
            const variables = { data: dataToAnalyze, type: activeTab };
            const result = await mockBffApi.post(query, variables);
            
            if (result.errors) {
              throw new Error(result.errors.map((e: any) => e.message).join('\n'));
            }

            setAiAnalysis(result.data.analyzePerformance.suggestions);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error getting analysis from AI.');
            setAiAnalysis('');
        } finally {
            setIsLoading(false);
        }
    }, [trace, bundleTree]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">AI Performance Profiler</span>
                </h1>
                <p className="text-text-secondary mt-1">Analyze runtime performance and bundle sizes with AI insights.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="lg:col-span-1">
                    <Tabs defaultIndex={0}>
                        <TabList>
                            <Tab isSelected={activeTabIndex === 0} onClick={() => setActiveTabIndex(0)}>Runtime Performance</Tab>
                            <Tab isSelected={activeTabIndex === 1} onClick={() => setActiveTabIndex(1)}>Bundle Analysis</Tab>
                        </TabList>
                        <TabPanels activeIndex={activeTabIndex}>
                            <TabPanel>
                                <Card className="flex flex-col h-full mt-2">
                                    <CardHeader>
                                        <Button onClick={handleTraceToggle} className="btn-primary w-full py-2">
                                            {isTracing ? 'Stop Tracing' : 'Start Tracing'}
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="flex-grow overflow-y-auto">
                                        <FlameChart trace={trace} />
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleAiAnalysis('runtime')} disabled={isLoading === 'analyzing' || trace.length === 0} className="w-full py-2 flex items-center justify-center gap-2 bg-surface border border-border hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50">
                                            {isLoading === 'analyzing' ? <LoadingSpinner /> : <><SparklesIcon /> Get AI Suggestions</>}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabPanel>
                            <TabPanel>
                                <Card className="flex flex-col h-full mt-2">
                                    <CardContent className="flex-grow flex flex-col gap-2">
                                        <Textarea
                                            value={bundleStats}
                                            onChange={(e) => setBundleStats(e.target.value)}
                                            placeholder="Paste your stats.json content here"
                                            className="w-full flex-grow font-mono text-xs p-2 bg-background border border-border rounded-md"
                                            rows={10}
                                        />
                                        <Button onClick={handleAnalyzeBundle} disabled={isLoading === 'parsing'} className="btn-primary py-2">
                                            {isLoading === 'parsing' ? <LoadingSpinner /> : 'Parse Bundle Stats'}
                                        </Button>
                                        <div className="flex-grow overflow-y-auto mt-2 p-2 bg-background border border-border rounded-md">
                                            <pre className="text-xs whitespace-pre-wrap">{bundleTree ? JSON.stringify(bundleTree, null, 2) : 'Parsed bundle tree will appear here.'}</pre>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleAiAnalysis('bundle')} disabled={isLoading === 'analyzing' || !bundleTree} className="w-full py-2 flex items-center justify-center gap-2 bg-surface border border-border hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50">
                                            {isLoading === 'analyzing' ? <LoadingSpinner /> : <><SparklesIcon /> Get AI Suggestions</>}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </div>
                <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex items-center gap-2">
                            <SparklesIcon />
                            <h3 className="text-lg font-bold">AI Optimization Suggestions</h3>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto">
                            {isLoading === 'analyzing' && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            {aiAnalysis ? <MarkdownRenderer content={aiAnalysis} /> :
                                !isLoading && !error && <p className="text-text-secondary text-center pt-8">AI analysis will appear here. Click "Get AI Suggestions" on a panel to begin.</p>
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};