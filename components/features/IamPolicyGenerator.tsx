/**
 * @file Implements the IAM Policy Generator feature.
 * @module components/features/IamPolicyGenerator
 * @see @/services/WorkerPoolManager for the task offloading mechanism.
 * @see @/ui/core for atomic UI components like Button.
 * @see @/ui/composite for complex UI patterns like Page and Card.
 */

import React, { useState, useCallback } from 'react';
import { Page, Card, Form, CodeBlock, Spinner, Alert, Grid } from '@/ui/composite';
import { Button, SegmentedControl, TextArea } from '@/ui/core';
import { ShieldCheckIcon } from '@/ui/icons';
import { workerPoolManager } from '@/services/WorkerPoolManager';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * Represents the available cloud platforms for IAM policy generation.
 * @typedef {'aws' | 'gcp'} CloudPlatform
 */
type CloudPlatform = 'aws' | 'gcp';

/**
 * The IamPolicyGenerator component allows users to generate cloud IAM policies
 * from a natural language description.
 *
 * @description This component provides a user interface for describing desired permissions
 * and selecting a cloud platform (AWS or GCP). It offloads the AI-powered policy
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
            let accumulatedPolicy = '';
            await workerPoolManager.enqueueTask({
                task: 'generateIamPolicy',
                payload: { description, platform },
                onChunk: (chunk) => {
                    if (typeof chunk === 'string') {
                        accumulatedPolicy += chunk;
                        setPolicy(accumulatedPolicy);
                    }
                },
                onComplete: () => {
                    setIsLoading(false);
                    addNotification('IAM policy generated successfully.', 'success');
                },
                onError: (err) => {
                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred in the worker.';
                    setError(errorMessage);
                    setIsLoading(false);
                    addNotification('Failed to generate IAM policy.', 'error');
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to enqueue task: ${errorMessage}`);
            setIsLoading(false);
            addNotification('Failed to start policy generation task.', 'error');
        }
    }, [description, platform, addNotification]);

    const platformOptions = [
        { label: 'AWS', value: 'aws' },
        { label: 'GCP', value: 'gcp' },
    ];

    return (
        <Page.Root>
            <Page.Header
                icon={<ShieldCheckIcon />}
                title="IAM Policy Generator"
                description="Generate AWS or GCP IAM policies from a natural language description."
            />
            <Page.Content>
                <Grid.Root columns={2} gap="6">
                    <Grid.Item>
                        <Card.Root className="flex flex-col h-full">
                            <Card.Header>
                                <Card.Title>Configuration</Card.Title>
                            </Card.Header>
                            <Card.Content className="flex-grow flex flex-col gap-4">
                                <Form.Field>
                                    <Form.Label>Cloud Platform</Form.Label>
                                    <SegmentedControl
                                        options={platformOptions}
                                        value={platform}
                                        onChange={(value) => setPlatform(value as CloudPlatform)}
                                    />
                                </Form.Field>
                                <Form.Field className="flex-grow flex flex-col">
                                    <Form.Label htmlFor="description">Describe the desired permissions</Form.Label>
                                    <TextArea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="flex-grow"
                                        placeholder="e.g., A role for a lambda function that can read from a DynamoDB table."
                                    />
                                </Form.Field>
                            </Card.Content>
                            <Card.Footer>
                                <Button onClick={handleGenerate} disabled={isLoading} fullWidth>
                                    {isLoading ? <Spinner text="Generating..." /> : 'Generate Policy'}
                                </Button>
                            </Card.Footer>
                        </Card.Root>
                    </Grid.Item>
                    <Grid.Item>
                        <Card.Root className="flex flex-col h-full">
                             <Card.Header>
                                <Card.Title>Generated Policy (JSON)</Card.Title>
                            </Card.Header>
                            <Card.Content className="flex-grow relative">
                                {isLoading && !policy && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Spinner text="AI is generating the policy..." />
                                    </div>
                                )}
                                {error && <Alert variant="destructive" title="Error" description={error} />}
                                {!isLoading && !error && (
                                     <CodeBlock
                                        language="json"
                                        code={policy || '// Generated policy will appear here.'}
                                        showCopyButton={!!policy}
                                    />
                                )}
                            </Card.Content>
                        </Card.Root>
                    </Grid.Item>
                </Grid.Root>
            </Page.Content>
        </Page.Root>
    );
};
