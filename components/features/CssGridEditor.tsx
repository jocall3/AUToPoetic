/**
 * @fileoverview CssGridEditor - A visual tool for generating CSS Grid layouts.
 * @module components/features/CssGridEditor
 * @description This micro-frontend component provides an interactive interface for designers
 * and developers to visually configure a CSS Grid layout, see a real-time preview,
 * and copy or download the generated CSS code. It adheres to the new abstracted UI framework.
 * @security This component is entirely client-side, processes no user-sensitive data,
 * and has no external API interactions beyond downloading a generated file, posing a minimal security risk.
 * @performance The component is highly performant, utilizing React's state and memoization
 * for efficient re-renders. All calculations are lightweight and occur on the main thread
 * as they do not warrant offloading to a web worker.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { downloadFile } from '../../services/fileUtils';
import {
  Panel,
  Header,
  Title,
  Text,
  Label,
  Slider,
  Button,
  CodeBlock,
  Grid,
  GridItem
} from '../../ui/core'; // Abstracted UI components from the new framework
import { CodeBracketSquareIcon, ArrowDownTrayIcon, ArrowPathIcon } from '../icons';

/**
 * @typedef {object} GridSettings
 * @description Defines the state structure for the CSS grid configuration.
 * @property {number} rows - The number of grid rows.
 * @property {number} cols - The number of grid columns.
 * @property {number} rowGap - The gap between rows in `rem` units.
 * @property {number} colGap - The gap between columns in `rem` units.
 */
interface GridSettings {
  rows: number;
  cols: number;
  rowGap: number;
  colGap: number;
}

/**
 * Initial default settings for the CSS grid editor.
 * @const {GridSettings}
 */
const INITIAL_SETTINGS: GridSettings = { rows: 3, cols: 4, rowGap: 1, colGap: 1 };

/**
 * The CssGridEditor component.
 *
 * @returns {React.ReactElement} The rendered CSS Grid editor component.
 * @example
 * <Window feature={{ id: 'css-grid-editor', ... }}>
 *   <CssGridEditor />
 * </Window>
 */
export const CssGridEditor: React.FC = () => {
  const [settings, setSettings] = useState<GridSettings>(INITIAL_SETTINGS);
  const { addNotification } = useNotification();

  /**
   * Updates a specific grid setting in the component's state.
   * This callback is memoized to prevent unnecessary re-renders of child components.
   * @function
   * @param {keyof GridSettings} key - The setting key to update.
   * @param {number} value - The new numerical value for the setting.
   */
  const handleSettingChange = useCallback((key: keyof GridSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Resets all grid settings to their initial default values.
   * @function
   */
  const handleReset = useCallback(() => {
    setSettings(INITIAL_SETTINGS);
    addNotification('Grid settings have been reset.', 'info');
  }, [addNotification]);

  /**
   * Generates the CSS code string based on the current grid settings.
   * This is memoized to avoid re-computation on every render.
   * @const {string}
   */
  const cssCode = useMemo(() => {
    return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${settings.cols}, 1fr);
  grid-template-rows: repeat(${settings.rows}, 1fr);
  gap: ${settings.rowGap}rem ${settings.colGap}rem;
}`;
  }, [settings]);

  /**
   * Downloads the generated CSS code as a `.css` file.
   * @function
   */
  const handleDownload = useCallback(() => {
    downloadFile(cssCode, 'grid.css', 'text/css');
    addNotification('CSS file downloaded.', 'success');
  }, [cssCode, addNotification]);
  
  /**
   * Renders the visual grid preview based on current settings.
   * @returns {React.ReactElement[]} An array of grid item elements.
   */
  const renderGridItems = () => {
    return Array.from({ length: settings.rows * settings.cols }).map((_, i) => (
      <GridItem
        key={i}
        className="bg-primary/10 rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center text-primary"
      >
        <Text variant="body" className="text-xs opacity-70">{i + 1}</Text>
      </GridItem>
    ));
  };

  return (
    <Panel className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <Header icon={<CodeBracketSquareIcon />} className="mb-6">
        <Title as="h1">CSS Grid Visual Editor</Title>
        <Text variant="secondary">Configure your grid layout and get the generated CSS.</Text>
      </Header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <Panel variant="surface" className="lg:col-span-1 flex flex-col gap-4 border p-6 rounded-lg overflow-y-auto">
          <div className="flex justify-between items-center">
            <Title as="h3" className="text-xl">Controls</Title>
            <Button variant="secondary" size="sm" onClick={handleReset} iconBefore={<ArrowPathIcon />}>
              Reset
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rows-slider">Rows ({settings.rows})</Label>
              <Slider
                id="rows-slider"
                min={1}
                max={12}
                step={1}
                value={settings.rows}
                onValueChange={(value) => handleSettingChange('rows', value[0])}
              />
            </div>
            <div>
              <Label htmlFor="cols-slider">Columns ({settings.cols})</Label>
              <Slider
                id="cols-slider"
                min={1}
                max={12}
                step={1}
                value={settings.cols}
                onValueChange={(value) => handleSettingChange('cols', value[0])}
              />
            </div>
            <div>
              <Label htmlFor="row-gap-slider">Row Gap ({settings.rowGap}rem)</Label>
              <Slider
                id="row-gap-slider"
                min={0}
                max={8}
                step={0.25}
                value={settings.rowGap}
                onValueChange={(value) => handleSettingChange('rowGap', value[0])}
              />
            </div>
            <div>
              <Label htmlFor="col-gap-slider">Column Gap ({settings.colGap}rem)</Label>
              <Slider
                id="col-gap-slider"
                min={0}
                max={8}
                step={0.25}
                value={settings.colGap}
                onValueChange={(value) => handleSettingChange('colGap', value[0])}
              />
            </div>
          </div>

          <div className="flex-grow mt-4 flex flex-col min-h-[150px]">
            <CodeBlock
              content={cssCode}
              language="css"
              title="Generated CSS"
              actions={
                <Button variant="secondary" size="xs" onClick={handleDownload} iconBefore={<ArrowDownTrayIcon />}>
                  Download
                </Button>
              }
            />
          </div>
        </Panel>

        <Panel className="lg:col-span-2 bg-background rounded-lg p-4 border-2 border-dashed border-border">
          <Grid
            style={{
              gridTemplateColumns: `repeat(${settings.cols}, 1fr)`,
              gridTemplateRows: `repeat(${settings.rows}, 1fr)`,
              gap: `${settings.rowGap}rem ${settings.colGap}rem`,
            }}
            className="h-full w-full"
          >
            {renderGridItems()}
          </Grid>
        </Panel>
      </div>
    </Panel>
  );
};
