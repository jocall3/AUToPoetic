/**
 * @file CommandPalette.tsx
 * @description Provides a global, keyboard-accessible command palette for navigating features and executing actions.
 * @module components/CommandPalette
 * 
 * @security This component renders dynamic content based on registered commands. The command
 * registration and execution logic should be sanitized to prevent injection attacks.
 * The component itself does not handle sensitive data directly.
 * 
 * @performance The component uses `useMemo` to optimize filtering of a potentially large command list.
 * For very large numbers of commands (>1000), a virtualized list implementation should be considered
 * to maintain UI responsiveness during rendering and filtering.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import { ALL_FEATURES } from './features/index.ts';
import type { ViewType } from '../types.ts';
import { useTheme } from '../hooks/useTheme.ts';

// Assume these are new abstract UI components from the core UI library.
// For this refactoring, we'll imagine their API and use styled divs as placeholders.
const ModalOverlay: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20" onClick={onClick}>
        {children}
    </div>
);
const ModalContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`w-full max-w-2xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
    </div>
);
const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`w-full p-4 bg-surface text-text-primary text-lg focus:outline-none border-b border-border ${props.className}`} />
);

/**
 * @interface Command
 * @description Represents a single executable action within the command palette.
 * This structure follows the Command design pattern.
 * @property {string} id - A unique identifier for the command.
 * @property {string} title - The user-facing name of the command.
 * @property {string} category - The category for grouping commands (e.g., 'Navigation', 'AI Tools').
 * @property {React.ReactNode} icon - A React node for the command's icon.
 * @property {() => void} execute - The function to be called when the command is selected.
 * @property {string} [keywords] - Optional string of keywords for better searchability.
 */
interface Command {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  execute: () => void;
  keywords?: string;
}

/**
 * @interface CommandPaletteProps
 * @description Props for the CommandPalette component.
 * @property {boolean} isOpen - Controls the visibility of the command palette.
 * @property {() => void} onClose - Callback function to close the palette.
 */
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A central hook to register and provide all available commands in the application.
 * In a larger DI framework, this would be a service. Here, it aggregates commands
 * from various sources (features, theme toggles, etc.).
 *
 * @param {() => void} onClose - Callback to close the palette after a command executes.
 * @returns {{ commands: Command[] }} An object containing the list of all available commands.
 */
const useCommandRegistry = (onClose: () => void): { commands: Command[] } => {
    const { dispatch } = useGlobalState();
    const [, toggleTheme] = useTheme();

    const commands = useMemo<Command[]>(() => {
        const featureCommands: Command[] = ALL_FEATURES.map(feature => ({
            id: `open-${feature.id}`,
            title: `Open: ${feature.name}`,
            category: 'Navigation',
            icon: feature.icon,
            execute: () => {
                dispatch({ type: 'SET_VIEW', payload: { view: feature.id as ViewType } });
                onClose();
            },
            keywords: `${feature.category} ${feature.description} ${feature.keywords?.join(' ')}`
        }));

        const themeCommands: Command[] = [
            {
                id: 'toggle-theme',
                title: 'Toggle Light/Dark Mode',
                category: 'Theme',
                icon: <span className="text-xl">🎨</span>,
                execute: () => {
                    toggleTheme();
                    onClose();
                },
                keywords: 'dark light theme mode appearance color'
            }
        ];

        return [...featureCommands, ...themeCommands];
    }, [dispatch, toggleTheme, onClose]);

    return { commands };
};

/**
 * Renders a global command palette for quick access to application features and actions.
 * It is activated by a keyboard shortcut (e.g., Ctrl+K) and allows users to search
 * and execute commands.
 *
 * @param {CommandPaletteProps} props - The props for the component.
 * @returns {React.ReactElement | null} The rendered command palette, or null if it's not open.
 *
 * @example
 * const [isOpen, setOpen] = useState(false);
 * return <CommandPalette isOpen={isOpen} onClose={() => setOpen(false)} />;
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { commands: allCommands } = useCommandRegistry(onClose);
    const activeItemRef = useRef<HTMLLIElement>(null);

    /**
     * Resets the internal state of the palette when it is opened or closed.
     * @effect
     */
    useEffect(() => {
        if (!isOpen) {
            // Add a small delay to prevent search term from disappearing before closing animation
            setTimeout(() => {
                setSearchTerm('');
                setSelectedIndex(0);
            }, 100);
        }
    }, [isOpen]);

    /**
     * Filters the available commands based on the user's search term.
     * Search is performed on title, category, and keywords.
     * @returns {Command[]} The filtered list of commands.
     */
    const filteredCommands = useMemo(() => {
        if (!searchTerm) {
            return allCommands;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allCommands.filter(command =>
            command.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            command.category.toLowerCase().includes(lowerCaseSearchTerm) ||
            (command.keywords && command.keywords.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }, [searchTerm, allCommands]);

    /**
     * Resets the selected index whenever the filtered command list changes.
     * @effect
     */
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands]);

    /**
     * Handles command execution when a command is selected via click or Enter key.
     * @function
     */
    const handleExecute = useCallback(() => {
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
            selectedCommand.execute();
        }
    }, [filteredCommands, selectedIndex]);

    /**
     * Manages keyboard navigation (ArrowUp, ArrowDown, Enter, Escape) within the command palette.
     * @effect
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    handleExecute();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands.length, handleExecute, onClose]);

    /**
     * Ensures the currently selected item is visible within the scrollable list.
     * @effect
     */
    useEffect(() => {
        activeItemRef.current?.scrollIntoView({
            block: 'nearest',
        });
    }, [selectedIndex]);

    if (!isOpen) {
        return null;
    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent className="animate-pop-in">
                <TextInput
                    type="text"
                    placeholder="Type a command or search for a feature..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
                <ul className="max-h-96 overflow-y-auto p-2" role="listbox">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((command, index) => (
                            <li
                                key={command.id}
                                ref={selectedIndex === index ? activeItemRef : null}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input from losing focus
                                    setSelectedIndex(index);
                                    handleExecute();
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${selectedIndex === index ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                role="option"
                                aria-selected={selectedIndex === index}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-text-secondary w-5 h-5 flex items-center justify-center">{command.icon}</div>
                                    <span className="text-text-primary">{command.title}</span>
                                </div>
                                <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded-md border border-border">
                                    {command.category}
                                </span>
                            </li>
                        ))
                    ) : (
                        <li className="p-4 text-center text-text-secondary">No results found for "{searchTerm}".</li>
                    )}
                </ul>
            </ModalContent>
        </ModalOverlay>
    );
};