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

// New UI Framework imports
import { Button, Textarea } from '@jester/core-ui';
import { Card, CardHeader, CardContent, CardFooter } from '@jester/composite-ui/Card';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@jester/composite-ui/Tabs';

// New Service Layer imports
import { useService } from '@jester/framework/inversify';
import { IPerformanceProfiler, TraceEntry } from '@jester/services/core/performance-profiler.interface';
import { IWorkerPoolManager, WorkerTask } from '@jester/services/core/worker-pool-manager.interface';
import { IBffApiAdapter } from '@jester/services/core/bff-api.interface';
import { BundleStatsNode } from '@jester/services/core/bundle-analyzer.interface';
import { ServiceIdentifiers } from '@jester/services/core/identifiers';

// Shared components and icons
import { ChartBarIcon, SparklesIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/LoadingSpinner.tsx';
import { MarkdownRenderer } from '../shared/MarkdownRenderer.tsx';

/**
 * @component FlameChart
 * @description A component to render a simple flame chart from performance trace entries.
 * @param {object} props The component props.
 * @param {TraceEntry[]} props.trace An array of performance trace entries to visualize.
 * @returns {React.ReactElement} The rendered flame chart.
 * @example
 * const traceData = [{ name: 'task-a', startTime: 0, duration: 100, entryType: 'measure' }];
 * <FlameChart trace={traceData} />
 */
const FlameChart: React.FC<{ trace: TraceEntry[] }> = ({ trace }) => {
    if (trace.length === 0) {
        return <p className="text-text-secondary">No trace data collected. Click "Start Tracing" and interact with the app.</p>;
    }
    const maxTime = useMemo(() => Math.max(...trace.map(t => t.startTime + t.duration), 1), [trace]);

    return (
        <div className="space-y-1 font-mono text-xs">
            {trace.filter(t => t.entryType === 'measure').map((entry, i) => (
                <div key={i} className="group relative h-6 bg-primary/20 rounded" title={`${entry.name} (${entry.duration.toFixed(1)}ms)`}>
                    <div className="h-full bg-primary" style={{
                        marginLeft: `${(entry.startTime / maxTime) * 100}%`,
                        width: `${Math.max((entry.duration / maxTime) * 100, 0.5)}%`
                    }}></div>
                    <div className="absolute inset-0 px-2 flex items-center text-primary font-bold overflow-hidden whitespace-nowrap">
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
 * @performance Offloads bundle stats parsing to a web worker to avoid UI freezes.
 */
export const PerformanceProfiler: React.FC = () => {
    const performanceProfiler = useService<IPerformanceProfiler>(ServiceIdentifiers.PerformanceProfiler);
    const workerPoolManager = useService<IWorkerPoolManager>(ServiceIdentifiers.WorkerPoolManager);
    const bffApi = useService<IBffApiAdapter>(ServiceIdentifiers.BffApiAdapter);

    const [isTracing, setIsTracing] = useState(false);
    const [trace, setTrace] = useState<TraceEntry[]>([]);
    const [bundleStats, setBundleStats] = useState<string>('');
    const [bundleTree, setBundleTree] = useState<BundleStatsNode | null>(null);
    const [isLoading, setIsLoading] = useState<'tracing' | 'parsing' | 'analyzing' | false>(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [error, setError] = useState('');

    /**
     * @function handleTraceToggle
     * @description Starts or stops runtime performance tracing on the main thread.
     * @performance Uses the browser's Performance API, which has minimal overhead.
     */
    const handleTraceToggle = useCallback(() => {
        if (isTracing) {
            const collectedTrace = performanceProfiler.stopTracing();
            setTrace(collectedTrace);
            setIsTracing(false);
        } else {
            setTrace([]);
            performanceProfiler.startTracing();
            setIsTracing(true);
        }
    }, [isTracing, performanceProfiler]);

    /**
     * @function handleAnalyzeBundle
     * @description Offloads the bundle stats JSON string to a web worker for parsing.
     * @performance Prevents main thread from blocking on large JSON parsing operations.
     */
    const handleAnalyzeBundle = useCallback(async () => {
        if (!bundleStats.trim()) {
            setError('Please paste your stats.json content.');
            return;
        }
        setIsLoading('parsing');
        setError('');
        try {
            const result = await workerPoolManager.runTask<BundleStatsNode>({
                task: WorkerTask.ParseBundleStats,
                payload: bundleStats,
            });
            setBundleTree(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Parsing failed in worker.');
            setBundleTree(null);
        } finally {
            setIsLoading(false);
        }
    }, [bundleStats, workerPoolManager]);

    /**
     * @function handleAiAnalysis
     * @description Sends performance data (runtime trace or bundle tree) to the BFF to get AI-powered
     *              optimization suggestions.
     * @param {('runtime' | 'bundle')} activeTab The current active tab to determine which data to send.
     */
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
            const result = await bffApi.post<{ analyzePerformance: { suggestions: string } }>(query, variables);
            
            if (result.errors) {
              throw new Error(result.errors.map(e => e.message).join('\n'));
            }

            setAiAnalysis(result.data.analyzePerformance.suggestions);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error getting analysis from AI.');
            setAiAnalysis('');
        } finally {
            setIsLoading(false);
        }
    }, [trace, bundleTree, bffApi]);

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
                            <Tab>Runtime Performance</Tab>
                            <Tab>Bundle Analysis</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel>
                                <Card className="flex flex-col h-full mt-2">
                                    <CardHeader>
                                        <Button onClick={handleTraceToggle} variant="primary" className="w-full">
                                            {isTracing ? 'Stop Tracing' : 'Start Tracing'}
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="flex-grow overflow-y-auto">
                                        <FlameChart trace={trace} />
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleAiAnalysis('runtime')} disabled={isLoading === 'analyzing' || trace.length === 0} className="w-full" variant="secondary">
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
                                            className="w-full flex-grow font-mono text-xs"
                                            rows={10}
                                        />
                                        <Button onClick={handleAnalyzeBundle} disabled={isLoading === 'parsing'} variant="primary">
                                            {isLoading === 'parsing' ? <LoadingSpinner /> : 'Parse Bundle Stats'}
                                        </Button>
                                        <div className="flex-grow overflow-y-auto mt-2 p-2 bg-background border rounded">
                                            <pre className="text-xs">{bundleTree ? JSON.stringify(bundleTree, null, 2) : 'Parsed bundle tree will appear here.'}</pre>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleAiAnalysis('bundle')} disabled={isLoading === 'analyzing' || !bundleTree} className="w-full" variant="secondary">
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
                        <CardHeader>
                            <h3 className="text-lg font-bold flex items-center gap-2"><SparklesIcon /> AI Optimization Suggestions</h3>
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
