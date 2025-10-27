import React from 'react';
import { logError } from './services/telemetryService.ts';
import { debugErrorStream } from './services/aiService.ts';
import { SparklesIcon } from './components/icons.tsx';
import { MarkdownRenderer, LoadingSpinner } from './components/shared/index.tsx';

/**
 * @interface Props
 * @description Props for the ErrorBoundary component.
 * @property {React.ReactNode} children - The child components that this boundary will protect.
 */
interface Props {
  children: React.ReactNode;
}

/**
 * @interface State
 * @description State for the ErrorBoundary component.
 * @property {boolean} hasError - True if an error has been caught.
 * @property {Error | null} error - The caught error object.
 * @property {string} aiHelp - The streamed response from the AI assistant.
 * @property {boolean} isAiLoading - True while the AI assistant is generating a response.
 */
interface State {
  hasError: boolean;
  error: Error | null;
  aiHelp: string;
  isAiLoading: boolean;
}

/**
 * @class ErrorBoundary
 * @description A React component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * It also includes an AI-powered assistant to help debug the error.
 * @extends React.Component<Props, State>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  /**
   * Creates an instance of ErrorBoundary.
   * @param {Props} props - The props for the component.
   */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, aiHelp: '', isAiLoading: false };
  }

  /**
   * A lifecycle method that is invoked after an error has been thrown by a descendant component.
   * It receives the error that was thrown as a parameter and should return a value to update state.
   * @param {Error} error - The error that was thrown.
   * @returns {Partial<State>} An object to update the state.
   * @static
   * @see https://reactjs.org/docs/react-component.html#static-getderivedstatefromerror
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  /**
   * A lifecycle method that is invoked after an error has been thrown by a descendant component.
   * It receives two parameters: the error and an errorInfo object with a componentStack key.
   * This is a good place for logging errors to a telemetry service.
   * @param {Error} error - The error that was thrown.
   * @param {React.ErrorInfo} errorInfo - An object with a componentStack key containing information about which component threw the error.
   * @see https://reactjs.org/docs/react-component.html#componentdidcatch
   * @performance This lifecycle method runs during the commit phase, so side-effects are permitted. It is a good place for logging.
   * @security The error and errorInfo objects should be sanitized if sent to a third-party logging service to avoid exposing sensitive information.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to our telemetry service
    logError(error, { componentStack: errorInfo.componentStack });
  }
  
  /**
   * Handles the action to reload the application, providing a simple recovery mechanism.
   * @example
   * <button onClick={this.handleRevert}>Reload</button>
   */
  handleRevert = () => {
    window.location.reload();
  };

  /**
   * Initiates a request to the AI service to get help debugging the caught error.
   * It streams the response and updates the component's state.
   * @returns {Promise<void>}
   * @async
   */
  handleAskAi = async () => {
    if (!this.state.error) return;

    this.setState({ isAiLoading: true, aiHelp: '' });
    try {
        const stream = debugErrorStream(this.state.error);
        let fullResponse = '';
        for await (const chunk of stream) {
            fullResponse += chunk;
            this.setState({ aiHelp: fullResponse });
        }
    } catch (e) {
        this.setState({ aiHelp: 'Sorry, the AI assistant could not be reached.' });
        logError(e as Error, { context: 'AI Error Debugging' });
    } finally {
        this.setState({ isAiLoading: false });
    }
  };

  /**
   * Renders the component. If an error has been caught, it displays a fallback UI.
   * Otherwise, it renders the child components as normal.
   * @returns {React.ReactNode} The rendered component tree or fallback UI.
   */
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-background text-text-primary">
            <div className="w-full max-w-4xl bg-surface border border-border rounded-lg p-6 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">An Unexpected Error Occurred</h1>
                    <p className="text-text-secondary mb-4">A component has crashed. You can try reloading or ask the AI for debugging help.</p>
                    
                    <details className="text-left bg-gray-50 dark:bg-slate-900 p-2 rounded-md max-w-xl text-xs font-mono mb-4 flex-grow overflow-auto border border-border">
                        <summary className="cursor-pointer">Error Details</summary>
                        <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.stack}</pre>
                    </details>
                    
                    <div className="flex gap-4 mt-auto">
                        <button
                            onClick={this.handleRevert}
                            className="flex-1 px-4 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-md hover:bg-yellow-300 transition-colors"
                        >
                            Reload Application
                        </button>
                         <button
                            onClick={this.handleAskAi}
                            disabled={this.state.isAiLoading}
                            className="btn-primary flex-1 px-4 py-2 flex items-center justify-center gap-2"
                        >
                            <SparklesIcon />
                            {this.state.isAiLoading ? 'Analyzing...' : 'Ask AI for Help'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-border">
                    <h2 className="text-lg font-bold text-text-primary mb-2">AI Assistant</h2>
                    <div className="flex-grow overflow-y-auto">
                        {this.state.isAiLoading && !this.state.aiHelp && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                        {this.state.aiHelp && <MarkdownRenderer content={this.state.aiHelp} />}
                        {!this.state.isAiLoading && !this.state.aiHelp && <p className="text-text-secondary text-center pt-10">Click "Ask AI" to get debugging suggestions.</p>}
                    </div>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
