/**
 * @file FontPreviewPicker.tsx
 * @module components/features/FontPreviewPicker
 * @description A sophisticated and reusable component for selecting and previewing fonts,
 * designed to integrate with a theming engine or typography lab.
 * @see TypographyLab.tsx
 * @see ThemeDesigner.tsx
 */

import React, { useState, useEffect } from 'react';
import { TypographyLabIcon } from '../icons.tsx';

/**
 * A curated list of popular Google Fonts for selection.
 * In a production environment, this list would likely be fetched from a dedicated service
 * or configuration file, managed by the ResourceOrchestrator.
 * @security This list defines the allowed external resources (fonts) that can be loaded.
 *           Hardcoding this list prevents arbitrary font loading from unvetted sources.
 * @performance The number of fonts in this list is kept reasonable to not overwhelm the UI.
 */
const POPULAR_GOOGLE_FONTS: string[] = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito', 'Merriweather',
    'Playfair Display', 'Lora', 'Noto Sans', 'Ubuntu', 'PT Sans', 'Inter', 'Work Sans', 'Fira Sans'
];

/**
 * Props for the FontPreviewPicker component.
 * @interface FontPreviewPickerProps
 */
interface FontPreviewPickerProps {
    /**
     * The initially selected font family.
     * @type {string}
     * @default 'Roboto'
     */
    initialFont?: string;

    /**
     * Callback function that is invoked when a new font is selected.
     * It passes the font family name as a string.
     * @param {string} fontFamily - The newly selected font family.
     * @returns {void}
     */
    onFontChange?: (fontFamily: string) => void;
}

/**
 * Manages the dynamic loading of Google Font stylesheets in the document head.
 * This ensures that fonts are only loaded when needed for previewing.
 *
 * @param {string} fontFamily - The font family to load from Google Fonts.
 * @performance Lazily loads font stylesheets, which is more performant than preloading
 *              a large number of unused fonts. Creates and removes `<link>` tags,
 *              which can cause a brief re-render or style recalculation.
 * @security Dynamically adding scripts or links from external sources carries inherent risks.
 *           This implementation mitigates risk by only loading from `fonts.googleapis.com`
 *           and using a predefined list of fonts.
 */
const useGoogleFont = (fontFamily: string) => {
    useEffect(() => {
        if (!fontFamily || !POPULAR_GOOGLE_FONTS.includes(fontFamily)) {
            return;
        }

        const fontId = `font-preview-${fontFamily.replace(/\s+/g, '-')}`;
        if (document.getElementById(fontId)) {
            return; // Font already loaded
        }

        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
        
        document.head.appendChild(link);

        return () => {
            // Optional: Cleanup could remove the link if components are frequently mounted/unmounted.
            // For a persistent tool, leaving it might be better for caching.
            // const linkToRemove = document.getElementById(fontId);
            // if (linkToRemove) {
            //     document.head.removeChild(linkToRemove);
            // }
        };
    }, [fontFamily]);
};


/**
 * A component that allows users to select and preview a font from a predefined list.
 * It dynamically loads the selected font from Google Fonts and displays sample text.
 * This component is intended to be used within a larger theming or design tool.
 *
 * @component
 * @param {FontPreviewPickerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered FontPreviewPicker component.
 *
 * @example
 * ```tsx
 * const handleFontSelection = (font) => {
 *   console.log(`Selected font: ${font}`);
 * };
 *
 * return <FontPreviewPicker initialFont="Lato" onFontChange={handleFontSelection} />;
 * ```
 */
export const FontPreviewPicker: React.FC<FontPreviewPickerProps> = ({
    initialFont = 'Roboto',
    onFontChange,
}) => {
    const [selectedFont, setSelectedFont] = useState<string>(initialFont);
    const [previewText, setPreviewText] = useState<string>('The quick brown fox jumps over the lazy dog.');
    
    useGoogleFont(selectedFont);

    /**
     * Handles the change event from the font selection dropdown.
     * Updates the internal state and invokes the onFontChange callback.
     * @param {React.ChangeEvent<HTMLSelectElement>} event - The select change event.
     */
    const handleFontSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newFont = event.target.value;
        setSelectedFont(newFont);
        if (onFontChange) {
            onFontChange(newFont);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <TypographyLabIcon />
                    <span className="ml-3">Font Preview Picker</span>
                </h1>
                <p className="text-text-secondary mt-1">Select a font to preview its appearance in real-time.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                {/* Controls */}
                <div className="md:col-span-1 bg-surface border border-border p-6 rounded-lg flex flex-col gap-6">
                    <div>
                        <label htmlFor="font-selector" className="block text-sm font-medium text-text-secondary mb-2">
                            Font Family
                        </label>
                        <select
                            id="font-selector"
                            value={selectedFont}
                            onChange={handleFontSelectChange}
                            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                            {POPULAR_GOOGLE_FONTS.map(font => (
                                <option key={font} value={font}>
                                    {font}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="preview-text" className="block text-sm font-medium text-text-secondary mb-2">
                            Preview Text
                        </label>
                        <textarea
                            id="preview-text"
                            value={previewText}
                            onChange={(e) => setPreviewText(e.target.value)}
                            rows={4}
                            className="w-full p-3 rounded-md bg-background border border-border resize-y focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                </div>

                {/* Preview Area */}
                <div className="md:col-span-2 bg-background border-2 border-dashed border-border rounded-lg p-8 flex flex-col justify-center overflow-y-auto">
                    <div style={{ fontFamily: `'${selectedFont}', sans-serif` }}>
                        <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'inherit' }}>
                            {previewText}
                        </h2>
                        <p className="text-lg" style={{ fontFamily: 'inherit' }}>
                            {previewText}
                        </p>
                        <p className="text-sm mt-4 opacity-70" style={{ fontFamily: 'inherit' }}>
                            {previewText}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
