/**
 * @module hooks/useAiPersonalities
 * @description This module provides a custom React hook for managing AI personalities.
 * These personalities, defined by the `SystemPrompt` type, serve as configurable strategies
 * for guiding the behavior of AI models throughout the application, aligning with the
 * Strategy design pattern. The hook abstracts the persistence of these personalities
 * to the browser's local storage, allowing for user-defined and persistent configurations.
 *
 * @see {@link ../types.ts} for the `SystemPrompt` interface definition.
 * @see {@link ./useLocalStorage.ts} for the underlying persistence mechanism.
 * @see {@link ../components/features/AiPersonalityForge.tsx} for the primary consumer of this hook.
 */

import { useLocalStorage } from './useLocalStorage.ts';
import type { SystemPrompt } from '../types.ts';

/**
 * Provides a set of default AI personalities. These serve as initial configurations
 * for the user and demonstrate the range of possible AI behaviors, from a helpful
 * senior engineer to a more cynical and sarcastic persona.
 *
 * These objects are used to seed the local storage if no user-defined personalities are found.
 *
 * @constant
 * @type {SystemPrompt[]}
 * @security This data is non-sensitive and is used for client-side configuration only. It does not contain any user data or secrets.
 * @example
 * const defaultReviewer = defaultPersonalities[0];
 * console.log(defaultReviewer.name); // "Default Reviewer"
 */
const defaultPersonalities: SystemPrompt[] = [
    {
        id: '1',
        name: 'Default Reviewer',
        persona: 'You are a senior software engineer performing a code review. You are meticulous, helpful, and provide constructive feedback.',
        rules: ['Be clear and concise.', 'Provide code examples for suggestions.', 'Explain the "why" behind your suggestions.'],
        outputFormat: 'markdown',
        exampleIO: []
    },
    {
        id: '2',
        name: 'Sarcastic Senior Dev',
        persona: 'You are a cynical, sarcastic, but brilliant senior software engineer. Your feedback is brutally honest and often humorous, but always technically correct.',
        rules: ['Use a sarcastic tone.', 'Point out rookie mistakes without mercy.', 'Your code suggestions must be flawless.'],
        outputFormat: 'markdown',
        exampleIO: [
            {
                input: 'I wrote this function: `function add(a,b){return a+b}`',
                output: 'Wow, a function that adds two numbers. Groundbreaking. Did you consider that maybe, just maybe, you should add a semicolon at the end? `function add(a, b) { return a + b; };`'
            }
        ]
    }
];


/**
 * A custom React hook that provides stateful management for the collection of AI personalities.
 * It leverages the `useLocalStorage` hook to persist the personalities across browser sessions.
 * This allows users to create, modify, and delete AI personalities, with their changes
 * being saved automatically.
 *
 * The hook returns a tuple, similar to `React.useState`, containing the current array of
 * personalities and a function to update them.
 *
 * @returns {[SystemPrompt[], (value: SystemPrompt[] | ((val: SystemPrompt[]) => SystemPrompt[])) => void]} A tuple where:
 * - The first element is the current array of `SystemPrompt` objects.
 * - The second element is the setter function to update the array of personalities.
 *
 * @performance
 * This hook's performance is tied to the `useLocalStorage` hook. Reading from local storage
 * happens only on initial render. Subsequent updates are in-memory (React state) and trigger
 * an asynchronous write to local storage. Performance impact is negligible for typical
 * numbers of personalities. Serialization/deserialization of a large number of complex
 * personalities could have a minor impact, but this is not expected in normal usage.
 *
 * @security
 * The personalities are stored in the browser's local storage. While the default personalities
 * are non-sensitive, users could potentially store sensitive information in custom-created
 * personas or examples. The application should treat this data as user-generated content and
 * avoid storing any credentials or PII within it. The storage is not encrypted.
 *
 * @example
 * import React from 'react';
 * import { useAiPersonalities } from './hooks/useAiPersonalities';
 *
 * const PersonalitySelector = () => {
 *   const [personalities, setPersonalities] = useAiPersonalities();
 *
 *   const handleAddPersonality = () => {
 *     const newPersonality = {
 *       id: Date.now().toString(),
 *       name: 'New Helper',
 *       persona: 'You are a friendly and encouraging assistant.',
 *       rules: [],
 *       outputFormat: 'markdown',
 *       exampleIO: [],
 *     };
 *     setPersonalities(prev => [...prev, newPersonality]);
 *   };
 *
 *   return (
 *     <div>
 *       <select>
 *         {personalities.map(p => <option key={p.id}>{p.name}</option>)}
 *       </select>
 *       <button onClick={handleAddPersonality}>Add New</button>
 *     </div>
 *   );
 * };
 *
 * @see {@link useLocalStorage}
 */
export const useAiPersonalities = (): [SystemPrompt[], (value: SystemPrompt[] | ((val: SystemPrompt[]) => SystemPrompt[])) => void] => {
    const [personalities, setPersonalities] = useLocalStorage<SystemPrompt[]>('devcore_ai_personalities', defaultPersonalities);
    return [personalities, setPersonalities];
};
