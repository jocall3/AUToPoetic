/**
 * @file This module defines the core domain models, types, and interfaces for the AI Gateway Service.
 * @module core/types
 * @security This module defines data structures but does not handle sensitive data directly.
 *           Validation of these types in service boundaries is crucial to prevent injection attacks.
 * @performance Type definitions have no direct performance impact, but the structure of these
 *              models can influence data serialization/deserialization performance.
 */

/**
 * @enum {string}
 * @description Represents the supported AI providers.
 * @example
 * const provider = AiProvider.GEMINI;
 */
export enum AiProvider {
  GEMINI = "GEMINI",
  OPENAI = "OPENAI",
  ANTHROPIC = "ANTHROPIC",
}

/**
 * @enum {string}
 * @description Defines the modality capabilities of an AI model.
 * @example
 * if (model.capabilities.includes(ModelCapability.IMAGE_INPUT)) {
 *   // Allow image uploads
 * }
 */
export enum ModelCapability {
  TEXT = "TEXT",
  IMAGE_INPUT = "IMAGE_INPUT",
  IMAGE_OUTPUT = "IMAGE_OUTPUT",
  VIDEO_INPUT = "VIDEO_INPUT",
  AUDIO_INPUT = "AUDIO_INPUT",
  TOOL_USE = "TOOL_USE",
}

/**
 * @interface ModelPricing
 * @description Defines the pricing structure for an AI model, typically per million tokens.
 * @property {number} input - The cost per one million input tokens.
 * @property {number} output - The cost per one million output tokens.
 */
export interface ModelPricing {
  /**
   * @description The cost per one million input tokens in USD.
   * @type {number}
   * @example 0.50
   */
  input: number;

  /**
   * @description The cost per one million output tokens in USD.
   * @type {number}
   * @example 1.50
   */
  output: number;
}

/**
 * @interface ModelInfo
 * @description Represents the metadata and capabilities of a specific AI model.
 */
export interface ModelInfo {
  /**
   * @description The unique identifier for the model.
   * @type {string}
   * @example "gemini-1.5-pro-latest"
   */
  id: string;

  /**
   * @description The provider of this model.
   * @type {AiProvider}
   */
  provider: AiProvider;

  /**
   * @description A human-readable name for the model.
   * @type {string}
   * @example "Gemini 1.5 Pro"
   */
  displayName: string;

  /**
   * @description A list of the model's capabilities.
   * @type {ModelCapability[]}
   */
  capabilities: ModelCapability[];

  /**
   * @description The maximum number of tokens the model can process in a single context (input + output).
   * @type {number}
   * @example 1048576
   */
  contextWindow: number;

  /**
   * @description The pricing information for the model.
   * @type {ModelPricing}
   * @optional
   */
  pricing?: ModelPricing;
}

/**
 * @interface GenerationConfig
 * @description Configuration parameters that control the AI's generation process.
 */
export interface GenerationConfig {
  /**
   * @description Controls randomness. Lower values are more deterministic.
   * @type {number}
   * @optional
   * @minimum 0
   * @maximum 2
   * @example 0.7
   */
  temperature?: number;

  /**
   * @description The maximum number of tokens to generate in the response.
   * @type {number}
   * @optional
   * @example 2048
   */
  maxOutputTokens?: number;

  /**
   * @description Nucleus sampling threshold.
   * @type {number}
   * @optional
   * @minimum 0
   * @maximum 1
   * @example 0.9
   */
  topP?: number;

  /**
   * @description Top-k sampling threshold.
   * @type {number}
   * @optional
   * @example 40
   */
  topK?: number;

  /**
   * @description A sequence of characters where the API will stop generating further tokens.
   * @type {string[]}
   * @optional
   * @example ["\n", "User:"]
   */
  stopSequences?: string[];
}

/**
 * @interface Base64Data
 * @description Represents base64 encoded data with its MIME type.
 */
export interface Base64Data {
  /**
   * @description The MIME type of the data.
   * @type {string}
   * @example "image/jpeg"
   */
  mimeType: string;

  /**
   * @description The base64-encoded data string.
   * @type {string}
   */
  data: string;
}

/**
 * @type ContentPart
 * @description A union type representing a single part of a multi-modal prompt.
 * It can be either a simple text string or a structured object for image data.
 */
export type ContentPart = string | Base64Data;

/**
 * @interface ChatMessage
 * @description Represents a single message in a conversational history.
 */
export interface ChatMessage {
  /**
   * @description The role of the entity that produced the message.
   * @type {'user' | 'model'}
   */
  role: 'user' | 'model';

  /**
   * @description The content of the message, which can be multi-modal.
   * @type {ContentPart[]}
   */
  parts: ContentPart[];
}


/**
 * @interface AiRequest
 * @description Defines the structure for a request to the AI Gateway Service.
 * This is a standardized interface for all AI generation requests.
 */
export interface AiRequest {
  /**
   * @description The ID of the model to use for this request.
   * @type {string}
   * @example "gemini-1.5-pro-latest"
   */
  modelId: string;

  /**
   * @description The conversational history to provide as context.
   * @type {ChatMessage[]}
   */
  messages: ChatMessage[];

  /**
   * @description System-level instructions to guide the model's behavior and personality.
   * @type {string}
   * @optional
   */
  systemInstruction?: string;

  /**
   * @description Generation configuration for this specific request.
   * @type {GenerationConfig}
   * @optional
   */
  config?: GenerationConfig;

  /**
   * @description A unique identifier for the user making the request, for logging and rate-limiting.
   * @type {string}
   * @optional
   * @security This field should be handled carefully and not exposed unnecessarily.
   */
  userId?: string;

  /**
   * @description A unique identifier for the session, for conversational context management.
   * @type {string}
   * @optional
   */
  sessionId?: string;
}

/**
 * @interface TokenUsage
 * @description Represents the token usage statistics for an AI request.
 */
export interface TokenUsage {
  /**
   * @description The number of tokens in the input prompt/messages.
   * @type {number}
   */
  inputTokens: number;

  /**
   * @description The number of tokens in the generated output.
   * @type {number}
   */
  outputTokens: number;

  /**
   * @description The total number of tokens processed.
   * @type {number}
   */
  totalTokens: number;
}

/**
 * @enum {string}
 * @description Represents the reason why the model stopped generating tokens.
 */
export enum FinishReason {
  STOP = "STOP",
  MAX_TOKENS = "MAX_TOKENS",
  SAFETY = "SAFETY",
  RECITATION = "RECITATION",
  OTHER = "OTHER",
}

/**
 * @interface AiResponse
 * @description Defines the structure for a response from the AI Gateway Service.
 */
export interface AiResponse {
  /**
   * @description The primary text content generated by the model.
   * @type {string}
   */
  content: string;

  /**
   * @description Token usage statistics for the request.
   * @type {TokenUsage}
   */
  usage: TokenUsage;

  /**
   * @description The reason why the model stopped generating tokens.
   * @type {FinishReason}
   */
  finishReason: FinishReason;

  /**
   * @description The model that generated this response.
   * @type {string}
   */
  modelId: string;
  
  /**
   * @description A unique identifier for the request that generated this response.
   * @type {string}
   * @optional
   */
  requestId?: string;
}


/**
 * @interface AiStreamChunk
 * @description Defines the structure for a chunk of data in a streaming response.
 */
export interface AiStreamChunk {
  /**
   * @description The partial text content in this chunk.
   * @type {string}
   */
  content: string;

  /**
   * @description Token usage statistics for the stream, if available in the chunk.
   * @type {Partial<TokenUsage>}
   * @optional
   */
  usage?: Partial<TokenUsage>;

  /**
   * @description The finish reason, typically sent in the last chunk.
   * @type {FinishReason}
   * @optional
   */
  finishReason?: FinishReason;
}
