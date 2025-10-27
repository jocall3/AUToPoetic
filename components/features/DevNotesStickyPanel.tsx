/**
 * @file DevNotesStickyPanel.tsx
 * @summary A feature component that provides a persistent, sticky note panel for developers.
 * @description This component acts as a simple scratchpad where developers can jot down notes,
 * to-do items, or code snippets. The content is automatically saved to the browser's
 * local storage, ensuring persistence across sessions.
 * @requires react
 * @requires ../../hooks/useLocalStorage.ts
 * @requires ../icons.tsx
 */

import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.ts';
import { DocumentTextIcon } from '../icons.tsx';

/**
 * @component DevNotesStickyPanel
 * @description A feature component that provides a persistent, sticky note panel for developers.
 * Notes are saved locally in the browser's local storage.
 * @security
 * The content of the notes is stored in plaintext in local storage.
 * It is not suitable for storing sensitive information like passwords or API keys.
 * All data remains client-side and is never transmitted.
 * @performance
 * This component has minimal performance impact. It performs a single read
 * from local storage on initial render and writes on every keystroke within the text area.
 * For extremely large notes, this could introduce minor UI lag, but it is generally negligible for typical use cases.
 * @example
 * ```tsx
 * <DevNotesStickyPanel />
 * ```
 */
export const DevNotesStickyPanel: React.FC = () => {
    /**
     * State for the developer notes, persisted in local storage.
     * It uses the useLocalStorage custom hook to automatically sync state with localStorage.
     * @type {[string, (value: string | ((val: string) => string)) => void]}
     */
    const [notes, setNotes] = useLocalStorage<string>('devcore_dev_notes', 'My developer scratchpad...\n- TODO: Refactor the authentication flow.\n- IDEA: Use a web worker for processing large files.');

    /**
     * Handles changes to the textarea input and updates the persisted state.
     * This function is memoized with useCallback to prevent unnecessary re-renders, although
     * the performance gain is minimal in this context.
     * @function handleChange
     * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event from the textarea.
     * @returns {void}
     */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setNotes(e.target.value);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-yellow-50 dark:bg-yellow-900/20">
            <header className="mb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold flex items-center text-yellow-900 dark:text-yellow-300">
                    <DocumentTextIcon />
                    <span className="ml-3">Dev Notes</span>
                </h1>
                <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                    Your personal, persistent scratchpad. Notes are saved automatically.
                </p>
            </header>
            <div className="flex-grow flex flex-col min-h-0 shadow-inner">
                <textarea
                    value={notes}
                    onChange={handleChange}
                    placeholder="Jot down your thoughts, to-dos, or code snippets here..."
                    className="w-full h-full p-4 bg-yellow-100 dark:bg-yellow-800/30 border border-yellow-300 dark:border-yellow-700/50 rounded-md resize-none font-mono text-sm text-yellow-900 dark:text-yellow-200 focus:ring-2 focus:ring-yellow-500 focus:outline-none leading-relaxed"
                    aria-label="Developer Notes Scratchpad"
                    spellCheck="false"
                />
            </div>
        </div>
    );
};
