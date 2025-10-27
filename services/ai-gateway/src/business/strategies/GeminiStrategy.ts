/**
 * @file Implements the AI generation strategy for Google's Gemini models.
 * @module business/strategies/GeminiStrategy
 *
 * @description
 * This file contains the implementation of the `IAiGenerationStrategy` for interacting
 * with Google Gemini. It adapts the generic AI request format of the application to
 * the specific format required by the Gemini API, leveraging an underlying adapter
 * for the actual API communication. This class is a key component of the Strategy
 * design pattern used to abstract different AI providers.
 *
 * @see {@link IAiGenerationStrategy} - The interface this class implements.
 * @see {@link GeminiApiAdapter} - The adapter used for communication with the Gemini API.
 * @performance
 * The performance of this strategy is directly tied to the latency of the Google Gemini API
 * and the efficiency of the `GeminiApiAdapter`. Streaming operations are designed to
 * improve perceived performance by delivering content incrementally.
 * @security
 * This strategy relies on the `GeminiApiAdapter` to handle API key authentication securely.
 * It does not store or manage credentials itself. It is responsible for passing through
 * safety settings and other security-related configurations to the API.
 */

import { injectable, inject } from 'inversify';
import { DI_TYPES } from '../../../di/types';
import { IAiGenerationStrategy } from '../../core/interfaces/IAiGenerationStrategy';
import { IGeminiApiAdapter } from '../../core/interfaces/IGeminiApiAdapter';
import {
  AiContentRequest,
  AiContentResponse,
  AiStreamResponse,
} from '../../core/models/AiModels';

/**
 * @class GeminiStrategy
 * @classdesc
 * An implementation of `IAiGenerationStrategy` that uses Google's Gemini models.
 * This class is responsible for orchestrating content generation and streaming
 * by delegating the actual API calls to the `IGeminiApiAdapter`.
 *
 * It is designed to be registered with a Dependency Injection container and
 * used by business-layer services that require AI content generation.
 *
 * @implements {IAiGenerationStrategy}
 * @example
 * ```typescript
 * // In the DI container setup (e.g., inversify.config.ts)
 * container.bind<IAiGenerationStrategy>(DI_TYPES.AiGenerationStrategy).to(GeminiStrategy).whenTargetNamed('gemini');
 *
 * // In a service
 * \@injectable()
 * class MyService {
 *   constructor(
 *     \@inject(DI_TYPES.AiGenerationStrategy) \@named('gemini') private aiStrategy: IAiGenerationStrategy
 *   ) {}
 *
 *   async doSomething() {
 *     const response = await this.aiStrategy.generateContent(request);
 *     // ...
 *   }
 * }
 * ```
 */
@injectable()
export class GeminiStrategy implements IAiGenerationStrategy {
  /**
   * @private
   * @type {IGeminiApiAdapter}
   * @description The adapter for making calls to the Google Gemini API.
   */
  private readonly geminiApiAdapter: IGeminiApiAdapter;

  /**
   * @constructor
   * @param {IGeminiApiAdapter} geminiApiAdapter - An instance of the Gemini API adapter, injected by the DI container.
   *
   * @description
   * Creates an instance of `GeminiStrategy`. Dependencies are injected via the constructor,
   * adhering to the Dependency Inversion Principle.
   */
  public constructor(
    @inject(DI_TYPES.GeminiApiAdapter) geminiApiAdapter: IGeminiApiAdapter,
  ) {
    this.geminiApiAdapter = geminiApiAdapter;
  }

  /**
   * @method generateContent
   * @description
   * Generates content from the Gemini model in a single, non-streaming response.
   * It takes a generic `AiContentRequest` and returns a generic `AiContentResponse`.
   *
   * @param {AiContentRequest} request - The content generation request object, containing the prompt,
   *                                     system instructions, and configuration.
   * @returns {Promise<AiContentResponse>} A promise that resolves with the generated content,
   *                                       including text and any function calls.
   * @throws {Error} Throws an error if the API call fails or the response is malformed.
   *                 The specific error type will be determined by the underlying adapter.
   * @performance This is a blocking network call. Latency will depend on the Gemini API response time.
   * @security Assumes the request object does not contain sensitive data that shouldn't be sent to the AI provider.
   * @example
   * ```typescript
   * const request: AiContentRequest = {
   *   // ... request properties
   * };
   * const response = await geminiStrategy.generateContent(request);
   * console.log(response.text);
   * ```
   */
  public async generateContent(
    request: AiContentRequest,
  ): Promise<AiContentResponse> {
    const result = await this.geminiApiAdapter.generateContent(request);

    // The adapter is expected to return a response that can be directly mapped.
    // In a more complex scenario, this is where we would map the provider-specific
    // response to our application's generic AiContentResponse model.
    return {
      text: result.text(),
      functionCalls: result.functionCalls(),
    };
  }

  /**
   * @method streamContent
   * @description
   * Generates content from the Gemini model as a stream, yielding chunks as they become available.
   * This is ideal for real-time UI updates.
   *
   * @param {AiContentRequest} request - The content generation request object.
   * @returns {AsyncGenerator<AiStreamResponse, void, unknown>} An async generator that yields `AiStreamResponse` chunks.
   *                                                          Each chunk contains a piece of text.
   * @throws {Error} Throws an error if the streaming connection fails. The specific error
   *                 type will be determined by the underlying adapter.
   * @performance Improves perceived performance by returning data to the client as it's generated,
   *              rather than waiting for the full response.
   * @example
   * ```typescript
   * const request: AiContentRequest = {
   *   // ... request properties
   * };
   * let fullText = '';
   * for await (const chunk of geminiStrategy.streamContent(request)) {
   *   fullText += chunk.text;
   *   // update UI with chunk.text
   * }
   * console.log('Final response:', fullText);
   * ```
   */
  public async *streamContent(
    request: AiContentRequest,
  ): AsyncGenerator<AiStreamResponse, void, unknown> {
    const stream = await this.geminiApiAdapter.generateContentStream(request);

    for await (const chunk of stream) {
      // The adapter is expected to yield chunks that can be directly mapped.
      // Here we map the provider-specific chunk to our generic AiStreamResponse.
      yield {
        text: chunk.text(),
      };
    }
  }
}
