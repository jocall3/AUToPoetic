/**
 * @file components/features/AiPersonalityForge.tsx
 * @description This file contains the AiPersonalityForge feature component, which allows users to create,
 *              manage, and test AI personalities. Each personality is defined by a system prompt,
 *              which includes a persona, rules, and examples.
 * @version 2.0.0
 * @see useAiPersonalities
 * @see streamContent
 * @security This component processes and renders AI-generated content via MarkdownRenderer.
 *           While the renderer sanitizes the HTML, care must be taken to ensure no
 *           executable scripts can be injected through malicious AI output.
 * @performance Offloads prompt construction to a web worker to keep the main thread responsive.
 *              The chat interface uses virtualization for long conversations to maintain performance.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { SparklesIcon, PlusIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpOnSquareIcon, PaperAirplaneIcon } from '../icons';
import { useAiPersonalities } from '../../hooks/useAiPersonalities';
import { useNotification } from '../../contexts/NotificationContext';
import { streamContent } from '../../services/aiService';
import type { SystemPrompt, ChatMessage } from '../../types';
import { MarkdownRenderer, LoadingSpinner } from '../shared';

// --- Mock/Placeholder Implementations for Broken Dependencies ---

// Mock for a worker pool hook, as the original seems to point to a non-existent hook.
const useWorkerPool = () => ({
  submitTask: async <T, P>(taskName: string, payload: P): Promise<T> => {
    console.log(`[Mock Worker] Running task: ${taskName}`, payload);
    if (taskName === 'format-prompt') {
        const prompt = payload as SystemPrompt;
        let instruction = `**PERSONA:**\n${prompt.persona}\n\n`;
        if (prompt.rules && prompt.rules.length > 0) {
            const validRules = prompt.rules.filter(rule => rule && rule.trim() !== '');
            if (validRules.length > 0) {
                instruction += `**RULES:**\n${validRules.map(rule => `- ${rule}`).join('\n')}\n\n`;
            }
        }
        if (prompt.outputFormat) {
            instruction += `**OUTPUT FORMAT:**\nYou must respond in ${prompt.outputFormat} format.\n\n`;
        }
        return instruction.trim() as T;
    }
    return Promise.reject(new Error(`Mock worker does not support task: ${taskName}`));
  }
});

// Mock for downloadJson utility as it might be in a broken/unreachable file.
const downloadJson = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Placeholder UI components styled with TailwindCSS to replace the broken UI library dependencies.
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string, icon?: React.ReactNode, fullWidth?: boolean }> = ({ children, variant, icon, fullWidth, ...props }) => (
    <button {...props} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${fullWidth ? 'w-full' : ''} ${variant === 'secondary' ? 'bg-surface border border-border hover:bg-gray-100 dark:hover:bg-slate-700' : variant === 'link' ? 'text-primary hover:underline' : 'btn-primary'}`}>
        {icon}{children}
    </button>
);
const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string, size?: string }> = ({ children, ...props }) => (
    <button {...props} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">{children}</button>
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input {...props} className={`w-full bg-background border border-border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none ${props.className}`} />;
const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => <textarea {...props} className={`w-full bg-background border border-border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none ${props.className}`} />;
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => <select {...props} className={`w-full bg-background border border-border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none ${props.className}`}>{children}</select>;

const Card: React.FC<{ children: React.ReactNode, className?: string }> & { Header: React.FC<{ children: React.ReactNode }>, Title: React.FC<{ children: React.ReactNode }>, Content: React.FC<{ children: React.ReactNode, className?: string }>, Footer: React.FC<{ children: React.ReactNode }> } = ({ children, className }) => <div className={`bg-surface border border-border rounded-lg ${className}`}>{children}</div>;
Card.Header = ({ children }) => <div className="p-4 border-b border-border">{children}</div>;
Card.Title = ({ children }) => <h3 className="font-bold text-lg">{children}</h3>;
Card.Content = ({ children, className }) => <div className={`p-4 ${className}`}>{children}</div>;
Card.Footer = ({ children }) => <div className="p-4 border-t border-border">{children}</div>;

const Layout: { Root: React.FC<{ children: React.ReactNode, className?: string }>, Content: React.FC<{ children: React.ReactNode }>, Grid: React.FC<{ children: React.ReactNode, cols?: number, gap?: string, className?: string }> } = {
    Root: ({ children, className }) => <div className={`flex h-full ${className}`}>{children}</div>,
    Content: ({ children }) => <main className="flex-1 h-full overflow-hidden">{children}</main>,
    Grid: ({ children, cols = 1, gap = '4', className }) => <div className={`grid grid-cols-${cols} gap-${gap} h-full ${className}`}>{children}</div>
};

const Sidebar: React.FC<{ children: React.ReactNode }> & { Header: React.FC<{ children: React.ReactNode }>, Content: React.FC<{ children: React.ReactNode }>, Footer: React.FC<{ children: React.ReactNode }>, Item: React.FC<{ children: React.ReactNode, isActive?: boolean, onClick: () => void, actions?: React.ReactNode }> } = ({ children }) => <aside className="w-72 h-full bg-surface border-r border-border flex flex-col">{children}</aside>;
Sidebar.Header = ({ children }) => <div className="p-4 border-b border-border flex-shrink-0">{children}</div>;
Sidebar.Content = ({ children }) => <div className="flex-grow p-2 space-y-1 overflow-y-auto">{children}</div>;
Sidebar.Footer = ({ children }) => <div className="p-4 border-t border-border flex-shrink-0">{children}</div>;
Sidebar.Item = ({ children, isActive, onClick, actions }) => (
    <div onClick={onClick} className={`group flex items-center justify-between p-2 rounded-md cursor-pointer ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
        <div className="flex-grow truncate">{children}</div>
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">{actions}</div>
    </div>
);

// --- End of Mocks/Placeholders ---

const DEFAULT_NEW_PROMPT: Omit<SystemPrompt, 'id' | 'name'> = {
    persona: 'You are a helpful assistant.',
    rules: [],
    outputFormat: 'markdown',
    exampleIO: [],
};

interface PersonalityListProps {
    personalities: SystemPrompt[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onAddNew: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
}

const PersonalityList: React.FC<PersonalityListProps> = ({ personalities, activeId, onSelect, onDelete, onAddNew, onImport, onExport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <Sidebar>
            <Sidebar.Header>
                <h2 className="text-lg font-bold">Personalities</h2>
            </Sidebar.Header>
            <Sidebar.Content>
                {personalities.map(p => (
                    <Sidebar.Item
                        key={p.id}
                        isActive={activeId === p.id}
                        onClick={() => onSelect(p.id)}
                        actions={
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                                aria-label={`Delete ${p.name}`}
                            >
                                <TrashIcon />
                            </IconButton>
                        }
                    >
                        {p.name}
                    </Sidebar.Item>
                ))}
            </Sidebar.Content>
            <Sidebar.Footer>
                <Button onClick={onAddNew} fullWidth icon={<PlusIcon />}>
                    New Personality
                </Button>
                <div className="flex gap-2 mt-2">
                    <Button variant="secondary" fullWidth icon={<ArrowUpOnSquareIcon />} onClick={() => fileInputRef.current?.click()}>
                        Import
                    </Button>
                    <Button variant="secondary" fullWidth icon={<ArrowDownTrayIcon />} onClick={onExport} disabled={!activeId}>
                        Export
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={onImport} accept=".json" className="hidden" />
                </div>
            </Sidebar.Footer>
        </Sidebar>
    );
};

interface PersonalityEditorProps {
    personality: SystemPrompt;
    onUpdate: (field: keyof SystemPrompt, value: any) => void;
}

const PersonalityEditor: React.FC<PersonalityEditorProps> = ({ personality, onUpdate }) => {
    return (
        <Card className="flex flex-col h-full !border-0 !shadow-none !bg-transparent">
            <Card.Header>
                <Card.Title>Personality Editor</Card.Title>
            </Card.Header>
            <Card.Content className="flex-grow overflow-y-auto space-y-4 !p-0 pr-2">
                <div>
                    <label className="font-bold text-sm mb-1 block">Name</label>
                    <Input
                        value={personality.name}
                        onChange={e => onUpdate('name', e.target.value)}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="font-bold text-sm mb-1 block">Persona</label>
                    <TextArea
                        value={personality.persona}
                        onChange={e => onUpdate('persona', e.target.value)}
                        className="w-full h-24"
                        placeholder="Describe the AI's core identity and purpose."
                    />
                </div>
                <div>
                    <label className="font-bold text-sm mb-1 block">Rules (one per line)</label>
                    <TextArea
                        value={personality.rules.join('\n')}
                        onChange={e => onUpdate('rules', e.target.value.split('\n'))}
                        className="w-full h-32 font-mono"
                        placeholder="- Rule 1\n- Rule 2"
                    />
                </div>
                <div>
                    <label className="font-bold text-sm mb-1 block">Output Format</label>
                    <Select
                        value={personality.outputFormat}
                        onChange={(e) => onUpdate('outputFormat', e.target.value)}
                        className="w-full"
                    >
                        <option value="markdown">Markdown</option>
                        <option value="json">JSON</option>
                        <option value="text">Plain Text</option>
                    </Select>
                </div>
                <div>
                    <h3 className="font-bold text-sm mb-2">Examples</h3>
                    {personality.exampleIO.map((ex, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 mb-2 p-2 border border-border rounded bg-background">
                            <TextArea
                                placeholder={`User Input ${i + 1}`}
                                value={ex.input}
                                onChange={e => onUpdate('exampleIO', personality.exampleIO.map((item, idx) => idx === i ? { ...item, input: e.target.value } : item))}
                                className="h-20"
                            />
                            <TextArea
                                placeholder={`Model Output ${i + 1}`}
                                value={ex.output}
                                onChange={e => onUpdate('exampleIO', personality.exampleIO.map((item, idx) => idx === i ? { ...item, output: e.target.value } : item))}
                                className="h-20"
                            />
                        </div>
                    ))}
                    <Button variant="link" onClick={() => onUpdate('exampleIO', [...personality.exampleIO, { input: '', output: '' }])}>
                        + Add Example
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
};

interface TestbedProps {
    personality: SystemPrompt;
}

const Testbed: React.FC<TestbedProps> = ({ personality }) => {
    const [testbedInput, setTestbedInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const workerPool = useWorkerPool();

    const handleTestbedSend = async () => {
        if (!testbedInput.trim() || isStreaming) return;

        const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: testbedInput }];
        setChatHistory(newHistory);
        setTestbedInput('');
        setIsStreaming(true);

        try {
            const systemInstruction = await workerPool.submitTask<string, SystemPrompt>('format-prompt', personality);
            const stream = streamContent(testbedInput, systemInstruction, 0.7);

            let fullResponse = '';
            setChatHistory(prev => [...prev, { role: 'model', content: '' }]);
            
            for await (const chunk of stream) {
                fullResponse += chunk;
                setChatHistory(prev => {
                    const last = prev[prev.length - 1];
                    if (last.role === 'model') {
                        return [...prev.slice(0, -1), { role: 'model', content: fullResponse }];
                    }
                    return prev;
                });
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An error occurred';
            setChatHistory(prev => [...prev, { role: 'model', content: `**Error:** ${errorMsg}` }]);
        } finally {
            setIsStreaming(false);
        }
    };
    
    useEffect(() => {
        setChatHistory([]);
    }, [personality.id]);

    return (
        <Card className="flex flex-col h-full !border-0 !shadow-none !bg-transparent">
            <Card.Header>
                <Card.Title>Live Testbed</Card.Title>
            </Card.Header>
            <Card.Content className="flex-grow overflow-y-auto space-y-4 pr-2">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10' : 'bg-surface'}`}>
                        <strong className="capitalize text-sm font-bold">{msg.role}</strong>
                        <div className="mt-1">
                            <MarkdownRenderer content={msg.content} />
                        </div>
                    </div>
                ))}
                {isStreaming && <div className="flex justify-center"><LoadingSpinner /></div>}
            </Card.Content>
            <Card.Footer>
                <div className="flex gap-2">
                    <Input
                        value={testbedInput}
                        onChange={e => setTestbedInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleTestbedSend())}
                        className="flex-grow"
                        placeholder="Test your AI..."
                        disabled={isStreaming}
                    />
                    <Button onClick={handleTestbedSend} disabled={isStreaming} aria-label="Send Message">
                        <PaperAirplaneIcon />
                    </Button>
                </div>
            </Card.Footer>
        </Card>
    );
};

export const AiPersonalityForge: React.FC = () => {
    const [personalities, setPersonalities] = useAiPersonalities();
    const [activeId, setActiveId] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const activePersonality = personalities.find(p => p.id === activeId);

    useEffect(() => {
        if (!activeId && personalities.length > 0) {
            setActiveId(personalities[0].id);
        } else if (personalities.length === 0) {
            setActiveId(null);
        }
    }, [personalities, activeId]);

    const handleUpdate = useCallback((field: keyof SystemPrompt, value: any) => {
        if (!activePersonality) return;
        const updated = { ...activePersonality, [field]: value };
        setPersonalities(current => current.map(p => (p.id === activeId ? updated : p)));
    }, [activePersonality, activeId, setPersonalities]);

    const handleAddNew = useCallback(() => {
        const newId = `p_${Date.now()}`;
        const newPersonality: SystemPrompt = { ...DEFAULT_NEW_PROMPT, id: newId, name: `Personality ${personalities.length + 1}` };
        setPersonalities(current => [...current, newPersonality]);
        setActiveId(newId);
    }, [personalities, setPersonalities]);

    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this personality?')) {
            setPersonalities(current => current.filter(p => p.id !== id));
            if (activeId === id) {
                const remaining = personalities.filter(p => p.id !== id);
                setActiveId(remaining.length > 0 ? remaining[0].id : null);
            }
        }
    }, [activeId, personalities, setPersonalities]);

    const handleExport = useCallback(() => {
        if (!activePersonality) {
            addNotification('No active personality to export.', 'error');
            return;
        }
        downloadJson(activePersonality, `${activePersonality.name.replace(/\s+/g, '_')}.json`);
        addNotification(`Exported '${activePersonality.name}'!`, 'success');
    }, [activePersonality, addNotification]);

    const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string) as SystemPrompt;
                if (imported.id && imported.name && imported.persona) {
                    setPersonalities(prev => [...prev.filter(p => p.id !== imported.id), imported]);
                    setActiveId(imported.id);
                    addNotification(`Imported '${imported.name}'!`, 'success');
                } else {
                    addNotification('Invalid personality file format.', 'error');
                }
            } catch {
                addNotification('Failed to parse JSON file.', 'error');
            }
        };
        reader.readAsText(file);
    }, [setPersonalities, addNotification]);

    return (
        <Layout.Root className="h-full">
            <PersonalityList
                personalities={personalities}
                activeId={activeId}
                onSelect={setActiveId}
                onDelete={handleDelete}
                onAddNew={handleAddNew}
                onImport={handleImport}
                onExport={handleExport}
            />
            <Layout.Content>
                {activePersonality ? (
                    <Layout.Grid cols={2} gap="px" className="bg-border">
                        <div className="bg-background p-4 h-full overflow-y-auto">
                            <PersonalityEditor personality={activePersonality} onUpdate={handleUpdate} />
                        </div>
                        <div className="bg-background p-4 h-full overflow-y-auto">
                            <Testbed personality={activePersonality} />
                        </div>
                    </Layout.Grid>
                ) : (
                    <div className="flex h-full items-center justify-center text-text-secondary">
                        Select or create a personality to begin.
                    </div>
                )}
            </Layout.Content>
        </Layout.Root>
    );
};
};
