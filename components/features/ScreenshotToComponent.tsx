/**
 * @file ScreenshotToComponent.tsx
 * @summary This micro-frontend component allows users to upload or paste a screenshot of a UI element and receive AI-generated React/Tailwind code.
 * @description This component implements a complete user flow for visual-to-code generation. It leverages a dedicated web worker for all heavy processing, including image-to-Base64 conversion and streaming communication with the Backend-for-Frontend (BFF) via GraphQL. This ensures the main UI thread remains responsive. It utilizes the proprietary UI framework for all visual elements.
 * @owner Elite AI Implementation Team
 * @date 2024-07-20
 * @version 2.0.0
 */

import React, { useReducer, useCallback, useEffect } from 'react';

// Proprietary UI Framework Imports (conceptual)
import { Panel } from '../../ui_framework/Panel';
import { Layout } from '../../ui_framework/Layout';
import { Typography } from '../../ui_framework/Typography';
import { Button } from '../../ui_framework/Button';
import { Icon } from '../../ui_framework/Icon';
import { FileUploadZone } from '../../ui_framework/FileUploadZone';
import { CodeViewer } from '../../ui_framework/CodeViewer';
import { LoadingState } from '../../ui_framework/LoadingState';
import { PhotoIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '../icons';

// Service Layer & Hooks for new architecture
import { useWorkerPool } from '../../hooks/useWorkerPool'; // Assumes a hook for worker interaction
import { useNotification } from '../../contexts/NotificationContext';
import { downloadFile } from '../../services/fileUtils';

/**
 * @typedef {'idle' | 'processingImage' | 'streamingCode' | 'success' | 'error'}
 * @description Represents the possible states of the component's state machine.
 */
type ComponentState = 'idle' | 'processingImage' | 'streamingCode' | 'success' | 'error';

/**
 * @interface State
 * @description Defines the shape of the component's state, managed by a reducer.
 */
interface State {
  status: ComponentState;
  previewImage: string | null;
  generatedCode: string;
  error: string | null;
}

/**
 * @typedef Action
 * @description Defines the actions that can be dispatched to update the component's state.
 */
type Action = 
  | { type: 'START_PROCESSING'; payload: { previewImage: string } }
  | { type: 'STREAM_CHUNK'; payload: string }
  | { type: 'STREAM_COMPLETE' }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: State = {
  status: 'idle',
  previewImage: null,
  generatedCode: '',
  error: null,
};

/**
 * Reducer function for managing the component's state machine.
 * @param {State} state - The current state.
 * @param {Action} action - The dispatched action.
 * @returns {State} The new state.
 */
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_PROCESSING':
      return { ...initialState, status: 'processingImage', previewImage: action.payload.previewImage };
    case 'STREAM_CHUNK':
      return { ...state, status: 'streamingCode', generatedCode: state.generatedCode + action.payload };
    case 'STREAM_COMPLETE':
      return { ...state, status: 'success' };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

/**
 * @summary A micro-frontend for converting UI screenshots into React/Tailwind code.
 * @description This component provides a user interface for uploading or pasting an image. The image processing and AI code generation are offloaded to a dedicated web worker to maintain UI responsiveness. The generated code is streamed back and displayed in a code viewer.
 * @performance All intensive tasks (image conversion, API communication) are handled by a web worker, preventing any blocking of the main thread. This ensures a smooth and responsive user experience even during heavy processing.
 * @security Image data is sent directly to the secure BFF via the web worker. The client does not store the image long-term. The BFF handles all interactions with the AI service, ensuring no sensitive keys are exposed on the client-side.
 * @example
 * <ScreenshotToComponent />
 */
export const ScreenshotToComponent: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { addNotification } = useNotification();
  const worker = useWorkerPool('aiTasks'); // Get a worker from the 'aiTasks' pool

  useEffect(() => {
    if (!worker) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload, error } = event.data;
      switch (type) {
        case 'COMPONENT_STREAM_CHUNK':
          dispatch({ type: 'STREAM_CHUNK', payload });
          break;
        case 'COMPONENT_STREAM_END':
          dispatch({ type: 'STREAM_COMPLETE' });
          addNotification('Code generation complete!', 'success');
          break;
        case 'COMPONENT_GENERATION_ERROR':
          dispatch({ type: 'ERROR', payload: error });
          addNotification('Code generation failed.', 'error');
          break;
      }
    };

    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [worker, addNotification]);

  /**
   * @function handleImageProcess
   * @description Processes an image file, generates a preview, and dispatches the task to a web worker.
   * @param {File} file The image file to process.
   * @security The File object is transferred to the worker, minimizing main-thread memory impact.
   * @performance The use of `createObjectURL` is efficient for creating temporary image previews.
   */
  const handleImageProcess = useCallback((file: File) => {
    if (!worker) {
      dispatch({ type: 'ERROR', payload: 'Worker service is not available.' });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    dispatch({ type: 'START_PROCESSING', payload: { previewImage: previewUrl } });

    // The worker handles Base64 conversion and BFF communication
    worker.postMessage({ 
      type: 'GENERATE_COMPONENT_FROM_IMAGE', 
      payload: { file } 
    });

  }, [worker]);

  const handleDownload = useCallback(() => {
    if (state.generatedCode) {
      downloadFile(state.generatedCode, 'Component.tsx', 'text/typescript');
      addNotification('Component code downloaded.', 'info');
    }
  }, [state.generatedCode, addNotification]);
  
  const handleCopy = useCallback(() => {
    if (state.generatedCode) {
      navigator.clipboard.writeText(state.generatedCode);
      addNotification('Code copied to clipboard!', 'success');
    }
  }, [state.generatedCode, addNotification]);

  return (
    <Panel className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
      <Panel.Header>
        <Icon as={PhotoIcon} />
        <Typography.Title>AI Screenshot-to-Component</Typography.Title>
        <Typography.Text subtle>Paste or upload a UI screenshot to generate React/Tailwind code.</Typography.Text>
      </Panel.Header>
      <Panel.Body as={Layout.Grid} columns={2} gap="large" className="flex-grow min-h-0">
        <Layout.Column className="flex flex-col">
          <FileUploadZone
            onFileDrop={handleImageProcess}
            onPaste={handleImageProcess}
            disabled={state.status !== 'idle' && state.status !== 'success'}
            className="flex-grow"
          >
            {state.previewImage ? (
              <img src={state.previewImage} alt="UI Screenshot Preview" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
            ) : (
              <div className="text-center text-text-secondary">
                <Typography.Header level={2}>Paste an image here</Typography.Header>
                <Typography.Text subtle>(Cmd/Ctrl + V) or click to upload</Typography.Text>
              </div>
            )}
          </FileUploadZone>
        </Layout.Column>

        <Layout.Column className="flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2">
            <Typography.Text as="label" className="font-medium">Generated Code</Typography.Text>
            {state.generatedCode && state.status === 'success' && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="small" onClick={handleCopy} icon={<Icon as={ClipboardDocumentIcon} />}>Copy</Button>
                <Button variant="secondary" size="small" icon={<Icon as={ArrowDownTrayIcon} />} onClick={handleDownload}>Download</Button>
              </div>
            )}
          </div>
          <div className="flex-grow border border-border rounded-md overflow-hidden bg-background">
            {(state.status === 'processingImage' || state.status === 'streamingCode') && !state.error && (
              <LoadingState message={state.status === 'processingImage' ? 'Processing image...' : 'Generating code...'} />
            )}
            {state.status === 'error' && (
              <Panel.ErrorState title="Generation Failed" message={state.error || 'An unknown error occurred.'} />
            )}
            {state.generatedCode && (
              <CodeViewer code={state.generatedCode} language="tsx" />
            )}
            {state.status === 'idle' && (
              <Panel.EmptyState message="Generated component code will appear here." />
            )}
          </div>
        </Layout.Column>
      </Panel.Body>
      {(state.status === 'success' || state.status === 'error') && (
        <Panel.Footer>
            <Button onClick={() => dispatch({ type: 'RESET' })} variant="primary" fullWidth>Start New Generation</Button>
        </Panel.Footer>
      )}
    </Panel>
  );
};
