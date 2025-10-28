/**
 * @fileoverview SnippetVault micro-frontend.
 * This component provides a user interface for managing reusable code snippets.
 * It uses local storage for persistence and mock AI functions for enhancements.
 * All UI elements are built with standard elements and Tailwind CSS.
 *
 * @see hooks/useLocalStorage.ts
 * @see services/fileUtils.ts
 * @security This component handles user-generated code. While the code is not executed
 *           client-side, care is taken to properly render it as text to prevent XSS.
 * @performance The component uses local state and storage, which is performant for a moderate number of snippets.
 *              A local search filter is implemented with useMemo for performance.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useNotification } from '../../contexts/NotificationContext';
import { downloadFile } from '../../services/fileUtils';
import { LoadingSpinner } from '../shared';
import {
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
} from '../icons';

// Define Snippet type locally
interface Snippet {
  id: string;
  name: string;
  code: string;
  language: string;
  tags?: string[];
}

// Mock AI functions since no backend is connected
const enhanceSnippetAI = async (code: string): Promise<string> => {
  await new Promise((res) => setTimeout(res, 1000));
  return `/*\n-- AI ENHANCEMENT --\nRefactored for clarity and performance.\n*/\n\n${code}`;
};

const generateTagsAI = async (code: string): Promise<string[]> => {
  await new Promise((res) => setTimeout(res, 1000));
  const tags = ['ai-generated'];
  if (code.toLowerCase().includes('react')) tags.push('react');
  if (code.toLowerCase().includes('function')) tags.push('function');
  return tags;
};

// Language to file extension mapping
const langToExt: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  css: 'css',
  html: 'html',
  json: 'json',
  markdown: 'md',
  plaintext: 'txt',
};

// Simple UI component placeholders styled with Tailwind
const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex flex-col h-full bg-surface border border-border rounded-lg ${className || ''}`}>{children}</div>
);
const PanelHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-4 border-b border-border flex-shrink-0 ${className || ''}`}>{children}</div>
);
const PanelBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-4 flex-grow overflow-y-auto ${className || ''}`}>{children}</div>
);
const PanelFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-4 border-t border-border flex-shrink-0 ${className || ''}`}>{children}</div>
);

const SidebarLayout: React.FC<{ sidebar: React.ReactNode; main: React.ReactNode }> = ({ sidebar, main }) => (
  <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 min-h-0 mt-4">
    <div className="md:col-span-1 h-full min-h-0">{sidebar}</div>
    <div className="md:col-span-3 h-full min-h-0">{main}</div>
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; onRemove: () => void }> = ({ children, onRemove }) => (
  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
    {children}
    <button onClick={onRemove} className="text-primary/70 hover:text-primary">
      &times;
    </button>
  </span>
);

const TagInput: React.FC<{ tags: string[]; onTagsChange: (newTags: string[]) => void; placeholder?: string }> = ({
  tags,
  onTagsChange,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState('');
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      if (!tags.includes(inputValue)) {
        onTagsChange([...tags, inputValue]);
      }
      setInputValue('');
    }
  };
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Tag key={tag} onRemove={() => removeTag(tag)}>
            {tag}
          </Tag>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-background border border-border px-2 py-1 rounded text-sm"
      />
    </div>
  );
};

export const SnippetVault: React.FC = () => {
  const [snippets, setSnippets] = useLocalStorage<Snippet[]>('devcore_snippets', [
    {
      id: '1',
      name: 'React Functional Component',
      code: 'const MyComponent = () => <div>Hello</div>;',
      language: 'javascript',
      tags: ['react', 'component'],
    },
    {
      id: '2',
      name: 'Python Fetch URL',
      code: 'import requests\n\nresponse = requests.get("https://example.com")',
      language: 'python',
      tags: ['python', 'http'],
    },
  ]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const { addNotification } = useNotification();

  const activeSnippet = useMemo(() => snippets.find((s) => s.id === activeSnippetId), [snippets, activeSnippetId]);

  const filteredSnippets = useMemo(() => {
    if (!searchTerm) return snippets;
    const lowerSearch = searchTerm.toLowerCase();
    return snippets.filter(
      (s: Snippet) =>
        s.name.toLowerCase().includes(lowerSearch) ||
        s.code.toLowerCase().includes(lowerSearch) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(lowerSearch))),
    );
  }, [snippets, searchTerm]);

  useEffect(() => {
    if (!activeSnippetId && filteredSnippets.length > 0) {
      setActiveSnippetId(filteredSnippets[0].id);
    } else if (filteredSnippets.length === 0) {
      setActiveSnippetId(null);
    }
  }, [filteredSnippets, activeSnippetId]);

  const updateSnippet = (id: string, updates: Partial<Snippet>) => {
    setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleEnhance = useCallback(async () => {
    if (!activeSnippet) return;
    setIsEnhancing(true);
    try {
      const enhancedCode = await enhanceSnippetAI(activeSnippet.code);
      updateSnippet(activeSnippet.id, { code: enhancedCode });
      addNotification('Snippet enhanced by AI!', 'success');
    } catch (e) {
      addNotification(`Enhancement failed: ${(e as Error).message}`, 'error');
    } finally {
      setIsEnhancing(false);
    }
  }, [activeSnippet, addNotification]);

  const handleAiTagging = useCallback(async () => {
    if (!activeSnippet || !activeSnippet.code.trim()) return;
    setIsTagging(true);
    try {
      const suggestedTags = await generateTagsAI(activeSnippet.code);
      const newTags = [...new Set([...(activeSnippet.tags || []), ...suggestedTags])];
      updateSnippet(activeSnippet.id, { tags: newTags });
      addNotification('AI tags added!', 'success');
    } catch (e) {
      addNotification(`AI tagging failed: ${(e as Error).message}`, 'error');
    } finally {
      setIsTagging(false);
    }
  }, [activeSnippet, addNotification]);

  const handleAddNew = useCallback(() => {
    const newSnippet: Snippet = {
      id: `snippet-${Date.now()}`,
      name: 'New Snippet',
      code: '// Your new snippet here',
      language: 'plaintext',
      tags: [],
    };
    setSnippets((prev) => [newSnippet, ...prev]);
    setActiveSnippetId(newSnippet.id);
  }, [setSnippets]);

  const handleDelete = useCallback(
    (id: string) => {
      const snippetToDelete = snippets.find((s) => s.id === id);
      if (window.confirm(`Are you sure you want to delete "${snippetToDelete?.name}"?`)) {
        setSnippets((prev) => prev.filter((s) => s.id !== id));
        if (activeSnippetId === id) {
          const remaining = snippets.filter((s) => s.id !== id);
          setActiveSnippetId(remaining.length > 0 ? remaining[0].id : null);
        }
        addNotification('Snippet deleted.', 'info');
      }
    },
    [setSnippets, activeSnippetId, snippets, addNotification],
  );

  const handleDownload = useCallback(() => {
    if (!activeSnippet) return;
    const extension = langToExt[activeSnippet.language] || 'txt';
    const filename = `${activeSnippet.name.replace(/\s/g, '_')}.${extension}`;
    downloadFile(activeSnippet.code, filename, 'text/plain');
  }, [activeSnippet]);

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditingName(false);
    if (activeSnippet && activeSnippet.name !== e.target.value) {
      updateSnippet(activeSnippet.id, { name: e.target.value });
    }
  };

  const handleTagsUpdate = (newTags: string[]) => {
    if (activeSnippet) {
      updateSnippet(activeSnippet.id, { tags: newTags });
    }
  };

  const sidebarContent = (
    <Panel className="min-h-0">
      <PanelHeader>
        <input
          type="text"
          placeholder="Search snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background border border-border px-2 py-1 rounded text-sm"
          aria-label="Search snippets"
        />
      </PanelHeader>
      <PanelBody className="p-2">
        <ul className="space-y-1">
          {filteredSnippets.map((s: Snippet) => (
            <li key={s.id} className="group flex items-center justify-between rounded-md hover:bg-surface-hover">
              <button
                onClick={() => setActiveSnippetId(s.id)}
                className={`w-full text-left justify-start p-2 rounded-md text-sm truncate ${
                  activeSnippet?.id === s.id ? 'bg-primary/10 text-primary font-semibold' : 'text-text-primary'
                }`}
              >
                {s.name}
              </button>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity pr-1 flex-shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(s.code);
                    addNotification('Copied snippet!', 'success');
                  }}
                  title="Copy"
                  className="p-1 text-text-secondary hover:text-primary"
                >
                  <ClipboardDocumentIcon />
                </button>
                <button onClick={() => handleDelete(s.id)} title="Delete" className="p-1 text-text-secondary hover:text-red-500">
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </PanelBody>
      <PanelFooter>
        <button onClick={handleAddNew} className="btn-primary w-full flex items-center justify-center gap-2 py-2">
          <PlusIcon /> Add New Snippet
        </button>
      </PanelFooter>
    </Panel>
  );

  const mainContent = (
    <Panel className="min-h-0">
      {activeSnippet ? (
        <>
          <PanelHeader className="flex justify-between items-center">
            {isEditingName ? (
              <input
                defaultValue={activeSnippet.name}
                onBlur={handleNameBlur}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                autoFocus
                className="text-lg font-bold bg-transparent border-b border-primary focus:outline-none"
                aria-label="Snippet name"
              />
            ) : (
              <h3 onDoubleClick={() => setIsEditingName(true)} className="cursor-pointer text-lg font-bold flex items-center gap-2">
                {activeSnippet.name} <PencilIcon className="w-4 h-4 text-text-secondary opacity-50" />
              </h3>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAiTagging}
                disabled={isTagging}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                {isTagging ? <LoadingSpinner /> : <SparklesIcon />} AI Tag
              </button>
              <button
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                {isEnhancing ? <LoadingSpinner /> : <SparklesIcon />} AI Enhance
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                <ArrowDownTrayIcon /> Download
              </button>
            </div>
          </PanelHeader>
          <textarea
            value={activeSnippet.code}
            onChange={(e) => updateSnippet(activeSnippet.id, { code: e.target.value })}
            className="flex-grow font-mono text-sm bg-background p-4 resize-none focus:outline-none"
            aria-label="Snippet code"
            spellCheck="false"
          />
          <PanelFooter>
            <TagInput tags={activeSnippet.tags ?? []} onTagsChange={handleTagsUpdate} placeholder="+ Add tag (press Enter)" />
          </PanelFooter>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center text-text-secondary">
          Select a snippet or create a new one.
        </div>
      )}
    </Panel>
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DocumentTextIcon /> Snippet Vault
        </h1>
        <p className="text-text-secondary mt-1">Store, search, tag, and enhance your reusable code snippets with AI.</p>
      </header>
      <SidebarLayout sidebar={sidebarContent} main={mainContent} />
    </div>
  );
};
