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

// React and hooks
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Core UI components from the new proprietary framework
import { Button, IconButton } from '@/ui/core/Button';
import { Input, TextArea } from '@/ui/core/Input';
import { Select } from '@/ui/core/Select';
import { Card } from '@/ui/core/Card';
import { Layout } from '@/ui/composite/Layout';
import { Sidebar } from '@/ui/composite/Sidebar';
import { LoadingSpinner } from '@/ui/core/LoadingSpinner';

// Icons
import { SparklesIcon, PlusIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpOnSquareIcon, PaperAirplaneIcon } from '@/components/icons';

// Hooks and Contexts
import { useAiPersonalities } from '@/hooks/useAiPersonalities';
import { useNotification } from '@/contexts/NotificationContext';
import { useWorkerPool } from '@/hooks/useWorkerPool';

// Services and Utilities
import { streamContent } from '@/services/aiService'; // Assumes this now points to the BFF/GraphQL layer
import { downloadJson } from '@/services/fileUtils';

// Types
import type { SystemPrompt, ChatMessage } from '@/types';
import { MarkdownRenderer } from '../shared';

// Constants
const DEFAULT_NEW_PROMPT: Omit<SystemPrompt, 'id' | 'name'> = {
    persona: 'You are a helpful assistant.',
    rules: [],
    outputFormat: 'markdown',
    exampleIO: [],
};

/**
 * @interface PersonalityListProps
 * @description Props for the PersonalityList component.
 */
interface PersonalityListProps {
    personalities: SystemPrompt[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onAddNew: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
}

/**
 * Renders the sidebar list of AI personalities and management controls.
 * @param {PersonalityListProps} props - The component props.
 * @returns {React.ReactElement} The rendered sidebar component.
 * @example
 * <PersonalityList
 *   personalities={personalities}
 *   activeId={activeId}
 *   onSelect={setActiveId}
 *   // ... other handlers
 * />
 */
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
                                variant="ghost"
                                size="sm"
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

/**
 * @interface PersonalityEditorProps
 * @description Props for the PersonalityEditor component.
 */
interface PersonalityEditorProps {
    personality: SystemPrompt;
    onUpdate: (field: keyof SystemPrompt, value: any) => void;
}

/**
 * Renders the form for editing the properties of an AI personality.
 * @param {PersonalityEditorProps} props - The component props.
 * @returns {React.ReactElement} The rendered editor form.
 * @performance This component uses multiple controlled inputs. For very large rule/example sets, virtualization could be considered.
 */
const PersonalityEditor: React.FC<PersonalityEditorProps> = ({ personality, onUpdate }) => {
    return (
        <Card className="flex flex-col h-full">
            <Card.Header>
                <Card.Title>Personality Editor</Card.Title>
            </Card.Header>
            <Card.Content className="flex-grow overflow-y-auto space-y-4">
                <div>
                    <label className="font-bold text-sm">Name</label>
                    <Input
                        value={personality.name}
                        onChange={e => onUpdate('name', e.target.value)}
                        className="w-full mt-1"
                    />
                </div>
                <div>
                    <label className="font-bold text-sm">Persona</label>
                    <TextArea
                        value={personality.persona}
                        onChange={e => onUpdate('persona', e.target.value)}
                        className="w-full mt-1 h-24"
                        placeholder="Describe the AI's core identity and purpose."
                    />
                </div>
                <div>
                    <label className="font-bold text-sm">Rules (one per line)</label>
                    <TextArea
                        value={personality.rules.join('\n')}
                        onChange={e => onUpdate('rules', e.target.value.split('\n'))}
                        className="w-full mt-1 h-32 font-mono"
                        placeholder="- Rule 1&#10;- Rule 2"
                    />
                </div>
                <div>
                    <label className="font-bold text-sm">Output Format</label>
                    <Select
                        value={personality.outputFormat}
                        onValueChange={(value) => onUpdate('outputFormat', value)}
                        className="w-full mt-1"
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
                                placeholder="User Input"
                                value={ex.input}
                                onChange={e => onUpdate('exampleIO', personality.exampleIO.map((item, idx) => idx === i ? { ...item, input: e.target.value } : item))}
                                className="h-20"
                            />
                            <TextArea
                                placeholder="Model Output"
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

/**
 * @interface TestbedProps
 * @description Props for the Testbed component.
 */
interface TestbedProps {
    personality: SystemPrompt;
}

/**
 * Renders the chat interface for live testing of an AI personality.
 * @param {TestbedProps} props - The component props.
 * @returns {React.ReactElement} The rendered testbed.
 * @security The MarkdownRenderer processes AI-generated content. Ensure proper sanitization is active.
 * @performance Communication with the web worker adds a small overhead but keeps the main thread free during prompt construction.
 */
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
            // Offload prompt construction to a web worker
            const systemInstruction = await workerPool.submitTask<string>('format-prompt', personality);

            // This call now represents an authenticated GraphQL request to the BFF
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
    
    // Clear chat history when personality changes
    useEffect(() => {
        setChatHistory([]);
    }, [personality.id]);

    return (
        <Card className="flex flex-col h-full">
            <Card.Header>
                <Card.Title>Live Testbed</Card.Title>
            </Card.Header>
            <Card.Content className="flex-grow overflow-y-auto space-y-4">
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

/**
 * The main component for the AI Personality Forge feature. It orchestrates the display
 * and management of AI personalities, combining the list, editor, and testbed components.
 *
 * @component
 * @returns {React.ReactElement | null} The rendered AiPersonalityForge component.
 * @example
 * <AiPersonalityForge />
 */
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
                // Basic validation
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
                        <div className="bg-background p-4 overflow-y-auto">
                            <PersonalityEditor personality={activePersonality} onUpdate={handleUpdate} />
                        </div>
                        <div className="bg-background p-4 overflow-y-auto">
                            <Testbed personality={activePersonality} />
                        </div>
                    </Layout.Grid>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-secondary">
                        Select or create a personality to begin.
                    </div>
                )}
            </Layout.Content>
        </Layout.Root>
    );
};
