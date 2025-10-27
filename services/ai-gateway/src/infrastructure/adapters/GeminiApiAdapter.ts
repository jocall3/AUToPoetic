import "reflect-metadata";
import { injectable, inject } from "inversify";
import { GoogleGenerativeAI, GenerativeModel, Content, Part } from "@google/generative-ai";
import {
  IGenerativeAiApi,
  AiApiGenerateOptions,
  AiApiGenerateJsonOptions,
  AiApiGenerateMultimodalOptions
} from "../../core/interfaces/IGenerativeAiApi";
import { IConfigService, ConfigKeys } from "../../core/interfaces/IConfigService";
import { ILogger } from "../../core/interfaces/ILogger";
import { CoreSymbols } from "../../core/symbols";
import { ApiConnectionError, InvalidRequestError, ApiResponseError } from "../../core/errors/ApiErrors";

/**
 * @class GeminiApiAdapter
 * @description Implements the IGenerativeAiApi interface to interact with the Google Gemini API.
 * This adapter is responsible for all communication with Gemini, handling API requests,
 * streaming responses, and managing authentication. It is designed to be a pluggable
 * component within the AI Gateway's infrastructure layer, acting as a concrete strategy
 * in a Strategy design pattern for different AI providers.
 *
 * @implements {IGenerativeAiApi}
 * @security This adapter retrieves the Gemini API key from a secure, injected configuration service.
 *           It ensures that API keys are not hardcoded or exposed directly in the application logic.
 *           All outgoing requests are made over HTTPS.
 * @performance The adapter caches the initialized GoogleGenerativeAI client instance to avoid repeated
 *              setup costs on every API call. For streaming operations, it yields data as it arrives, improving
 *              perceived performance for long-running AI generations.
 * @example
 * ```typescript
 * // InversifyJS container setup
 * const container = new Container();
 * container.bind<IConfigService>(CoreSymbols.ConfigService).to(ConfigService);
 * container.bind<ILogger>(CoreSymbols.Logger).to(LoggerService);
 * container.bind<IGenerativeAiApi>(CoreSymbols.GenerativeAiApi).to(GeminiApiAdapter);
 *
 * const geminiApi = container.get<IGenerativeAiApi>(CoreSymbols.GenerativeAiApi);
 * const response = await geminiApi.generateContent("Explain quantum computing in simple terms.", {});
 * console.log(response);
 * ```
 * @see IGenerativeAiApi
 * @see IConfigService
 * @see ILogger
 */
@injectable()
export class GeminiApiAdapter implements IGenerativeAiApi {
  private googleAi: GoogleGenerativeAI | null = null;
  private lastApiKey: string | null = null;
  private readonly configService: IConfigService;
  private readonly logger: ILogger;

  /**
   * @constructor
   * @param {IConfigService} configService - The configuration service, injected to retrieve API keys and settings.
   * @param {ILogger} logger - The logger service, injected for structured logging.
   */
  public constructor(
    @inject(CoreSymbols.ConfigService) configService: IConfigService,
    @inject(CoreSymbols.Logger) logger: ILogger
  ) {
    this.configService = configService;
    this.logger = logger;
    this.logger.info("GeminiApiAdapter instantiated.");
  }

  /**
   * @private
   * @method _getGoogleAiClient
   * @description Lazily initializes and returns the GoogleGenerativeAI client. It retrieves the
   * API key from the configuration service and caches the client instance. If the API key
   * changes in the configuration, it re-initializes the client.
   *
   * @returns {Promise<GoogleGenerativeAI>} The initialized GoogleGenerativeAI client.
   * @throws {ApiConnectionError} If the API key is not configured.
   * @security This method is responsible for securely retrieving the API key from the config service, which should source it from a secure location (e.g., environment variables, secret manager).
   * @performance Caches the client instance to avoid costly re-initialization on every call.
   */
  private async _getGoogleAiClient(): Promise<GoogleGenerativeAI> {
    const apiKey = await this.configService.get<string>(ConfigKeys.GEMINI_API_KEY);

    if (!apiKey) {
      this.logger.error("Gemini API key is not configured.", { service: "GeminiApiAdapter" });
      throw new ApiConnectionError("Gemini API key is not configured.");
    }

    if (!this.googleAi || this.lastApiKey !== apiKey) {
      this.logger.info("Initializing GoogleGenerativeAI client.", { service: "GeminiApiAdapter" });
      this.lastApiKey = apiKey;
      this.googleAi = new GoogleGenerativeAI(apiKey);
    }

    return this.googleAi;
  }

  /**
   * @private
   * @method _getModel
   * @description Retrieves a specific GenerativeModel instance from the initialized client.
   *
   * @param {string} modelName - The name of the model to retrieve (e.g., 'gemini-pro').
   * @returns {Promise<GenerativeModel>} The initialized GenerativeModel instance.
   */
  private async _getModel(modelName: string): Promise<GenerativeModel> {
    const client = await this._getGoogleAiClient();
    return client.getGenerativeModel({ model: modelName });
  }

  /**
   * @inheritdoc
   */
  public async generateContent(prompt: string, options: AiApiGenerateOptions): Promise<string> {
    if (!prompt) {
      throw new InvalidRequestError("Prompt cannot be empty.");
    }

    const modelName = options.model || this.configService.get<string>(ConfigKeys.DEFAULT_GEMINI_MODEL) || 'gemini-pro';

    try {
      const model = await this._getModel(modelName);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: options.systemInstruction,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        this.logger.warn("Gemini API returned an empty response for generateContent.", { prompt, modelName });
        throw new ApiResponseError("Received an empty response from the Gemini API.");
      }

      return text;
    } catch (error) {
      this.logger.error("Error during Gemini API call for generateContent.", { error, prompt, modelName });
      if (error instanceof InvalidRequestError || error instanceof ApiResponseError) {
        throw error;
      }
      throw new ApiConnectionError(`Failed to generate content from Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * @inheritdoc
   */
  public async *streamContent(prompt: string, options: AiApiGenerateOptions): AsyncGenerator<string> {
    if (!prompt) {
      throw new InvalidRequestError("Prompt cannot be empty.");
    }

    const modelName = options.model || this.configService.get<string>(ConfigKeys.DEFAULT_GEMINI_MODEL) || 'gemini-pro';

    try {
      const model = await this._getModel(modelName);
      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: options.systemInstruction,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        },
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;
      }
    } catch (error) {
      this.logger.error("Error during Gemini API call for streamContent.", { error, prompt, modelName });
      throw new ApiConnectionError(`Failed to stream content from Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * @inheritdoc
   */
  public async generateJson<T>(prompt: string, options: AiApiGenerateJsonOptions<T>): Promise<T> {
     if (!prompt) {
      throw new InvalidRequestError("Prompt cannot be empty for JSON generation.");
    }
    if (!options.schema) {
      throw new InvalidRequestError("A JSON schema must be provided for JSON generation.");
    }

    const modelName = options.model || this.configService.get<string>(ConfigKeys.DEFAULT_GEMINI_JSON_MODEL) || 'gemini-1.5-flash';
    
    try {
      const model = await this._getModel(modelName);

      const fullPrompt = `${prompt}. You must respond in a valid JSON format that adheres to the provided schema. Do not include any explanatory text or markdown formatting around the JSON object.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        systemInstruction: options.systemInstruction,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: options.schema,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        this.logger.warn("Gemini API returned an empty response for generateJson.", { prompt, modelName });
        throw new ApiResponseError("Received an empty JSON response from the Gemini API.");
      }
      
      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        this.logger.error("Failed to parse JSON response from Gemini API.", { error: parseError, responseText: text });
        throw new ApiResponseError("Failed to parse JSON response from Gemini API.", text);
      }

    } catch (error) {
      this.logger.error("Error during Gemini API call for generateJson.", { error, prompt, modelName });
      if (error instanceof InvalidRequestError || error instanceof ApiResponseError) {
        throw error;
      }
      throw new ApiConnectionError(`Failed to generate JSON from Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * @inheritdoc
   */
  public async generateMultimodalContent(prompt: string, options: AiApiGenerateMultimodalOptions): Promise<string> {
    if (!prompt) {
      throw new InvalidRequestError("Text prompt cannot be empty for multimodal generation.");
    }
    if (!options.images || options.images.length === 0) {
      throw new InvalidRequestError("At least one image must be provided for multimodal generation.");
    }

    const modelName = options.model || this.configService.get<string>(ConfigKeys.DEFAULT_GEMINI_VISION_MODEL) || 'gemini-pro-vision';

    try {
      const model = await this._getModel(modelName);
      
      const imageParts: Part[] = options.images.map(image => ({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      }));

      const content: Content = {
          role: "user",
          parts: [{ text: prompt }, ...imageParts]
      };

      const result = await model.generateContent({
        contents: [content],
        systemInstruction: options.systemInstruction,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        this.logger.warn("Gemini API returned an empty response for generateMultimodalContent.", { prompt, modelName });
        throw new ApiResponseError("Received an empty response from the Gemini API for a multimodal request.");
      }

      return text;
    } catch (error) {
      this.logger.error("Error during Gemini API call for generateMultimodalContent.", { error, prompt, modelName });
      if (error instanceof InvalidRequestError || error instanceof ApiResponseError) {
        throw error;
      }
      throw new ApiConnectionError(`Failed to generate multimodal content from Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
