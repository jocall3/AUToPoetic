/**
 * @fileoverview This file contains the AudioToCode feature component, which allows
 * users to record audio and have it transcribed into code using an AI service.
 * @module components/features/AudioToCode
 * @see BffGraphQLClient
 * @see WorkerPoolManager
 * @see AudioRecordingService
 */

import React, { useState, useCallback, useEffect } from 'react';
// Assume these are from a new Core UI library
import { Button } from '../../ui/core/Button';
import { Card } from '../../ui/core/Card';
import { Typography } from '../../ui/core/Typography';
import { Layout } from '../../ui/composite/Layout';
// Assume these are custom hooks providing access to dependency-injected services
import { useService } from '../../hooks/useService'; 
// Assume these are interfaces for the new services
import type { AudioRecordingService } from '../../services/business/AudioRecordingService';
import type { WorkerPoolManager } from '../../services/infrastructure/WorkerPoolManager';
import type { BffGraphQLClient } from '../../services/infrastructure/BffGraphQLClient';
// Standard shared components
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
// Icons
import { MicrophoneIcon, StopIcon } from '../icons';

/**
 * @typedef {'idle' | 'recording' | 'transcribing' | 'success' | 'error'} TranscriptionStatus
 * Represents the various states of the audio-to-code process.
 */
type TranscriptionStatus = 'idle' | 'recording' | 'transcribing' | 'success' | 'error';

/**
 * @interface AudioToCodeState
 * Defines the state structure managed by the useAudioToCode hook.
 * @property {TranscriptionStatus} status - The current status of the transcription process.
 * @property {string} generatedCode - The resulting code from transcription.
 * @property {string | null} error - Any error message from the process.
 */
interface AudioToCodeState {
  status: TranscriptionStatus;
  generatedCode: string;
  error: string | null;
}

/**
 * @interface AudioToCodeActions
 * Defines the actions exposed by the useAudioToCode hook to interact with the component's logic.
 * @property {() => void} toggleRecording - Starts or stops the audio recording.
 */
interface AudioToCodeActions {
  toggleRecording: () => void;
}

/**
 * @hook useAudioToCode
 * @description A custom hook that encapsulates all business logic for the AudioToCode feature.
 * It manages recording state, offloads processing to a web worker, and communicates with the backend.
 * @returns {{ state: AudioToCodeState, actions: AudioToCodeActions }} An object containing the component's state and actions.
 * @performance Offloads blob-to-base64 conversion to a web worker via the WorkerPoolManager to keep the main thread responsive.
 * The transcription process itself is network-bound.
 * @security Requests microphone access from the user. Audio data is encoded and sent to a secure backend service for processing.
 * No audio is stored client-side after processing.
 */
const useAudioToCode = (): { state: AudioToCodeState; actions: AudioToCodeActions } => {
  const [state, setState] = useState<AudioToCodeState>({
    status: 'idle',
    generatedCode: '',
    error: null,
  });

  // Services are retrieved from a hypothetical dependency injection container via a hook.
  const audioRecordingService = useService<AudioRecordingService>('AudioRecordingService');
  const workerPoolManager = useService<WorkerPoolManager>('WorkerPoolManager');
  const bffClient = useService<BffGraphQLClient>('BffGraphQLClient');

  /**
   * @function handleTranscription
   * @description Callback function executed when recording stops. It processes the audio blob.
   * @param {Blob} audioBlob - The recorded audio data.
   * @private
   */
  const handleTranscription = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size === 0) {
      setState({ status: 'error', generatedCode: '', error: 'Recording was empty.' });
      return;
    }

    setState(s => ({ ...s, status: 'transcribing', error: null }));

    try {
      // Offload the expensive base64 encoding to a web worker.
      const base64Audio = await workerPoolManager.submitTask<string>({
        task: 'ENCODE_BLOB_TO_BASE64',
        payload: audioBlob,
      });

      // Make a GraphQL request to the BFF, which then calls the AIGatewayService.
      const stream = bffClient.streamQuery({
        query: `
          mutation TranscribeAudio($audioData: String!, $mimeType: String!) {
            transcribeAudioToCode(audioData: $audioData, mimeType: $mimeType)
          }
        `,
        variables: { audioData: base64Audio, mimeType: audioBlob.type },
      });
      
      let fullResponse = '';
      for await (const chunk of stream) {
        // Assuming chunk is of shape { data: { transcribeAudioToCode: "..." } }
        fullResponse += chunk.data.transcribeAudioToCode;
        setState(s => ({ ...s, generatedCode: fullResponse }));
      }

      setState(s => ({ ...s, status: 'success' }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setState({ status: 'error', generatedCode: '', error: `Transcription failed: ${errorMessage}` });
    }
  }, [workerPoolManager, bffClient]);

  useEffect(() => {
    // Subscribe to events from the AudioRecordingService.
    const unsubscribe = audioRecordingService.onStop(handleTranscription);
    return () => unsubscribe();
  }, [audioRecordingService, handleTranscription]);

  /**
   * @function toggleRecording
   * @description Starts or stops the audio recording process.
   */
  const toggleRecording = useCallback(async () => {
    if (state.status === 'recording') {
      await audioRecordingService.stop();
      // Status will change to 'transcribing' via the onStop callback.
    } else {
      setState({ status: 'idle', generatedCode: '', error: null });
      try {
        await audioRecordingService.start();
        setState(s => ({ ...s, status: 'recording' }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Could not start recording.';
        setState({ status: 'error', generatedCode: '', error: errorMessage });
      }
    }
  }, [state.status, audioRecordingService]);

  return { state, actions: { toggleRecording } };
};

/**
 * @component AudioToCode
 * @description A feature component that enables users to record audio and have it
 * transcribed into code by an AI service. This component is a thin presentation
 * layer, with all logic encapsulated in the `useAudioToCode` hook.
 * @example
 * ```jsx
 * <AudioToCode />
 * ```
 * @returns {React.ReactElement} The rendered AudioToCode component.
 */
export const AudioToCode: React.FC = () => {
  const { state, actions } = useAudioToCode();
  const { status, generatedCode, error } = state;

  const getStatusMessage = (): string => {
    switch (status) {
      case 'idle': return 'Click the microphone to start speaking your code.';
      case 'recording': return 'Recording in progress... Click to stop.';
      case 'transcribing': return 'Transcribing your masterpiece...';
      case 'success': return 'Transcription complete. You can record another idea.';
      case 'error': return 'An error occurred. Please try again.';
      default: return '';
    }
  };

  const isRecording = status === 'recording';

  return (
    <Layout.Container variant="feature" className="flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-6">
        <Typography.H1 className="flex items-center justify-center">
          <MicrophoneIcon />
          <span className="ml-3">AI Audio-to-Code</span>
        </Typography.H1>
        <Typography.P variant="secondary" className="mt-1">
          Speak your programming ideas and watch them turn into code.
        </Typography.P>
      </header>

      <Card className="w-full max-w-lg p-6 flex flex-col items-center justify-center">
        <Button
          variant={isRecording ? 'destructive' : 'primary'}
          size="icon-lg"
          onClick={actions.toggleRecording}
          disabled={status === 'transcribing'}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className="w-24 h-24 rounded-full"
        >
          {status === 'transcribing' ? <LoadingSpinner /> : isRecording ? <StopIcon /> : <MicrophoneIcon />}
        </Button>
        <Typography.P variant="secondary" className="mt-4">
          {getStatusMessage()}
        </Typography.P>
      </Card>
      
      {error && (
        <Card variant="error" className="w-full max-w-3xl mt-6 p-4">
          <Typography.P>{error}</Typography.P>
        </Card>
      )}

      {(status === 'transcribing' || status === 'success') && (
        <div className="w-full max-w-3xl mt-6 flex flex-col flex-grow min-h-[200px]">
          <Typography.Label htmlFor="generated-code-output">Generated Code</Typography.Label>
          <Card id="generated-code-output" className="flex-grow mt-2 overflow-y-auto">
            {status === 'transcribing' && !generatedCode && (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            )}
            {generatedCode && <MarkdownRenderer content={'```javascript\n' + generatedCode + '\n```'} />}
          </Card>
        </div>
      )}
    </Layout.Container>
  );
};
