/**
 * @file PwaManifestEditor.tsx
 * @module PwaManifestEditor
 * @description This module provides a UI for creating and editing a Progressive Web App (PWA) manifest file.
 * It allows users to configure various manifest properties and provides a live preview of the app's appearance
 * on a simulated home screen, along with the generated `manifest.json` code.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/Manifest | MDN Web App Manifest}
 * @security This component generates a JSON file based on user input. The generated content is intended for
 * download and use as a configuration file. It does not execute any user-provided strings, mitigating script injection risks.
 * All inputs are treated as string values for the manifest.
 * @performance The component uses `React.useMemo` to prevent re-stringifying the manifest JSON on every render,
 * optimizing performance during user input. The home screen preview is a lightweight CSS-based simulation and should have minimal performance impact.
 */

import React, { useState, useMemo, useCallback } from 'react';

// Assumed imports from the new proprietary UI framework
import { Page } from '../../core_ui/Layout';
import { Header } from '../../core_ui/Header';
import { ContentGrid } from '../../core_ui/Layout';
import { Card, CardHeader, CardContent } from '../../composite_ui/Card';
import { FormSection } from '../../composite_ui/Form';
import { Input, Select, ColorInput } from '../../core_ui/Input';
import { Button } from '../../core_ui/Button';
import { CodeBlock } from '../../core_ui/CodeBlock';
import { CodeBracketSquareIcon, ArrowDownTrayIcon } from '../../core_ui/icons';

// Assumed import from the new abstracted service layer
import { downloadService } from '../../services/infrastructure/download.adapter';

/**
 * @interface ManifestData
 * @description Defines the structure of the PWA manifest data being edited.
 * @property {string} name - The full name of the web application.
 * @property {string} short_name - A shorter name for the application, used on the home screen.
 * @property {string} start_url - The URL that loads when the user launches the application from the home screen.
 * @property {string} scope - The navigation scope of this web application's context.
 * @property {'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'} display - The preferred display mode for the web application.
 * @property {'any' | 'natural' | 'landscape' | 'portrait'} orientation - The default orientation for the web application.
 * @property {string} background_color - The color of the splash screen background.
 * @property {string} theme_color - The color of the application's theme, affecting UI elements like the status bar.
 */
interface ManifestData {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait';
  background_color: string;
  theme_color: string;
}

/**
 * @interface HomeScreenPreviewProps
 * @description Props for the HomeScreenPreview component.
 * @property {ManifestData} manifest - The current manifest data to render in the preview.
 */
interface HomeScreenPreviewProps {
  manifest: ManifestData;
}

/**
 * @function HomeScreenPreview
 * @description A visual component that simulates how a PWA icon and splash screen might appear on a mobile device's home screen.
 * @param {HomeScreenPreviewProps} props - The component props.
 * @returns {React.ReactElement} A React element simulating a mobile phone screen.
 * @example
 * <HomeScreenPreview manifest={myManifestData} />
 */
const HomeScreenPreview: React.FC<HomeScreenPreviewProps> = ({ manifest }) => (
  <div className="w-full max-w-xs mx-auto flex flex-col items-center">
    <div className="w-72 h-[550px] bg-gray-800 dark:bg-black rounded-[40px] border-[10px] border-black shadow-2xl p-4 flex flex-col">
      <div className="flex-shrink-0 h-6 flex justify-between items-center px-4">
        <span className="text-xs font-bold" style={{ color: manifest.theme_color }}>9:41</span>
        <div className="w-16 h-4 bg-black rounded-full" />
        <span className="text-xs font-bold" style={{ color: manifest.theme_color }}>100%</span>
      </div>
      <div className="flex-grow grid grid-cols-4 gap-4 p-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md" style={{ backgroundColor: manifest.background_color }}>
            <span style={{ color: manifest.theme_color }}>{manifest.short_name ? manifest.short_name[0] : ''}</span>
          </div>
          <p className="text-xs text-center text-white truncate w-full">{manifest.short_name}</p>
        </div>
      </div>
    </div>
    <p className="text-xs text-text-secondary mt-2 text-center">Home Screen Preview</p>
  </div>
);

/**
 * @function PwaManifestEditor
 * @description A feature component that provides a user-friendly interface for creating and editing a
 * Progressive Web App (PWA) `manifest.json` file. It includes form inputs for all major manifest properties,
 * a live preview of the app icon on a simulated home screen, and a code viewer for the generated JSON.
 * @returns {React.ReactElement} The PWA Manifest Editor component.
 * @example
 * <PwaManifestEditor />
 */
export const PwaManifestEditor: React.FC = () => {
  const [manifest, setManifest] = useState<ManifestData>({
    name: 'DevCore Progressive Web App',
    short_name: 'DevCore',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#F5F7FA',
    theme_color: '#0047AB',
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setManifest(prev => ({ ...prev, [name]: value }));
  }, []);

  const generatedJson = useMemo(() => {
    /** @performance JSON.stringify can be expensive for very large objects, but for a manifest file, this is negligible. useMemo prevents re-calculation on every render. */
    const fullManifest = { ...manifest, icons: [{ "src": "icon-192.png", "type": "image/png", "sizes": "192x192" }, { "src": "icon-512.png", "type": "image/png", "sizes": "512x512" }] };
    return JSON.stringify(fullManifest, null, 2);
  }, [manifest]);

  const handleDownload = useCallback(() => {
    downloadService.downloadAsFile(generatedJson, 'manifest.json', 'application/json');
  }, [generatedJson]);

  return (
    <Page>
      <Header
        icon={<CodeBracketSquareIcon />}
        title="PWA Manifest Editor"
        subtitle="Configure and generate the 'manifest.json' file for your PWA."
      />
      <ContentGrid className="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 overflow-y-auto">
          <CardHeader title="Configuration" />
          <CardContent className="flex flex-col gap-4">
            <FormSection title="Application Identity">
              <Input label="App Name" name="name" value={manifest.name} onChange={handleChange} />
              <Input label="Short Name" name="short_name" value={manifest.short_name} onChange={handleChange} />
            </FormSection>
            <FormSection title="URLs">
              <Input label="Start URL" name="start_url" value={manifest.start_url} onChange={handleChange} />
              <Input label="Scope" name="scope" value={manifest.scope} onChange={handleChange} />
            </FormSection>
            <FormSection title="Display">
              <Select label="Display Mode" name="display" value={manifest.display} onChange={handleChange} options={['standalone', 'fullscreen', 'minimal-ui', 'browser']} />
              <Select label="Orientation" name="orientation" value={manifest.orientation} onChange={handleChange} options={['any', 'natural', 'landscape', 'portrait']} />
            </FormSection>
            <FormSection title="Colors">
              <div className="flex gap-4">
                <ColorInput label="Background Color" name="background_color" value={manifest.background_color} onChange={handleChange} />
                <ColorInput label="Theme Color" name="theme_color" value={manifest.theme_color} onChange={handleChange} />
              </div>
            </FormSection>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 flex flex-col">
          <CardHeader title="Generated manifest.json">
            <Button onClick={handleDownload} icon={<ArrowDownTrayIcon />} variant="secondary">Download</Button>
          </CardHeader>
          <CardContent className="flex-grow min-h-0">
            <CodeBlock language="json" code={generatedJson} className="h-full" />
          </CardContent>
        </Card>

        <div className="hidden xl:flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Live Preview</h3>
          <HomeScreenPreview manifest={manifest} />
        </div>
      </ContentGrid>
    </Page>
  );
};
