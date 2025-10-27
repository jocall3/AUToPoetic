/**
 * @file Implements the Regex Sandbox feature.
 * @module components/features/RegexSandbox
 * @description This component provides an interactive sandbox for creating, testing, and generating Regular Expressions.
 * It features real-time matching, AI-powered regex generation from natural language, a cheat sheet, and common patterns.
 * In line with architectural directives, all regex matching computations are offloaded to a dedicated Web Worker to ensure the UI remains responsive,
 * even with complex patterns or large test strings. UI elements are abstracted into proprietary Core UI components.
 * @see {@link ../../services/aiService.ts} - For AI-powered regex generation.
 * @security All user-provided regex patterns are created using `new RegExp()`. While this is standard, complex or malformed patterns can lead to ReDoS (Regular Expression Denial of Service) attacks. The computation is offloaded to a worker, mitigating the risk of freezing the main UI thread, but long-running computations can still consume significant CPU resources.
 * @performance The core regex matching logic is executed in a Web Worker to prevent blocking the main thread. A debounce mechanism is used on user input to limit the frequency of worker executions, optimizing resource usage.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { generateRegExStream } from '../../services/aiService.ts';
import { BeakerIcon, SparklesIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';

// --- TYPE DEFINITIONS ---

/**
 * @typedef {object} SerializableMatch
 * @description A serializable representation of a RegExpMatchArray, suitable for passing from a Web Worker.
 * @property {string} match - The matched substring.
 * @property {Record<string, string>} groups - Named capture groups, if any.
 * @property {number} index - The 0-based index of the match within the string.
 * @property {string} input - The original string the regex was run against.
 * @property {string[]} subgroups - An array of all captured substrings, including the full match at index 0.
 */
type SerializableMatch = {
  match: string;
  groups: Record<string, string>;
  index: number;
  input: string;
  subgroups: string[];
};

/**
 * @typedef {object} WorkerResponse
 * @description Represents the data object sent back from the regex Web Worker.
 * @property {SerializableMatch[] | null} [matches] - The array of found matches, if successful.
 * @property {string | null} [error] - An error message, if the regex operation failed.
 */
type WorkerResponse = {
  matches?: SerializableMatch[] | null;
  error?: string | null;
};

// --- CONSTANTS ---

/**
 * A list of common regex patterns for quick use.
 * @type {Array<{name: string, pattern: string}>}
 */
const commonPatterns = [
    { name: 'Email', pattern: '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.{2,}/g' },
    { name: 'URL', pattern: '/https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)/g' },
    { name: 'IPv4 Address', pattern: '/((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}/g' },
    { name: 'Date (YYYY-MM-DD)', pattern: '/\\d{4}-\\d{2}-\\d{2}/g' },
];

// --- WEB WORKER ---

/**
 * The code for the regex matching Web Worker, defined as a string.
 * This allows the worker to be created from a Blob, avoiding the need for a separate file.
 * @performance By running regex matching in a worker, we prevent the main UI thread from freezing on complex patterns or large inputs.
 * @type {string}
 */
const workerCode = `
self.onmessage = (event) => {
  const { pattern, testString } = event.data;
  try {
    const patternParts = pattern.match(/^\\/(.*)\\/([gimyusd]*)$/);
    if (!patternParts) {
      self.postMessage({ error: 'Invalid regex literal. Use /pattern/flags.' });
      return;
    }
    const [, regexBody, regexFlags] = patternParts;
    const finalFlags = regexFlags.includes('g') ? regexFlags : regexFlags + 'g';
    const regex = new RegExp(regexBody, finalFlags);
    const matches = [...testString.matchAll(regex)];
    const serializableMatches = matches.map(match => ({
        match: match[0],
        groups: match.groups ? { ...match.groups } : {},
        index: match.index,
        input: match.input,
        subgroups: Array.from(match)
    }));
    self.postMessage({ matches: serializableMatches });
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : 'Unknown worker error.' });
  }
};
`;

/**
 * Custom hook to manage the lifecycle and communication of the regex Web Worker.
 * Encapsulates the creation of the worker from a Blob URL and provides a stable interface.
 * @returns {{ postMessage: (pattern: string, testString: string) => void, onMessage: (callback: (data: WorkerResponse) => void) => void }}
 */
const useRegexWorker = () => {
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        workerRef.current = worker;

        return () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            workerRef.current = null;
        };
    }, []);

    const postMessage = useCallback((pattern: string, testString: string) => {
        workerRef.current?.postMessage({ pattern, testString });
    }, []);

    const onMessage = useCallback((callback: (data: WorkerResponse) => void) => {
        if (workerRef.current) {
            workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
                callback(event.data);
            };
        }
    }, []);
    
    return { postMessage, onMessage };
};


// --- UI HELPER COMPONENTS ---

/**
 * Displays a cheat sheet for common regex syntax.
 * @returns {React.ReactElement} A stateless component rendering the cheat sheet.
 */
const CheatSheet: React.FC = () => (
    <div className="bg-surface border border-border p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Regex Cheat Sheet</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
            <p><span className="text-primary">.</span> - Any character</p>
            <p><span className="text-primary">\d</span> - Any digit</p>
            <p><span className="text-primary">\w</span> - Word character</p>
            <p><span className="text-primary">\s</span> - Whitespace</p>
            <p><span className="text-primary">[abc]</span> - a, b, or c</p>
            <p><span className="text-primary">[^abc]</span> - Not a, b, or c</p>
            <p><span className="text-primary">*</span> - 0 or more</p>
            <p><span className="text-primary">+</span> - 1 or more</p>
            <p><span className="text-primary">?</span> - 0 or one</p>
            <p><span className="text-primary">^</span> - Start of string</p>
            <p><span className="text-primary">$</span> - End of string</p>
            <p><span className="text-primary">\b</span> - Word boundary</p>
        </div>
    </div>
);

/**
 * Displays text with regex matches highlighted.
 * @param {{ text: string; matches: SerializableMatch[] | null }} props - Component props.
 * @returns {React.ReactElement} A component rendering highlighted text.
 */
const HighlightedText: React.FC<{ text: string; matches: SerializableMatch[] | null }> = ({ text, matches }) => {
    const highlighted = useMemo(() => {
        if (!matches || matches.length === 0) return text;
        let lastIndex = 0;
        const parts: (string | JSX.Element)[] = [];
        matches.forEach((match, i) => {
            if (match.index === undefined) return;
            parts.push(text.substring(lastIndex, match.index));
            parts.push(<mark key={i} className="bg-primary/20 text-primary rounded px-1 py-0.5">{match.match}</mark>);
            lastIndex = match.index + match.match.length;
        });
        parts.push(text.substring(lastIndex));
        return parts;
    }, [matches, text]);

    return <div className="whitespace-pre-wrap font-mono text-sm">{highlighted}</div>;
};

/**
 * Displays the details of all matched groups from the regex execution.
 * @param {{ matches: SerializableMatch[] | null }} props - Component props.
 * @returns {React.ReactElement} A component rendering match groups.
 */
const MatchGroups: React.FC<{ matches: SerializableMatch[] | null }> = ({ matches }) => (
    <div className="flex-shrink-0">
        <h3 className="text-lg font-bold">Match Groups ({matches?.length || 0})</h3>
        <div className="mt-2 p-2 bg-surface rounded-md overflow-y-auto max-h-48 font-mono text-xs border border-border">
            {matches && matches.length > 0 ? (
                matches.map((match, i) => (
                    <details key={i} className="p-2 border-b border-border last:border-b-0">
                        <summary className="cursor-pointer text-green-600 dark:text-green-400">Match {i + 1}: "{match.match}"</summary>
                        <div className="pl-4 mt-1 space-y-1">
                            {match.subgroups.map((group, gIndex) => 
                                <p key={gIndex} className="text-text-secondary">
                                    Group {gIndex}: <span className="text-amber-600 dark:text-amber-400">{String(group)}</span>
                                </p>
                            )}
                        </div>
                    </details>
                ))
            ) : (
                <p className="text-text-secondary text-sm p-2">No matches found.</p>
            )}
        </div>
    </div>
);

// --- MAIN COMPONENT ---

/**
 * The main component for the Regex Sandbox feature.
 * @param {{ initialPrompt?: string }} props - Component props.
 * @property {string} [initialPrompt] - An optional prompt to auto-generate a regex on load.
 * @returns {React.ReactElement} The rendered Regex Sandbox component.
 * @example <RegexSandbox initialPrompt="find all hex color codes" />
 */
export const RegexSandbox: React.FC<{ initialPrompt?: string }> = ({ initialPrompt }) => {
    const [pattern, setPattern] = useState<string>('/\\b([A-Z][a-z]+)\\s(\\w+)\\b/g');
    const [testString, setTestString] = useState<string>('The quick Brown Fox jumps over the Lazy Dog.');
    const [aiPrompt, setAiPrompt] = useState<string>(initialPrompt || 'find capitalized words and the word after');
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

    const [matches, setMatches] = useState<SerializableMatch[] | null>(null);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    
    const worker = useRegexWorker();

    useEffect(() => {
        worker.onMessage((data) => {
            if (data.error) {
                setMatchError(data.error);
                setMatches(null);
            } else {
                setMatchError(null);
                setMatches(data.matches ?? null);
            }
            setIsMatching(false);
        });
    }, [worker]);

    useEffect(() => {
        setIsMatching(true);
        const handler = setTimeout(() => {
            worker.postMessage(pattern, testString);
        }, 300); // Debounce worker calls

        return () => clearTimeout(handler);
    }, [pattern, testString, worker]);

    const handleGenerateRegex = useCallback(async (p: string) => {
        if (!p) return;
        setIsAiLoading(true);
        try {
            const stream = generateRegExStream(p);
            let fullResponse = '';
            for await (const chunk of stream) { 
                fullResponse += chunk;
            }
            // Clean up potential markdown formatting from AI response
            setPattern(fullResponse.trim().replace(/^`+|`+$/g, '').replace(/^regex\n/, ''));
        } finally {
            setIsAiLoading(false);
        }
    }, []);

    useEffect(() => { 
        if (initialPrompt) {
            handleGenerateRegex(initialPrompt);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPrompt]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6"><h1 className="text-3xl font-bold flex items-center"><BeakerIcon /><span className="ml-3">RegEx Sandbox</span></h1><p className="text-text-secondary mt-1">Test your regular expressions and generate them with AI.</p></header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
                    <div className="flex gap-2">
                        <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe the pattern to find..." className="flex-grow px-3 py-1.5 rounded-md bg-surface border border-border text-sm focus:ring-2 focus:ring-primary" />
                        <button onClick={() => handleGenerateRegex(aiPrompt)} disabled={isAiLoading} className="btn-primary px-4 py-1.5 flex items-center gap-2">
                            {isAiLoading ? <LoadingSpinner/> : <SparklesIcon />} Generate
                        </button>
                    </div>
                    <div>
                        <label htmlFor="regex-pattern" className="text-sm font-medium text-text-secondary">Regular Expression</label>
                        <input id="regex-pattern" type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} className={`w-full mt-1 px-3 py-2 rounded-md bg-surface border ${matchError ? 'border-red-500' : 'border-border'} font-mono text-sm focus:ring-2 focus:ring-primary`} />
                        {matchError && <p className="text-red-500 text-xs mt-1">{matchError}</p>}
                    </div>
                    <div className="flex flex-col flex-grow min-h-[200px]">
                        <label htmlFor="test-string" className="text-sm font-medium text-text-secondary">Test String</label>
                        <textarea id="test-string" value={testString} onChange={(e) => setTestString(e.target.value)} className="w-full mt-1 p-3 rounded-md bg-surface border border-border font-mono text-sm resize-y h-32" />
                        <div className="mt-2 p-3 bg-background rounded-md border border-border flex-grow min-h-[50px] relative">
                            {isMatching && <div className="absolute top-2 right-2"><LoadingSpinner /></div>}
                            <HighlightedText text={testString} matches={matches} />
                        </div>
                    </div>
                    <MatchGroups matches={matches} />
                </div>
                <div className="lg:col-span-1 space-y-4 overflow-y-auto">
                    <CheatSheet />
                    <div className="bg-surface border border-border p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">Common Patterns</h3>
                        <div className="flex flex-col items-start gap-2">
                            {commonPatterns.map(p => (
                                <button key={p.name} onClick={() => setPattern(p.pattern)} className="text-left text-sm text-primary hover:underline">
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};