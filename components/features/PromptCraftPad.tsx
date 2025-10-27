/**
 * @file PromptCraftPad.tsx
 * @description This file contains the implementation for the PromptCraftPad feature,
 * a comprehensive tool for creating, managing, and testing reusable AI prompts.
 * It adheres to the new architectural directives by using a proprietary UI component library,
 * extensive JSDoc, and a structured, component-based approach.
 * @copyright James Burvel O'Callaghan III - President Citibank Demo Business Inc.
 * @security This component interacts with localStorage for user-created prompts. While prompts
 * themselves are not considered highly sensitive, this client-side storage is not suitable for
 * credentials or personally identifiable information (PII).
 * @performance The component uses React.memo and useMemo for optimizations. Variable parsing
 * is fast, but performance may degrade with an extremely large number of prompts or very complex
 * prompt strings. No Web Worker offloading is necessary for its current functionality.
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { SparklesIcon, PlusIcon, TrashIcon, ClipboardDocumentIcon, PencilIcon } from '../icons.tsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';

// Assuming a new proprietary UI framework as per architectural directives
// These would be imported from a shared UI library, e.g., '@/ui/core'
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`bg-surface border border-border rounded-lg ${className}`}>{children}</div>;
const Button = ({ children, onClick, disabled, variant = 'primary', size = 'md', className = '' }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, variant?: string, size?: string, className?: string }) => <button onClick={onClick} disabled={disabled} className={`btn-${variant} px-4 py-2 text-${size} ${className}`}>{children}</button>;
const Input = ({ ...props }) => <input {...props} className={`w-full bg-background border border-border px-2 py-1 rounded text-sm ${props.className}`} />;
const TextArea = ({ ...props }) => <textarea {...props} className={`w-full p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none ${props.className}`} />;
const Header = ({ children, as: Component = 'h1', className = '' }: { children: React.ReactNode, as?: keyof JSX.IntrinsicElements, className?: string }) => <Component className={`font-bold text-text-primary ${className}`}>{children}</Component>;
const Text = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <p className={`text-text-secondary ${className}`}>{children}</p>;
const Flex = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`flex ${className}`}>{children}</div>;
const Grid = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`grid ${className}`}>{children}</div>;

/**
 * @interface Prompt
 * @description Defines the structure for a single reusable prompt template.
 * @property {number} id - A unique identifier for the prompt, typically a timestamp.
 * @property {string} name - A user-friendly name for the prompt.
 * @property {string} text - The template string of the prompt, which may contain variables in {curlyBraces} format.
 */
interface Prompt {
    id: number;
    name: string;
    text: string;
}

/**
 * @interface PromptListProps
 * @description Defines the props for the PromptList component.
 */
interface PromptListProps {
    prompts: Prompt[];
    activePromptId: number | null;
    onSelect: (prompt: Prompt) => void;
    onAdd: () => void;
    onDelete: (id: number) => void;
    onUpdateName: (id: number, newName: string) => void;
}

/**
 * Renders the list of saved prompts and handles their selection, creation, and deletion.
 * @param {PromptListProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered PromptList component.
 * @example
 * <PromptList
 *   prompts={[{ id: 1, name: 'My Prompt', text: 'Hello {world}' }]}
 *   activePromptId={1}
 *   onSelect={handleSelect}
 *   onAdd={handleAdd}
 *   onDelete={handleDelete}
 *   onUpdateName={handleUpdateName}
 * />
 */
const PromptList: React.FC<PromptListProps> = memo(({ prompts, activePromptId, onSelect, onAdd, onDelete, onUpdateName }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [tempName, setTempName] = useState('');

    const handleNameUpdate = (id: number) => {
        if (tempName.trim()) {
            onUpdateName(id, tempName.trim());
        }
        setEditingId(null);
    };

    return (
        <Card className="w-1/3 flex flex-col">
            <Flex className="p-4 border-b border-border items-center justify-between">
                <Header as="h3" className="text-lg">My Prompts</Header>
            </Flex>
            <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {prompts.map((p: Prompt) => (
                    <div
                        key={p.id}
                        className={`group flex items-center justify-between rounded-md cursor-pointer ${activePromptId === p.id ? 'bg-primary/10' : 'hover:bg-surface-hover'}`}
                        onClick={() => onSelect(p)}
                    >
                        <div className="flex-grow p-2">
                        {editingId === p.id ? (
                            <Input
                                autoFocus
                                value={tempName}
                                onChange={e => setTempName(e.target.value)}
                                onBlur={() => handleNameUpdate(p.id)}
                                onKeyDown={e => e.key === 'Enter' && handleNameUpdate(p.id)}
                            />
                        ) : (
                            <Text className={`text-sm ${activePromptId === p.id ? 'text-primary font-semibold' : 'text-text-primary'}`}>{p.name}</Text>
                        )}
                        </div>
                        <Flex className="opacity-0 group-hover:opacity-100 transition-opacity p-2 gap-1">
                            <Button onClick={() => { setEditingId(p.id); setTempName(p.name); }} size="sm" variant="secondary" className="!p-1"><PencilIcon /></Button>
                            <Button onClick={() => onDelete(p.id)} size="sm" variant="danger" className="!p-1"><TrashIcon /></Button>
                        </Flex>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-border">
                <Button onClick={onAdd} className="w-full flex items-center justify-center gap-2"><PlusIcon /> Add New Prompt</Button>
            </div>
        </Card>
    );
});

/**
 * @interface PromptEditorProps
 * @description Defines the props for the PromptEditor component.
 */
interface PromptEditorProps {
    activePrompt: Prompt;
    onUpdateText: (newText: string) => void;
}

/**
 * Renders the main editor for the active prompt, including its text area, variable controls, and live preview.
 * @param {PromptEditorProps} props - The props for the component.
 * @returns {React.ReactElement | null} The rendered PromptEditor component or null if no active prompt.
 */
const PromptEditor: React.FC<PromptEditorProps> = memo(({ activePrompt, onUpdateText }) => {
    const { addNotification } = useNotification();
    const [variables, setVariables] = useState<Record<string, string>>({});

    const variableNames = useMemo(() => {
        if (!activePrompt) return [];
        return [...new Set([...activePrompt.text.matchAll(/\{(\w+)\}/g)].map(match => match[1]))];
    }, [activePrompt]);

    const renderedPrompt = useMemo(() => {
        if (!activePrompt) return '';
        return variableNames.reduce((acc, varName) => {
            return acc.replace(new RegExp(`\\{${varName}\\}`, 'g'), variables[varName] || `{${varName}}`);
        }, activePrompt.text);
    }, [activePrompt, variables, variableNames]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(renderedPrompt);
        addNotification('Prompt copied to clipboard!', 'success');
    }, [renderedPrompt, addNotification]);

    return (
        <Flex className="w-2/3 flex-col gap-4">
            <TextArea value={activePrompt.text} onChange={e => onUpdateText(e.target.value)} className="flex-grow" />
            {(variableNames.length > 0 || renderedPrompt) && (
                <Card className="flex-shrink-0">
                    {variableNames.length > 0 && (
                        <div className="p-4 border-b border-border">
                            <Header as="h4" className="text-md mb-2">Test Variables</Header>
                            <Grid className="grid-cols-2 gap-2">
                                {variableNames.map(v => (
                                    <div key={v}>
                                        <label className="text-xs text-text-secondary">{v}</label>
                                        <Input type="text" value={variables[v] || ''} onChange={e => setVariables({ ...variables, [v]: e.target.value })} />
                                    </div>
                                ))}
                            </Grid>
                        </div>
                    )}
                    <div className="p-4">
                        <Flex className="items-center justify-between mb-2">
                            <Header as="h4" className="text-md">Live Preview</Header>
                            <Button onClick={handleCopy} size="sm" variant="secondary" className="flex items-center gap-1"><ClipboardDocumentIcon/> Copy</Button>
                        </Flex>
                        <Text className="text-sm p-3 bg-background rounded border border-border min-h-[4rem] whitespace-pre-wrap">{renderedPrompt}</Text>
                    </div>
                </Card>
            )}
        </Flex>
    );
});

/**
 * @class PromptCraftPad
 * @description A feature component that allows users to create, save, and manage reusable AI prompt templates.
 * It includes functionality for defining variables within prompts and provides a live preview.
 * @returns {React.ReactElement} The rendered PromptCraftPad component.
 * @see useLocalStorage
 * @example
 * <PromptCraftPad />
 */
export const PromptCraftPad: React.FC = () => {
    const [prompts, setPrompts] = useLocalStorage<Prompt[]>('devcore_prompts', [
        { id: 1, name: 'React Component Generator', text: 'Generate a React component named {name} that {description}. Style it with Tailwind CSS.'}
    ]);
    const [activePromptId, setActivePromptId] = useState<number | null>(prompts[0]?.id || null);

    useEffect(() => {
        if (activePromptId === null && prompts.length > 0) {
            setActivePromptId(prompts[0].id);
        }
    }, [prompts, activePromptId]);

    const activePrompt = useMemo(() => prompts.find((p: Prompt) => p.id === activePromptId), [prompts, activePromptId]);

    const handleAdd = useCallback(() => {
        const newPrompt = { id: Date.now(), name: 'New Untitled Prompt', text: 'Your new prompt with a {variable}...' };
        setPrompts(prev => [...prev, newPrompt]);
        setActivePromptId(newPrompt.id);
    }, [setPrompts]);
    
    const handleDelete = useCallback((id: number) => {
        setPrompts(prev => prev.filter((p: Prompt) => p.id !== id));
        if(activePromptId === id) {
            const remainingPrompts = prompts.filter((p: Prompt) => p.id !== id);
            setActivePromptId(remainingPrompts.length > 0 ? remainingPrompts[0].id : null);
        }
    }, [setPrompts, prompts, activePromptId]);

    const handleUpdateName = useCallback((id: number, newName: string) => {
        setPrompts(prev => prev.map((p: Prompt) => p.id === id ? {...p, name: newName} : p));
    }, [setPrompts]);

    const handleUpdateText = useCallback((newText: string) => {
        if (!activePrompt) return;
        const updatedPrompt = { ...activePrompt, text: newText };
        setPrompts(prev => prev.map((p: Prompt) => p.id === updatedPrompt.id ? updatedPrompt : p));
    }, [setPrompts, activePrompt]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <Header as="h1" className="text-3xl flex items-center gap-3"><SparklesIcon />Prompt Craft Pad</Header>
                <Text className="mt-1">Create, save, and manage your favorite AI prompts.</Text>
            </header>
            <Flex className="flex-grow gap-6 min-h-0">
                <PromptList 
                    prompts={prompts} 
                    activePromptId={activePromptId} 
                    onSelect={(p) => setActivePromptId(p.id)}
                    onAdd={handleAdd}
                    onDelete={handleDelete}
                    onUpdateName={handleUpdateName}
                />
                {activePrompt ? (
                    <PromptEditor activePrompt={activePrompt} onUpdateText={handleUpdateText} />
                ) : (
                    <Flex className="w-2/3 items-center justify-center bg-surface border-2 border-dashed border-border rounded-lg">
                        <Text>Select a prompt or create a new one to begin.</Text>
                    </Flex>
                )}
            </Flex>
        </div>
    );
};