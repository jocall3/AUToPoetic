/**
 * @file Taskbar.tsx
 * @module components/desktop/Taskbar
 * @description This module exports the Taskbar component, which is responsible for displaying and managing
 * running and minimized applications within the workspace. It acts as a presentational component,
 * receiving its state from the active Workspace Provider.
 *
 * @security This component displays application names but does not handle sensitive data directly.
 *           Actions dispatched from this component are handled by the WorkspaceManager service.
 * @performance The component is optimized to re-render only when the list of active tasks changes.
 *              It uses memoized components for individual task buttons.
 *
 * @see {@link @workspace/core#WorkspaceManager} for the service layer managing tasks.
 * @see {@link @ui/core#Button} for the underlying button component.
 */

import React from 'react';

// Per architectural directives, we would import these from centralized locations.
// For this task, we define them locally.
// import { Task } from '@workspace/core/types';

/**
 * @interface Task
 * @description Represents a running application or process within the workspace.
 * This is a core domain model for the WorkspaceManager.
 *
 * @property {string} id - The unique identifier for the task.
 * @property {string} name - The display name of the task/application.
 * @property {React.ReactNode} icon - The React node for the icon representing the task.
 * @property {'running' | 'minimized' | 'inactive'} status - The current status of the task.
 * @example
 * const myTask: Task = {
 *   id: 'feature-ai-explainer',
 *   name: 'AI Code Explainer',
 *   icon: <SomeIcon />,
 *   status: 'minimized'
 * };
 */
export interface Task {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'running' | 'minimized' | 'inactive';
}

/**
 * @interface TaskbarItemProps
 * @description Defines props for an individual item (a running application) in the taskbar.
 *
 * @property {Task} task - The task to display.
 * @property {boolean} isActive - Whether the task is currently the active one in the workspace.
 * @property {() => void} onClick - Callback function for when the item is clicked.
 */
interface TaskbarItemProps {
  task: Task;
  isActive: boolean;
  onClick: () => void;
}

/**
 * A memoized component representing a single application button in the taskbar.
 *
 * @component
 * @param {TaskbarItemProps} props - The props for the component.
 * @returns {React.ReactElement} - A memoized button element for a task.
 * @private
 */
const TaskbarItem: React.FC<TaskbarItemProps> = React.memo(({ task, isActive, onClick }) => {
  /**
   * Determines the visual style of the taskbar item based on its state.
   * This logic is centralized here to keep the JSX clean.
   *
   * @returns {string} The computed CSS class string for the button.
   * @example
   * getBaseClasses() // returns "h-8 px-3 flex items-center gap-2..."
   */
  const getBaseClasses = (): string => {
    let classes = "h-8 px-3 flex items-center gap-2 rounded-md transition-colors duration-150 text-sm truncate max-w-40";
    if (isActive) {
      classes += " bg-primary/20 text-primary font-semibold";
    } else if (task.status === 'minimized') {
      classes += " bg-surface/50 hover:bg-surface/80 text-text-secondary border border-transparent hover:border-border";
    } else {
      classes += " bg-transparent hover:bg-surface text-text-primary";
    }
    return classes;
  };

  return (
      <button
        onClick={onClick}
        className={getBaseClasses()}
        title={task.name}
        aria-label={`Switch to ${task.name}`}
        aria-pressed={isActive}
      >
        <div className="w-4 h-4 flex-shrink-0">{task.icon}</div>
        <span className="truncate">{task.name}</span>
      </button>
  );
});

TaskbarItem.displayName = 'TaskbarItem';

/**
 * @interface TaskbarProps
 * @description Defines the props for the Taskbar component, making it a controlled, presentational component.
 *
 * @property {Task[]} tasks - The list of all tasks currently managed by the workspace.
 * @property {(id: string) => void} onTaskClick - Callback function to handle clicks on a task item.
 *                                                 This should typically focus or restore the application window.
 * @property {string | null} activeTaskId - The ID of the currently active/focused task in the workspace.
 */
export interface TaskbarProps {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  activeTaskId: string | null;
}

/**
 * Renders the main taskbar of the application workspace.
 *
 * @description The Taskbar is a core component of the "Desktop Mode" workspace provider.
 * It displays icons for all running applications, allowing users to switch between them.
 * It provides visual feedback for active and minimized tasks. This component is a thin
 * presentation layer, receiving its state from a higher-order component or context
 * provider like `DesktopModeProvider`.
 *
 * @component
 * @example
 * const tasks = [{ id: '1', name: 'Code Editor', icon: <CodeIcon/>, status: 'running' }];
 * return <Taskbar tasks={tasks} onTaskClick={(id) => console.log(id)} activeTaskId={'1'} />;
 *
 * @see {@link @workspace/core#useWorkspace} A hook that would provide the necessary state for this component.
 * @see {@link @workspace/providers#DesktopModeProvider} A potential parent provider for the desktop layout.
 */
export const Taskbar: React.FC<TaskbarProps> = ({ tasks, onTaskClick, activeTaskId }) => {
  return (
    <div
      className="h-10 bg-surface/80 backdrop-blur-sm border-t border-border flex items-center px-2 gap-2 flex-shrink-0"
      role="toolbar"
      aria-label="Taskbar"
    >
      {tasks.map(task => (
        <TaskbarItem
          key={task.id}
          task={task}
          isActive={task.id === activeTaskId}
          onClick={() => onTaskClick(task.id)}
        />
      ))}
    </div>
  );
};