/**
 * @file AiFeatureBuilder.tsx
 * @description A sophisticated AI-powered tool for generating full-stack application features from natural language prompts.
 * @module features/AiFeatureBuilder
 *
 * @security
 * - All AI interactions and code generation are performed on the backend via the BFF and dedicated microservices.
 * - The client-side component is a thin presentation layer and does not handle sensitive data or business logic directly.
 * - User input (prompts) are sent to the backend for processing and should be sanitized/validated server-side if necessary.
 *
 * @performance
 * - Code generation is an intensive task offloaded to a dedicated Web Worker pool via the `workerPoolManager` service to keep the main thread responsive.
 * - Real-time updates from the generation process are streamed back to the client, providing immediate feedback without waiting for the entire process to complete.
 * - The UI uses memoization and efficient state updates to handle the stream of incoming data smoothly.
 * - The underlying `CodeBlock` component is assumed to offload any complex syntax highlighting to a worker to prevent blocking the main thread.
 */

import React, { useState, useCallback, useMemo } from 'react';

// Fictitious imports for the new, abstracted UI framework and service architecture
import { Panel, Layout, SplitPanel, Tabs, Tab } from '@composite/ui';
import { Button, Checkbox, Textarea, Text, Heading, Spinner, Icon } from '@core/ui';
import { useServices } from '@services/service-provider';
import type { IFeatureBuilderService, GenerationEvent } from '@services/business';

// Local types and icons
import type { GeneratedFile } from '../../types.ts';
import { CpuChipIcon, DocumentTextIcon, BeakerIcon, GitBranchIcon, CloudIcon } from '../../components/icons.tsx';
import { CodeBlock } from '../shared/CodeBlock.tsx'; // Assuming a new performant CodeBlock component

/**
 * @typedef {'TESTS' | 'COMMIT' | 'DEPLOYMENT'} SupplementalTabId
 * @description Represents the unique identifiers for supplemental output tabs (tests, commit message, etc.).
 */
type SupplementalTabId = 'TESTS' | 'COMMIT' | 'DEPLOYMENT';

/**
 * @typedef {Object} SupplementalOutputs
 * @description A state object to hold the content for all supplemental outputs.
 * @property {string} tests - The generated unit test code.
 * @property {string} commitMessage - The generated commit message.
 * @property {string} dockerfile - The generated Dockerfile content.
 */
type SupplementalOutputs = {
  tests: string;
  commitMessage: string;
  dockerfile: string;
};

/**
 * @typedef {({ type: 'file'; file: GeneratedFile } | { type: 'supplemental'; id: SupplementalTabId })} ActiveTab
 * @description Represents the currently active tab in the output panel. It can either be a generated file or a supplemental output.
 */
type ActiveTab = { type: 'file'; file: GeneratedFile } | { type: 'supplemental'; id: SupplementalTabId };

/**
 * Renders the content of the currently active tab.
 * @param {object} props - The component props.
 * @param {ActiveTab | null} props.activeTab - The currently active tab object.
 * @param {SupplementalOutputs} props.supplementalOutputs - The state object containing content for supplemental tabs.
 * @returns {React.ReactElement} The rendered content for the active tab.
 * @performance Memoized to prevent re-renders when props haven't changed. The underlying `CodeBlock` component is assumed to handle syntax highlighting efficiently.
 */
const OutputContent: React.FC<{ activeTab: ActiveTab | null, supplementalOutputs: SupplementalOutputs }> = React.memo(({ activeTab, supplementalOutputs }) => {
    if (!activeTab) {
        return (
            <Layout.Center className="h-full">
                <Text color="secondary">Select a file or tab to view its content.</Text>
            </Layout.Center>
        );
    }

    if (activeTab.type === 'supplemental') {
        let content = '';
        let language = 'plaintext';
        switch (activeTab.id) {
            case 'TESTS':
                content = supplementalOutputs.tests;
                language = 'typescript';
                break;
            case 'COMMIT':
                content = supplementalOutputs.commitMessage;
                language = 'git-commit';
                break;
            case 'DEPLOYMENT':
                content = supplementalOutputs.dockerfile;
                language = 'dockerfile';
                break;
        }
        return <CodeBlock language={language} code={content} className="h-full" />;
    }

    if (activeTab.type === 'file') {
        const language = activeTab.file.filePath.split('.').pop() || 'typescript';
        return <CodeBlock language={language} code={activeTab.file.content} className="h-full" />;
    }

    return null;
});
OutputContent.displayName = 'OutputContent';

/**
 * The main component for the AI Feature Builder. It allows users to generate
 * features using natural language, view the generated files, and see supplemental
 * information like unit tests and commit messages.
 * This component acts as a thin client, delegating all heavy processing to backend services
 * via a dedicated worker pool.
 *
 * @returns {React.ReactElement} The rendered AI Feature Builder component.
 * @example
 * ```jsx
 * <AiFeatureBuilder />
 * ```
 */
export const AiFeatureBuilder: React.FC = () => {
    const { featureBuilderService } = useServices<{ featureBuilderService: IFeatureBuilderService }>();

    const [prompt, setPrompt] = useState<string>('A simple "Hello World" React component with a button that shows an alert.');
    const [includeBackend, setIncludeBackend] = useState<boolean>(false);

    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
    const [supplementalOutputs, setSupplementalOutputs] = useState<SupplementalOutputs>({
        tests: '',
        commitMessage: '',
        dockerfile: '',
    });

    const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    /**
     * @function handleGenerate
     * @description Initiates the feature generation process by sending the prompt and configuration
     * to the `featureBuilderService`. It then listens to a stream of events to update the UI in real-time
     * as files and other assets are generated.
     * @returns {Promise<void>} A promise that resolves when the generation stream is fully processed.
     * @security User prompt is sent to the backend for processing. The backend should handle sanitization.
     * @performance This operation is asynchronous and non-blocking. The UI is updated reactively via a stream of events from a worker.
     * @throws Will set an error in the component state if the generation stream fails.
     */
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a feature description.');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedFiles([]);
        setSupplementalOutputs({ tests: '', commitMessage: '', dockerfile: '' });
        setActiveTab(null);

        try {
            const stream = featureBuilderService.generateFeatureStream({
                prompt,
                framework: 'React', // Hardcoded as per current UI
                styling: 'Tailwind CSS', // Hardcoded as per current UI
                includeBackend,
            });

            let firstFile: GeneratedFile | null = null;

            for await (const event of stream) {
                switch (event.type) {
                    case 'file_generated':
                        if (!firstFile) firstFile = event.data;
                        setGeneratedFiles(prev => [...prev, event.data]);
                        break;
                    case 'tests_chunk':
                        setSupplementalOutputs(prev => ({ ...prev, tests: prev.tests + event.data }));
                        break;
                    case 'commit_chunk':
                        setSupplementalOutputs(prev => ({ ...prev, commitMessage: prev.commitMessage + event.data }));
                        break;
                    case 'deployment_chunk':
                        setSupplementalOutputs(prev => ({ ...prev, dockerfile: prev.dockerfile + event.data }));
                        break;
                    case 'error':
                        throw new Error(event.data);
                }
            }

            if (firstFile) {
                setActiveTab({ type: 'file', file: firstFile });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate feature.';
            setError(errorMessage);
            // In a real app, a global notification service would be used.
            // Ex: notificationService.showError('Generation Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, includeBackend, featureBuilderService]);

    const supplementalTabs = useMemo(() => {
        const tabs: { id: SupplementalTabId, icon: React.ReactElement }[] = [];
        if (supplementalOutputs.tests) tabs.push({ id: 'TESTS', icon: <Icon icon={BeakerIcon} /> });
        if (supplementalOutputs.commitMessage) tabs.push({ id: 'COMMIT', icon: <Icon icon={GitBranchIcon} /> });
        if (supplementalOutputs.dockerfile) tabs.push({ id: 'DEPLOYMENT', icon: <Icon icon={CloudIcon} /> });
        return tabs;
    }, [supplementalOutputs]);

    return (
        <Layout.Root className="h-full text-text-primary bg-surface">
            <Header className="p-4 border-b border-border flex-shrink-0">
                <Heading level={1} className="flex items-center">
                    <Icon icon={CpuChipIcon} />
                    <Text as="span" className="ml-3">AI Feature Builder</Text>
                </Heading>
            </Header>
            <SplitPanel className="h-full">
                <SplitPanel.Pane defaultSize={30} minSize={20} maxSize={40} className="flex flex-col">
                    <Main className="flex-grow p-4 overflow-y-auto">
                        <Textarea
                            label="Feature Description"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A user profile card with an avatar, name, and bio."
                            className="h-48"
                            disabled={isLoading}
                        />
                        <Checkbox
                            label="Include Backend (Cloud Function + Firestore)"
                            checked={includeBackend}
                            onChange={() => setIncludeBackend(v => !v)}
                            className="mt-4"
                            disabled={isLoading}
                        />
                    </Main>
                    <Footer className="p-4 border-t border-border">
                        <Button onClick={handleGenerate} disabled={isLoading} fullWidth>
                            {isLoading ? <Spinner /> : 'Generate Feature'}
                        </Button>
                        {error && <Text color="danger" size="sm" className="mt-2 text-center">{error}</Text>}
                    </Footer>
                </SplitPanel.Pane>
                <SplitPanel.Pane defaultSize={70} className="flex flex-col">
                    <Tabs.Root
                        value={activeTab ? (activeTab.type === 'file' ? activeTab.file.filePath : activeTab.id) : undefined}
                        onValueChange={(value) => {
                            if (!value) return;
                            const fileTab = generatedFiles.find(f => f.filePath === value);
                            if (fileTab) {
                                setActiveTab({ type: 'file', file: fileTab });
                            } else {
                                setActiveTab({ type: 'supplemental', id: value as SupplementalTabId });
                            }
                        }}
                    >
                        <Tabs.List>
                            {generatedFiles.map(file => (
                                <Tabs.Trigger key={file.filePath} value={file.filePath}>
                                    <Icon icon={DocumentTextIcon} />
                                    {file.filePath}
                                </Tabs.Trigger>
                            ))}
                            {supplementalTabs.map(tab => (
                                <Tabs.Trigger key={tab.id} value={tab.id}>
                                    {tab.icon}
                                    {tab.id}
                                </Tabs.Trigger>
                            ))}
                        </Tabs.List>
                        <Panel.Content className="flex-grow overflow-auto relative">
                            {isLoading && generatedFiles.length === 0 ? (
                                <Layout.Center className="h-full">
                                    <Spinner size="lg" />
                                    <Text className="mt-2" color="secondary">Generating your feature...</Text>
                                </Layout.Center>
                            ) : (
                                <OutputContent activeTab={activeTab} supplementalOutputs={supplementalOutputs} />
                            )}
                        </Panel.Content>
                    </Tabs.Root>
                </SplitPanel.Pane>
            </SplitPanel>
        </Layout.Root>
    );
};
