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
import { Button } from '@core_ui/Button';
import { Panel } from '@composite_ui/Panel';
import { Grid } from '@composite_ui/Grid';
import { CodeEditor } from '@composite_ui/CodeEditor';
import { EyeIcon } from '@core_ui/icons';

// Service Layer Hooks
import { useWorkerPool } from '@hooks/useWorkerPool';
import { useNotification } from '@contexts/NotificationContext';

// Types
import type { FeatureProps } from '@types';

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
      <a href={\`mailto: \"\"\"\"\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[-1..-1]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[Object]\\[-2..-1]\\{email}\	}\\'{email}\\'{email}\\'{email}</a>
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
  const [displayedCode, setDisplayedCode] = useState(INITIAL_NEW_CODE);
  const [animationState, setAnimationState] = useState<'idle' | 'running' | 'finished'>('idle');
  const { submitTask } = useWorkerPool();
  const { addNotification } = useNotification();
  const animationFrameRef = useRef<number | null>(null);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAnimationState('idle');
  }, []);

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
    stopAnimation();
    setAnimationState('running');

    try {
      const diff = await submitTask<DiffTaskPayload, DiffTaskResult>('compute-diff', { oldCode, newCode });

      let currentCode = '';
      let charIndex = 0;
      let partIndex = 0;
      const typingSpeed = 2; // Characters per frame

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
      setAnimationState('idle');
      setDisplayedCode(newCode); // Show final state on error
    }
  }, [oldCode, newCode, submitTask, addNotification, stopAnimation]);

  return (
    <Panel className="h-full">
      <Panel.Header icon={<EyeIcon />} title="Code Diff Ghost">
        <p>Visualize code changes with a "ghost typing" animation effect.</p>
      </Panel.Header>
      <Panel.Body className="flex-grow p-4">
        <Grid cols={2} gap={4} className="h-full">
          <div className="flex flex-col h-full">
            <label htmlFor="before-code" className="text-sm font-medium mb-2">Before</label>
            <CodeEditor
              id="before-code"
              language="javascript"
              value={oldCode}
              onChange={setOldCode}
              options={{ theme: 'vs-dark' }}
            />
          </div>
          <div className="flex flex-col h-full">
            <label htmlFor="after-code" className="text-sm font-medium mb-2">After</label>
            <CodeEditor
              id="after-code"
              language="javascript"
              value={animationState === 'idle' || animationState === 'finished' ? newCode : displayedCode}
              onChange={(value) => {
                stopAnimation();
                setNewCode(value || '');
                setDisplayedCode(value || '');
              }}
              options={{ theme: 'vs-dark' }}
            />
          </div>
        </Grid>
      </Panel.Body>
      <Panel.Footer>
        <Button
          onClick={startAnimation}
          disabled={animationState === 'running'}
          variant="primary"
          className="w-full max-w-xs mx-auto"
        >
          {animationState === 'running' ? 'Visualizing...' : 'Show Changes'}
        </Button>
      </Panel.Footer>
    </Panel>
  );
};
