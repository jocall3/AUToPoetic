/**
 * @file Defines the CiCdPipelineGenerator component, an AI-powered tool for creating CI/CD configuration files.
 * @module CiCdPipelineGenerator
 * @security This component sends user-provided data to an external AI service. All interactions must adhere to the application's data privacy policies.
 * @performance The component uses streaming to display AI responses, ensuring a non-blocking and responsive user experience.
 */

import React, { useState, useCallback } from 'react';
import { generateCiCdConfigStream } from '../../services/index.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';

// Proprietary UI Framework Components (as per architectural directives)
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { TextInput } from '../ui/core/TextInput';
import { Card, CardContent, CardHeader } from '../ui/composite/Card';
import { PageHeader } from '../ui/composite/PageHeader';
import { Grid, GridItem } from '../ui/layout/Grid';
import { Flex } from '../ui/layout/Flex';
import { MarkdownRenderer } from '../ui/composite/MarkdownRenderer';
import { LoadingSpinner } from '../ui/core/LoadingSpinner';

// Icons
import { PaperAirplaneIcon, SparklesIcon } from '../icons.tsx';

/**
 * @type {readonly string[]}
 * @description A constant array of supported CI/CD platforms for pipeline generation.
 * @security This list is client-side and does not represent any server-side validation.
 *           The AI service is responsible for handling these platform names.
 */
const PLATFORMS: readonly string[] = ['GitHub Actions', 'GitLab CI', 'CircleCI', 'Jenkins', 'Azure Pipelines'];

/**
 * @type {string}
 * @description An example description to pre-populate the input field, guiding the user on the expected input format.
 */
const EXAMPLE_DESCRIPTION: string = "Install Node.js dependencies, run linting and tests, build the production app, and then deploy to Vercel.";

/**
 * @component CiCdPipelineGenerator
 * @description A feature component that allows users to generate CI/CD configuration files
 * for various platforms by describing the desired pipeline stages in natural language.
 * It leverages a streaming AI service to generate the configuration and displays it in real-time.
 *
 * @example
 * return <CiCdPipelineGenerator />
 *
 * @performance
 * This component is lightweight. The main performance consideration is the AI service call,
 * which is handled asynchronously and streams the response to avoid blocking the UI.
 * The MarkdownRenderer component's performance for large configuration files might be a factor,
 * but it's assumed to be optimized (e.g., using web workers as per architectural directives).
 *
 * @security
 * User input (description) is sent to an external AI service through the BFF layer.
 * This interaction should be covered by the application's overall data privacy and security policies.
 * The generated configuration code is rendered as text and is not executed, mitigating injection risks on the client-side.
 * It is the user's responsibility to review the generated configuration for security best practices before use.
 */
export const CiCdPipelineGenerator: React.FC = () => {
    const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
    const [description, setDescription] = useState<string>(EXAMPLE_DESCRIPTION);
    const [config, setConfig] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const { addNotification } = useNotification();

    /**
     * @function handleGenerate
     * @description An asynchronous callback that initiates the CI/CD configuration generation process.
     * It validates user input, calls the streaming AI service, and updates the component's state with the response chunks.
     *
     * @returns {Promise<void>} A promise that resolves when the generation process is complete or an error occurs.
     *
     * @performance
     * This function initiates a network request. The use of streaming ensures the UI remains responsive
     * and can display partial results as they arrive, improving perceived performance.
     *
     * @throws Will not throw directly, but sets the 'error' state if the AI service call fails,
     * which is then displayed to the user via the UI and a notification.
     *
     * @see {@link generateCiCdConfigStream} for the underlying AI service call.
     */
    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            const errorMessage = 'Please provide a description of the pipeline stages.';
            setError(errorMessage);
            addNotification(errorMessage, 'error');
            return;
        }

        setIsLoading(true);
        setError('');
        setConfig('');

        try {
            const stream = generateCiCdConfigStream(platform, description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setConfig(fullResponse);
            }
            addNotification('CI/CD configuration generated successfully!', 'success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate configuration.';
            setError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [platform, description, addNotification]);

    return (
        <Flex direction="column" className="h-full p-4 sm:p-6 lg:p-8 text-text-primary space-y-6">
            <PageHeader
                icon={<PaperAirplaneIcon />}
                title="AI CI/CD Pipeline Architect"
                description="Describe your deployment process and get a modern configuration file."
            />
            
            <Grid columns={1} gap={4} className="flex-grow min-h-0">
                <Card>
                    <CardContent className="space-y-4">
                        <Grid columns={3} gap={4}>
                            <GridItem colSpan={{ base: 3, md: 1 }}>
                                <Select
                                    label="Platform"
                                    value={platform}
                                    onValueChange={setPlatform}
                                >
                                    {PLATFORMS.map(p => <Select.Option key={p} value={p}>{p}</Select.Option>)}
                                </Select>
                            </GridItem>
                            <GridItem colSpan={{ base: 3, md: 2 }}>
                                <TextInput
                                    label="Describe Pipeline Stages"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={EXAMPLE_DESCRIPTION}
                                />
                            </GridItem>
                        </Grid>
                        <Flex justify="center">
                            <Button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                icon={<SparklesIcon />}
                                className="w-full max-w-xs"
                                variant="primary"
                            >
                                {isLoading ? 'Generating...' : 'Generate Configuration'}
                            </Button>
                        </Flex>
                    </CardContent>
                </Card>

                <Card className="flex-grow flex flex-col min-h-0">
                    <CardHeader>
                        <h3 className="text-sm font-medium text-text-secondary">Generated Configuration File</h3>
                    </CardHeader>
                    <CardContent className="flex-grow relative p-0 overflow-y-auto">
                        <div className="absolute inset-0 p-4">
                            {isLoading && !config && (
                                <Flex align="center" justify="center" className="h-full">
                                    <LoadingSpinner />
                                </Flex>
                            )}
                            {error && <p className="p-4 text-red-500 font-medium bg-red-500/10 rounded-md">Error: {error}</p>}
                            {config && <MarkdownRenderer content={config} />}
                            {!isLoading && !config && !error && (
                                <Flex align="center" justify="center" className="h-full text-text-secondary">
                                    Generated configuration will appear here.
                                </Flex>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Grid>
        </Flex>
    );
};
