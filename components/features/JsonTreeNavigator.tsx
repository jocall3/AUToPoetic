/**
 * @fileoverview
 * Provides the JsonTreeNavigator feature as an independently deployable micro-frontend.
 * This component allows users to input a JSON string and visualize it as an interactive,
 * collapsible tree structure.
 * 
 * @see {WorkerPoolManager} for information on the Web Worker pool used for parsing.
 * @see {@link http://ui.devcore.com/core|Core UI} for atomic components like Button and Icon.
 * @see {@link http://ui.devcore.com/composite|Composite UI} for complex components like Layout and Panel.
 * 
 * @performance
 * All JSON parsing is offloaded to a dedicated Web Worker pool via the `WorkerPoolManager`
 * to prevent blocking the main UI thread. This ensures a responsive user experience even with
 * very large JSON documents. The tree view uses memoization to optimize re-renders.
 * 
 * @security
 * The JSON input is treated as data and is never executed. Parsing is handled in a
 * sandboxed Web Worker environment, adding a layer of isolation. Rendered output
 * is managed by React's reconciliation process, preventing direct script injection.
 * 
 * @example
 * import { JsonTreeNavigator } from './JsonTreeNavigator';
 * import { workerPoolManager } from '../services/workerPoolManager'; // DI instance
 * 
 * const App = () => <JsonTreeNavigator workerPoolManager={workerPoolManager} />;
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileCodeIcon } from '../icons.tsx';

// ---[ FAKE PROPRIETARY UI LIBRARY IMPORTS ]---
// In a real scenario, these would be imported from a shared UI library package.
namespace core {
    export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => <textarea {...props} />;
    export const Icon: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => <div className={`w-5 h-5 ${className}`}>{children}</div>;
    export const LoadingSpinner: React.FC = () => <div className="text-xs">Parsing...</div>;
    export const ErrorDisplay: React.FC<{ title: string, message: string }> = ({ title, message }) => <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md"><div className="font-bold text-red-700">{title}</div><div className="text-sm text-red-600 font-mono mt-1">{message}</div></div>;
}

namespace composite {
    export const Layout = { Split: ({ left, right }: { left: React.ReactNode, right: React.ReactNode }) => <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">{left}{right}</div> };
    export const Panel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => <div className={`flex flex-col h-full bg-surface border border-border rounded-lg p-4 ${className}`}>{children}</div>;
}
// ---[ END FAKE IMPORTS ]---


// ---[ TYPE DEFINITIONS ]---

/**
 * @interface WorkerPoolManager
 * @description Defines the contract for the service that manages the Web Worker pool.
 * This allows offloading intensive tasks from the main thread.
 */
interface WorkerPoolManager {
    /**
     * Executes a task in a Web Worker.
     * @param {string} taskType - The type of task to execute (e.g., 'PARSE_JSON').
     * @param {any} payload - The data required for the task.
     * @returns {Promise<any>} A promise that resolves with the result from the worker.
     * @throws {Error} If the worker task fails.
     */
    executeTask<TResult, TPayload>(taskType: string, payload: TPayload): Promise<TResult>;
}

/** @typedef {'object' | 'array' | 'value'} JsonNodeType - The type of a node in the parsed JSON tree. */
type JsonNodeType = 'object' | 'array' | 'value';

/** @typedef {string | number | boolean | null} JsonPrimitive - A primitive JSON value. */
type JsonPrimitive = string | number | boolean | null;

/** 
 * @interface JsonNode
 * @description Represents a node in the structured JSON tree returned by the parsing worker.
 */
interface JsonNode {
    key: string;
    type: JsonNodeType;
    value: JsonPrimitive | JsonNode[];
    itemCount?: number; // For objects and arrays
}

/** 
 * @interface ParseJsonTaskPayload
 * @description The payload sent to the 'PARSE_JSON' worker task.
 */
interface ParseJsonTaskPayload {
    jsonString: string;
}

/** 
 * @interface ParseJsonTaskResult
 * @description The result returned by the 'PARSE_JSON' worker task.
 */
interface ParseJsonTaskResult {
    tree: JsonNode;
}


// ---[ CUSTOM HOOK FOR WORKER-BASED PARSING ]---

/**
 * @hook useJsonParser
 * @description A custom React hook to handle JSON parsing in a Web Worker.
 * It debounces input, manages loading and error states, and communicates with the WorkerPoolManager.
 * 
 * @param {string} jsonText - The raw JSON string input from the user.
 * @param {WorkerPoolManager} workerPoolManager - The injected service for managing workers.
 * @returns {{ isParsing: boolean; tree: JsonNode | null; error: string | null }} An object containing the parsing state.
 */
const useJsonParser = (jsonText: string, workerPoolManager: WorkerPoolManager) => {
    const [isParsing, setIsParsing] = useState(false);
    const [tree, setTree] = useState<JsonNode | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (!jsonText.trim()) {
                setTree(null);
                setError(null);
                return;
            }
            setIsParsing(true);
            setError(null);
            try {
                const result = await workerPoolManager.executeTask<ParseJsonTaskResult, ParseJsonTaskPayload>(
                    'PARSE_JSON',
                    { jsonString: jsonText }
                );
                setTree(result.tree);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown parsing error occurred.');
                setTree(null);
            } finally {
                setIsParsing(false);
            }
        }, 500); // Debounce parsing by 500ms

        return () => {
            clearTimeout(handler);
        };
    }, [jsonText, workerPoolManager]);

    return { isParsing, tree, error };
};

// ---[ UI COMPONENTS ]---

/**
 * @component JsonTreeNodeView
 * @description A recursive component that renders a single node of the JSON tree.
 * It handles collapsing/expanding of objects and arrays.
 * 
 * @param {object} props - The component props.
 * @param {JsonNode} props.node - The JSON node to render.
 * @param {boolean} [props.isRoot=false] - Whether this is the root node of the tree.
 * @returns {React.ReactElement} The rendered tree node.
 */
const JsonTreeNodeView: React.FC<{ node: JsonNode, isRoot?: boolean }> = React.memo(({ node, isRoot = false }) => {
    const [isOpen, setIsOpen] = useState(isRoot);

    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

    if (node.type === 'value') {
        const valueType = typeof node.value;
        const valueClass = valueType === 'string' ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400';
        const formattedValue = valueType === 'string' ? `"${node.value}"` : String(node.value);
        return (
            <div className="ml-4 pl-4 border-l border-border">
                <span className="text-purple-700 dark:text-purple-400">{node.key}: </span>
                <span className={valueClass}>{formattedValue}</span>
            </div>
        );
    }

    const bracket = node.type === 'array' ? '[]' : '{}';
    const children = node.value as JsonNode[];

    return (
        <div className={`ml-4 ${!isRoot ? 'pl-4 border-l border-border' : ''}`}>
            <button onClick={toggleOpen} className="flex items-center cursor-pointer hover:bg-surface-hover rounded px-1 w-full text-left">
                <span className={`transform transition-transform text-xs mr-1 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                <span className="font-semibold text-purple-700 dark:text-purple-400">{node.key}:</span>
                <span className="ml-2 text-text-secondary">{bracket[0]}</span>
                {!isOpen && <span className="text-text-secondary ml-1">...{bracket[1]} ({node.itemCount} items)</span>}
            </button>
            {isOpen && (
                <div>
                    {children.map((childNode) => (
                        <JsonTreeNodeView key={childNode.key} node={childNode} />
                    ))}
                    <div className="text-text-secondary ml-4">{bracket[1]}</div>
                </div>
            )}
        </div>
    );
});

/**
 * @component JsonTreeNavigator
 * @description The main feature component for the JSON Tree Navigator.
 * It provides a split view for text input and the rendered tree, offloading parsing to a worker.
 * 
 * @param {object} props - The component props.
 * @param {object} [props.initialData] - Optional initial JSON object to display.
 * @param {WorkerPoolManager} props.workerPoolManager - The injected service for managing workers.
 * @returns {React.ReactElement} The rendered component.
 */
export const JsonTreeNavigator: React.FC<{ initialData?: object, workerPoolManager: WorkerPoolManager }> = ({ initialData, workerPoolManager }) => {
    const defaultJson = `{\n  "id": "devcore-001",\n  "active": true,\n  "features": [\n    "ai-explainer",\n    "api-tester"\n  ],\n  "config": {\n    "theme": "dark",\n    "version": 1\n  }\n}`;
    const [jsonInput, setJsonInput] = useState(initialData ? JSON.stringify(initialData, null, 2) : defaultJson);
    const { isParsing, tree, error } = useJsonParser(jsonInput, workerPoolManager);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonInput(e.target.value);
    }, []);
    
    const leftPanel = (
        <composite.Panel>
            <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">JSON Input</label>
            <core.TextArea
                id="json-input"
                value={jsonInput}
                onChange={handleInputChange}
                className={`flex-grow p-4 bg-background border rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none ${error ? 'border-red-500' : 'border-border'}`}
            />
        </composite.Panel>
    );

    const rightPanel = (
        <composite.Panel>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-text-secondary">Tree View</label>
                {isParsing && <core.LoadingSpinner />}
            </div>
            <div className="flex-grow p-2 bg-background border border-border rounded-md overflow-y-auto font-mono text-sm">
                {error && <core.ErrorDisplay title="Parsing Error" message={error} />}
                {tree && !error && <JsonTreeNodeView node={tree} isRoot />}
                {!tree && !error && !isParsing && <div className="text-text-secondary">Enter valid JSON to view the tree.</div>}
            </div>
        </composite.Panel>
    );

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold flex items-center">
                    <core.Icon><FileCodeIcon /></core.Icon>
                    <span className="ml-3">JSON Tree Navigator</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste JSON to visualize it. Parsing is handled by a Web Worker.</p>
            </header>
            <composite.Layout.Split left={leftPanel} right={rightPanel} />
        </div>
    );
};
