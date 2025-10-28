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
import { useNotification } from '../../contexts/NotificationContext';
import { downloadFile } from '../../services/fileUtils';
import { CodeBracketSquareIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '../../components/icons';

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
  const { addNotification } = useNotification();
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
    const fullManifest = { ...manifest, icons: [{ "src": "icon-192.png", "type": "image/png", "sizes": "192x192" }, { "src": "icon-512.png", "type": "image/png", "sizes": "512x512" }] };
    return JSON.stringify(fullManifest, null, 2);
  }, [manifest]);

  const handleDownload = useCallback(() => {
    downloadFile(generatedJson, 'manifest.json', 'application/json');
    addNotification('manifest.json has been downloaded.', 'success');
  }, [generatedJson, addNotification]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedJson);
    addNotification('Manifest JSON copied to clipboard!', 'success');
  }, [generatedJson, addNotification]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
            <CodeBracketSquareIcon />
            <span className="ml-3">PWA Manifest Editor</span>
        </h1>
        <p className="text-text-secondary mt-1">Configure and generate the 'manifest.json' file for your PWA.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 flex-grow min-h-0">
        <div className="bg-surface border border-border rounded-lg p-6 xl:col-span-1 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Application Identity</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary">App Name</label>
                <input type="text" name="name" id="name" value={manifest.name} onChange={handleChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2" />
              </div>
              <div>
                <label htmlFor="short_name" className="block text-sm font-medium text-text-secondary">Short Name</label>
                <input type="text" name="short_name" id="short_name" value={manifest.short_name} onChange={handleChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">URLs</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="start_url" className="block text-sm font-medium text-text-secondary">Start URL</label>
                <input type="text" name="start_url" id="start_url" value={manifest.start_url} onChange={handleChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2" />
              </div>
              <div>
                <label htmlFor="scope" className="block text-sm font-medium text-text-secondary">Scope</label>
                <input type="text" name="scope" id="scope" value={manifest.scope} onChange={handleChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Display</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="display" className="block text-sm font-medium text-text-secondary">Display Mode</label>
                <select name="display" id="display" value={manifest.display} onChange={handleChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2">
                  {['standalone', 'fullscreen', 'minimal-ui', 'browser'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="orientation" className="block text-sm font-medium text-text-secondary">Orientation</label>
                <select name="orientation" id="orientation" value={manifest.orientation} onChange={handleChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2">
                  {['any', 'natural', 'landscape', 'portrait'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Colors</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label htmlFor="background_color" className="block text-sm font-medium text-text-secondary mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                        <input type="color" id="background_color-picker" value={manifest.background_color} onChange={handleChange} name="background_color" className="w-10 h-10 p-0 border-none rounded cursor-pointer bg-transparent" />
                        <input type="text" id="background_color" value={manifest.background_color} onChange={handleChange} name="background_color" className="block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 font-mono" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="theme_color" className="block text-sm font-medium text-text-secondary mb-1">Theme Color</label>
                    <div className="flex items-center gap-2">
                        <input type="color" id="theme_color-picker" value={manifest.theme_color} onChange={handleChange} name="theme_color" className="w-10 h-10 p-0 border-none rounded cursor-pointer bg-transparent" />
                        <input type="text" id="theme_color" value={manifest.theme_color} onChange={handleChange} name="theme_color" className="block w-full rounded-md bg-background border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 font-mono" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg xl:col-span-1 flex flex-col min-h-0">
          <header className="flex justify-between items-center p-4 border-b border-border">
            <h3 className="text-lg font-semibold">Generated manifest.json</h3>
            <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600"><ClipboardDocumentIcon className="w-4 h-4"/> Copy</button>
                <button onClick={handleDownload} className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-slate-600"><ArrowDownTrayIcon className="w-4 h-4"/> Download</button>
            </div>
          </header>
          <div className="flex-grow overflow-auto p-4">
            <pre><code className="language-json text-sm">{generatedJson}</code></pre>
          </div>
        </div>

        <div className="hidden xl:flex flex-col items-center justify-center p-6">
          <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
          <HomeScreenPreview manifest={manifest} />
        </div>
      </div>
    </div>
  );
};
