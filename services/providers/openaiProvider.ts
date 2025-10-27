/**
 * @file Implements the AI provider strategy for OpenAI models.
 * @module services/providers/openaiProvider
 * @description This module provides a concrete implementation of the IAiProvider strategy.
 * It is responsible for formatting requests according to the OpenAI API specification
 * and sending them to the Backend-for-Frontend (BFF) via a generic API client.
 * It does not hold any secrets or make direct calls to external services, adhering
 * to the new zero-trust, microservice-oriented architecture. This class is designed
 * to be managed by a Dependency Injection container.
 *
 * @see {services/core/ai-provider.interface.ts} for the IAiProvider interface definition.
 * @see {services/infrastructure/bff-api-client.interface.ts} for the IBffApiClient used for communication.
 *
 * @performance This class introduces a minimal overhead for request formatting. The actual
 * performance is determined by the BFF and the downstream AIGatewayService.
 *
 * @security This class is secure by design. It is stateless and does not handle
 * credentials. All communication is proxied through an authenticated BFF client.
 *
 * @example
 * ```typescript
 * // Assuming a DI container is set up
 * const bffClient = new BffApiClient(); // Implements IBffApiClient
 * const openAiProvider = new OpenAiProvider(bffClient);
 *
 * const response = await openAiProvider.generateContent({ prompt: "Hello, world!" });
 * console.log(response.content);
 * ```
 */

// --- Core Interfaces (would typically be in a separate `core` directory) ---

/**
 * @interface IBffApiClient
 * @description Defines the contract for a client that communicates with the BFF.
 * This abstracts the actual network communication (e.g., GraphQL, REST) away
 * from the AI provider strategies.
 */
export interface IBffApiClient {
  /**
   * @method generate
   * @description Sends a non-streaming AI generation request to the BFF.
   * @param {string} provider - The name of the AI provider to use (e.g., 'openai').
   * @param {object} payload - The provider-specific payload.
   * @returns {Promise<any>} A promise that resolves with the response data from the BFF.
   */
  generate(provider: string, payload: object): Promise<any>;

  /**
   * @method stream
   * @description Sends a streaming AI generation request to the BFF.
   * @param {string} provider - The name of the AI provider to use.
   * @param {object} payload - The provider-specific payload.
   * @returns {AsyncGenerator<any, void, unknown>} An async generator yielding response chunks.
   */
  stream(provider: string, payload: object): AsyncGenerator<any, void, unknown>;
}

/**
 * @interface AiRequestOptions
 * @description Defines common, provider-agnostic options for an AI request.
 */
export interface AiRequestOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * @interface AiRequest
 * @description Represents a generic request to an AI provider.
 */
export interface AiRequest {
  prompt: string;
  systemInstruction?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  model?: string;
  options?: AiRequestOptions;
}

/**
 * @interface AiResponse
 * @description Represents a generic, non-streaming response from an AI provider.
 */
export interface AiResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * @interface AiStreamingChunk
 * @description Represents a single chunk of a streaming AI response.
 */
export interface AiStreamingChunk {
  chunk: string;
  isFinal: boolean;
  finalUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * @interface IAiProvider
 * @description Defines the contract for an AI provider strategy. Each provider
 * (OpenAI, Gemini, etc.) will have a class that implements this interface.
 */
export interface IAiProvider {
  /**
   * @property {string} name - The unique identifier for this provider (e.g., 'openai').
   */
  readonly name: string;

  /**
   * @method generateContent
   * @description Generates a single, non-streaming response.
   * @param {AiRequest} request - The generic AI request object.
   * @returns {Promise<AiResponse>} The full AI response.
   */
  generateContent(request: AiRequest): Promise<AiResponse>;

  /**
   * @method streamContent
   * @description Generates a streaming response.
   * @param {AiRequest} request - The generic AI request object.
   * @returns {AsyncGenerator<AiStreamingChunk, void, unknown>} An async generator for response chunks.
   */
  streamContent(request: AiRequest): AsyncGenerator<AiStreamingChunk, void, unknown>;
}


// --- OpenAI Provider Implementation ---

/**
 * @interface OpenAiMessage
 * @description Defines the structure of a message object for the OpenAI Chat Completions API.
 */
interface OpenAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * @interface OpenAiChatCompletionPayload
 * @description Represents the payload for an OpenAI Chat Completions request.
 */
interface OpenAiChatCompletionPayload {
  model: string;
  messages: OpenAiMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * @class OpenAiProvider
 * @classdesc
 * Concrete implementation of the `IAiProvider` interface for OpenAI models.
 * This class translates generic AI requests into the format expected by the OpenAI API
 * and delegates the actual network communication to the BFF API client.
 *
 * @implements {IAiProvider}
 */
export class OpenAiProvider implements IAiProvider {
  /**
   * @property {string} name - The unique identifier for this provider.
   */
  public readonly name = "openai";

  private readonly bffApiClient: IBffApiClient;

  /**
   * @constructor
   * @param {IBffApiClient} bffApiClient - An instance of the BFF API client, expected to be
   *        injected by a DI container. This client is responsible for making authenticated requests to the BFF.
   */
  public constructor(bffApiClient: IBffApiClient) {
    this.bffApiClient = bffApiClient;
  }

  /**
   * @method generateContent
   * @description Generates a single, non-streaming response from an OpenAI model by proxying
   * the request through the BFF.
   *
   * @param {AiRequest} request - The generic AI request object.
   * @returns {Promise<AiResponse>} A promise that resolves with the full AI response.
   *
   * @throws {Error} If the API call to the BFF fails or returns an error.
   * @performance The performance of this method is primarily dependent on the network latency
   * to the BFF and the response time of the OpenAI API itself.
   */
  public async generateContent(request: AiRequest): Promise<AiResponse> {
    const payload = this.createPayload(request, false);
    
    // The BFF client abstracts the GraphQL mutation.
    const response = await this.bffApiClient.generate(this.name, payload);
    
    // Assuming the BFF returns data in the generic AiResponse format.
    return {
      content: response.content,
      usage: {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      },
    };
  }

  /**
   * @method streamContent
   * @description Generates a streaming response from an OpenAI model by proxying the request
   * through the BFF.
   *
   * @param {AiRequest} request - The generic AI request object.
   * @returns {AsyncGenerator<AiStreamingChunk, void, unknown>} An async generator that yields chunks of the AI response.
   *
   * @throws {Error} If the API call to the BFF fails or the stream encounters an error.
   * @performance This method begins yielding data as soon as the first chunk is received from the
   * BFF, improving perceived performance for long generations.
   */
  public async *streamContent(request: AiRequest): AsyncGenerator<AiStreamingChunk, void, unknown> {
    const payload = this.createPayload(request, true);

    // The BFF client abstracts the GraphQL subscription or SSE connection.
    const stream = this.bffApiClient.stream(this.name, payload);

    for await (const bffChunk of stream) {
      // Assuming the BFF streams data in the generic AiStreamingChunk format.
      yield {
        chunk: bffChunk.chunk,
        isFinal: bffChunk.isFinal,
        finalUsage: bffChunk.isFinal ? {
          promptTokens: bffChunk.usage.promptTokens,
          completionTokens: bffChunk.usage.completionTokens,
          totalTokens: bffChunk.usage.totalTokens,
        } : undefined,
      };
    }
  }

  /**
   * @private
   * @method createPayload
   * @description A private helper method to create the OpenAI-specific payload from a generic AiRequest.
   *
   * @param {AiRequest} request - The generic AI request.
   * @param {boolean} stream - Whether to enable streaming in the payload.
   * @returns {OpenAiChatCompletionPayload} The formatted payload for the OpenAI API.
   */
  private createPayload(request: AiRequest, stream: boolean): OpenAiChatCompletionPayload {
    const messages: OpenAiMessage[] = [];
    if (request.systemInstruction) {
      messages.push({ role: "system", content: request.systemInstruction });
    }
    if (request.history) {
        request.history.forEach(turn => {
            messages.push({ role: turn.role, content: turn.content });
        });
    }
    messages.push({ role: "user", content: request.prompt });

    const payload: OpenAiChatCompletionPayload = {
      model: request.model || 'gpt-4o-mini',
      messages: messages,
      temperature: request.options?.temperature,
      max_tokens: request.options?.maxTokens,
      stream: stream,
    };
    
    return payload;
  }
}
