/**
 * @file WeeklyDigestGenerator.tsx
 * @description A feature component for generating and sending an AI-powered weekly project digest.
 * It fetches project data from connected sources via the BFF, generates a digest using an AI service,
 * and allows the user to send it as an email.
 * @security This component interacts with a BFF via GraphQL. All sensitive operations, including token handling
 * for third-party services (GitHub, Gmail), are managed server-side, adhering to a zero-trust model.
 * The client only holds a short-lived JWT for BFF authentication.
 * @performance Data fetching for commits and telemetry is handled via GraphQL queries. The component displays loading states
 * during data fetching and digest generation to provide a responsive user experience.
 * The component is lazy-loaded as part of the micro-frontend architecture.
 * @example
 * <WeeklyDigestGenerator />
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { MailIcon, SparklesIcon, CalendarDaysIcon, FolderIcon } from '../icons.tsx';

// --- Mocks for UI Components and Hooks (as per architectural directives) ---
// In a real implementation, these would be imported from the proprietary UI/Infra libraries.

const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) => <button {...props}>{children}</button>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />;
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props}>{children}</select>;
const Panel = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={className}>{children}</div>;
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>;

// --- Mock Data & Hooks for BFF Interaction ---
const MOCK_REPOS = [
    { id: 'devcore-ai', name: 'DevCore AI Toolkit' },
    { id: 'jester-os', name: 'JesterOS' },
    { id: 'citibank-demo', name: 'Citibank Demo App' },
];

const MOCK_PROJECT_DATA = {
    commitLogs: `feat: implement user authentication\nfix: resolve issue with button alignment\nfeat: add dark mode toggle\nchore: update dependencies\nrefactor: simplify data fetching logic`,
    telemetry: {
        avgPageLoad: 120,
        errorRate: '0.5%',
        uptime: '99.98%',
    },
};

/**
 * @summary A mock hook simulating a GraphQL query to fetch project repositories.
 * @returns An object with data, loading state, and error state.
 */
const useProjectRepositoriesQuery = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<typeof MOCK_REPOS | null>(null);
    useEffect(() => {
        setTimeout(() => {
            setData(MOCK_REPOS);
            setLoading(false);
        }, 1000);
    }, []);
    return { data, loading, error: null };
};

/**
 * @summary A mock hook simulating a GraphQL mutation to generate a digest.
 * @returns A tuple with the mutation function and the result object.
 */
const useGenerateDigestMutation = (): [() => Promise<void>, { data: string | null; loading: boolean; error: Error | null }] => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<string | null>(null);

    const mutate = useCallback(async () => {
        setLoading(true);
        await new Promise(res => setTimeout(res, 2000));
        setData(`<html><body><h1>Project Digest</h1><p>Here is your weekly summary...</p></body></html>`);
        setLoading(false);
    }, []);

    return [mutate, { data, loading, error: null }];
};

/**
 * @summary A mock hook simulating a GraphQL mutation to send a digest email.
 * @returns A tuple with the mutation function and the result object.
 */
const useSendDigestMutation = (): [({ recipient, subject, body }: { recipient: string; subject: string; body: string }) => Promise<void>, { loading: boolean; error: Error | null }] => {
    const [loading, setLoading] = useState(false);

    const mutate = useCallback(async (vars) => {
        setLoading(true);
        console.log('Sending digest with vars:', vars);
        await new Promise(res => setTimeout(res, 1500));
        setLoading(false);
    }, []);

    return [mutate, { loading, error: null }];
};

/**
 * @class WeeklyDigestGenerator
 * @description This component provides a UI to generate an AI-powered weekly project digest.
 * It allows users to select a repository and date range, fetches relevant data,
 * generates an HTML email summary using AI, and provides an option to send it.
 */
export const WeeklyDigestGenerator: React.FC = () => {
    const { addNotification } = useNotification();
    const { state } = useGlobalState();

    // --- State Management ---
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [dateRange, setDateRange] = useState('last-7-days');
    const [recipient, setRecipient] = useState('');

    // --- Data Fetching & Mutations ---
    const { data: repos, loading: reposLoading } = useProjectRepositoriesQuery();
    const [generateDigest, { data: digestHtml, loading: digestLoading }] = useGenerateDigestMutation();
    const [sendDigest, { loading: sending }] = useSendDigestMutation();

    useEffect(() => {
        if (state.user?.email) {
            setRecipient(state.user.email);
        }
    }, [state.user]);

    /**
     * @summary Handles the digest generation process.
     * Fetches project data for the selected repository and date range, then triggers the AI digest generation.
     */
    const handleGenerate = useCallback(async () => {
        if (!selectedRepo) {
            addNotification('Please select a repository.', 'error');
            return;
        }
        try {
            // In a real scenario, we'd pass repo/date to the mutation.
            await generateDigest();
            addNotification('Digest content generated successfully!', 'success');
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to generate digest';
            addNotification(message, 'error');
        }
    }, [selectedRepo, addNotification, generateDigest]);

    /**
     * @summary Handles sending the generated digest email.
     * Validates input and calls the send digest mutation.
     */
    const handleSend = useCallback(async () => {
        if (!digestHtml || !recipient) {
            addNotification('Please generate a digest and provide a recipient.', 'error');
            return;
        }
        try {
            await sendDigest({ recipient, subject: `Weekly Digest for ${selectedRepo}`, body: digestHtml });
            addNotification(`Digest sent to ${recipient}!`, 'success');
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to send email';
            addNotification(message, 'error');
        }
    }, [digestHtml, recipient, sendDigest, addNotification, selectedRepo]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center"><MailIcon /><span className="ml-3">Weekly Digest Generator</span></h1>
                <p className="text-text-secondary mt-1">Generate an AI-powered weekly summary and send it via your connected Gmail account.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Column 1: Controls */}
                <Panel className="bg-surface p-4 border border-border rounded-lg flex flex-col gap-4">
                    <h3 className="text-lg font-bold">Digest Configuration</h3>
                    <div>
                        <label htmlFor="repo-select" className="text-sm font-medium text-text-secondary flex items-center gap-2"><FolderIcon /> Repository</label>
                        <Select id="repo-select" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} disabled={reposLoading} className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm">
                            <option value="" disabled>Select a repository...</option>
                            {repos?.map(repo => <option key={repo.id} value={repo.name}>{repo.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="date-range-select" className="text-sm font-medium text-text-secondary flex items-center gap-2"><CalendarDaysIcon /> Date Range</label>
                        <Select id="date-range-select" value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm">
                            <option value="last-7-days">Last 7 Days</option>
                            <option value="last-14-days">Last 14 Days</option>
                            <option value="last-30-days">Last 30 Days</option>
                        </Select>
                    </div>
                    <Button onClick={handleGenerate} disabled={digestLoading || !selectedRepo} className="btn-primary flex items-center justify-center gap-2 py-3 mt-auto">
                        {digestLoading ? <Spinner /> : <SparklesIcon />} Generate Digest
                    </Button>
                </Panel>

                {/* Column 2: Data Preview */}
                <Panel className="bg-surface p-4 border border-border rounded-lg flex flex-col">
                    <h3 className="text-lg font-bold mb-2">Data Sources</h3>
                    <div className="flex-grow bg-background border rounded p-4 overflow-auto space-y-4 text-xs font-mono">
                        <div>
                            <h4 className="font-semibold text-text-secondary mb-1">Commit Logs:</h4>
                            <pre className="whitespace-pre-wrap">{MOCK_PROJECT_DATA.commitLogs}</pre>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-secondary mb-1">Telemetry Snapshot:</h4>
                            <pre className="whitespace-pre-wrap">{JSON.stringify(MOCK_PROJECT_DATA.telemetry, null, 2)}</pre>
                        </div>
                    </div>
                </Panel>

                {/* Column 3: Email Preview & Send */}
                <Panel className="bg-surface p-4 border border-border rounded-lg flex flex-col">
                    <h3 className="text-lg font-bold mb-2">Email Preview & Send</h3>
                    <div className="flex-grow bg-white border rounded overflow-hidden">
                        {digestLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                        {digestHtml && <iframe srcDoc={digestHtml} title="Email Preview" className="w-full h-full" />}
                        {!digestLoading && !digestHtml && <div className="flex justify-center items-center h-full text-text-secondary">Preview will appear here.</div>}
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                        <Input id="recipient-email" type="email" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="recipient@example.com" className="w-full p-2 bg-background border border-border rounded-md text-sm" disabled={!state.user} />
                        <Button onClick={handleSend} disabled={sending || !digestHtml || !state.user} className="btn-primary flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700">
                            {sending ? <Spinner /> : <MailIcon />} Send via Gmail
                        </Button>
                    </div>
                </Panel>
            </div>
        </div>
    );
};
