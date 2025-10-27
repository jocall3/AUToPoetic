/**
 * @file Defines the ThemeDesigner component, an AI-powered tool for generating UI themes.
 * @copyright James Burvel O'Callaghan III
 * @license Apache-2.0
 * @see @/hooks/useTheme.ts for theme application logic.
 * @see @/types.ts for SemanticColorTheme and ColorTheme type definitions.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowDownTrayIcon, PhotoIcon, SwatchIcon } from '../icons.tsx';
import type { SemanticColorTheme, ColorTheme } from '../../types.ts';
import { LoadingSpinner } from '../shared/index.tsx';
import { useTheme } from '../../hooks/useTheme.ts';

// --- Mock Implementations for Architectural Transformation ---

/**
 * @description Mock GraphQL client to simulate communication with the Backend-for-Frontend (BFF).
 * In the new architecture, all AI interactions are moved to backend microservices.
 * The frontend makes authenticated GraphQL requests to the BFF, which orchestrates calls
 * to services like the AIGatewayService.
 * @example
 * const { generateTheme } = await graphqlClient.request(GENERATE_THEME_MUTATION, { prompt, image });
 * @security This abstraction prevents direct exposure of AI provider APIs and keys to the client,
 * adhering to a zero-trust model. All requests to the BFF must be authenticated.
 */
const graphqlClient = {
  request: async (query: string, variables: any): Promise<{ generateTheme: SemanticColorTheme }> => {
    console.log("Making GraphQL request to BFF:", query, variables);
    await new Promise(res => setTimeout(res, 1500)); // Simulate network latency
    // This mock returns a static theme object. The real BFF would call the AIGatewayService.
    return {
      generateTheme: {
        mode: 'light',
        palette: {
          primary: { value: '#4A90E2', name: 'Cornflower Blue' },
          secondary: { value: '#50E3C2', name: 'Mint Green' },
          accent: { value: '#F5A623', name: 'Golden Sun' },
          neutral: { value: '#B8B8B8', name: 'Cool Grey' },
        },
        theme: {
          background: { value: '#F4F7F9', name: 'Whisper Blue' },
          surface: { value: '#FFFFFF', name: 'White' },
          textPrimary: { value: '#333333', name: 'Onyx' },
          textSecondary: { value: '#7F8C8D', name: 'Steel Gray' },
          textOnPrimary: { value: '#FFFFFF', name: 'White' },
          border: { value: '#E0E6ED', name: 'Light Steel' },
        },
        accessibility: {
          primaryOnSurface: { ratio: 4.52, score: 'AA' },
          textPrimaryOnSurface: { ratio: 12.6, score: 'AAA' },
          textSecondaryOnSurface: { ratio: 4.6, score: 'AA' },
          textOnPrimaryOnPrimary: { ratio: 4.54, score: 'AA' },
        },
      },
    };
  },
};

/**
 * @description Mock Worker Pool manager to simulate offloading tasks to a Web Worker.
 * According to the new architecture, all significant client-side computations must be
 * moved to a managed pool of Web Workers to keep the main thread responsive.
 * @example
 * const base64 = await workerPool.run('fileToBase64', file);
 * @performance Offloading file-to-Base64 conversion to a worker prevents blocking the main
 * thread, especially with large image files, improving UI responsiveness.
 */
const workerPool = {
  run: (taskName: string, payload: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (taskName === 'fileToBase64') {
        const file = payload as File;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = (reader.result as string).split(',')[1];
          resolve(result);
        };
        reader.onerror = error => reject(error);
      } else {
        reject(new Error(`Unknown worker task: ${taskName}`));
      }
    });
  },
};

/**
 * Displays a single color from the generated theme palette or roles.
 * @param {object} props - The component props.
 * @param {string} props.name - The semantic name of the color (e.g., "Primary", "Background").
 * @param {{ name: string; value: string; }} props.color - The color object with its creative name and hex value.
 * @returns {React.ReactElement} A component showing the color swatch and its details.
 */
const ColorDisplay: React.FC<{ name: string; color: { name: string; value: string; } }> = ({ name, color }) => (
    <div className="flex items-center justify-between p-2 bg-background rounded-md border border-border">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: color.value }} />
            <div>
                <p className="text-sm font-semibold text-text-primary capitalize">{name}</p>
                <p className="text-xs text-text-secondary">{color.name}</p>
            </div>
        </div>
        <span className="font-mono text-sm text-text-secondary">{color.value}</span>
    </div>
);

/**
 * Displays the result of a WCAG 2.1 accessibility contrast check.
 * @param {object} props - The component props.
 * @param {string} props.name - The name of the check (e.g., "Text on Primary").
 * @param {{ ratio: number; score: string; }} props.check - The accessibility check result, including contrast ratio and score ('AAA', 'AA', or 'Fail').
 * @returns {React.ReactElement} A component showing the accessibility score.
 */
const AccessibilityCheck: React.FC<{ name: string, check: { ratio: number; score: string; } }> = ({ name, check }) => {
    const scoreColor = check.score === 'AAA' ? 'text-green-600' : check.score === 'AA' ? 'text-emerald-600' : 'text-red-600';
    return (
        <div className="flex items-center justify-between p-2 bg-background rounded-md border border-border text-sm">
            <p className="text-text-secondary">{name}</p>
            <div className="flex items-center gap-2">
                <span className="font-mono">{check.ratio.toFixed(2)}</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${scoreColor} ${scoreColor.replace('text-', 'bg-')}/10`}>{check.score}</span>
            </div>
        </div>
    );
}

/**
 * The ThemeDesigner component allows users to generate a complete UI theme system
 * using AI, based on a natural language prompt or an inspiration image.
 * It displays the generated palette, theme roles, and accessibility scores,
 * provides a live preview, and allows applying the theme to the application at runtime.
 * @returns {React.ReactElement} The main Theme Designer feature component.
 */
export const ThemeDesigner: React.FC = () => {
    const [theme, setTheme] = useState<SemanticColorTheme | null>(null);
    const [prompt, setPrompt] = useState('A calming, minimalist theme for a blog');
    const [image, setImage] = useState<{ base64: string, name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [, , applyCustomTheme] = useTheme();

    /**
     * Handles the AI theme generation by sending a request to the BFF.
     * @performance This async operation shows a loading state to the user.
     * It uses a GraphQL mutation, abstracting the direct AI call to the backend.
     */
    const handleGenerate = useCallback(async () => {
        const textPart = `Generate a theme based on this description: "${prompt}"`;
        const imagePart = image ? image.base64 : null;

        setIsLoading(true);
        setError('');

        const GENERATE_THEME_MUTATION = `
          mutation GenerateTheme($prompt: String!, $imageBase64: String) {
            generateTheme(prompt: $prompt, imageBase64: $imageBase64) {
              mode
              palette { primary { value name } secondary { value name } accent { value name } neutral { value name } }
              theme { background { value name } surface { value name } textPrimary { value name } textSecondary { value name } textOnPrimary { value name } border { value name } }
              accessibility { primaryOnSurface { ratio score } textPrimaryOnSurface { ratio score } textSecondaryOnSurface { ratio score } textOnPrimaryOnPrimary { ratio score } }
            }
          }
        `;

        try {
            const { generateTheme } = await graphqlClient.request(GENERATE_THEME_MUTATION, {
                prompt: textPart,
                imageBase64: imagePart,
            });
            setTheme(generateTheme);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            console.error("Theme generation failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, image]);
    
    /**
     * Processes an uploaded file by converting it to Base64 using a Web Worker.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event.
     * @performance Offloads file reading and Base64 conversion to a worker to keep the UI responsive.
     * @security File processing is done on the client; only the Base64 data is sent to the backend, not the file object itself.
     */
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await workerPool.run('fileToBase64', file);
                setImage({ base64, name: file.name });
                setPrompt(`A theme based on the uploaded image: ${file.name}`);
            } catch (err) {
                setError('Could not process image file.');
                console.error("File to Base64 conversion failed:", err);
            }
        }
    }, []);
    
    // Generate an initial theme when the component first mounts.
    useEffect(() => {
        handleGenerate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Applies the generated theme to the entire application using the useTheme hook.
     * This demonstrates dynamic, runtime theme switching.
     */
    const handleApplyTheme = () => {
        if (!theme) return;
        const colorsToApply: ColorTheme = {
            primary: theme.palette.primary.value,
            background: theme.theme.background.value,
            surface: theme.theme.surface.value,
            textPrimary: theme.theme.textPrimary.value,
            textSecondary: theme.theme.textSecondary.value,
            textOnPrimary: theme.theme.textOnPrimary.value,
            border: theme.theme.border.value,
        };
        applyCustomTheme(colorsToApply, theme.mode);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center"><SwatchIcon /><span className="ml-3">AI Theme Designer</span></h1>
                <p className="text-text-secondary mt-1">Generate a full design system from a description or image.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-4 bg-surface border border-border p-6 rounded-lg overflow-y-auto">
                    <h3 className="text-xl font-bold">Describe or Upload</h3>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="p-2 bg-background border border-border rounded-md resize-none text-sm h-24" placeholder="e.g., A light, airy theme for a blog" />
                     <div className="relative border border-dashed border-border rounded-lg p-4 text-center">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                        <PhotoIcon/>
                        <p className="text-sm mt-1 truncate">{image ? `Image: ${image.name}` : 'Upload an image (optional)'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleGenerate} disabled={isLoading} className="btn-primary flex-grow flex items-center justify-center gap-2 px-4 py-2">
                            {isLoading ? <LoadingSpinner /> : 'Generate New Theme'}
                        </button>
                         <button onClick={handleApplyTheme} disabled={isLoading || !theme} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-md hover:opacity-90 transition-all disabled:opacity-50 shadow-md">
                            Apply to App
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    {isLoading && !theme && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}

                    {theme && !isLoading && (
                        <div className="mt-4 border-t border-border pt-4 space-y-4">
                            <div><h3 className="text-lg font-bold mb-2">Palette</h3><div className="space-y-2"><ColorDisplay name="Primary" color={theme.palette.primary}/><ColorDisplay name="Secondary" color={theme.palette.secondary}/><ColorDisplay name="Accent" color={theme.palette.accent}/><ColorDisplay name="Neutral" color={theme.palette.neutral}/></div></div>
                            <div><h3 className="text-lg font-bold mb-2">Theme Roles</h3><div className="space-y-2"><ColorDisplay name="Background" color={theme.theme.background}/><ColorDisplay name="Surface" color={theme.theme.surface}/><ColorDisplay name="Text Primary" color={theme.theme.textPrimary}/><ColorDisplay name="Text Secondary" color={theme.theme.textSecondary}/><ColorDisplay name="Text on Primary" color={theme.theme.textOnPrimary}/><ColorDisplay name="Border" color={theme.theme.border}/></div></div>
                            <div><h3 className="text-lg font-bold mb-2">Accessibility (WCAG 2.1)</h3><div className="space-y-2"><AccessibilityCheck name="Primary on Surface" check={theme.accessibility.primaryOnSurface}/><AccessibilityCheck name="Text on Surface" check={theme.accessibility.textPrimaryOnSurface}/><AccessibilityCheck name="Subtle Text on Surface" check={theme.accessibility.textSecondaryOnSurface}/><AccessibilityCheck name="Text on Primary" check={theme.accessibility.textOnPrimaryOnPrimary}/></div></div>
                        </div>
                    )}
                </div>
                <div className="md:col-span-1 rounded-lg p-8 overflow-y-auto border border-border transition-colors duration-500" style={{ backgroundColor: theme?.theme.background.value, color: theme?.theme.textPrimary.value }}>
                     <h3 className="text-2xl font-bold mb-6">Live Preview</h3>
                     {theme ? (
                         <div className="p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 transition-colors duration-500" style={{ backgroundColor: theme.theme.surface.value }}>
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold">Sample Card</h4>
                                <p className="text-sm" style={{color: theme.theme.textSecondary.value}}>This is a sample card to demonstrate the theme colors. It contains a primary button and some secondary text.</p>
                                <button className="px-4 py-2 rounded-md font-bold transition-colors" style={{ backgroundColor: theme.palette.primary.value, color: theme.theme.textOnPrimary.value }}>Primary Button</button>
                            </div>
                             <div className="space-y-4">
                                <input type="text" placeholder="Text input" className="w-full px-3 py-2 rounded-md border transition-colors duration-500" style={{backgroundColor: theme.theme.background.value, borderColor: theme.theme.border.value, color: theme.theme.textPrimary.value}} />
                                <div className="p-3 border rounded transition-colors duration-500" style={{borderColor: theme.theme.border.value, color: theme.theme.textSecondary.value}}>
                                    <p>A bordered container.</p>
                                </div>
                             </div>
                         </div>
                     ) : <div className="flex items-center justify-center h-full text-text-secondary">Theme preview will appear here.</div>}
                </div>
            </div>
        </div>
    );
};
