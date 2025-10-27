/**
 * @copyright James Burvel O'Callaghan III
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { summarizeNotesStream } from '../../services/aiService'; 
// NOTE: In the new architecture, these services would be adapters making GraphQL calls to the BFF.
import { useNotification } from '../../contexts/NotificationContext';
import { SparklesIcon, DigitalWhiteboardIcon, TrashIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index';

// NOTE: In a real implementation, these would be imported from the 'ui-core' library.
const Button = ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>;
const TextArea = (props: React.ComponentProps<'textarea'>) => <textarea {...props} />;

/**
 * Defines the available semantic colors for sticky notes.
 * @typedef {'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange'} NoteColor
 */
type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

/**
 * Represents a single sticky note on the whiteboard.
 * @property {string} id - The unique identifier for the note, assigned by the backend.
 * @property {string} text - The content of the note.
 * @property {number} x - The x-coordinate of the note's top-left corner.
 * @property {number} y - The y-coordinate of the note's top-left corner.
 * @property {NoteColor} color - The semantic color of the note.
 */
interface Note {
    id: string;
    text: string;
    x: number;
    y: number;
    color: NoteColor;
}

/**
 * An array of available note colors, used for cycling through colors when creating new notes.
 * @security This is a presentation detail and contains no sensitive information.
 * @performance The array is small and constant, having no performance impact.
 */
const NOTE_COLORS: NoteColor[] = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'];

// NOTE: Mocked service for demonstration of architectural change. This would live in the service layer.
const notesService = {
    getNotes: async (): Promise<Note[]> => Promise.resolve([]),
    addNote: async (note: Omit<Note, 'id'>): Promise<Note> => Promise.resolve({ ...note, id: crypto.randomUUID() }),
    updateNote: async (id: string, updates: Partial<Note>): Promise<Note> => Promise.resolve({ id, text: '', x: 0, y: 0, color: 'yellow', ...updates }),
    deleteNote: async (id: string): Promise<void> => Promise.resolve(),
};

/**
 * @module DigitalWhiteboard
 * @description A collaborative digital whiteboard for creating and organizing sticky notes.
 * Features drag-and-drop positioning, color coding, and AI-powered summarization of notes.
 * All note data is persisted to the backend, replacing the previous localStorage implementation.
 * @example
 * <DigitalWhiteboard />
 */
export const DigitalWhiteboard: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState('');
    const { addNotification } = useNotification();

    useEffect(() => {
        /**
         * @private
         * @function fetchNotes
         * @description Fetches all notes from the backend when the component mounts.
         */
        const fetchNotes = async () => {
            try {
                const fetchedNotes = await notesService.getNotes();
                setNotes(fetchedNotes);
            } catch (error) {
                addNotification('Failed to load notes.', 'error');
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchNotes();
    }, [addNotification]);

    /**
     * @function handleSummarize
     * @description Gathers the text from all notes and sends it to the AI service for summarization.
     * Offloads summarization to a dedicated backend service.
     * @returns {Promise<void>}
     * @performance This function initiates a network request. The main thread is not blocked during the AI's processing.
     */
    const handleSummarize = useCallback(async () => {
        if (notes.length === 0) return;
        setIsSummarizing(true);
        setSummary('');
        try {
            const allNotesText = notes.map((n: Note) => `- ${n.text}`).join('\n');
            // NOTE: In the new architecture, this service call communicates with the BFF.
            const stream = await summarizeNotesStream(allNotesText);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setSummary(fullResponse);
            }
        } catch (error) {
            console.error(error);
            setSummary('Sorry, an error occurred while summarizing.');
            addNotification('Failed to generate summary.', 'error');
        } finally {
            setIsSummarizing(false);
        }
    }, [notes, addNotification]);

    /**
     * @function addNote
     * @description Creates a new note with default values and persists it to the backend.
     * @returns {Promise<void>}
     */
    const addNote = async () => {
        const newNoteData: Omit<Note, 'id'> = {
            text: 'New idea...',
            x: 50,
            y: 50,
            color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
        };
        try {
            const createdNote = await notesService.addNote(newNoteData);
            setNotes(prev => [...prev, createdNote]);
            addNotification('Note added!', 'success');
        } catch (error) {
            addNotification('Failed to add note.', 'error');
        }
    };
    
    /**
     * @function deleteNote
     * @description Deletes a note from the backend and removes it from the local state.
     * @param {string} id - The ID of the note to delete.
     * @param {React.MouseEvent} e - The mouse event to stop propagation.
     * @returns {Promise<void>}
     */
    const deleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notesService.deleteNote(id);
            setNotes(notes.filter((n) => n.id !== id));
            addNotification('Note deleted.', 'info');
        } catch (error) {
            addNotification('Failed to delete note.', 'error');
        }
    };

    /**
     * @function updateNoteText
     * @description Updates the text content of a note and persists the change.
     * @param {string} id - The ID of the note to update.
     * @param {string} text - The new text content.
     * @returns {void}
     */
    const updateNoteText = (id: string, text: string) => {
        setNotes(notes.map((n) => n.id === id ? { ...n, text } : n));
        // NOTE: In a real app, you might debounce this call.
        notesService.updateNote(id, { text }).catch(() => addNotification('Failed to save note text.', 'error'));
    };

    /**
     * @function updateNoteColor
     * @description Updates the color of a note and persists the change.
     * @param {string} id - The ID of the note to update.
     * @param {NoteColor} color - The new color.
     * @returns {void}
     */
    const updateNoteColor = (id: string, color: NoteColor) => {
        setNotes(notes.map((n) => n.id === id ? { ...n, color } : n));
        notesService.updateNote(id, { color }).catch(() => addNotification('Failed to save note color.', 'error'));
    };

    /**
     * @function onMouseDown
     * @description Initiates the dragging process for a note.
     * @param {React.MouseEvent<HTMLDivElement>} e - The mouse down event.
     * @param {string} id - The ID of the note being dragged.
     * @returns {void}
     */
    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'TEXTAREA' || target.dataset.role === 'button') return;
        
        const noteElement = e.currentTarget;
        const rect = noteElement.getBoundingClientRect();
        setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    };

    /**
     * @function onMouseMove
     * @description Handles the movement of a dragged note across the whiteboard.
     * @param {React.MouseEvent<HTMLDivElement>} e - The mouse move event.
     * @returns {void}
     */
    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const boardRect = e.currentTarget.getBoundingClientRect();
        const newX = e.clientX - dragging.offsetX - boardRect.left;
        const newY = e.clientY - dragging.offsetY - boardRect.top;
        setNotes(notes.map(n => n.id === dragging.id ? { ...n, x: newX, y: newY } : n));
    };

    /**
     * @function onMouseUp
     * @description Finalizes the dragging process, persisting the new position of the note.
     * @returns {Promise<void>}
     */
    const onMouseUp = async () => {
        if (dragging) {
            const note = notes.find(n => n.id === dragging.id);
            if (note) {
                try {
                    await notesService.updateNote(dragging.id, { x: note.x, y: note.y });
                } catch (error) {
                    addNotification('Failed to save note position.', 'error');
                }
            }
        }
        setDragging(null);
    };

    if (isDataLoading) {
        return <div className="w-full h-full flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold flex items-center"><DigitalWhiteboardIcon /><span className="ml-3">Digital Whiteboard</span></h1>
                    <p className="text-text-secondary mt-1">Organize your ideas with interactive sticky notes and AI summaries.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSummarize} disabled={isSummarizing || notes.length === 0} className="btn-primary flex items-center gap-2 px-4 py-2">
                        <SparklesIcon/> {isSummarizing ? 'Summarizing...' : 'AI Summarize'}
                    </Button>
                    <Button onClick={addNote} className="btn-primary px-6 py-2">Add Note</Button>
                </div>
            </header>
            <div
                className="relative flex-grow bg-background border-2 border-dashed border-border rounded-lg overflow-hidden"
                onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            >
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className={`group absolute w-56 h-56 p-2 flex flex-col shadow-lg cursor-grab active:cursor-grabbing rounded-md transition-transform duration-100 border border-black/20 note note-${note.color}`}
                        style={{ top: note.y, left: note.x, transform: dragging?.id === note.id ? 'scale(1.05)' : 'scale(1)' }}
                        onMouseDown={e => onMouseDown(e, note.id)}
                    >
                        <Button data-role="button" onClick={(e) => deleteNote(note.id, e)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-700 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"><TrashIcon /></Button>
                        <TextArea
                            value={note.text}
                            onChange={(e) => updateNoteText(note.id, e.target.value)}
                            className="w-full h-full bg-transparent resize-none focus:outline-none font-medium p-1"
                        />
                        <div data-role="button" className="flex-shrink-0 flex justify-center gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {NOTE_COLORS.map((c) => <Button key={c} onClick={() => updateNoteColor(note.id, c)} className={`w-4 h-4 rounded-full border border-black/20 note-${c} ${note.color === c ? 'ring-2 ring-offset-1 ring-black/50' : ''}`}/>)}
                        </div>
                    </div>
                ))}
            </div>
             {(isSummarizing || summary) && (
                 <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setSummary('')}>
                    <div className="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">AI Summary of Notes</h2>
                        {isSummarizing && !summary ? <LoadingSpinner /> : 
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                          <MarkdownRenderer content={summary} />
                        </div>}
                    </div>
                </div>
            )}
        </div>
    );
};
