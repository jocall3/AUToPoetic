/**
 * @file Implements the client-side adapter for interacting with Google Gemini AI models
 * via the application's Backend-for-Frontend (BFF).
 * @module services/geminiService
 * @description This service acts as a concrete strategy in a Strategy design pattern. It encapsulates
 * all communication logic for Gemini-specific AI tasks, sending authenticated GraphQL
 * requests to the BFF. It abstracts away the direct use of the Gemini API and SDK, adhering
 * to the new zero-trust microservice architecture.
 *
 * @see services/aiService.ts The context that will use this strategy.
 * @security This service does not handle any API keys. All requests are authenticated
 * with a short-lived JWT (Google OAuth2 Access Token) sent to the BFF. The BFF is responsible for securely managing
 * and using the Gemini API key.
 * @performance Streaming methods return AsyncGenerators for real-time data handling,
 * improving perceived performance on the client.
 */

import { logError } from './telemetryService';
import type {
  GeneratedFile,
  StructuredPrSummary,
  StructuredExplanation,
  SemanticColorTheme,
  SecurityVulnerability,
  CodeSmell,
  CustomFeature,
  CronParts,
} from '../types';

// In the new architecture, this endpoint points to our BFF GraphQL server.
const BFF_GRAPHQL_ENDPOINT = '/graphql';

/**
 * @class GeminiService
 * @description Provides methods to interact with Gemini AI models through the BFF.
 * This class handles the construction of GraphQL queries and mutations, authentication,
 * and parsing of responses, including handling streaming data.
 */
class GeminiService {

  /**
   * @private
   * @method _getAuthToken
   * @description Retrieves the authentication token from session storage.
   * @returns {string | null} The JWT token or null if not found.
   */
  private _getAuthToken(): string | null {
    return sessionStorage.getItem('google_access_token');
  }

  /**
   * @private
   * @method _request
   * @description A private helper to execute GraphQL requests against the BFF.
   * It automatically attaches the JWT authentication token to the headers.
   *
   * @template T
   * @param {string} query - The GraphQL query or mutation string.
   * @param {object} [variables] - The variables for the GraphQL operation.
   * @returns {Promise<T>} A promise that resolves with the data from the GraphQL response.
   * @throws {Error} If the network request fails, authentication token is missing, or the GraphQL response contains errors.
   * @security This method is the single point of contact with the BFF for this service,
   * ensuring all outgoing requests are properly authenticated.
   * @performance Manages a single fetch call for non-streaming requests.
   */
  private async _request<T>(query: string, variables?: object): Promise<T> {
    const token = this._getAuthToken();
    if (!token) {
      throw new Error('Authentication token not available. Please sign in.');
    }

    try {
      const response = await fetch(BFF_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`BFF request failed with status ${response.status}: ${response.statusText}`);
      }

      const jsonResponse = await response.json();

      if (jsonResponse.errors) {
        const errorMessage = `GraphQL Error: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`;
        logError(new Error(errorMessage), { errors: jsonResponse.errors });
        throw new Error(errorMessage);
      }

      return jsonResponse.data;
    } catch (error) {
      logError(error as Error, { query: query.substring(0, 100), variables });
      throw error;
    }
  }

  /**
   * @private
   * @method _streamRequest
   * @description A private helper for handling streaming GraphQL responses from the BFF,
   * assuming a newline-delimited JSON (NDJSON) streaming format.
   *
   * @param {string} query - The GraphQL query or mutation string for a streaming operation.
   * @param {object} [variables] - The variables for the GraphQL operation.
   * @returns {AsyncGenerator<string, void, unknown>} An async generator that yields string chunks of the response.
   * @throws {Error} If the network request fails or authentication token is missing.
   * @performance Uses the Fetch API's streaming capabilities to process data as it arrives.
   */
  private async *_streamRequest(query: string, variables?: object): AsyncGenerator<string, void, unknown> {
    const token = this._getAuthToken();
    if (!token) {
      throw new Error('Authentication token not available. Please sign in.');
    }

    try {
      const response = await fetch(BFF_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`BFF streaming request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            // In case the last chunk was incomplete and now is flushed
            yield buffer;
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last, potentially incomplete, line

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.errors) {
                throw new Error(`GraphQL streaming error: ${parsed.errors.map((e: any) => e.message).join(', ')}`);
              }
              // Assuming the BFF wraps streamed chunks in a standard way
              if (parsed.data && typeof parsed.data.streamChunk === 'string') {
                yield parsed.data.streamChunk;
              }
            } catch (e) {
              // It might be a partial JSON object, so we let it buffer
              console.warn('Could not parse partial stream chunk, buffering...', line);
            }
          }
        }
      }
    } catch (error) {
      logError(error as Error, { query: query.substring(0, 100), variables });
      throw error;
    }
  }

  /**
   * @public
   * @method generateContent
   * @description Requests the BFF to generate text content from a prompt using Gemini.
   * @param {string} prompt - The text prompt for the model.
   * @param {string} [systemInstruction] - Optional system instruction to guide the AI.
   * @returns {Promise<string>} The generated text content.
   * @example
   * const story = await geminiService.generateContent('Tell me a short story about a robot.');
   */
  public async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    const query = `
      mutation GenerateGeminiContent($prompt: String!, $systemInstruction: String) {
        generateGeminiContent(prompt: $prompt, systemInstruction: $systemInstruction)
      }
    `;
    const response = await this._request<{ generateGeminiContent: string }>(query, { prompt, systemInstruction });
    return response.generateGeminiContent;
  }

  /**
   * @public
   * @method streamContent
   * @description Requests the BFF to stream text content from a prompt using Gemini.
   * @param {string} prompt - The text prompt for the model.
   * @param {string} [systemInstruction] - Optional system instruction to guide the AI.
   * @returns {AsyncGenerator<string, void, unknown>} An async generator yielding text chunks.
   * @example
   * for await (const chunk of geminiService.streamContent('Write a long poem.')) {
   *   console.log(chunk);
   * }
   */
  public streamContent(prompt: string, systemInstruction?: string): AsyncGenerator<string, void, unknown> {
    // Note: GraphQL subscriptions are the standard for streaming, but over HTTP, a regular query/mutation
    // can also return a streaming response type (like NDJSON or multipart/mixed).
    // This implementation assumes a query that returns a stream.
    const query = `
      query StreamGeminiContent($prompt: String!, $systemInstruction: String) {
        streamChunk: streamGeminiContent(prompt: $prompt, systemInstruction: $systemInstruction)
      }
    `;
    return this._streamRequest(query, { prompt, systemInstruction });
  }

  /**
   * @public
   * @method generateJson
   * @description Requests the BFF to generate a structured JSON response from a prompt and schema.
   * @template T - The expected type of the JSON response.
   * @param {string} prompt - The text prompt guiding the JSON generation.
   * @param {object} schema - The JSON schema for the expected output.
   * @param {string} [systemInstruction] - Optional system instruction.
   * @returns {Promise<T>} The parsed JSON object matching the schema.
   * @example
   * const userSchema = { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } };
   * const user = await geminiService.generateJson<{ name: string, age: number }>('Create a user named John Doe, age 30.', userSchema);
   */
  public async generateJson<T>(prompt: string, schema: object, systemInstruction?: string): Promise<T> {
    const query = `
      mutation GenerateGeminiJson($prompt: String!, $schemaJson: String!, $systemInstruction: String) {
        generateGeminiJson(prompt: $prompt, schemaJson: $schemaJson, systemInstruction: $systemInstruction)
      }
    `;
    // GraphQL doesn't have a native JSON schema type, so we stringify it.
    const response = await this._request<{ generateGeminiJson: T }>(query, {
      prompt,
      schemaJson: JSON.stringify(schema),
      systemInstruction,
    });
    // Assuming the BFF returns the already-parsed JSON data.
    return response.generateGeminiJson;
  }

  /**
   * @public
   * @method generateFullStackFeature
   * @description Requests the BFF to generate all files for a full-stack feature.
   * @param {string} prompt - A description of the feature.
   * @param {string} framework - The frontend framework (e.g., 'React').
   * @param {string} styling - The styling solution (e.g., 'Tailwind CSS').
   * @returns {Promise<GeneratedFile[]>} A promise resolving to an array of generated files.
   */
  public async generateFullStackFeature(prompt: string, framework: string, styling: string): Promise<GeneratedFile[]> {
    const query = `
      mutation GenerateFullStackFeature($prompt: String!, $framework: String!, $styling: String!) {
        generateFullStackFeature(prompt: $prompt, framework: $framework, styling: $styling) {
          filePath
          content
          description
        }
      }
    `;
    const response = await this._request<{ generateFullStackFeature: GeneratedFile[] }>(query, { prompt, framework, styling });
    return response.generateFullStackFeature;
  }

  /**
   * @public
   * @method explainCodeStructured
   * @description Requests a structured explanation of a code snippet from the BFF.
   * @param {string} code - The code to be explained.
   * @returns {Promise<StructuredExplanation>} A promise resolving to the structured explanation.
   */
  public async explainCodeStructured(code: string): Promise<StructuredExplanation> {
    const query = `
      query ExplainCodeStructured($code: String!) {
        explainCodeStructured(code: $code) {
          summary
          lineByLine {
            lines
            explanation
          }
          complexity {
            time
            space
          }
          suggestions
        }
      }
    `;
    const response = await this._request<{ explainCodeStructured: StructuredExplanation }>(query, { code });
    return response.explainCodeStructured;
  }

   /**
   * @public
   * @method generateImage
   * @description Requests the BFF to generate an image from a text prompt.
   * @param {string} prompt The text prompt for image generation.
   * @returns {Promise<string>} A promise resolving to a data URL (e.g., base64 encoded) of the generated image.
   * @example
   * const imageUrl = await geminiService.generateImage('A futuristic cityscape at sunset.');
   */
  public async generateImage(prompt: string): Promise<string> {
    const query = `
      mutation GenerateImage($prompt: String!) {
        generateImage(prompt: $prompt)
      }
    `;
    const response = await this._request<{ generateImage: string }>(query, { prompt });
    return response.generateImage;
  }
}

// Export a singleton instance of the service to be used across the application.
// This aligns with the DI pattern where a container would manage this instance.
export const geminiService = new GeminiService();
