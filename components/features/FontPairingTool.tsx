/**
 * @file FontPairingTool.tsx
 * @module components/features/FontPairingTool
 * @description
 *   An AI-powered tool for discovering harmonious font pairings for web design.
 *   Users can provide a descriptive prompt (e.g., "a modern, professional blog")
 *   and the AI will suggest a heading and a body font from the Google Fonts library.
 *   The component provides a live preview, the AI's reasoning, and the necessary
 *   CSS code for implementation.
 * @see services/aiService.ts For the AI interaction logic.
 * @see hooks/useTheme.ts For adapting to the current application theme.
 * @see contexts/NotificationContext.tsx For providing user feedback on actions like copying code.
 * @security
 *   - All user input (prompt) is sent to a backend AI service. No sensitive data should be entered.
 *   - Dynamic font loading is handled via Google Fonts API, a trusted source.
 *   - CSS output is generated and displayed as text, not executed directly, preventing injection risks.
 * @performance
 *   - Dynamically loads Google Fonts via `<link>` tags, which can impact initial render performance for the preview.
 *   - AI service calls are asynchronous and might have latency, handled with loading states.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { suggestFontPairing } from '../../services/aiService';
import { useNotification } from '../../contexts/NotificationContext';
import type { FontPairingSuggestion } from '../../types';
import { TypographyLabIcon, SparklesIcon, ClipboardDocumentIcon } from '../icons';
import { LoadingSpinner } from '../shared';

/**
 * Dynamically loads one or more Google Fonts into the document head.
 * It creates or updates a single `<link>` tag for efficiency.
 * @param {string[]} fonts - An array of font family names to load.
 * @performance
 *   Adds a `<link>` to the head, which will trigger a network request to Google Fonts.
 *   This can affect page load performance if many fonts are loaded.
 */
const useGoogleFonts = (fonts: string[]) => {
  useEffect(() => {
    if (fonts.length === 0) return;

    const fontQuery = fonts.map(font => font.replace(/ /g, '+')).join('|');
    const href = `https://fonts.googleapis.com/css?family=${fontQuery}:400,700&display=swap`;

    const linkId = 'ai-font-pairing-stylesheet';
    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (link.href !== href) {
      link.href = href;
    }
  }, [fonts]);
};

/**
 * The FontPairingTool component.
 * A feature that uses AI to suggest and preview font pairings based on a user's prompt.
 *
 * @example
 * <FontPairingTool />
 */
export const FontPairingTool: React.FC = () => {
  const [prompt, setPrompt] = useState('A professional, modern tech startup landing page.');
  const [pairing, setPairing] = useState<FontPairingSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addNotification } = useNotification();

  // Dynamically load the fonts when the pairing is updated.
  useGoogleFonts(pairing ? [pairing.headingFont, pairing.bodyFont] : []);

  const handleGeneratePairing = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please provide a description to generate a font pairing.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await suggestFontPairing(prompt);
      setPairing(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to suggest a pairing: ${errorMessage}`);
      addNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, addNotification]);

  useEffect(() => {
    // Generate a default pairing on initial load.
    handleGeneratePairing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cssCode = pairing
    ? `@import url('https://fonts.googleapis.com/css?family=${pairing.headingFont.replace(/ /g, '+')}:700|${pairing.bodyFont.replace(/ /g, '+')}:400&display=swap');\n\n.heading {\n  font-family: '${pairing.headingFont}', sans-serif;\n}\n\n.body {\n  font-family: '${pairing.bodyFont}', sans-serif;\n}`
    : '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\\n/g, '\n'));
    addNotification('CSS copied to clipboard!', 'success');
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center">
          <TypographyLabIcon />
          <span className="ml-3">AI Font Pairing Tool</span>
        </h1>
        <p className="text-text-secondary mt-1">Describe the style or mood, and let AI suggest the perfect font combination.</p>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Controls & Info */}
        <div className="flex flex-col gap-4 bg-surface p-4 border border-border rounded-lg overflow-y-auto">
          <div>
            <label htmlFor="prompt-input" className="text-sm font-medium text-text-secondary">Describe the desired style</label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A playful and creative portfolio website"
              className="w-full p-2 mt-1 rounded-md bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none resize-y"
              rows={3}
            />
          </div>

          <button
            onClick={handleGeneratePairing}
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center px-6 py-3 text-base"
          >
            {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> Suggest New Pairing</>}
          </button>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {pairing && !isLoading && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h3 className="font-bold text-lg">AI Reasoning</h3>
                <p className="text-sm text-text-secondary mt-1">{pairing.reasoning}</p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">CSS Implementation</h3>
                  <button onClick={() => handleCopy(cssCode)} className="p-1 text-text-secondary hover:text-primary" title="Copy CSS">
                    <ClipboardDocumentIcon />
                  </button>
                </div>
                <pre className="mt-2 p-3 bg-background rounded-md text-primary text-xs overflow-x-auto whitespace-pre-wrap">{cssCode.replace(/\\n/g, '\n')}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="flex-grow bg-background rounded-lg p-8 border-2 border-dashed border-border overflow-y-auto">
          {isLoading && !pairing ? (
            <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>
          ) : pairing ? (
            <div className="space-y-6">
              <h1
                className="text-5xl font-bold break-words"
                style={{ fontFamily: `'${pairing.headingFont}', sans-serif` }}
              >
                {pairing.headingFont}
              </h1>
              <p
                className="text-lg leading-relaxed"
                style={{ fontFamily: `'${pairing.bodyFont}', sans-serif` }}
              >
                This is the body font, {pairing.bodyFont}. It's chosen for its readability and harmonious contrast with the heading. The quick brown fox jumps over the lazy dog. 1234567890.
              </p>
              <h2
                className="text-3xl font-bold pt-4 border-t border-border"
                style={{ fontFamily: `'${pairing.headingFont}', sans-serif` }}
              >
                An Example Subheading
              </h2>
              <p
                className="text-base"
                style={{ fontFamily: `'${pairing.bodyFont}', sans-serif` }}
              >
                Effective typography is a cornerstone of great design. The right font pairing can set the tone for an entire project, conveying professionalism, creativity, or elegance. This tool helps you discover pairings that work well together, ensuring your text is both beautiful and functional.
              </p>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary">
              Font pairing preview will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
