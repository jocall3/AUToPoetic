import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext';

/**
 * @file VaultProvider.tsx
 * @description This module provides the Vault context as a compatibility layer.
 * It bridges components still using `useVault` to the new centralized `GlobalStateContext`
 * where the Gemini API key is now managed.
 *
 * @module components/vault/VaultProvider
 *
 * @security
 * The Gemini API key is managed by `GlobalStateContext`, which persists the key to the browser's
 * `localStorage`. This is a security risk and is intended only as a temporary or development-only
 * solution, pending the full implementation of the server-side AuthGateway for secret management.
 * API keys in `localStorage` are vulnerable to Cross-Site Scripting (XSS) attacks.
 *
 * @performance
 * Performance impact is minimal. This provider reads from the global state context and re-renders
 * only when the relevant part of the global state (`geminiApiKey`) changes.
 */

/**
 * Defines the shape of the data and functions provided by the VaultContext.
 * @interface VaultContextType
 * @property {string | null} geminiApiKey - The user-provided Gemini API key. Null if not set.
 * @property {(key: string | null) => void} setGeminiApiKey - Function to set or clear the Gemini API key in the global state.
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
 * @description Provides the vault context to its children by sourcing state from the centralized `GlobalStateContext`.
 * This component acts as an adapter to support legacy components that use the `useVault` hook while centralizing
 * state management for the Gemini API key.
 * @param {VaultProviderProps} props - The component props.
 * @returns {React.ReactElement} The provider component wrapping its children.
 * @example
 * <GlobalStateProvider>
 *   <VaultProvider>
 *     <App />
 *   </VaultProvider>
 * </GlobalStateProvider>
 */
export const VaultProvider: React.FC<VaultProviderProps> = ({ children }) => {
  const { state, dispatch } = useGlobalState();
  const { geminiApiKey } = state.preferences;

  const setGeminiApiKey = useCallback((key: string | null) => {
    dispatch({ type: 'SET_GEMINI_API_KEY', payload: key });
  }, [dispatch]);

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
