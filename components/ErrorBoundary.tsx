/**
 * @file This module provides a comprehensive ErrorBoundary component for the application.
 * It catches JavaScript errors anywhere in its child component tree, logs those errors,
 * and displays a fallback UI with recovery options, including AI-powered debugging assistance.
 *
 * @module components/ErrorBoundary
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import React from 'react';
import { logError } from '../services/telemetryService.ts';
import { debugErrorStream } from '../services/aiService.ts';
import { SparklesIcon } from './icons.tsx';
import { MarkdownRenderer, LoadingSpinner } from './shared/index.tsx';

/**
 * @interface Props
 * @description The properties for the ErrorBoundary component.
 * @property {React.ReactNode} children - The child components that this boundary will protect.
 */
interface Props {
  children: React.ReactNode;
}

/**
 * @interface State
 * @description The internal state of the ErrorBoundary component.
 * @property {boolean} hasError - A flag that becomes true when an error is caught.
 * @property {Error | null} error - The caught error object. Null if no error has occurred.
 * @property {string} aiHelp - The AI-generated debugging assistance string, formatted as Markdown.
 * @property {boolean} isAiLoading - A flag indicating if the AI assistant is currently processing a request.
 */
interface State {
  hasError: boolean;
  error: Error | null;
  aiHelp: string;
  isAiLoading: boolean;
}

/**
 * @class ErrorBoundary
 * @description A React component that catches JavaScript errors in its child component tree,
 * logs them, and displays a user-friendly fallback UI with recovery and debugging options.
 *
 * This component is crucial for application stability, preventing a UI crash in one part of the
 * application from bringing down the entire user experience. It integrates with telemetry for
 * error logging and an AI service for providing debugging suggestions directly to the user.
 *
 * @example
 * ```tsx
 * import { ErrorBoundary } from './components/ErrorBoundary';
 * import { MyRiskyComponent } from './components/MyRiskyComponent';
 *
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <MyRiskyComponent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export class ErrorBoundary extends React.Component<Props, State> {
  /**
   * @constructor
   * @param {Props} props - The component's properties.
   */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, aiHelp: '', isAiLoading: false };
  }

  /**
   * A lifecycle method that is invoked after an error has been thrown by a descendant component.
   * It receives the error that was thrown and should return a value to update state.
   *
   * @param {Error} error - The error that was thrown.
   * @returns {Partial<State>} An object representing the state update.
   * @security This is a pure function and is the safe, recommended way to update state from an error
   *           without causing side effects during the render phase.
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  /**
   * A lifecycle method that is invoked after an error has been thrown by a descendant component.
   * It is used for side effects like logging the error to a telemetry service.
   *
   * @param {Error} error - The error that was thrown.
   * @param {React.ErrorInfo} errorInfo - An object with a `componentStack` key containing information
   *                                      about which component threw the error.
   * @see services/telemetryService.ts
   * @security The `error` and `errorInfo` objects may contain sensitive information from the application's
   *           state or code. Ensure that the telemetry service sanitizes data appropriately before sending
   *           it to external logging platforms.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, { componentStack: errorInfo.componentStack });
  }
  
  /**
   * Handles the "Reload Application" action from the user.
   * It forces a full page reload, which can resolve transient errors or issues related
   * to stale client-side code after a new deployment.
   * @performance A full page reload is a heavy operation that resets all application state
   *              and requires all resources to be fetched and parsed again. It should be
   *              used as a last-resort recovery mechanism.
   */
  handleRevert = () => {
    window.location.reload();
  };

  /**
   * Initiates a request to the AI service to get debugging help for the caught error.
   * It streams the AI's response and updates the state to display it in real-time.
   *
   * @returns {Promise<void>} A promise that resolves when the AI stream is complete.
   * @see services/aiService.ts#debugErrorStream
   * @security This function sends the error message and stack trace to an external AI service.
   *           This could potentially expose sensitive information. The AI service endpoint and
   *           data handling policies must be secure and compliant with privacy standards.
   * @performance The perceived performance depends on the network latency and the processing time
   *              of the AI service. The use of streaming provides a better user experience by
   *              displaying results as they become available.
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
   * Renders the component. If an error has been caught, it displays the fallback UI.
   * Otherwise, it renders the child components as normal.
   *
   * @returns {React.ReactNode} The child components or the error fallback UI.
   */
  render() {
    if (this.state.hasError) {
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
                        {this.state.isAiLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
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
