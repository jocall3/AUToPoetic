import React, { useState, useEffect, useCallback } from 'react';
import { CpuChipIcon, SparklesIcon } from './icons.tsx';
import { signInWithGoogle } from '../services/googleAuthService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotification } from '../contexts/NotificationContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.533,44,29.898,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export const LoginView: React.FC = () => {
  const [geminiApiKey, setGeminiApiKey] = useLocalStorage<string>('gemini_api_key', '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const { addNotification } = useNotification();

  useEffect(() => {
    if (geminiApiKey) {
      setApiKeyInput(geminiApiKey);
    }
  }, [geminiApiKey]);

  const handleSaveKey = useCallback(() => {
    if (apiKeyInput.trim()) {
      setGeminiApiKey(apiKeyInput.trim());
      addNotification('Gemini API Key saved!', 'success');
    } else {
      addNotification('API Key cannot be empty.', 'error');
    }
  }, [apiKeyInput, setGeminiApiKey, addNotification]);

  const handleLogin = () => {
    if (!geminiApiKey) {
        addNotification('FYI: AI features will be disabled without a Gemini API Key.', 'info');
    }
    signInWithGoogle();
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-text-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
            <div className="inline-block">
                <div className="flex items-center justify-center text-primary">
                    <CpuChipIcon className="w-16 h-16" />
                    <SparklesIcon className="w-10 h-10 -ml-4 -mt-4 text-amber-400" />
                </div>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
                DevCore AI Toolkit
            </h1>
            <p className="mt-4 text-lg text-text-secondary">
                Your AI-powered development environment.
            </p>
        </div>

        <div className="mt-10 space-y-6 text-left">
            <div>
                <label htmlFor="gemini-api-key" className="block text-sm font-medium text-text-primary">
                    Gemini API Key
                </label>
                <div className="mt-1 flex items-center gap-2">
                    <input
                        id="gemini-api-key"
                        type="password"
                        autoComplete="current-password" // prevent browser autofill
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="block w-full rounded-md border-border bg-surface px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                        placeholder="Enter your Google AI Studio API key"
                    />
                    <button
                        type="button"
                        onClick={handleSaveKey}
                        className="rounded-md bg-primary/20 px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    >
                        Save
                    </button>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                    An API key is required to use the AI-powered features. Get one from Google AI Studio.
                </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-text-secondary">Then</span>
              </div>
            </div>

            <div>
                <button
                    onClick={handleLogin}
                    className="flex w-full items-center justify-center rounded-lg border border-border bg-surface px-8 py-3 text-lg font-semibold text-text-primary shadow-sm transition-transform duration-200 hover:scale-105 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                    <GoogleIcon />
                    Sign in with Google
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
