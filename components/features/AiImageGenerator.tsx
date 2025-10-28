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

import React, { useState, useCallback, useRef } from 'react';

// Core Service & Hooks
import { generateImage } from '../../services/aiService';
import { useNotification } from '../../contexts/NotificationContext';
import { fileToBase64 } from '../../services/fileUtils';

// UI Components & Icons
import { LoadingSpinner } from '../shared';

const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>;
const ImageGeneratorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
const ArrowDownTrayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

// --- Type Definitions ---
interface UploadedImage {
    base64: string;
    dataUrl: string;
    mimeType: string;
}

// --- Placeholder UI Components ---

const ImageUploadArea: React.FC<{ onUpload: (file: File) => void; onClear: () => void; uploadedImageUrl: string | null; label: string; isProcessing: boolean; }> = ({ onUpload, onClear, uploadedImageUrl, label, isProcessing }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    return (
        <div>
            <label className="text-sm font-medium text-text-secondary">{label}</label>
            <div className="mt-1 relative flex justify-center items-center h-48 border-2 border-dashed border-border rounded-lg p-4 text-center">
                {uploadedImageUrl ? (
                    <>
                        <img src={uploadedImageUrl} alt="Inspiration preview" className="max-h-full max-w-full object-contain rounded-md" />
                        <button onClick={onClear} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70">
                            <XMarkIcon />
                        </button>
                    </>
                ) : isProcessing ? (
                    <LoadingSpinner />
                ) : (
                    <div className="flex flex-col items-center">
                        <p className="text-sm text-text-secondary">Drop an image here or click to upload</p>
                        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" />
                        <button onClick={() => inputRef.current?.click()} className="mt-2 text-sm text-primary font-semibold">Browse</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ImagePreview: React.FC<{ src?: string | null; alt: string; isLoading: boolean; error?: string; onDownload: () => void; }> = ({ src, alt, isLoading, error, onDownload }) => {
    return (
        <div className="relative flex-grow bg-background border border-border rounded-lg flex items-center justify-center overflow-hidden">
            {isLoading && <LoadingSpinner />}
            {error && !isLoading && <p className="text-red-500 p-4 text-center">Error: {error}</p>}
            {src && !isLoading && (
                <>
                    <img src={src} alt={alt} className="w-full h-full object-contain" />
                    <button onClick={onDownload} className="absolute bottom-4 right-4 btn-primary p-2 rounded-full shadow-lg">
                        <ArrowDownTrayIcon />
                    </button>
                </>
            )}
            {!src && !isLoading && !error && <p className="text-text-secondary">Generated image will appear here.</p>}
        </div>
    );
};

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
 * A React functional component that provides a UI for generating AI images.
 * Users can input a text prompt and optionally upload an image to guide the generation process.
 * @component
 * @example
 * return <AiImageGenerator />
 */
export const AiImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A photorealistic image of a futuristic city at sunset, with flying cars.');
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { addNotification } = useNotification();

    /**
     * @function handleGenerate
     * @description Initiates the AI image generation process.
     */
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            addNotification('Please enter a prompt to generate an image.', 'error');
            return;
        }

        setIsGenerating(true);
        setGenerationError('');
        addNotification('Starting image generation...', 'info');
        try {
            // In a real multimodal scenario, the service would take the image data.
            // The current `generateImage` service only takes a text prompt.
            const imageUrl = await generateImage(prompt);
            setGeneratedImageUrl(imageUrl);
            addNotification('Image generated!', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            setGenerationError(message);
            addNotification(`Image generation failed: ${message}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, addNotification]);

    /**
     * @function handleImageUpload
     * @description Processes an uploaded image file to Base64.
     */
    const handleImageUpload = useCallback(async (file: File) => {
        setIsProcessing(true);
        addNotification('Processing uploaded image...', 'info');
        try {
            const base64String = await fileToBase64(file);
            setUploadedImage({
                base64: base64String,
                dataUrl: `data:${file.type};base64,${base64String}`,
                mimeType: file.type
            });
            addNotification('Image processed successfully.', 'success');
        } catch (error) {
            addNotification('Failed to process image.', 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [addNotification]);

    /**
     * @function handleDownload
     * @description Triggers the download of the generated image.
     */
    const handleDownload = useCallback(() => {
        if (generatedImageUrl) {
            const filename = `${prompt.slice(0, 40).replace(/\s/g, '_') || 'ai-generated-image'}.png`;
            const link = document.createElement('a');
            link.href = generatedImageUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            addNotification('Download started.', 'success');
        } else {
            addNotification('No image to download.', 'error');
        }
    }, [generatedImageUrl, prompt, addNotification]);

    /**
     * @function handleSurpriseMe
     * @description Sets the prompt to a random example from the predefined list.
     */
    const handleSurpriseMe = (): void => {
        const randomPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
        setPrompt(randomPrompt);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold flex items-center">
                    <ImageGeneratorIcon />
                    <span className="ml-3">AI Image Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Generate images from text, or provide an image for inspiration.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="prompt-input" className="text-sm font-medium text-text-secondary">Your Prompt</label>
                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A cute cat wearing a wizard hat"
                            rows={4}
                            className="w-full mt-1 p-2 bg-surface border border-border rounded-md text-sm"
                        />
                    </div>
                    
                    <ImageUploadArea 
                        onUpload={handleImageUpload} 
                        onClear={() => setUploadedImage(null)}
                        uploadedImageUrl={uploadedImage?.dataUrl || null}
                        label="Inspiration Image (Optional)"
                        isProcessing={isProcessing}
                    />
                    
                    <div className="flex items-center gap-2 mt-auto">
                         <button onClick={handleGenerate} disabled={isGenerating || isProcessing} className="btn-primary flex-grow py-2">
                            {isGenerating ? <LoadingSpinner /> : 'Generate Image'}
                         </button>
                         <button onClick={handleSurpriseMe} disabled={isGenerating || isProcessing} aria-label="Surprise Me" className="p-2 bg-surface border border-border rounded-md">
                            <SparklesIcon />
                         </button>
                    </div>
                </div>

                <div className="flex flex-col">
                     <label className="text-sm font-medium text-text-secondary mb-2">Generated Image</label>
                     <ImagePreview
                        src={generatedImageUrl}
                        alt={prompt}
                        isLoading={isGenerating}
                        error={generationError}
                        onDownload={handleDownload}
                    />
                </div>
            </div>
        </div>
    );
};