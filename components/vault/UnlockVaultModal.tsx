import React, { useState } from 'react';

// Using local icons as modifying another file is out of scope for this task.
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8.25 9.75A2.25 2.25 0 0 1 10.5 7.5h3.75a2.25 2.25 0 0 1 2.25 2.25v4.5a2.25 2.25 0 0 1-2.25 2.25h-3.75a2.25 2.25 0 0 1-2.25-2.25v-4.5Z" /></svg>;

interface UnlockVaultModalProps {
  // This modal will be controlled by a context provider (e.g., a global AppProvider)
  // which will manage its visibility and handle the onSave action.
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

/**
 * @fileoverview Modal component to prompt the user for their Gemini API key.
 * This is part of a simplified authentication/configuration flow where the user provides their own key,
 * removing the need for a master password system.
 * The name "UnlockVaultModal" is retained from the original file path, but its function is re-interpreted
 * as "unlocking" AI features by providing the necessary key.
 *
 * @module components/vault/UnlockVaultModal
 * @security The entered API key is passed to a handler and should be stored securely (e.g., in localStorage for simplicity,
 *           but a server-side session or encrypted storage is recommended for production).
 *           This component itself does not store the key.
 * @performance This is a standard React modal component with minimal performance overhead.
 */
export const UnlockVaultModal: React.FC<UnlockVaultModalProps> = ({ onClose, onKeySaved }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSave = () => {
        if (apiKey.trim()) {
            onKeySaved(apiKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center animate-pop-in" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <SparklesIcon />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">Set Gemini API Key</h2>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                    To use the AI-powered features in this application, you need to provide your own Google Gemini API key.
                    You can get a free key from Google AI Studio. The key will be stored in your browser's local storage.
                </p>
                <div className="relative flex items-center">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none">
                        <KeyIcon />
                    </div>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key..."
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                        aria-label="Gemini API Key"
                    />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-surface border border-border text-text-primary font-semibold rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!apiKey.trim()}
                        className="btn-primary px-6 py-2 disabled:opacity-50"
                    >
                        Save and Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
