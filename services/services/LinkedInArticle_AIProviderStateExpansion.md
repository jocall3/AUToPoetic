# Behold! The Grand AI-chitect's Folly Forged Anew: A Jester's Guide to State Management of Digital Genies!

Hark, ye digital denizens and code-slinging sorcerers! Your humble jester, Sir Bytes-a-Lot (or perhaps Lady Logic-Laughter, for inclusivity's sake!), approaches with a tale both cautionary and transformative! For too long have we endured the capricious whims of AI providers, their states flitting hither and thither like a headless chicken at a compiler convention! Today, we cast aside the shackles of ad-hocery and embrace the glorious, the magnificent, the utterly *over-engineered* (in the most delightful way, of course!) future of AI state management! Prepare to have your bytes bewitched and your logic enraptured!

## The Grand Proclamation: The Pitfalls of Patchwork AI – A Comedy of Errors in Many Acts!

Picture this: a developer, bright-eyed and bushy-tailed, integrates their first AI. A simple call here, a cheeky prompt there. "Magnificent!" they exclaim, "I am a wizard! I have conjured digital intelligence with but a few lines of code!" The initial delight is palpable, the early successes intoxicating. The project manager claps, the CEO nods, and our hero basks in the fleeting glow of perceived omnipotence.

But then, as if by some cruel, digital jest, comes the second AI. Perhaps a different large language model, or an image generation service, or a specialized data analysis tool. Each arrives with its own arcane rituals for authentication, its peculiar incantations for state, its unique tantrums when things go awry. Our developer, still high on their first success, attempts to weave these new threads into their existing, delicate tapestry of code. A new `if` statement here, another `switch` statement there. "Surely," they muse, "a few more lines won't hurt the elegance!"

Alas, dear friends, this is where the comedy of errors truly begins! The codebase begins to bloat, not with useful features, but with boilerplate. Authentication tokens, once managed by a simple environment variable, now demand elaborate rotation schemes for multiple providers. Rate limits, once a distant concern, become a daily nightmare, turning perfectly good API calls into a digital game of "Red Light, Green Light" with arbitrary penalties. Context windows, once a cozy little mental space for a single AI, become a gaping maw of forgotten conversations and spiraling token counts.

Our developer, once a wizard, is no more. They are merely a juggler, desperately trying to keep a dozen flaming torches – each representing an AI's ephemeral state, its unique quirks, its authentication woes, its throttling tantrums – from burning down the entire digital circus tent! The glorious vision of seamless AI integration descends into a frantic dance of conditional logic, duplicated code, and late-night debugging sessions fueled by stale coffee and existential dread.

### The Seven Deadly Sins of Unmanaged AI State:
1.  **Inconsistent APIs of Annoyance**: Every AI provider has its own dialect. Translating between them is like teaching a dragon to speak fluent Shakespeare while simultaneously teaching a squirrel to code in Assembly. It's possible, but oh, the effort!
2.  **Authentication Woes & Token Terrors**: Managing API keys, refresh tokens, and authentication flows across multiple providers is a recipe for security vulnerabilities and administrative headaches. One slip, and your digital kingdom is compromised!
3.  **Rate Limit Nightmares**: Hitting API limits isn't just an inconvenience; it's a hard stop. Without a unified strategy, your application grinds to a halt, leaving users staring at spinning loaders of despair.
4.  **Contextual Confusion & Memory Meltdowns**: Maintaining conversational context across calls, especially with fluctuating session states or user interactions, can turn an intelligent AI into a digital amnesiac.
5.  **Data Security & Privacy Perils**: Passing sensitive information to various third-party AI models without robust encryption, sanitization, and access control is akin to shouting your secrets in a crowded digital marketplace.
6.  **Cost Spiraling into Oblivion**: Without clear tracking and optimization, those seemingly small API calls add up faster than a jester's witty retorts. Your CFO will not be amused when the bill arrives!
7.  **Debugging Despair & Maintenance Mayhem**: When things go wrong, pinpointing the issue in a spaghetti-code mess of AI integrations is like finding a specific needle in a haystack made entirely of other, equally sharp needles.

Truly, it's enough to make a jester weep into their byte-sized scepter! But fear not, for this isn't merely a tale of woe, but a prelude to triumph!

## The Royal Decree of Solution: Introducing the AI Provider State Nexus (APSN) – A Masterpiece of Digital Alchemy!

But fret not, my dear code-knights, my algorithm-adventurers! For in the hallowed halls of Silicon Valley's most hallowed dungeons (or rather, the most caffeine-fueled dev den, where the air hums with the silent symphony of keyboards), a solution hath been forged! A solution so elegant, so robust, so gloriously *complete* that it shall make your digital genies sing with joy and your codebase glow with efficiency!

I speak of the *AI Provider State Nexus* (APSN) – not merely a codebase, but a philosophical leap! A unified, elegant, and yes, gloriously over-engineered (in the best possible way, of course!) system to wrangle those digital genies, to bring order to the chaos, and to transform your multi-AI architecture from a frantic juggling act into a finely tuned, well-oiled, laughter-inducing machine!

Imagine: a single, glistening, centralized brain for all your AI interactions. A place where state is not merely managed, but *orchestrated* with the precision of a master conductor and the flair of a seasoned mime! The APSN is built upon pillars of modern software engineering, imbued with the spirit of extensibility, resilience, and sheer, unadulterated developer joy.

### The Core Tenets of the APSN:
1.  **Abstraction Ascension**: We abstract away the bewildering idiosyncrasies of each AI provider behind a crystal-clear, unified interface. Talk to one AI, you can talk to them all!
2.  **Modularity Marvel**: Components are decoupled, allowing for easy swapping, upgrading, and testing. It's like Lego for your AI integrations, but with far fewer choking hazards.
3.  **Resilience Redefined**: Built-in retry mechanisms, intelligent error handling, and robust fallback strategies ensure your application stands tall even when a distant API decides to take an unscheduled nap.
4.  **Observability Oasis**: Every interaction, every state change, every glorious success or minor hiccup is meticulously logged, traced, and metric-ed. You'll know more about your AI than it knows about itself!
5.  **Extensibility Extravaganza**: Need a new AI provider? Want to add a custom middleware for logging or caching? The APSN is designed to welcome new functionalities with open arms and a celebratory digital fanfare!
6.  **Cost Awareness & Optimization**: Integrated token and cost estimation tools keep your budget in check, turning potential financial frights into delightful fiscal prudence.
7.  **Security Sanctum**: A dedicated security layer ensures that your precious data and API keys are guarded with the ferocity of a dragon protecting its hoard of digital gold.

No longer will you be a mere mortal wrestling with digital leviathans; you shall be the *ringmaster* of your AI circus! The *maestro* of your model orchestra! The *jester* who cleverly outsmarts the capricious nature of the digital realm!

## The Code: A Symphony of Pure Digital Alchemysion – Behold, the Scrolls Unfurled!

Now, prepare thine eyes, for we shall unveil the scrolls themselves! Behold, the very essence of the AI Provider State Nexus, etched in the sacred runes of TypeScript! This isn't just a snippet; it's an epic poem! A digital tapestry woven with the threads of interfaces, classes, and the occasional, truly inspired comment from yours truly, the Jester of Javas...Script!

This monumental codebase encompasses everything from core interfaces for AI interaction to pluggable middleware for caching and rate limiting, robust error handling, sophisticated context management, and even a plugin system for future enhancements. It's designed to be the bedrock upon which you build your next generation of intelligent applications, freeing you from the mundane and elevating you to the realm of true AI artistry!

```typescript
// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.
// All rights reserved. May this code bring joy, efficiency, and occasional fits of laughter.

/**
 * @file This file contains the entirety of the AI Provider State Nexus (APSN).
 *       It's a grand symphony of interfaces, classes, and utilities designed
 *       to tame the wildest of digital genies (AI providers) and bring order
 *       to the chaotic realm of multi-AI state management.
 *       Behold, the solution to all your AI woes, presented with a jester's flourish!
 */

// --- SECTION 1: CORE INTERFACES & TYPES (The Grand Blueprint) ---

/**
 * @module interfaces
 * @description Core interfaces defining the contracts for AI providers, requests, responses, and internal state.
 *              These are the foundational scrolls upon which our digital kingdom is built.
 */

/**
 * Represents a generic error that can occur within the AI Provider State Nexus.
 * This class provides a structured way to handle and categorize errors.
 */
class AiProviderError extends Error {
    public readonly code: string;
    public readonly originalError?: any;
    public readonly details?: Record<string, any>;

    constructor(message: string, code: string, originalError?: any, details?: Record<string, any>) {
        super(message);
        this.name = 'AiProviderError';
        this.code = code;
        this.originalError = originalError;
        this.details = details;
        Object.setPrototypeOf(this, AiProviderError.prototype); // Maintain proper prototype chain
    }

    /**
     * Creates an AiProviderError from an unknown error.
     * @param error The unknown error to wrap.
     * @param context Additional context for the error.
     * @returns An AiProviderError instance.
     */
    static fromUnknown(error: unknown, context: string = 'UNKNOWN_ERROR'): AiProviderError {
        if (error instanceof AiProviderError) {
            return error;
        }
        if (error instanceof Error) {
            return new AiProviderError(
                `An unexpected error occurred: ${error.message}`,
                context,
                error,
                { stack: error.stack }
            );
        }
        return new AiProviderError(
            `An unknown non-Error object was thrown: ${String(error)}`,
            context,
            error
        );
    }
}

/**
 * Defines the common configuration parameters for any AI provider.
 * This ensures consistency across different AI model integrations.
 */
interface IProviderConfig {
    /** Unique identifier for the provider instance. */
    id: string;
    /** The type of AI provider (e.g., 'openai', 'anthropic', 'custom-local'). */
    type: string;
    /** API key or token required for authentication with the AI service. */
    apiKey: string;
    /** Optional API endpoint URL if different from the default. */
    baseUrl?: string;
    /** Default model to use for requests if not specified in the request itself. */
    defaultModel?: string;
    /** Timeout for API requests in milliseconds. */
    timeoutMs?: number;
    /** Max number of retries for transient errors. */
    maxRetries?: number;
    /** Backoff factor for retry delays. */
    retryBackoffFactor?: number;
    /** Any other provider-specific configuration details. */
    [key: string]: any;
}

/**
 * Represents a generic request to an AI provider.
 * This interface allows for a unified request format regardless of the underlying AI model.
 */
interface IAiRequest {
    /** The specific AI model to use for this request (e.g., 'gpt-4', 'claude-3-opus-20240229'). */
    model: string;
    /** The primary prompt or input text for the AI. */
    prompt: string;
    /** Optional array of messages for conversational AI, maintaining turn-by-turn context. */
    messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    /** Optional unique identifier for the conversation or session, crucial for state management. */
    sessionId?: string;
    /** Optional configuration specific to this request (e.g., temperature, max_tokens). */
    requestConfig?: {
        temperature?: number;
        max_tokens?: number;
        top_p?: number;
        stop_sequences?: string[];
        stream?: boolean;
        [key: string]: any;
    };
    /** Optional metadata associated with the request, useful for logging or tracking. */
    metadata?: Record<string, any>;
}

/**
 * Represents a generic response from an AI provider.
 * This interface provides a consistent structure for AI output.
 */
interface IAiResponse {
    /** The unique identifier for this response. */
    id: string;
    /** The generated text content from the AI. */
    content: string;
    /** The specific AI model that generated this response. */
    model: string;
    /** Usage statistics for the request, including token counts. */
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        cost?: number; // Estimated cost for this particular usage
    };
    /** Optional metadata from the AI provider or internal processing. */
    metadata?: Record<string, any>;
    /** The original raw response object from the underlying AI SDK/API. */
    rawResponse?: any;
}

/**
 * Defines the contract for an AI provider.
 * Any class integrating a specific AI service must implement this interface.
 */
interface IAiProvider {
    /** The unique ID of this provider instance. */
    readonly id: string;
    /** The type of this provider. */
    readonly type: string;

    /**
     * Initializes the AI provider with its configuration.
     * @param config The configuration object for the provider.
     * @returns A Promise that resolves when initialization is complete.
     */
    initialize(config: IProviderConfig): Promise<void>;

    /**
     * Processes an AI request and returns an AI response.
     * This is the core method for interacting with the AI model.
     * @param request The generic AI request object.
     * @returns A Promise that resolves with the generic AI response object.
     * @throws {AiProviderError} if the request fails.
     */
    processRequest(request: IAiRequest): Promise<IAiResponse>;

    /**
     * Estimates the token count for a given text using the provider's tokenization logic.
     * This is crucial for managing context windows and estimating costs.
     * @param text The text to tokenize.
     * @param model Optional model to use for estimation if different from default.
     * @returns The estimated token count.
     */
    estimateTokens(text: string, model?: string): number;

    /**
     * Retrieves the estimated cost per token for a given model.
     * @param model The model identifier.
     * @returns An object containing input and output token costs, or undefined if not available.
     */
    getCostPerToken(model: string): { input: number; output: number } | undefined;

    /**
     * Gets the context window size (max tokens) for a given model.
     * @param model The model identifier.
     * @returns The maximum number of tokens this model can handle, or undefined if unknown.
     */
    getContextWindowSize(model: string): number | undefined;

    /**
     * Releases any resources held by the provider (e.g., closing connections).
     * @returns A Promise that resolves when resources are released.
     */
    shutdown?(): Promise<void>;
}

/**
 * Defines a middleware function signature. Middleware functions can intercept and modify
 * AI requests and responses, or perform side effects like logging and caching.
 */
interface IMiddleware {
    /** The name of the middleware for identification and ordering. */
    readonly name: string;
    /** The order in which this middleware should be applied (lower numbers execute first). */
    readonly order: number;

    /**
     * Applies the middleware logic to an AI request.
     * @param request The incoming AI request.
     * @param next A function to call the next middleware in the chain or the actual AI provider.
     * @returns A Promise that resolves with the AI response.
     */
    apply(request: IAiRequest, next: (req: IAiRequest) => Promise<IAiResponse>): Promise<IAiResponse>;
}

/**
 * Represents a plugin that can extend the functionality of the AI Provider State Nexus.
 * Plugins can register new middleware, react to events, or provide custom services.
 */
interface IPlugin {
    /** Unique identifier for the plugin. */
    readonly id: string;
    /** Human-readable name of the plugin. */
    readonly name: string;
    /** Version of the plugin. */
    readonly version: string;

    /**
     * Initializes the plugin. This method is called once when the APSN is initialized.
     * @param services An object containing core services of the APSN, allowing plugins to interact with them.
     * @returns A Promise that resolves when initialization is complete.
     */
    initialize(services: {
        stateManager: IAiStateManager;
        eventEmitter: IEventEmitter;
        orchestrator: IAiOrchestrator;
        configManager: IConfigManager;
        telemetryService: ITelemetryService;
    }): Promise<void>;

    /**
     * Optional method to release resources when the plugin is unloaded.
     */
    shutdown?(): Promise<void>;
}

/**
 * Defines the contract for a cache service.
 * Used by CacheMiddleware to store and retrieve AI responses.
 */
interface ICacheService {
    /**
     * Retrieves a cached response for a given key.
     * @param key The cache key.
     * @returns The cached response, or undefined if not found.
     */
    get(key: string): Promise<IAiResponse | undefined>;

    /**
     * Stores a response in the cache with an optional time-to-live (TTL).
     * @param key The cache key.
     * @param response The AI response to cache.
     * @param ttlSeconds Optional time-to-live in seconds.
     * @returns A Promise that resolves when the item is cached.
     */
    set(key: string, response: IAiResponse, ttlSeconds?: number): Promise<void>;

    /**
     * Invalidates a specific cache entry.
     * @param key The cache key to invalidate.
     * @returns A Promise that resolves when the item is removed from cache.
     */
    invalidate(key: string): Promise<void>;

    /**
     * Clears all entries from the cache.
     * @returns A Promise that resolves when the cache is cleared.
     */
    clear(): Promise<void>;
}

/**
 * Defines the contract for a rate limiter service.
 * Used by RateLimitMiddleware to manage API call rates.
 */
interface IRateLimiter {
    /**
     * Checks if a request can proceed and decrements the available quota if so.
     * If not, it throws an error or returns false based on implementation.
     * @param providerId The ID of the provider being rate-limited.
     * @param model The specific model being used.
     * @param tokens The number of tokens in the request (for token-based limits).
     * @returns A Promise that resolves to true if the request is allowed, false otherwise.
     * @throws {AiProviderError} if rate limit is exceeded and strategy is to block.
     */
    acquire(providerId: string, model: string, tokens: number): Promise<boolean>;

    /**
     * Releases quota for a given provider/model, typically after a request fails or is retried.
     * @param providerId The ID of the provider.
     * @param model The specific model.
     * @param tokens The number of tokens to release.
     */
    release(providerId: string, model: string, tokens: number): void;

    /**
     * Gets the current status of the rate limiter for a given provider/model.
     * @param providerId The ID of the provider.
     * @param model The specific model.
     * @returns Current usage and limits.
     */
    getStatus(providerId: string, model: string): { current: number; limit: number; remaining: number; resetTime: Date };
}

/**
 * Defines a contract for a service that manages conversational context.
 */
interface IContextManager {
    /**
     * Stores a message or a set of messages for a given session.
     * @param sessionId Unique ID for the conversation session.
     * @param messages The messages to store.
     * @param maxLength Optional maximum number of messages or tokens to retain.
     * @returns A Promise that resolves with the updated context.
     */
    storeContext(sessionId: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, maxLength?: number): Promise<void>;

    /**
     * Retrieves the conversational context for a given session.
     * @param sessionId Unique ID for the conversation session.
     * @param maxTokens Optional maximum token count for the retrieved context.
     * @returns A Promise that resolves with the array of messages.
     */
    retrieveContext(sessionId: string, maxTokens?: number): Promise<Array<{ role: 'user' | 'assistant'; content: string }>>;

    /**
     * Clears the context for a specific session.
     * @param sessionId Unique ID for the conversation session.
     * @returns A Promise that resolves when context is cleared.
     */
    clearContext(sessionId: string): Promise<void>;
}

/**
 * Defines the contract for an event emitter.
 * Used for internal communication and by plugins to react to system events.
 */
interface IEventEmitter {
    /**
     * Emits an event with a given name and payload.
     * @param eventName The name of the event.
     * @param payload The data associated with the event.
     */
    emit(eventName: string, payload: any): void;

    /**
     * Registers a listener for a specific event.
     * @param eventName The name of the event to listen for.
     * @param listener The callback function to execute when the event is emitted.
     * @returns A function to unsubscribe the listener.
     */
    on(eventName: string, listener: (payload: any) => void): () => void;
}

/**
 * Defines the contract for a telemetry service (logging, metrics, tracing).
 * Crucial for observability and debugging in a complex system.
 */
interface ITelemetryService {
    /**
     * Logs an informational message.
     * @param message The log message.
     * @param context Optional additional context.
     */
    info(message: string, context?: Record<string, any>): void;

    /**
     * Logs a warning message.
     * @param message The log message.
     * @param context Optional additional context.
     */
    warn(message: string, context?: Record<string, any>): void;

    /**
     * Logs an error message.
     * @param error The error object or message.
     * @param context Optional additional context.
     */
    error(error: Error | string, context?: Record<string, any>): void;

    /**
     * Records a metric (e.g., latency, count).
     * @param name The name of the metric.
     * @param value The value of the metric.
     * @param tags Optional tags for categorization.
     */
    metric(name: string, value: number, tags?: Record<string, string>): void;

    /**
     * Starts a new trace span.
     * @param name The name of the span.
     * @param parentSpanId Optional parent span ID for nested traces.
     * @returns A unique span ID.
     */
    startSpan(name: string, parentSpanId?: string): string;

    /**
     * Ends a trace span.
     * @param spanId The ID of the span to end.
     * @param status Optional status of the span (e.g., 'ok', 'error').
     * @param attributes Optional attributes to add to the span.
     */
    endSpan(spanId: string, status?: 'ok' | 'error', attributes?: Record<string, any>): void;
}

/**
 * Defines the contract for the central AI State Manager.
 * This service is responsible for managing the registry of providers and their configurations.
 */
interface IAiStateManager {
    /**
     * Registers a new AI provider instance.
     * @param provider The AI provider to register.
     * @returns A Promise that resolves when the provider is successfully registered.
     * @throws {AiProviderError} if a provider with the same ID already exists.
     */
    registerProvider(provider: IAiProvider): Promise<void>;

    /**
     * Retrieves a registered AI provider by its ID.
     * @param providerId The ID of the provider to retrieve.
     * @returns The AI provider instance, or undefined if not found.
     */
    getProvider(providerId: string): IAiProvider | undefined;

    /**
     * Deregisters an AI provider.
     * @param providerId The ID of the provider to deregister.
     * @returns A Promise that resolves when the provider is successfully deregistered.
     */
    deregisterProvider(providerId: string): Promise<void>;

    /**
     * Gets a list of all registered provider IDs.
     * @returns An array of provider IDs.
     */
    getAllProviderIds(): string[];

    /**
     * Retrieves the configuration for a specific provider.
     * @param providerId The ID of the provider.
     * @returns The provider's configuration.
     * @throws {AiProviderError} if the provider is not found.
     */
    getProviderConfig(providerId: string): IProviderConfig;
}

/**
 * Defines the contract for the AI Orchestrator.
 * This service is the main entry point for sending requests, applying middleware,
 * and selecting the appropriate AI provider.
 */
interface IAiOrchestrator {
    /**
     * Processes an AI request through the entire middleware chain and dispatches it to the selected provider.
     * @param providerId The ID of the target AI provider.
     * @param request The generic AI request.
     * @returns A Promise that resolves with the generic AI response.
     * @throws {AiProviderError} if the request cannot be processed.
     */
    processAiRequest(providerId: string, request: IAiRequest): Promise<IAiResponse>;

    /**
     * Registers a new middleware to the orchestration pipeline.
     * Middleware are sorted by their 'order' property.
     * @param middleware The middleware instance to register.
     */
    registerMiddleware(middleware: IMiddleware): void;

    /**
     * Unregisters a middleware by its name.
     * @param middlewareName The name of the middleware to remove.
     */
    unregisterMiddleware(middlewareName: string): void;

    /**
     * Adds a plugin to the orchestrator.
     * @param plugin The plugin instance to add.
     * @returns A Promise that resolves when the plugin is initialized.
     */
    addPlugin(plugin: IPlugin): Promise<void>;

    /**
     * Initializes the orchestrator and all registered plugins.
     * This should be called after all providers and initial middleware are registered.
     */
    initialize(): Promise<void>;

    /**
     * Shuts down the orchestrator and all registered plugins.
     */
    shutdown(): Promise<void>;
}

/**
 * Defines the contract for a configuration manager.
 * Responsible for loading, storing, and providing access to global and provider-specific configurations.
 */
interface IConfigManager {
    /**
     * Loads configurations from a specified source (e.g., file, environment variables, database).
     * @param configSource Optional path or identifier for the config source.
     * @returns A Promise that resolves when configuration is loaded.
     */
    loadConfig(configSource?: string): Promise<void>;

    /**
     * Gets a specific configuration value by key.
     * @param key The configuration key (e.g., 'app.port', 'openai.apiKey').
     * @param defaultValue Optional default value if the key is not found.
     * @returns The configuration value.
     */
    get<T>(key: string, defaultValue?: T): T;

    /**
     * Sets a configuration value. Useful for runtime overrides or dynamic settings.
     * @param key The configuration key.
     * @param value The value to set.
     */
    set(key: string, value: any): void;

    /**
     * Retrieves all configurations for a specific AI provider.
     * @param providerId The ID of the provider.
     * @returns The provider-specific configuration object.
     * @throws {AiProviderError} if provider config is not found.
     */
    getProviderConfig(providerId: string): IProviderConfig;

    /**
     * Retrieves all global configurations.
     * @returns A deep copy of the current global configuration object.
     */
    getAll(): Record<string, any>;
}

/**
 * Enum for common AI Provider types.
 * Our digital cast of characters!
 */
enum AiProviderType {
    OpenAI = 'openai',
    Anthropic = 'anthropic',
    GoogleGenerativeAI = 'google-gemini',
    CustomLocal = 'custom-local',
    Mock = 'mock', // For our unit test jester's delight!
}

/**
 * Enum for various event types emitted by the APSN.
 * The gossip of the digital realm!
 */
enum AiProviderEvents {
    ProviderRegistered = 'provider:registered',
    ProviderDeregistered = 'provider:deregistered',
    RequestStarted = 'request:started',
    RequestCompleted = 'request:completed',
    RequestFailed = 'request:failed',
    MiddlewareApplied = 'middleware:applied',
    ContextUpdated = 'context:updated',
    CacheHit = 'cache:hit',
    CacheMiss = 'cache:miss',
    RateLimited = 'rate:limited',
    PluginInitialized = 'plugin:initialized',
    ConfigurationLoaded = 'config:loaded',
    TelemetryLogged = 'telemetry:logged',
}


// --- SECTION 2: CONFIGURATION & UTILITIES (The Jester's Toolkit) ---

/**
 * @module config
 * @description Manages configuration loading and access for the entire system.
 *              Ensures that every digital cog has its proper oil.
 */
class ConfigurationManager implements IConfigManager {
    private config: Record<string, any> = {};
    private readonly telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * @override
     * Loads configuration from various sources. For this grand demo, we'll simulate loading
     * from environment variables and a default set. In a real system, this could
     * involve file parsing, database lookups, or secret managers.
     * @param configSource Optional path or identifier for the config source. (Currently ignored for simplicity)
     */
    async loadConfig(configSource?: string): Promise<void> {
        this.telemetryService.info('Loading configuration...', { source: configSource || 'default' });

        // Simulate loading from environment variables
        const envConfig: Record<string, any> = {};
        for (const key in process.env) {
            if (key.startsWith('APSN_')) {
                // Convert APSN_OPENAI_API_KEY to openai.apiKey
                const cleanedKey = key.substring(5).toLowerCase().replace(/_(\w)/g, (g) => `.${g[1]}`);
                envConfig[cleanedKey] = process.env[key];
            }
        }

        // Default configurations (our baseline for sanity)
        const defaultConfig = {
            app: {
                port: 3000,
                logLevel: 'info',
                environment: process.env.NODE_ENV || 'development',
            },
            cache: {
                enabled: true,
                defaultTtlSeconds: 3600, // 1 hour
                maxEntries: 1000,
            },
            rateLimiter: {
                enabled: true,
                defaultRequestsPerMinute: 60,
                defaultTokensPerMinute: 150000,
            },
            telemetry: {
                enabled: true,
                provider: 'console', // 'datadog', 'newrelic', etc.
            },
            plugins: {
                enabled: [], // List of plugin IDs to enable
            },
            providers: {
                [AiProviderType.OpenAI]: {
                    id: AiProviderType.OpenAI,
                    type: AiProviderType.OpenAI,
                    apiKey: process.env.APSN_OPENAI_API_KEY || 'sk-openai-mock-key',
                    baseUrl: 'https://api.openai.com/v1',
                    defaultModel: 'gpt-4o',
                    timeoutMs: 30000,
                    maxRetries: 3,
                    retryBackoffFactor: 2,
                    models: {
                        'gpt-4o': { input: 0.005, output: 0.015, contextWindow: 128000 },
                        'gpt-4-turbo': { input: 0.01, output: 0.03, contextWindow: 128000 },
                        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, contextWindow: 16385 }
                    }
                },
                [AiProviderType.Anthropic]: {
                    id: AiProviderType.Anthropic,
                    type: AiProviderType.Anthropic,
                    apiKey: process.env.APSN_ANTHROPIC_API_KEY || 'sk-anthropic-mock-key',
                    baseUrl: 'https://api.anthropic.com/v1',
                    defaultModel: 'claude-3-opus-20240229',
                    timeoutMs: 45000,
                    maxRetries: 4,
                    retryBackoffFactor: 2.5,
                    models: {
                        'claude-3-opus-20240229': { input: 0.015, output: 0.075, contextWindow: 200000 },
                        'claude-3-sonnet-20240229': { input: 0.003, output: 0.015, contextWindow: 200000 },
                        'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125, contextWindow: 200000 }
                    }
                },
                [AiProviderType.Mock]: {
                    id: AiProviderType.Mock,
                    type: AiProviderType.Mock,
                    apiKey: 'mock-key',
                    baseUrl: 'http://localhost:9999/mock-ai',
                    defaultModel: 'mock-jester-v1',
                    timeoutMs: 1000,
                    maxRetries: 0,
                    models: {
                        'mock-jester-v1': { input: 0, output: 0, contextWindow: 10000 }
                    }
                }
            }
        };

        this.config = this.deepMerge(defaultConfig, envConfig);
        this.telemetryService.info('Configuration loaded successfully.');
    }

    /**
     * Recursively merges two objects.
     * @param target The target object to merge into.
     * @param source The source object to merge from.
     * @returns The merged object.
     */
    private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) &&
                    typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                    target[key] = this.deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    /**
     * @override
     * Gets a configuration value by a dot-notation key.
     * @param key The configuration key (e.g., 'app.logLevel').
     * @param defaultValue Optional default value if the key is not found.
     * @returns The configuration value, or the default value if not found.
     */
    get<T>(key: string, defaultValue?: T): T {
        const parts = key.split('.');
        let current: any = this.config;
        for (const part of parts) {
            if (current === undefined || typeof current !== 'object' || current === null || !current.hasOwnProperty(part)) {
                return defaultValue as T;
            }
            current = current[part];
        }
        return current as T;
    }

    /**
     * @override
     * Sets a configuration value at runtime.
     * @param key The configuration key.
     * @param value The value to set.
     */
    set(key: string, value: any): void {
        const parts = key.split('.');
        let current: any = this.config;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
        this.telemetryService.info(`Configuration key '${key}' set to new value.`, { value });
    }

    /**
     * @override
     * Retrieves all configurations for a specific AI provider.
     * @param providerId The ID of the provider.
     * @returns The provider's configuration.
     * @throws {AiProviderError} if the provider config is not found.
     */
    getProviderConfig(providerId: string): IProviderConfig {
        const providerConfig = this.get<IProviderConfig>(`providers.${providerId}`);
        if (!providerConfig) {
            this.telemetryService.error(`Configuration for provider '${providerId}' not found.`, { providerId });
            throw new AiProviderError(`Configuration for provider '${providerId}' not found.`, 'CONFIG_NOT_FOUND', null, { providerId });
        }
        return providerConfig;
    }

    /**
     * @override
     * Retrieves a deep copy of all current configurations.
     */
    getAll(): Record<string, any> {
        return JSON.parse(JSON.stringify(this.config)); // Return a deep copy to prevent external modification
    }
}

/**
 * @module utilities
 * @description A collection of helpful tools for token estimation and cost calculation.
 *              Keeping our digital coin purse in check!
 */

/**
 * Provides methods for estimating token counts, crucial for context management and cost prediction.
 * This is a simplified estimator and might need provider-specific implementations.
 */
class TokenEstimator {
    private readonly telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * A very basic token estimation based on character count.
     * In a real-world scenario, this would use a proper tokenizer (e.g., tiktoken for OpenAI).
     * @param text The text to estimate tokens for.
     * @returns An approximation of the token count.
     */
    estimateTokensRough(text: string): number {
        // A common rule of thumb: 1 token is roughly 4 characters for English text.
        // This is a Jester's approximation, not a precise science!
        if (!text) return 0;
        const estimatedTokens = Math.ceil(text.length / 4);
        this.telemetryService.info('Rough token estimation performed.', { textLength: text.length, estimatedTokens });
        return estimatedTokens;
    }

    /**
     * Estimates tokens for a series of messages, accounting for system/user/assistant roles.
     * This is also a rough estimation.
     * @param messages An array of chat messages.
     * @returns The estimated total token count for the messages.
     */
    estimateTokensForMessagesRough(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): number {
        if (!messages || messages.length === 0) return 0;
        let totalTokens = 0;
        for (const message of messages) {
            totalTokens += this.estimateTokensRough(message.content);
            // Add a small overhead for role and structure, typically 3-4 tokens per message
            totalTokens += 4;
        }
        this.telemetryService.info('Rough token estimation for messages performed.', { messageCount: messages.length, totalTokens });
        return totalTokens;
    }
}

/**
 * Calculates the estimated cost of an AI request based on token usage and provider rates.
 */
class CostCalculator {
    private readonly telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * Calculates the estimated cost for a given usage, model, and provider rates.
     * @param promptTokens Number of tokens in the prompt.
     * @param completionTokens Number of tokens in the AI's completion.
     * @param model The model identifier.
     * @param rates An object containing input and output token costs (e.g., {input: 0.001, output: 0.002}).
     * @returns The estimated cost in USD.
     */
    calculate(promptTokens: number, completionTokens: number, model: string, rates?: { input: number; output: number }): number {
        if (!rates) {
            this.telemetryService.warn(`Cost rates not available for model '${model}'. Cost estimation will be $0.`, { model });
            return 0; // Cannot estimate without rates
        }

        const inputCost = (promptTokens / 1_000_000) * rates.input; // Assuming rates are per million tokens for better precision
        const outputCost = (completionTokens / 1_000_000) * rates.output;
        const totalCost = inputCost + outputCost;

        this.telemetryService.info('Cost calculated.', { promptTokens, completionTokens, model, inputCost, outputCost, totalCost });
        return totalCost;
    }
}


// --- SECTION 3: TELEMETRY (The Royal Scribe of Logs and Metrics) ---

/**
 * @module telemetry
 * @description Provides a unified interface for logging, metrics, and tracing.
 *              Because even a jester needs to know what's happening behind the curtain!
 */

/**
 * A basic console-based telemetry service.
 * In a production environment, this would integrate with external monitoring systems.
 */
class ConsoleTelemetryService implements ITelemetryService {
    private readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
    private spanCounter: number = 0;
    private readonly activeSpans: Map<string, { name: string; startTime: number; parentSpanId?: string }> = new Map();

    constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
        this.logLevel = logLevel;
    }

    private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
        const levels = {
            'debug': 0, 'info': 1, 'warn': 2, 'error': 3
        };
        return levels[level] >= levels[this.logLevel];
    }

    info(message: string, context?: Record<string, any>): void {
        if (this.shouldLog('info')) {
            console.info(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : '');
        }
    }

    warn(message: string, context?: Record<string, any>): void {
        if (this.shouldLog('warn')) {
            console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : '');
        }
    }

    error(error: Error | string, context?: Record<string, any>): void {
        if (this.shouldLog('error')) {
            const errorMessage = typeof error === 'string' ? error : error.message;
            const errorStack = typeof error === 'object' && error instanceof Error ? error.stack : undefined;
            console.error(`[ERROR] [${new Date().toISOString()}] ${errorMessage}`, context ? JSON.stringify(context) : '', errorStack || '');
        }
    }

    metric(name: string, value: number, tags?: Record<string, string>): void {
        console.log(`[METRIC] [${new Date().toISOString()}] ${name}: ${value}`, tags ? JSON.stringify(tags) : '');
    }

    startSpan(name: string, parentSpanId?: string): string {
        this.spanCounter++;
        const spanId = `span-${this.spanCounter}`;
        this.activeSpans.set(spanId, { name, startTime: Date.now(), parentSpanId });
        this.info(`Span Started: ${name} (ID: ${spanId})`, { parentSpanId });
        return spanId;
    }

    endSpan(spanId: string, status?: 'ok' | 'error', attributes?: Record<string, any>): void {
        const span = this.activeSpans.get(spanId);
        if (span) {
            this.activeSpans.delete(spanId);
            const duration = Date.now() - span.startTime;
            this.info(`Span Ended: ${span.name} (ID: ${spanId}) - Duration: ${duration}ms, Status: ${status || 'ok'}`, { ...attributes, parentSpanId: span.parentSpanId });
            this.metric(`${span.name}.duration_ms`, duration, { status: status || 'ok', ...(attributes as Record<string, string> || {}) });
        } else {
            this.warn(`Attempted to end unknown span ID: ${spanId}`);
        }
    }
}


// --- SECTION 4: AI PROVIDER IMPLEMENTATIONS (Our Digital Genies) ---

/**
 * @module providers
 * @description Concrete implementations for various AI providers.
 *              This is where we teach our genies their parlor tricks!
 */

/**
 * Base class for all AI provider implementations.
 * Provides common functionality like configuration, error handling, and basic token estimation.
 */
abstract class BaseAiProvider implements IAiProvider {
    public readonly id: string;
    public readonly type: string;
    protected config!: IProviderConfig;
    protected telemetryService: ITelemetryService;
    protected tokenEstimator: TokenEstimator;
    protected costCalculator: CostCalculator;

    protected constructor(id: string, type: AiProviderType, telemetryService: ITelemetryService, tokenEstimator: TokenEstimator, costCalculator: CostCalculator) {
        this.id = id;
        this.type = type;
        this.telemetryService = telemetryService;
        this.tokenEstimator = tokenEstimator;
        this.costCalculator = costCalculator;
    }

    /**
     * @override
     * Initializes the provider with its configuration.
     * Concrete classes should call super.initialize() first.
     * @param config The configuration object.
     */
    async initialize(config: IProviderConfig): Promise<void> {
        this.config = config;
        this.telemetryService.info(`Provider '${this.id}' (${this.type}) initialized.`, { configId: config.id });
    }

    /**
     * Abstract method for processing an AI request.
     * Must be implemented by concrete provider classes.
     * @param request The generic AI request.
     * @returns A Promise resolving to a generic AI response.
     */
    abstract processRequest(request: IAiRequest): Promise<IAiResponse>;

    /**
     * @override
     * Estimates tokens using the base TokenEstimator.
     * Can be overridden by providers with more specific tokenization.
     * @param text The text to estimate tokens for.
     * @param model Optional model to use for estimation.
     * @returns Estimated token count.
     */
    estimateTokens(text: string, model?: string): number {
        this.telemetryService.info(`Using generic token estimation for provider '${this.id}'.`, { model, textLength: text.length });
        return this.tokenEstimator.estimateTokensRough(text);
    }

    /**
     * @override
     * Retrieves cost per token for the specific model from configuration.
     * @param model The model identifier.
     * @returns An object containing input and output token costs, or undefined if not found.
     */
    getCostPerToken(model: string): { input: number; output: number } | undefined {
        const modelConfig = (this.config.models as Record<string, { input: number; output: number; contextWindow: number }>)?.[model];
        if (!modelConfig) {
            this.telemetryService.warn(`Cost configuration not found for model '${model}' in provider '${this.id}'.`, { providerId: this.id, model });
            return undefined;
        }
        return { input: modelConfig.input, output: modelConfig.output };
    }

    /**
     * @override
     * Gets the context window size for a specific model from configuration.
     * @param model The model identifier.
     * @returns The maximum number of tokens for the model, or undefined if not found.
     */
    getContextWindowSize(model: string): number | undefined {
        const modelConfig = (this.config.models as Record<string, { input: number; output: number; contextWindow: number }>)?.[model];
        if (!modelConfig) {
            this.telemetryService.warn(`Context window configuration not found for model '${model}' in provider '${this.id}'.`, { providerId: this.id, model });
            return undefined;
        }
        return modelConfig.contextWindow;
    }

    /**
     * Helper to perform retries with exponential backoff.
     * A true hero never gives up, unless the AI throws a tantrum!
     * @param fn The function to execute and retry.
     * @param maxRetries Maximum number of retries.
     * @param backoffFactor Factor to multiply delay by on each retry.
     * @param delayMs Initial delay in milliseconds.
     * @returns The result of the function.
     * @throws {AiProviderError} if all retries fail.
     */
    protected async withRetry<T>(fn: () => Promise<T>, maxRetries: number, backoffFactor: number = 2, delayMs: number = 100): Promise<T> {
        let attempts = 0;
        let currentDelay = delayMs;
        while (attempts <= maxRetries) {
            try {
                return await fn();
            } catch (error) {
                attempts++;
                if (attempts > maxRetries) {
                    this.telemetryService.error(`All retry attempts failed for provider '${this.id}'.`, { attempts, originalError: error });
                    throw AiProviderError.fromUnknown(error, 'MAX_RETRIES_EXCEEDED');
                }
                this.telemetryService.warn(`Attempt ${attempts}/${maxRetries} failed for provider '${this.id}'. Retrying in ${currentDelay}ms.`, { originalError: error });
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= backoffFactor;
            }
        }
        // This line should technically be unreachable if attempts > maxRetries throws
        throw new AiProviderError('Unexpected retry loop exit.', 'RETRY_LOGIC_ERROR');
    }
}

/**
 * OpenAI Provider implementation.
 * Our resident digital poet, usually quite eloquent.
 */
class OpenAIProvider extends BaseAiProvider {
    // In a real scenario, this would import and use the OpenAI SDK.
    // For this grand demo, we'll mock the actual API calls.
    private readonly openAiClient: any; // Placeholder for OpenAI SDK client

    constructor(telemetryService: ITelemetryService, tokenEstimator: TokenEstimator, costCalculator: CostCalculator) {
        super(AiProviderType.OpenAI, AiProviderType.OpenAI, telemetryService, tokenEstimator, costCalculator);
        // Initialize the mock client here
        this.openAiClient = {
            chat: {
                completions: {
                    create: async (params: any) => {
                        this.telemetryService.info(`Mock OpenAI API call for model: ${params.model}`, { params });
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200)); // Simulate network latency

                        if (Math.random() < 0.05) { // Simulate a 5% chance of failure (for retries!)
                            throw new Error('Mock OpenAI API temporary error: Service Unavailable.');
                        }

                        const promptContent = params.messages?.[params.messages.length - 1]?.content || params.prompt || 'No prompt';
                        const responseContent = `Ah, a query for the great GPT-jester! Here is a most profound (and mock) answer to "${promptContent.substring(0, 50)}..." from ${params.model}. Indeed!`;

                        const promptTokens = this.estimateTokens(promptContent);
                        const completionTokens = this.estimateTokens(responseContent);

                        return {
                            id: `chatcmpl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                            choices: [{ message: { content: responseContent }, finish_reason: 'stop' }],
                            model: params.model,
                            usage: {
                                prompt_tokens: promptTokens,
                                completion_tokens: completionTokens,
                                total_tokens: promptTokens + completionTokens
                            }
                        };
                    }
                }
            }
        };
    }

    /**
     * @override
     * Initializes the OpenAI provider. Sets up the SDK client with the API key.
     * @param config The provider configuration.
     */
    async initialize(config: IProviderConfig): Promise<void> {
        await super.initialize(config);
        // In a real scenario:
        // this.openAiClient = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
        this.telemetryService.info(`OpenAIProvider '${this.id}' fully initialized with mock client.`, { baseUrl: config.baseUrl });
    }

    /**
     * @override
     * Processes an AI request using the OpenAI Chat Completions API.
     * Handles mapping generic request to OpenAI specific parameters.
     * @param request The generic AI request.
     * @returns A Promise resolving to a generic AI response.
     */
    async processRequest(request: IAiRequest): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('OpenAIProvider.processRequest', request.metadata?.traceId);
        try {
            const openAiRequestParams = {
                model: request.model || this.config.defaultModel,
                messages: request.messages || [{ role: 'user', content: request.prompt }],
                temperature: request.requestConfig?.temperature ?? 0.7,
                max_tokens: request.requestConfig?.max_tokens ?? 2048,
                top_p: request.requestConfig?.top_p ?? 1,
                stop: request.requestConfig?.stop_sequences,
                stream: request.requestConfig?.stream ?? false,
                // ... other OpenAI specific parameters
            };

            const response = await this.withRetry(
                () => this.openAiClient.chat.completions.create(openAiRequestParams),
                this.config.maxRetries || 3,
                this.config.retryBackoffFactor || 2,
                this.config.timeoutMs || 30000
            );

            if (!response.choices || response.choices.length === 0) {
                this.telemetryService.error(`OpenAI response missing choices.`, { response });
                throw new AiProviderError('OpenAI response missing choices.', 'OPENAI_NO_CHOICES', response);
            }

            const content = response.choices[0].message.content || '';
            const promptTokens = response.usage?.prompt_tokens || this.estimateTokensForMessagesRough(openAiRequestParams.messages);
            const completionTokens = response.usage?.completion_tokens || this.estimateTokens(content);
            const totalTokens = response.usage?.total_tokens || (promptTokens + completionTokens);

            const rates = this.getCostPerToken(openAiRequestParams.model);
            const estimatedCost = this.costCalculator.calculate(promptTokens, completionTokens, openAiRequestParams.model, rates);

            const aiResponse: IAiResponse = {
                id: response.id,
                content: content,
                model: openAiRequestParams.model,
                usage: {
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: totalTokens,
                    cost: estimatedCost,
                },
                metadata: request.metadata,
                rawResponse: response,
            };

            this.telemetryService.info(`OpenAI request processed successfully.`, {
                model: aiResponse.model,
                totalTokens: aiResponse.usage.total_tokens,
                cost: aiResponse.usage.cost
            });
            this.telemetryService.endSpan(spanId, 'ok');
            return aiResponse;
        } catch (error) {
            this.telemetryService.error(`Error processing OpenAI request: ${error.message}`, { originalError: error });
            this.telemetryService.endSpan(spanId, 'error', { error: error.message });
            throw AiProviderError.fromUnknown(error, 'OPENAI_REQUEST_FAILED');
        }
    }

    /**
     * Estimates tokens more accurately for OpenAI using an internal utility.
     * @param text The text to estimate.
     * @returns The estimated token count.
     */
    override estimateTokens(text: string): number {
        // In a real scenario, this would use 'tiktoken' or a similar library.
        // For now, we'll use our jester's approximation.
        return this.tokenEstimator.estimateTokensRough(text);
    }

    private estimateTokensForMessagesRough(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): number {
        return this.tokenEstimator.estimateTokensForMessagesRough(messages);
    }
}

/**
 * Anthropic Provider implementation.
 * Our wise old sage, who occasionally pronounces words with too many 'h's.
 */
class AnthropicProvider extends BaseAiProvider {
    // Placeholder for Anthropic SDK client.
    private readonly anthropicClient: any;

    constructor(telemetryService: ITelemetryService, tokenEstimator: TokenEstimator, costCalculator: CostCalculator) {
        super(AiProviderType.Anthropic, AiProviderType.Anthropic, telemetryService, tokenEstimator, costCalculator);
        // Initialize the mock client
        this.anthropicClient = {
            messages: {
                create: async (params: any) => {
                    this.telemetryService.info(`Mock Anthropic API call for model: ${params.model}`, { params });
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 700 + 300)); // Simulate network latency

                    if (Math.random() < 0.08) { // Simulate a slightly higher chance of failure
                        throw new Error('Mock Anthropic API temporary error: Too many thoughts, try again.');
                    }

                    const lastMessage = params.messages?.[params.messages.length - 1]?.content || params.prompt || 'No prompt';
                    const responseContent = `Hark! A response from the venerable Claude-jester! Your query on "${lastMessage.substring(0, 50)}..." hath been pondered with great gravity (and mock computation) by ${params.model}. Indeed!`;

                    const promptTokens = this.estimateTokens(lastMessage);
                    const completionTokens = this.estimateTokens(responseContent);

                    return {
                        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'text', text: responseContent }],
                        model: params.model,
                        usage: {
                            input_tokens: promptTokens,
                            output_tokens: completionTokens
                        }
                    };
                }
            }
        };
    }

    /**
     * @override
     * Initializes the Anthropic provider. Sets up the SDK client with the API key.
     * @param config The provider configuration.
     */
    async initialize(config: IProviderConfig): Promise<void> {
        await super.initialize(config);
        // In a real scenario:
        // this.anthropicClient = new Anthropic({ apiKey: config.apiKey, baseURL: config.baseUrl });
        this.telemetryService.info(`AnthropicProvider '${this.id}' fully initialized with mock client.`, { baseUrl: config.baseUrl });
    }

    /**
     * @override
     * Processes an AI request using the Anthropic Messages API.
     * Handles mapping generic request to Anthropic specific parameters.
     * @param request The generic AI request.
     * @returns A Promise resolving to a generic AI response.
     */
    async processRequest(request: IAiRequest): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('AnthropicProvider.processRequest', request.metadata?.traceId);
        try {
            const anthropicRequestParams = {
                model: request.model || this.config.defaultModel,
                messages: request.messages || [{ role: 'user', content: request.prompt }],
                temperature: request.requestConfig?.temperature ?? 0.7,
                max_tokens: request.requestConfig?.max_tokens ?? 2048,
                // Anthropic-specific parameters like system prompts would be handled here
                system: request.messages?.find(m => m.role === 'system')?.content,
                // Remove system message from the `messages` array for Anthropic's API if it was included in generic request
                messages: request.messages?.filter(m => m.role !== 'system') || [{ role: 'user', content: request.prompt }]
            };

            const response = await this.withRetry(
                () => this.anthropicClient.messages.create(anthropicRequestParams),
                this.config.maxRetries || 4,
                this.config.retryBackoffFactor || 2.5,
                this.config.timeoutMs || 45000
            );

            if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
                this.telemetryService.error(`Anthropic response missing content or not text type.`, { response });
                throw new AiProviderError('Anthropic response missing content.', 'ANTHROPIC_NO_CONTENT', response);
            }

            const content = response.content[0].text || '';
            const promptTokens = response.usage?.input_tokens || this.estimateTokensForMessagesRough(anthropicRequestParams.messages);
            const completionTokens = response.usage?.output_tokens || this.estimateTokens(content);
            const totalTokens = promptTokens + completionTokens;

            const rates = this.getCostPerToken(anthropicRequestParams.model);
            const estimatedCost = this.costCalculator.calculate(promptTokens, completionTokens, anthropicRequestParams.model, rates);

            const aiResponse: IAiResponse = {
                id: response.id,
                content: content,
                model: anthropicRequestParams.model,
                usage: {
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: totalTokens,
                    cost: estimatedCost,
                },
                metadata: request.metadata,
                rawResponse: response,
            };

            this.telemetryService.info(`Anthropic request processed successfully.`, {
                model: aiResponse.model,
                totalTokens: aiResponse.usage.total_tokens,
                cost: aiResponse.usage.cost
            });
            this.telemetryService.endSpan(spanId, 'ok');
            return aiResponse;
        } catch (error) {
            this.telemetryService.error(`Error processing Anthropic request: ${error.message}`, { originalError: error });
            this.telemetryService.endSpan(spanId, 'error', { error: error.message });
            throw AiProviderError.fromUnknown(error, 'ANTHROPIC_REQUEST_FAILED');
        }
    }

    /**
     * Estimates tokens for Anthropic, potentially with a specific tokenizer if available.
     * @param text The text to estimate.
     * @returns The estimated token count.
     */
    override estimateTokens(text: string): number {
        // Anthropic also has a specific tokenization, use mock for now.
        return this.tokenEstimator.estimateTokensRough(text);
    }

    private estimateTokensForMessagesRough(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): number {
        return this.tokenEstimator.estimateTokensForMessagesRough(messages);
    }
}

/**
 * Mock AI Provider for testing and local development.
 * Our friendly mime, always ready with a silent, yet expressive, response.
 */
class MockAiProvider extends BaseAiProvider {
    constructor(telemetryService: ITelemetryService, tokenEstimator: TokenEstimator, costCalculator: CostCalculator) {
        super(AiProviderType.Mock, AiProviderType.Mock, telemetryService, tokenEstimator, costCalculator);
    }

    /**
     * @override
     * Initializes the mock provider.
     * @param config The provider configuration.
     */
    async initialize(config: IProviderConfig): Promise<void> {
        await super.initialize(config);
        this.telemetryService.info(`MockAiProvider '${this.id}' initialized. Ready to dispense simulated wisdom!`);
    }

    /**
     * @override
     * Processes a mock AI request. Returns a predefined or generated mock response.
     * @param request The generic AI request.
     * @returns A Promise resolving to a generic AI response.
     */
    async processRequest(request: IAiRequest): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('MockAiProvider.processRequest', request.metadata?.traceId);
        try {
            this.telemetryService.info(`Mock AI Provider '${this.id}' processing request for model '${request.model}'.`);
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // Simulate very fast response

            const mockPrompt = request.messages?.[request.messages.length - 1]?.content || request.prompt;
            const mockResponseContent = `(Mock Response from ${request.model || this.config.defaultModel}): Ah, a request for your humble mock AI! I have pondered your query: "${mockPrompt?.substring(0, 50)}...". My wisdom, though simulated, is yours to behold! (Huzzah!)`;

            const promptTokens = this.estimateTokens(mockPrompt || '');
            const completionTokens = this.estimateTokens(mockResponseContent);
            const totalTokens = promptTokens + completionTokens;

            const aiResponse: IAiResponse = {
                id: `mock-res-${Date.now()}`,
                content: mockResponseContent,
                model: request.model || this.config.defaultModel,
                usage: {
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: totalTokens,
                    cost: 0, // Mock AI is free, a jester's gift!
                },
                metadata: request.metadata,
                rawResponse: { mockData: 'this is a mock response object' },
            };

            this.telemetryService.info(`Mock AI request processed.`, { model: aiResponse.model, totalTokens });
            this.telemetryService.endSpan(spanId, 'ok');
            return aiResponse;
        } catch (error) {
            this.telemetryService.error(`Error processing Mock AI request: ${error.message}`, { originalError: error });
            this.telemetryService.endSpan(spanId, 'error', { error: error.message });
            throw AiProviderError.fromUnknown(error, 'MOCK_REQUEST_FAILED');
        }
    }
}


// --- SECTION 5: MIDDLEWARE (The Jester's Assistants) ---

/**
 * @module middleware
 * @description Pluggable functions that intercept and modify AI requests/responses.
 *              These are the clever tricks our Jester uses to make things run smoothly.
 */

/**
 * A simple console logger middleware.
 * Ensures every laugh, every stumble, every digital thought is recorded for posterity.
 */
class LoggerMiddleware implements IMiddleware {
    public readonly name = 'LoggerMiddleware';
    public readonly order = 10; // Early in the chain to log initial request

    private readonly telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * @override
     * Logs the incoming request and outgoing response.
     * @param request The AI request.
     * @param next The next middleware or the provider itself.
     * @returns The AI response.
     */
    async apply(request: IAiRequest, next: (req: IAiRequest) => Promise<IAiResponse>): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('LoggerMiddleware.apply');
        this.telemetryService.info(`[${this.name}] Request received for model '${request.model}'.`, {
            sessionId: request.sessionId,
            promptExcerpt: request.prompt?.substring(0, 100),
            metadata: request.metadata
        });

        try {
            const response = await next(request);
            this.telemetryService.info(`[${this.name}] Response sent for model '${response.model}'.`, {
                responseId: response.id,
                totalTokens: response.usage.total_tokens,
                cost: response.usage.cost,
                contentExcerpt: response.content?.substring(0, 100)
            });
            this.telemetryService.endSpan(spanId, 'ok');
            return response;
        } catch (error) {
            this.telemetryService.error(`[${this.name}] Error in request for model '${request.model}': ${error.message}`, {
                sessionId: request.sessionId,
                originalError: error
            });
            this.telemetryService.endSpan(spanId, 'error', { error: error.message });
            throw error;
        }
    }
}

/**
 * An in-memory cache middleware.
 * Because sometimes, the digital genies just repeat themselves, and we like efficiency!
 */
class CacheMiddleware implements IMiddleware {
    public readonly name = 'CacheMiddleware';
    public readonly order = 20; // After logging, before rate limiting

    private readonly cacheService: ICacheService;
    private readonly telemetryService: ITelemetryService;
    private readonly configManager: IConfigManager;

    constructor(cacheService: ICacheService, telemetryService: ITelemetryService, configManager: IConfigManager) {
        this.cacheService = cacheService;
        this.telemetryService = telemetryService;
        this.configManager = configManager;
    }

    /**
     * Generates a cache key from the request.
     * @param request The AI request.
     * @returns A unique string cache key.
     */
    private generateCacheKey(request: IAiRequest): string {
        // A simple JSON.stringify is fine for demo, but needs more robust hashing for production
        // considering order of keys, non-deterministic values etc.
        return `cache:${request.model}:${JSON.stringify({
            prompt: request.prompt,
            messages: request.messages,
            requestConfig: request.requestConfig
        })}`;
    }

    /**
     * @override
     * Checks cache before sending request to provider. Caches response upon completion.
     * @param request The AI request.
     * @param next The next middleware or the provider itself.
     * @returns The AI response (from cache or provider).
     */
    async apply(request: IAiRequest, next: (req: IAiRequest) => Promise<IAiResponse>): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('CacheMiddleware.apply');
        const cacheEnabled = this.configManager.get<boolean>('cache.enabled', true);

        if (!cacheEnabled) {
            this.telemetryService.info(`[${this.name}] Cache is disabled. Bypassing cache.`, { requestModel: request.model });
            this.telemetryService.endSpan(spanId, 'ok', { cacheEnabled: false });
            return next(request);
        }

        const cacheKey = this.generateCacheKey(request);
        let response: IAiResponse | undefined;

        try {
            response = await this.cacheService.get(cacheKey);
        } catch (error) {
            this.telemetryService.error(`[${this.name}] Error retrieving from cache: ${error.message}`, { cacheKey, originalError: error });
            // Continue to next without failing if cache error
        }

        if (response) {
            this.telemetryService.info(`[${this.name}] Cache hit for model '${request.model}'.`, { cacheKey });
            this.telemetryService.metric('cache.hits', 1, { model: request.model });
            this.telemetryService.endSpan(spanId, 'ok', { cacheHit: true });
            return { ...response, metadata: { ...response.metadata, fromCache: true } }; // Mark response as from cache
        } else {
            this.telemetryService.info(`[${this.name}] Cache miss for model '${request.model}'.`, { cacheKey });
            this.telemetryService.metric('cache.misses', 1, { model: request.model });
            this.telemetryService.endSpan(spanId, 'ok', { cacheHit: false });
            response = await next(request);

            const defaultTtl = this.configManager.get<number>('cache.defaultTtlSeconds', 3600);
            try {
                await this.cacheService.set(cacheKey, response, defaultTtl);
                this.telemetryService.info(`[${this.name}] Response cached for model '${response.model}'.`, { cacheKey, ttl: defaultTtl });
            } catch (error) {
                this.telemetryService.error(`[${this.name}] Error setting to cache: ${error.message}`, { cacheKey, originalError: error });
                // Do not fail the request if caching fails
            }
            return response;
        }
    }
}

/**
 * A basic rate limiting middleware.
 * Keeps our digital genies from getting overexcited and incurring hefty fines!
 */
class RateLimitMiddleware implements IMiddleware {
    public readonly name = 'RateLimitMiddleware';
    public readonly order = 30; // After logging and cache, before actual provider call

    private readonly rateLimiter: IRateLimiter;
    private readonly telemetryService: ITelemetryService;
    private readonly configManager: IConfigManager;
    private readonly tokenEstimator: TokenEstimator;

    constructor(rateLimiter: IRateLimiter, telemetryService: ITelemetryService, configManager: IConfigManager, tokenEstimator: TokenEstimator) {
        this.rateLimiter = rateLimiter;
        this.telemetryService = telemetryService;
        this.configManager = configManager;
        this.tokenEstimator = tokenEstimator;
    }

    /**
     * @override
     * Applies rate limiting logic before allowing the request to proceed.
     * @param request The AI request.
     * @param next The next middleware or the provider itself.
     * @returns The AI response.
     * @throws {AiProviderError} if rate limit is exceeded.
     */
    async apply(request: IAiRequest, next: (req: IAiRequest) => Promise<IAiResponse>): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('RateLimitMiddleware.apply');
        const rateLimitEnabled = this.configManager.get<boolean>('rateLimiter.enabled', true);

        if (!rateLimitEnabled) {
            this.telemetryService.info(`[${this.name}] Rate limiting is disabled. Bypassing.`, { requestModel: request.model });
            this.telemetryService.endSpan(spanId, 'ok', { rateLimitEnabled: false });
            return next(request);
        }

        const providerId = request.metadata?.providerId;
        if (!providerId) {
            this.telemetryService.warn(`[${this.name}] No providerId in request metadata. Cannot apply specific rate limiting.`, { requestModel: request.model });
            this.telemetryService.endSpan(spanId, 'ok', { providerIdMissing: true });
            return next(request);
        }

        const model = request.model || this.configManager.getProviderConfig(providerId).defaultModel;
        if (!model) {
            this.telemetryService.warn(`[${this.name}] No model specified for rate limiting. Skipping.`, { providerId });
            this.telemetryService.endSpan(spanId, 'ok', { modelMissing: true });
            return next(request);
        }

        const estimatedTokens = this.tokenEstimator.estimateTokensRough(request.prompt || (request.messages?.map(m => m.content).join(' ') || ''));

        try {
            const allowed = await this.rateLimiter.acquire(providerId, model, estimatedTokens);
            if (!allowed) {
                const status = this.rateLimiter.getStatus(providerId, model);
                const errorMessage = `Rate limit exceeded for provider '${providerId}', model '${model}'. Try again after ${status.resetTime.toISOString()}.`;
                this.telemetryService.warn(`[${this.name}] ${errorMessage}`, { providerId, model, estimatedTokens, status });
                this.telemetryService.metric('rate.limit_exceeded', 1, { providerId, model });
                this.telemetryService.endSpan(spanId, 'error', { rateLimitExceeded: true });
                throw new AiProviderError(errorMessage, 'RATE_LIMIT_EXCEEDED', null, { providerId, model, estimatedTokens, status });
            }
            this.telemetryService.info(`[${this.name}] Rate limit check passed for provider '${providerId}', model '${model}'.`, { providerId, model, estimatedTokens });
            this.telemetryService.endSpan(spanId, 'ok');
            return next(request);
        } catch (error) {
            this.telemetryService.error(`[${this.name}] Error during rate limit acquisition: ${error.message}`, { providerId, model, originalError: error });
            this.telemetryService.endSpan(spanId, 'error', { error: error.message });
            throw error; // Re-throw the error, potentially AiProviderError
        }
    }
}

/**
 * Middleware for robust error handling and response standardization.
 * Even the best jesters sometimes trip, so we catch them gracefully!
 */
class ErrorHandlingMiddleware implements IMiddleware {
    public readonly name = 'ErrorHandlingMiddleware';
    public readonly order = 999; // Last in the chain to catch all errors

    private readonly telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * @override
     * Wraps the `next` call in a try-catch block to standardize error responses.
     * @param request The AI request.
     * @param next The next middleware or the provider itself.
     * @returns The AI response.
     * @throws {AiProviderError} if an error occurs.
     */
    async apply(request: IAiRequest, next: (req: IAiRequest) => Promise<IAiResponse>): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('ErrorHandlingMiddleware.apply');
        try {
            const response = await next(request);
            this.telemetryService.endSpan(spanId, 'ok');
            return response;
        } catch (error) {
            const aiProviderError = AiProviderError.fromUnknown(error, 'REQUEST_PROCESSING_FAILED');
            this.telemetryService.error(`[${this.name}] Caught and normalized error: ${aiProviderError.message}`, {
                requestModel: request.model,
                errorCode: aiProviderError.code,
                originalError: aiProviderError.originalError,
                details: aiProviderError.details,
            });
            this.telemetryService.endSpan(spanId, 'error', { error: aiProviderError.message, code: aiProviderError.code });
            throw aiProviderError; // Re-throw the standardized error
        }
    }
}

/**
 * Middleware for collecting detailed telemetry data on requests and responses.
 * Our Jester's keen eye for data, always observing!
 */
class TelemetryMiddleware implements IMiddleware {
    public readonly name = 'TelemetryMiddleware';
    public readonly order = 5; // Very early to start timing

    private readonly telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * @override
     * Records request duration, token usage, and cost metrics.
     * @param request The AI request.
     * @param next The next middleware or the provider itself.
     * @returns The AI response.
     */
    async apply(request: IAiRequest, next: (req: IAiRequest) => Promise<IAiResponse>): Promise<IAiResponse> {
        const startTime = process.hrtime.bigint();
        const requestSpan = this.telemetryService.startSpan('AiRequestProcessing', request.metadata?.traceId);

        try {
            const response = await next(request);

            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

            const providerId = request.metadata?.providerId || 'unknown';
            const model = request.model || 'unknown';

            this.telemetryService.metric('ai_request_duration_ms', durationMs, { provider: providerId, model, status: 'success' });
            this.telemetryService.metric('ai_prompt_tokens', response.usage.prompt_tokens, { provider: providerId, model });
            this.telemetryService.metric('ai_completion_tokens', response.usage.completion_tokens, { provider: providerId, model });
            this.telemetryService.metric('ai_total_tokens', response.usage.total_tokens, { provider: providerId, model });
            if (response.usage.cost !== undefined) {
                this.telemetryService.metric('ai_request_cost', response.usage.cost, { provider: providerId, model });
            }

            this.telemetryService.info(`[${this.name}] Request telemetry recorded.`, {
                provider: providerId,
                model,
                durationMs,
                totalTokens: response.usage.total_tokens,
                cost: response.usage.cost
            });
            this.telemetryService.endSpan(requestSpan, 'ok', {
                providerId, model, durationMs, totalTokens: response.usage.total_tokens, cost: response.usage.cost
            });
            return response;
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            const providerId = request.metadata?.providerId || 'unknown';
            const model = request.model || 'unknown';

            this.telemetryService.metric('ai_request_duration_ms', durationMs, { provider: providerId, model, status: 'failure' });
            this.telemetryService.error(`[${this.name}] Request telemetry recorded for failed request.`, {
                provider: providerId,
                model,
                durationMs,
                error: error.message
            });
            this.telemetryService.endSpan(requestSpan, 'error', {
                providerId, model, durationMs, error: error.message
            });
            throw error;
        }
    }
}


// --- SECTION 6: SERVICES (The Royal Court of Logic) ---

/**
 * @module services
 * @description Core services for managing state, orchestration, context, and events.
 *              These are the wise counselors and nimble messengers of our digital kingdom.
 */

/**
 * An in-memory cache implementation.
 * Simple, yet effective for demo purposes, like a jester's quick wit!
 */
class InMemoryCacheService implements ICacheService {
    private cache: Map<string, { data: IAiResponse; expiry: number }> = new Map();
    private readonly telemetryService: ITelemetryService;
    private readonly configManager: IConfigManager;

    constructor(telemetryService: ITelemetryService, configManager: IConfigManager) {
        this.telemetryService = telemetryService;
        this.configManager = configManager;
        this.pruneInterval = setInterval(() => this.pruneCache(), 60 * 1000); // Prune every minute
    }

    private pruneInterval: NodeJS.Timeout;

    /**
     * Periodically removes expired items from the cache.
     * Keeps our memory light and agile, like a dancing jester!
     */
    private pruneCache(): void {
        const now = Date.now();
        let prunedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiry <= now) {
                this.cache.delete(key);
                prunedCount++;
            }
        }
        if (prunedCount > 0) {
            this.telemetryService.info(`[Cache] Pruned ${prunedCount} expired entries. Cache size: ${this.cache.size}`);
        }
        // Enforce max entries
        const maxEntries = this.configManager.get<number>('cache.maxEntries', 1000);
        while (this.cache.size > maxEntries) {
            // Simple LRU (least recently used) or FIFO (first in, first out) eviction could be implemented here
            // For simplicity, just delete the oldest one inserted if we don't track access times.
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
                this.telemetryService.warn(`[Cache] Evicted oldest entry due to max entries limit. Key: ${oldestKey}`);
            }
        }
    }

    /**
     * @override
     * Retrieves a cached response.
     * @param key The cache key.
     * @returns The cached response or undefined.
     */
    async get(key: string): Promise<IAiResponse | undefined> {
        const entry = this.cache.get(key);
        if (entry && entry.expiry > Date.now()) {
            this.telemetryService.info(`[Cache] Cache hit for key: ${key}`);
            return entry.data;
        }
        if (entry) {
            this.cache.delete(key); // Expired entry
            this.telemetryService.info(`[Cache] Cache expired for key: ${key}`);
        }
        this.telemetryService.info(`[Cache] Cache miss for key: ${key}`);
        return undefined;
    }

    /**
     * @override
     * Stores a response in the cache.
     * @param key The cache key.
     * @param response The AI response.
     * @param ttlSeconds Optional time-to-live.
     */
    async set(key: string, response: IAiResponse, ttlSeconds?: number): Promise<void> {
        const ttl = ttlSeconds ?? this.configManager.get<number>('cache.defaultTtlSeconds', 3600);
        const expiry = Date.now() + ttl * 1000;
        this.cache.set(key, { data: response, expiry });
        this.telemetryService.info(`[Cache] Item set for key: ${key} with TTL: ${ttl}s`);
    }

    /**
     * @override
     * Invalidates a specific cache entry.
     * @param key The cache key.
     */
    async invalidate(key: string): Promise<void> {
        this.cache.delete(key);
        this.telemetryService.info(`[Cache] Key invalidated: ${key}`);
    }

    /**
     * @override
     * Clears the entire cache.
     */
    async clear(): Promise<void> {
        this.cache.clear();
        this.telemetryService.info(`[Cache] All entries cleared.`);
    }

    /**
     * Shuts down the cache service, clearing the interval.
     */
    shutdown(): void {
        clearInterval(this.pruneInterval);
        this.telemetryService.info(`[Cache] Cache pruning interval cleared.`);
    }
}

/**
 * A simple in-memory rate limiter.
 * This jester keeps a tally of everyone's requests!
 */
class InMemoryRateLimiter implements IRateLimiter {
    private limits: Map<string, { requestsPerMinute: number; tokensPerMinute: number }> = new Map();
    private usage: Map<string, { requests: number; tokens: number; lastReset: number }> = new Map();
    private readonly telemetryService: ITelemetryService;
    private readonly configManager: IConfigManager;

    constructor(telemetryService: ITelemetryService, configManager: IConfigManager) {
        this.telemetryService = telemetryService;
        this.configManager = configManager;
        this.initializeLimits();
        setInterval(() => this.resetUsage(), 60 * 1000); // Reset every minute
    }

    private initializeLimits(): void {
        const defaultReq = this.configManager.get<number>('rateLimiter.defaultRequestsPerMinute', 60);
        const defaultTokens = this.configManager.get<number>('rateLimiter.defaultTokensPerMinute', 150000);

        // Load specific limits from config for each provider/model
        const providerConfigs = this.configManager.get('providers', {});
        for (const providerId in providerConfigs) {
            const providerConfig = providerConfigs[providerId];
            if (providerConfig.models) {
                for (const modelId in providerConfig.models) {
                    const key = this.getLimitKey(providerId, modelId);
                    this.limits.set(key, {
                        requestsPerMinute: providerConfig.rateLimits?.requestsPerMinute || defaultReq,
                        tokensPerMinute: providerConfig.rateLimits?.tokensPerMinute || defaultTokens
                    });
                }
            } else {
                // If no specific models, apply default to provider
                const key = this.getLimitKey(providerId, 'default');
                this.limits.set(key, {
                    requestsPerMinute: providerConfig.rateLimits?.requestsPerMinute || defaultReq,
                    tokensPerMinute: providerConfig.rateLimits?.tokensPerMinute || defaultTokens
                });
            }
        }
        this.telemetryService.info(`Rate limiter initialized with ${this.limits.size} specific limits.`);
    }

    private getLimitKey(providerId: string, model: string): string {
        return `${providerId}:${model}`;
    }

    private resetUsage(): void {
        this.usage.forEach((val, key) => {
            if (Date.now() - val.lastReset >= 60 * 1000) { // If a minute has passed
                this.usage.set(key, { requests: 0, tokens: 0, lastReset: Date.now() });
            }
        });
        this.telemetryService.info(`Rate limiter usage reset for active limits.`);
    }

    /**
     * @override
     * Acquires quota for a request.
     * @param providerId The ID of the provider.
     * @param model The specific model.
     * @param tokens The number of tokens in the request.
     * @returns True if allowed, false otherwise.
     */
    async acquire(providerId: string, model: string, tokens: number): Promise<boolean> {
        const key = this.getLimitKey(providerId, model);
        const currentUsage = this.usage.get(key) || { requests: 0, tokens: 0, lastReset: Date.now() };
        const limits = this.limits.get(key) || {
            requestsPerMinute: this.configManager.get<number>('rateLimiter.defaultRequestsPerMinute', 60),
            tokensPerMinute: this.configManager.get<number>('rateLimiter.defaultTokensPerMinute', 150000)
        };

        if (currentUsage.requests < limits.requestsPerMinute && currentUsage.tokens + tokens <= limits.tokensPerMinute) {
            currentUsage.requests++;
            currentUsage.tokens += tokens;
            this.usage.set(key, currentUsage);
            this.telemetryService.info(`[RateLimiter] Acquired quota for ${key}. Current: ${currentUsage.requests} req, ${currentUsage.tokens} tokens.`);
            return true;
        }
        this.telemetryService.warn(`[RateLimiter] Denied quota for ${key}. Exceeded: Req: ${currentUsage.requests}/${limits.requestsPerMinute}, Tokens: ${currentUsage.tokens}/${limits.tokensPerMinute}.`);
        return false;
    }

    /**
     * @override
     * Releases quota (e.g., if a request failed).
     * @param providerId The ID of the provider.
     * @param model The specific model.
     * @param tokens The number of tokens to release.
     */
    release(providerId: string, model: string, tokens: number): void {
        const key = this.getLimitKey(providerId, model);
        const currentUsage = this.usage.get(key);
        if (currentUsage) {
            currentUsage.requests = Math.max(0, currentUsage.requests - 1);
            currentUsage.tokens = Math.max(0, currentUsage.tokens - tokens);
            this.usage.set(key, currentUsage);
            this.telemetryService.info(`[RateLimiter] Released quota for ${key}. Current: ${currentUsage.requests} req, ${currentUsage.tokens} tokens.`);
        }
    }

    /**
     * @override
     * Gets the current rate limiter status.
     * @param providerId The ID of the provider.
     * @param model The specific model.
     * @returns Current usage and limits.
     */
    getStatus(providerId: string, model: string): { current: number; limit: number; remaining: number; resetTime: Date } {
        const key = this.getLimitKey(providerId, model);
        const currentUsage = this.usage.get(key) || { requests: 0, tokens: 0, lastReset: Date.now() };
        const limits = this.limits.get(key) || {
            requestsPerMinute: this.configManager.get<number>('rateLimiter.defaultRequestsPerMinute', 60),
            tokensPerMinute: this.configManager.get<number>('rateLimiter.defaultTokensPerMinute', 150000)
        };

        const resetTime = new Date(currentUsage.lastReset + 60 * 1000);
        return {
            current: currentUsage.requests,
            limit: limits.requestsPerMinute,
            remaining: Math.max(0, limits.requestsPerMinute - currentUsage.requests),
            resetTime: resetTime
        };
    }
}

/**
 * An in-memory implementation of an Event Emitter.
 * Our Jester's town crier, broadcasting all important news!
 */
class EventEmitter implements IEventEmitter {
    private listeners: Map<string, Set<(payload: any) => void>> = new Map();
    private readonly telemetryService: ITelemetryService;

    constructor(telemetryService: ITelemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * @override
     * Emits an event to all registered listeners.
     * @param eventName The name of the event.
     * @param payload The data associated with the event.
     */
    emit(eventName: string, payload: any): void {
        const spanId = this.telemetryService.startSpan(`EventEmitter.emit:${eventName}`);
        this.telemetryService.info(`[EventEmitter] Emitting event: ${eventName}`, { payload });
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners) {
            for (const listener of eventListeners) {
                try {
                    listener(payload);
                } catch (error) {
                    this.telemetryService.error(`[EventEmitter] Error in listener for event '${eventName}': ${error.message}`, {
                        eventName, listener: listener.name, originalError: error
                    });
                }
            }
        }
        this.telemetryService.endSpan(spanId, 'ok', { eventName, listenerCount: eventListeners?.size || 0 });
    }

    /**
     * @override
     * Registers a listener for a specific event.
     * @param eventName The name of the event.
     * @param listener The callback function.
     * @returns A function to unsubscribe.
     */
    on(eventName: string, listener: (payload: any) => void): () => void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName)!.add(listener);
        this.telemetryService.info(`[EventEmitter] Listener registered for event: ${eventName}`, { listener: listener.name });
        return () => this.off(eventName, listener);
    }

    /**
     * Removes a specific listener for an event.
     * @param eventName The name of the event.
     * @param listener The callback function to remove.
     */
    off(eventName: string, listener: (payload: any) => void): void {
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners) {
            eventListeners.delete(listener);
            this.telemetryService.info(`[EventEmitter] Listener deregistered for event: ${eventName}`, { listener: listener.name });
            if (eventListeners.size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }
}

/**
 * An in-memory context manager for conversational AI.
 * The Jester's memory palace, holding all the witty banter!
 */
class InMemoryContextManager implements IContextManager {
    private sessions: Map<string, Array<{ role: 'user' | 'assistant'; content: string }>> = new Map();
    private readonly telemetryService: ITelemetryService;
    private readonly tokenEstimator: TokenEstimator;

    constructor(telemetryService: ITelemetryService, tokenEstimator: TokenEstimator) {
        this.telemetryService = telemetryService;
        this.tokenEstimator = tokenEstimator;
    }

    /**
     * @override
     * Stores messages for a given session, truncating if exceeding max length/tokens.
     * @param sessionId Unique ID for the conversation session.
     * @param messages The messages to store.
     * @param maxLength Optional maximum number of messages or tokens.
     */
    async storeContext(sessionId: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, maxLength?: number): Promise<void> {
        const spanId = this.telemetryService.startSpan('ContextManager.storeContext', { sessionId });
        let currentContext = this.sessions.get(sessionId) || [];
        currentContext = [...currentContext, ...messages]; // Append new messages

        if (maxLength !== undefined) {
            // Simple message count truncation (can be refined to token-based)
            if (maxLength > 0 && currentContext.length > maxLength) {
                this.telemetryService.warn(`[ContextManager] Context for session '${sessionId}' truncated by message count.`, { originalLength: currentContext.length, newLength: maxLength });
                currentContext = currentContext.slice(-maxLength); // Keep only the latest messages
            }

            // More advanced: token-based truncation (requires provider-specific tokenizers)
            // For now, relying on rough estimation if maxLength is used as a token limit proxy
            const estimatedTokens = this.tokenEstimator.estimateTokensForMessagesRough(currentContext);
            if (maxLength > 0 && estimatedTokens > maxLength) { // Assuming maxLength is now acting as a token limit
                this.telemetryService.warn(`[ContextManager] Context for session '${sessionId}' truncated by token count.`, { originalTokens: estimatedTokens, newLength: maxLength });
                // This is a naive way to truncate by tokens, a better approach would be to iterate
                // and remove oldest messages until token count is below threshold.
                let tokens = estimatedTokens;
                while (tokens > maxLength && currentContext.length > 1) { // Always keep at least one message
                    const removedMessage = currentContext.shift();
                    if (removedMessage) {
                        tokens -= this.tokenEstimator.estimateTokensRough(removedMessage.content) + 4; // Remove message tokens + overhead
                    }
                }
                if (tokens > maxLength && currentContext.length === 1) {
                    // If even one message is too long, we might need to truncate its content.
                    // This is usually handled by the AI provider itself, not ideal for a context manager.
                    this.telemetryService.warn(`[ContextManager] Single remaining message for session '${sessionId}' still exceeds token limit after truncation.`);
                }
            }
        }

        this.sessions.set(sessionId, currentContext);
        this.telemetryService.info(`[ContextManager] Context stored for session '${sessionId}'. Messages: ${currentContext.length}`);
        this.telemetryService.endSpan(spanId, 'ok', { sessionId, messageCount: currentContext.length });
    }

    /**
     * @override
     * Retrieves conversational context for a session.
     * @param sessionId Unique ID for the conversation session.
     * @param maxTokens Optional maximum token count for the retrieved context.
     * @returns The array of messages.
     */
    async retrieveContext(sessionId: string, maxTokens?: number): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
        const spanId = this.telemetryService.startSpan('ContextManager.retrieveContext', { sessionId });
        let currentContext = this.sessions.get(sessionId) || [];

        if (maxTokens !== undefined && maxTokens > 0) {
            let contextTokens = this.tokenEstimator.estimateTokensForMessagesRough(currentContext);
            if (contextTokens > maxTokens) {
                this.telemetryService.warn(`[ContextManager] Retrieved context for session '${sessionId}' truncated to fit maxTokens.`, { originalTokens: contextTokens, maxTokens });
                const truncatedContext: Array<{ role: 'user' | 'assistant'; content: string }> = [];
                let currentTokens = 0;
                // Add messages from newest to oldest until maxTokens is reached
                for (let i = currentContext.length - 1; i >= 0; i--) {
                    const message = currentContext[i];
                    const messageTokens = this.tokenEstimator.estimateTokensRough(message.content) + 4;
                    if (currentTokens + messageTokens <= maxTokens) {
                        truncatedContext.unshift(message); // Add to the beginning to maintain chronological order
                        currentTokens += messageTokens;
                    } else {
                        break; // Stop if adding the next message exceeds the limit
                    }
                }
                currentContext = truncatedContext;
            }
        }

        this.telemetryService.info(`[ContextManager] Context retrieved for session '${sessionId}'. Messages: ${currentContext.length}`);
        this.telemetryService.endSpan(spanId, 'ok', { sessionId, messageCount: currentContext.length });
        return currentContext;
    }

    /**
     * @override
     * Clears the context for a specific session.
     * @param sessionId Unique ID for the conversation session.
     */
    async clearContext(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
        this.telemetryService.info(`[ContextManager] Context cleared for session '${sessionId}'.`);
    }
}

/**
 * A factory for creating AI Provider instances.
 * Our digital smithy, forging AI tools from raw configuration!
 */
class AiProviderFactory {
    private readonly telemetryService: ITelemetryService;
    private readonly tokenEstimator: TokenEstimator;
    private readonly costCalculator: CostCalculator;

    constructor(telemetryService: ITelemetryService, tokenEstimator: TokenEstimator, costCalculator: CostCalculator) {
        this.telemetryService = telemetryService;
        this.tokenEstimator = tokenEstimator;
        this.costCalculator = costCalculator;
    }

    /**
     * Creates and initializes an AI provider based on its type and configuration.
     * @param config The configuration for the provider.
     * @returns A Promise that resolves with the initialized AI provider instance.
     * @throws {AiProviderError} if the provider type is unknown.
     */
    async createProvider(config: IProviderConfig): Promise<IAiProvider> {
        const spanId = this.telemetryService.startSpan('AiProviderFactory.createProvider', { providerType: config.type, providerId: config.id });
        let provider: IAiProvider;

        switch (config.type) {
            case AiProviderType.OpenAI:
                provider = new OpenAIProvider(this.telemetryService, this.tokenEstimator, this.costCalculator);
                break;
            case AiProviderType.Anthropic:
                provider = new AnthropicProvider(this.telemetryService, this.tokenEstimator, this.costCalculator);
                break;
            case AiProviderType.Mock:
                provider = new MockAiProvider(this.telemetryService, this.tokenEstimator, this.costCalculator);
                break;
            // Extend with more providers as our digital empire expands!
            // case AiProviderType.GoogleGenerativeAI:
            //    provider = new GoogleGeminiProvider(this.telemetryService, this.tokenEstimator, this.costCalculator);
            //    break;
            default:
                this.telemetryService.error(`Unknown AI provider type: ${config.type}.`, { providerType: config.type, providerId: config.id });
                this.telemetryService.endSpan(spanId, 'error', { error: 'UNKNOWN_PROVIDER_TYPE' });
                throw new AiProviderError(`Unknown AI provider type: ${config.type}`, 'UNKNOWN_PROVIDER_TYPE', null, { providerType: config.type });
        }

        await provider.initialize(config);
        this.telemetryService.info(`AI Provider '${config.id}' of type '${config.type}' created and initialized.`, { providerId: config.id, providerType: config.type });
        this.telemetryService.endSpan(spanId, 'ok', { providerId: config.id, providerType: config.type });
        return provider;
    }
}

/**
 * The central AI State Manager.
 * This is the Jester's ledger, keeping track of all our digital genies.
 */
class AiStateManager implements IAiStateManager {
    private providers: Map<string, IAiProvider> = new Map();
    private readonly telemetryService: ITelemetryService;
    private readonly eventEmitter: IEventEmitter;
    private readonly configManager: IConfigManager;

    constructor(telemetryService: ITelemetryService, eventEmitter: IEventEmitter, configManager: IConfigManager) {
        this.telemetryService = telemetryService;
        this.eventEmitter = eventEmitter;
        this.configManager = configManager;
    }

    /**
     * @override
     * Registers a new AI provider instance.
     * @param provider The AI provider to register.
     */
    async registerProvider(provider: IAiProvider): Promise<void> {
        const spanId = this.telemetryService.startSpan('AiStateManager.registerProvider', { providerId: provider.id, providerType: provider.type });
        if (this.providers.has(provider.id)) {
            this.telemetryService.error(`Provider with ID '${provider.id}' already registered.`, { providerId: provider.id });
            this.telemetryService.endSpan(spanId, 'error', { error: 'PROVIDER_ALREADY_REGISTERED' });
            throw new AiProviderError(`Provider with ID '${provider.id}' already registered.`, 'PROVIDER_ALREADY_REGISTERED', null, { providerId: provider.id });
        }
        this.providers.set(provider.id, provider);
        this.telemetryService.info(`Provider '${provider.id}' (${provider.type}) registered successfully.`, { providerId: provider.id, providerType: provider.type });
        this.eventEmitter.emit(AiProviderEvents.ProviderRegistered, { providerId: provider.id, type: provider.type });
        this.telemetryService.endSpan(spanId, 'ok', { providerId: provider.id });
    }

    /**
     * @override
     * Retrieves a registered AI provider by its ID.
     * @param providerId The ID of the provider to retrieve.
     * @returns The AI provider instance, or undefined if not found.
     */
    getProvider(providerId: string): IAiProvider | undefined {
        return this.providers.get(providerId);
    }

    /**
     * @override
     * Deregisters an AI provider.
     * @param providerId The ID of the provider to deregister.
     */
    async deregisterProvider(providerId: string): Promise<void> {
        const spanId = this.telemetryService.startSpan('AiStateManager.deregisterProvider', { providerId });
        const provider = this.providers.get(providerId);
        if (provider) {
            if (provider.shutdown) {
                await provider.shutdown();
            }
            this.providers.delete(providerId);
            this.telemetryService.info(`Provider '${providerId}' deregistered successfully.`, { providerId });
            this.eventEmitter.emit(AiProviderEvents.ProviderDeregistered, { providerId });
            this.telemetryService.endSpan(spanId, 'ok', { providerId });
        } else {
            this.telemetryService.warn(`Attempted to deregister unknown provider ID: '${providerId}'.`, { providerId });
            this.telemetryService.endSpan(spanId, 'warn', { providerId, status: 'NOT_FOUND' });
        }
    }

    /**
     * @override
     * Gets a list of all registered provider IDs.
     * @returns An array of provider IDs.
     */
    getAllProviderIds(): string[] {
        return Array.from(this.providers.keys());
    }

    /**
     * @override
     * Retrieves the configuration for a specific provider.
     * @param providerId The ID of the provider.
     * @returns The provider's configuration.
     * @throws {AiProviderError} if the provider is not found.
     */
    getProviderConfig(providerId: string): IProviderConfig {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new AiProviderError(`Provider with ID '${providerId}' not found in state manager.`, 'PROVIDER_NOT_FOUND', null, { providerId });
        }
        // Assuming config is available after initialization
        // A better approach might be to store config separately or enforce a `getConfig()` method on IAiProvider
        return this.configManager.getProviderConfig(providerId);
    }

    /**
     * Shuts down all registered providers.
     */
    async shutdownAllProviders(): Promise<void> {
        this.telemetryService.info('Shutting down all AI providers...');
        for (const providerId of Array.from(this.providers.keys())) {
            await this.deregisterProvider(providerId); // This will also call provider.shutdown()
        }
        this.telemetryService.info('All AI providers have been shut down.');
    }
}


/**
 * The AI Orchestrator: The Grand Conductor of our Digital Symphony!
 * This is where the magic happens, where requests flow through middleware to reach their digital genies.
 */
class AiOrchestrator implements IAiOrchestrator {
    private readonly stateManager: IAiStateManager;
    private readonly telemetryService: ITelemetryService;
    private readonly eventEmitter: IEventEmitter;
    private readonly configManager: IConfigManager;
    private readonly contextManager: IContextManager;
    private middlewareChain: IMiddleware[] = [];
    private plugins: IPlugin[] = [];
    private isInitialized: boolean = false;

    constructor(
        stateManager: IAiStateManager,
        telemetryService: ITelemetryService,
        eventEmitter: IEventEmitter,
        configManager: IConfigManager,
        contextManager: IContextManager
    ) {
        this.stateManager = stateManager;
        this.telemetryService = telemetryService;
        this.eventEmitter = eventEmitter;
        this.configManager = configManager;
        this.contextManager = contextManager;

        // Register core middleware that are always present (order 5 and 999)
        this.registerMiddleware(new TelemetryMiddleware(this.telemetryService));
        this.registerMiddleware(new ErrorHandlingMiddleware(this.telemetryService));
    }

    /**
     * Initializes the orchestrator and all registered plugins.
     * This must be called after all providers and initial middleware are set up.
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.telemetryService.warn('AiOrchestrator already initialized. Skipping.');
            return;
        }

        const spanId = this.telemetryService.startSpan('AiOrchestrator.initialize');
        this.telemetryService.info('Initializing AI Orchestrator and plugins...');

        // Sort middleware by order property once all are registered
        this.middlewareChain.sort((a, b) => a.order - b.order);
        this.telemetryService.info(`Middleware chain initialized with ${this.middlewareChain.length} entries.`);

        // Initialize plugins
        for (const plugin of this.plugins) {
            this.telemetryService.info(`Initializing plugin: ${plugin.name} (${plugin.id})...`);
            try {
                await plugin.initialize({
                    stateManager: this.stateManager,
                    eventEmitter: this.eventEmitter,
                    orchestrator: this, // Pass reference to self
                    configManager: this.configManager,
                    telemetryService: this.telemetryService
                });
                this.eventEmitter.emit(AiProviderEvents.PluginInitialized, { pluginId: plugin.id });
                this.telemetryService.info(`Plugin '${plugin.name}' initialized successfully.`);
            } catch (error) {
                this.telemetryService.error(`Failed to initialize plugin '${plugin.name}': ${error.message}`, { pluginId: plugin.id, originalError: error });
                // Decide if failure to initialize a plugin should halt the orchestrator
                throw AiProviderError.fromUnknown(error, 'PLUGIN_INITIALIZATION_FAILED', null, { pluginId: plugin.id });
            }
        }

        this.isInitialized = true;
        this.telemetryService.info('AI Orchestrator and plugins fully initialized. Ready for command!');
        this.telemetryService.endSpan(spanId, 'ok');
    }

    /**
     * Shuts down the orchestrator and all registered plugins.
     */
    async shutdown(): Promise<void> {
        const spanId = this.telemetryService.startSpan('AiOrchestrator.shutdown');
        this.telemetryService.info('Shutting down AI Orchestrator and plugins...');

        for (const plugin of this.plugins) {
            if (plugin.shutdown) {
                this.telemetryService.info(`Shutting down plugin: ${plugin.name} (${plugin.id})...`);
                try {
                    await plugin.shutdown();
                    this.telemetryService.info(`Plugin '${plugin.name}' shut down successfully.`);
                } catch (error) {
                    this.telemetryService.error(`Failed to shut down plugin '${plugin.name}': ${error.message}`, { pluginId: plugin.id, originalError: error });
                }
            }
        }
        this.plugins = []; // Clear plugins

        // Also ensure providers are shut down
        await this.stateManager.shutdownAllProviders();

        this.isInitialized = false;
        this.telemetryService.info('AI Orchestrator and plugins shut down.');
        this.telemetryService.endSpan(spanId, 'ok');
    }

    /**
     * @override
     * Registers a new middleware to the orchestration pipeline.
     * Middleware are sorted by their 'order' property during initialization.
     * @param middleware The middleware instance to register.
     */
    registerMiddleware(middleware: IMiddleware): void {
        this.middlewareChain.push(middleware);
        this.telemetryService.info(`Middleware '${middleware.name}' registered (order: ${middleware.order}).`);
        // Note: Middleware array is sorted during initialize()
    }

    /**
     * @override
     * Unregisters a middleware by its name.
     * @param middlewareName The name of the middleware to remove.
     */
    unregisterMiddleware(middlewareName: string): void {
        const initialLength = this.middlewareChain.length;
        this.middlewareChain = this.middlewareChain.filter(m => m.name !== middlewareName);
        if (this.middlewareChain.length < initialLength) {
            this.telemetryService.info(`Middleware '${middlewareName}' unregistered.`);
        } else {
            this.telemetryService.warn(`Attempted to unregister unknown middleware: '${middlewareName}'.`);
        }
    }

    /**
     * @override
     * Adds a plugin to the orchestrator.
     * Plugins will be initialized when the orchestrator is initialized.
     * @param plugin The plugin instance to add.
     */
    async addPlugin(plugin: IPlugin): Promise<void> {
        if (this.plugins.some(p => p.id === plugin.id)) {
            this.telemetryService.warn(`Plugin with ID '${plugin.id}' already added. Skipping.`);
            return;
        }
        this.plugins.push(plugin);
        this.telemetryService.info(`Plugin '${plugin.name}' (${plugin.id}) added to orchestrator.`);
        // If orchestrator is already initialized, initialize the new plugin immediately
        if (this.isInitialized) {
            this.telemetryService.info(`Orchestrator already initialized. Initializing plugin: ${plugin.name} (${plugin.id})...`);
            try {
                await plugin.initialize({
                    stateManager: this.stateManager,
                    eventEmitter: this.eventEmitter,
                    orchestrator: this,
                    configManager: this.configManager,
                    telemetryService: this.telemetryService
                });
                this.eventEmitter.emit(AiProviderEvents.PluginInitialized, { pluginId: plugin.id });
                this.telemetryService.info(`Plugin '${plugin.name}' initialized successfully after orchestrator startup.`);
            } catch (error) {
                this.telemetryService.error(`Failed to initialize dynamically added plugin '${plugin.name}': ${error.message}`, { pluginId: plugin.id, originalError: error });
                throw AiProviderError.fromUnknown(error, 'DYNAMIC_PLUGIN_INITIALIZATION_FAILED', null, { pluginId: plugin.id });
            }
        }
    }

    /**
     * The core request processing pipeline.
     * This is where requests embark on their grand journey through the middleware forest!
     * @param providerId The ID of the target AI provider.
     * @param request The generic AI request.
     * @returns A Promise that resolves with the generic AI response.
     */
    async processAiRequest(providerId: string, request: IAiRequest): Promise<IAiResponse> {
        if (!this.isInitialized) {
            this.telemetryService.error('AiOrchestrator not initialized. Call initialize() first.');
            throw new AiProviderError('AI Orchestrator not initialized.', 'ORCHESTRATOR_NOT_INITIALIZED');
        }

        const provider = this.stateManager.getProvider(providerId);
        if (!provider) {
            this.telemetryService.error(`AI Provider with ID '${providerId}' not found.`, { providerId });
            throw new AiProviderError(`AI Provider with ID '${providerId}' not found.`, 'PROVIDER_NOT_FOUND', null, { providerId });
        }

        // Augment request with providerId for middleware to use
        const augmentedRequest: IAiRequest = {
            ...request,
            metadata: {
                ...request.metadata,
                providerId: providerId,
                model: request.model || provider.config.defaultModel, // Ensure model is explicitly set early
            }
        };

        this.eventEmitter.emit(AiProviderEvents.RequestStarted, { providerId, request: augmentedRequest });

        // Build the full chain: middleware -> provider
        const chain = this.middlewareChain.reduceRight(
            (next, middleware) => (req: IAiRequest) => {
                this.eventEmitter.emit(AiProviderEvents.MiddlewareApplied, { middleware: middleware.name, request: req });
                return middleware.apply(req, next);
            },
            (req: IAiRequest) => provider.processRequest(req) // The final target is the provider's processRequest
        );

        try {
            const response = await chain(augmentedRequest);
            this.eventEmitter.emit(AiProviderEvents.RequestCompleted, { providerId, response });
            return response;
        } catch (error) {
            this.eventEmitter.emit(AiProviderEvents.RequestFailed, { providerId, request: augmentedRequest, error: error.message });
            throw error; // ErrorHandlingMiddleware should have already normalized it
        }
    }
}

/**
 * The main client for interacting with the AI Provider State Nexus.
 * This is your direct line to the Jester's powerful, orchestrated AI!
 */
class AiProviderStateClient {
    private readonly configManager: IConfigManager;
    private readonly telemetryService: ITelemetryService;
    private readonly eventEmitter: IEventEmitter;
    private readonly tokenEstimator: TokenEstimator;
    private readonly costCalculator: CostCalculator;
    private readonly cacheService: ICacheService;
    private readonly rateLimiter: IRateLimiter;
    private readonly contextManager: IContextManager;
    private readonly providerFactory: AiProviderFactory;
    private readonly stateManager: AiStateManager;
    private readonly orchestrator: AiOrchestrator;

    constructor() {
        // Initialize core services
        this.telemetryService = new ConsoleTelemetryService('info'); // Configurable log level
        this.configManager = new ConfigurationManager(this.telemetryService);
        this.eventEmitter = new EventEmitter(this.telemetryService);
        this.tokenEstimator = new TokenEstimator(this.telemetryService);
        this.costCalculator = new CostCalculator(this.telemetryService);
        this.cacheService = new InMemoryCacheService(this.telemetryService, this.configManager); // Depends on configManager
        this.rateLimiter = new InMemoryRateLimiter(this.telemetryService, this.configManager); // Depends on configManager
        this.contextManager = new InMemoryContextManager(this.telemetryService, this.tokenEstimator);

        // Initialize managers and orchestrator (dependent on core services)
        this.providerFactory = new AiProviderFactory(this.telemetryService, this.tokenEstimator, this.costCalculator);
        this.stateManager = new AiStateManager(this.telemetryService, this.eventEmitter, this.configManager);
        this.orchestrator = new AiOrchestrator(
            this.stateManager,
            this.telemetryService,
            this.eventEmitter,
            this.configManager,
            this.contextManager
        );
    }

    /**
     * Initializes the entire AI Provider State Nexus.
     * Loads configuration, registers default middleware, creates and registers providers, and initializes the orchestrator.
     */
    async initialize(): Promise<void> {
        this.telemetryService.info('Initializing AI Provider State Nexus...');
        const spanId = this.telemetryService.startSpan('AiProviderStateClient.initialize');

        await this.configManager.loadConfig(); // Load global configs first

        // Register default middleware that might depend on config
        this.orchestrator.registerMiddleware(new LoggerMiddleware(this.telemetryService));
        this.orchestrator.registerMiddleware(new CacheMiddleware(this.cacheService, this.telemetryService, this.configManager));
        this.orchestrator.registerMiddleware(new RateLimitMiddleware(this.rateLimiter, this.telemetryService, this.configManager, this.tokenEstimator));
        // Add more common middleware here (e.g., security, input validation)

        // Dynamically create and register providers based on config
        const providerConfigs = this.configManager.get('providers', {});
        for (const providerId in providerConfigs) {
            const config = providerConfigs[providerId] as IProviderConfig;
            if (config && config.id === providerId) { // Ensure ID matches key for sanity
                const provider = await this.providerFactory.createProvider(config);
                await this.stateManager.registerProvider(provider);
            }
        }

        // Initialize the orchestrator (this also sorts middleware and initializes plugins)
        await this.orchestrator.initialize();
        this.telemetryService.info('AI Provider State Nexus fully operational. Let the digital jests begin!');
        this.telemetryService.endSpan(spanId, 'ok');
    }

    /**
     * Shuts down all components of the AI Provider State Nexus.
     */
    async shutdown(): Promise<void> {
        this.telemetryService.info('Shutting down AI Provider State Nexus...');
        const spanId = this.telemetryService.startSpan('AiProviderStateClient.shutdown');

        if (this.cacheService instanceof InMemoryCacheService) {
            this.cacheService.shutdown();
        }
        // No explicit shutdown for in-memory rate limiter or context manager needed beyond clearing intervals

        await this.orchestrator.shutdown(); // This handles plugin and provider shutdowns
        this.telemetryService.info('AI Provider State Nexus gracefully shut down.');
        this.telemetryService.endSpan(spanId, 'ok');
    }

    /**
     * Sends an AI request through the orchestrated pipeline.
     * This is the primary method for users to interact with the system.
     * @param providerId The ID of the target AI provider (e.g., 'openai').
     * @param request The generic AI request object.
     * @returns A Promise that resolves with the generic AI response.
     */
    async sendRequest(providerId: string, request: IAiRequest): Promise<IAiResponse> {
        const spanId = this.telemetryService.startSpan('AiProviderStateClient.sendRequest', request.metadata?.traceId);
        try {
            this.telemetryService.info(`Client sending request to provider '${providerId}'.`, { model: request.model || 'default' });
            const response = await this.orchestrator.processAiRequest(providerId, request);

            // If it's a conversational request, update context
            if (request.sessionId && request.messages) {
                // Store the full conversation turn (user request + AI response)
                await this.contextManager.storeContext(
                    request.sessionId,
                    [...request.messages, { role: 'assistant', content: response.content }]
                );
            }

            this.telemetryService.info(`Client received response from provider '${providerId}'.`, { responseId: response.id });
            this.telemetryService.endSpan(spanId, 'ok');
            return response;
        } catch (error) {
            this.telemetryService.error(`Client request to '${providerId}' failed: ${error.message}`, { providerId, originalError: error });
            this.telemetryService.endSpan(spanId, 'error', { error: error.message });
            throw error; // Re-throw the normalized error from middleware
        }
    }

    /**
     * Retrieves conversational context for a given session.
     * @param sessionId The ID of the conversation session.
     * @param maxTokens Optional maximum tokens for the retrieved context.
     * @returns An array of messages forming the conversation context.
     */
    async getContext(sessionId: string, maxTokens?: number): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
        return this.contextManager.retrieveContext(sessionId, maxTokens);
    }

    /**
     * Clears conversational context for a given session.
     * @param sessionId The ID of the conversation session.
     */
    async clearContext(sessionId: string): Promise<void> {
        await this.contextManager.clearContext(sessionId);
    }

    /**
     * Exposes the underlying AI State Manager for advanced operations (e.g., dynamically adding providers).
     * Use with caution, for only the bravest of code-knights!
     */
    get state() {
        return this.stateManager;
    }

    /**
     * Exposes the Orchestrator for registering custom middleware or plugins.
     * The Jester's backstage pass!
     */
    get pipeline() {
        return this.orchestrator;
    }

    /**
     * Exposes the configuration manager.
     * For peeking into the royal decrees!
     */
    get config() {
        return this.configManager;
    }

    /**
     * Exposes the event emitter.
     * For listening to the digital gossip!
     */
    get events() {
        return this.eventEmitter;
    }

    /**
     * Exposes the telemetry service.
     * For reviewing the jester's performance metrics!
     */
    get telemetry() {
        return this.telemetryService;
    }
}

// And finally, for the grand finale, we export our magnificent creation!
export {
    // Interfaces & Types
    IAiProvider, IAiRequest, IAiResponse, IProviderConfig, IMiddleware, IPlugin, ICacheService,
    IRateLimiter, IContextManager, IEventEmitter, ITelemetryService, IAiStateManager, IAiOrchestrator,
    IConfigManager, AiProviderType, AiProviderEvents, AiProviderError,

    // Implementations
    ConsoleTelemetryService, ConfigurationManager, TokenEstimator, CostCalculator,
    InMemoryCacheService, InMemoryRateLimiter, InMemoryContextManager, EventEmitter,
    BaseAiProvider, OpenAIProvider, AnthropicProvider, MockAiProvider,
    LoggerMiddleware, CacheMiddleware, RateLimitMiddleware, ErrorHandlingMiddleware, TelemetryMiddleware,

    // Core Services
    AiProviderFactory, AiStateManager, AiOrchestrator,

    // The Grand Client!
    AiProviderStateClient
};

/**
 * A delightful usage example, for the aspiring jester-coders!
 *
 * async function main() {
 *     const client = new AiProviderStateClient();
 *     await client.initialize();
 *
 *     // Jester's first jest: a simple query
 *     const simpleRequest: IAiRequest = {
 *         model: 'gpt-4o', // Or 'claude-3-opus-20240229'
 *         prompt: 'Tell me a short, humorous tale about a digital jester who tries to manage cloud infrastructure with a kazoo and a rubber chicken.',
 *         requestConfig: { temperature: 0.9, max_tokens: 200 },
 *         metadata: { traceId: 'jest-123', sessionId: 'jester-session-1' }
 *     };
 *
 *     try {
 *         console.log('\n--- Jester\'s First Jest (OpenAI) ---');
 *         const openAiResponse = await client.sendRequest(AiProviderType.OpenAI, simpleRequest);
 *         console.log('OpenAI Response:', openAiResponse.content);
 *         console.log('Usage:', openAiResponse.usage);
 *
 *         // Jester's second jest: a follow-up, using context
 *         const followUpRequest: IAiRequest = {
 *             model: 'gpt-4o',
 *             prompt: 'And what became of the rubber chicken?',
 *             sessionId: 'jester-session-1',
 *             messages: await client.getContext('jester-session-1'), // Retrieve previous messages
 *             requestConfig: { temperature: 0.8, max_tokens: 150 },
 *             metadata: { traceId: 'jest-124', sessionId: 'jester-session-1' }
 *         };
 *
 *         console.log('\n--- Jester\'s Second Jest (OpenAI, with context) ---');
 *         const openAiFollowUpResponse = await client.sendRequest(AiProviderType.OpenAI, followUpRequest);
 *         console.log('OpenAI Follow-up Response:', openAiFollowUpResponse.content);
 *
 *         // Jester's third jest: trying a different genie!
 *         const anthropicRequest: IAiRequest = {
 *             model: 'claude-3-opus-20240229',
 *             prompt: 'Recount the humorous tale of a medieval jester attempting to fix a broken trebuchet using only a feather and a strong opinion.',
 *             requestConfig: { temperature: 1.0, max_tokens: 250 },
 *             metadata: { traceId: 'jest-125' }
 *         };
 *
 *         console.log('\n--- Jester\'s Third Jest (Anthropic) ---');
 *         const anthropicResponse = await client.sendRequest(AiProviderType.Anthropic, anthropicRequest);
 *         console.log('Anthropic Response:', anthropicResponse.content);
 *
 *         // Jester's fourth jest: a mock response (for testing, or when real genies are on break!)
 *         console.log('\n--- Jester\'s Fourth Jest (Mock AI) ---');
 *         const mockResponse = await client.sendRequest(AiProviderType.Mock, {
 *             model: 'mock-jester-v1',
 *             prompt: 'What is the secret to true happiness (according to a mock AI)?',
 *             metadata: { traceId: 'jest-126' }
 *         });
 *         console.log('Mock AI Response:', mockResponse.content);
 *
 *         // Clear context if the jest is over
 *         await client.clearContext('jester-session-1');
 *         console.log('\nJester\'s session context cleared.');
 *
 *     } catch (error) {
 *         console.error('\n--- A Jester\'s Tale Gone Awry! ---');
 *         console.error('An error befell our grand AI operation:', error);
 *         if (error instanceof AiProviderError) {
 *             console.error('Error Code:', error.code);
 *             console.error('Original Error:', error.originalError);
 *             console.error('Details:', error.details);
 *         }
 *     } finally {
 *         await client.shutdown();
 *         console.log('\n--- The Jester\'s show concludes! ---');
 *     }
 * }
 *
 * main();
 */
```

### The Jester's Revelations: The Grand Unveiling of Benefits – A Standing Ovation!

"But why, you might ask with a twinkle in your eye and a coffee stain on your keyboard, endure such magnificent complexity? Why, oh why, invest in this grand AI Provider State Nexus when a few `fetch` calls and `if-else` statements seemed to suffice?"

Because, dear friends, this complexity is merely the elaborate cloak for *simplicity*! For *stability*! For *scalability*! For the pure, unadulterated *joy* of never again fearing the chaotic dance of AI state! What we have crafted is not just code; it's a declaration of independence from digital drudgery!

Herein lie the bountiful blessings bestowed upon those who embrace the APSN:

1.  **Unified Command: The Single Scepter of Control!**
    *   No more wrestling with disparate APIs! A single, consistent interface for *all* your AI providers. Speak to OpenAI, Anthropic, or your custom local wizard with the same elegant incantation. Your codebase becomes a harmonious chorus, not a cacophony of individual cries for attention.

2.  **Resilience Redefined: The Digital Fortress That Never Crumbles!**
    *   Our system is built like a jester's spirit: unwavering! With built-in retry strategies, intelligent exponential backoff, and robust error handling, your application will weather the fiercest API storms. No more crashing because a remote server decided to take a tea break. The APSN ensures continuity, like a joke that always lands, eventually.

3.  **Cost Clarity: The Royal Accountant's Dream!**
    *   Those seemingly innocuous API calls can spiral into a dragon's hoard of expenses. Our integrated token and cost estimation tools offer unprecedented transparency, preventing budget surprises faster than a jester can dodge a rotten tomato. Know your costs before they become a royal decree of financial pain!

4.  **Contextual Cohesion: Never Lose Your AI's Train of Thought (or Joke)!**
    *   Maintaining conversational context across multiple turns and sessions is paramount. Our Context Manager ensures your AI remembers previous interactions, making conversations flow naturally and intelligently. No more AI suffering from digital amnesia mid-dialogue!

5.  **Extensibility Extravaganza: The Ever-Expanding Digital Carnival!**
    *   The world of AI is ever-evolving. Need to integrate a new provider next week? Add a custom middleware for sentiment analysis? Our modular architecture, complete with a powerful plugin system, welcomes new functionalities with open arms and a celebratory digital fanfare. Your platform will adapt faster than a jester changes hats!

6.  **Observability Oasis: The All-Seeing Eye of the Jester!**
    *   Detailed logging, comprehensive metrics, and meticulous tracing transform abstract operations into transparent insights. Pinpoint issues, understand performance bottlenecks, and marvel at the efficiency of your AI interactions. You'll know more about your AI than it knows about itself!

7.  **Developer Delight: The Sweet Nectar of Coding Joy!**
    *   Less boilerplate, fewer integration headaches, more time for innovation and creating truly intelligent features. Free your developers from the mundane and elevate them to the realm of true AI artistry. Happy developers make for happier code, and happier code makes for a healthier kingdom!

No longer will you be a mere mortal wrestling with digital leviathans; you shall be the *ringmaster* of your AI circus! The *maestro* of your model orchestra! The *jester* who cleverly outsmarts the capricious nature of the digital realm, transforming potential chaos into a symphony of controlled intelligence!

### A Toast to the Future: The AI Renaissance Begins!

So, as the digital sun sets on the age of haphazard AI integration and rises on the dawn of coordinated intelligence, let us raise our metaphorical mugs of artisanal kombucha (or whatever potent elixir fuels your coding endeavors)! Let the echoes of our triumph reverberate through the silicon valleys and digital plains!

Embrace the AI Provider State Nexus! For in its elegant design lies not just code, but a promise: the promise of sane, scalable, and supremely powerful AI applications. It's a system forged in the fires of necessity, polished with the wit of a jester, and delivered with the expertise of a seasoned architect.

Go forth, my fellow pioneers! Build, innovate, and let your digital genies serve you with unwavering loyalty and unparalleled efficiency, all thanks to the humble jester's (and a few thousand lines of code's) guiding light! May your deployments be seamless, your costs predictable, and your AI always ready with a clever retort! Huzzah for the future of AI! Huzzah for the APSN!

---

### The Jester's Quick Scroll (Social Media Post)

Hark! Sir Bytes-a-Lot brings tidings of a digital revolution! Tired of your AI's state running amok like a headless chicken at a compiler convention? Fear not, for the 'AI Provider State Nexus' has arrived! I've poured my jester's wit (and thousands of lines of TypeScript) into crafting the ultimate, humorous, and expert guide to taming your digital genies.

Dive into my latest LinkedIn article where chaos meets code, and find the fully implemented, extensible, and hilarious solution to multi-AI state management! It's not just code; it's a philosophy, a grand orchestration to transform your AI integrations from a juggling act into a finely tuned, laughter-inducing machine. Prepare for unparalleled clarity, resilience, and developer joy! Your AI architecture will never be the same. Huzzah!

---

### The Royal Seal of Engagement (Hashtags)

#AI #MachineLearning #GenerativeAI #TypeScript #SoftwareArchitecture #StateManagement #DeveloperLife #TechHumor #Coding #JavaScript #Engineering #AIStrategy #CloudComputing #OpenAI #Anthropic #DevOps #Scalability #Resilience #TechTrends #Innovation #Frontend #Backend #FullStack #AIaaS #AIIntegration #Productivity #DigitalTransformation #DeepLearning #CodingJokes #TechTalk #FutureofAI #SoftwareDevelopment #CareerGrowth #Learning #JesterCode #HilariousTech #CodeMagic #AIChaosTamed #JestersInsights #TechLeadership #APINews #CloudNative #SystemDesign #CodeReview #AIProviders #ChatGPT #Claude3 #TechSkills #EnterpriseAI #InnovationEcosystem