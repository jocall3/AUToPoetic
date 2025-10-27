/**
 * @fileoverview A feature component for generating color palettes using AI.
 * This component allows users to select a base color, generate a harmonious palette,
 * and preview it on a sample UI card.
 * @module components/features/ColorPaletteGenerator
 * @security This component interacts with the AIGatewayService to generate palettes. All user input (the base color hex code) is sanitized and validated before being sent. It also features client-side file download capabilities, which are handled securely to prevent malicious file generation.
 * @performance AI palette generation is offloaded to a web worker via the `useAIGateway` hook to prevent blocking the main thread.
 * @see {@link @devcore/hooks/useAIGateway} for the AI interaction implementation.
 * @see {@link @devcore/utils/fileHelpers} for the download logic.
 */

import React, { useState, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Button,
  Card,
  Stack,
  Grid,
  Text,
  Spinner,
  ColorSwatch,
  useTheme,
  useNotification,
} from '@devcore/core-ui';
import { SparklesIcon, ArrowDownTrayIcon } from '@devcore/icons';
import { useAIGateway } from '@devcore/hooks';
import { downloadFileAsText } from '@devcore/utils/fileHelpers';
import type { ColorPalette } from '@devcore/types/theme';

/**
 * @interface PreviewColors
 * @description Defines the mapping of palette colors to specific UI elements in the preview card.
 * @property {string} cardBg - The background color of the card.
 * @property {string} pillBg - The background color of the pill element.
 * @property {string} pillText - The text color of the pill element.
 * @property {string} buttonBg - The background color of the button.
 * @property {string} buttonText - The text color of the button.
 */
interface PreviewColors {
  cardBg: string;
  pillBg: string;
  pillText: string;
  buttonBg: string;
  buttonText: string;
}

/**
 * @interface ColorSelectorProps
 * @description Props for the ColorSelector component.
 */
interface ColorSelectorProps {
  label: string;
  value: string;
  palette: string[];
  onChange: (color: string) => void;
}

/**
 * A sub-component for selecting a color from the generated palette for a specific UI element.
 * @param {ColorSelectorProps} props - The component props.
 * @returns {React.ReactElement} A row for selecting a color.
 * @example <ColorSelector label="Card Background" value="#ffffff" palette={['#ffffff', '#000000']} onChange={setColor} />
 */
const ColorSelector: React.FC<ColorSelectorProps> = ({
  label,
  value,
  palette,
  onChange,
}) => (
  <Stack direction="row" justify="space-between" align="center">
    <Text as="label" size="sm">
      {label}
    </Text>
    <Stack direction="row" spacing={2}>
      {palette.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          isSelected={value === color}
          onClick={() => onChange(color)}
          aria-label={`Set ${label} to ${color}`}
        />
      ))}
    </Stack>
  </Stack>
);

/**
 * @interface PreviewCardProps
 * @description Props for the PreviewCard component.
 */
interface PreviewCardProps {
  palette: string[];
  colors: PreviewColors;
  onColorsChange: React.Dispatch<React.SetStateAction<PreviewColors>>;
}

/**
 * A component that displays a live preview of the generated color palette on a sample UI card.
 * @param {PreviewCardProps} props - The component props.
 * @returns {React.ReactElement} A preview card demonstrating the theme.
 * @performance Renders a simple UI card. Performance is not a concern for this component.
 */
const PreviewCard: React.FC<PreviewCardProps> = ({
  palette,
  colors,
  onColorsChange,
}) => {
  return (
    <Card className="w-full max-w-sm">
      <Card.Header>
        <Text as="h3" size="lg" weight="bold">
          Live Preview
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack spacing={4}>
          <div
            className="p-8 rounded-xl"
            style={{ backgroundColor: colors.cardBg }}
          >
            <div
              className="px-4 py-1 rounded-full text-center text-sm inline-block"
              style={{
                backgroundColor: colors.pillBg,
                color: colors.pillText,
              }}
            >
              New Feature
            </div>
            <div className="mt-8 text-center">
              <Button
                style={{
                  backgroundColor: colors.buttonBg,
                  color: colors.buttonText,
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
          <Stack spacing={3}>
            <ColorSelector
              label="Card Background"
              value={colors.cardBg}
              palette={palette}
              onChange={(val) =>
                onColorsChange((c) => ({ ...c, cardBg: val }))
              }
            />
            <ColorSelector
              label="Pill Background"
              value={colors.pillBg}
              palette={palette}
              onChange={(val) =>
                onColorsChange((c) => ({ ...c, pillBg: val }))
              }
            />
            <ColorSelector
              label="Pill Text"
              value={colors.pillText}
              palette={palette}
              onChange={(val) =>
                onColorsChange((c) => ({ ...c, pillText: val }))
              }
            />
            <ColorSelector
              label="Button Background"
              value={colors.buttonBg}
              palette={palette}
              onChange={(val) =>
                onColorsChange((c) => ({ ...c, buttonBg: val }))
              }
            />
            <ColorSelector
              label="Button Text"
              value={colors.buttonText}
              palette={palette}
              onChange={(val) =>
                onColorsChange((c) => ({ ...c, buttonText: val }))
              }
            />
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
};

/**
 * The main feature component for generating AI-powered color palettes.
 * @returns {React.ReactElement} The ColorPaletteGenerator component.
 * @see This component is designed to be a micro-frontend within the larger application.
 */
export const ColorPaletteGenerator: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const [baseColor, setBaseColor] = useState<string>(theme.colors.primary);
  const [palette, setPalette] = useState<string[]>([]);
  const [previewColors, setPreviewColors] = useState<PreviewColors>({
    cardBg: theme.colors.surface,
    pillBg: theme.colors.primary,
    pillText: theme.colors.textOnPrimary,
    buttonBg: theme.colors.primary,
    buttonText: theme.colors.textOnPrimary,
  });

  const {
    mutate: generatePalette,
    isLoading,
    error,
  } = useAIGateway<ColorPalette>({
    endpoint: 'generateColorPalette',
    onSuccess: (data) => {
      setPalette(data.colors);
      // Automatically set preview colors based on the generated palette
      setPreviewColors({
        cardBg: data.colors[0], // Lightest shade for background
        pillBg: data.colors[2], // A mid-tone for pill background
        pillText: data.colors[5], // Darkest shade for text on mid-tone
        buttonBg: data.colors[5], // Darkest shade for button
        buttonText: data.colors[0], // Lightest shade for text on button
      });
      addNotification('New color palette generated!', 'success');
    },
    onError: (e) => {
      addNotification(`Error generating palette: ${e.message}`, 'error');
    },
  });

  const handleGenerate = useCallback(() => {
    generatePalette({ baseColor });
  }, [baseColor, generatePalette]);

  /**
   * @security Client-side file generation. The content is generated from component state
   * and does not include arbitrary user input beyond the color hex codes, mitigating injection risks.
   * The user is prompted to save the file, adhering to browser security models.
   */
  const downloadColorsAsCss = () => {
    if (palette.length === 0) return;
    const cssContent = `:root {\n${palette
      .map((c, i) => `  --color-palette-${i + 1}: ${c};`)
      .join('\n')}\n}`;
    downloadFileAsText(cssContent, 'palette.css', 'text/css');
  };
  
  /**
   * @security Similar to downloadColorsAsCss, this generates a file from trusted component state.
   */
  const downloadCardAsHtml = () => {
    if (palette.length === 0) return;
    const htmlContent = `
<div class="card">
  <div class="pill">New Feature</div>
  <button class="button">Get Started</button>
</div>
`;
    const cssContent = `
.card {
  background-color: ${previewColors.cardBg};
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
}
.pill {
  background-color: ${previewColors.pillBg};
  color: ${previewColors.pillText};
  display: inline-block;
  padding: 0.25rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}
.button {
  margin-top: 2rem;
  background-color: ${previewColors.buttonBg};
  color: ${previewColors.buttonText};
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: bold;
  border: none;
  cursor: pointer;
}
`;
    const combined = `<!-- HTML -->\n${htmlContent}\n\n<!-- CSS -->\n<style>\n${cssContent}\n</style>`;
    downloadFileAsText(combined, 'preview-card.html', 'text/html');
  };

  return (
    <Stack direction="column" className="h-full p-4 sm:p-6 lg:p-8">
      <Stack direction="column" align="center" as="header" className="mb-6">
        <Stack direction="row" align="center" spacing={3}>
          <SparklesIcon size="lg" className="text-primary" />
          <Text as="h1" size="3xl" weight="bold">
            AI Color Palette Generator
          </Text>
        </Stack>
        <Text color="secondary" className="mt-1">
          Pick a base color, let AI design a palette, and preview it on a UI card.
        </Text>
      </Stack>
      <Grid
        columns={{ initial: 1, lg: 3 }}
        gap={8}
        align="center"
        className="flex-grow items-start justify-center"
      >
        <Stack direction="column" align="center" spacing={4}>
          <HexColorPicker
            color={baseColor}
            onChange={setBaseColor}
            className="!w-64 !h-64"
          />
          <Card className="p-2 font-mono text-lg" style={{ color: baseColor }}>
            {baseColor}
          </Card>
          <Button onClick={handleGenerate} disabled={isLoading} fullWidth size="lg">
            {isLoading ? <Spinner /> : 'Generate Palette'}
          </Button>
          {error && (
            <Text color="danger" size="sm" className="mt-2">
              {error.message}
            </Text>
          )}
        </Stack>
        
        <Stack direction="column" spacing={2} className="w-full max-w-sm">
          <Text as="label" size="sm" color="secondary" className="mb-2">
            Generated Palette:
          </Text>
          {isLoading && palette.length === 0 ? (
            <Stack align="center" justify="center" className="h-48">
              <Spinner size="lg" />
            </Stack>
          ) : (
            <>
              {palette.map((color) => (
                <Card
                  key={color}
                  className="group"
                  style={{ backgroundColor: color }}
                >
                  <Stack
                    direction="row"
                    justify="space-between"
                    align="center"
                    className="p-4"
                  >
                    <Text
                      as="span"
                      weight="bold"
                      className="font-mono text-black/70 mix-blend-overlay"
                    >
                      {color}
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(color)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/30 hover:bg-white/50 text-black backdrop-blur-sm"
                    >
                      Copy
                    </Button>
                  </Stack>
                </Card>
              ))}
              <Stack direction="row" spacing={2} className="mt-2">
                <Button variant="outline" onClick={downloadColorsAsCss} fullWidth>
                  <ArrowDownTrayIcon /> Download CSS
                </Button>
                <Button variant="outline" onClick={downloadCardAsHtml} fullWidth>
                  <ArrowDownTrayIcon /> Download Card
                </Button>
              </Stack>
            </>
          )}
        </Stack>

        {!isLoading && palette.length > 0 && (
          <PreviewCard
            palette={palette}
            colors={previewColors}
            onColorsChange={setPreviewColors}
          />
        )}
      </Grid>
    </Stack>
  );
};
