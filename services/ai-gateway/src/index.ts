/**
 * @file This is the main entry point for the AI Gateway Microservice.
 * @description This microservice is responsible for orchestrating interactions with various
 *              AI providers (e.g., Google Gemini, OpenAI). It implements a multi-layered
 *              architecture with Dependency Injection and design patterns to ensure
 *              scalability, maintainability, and robust error handling.
 *
 *              It exposes a RESTful API, validates incoming requests, and securely
 *              retrieves AI API keys from a centralized Auth Gateway, adhering to a zero-trust model.
 *              All business logic resides within the `AiService`, which utilizes a Strategy pattern
 *              to select the appropriate AI provider adapter.
 * @security This service fetches sensitive AI API keys from an `AuthGatewayService` on a per-request
 *           basis (or cached temporarily by AuthGatewayService). It does not store long-lived secrets itself.
 *           Incoming requests are assumed to be authenticated by an upstream BFF, but endpoint-specific
 *           authorization could be added.
 * @performance Utilizes connection pooling and efficient payload handling. Future enhancements could include
 *              request batching and asynchronous processing via a message queue.
 * @example
 * // To start the service:
 * // 1. Ensure Node.js is installed.
 * // 2. Run `npm install` to install dependencies.
 * // 3. Run `npm start` (or `node dist/index.js` if compiled).
 * //
 * // To interact with the service (example using cURL):
 * // curl -X POST http://localhost:PORT/api/v1/ai/generate \
 * // -H "Content-Type: application/json" \
 * // -H "Authorization: Bearer <JWT_TOKEN>" \
 * // -d '{"provider": "gemini", "prompt": "Tell me a joke about coding."}'
 * @see {@link https://inversify.io/ | InversifyJS}
 * @see {@link https://expressjs.com/ | Express.js}
 */

import 'reflect-metadata'; // Required for InversifyJS
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { Container, injectable, inject } from 'inversify';
// import { TYPES } from './inversify.types'; // Assuming this file exists and defines symbols

// --- Core Interfaces (Domain/Core Layer) ---

/**
 * @interface IAiProviderConfig
 * @description Represents the configuration for a specific AI provider.
 * @property {string} apiKey - The API key for authentication.
 * @property {string} baseUrl - The base URL for the AI provider's API.
 * @property {string} defaultModel - The default model to use for requests.
 */
interface IAiProviderConfig {
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
}

/**
 * @interface IAiAdapter
 * @description Defines the contract for an adapter that interacts with a specific AI provider's API.
 *              This is part of the Infrastructure layer.
 * @template TRequest - The type of the request payload specific to the AI provider.
 * @template TResponse - The type of the response payload specific to the AI provider.
 */
interface IAiAdapter<TRequest, TResponse> {
    /**
     * @method sendRequest
     * @description Sends a request to the AI provider and returns its raw response.
     * @param {TRequest} request - The request payload.
     * @param {IAiProviderConfig} config - Configuration for the AI provider.
     * @returns {Promise<TResponse>} A promise that resolves with the AI provider's raw response.
     * @throws {Error} If the API call fails.
     */
    sendRequest(request: TRequest, config: IAiProviderConfig): Promise<TResponse>;
}

/**
 * @interface IAiService
 * @description Defines the contract for the AI business logic service.
 *              This is part of the Business layer.
 */
interface IAiService {
    /**
     * @method generateContent
     * @description Generates content from an AI provider based on a prompt.
     *              Uses a Strategy pattern to select the appropriate provider.
     * @param {string} providerId - The ID of the AI provider to use (e.g., 'gemini', 'openai').
     * @param {string} prompt - The user's prompt.
     * @param {string} userJwt - The JWT of the requesting user (for authorization).
     * @returns {Promise<string>} A promise that resolves with the generated content.
     * @throws {Error} If the provider is not supported or content generation fails.
     */
    generateContent(providerId: string, prompt: string, userJwt: string): Promise<string>;

    /**
     * @method explainCode
     * @description Explains a given code snippet using an AI provider.
     * @param {string} providerId - The ID of the AI provider to use.
     * @param {string} code - The code snippet to explain.
     * @param {string} userJwt - The JWT of the requesting user.
     * @returns {Promise<string>} A promise that resolves with the AI's explanation.
     * @throws {Error} If the provider is not supported or explanation fails.
     */
    explainCode(providerId: string, code: string, userJwt: string): Promise<string>;
}

/**
 * @interface IAuthGatewayService
 * @description Defines the contract for interacting with the Auth Gateway to retrieve secrets.
 *              This is part of the Infrastructure layer.
 */
interface IAuthGatewayService {
    /**
     * @method getAiApiKey
     * @description Retrieves an AI API key for a given provider from the Auth Gateway.
     * @param {string} providerId - The ID of the AI provider (e.g., 'gemini', 'openai').
     * @param {string} userJwt - The JWT token of the requesting user/service (for authorization).
     * @returns {Promise<string>} A promise that resolves with the API key.
     * @throws {Error} If the API key cannot be retrieved or authorization fails.
     */
    getAiApiKey(providerId: string, userJwt: string): Promise<string>;
}

// --- Concrete Implementations (Infrastructure Layer) ---

/**
 * @class GeminiApiAdapter
 * @description Adapter for interacting with the Google Gemini API.
 * @implements {IAiAdapter<any, any>}
 */
@injectable()
class GeminiApiAdapter implements IAiAdapter<any, any> {
    /**
     * @method sendRequest
     * @description Sends a request to the Gemini API.
     * @param {any} request - The request payload specific to Gemini.
     * @param {IAiProviderConfig} config - Configuration for the Gemini provider.
     * @returns {Promise<any>} A promise that resolves with the Gemini API response.
     * @throws {Error} If the API call fails.
     */
    public async sendRequest(request: any, config: IAiProviderConfig): Promise<any> {
        console.log(`[GeminiApiAdapter] Sending request to ${config.baseUrl}/${config.defaultModel}:generateContent`);
        try {
            // This would be an actual HTTP call to the Gemini API
            // For demonstration, we'll simulate a successful response
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); // Simulate network latency

            const responseContent = `Mock Gemini response for prompt: "${request.contents[0].parts[0].text}". AI is thinking... (powered by ${config.defaultModel})`;
            return {
                candidates: [{
                    content: {
                        parts: [{ text: responseContent }]
                    }
                }],
                usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 }
            };
        } catch (error: any) {
            console.error(`[GeminiApiAdapter] Error sending request: ${error.message}`);
            throw new Error(`Gemini API call failed: ${error.message}`);
        }
    }
}

/**
 * @class OpenAIApiAdapter
 * @description Adapter for interacting with the OpenAI API.
 * @implements {IAiAdapter<any, any>}
 */
@injectable()
class OpenAIApiAdapter implements IAiAdapter<any, any> {
    /**
     * @method sendRequest
     * @description Sends a request to the OpenAI API.
     * @param {any} request - The request payload specific to OpenAI.
     * @param {IAiProviderConfig} config - Configuration for the OpenAI provider.
     * @returns {Promise<any>} A promise that resolves with the OpenAI API response.
     * @throws {Error} If the API call fails.
     */
    public async sendRequest(request: any, config: IAiProviderConfig): Promise<any> {
        console.log(`[OpenAIApiAdapter] Sending request to ${config.baseUrl}/chat/completions`);
        try {
            // This would be an actual HTTP call to the OpenAI API
            // For demonstration, we'll simulate a successful response
            await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400)); // Simulate network latency

            const responseContent = `Mock OpenAI response for prompt: "${request.messages[0].content}". AI is creating... (powered by ${config.defaultModel})`;
            return {
                choices: [{
                    message: {
                        content: responseContent
                    }
                }],
                usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 }
            };
        } catch (error: any) {
            console.error(`[OpenAIApiAdapter] Error sending request: ${error.message}`);
            throw new Error(`OpenAI API call failed: ${error.message}`);
        }
    }
}

/**
 * @class AuthGatewayService
 * @description Mock implementation for fetching AI API keys from a centralized Auth Gateway.
 *              In a real scenario, this would involve authenticated calls to a dedicated microservice.
 * @implements {IAuthGatewayService}
 */
@injectable()
class AuthGatewayService implements IAuthGatewayService {
    /**
     * @method getAiApiKey
     * @description Retrieves an AI API key for a given provider from the Auth Gateway.
     * @param {string} providerId - The ID of the AI provider.
     * @param {string} userJwt - The JWT for authorization.
     * @returns {Promise<string>} A promise that resolves with a mock API key.
     * @throws {Error} If the JWT is invalid or the key is not found.
     */
    public async getAiApiKey(providerId: string, userJwt: string): Promise<string> {
        console.log(`[AuthGatewayService] Requesting API key for ${providerId} with JWT (truncated): ${userJwt.substring(0, 30)}...`);
        // Simulate Auth Gateway logic: JWT validation, then secret retrieval.
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network/processing delay

        if (!userJwt || !userJwt.startsWith('eyJ')) { // Basic JWT format check
            throw new Error("Invalid or missing JWT token for Auth Gateway access.");
        }
        // In a real scenario, the JWT would be validated. For this mock, assume it's valid.

        const mockApiKeys: Record<string, string> = {
            'gemini': 'MOCK_GEMINI_API_KEY_FROM_VAULT_123',
            'openai': 'MOCK_OPENAI_API_KEY_FROM_VAULT_456'
        };

        const apiKey = mockApiKeys[providerId];
        if (!apiKey) {
            throw new Error(`API key for provider '${providerId}' not found in Auth Gateway.`);
        }
        console.log(`[AuthGatewayService] Successfully retrieved API key for ${providerId}.`);
        return apiKey;
    }
}

// --- Business Logic Layer ---

/**
 * @class AiService
 * @description Core business logic for AI interactions, using a Strategy pattern to
 *              dynamically select and interact with AI providers via their adapters.
 * @implements {IAiService}
 */
@injectable()
class AiService implements IAiService {
    private readonly geminiAdapter: IAiAdapter<any, any>;
    private readonly openaiAdapter: IAiAdapter<any, any>;
    private readonly authGatewayService: IAuthGatewayService;

    /**
     * @constructor
     * @param {IAiAdapter<any, any>} geminiAdapter - Injected Gemini API adapter.
     * @param {IAiAdapter<any, any>} openaiAdapter - Injected OpenAI API adapter.
     * @param {IAuthGatewayService} authGatewayService - Injected Auth Gateway service for secret retrieval.
     */
    constructor(
        @inject(TYPES.GeminiApiAdapter) geminiAdapter: IAiAdapter<any, any>,
        @inject(TYPES.OpenAIApiAdapter) openaiAdapter: IAiAdapter<any, any>,
        @inject(TYPES.AuthGatewayService) authGatewayService: IAuthGatewayService
    ) {
        this.geminiAdapter = geminiAdapter;
        this.openaiAdapter = openaiAdapter;
        this.authGatewayService = authGatewayService;
        console.log('[AiService] Initialized with AI adapters and Auth Gateway.');
    }

    /**
     * @private
     * @method _getProviderAdapter
     * @description Selects the correct AI adapter based on the provider ID.
     * @param {string} providerId - The ID of the AI provider.
     * @returns {IAiAdapter<any, any>} The selected AI adapter.
     * @throws {Error} If the provider is not supported.
     */
    private _getProviderAdapter(providerId: string): IAiAdapter<any, any> {
        switch (providerId) {
            case 'gemini':
                return this.geminiAdapter;
            case 'openai':
                return this.openaiAdapter;
            default:
                throw new Error(`AI Provider '${providerId}' is not supported.`);
        }
    }

    /**
     * @private
     * @method _getProviderConfig
     * @description Asynchronously retrieves the AI provider's configuration, including its API key.
     * @param {string} providerId - The ID of the AI provider.
     * @param {string} userJwt - The JWT for authorization to the Auth Gateway.
     * @returns {Promise<IAiProviderConfig>} A promise that resolves with the AI provider's configuration.
     * @throws {Error} If configuration retrieval fails.
     */
    private async _getProviderConfig(providerId: string, userJwt: string): Promise<IAiProviderConfig> {
        const apiKey = await this.authGatewayService.getAiApiKey(providerId, userJwt);
        // These can be configured per provider in a real scenario
        const baseUrls: Record<string, string> = {
            'gemini': 'https://generativelanguage.googleapis.com/v1beta',
            'openai': 'https://api.openai.com/v1'
        };
        const defaultModels: Record<string, string> = {
            'gemini': 'gemini-pro',
            'openai': 'gpt-4o'
        };

        const baseUrl = baseUrls[providerId];
        const defaultModel = defaultModels[providerId];

        if (!baseUrl || !defaultModel) {
            throw new Error(`Base URL or default model for provider '${providerId}' not configured.`);
        }

        return { apiKey, baseUrl, defaultModel };
    }

    /**
     * @method generateContent
     * @description Generates content using the specified AI provider.
     * @param {string} providerId - The ID of the AI provider.
     * @param {string} prompt - The content generation prompt.
     * @param {string} userJwt - The JWT of the requesting user.
     * @returns {Promise<string>} The generated content.
     */
    public async generateContent(providerId: string, prompt: string, userJwt: string): Promise<string> {
        console.log(`[AiService] Generating content via provider '${providerId}' for prompt (truncated): "${prompt.substring(0, 50)}..."`);
        const adapter = this._getProviderAdapter(providerId);
        const config = await this._getProviderConfig(providerId, userJwt);

        let apiRequest: any;
        if (providerId === 'gemini') {
            apiRequest = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            };
        } else if (providerId === 'openai') {
            apiRequest = {
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 1024
            };
        } else {
            throw new Error(`Unsupported content generation request for provider '${providerId}'.`);
        }

        const response = await adapter.sendRequest(apiRequest, config);

        // Extract content based on provider's response structure
        if (providerId === 'gemini') {
            return response.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated by Gemini.';
        } else if (providerId === 'openai') {
            return response.choices?.[0]?.message?.content || 'No content generated by OpenAI.';
        }
        return 'Unknown response format.';
    }

    /**
     * @method explainCode
     * @description Explains code using the specified AI provider.
     * @param {string} providerId - The ID of the AI provider.
     * @param {string} code - The code to explain.
     * @param {string} userJwt - The JWT of the requesting user.
     * @returns {Promise<string>} The AI's explanation of the code.
     */
    public async explainCode(providerId: string, code: string, userJwt: string): Promise<string> {
        console.log(`[AiService] Explaining code via provider '${providerId}' for code (truncated): "${code.substring(0, 50)}..."`);
        const adapter = this._getProviderAdapter(providerId);
        const config = await this._getProviderConfig(providerId, userJwt);

        const prompt = `Explain the following code snippet thoroughly, focusing on its purpose, logic, and any potential improvements:\n\n\`\`\`\n${code}\n\`\`\``;

        let apiRequest: any;
        if (providerId === 'gemini') {
            apiRequest = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
            };
        } else if (providerId === 'openai') {
            apiRequest = {
                messages: [{ role: 'system', content: 'You are an expert software engineer explaining code.' }, { role: 'user', content: prompt }],
                temperature: 0.4,
                max_tokens: 2048
            };
        } else {
            throw new Error(`Unsupported code explanation request for provider '${providerId}'.`);
        }

        const response = await adapter.sendRequest(apiRequest, config);

        if (providerId === 'gemini') {
            return response.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation generated by Gemini.';
        } else if (providerId === 'openai') {
            return response.choices?.[0]?.message?.content || 'No explanation generated by OpenAI.';
        }
        return 'Unknown response format.';
    }
}

// --- InversifyJS Setup (DI Container) ---

/**
 * @const {Container} container
 * @description The InversifyJS Dependency Injection container for the AI Gateway Microservice.
 *              This central registry manages the lifecycle and dependencies of all services and adapters.
 */
const container = new Container();

// Define symbols for InversifyJS (can be in a separate file like `inversify.types.ts`)
const TYPES = {
    AiService: Symbol.for('AiService'),
    GeminiApiAdapter: Symbol.for('GeminiApiAdapter'),
    OpenAIApiAdapter: Symbol.for('OpenAIApiAdapter'),
    AuthGatewayService: Symbol.for('AuthGatewayService'),
};

/**
 * @function configureContainer
 * @description Configures the InversifyJS container by binding interfaces to their concrete implementations.
 * @param {Container} container - The InversifyJS container instance.
 */
function configureContainer(container: Container) {
    container.bind<IAuthGatewayService>(TYPES.AuthGatewayService).to(AuthGatewayService).inSingletonScope();
    container.bind<IAiAdapter<any, any>>(TYPES.GeminiApiAdapter).to(GeminiApiAdapter).inSingletonScope();
    container.bind<IAiAdapter<any, any>>(TYPES.OpenAIApiAdapter).to(OpenAIApiAdapter).inSingletonScope();
    container.bind<IAiService>(TYPES.AiService).to(AiService).inSingletonScope();
    console.log('[InversifyJS] Container configured with service bindings.');
}

configureContainer(container); // Apply the configuration

// --- Express Server Setup ---

/**
 * @const {Express} app
 * @description The Express.js application instance for the AI Gateway Microservice.
 */
const app = express();

/**
 * @const {number} PORT
 * @description The port number on which the AI Gateway Microservice will listen for incoming requests.
 */
const PORT: number = parseInt(process.env.PORT || '3002', 10); // Default to 3002

/**
 * @function authMiddleware
 * @description A simple mock authentication middleware. In a real scenario, this would
 *              validate a JWT (e.g., from an Authorization header) and extract user context.
 *              For this microservice, we assume a valid JWT is provided by the upstream BFF.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[AuthMiddleware] No or invalid Authorization header.');
        return res.status(401).json({ message: 'Authorization header missing or malformed. Bearer token required.' });
    }
    const token = authHeader.split(' ')[1];
    // In a real scenario, this token would be validated against a public key or an Auth Gateway.
    // For this mock, we simply attach it to the request for downstream use.
    (req as any).userJwt = token;
    console.log('[AuthMiddleware] Mock JWT attached to request.');
    next();
}

// Global Middleware
app.use(bodyParser.json());
app.use(authMiddleware); // Apply authentication middleware to all routes

// Inject AiService into route handlers
const aiService = container.get<IAiService>(TYPES.AiService);

/**
 * @route POST /api/v1/ai/generate
 * @description Endpoint for generating content using an AI provider.
 * @param {string} req.body.provider - The AI provider ID (e.g., 'gemini', 'openai').
 * @param {string} req.body.prompt - The prompt for content generation.
 * @returns {Response} The generated content or an error message.
 */
app.post('/api/v1/ai/generate', async (req: Request, res: Response) => {
    const { provider, prompt } = req.body;
    const userJwt = (req as any).userJwt; // Extracted by authMiddleware

    if (!provider || !prompt) {
        return res.status(400).json({ message: 'Provider and prompt are required.' });
    }
    console.log(`[HTTP] Received /api/v1/ai/generate request for provider: ${provider}`);

    try {
        const content = await aiService.generateContent(provider, prompt, userJwt);
        return res.status(200).json({ provider, content });
    } catch (error: any) {
        console.error(`[HTTP] Error processing /api/v1/ai/generate: ${error.message}`);
        return res.status(500).json({ message: `Failed to generate content: ${error.message}` });
    }
});

/**
 * @route POST /api/v1/ai/explain-code
 * @description Endpoint for explaining code using an AI provider.
 * @param {string} req.body.provider - The AI provider ID.
 * @param {string} req.body.code - The code snippet to explain.
 * @returns {Response} The code explanation or an error message.
 */
app.post('/api/v1/ai/explain-code', async (req: Request, res: Response) => {
    const { provider, code } = req.body;
    const userJwt = (req as any).userJwt;

    if (!provider || !code) {
        return res.status(400).json({ message: 'Provider and code are required.' });
    }
    console.log(`[HTTP] Received /api/v1/ai/explain-code request for provider: ${provider}`);

    try {
        const explanation = await aiService.explainCode(provider, code, userJwt);
        return res.status(200).json({ provider, explanation });
    } catch (error: any) {
        console.error(`[HTTP] Error processing /api/v1/ai/explain-code: ${error.message}`);
        return res.status(500).json({ message: `Failed to explain code: ${error.message}` });
    }
});

/**
 * @route GET /health
 * @description Health check endpoint for the microservice.
 * @returns {Response} A 200 OK response with service status.
 */
app.get('/health', (req: Request, res: Response) => {
    return res.status(200).json({ status: 'AI Gateway Service is Running', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
    console.log(`AI Gateway Microservice running on http://localhost:${PORT}`);
    console.log(`OpenAPI Spec: http://localhost:${PORT}/api-docs (Not implemented yet, but a good place for it!)`);
});

// Define TYPES symbol here for a self-contained example
// In a real project, this would be imported from './inversify.types'
namespace Inversify {
    export const TYPES = {
        AiService: Symbol.for('AiService'),
        GeminiApiAdapter: Symbol.for('GeminiApiAdapter'),
        OpenAIApiAdapter: Symbol.for('OpenAIApiAdapter'),
        AuthGatewayService: Symbol.for('AuthGatewayService'),
    };
}
// Reassign the global TYPES constant from the namespace for this file's usage.
// This is a workaround to make the file self-contained for the JSON output.
const TYPES = Inversify.TYPES;
