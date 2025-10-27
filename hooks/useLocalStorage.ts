/**
 * @file This module provides a custom React hook, `useLocalStorage`, for synchronizing state with the browser's localStorage.
 * It is a foundational hook for persisting non-sensitive user preferences and application state across sessions,
 * while respecting user consent for local data storage.
 *
 * @module hooks/useLocalStorage
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage | MDN localStorage}
 * @see {@link https://react.dev/reference/react/useState | React useState}
 * @see {@link https://react.dev/reference/react/useCallback | React useCallback}
 */

import { useState, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * A custom React hook that syncs state to `localStorage`.
 * It provides a state value and a function to update it, similar to `React.useState`,
 * but with the value being persisted to and retrieved from `localStorage`.
 *
 * This hook respects a user-defined consent flag ('devcore_ls_consent') in localStorage.
 * If consent is not 'granted', it will operate as a simple `useState` hook, holding state
 * in memory for the session without persisting it.
 *
 * @template T The type of the state value to be stored. The value must be serializable to JSON.
 *
 * @param {string} key The key under which the value will be stored in `localStorage`.
 * @param {T} initialValue The initial value to use if no value is found in `localStorage` or if consent is not granted.
 *
 * @returns {[T, Dispatch<SetStateAction<T>>]} A tuple containing the current state value and a function to update it.
 * The update function is compatible with the one returned by `React.useState`.
 *
 * @example
 * // In a component:
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * // To update the theme and persist it:
 * setTheme('dark');
 *
 * // It also accepts a function updater, just like useState:
 * setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
 *
 * @security
 * This hook is intended for non-sensitive data such as user preferences (e.g., theme) or application state (e.g., last active tab).
 * Do NOT use it to store sensitive information like API keys, tokens, or personal user data.
 * For sensitive data, use the encrypted `vaultService`. The hook explicitly checks for a 'devcore_ls_consent' key in localStorage
 * and will not persist data if consent is not 'granted', falling back to in-memory state.
 *
 * @performance
 * `localStorage` operations are synchronous and can block the main thread if used with very large objects.
 * Avoid storing large amounts of data (megabytes) with this hook to prevent UI jank.
 * For large datasets, consider using IndexedDB via `dbService`.
 */
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const consent = window.localStorage.getItem('devcore_ls_consent');
            if (consent !== 'granted') {
                return initialValue;
            }

            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue: Dispatch<SetStateAction<T>> = useCallback(
        (value) => {
            try {
                // Use the updater function form of setState to get the latest value.
                setStoredValue((prevValue) => {
                    const valueToStore = value instanceof Function ? value(prevValue) : value;
                    
                    try {
                        const consent = window.localStorage.getItem('devcore_ls_consent');
                        if (consent === 'granted') {
                            window.localStorage.setItem(key, JSON.stringify(valueToStore));
                        }
                    } catch (error) {
                        console.error(`Error setting localStorage key "${key}":`, error);
                    }
                    
                    return valueToStore;
                });
            } catch (error) {
                console.error(`Error in setValue for localStorage key "${key}":`, error);
            }
        },
        [key]
    );

    return [storedValue, setValue];
};