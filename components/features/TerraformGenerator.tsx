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
import { useWorkerTask } from '@services/WorkerPoolManager'; // Assumed worker management hook
import {
  Page,
  Header,
  Content,
  Grid,
  Select,
  Input,
  Button,
  Card,
  Spinner,
  Alert,
} from '@core/ui'; // Assumed proprietary UI component library
import { CpuChipIcon, SparklesIcon } from '@core/ui/icons'; // Assumed icons from UI library
import { MarkdownRenderer } from '@composite/ui'; // Assumed composite UI component

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
    /**
     * @state
     * @description The natural language description of the infrastructure to be generated.
     * @type {string}
     */
    const [description, setDescription] = useState<string>('An S3 bucket for static website hosting with a public read policy');

    /**
     * @state
     * @description The selected cloud provider for which to generate the Terraform config.
     * @type {CloudProvider}
     */
    const [cloud, setCloud] = useState<CloudProvider>('aws');

    /**
     * @hook useWorkerTask
     * @description Manages the asynchronous task of generating the Terraform configuration
     * by offloading it to a dedicated web worker.
     * @property {Function} execute - Function to trigger the worker task.
     * @property {string | null} result - The generated Terraform configuration string.
     * @property {boolean} isLoading - True while the worker is processing the task.
     * @property {Error | null} error - Any error returned from the worker.
     */
    const { execute: executeGenerate, result: config, isLoading, error } = useWorkerTask<string>('generateTerraformConfig');

    /**
     * @state
     * @description Holds the final configuration to be displayed. This is set from the worker's result.
     * @type {string}
     */
    const [displayConfig, setDisplayConfig] = useState<string>('');

    /**
     * @state
     * @description Holds any display-worthy error messages.
     * @type {string}
     */
    const [displayError, setDisplayError] = useState<string>('');

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
            return;
        }

        // Context is stubbed for now but demonstrates future capability
        const context = 'User might have existing VPCs. Check before creating new ones.';
        executeGenerate({ cloud, description, context });
    }, [description, cloud, executeGenerate]);

    /**
     * @effect
     * @description This effect listens for changes in the result from the `useWorkerTask` hook
     * and updates the component's state accordingly.
     */
    useEffect(() => {
        if (config) {
            setDisplayConfig(config);
        }
    }, [config]);
    
    /**
     * @effect
     * @description This effect listens for errors from the `useWorkerTask` hook and updates
     * the component's error state.
     */
    useEffect(() => {
        if (error) {
            setDisplayError(error.message || 'An unknown error occurred while generating the configuration.');
        }
    }, [error]);

    return (
        <Page>
            <Page.Header>
                <Header
                    icon={<CpuChipIcon />}
                    title="AI Terraform Generator"
                    subtitle="Generate infrastructure-as-code from a description, with context from your cloud provider."
                />
            </Page.Header>
            <Page.Content className="flex flex-col gap-4">
                <Card>
                    <Grid columns={1} mdColumns={3} gap="4" alignItems="end">
                        <Grid.Item>
                            <label htmlFor="cloud-provider-select" className="block text-sm font-medium">Cloud Provider</label>
                            <Select id="cloud-provider-select" value={cloud} onValueChange={(value) => setCloud(value as CloudProvider)} className="w-full mt-1">
                                <Select.Option value="aws">AWS</Select.Option>
                                <Select.Option value="gcp">GCP</Select.Option>
                                <Select.Option value="azure">Azure</Select.Option>
                            </Select>
                        </Grid.Item>
                        <Grid.Item mdColSpan={2}>
                            <label htmlFor="infra-description-input" className="block text-sm font-medium">Describe the infrastructure</label>
                            <Input
                                id="infra-description-input"
                                type="text"
                                value={description}
                                onValueChange={setDescription}
                                placeholder="e.g., An S3 bucket for static website hosting"
                                className="w-full mt-1"
                            />
                        </Grid.Item>
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
                </Card>
                
                <div className="flex flex-col flex-grow min-h-0">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Terraform (.tf)</label>
                    <Card className="flex-grow overflow-y-auto">
                        {isLoading && !displayConfig && (
                            <div className="flex items-center justify-center h-full">
                                <Spinner size="lg" label="AI is thinking..." />
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
                    </Card>
                </div>
            </Page.Content>
        </Page>
    );
};
