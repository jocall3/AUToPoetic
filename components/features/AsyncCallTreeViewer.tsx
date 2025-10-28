/**
 * @file This file contains the AsyncCallTreeViewer component, which visualizes a tree
 * of asynchronous function calls from a JSON input. It offloads JSON parsing to a
 * web worker to keep the main thread responsive.
 * @license Copyright James Burvel O'Callaghan III, President Citibank Demo Business Inc.
 * @see {@link services/worker/workerPoolManager} for task offloading.
 * @performance The primary computation (JSON parsing and traversal) is offloaded to a web worker.
 * @security The component displays data from user input; while it doesn't execute code, large JSON
 * inputs are handled by a worker to prevent main thread blocking (DoS).
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChartBarIcon, ChevronRightIcon } from '../icons.tsx'; // Assuming icons are part of a core library

// As per new architectural directives, heavy computations are offloaded to a worker pool.
// We assume a hook `useWorkerPool` exists that provides access to this service.
// This is a placeholder for the actual hook from the infrastructure layer.
const useWorkerPool = () => ({
    submitTask: <TResult, TPayload>(taskName: string, payload: TPayload): Promise<TResult> => {
        // This is a mock implementation for demonstration and to make the component runnable.
        // In the real architecture, this would communicate with the WorkerPoolManager service.
        return new Promise((resolve, reject) => {
             setTimeout(() => {
                if (taskName === 'parse-call-tree') {
                    try {
                        const { jsonInput } = payload as { jsonInput: string };
                        const data: CallNode = JSON.parse(jsonInput);
                        if (typeof data.name !== 'string' || typeof data.duration !== 'number') {
                            throw new Error('Root node is missing required `name` or `duration` properties.');
                        }
                        let max = 0;
                        const findMax = (node: CallNode) => {
                            if (node.duration > max) max = node.duration;
                            if (node.children) node.children.forEach(findMax);
                        };
                        findMax(data);
                        resolve({ treeData: data, maxDuration: max || 1 } as unknown as TResult);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`Unknown worker task: ${taskName}`));
                }
             }, 300);
        });
    }
});


/**
 * @interface CallNode
 * @description Represents a single node in an asynchronous call tree. Each node contains
 * information about a specific function call, its duration, and any nested calls.
 * @property {string} name - The name of the function or operation represented by the node.
 * @property {number} duration - The execution duration of the operation in milliseconds.
 * @property {CallNode[]} [children] - An optional array of child nodes, representing nested function calls.
 */
interface CallNode {
    name: string;
    duration: number;
    children?: CallNode[];
}

/**
 * @interface WorkerParseResult
 * @description Defines the structure of the successful result returned from the JSON parsing web worker.
 * @property {CallNode} treeData - The parsed and validated root node of the call tree.
 * @property {number} maxDuration - The maximum duration found among all nodes in the tree, used for scaling visualizations.
 */
interface WorkerParseResult {
    treeData: CallNode;
    maxDuration: number;
}

/**
 * @const exampleJson
 * @description Default example JSON content to display in the text area on initial load.
 */
const exampleJson = `{ 
    "name": "startApp",
    "duration": 500,
    "children": [
        {
            "name": "fetchUserData",
            "duration": 300,
            "children": [
                { "name": "authenticate", "duration": 100 },
                { "name": "fetchProfile", "duration": 150 }
            ]
        },
        {
            "name": "loadInitialAssets",
            "duration": 450,
            "children": [
                { "name": "loadImage.png", "duration": 200 },
                { "name": "loadScript.js", "duration": 250 }
            ]
        }
    ]
}`;

/**
 * @interface TreeNodeProps
 * @description Props for the recursive TreeNode component.
 * @property {CallNode} node - The data for the current node to render.
 * @property {number} level - The nesting level of the current node, used for indentation.
 * @property {number} maxDuration - The maximum duration in the entire tree, for progress bar scaling.
 */
interface TreeNodeProps {
    node: CallNode;
    level: number;
    maxDuration: number;
}

/**
 * @component TreeNode
 * @description A recursive component that renders a single node and its children from the call tree.
 * It displays the node's name, duration, and a visual bar representing its duration relative to the max.
 * @param {TreeNodeProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered tree node.
 */
const TreeNode: React.FC<TreeNodeProps> = ({ node, level, maxDuration }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = useMemo(() => node.children && node.children.length > 0, [node.children]);

    return (
        <div className="my-1 flex flex-col">
            <div
                className="flex items-center p-2 rounded-md hover:bg-surface-hover transition-colors"
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`mr-2 text-text-secondary w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-0`}
                    disabled={!hasChildren}
                >
                    {hasChildren && <ChevronRightIcon className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />}
                </button>
                 <div className="flex-grow flex items-center justify-between gap-4">
                    <span className="truncate font-medium">{node.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                         <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-2 bg-primary rounded-full" style={{ width: `${(node.duration / maxDuration) * 100}%` }}/>
                         </div>
                        <span className="font-mono text-primary w-16 text-right">{node.duration.toFixed(0)}ms</span>
                    </div>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {node.children!.map((child, index) => (
                        <TreeNode key={`${child.name}-${index}`} node={child} level={level + 1} maxDuration={maxDuration} />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * @component AsyncCallTreeViewer
 * @description A feature component that provides a UI for visualizing asynchronous call trees from JSON.
 * It offloads parsing to a web worker to keep the UI responsive.
 * @returns {React.ReactElement} The rendered AsyncCallTreeViewer feature.
 * @see {@link TreeNode} for how individual nodes are rendered.
 */
export const AsyncCallTreeViewer: React.FC = () => {
    const [jsonInput, setJsonInput] = useState(exampleJson);
    const [error, setError] = useState('');
    const [treeData, setTreeData] = useState<CallNode | null>(null);
    const [maxDuration, setMaxDuration] = useState<number>(0);
    const [isParsing, setIsParsing] = useState(false);
    const { submitTask } = useWorkerPool();

    useEffect(() => {
        const handler = setTimeout(() => {
            if (!jsonInput.trim()) {
                setTreeData(null);
                setError('');
                return;
            }

            setIsParsing(true);
            setError('');

            submitTask<WorkerParseResult, { jsonInput: string }>('parse-call-tree', { jsonInput })
                .then(result => {
                    setTreeData(result.treeData);
                    setMaxDuration(result.maxDuration);
                })
                .catch(err => {
                    setError(err instanceof Error ? err.message : 'Invalid JSON format.');
                    setTreeData(null);
                    setMaxDuration(0);
                })
                .finally(() => {
                    setIsParsing(false);
                });
        }, 500); // 500ms debounce on input

        return () => {
            clearTimeout(handler);
        };
    }, [jsonInput, submitTask]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">Async Call Tree Viewer</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste a JSON structure to visualize an asynchronous function call tree.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col min-h-0">
                    <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">JSON Input</label>
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        className={`flex-grow p-4 bg-surface border ${error ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'} rounded-md resize-y font-mono text-sm focus:outline-none focus:ring-2`}
                        spellCheck="false"
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div className="flex flex-col min-h-0">
                    <label className="text-sm font-medium text-text-secondary mb-2">Visual Tree</label>
                    <div className="flex-grow bg-surface p-4 rounded-lg text-sm overflow-y-auto border border-border">
                        {isParsing && (
                            <div className="flex items-center justify-center h-full text-text-secondary">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                                Parsing JSON...
                            </div>
                        )}
                        {!isParsing && treeData && <TreeNode node={treeData} level={0} maxDuration={maxDuration} />}
                        {!isParsing && !treeData && <div className="text-text-secondary flex items-center justify-center h-full">{error || 'Enter valid JSON to see the tree.'}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
