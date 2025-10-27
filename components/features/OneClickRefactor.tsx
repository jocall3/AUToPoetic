/**
 * @file Implements the One-Click Refactor feature, allowing users to apply common
 * refactoring patterns to their code using AI.
 * @module components/features/OneClickRefactor
 * @see {@link @/services/aiService.ts} for AI interaction implementations.
 * @see {@link @/hooks/useWorkerTask.ts} for offloading computations to web workers.
 */

import React, { useState, useCallback, useMemo } from 'react';
import * as Diff from 'diff';
import { 
    applySpecificRefactor,
    refactorForPerformance,
    refactorForReadability,
    generateJsDoc,
    convertToFunctionalComponent
} from '../../services/aiService.ts';

// Hypothetical imports from the new UI framework
import { Button, ButtonGroup } from '@/components/core-ui/Button';
import { CodeEditor } from '@/components/composite-ui/CodeEditor';
import { Panel } from '@/components/composite-ui/Panel';
import { ActionBar } from '@/components/composite-ui/ActionBar';
import { Spinner } from '@/components/core-ui/Spinner';
import { Typography } from '@/components/core-ui/Typography';
import { Layout } from '@/components/core-ui/Layout';
import { SparklesIcon } from '../icons.tsx';
import { useWorkerTask } from '@/hooks/useWorkerTask';

/**
 * @typedef {'readability' | 'performance' | 'jsdoc' | 'functional' | 'custom'} RefactorAction
 * @description Represents the specific type of refactoring action to be performed.
 * @property {'readability'} readability - Refactors code for better clarity and maintainability.
 * @property {'performance'} performance - Refactors code to improve execution speed or memory usage.
 * @property {'jsdoc'} jsdoc - Generates JSDoc comments for the given code.
 * @property {'functional'} functional - Converts a class-based component to a functional component with hooks.
 * @property {'custom'} custom - A placeholder for custom, user-defined refactoring instructions (not yet implemented).
 */
type RefactorAction = 'readability' | 'performance' | 'jsdoc' | 'functional' | 'custom';

const exampleCode = `const MyComponent = ({ data }) => {
  // A less readable component
  let transformedData = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].value > 50) {
      let item = { ...data[i], status: 'high' };
      transformedData.push(item);
    }
  }
  return (
    <div>
      {transformedData.map(d => <p key={d.id}>{d.name}</p>)}    </div>
  );
}`;

/**
 * @interface DiffViewerProps
 * @description Props for the DiffViewer component.
 */
interface DiffViewerProps {
    /** The original code string before changes. */
    oldCode: string;
    /** The new code string after changes. */
    newCode: string;
}

/**
 * A component that renders a visual difference between two strings of code.
 * It offloads the expensive diffing computation to a dedicated web worker.
 * 
 * @component
 * @param {DiffViewerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered diff viewer.
 * @performance The diffing operation (`Diff.diffLines`) is offloaded to a web worker
 * via the `useWorkerTask` hook. This prevents the main thread from being blocked when comparing large files,
 * ensuring a smooth user experience.
 * @example
 * <DiffViewer oldCode="const a = 1;" newCode="const a = 2;" />
 */
const DiffViewer: React.FC<DiffViewerProps> = ({ oldCode, newCode }) => {
    const { result: diffResult, isLoading } = useWorkerTask<Diff.Change[]>('diff-lines', { oldCode, newCode });

    if (isLoading) {
        return <Spinner text="Calculating diff..." />;
    }

    return (
        <pre className="whitespace-pre-wrap font-mono text-xs">
            {diffResult?.map((part, index) => {
                const colorClass = part.added ? 'bg-green-500/20' : part.removed ? 'bg-red-500/20' : 'bg-transparent';
                return <div key={index} className={colorClass}>{part.value}</div>;
            })}
        </pre>
    );
};

/**
 * A feature component that allows users to apply various AI-powered refactoring
 * patterns to a given code snippet with a single click.
 * It presents a side-by-side view of the original and refactored code.
 * 
 * @component
 * @returns {React.ReactElement} The rendered One-Click Refactor feature.
 * @security Code entered by the user is sent to an external AI service for processing.
 * No secrets or sensitive data should be pasted into this tool.
 * The component itself does not execute any of the provided code.
 */
export const OneClickRefactor: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [refactoredCode, setRefactoredCode] = useState('');
    const [loadingAction, setLoadingAction] = useState<RefactorAction | null>(null);

    /**
     * @function handleRefactor
     * @description Initiates a refactoring process based on the selected action.
     * It calls the appropriate AI service, streams the response, and updates the UI.
     * @param {RefactorAction} action - The type of refactoring to perform.
     * @returns {Promise<void>}
     * @performance This function uses streaming responses from the AI service to update the UI
     * progressively, providing immediate feedback to the user instead of waiting for the full response.
     */
    const handleRefactor = useCallback(async (action: RefactorAction) => {
        if (!code.trim()) return;
        setLoadingAction(action);
        setRefactoredCode('');

        let stream;
        switch(action) {
            case 'readability':
                stream = refactorForReadability(code);
                break;
            case 'performance':
                stream = refactorForPerformance(code);
                break;
            case 'jsdoc':
                stream = generateJsDoc(code);
                break;
            case 'functional':
                stream = convertToFunctionalComponent(code);
                break;
            default:
                setLoadingAction(null);
                return;
        }

        try {
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setRefactoredCode(fullResponse.replace(/^```(?:
|\w+\n)?/, '').replace(/```$/, ''));
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Unknown error during refactoring.';
            setRefactoredCode(`// Error: ${errorMessage}`);
        } finally {
            setLoadingAction(null);
        }
    }, [code]);

    return (
        <Layout.Root className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <Layout.Header className="mb-6">
                <Typography.Title level={1} icon={<SparklesIcon />} text="One-Click Refactor" />
                <Typography.Text type="secondary" className="mt-1">
                    Apply common refactoring patterns to your code with a single click.
                </Typography.Text>
            </Layout.Header>

            <ActionBar className="mb-4">
                <ButtonGroup>
                    <Button onClick={() => handleRefactor('readability')} isLoading={loadingAction === 'readability'} variant="primary">
                        Improve Readability
                    </Button>
                    <Button onClick={() => handleRefactor('performance')} isLoading={loadingAction === 'performance'} variant="primary">
                        Boost Performance
                    </Button>
                    <Button onClick={() => handleRefactor('jsdoc')} isLoading={loadingAction === 'jsdoc'} variant="primary">
                        Add JSDoc
                    </Button>
                    <Button onClick={() => handleRefactor('functional')} isLoading={loadingAction === 'functional'} variant="primary">
                        To Functional Component
                    </Button>
                </ButtonGroup>
            </ActionBar>

            <Layout.Grid columns={2} className="flex-grow min-h-0">
                <Layout.Column>
                    <Panel title="Original Code" className="h-full flex flex-col">
                        <CodeEditor
                            language="javascript"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="flex-grow"
                        />
                    </Panel>
                </Layout.Column>
                <Layout.Column>
                    <Panel title="Refactored Code" className="h-full flex flex-col">
                        <div className="flex-grow p-2 bg-background rounded overflow-auto">
                            {loadingAction ? 
                                <div className="flex justify-center items-center h-full">
                                    <Spinner text={`Applying ${loadingAction} refactor...`} />
                                </div> : 
                                <DiffViewer oldCode={code} newCode={refactoredCode} />
                            }
                        </div>
                    </Panel>
                </Layout.Column>
            </Layout.Grid>
        </Layout.Root>
    );
};