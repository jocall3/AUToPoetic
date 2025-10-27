/**
 * @file components/features/ProjectExplorer.tsx
 * @summary A micro-frontend component for browsing and editing files in a connected GitHub repository.
 * @description This component allows users to select a GitHub repository, navigate its file tree, view and edit file content, and commit changes.
 * It adheres to the new federated architecture by delegating all GitHub interactions to a Backend-for-Frontend (BFF) layer.
 * @security This component communicates with a secure BFF layer via GraphQL (simulated). It does not handle authentication tokens or secrets directly.
 * @performance File content is fetched on-demand. The file tree is fetched once per repository selection and can be cached in global state.
 * @see hooks/useGlobalState.ts for state management.
 * @see contexts/NotificationContext.ts for user feedback.
 * @example
 * <ProjectExplorer />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import type { Repo, FileNode } from '../../types.ts';
import { FolderIcon, DocumentIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';
import * as Diff from 'diff';

// --- Mock BFF API Functions ---
// In a real implementation, these would be replaced by GraphQL hooks (e.g., from Apollo or urql)
// that communicate with the Backend-for-Frontend (BFF).

/**
 * @description Simulates fetching user repositories from the BFF.
 * @returns {Promise<Repo[]>} A list of user's repositories.
 */
async function fetchReposFromBff(): Promise<Repo[]> {
    console.log("Fetching repos from BFF...");
    // Placeholder: In a real app, this would be a GraphQL query.
    await new Promise(res => setTimeout(res, 1000));
    // This mock data would be returned from the BFF, which gets it from the GitHubProxyService.
    return [
        { id: 1, name: 'react-app', full_name: 'test-user/react-app', private: false, html_url: '', description: 'A sample React app.' },
        { id: 2, name: 'api-service', full_name: 'test-user/api-service', private: true, html_url: '', description: 'A sample API service.' },
    ];
}

/**
 * @description Simulates fetching a repository's file tree from the BFF.
 * @param {string} owner The repository owner.
 * @param {string} repo The repository name.
 * @returns {Promise<FileNode>} The root node of the file tree.
 */
async function fetchTreeFromBff(owner: string, repo: string): Promise<FileNode> {
    console.log(`Fetching tree for ${owner}/${repo} from BFF...`);
    await new Promise(res => setTimeout(res, 1500));
    // Mock response from BFF.
    return {
        name: repo,
        type: 'folder',
        path: '',
        children: [
            { name: 'src', type: 'folder', path: 'src', children: [
                { name: 'App.tsx', type: 'file', path: 'src/App.tsx' },
                { name: 'index.css', type: 'file', path: 'src/index.css' },
            ]},
            { name: 'package.json', type: 'file', path: 'package.json' },
        ]
    };
}

/**
 * @description Simulates fetching file content from the BFF.
 * @param {string} owner The repository owner.
 * @param {string} repo The repository name.
 * @param {string} path The path to the file.
 * @returns {Promise<string>} The file content.
 */
async function fetchContentFromBff(owner: string, repo: string, path: string): Promise<string> {
    console.log(`Fetching content for ${path} from BFF...`);
    await new Promise(res => setTimeout(res, 800));
    return `// Mock content for ${path}\n\nconsole.log("Hello from ${repo}!");`;
}

/**
 * @description Simulates committing file changes via the BFF.
 * @param {string} owner The repository owner.
 * @param {string} repo The repository name.
 * @param {string} path The path to the file being changed.
 * @param {string} content The new content of the file.
 * @param {string} message The commit message.
 * @returns {Promise<{commitUrl: string}>} The URL of the new commit.
 */
async function commitToBff(owner: string, repo: string, path: string, content: string, message: string): Promise<{commitUrl: string}> {
    console.log(`Committing changes to ${path} in ${owner}/${repo} via BFF...`);
    console.log(`Commit Message: ${message}`);
    await new Promise(res => setTimeout(res, 2000));
    // The BFF would handle AI commit message generation if the provided message is empty.
    // It would then use the GitHubProxyService to perform the commit.
    return { commitUrl: 'https://github.com/mock/commit/12345' };
}

/**
 * A recursive component to display the file tree structure of a repository.
 * @param {object} props - The component props.
 * @param {FileNode} props.node - The current node in the file tree.
 * @param {(path: string, name: string) => void} props.onFileSelect - Callback when a file is selected.
 * @param {string | null} props.activePath - The path of the currently active file.
 * @returns {React.ReactElement} The rendered file tree node.
 */
const FileTree: React.FC<{ node: FileNode, onFileSelect: (path: string, name: string) => void, activePath: string | null }> = ({ node, onFileSelect, activePath }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (node.type === 'file') {
        const isActive = activePath === node.path;
        return (
            <div
                className={`flex items-center space-x-2 pl-4 py-1 cursor-pointer rounded ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                onClick={() => onFileSelect(node.path, node.name)}
            >
                <DocumentIcon />
                <span>{node.name}</span>
            </div>
        );
    }

    return (
        <div>
            <div
                className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</div>
                <FolderIcon />
                <span className="font-semibold">{node.name}</span>
            </div>
            {isOpen && node.children && (
                <div className="pl-4 border-l border-border ml-3">
                    {node.children.map(child => <FileTree key={child.path} node={child} onFileSelect={onFileSelect} activePath={activePath} />)}
                </div>
            )}
        </div>
    );
};

/**
 * The main ProjectExplorer component.
 * Orchestrates fetching repository data, displaying the file tree, and handling file editing and commits.
 * @returns {React.ReactElement} The rendered Project Explorer feature.
 */
export const ProjectExplorer: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const { user, githubUser, selectedRepo, projectFiles } = state;
    const { addNotification } = useNotification();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState<'repos' | 'tree' | 'file' | 'commit' | null>(null);
    const [error, setError] = useState('');
    const [activeFile, setActiveFile] = useState<{ path: string; name: string; originalContent: string; editedContent: string} | null>(null);
    const [commitMessage, setCommitMessage] = useState('');

    useEffect(() => {
        const loadRepos = async () => {
            if (user && githubUser) {
                setIsLoading('repos');
                setError('');
                try {
                    const userRepos = await fetchReposFromBff();
                    setRepos(userRepos);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to load repositories');
                } finally {
                    setIsLoading(null);
                }
            } else {
                setRepos([]);
            }
        };
        loadRepos();
    }, [user, githubUser]);

    useEffect(() => {
        const loadTree = async () => {
             if (selectedRepo && user && githubUser) {
                setIsLoading('tree');
                setError('');
                setActiveFile(null);
                try {
                    const tree = await fetchTreeFromBff(selectedRepo.owner, selectedRepo.repo);
                    dispatch({ type: 'LOAD_PROJECT_FILES', payload: tree });
                } catch (err) {
                     setError(err instanceof Error ? err.message : 'Failed to load repository tree');
                } finally {
                    setIsLoading(null);
                }
            }
        };
        loadTree();
    }, [selectedRepo, user, githubUser, dispatch]);

    const handleFileSelect = useCallback(async (path: string, name: string) => {
        if (!selectedRepo) return;
        setIsLoading('file');
        try {
            const content = await fetchContentFromBff(selectedRepo.owner, selectedRepo.repo, path);
            setActiveFile({ path, name, originalContent: content, editedContent: content });
            setCommitMessage(''); // Reset commit message on new file select
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(null);
        }
    }, [selectedRepo]);

    const handleCommit = useCallback(async () => {
        if (!activeFile || !selectedRepo || !hasChanges) return;

        setIsLoading('commit');
        setError('');
        try {
            // The BFF will handle AI commit message generation if the provided message is empty.
            await commitToBff(
                selectedRepo.owner,
                selectedRepo.repo,
                activeFile.path,
                activeFile.editedContent,
                commitMessage
            );
            
            addNotification(`Successfully committed to ${selectedRepo.repo}`, 'success');
            setActiveFile(prev => prev ? { ...prev, originalContent: prev.editedContent } : null);
            setCommitMessage('');

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to commit changes';
            setError(message);
            addNotification(message, 'error');
        } finally {
            setIsLoading(null);
        }
    }, [activeFile, selectedRepo, commitMessage, addNotification]);
    
    if (!user || !githubUser) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4">
                <FolderIcon />
                <h2 className="text-lg font-semibold mt-2">Connect to GitHub</h2>
                <p>Please go to the "Connections" feature and provide a Personal Access Token to explore your repositories.</p>
            </div>
        );
    }

    const hasChanges = activeFile ? activeFile.originalContent !== activeFile.editedContent : false;

    return (
        <div className="h-full flex flex-col text-text-primary">
            <header className="p-4 border-b border-border flex-shrink-0">
                <h1 className="text-xl font-bold flex items-center"><FolderIcon /><span className="ml-3">Project Explorer</span></h1>
                <div className="mt-2">
                    <select
                        value={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.repo}` : ''}
                        onChange={e => {
                            const [owner, repo] = e.target.value.split('/');
                            dispatch({ type: 'SET_SELECTED_REPO', payload: { owner, repo } });
                        }}
                        className="w-full p-2 bg-surface border border-border rounded-md text-sm"
                    >
                        <option value="" disabled>{isLoading === 'repos' ? 'Loading Repositories...' : 'Select a repository'}</option>
                        {repos.map(r => <option key={r.id} value={r.full_name}>{r.full_name}</option>)}
                    </select>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </header>
            <div className="flex-grow flex min-h-0">
                <aside className="w-1/3 max-w-xs bg-background border-r border-border p-4 overflow-y-auto">
                    {isLoading === 'tree' && <div className="flex justify-center"><LoadingSpinner /></div>}
                    {projectFiles && <FileTree node={projectFiles} onFileSelect={handleFileSelect} activePath={activeFile?.path ?? null} />}
                </aside>
                <main className="flex-1 bg-surface flex flex-col">
                     <div className="flex-grow flex flex-col min-h-0">
                         <div className="p-2 border-b border-border bg-gray-50 dark:bg-slate-800">
                            <span className="text-sm font-semibold truncate">{activeFile?.path || 'No file selected'}</span>
                         </div>
                         {isLoading === 'file' ? <div className="flex items-center justify-center h-full"><LoadingSpinner /></div> :
                            <textarea 
                                value={activeFile?.editedContent ?? 'Select a file to view its content.'}
                                onChange={e => setActiveFile(prev => prev ? { ...prev, editedContent: e.target.value } : null)}
                                disabled={!activeFile}
                                className="w-full h-full p-4 text-sm font-mono bg-transparent resize-none focus:outline-none"
                                spellCheck="false"
                            />
                        }
                     </div>
                     {activeFile && (
                        <div className="flex-shrink-0 p-3 border-t border-border bg-gray-50 dark:bg-slate-800 space-y-2">
                            <input 
                                type="text"
                                value={commitMessage}
                                onChange={e => setCommitMessage(e.target.value)}
                                placeholder="Commit message (optional, AI will generate if blank)"
                                className="w-full p-2 bg-background border border-border rounded-md text-sm"
                                disabled={!hasChanges}
                            />
                            <button onClick={handleCommit} disabled={!hasChanges || isLoading === 'commit'} className="btn-primary w-full px-4 py-2 text-sm flex items-center justify-center min-w-[120px]">
                               {isLoading === 'commit' ? <LoadingSpinner/> : 'Commit Changes'}
                            </button>
                        </div>
                     )}
                </main>
            </div>
        </div>
    );
};
