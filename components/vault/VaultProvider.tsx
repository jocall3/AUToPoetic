import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

/**
 * @file VaultProvider.tsx
 * @description This module provides a simplified Vault context for managing the user-provided Gemini API key.
 * It replaces the previous master password-based vault system to streamline the user experience,
 * allowing AI features to be used as long as a Gemini API key is provided by the user.
 *
 * @module components/vault/VaultProvider
 *
 * @security
 * This implementation stores the Gemini API key in the browser's `localStorage`.
 * While this fulfills the user's requirement for a client-side API key slot, it is a
 * significant security risk. API keys stored in `localStorage` can be accessed by any
 * JavaScript running on the page, making them vulnerable to Cross-Site Scripting (XSS) attacks.
 * The architectural directive to manage secrets server-side via an AuthGateway is the recommended
 * secure approach. This client-side implementation should be considered a temporary or
 * development-only solution.
 *
 * @performance
 * Performance impact is minimal. It uses `useLocalStorage`, which involves a single synchronous read
 * on initialization and asynchronous writes on change.
 */

/**
 * Defines the shape of the data and functions provided by the VaultContext.
 * @interface VaultContextType
 * @property {string | null} geminiApiKey - The user-provided Gemini API key. Null if not set.
 * @property {(key: string | null) => void} setGeminiApiKey - Function to set or clear the Gemini API key.
 * @property {boolean} isVaultUnlocked - A boolean indicating if the vault is considered 'unlocked', which is true if the Gemini API key is present.
 */
interface VaultContextType {
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string | null) => void;
  isVaultUnlocked: boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

/**
 * Props for the VaultProvider component.
 * @interface VaultProviderProps
 * @property {ReactNode} children - The child components that will have access to this context.
 */
interface VaultProviderProps {
  children: ReactNode;
}

/**
 * @component VaultProvider
 * @description Provides the vault context to its children, managing the state of the Gemini API key.
 * This provider removes the need for a master password, simplifying the app's flow to just require a Google Sign-In
 * and a user-provided API key for AI features to function.
 * @param {VaultProviderProps} props - The component props.
 * @returns {React.ReactElement} The provider component wrapping its children.
 * @example
 * <VaultProvider>
 *   <App />
 * </VaultProvider>
 */
export const VaultProvider: React.FC<VaultProviderProps> = ({ children }) => {
  const [geminiApiKey, setGeminiApiKey] = useLocalStorage<string | null>('gemini_api_key', null);

  const isVaultUnlocked = useMemo(() => !!geminiApiKey, [geminiApiKey]);

  const value = useMemo(() => ({
    geminiApiKey,
    setGeminiApiKey,
    isVaultUnlocked,
  }), [geminiApiKey, setGeminiApiKey, isVaultUnlocked]);

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
};

/**
 * @hook useVault
 * @description A custom hook to easily access the vault context from any component within the VaultProvider.
 * It provides access to the Gemini API key and the function to update it.
 * @returns {VaultContextType} The vault context.
 * @throws {Error} If used outside of a `VaultProvider`, ensuring proper component hierarchy.
 * @example
 * const { geminiApiKey, setGeminiApiKey, isVaultUnlocked } = useVault();
 * if (isVaultUnlocked) {
 *   // Use geminiApiKey for an AI service call
 * }
 */
export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
