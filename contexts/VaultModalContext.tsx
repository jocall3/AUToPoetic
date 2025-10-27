/**
 * @file contexts/VaultModalContext.tsx
 * @description This module provides a React context for managing API keys, specifically the Gemini API key.
 * It replaces the previous concept of a master-password-protected vault with a simpler, direct
 * way to manage necessary secrets for AI features, aligning with the goal of simplifying authentication
 * to just Google Sign-In and providing a slot for an API key.
 *
 * @module contexts/VaultModalContext
 * @see hooks/useLocalStorage.ts for the persistence mechanism.
 * @see components/SettingsView.tsx where the key is likely managed.
 *
 * @security The Gemini API key is stored in the browser's localStorage. While this is convenient for
 *           development and allows the application to function without a full backend secret management
 *           system, it is not a secure practice for production environments. This is a transitional
 *           implementation pending the full rollout of the server-side AuthGateway for secret management.
 * @performance This context provider is lightweight. It reads from localStorage on initial load
 *              and writes when the key is updated. Performance impact is negligible.
 */

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * @interface VaultModalContextType
 * @description Defines the shape of the context provided for managing the Gemini API key and its associated modal.
 */
interface VaultModalContextType {
  /** The stored Gemini API key. Null if not set. */
  geminiApiKey: string | null;
  /** Function to set or update the Gemini API key. */
  setGeminiApiKey: (key: string | null) => void;
  /** A boolean indicating if the API key entry modal is open. */
  isModalOpen: boolean;
  /** A function to open the API key entry modal. */
  openModal: () => void;
  /** A function to close the API key entry modal. */
  closeModal: () => void;
}

/**
 * @const {React.Context<VaultModalContextType | undefined>} VaultModalContext
 * @description The React context for managing the API key.
 * @private
 */
const VaultModalContext = createContext<VaultModalContextType | undefined>(undefined);

/**
 * @function useVaultModal
 * @description Custom hook for accessing the API key management context.
 * @returns {VaultModalContextType} The context value.
 * @throws {Error} If used outside of a `VaultModalProvider`.
 * @example
 * const { geminiApiKey, openModal } = useVaultModal();
 */
export const useVaultModal = (): VaultModalContextType => {
  const context = useContext(VaultModalContext);
  if (context === undefined) {
    throw new Error('useVaultModal must be used within a VaultModalProvider');
  }
  return context;
};

/**
 * @component VaultModalProvider
 * @description A provider component that wraps the application (or parts of it) to provide
 *              the API key management context. It handles the state for the Gemini API key,
 *              persisting it to localStorage, and managing the visibility of a modal for key entry.
 * @param {{ children: ReactNode }} props The component props.
 * @returns {React.ReactElement} The provider component.
 * @example
 * // In App.tsx
 * <VaultModalProvider>
 *   <MyApp />
 * </VaultModalProvider>
 */
export const VaultModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useLocalStorage<string | null>('gemini_api_key', null);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const value = {
    geminiApiKey,
    setGeminiApiKey,
    isModalOpen,
    openModal,
    closeModal,
  };

  return (
    <VaultModalContext.Provider value={value}>
      {children}
    </VaultModalContext.Provider>
  );
};
