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
import { 
    Container, 
    FeatureHeader, 
    Grid, 
    Card,
    Stack,
    SelectField,
    CodeBlock,
    Typography,
    Divider,
    Box,
} from '../../ui-framework/components'; // Hypothetical UI Framework import

/**
 * @constant POPULAR_FONTS
 * @description A curated list of popular and high-quality fonts from Google Fonts for pairing.
 * @type {string[]}
 */
const POPULAR_FONTS: string[] = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito', 'Merriweather',
    'Playfair Display', 'Lora', 'Noto Sans', 'Ubuntu', 'PT Sans', 'Slabo 27px', 'Inter', 'Work Sans', 'Karla'
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
        <Stack direction="column" gap={1}>
            <Typography variant="label">{label}</Typography>
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
        <Container variant="feature">
            <FeatureHeader
                icon={<TypographyLabIcon />}
                title="Typography Lab"
                subtitle="Preview font pairings and get the necessary CSS rules to implement them."
            />
            <Grid columns={3} gap={6} className="flex-grow min-h-0">
                <Grid.Item colSpan={1}>
                    <Card className="h-full flex flex-col">
                        <Card.Header title="Controls" />
                        <Card.Body className="flex-grow overflow-y-auto">
                            <Stack direction="column" gap={6}>
                                <Stack direction="column" gap={4}>
                                    <FontSelector label="Heading Font" value={headingFont} onChange={setHeadingFont} />
                                    <FontSelector label="Body Font" value={bodyFont} onChange={setBodyFont} />
                                </Stack>
                                <Divider />
                                <Stack direction="column" gap={4}>
                                    <Typography variant="h6">CSS Rules</Typography>
                                    <CodeSnippet label="Heading Font Import" code={headingImport} />
                                    <CodeSnippet label="Heading CSS Rule" code={headingRule} />
                                    <CodeSnippet label="Body Font Import" code={bodyImport} />
                                    <CodeSnippet label="Body CSS Rule" code={bodyRule} />
                                </Stack>
                            </Stack>
                        </Card.Body>
                    </Card>
                </Grid.Item>
                <Grid.Item colSpan={2}>
                    <Box className="bg-surface border border-border rounded-lg p-8 h-full overflow-y-auto">
                        <Typography variant="h2" as="h1" style={{ fontFamily: `'${headingFont}', sans-serif`, fontWeight: 700 }}>
                            The Quick Brown Fox Jumps Over the Lazy Dog
                        </Typography>
                        <Typography variant="body1" className="mt-4" style={{ fontFamily: `'${bodyFont}', sans-serif`, fontSize: '1.125rem', lineHeight: '1.75' }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
                        </Typography>
                         <Typography variant="body2" className="mt-6" style={{ fontFamily: `'${bodyFont}', sans-serif`}}>
                            Duis Sempere. Duis ac tellus. Curabitur sodales. Phasellus blandit. Vestibulum nisi. Proin vel arcu vitae lorem consectetuer consectetuer. Sed consectetuer, dolor ac tempus iaculis, neque massa viverra lorem, eget semper diam metus et massa.
                        </Typography>
                    </Box>
                </Grid.Item>
            </Grid>
        </Container>
    );
};
