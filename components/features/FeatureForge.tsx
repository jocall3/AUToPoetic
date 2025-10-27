/**
 * @file FeatureForge.tsx
 * @module components/features/FeatureForge
 * @description This micro-frontend component provides the "Feature Forge" functionality.
 * It allows users to generate new application features (as self-contained React components)
 * using an AI prompt. The generated features can be previewed, saved to a central repository,
 * and are then dynamically made available throughout the application. It also lists and manages
 * existing custom-generated features.
 * @see {@link ../../services/bff/featureForgeApi.ts} for data fetching logic.
 * @see {@link ../../services/worker/workerPoolManager.ts} for AI generation offloading.
 * @see {@link ../../types.ts} for CustomFeature type definition.
 * @security This component handles AI-generated code. The preview mechanism (`CustomFeatureRunner`)
 * must not execute the code directly to prevent potential XSS or other code injection attacks. It should only display the code for review.
 * @performance AI feature generation is a computationally intensive task. This implementation offloads the AI API call
 * and prompt construction to a dedicated Web Worker via the `workerPoolManager` to prevent blocking the main UI thread.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Architectural Transformation: Import UI components from the new abstracted framework.
import { Button } from 'core-ui/Button';
import { Textarea } from 'core-ui/Textarea';
import { Card, CardHeader, CardContent, CardFooter } from 'composite-ui/Card';
import { PageLayout, PageHeader } from 'composite-ui/PageLayout';
import { Grid, GridItem } from 'composite-ui/Layout';
import { List, ListItem } from 'composite-ui/List';
import { Icon } from 'core-ui/Icon';

// Architectural Transformation: Import API adapters for BFF communication.
import { fetchAllCustomFeatures, saveNewCustomFeature, deleteCustomFeatureById } from '../../services/bff/featureForgeApi';
// Architectural Transformation: Import worker manager for offloading heavy tasks.
import { submitTask } from '../../services/worker/workerPoolManager';

import type { CustomFeature, WorkerTaskResult } from '../../types';
import { LoadingSpinner } from '../shared/index';
import { useNotification } from '../../contexts/NotificationContext';
import { ALL_FEATURES } from './index';
import { CustomFeatureRunner } from '../shared/CustomFeatureRunner';

/**
 * @constant ICON_MAP
 * @description A map to resolve icon names from generated features to their corresponding React components.
 * @performance This is constructed once at the module level, avoiding re-computation on every render.
 * @security Relies on `iconType.name` which can be unreliable with code minification. A more robust solution
 * would use a manifest mapping string IDs to components, but this follows the existing pattern.
 */
const ICON_MAP: Record<string, React.FC> = ALL_FEATURES.reduce((acc, feature) => {
    const iconType = (feature.icon as React.ReactElement)?.type;
    if (typeof iconType === 'function' && iconType.name) {
        acc[iconType.name] = iconType as React.FC;
    }
    return acc;
}, {} as Record<string, React.FC>);

/**
 * A component to dynamically render an icon based on its string name.
 * @param {object} props - The component props.
 * @param {string} props.name - The string name of the icon component to render.
 * @returns {React.ReactElement} The rendered icon component or a default fallback.
 */
const IconComponent: React.FC<{ name: string }> = ({ name }) => {
    const Comp = ICON_MAP[name];
    return Comp ? <Icon as={Comp} /> : <Icon name="CpuChipIcon" />;
};

/**
 * @component FeatureForge
 * @description The main component for the Feature Forge micro-frontend.
 * It orchestrates feature generation, preview, and management.
 * @example
 * <FeatureForge />
 */
export const FeatureForge: React.FC = () => {
    const [customFeatures, setCustomFeatures] = useState<CustomFeature[]>([]);
    const [status, setStatus] = useState<'idle' | 'loadingFeatures' | 'generating' | 'deleting'>('idle');
    const [prompt, setPrompt] = useState('A tool to convert JSON to YAML and back');
    const [generatedFeature, setGeneratedFeature] = useState<Omit<CustomFeature, 'id'> | null>(null);
    const { addNotification } = useNotification();

    /**
     * @function fetchFeatures
     * @description Fetches the list of all custom-generated features from the backend.
     * @performance The API call is asynchronous and the UI shows a loading state.
     * @throws Will show a notification if the API call fails.
     */
    const fetchFeatures = useCallback(async () => {
        setStatus('loadingFeatures');
        try {
            const features = await fetchAllCustomFeatures();
            setCustomFeatures(features);
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to fetch custom features.', 'error');
        } finally {
            setStatus('idle');
        }
    }, [addNotification]);

    useEffect(() => {
        fetchFeatures();
    }, [fetchFeatures]);

    /**
     * @function handleGenerate
     * @description Offloads the AI feature generation task to a web worker to keep the UI responsive.
     * @performance This is a critical performance optimization. The main thread is not blocked during AI generation.
     * @throws Will show a notification if the worker task fails.
     */
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            addNotification('Please enter a feature description.', 'info');
            return;
        }
        setStatus('generating');
        setGeneratedFeature(null);
        try {
            const result: WorkerTaskResult = await submitTask({
                type: 'GENERATE_FEATURE_COMPONENT',
                payload: { prompt },
            });

            if (result.success) {
                setGeneratedFeature(result.data as Omit<CustomFeature, 'id'>);
                addNotification('Feature code generated! Review and save.', 'info');
            } else {
                throw new Error(result.error || 'Worker failed to generate feature.');
            }
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to generate feature.', 'error');
        } finally {
            setStatus('idle');
        }
    };

    /**
     * @function handleSave
     * @description Saves the newly generated feature to the backend and triggers a global refresh.
     * @security Assumes the BFF validates the `generatedFeature` object before saving to prevent malicious data storage.
     * @see The `'custom-feature-update'` event is a temporary solution. A more robust architecture would use a global state manager (e.g., Redux, Zustand) or a dedicated event bus service.
     */
    const handleSave = async () => {
        if (!generatedFeature) return;
        setStatus('generating'); // Reuse 'generating' as a generic loading state for saving
        try {
            const savedFeature = await saveNewCustomFeature(generatedFeature);
            // This event notifies other parts of the app (like the desktop) to reload features.
            window.dispatchEvent(new CustomEvent('custom-feature-update'));
            
            setGeneratedFeature(null);
            setPrompt('');
            await fetchFeatures(); // Refresh list
            addNotification(`Feature "${savedFeature.name}" saved! It's now available on your desktop.`, 'success');
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to save feature.', 'error');
        } finally {
            setStatus('idle');
        }
    };

    /**
     * @function handleDelete
     * @description Deletes a custom feature after user confirmation.
     * @param {string} id - The ID of the feature to delete.
     */
    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this feature? This action cannot be undone.")) {
            setStatus('deleting');
            try {
                await deleteCustomFeatureById(id);
                window.dispatchEvent(new CustomEvent('custom-feature-update'));
                await fetchFeatures();
                addNotification('Feature deleted.', 'info');
            } catch (err) {
                addNotification(err instanceof Error ? err.message : 'Failed to delete feature.', 'error');
            } finally {
                setStatus('idle');
            }
        }
    };

    const isLoading = useMemo(() => status !== 'idle', [status]);

    return (
        <PageLayout>
            <PageHeader icon={<Icon name="CpuChipIcon" />} title="Feature Forge">
                Use AI to create new tools and add them to your desktop.
            </PageHeader>
            <Grid cols={1} lgCols={2} gap={6} className="flex-grow min-h-0 p-4">
                <GridItem className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>1. Create a New Feature</CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <label htmlFor="feature-prompt" className="text-sm">Describe the tool you want to build</label>
                            <Textarea id="feature-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} />
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleGenerate} disabled={status === 'generating'} className="w-full">
                                {status === 'generating' ? <LoadingSpinner /> : 'Generate Feature'}
                            </Button>
                        </CardFooter>
                    </Card>
                    {generatedFeature && (
                        <Card className="flex-grow flex flex-col min-h-0 border-dashed animate-pop-in">
                            <CardHeader className="flex justify-between items-center">2. Review & Save <Button onClick={handleSave} variant="success" size="sm" disabled={isLoading}>Save Feature</Button></CardHeader>
                            <CardContent className="flex-grow flex flex-col gap-2 min-h-0">
                                <p className="text-sm"><strong>Name:</strong> {generatedFeature.name}</p>
                                <div className="flex-grow border rounded-md overflow-hidden min-h-[200px]">
                                    <CustomFeatureRunner feature={{ ...generatedFeature, id: 'preview' }} />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </GridItem>

                <GridItem className="flex flex-col min-h-0">
                   <Card className="flex-grow flex flex-col min-h-0">
                        <CardHeader>3. Your Custom Features</CardHeader>
                        <CardContent className="flex-grow overflow-y-auto">
                            {status === 'loadingFeatures' && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                            {customFeatures.length === 0 && status === 'idle' && <p className="text-text-secondary text-center py-8">You haven't created any features yet.</p>}
                            <List className="space-y-3">
                                {customFeatures.map(feature => (
                                    <ListItem key={feature.id} className="group flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="text-primary"><IconComponent name={feature.icon} /></div>
                                            <div>
                                                <h4 className="font-semibold">{feature.name}</h4>
                                                <p className="text-xs text-text-secondary">{feature.description}</p>
                                            </div>
                                        </div>
                                        <Button variant="danger" size="icon" onClick={() => handleDelete(feature.id)} disabled={status === 'deleting'} className="opacity-0 group-hover:opacity-100">
                                            <Icon name="TrashIcon" />
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                   </Card>
                </GridItem>
            </Grid>
        </PageLayout>
    );
};
