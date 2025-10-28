/**
 * @file This file contains the AiOrchestrationService, the core business logic layer for the AI Gateway.
 * It receives standardized AI requests from the presentation layer (e.g., controllers),
 * selects the appropriate AI provider strategy using a factory, and delegates the actual API communication.
 * This service is responsible for orchestrating all AI-related use cases.
 * @module business/services/AiOrchestrationService
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '../../core/constants/types';
import { IAiOrchestrationService } from '../../core/services/IAiOrchestrationService';
import { ICompletionStrategy } from '../../core/services/ICompletionStrategy';
import { ICompletionStrategyFactory } from '../../core/services/ICompletionStrategyFactory';
import { ILogger } from '../../core/services/ILogger';
import { AiRequest, AiResponse, AiStreamChunk, CustomFeatureMetadata, StructuredPrSummary, SemanticColorTheme, SecurityVulnerability, CodeSmell } from '../../core/models/a-la-carte-gcp-sa-models';
import { InvalidRequestError } from '../../core/errors/InvalidRequestError';

/**
 * @class AiOrchestrationService
 * @description Orchestrates AI requests by selecting the appropriate provider strategy and delegating execution.
 * This service is the main entry point for all AI-related business logic within the microservice.
 * @implements {IAiOrchestrationService}
 */
@injectable()
export class AiOrchestrationService implements IAiOrchestrationService {
  private readonly logger: ILogger;
  private readonly strategyFactory: ICompletionStrategyFactory;

  /**
   * @constructor
   * @param {ILogger} logger - An instance of a logger service, injected by the DI container.
   * @param {ICompletionStrategyFactory} strategyFactory - A factory to create or retrieve AI provider strategies, injected by the DI container.
   * @security This service does not handle API keys directly. Key management is delegated to the underlying strategies and adapters, which should retrieve them from a secure configuration source.
   * @performance Initializes dependencies. The factory is a singleton, so its creation is a one-time cost.
   */
  constructor(
    @inject(TYPES.ILogger) logger: ILogger,
    @inject(TYPES.ICompletionStrategyFactory) strategyFactory: ICompletionStrategyFactory
  ) {
    this.logger = logger;
    this.strategyFactory = strategyFactory;
    this.logger.info('AiOrchestrationService initialized. Ready to orchestrate AI requests.');
  }

  /**
   * @method _getStrategy
   * @description Internal helper to retrieve the correct AI provider strategy based on the provider ID in the request.
   * @param {string} providerId - The unique identifier for the AI provider (e.g., 'gemini', 'openai').
   * @returns {ICompletionStrategy} The appropriate AI provider strategy instance.
   * @throws {InvalidRequestError} If the provider ID is missing from the request or not recognized by the factory.
   * @private
   */
  private _getStrategy(providerId: string): ICompletionStrategy {
    if (!providerId) {
      const error = new InvalidRequestError('Provider ID is required in the AI request.');
      this.logger.error(error.message, { service: 'AiOrchestrationService' });
      throw error;
    }
    try {
      return this.strategyFactory.getStrategy(providerId);
    } catch (error) {
      this.logger.error(`Failed to get strategy for provider: ${providerId}`, { error });
      throw new InvalidRequestError(`AI provider '${providerId}' is not supported or configured.`);
    }
  }

  /**
   * @method _handleStreamError
   * @description Handles errors that occur during a streaming operation, logs them, and yields a standardized error chunk.
   * @param {Error} error - The error that was encountered during the stream.
   * @param {AiRequest} request - The original request payload, for logging context.
   * @yields {AiStreamChunk} An error chunk to inform the client of the failure.
   * @private
   */
  private async *_handleStreamError(error: Error, request: AiRequest): AsyncGenerator<AiStreamChunk> {
    this.logger.error('Error during AI streaming operation.', { error, request });
    yield {
      content: `Error: ${error.message}`,
      isFinal: true,
      metadata: { isError: true, errorCode: (error as any).code || 'STREAM_ERROR' },
    };
  }

  /**
   * @inheritdoc
   */
  public async generateContent(request: AiRequest): Promise<AiResponse> {
    this.logger.info('Orchestrating AI content generation.', { model: request.model, providerId: request.providerId });
    const strategy = this._getStrategy(request.providerId);
    return strategy.generateContent(request);
  }

  /**
   * @inheritdoc
   */
  public async *streamContent(request: AiRequest): AsyncGenerator<AiStreamChunk> {
    this.logger.info('Orchestrating AI streaming content generation.', { model: request.model, providerId: request.providerId });
    try {
      const strategy = this._getStrategy(request.providerId);
      yield* strategy.streamContent(request);
    } catch (error: any) {
      yield* this._handleStreamError(error, request);
    }
  }

  /**
   * @inheritdoc
   */
  public async generateJson<T>(request: AiRequest): Promise<T> {
    this.logger.info('Orchestrating AI JSON generation.', { model: request.model, providerId: request.providerId });
    if (!request.responseSchema) {
      throw new InvalidRequestError('A response schema is required for JSON generation.');
    }
    const strategy = this._getStrategy(request.providerId);
    return strategy.generateJson<T>(request);
  }

  /**
   * @inheritdoc
   */
  public async generateAppFeatureComponent(request: AiRequest): Promise<Omit<CustomFeatureMetadata, 'id'>> {
    this.logger.info('Orchestrating AI app feature component generation.', { providerId: request.providerId });

    const systemInstruction = `You are an expert software developer creating a new, self-contained React functional component. The component must be written in TypeScript, use Tailwind CSS for styling, and be defined as a single string. It must not contain any import statements. All necessary React logic should be inline (e.g., 'React.useState'). Respond with only a JSON object matching the provided schema.`;
    const validIcons = "CommandCenterIcon, CodeExplainerIcon, FeatureBuilderIcon, CodeMigratorIcon, ThemeDesignerIcon, SnippetVaultIcon, UnitTestGeneratorIcon, CommitGeneratorIcon, GitLogAnalyzerIcon, ConcurrencyAnalyzerIcon, RegexSandboxIcon, PromptCraftPadIcon, CodeFormatterIcon, JsonTreeIcon, CssGridEditorIcon, SchemaDesignerIcon, PwaManifestEditorIcon, MarkdownSlidesIcon, ScreenshotToComponentIcon, SvgPathEditorIcon, StyleTransferIcon, CodingChallengeIcon, CodeReviewBotIcon, ChangelogGeneratorIcon, CronJobBuilderIcon, AsyncCallTreeIcon, AudioToCodeIcon, CodeDiffGhostIcon, CodeSpellCheckerIcon, ColorPaletteGeneratorIcon, LogicFlowBuilderIcon, MetaTagEditorIcon, NetworkVisualizerIcon, ResponsiveTesterIcon, SassCompilerIcon, ImageGeneratorIcon, XbrlConverterIcon, DigitalWhiteboardIcon, TypographyLabIcon, AiPullRequestAssistantIcon, ProjectExplorerIcon, ServerStackIcon, DocumentTextIcon, ChartBarIcon, EyeIcon, PaperAirplaneIcon, CloudIcon, ShieldCheckIcon, CpuChipIcon, SparklesIcon, MailIcon, BugAntIcon, MagnifyingGlassIcon, RectangleGroupIcon, GcpIcon";

    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'A short, descriptive name for the feature.' },
        description: { type: 'string', description: 'A one-sentence description of what the feature does.' },
        icon: { type: 'string', description: `A valid icon name from this list: ${validIcons}` },
        code: { type: 'string', description: "The full React component code as a single string. It must start with '() => {' and be a valid React functional component body. Do not include imports." },
      },
      required: ['name', 'description', 'icon', 'code'],
    };

    const fullPrompt = `Based on the user request, generate a new feature component.\n\nUser Request: "${request.prompt}"\n\nValid Icon Names: ${validIcons}.`;

    const jsonRequest: AiRequest = {
      ...request,
      prompt: fullPrompt,
      systemInstruction,
      responseSchema: schema,
    };

    return this.generateJson<Omit<CustomFeatureMetadata, 'id'>>(jsonRequest);
  }

  /**
   * @inheritdoc
   */
  public async generatePrSummary(request: AiRequest): Promise<StructuredPrSummary> {
    this.logger.info('Orchestrating AI PR summary generation.', { providerId: request.providerId });
    const systemInstruction = 'You are an expert programmer who writes excellent PR summaries based on a code diff. Respond in the requested JSON format.';
    const schema = {
        type: 'object',
        properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            changes: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'summary', 'changes'],
    };

    const jsonRequest: AiRequest = { ...request, systemInstruction, responseSchema: schema };
    return this.generateJson<StructuredPrSummary>(jsonRequest);
  }

  /**
   * @inheritdoc
   */
  public async generateTheme(request: AiRequest): Promise<SemanticColorTheme> {
    this.logger.info('Orchestrating AI theme generation.', { providerId: request.providerId });
    const systemInstruction = `You are a world-class UI/UX designer specializing in color theory and accessibility. Generate a complete, semantically named color theme. You must calculate WCAG 2.1 contrast ratios and provide scores.`;
    const colorObjectSchema = {
        type: 'object',
        properties: {
            value: { type: 'string', description: 'The hex code of the color, e.g., #RRGGBB' },
            name: { type: 'string', description: 'A creative, evocative name for the color.' },
        },
        required: ['value', 'name'],
    };
    const accessibilityCheckSchema = {
        type: 'object',
        properties: {
            ratio: { type: 'number', description: 'The calculated contrast ratio.' },
            score: { type: 'string', enum: ['AAA', 'AA', 'Fail'], description: 'The WCAG 2.1 accessibility score.' },
        },
        required: ['ratio', 'score'],
    };
    const schema = {
        type: 'object',
        properties: {
            mode: { type: 'string', enum: ['light', 'dark'] },
            palette: { type: 'object', properties: { primary: colorObjectSchema, secondary: colorObjectSchema, accent: colorObjectSchema, neutral: colorObjectSchema }, required: ['primary', 'secondary', 'accent', 'neutral'] },
            theme: { type: 'object', properties: { background: colorObjectSchema, surface: colorObjectSchema, textPrimary: colorObjectSchema, textSecondary: colorObjectSchema, textOnPrimary: colorObjectSchema, border: colorObjectSchema }, required: ['background', 'surface', 'textPrimary', 'textSecondary', 'textOnPrimary', 'border'] },
            accessibility: { type: 'object', properties: { primaryOnSurface: accessibilityCheckSchema, textPrimaryOnSurface: accessibilityCheckSchema, textSecondaryOnSurface: accessibilityCheckSchema, textOnPrimaryOnPrimary: accessibilityCheckSchema }, required: ['primaryOnSurface', 'textPrimaryOnSurface', 'textSecondaryOnSurface', 'textOnPrimaryOnPrimary'] },
        },
        required: ['mode', 'palette', 'theme', 'accessibility'],
    };
    const jsonRequest: AiRequest = { ...request, systemInstruction, responseSchema: schema };
    return this.generateJson<SemanticColorTheme>(jsonRequest);
  }

  /**
   * @inheritdoc
   */
  public async analyzeVulnerabilities(request: AiRequest): Promise<SecurityVulnerability[]> {
    this.logger.info('Orchestrating AI security vulnerability scan.', { providerId: request.providerId });
    const systemInstruction = 'You are an expert security engineer. Analyze the code for vulnerabilities and provide a structured response.';
    const schema = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                vulnerability: { type: 'string' },
                severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
                description: { type: 'string' },
                mitigation: { type: 'string' },
                exploitSuggestion: { type: 'string', description: 'A cURL command, code snippet, or description of how to exploit the vulnerability.' },
            },
            required: ['vulnerability', 'severity', 'description', 'mitigation'],
        },
    };
    const jsonRequest: AiRequest = { ...request, systemInstruction, responseSchema: schema };
    return this.generateJson<SecurityVulnerability[]>(jsonRequest);
  }

  /**
   * @inheritdoc
   */
  public async detectCodeSmells(request: AiRequest): Promise<CodeSmell[]> {
    this.logger.info('Orchestrating AI code smell detection.', { providerId: request.providerId });
    const systemInstruction = 'You are an expert software engineer who identifies code smells like long methods, large classes, and feature envy.';
    const schema = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                smell: { type: 'string' },
                line: { type: 'number' },
                explanation: { type: 'string' },
            },
            required: ['smell', 'line', 'explanation'],
        },
    };
    const jsonRequest: AiRequest = { ...request, systemInstruction, responseSchema: schema };
    return this.generateJson<CodeSmell[]>(jsonRequest);
  }
}
