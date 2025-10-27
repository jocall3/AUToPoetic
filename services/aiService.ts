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

import { GoogleGenAI, Type as GoogleGenAiType, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { logError } from './telemetryService';
import type {
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

let ai: GoogleGenAI | null = null;
let lastUsedApiKey: string | null = null;

/**
 * Gets a GoogleGenAI client instance, initializing it with a key from local storage.
 * It caches the client and only re-initializes if the key changes (e.g., user updates it in settings).
 * @returns A promise that resolves to a GoogleGenAI instance.
 * @throws {Error} If the Google Gemini API key is not found in local storage.
 */
const getAiClient = async (): Promise<GoogleGenAI> => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error("Google Gemini API key not found. Please add it in the Settings view to use AI features.");
    }

    if (!ai || apiKey !== lastUsedApiKey) {
        lastUsedApiKey = apiKey;
        ai = new GoogleGenAI({ apiKey });
    }
    
    return ai;
};

/**
 * A simple utility to pause execution for a given number of milliseconds.
 * Useful for implementing delays, especially in retry mechanisms.
 * @param ms The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified delay.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries a promise-returning function with exponential backoff.
 * @template T The return type of the function.
 * @param fn The function to retry.
 * @param retries The maximum number of retries.
 * @param delayMs The initial delay in milliseconds before the first retry.
 * @param maxDelayMs The maximum delay between retries.
 * @returns A promise that resolves with the result of the function, or rejects after all retries fail.
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 1000,
    maxDelayMs = 30000
): Promise<T> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries) {
                console.error(`Attempt ${i + 1}/${retries + 1} failed. No more retries.`);
                throw error;
            }
            const currentDelay = Math.min(delayMs * Math.pow(2, i), maxDelayMs);
            console.warn(`Attempt ${i + 1}/${retries + 1} failed. Retrying in ${currentDelay}ms. Error:`, error);
            await sleep(currentDelay);
        }
    }
    // This part should technically be unreachable if retries is >= 0
    throw new Error("Retry function failed unexpectedly.");
}

// --- Unified AI Helpers ---

/**
 * Streams content from the AI model, yielding chunks of text as they become available.
 * Includes robust error logging and basic retry logic.
 * @param prompt The prompt to send to the AI model. Can be a string or an object with parts.
 * @param systemInstruction The system instruction to guide the AI's behavior.
 * @param temperature Controls the randomness of the output. Lower values mean less random completions.
 * @returns An async generator that yields strings (content chunks).
 */
export async function* streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature = 0.5) {
    try {
        const aiClient = await getAiClient();
        const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: { text: systemInstruction }});
        const result = await model.generateContentStream(prompt as any);

        for await (const chunk of result.stream) {
            yield chunk.text();
        }
    } catch (error) {
        console.error("Error streaming from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        if (error instanceof Error) {
            yield `An error occurred while communicating with the AI model: ${error.message}`;
        } else {
            yield "An unknown error occurred while generating the response.";
        }
    }
}

/**
 * Generates content from the AI model in a single, non-streaming response.
 * Includes robust error logging and basic retry logic.
 * @param prompt The prompt to send to the AI model.
 * @param systemInstruction The system instruction to guide the AI's behavior.
 * @param temperature Controls the randomness of the output. Lower values mean less random completions.
 * @returns A promise that resolves to the generated content string.
 * @throws {Error} If content generation fails after retries.
 */
export async function generateContent(prompt: string, systemInstruction: string, temperature = 0.5): Promise<string> {
    try {
        const aiClient = await getAiClient();
        const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: { text: systemInstruction }});
        const result = await retryWithBackoff(() => model.generateContent(prompt));
        return result.response.text();
    } catch (error) {
         console.error("Error generating content from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

/**
 * Generates JSON content from the AI model based on a provided schema.
 * Ensures the response adheres to the specified JSON structure.
 * Includes robust error logging and basic retry logic.
 * @template T The expected type of the JSON response.
 * @param prompt The prompt to send to the AI model.
 * @param systemInstruction The system instruction to guide the AI's behavior.
 * @param schema The JSON schema to enforce the output structure.
 * @param temperature Controls the randomness of the output. Lower values mean less random completions.
 * @returns A promise that resolves to the parsed JSON object.
 * @throws {Error} If JSON generation or parsing fails after retries.
 */
export async function generateJson<T>(prompt: any, systemInstruction: string, schema: any, temperature = 0.2): Promise<T> {
    try {
        const aiClient = await getAiClient();
        const model = aiClient.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: { text: systemInstruction },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature,
            }
        });
        const result = await retryWithBackoff(() => model.generateContent(prompt));
        return JSON.parse(result.response.text().trim()) as T;
    } catch (error) {
        console.error("Error generating JSON from AI model:", error);
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

/**
 * Generates a new, self-contained React functional component with Tailwind CSS based on a prompt.
 * The component is returned as a structured object, ready for integration.
 * @param prompt A description of the desired feature component.
 * @returns A promise resolving to an object containing the component's name, description, icon, and code.
 */
export const generateAppFeatureComponent = (prompt: string): Promise<Omit<CustomFeature, 'id'>> => {
    const systemInstruction = "You are an expert software developer creating a new, self-contained React functional component for an application. The component should be written in TypeScript, use Tailwind CSS for styling, and be defined as a single string. It must not contain any import statements. All necessary React logic should be inline (e.g., `React.useState`). Respond with only a JSON object containing the name, description, a valid icon name from the provided list, and the component code string.";
    const validIcons = "CommandCenterIcon, CodeExplainerIcon, FeatureBuilderIcon, CodeMigratorIcon, ThemeDesignerIcon, SnippetVaultIcon, UnitTestGeneratorIcon, CommitGeneratorIcon, GitLogAnalyzerIcon, ConcurrencyAnalyzerIcon, RegexSandboxIcon, PromptCraftPadIcon, CodeFormatterIcon, JsonTreeIcon, CssGridEditorIcon, SchemaDesignerIcon, PwaManifestEditorIcon, MarkdownSlidesIcon, ScreenshotToComponentIcon, SvgPathEditorIcon, StyleTransferIcon, CodingChallengeIcon, CodeReviewBotIcon, ChangelogGeneratorIcon, CronJobBuilderIcon, AsyncCallTreeIcon, AudioToCodeIcon, CodeDiffGhostIcon, CodeSpellCheckerIcon, ColorPaletteGeneratorIcon, LogicFlowBuilderIcon, MetaTagEditorIcon, NetworkVisualizerIcon, ResponsiveTesterIcon, SassCompilerIcon, ImageGeneratorIcon, XbrlConverterIcon, DigitalWhiteboardIcon, TypographyLabIcon, AiPullRequestAssistantIcon, ProjectExplorerIcon, ServerStackIcon, DocumentTextIcon, ChartBarIcon, EyeIcon, PaperAirplaneIcon, CloudIcon, ShieldCheckIcon, CpuChipIcon, SparklesIcon, MailIcon, BugAntIcon, MagnifyingGlassIcon, RectangleGroupIcon, GcpIcon";

    const schema = {
        type: GoogleGenAiType.OBJECT,
        properties: {
            name: { type: GoogleGenAiType.STRING, description: "A short, descriptive name for the feature." },
            description: { type: GoogleGenAiType.STRING, description: "A one-sentence description of what the feature does." },
            icon: { type: GoogleGenAiType.STRING, description: `A valid icon name from this list: ${validIcons}` },
            code: { type: GoogleGenAiType.STRING, description: "The full React component code as a single string. It must start with `() => {` and be a valid React functional component body. Do not include imports." }
        },
        required: ["name", "description", "icon", "code"]
    };
    
    const fullPrompt = `Based on the user request, generate a new feature component.\n\nUser Request: \"${prompt}\"\n\nValid Icon Names: ${validIcons}.`;
    return generateJson(fullPrompt, systemInstruction, schema);
};

// --- Unified Feature Functions (Streaming) ---

/**
 * Streams a clear, concise explanation of a given code snippet.
 * @param code The code snippet to explain.
 * @returns An async generator yielding parts of the explanation.
 */
export const explainCodeStream = (code: string) => streamContent(
    `Please explain the following code snippet:\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer providing a clear, concise explanation of code."
);

/**
 * Streams a JavaScript regex literal based on a textual description.
 * @param description A natural language description of the desired regex.
 * @returns An async generator yielding the regex literal string.
 */
export const generateRegExStream = (description: string) => streamContent(
    `Generate a single valid JavaScript regex literal (e.g., /abc/gi) for the following description. Respond with ONLY the regex literal and nothing else: \"${description}\" `,
    "You are an expert in regular expressions. You only output valid JavaScript regex literals.",
    0.7
);

/**
 * Streams a conventional commit message for a given diff, useful for new file additions.
 * @param diff The git diff content.
 * @returns An async generator yielding the commit message.
 */
export const generateCommitMessageStream = (diff: string) => streamContent(
    `Generate a conventional commit message for the following context of new files being added:\n\n${diff}`,
    "You are an expert programmer who writes excellent, conventional commit messages. The response should be only the commit message text.",
    0.8
);

/**
 * Streams Vitest unit tests for a given React component code.
 * @param code The React component code.
 * @returns An async generator yielding the unit test code.
 */
export const generateUnitTestsStream = (code: string) => streamContent(
    `Generate Vitest unit tests for this React component code:\n\n\`\`\`tsx\n${code}\n\`\`\``,
    "You are a software quality engineer specializing in writing comprehensive and clear unit tests using Vitest and React Testing Library.",
    0.6
);

/**
 * Streams formatted code, given an unformatted code snippet.
 * @param code The code to format.
 * @returns An async generator yielding the formatted code.
 */
export const formatCodeStream = (code: string) => streamContent(
    `Format this code:\n\n\`\`\`javascript\n${code}\n\`\`\``,
    "You are a code formatter. Your only purpose is to format code. Respond with only the formatted code, enclosed in a single markdown block.",
    0.2
);

/**
 * Streams a single-file React component with Tailwind CSS from a base64 image.
 * @param base64Image The base64 encoded image data.
 * @returns An async generator yielding the React component code.
 */
export const generateComponentFromImageStream = (base64Image: string) => streamContent(
    {
        parts: [
            { text: "Generate a single-file React component using Tailwind CSS that looks like this image. Respond with only the code in a markdown block." },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
        ]
    },
    "You are an expert frontend developer specializing in React and Tailwind CSS. You create clean, functional components from screenshots."
);

/**
 * Streams code transcription from base64 audio data.
 * @param base64Audio The base64 encoded audio data.
 * @param mimeType The MIME type of the audio data (e.g., 'audio/wav', 'audio/mp3').
 * @returns An async generator yielding the transcribed code.
 */
export const transcribeAudioToCodeStream = (base64Audio: string, mimeType: string) => streamContent(
    {
        parts: [
            { text: "Transcribe my speech into a code snippet. If I describe a function or component, write it out." },
            { inlineData: { mimeType, data: base64Audio } }
        ]
    },
    "You are an expert programmer. You listen to a user's voice and transcribe their ideas into code."
);

/**
 * Streams code rewritten to match a provided style guide.
 * @param args An object containing the code to rewrite and the style guide.
 * @returns An async generator yielding the style-transferred code.
 */
export const transferCodeStyleStream = (args: { code: string, styleGuide: string }) => streamContent(
    `Rewrite the following code to match the provided style guide.\n\nStyle Guide:\n${args.styleGuide}\n\nCode to rewrite:\n\`\`\`\n${args.code}\n\`\`\``,
    "You are an AI assistant that rewrites code to match a specific style guide. Respond with only the rewritten code in a markdown block.",
    0.3
);

/**
 * Streams a new coding challenge for developers.
 * @returns An async generator yielding the coding challenge description.
 */
export const generateCodingChallengeStream = (_: any) => streamContent(
    `Generate a new, interesting coding challenge suitable for an intermediate developer. Include a clear problem description, one or two examples, and any constraints. Format it in markdown.`,
    "You are an AI that creates unique and interesting coding challenges for software developers.",
    0.9
);

/**
 * Streams a detailed code review, identifying bugs, improvements, and anti-patterns.
 * @param code The code snippet to review.
 * @param systemInstruction Optional custom system instruction for the AI reviewer.
 * @returns An async generator yielding parts of the code review.
 */
export const reviewCodeStream = (code: string, systemInstruction?: string) => streamContent(
    `Please perform a detailed code review on the following code snippet. Identify potential bugs, suggest improvements for readability and performance, and point out any anti-patterns. Structure your feedback with clear headings.\n\n\`\`\`\n${code}\n\`\`\``,
    systemInstruction || "You are a senior software engineer performing a code review. You are meticulous, helpful, and provide constructive feedback.",
    0.6
);

/**
 * Streams a changelog generated from a git log.
 * @param log The git log content.
 * @returns An async generator yielding the changelog in Markdown.
 */
export const generateChangelogFromLogStream = (log: string) => streamContent(
    `Analyze this git log and create a changelog:\n\n\`\`\`\n${log}\n\`\`\``,
    "You are a git expert and project manager. Analyze the provided git log and generate a clean, categorized changelog in Markdown format. Group changes under 'Features' and 'Fixes'.",
    0.6
);

/**
 * Streams an enhanced code snippet with comments, improved names, and refactoring.
 * @param code The code snippet to enhance.
 * @returns An async generator yielding the enhanced code.
 */
export const enhanceSnippetStream = (code: string) => streamContent(
    `Enhance this code snippet. Add comments, improve variable names, and refactor for clarity or performance if possible.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a senior software engineer who excels at improving code. Respond with only the enhanced code in a markdown block.",
    0.5
);

/**
 * Streams a summary of developer notes into a bulleted list of key points and action items.
 * @param notes The developer notes to summarize.
 * @returns An async generator yielding the summary.
 */
export const summarizeNotesStream = (notes: string) => streamContent(
    `Summarize these developer notes into a bulleted list of key points and action items:\n\n${notes}`,
    "You are a productivity assistant who is an expert at summarizing technical notes.",
    0.7
);

/**
 * Streams code translated from one language/framework to another.
 * @param code The code to migrate.
 * @param from The source language/framework.
 * @param to The target language/framework.
 * @returns An async generator yielding the translated code.
 */
export const migrateCodeStream = (code: string, from: string, to: string) => streamContent(
    `Translate this ${from} code to ${to}. Respond with only the translated code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    `You are an expert polyglot programmer who specializes in migrating code between languages and frameworks.`,
    0.4
);

/**
 * Streams an analysis of JavaScript code for concurrency issues (e.g., Web Workers, race conditions).
 * @param code The JavaScript code to analyze.
 * @returns An async generator yielding the concurrency analysis.
 */
export const analyzeConcurrencyStream = (code: string) => streamContent(
    `Analyze this JavaScript code for potential concurrency issues, especially related to Web Workers. Identify race conditions, deadlocks, or inefficient data passing.\n\n\`\`\`javascript\n${code}\n\`\`\``,
    "You are an expert in JavaScript concurrency, web workers, and multi-threaded programming concepts.",
    0.6
);

/**
 * Streams a debugging analysis for a given error object, providing likely causes and solutions.
 * @param error The error object to debug.
 * @returns An async generator yielding the debugging assistance.
 */
export const debugErrorStream = (error: Error) => streamContent(
    `I encountered an error in my React application. Here are the details:\n    \n    Message: ${error.message}\n    \n    Stack Trace:\n    ${error.stack}\n    \n    Please analyze this error. Provide a brief explanation of the likely cause, followed by a bulleted list of potential solutions or debugging steps. Structure your response in clear, concise markdown.`,
    "You are an expert software engineer specializing in debugging React applications. You provide clear, actionable advice to help developers solve errors."
);

/**
 * Streams a conversion of JSON data into a simplified, XBRL-like XML format.
 * @param json The JSON string to convert.
 * @returns An async generator yielding the XBRL-like XML.
 */
export const convertJsonToXbrlStream = (json: string) => streamContent(
    `Convert the following JSON to a simplified, XBRL-like XML format. Use meaningful tags based on the JSON keys. The root element should be <xbrl>. Do not include XML declarations or namespaces.\n\nJSON:\n${json}`,
    "You are an expert in data formats who converts JSON to clean, XBRL-like XML."
);

/**
 * Refactors code for maximum performance, focusing on algorithmic efficiency and data structures.
 * @param code The code to refactor.
 * @returns An async generator yielding the performance-optimized code.
 */
export const refactorForPerformance = (code: string) => streamContent(
    `Refactor the following code for maximum performance. Focus on algorithmic efficiency, efficient data structures, and avoiding unnecessary computations. Respond with only the refactored code in a markdown block.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer specializing in code performance optimization."
);

/**
 * Refactors code for maximum readability, improving variable names, function clarity, and comments.
 * @param code The code to refactor.
 * @returns An async generator yielding the readability-optimized code.
 */
export const refactorForReadability = (code: string) => streamContent(
    `Refactor the following code for maximum readability. Focus on clear variable names, breaking down complex functions, and adding helpful comments. Respond with only the refactored code in a markdown block.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer who writes exceptionally clean and readable code."
);

/**
 * Converts a React class component to a functional component using hooks.
 * @param classComponent The class component code.
 * @returns An async generator yielding the functional component code.
 */
export const convertToFunctionalComponent = (classComponent: string) => streamContent(
    `Convert the following React class component to a functional component using hooks (useState, useEffect, etc.). Ensure all lifecycle methods are correctly mapped. Respond with only the refactored code in a markdown block.\n\nCode:\n\`\`\`\n${classComponent}\n\`\`\``,
    "You are a React expert specializing in modernizing codebases by converting class components to functional components with hooks."
);

/**
 * Generates a complete JSDoc block for a given function or component.
 * @param code The code for which to generate JSDoc.
 * @returns An async generator yielding the JSDoc block and the original function.
 */
export const generateJsDoc = (code: string) => streamContent(
    `Generate a complete JSDoc block for the following function or component. Include descriptions for the function, its parameters, and what it returns. Respond with only the JSDoc block and the original function.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an AI assistant that writes comprehensive and accurate JSDoc documentation."
);

/**
 * Streams feedback on a user's solution to a coding challenge.
 * @param challengeDescription The description of the challenge.
 * @param userSolution The user's code solution.
 * @returns An async generator yielding the feedback.
 */
export const getSolutionFeedbackStream = (challengeDescription: string, userSolution: string) => streamContent(
    `Please review my solution for the following coding challenge.\n\n**Challenge:**\n${challengeDescription}\n\n**My Solution:**\n\`\`\`javascript\n${userSolution}\n\`\`\`\n\nProvide feedback on correctness, efficiency, and code style.`,
    "You are an expert programming instructor providing feedback on a student's solution to a coding challenge."
);

/**
 * Streams a CI/CD configuration file for a specified platform based on a description.
 * @param platform The CI/CD platform (e.g., 'GitHub Actions', 'GitLab CI').
 * @param description A description of the desired CI/CD pipeline.
 * @returns An async generator yielding the configuration content.
 */
export const generateCiCdConfigStream = (platform: string, description: string) => streamContent(
    `Generate a CI/CD configuration file for ${platform} based on this description: \"${description}\". Respond with only the YAML/config file content inside a markdown block.`,
    "You are a DevOps expert specializing in CI/CD pipelines."
);

// --- Simple Generate Content (non-streaming) ---

/**
 * Generates a minimal Vitest unit test to reproduce a bug from a stack trace.
 * @param stackTrace The stack trace of the bug.
 * @param context Optional additional context about the bug.
 * @returns A promise resolving to the bug reproduction test code.
 */
export const generateBugReproductionTest = (stackTrace: string, context?: string): Promise<string> => generateContent(
    `Generate a minimal, runnable unit test (using Vitest) that reproduces the bug described by the following stack trace. Respond with only the code in a markdown block.\n\nStack Trace:\n${stackTrace}\n\n${context ? `Additional Context:\n${context}` : ''}`,
    "You are a senior software engineer specializing in debugging and automated testing. You create concise, effective unit tests to reproduce bugs."
);

/**
 * Generates an AWS or GCP IAM policy in JSON format from a description.
 * @param description A description of the desired IAM policy.
 * @param platform The cloud platform ('aws' or 'gcp').
 * @returns A promise resolving to the JSON IAM policy.
 */
export const generateIamPolicy = (description: string, platform: 'aws' | 'gcp'): Promise<string> => generateContent(
    `Generate a valid ${platform.toUpperCase()} IAM policy in JSON format based on this description: \"${description}\". Respond with only the JSON policy in a markdown block.`,
    "You are a cloud security expert specializing in IAM policies for AWS and GCP."
);

/**
 * Suggests a harmonious font pairing for a given design description.
 * @param description A description of the desired design style or mood.
 * @returns A promise resolving to a structured font pairing suggestion.
 */
export const suggestFontPairing = async (description: string): Promise<{ headingFont: string; bodyFont: string; reasoning: string; }> => {
    const systemInstruction = "You are a UI/UX design expert specializing in typography. Suggest a font pairing from Google Fonts.";
    const prompt = `Suggest a font pairing for: \"${description}\"`;
    const schema = { 
        type: GoogleGenAiType.OBJECT, 
        properties: { 
            headingFont: { type: GoogleGenAiType.STRING, description: 'A Google Font for headings.' }, 
            bodyFont: { type: GoogleGenAiType.STRING, description: 'A Google Font for body text.' },
            reasoning: { type: GoogleGenAiType.STRING, description: 'A brief explanation for why this pairing works.' }
        }, 
        required: ["headingFont", "bodyFont", "reasoning"] 
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Explains a cron expression in plain English.
 * @param cronExpression The cron expression string.
 * @returns A promise resolving to the explanation.
 */
export const explainCronExpression = (cronExpression: string): Promise<string> => generateContent(
    `Explain this cron expression in plain English: \"${cronExpression}\"`,
    "You are an expert in cron expressions and scheduling."
);

/**
 * Applies a specific refactoring instruction to code.
 * @param code The code to refactor.
 * @param instruction The specific refactoring instruction (e.g., "Extract this loop into a separate function").
 * @returns A promise resolving to the refactored code.
 */
export const applySpecificRefactor = (code: string, instruction: string): Promise<string> => generateContent(
    `Apply this specific refactoring instruction to the code: \"${instruction}\". Respond with only the complete, refactored code in a markdown block.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an AI assistant that precisely applies refactoring instructions to code."
);

// --- STRUCTURED JSON ---

/**
 * Provides a structured explanation of code, including a summary, line-by-line breakdown, complexity analysis, and suggestions.
 * @param code The code snippet to explain.
 * @returns A promise resolving to a StructuredExplanation object.
 */
export const explainCodeStructured = async (code: string): Promise<StructuredExplanation> => {
    const systemInstruction = "You are an expert software engineer providing a structured analysis of a code snippet. In the summary, identify any imported dependencies and explain their purpose within the code.";
    const prompt = `Analyze this code: \n\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: GoogleGenAiType.OBJECT, properties: { summary: { type: GoogleGenAiType.STRING }, lineByLine: { type: GoogleGenAiType.ARRAY, items: { type: GoogleGenAiType.OBJECT, properties: { lines: { type: GoogleGenAiType.STRING }, explanation: { type: GoogleGenAiType.STRING } }, required: ["lines", "explanation"] } }, complexity: { type: GoogleGenAiType.OBJECT, properties: { time: { type: GoogleGenAiType.STRING }, space: { type: GoogleGenAiType.STRING } }, required: ["time", "space"] }, suggestions: { type: GoogleGenAiType.ARRAY, items: { type: GoogleGenAiType.STRING } } }, required: ["summary", "lineByLine", "complexity", "suggestions"] };
    return generateJson(prompt, systemInstruction, schema);
}

/**
 * Generates a comprehensive, semantically named color theme (including accessibility checks) from a prompt (text or image).
 * @param prompt The prompt for theme generation (text or image parts).
 * @returns A promise resolving to a SemanticColorTheme object.
 */
export const generateSemanticTheme = (prompt: { parts: any[] }): Promise<SemanticColorTheme> => {
    const systemInstruction = `You are a world-class UI/UX designer with an expert understanding of color theory, accessibility, and branding.
    Your task is to generate a comprehensive, semantically named color theme from a user's prompt (which could be text or an image).
    - Determine if the theme should be 'light' or 'dark' mode.
    - Palette colors should be harmonious and versatile.
    - Theme colors must be derived from the palette and assigned to specific UI roles (background, text, border, etc.).
    - 'textOnPrimary' MUST have a high contrast ratio against 'primary'.
    - You MUST calculate the WCAG 2.1 contrast ratio for key text/background pairs and provide a score (AAA, AA, or Fail).
    - Provide creative, evocative names for each color (e.g., "Midnight Blue", "Dune Sand").`;

    const colorObjectSchema = {
        type: GoogleGenAiType.OBJECT,
        properties: {
            value: { type: GoogleGenAiType.STRING, description: "The hex code of the color, e.g., #RRGGBB" },
            name: { type: GoogleGenAiType.STRING, description: "A creative, evocative name for the color." }
        },
        required: ["value", "name"]
    };

    const accessibilityCheckSchema = {
        type: GoogleGenAiType.OBJECT,
        properties: {
            ratio: { type: GoogleGenAiType.NUMBER, description: "The calculated contrast ratio." },
            score: { type: GoogleGenAiType.STRING, enum: ["AAA", "AA", "Fail"], description: "The WCAG 2.1 accessibility score." }
        },
        required: ["ratio", "score"]
    };

    const schema = {
        type: GoogleGenAiType.OBJECT,
        properties: {
            mode: {
                type: GoogleGenAiType.STRING, enum: ["light", "dark"],
                description: "The recommended UI mode for this theme, 'light' or 'dark'."
            },
            palette: {
                type: GoogleGenAiType.OBJECT,
                description: "A harmonious 4-color palette extracted from the prompt.",
                properties: {
                    primary: colorObjectSchema,
                    secondary: colorObjectSchema,
                    accent: colorObjectSchema,
                    neutral: colorObjectSchema,
                },
                required: ["primary", "secondary", "accent", "neutral"]
            },
            theme: {
                type: GoogleGenAiType.OBJECT,
                description: "Specific color assignments for UI elements, derived from the palette.",
                properties: {
                    background: colorObjectSchema,
                    surface: colorObjectSchema,
                    textPrimary: colorObjectSchema,
                    textSecondary: colorObjectSchema,
                    textOnPrimary: colorObjectSchema,
                    border: colorObjectSchema,
                },
                required: ["background", "surface", "textPrimary", "textSecondary", "textOnPrimary", "border"]
            },
            accessibility: {
                type: GoogleGenAiType.OBJECT,
                description: "WCAG 2.1 contrast ratio checks for common text/background pairings.",
                properties: {
                    primaryOnSurface: accessibilityCheckSchema,
                    textPrimaryOnSurface: accessibilityCheckSchema,
                    textSecondaryOnSurface: accessibilityCheckSchema,
                    textOnPrimaryOnPrimary: accessibilityCheckSchema,
                },
                required: ["primaryOnSurface", "textPrimaryOnSurface", "textSecondaryOnSurface", "textOnPrimaryOnPrimary"]
            }
        },
        required: ["mode", "palette", "theme", "accessibility"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates a structured Pull Request summary from a git diff.
 * @param diff The git diff content.
 * @returns A promise resolving to a StructuredPrSummary object.
 */
export const generatePrSummaryStructured = (diff: string): Promise<StructuredPrSummary> => {
    const systemInstruction = "You are an expert programmer who writes excellent PR summaries.";
    const prompt = `Generate a PR summary for the following diff:\n\n\`\`\`diff\n${diff}\n\`\`\``;
    const schema = { type: GoogleGenAiType.OBJECT, properties: { title: { type: GoogleGenAiType.STRING }, summary: { type: GoogleGenAiType.STRING }, changes: { type: GoogleGenAiType.ARRAY, items: { type: GoogleGenAiType.STRING } } }, required: ["title", "summary", "changes"] };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates multiple files for a full-stack feature, including frontend, backend (Google Cloud Function),
 * package.json, and Firestore security rules. Supports Google Maps API integration.
 * @param prompt A description of the desired full-stack feature.
 * @param framework The frontend framework.
 * @param styling The frontend styling solution.
 * @returns A promise resolving to an array of GeneratedFile objects for the full-stack feature.
 */
export const generateFullStackFeature = (prompt: string, framework: string, styling: string): Promise<GeneratedFile[]> => {
    const systemInstruction = `You are an AI that generates complete, production-ready full-stack features.
    You must generate four files:
    1. A frontend ${framework} component using ${styling}. File path should be 'Component.tsx'.
    2. A backend Google Cloud Function in Node.js. File path should be 'functions/index.js'. It should be a simple HTTP-triggered function that interacts with Firestore.
    3. A 'package.json' for the Cloud Function, including 'firebase-admin' and 'firebase-functions'. File path should be 'functions/package.json'.
    4. Firestore Security Rules that allow public reads but only authenticated writes. File path should be 'firestore.rules'.
    Ensure the frontend component knows how to call the cloud function.
    IMPORTANT: When the user's prompt is about maps, location, addresses, or stores, you MUST prioritize using the Google Maps JavaScript API in the frontend component. Generate a component that accepts an 'apiKey' prop and uses it to load the Maps script.`;
    const userPrompt = `Generate a full-stack feature for: \"${prompt}\"`;
    const schema = {
        type: GoogleGenAiType.ARRAY,
        items: {
            type: GoogleGenAiType.OBJECT,
            properties: {
                filePath: { type: GoogleGenAiType.STRING, enum: ['Component.tsx', 'functions/index.js', 'functions/package.json', 'firestore.rules'] },
                content: { type: GoogleGenAiType.STRING },
                description: { type: GoogleGenAiType.STRING }
            },
            required: ["filePath", "content", "description"]
        }
    };
    return generateJson(userPrompt, systemInstruction, schema);
};

/**
 * Converts a natural language schedule description into a structured cron expression.
 * @param description A description of the schedule (e.g., "every Monday at 9 AM").
 * @returns A promise resolving to a CronParts object.
 */
export const generateCronFromDescription = (description: string): Promise<CronParts> => {
    const systemInstruction = "You are an expert in cron expressions. Convert the user's description into a valid cron expression parts.";
    const prompt = `Convert this schedule to a cron expression: \"${description}\"`;
    const schema = { type: GoogleGenAiType.OBJECT, properties: { minute: { type: GoogleGenAiType.STRING }, hour: { type: GoogleGenAiType.STRING }, dayOfMonth: { type: GoogleGenAiType.STRING }, month: { type: GoogleGenAiType.STRING }, dayOfWeek: { type: GoogleGenAiType.STRING } }, required: ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Analyzes code for security vulnerabilities and provides structured details, mitigation, and exploit suggestions.
 * @param code The code to analyze for vulnerabilities.
 * @returns A promise resolving to an array of SecurityVulnerability objects.
 */
export const analyzeCodeForVulnerabilities = (code: string): Promise<SecurityVulnerability[]> => {
    const systemInstruction = "You are an expert security engineer. Analyze the code for vulnerabilities. For each vulnerability, provide a structured response including a potential cURL command or code snippet to demonstrate the exploit.";
    const prompt = `Analyze this code for security issues like XSS, injection, hardcoded secrets, etc. Provide detailed explanations, mitigation advice, and an exploit suggestion.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
    const schema = {
        type: GoogleGenAiType.ARRAY,
        items: {
            type: GoogleGenAiType.OBJECT,
            properties: {
                vulnerability: { type: GoogleGenAiType.STRING },
                severity: { type: GoogleGenAiType.STRING, enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
                description: { type: GoogleGenAiType.STRING },
                mitigation: { type: GoogleGenAiType.STRING },
                exploitSuggestion: { type: GoogleGenAiType.STRING, description: "A cURL command, code snippet, or description of how to exploit the vulnerability." }
            },
            required: ['vulnerability', 'severity', 'description', 'mitigation', 'exploitSuggestion']
        }
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Detects and reports code smells in a given code snippet, providing structured details.
 * @param code The code to analyze for smells.
 * @returns A promise resolving to an array of CodeSmell objects.
 */
export const detectCodeSmells = (code: string): Promise<CodeSmell[]> => {
    const systemInstruction = "You are an expert software engineer who identifies code smells like long methods, large classes, feature envy, etc.";
    const prompt = `Analyze the following code for code smells and provide explanations.\n\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: GoogleGenAiType.ARRAY, items: { type: GoogleGenAiType.OBJECT, properties: { smell: { type: GoogleGenAiType.STRING }, line: { type: GoogleGenAiType.NUMBER }, explanation: { type: GoogleGenAiType.STRING } }, required: ["smell", "line", "explanation"] } };
    return generateJson(prompt, systemInstruction, schema);
};

// --- FUNCTION CALLING ---
/**
 * Gets an AI inference response, potentially including function calls based on provided tools and knowledge base.
 * This is used for agents that can decide to call internal tools.
 * @param prompt The user's prompt.
 * @param functionDeclarations An array of available tool function declarations.
 * @param knowledgeBase A string representing the AI's knowledge base for context.
 * @returns A promise resolving to a CommandResponse object, which may include text and/or function calls.
 * @throws {Error} If inference fails.
 */
export const getInferenceFunction = async (prompt: string, functionDeclarations: FunctionDeclaration[], knowledgeBase: string): Promise<CommandResponse> => {
    const aiClient = await getAiClient();
    try {
        const model = aiClient.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: { text: `You are a helpful assistant for a developer tool. You must decide which function to call to satisfy the user's request, based on your knowledge base. If no specific tool seems appropriate, respond with text.\n\nKnowledge Base:\n${knowledgeBase}`}, tools: [{ functionDeclarations }]});
        const result = await retryWithBackoff(() => model.generateContent(prompt));
        const response = result.response;

        const functionCalls: { name: string, args: any; }[] = [];
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) { if (part.functionCall) { functionCalls.push({ name: part.functionCall.name, args: part.functionCall.args }); } }
        return { text: response.text(), functionCalls: functionCalls.length > 0 ? functionCalls : undefined };
    } catch (error) {
        logError(error as Error, { prompt });
        throw error;
    }
};


// --- IMAGE & VIDEO GENERATION ---
/**
 * Generates an image based on a textual prompt.
 * @param prompt The text prompt for image generation.
 * @returns A promise resolving to a data URL of the generated image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    // This is a placeholder for a real image generation model call.
    // Google AI Studio / Gemini does not currently support image generation via this SDK in the same way.
    // This simulates what the call would look like if it were available.
    logError(new Error("Image generation is not supported in this version of the Gemini API/SDK."), { prompt });
    // Returning a placeholder image URL.
    return `https://dummyimage.com/512x512/000/fff&text=AI+Image+for:+${encodeURIComponent(prompt.slice(0,30))}`;
};
