/**
 * @file Renders a responsive testing tool for previewing web pages at various screen sizes.
 * @summary This component provides an interface to input a URL and view it within an iframe that can be resized to common device dimensions.
 * @description The ResponsiveTester is a client-side utility that allows developers and designers to quickly check the responsiveness of a website. It includes presets for popular devices, custom dimension inputs, and a rotation feature. This component is built using the proprietary Core UI library for a consistent look and feel with the rest of the application.
 * @security This component loads external content into an iframe. The `sandbox` attribute is used to mitigate some risks, but users should only load trusted URLs to prevent potential phishing or other web security issues from the loaded content. The component itself does not handle sensitive data.
 * @performance The main performance consideration is the loading time of the external URL within the iframe, which is outside the control of this component. The component's own rendering is lightweight. No significant client-side computation is performed.
 * @example
 * <ResponsiveTester />
 */

import React, { useState, FormEvent } from 'react';
import { EyeIcon } from '../icons.tsx';

/**
 * A dictionary of common device presets for responsive testing.
 * @const
 * @type {Record<string, { width: number | string; height: number | string }>}
 */
const devices = {
    'iPhone 14': { width: 390, height: 844 },
    'Pixel 7': { width: 412, height: 915 },
    'iPad Air': { width: 820, height: 1180 },
    'Surface Pro 7': { width: 912, height: 1368 },
    'Laptop': { width: 1366, height: 768 },
    'Desktop': { width: 1920, height: 1080 },
    'Auto': { width: '100%', height: '100%' },
};

/**
 * @typedef {keyof typeof devices | 'Custom'} DeviceName
 * @description Represents the name of a supported device preset or a custom size.
 */
type DeviceName = keyof typeof devices | 'Custom';

/**
 * @typedef {object} ViewportSize
 * @property {number | string} width - The width of the viewport.
 * @property {number | string} height - The height of the viewport.
 */
type ViewportSize = {
    width: number | string;
    height: number | string;
};

/**
 * Renders the Responsive Tester feature component, allowing users to preview
 * websites at different viewport sizes.
 * @returns {React.ReactElement} The rendered Responsive Tester component.
 */
export const ResponsiveTester: React.FC = () => {
    const [url, setUrl] = useState('https://react.dev');
    const [displayUrl, setDisplayUrl] = useState(url);
    const [size, setSize] = useState<ViewportSize>(devices['Auto']);
    const [currentDevice, setCurrentDevice] = useState<DeviceName>('Auto');

    /**
     * Handles the submission of the URL form. It prefixes with 'https://' if no protocol is present.
     * @param {FormEvent<HTMLFormElement>} e - The form submission event.
     * @performance No significant performance impact. Triggers a re-render of the iframe by updating its `key`.
     */
    const handleUrlSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (/^https?:\/\//.test(url)) {
            setDisplayUrl(url);
        } else {
            setDisplayUrl(`https://${url}`);
        }
    };
    
    /**
     * Sets the viewport size based on a selected device preset.
     * @param {keyof typeof devices} deviceName - The name of the device preset to apply.
     * @security No security implications.
     */
    const handleDeviceChange = (deviceName: keyof typeof devices) => {
        setSize(devices[deviceName]);
        setCurrentDevice(deviceName);
    };

    /**
     * Swaps the width and height of the viewport for orientation testing.
     * This does not apply to 'Auto' size.
     * @returns {void}
     */
    const handleRotate = () => {
        if (typeof size.width === 'number' && typeof size.height === 'number') {
            setSize({ width: size.height, height: size.width });
            setCurrentDevice('Custom');
        }
    };
    
    /**
     * Updates a single dimension (width or height) of the viewport size from user input.
     * @param {'width' | 'height'} dimension - The dimension to update.
     * @param {string} value - The new value for the dimension from the input field.
     */
    const handleDimensionChange = (dimension: 'width' | 'height', value: string) => {
        const numericValue = parseInt(value, 10);
        setSize(prevSize => ({
            ...prevSize,
            [dimension]: isNaN(numericValue) ? '' : numericValue
        }));
        setCurrentDevice('Custom');
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
            <header className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold flex items-center">
                    <EyeIcon />
                    <span className="ml-3">Responsive Tester</span>
                </h1>
                <p className="text-text-secondary mt-1">Preview your web pages at different screen sizes.</p>
            </header>
            
            <div className="flex flex-col gap-4 flex-shrink-0 bg-surface border border-border p-4 rounded-lg shadow-sm">
                <form onSubmit={handleUrlSubmit} className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                        placeholder="https://example.com" 
                        className="flex-grow px-4 py-2 rounded-md bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <button type="submit" className="btn-primary px-6 py-2">Load</button>
                </form>
                
                <div className="flex flex-wrap justify-center items-center gap-2">
                    {(Object.keys(devices) as Array<keyof typeof devices>).map(name => (
                        <button 
                            key={name} 
                            onClick={() => handleDeviceChange(name)} 
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${currentDevice === name ? 'bg-primary/20 text-primary font-semibold' : 'bg-background hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                        >
                            {name}
                        </button>
                    ))}
                    <div className="flex items-center gap-1 ml-4 border-l border-border pl-4">
                        <input 
                            type="number" 
                            value={typeof size.width === 'number' ? size.width : ''} 
                            onChange={e => handleDimensionChange('width', e.target.value)} 
                            className="w-20 px-2 py-1 bg-background border border-border rounded-md text-sm" 
                            placeholder="width"
                        />
                        <span className="text-sm text-text-secondary">×</span>
                        <input 
                            type="number" 
                            value={typeof size.height === 'number' ? size.height : ''} 
                            onChange={e => handleDimensionChange('height', e.target.value)} 
                            className="w-20 px-2 py-1 bg-background border border-border rounded-md text-sm" 
                            placeholder="height"
                        />
                    </div>
                    <button 
                        onClick={handleRotate} 
                        className="px-3 py-1 rounded-md text-sm bg-background hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Rotate"
                        disabled={typeof size.width !== 'number'}
                    >
                        ðŸ”„
                    </button>
                </div>
            </div>
            
            <div className="flex-grow mt-4 bg-gray-200 dark:bg-black/20 rounded-lg p-4 overflow-auto flex items-center justify-center">
                <div 
                    className="flex-shrink-0 mx-auto transition-all duration-300 ease-in-out shadow-2xl bg-white"
                    style={{ 
                        width: size.width, 
                        height: size.height,
                        border: typeof size.width === 'number' ? '8px solid #333' : 'none',
                        borderRadius: typeof size.width === 'number' ? '20px' : '0'
                    }}
                >
                    <iframe
                        key={displayUrl}
                        src={displayUrl}
                        className="w-full h-full bg-white"
                        style={{ borderRadius: typeof size.width === 'number' ? '12px' : '0' }}
                        title="Responsive Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            </div>
        </div>
    );
};
