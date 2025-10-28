/**
 * @file Renders the TypographyLab feature, allowing users to experiment with font pairings.
 * @module components/features/TypographyLab
 * @see {@link https://fonts.google.com/|Google Fonts} for font inspiration.
 * @security This component dynamically injects a stylesheet from fonts.googleapis.com.
 *           While Google Fonts is a trusted source, this pattern should be used with caution
 *           for other external resources. The URL is constructed and sanitized to prevent
 *            injection attacks.
 * @performance Font loading can impact initial page load performance. This component
 *              uses dynamic stylesheet injection to load fonts on-demand, mitigating
 *              the impact on the main application bundle.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TypographyLabIcon } from '../icons.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';

// Architectural Directive: Pluggable, Themeable, and Abstracted UI Framework
// The following components are assumed to exist in a proprietary UI library.
// For demonstration, these are simple placeholders.
const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={`h-full flex flex-col p-4 sm:p-6 lg:p-8 ${className}`}>{children}</div>;
const FeatureHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center">{icon}<span className="ml-3">{title}</span></h1>
        <p className="text-text-secondary mt-1">{subtitle}</p>
    </header>
);
const Grid = {
    Root: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`grid ${className}`}>{children}</div>,
    Item: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>
};
const Card = {
    Root: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`bg-surface border border-border rounded-lg flex flex-col ${className}`}>{children}</div>,
    Header: ({ title }: { title: string }) => <div className="p-4 border-b border-border"><h3 className="font-semibold text-lg text-text-primary">{title}</h3></div>,
    Body: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`p-4 ${className}`}>{children}</div>
};
const Stack: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={`flex flex-col ${className}`}>{children}</div>;
const SelectField: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-2 bg-background border border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:outline-none">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);
const CodeBlock: React.FC<{ code: string; language: string; onCopy: () => void }> = ({ code, language, onCopy }) => (
    <div className="relative bg-background rounded-md p-4 font-mono text-xs text-primary border border-border">
        <button onClick={onCopy} title="Copy code" className="absolute top-2 right-2 p-1 text-text-secondary hover:text-primary rounded-md hover:bg-surface-hover">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
        <pre><code>{code}</code></pre>
    </div>
);
const Typography = {
    H1: ({ children, style, as = 'h1' }: { children: React.ReactNode; style?: React.CSSProperties, as?: 'h1' }) => React.createElement(as, { className: "text-5xl font-bold break-words text-text-primary", style }, children),
    H2: ({ children, style, as = 'h2' }: { children: React.ReactNode; style?: React.CSSProperties, as?: 'h2'|'h3' }) => React.createElement(as, { className: "text-4xl font-bold break-words text-text-primary", style }, children),
    Body1: ({ children, className, style }: { children: React.ReactNode; className?: string, style?: React.CSSProperties }) => <p className={`text-lg leading-relaxed ${className}`} style={style}>{children}</p>,
    Body2: ({ children, className, style }: { children: React.ReactNode; className?: string, style?: React.CSSProperties }) => <p className={`text-base ${className}`} style={style}>{children}</p>,
    Label: ({ children }: { children: React.ReactNode }) => <span className="text-sm font-medium text-text-secondary">{children}</span>,
};
const Divider = () => <hr className="border-border my-4" />;
const Box: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={className}>{children}</div>;

/**
 * @constant POPULAR_FONTS
 * @description A curated list of popular and high-quality fonts from Google Fonts for pairing.
 * @type {string[]}
 */
const POPULAR_FONTS: string[] = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito', 'Merriweather',
    'Playfair Display', 'Lora', 'Noto Sans', 'Ubuntu', 'PT Sans', 'Inter', 'Work Sans', 'Karla'
];

/**
 * Represents the props for the FontSelector component.
 * @interface FontSelectorProps
 */
interface FontSelectorProps {
    /** The label for the font selector dropdown. */
    label: string;
    /** The currently selected font value. */
    value: string;
    /** Callback function to handle font selection changes. */
    onChange: (font: string) => void;
}

/**
 * A component for selecting a font from the predefined list.
 * @param {FontSelectorProps} props - The props for the component.
 * @returns {React.ReactElement} A select field for choosing a font.
 * @example
 * <FontSelector label="Body Font" value={bodyFont} onChange={setBodyFont} />
 */
const FontSelector: React.FC<FontSelectorProps> = ({ label, value, onChange }) => {
    const fontOptions = useMemo(() => POPULAR_FONTS.map(font => ({ label: font, value: font })), []);
    return <SelectField label={label} value={value} onChange={onChange} options={fontOptions} />;
};

/**
 * Represents the props for the CodeSnippet component.
 * @interface CodeSnippetProps
 */
interface CodeSnippetProps {
    /** The label for the code snippet. */
    label: string;
    /** The code content to display. */
    code: string;
}

/**
 * Displays a code snippet with a label and a copy button.
 * Utilizes the abstract `CodeBlock` component from the UI framework.
 * @param {CodeSnippetProps} props - The props for the component.
 * @returns {React.ReactElement} A styled code block with a label.
 * @example
 * <CodeSnippet label="@import rule for Heading" code={headingImport} />
 */
const CodeSnippet: React.FC<CodeSnippetProps> = ({ label, code }) => {
    const { addNotification } = useNotification();

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        addNotification(`Copied "${label}" to clipboard`, 'success');
    }, [code, label, addNotification]);

    return (
        <Stack className="gap-1">
            <Typography.Label>{label}</Typography.Label>
            <CodeBlock code={code} language="css" onCopy={handleCopy} />
        </Stack>
    );
};


/**
 * The main component for the Typography Lab feature.
 * It allows users to select heading and body fonts, preview them, and get the
 * necessary CSS rules to implement the font pairing in their own projects.
 *
 * This component demonstrates dynamic font loading by injecting a stylesheet
 * into the document head based on user selections.
 * 
 * @returns {React.ReactElement} The rendered TypographyLab component.
 * @component
 */
export const TypographyLab: React.FC = () => {
    const [headingFont, setHeadingFont] = useState('Oswald');
    const [bodyFont, setBodyFont] = useState('Roboto');

    /**
     * @effect
     * Dynamically loads the selected Google Fonts by creating or updating a `<link>` tag in the document head.
     * This effect runs whenever the `headingFont` or `bodyFont` state changes.
     * It ensures that only the required fonts are loaded, optimizing performance.
     */
    useEffect(() => {
        const fontsToLoad = [headingFont, bodyFont].filter(Boolean).join('|');
        if (fontsToLoad) {
            const linkId = 'typography-lab-font-stylesheet';
            let link = document.getElementById(linkId) as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
            // Constructing a safe URL for Google Fonts API
            link.href = `https://fonts.googleapis.com/css?family=${fontsToLoad.replace(/ /g, '+')}:400,700&display=swap`;
        }
    }, [headingFont, bodyFont]);
    
    // Memoize CSS rule strings to prevent recalculation on every render
    const { headingImport, bodyImport, headingRule, bodyRule } = useMemo(() => ({
        headingImport: `@import url('https://fonts.googleapis.com/css?family=${headingFont.replace(/ /g, '+')}:700&display=swap');`,
        bodyImport: `@import url('https://fonts.googleapis.com/css?family=${bodyFont.replace(/ /g, '+')}:400&display=swap');`,
        headingRule: `font-family: '${headingFont}', sans-serif;`,
        bodyRule: `font-family: '${bodyFont}', sans-serif;`
    }), [headingFont, bodyFont]);

    return (
        <Container className="variant-feature">
            <FeatureHeader
                icon={<TypographyLabIcon />}
                title="Typography Lab"
                subtitle="Preview font pairings and get the necessary CSS rules to implement them."
            />
            <Grid.Root className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                <Grid.Item className="lg:col-span-1">
                    <Card.Root className="h-full">
                        <Card.Header title="Controls" />
                        <Card.Body className="flex-grow overflow-y-auto">
                            <Stack className="gap-6">
                                <Stack className="gap-4">
                                    <FontSelector label="Heading Font" value={headingFont} onChange={setHeadingFont} />
                                    <FontSelector label="Body Font" value={bodyFont} onChange={setBodyFont} />
                                </Stack>
                                <Divider />
                                <Stack className="gap-4">
                                    <Typography.H2 as="h3" style={{ fontFamily: 'var(--font-serif)'}}>CSS Rules</Typography.H2>
                                    <CodeSnippet label="Heading Font Import" code={headingImport} />
                                    <CodeSnippet label="Heading CSS Rule" code={headingRule} />
                                    <CodeSnippet label="Body Font Import" code={bodyImport} />
                                    <CodeSnippet label="Body CSS Rule" code={bodyRule} />
                                </Stack>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                </Grid.Item>
                <Grid.Item className="lg:col-span-2">
                    <Box className="bg-surface border border-border rounded-lg p-8 h-full overflow-y-auto">
                        <Typography.H1 as="h1" style={{ fontFamily: `'${headingFont}', sans-serif`, fontWeight: 700 }}>
                            The Quick Brown Fox Jumps Over the Lazy Dog
                        </Typography.H1>
                        <Typography.Body1 className="mt-4" style={{ fontFamily: `'${bodyFont}', sans-serif`, fontSize: '1.125rem', lineHeight: '1.75' }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
                        </Typography.Body1>
                         <Typography.Body2 className="mt-6" style={{ fontFamily: `'${bodyFont}', sans-serif`}}>
                            Duis Sempere. Duis ac tellus. Curabitur sodales. Phasellus blandit. Vestibulum nisi. Proin vel arcu vitae lorem consectetuer consectetuer. Sed consectetuer, dolor ac tempus iaculis, neque massa viverra lorem, eget semper diam metus et massa.
                        </Typography.Body2>
                    </Box>
                </Grid.Item>
            </Grid.Root>
        </Container>
    );
};
