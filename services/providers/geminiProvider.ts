/**
 * @file Implements the AI provider strategy for Google's Gemini models.
 * @module services/providers/geminiProvider
 * @description This module provides a concrete implementation of the IAiProvider interface,
 * specifically for interacting with the Google Gemini API. It handles client initialization,
 * API key retrieval from the vault, request formatting, and response parsing for various
 * Gemini models and functionalities (text, chat, JSON, images).
 * @see {@link core/ai/IAiProvider} For the interface contract.
 * @security This provider retrieves the 'gemini_api_key' from the VaultService. All interactions with the Gemini API are performed over HTTPS. Prompts and responses may contain sensitive data and should be handled with care by consumers of this service.
 * @performance Caches the Gemini client instance to avoid re-initialization. Implements retry logic for API calls to handle transient network errors.
 */

// NOTE: IAiProvider and AiProviderError are defined here as they would exist in a `core` layer in the new architecture.
// This makes the file self-contained for the purpose of this refactoring task.

import { GoogleGenAI, Type as GoogleGenAiType, GenerateContentResponse } from "@google/genai";
import { getDecryptedCredential } from '../vaultService';
import { logError, measurePerformance } from '../telemetryService';

/**
 * @interface AiGenerationConfig
 * @description Configuration options for an AI generation request.
 * @property {number} [temperature] - Controls the randomness of the output. Lower values mean less random completions.
 * @property {number} [maxRetries] - The maximum number of retry attempts for the request.
 * @property {string} [model] - The specific AI model to use for this request, overriding the provider's default.
 */
export interface AiGenerationConfig {
  temperature?: number;
  maxRetries?: number;
  model?: string;
}

/**
 * @interface IAiProvider
 * @description Defines the contract for an AI service provider, abstracting the underlying model (e.g., Gemini, OpenAI).
 * @security This interface deals with potentially sensitive data. Implementations must handle data securely and not log prompts or responses unless explicitly configured for debugging.
 * @performance Implementations should handle retries, timeouts, and streaming efficiently to provide a responsive user experience.
 */
export interface IAiProvider {
  /**
   * Generates content in a streaming fashion.
   * @param {string | { parts: any[] }} prompt The prompt to send to the model. Can be a simple string or a complex object with parts for multimodal input.
   * @param {string} systemInstruction An instruction to guide the model's behavior and set its persona.
   * @param {AiGenerationConfig} [config] Optional configuration for the generation request.
   * @returns {AsyncGenerator<string>} An async generator that yields strings representing content chunks.
   * @throws {AiProviderError} If the request fails after all retry attempts.
   * @example
   * for await (const chunk of provider.streamContent("Tell me a story.", "You are a storyteller.")) {
   *   console.log(chunk);
   * }
   */
  streamContent(prompt: string | { parts: any[] }, systemInstruction: string, config?: AiGenerationConfig): AsyncGenerator<string>;

  /**
   * Generates content in a single, non-streaming response.
   * @param {string} prompt The prompt to send to the model.
   * @param {string} systemInstruction An instruction to guide the model's behavior.
   * @param {AiGenerationConfig} [config] Optional configuration for the generation request.
   * @returns {Promise<string>} A promise resolving to the complete generated content string.
   * @throws {AiProviderError} If the request fails after all retry attempts.
   * @example
   * const response = await provider.generateContent("What is the capital of France?", "You are a helpful assistant.");
   */
  generateContent(prompt: string, systemInstruction: string, config?: AiGenerationConfig): Promise<string>;

  /**
   * Generates a structured JSON object based on a prompt and a schema.
   * @template T The expected type of the parsed JSON object.
   * @param {any} prompt The prompt to guide JSON generation.
   * @param {string} systemInstruction An instruction to guide the model's behavior.
   * @param {any} schema The JSON schema definition to enforce on the output.
   * @param {AiGenerationConfig} [config] Optional configuration for the generation request.
   * @returns {Promise<T>} A promise resolving to the parsed JSON object of type T.
   * @throws {AiProviderError} If the request fails, the response is not valid JSON, or parsing fails.
   * @example
   * const schema = { type: GoogleGenAiType.OBJECT, properties: { city: { type: GoogleGenAiType.STRING } } };
   * const result = await provider.generateJson<{ city: string }>("Capital of France?", "Respond in JSON.", schema);
   */
  generateJson<T>(prompt: any, systemInstruction: string, schema: any, config?: AiGenerationConfig): Promise<T>;

  /**
   * Generates an image from a text prompt.
   * @param {string} prompt The text prompt describing the image.
   * @returns {Promise<string>} A promise resolving to the base64 data URL of the generated image.
   * @throws {AiProviderError} If image generation is not supported or fails.
   * @example
   * const imageUrl = await provider.generateImage("A futuristic city at sunset.");
   */
  generateImage(prompt: string): Promise<string>;
}

/**
 * @class AiProviderError
 * @description Custom error class for AI Provider operations to provide more context on failures.
 * @extends Error
 */
export class AiProviderError extends Error {
  /**
   * @param {string} message The error message.
   * @param {unknown} [originalError] The original error that was caught, if any.
   */
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'AiProviderError';
    Object.setPrototypeOf(this, AiProviderError.prototype);
  }
}

/**
 * @class GeminiProvider
 * @description Implements the IAiProvider interface for Google's Gemini models.
 * This class encapsulates all logic for interacting with the Gemini API, including
 * authentication, request/response handling, streaming, and error management.
 * @implements {IAiProvider}
 */
export class GeminiProvider implements IAiProvider {
  private ai: GoogleGenAI | null = null;
  private lastUsedApiKey: string | null = null;
  private static readonly DEFAULT_MODEL = 'gemini-2.5-flash';
  private static readonly IMAGE_MODEL = 'imagen-4.0-generate-001';

  /**
   * @private
   * @method _getClient
   * @description Lazily initializes and retrieves the GoogleGenAI client. It fetches the
   * API key from the secure vault and caches the client instance. The client is
   * re-initialized if the API key changes.
   * @returns {Promise<GoogleGenAI>} A promise that resolves to an initialized GoogleGenAI instance.
   * @throws {AiProviderError} If the API key is not found in the vault.
   * @security Retrieves the API key using `getDecryptedCredential` for secure handling.
   */
  private async _getClient(): Promise<GoogleGenAI> {
    return measurePerformance('GeminiProvider._getClient', async () => {
      const apiKey = await getDecryptedCredential('gemini_api_key');
      if (!apiKey) {
        throw new AiProviderError("Google Gemini API key not found in vault. Please add it in the Workspace Connector Hub.");
      }

      if (!this.ai || apiKey !== this.lastUsedApiKey) {
        this.lastUsedApiKey = apiKey;
        this.ai = new GoogleGenAI({ apiKey });
      }
      
      return this.ai;
    });
  }

  /**
   * @private
   * @method _withRetry
   * @description A wrapper for API calls that implements an exponential backoff retry mechanism
   * to handle transient network errors or rate limiting.
   * @template T The expected return type of the function being retried.
   * @param {() => Promise<T>} fn The asynchronous function to execute and retry upon failure.
   * @param {number} [maxRetries=3] The maximum number of retry attempts.
   * @returns {Promise<T>} A promise that resolves with the result of the function if successful.
   * @throws {AiProviderError} If the function fails after all retry attempts.
   */
  private async _withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = Math.pow(2, i) * 100; // 100ms, 200ms, 400ms...
        logError(error as Error, {
          context: 'GeminiProvider._withRetry',
          attempt: i + 1,
          maxRetries,
          delay,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new AiProviderError(`AI operation failed after ${maxRetries} retries.`, lastError);
  }

  /**
   * @inheritdoc
   */
  public async *streamContent(prompt: string | { parts: any[] }, systemInstruction: string, config?: AiGenerationConfig): AsyncGenerator<string> {
    const operationName = 'GeminiProvider.streamContent';
    try {
      const aiClient = await this._getClient();
      const response = await this._withRetry(() => 
        aiClient.models.generateContentStream({
          model: config?.model || GeminiProvider.DEFAULT_MODEL,
          contents: prompt as any,
          config: { systemInstruction, temperature: config?.temperature }
        }),
        config?.maxRetries
      );

      for await (const chunk of response) {
        yield chunk.text;
      }
    } catch (error) {
      logError(error as Error, { operationName, prompt, systemInstruction });
      if (error instanceof Error) {
        yield `\n\n**Error:** An error occurred while communicating with the AI model: ${error.message}`;
      } else {
        yield "\n\n**Error:** An unknown error occurred while generating the response.";
      }
    }
  }

  /**
   * @inheritdoc
   */
  public async generateContent(prompt: string, systemInstruction: string, config?: AiGenerationConfig): Promise<string> {
    const operationName = 'GeminiProvider.generateContent';
    return measurePerformance(operationName, async () => {
      try {
        const aiClient = await this._getClient();
        const response = await this._withRetry(() => 
          aiClient.models.generateContent({
            model: config?.model || GeminiProvider.DEFAULT_MODEL,
            contents: prompt,
            config: { systemInstruction, temperature: config?.temperature }
          }),
          config?.maxRetries
        );
        return response.text;
      } catch (error) {
        logError(error as Error, { operationName, prompt, systemInstruction });
        throw new AiProviderError(`Failed to generate content: ${(error as Error).message}`, error);
      }
    });
  }

  /**
   * @inheritdoc
   */
  public async generateJson<T>(prompt: any, systemInstruction: string, schema: any, config?: AiGenerationConfig): Promise<T> {
    const operationName = 'GeminiProvider.generateJson';
    return measurePerformance(operationName, async () => {
      try {
        const aiClient = await this._getClient();
        const response = await this._withRetry(() => 
          aiClient.models.generateContent({
            model: config?.model || GeminiProvider.DEFAULT_MODEL,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: config?.temperature,
            }
          }),
          config?.maxRetries
        );
        return JSON.parse(response.text.trim()) as T;
      } catch (error) {
        logError(error as Error, { operationName, prompt, systemInstruction });
        throw new AiProviderError(`Failed to generate JSON: ${(error as Error).message}`, error);
      }
    });
  }
  
  /**
   * @inheritdoc
   */
  public async generateImage(prompt: string): Promise<string> {
    const operationName = 'GeminiProvider.generateImage';
    return measurePerformance(operationName, async () => {
      try {
        const aiClient = await this._getClient();
        const response = await this._withRetry(() => 
          aiClient.models.generateImages({
            model: GeminiProvider.IMAGE_MODEL,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/png' },
          })
        );
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
      } catch (error) {
        logError(error as Error, { operationName, prompt });
        throw new AiProviderError(`Failed to generate image: ${(error as Error).message}`, error);
      }
    });
  }
}
