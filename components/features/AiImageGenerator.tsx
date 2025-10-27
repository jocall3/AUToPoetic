/**
 * @file AiImageGenerator.tsx
 * @module AiImageGenerator
 * @description A feature component for generating images from textual prompts, optionally guided by a source image.
 * This component has been refactored to align with the new micro-frontend and service-oriented architecture.
 * It offloads heavy client-side processing to a dedicated web worker pool and communicates with the AI
 * backend via an authenticated GraphQL mutation, adhering to a zero-trust security model.
 * @version 2.0.0
 * @author Elite AI Implementation Team
 * @see {@link useGenerateImageMutation} for the GraphQL mutation hook.
 * @see {@link useWorkerPool} for the web worker management hook.
 * @security This component makes authenticated requests to the BFF. All user-provided text and image data is sent to the backend for processing by the AI model. The client itself holds no long-lived secrets.
 * @performance Image processing (blob to base64 conversion) is offloaded to a web worker to prevent blocking the main thread. The generated image URL is loaded directly, and performance depends on the AI service and network conditions.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

// --- Core Service & GraphQL Hooks ---
import { useGenerateImageMutation } from '@/graphql/hooks/useGenerateImageMutation';
import { useWorkerPool } from '@/services/WorkerPoolManager';
import { useNotification } from '@/contexts/NotificationContext';
import { downloadService } from '@/services/infrastructure/DownloadService';

// --- UI Framework Components ---
import * as ui from '@/ui/core';
import * as layout from '@/ui/layout';
import { ImageUploadArea } from '@/ui/composite/ImageUploadArea';
import { ImagePreview } from '@/ui/composite/ImagePreview';
import { ImageGeneratorIcon, SparklesIcon } from '@/ui/icons';

// --- Type Definitions ---
import type { WorkerTaskResponse } from '@/types';

/**
 * A list of sample prompts to inspire the user.
 * @constant {string[]}
 */
const surprisePrompts: string[] = [
    'A majestic lion wearing a crown, painted in the style of Van Gogh.',
    'A futuristic cityscape on another planet with two moons in the sky.',
    'A cozy, magical library inside a giant tree.',
    'A surreal image of a ship sailing on a sea of clouds.',
    'An astronaut riding a space-themed bicycle on the moon.',
];

/**
 * @interface UploadedImage
 * @description Represents the state of an uploaded image, containing both its base64 representation for the API and a data URL for client-side preview.
 * @property {string} base64 - The base64 encoded string of the image data.
 * @property {string} dataUrl - The data URL (`data:mime/type;base64,...`) for rendering the image in an `<img>` tag.
 * @property {string} mimeType - The MIME type of the uploaded image (e.g., 'image/png').
 */
interface UploadedImage {
    base64: string;
    dataUrl: string;
    mimeType: string;
}

/**
 * A React functional component that provides a UI for generating AI images.
 * Users can input a text prompt and optionally upload an image to guide the generation process.
 * The component utilizes a GraphQL mutation for AI interaction and a web worker for image processing.
 * @component
 * @example
 * return <AiImageGenerator />
 */
export const AiImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A photorealistic image of a futuristic city at sunset, with flying cars.');
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

    const { postTask, subscribe, unsubscribe } = useWorkerPool();
    const { addNotification } = useNotification();
    const [generateImage, { data: generatedImageData, loading: isGenerating, error: generationError }] = useGenerateImageMutation();

    const imageProcessingTaskId = useRef<string | null>(null);

    /**
     * @description Effect to handle responses from the web worker pool for image processing tasks.
     * @performance Subscribes and unsubscribes to worker messages, preventing memory leaks and unnecessary processing.
     */
    useEffect(() => {
        const handleWorkerMessage = (response: WorkerTaskResponse) => {
            if (response.taskId === imageProcessingTaskId.current) {
                if (response.status === 'success') {
                    setUploadedImage(response.payload as UploadedImage);
                    addNotification('Image processed successfully.', 'success');
                } else {
                    addNotification(`Image processing failed: ${response.error}`, 'error');
                }
                imageProcessingTaskId.current = null; // Clear task ID after completion
            }
        };

        const subscriptionId = subscribe(handleWorkerMessage);
        return () => unsubscribe(subscriptionId);
    }, [subscribe, unsubscribe, addNotification]);

    /**
     * @function handleGenerate
     * @description Initiates the AI image generation process by calling the GraphQL mutation.
     * @security The prompt and image data are sent to the secure BFF endpoint.
     * @performance Asynchronous operation; loading state is managed by the mutation hook.
     * @returns {void}
     */
    const handleGenerate = useCallback((): void => {
        if (!prompt.trim()) {
            addNotification('Please enter a prompt to generate an image.', 'error');
            return;
        }

        addNotification('Starting image generation...', 'info');
        generateImage({
            variables: {
                prompt,
                base64Image: uploadedImage?.base64,
                mimeType: uploadedImage?.mimeType,
            },
        });
    }, [prompt, uploadedImage, generateImage, addNotification]);

    /**
     * @function handleImageUpload
     * @description Offloads the processing of an uploaded image file to a web worker.
     * @param {File} file - The image file selected by the user.
     * @performance By using a web worker, we prevent the main thread from being blocked while converting the file to base64 and a data URL.
     * @returns {void}
     */
    const handleImageUpload = useCallback((file: File): void => {
        if (imageProcessingTaskId.current) {
            addNotification('Another image is already being processed.', 'info');
            return;
        }
        const taskId = postTask('PROCESS_IMAGE_BLOB', { blob: file });
        imageProcessingTaskId.current = taskId;
        addNotification('Processing uploaded image...', 'info');
    }, [postTask, addNotification]);

    /**
     * @function handleDownload
     * @description Triggers the download of the generated image using the download service.
     * @returns {void}
     */
    const handleDownload = useCallback((): void => {
        const url = generatedImageData?.generateImage?.url;
        if (url) {
            const filename = `${prompt.slice(0, 40).replace(/\s/g, '_') || 'ai-generated-image'}.png`;
            downloadService.downloadUrl(url, filename);
            addNotification('Download started.', 'success');
        } else {
            addNotification('No image to download.', 'error');
        }
    }, [generatedImageData, prompt, addNotification]);

    /**
     * @function handleSurpriseMe
     * @description Sets the prompt to a random example from the predefined list.
     * @returns {void}
     */
    const handleSurpriseMe = (): void => {
        const randomPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
        setPrompt(randomPrompt);
    };

    /**
     * @function handleClearImage
     * @description Clears the currently uploaded inspiration image.
     * @returns {void}
     */
    const handleClearImage = (): void => {
        setUploadedImage(null);
    };

    return (
        <layout.Pane>
            <layout.Header
                icon={<ImageGeneratorIcon />}
                title="AI Image Generator"
                description="Generate images from text, or provide an image for inspiration."
            />
            <layout.Grid columns={2} gap="large" className="h-full">
                <layout.GridItem className="flex flex-col">
                    <ui.Card className="flex flex-col gap-4 h-full">
                        <ui.FormControl>
                            <ui.Label htmlFor="prompt-input">Your Prompt</ui.Label>
                            <ui.TextArea
                                id="prompt-input"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A cute cat wearing a wizard hat"
                                rows={4}
                            />
                        </ui.FormControl>
                        
                        <ImageUploadArea 
                            onUpload={handleImageUpload} 
                            onClear={handleClearImage}
                            uploadedImageUrl={uploadedImage?.dataUrl}
                            label="Inspiration Image (Optional)"
                            isProcessing={!!imageProcessingTaskId.current}
                        />
                        
                        <layout.FlexContainer gap="medium" className="mt-auto">
                             <ui.Button onClick={handleGenerate} loading={isGenerating} fullWidth>Generate Image</ui.Button>
                             <ui.Button variant="secondary" onClick={handleSurpriseMe} disabled={isGenerating} aria-label="Surprise Me">
                                <SparklesIcon />
                             </ui.Button>
                        </layout.FlexContainer>
                    </ui.Card>
                </layout.GridItem>

                <layout.GridItem className="flex flex-col">
                     <ui.Card className="h-full flex flex-col">
                        <ui.Label>Generated Image</ui.Label>
                        <ImagePreview
                            src={generatedImageData?.generateImage?.url}
                            alt={prompt}
                            isLoading={isGenerating}
                            error={generationError?.message}
                            onDownload={handleDownload}
                        />
                     </ui.Card>
                </layout.GridItem>
            </layout.Grid>
        </layout.Pane>
    );
};
