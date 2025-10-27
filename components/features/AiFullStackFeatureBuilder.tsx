/**
 * @file AiFullStackFeatureBuilder.tsx
 * @description This file contains the AiFullStackFeatureBuilder component, a tool that allows users to generate
 * a complete full-stack feature (frontend component, backend function, database rules) from a single natural language prompt.
 * This component has been refactored to align with the new micro-frontend and microservice architecture.
 * All heavy-lifting, including AI interaction and file zipping, is now offloaded to a backend service,
 * making this component a thin, presentation-focused client.
 * @module AiFullStackFeatureBuilder
 * @see {@link fullStackFeatureService} for the backend interaction logic.
 * @performance The primary performance consideration is the network latency of the GraphQL mutation to the BFF. All computationally intensive tasks are handled server-side.
 * @security This component interacts with a BFF via an authenticated GraphQL client. The client is responsible for handling JWTs, and no sensitive keys are managed here. Prompts are user-generated and should be sanitized on the backend.
 */

import React, { useState, useCallback } from 'react';
import type { GeneratedFile } from '../../types.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { ServerStackIcon, SparklesIcon, DocumentTextIcon, ArrowDownTrayIcon } from '../icons.tsx';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index.tsx';

// --- MOCK DATA & SERVICE ---
// In a real application, this service would be imported from a dedicated business layer service file.
// It simulates a GraphQL call to a Backend-for-Frontend (BFF) which orchestrates the AI generation and zipping.

const MOCK_FILES: GeneratedFile[] = [
  {
    filePath: 'GuestbookComponent.tsx',
    content: `import React, { useState, useEffect } from 'react';\n\n// MOCK GENERATED COMPONENT\n\nconst Guestbook = () => {\n  const [messages, setMessages] = useState([]);\n  const [newMessage, setNewMessage] = useState('');\n\n  // Fetch messages from backend...\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    // Call backend to add new message\n    setNewMessage('');\n  };\n\n  return (\n    <div className="p-4">\n      <h2 className="text-xl font-bold mb-4">Guestbook</h2>\n      {/* Form and message list rendering */}\n    </div>\n  );\n};\n\nexport default Guestbook;`,
    description: 'The main React component for the guestbook feature.'
  },
  {
    filePath: 'functions/index.js',
    content: `const functions = require('firebase-functions');\nconst admin = require('firebase-admin');\n\nadmin.initializeApp();\n\n// MOCK GENERATED CLOUD FUNCTION\n\nexports.addMessage = functions.https.onRequest(async (req, res) => {\n  // Logic to add message to Firestore\n  res.json({result: 'Message added.'});\n});\n\nexports.getMessages = functions.https.onRequest(async (req, res) => {\n  // Logic to get messages from Firestore\n  res.json({messages: []});\n});`,
    description: 'The backend Google Cloud Function to handle message submissions.'
  },
  {
    filePath: 'functions/package.json',
    content: `{\n  "name": "functions",\n  "description": "Cloud Functions for Firebase",\n  "dependencies": {\n    "firebase-admin": "^11.0.0",\n    "firebase-functions": "^4.0.0"\n  },\n  "private": true\n}`,
    description: 'The package.json for the backend Cloud Function.'
  },
  {
    filePath: 'firestore.rules',
    content: `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /guestbook/{messageId} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n  }\n}`,
    description: 'Security rules for the Firestore database.'
  }
];

/**
 * @typedef {Object} GenerationResult
 * @property {GeneratedFile[]} files - The array of generated source code files.
 * @property {string} zipFileUrl - A URL to download a zip archive of the generated files.
 */

/**
 * @service fullStackFeatureService
 * @description A mock service that simulates interaction with the Backend-for-Frontend (BFF) to generate a full-stack feature.
 * In a real application, this would use a GraphQL client to send mutations.
 */
const fullStackFeatureService = {
  /**
   * @function generateFeatureAndZip
   * @description Sends a prompt to the BFF to generate feature files and a corresponding zip archive.
   * @param {string} prompt - The natural language description of the feature.
   * @param {string} framework - The frontend framework (e.g., 'React').
   * @param {string} styling - The styling library (e.g., 'Tailwind CSS').
   * @returns {Promise<GenerationResult>} A promise that resolves with the generated files and a zip download URL.
   * @example const { files, zipFileUrl } = await fullStackFeatureService.generateFeatureAndZip('a blog comment section', 'React', 'Tailwind CSS');
   */
  async generateFeatureAndZip(prompt: string, framework: string, styling: string): Promise<{ files: GeneratedFile[], zipFileUrl: string }> {
    // Simulate network delay and GraphQL mutation processing.
    await new Promise(resolve => setTimeout(resolve, 2500));

    if (prompt.toLowerCase().includes('error')) {
      throw new Error('BFF Error: The AI model failed to generate the feature due to an invalid prompt.');
    }

    // In a real implementation, the backend would generate and host the zip file.
    // Here, we simulate it by creating a blob URL on the client.
    const zipBlob = new Blob(["Mock zip content for the generated feature."], { type: 'application/zip' });
    const zipFileUrl = URL.createObjectURL(zipBlob);
    
    return { files: MOCK_FILES, zipFileUrl };
  }
};

/**
 * @typedef {'idle' | 'loading' | 'success' | 'error'} GenerationState
 * @description Represents the different states of the feature generation process.
 */

/**
 * @component AiFullStackFeatureBuilder
 * @description A UI component that allows users to generate a full-stack feature from a text prompt.
 * It interacts with a backend service to handle the generation and provides a UI to view and download the resulting files.
 * @returns {React.ReactElement}
 */
export const AiFullStackFeatureBuilder: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A simple guestbook where users can submit messages and see a list of them.');
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
    const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null);
    const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
    const [generationState, setGenerationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const { addNotification } = useNotification();

    /**
     * @function handleGenerate
     * @description A callback function that triggers the feature generation process by calling the backend service.
     * It manages the component's loading and error states.
     * @performance This function is asynchronous and will not block the UI thread.
     * @returns {Promise<void>}
     */
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setErrorMessage('Please enter a feature description.');
            setGenerationState('error');
            return;
        }
        setGenerationState('loading');
        setErrorMessage('');
        setGeneratedFiles([]);
        setActiveFile(null);
        setZipDownloadUrl(null);

        try {
            const { files, zipFileUrl } = await fullStackFeatureService.generateFeatureAndZip(prompt, 'React', 'Tailwind CSS');
            
            setGeneratedFiles(files);
            setZipDownloadUrl(zipFileUrl);
            setGenerationState('success');

            if (files.length > 0) {
                const componentFile = files.find(f => f.filePath.endsWith('.tsx'));
                setActiveFile(componentFile || files[0]);
            }
            addNotification('Full-stack feature generated!', 'success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate feature.';
            setErrorMessage(message);
            setGenerationState('error');
            addNotification(message, 'error');
        } 
    }, [prompt, addNotification]);
    
    /**
     * @function handleDownloadZip
     * @description Triggers the download of the generated zip file using the URL provided by the backend.
     * @returns {void}
     */
    const handleDownloadZip = () => {
        if (!zipDownloadUrl) return;
        const link = document.createElement('a');
        link.href = zipDownloadUrl;
        link.download = 'full-stack-feature.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // The blob URL is not revoked here to allow multiple downloads, but in a production app with single-use URLs, it should be.
    };

    /**
     * @function renderContent
     * @description Renders the content of the currently active file tab with syntax highlighting.
     * @returns {React.ReactElement}
     */
    const renderContent = () => {
        if (!activeFile) return <div className="p-4 text-text-secondary">Select a file to view its content.</div>;
        const language = activeFile.filePath.split('.').pop() || 'tsx';
        return <MarkdownRenderer content={'```' + language + '\n' + activeFile.content + '\n```'} />;
    }

    const isLoading = generationState === 'loading';

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center"><ServerStackIcon /><span className="ml-3">AI Full-Stack Builder</span></h1>
                <p className="text-text-secondary mt-1">Generate a frontend component, backend cloud function, and database rules from a single prompt.</p>
            </header>
            <div className="flex-grow flex flex-col gap-4 min-h-0">
                <div className="flex flex-col">
                    <label htmlFor="feature-prompt" className="text-sm font-medium text-text-secondary mb-2">Describe your feature</label>
                    <textarea
                        id="feature-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A user profile card with an avatar, name, and bio."
                        className="p-4 bg-surface border border-border rounded-md resize-y font-mono text-sm h-24"
                    />
                </div>
                <div className="flex-shrink-0 flex gap-4">
                    <button onClick={handleGenerate} disabled={isLoading} className="btn-primary flex-grow flex items-center justify-center px-6 py-3">
                        {isLoading ? <LoadingSpinner /> : <><SparklesIcon />Generate Full Stack Feature</>}
                    </button>
                    {zipDownloadUrl && 
                        <button onClick={handleDownloadZip} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center px-6 py-3">
                            <ArrowDownTrayIcon /> Download ZIP
                        </button>
                    }
                </div>
                {generationState === 'error' && <p className="text-red-500 text-xs mt-1 text-center">{errorMessage}</p>}
                
                <div className="flex flex-col flex-grow min-h-0 mt-4">
                    <div className="flex-shrink-0 flex border-b border-border bg-surface rounded-t-lg overflow-x-auto">
                        {generatedFiles.map(file => (
                            <button key={file.filePath} onClick={() => setActiveFile(file)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm ${
                                activeFile?.filePath === file.filePath 
                                ? 'bg-background border-b-2 border-primary text-text-primary' 
                                : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                <DocumentTextIcon /> {file.filePath}
                            </button>
                        ))}
                    </div>
                    <div className="flex-grow bg-background border border-t-0 border-border rounded-b-lg overflow-auto">
                        {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner/></div>}
                        {!isLoading && generatedFiles.length === 0 && <div className="text-text-secondary h-full flex items-center justify-center p-8 text-center">Generated files will appear here after a successful generation.</div>}
                        {generatedFiles.length > 0 && renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
