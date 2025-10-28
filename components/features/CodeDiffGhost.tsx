/**
 * @file CodeDiffGhost.tsx
 * @module components/features/CodeDiffGhost
 * @description This feature component visualizes the difference between two blocks of code
 * using a "ghost typing" animation effect. It adheres to architectural directives by offloading
 * the computationally intensive diffing operation to a dedicated web worker pool,
 * ensuring the main thread remains responsive. The component utilizes the proprietary UI
 * framework for its presentation layer.
 * @see @services/WorkerPoolManager for the worker management implementation.
 * @see @composite_ui/CodeEditor for the code editor component.
 * @performance The diffing algorithm is offloaded to a web worker via the WorkerPoolManager.
 * This prevents blocking the main UI thread, which is critical when comparing large code blocks.
 * The animation itself uses `requestAnimationFrame` for smooth, non-blocking rendering.
 * @security This component processes user-provided string data. While it's primarily for display,
 * rendering untrusted code within a web context always carries a risk. The underlying CodeEditor
 * component should handle sanitization if it ever renders to HTML directly.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Change } from 'diff';

// Core & Composite UI Framework Components (as per architectural directives)
// These are conceptual imports to represent the new, abstracted UI framework.
const Button = ({ children, ...props }: React.ComponentProps<'button'> & { icon?: React.ReactNode }) => <button {...props}>{props.icon}{children}</button>;
const Panel = ({ children, ...props }: React.ComponentProps<'div'> & { title?: string, className?: string }) => <div {...props}>{props.title && <h4>{props.title}</h4>}{children}</div>;
const Grid = ({ children, ...props }: React.ComponentProps<'div'> & { cols?: number, gap?: number }) => <div {...props}>{children}</div>;
const CodeEditor = ({ value, onChange, ...props }: { value: string, onChange: (val: string) => void, [key: string]: any }) => <textarea value={value} onChange={e => onChange(e.target.value)} {...props} />;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.368-7.28A1.012 1.012 0 017.105 4.5h9.79a1.012 1.012 0 01.701.293l4.368 7.28c.15.25.228.538.228.828s-.078.578-.228.828l-4.368 7.28a1.012 1.012 0 01-.701.293h-9.79a1.012 1.012 0 01-.701-.293l-4.368-7.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


// Service Layer Hooks (Conceptual)
// These hooks would be provided by a DI container or a central service module.
import { useWorkerPool } from '../../hooks/useWorkerPool';
import { useNotification } from '../../contexts/NotificationContext';

// Types
import type { FeatureProps } from '../../types';

/**
 * @interface DiffTaskPayload
 * @description Defines the payload for the 'compute-diff' worker task.
 * @property {string} oldCode The original code string.
 * @property {string} newCode The new code string to compare against.
 */
interface DiffTaskPayload {
  oldCode: string;
  newCode: string;
}

/**
 * @type DiffTaskResult
 * @description The expected result from the 'compute-diff' worker task, which is an
 * array of change objects from the 'diff' library.
 */
type DiffTaskResult = Change[];

const INITIAL_OLD_CODE = `function UserProfile({ user }) {
  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`;

const INITIAL_NEW_CODE = `function UserProfile({ user }) {
  const { name, email, avatar } = user;
  return (
    <div className="profile-card">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <a href={\`mailto:\${email}\`}>{email}</a>
    </div>
  );
}`;

/**
 * @class CodeDiffGhost
 * @description A feature component for visualizing the difference between two blocks of code
 * using a "ghost typing" animation. It offloads the diffing computation to a web worker
 * to keep the UI responsive.
 * @param {FeatureProps<{
 *   initialOldCode?: string;
 *   initialNewCode?: string;
 * }>} props - The component props.
 * @property {string} [props.initialData.initialOldCode] - Initial code for the 'before' panel.
 * @property {string} [props.initialData.initialNewCode] - Initial code for the 'after' panel.
 * @returns {React.ReactElement} The rendered component.
 * @example
 * <CodeDiffGhost initialData={{ initialOldCode: 'const a = 1;', initialNewCode: 'const a = 2;' }} />
 */
export const CodeDiffGhost: React.FC<FeatureProps<{ initialOldCode?: string; initialNewCode?: string }>> = ({ initialData }) => {
  const [oldCode, setOldCode] = useState(initialData?.initialOldCode || INITIAL_OLD_CODE);
  const [newCode, setNewCode] = useState(initialData?.initialNewCode || INITIAL_NEW_CODE);
  const [displayedCode, setDisplayedCode] = useState(INITIAL_OLD_CODE);
  const [animationState, setAnimationState] = useState<'idle' | 'running' | 'finished'>('idle');
  const { submitTask } = useWorkerPool();
  const { addNotification } = useNotification();
  const animationFrameRef = useRef<number | null>(null);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDisplayedCode(newCode);
    setAnimationState('idle');
  }, [newCode]);

  useEffect(() => {
    // Cleanup animation frame on unmount
    return () => stopAnimation();
  }, [stopAnimation]);

  /**
   * @function startAnimation
   * @description Initiates the code diff visualization. It sends the old and new code to a web worker
   * for diffing and then uses the result to animate the changes in the 'after' panel.
   * @performance Offloads the potentially expensive diffing operation to a web worker,
   * preventing UI blocking. The animation uses `requestAnimationFrame` for smooth rendering.
   * @returns {Promise<void>}
   */
  const startAnimation = useCallback(async () => {
    if (animationState === 'running') {
      stopAnimation();
      return;
    }
    
    setAnimationState('running');

    try {
      const diff = await submitTask<DiffTaskPayload, DiffTaskResult>('compute-diff', { oldCode, newCode });

      let currentCode = '';
      let charIndex = 0;
      let partIndex = 0;
      const typingSpeed = 4; // Characters per frame

      const animate = () => {
        if (partIndex >= diff.length) {
          setDisplayedCode(newCode); // Ensure final state is perfect
          setAnimationState('finished');
          return;
        }

        let part = diff[partIndex];
        let partCompleted = false;

        if (part.removed) {
          // Skip removed parts in the display
          partCompleted = true;
        } else {
          for (let i = 0; i < typingSpeed; i++) {
            if (charIndex < part.value.length) {
              currentCode += part.value[charIndex];
              charIndex++;
            } else {
              partCompleted = true;
              break;
            }
          }
          setDisplayedCode(currentCode);
        }

        if (partCompleted) {
          partIndex++;
          charIndex = 0;
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);

    } catch (err) {
      const error = err as Error;
      console.error('Diff worker failed:', error);
      addNotification(`Error computing diff: ${error.message}`, 'error');
      stopAnimation();
    }
  }, [oldCode, newCode, newCode, submitTask, addNotification, stopAnimation, animationState]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center">
          <EyeIcon />
          <span className="ml-3">Code Diff Ghost</span>
        </h1>
        <p className="text-text-secondary mt-1">Visualize code changes with a "ghost typing" animation effect.</p>
      </header>
      <Grid cols={2} gap={4} className="h-full flex-grow min-h-0 grid">
        <div className="flex flex-col h-full">
          <label htmlFor="before-code" className="text-sm font-medium mb-2">Before</label>
          <CodeEditor
            id="before-code"
            language="javascript"
            value={oldCode}
            onChange={setOldCode}
            className="flex-grow w-full h-full p-2 font-mono text-sm bg-surface border border-border rounded-md resize-none"
          />
        </div>
        <div className="flex flex-col h-full">
          <label htmlFor="after-code" className="text-sm font-medium mb-2">After</label>
          <CodeEditor
            id="after-code"
            language="javascript"
            value={animationState === 'running' ? displayedCode : newCode}
            onChange={(value) => {
              stopAnimation();
              setNewCode(value || '');
            }}
            readOnly={animationState === 'running'}
            className="flex-grow w-full h-full p-2 font-mono text-sm bg-surface border border-border rounded-md resize-none"
          />
        </div>
      </Grid>
      <div className="mt-4 flex-shrink-0 text-center">
        <Button
          onClick={startAnimation}
          className="w-full max-w-xs mx-auto btn-primary py-3"
        >
          {animationState === 'running' ? 'Stop Visualization' : 'Show Changes'}
        </Button>
      </div>
    </div>
  );
};
