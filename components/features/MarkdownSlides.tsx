/**
 * @module components/features/MarkdownSlides
 * @description This module provides a feature component that converts Markdown text into a presentable slideshow format.
 * It adheres to the new architectural directives by offloading Markdown parsing to a web worker
 * and utilizing the new Core UI component library.
 * @see @core/ui/Container
 * @see @core/ui/TextArea
 * @see @/services/WorkerPoolManager
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { useService } from '../../hooks/useService';
import type { WorkerPoolManager } from '../../services/worker/workerPoolManager';

import { Panel, Grid, TextArea, Button, Icon, LoadingSpinner as CoreSpinner, Header, Title, Paragraph } from '../../components/core-ui';
import { PhotoIcon, ArrowLeftIcon, ArrowRightIcon, ArrowsPointingOutIcon } from '../icons';

/**
 * @const {string} exampleMarkdown
 * @description Default Markdown content to populate the editor on initial load.
 * This serves as an example for users to understand the slide separation syntax (`---`).
 */
const exampleMarkdown = `# Slide 1: Welcome

This is a slide deck generated from Markdown.

- Use standard markdown syntax
- Like lists, headers, and **bold** text.

---

# Slide 2: Features

Navigate using the buttons below or your arrow keys in fullscreen mode.

\

### Code blocks work too!

\`\`\`javascript
import { workerPoolManager } from './services';

async function parseMarkdown(markdown) {
  // Parsing is offloaded to a worker thread!
  return workerPoolManager.enqueueTask('markdown-to-html', { markdown });
}
\`\`\`

---

# Slide 3: The End

Easy to create and present complex ideas.
`;

/**
 * A feature component that allows users to write Markdown and present it as a slideshow.
 * Each slide is separated by a markdown horizontal rule (`---`).
 * The component offloads the heavy lifting of Markdown-to-HTML conversion to a dedicated web worker pool.
 *
 * @function MarkdownSlides
 * @returns {React.ReactElement} The rendered MarkdownSlides component.
 * @example
 * <Window feature={{id: 'markdown-slides', name: 'Markdown Slides', ...}} />
 * 
 * @performance
 * Markdown parsing can be a CPU-intensive task for large documents. To prevent blocking the main UI thread,
 * this component utilizes the `WorkerPoolManager` to delegate the `marked.parse` operation to a background worker.
 * This ensures the UI remains responsive and smooth, even when editing and switching between large, complex slides.
 * 
 * @security
 * This component uses `dangerouslySetInnerHTML` to render the HTML generated from Markdown. This is a potential
 * cross-site scripting (XSS) vulnerability if the Markdown source is untrusted. The mitigation strategy is that the
 * 'markdown-to-html' worker is responsible for sanitizing the output HTML (e.g., using DOMPurify or a similar library)
 * before returning the result to the main thread. The main thread should always treat data from workers as potentially untrusted.
 */
export const MarkdownSlides: React.FC = () => {
    /**
     * @state {string} markdown - The raw Markdown text entered by the user.
     */
    const [markdown, setMarkdown] = useState(exampleMarkdown);
    /**
     * @state {number} currentSlide - The zero-based index of the currently displayed slide.
     */
    const [currentSlide, setCurrentSlide] = useState(0);
    /**
     * @state {string} slideHtml - The sanitized HTML string of the current slide, ready for rendering.
     */
    const [slideHtml, setSlideHtml] = useState<string>('');
    /**
     * @state {boolean} isParsing - A loading state flag, true when the web worker is processing the Markdown.
     */
    const [isParsing, setIsParsing] = useState(false);

    /**
     * @ref {React.RefObject<HTMLDivElement>} presentationRef - A ref attached to the presentation panel for fullscreen functionality.
     */
    const presentationRef = useRef<HTMLDivElement>(null);

    /**
     * @description Accesses the WorkerPoolManager service via the dependency injection hook.
     * @type {WorkerPoolManager | undefined}
     */
    const workerPoolManager = useService<WorkerPoolManager>('workerPool');

    /**
     * @description Memoized array of slide content strings, split from the main markdown text.
     * @type {string[]}
     */
    const slides = useMemo(() => markdown.split(/^-{3,}\s*$/m), [markdown]);

    /**
     * @effect
     * @description This effect triggers whenever the current slide index or the list of slides changes.
     * It sends the Markdown content of the current slide to the web worker for parsing and sanitization.
     */
    useEffect(() => {
        const parseSlideContent = async () => {
            if (!workerPoolManager) {
                console.error('WorkerPoolManager service is not available.');
                setSlideHtml('<p style="color:red;">Error: Markdown parsing service is unavailable.</p>');
                return;
            }
            setIsParsing(true);
            const currentSlideContent = slides[currentSlide] || '';
            try {
                const html = await workerPoolManager.enqueueTask<string>('markdown-to-html', { markdown: currentSlideContent });
                setSlideHtml(html);
            } catch (error) {
                console.error('Failed to parse markdown in worker:', error);
                setSlideHtml('<p style="color:red;">Error: Failed to render slide content.</p>');
            } finally {
                setIsParsing(false);
            }
        };

        parseSlideContent();
    }, [slides, currentSlide, workerPoolManager]);

    /**
     * @function goToNext
     * @description Advances to the next slide, clamping to the last slide index.
     * @returns {void}
     */
    const goToNext = useCallback(() => {
        setCurrentSlide(s => Math.min(s + 1, slides.length - 1));
    }, [slides.length]);

    /**
     * @function goToPrev
     * @description Moves to the previous slide, clamping to the first slide index.
     * @returns {void}
     */
    const goToPrev = useCallback(() => {
        setCurrentSlide(s => Math.max(s - 1, 0));
    }, []);

    /**
     * @function handleFullscreen
     * @description Requests to view the presentation panel in fullscreen mode.
     * @returns {void}
     */
    const handleFullscreen = useCallback(() => {
        presentationRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }, []);
    
    /**
     * @effect
     * @description Attaches and cleans up a keydown event listener to allow slide navigation
     * with arrow keys when in fullscreen mode.
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.fullscreenElement === presentationRef.current) {
                if (e.key === 'ArrowRight' || e.key === ' ') goToNext();
                if (e.key === 'ArrowLeft') goToPrev();
                 if (e.key === 'Escape') document.exitFullscreen();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev]);

    return (
        <Panel fullHeight isPadded={false} className="flex flex-col text-text-primary">
            <Header>
                <Icon icon={PhotoIcon} />
                <Title>Markdown to Slides</Title>
                <Paragraph>Write markdown, present it as a slideshow. Use '---' to separate slides.</Paragraph>
            </Header>
            <Grid columns={2} className="flex-grow p-4 gap-4 min-h-0">
                <Panel className="flex flex-col">
                     <label htmlFor="md-input" className="text-sm font-medium text-text-secondary mb-2">Markdown Editor</label>
                     <TextArea id="md-input" value={markdown} onChange={e => setMarkdown(e.target.value)} className="flex-grow font-mono text-sm" />
                </Panel>
                 <Panel ref={presentationRef} className="flex flex-col bg-surface fullscreen:bg-background">
                    <div className="flex-shrink-0 flex justify-end items-center p-2 border-b border-border gap-2">
                        <Button variant="secondary" size="sm" onClick={handleFullscreen} aria-label="Enter fullscreen mode">
                            <Icon icon={ArrowsPointingOutIcon} />
                            Fullscreen
                        </Button>
                    </div>
                    <div className="relative flex-grow flex flex-col justify-center items-center p-8 overflow-y-auto">
                        {isParsing ? (
                            <CoreSpinner label="Rendering slide..." />
                        ) : (
                            <div className="prose prose-lg max-w-none w-full" dangerouslySetInnerHTML={{ __html: slideHtml }} />
                        )}
                         <Button onClick={goToPrev} disabled={currentSlide === 0} aria-label="Previous slide" className="absolute left-4 top-1/2 -translate-y-1/2" variant="ghost" isIconOnly><Icon icon={ArrowLeftIcon}/></Button>
                         <Button onClick={goToNext} disabled={currentSlide === slides.length - 1} aria-label="Next slide" className="absolute right-4 top-1/2 -translate-y-1/2" variant="ghost" isIconOnly><Icon icon={ArrowRightIcon}/></Button>
                         <div className="absolute bottom-4 right-4 text-xs bg-black/50 px-2 py-1 rounded-md text-white">
                            {currentSlide + 1} / {slides.length}
                        </div>
                    </div>
                </Panel>
            </Grid>
        </Panel>
    );
};