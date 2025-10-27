/**
 * @file services/aiService.ts
 * @module services/ai
 * @description This module defines the client-side service layer for all AI interactions,
 *              adhering to the new federated microservice architecture. It completely abstracts
 *              the backend communication, replacing direct SDK calls with authenticated GraphQL
 *              requests to the Backend-for-Frontend (BFF).
 *
 *              This file implements a multi-layered service architecture:
 *              1. Core Layer: Defines abstract interfaces (`IAiApiAdapter`, `IAiBusinessService`).
 *              2. Infrastructure Layer: Implements `BffAiApiAdapter` to handle GraphQL communication with the BFF.
 *              3. Business Layer: Implements `AiBusinessService` to orchestrate AI-related use cases.
 *
 *              All direct AI model interactions, prompt construction, and secret management are
 *              now handled server-side by the AIGatewayService, invoked by the BFF. This client-side
 *              service is a thin, secure adapter.
 * @see {AuthGateway} - All requests are authenticated via JWTs managed by the AuthGateway.
 * @see {WorkerPoolManager} - Heavy computations like prompt assembly are offloaded to web workers.
 */

import { getAuthToken } from './authService'; // Assumes authService is refactored to provide JWTs
import { workerPoolManager } from './workerPoolManager'; // Assumes a worker pool manager service
import {
  GeneratedFile,
  StructuredPrSummary,
  StructuredExplanation,
  SemanticColorTheme,
  CodeSmell,
  CustomFeature,
  CronParts,
  SecurityVulnerability,
  CommandResponse
} from '../types';

// These types would be shared between the BFF and the client.
interface GenerateContentStreamParams {
  prompt: string | { parts: any[] };
  systemInstruction: string;
  temperature?: number;
}

interface GenerateJsonParams {
  prompt: any;
  systemInstruction: string;
  schema: any;
  temperature?: number;
}

// =================================================================
// CORE LAYER: INTERFACES
// =================================================================

/**
 * @interface IAiApiAdapter
 * @description Defines the contract for the infrastructure layer that communicates with the AI backend (BFF).
 *              Each method corresponds to a specific GraphQL query or mutation.
 * @security This adapter is responsible for attaching the authentication JWT to every request.
 */
export interface IAiApiAdapter {
  /**
   * @method generateContentStream
   * @description Initiates a streaming request to the BFF's `generateContentStream` GraphQL endpoint.
   * @param {GenerateContentStreamParams} params - The parameters for the content generation.
   * @returns {AsyncGenerator<string>} An async generator that yields text chunks from the stream.
   * @throws {Error} If the network request or GraphQL execution fails.
   * @example const stream = adapter.generateContentStream({ prompt: 'Hello', systemInstruction: 'Be nice' });
   */
  generateContentStream(params: GenerateContentStreamParams): AsyncGenerator<string>;

  /**
   * @method generateContent
   * @description Makes a non-streaming request to the BFF's `generateContent` GraphQL endpoint.
   * @param {GenerateContentStreamParams} params - The parameters for the content generation.
   * @returns {Promise<string>} A promise that resolves to the complete generated text.
   * @throws {Error} If the network request or GraphQL execution fails.
   */
  generateContent(params: GenerateContentStreamParams): Promise<string>;

  /**
   * @method generateJson
   * @description Makes a request to the BFF's `generateJson` GraphQL endpoint, expecting a structured JSON response.
   * @template T - The expected type of the parsed JSON object.
   * @param {GenerateJsonParams} params - The parameters for the JSON generation, including the schema.
   * @returns {Promise<T>} A promise that resolves to the parsed JSON object of type T.
   * @throws {Error} If the network request, GraphQL execution, or JSON parsing fails.
   */
  generateJson<T>(params: GenerateJsonParams): Promise<T>;

   /**
   * @method getInferenceFunction
   * @description Makes a request to the BFF's `functionCall` GraphQL endpoint for agent-like behavior.
   * @param {string} prompt - The user's prompt.
   * @returns {Promise<CommandResponse>} A promise resolving to a command response, which may include function calls.
   * @throws {Error} If the network request or GraphQL execution fails.
   */
  getInferenceFunction(prompt: string): Promise<CommandResponse>;
}

/**
 * @interface IAiBusinessService
 * @description Defines the high-level contract for the AI Business Service.
 *              Application components will interact with this interface, which abstracts
 *              away the details of API communication and worker management.
 */
export interface IAiBusinessService {
  streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature?: number): AsyncGenerator<string>;
  generateContent(prompt: string, systemInstruction: string, temperature?: number): Promise<string>;
  generateJson<T>(prompt: any, systemInstruction: string, schema: any, temperature?: number): Promise<T>;
  explainCodeStructured(code: string): Promise<StructuredExplanation>;
  generateAppFeatureComponent(prompt: string): Promise<Omit<CustomFeature, 'id'>>;
  generateFullStackFeature(prompt: string, framework: string, styling: string): Promise<GeneratedFile[]>;
  generateSemanticTheme(prompt: { parts: any[] }): Promise<SemanticColorTheme>;
  detectCodeSmells(code: string): Promise<CodeSmell[]>;
  generatePrSummaryStructured(diff: string): Promise<StructuredPrSummary>;
  generateCronFromDescription(description: string): Promise<CronParts>;
  analyzeCodeForVulnerabilities(code: string): Promise<SecurityVulnerability[]>;
  getInferenceFunction(prompt: string): Promise<CommandResponse>;
}

// =================================================================
// INFRASTRUCTURE LAYER: BFF ADAPTER
// =================================================================

const BFF_GRAPHQL_ENDPOINT = '/bff/graphql';

/**
 * @class BffAiApiAdapter
 * @implements {IAiApiAdapter}
 * @description Implements the IAiApiAdapter interface to communicate with the BFF via GraphQL.
 *              It handles making authenticated fetch requests and processing the responses.
 * @performance This adapter handles streaming responses, which is crucial for perceived performance in the UI.
 * @security It retrieves a short-lived JWT from the `authService` for each request, ensuring a zero-trust model.
 */
class BffAiApiAdapter implements IAiApiAdapter {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token not available. Please sign in again.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }
  
  private async executeGraphQL<T>(query: string, variables: Record<string, any>): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(BFF_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`BFF request failed with status ${response.status}: ${errorBody}`);
    }

    const { data, errors } = await response.json();
    if (errors) {
      throw new Error(`GraphQL error: ${errors.map((e: any) => e.message).join(', ')}`);
    }
    
    return data;
  }
  
  async * generateContentStream(params: GenerateContentStreamParams): AsyncGenerator<string> {
    const query = `
      subscription GenerateContentStream($prompt: PromptInput!, $systemInstruction: String!, $temperature: Float) {
        generateContentStream(prompt: $prompt, systemInstruction: $systemInstruction, temperature: $temperature)
      }
    `;
    const variables = {
      prompt: typeof params.prompt === 'string' ? { text: params.prompt } : params.prompt,
      systemInstruction: params.systemInstruction,
      temperature: params.temperature
    };
    
    const headers = await this.getHeaders();
    const response = await fetch(BFF_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });

    if (!response.body) {
        throw new Error('Streaming response not available.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const json = JSON.parse(line.substring(6));
                    if (json.data?.generateContentStream) {
                        yield json.data.generateContentStream;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Stream reading error:', e);
        throw new Error('Failed to read from AI stream.');
    }
  }

  async generateContent(params: GenerateContentStreamParams): Promise<string> {
    const query = `
      query GenerateContent($prompt: PromptInput!, $systemInstruction: String!, $temperature: Float) {
        generateContent(prompt: $prompt, systemInstruction: $systemInstruction, temperature: $temperature)
      }
    `;
    const variables = {
        prompt: typeof params.prompt === 'string' ? { text: params.prompt } : params.prompt,
        systemInstruction: params.systemInstruction,
        temperature: params.temperature
    };
    const response = await this.executeGraphQL<{ generateContent: string }>(query, variables);
    return response.generateContent;
  }
  
  async generateJson<T>(params: GenerateJsonParams): Promise<T> {
     const query = `
      query GenerateJson($prompt: PromptInput!, $systemInstruction: String!, $schema: JSON!, $temperature: Float) {
        generateJson(prompt: $prompt, systemInstruction: $systemInstruction, schema: $schema, temperature: $temperature)
      }
    `;
    const variables = {
        prompt: typeof params.prompt === 'string' ? { text: params.prompt } : params.prompt,
        systemInstruction: params.systemInstruction,
        schema: params.schema,
        temperature: params.temperature
    };
    const response = await this.executeGraphQL<{ generateJson: string }>(query, variables);
    return JSON.parse(response.generateJson) as T;
  }

  async getInferenceFunction(prompt: string): Promise<CommandResponse> {
    const query = `
      query GetInferenceFunction($prompt: String!) {
        getInferenceFunction(prompt: $prompt) {
          text
          functionCalls {
            name
            args
          }
        }
      }
    `;
     const variables = { prompt };
     const response = await this.executeGraphQL<{ getInferenceFunction: CommandResponse }>(query, variables);
     if (response.getInferenceFunction.functionCalls) {
        response.getInferenceFunction.functionCalls.forEach(call => {
            if (typeof call.args === 'string') {
                call.args = JSON.parse(call.args);
            }
        });
     }
     return response.getInferenceFunction;
  }
}

// =================================================================
// BUSINESS LAYER: SERVICE IMPLEMENTATION
// =================================================================

/**
 * @class AiBusinessService
 * @implements {IAiBusinessService}
 * @description The primary implementation of the AI business logic. It orchestrates calls to the
 *              AI API adapter and offloads heavy tasks to the worker pool.
 * @example
 * const aiService = AiServiceFactory.getInstance();
 * const explanation = await aiService.explainCodeStructured("const x = 1;");
 */
class AiBusinessService implements IAiBusinessService {
  private apiAdapter: IAiApiAdapter;

  /**
   * @constructor
   * @param {IAiApiAdapter} apiAdapter - An instance of an AI API adapter.
   */
  constructor(apiAdapter: IAiApiAdapter) {
    this.apiAdapter = apiAdapter;
  }
  
  streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature?: number): AsyncGenerator<string> {
    return this.apiAdapter.generateContentStream({ prompt, systemInstruction, temperature });
  }

  generateContent(prompt: string, systemInstruction: string, temperature?: number): Promise<string> {
    return this.apiAdapter.generateContent({ prompt, systemInstruction, temperature });
  }

  generateJson<T>(prompt: any, systemInstruction: string, schema: any, temperature?: number): Promise<T> {
    return this.apiAdapter.generateJson({ prompt, systemInstruction, schema, temperature });
  }

  async explainCodeStructured(code: string): Promise<StructuredExplanation> {
     return workerPoolManager.enqueueTask<StructuredExplanation>({
        name: 'explainCodeStructured',
        payload: { code }
     });
  }

  async generateAppFeatureComponent(prompt: string): Promise<Omit<CustomFeature, 'id'>> {
    return workerPoolManager.enqueueTask<Omit<CustomFeature, 'id'>>({
        name: 'generateAppFeatureComponent',
        payload: { prompt }
    });
  }

  async generateFullStackFeature(prompt: string, framework: string, styling: string): Promise<GeneratedFile[]> {
    return workerPoolManager.enqueueTask<GeneratedFile[]>({
        name: 'generateFullStackFeature',
        payload: { prompt, framework, styling }
    });
  }
  
  async generateSemanticTheme(prompt: { parts: any[] }): Promise<SemanticColorTheme> {
      return workerPoolManager.enqueueTask<SemanticColorTheme>({ name: 'generateSemanticTheme', payload: { prompt } });
  }
  
  async getInferenceFunction(prompt: string): Promise<CommandResponse> {
    return this.apiAdapter.getInferenceFunction(prompt);
  }
  
  async detectCodeSmells(code: string): Promise<CodeSmell[]> {
    return workerPoolManager.enqueueTask<CodeSmell[]>({
        name: 'detectCodeSmells',
        payload: { code }
    });
  }

  async generatePrSummaryStructured(diff: string): Promise<StructuredPrSummary> {
    return workerPoolManager.enqueueTask<StructuredPrSummary>({
        name: 'generatePrSummaryStructured',
        payload: { diff }
    });
  }
  
  async generateCronFromDescription(description: string): Promise<CronParts> {
    return workerPoolManager.enqueueTask<CronParts>({
        name: 'generateCronFromDescription',
        payload: { description }
    });
  }
  
  async analyzeCodeForVulnerabilities(code: string): Promise<SecurityVulnerability[]> {
     return workerPoolManager.enqueueTask<SecurityVulnerability[]>({
        name: 'analyzeCodeForVulnerabilities',
        payload: { code }
    });
  }
}

// =================================================================
// DI CONTAINER SETUP & EXPORT (Simplified Service Locator)
// =================================================================

/**
 * @class AiServiceFactory
 * @description A simple factory/service locator to instantiate and provide a singleton
 *              instance of the AiBusinessService, managing its dependencies.
 *              This pattern simulates a Dependency Injection container setup.
 */
class AiServiceFactory {
  private static instance: IAiBusinessService;

  /**
   * @method getInstance
   * @description Gets the singleton instance of the AI Business Service.
   * @returns {IAiBusinessService} The singleton instance.
   */
  public static getInstance(): IAiBusinessService {
    if (!AiServiceFactory.instance) {
      const apiAdapter = new BffAiApiAdapter();
      AiServiceFactory.instance = new AiBusinessService(apiAdapter);
    }
    return AiServiceFactory.instance;
  }
}

/**
 * @const {IAiBusinessService} aiService
 * @description The singleton instance of the AI Business Service, exported for use throughout the application.
 * @example
 * import { aiService } from './services/aiService';
 * async function explain() {
 *   const explanation = await aiService.explainCodeStructured("const x=1;");
 *   console.log(explanation);
 * }
 */
export const aiService: IAiBusinessService = AiServiceFactory.getInstance();
