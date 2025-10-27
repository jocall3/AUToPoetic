/**
 * @file Manages the state and configuration of AI providers on the client-side.
 * @module services/aiProviderState
 * @description This module provides a centralized place to manage the active AI provider and its configuration,
 *              such as the API key for Gemini. It persists the API key to local storage for convenience.
 * @security Storing API keys in local storage is not a secure practice for production environments.
 *           This approach is intended for local development and demonstration purposes where the user
 *           provides their own key directly to the client. In a production system, API keys should be
 *           managed server-side and never exposed to the client.
 * @performance Accessing local storage is synchronous and can be slow if called frequently in a blocking manner.
 *              This service is designed to be read from once upon initialization of AI services.
 */

import { logEvent, logError } from './telemetryService'; // Assuming telemetry service exists for logging.

/**
 * @interface AiProviderState
 * @description Defines the shape of the state for AI provider management.
 * @property {string | null} geminiApiKey - The user-provided API key for the Google Gemini service.
 */
interface AiProviderState {
  geminiApiKey: string | null;
}

/**
 * The key used to store the AI provider state in the browser's local storage.
 * @constant {string}
 */
const LOCAL_STORAGE_KEY = 'devcore_ai_provider_state';

/**
 * A singleton class to manage the state of AI providers, particularly the Gemini API key.
 *
 * @class AiProviderStateManager
 * @example
 * import { aiProviderState } from './services/aiProviderState';
 *
 * // In a settings component:
 * const handleSaveKey = (key) => {
 *   aiProviderState.setGeminiApiKey(key);
 * };
 *
 * // In an AI service component:
 * const apiKey = aiProviderState.getGeminiApiKey();
 * if (apiKey) {
 *   // Initialize AI client
 * }
 */
class AiProviderStateManager {
  private state: AiProviderState;

  /**
   * Initializes the state manager, loading any persisted state from local storage.
   * @constructor
   */
  constructor() {
    this.state = this.loadState();
    logEvent('AiProviderState_Initialized', { hasKey: !!this.state.geminiApiKey });
  }

  /**
   * Retrieves the currently stored Gemini API key.
   *
   * @returns {string | null} The API key, or null if it has not been set.
   * @example
   * const apiKey = aiProviderState.getGeminiApiKey();
   */
  public getGeminiApiKey(): string | null {
    // Re-load from localStorage to ensure sync across tabs if needed, though this simple model doesn't handle that automatically.
    this.state = this.loadState();
    return this.state.geminiApiKey;
  }

  /**
   * Sets and persists the Gemini API key. The key is stored in local storage.
   *
   * @param {string | null} apiKey - The Gemini API key to be stored. An empty string or null will clear the key.
   * @returns {void}
   * @example
   * aiProviderState.setGeminiApiKey('AIza...');
   */
  public setGeminiApiKey(apiKey: string | null): void {
    this.state.geminiApiKey = apiKey;
    this.saveState();
    logEvent('AiProviderState_SetGeminiApiKey', { hasKey: !!apiKey });
  }

  /**
   * Loads the AI provider state from local storage.
   * @private
   * @returns {AiProviderState} The loaded state, or an initial empty state if nothing is found or parsing fails.
   */
  private loadState(): AiProviderState {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        return JSON.parse(storedState);
      }
    } catch (error) {
      logError(error as Error, { context: 'AiProviderState.loadState' });
      // If parsing fails, clear the corrupted state to prevent future errors.
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return {
      geminiApiKey: null,
    };
  }

  /**
   * Saves the current state to local storage.
   * @private
   * @returns {void}
   */
  private saveState(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      logError(error as Error, { context: 'AiProviderState.saveState' });
      // This might happen if storage is full or in private browsing mode.
      console.error("Failed to save AI provider state to local storage.");
    }
  }
}

/**
 * A singleton instance of the AiProviderStateManager for easy access throughout the application.
 * This instance should be used to get or set the Gemini API key.
 *
 * @constant {AiProviderStateManager}
 */
export const aiProviderState = new AiProviderStateManager();
