/**
 * @file components/features/TerraformGenerator.tsx
 * @description This file contains the TerraformGenerator feature component.
 * It allows users to generate Terraform configuration files for AWS, GCP, or Azure
 * from a natural language description, leveraging an AI backend service.
 * @module TerraformGenerator
 * @security This component interacts with AI services. All user input (description)
 * is sent to the backend. The component itself does not handle sensitive data, but
 * the AI service it calls must be trusted. Input is not sanitized before being sent
 * to the AI as the AI is expected to handle natural language.
 * @performance AI generation is offloaded to a web worker to prevent blocking the main thread.
 * The UI remains responsive while the configuration is being generated.
 */

import React, { useState, useCallback, useEffect } from 'react';

// Assumed imports from the new, refactored architecture
import { useWorkerTask } from '../../hooks/useWorkerTask';
import { useNotification } from '../../contexts/NotificationContext';
import { Button } from '../../ui/core/Button';
import { Select } from '../../ui/core/Select';
import { Input } from '../../ui/core/Input';
import { Card, CardContent, CardHeader } from '../../ui/composite/Card';
import { Page, PageHeader } from '../../ui/composite/Page';
import { Grid, GridItem } from '../../ui/core/Grid';
import { Spinner } from '../../ui/core/Spinner';
import { Alert } from '../../ui/core/Alert';
import { MarkdownRenderer } from '../../ui/composite/MarkdownRenderer';
import { CpuChipIcon, SparklesIcon } from '../icons';

/**
 * @typedef {"aws" | "gcp" | "azure"} CloudProvider
 * @description Represents the supported cloud providers for Terraform generation.
 */
type CloudProvider = 'aws' | 'gcp' | 'azure';

/**
 * The TerraformGenerator component provides a UI for generating Terraform configurations.
 * Users can select a cloud provider, describe the desired infrastructure, and the
 * component will use a web worker to communicate with an AI service to generate
 * the corresponding Terraform HCL code.
 *
 * @component
 * @example
 * ```tsx
 * <TerraformGenerator />
 * ```
 */
export const TerraformGenerator: React.FC = () => {
    const [description, setDescription] = useState<string>('An S3 bucket for static website hosting with a public read policy');
    const [cloud, setCloud] = useState<CloudProvider>('aws');
    const [displayConfig, setDisplayConfig] = useState<string>('');
    const [displayError, setDisplayError] = useState<string>('');
    const { addNotification } = useNotification();

    const { execute: executeGenerate, result: config, isLoading, error } = useWorkerTask<string>('generateTerraformConfig');

    /**
     * Handles the "Generate Configuration" button click.
     * It validates the input and triggers the web worker task with the current state.
     *
     * @function
     * @performance This function is lightweight as it only dispatches a task to a worker,
     * not performing the heavy computation itself.
     */
    const handleGenerate = useCallback(() => {
        setDisplayError('');
        if (!description.trim()) {
            setDisplayError('Please provide a description of the infrastructure.');
            addNotification('Infrastructure description cannot be empty.', 'error');
            return;
        }

        // Context is stubbed for now but demonstrates future capability
        const context = 'User might have existing VPCs. Check before creating new ones.';
        executeGenerate({ cloud, description, context });
        addNotification('Generating Terraform configuration...', 'info');
    }, [description, cloud, executeGenerate, addNotification]);

    useEffect(() => {
        if (config) {
            setDisplayConfig(config);
            addNotification('Terraform configuration generated successfully.', 'success');
        }
    }, [config, addNotification]);
    
    useEffect(() => {
        if (error) {
            const errorMessage = error.message || 'An unknown error occurred while generating the configuration.';
            setDisplayError(errorMessage);
            addNotification(errorMessage, 'error');
        }
    }, [error, addNotification]);

    return (
        <Page>
            <PageHeader
                icon={<CpuChipIcon />}
                title="AI Terraform Generator"
                subtitle="Generate infrastructure-as-code from a natural language description."
            />
            <div className="flex flex-col gap-6">
                <Card>
                    <CardContent>
                        <Grid columns={1} mdColumns={3} gap="4" alignItems="end">
                            <GridItem>
                                <Select
                                    label="Cloud Provider"
                                    value={cloud}
                                    onValueChange={(value) => setCloud(value as CloudProvider)}
                                    options={[
                                        { label: 'AWS', value: 'aws' },
                                        { label: 'GCP', value: 'gcp' },
                                        { label: 'Azure', value: 'azure' },
                                    ]}
                                />
                            </GridItem>
                            <GridItem mdColSpan={2}>
                                <Input
                                    label="Describe the infrastructure"
                                    value={description}
                                    onValueChange={setDescription}
                                    placeholder="e.g., An S3 bucket for static website hosting"
                                />
                            </GridItem>
                        </Grid>
                        <div className="mt-4 text-center">
                            <Button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                icon={<SparklesIcon />}
                                className="w-full max-w-xs mx-auto"
                            >
                                {isLoading ? 'Generating...' : 'Generate Configuration'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="flex flex-col flex-grow min-h-0">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Terraform (.tf)</label>
                    <Card className="flex-grow overflow-y-auto">
                        <CardContent className="h-full">
                            {isLoading && !displayConfig && (
                                <div className="flex items-center justify-center h-full">
                                    <Spinner size="lg" label="AI is generating the Terraform configuration..." />
                                </div>
                            )}
                            {displayError && !isLoading && (
                                <Alert variant="danger" title="Generation Failed">
                                    {displayError}
                                </Alert>
                            )}
                            {displayConfig && !isLoading && (
                                <MarkdownRenderer content={displayConfig} />
                            )}
                            {!isLoading && !displayConfig && !displayError && (
                                <div className="text-text-secondary h-full flex items-center justify-center">
                                    Generated configuration will appear here.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Page>
    );
};
