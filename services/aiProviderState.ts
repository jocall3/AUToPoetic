/**
 * @file Defines the core interfaces, types, and state management for AI providers.
 * @module services/aiProviderState
 * @description This module serves as the foundation for the AI service layer's Strategy pattern,
 *              allowing for interchangeable AI providers like Gemini, OpenAI, etc. It includes a manager
 *              class to handle the registration and lifecycle of these providers.
 * @see services/aiService.ts
 * @see services/infrastructure/GeminiApiAdapter.ts
 * @security This module defines contracts that will handle sensitive API keys. Implementations
 *           should ensure keys are retrieved securely from a vault and not exposed.
 */

/**
 * Represents a generic error originating from the AI provider layer.
 * This custom error class provides a structured way to handle and categorize AI-related failures.
 *
 * @example
 * try {
 *   // an AI provider operation
 * } catch (error) {
 *   if (error instanceof AiProviderError) {
 *     console.error('AI Provider Error:', error.code, error.message);
 *   }
 * }
 */
export class AiProviderError extends Error {
  /** The programmatic error code for easier identification. */
  public readonly code: string;
  /** The original error object, if one was caught and wrapped. */
  public readonly originalError?: any;

  /**
   * Creates an instance of AiProviderError.
   * @param message A human-readable error message.
   * @param code A unique, machine-readable error code (e.g., 'API_TIMEOUT', 'INVALID_CONFIG').
   * @param originalError The original error object that was caught.
   */
  constructor(message: string, code: string = 'UNKNOWN_AI_ERROR', originalError?: any) {
    super(message);
    this.name = 'AiProviderError';
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, AiProviderError.prototype);
  }
}

/**
 * Enum for unique identifiers of supported AI providers.
 * Used to register and retrieve specific provider implementations.
 */
export enum AiProviderId {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  MOCK = 'mock',
}

/**
 * Represents a single message in a conversational context, designed to be provider-agnostic.
 */
export interface AiChatMessage {
  role: 'user' | 'model' | 'system';
  content: string | { type: string; [key: string]: any }[]; // Support for multimodal content
}

/**
 * Represents the token usage and cost information for an AI request.
 */
export interface AiUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

/**
 * A standardized, provider-agnostic response from an AI model.
 */
export interface AiResponse {
  content: string;
  usage: AiUsageInfo;
  model: string;
  finishReason?: string;
  rawResponse?: any;
}

/**
 * Describes the capabilities and metadata of a specific AI model.
 */
export interface AiModelInfo {
  id: string;
  contextWindow: number;
  inputCostPerMillionTokens: number;
  outputCostPerMillionTokens: number;
  supportsStreaming: boolean;
  supportsJsonOutput: boolean;
  supportsVision: boolean;
}

/**
 * Defines the configuration structure for an AI provider.
 */
export interface IAiProviderConfig {
  id: AiProviderId;
  /** The ID of the API key secret stored in the VaultService. */
  apiKeySecretId: string;
  baseUrl?: string;
  defaultModel: string;
  models: AiModelInfo[];
}

/**
 * The core Strategy interface that all AI provider adapters must implement.
 * This contract ensures that any AI provider can be used interchangeably by the application.
 * @see {@link AiProviderManager}
 */
export interface IAiProvider {
  /** The unique identifier for the provider. */
  readonly id: AiProviderId;

  /**
   * Initializes the provider with its configuration, including the API key.
   * @param config The provider-specific configuration.
   * @param apiKey The plaintext API key retrieved from the vault.
   * @returns A promise that resolves when initialization is complete.
   * @throws {AiProviderError} If initialization fails.
   */
  initialize(config: IAiProviderConfig, apiKey: string): Promise<void>;

  /**
   * Generates content in a single, non-streaming response.
   * @param prompt The prompt string or an array of chat messages.
   * @param options Provider-specific options (e.g., temperature, maxTokens).
   * @returns A promise resolving to a standardized AI response.
   * @throws {AiProviderError} If the API call fails.
   */
  generateContent(prompt: string | AiChatMessage[], options?: any): Promise<AiResponse>;

  /**
   * Generates content as a stream of text chunks.
   * @param prompt The prompt string or an array of chat messages.
   * @param options Provider-specific options for streaming.
   * @returns An async generator that yields string chunks of the response.
   * @throws {AiProviderError} If the streaming API call fails.
   */
  streamContent(prompt: string | AiChatMessage[], options?: any): AsyncGenerator<string>;

  /**
   * Retrieves the list of models supported by this provider.
   * @returns An array of `AiModelInfo` objects.
   */
  getModels(): AiModelInfo[];

  /**
   * Retrieves information for a specific model by its ID.
   * @param modelId The ID of the model.
   * @returns The `AiModelInfo` object, or undefined if not found.
   */
  getModel(modelId: string): AiModelInfo | undefined;
}

/**
 * @class AiProviderManager
 * @description Manages the lifecycle and selection of AI providers. This class acts as a
 *              central registry and factory for AI provider instances, implementing the
 *              Strategy and Factory design patterns.
 * @security This class is responsible for orchestrating the retrieval of API keys and should be
 *           handled as a sensitive component. It does not store keys itself.
 * @performance Manages a cache of initialized provider instances to avoid re-initialization overhead.
 * @example
 * const manager = new AiProviderManager(vaultService);
 * manager.registerProvider(new GeminiApiAdapter());
 * manager.loadConfigurations([geminiConfig]);
 * await manager.setActiveProvider(AiProviderId.GEMINI);
 * const activeProvider = manager.getActiveProvider();
 * const response = await activeProvider.generateContent('Hello, world!');
 */
export class AiProviderManager {
  private registeredProviders: Map<AiProviderId, IAiProvider> = new Map();
  private initializedProviders: Map<AiProviderId, IAiProvider> = new Map();
  private providerConfigs: Map<AiProviderId, IAiProviderConfig> = new Map();
  private activeProviderId: AiProviderId | null = null;

  // In a DI-enabled architecture, the VaultService would be injected here.
  // constructor(@inject(TYPES.VaultService) private vaultService: IVaultService) {}
  constructor() {}

  /**
   * Registers a provider implementation. The provider is not initialized at this stage.
   * @param provider The provider instance to register.
   * @performance This operation is lightweight and simply adds the provider to a map.
   */
  registerProvider(provider: IAiProvider): void {
    if (this.registeredProviders.has(provider.id)) {
      console.warn(`Provider with ID "${provider.id}" is already registered. Overwriting.`);
    }
    this.registeredProviders.set(provider.id, provider);
  }

  /**
   * Loads configurations for multiple providers.
   * @param configs An array of provider configurations.
   */
  loadConfigurations(configs: IAiProviderConfig[]): void {
    configs.forEach(config => this.providerConfigs.set(config.id, config));
  }

  /**
   * Sets the active AI provider for the application.
   * @param providerId The ID of the provider to set as active.
   * @throws {Error} If the provider is not registered or configured.
   */
  setActiveProvider(providerId: AiProviderId): void {
    if (!this.registeredProviders.has(providerId)) {
      throw new Error(`Provider "${providerId}" is not registered.`);
    }
    if (!this.providerConfigs.has(providerId)) {
      throw new Error(`Configuration for provider "${providerId}" not found.`);
    }
    this.activeProviderId = providerId;
  }

  /**
   * Retrieves the currently active, initialized AI provider instance.
   * Lazily initializes the provider on first request.
   * @returns A promise that resolves to the active `IAiProvider` instance.
   * @throws {AiProviderError} If no active provider is set or initialization fails.
   * @security This method triggers the retrieval of the API key from the vault.
   */
  async getActiveProvider(): Promise<IAiProvider> {
    if (!this.activeProviderId) {
      throw new AiProviderError('No active AI provider is set.', 'NO_ACTIVE_PROVIDER');
    }
    return this.getProvider(this.activeProviderId);
  }

  /**
   * Gets a specific provider instance by its ID, initializing it if necessary.
   * @param providerId The ID of the provider to get.
   * @returns A promise that resolves to the `IAiProvider` instance.
   * @throws {AiProviderError} If the provider is not found, not configured, or fails to initialize.
   */
  async getProvider(providerId: AiProviderId): Promise<IAiProvider> {
    // Return from cache if already initialized
    if (this.initializedProviders.has(providerId)) {
      return this.initializedProviders.get(providerId)!;
    }

    const provider = this.registeredProviders.get(providerId);
    const config = this.providerConfigs.get(providerId);

    if (!provider) {
      throw new AiProviderError(`Provider with ID "${providerId}" is not registered.`, 'PROVIDER_NOT_REGISTERED');
    }
    if (!config) {
      throw new AiProviderError(`Configuration for provider "${providerId}" not found.`, 'PROVIDER_NOT_CONFIGURED');
    }

    try {
      // In a real DI setup, we'd resolve the VaultService here.
      // For now, we assume a global or imported vaultService exists.
      const { getDecryptedCredential } = await import('./vaultService');
      const apiKey = await getDecryptedCredential(config.apiKeySecretId);

      if (!apiKey) {
        throw new AiProviderError(`API key secret "${config.apiKeySecretId}" not found in vault for provider "${providerId}".`, 'API_KEY_NOT_FOUND');
      }

      await provider.initialize(config, apiKey);
      this.initializedProviders.set(providerId, provider);
      return provider;
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      throw new AiProviderError(`Failed to initialize provider "${providerId}": ${(error as Error).message}`, 'INITIALIZATION_FAILED', error);
    }
  }
}

/**
 * A singleton instance of the AiProviderManager for easy access throughout the application.
 * In a DI-based architecture, this would be registered as a singleton in the container.
 */
export const aiProviderManager = new AiProviderManager();
