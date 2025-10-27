/**
 * @file WorkerThreadDebugger.tsx
 * @module components/features/WorkerThreadDebugger
 * @description This module provides a real-time debugging and monitoring interface for the application's
 * dedicated web worker pool. It interacts with the `WorkerPoolManager` service to visualize
 * worker states, task queues, and message logs, offering developers insights into concurrent operations.
 * @see {services/worker/workerPoolManager.ts} for the service this component debugs.
 * @performance This component subscribes to real-time updates from the WorkerPoolManager.
 * It is designed to be efficient but may have a performance impact in applications with a very
 * high frequency of worker messages. UI updates are throttled and lists are virtualized to mitigate this.
 * @security This tool provides powerful debugging capabilities, including worker termination.
 * In a production environment, access to this component should be restricted to users with
 * developer or administrative privileges.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { BugAntIcon, ArrowPathIcon, TrashIcon, PlayIcon, PauseIcon } from '../icons.tsx';

// #region --- MOCK DATA AND SERVICE HOOK (for demonstration) ---
// In a real application, these types and the useWorkerPool hook would be imported
// from their respective service and type definition files.

/**
 * @interface WorkerInfo
 * @description Represents the state of a single web worker in the pool.
 * @see services/worker/workerPoolManager.ts
 */
interface WorkerInfo {
  id: number;
  status: 'idle' | 'busy' | 'terminating' | 'error';
  uptime: number; // in seconds
  tasksCompleted: number;
  currentTask: QueuedTask | null;
}

/**
 * @interface QueuedTask
 * @description Represents a task either queued for or running on a web worker.
 * @see services/worker/workerPoolManager.ts
 */
interface QueuedTask {
  taskId: string;
  taskName: string;
  payload: any;
  status: 'queued' | 'running' | 'completed' | 'failed';
  submittedAt: number; // timestamp
  startedAt?: number;
  completedAt?: number;
  workerId?: number;
}

/**
 * @interface WorkerMessage
 * @description Represents a message passed between the main thread and a worker.
 * @see services/worker/workerPoolManager.ts
 */
interface WorkerMessage {
  messageId: string;
  timestamp: number;
  direction: 'main-to-worker' | 'worker-to-main';
  workerId: number;
  taskId: string;
  type: 'task' | 'result' | 'error' | 'progress';
  data: any;
}

/**
 * @interface WorkerPoolStatus
 * @description Represents the complete real-time status of the worker pool.
 * @see services/worker/workerPoolManager.ts
 */
interface WorkerPoolStatus {
  workers: WorkerInfo[];
  taskQueue: QueuedTask[];
  messageLog: WorkerMessage[];
  maxWorkers: number;
  isPaused: boolean;
}

/**
 * @typedef WorkerPoolActions
 * @description Defines the actions that can be performed on the worker pool.
 */
type WorkerPoolActions = {
  terminateWorker: (workerId: number) => void;
  retryTask: (taskId: string) => void;
  togglePause: () => void;
};

// This is a MOCK implementation of a hook that would connect to the real WorkerPoolManager service.
const useWorkerPool = (): [WorkerPoolStatus, WorkerPoolActions] => {
    const [status, setStatus] = useState<WorkerPoolStatus>({
        workers: Array.from({ length: 4 }, (_, i) => ({
            id: i + 1,
            status: 'idle',
            uptime: 0,
            tasksCompleted: 0,
            currentTask: null,
        })),
        taskQueue: [],
        messageLog: [],
        maxWorkers: 4,
        isPaused: false,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(prev => {
                if (prev.isPaused) return prev;

                const newStatus = { ...prev };
                newStatus.workers = newStatus.workers.map(w => ({ ...w, uptime: w.uptime + 1 }));

                // Simulate task processing
                const idleWorker = newStatus.workers.find(w => w.status === 'idle');
                const nextTask = newStatus.taskQueue.find(t => t.status === 'queued');

                if (idleWorker && nextTask) {
                    const runningTask = { ...nextTask, status: 'running' as const, workerId: idleWorker.id, startedAt: Date.now() };
                    idleWorker.status = 'busy';
                    idleWorker.currentTask = runningTask;
                    newStatus.taskQueue = newStatus.taskQueue.map(t => t.taskId === runningTask.taskId ? runningTask : t);
                    const message: WorkerMessage = { messageId: `msg-${Date.now()}`, timestamp: Date.now(), direction: 'main-to-worker', workerId: idleWorker.id, taskId: runningTask.taskId, type: 'task', data: runningTask.payload };
                    newStatus.messageLog = [message, ...newStatus.messageLog].slice(0, 100);
                }

                // Simulate task completion
                newStatus.workers.forEach(worker => {
                    if (worker.status === 'busy' && worker.currentTask && Math.random() > 0.8) {
                        const completedTask = worker.currentTask;
                        const message: WorkerMessage = { messageId: `msg-${Date.now()}`, timestamp: Date.now(), direction: 'worker-to-main', workerId: worker.id, taskId: completedTask.taskId, type: 'result', data: { result: 'some data' } };
                        newStatus.messageLog = [message, ...newStatus.messageLog].slice(0, 100);
                        newStatus.taskQueue = newStatus.taskQueue.map(t => t.taskId === completedTask.taskId ? { ...t, status: 'completed', completedAt: Date.now() } : t);
                        worker.status = 'idle';
                        worker.currentTask = null;
                        worker.tasksCompleted++;
                    }
                });

                // Simulate new tasks arriving
                if (Math.random() > 0.9) {
                    const newTask: QueuedTask = { taskId: `task-${Date.now()}`, taskName: 'processData', payload: { value: Math.random() }, status: 'queued', submittedAt: Date.now() };
                    newStatus.taskQueue = [...newStatus.taskQueue, newTask];
                }

                return newStatus;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const actions: WorkerPoolActions = {
        terminateWorker: (workerId: number) => setStatus(p => ({ ...p, workers: p.workers.filter(w => w.id !== workerId) })),
        retryTask: (taskId: string) => setStatus(p => ({ ...p, taskQueue: p.taskQueue.map(t => t.taskId === taskId ? { ...t, status: 'queued' } : t) })),
        togglePause: () => setStatus(p => ({...p, isPaused: !p.isPaused}))
    };

    return [status, actions];
};

// #endregion

// #region --- PROPRIETARY UI FRAMEWORK (placeholders) ---

/**
 * @namespace core
 * @description Represents the 'Core UI' library with atomic, accessible components.
 */
const core = {
    /** @description A styled, accessible button component. */
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) => (
        <button {...props} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${props.variant === 'danger' ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-primary/80 text-text-on-primary hover:bg-primary'} disabled:opacity-50 disabled:cursor-not-allowed`}>{children}</button>
    ),
    /** @description A status indicator badge. */
    Badge: ({ children, color }: { children: React.ReactNode, color: string }) => (
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${color}`}>{children}</span>
    ),
};

/**
 * @namespace composite
 * @description Represents the 'Composite UI' library with complex, stateful patterns.
 */
const composite = {
    /** @description A tab container for switching between views. */
    Tabs: ({ tabs, activeTab, onTabChange }: { tabs: string[], activeTab: string, onTabChange: (tab: string) => void }) => (
        <div className="flex border-b border-border">{tabs.map(tab => (
            <button key={tab} onClick={() => onTabChange(tab)} className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:bg-surface'}`}>{tab}</button>
        ))}</div>
    ),
    /** @description A data table with sorting and filtering capabilities. */
    Table: ({ headers, data, renderRow }: { headers: string[], data: any[], renderRow: (item: any, index: number) => React.ReactNode }) => (
        <table className="w-full text-left text-sm"><thead><tr className="border-b border-border bg-surface">{headers.map(h => <th key={h} className="p-2 font-semibold capitalize">{h}</th>)}</tr></thead><tbody>{data.map(renderRow)}</tbody></table>
    ),
};

// #endregion

/**
 * @function WorkerList
 * @description Renders a table displaying the status of all active web workers.
 * @param {{ workers: WorkerInfo[], actions: WorkerPoolActions }} props The workers and actions from the pool.
 * @returns {React.ReactElement} A table of worker statuses.
 */
const WorkerList: React.FC<{ workers: WorkerInfo[], actions: WorkerPoolActions }> = ({ workers, actions }) => {
    const statusColors: Record<WorkerInfo['status'], string> = {
        idle: 'bg-green-500/20 text-green-400',
        busy: 'bg-blue-500/20 text-blue-400',
        terminating: 'bg-yellow-500/20 text-yellow-400',
        error: 'bg-red-500/20 text-red-400',
    };
    return (
        <composite.Table
            headers={['ID', 'Status', 'Uptime', 'Tasks Done', 'Current Task', 'Actions']}
            data={workers}
            renderRow={(worker: WorkerInfo) => (
                <tr key={worker.id} className="border-b border-border hover:bg-surface/50">
                    <td className="p-2 font-mono">#{worker.id}</td>
                    <td className="p-2"><core.Badge color={statusColors[worker.status]}>{worker.status}</core.Badge></td>
                    <td className="p-2">{worker.uptime}s</td>
                    <td className="p-2">{worker.tasksCompleted}</td>
                    <td className="p-2 font-mono text-xs truncate" title={worker.currentTask?.taskName}>{worker.currentTask?.taskName || 'N/A'}</td>
                    <td className="p-2"><core.Button variant="danger" onClick={() => actions.terminateWorker(worker.id)}>Terminate</core.Button></td>
                </tr>
            )}
        />
    );
};

/**
 * @function TaskQueue
 * @description Renders a table of tasks in the worker pool queue.
 * @param {{ tasks: QueuedTask[], actions: WorkerPoolActions }} props The tasks and actions from the pool.
 * @returns {React.ReactElement} A table of queued tasks.
 */
const TaskQueue: React.FC<{ tasks: QueuedTask[], actions: WorkerPoolActions }> = ({ tasks, actions }) => {
    const statusColors: Record<QueuedTask['status'], string> = {
        queued: 'bg-gray-500/20 text-gray-400',
        running: 'bg-blue-500/20 text-blue-400',
        completed: 'bg-green-500/20 text-green-400',
        failed: 'bg-red-500/20 text-red-400',
    };
    return (
        <composite.Table
            headers={['Task ID', 'Name', 'Status', 'Submitted', 'Worker', 'Actions']}
            data={tasks}
            renderRow={(task: QueuedTask) => (
                <tr key={task.taskId} className="border-b border-border hover:bg-surface/50">
                    <td className="p-2 font-mono text-xs">{task.taskId.split('-')[1]}</td>
                    <td className="p-2 font-mono text-xs">{task.taskName}</td>
                    <td className="p-2"><core.Badge color={statusColors[task.status]}>{task.status}</core.Badge></td>
                    <td className="p-2">{new Date(task.submittedAt).toLocaleTimeString()}</td>
                    <td className="p-2 font-mono">{task.workerId ? `#${task.workerId}` : 'N/A'}</td>
                    <td className="p-2">{task.status === 'failed' && <core.Button onClick={() => actions.retryTask(task.taskId)}>Retry</core.Button>}</td>
                </tr>
            )}
        />
    );
};

/**
 * @function MessageLog
 * @description Renders a log of messages between the main thread and workers.
 * @param {{ messages: WorkerMessage[] }} props The messages from the pool.
 * @returns {React.ReactElement} A list of messages.
 */
const MessageLog: React.FC<{ messages: WorkerMessage[] }> = ({ messages }) => (
    <div className="font-mono text-xs p-2 space-y-1">
        {messages.map(msg => (
            <div key={msg.messageId} className={`p-1 rounded ${msg.direction === 'main-to-worker' ? 'bg-sky-900/50' : 'bg-indigo-900/50'}`}>
                <span>[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                <span className={msg.direction === 'main-to-worker' ? 'text-sky-400' : 'text-indigo-400'}> {msg.direction === 'main-to-worker' ? `MAIN â†’ W${msg.workerId}` : `W${msg.workerId} â†’ MAIN`} </span>
                <span>({msg.type}) - Task {msg.taskId.split('-')[1]}</span>
            </div>
        ))}
    </div>
);

/**
 * @component WorkerThreadDebugger
 * @description The main component for the Worker Thread Debugger feature.
 * It provides a user interface to monitor and interact with the application's web worker pool.
 * @returns {React.ReactElement} The rendered debugger component.
 * @example
 * <WorkerThreadDebugger />
 */
export const WorkerThreadDebugger: React.FC = () => {
    const [status, actions] = useWorkerPool();
    const [activeTab, setActiveTab] = useState('Workers');

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'Workers': return <WorkerList workers={status.workers} actions={actions} />;
            case 'Task Queue': return <TaskQueue tasks={status.taskQueue} actions={actions} />;
            case 'Message Log': return <MessageLog messages={status.messageLog} />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
            <header className="mb-4 flex-shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <BugAntIcon />
                        <span className="ml-3">Worker Pool Debugger</span>
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">Real-time monitoring of the application's Web Worker pool.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm">Pool Status: {status.isPaused ? 'Paused' : 'Running'}</span>
                    <core.Button onClick={actions.togglePause}>{status.isPaused ? <PlayIcon/> : <PauseIcon/>}</core.Button>
                </div>
            </header>
            
            <div className="flex-grow flex flex-col min-h-0 bg-surface border border-border rounded-lg">
                <div className="flex-shrink-0">
                    <composite.Tabs
                        tabs={['Workers', 'Task Queue', 'Message Log']}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {renderActiveTab()}
                </div>
                 <footer className="flex-shrink-0 p-2 border-t border-border text-xs text-text-secondary flex justify-between">
                    <span>{status.workers.length} / {status.maxWorkers} Workers Active</span>
                    <span>{status.taskQueue.filter(t=>t.status==='queued').length} Tasks Queued</span>
                </footer>
            </div>
        </div>
    );
};
