/**
 * @file ProjectMoodboard.tsx
 * @description A visual, interactive mood board for projects, allowing users to add text notes, color swatches, and AI-generated images.
 * @module features/ProjectMoodboard
 * @see useLocalStorage
 * @see aiService.generateImage
 * @implements Core UI patterns with drag, resize, and state management.
 * @performance The component uses memoization for rendering items and offloads AI image generation to a service. Drag and resize operations are handled on the main thread and could be performance-intensive with hundreds of items.
 * @security AI-generated image content is not sanitized. User-input text is rendered in a textarea, mitigating XSS risks in that context.
 * @example <ProjectMoodboard />
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { generateImage } from '../../services/aiService';
import { useNotification } from '../../contexts/NotificationContext';
import { SparklesIcon, DocumentTextIcon, PhotoIcon, TrashIcon } from '../icons';
import { LoadingSpinner } from '../shared/index';

/**
 * A simple palette icon component.
 * @returns {React.ReactElement} The SVG icon.
 */
const PaletteIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402a3.75 3.75 0 00-.615-5.918L14.25 4.5l-6.402 6.402a3.75 3.75 0 000 5.304l-1.499 1.499a.75.75 0 000 1.06l1.06 1.06a.75.75 0 001.06 0l1.499-1.499z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25l6.402-6.402a3.75 3.75 0 015.304 5.304l-6.402 6.402-6.402-6.402z" />
  </svg>
);

/** @description Defines the type of item on the mood board. */
type MoodboardItemType = 'text' | 'image' | 'color';

/** @description Represents a single item on the project mood board. */
interface MoodboardItem {
  /** @description A unique identifier for the item. */
  id: string;
  /** @description The type of the item. */
  type: MoodboardItemType;
  /** @description The content of the item (text, image URL, or hex color). */
  content: string;
  /** @description The x-coordinate of the item's top-left corner. */
  x: number;
  /** @description The y-coordinate of the item's top-left corner. */
  y: number;
  /** @description The width of the item. */
  width: number;
  /** @description The height of the item. */
  height: number;
  /** @description The stacking order of the item. */
  zIndex: number;
}

/** @description Defines the state for an active drag or resize interaction. */
interface InteractionState {
  action: 'drag' | 'resize';
  id: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth?: number;
  initialHeight?: number;
  handle?: string;
}

/**
 * The Project Moodboard feature component.
 * Provides an interactive canvas to arrange text notes, colors, and AI-generated images.
 * State is persisted to local storage.
 * @returns {React.ReactElement} The rendered component.
 */
export const ProjectMoodboard: React.FC = () => {
  const [items, setItems] = useLocalStorage<MoodboardItem[]>('project-moodboard-items', []);
  const [aiPrompt, setAiPrompt] = useState('A developer cat writing code, pixel art');
  const [isLoading, setIsLoading] = useState(false);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const { addNotification } = useNotification();
  const canvasRef = useRef<HTMLDivElement>(null);
  const zIndexCounter = useRef(items.length > 0 ? Math.max(...items.map(i => i.zIndex)) : 0);

  /**
   * Brings a specific item to the front by updating its z-index.
   * @param {string} id The ID of the item to bring to the front.
   * @returns {void}
   */
  const bringToFront = useCallback((id: string) => {
    zIndexCounter.current += 1;
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, zIndex: zIndexCounter.current } : item
      )
    );
  }, [setItems]);

  /**
   * Adds a new item to the mood board.
   * @param {MoodboardItemType} type The type of item to add.
   * @returns {void}
   */
  const handleAddItem = (type: MoodboardItemType) => {
    zIndexCounter.current += 1;
    const newItem: MoodboardItem = {
      id: `item-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Note' : type === 'color' ? '#38bdf8' : '',
      x: 50, y: 50, width: 200, height: 200,
      zIndex: zIndexCounter.current,
    };
    setItems(prev => [...prev, newItem]);
  };

  /**
   * Generates an image using AI based on the current prompt and adds it to the board.
   * @returns {Promise<void>}
   */
  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      addNotification('Please enter a prompt for the image.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const imageUrl = await generateImage(aiPrompt);
      zIndexCounter.current += 1;
      const newImageItem: MoodboardItem = {
        id: `item-${Date.now()}`,
        type: 'image',
        content: imageUrl,
        x: 100, y: 100, width: 256, height: 256,
        zIndex: zIndexCounter.current,
      };
      setItems(prev => [...prev, newImageItem]);
      addNotification('AI Image generated and added!', 'success');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error during image generation.';
      addNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemMouseDown = useCallback((e: React.MouseEvent, id: string, action: 'drag' | 'resize', handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(id);
    const item = items.find(i => i.id === id);
    if (!item) return;

    setInteraction({
      action,
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      initialWidth: item.width,
      initialHeight: item.height,
    });
  }, [items, bringToFront]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!interaction) return;

    const dx = e.clientX - interaction.startX;
    const dy = e.clientY - interaction.startY;

    setItems(prevItems => prevItems.map(item => {
      if (item.id !== interaction.id) return item;

      if (interaction.action === 'drag') {
        return { ...item, x: interaction.initialX + dx, y: interaction.initialY + dy };
      }
      
      if (interaction.action === 'resize') {
        const { initialX, initialY, initialWidth = 0, initialHeight = 0, handle } = interaction;
        let { x, y, width, height } = item;

        if (handle?.includes('r')) width = Math.max(50, initialWidth + dx);
        if (handle?.includes('l')) {
          width = Math.max(50, initialWidth - dx);
          x = initialX + dx;
        }
        if (handle?.includes('b')) height = Math.max(50, initialHeight + dy);
        if (handle?.includes('t')) {
          height = Math.max(50, initialHeight - dy);
          y = initialY + dy;
        }
        return { ...item, x, y, width, height };
      }
      return item;
    }));
  }, [interaction, setItems]);

  const handleMouseUp = useCallback(() => {
    setInteraction(null);
  }, []);

  useEffect(() => {
    if (interaction) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, handleMouseMove, handleMouseUp]);

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemContentChange = (id: string, newContent: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, content: newContent } : item));
  };

  const ItemRenderer = useMemo(() => React.memo(({ item }: { item: MoodboardItem }) => {
    const resizeHandles = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'];
    const resizeHandleCursors: { [key: string]: string } = {
      tl: 'nwse-resize', t: 'ns-resize', tr: 'nesw-resize',
      l: 'ew-resize', r: 'ew-resize',
      bl: 'nesw-resize', b: 'ns-resize', br: 'nwse-resize'
    };

    return (
      <div
        className="absolute bg-surface border border-border shadow-lg group"
        style={{ left: item.x, top: item.y, width: item.width, height: item.height, zIndex: item.zIndex, cursor: 'grab' }}
        onMouseDown={(e) => handleItemMouseDown(e, item.id, 'drag')}
      >
        <div className="w-full h-full flex flex-col">
          {item.type === 'text' && <textarea value={item.content} onChange={(e) => handleItemContentChange(item.id, e.target.value)} className="w-full h-full bg-transparent resize-none p-2 text-text-primary focus:outline-none" />}
          {item.type === 'color' && <div className="w-full h-full flex items-end justify-end p-2" style={{ backgroundColor: item.content }}><input type="color" value={item.content} onChange={(e) => handleItemContentChange(item.id, e.target.value)} className="w-8 h-8 cursor-pointer" /></div>}
          {item.type === 'image' && <img src={item.content} alt="moodboard item" className="w-full h-full object-cover" draggable="false" />}
        </div>
        <button onClick={() => handleDeleteItem(item.id)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><TrashIcon className="w-4 h-4" /></button>
        {resizeHandles.map(handle => (
          <div key={handle} onMouseDown={(e) => handleItemMouseDown(e, item.id, 'resize', handle)} className={`absolute w-3 h-3 bg-primary border-2 border-surface rounded-full opacity-0 group-hover:opacity-100 ${handle}`} style={{ cursor: resizeHandleCursors[handle] }}/>
        ))}
        <style>{`.tl{top:-6px;left:-6px}.t{top:-6px;left:50%;transform:translateX(-50%)}.tr{top:-6px;right:-6px}.l{top:50%;left:-6px;transform:translateY(-50%)}.r{top:50%;right:-6px;transform:translateY(-50%)}.bl{bottom:-6px;left:-6px}.b{bottom:-6px;left:50%;transform:translateX(-50%)}.br{bottom:-6px;right:-6px}`}</style>
      </div>
    );
  }), [handleItemMouseDown, handleDeleteItem, handleItemContentChange]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold">Project Moodboard</h1>
        <p className="text-text-secondary mt-1">Collect ideas, inspiration, and assets for your project.</p>
      </header>
      
      <div className="flex flex-wrap items-center gap-4 p-4 bg-surface border border-border rounded-lg mb-4 flex-shrink-0">
        <button onClick={() => handleAddItem('text')} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 rounded-md"><DocumentTextIcon /> Add Note</button>
        <button onClick={() => handleAddItem('color')} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 rounded-md"><PaletteIcon /> Add Color</button>
        <div className="flex items-center gap-2 ml-auto">
          <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe an image..." className="px-3 py-1.5 rounded-md bg-background border border-border text-sm w-64" />
          <button onClick={handleGenerateImage} disabled={isLoading} className="btn-primary px-4 py-1.5 text-sm flex items-center justify-center min-w-[100px]">{isLoading ? <LoadingSpinner /> : <><SparklesIcon /> Generate</>}</button>
        </div>
      </div>

      <div ref={canvasRef} className="relative flex-grow bg-background border-2 border-dashed border-border rounded-lg overflow-hidden">
        {items.map(item => <ItemRenderer key={item.id} item={item} />)}
      </div>
    </div>
  );
};
