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
import { Page } from '@/ui/core/Page';
import { Header } from '@/ui/core/Header';
import { Button } from '@/ui/core/Button';
import { Input } from '@/ui/core/Input';
import { Icon } from '@/ui/core/Icon';
import { Table, THead, TBody, Tr, Th, Td } from '@/ui/core/Table';

// Hypothetical service hook, abstracting the infrastructure layer as per architectural directives.
import { useDownloadService } from '@/services/business/useDownloadService';

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
                                            className="font-mono"
                                        />
                                    </Td>
                                    <Td>
                                        <Input
                                            type="text"
                                            value={v.value}
                                            onChange={e => handleUpdate(v.id, 'value', e.target.value)}
                                            placeholder="value"
                                            aria-label={`Value for variable ${index + 1}`}
                                            className="font-mono"
                                        />
                                    </Td>
                                    <Td className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
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
                        <Button variant="secondary" onClick={handleAdd}>
                            <Icon name="PlusIcon" /> Add Variable
                        </Button>
                        <Button onClick={handleDownload} disabled={envVars.length === 0}>
                            <Icon name="ArrowDownTrayIcon" /> Download .env File
                        </Button>
                    </div>
                </div>
            </Page.Content>
        </Page>
    );
};
