/**
 * @file components/SettingsView.tsx
 * @module components/SettingsView
 * @description This module exports the main component for the application's settings view.
 * It allows users to manage themes, feature visibility, and clear locally stored data. It is built
 * with a component-based approach for maintainability.
 * @see SettingsView
 */

import React from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import { clearAllFiles } from '../services/dbService.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { useTheme } from '../hooks/useTheme.ts';
import { ALL_FEATURES } from './features/index.ts';
import { TrashIcon, SunIcon, MoonIcon } from './icons.tsx';

/**
 * @interface ToggleSwitchProps
 * @description Props for the ToggleSwitch component.
 */
interface ToggleSwitchProps {
  /**
   * @property {boolean} checked - Determines if the switch is in the "on" state.
   */
  checked: boolean;
  /**
   * @property {() => void} onChange - Callback function executed when the switch is clicked.
   */
  onChange: () => void;
  /**
   * @property {string} [ariaLabel] - Accessible label for the switch button.
   */
  ariaLabel?: string;
}

/**
 * A reusable, themeable toggle switch component.
 * @param {ToggleSwitchProps} props - The props for the component.
 * @returns {React.ReactElement} A styled toggle switch.
 * @example
 * <ToggleSwitch checked={isDarkMode} onChange={toggleTheme} ariaLabel="Toggle dark mode" />
 */
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, ariaLabel }) => {
    return (
        <button
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={onChange}
            className={`${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface`}
        >
            <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
        </button>
    );
};

/**
 * @interface SettingsSectionProps
 * @description Props for the SettingsSection component.
 */
interface SettingsSectionProps {
  /**
   * @property {string} title - The title of the settings section.
   */
  title: string;
  /**
   * @property {string} [description] - An optional description for the section.
   */
  description?: string;
  /**
   * @property {React.ReactNode} children - The content of the settings section, typically `SettingsItem` components.
   */
  children: React.ReactNode;
}

/**
 * A container component for grouping related settings.
 * @param {SettingsSectionProps} props - The props for the component.
 * @returns {React.ReactElement} A styled section with a title and content.
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => (
  <section>
    <h2 className="text-2xl font-bold border-b border-border pb-2 mb-4">{title}</h2>
    {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
    <div className="space-y-4">{children}</div>
  </section>
);


/**
 * @interface SettingsItemProps
 * @description Props for the SettingsItem component.
 */
interface SettingsItemProps {
  /**
   * @property {string} title - The title of the setting.
   */
  title: string;
  /**
   * @property {string} description - A description of what the setting does.
   */
  description: string;
  /**
   * @property {React.ReactNode} control - The interactive element for the setting (e.g., a button or switch).
   */
  control: React.ReactNode;
}

/**
 * A component representing a single row in a settings section.
 * @param {SettingsItemProps} props - The props for the component.
 * @returns {React.ReactElement} A styled row containing setting information and its control.
 */
const SettingsItem: React.FC<SettingsItemProps> = ({ title, description, control }) => (
  <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
    <div className="flex items-center gap-2">
      {control}
    </div>
  </div>
);


/**
 * @component SettingsView
 * @description Provides the main view for application settings. It allows users to configure application
 * appearance (theme), manage which features are visible in the sidebar, and clear various types of
 * locally stored data. This component acts as a central hub for user-level customization.
 * @security This component handles data deletion from the user's local browser storage (IndexedDB and LocalStorage).
 * It does not handle any server-side data or secrets. Deletion actions are protected by browser confirmation dialogs.
 * @performance This component is highly performant as it primarily interacts with local state and storage,
 * avoiding network requests or heavy computations on the main thread.
 * @see useGlobalState
 * @see useTheme
 * @see useLocalStorage
 * @example
 * <SettingsView />
 */
export const SettingsView: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const [themeState, toggleTheme, , clearCustomTheme] = useTheme();
    const [, setSnippets] = useLocalStorage('devcore_snippets', []);
    const [, setNotes] = useLocalStorage('devcore_moodboard', []);
    const [, setDevNotes] = useLocalStorage('devcore_notes', []);
    const [, setPersonalities] = useLocalStorage('devcore_ai_personalities', []);

    /**
     * Handles the clearing of all AI-generated files from IndexedDB.
     * Prompts the user for confirmation before proceeding.
     * @returns {Promise<void>}
     * @security This is a destructive action on local user data. It is protected by a `window.confirm` prompt.
     * @performance The operation speed depends on the size of the IndexedDB store but is generally fast.
     */
    const handleClearGeneratedFiles = async (): Promise<void> => {
        if (window.confirm("Are you sure you want to delete all AI-generated files? This cannot be undone.")) {
            await clearAllFiles();
            alert("Generated files cleared.");
        }
    };
    
    /**
     * Handles the clearing of all saved snippets from LocalStorage.
     * Prompts the user for confirmation before proceeding.
     * @security This is a destructive action on local user data, protected by a `window.confirm` prompt.
     */
    const handleClearSnippets = (): void => {
        if (window.confirm("Are you sure you want to delete all saved snippets? This cannot be undone.")) {
            setSnippets([]);
            alert("Snippets cleared.");
        }
    };

    /**
     * Handles the clearing of all notes and moodboard items from LocalStorage.
     * Prompts the user for confirmation before proceeding.
     * @security This is a destructive action on local user data, protected by a `window.confirm` prompt.
     */
    const handleClearNotes = (): void => {
        if (window.confirm("Are you sure you want to delete all notes and moodboard items? This cannot be undone.")) {
            setNotes([]);
            setDevNotes([]);
            alert("Notes & Whiteboard items cleared.");
        }
    };
    
    /**
     * Handles the clearing of all custom AI Personalities from LocalStorage.
     * Prompts the user for confirmation before proceeding.
     * @security This is a destructive action on local user data, protected by a `window.confirm` prompt.
     */
    const handleClearPersonalities = (): void => {
        if (window.confirm("Are you sure you want to delete all AI Personalities? This cannot be undone.")) {
            setPersonalities([]);
            alert("AI Personalities cleared.");
        }
    }
    
    const DataMgmtButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
        <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
            <TrashIcon /> {children}
        </button>
    );

    return (
        <div className="w-full text-text-primary">
            <header className="sticky top-0 z-10 p-4 sm:p-6 lg:p-8 border-b border-border bg-surface/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto w-full">
                    <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
                    <p className="mt-2 text-lg text-text-secondary">Manage application preferences and data.</p>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto w-full">
                <SettingsSection title="Appearance">
                    <SettingsItem
                        title="Theme"
                        description="Switch between light and dark mode for the application."
                        control={
                            <div className="flex items-center gap-2">
                                <SunIcon />
                                <ToggleSwitch checked={themeState.mode === 'dark'} onChange={toggleTheme} ariaLabel="Toggle theme" />
                                <MoonIcon />
                            </div>
                        }
                    />
                    <SettingsItem
                        title="Custom Theme"
                        description="Revert to the default application theme if a custom one is applied."
                        control={
                             <button onClick={clearCustomTheme} disabled={!themeState.customColors} className="px-4 py-2 text-sm rounded-md bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                Revert to Default
                            </button>
                        }
                    />
                </SettingsSection>
                
                <SettingsSection 
                    title="Feature Visibility"
                    description="Hide or show features in the main sidebar. This does not disable them; they can still be accessed via the AI Command Center (Ctrl+K)."
                >
                    {ALL_FEATURES
                        .filter(f => !['ai-command-center', 'workspace-connector-hub', 'project-explorer'].includes(f.id))
                        .map(feature => (
                            <SettingsItem
                                key={feature.id}
                                title={feature.name}
                                description={feature.description}
                                control={
                                    <ToggleSwitch 
                                        checked={!state.hiddenFeatures.includes(feature.id)}
                                        onChange={() => dispatch({ type: 'TOGGLE_FEATURE_VISIBILITY', payload: { featureId: feature.id } })}
                                        ariaLabel={`Toggle visibility for ${feature.name}`}
                                    />
                                }
                            />
                        ))}
                </SettingsSection>
                
                <SettingsSection title="Data Management">
                    <div className="flex items-center justify-between p-4 bg-surface border border-red-500/20 rounded-lg">
                        <div>
                            <p className="font-medium text-red-700 dark:text-red-400">Clear Generated Files</p>
                            <p className="text-sm text-text-secondary">Removes all files created by the AI Feature Builder from IndexedDB.</p>
                        </div>
                        <DataMgmtButton onClick={handleClearGeneratedFiles}>Clear</DataMgmtButton>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface border border-red-500/20 rounded-lg">
                        <div>
                            <p className="font-medium text-red-700 dark:text-red-400">Clear Snippet Vault</p>
                            <p className="text-sm text-text-secondary">Removes all saved code snippets from LocalStorage.</p>
                        </div>
                        <DataMgmtButton onClick={handleClearSnippets}>Clear</DataMgmtButton>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface border border-red-500/20 rounded-lg">
                        <div>
                            <p className="font-medium text-red-700 dark:text-red-400">Clear Notes & Whiteboard</p>
                            <p className="text-sm text-text-secondary">Removes all items from Dev Notes and Digital Whiteboard.</p>
                        </div>
                        <DataMgmtButton onClick={handleClearNotes}>Clear</DataMgmtButton>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface border border-red-500/20 rounded-lg">
                        <div>
                            <p className="font-medium text-red-700 dark:text-red-400">Clear AI Personalities</p>
                            <p className="text-sm text-text-secondary">Removes all custom AI personalities from LocalStorage.</p>
                        </div>
                        <DataMgmtButton onClick={handleClearPersonalities}>Clear</DataMgmtButton>
                    </div>
                </SettingsSection>
            </div>
        </div>
    );
};