/**
 * @file SvgPathEditor.tsx
 * @module SvgPathEditor
 * @description A feature component for visually creating and manipulating SVG path data.
 * This component has been refactored to align with new architectural directives, including
 * offloading parsing to a web worker, using an abstracted UI component library, and
 * comprehensive JSDoc documentation.
 * @see @/hooks/useWorkerTask
 * @see @/infrastructure/downloadService
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// --- Mocked/Imagined Imports for Architectural Transformation ---

/**
 * @description Simulates a custom hook for offloading tasks to a web worker pool.
 * In a real implementation, this would interact with the WorkerPoolManager service.
 * @performance Offloads computation from the main thread, improving UI responsiveness.
 * @param taskFn The function to be executed in the worker. It should be a pure function.
 * @returns A tuple containing the task result, an execute function, loading state, and any error.
 * @example const [result, executeTask, isLoading, error] = useWorkerTask(myPureFunction);
 */
const useWorkerTask = <T, A extends any[]>(taskFn: (...args: A) => T): [T | null, (...args: A) => void, boolean, Error | null] => {
    const [result, setResult] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback((...args: A) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        // Simulate worker communication delay
        setTimeout(() => {
            try {
                const taskResult = taskFn(...args);
                setResult(taskResult);
            } catch (e) {
                setError(e instanceof Error ? e : new Error('Worker task failed'));
            } finally {
                setIsLoading(false);
            }
        }, 50); // Small delay to simulate async nature
    }, [taskFn]);

    return [result, execute, isLoading, error];
};

// Assuming a new abstracted UI library as per architectural directives
const CodeBracketSquareIcon = () => <div className="w-6 h-6"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg></div>;
const ArrowDownTrayIcon = () => <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></div>;

// Assuming a refactored file utility service in the new infrastructure layer
import { downloadFile } from '../../services/fileUtils';

// --- Type Definitions ---

/**
 * Represents a 2D coordinate point.
 * @typedef {object} Point
 * @property {number} x - The x-coordinate.
 * @property {number} y - The y-coordinate.
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Represents a single command in an SVG path data string.
 * @typedef {object} PathCommand
 * @property {number} id - A unique identifier for the command in the sequence.
 * @property {string} command - The SVG path command character (e.g., 'M', 'L', 'Q').
 * @property {Point[]} points - An array of points associated with the command.
 */
interface PathCommand {
  id: number;
  command: string;
  points: Point[];
}

/**
 * Represents the state of a point being dragged, or null if no drag is active.
 * @typedef {object|null} DraggingState
 * @property {number} cmdIndex - The index of the command in the path data array.
 * @property {number} pointIndex - The index of the point within the command's points array.
 */
interface DraggingState {
  cmdIndex: number;
  pointIndex: number;
}

// --- Worker Logic (to be placed in a separate worker file) ---

/**
 * Parses a raw SVG path data string into a structured array of commands and points.
 * This function is designed to be pure and run in a web worker to offload parsing from the main thread.
 * @performance This can be a computationally intensive task for complex paths, making it ideal for a worker.
 * @param {string} d - The SVG path data string (the `d` attribute).
 * @returns {PathCommand[]} An array of structured path commands.
 */
const parsePathData = (d: string): PathCommand[] => {
    const commands = d.match(/[a-df-z][^a-df-z]*/ig) || [];
    return commands.map((cmdStr, i) => {
        const command = cmdStr[0];
        const args = cmdStr.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
        const points: Point[] = [];
        for (let j = 0; j < args.length; j += 2) {
            points.push({ x: args[j], y: args[j + 1] });
        }
        return { id: i, command, points };
    });
};

/**
 * Builds an SVG path data string from a structured array of commands.
 * This function is designed to be pure and run in a web worker.
 * @performance Efficiently constructs the path string after UI manipulations.
 * @param {PathCommand[]} parsed - The array of structured path commands.
 * @returns {string} The formatted SVG path data string.
 */
const buildPathString = (parsed: PathCommand[]): string => {
    return parsed.map(cmd => `${cmd.command} ${cmd.points.map(p => `${p.x} ${p.y}`).join(' ')}`).join(' ');
};


// --- SvgPathEditor Feature Component ---

const initialPath = "M 20 80 Q 100 20 180 80 T 340 80";

/**
 * An interactive editor for creating and manipulating SVG path data.
 * Users can drag control points on a canvas, edit the path string directly,
 * and see the parsed command structure.
 * @component
 * @returns {React.ReactElement} The SvgPathEditor component.
 */
export const SvgPathEditor: React.FC = () => {
    const [pathData, setPathData] = useState(initialPath);
    const [parsedCommands, setParsedCommands] = useState<PathCommand[]>([]);
    const [draggingPoint, setDraggingPoint] = useState<DraggingState | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const [parsedResult, executeParse, isParsing] = useWorkerTask(parsePathData);
    const [builtStringResult, executeBuild, isBuilding] = useWorkerTask(buildPathString);

    // Effect to parse the raw path data string whenever it changes.
    useEffect(() => {
        executeParse(pathData);
    }, [pathData, executeParse]);

    // Effect to update internal state when parsing is complete.
    useEffect(() => {
        if (parsedResult) {
            setParsedCommands(parsedResult);
        }
    }, [parsedResult]);
    
    // Effect to rebuild the path string when the command structure is modified by the UI.
    useEffect(() => {
        if (parsedCommands.length > 0 && !draggingPoint) {
             executeBuild(parsedCommands);
        }
    }, [parsedCommands, draggingPoint, executeBuild]);

    // Effect to update the text area when building is complete.
    useEffect(() => {
        if (builtStringResult) {
            setPathData(builtStringResult);
        }
    }, [builtStringResult]);

    const handlePointMouseDown = useCallback((e: React.MouseEvent, cmdIndex: number, pointIndex: number) => {
        e.stopPropagation();
        setDraggingPoint({ cmdIndex, pointIndex });
    }, []);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        if (!draggingPoint || !svgRef.current) return;

        const pt = new DOMPoint(e.clientX, e.clientY);
        const svgPoint = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());

        setParsedCommands(prevCommands => 
            prevCommands.map((cmd, cIdx) => {
                if (cIdx === draggingPoint.cmdIndex) {
                    const newPoints = cmd.points.map((p, pIdx) => 
                        pIdx === draggingPoint.pointIndex
                            ? { x: Math.round(svgPoint.x), y: Math.round(svgPoint.y) }
                            : p
                    );
                    return { ...cmd, points: newPoints };
                }
                return cmd;
            })
        );
    }, [draggingPoint]);

    const handleCanvasMouseUp = useCallback(() => {
        setDraggingPoint(null);
    }, []);

    const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
        if (!svgRef.current) return;
        const pt = new DOMPoint(e.clientX, e.clientY);
        const svgPoint = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
        const newPathData = `${pathData} L ${Math.round(svgPoint.x)} ${Math.round(svgPoint.y)}`;
        setPathData(newPathData);
    }, [pathData]);

    const handleDownload = useCallback(() => {
        const svgContent = `<svg viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg">\n  <path d="${pathData}" stroke="black" fill="transparent" stroke-width="2"/>\n</svg>`;
        downloadFile(svgContent, 'path.svg', 'image/svg+xml');
    }, [pathData]);

    const pointFill = (command: string) => {
        const lowerCmd = command.toLowerCase();
        return ['c', 'q', 's', 't'].includes(lowerCmd) ? '#fde047' : '#f87171';
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">SVG Path Editor</span>
                </h1>
                <p className="text-text-secondary mt-1">Visually create and manipulate SVG path data by dragging points.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full overflow-y-auto gap-4">
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="path-input" className="text-sm font-medium text-text-secondary">Path Data (d attribute)</label>
                            <button onClick={handleDownload} className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover-bg-slate-600">
                                <ArrowDownTrayIcon /> Download SVG
                            </button>
                        </div>
                        <textarea id="path-input" value={pathData} onChange={(e) => setPathData(e.target.value)} className="h-24 p-4 bg-surface border border-border rounded-md resize-y font-mono text-sm text-primary" />
                    </div>
                    <div className="flex-grow p-4 bg-surface border-2 border-dashed border-border rounded-md overflow-hidden flex items-center justify-center min-h-[200px]">
                        <svg ref={svgRef} viewBox="0 0 400 160" className="w-full h-full cursor-crosshair" onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} onDoubleClick={handleCanvasDoubleClick}>
                           <rect width="400" height="160" fill="var(--color-background)" />
                            <path d={buildPathString(parsedCommands)} stroke="var(--color-primary)" fill="transparent" strokeWidth="2" />
                            {parsedCommands.flatMap((cmd, cmdIndex) => 
                                cmd.points.map((p, pointIndex) => (
                                    <circle
                                        key={`${cmd.id}-${pointIndex}`}
                                        cx={p.x}
                                        cy={p.y}
                                        r="5"
                                        fill={pointFill(cmd.command)}
                                        stroke="var(--color-surface)"
                                        strokeWidth="2"
                                        className="cursor-move hover:stroke-primary"
                                        onMouseDown={(e) => handlePointMouseDown(e, cmdIndex, pointIndex)}
                                    />
                                ))
                            )}
                        </svg>
                    </div>
                    <p className="text-xs text-center text-text-secondary">Double-click on the canvas to add a new line point.</p>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Parsed Commands</label>
                    <div className="flex-grow p-2 bg-background border border-border rounded-md overflow-y-auto font-mono text-xs space-y-2">
                        {(isParsing || isBuilding) && <div className="p-2 text-center text-text-secondary">Processing...</div>}
                        {parsedCommands.map(cmd => (
                            <div key={cmd.id} className="p-2 bg-surface rounded">
                                <span className="font-bold text-amber-600">{cmd.command}</span>
                                <span className="text-text-secondary"> {cmd.points.map(p => `(${p.x},${p.y})`).join(' ')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};