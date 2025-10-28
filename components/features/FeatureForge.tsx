/**
 * @file FeatureForge.tsx
 * @module components/features/FeatureForge
 * @description This micro-frontend component provides the "Feature Forge" functionality.
 * It allows users to generate new application features (as self-contained React components)
 * using an AI prompt. The generated features can be previewed, saved to a central repository,
 * and are then dynamically made available throughout the application. It also lists and manages
 * existing custom-generated features.
 * @see {@link ../../services/aiService.ts} for AI generation logic.
 * @see {@link ../../services/dbService.ts} for persistence logic.
 * @see {@link ../../types.ts} for CustomFeature type definition.
 * @security This component handles AI-generated code. The preview mechanism (`CustomFeatureRunner`)
 * must not execute the code directly to prevent potential XSS or other code injection attacks. It should only display the code for review.
 * @performance AI feature generation is a computationally intensive task. This implementation offloads the AI API call
 * to a backend service to prevent blocking the main UI thread.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Services and types
import type { CustomFeature } from '../../types';
import { generateAppFeatureComponent } from '../../services/aiService';
import { getAllCustomFeatures, saveCustomFeature, deleteCustomFeature } from '../../services/dbService';
import { useNotification } from '../../contexts/NotificationContext';
import { ALL_FEATURES } from './index';

// UI Components
import { LoadingSpinner } from '../shared/index';
import { CustomFeatureRunner } from '../shared/CustomFeatureRunner';
import { CpuChipIcon, TrashIcon, CodeBracketSquareIcon } from '../icons';

/**
 * @constant ICON_MAP
 * @description A map to resolve icon names from generated features to their corresponding React components.
 * @performance This is constructed once at the module level, avoiding re-computation on every render.
 * @security Relies on `iconType.name` which can be unreliable with code minification. A more robust solution
 * would use a manifest mapping string IDs to components.
 */
const ICON_MAP: Record<string, React.FC<any>> = ALL_FEATURES.reduce((acc, feature) => {
    const iconElement = feature.icon as React.ReactElement;
    const iconType = iconElement?.type;
    if (typeof iconType === 'function' && iconType.name) {
        acc[iconType.name] = iconType as React.FC;
    }
    return acc;
}, { CodeBracketSquareIcon } as Record<string, React.FC<any>>); // Manually add an icon for safety in generated code.

/**
 * A component to dynamically render an icon based on its string name.
 * @param {object} props - The component props.
 * @param {string} props.name - The string name of the icon component to render.
 * @returns {React.ReactElement} The rendered icon component or a default fallback.
 */
const IconComponent: React.FC<{ name: string }> = ({ name }) => {
    const Comp = ICON_MAP[name];
    return <div className="w-6 h-6 text-primary">{Comp ? <Comp /> : <CpuChipIcon />}</div>;
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
     * @description Fetches the list of all custom-generated features from the local database.
     * @performance The database call is asynchronous and the UI shows a loading state.
     * @throws Will show a notification if the database call fails.
     */
    const fetchFeatures = useCallback(async () => {
        setStatus('loadingFeatures');
        try {
            const features = await getAllCustomFeatures();
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
     * @description Calls the AI service to generate a new feature component.
     * @performance This is an async network call; the main thread remains responsive.
     * @throws Will show a notification if the generation fails.
     */
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            addNotification('Please enter a feature description.', 'info');
            return;
        }
        setStatus('generating');
        setGeneratedFeature(null);
        try {
            const result = await generateAppFeatureComponent(prompt);
            setGeneratedFeature(result);
            addNotification('Feature code generated! Review and save.', 'info');
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to generate feature.', 'error');
        } finally {
            setStatus('idle');
        }
    };

    /**
     * @function handleSave
     * @description Saves the newly generated feature to the local database and triggers a global refresh.
     * @security The generated feature code is stored but not executed.
     * @see The 'custom-feature-update' event is a simple mechanism for inter-component communication.
     */
    const handleSave = async () => {
        if (!generatedFeature) return;
        setStatus('generating'); // Reuse 'generating' as a generic loading state for saving
        try {
            const newFeature: CustomFeature = {
                id: `custom-${Date.now()}`,
                ...generatedFeature,
            };
            await saveCustomFeature(newFeature);
            // This event notifies other parts of the app (like the desktop) to reload features.
            window.dispatchEvent(new CustomEvent('custom-feature-update'));
            
            setGeneratedFeature(null);
            setPrompt('');
            await fetchFeatures(); // Refresh list
            addNotification(`Feature "${newFeature.name}" saved! It's now available on your desktop.`, 'success');
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
                await deleteCustomFeature(id);
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
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center"><CpuChipIcon /><span className="ml-3">Feature Forge</span></h1>
                <p className="text-text-secondary mt-1">Use AI to create new tools and add them to your desktop.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                <div className="flex flex-col gap-4">
                    <div className="bg-surface border border-border rounded-lg flex flex-col">
                        <div className="p-4 border-b border-border font-semibold">1. Create a New Feature</div>
                        <div className="p-4 flex flex-col gap-2">
                            <label htmlFor="feature-prompt" className="text-sm font-medium text-text-secondary">Describe the tool you want to build</label>
                            <textarea id="feature-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full p-2 bg-background border border-border rounded-md" />
                        </div>
                        <div className="p-4 border-t border-border">
                            <button onClick={handleGenerate} disabled={status === 'generating'} className="btn-primary w-full py-2 flex items-center justify-center">
                                {status === 'generating' ? <LoadingSpinner /> : 'Generate Feature'}
                            </button>
                        </div>
                    </div>
                    {generatedFeature && (
                        <div className="bg-surface border border-border rounded-lg flex flex-col flex-grow min-h-0 border-dashed animate-pop-in">
                            <div className="p-4 border-b border-border font-semibold flex justify-between items-center">
                                <span>2. Review & Save</span>
                                <button onClick={handleSave} className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50" disabled={isLoading}>Save Feature</button>
                            </div>
                            <div className="p-4 flex-grow flex flex-col gap-2 min-h-0">
                                <p className="text-sm"><strong>Name:</strong> {generatedFeature.name}</p>
                                <div className="flex-grow border rounded-md overflow-hidden min-h-[200px]">
                                    <CustomFeatureRunner feature={{ ...generatedFeature, id: 'preview' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col min-h-0">
                   <div className="bg-surface border border-border rounded-lg flex-grow flex flex-col min-h-0">
                        <div className="p-4 border-b border-border font-semibold">3. Your Custom Features</div>
                        <div className="flex-grow overflow-y-auto p-2">
                            {status === 'loadingFeatures' && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                            {customFeatures.length === 0 && status === 'idle' && <p className="text-text-secondary text-center py-8">You haven't created any features yet.</p>}
                            <ul className="space-y-2">
                                {customFeatures.map(feature => (
                                    <li key={feature.id} className="group flex items-center justify-between p-3 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <IconComponent name={feature.icon} />
                                            <div>
                                                <h4 className="font-semibold">{feature.name}</h4>
                                                <p className="text-xs text-text-secondary">{feature.description}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(feature.id)} disabled={status === 'deleting'} className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-500/10 text-red-500">
                                            <TrashIcon />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                   </div>
                </div>
            </div>
        </div>
    );
};
