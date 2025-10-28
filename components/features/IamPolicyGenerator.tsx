/**
 * @file Implements the IAM Policy Generator feature.
 * @module components/features/IamPolicyGenerator
 * @see @/services/workerPoolManager for the task offloading mechanism.
 * @see @/ui/core for atomic UI components like Button.
 * @see @/ui/composite for complex UI patterns like Page and Card.
 */

import React, { useState, useCallback } from 'react';
import { ShieldCheckIcon } from '../icons';
import { useNotification } from '../../contexts/NotificationContext';
import { workerPoolManager } from '../../services/workerPoolManager';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

/**
 * Represents the available cloud platforms for IAM policy generation.
 * @typedef {'aws' | 'gcp' | 'azure'} CloudPlatform
 */
type CloudPlatform = 'aws' | 'gcp' | 'azure';

/**
 * The IamPolicyGenerator component allows users to generate cloud IAM policies
 * from a natural language description.
 *
 * @description This component provides a user interface for describing desired permissions
 * and selecting a cloud platform (AWS, GCP, or Azure). It offloads the AI-powered policy
 * generation task to a web worker via the `workerPoolManager` to keep the UI responsive.
 * The generated policy is streamed back and displayed in a code block.
 * @component
 * @example
 * return <IamPolicyGenerator />
 */
export const IamPolicyGenerator: React.FC = () => {
    const [description, setDescription] = useState<string>('A user role that can read from S3 buckets but not write or delete.');
    const [platform, setPlatform] = useState<CloudPlatform>('aws');
    const [policy, setPolicy] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const { addNotification } = useNotification();

    /**
     * @function handleGenerate
     * @description Enqueues a task with the WorkerPoolManager to generate an IAM policy.
     * It handles the streaming response from the worker, updating the UI in real-time.
     * @performance Offloads the AI call and stream processing to a web worker, preventing main thread blockage.
     * @security The description is sent to the backend for processing by the AI model; no secrets are handled here.
     * @returns {void}
     */
    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please provide a description of the desired permissions.');
            return;
        }

        setIsLoading(true);
        setError('');
        setPolicy('');

        try {
            const stream = workerPoolManager.streamTask('generateIamPolicy', { description, platform });
            let accumulatedPolicy = '';
            for await (const chunk of stream) {
                accumulatedPolicy += chunk;
                setPolicy(accumulatedPolicy);
            }
            addNotification('IAM policy generated successfully.', 'success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate policy: ${errorMessage}`);
            addNotification('Failed to generate IAM policy.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [description, platform, addNotification]);

    const platformOptions: { label: string; value: CloudPlatform }[] = [
        { label: 'AWS', value: 'aws' },
        { label: 'GCP', value: 'gcp' },
        { label: 'Azure', value: 'azure' },
    ];

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ShieldCheckIcon />
                    <span className="ml-3">AI IAM Policy Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Generate AWS, GCP, or Azure IAM policies from a natural language description.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* --- Configuration Column --- */}
                <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Configuration</h2>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Cloud Platform</label>
                        <div className="flex rounded-md bg-background border border-border p-1">
                            {platformOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPlatform(opt.value)}
                                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        platform === opt.value
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-grow flex flex-col">
                        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">Describe the desired permissions</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex-grow w-full p-4 bg-background border border-border rounded-md resize-y font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g., A role for a lambda function that can read from a DynamoDB table."
                            rows={10}
                        />
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading} className="btn-primary w-full py-3 flex items-center justify-center">
                        {isLoading ? <LoadingSpinner /> : 'Generate Policy'}
                    </button>
                </div>

                {/* --- Output Column --- */}
                <div className="bg-surface border border-border rounded-lg p-6 flex flex-col">
                    <h2 className="text-xl font-semibold mb-2">Generated Policy (JSON)</h2>
                    <div className="flex-grow bg-background border border-border rounded-lg overflow-y-auto relative">
                        {isLoading && !policy && (
                            <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                                <LoadingSpinner />
                                <span className="ml-2">AI is generating the policy...</span>
                            </div>
                        )}
                        {error && <div className="p-4 text-red-500 font-mono text-sm"><strong>Error:</strong> {error}</div>}
                        {!isLoading && !error && (
                            <div className="p-1">
                                <MarkdownRenderer content={`\`\`\`json\n${policy || '// Generated policy will appear here.'}\n\`\`\``} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
