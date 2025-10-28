/**
 * @file EnvManager.tsx
 * @description This micro-frontend provides a user interface for creating and managing .env files.
 * @module features/EnvManager
 * @see @/ui/core/Page for layout component.
 * @see @/ui/core/Button for button component.
 * @see @/ui/core/Input for input component.
 * @see @/services/business/useDownloadService for download functionality.
 * @security This component processes user-provided keys and values which are then compiled into a downloadable
 * text file. All processing is client-side. No data is transmitted to any server. The generated .env file
 * may contain secrets and should be handled with care by the user.
 * @performance The component is highly performant with a low memory footprint. Rendering performance for the list of
 * variables is O(n) where n is the number of variables. The list is not virtualized, so very large numbers (>1000) of
 * variables may cause minor UI lag.
 */

import React, { useReducer, useCallback } from 'react';

// Hypothetical UI framework imports. In a real scenario, these would come from the new UI libraries.
// These are conceptual and might be simple styled components or wrappers around a library like Radix.
const Page = ({ children }: { children: React.ReactNode }) => <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">{children}</div>;
const Header = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string; }) => (
    <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">{icon}<span className="ml-3">{title}</span></h1>
        <p className="text-text-secondary mt-1">{subtitle}</p>
    </header>
);
Page.Content = ({ children }: { children: React.ReactNode }) => <div className="flex-grow min-h-0">{children}</div>;
const Button = ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>;
const Input = (props: React.ComponentProps<'input'>) => <input {...props} />;
const Icon = ({ name }: { name: string }) => {
    // In a real UI lib, this would render a specific SVG based on name.
    const icons: { [key: string]: React.ReactNode } = {
        DocumentTextIcon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
        PlusIcon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
        TrashIcon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>,
        ArrowDownTrayIcon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
    };
    return <span className="inline-block w-6 h-6">{icons[name]}</span>;
};
const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => <table className="w-full text-sm">{children}</table>;
const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => <thead className="text-left text-text-secondary">{children}</thead>;
const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => <tbody>{children}</tbody>;
const Tr: React.FC<{ children: React.ReactNode }> = ({ children }) => <tr className="border-b border-border">{children}</tr>;
const Th: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => <th className={`py-2 px-2 font-semibold ${className}`}>{children}</th>;
const Td: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => <td className={`py-2 px-2 ${className}`}>{children}</td>;

// Hypothetical service hook, abstracting the infrastructure layer as per architectural directives.
const useDownloadService = () => {
    const download = useCallback(({ content, filename, mimeType }: { content: string, filename: string, mimeType: string }) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    return { download };
};

/**
 * Represents a single environment variable with a key and a value.
 * @interface EnvVar
 * @property {number} id - A unique identifier for the list item, used for React keys.
 * @property {string} key - The name of the environment variable (e.g., 'VITE_API_URL').
 * @property {string} value - The value of the environment variable.
 */
interface EnvVar {
    id: number;
    key: string;
    value: string;
}

type EnvAction =
    | { type: 'ADD' }
    | { type: 'UPDATE'; payload: { id: number; field: 'key' | 'value'; value: string } }
    | { type: 'REMOVE'; payload: { id: number } };

/**
 * Reducer function to manage the state of environment variables.
 * Implements logic for adding, updating, and removing variables.
 * Using a reducer centralizes state logic, making it more predictable and testable.
 *
 * @param {EnvVar[]} state - The current array of environment variables.
 * @param {EnvAction} action - The action to be performed on the state.
 * @returns {EnvVar[]} The new state after applying the action.
 * @example
 * const [state, dispatch] = useReducer(envReducer, initialState);
 * dispatch({ type: 'ADD' });
 */
const envReducer = (state: EnvVar[], action: EnvAction): EnvVar[] => {
    switch (action.type) {
        case 'ADD':
            return [...state, { id: Date.now(), key: '', value: '' }];
        case 'UPDATE':
            return state.map(v =>
                v.id === action.payload.id ? { ...v, [action.payload.field]: action.payload.value } : v
            );
        case 'REMOVE':
            return state.filter(v => v.id !== action.payload.id);
        default:
            return state;
    }
};

const initialState: EnvVar[] = [
    { id: 1, key: 'VITE_API_URL', value: 'https://api.example.com' },
    { id: 2, key: 'VITE_ENABLE_FEATURE_X', value: 'true' },
];

/**
 * A micro-frontend component for creating and managing .env files.
 * It provides a user-friendly interface to add, edit, and remove environment variables,
 * and allows the user to download the final result as a standard `.env` file.
 * All operations are performed client-side.
 *
 * @component
 * @returns {React.ReactElement} The rendered EnvManager component.
 * @example
 * return (
 *   <Workspace>
 *     <EnvManager />
 *   </Workspace>
 * )
 */
export const EnvManager: React.FC = () => {
    const [envVars, dispatch] = useReducer(envReducer, initialState);
    const { download } = useDownloadService();

    /**
     * Handles adding a new, empty environment variable to the list.
     * @function
     * @returns {void}
     */
    const handleAdd = useCallback(() => {
        dispatch({ type: 'ADD' });
    }, []);

    /**
     * Handles updating a specific field of an environment variable.
     * @function
     * @param {number} id - The ID of the variable to update.
     * @param {'key' | 'value'} field - The field to update ('key' or 'value').
     * @param {string} value - The new value for the field.
     * @returns {void}
     */
    const handleUpdate = useCallback((id: number, field: 'key' | 'value', value: string) => {
        dispatch({ type: 'UPDATE', payload: { id, field, value } });
    }, []);

    /**
     * Handles removing an environment variable from the list.
     * @function
     * @param {number} id - The ID of the variable to remove.
     * @returns {void}
     */
    const handleRemove = useCallback((id: number) => {
        dispatch({ type: 'REMOVE', payload: { id } });
    }, []);

    /**
     * Compiles the current state of environment variables into a .env file string
     * and triggers a browser download using the download service.
     * @function
     * @returns {void}
     * @see {@link useDownloadService}
     */
    const handleDownload = useCallback(() => {
        const envContent = envVars
            .filter(v => v.key.trim() !== '') // Ignore variables with empty keys
            .map(v => `${v.key}=${v.value}`)
            .join('\n');
        
        download({
            content: envContent,
            filename: '.env',
            mimeType: 'text/plain',
        });
    }, [envVars, download]);

    return (
        <Page>
            <Header
                icon={<Icon name="DocumentTextIcon" />}
                title="Environment Variable Manager"
                subtitle="Create and manage your .env files with a simple interface."
            />
            <Page.Content>
                <div className="bg-surface p-6 rounded-lg border border-border w-full max-w-4xl mx-auto">
                    <Table>
                        <THead>
                            <Tr>
                                <Th className="w-2/5">Key</Th>
                                <Th className="w-2/5">Value</Th>
                                <Th className="w-1/5 text-right">Actions</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {envVars.map((v, index) => (
                                <Tr key={v.id}>
                                    <Td>
                                        <Input
                                            type="text"
                                            value={v.key}
                                            onChange={e => handleUpdate(v.id, 'key', e.target.value)}
                                            placeholder={`KEY_${index + 1}`}
                                            aria-label={`Key for variable ${index + 1}`}
                                            className="w-full p-2 bg-background border border-border rounded font-mono"
                                        />
                                    </Td>
                                    <Td>
                                        <Input
                                            type="text"
                                            value={v.value}
                                            onChange={e => handleUpdate(v.id, 'value', e.target.value)}
                                            placeholder="value"
                                            aria-label={`Value for variable ${index + 1}`}
                                            className="w-full p-2 bg-background border border-border rounded font-mono"
                                        />
                                    </Td>
                                    <Td className="text-right">
                                        <Button
                                            className="p-2 text-text-secondary hover:text-red-500 rounded"
                                            onClick={() => handleRemove(v.id)}
                                            aria-label={`Remove variable ${index + 1}`}
                                        >
                                            <Icon name="TrashIcon" />
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                        <Button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 rounded-md" onClick={handleAdd}>
                            <Icon name="PlusIcon" /> Add Variable
                        </Button>
                        <Button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-text-on-primary rounded-md disabled:opacity-50" onClick={handleDownload} disabled={envVars.length === 0}>
                            <Icon name="ArrowDownTrayIcon" /> Download .env File
                        </Button>
                    </div>
                </div>
            </Page.Content>
        </Page>
    );
};
