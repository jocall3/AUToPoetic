/**
 * @file AiCommandCenter.tsx
 * @summary This file implements the main AI command interface for the application.
 * @description The AiCommandCenter serves as the primary user interface for interacting with the AI orchestration layer.
 * It provides a simple text input for users to issue natural language commands. All AI processing is offloaded
 * to a dedicated web worker, which communicates with the Backend-for-Frontend (BFF) to get an executable command
 * or a text response. This component then executes client-side actions (like navigation) or displays the AI's response.
 * @security This component is a thin presentation layer and does not handle sensitive data or API keys. All interactions are proxied through an authenticated BFF.
 * @performance Offloads all AI interaction logic to a web worker to keep the main thread responsive. Network latency to the BFF is the primary performance factor.
 * @example
 * <AiCommandCenter />
 */

import React, { useState, useCallback } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';
import { CommandLineIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';
import { executeWorkspaceAction } from '../../services/workspaceConnectorService.ts';

// MOCK IMPLEMENTATION: In a real scenario, this would be a singleton instance
// provided via a Dependency Injection container.
import { workerPoolManager } from '../../services/workerPoolManager.ts';

/**
 * @interface CommandResponse
 * @description Defines the structure of the response received from the AI command processing layer (BFF via worker).
 * @property {string | null} text - A text response from the AI if no specific function is to be called.
 * @property {Array<{ name: string; args: any; }> | null} functionCalls - An array of functions the client should execute.
 */
interface CommandResponse {
  text: string | null;
  functionCalls: { name: string; args: any; }[] | null;
}

/**
 * @interface ExamplePromptButtonProps
 * @description Props for the ExamplePromptButton sub-component.
 * @property {string} text - The text of the example prompt.
 * @property {(text: string) => void} onClick - The callback function to execute when the button is clicked.
 */
interface ExamplePromptButtonProps {
  text: string;
  onClick: (text: string) => void;
}

/**
 * A simple button component to display and trigger example prompts.
 * @param {ExamplePromptButtonProps} props - The component props.
 * @returns {React.ReactElement} The rendered button.
 */
const ExamplePromptButton: React.FC<ExamplePromptButtonProps> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="px-3 py-1.5 bg-surface border border-border rounded-full text-xs hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
        {text}
    </button>
);

/**
 * @component AiCommandCenter
 * @description The main command and control interface for the application.
 * It allows users to issue natural language commands to the AI backend.
 * @returns {React.ReactElement} The rendered AiCommandCenter component.
 */
export const AiCommandCenter: React.FC = () => {
    const { dispatch } = useGlobalState();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState('');

    /**
     * @function handleCommand
     * @description Sends the user's prompt to the AI backend via a web worker and processes the returned command.
     * @returns {Promise<void>}
     * @security User input is sent to a backend service for processing. The backend should sanitize all inputs.
     * @performance The primary logic is executed in a web worker to avoid blocking the main thread.
     */
    const handleCommand = useCallback(async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        setLastResponse('');

        try {
            // Offload AI interaction to a web worker
            const response = await workerPoolManager.enqueueTask<CommandResponse>('process-ai-command', { prompt });

            if (response.functionCalls && response.functionCalls.length > 0) {
                const call = response.functionCalls[0];
                const { name, args } = call;

                setLastResponse(`Understood! Executing command: ${name}`);

                switch (name) {
                    case 'navigateTo':
                        dispatch({ type: 'SET_VIEW', payload: { view: args.featureId } });
                        break;
                    case 'runFeatureWithInput':
                        dispatch({ type: 'SET_VIEW', payload: { view: args.featureId, props: args.props } });
                        break;
                    case 'runWorkspaceAction':
                        try {
                            const result = await executeWorkspaceAction(args.actionId, args.params);
                            setLastResponse(`Action '${args.actionId}' executed successfully.\n\nResult: \`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``);
                        } catch (e) {
                            const errorMessage = e instanceof Error ? e.message : 'Unknown error during workspace action';
                            setLastResponse(`Action failed: ${errorMessage}`);
                            console.error('Workspace action execution failed:', e);
                        }
                        break;
                    default:
                        setLastResponse(`Unknown command received from backend: ${name}`);
                }
                setPrompt('');
            } else if(response.text) {
                setLastResponse(response.text);
            } else {
                setLastResponse("I'm not sure how to respond to that. Please try a different command.");
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            console.error("Error in handleCommand:", err);
            setLastResponse(`Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, dispatch]);

    /**
     * @function handleKeyDown
     * @description Handles keyboard events on the textarea, specifically submitting on Enter.
     * @param {React.KeyboardEvent} e - The keyboard event.
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCommand();
        }
    };

    /**
     * @function handleExampleClick
     * @description Sets the prompt state when an example button is clicked.
     * @param {string} text - The example prompt text.
     */
    const handleExampleClick = (text: string) => {
        setPrompt(text);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center">
                    <CommandLineIcon />
                    <span className="ml-3">AI Command Center</span>
                </h1>
                <p className="mt-2 text-lg text-text-secondary">What would you like to do?</p>
            </header>

            <div className="flex-grow flex flex-col justify-end max-w-3xl w-full mx-auto">
                {lastResponse && (
                    <div className="mb-4 p-4 bg-surface rounded-lg text-text-primary border border-border">
                        <p className="whitespace-pre-wrap"><strong>AI:</strong> {lastResponse}</p>
                    </div>
                )}
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        placeholder='Try "explain this code: const a = 1;" or "open the theme designer"'
                        className="w-full p-4 pr-28 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary focus:outline-none resize-none shadow-sm"
                        rows={2}
                    />
                    <button
                        onClick={handleCommand}
                        disabled={isLoading}
                        className="btn-primary absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 min-w-[70px] flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Send'}
                    </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    <ExamplePromptButton text="Open Theme Designer" onClick={handleExampleClick} />
                    <ExamplePromptButton text="Generate a commit for a bug fix" onClick={handleExampleClick} />
                    <ExamplePromptButton text="Create a regex for email validation" onClick={handleExampleClick} />
                </div>
                <p className="text-xs text-text-secondary text-center mt-2">Press Enter to send, Shift+Enter for new line.</p>
            </div>
        </div>
    );
};
