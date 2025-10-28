/**
 * @file Implements the One-Click Refactor feature, allowing users to apply common
 * refactoring patterns to their code using AI.
 * @module components/features/OneClickRefactor
 * @see {@link @/services/aiService.ts} for AI interaction implementations.
 * @see {@link @/hooks/useWorkerTask.ts} for offloading computations to web workers.
 */

import React, { useState, useCallback } from 'react';
import type { Change } from 'diff';
import {
  refactorForPerformance,
  refactorForReadability,
  generateJsDoc,
  convertToFunctionalComponent
} from '../../services/aiService.ts';

// Conceptual/hypothetical imports from the new UI framework and service layer
import { Button, ButtonGroup } from '@/ui/core/Button';
import { Panel } from '@/ui/composite/Panel';
import { Spinner } from '@/ui/core/Spinner';
import { Typography } from '@/ui/core/Typography';
import { Layout } from '@/ui/core/Layout';
import { SparklesIcon } from '../icons.tsx';
import { useWorkerTask } from '@/hooks/useWorkerTask'; // Conceptual hook
import { CodeEditor } from '@/ui/composite/CodeEditor'; // Conceptual component

/**
 * @typedef {'readability' | 'performance' | 'jsdoc' | 'functional'}
 * @description Represents the specific type of refactoring action to be performed.
 */
type RefactorAction = 'readability' | 'performance' | 'jsdoc' | 'functional';

const exampleCode = `// A less readable component
const MyComponent = ({ data }) => {
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
 * @performance The diffing operation is offloaded to a web worker via the `useWorkerTask` hook.
 * This prevents the main thread from being blocked when comparing large files.
 */
const DiffViewer: React.FC<DiffViewerProps> = ({ oldCode, newCode }) => {
    const { result: diffResult, isLoading } = useWorkerTask<Change[]>('diff-lines', { oldCode, newCode });

    if (isLoading) {
        return <Spinner text="Calculating diff..." />;
    }

    if (!diffResult) {
        return <pre className="whitespace-pre-wrap font-mono text-xs p-4">{newCode}</pre>;
    }

    return (
        <pre className="whitespace-pre-wrap font-mono text-xs p-2">
            {diffResult.map((part, index) => {
                const colorClass = part.added ? 'bg-green-500/20' : part.removed ? 'bg-red-500/20' : 'bg-transparent';
                const prefix = part.added ? '+' : part.removed ? '-' : ' ';
                // Render each line with a prefix
                const lines = part.value.split('\n').map((line, i, arr) => {
                    if (line === '' && i === arr.length - 1 && arr.length > 1) {
                        return null;
                    }
                    return (
                        <div key={`${index}-${i}`} className={colorClass}>
                            <span className="w-5 inline-block text-center select-none opacity-50">{prefix}</span>
                            <span>{line}</span>
                        </div>
                    );
                }).filter(Boolean);

                return <React.Fragment key={index}>{lines}</React.Fragment>;
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
     * @performance Uses streaming responses from the AI service for immediate feedback.
     */
    const handleRefactor = useCallback(async (action: RefactorAction) => {
        if (!code.trim()) return;
        setLoadingAction(action);
        setRefactoredCode('');

        let stream;
        try {
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

            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                // Clean markdown code block fences that the AI might add
                const cleanedChunk = fullResponse.replace(/^```(?:[a-z]*\n)?/, '').replace(/\n?```$/, '');
                setRefactoredCode(cleanedChunk);
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
            <Layout.Header className="mb-4">
                <Typography.Title level={1} icon={<SparklesIcon />} text="One-Click Refactor" />
                <Typography.Text type="secondary" className="mt-1">
                    Apply common refactoring patterns to your code with a single click.
                </Typography.Text>
            </Layout.Header>

            <div className="mb-4">
                <ButtonGroup>
                    <Button onClick={() => handleRefactor('readability')} isLoading={loadingAction === 'readability'}>
                        Improve Readability
                    </Button>
                    <Button onClick={() => handleRefactor('performance')} isLoading={loadingAction === 'performance'}>
                        Boost Performance
                    </Button>
                    <Button onClick={() => handleRefactor('jsdoc')} isLoading={loadingAction === 'jsdoc'}>
                        Add JSDoc
                    </Button>
                    <Button onClick={() => handleRefactor('functional')} isLoading={loadingAction === 'functional'}>
                        To Functional Component
                    </Button>
                </ButtonGroup>
            </div>

            <Layout.Grid columns={2} className="flex-grow min-h-0">
                <Layout.Column>
                    <Panel title="Original Code" className="h-full flex flex-col">
                        <CodeEditor
                            language="javascript"
                            value={code}
                            onValueChange={setCode}
                            className="flex-grow"
                        />
                    </Panel>
                </Layout.Column>
                <Layout.Column>
                    <Panel title="Refactored Code" className="h-full flex flex-col">
                        <div className="flex-grow bg-background rounded overflow-auto border border-border">
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
