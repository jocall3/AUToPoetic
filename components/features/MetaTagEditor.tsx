/**
 * @file MetaTagEditor.tsx
 * @module components/features/MetaTagEditor
 * @description A feature component for generating and previewing SEO and social media meta tags.
 * It provides a user interface for inputting metadata and displays the generated HTML tags
 * along with a live preview of a social media card.
 * @see SocialCardPreview
 * @security This component handles user input but renders it as plain text or within safe component properties.
 * The `generatedHtml` is displayed within a `CodeBlock` component which should handle escaping, not `dangerouslySetInnerHTML`.
 * This prevents XSS vulnerabilities.
 * @performance The generation of HTML meta tags is memoized with `useMemo` and only recalculates when metadata changes,
 * ensuring efficient re-renders. The live preview is also updated efficiently via React's state management.
 */

import React, { useState, useMemo, useCallback } from 'react';

// Proprietary UI Framework Components
import { Button } from '@/ui/core/Button';
import { Input, TextArea } from '@/ui/core/Input';
import { Select } from '@/ui/core/Select';
import { CodeBlock } from '@/ui/composite/CodeBlock';
import { Typography } from '@/ui/core/Typography';
import { Card, CardMedia, CardContent } from '@/ui/composite/Card';
import { Grid, GridItem } from '@/ui/core/Layout';

// Icons and Contexts
import { CodeBracketSquareIcon } from '../icons.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';

/**
 * @interface MetaData
 * @description Defines the structure for social media and SEO metadata.
 * This data is used to generate HTML meta tags and to display a live preview.
 * @property {string} title - The main title of the page, used in `<title>` and `og:title`.
 * @property {string} description - A short description of the page's content.
 * @property {string} image - The URL for the social sharing image (og:image, twitter:image).
 * @property {string} url - The canonical URL of the page.
 * @property {'summary' | 'summary_large_image' | 'app' | 'player'} twitterCard - The type of Twitter card.
 * @property {string} twitterCreator - The Twitter @username of the content creator.
 */
interface MetaData {
    title: string;
    description: string;
    image: string;
    url: string;
    twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
    twitterCreator: string;
}

/**
 * @function SocialCardPreview
 * @description A React component that renders a preview of how a social media card will look based on the provided metadata.
 * @param {object} props - The component props.
 * @param {MetaData} props.meta - The metadata to render in the preview.
 * @returns {React.ReactElement} The rendered social card preview component.
 * @example
 * const meta = { title: 'My Page', description: 'A great page.', url: 'https://example.com', image: '', twitterCard: 'summary', twitterCreator: '' };
 * <SocialCardPreview meta={meta} />
 * @security
 * The component sanitizes the displayed URL by parsing it safely. It does not render any user-provided HTML, mitigating XSS risks.
 * The image `onError` handler prevents broken image icons from showing.
 * @performance
 * The URL parsing is a lightweight operation and is memoized within the component's render cycle, so it has minimal performance impact.
 */
const SocialCardPreview: React.FC<{ meta: MetaData }> = ({ meta }) => {
    const displayHostname = useMemo(() => {
        try {
            if (!meta.url) return 'example.com';
            const fullUrl = meta.url.startsWith('http') ? meta.url : `https://${meta.url}`;
            return new URL(fullUrl).hostname;
        } catch (error) {
            console.error('Invalid URL for social card preview:', meta.url);
            return 'invalid-url.com';
        }
    }, [meta.url]);

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardMedia className="h-52 flex items-center justify-center">
                {meta.image ? (
                    <img 
                        src={meta.image} 
                        alt="Social card preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-text-secondary">Image failed to load</span>'; }} 
                    />
                ) : (
                    <Typography variant="body2" className="text-text-secondary">Image Preview</Typography>
                )}
            </CardMedia>
            <CardContent>
                <Typography variant="caption" className="text-text-secondary truncate">{displayHostname}</Typography>
                <Typography variant="h6" as="h3" className="truncate mt-1">{meta.title || 'Your Title Here'}</Typography>
                <Typography variant="body2" className="text-text-secondary mt-1 line-clamp-2">{meta.description || 'A concise description of your content will appear here.'}</Typography>
            </CardContent>
        </Card>
    );
};

/**
 * @function MetaTagEditor
 * @description The main feature component for generating and previewing SEO and social media meta tags.
 * @returns {React.ReactElement} The rendered meta tag editor component.
 * @see SocialCardPreview
 */
export const MetaTagEditor: React.FC = () => {
    const { addNotification } = useNotification();
    const [meta, setMeta] = useState<MetaData>({
        title: 'DevCore AI Toolkit',
        description: 'The ultimate toolkit for modern developers, powered by Gemini.',
        image: 'https://storage.googleapis.com/maker-studio-project-images-prod/programming_power_on_a_laptop_3a8f0bb1_39a9_4c2b_81f0_a74551480f2c.png',
        url: 'https://devcore.example.com',
        twitterCard: 'summary_large_image',
        twitterCreator: '@DevCoreAI',
    });

    /**
     * @function handleChange
     * @description Handles changes to form fields and updates the component's state.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - The change event.
     * @returns {void}
     */
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMeta(prevMeta => ({ ...prevMeta, [name]: value }));
    }, []);

    /**
     * @constant generatedHtml
     * @description Memoized string of HTML meta tags generated from the current state.
     * @returns {string} The complete block of HTML meta tags.
     */
    const generatedHtml = useMemo(() => {
        const tags = [
            '<!-- Primary Meta Tags -->',
            `<title>${meta.title}</title>`,
            `<meta name="title" content="${meta.title}" />`,
            `<meta name="description" content="${meta.description}" />`,
            '\n<!-- Open Graph / Facebook -->',
            '<meta property="og:type" content="website" />',
            `<meta property="og:url" content="${meta.url}" />`,
            `<meta property="og:title" content="${meta.title}" />`,
            `<meta property="og:description" content="${meta.description}" />`,
            `<meta property="og:image" content="${meta.image}" />`,
            '\n<!-- Twitter -->',
            `<meta property="twitter:card" content="${meta.twitterCard}" />`,
            `<meta property="twitter:url" content="${meta.url}" />`,
            `<meta property="twitter:title" content="${meta.title}" />`,
            `<meta property="twitter:description" content="${meta.description}" />`,
            `<meta property="twitter:image" content="${meta.image}" />`,
        ];
        if (meta.twitterCreator) {
            tags.push(`<meta property="twitter:creator" content="${meta.twitterCreator}" />`);
        }
        return tags.join('\n');
    }, [meta]);

    /**
     * @function handleCopy
     * @description Copies the generated HTML to the clipboard and shows a notification.
     * @returns {void}
     */
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(generatedHtml);
        addNotification('Meta tags copied to clipboard!', 'success');
    }, [generatedHtml, addNotification]);

    return (
        <div className="h-full p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <Typography variant="h1" as="h1" className="flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">Meta Tag Editor</span>
                </Typography>
                <Typography variant="body1" className="text-text-secondary mt-1">
                    Generate SEO & social media meta tags with a live preview.
                </Typography>
            </header>
            <Grid container spacing={3} className="flex-grow min-h-0">
                <GridItem xs={12} md={6} lg={4} className="flex flex-col gap-4 bg-surface border border-border p-6 rounded-lg overflow-y-auto">
                    <Typography variant="h3" as="h2">Metadata</Typography>
                    <Input name="title" label="Title" value={meta.title} onChange={handleChange} />
                    <TextArea name="description" label="Description" value={meta.description} onChange={handleChange} rows={3} />
                    <Input name="url" label="Canonical URL" value={meta.url} onChange={handleChange} />
                    <Input name="image" label="Social Image URL" value={meta.image} onChange={handleChange} />
                    <Select
                        name="twitterCard"
                        label="Twitter Card Type"
                        value={meta.twitterCard}
                        onChange={handleChange}
                        options={[
                            { value: 'summary', label: 'Summary' },
                            { value: 'summary_large_image', label: 'Summary with Large Image' },
                            { value: 'app', label: 'App' },
                            { value: 'player', label: 'Player' },
                        ]}
                    />
                    <Input name="twitterCreator" label="Twitter Creator Handle" value={meta.twitterCreator} onChange={handleChange} placeholder="@username" />
                </GridItem>
                <GridItem xs={12} md={6} lg={4} className="flex flex-col">
                    <Typography variant="h5" as="h2" className="mb-2">Generated HTML</Typography>
                    <div className="relative flex-grow min-h-[200px]">
                        <CodeBlock code={generatedHtml} language="html" className="h-full" />
                        <Button onClick={handleCopy} size="sm" className="absolute top-2 right-2">Copy</Button>
                    </div>
                </GridItem>
                <GridItem xs={12} lg={4} className="hidden lg:flex flex-col items-center">
                    <Typography variant="h5" as="h2" className="mb-2">Live Preview</Typography>
                    <SocialCardPreview meta={meta} />
                </GridItem>
            </Grid>
        </div>
    );
};
};
