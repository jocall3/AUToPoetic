## The Grand Unveiling: A Jester's Guide to Our AI Maestro, `aiService.ts` – The Code that Makes Dreams Code!

Hark, ye noble knights of the keyboard, ye wizards of the whiteboard, ye connoisseurs of clean code! Gather 'round, for I, your humble Jester of Bits and Bytes, have a tale to spin, a marvel to present, a secret to share that shall rattle the very foundations of your development workflow! Forget the dragons of debugging and the trolls of tedious tasks, for today, we unveil the scroll, the very heart, the pulsating core of innovation: our `aiService.ts`!

This isn't just a file; it's a sentient symphony, a digital oracle, a tireless apprentice, and occasionally, a stand-up comedian for your code. It's the AI maestro conducting a grand orchestra of generative capabilities, ready to pluck the strings of creation at your merest whim. Prepare yourselves, for what you are about to witness is not merely code, but the very essence of *coding smarter*, woven into a tapestry of TypeScript, powered by the boundless wisdom of Google Gemini, and presented with all the pomp and circumstance it so richly deserves!

### The Prologue: A World Awaits Its Hero

In the annals of software lore, developers have always sought the legendary Sword of Efficiency, the Shield of Scalability, and the Cloak of Creativity. But often, they found themselves bogged down in the swamp of boilerplate, battling the chimera of complex configurations, and wrestling with the hydra of technical debt. What if there was a tool, a single point of entry, a benevolent genie that could grant wishes not just for a single task, but for an entire spectrum of development needs?

Enter `aiService.ts`, not just a hero, but a whole pantheon of heroes rolled into one! This file is our answer, our ode to breaking free from the mundane and soaring into the realm of the truly innovative. It's meticulously crafted to be the central nervous system for all AI interactions within our ecosystem, ensuring consistency, security, and a dollop of pure, unadulterated delight.

### Act I: The Maestro's Baton – Orchestrating Intelligence with `GoogleGenAI`

At the heart of any grand performance is the maestro, and for us, it's the `GoogleGenAI` client. But like any good jester's trick, there's more than meets the eye! Our `getAiClient` function is a masterpiece of efficiency and security, deftly managing API keys from our vault, ensuring that our magical incantations (prompts) are always whispered to the correct ethereal entity, and only when necessary. It's like having a secret handshake with the digital gods, guarded by a dragon of cryptographic strength!

```typescript
// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import type { GeneratedFile, StructuredPrSummary, StructuredExplanation, ColorTheme, SemanticColorTheme, StructuredReview, SlideSummary, SecurityVulnerability, CodeSmell, CustomFeature, CronParts, ProjectPlan, ArchitectureBlueprint, ApiEndpoint, DatabaseQueryOptimization, AccessibilityReport, CodeMetric, JwtPayload, FinancialReport, BuildOptimization, SecurityRecommendation, ComplianceReport, MicroserviceContract, KubernetesManifest, HelmChart, DesignPatternExplanation, LibraryComparison, ArchitecturalProposal, Roadmap, BlogArticle, MarketingCopy } from '../types.ts';
import { logError } from './telemetryService.ts';
import { getDecryptedCredential } from './vaultService.ts';

let ai: GoogleGenAI | null = null;
let lastUsedApiKey: string | null = null;

/**
 * Gets a GoogleGenAI client instance, initializing it with a key from the vault.
 * It caches the client and only re-initializes if the key changes (e.g., user updates it).
 * @returns A promise that resolves to a GoogleGenAI instance.
 * @throws {Error} If the Google Gemini API key is not found in the vault.
 */
const getAiClient = async (): Promise<GoogleGenAI> => {
    const apiKey = await getDecryptedCredential('gemini_api_key');
    if (!apiKey) {
        throw new Error("Google Gemini API key not found in vault. Please add it in the Workspace Connector Hub.");
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
        const response = await retryWithBackoff(() => aiClient.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt as any,
            config: { systemInstruction, temperature }
        }));

        for await (const chunk of response) {
            yield chunk.text;
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
        const response = await retryWithBackoff(() => aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction, temperature }
        }));
        return response.text;
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
        const response = await retryWithBackoff(() => aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature,
            }
        }));
        return JSON.parse(response.text.trim());
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
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "A short, descriptive name for the feature." },
            description: { type: Type.STRING, description: "A one-sentence description of what the feature does." },
            icon: { type: Type.STRING, description: `A valid icon name from this list: ${validIcons}` },
            code: { type: Type.STRING, description: "The full React component code as a single string. It must start with `() => {` and be a valid React functional component body. Do not include imports." }
        },
        required: ["name", "description", "icon", "code"]
    };
    
    const fullPrompt = `Based on the user request, generate a new feature component.
    
    User Request: "${prompt}"

    Valid Icon Names: ${validIcons}.
    `;
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
    `Generate a single valid JavaScript regex literal (e.g., /abc/gi) for the following description. Respond with ONLY the regex literal and nothing else: "${description}"`,
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
 * Translates only the comments within a code snippet to a target language.
 * @param code The code snippet with comments to translate.
 * @param targetLanguage The language to translate comments into (e.g., 'Spanish', 'Japanese').
 * @returns An async generator yielding the code with translated comments.
 */
export const translateComments = (code: string, targetLanguage: string) => streamContent(
    `Translate only the code comments in the following snippet to ${targetLanguage}. Do not alter the code itself. Respond with the full code snippet including the translated comments.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an AI assistant that translates code comments into different languages without changing any of the code."
);

/**
 * Generates a basic, multi-stage Dockerfile for a specified framework.
 * @param framework The framework (e.g., 'Node.js', 'Python Flask', 'React').
 * @returns An async generator yielding the Dockerfile content.
 */
export const generateDockerfile = (framework: string) => streamContent(
    `Generate a basic, multi-stage Dockerfile for a ${framework} project. The Dockerfile should be production-ready, including build and serve stages. Respond with only the Dockerfile content in a markdown block.`,
    "You are a DevOps expert specializing in containerization with Docker."
);

/**
 * Converts CSS code to equivalent Tailwind CSS utility classes and provides the HTML structure.
 * @param css The CSS code to convert.
 * @returns An async generator yielding the HTML with Tailwind classes.
 */
export const convertCssToTailwind = (css: string) => streamContent(
    `Convert the following CSS code to Tailwind CSS utility classes. Provide the equivalent HTML structure with the Tailwind classes. Respond with only the HTML in a markdown block.\n\nCSS:\n\`\`\`css\n${css}\n\`\`\``,
    "You are an expert in Tailwind CSS and modern CSS practices."
);

/**
 * Applies a specific refactoring instruction to code.
 * @param code The code to refactor.
 * @param instruction The specific refactoring instruction (e.g., "Extract this loop into a separate function").
 * @returns An async generator yielding the refactored code.
 */
export const applySpecificRefactor = (code: string, instruction: string) => streamContent(
    `Apply this specific refactoring instruction to the code: "${instruction}". Respond with only the complete, refactored code in a markdown block.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an AI assistant that precisely applies refactoring instructions to code."
);

/**
 * Generates a minimal Vitest unit test to reproduce a bug from a stack trace.
 * @param stackTrace The stack trace of the bug.
 * @param context Optional additional context about the bug.
 * @returns An async generator yielding the bug reproduction test code.
 */
export const generateBugReproductionTestStream = (stackTrace: string, context?: string) => streamContent(
    `Generate a minimal, runnable unit test (using Vitest) that reproduces the bug described by the following stack trace. Respond with only the code in a markdown block.\n\nStack Trace:\n${stackTrace}\n\n${context ? `Additional Context:\n${context}` : ''}`,
    "You are a senior software engineer specializing in debugging and automated testing. You create concise, effective unit tests to reproduce bugs."
);

/**
 * Generates an AWS or GCP IAM policy in JSON format from a description.
 * @param description A description of the desired IAM policy.
 * @param platform The cloud platform ('aws' or 'gcp').
 * @returns An async generator yielding the JSON IAM policy.
 */
export const generateIamPolicyStream = (description: string, platform: 'aws' | 'gcp') => streamContent(
    `Generate a valid ${platform.toUpperCase()} IAM policy in JSON format based on this description: "${description}". Respond with only the JSON policy in a markdown block.`,
    "You are a cloud security expert specializing in IAM policies for AWS and GCP."
);

/**
 * Streams SQL queries based on a natural language description and an optional database schema.
 * @param description The natural language description of the desired SQL query.
 * @param dbSchema Optional. The database schema in SQL DDL format to help context.
 * @returns An async generator yielding the SQL query.
 */
export const generateSqlQueriesStream = (description: string, dbSchema?: string) => streamContent(
    `Generate SQL queries (e.g., SELECT, INSERT, UPDATE, DELETE) for the following description.
    Description: "${description}"
    ${dbSchema ? `\n\nDatabase Schema:\n\`\`\`sql\n${dbSchema}\n\`\`\`` : ''}
    Respond with only the SQL code in a markdown block.`,
    "You are an expert SQL developer. You generate accurate and efficient SQL queries.",
    0.7
);

/**
 * Streams front-end boilerplate code (e.g., component, service, styles) for a specified framework and styling.
 * @param componentDescription A description of the component or feature.
 * @param framework The front-end framework (e.g., 'React', 'Vue', 'Angular').
 * @param styling The styling approach (e.g., 'Tailwind CSS', 'CSS Modules', 'Styled Components').
 * @returns An async generator yielding the boilerplate code in a markdown block.
 */
export const generateFrontEndBoilerplateStream = (componentDescription: string, framework: string, styling: string) => streamContent(
    `Generate front-end boilerplate code (component, service, basic styles) for a ${framework} project using ${styling} for the following description: "${componentDescription}". Respond with only the code in markdown blocks, separated by file.`,
    "You are an expert front-end developer and generate comprehensive boilerplate for modern web applications.",
    0.6
);

/**
 * Streams detailed documentation for a given code snippet in Markdown format.
 * @param code The code snippet to document.
 * @param language The programming language of the code.
 * @returns An async generator yielding the Markdown documentation.
 */
export const codeDocumentationStream = (code: string, language: string) => streamContent(
    `Generate comprehensive documentation in Markdown for the following ${language} code. Include purpose, parameters, return values, and usage examples.\n\n\`\`\`${language}\n${code}\n\`\`\``,
    "You are a highly skilled technical writer who produces clear, accurate, and complete code documentation.",
    0.5
);

/**
 * Refactors a given code snippet to adhere to a specified design pattern.
 * @param code The code snippet to refactor.
 * @param pattern The design pattern to apply (e.g., 'Strategy', 'Observer', 'Factory').
 * @returns An async generator yielding the refactored code.
 */
export const refactorToDesignPatternStream = (code: string, pattern: string) => streamContent(
    `Refactor the following code to implement the "${pattern}" design pattern. Explain the changes briefly. Respond with only the refactored code in a markdown block, followed by a brief explanation.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software architect who can skillfully apply various design patterns to code.",
    0.4
);

/**
 * Streams a GraphQL schema based on a natural language description of data entities and relationships.
 * @param description A description of the data model for the GraphQL schema.
 * @returns An async generator yielding the GraphQL schema definition.
 */
export const generateGraphqlSchemaStream = (description: string) => streamContent(
    `Generate a GraphQL schema (types, queries, mutations) for the following description: "${description}". Respond with only the schema definition in a markdown block.`,
    "You are an expert in GraphQL schema design and data modeling.",
    0.7
);

/**
 * Streams a sentiment analysis of the provided text.
 * @param text The text to analyze for sentiment.
 * @returns An async generator yielding the sentiment analysis.
 */
export const analyzeSentimentStream = (text: string) => streamContent(
    `Perform a sentiment analysis on the following text, identifying the overall sentiment (positive, negative, neutral) and providing supporting reasons:\n\n"${text}"`,
    "You are an expert in natural language processing and sentiment analysis.",
    0.6
);

/**
 * Streams a list of extracted entities (e.g., names, places, organizations) from the provided text.
 * @param text The text from which to extract entities.
 * @returns An async generator yielding the extracted entities in a structured format (e.g., Markdown list).
 */
export const extractEntitiesStream = (text: string) => streamContent(
    `Extract key entities (people, organizations, locations, dates, etc.) from the following text and list them in a clear, categorized Markdown format:\n\n"${text}"`,
    "You are an expert in natural language processing and entity extraction.",
    0.6
);

/**
 * Streams a summary of a meeting transcript into key discussion points and action items.
 * @param transcript The full meeting transcript.
 * @returns An async generator yielding the meeting summary.
 */
export const summarizeMeetingStream = (transcript: string) => streamContent(
    `Summarize the following meeting transcript into key discussion points, decisions made, and a bulleted list of action items with assigned owners if possible. Format as Markdown.\n\n\`\`\`\n${transcript}\n\`\`\``,
    "You are a highly efficient meeting assistant who excels at summarizing complex discussions.",
    0.7
);

/**
 * Streams multiple-choice or open-ended quiz questions based on a given topic and difficulty.
 * @param topic The topic for the quiz questions.
 * @param difficulty The desired difficulty level (e.g., 'easy', 'medium', 'hard').
 * @param type The type of questions ('multiple-choice' or 'open-ended').
 * @returns An async generator yielding the quiz questions.
 */
export const generateQuizQuestionsStream = (topic: string, difficulty: 'easy' | 'medium' | 'hard', type: 'multiple-choice' | 'open-ended' = 'multiple-choice') => streamContent(
    `Generate 5 ${difficulty} difficulty, ${type} quiz questions about "${topic}". For multiple-choice, include 4 options and the correct answer. For open-ended, provide a suggested answer. Format as Markdown.\n\n`,
    "You are an expert educator who creates clear and challenging quiz questions.",
    0.8
);

/**
 * Streams grammar corrections and suggestions for a given text.
 * @param text The text to fix grammar in.
 * @returns An async generator yielding the grammatically corrected text.
 */
export const fixGrammarStream = (text: string) => streamContent(
    `Review and correct all grammatical errors, spelling mistakes, and punctuation issues in the following text. Respond with only the corrected text.\n\n"${text}"`,
    "You are a meticulous editor and grammar expert.",
    0.3
);

/**
 * Streams code translated from one programming language to another.
 * @param code The code to translate.
 * @param fromLang The source programming language (e.g., 'Python', 'Java').
 * @param toLang The target programming language (e.g., 'JavaScript', 'Go').
 * @returns An async generator yielding the translated code.
 */
export const translateCodeStream = (code: string, fromLang: string, toLang: string) => streamContent(
    `Translate the following code from ${fromLang} to ${toLang}. Ensure functional equivalence and idiomatic translation. Respond with only the translated code in a markdown block.\n\n\`\`\`${fromLang}\n${code}\n\`\`\``,
    `You are an expert polyglot programmer who translates code accurately between programming languages.`,
    0.4
);

/**
 * Streams release notes based on a new version's features, bug fixes, and improvements.
 * @param version The new version number.
 * @param newFeatures A list of new features.
 * @param bugFixes A list of bug fixes.
 * @param improvements A list of general improvements.
 * @returns An async generator yielding the formatted release notes.
 */
export const generateReleaseNotesStream = (version: string, newFeatures: string[], bugFixes: string[], improvements: string[]) => streamContent(
    `Generate concise, user-friendly release notes for version ${version} in Markdown format.
    
    New Features: ${newFeatures.map(f => `- ${f}`).join('\n')}
    Bug Fixes: ${bugFixes.map(f => `- ${f}`).join('\n')}
    Improvements: ${improvements.map(f => `- ${f}`).join('\n')}`,
    "You are a product manager who writes clear and engaging release notes.",
    0.6
);

/**
 * Streams an analysis of a codebase to identify potentially dead or unreachable code.
 * @param codebase The code to analyze (e.g., a file's content, or multiple files concatenated).
 * @returns An async generator yielding the dead code analysis and suggestions.
 */
export const identifyDeadCodeStream = (codebase: string) => streamContent(
    `Analyze the following codebase for dead or unreachable code. Point out specific sections or functions that appear unused and suggest removal or refactoring. Respond in Markdown with code snippets.\n\n\`\`\`\n${codebase}\n\`\`\``,
    "You are an expert static code analyzer and refactoring specialist. You meticulously identify and report dead code.",
    0.6
);

/**
 * Streams a high-level architectural suggestion based on system requirements.
 * @param requirements A description of the system's functional and non-functional requirements.
 * @returns An async generator yielding the architectural proposal in Markdown.
 */
export const suggestArchitectureStream = (requirements: string) => streamContent(
    `Based on the following system requirements, propose a high-level architectural design. Include choices for technologies, deployment strategy, and key components. Format your response in Markdown.\n\nRequirements:\n"${requirements}"`,
    "You are a seasoned solutions architect. You design scalable, robust, and cost-effective system architectures.",
    0.8
);

/**
 * Streams a data migration script (e.g., SQL, NoSQL) to transform data between two schema versions.
 * @param fromSchema The source database schema.
 * @param toSchema The target database schema.
 * @param dbType The type of database (e.g., 'PostgreSQL', 'MongoDB').
 * @returns An async generator yielding the data migration script.
 */
export const generateDataMigrationScriptStream = (fromSchema: string, toSchema: string, dbType: string) => streamContent(
    `Generate a data migration script for ${dbType} to transform data from the old schema to the new schema.
    
    Old Schema:\n\`\`\`sql\n${fromSchema}\n\`\`\`
    
    New Schema:\n\`\`\`sql\n${toSchema}\n\`\`\`
    
    Respond with only the migration script code in a markdown block.`,
    "You are a database expert and data engineer. You write safe and efficient data migration scripts.",
    0.7
);

/**
 * Streams an optimized version of a given database query, along with an explanation of improvements.
 * @param query The original database query.
 * @param schema The database schema for context.
 * @returns An async generator yielding the optimized query and explanation.
 */
export const optimizeDatabaseQueryStream = (query: string, schema: string) => streamContent(
    `Optimize the following database query for performance. Provide the optimized query and an explanation of the improvements made.
    
    Query:\n\`\`\`sql\n${query}\n\`\`\`
    
    Schema:\n\`\`\`sql\n${schema}\n\`\`\`
    
    Respond with the optimized query in a markdown block, followed by the explanation.`,
    "You are a database performance expert. You analyze and optimize complex database queries for speed and efficiency.",
    0.7
);

/**
 * Streams an accessibility report for a given UI component, identifying issues and suggesting fixes.
 * @param componentCode The code of the UI component to analyze.
 * @returns An async generator yielding the accessibility report.
 */
export const createAccessibilityReportStream = (componentCode: string) => streamContent(
    `Generate an accessibility report for the following UI component code. Identify potential WCAG violations and suggest concrete code changes to fix them. Format your response as a Markdown report.\n\n\`\`\`html\n${componentCode}\n\`\`\``,
    "You are a web accessibility expert. You meticulously review UI components for WCAG compliance and provide actionable remediation advice.",
    0.6
);


// --- Simple Generate Content (non-streaming) ---
/**
 * Generates an asynchronous JavaScript function to orchestrate a described workflow.
 * @param flow A description of the workflow.
 * @returns A promise resolving to the JavaScript orchestration code.
 */
export const generatePipelineCode = (flow: string): Promise<string> => generateContent(`Based on the following described workflow, generate a single asynchronous JavaScript function that orchestrates the steps. Use placeholder functions for the actual tool logic. The workflow is: ${flow}`, "You are an expert software architect who writes clean, asynchronous JavaScript code to orchestrate complex workflows based on a description.", 0.5);

/**
 * Generates a CI/CD configuration file for a specified platform based on a description.
 * @param platform The CI/CD platform (e.g., 'GitHub Actions', 'GitLab CI', 'Jenkins').
 * @param description A description of the desired CI/CD pipeline.
 * @returns A promise resolving to the CI/CD configuration content.
 */
export const generateCiCdConfig = (platform: string, description: string): Promise<string> => generateContent(
    `Generate a CI/CD configuration file for ${platform} based on this description: "${description}". Respond with only the YAML/config file content inside a markdown block.`,
    "You are a DevOps expert specializing in CI/CD pipelines."
);

/**
 * Analyzes performance trace data and provides optimization suggestions.
 * @param trace The performance trace data object.
 * @returns A promise resolving to the optimization suggestions in Markdown.
 */
export const analyzePerformanceTrace = (trace: object): Promise<string> => generateContent(
    `Analyze the following performance trace data and provide optimization suggestions in markdown format. Data: ${JSON.stringify(trace, null, 2)}`,
    "You are an expert performance engineer."
);

/**
 * Explains an accessibility issue and suggests a code fix.
 * @param issue The accessibility issue object.
 * @returns A promise resolving to the explanation and suggested code fix.
 */
export const suggestA11yFix = (issue: object): Promise<string> => generateContent(
    `Explain this accessibility issue and suggest a code fix in markdown. Issue: ${JSON.stringify(issue, null, 2)}`,
    "You are an expert in web accessibility (a11y)."
);

/**
 * Creates Markdown documentation for API endpoint code.
 * @param apiCode The API endpoint code.
 * @returns A promise resolving to the Markdown API documentation.
 */
export const createApiDocumentation = (apiCode: string): Promise<string> => generateContent(
    `Generate Markdown documentation for the following API endpoint code. Include the endpoint, HTTP method, parameters, and example request/response.\n\nCode:\n\`\`\`\n${apiCode}\n\`\`\``,
    "You are a technical writer who creates clear and concise API documentation."
);

/**
 * Generates a TypeScript interface from a JSON object.
 * @param json The JSON object string.
 * @returns A promise resolving to the TypeScript interface code.
 */
export const jsonToTypescriptInterface = (json: string): Promise<string> => generateContent(
    `Generate a TypeScript interface from this JSON object. Respond with only the TypeScript code in a markdown block.\n\nJSON:\n${json}`,
    "You are an expert in TypeScript and data modeling."
);

/**
 * Analyzes code and suggests modern, more efficient library alternatives.
 * @param code The code to analyze for library suggestions.
 * @returns A promise resolving to the suggested library alternatives and explanations.
 */
export const suggestAlternativeLibraries = (code: string): Promise<string> => generateContent(
    `Analyze the following code, particularly its import statements and common patterns (like date manipulation). Suggest modern, more efficient library alternatives where applicable (e.g., suggest 'date-fns' or 'dayjs' over 'moment.js'). Explain why.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are a senior software engineer with deep knowledge of the JavaScript ecosystem."
);

/**
 * Provides a step-by-step explanation of a regular expression.
 * @param regex The regular expression string.
 * @returns A promise resolving to the regex explanation.
 */
export const explainRegex = (regex: string): Promise<string> => generateContent(
    `Provide a step-by-step explanation of what each part of this regular expression does: \`${regex}\``,
    "You are an expert in regular expressions who can explain complex patterns simply."
);

/**
 * Generates a Mermaid.js flowchart string representing the logic of given code.
 * @param code The code to visualize.
 * @returns A promise resolving to the Mermaid.js code.
 */
export const generateMermaidJs = (code: string): Promise<string> => generateContent(
    `Generate a Mermaid.js flowchart string that represents the logic of the following code. Respond with only the Mermaid.js code in a markdown block (e.g., \`\`\`mermaid\n...\n\`\`\`).\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert in code analysis and can visualize logic flows using Mermaid.js."
);

/**
 * Generates a concise, professional weekly summary email in HTML format based on commit logs and telemetry data.
 * @param commitLogs The git commit logs.
 * @param telemetryData Performance telemetry data.
 * @returns A promise resolving to the HTML formatted weekly digest.
 */
export const generateWeeklyDigest = (commitLogs: string, telemetryData: object): Promise<string> => generateContent(
    `Generate a concise, professional weekly summary email in HTML format based on the following data.
    
    Commit Logs:
    \`\`\`
    ${commitLogs}
    \`\`\`
    
    Performance Telemetry:
    \`\`\`json
    ${JSON.stringify(telemetryData, null, 2)}
    \`\`\`
    
    The email should have sections for "New Features", "Bug Fixes", and "Performance Notes". It should be visually clean and easy to read.`,
    "You are an AI assistant that generates weekly engineering progress reports in HTML format."
);

/**
 * Generates a comprehensive technical specification document in Markdown based on PR information.
 * @param diff The code diff from the pull request.
 * @param summary Structured PR summary (title, overall summary, changes).
 * @returns A promise resolving to the Markdown technical specification.
 */
export const generateTechnicalSpecFromDiff = (diff: string, summary: StructuredPrSummary): Promise<string> => generateContent(
    `Generate a comprehensive technical specification document in Markdown format based on the following pull request information.

The spec should include the following sections:
- **Problem:** A brief description of the issue being addressed.
- **Solution:** A detailed explanation of the changes made.
- **Technical Details:** An overview of the implementation, including any new functions, components, or patterns.
- **Impact:** How this change affects other parts of the application.

**PR Title:** ${summary.title}
**PR Summary:** ${summary.summary}

**Code Diff:**
\`\`\`diff
${diff}
\`\`\`
`,
    "You are an expert programmer who writes excellent, clear, and comprehensive technical specification documents from pull request data."
);

/**
 * Compares several libraries or frameworks based on a specified feature or use case.
 * @param feature A description of the feature or problem for which libraries are being compared.
 * @param libraries A list of library names to compare (e.g., ['React', 'Vue', 'Angular']).
 * @returns A promise resolving to a Markdown comparison report.
 */
export const compareLibraries = (feature: string, libraries: string[]): Promise<string> => generateContent(
    `Compare the following libraries/frameworks for developing a "${feature}". Provide a balanced analysis focusing on pros, cons, and suitability for different use cases. Format as a detailed Markdown table or bulleted list.
    
    Libraries to Compare: ${libraries.join(', ')}`,
    "You are a seasoned software architect with deep knowledge of the software ecosystem, capable of providing insightful library comparisons.",
    0.7
);

/**
 * Explains a given software design pattern, potentially with code examples in a specified language.
 * @param pattern The name of the design pattern (e.g., 'Singleton', 'Factory', 'Observer').
 * @param language Optional. The programming language for code examples (e.g., 'TypeScript', 'Python').
 * @returns A promise resolving to a Markdown explanation of the pattern.
 */
export const explainDesignPattern = (pattern: string, language?: string): Promise<string> => generateContent(
    `Explain the "${pattern}" design pattern in detail. Describe its purpose, structure, applicability, and consequences. ${language ? `Provide a concise code example in ${language}.` : ''} Format your explanation in Markdown.`,
    "You are an expert in software engineering design patterns. You explain complex concepts clearly and provide practical examples.",
    0.6
);

/**
 * Generates a project roadmap based on a high-level product goal.
 * @param productGoal A description of the overarching product goal.
 * @returns A promise resolving to a Markdown project roadmap.
 */
export const generateRoadmap = (productGoal: string): Promise<string> => generateContent(
    `Generate a high-level project roadmap for achieving the following product goal: "${productGoal}". The roadmap should include key phases, milestones, and estimated timelines. Format as Markdown.`,
    "You are an expert product manager and strategist. You create clear and actionable project roadmaps.",
    0.7
);

/**
 * Generates Mermaid.js code for a UML diagram (e.g., Class, Sequence, State) based on a description.
 * @param description A description of the system or interaction for the UML diagram.
 * @param diagramType Optional. The type of UML diagram (e.g., 'class', 'sequence', 'state').
 * @returns A promise resolving to the Mermaid.js code for the UML diagram.
 */
export const createUMLDiagram = (description: string, diagramType?: string): Promise<string> => generateContent(
    `Generate Mermaid.js code for a ${diagramType || 'general'} UML diagram based on the following description: "${description}". Respond with only the Mermaid.js code in a markdown block (e.g., \`\`\`mermaid\n...\n\`\`\`).`,
    "You are an expert in system design and UML modeling. You generate accurate Mermaid.js diagrams from descriptions.",
    0.7
);

/**
 * Analyzes cloud resource usage data and provides cost optimization suggestions.
 * @param currentUsage An object representing current cloud resource usage and costs.
 * @returns A promise resolving to a Markdown report of cost optimization suggestions.
 */
export const analyzeCloudCosts = (currentUsage: object): Promise<string> => generateContent(
    `Analyze the following cloud resource usage data and identify areas for cost optimization. Provide specific recommendations, including potential savings. Format as a Markdown report.
    
    Current Usage Data:\n\`\`\`json\n${JSON.stringify(currentUsage, null, 2)}\n\`\`\``,
    "You are a cloud financial management expert. You identify opportunities to optimize cloud spending.",
    0.6
);

/**
 * Generates a Kubernetes manifest (e.g., Deployment, Service) for a described application component.
 * @param serviceDescription A description of the application service (e.g., 'a Node.js microservice serving an API').
 * @returns A promise resolving to the YAML Kubernetes manifest.
 */
export const generateKubernetesManifest = (serviceDescription: string): Promise<string> => generateContent(
    `Generate a Kubernetes Deployment and Service manifest in YAML for a "${serviceDescription}". Include appropriate resource limits, readiness/liveness probes, and environment variables. Respond with only the YAML in a markdown block.`,
    "You are a DevOps expert specializing in Kubernetes deployments and configurations.",
    0.7
);

/**
 * Generates a basic Helm chart structure (templates, values.yaml) for a described application.
 * @param applicationDescription A description of the application for which to create the Helm chart.
 * @returns A promise resolving to the Helm chart files' content.
 */
export const generateHelmChart = (applicationDescription: string): Promise<string> => generateContent(
    `Generate the basic file structure and content for a Helm chart for a "${applicationDescription}". Include common templates (deployment, service), a values.yaml, and Chart.yaml. Respond with only the file contents in separate markdown blocks.`,
    "You are a DevOps expert specializing in Helm chart creation for Kubernetes applications.",
    0.7
);

/**
 * Proposes a high-level solution architecture based on a problem statement.
 * @param problemStatement A description of the problem or business need.
 * @returns A promise resolving to a Markdown architectural proposal.
 */
export const proposeSolutionArchitecture = (problemStatement: string): Promise<string> => generateContent(
    `Based on the following problem statement, propose a high-level solution architecture. Include key components, technologies, and integration points. Format as a detailed Markdown document.
    
    Problem Statement: "${problemStatement}"`,
    "You are a principal solutions architect. You design innovative and effective solutions to complex business problems.",
    0.8
);

/**
 * Writes a technical blog post on a given topic.
 * @param topic The topic of the blog post.
 * @param audience Optional. The target audience (e.g., 'junior developers', 'CTOs').
 * @returns A promise resolving to the Markdown blog post.
 */
export const writeTechnicalBlogPost = (topic: string, audience?: string): Promise<string> => generateContent(
    `Write a detailed and engaging technical blog post about "${topic}". ${audience ? `Tailor it for ${audience}.` : ''} Include an introduction, main sections, and a conclusion. Format as Markdown.`,
    "You are an expert technical writer and blogger. You create informative and compelling technical content.",
    0.7
);

/**
 * Generates marketing copy for a product or feature, targeted at a specific audience.
 * @param product The product or feature name/description.
 * @param targetAudience The target audience for the marketing copy.
 * @returns A promise resolving to the marketing copy.
 */
export const generateMarketingCopy = (product: string, targetAudience: string): Promise<string> => generateContent(
    `Generate compelling marketing copy for "${product}", targeting "${targetAudience}". Highlight key benefits and a call to action. Provide a few variations.`,
    "You are a creative marketing copywriter. You craft persuasive and effective marketing messages.",
    0.8
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
    const schema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, lineByLine: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lines: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["lines", "explanation"] } }, complexity: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, space: { type: Type.STRING } }, required: ["time", "space"] }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["summary", "lineByLine", "complexity", "suggestions"] };
    return generateJson(prompt, systemInstruction, schema);
}

/**
 * Generates a color theme (hex codes) based on a textual description.
 * @param description A natural language description of the desired color theme.
 * @returns A promise resolving to a ColorTheme object.
 */
export const generateThemeFromDescription = async (description: string): Promise<ColorTheme> => {
    const systemInstruction = "You are a UI/UX design expert specializing in color theory. Generate a color theme based on the user's description. Provide hex codes for each color.";
    const prompt = `Generate a color theme for: "${description}"`;
    const schema = { type: Type.OBJECT, properties: { primary: { type: Type.STRING }, background: { type: Type.STRING }, surface: { type: Type.STRING }, textPrimary: { type: Type.STRING }, textSecondary: { type: Type.STRING }, textOnPrimary: { type: Type.STRING }, border: { type: Type.STRING } }, required: ["primary", "background", "surface", "textPrimary", "textSecondary", "textOnPrimary", "border"] };
    return generateJson(prompt, systemInstruction, schema);
};

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
        type: Type.OBJECT,
        properties: {
            value: { type: Type.STRING, description: "The hex code of the color, e.g., #RRGGBB" },
            name: { type: Type.STRING, description: "A creative, evocative name for the color." }
        },
        required: ["value", "name"]
    };

    const accessibilityCheckSchema = {
        type: Type.OBJECT,
        properties: {
            ratio: { type: Type.NUMBER, description: "The calculated contrast ratio." },
            score: { type: Type.STRING, enum: ["AAA", "AA", "Fail"], description: "The WCAG 2.1 accessibility score." }
        },
        required: ["ratio", "score"]
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            mode: {
                type: Type.STRING, enum: ["light", "dark"],
                description: "The recommended UI mode for this theme, 'light' or 'dark'."
            },
            palette: {
                type: Type.OBJECT,
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
                type: Type.OBJECT,
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
                type: Type.OBJECT,
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
    const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, changes: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "summary", "changes"] };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates multiple files for a frontend feature (e.g., component, hooks, styles) based on a description, framework, and styling.
 * Supports Google Maps API integration if relevant to the prompt.
 * @param prompt A description of the desired feature.
 * @param framework The frontend framework (e.g., 'React', 'Vue').
 * @param styling The styling solution (e.g., 'Tailwind CSS', 'Styled Components').
 * @returns A promise resolving to an array of GeneratedFile objects.
 */
export const generateFeature = (prompt: string, framework: string, styling: string): Promise<GeneratedFile[]> => {
    const systemInstruction = `You are an AI that generates complete, production-ready components. Create all necessary files for the requested framework and styling option.
    IMPORTANT: When the user's prompt is about maps, location, addresses, or stores, you MUST use the Google Maps JavaScript API. Generate a component that accepts an 'apiKey' prop and uses it to load the Maps script.`;
    const userPrompt = `Generate the files for a ${framework} component using ${styling} for the following feature request: "${prompt}". Make sure to include a .tsx component file.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, content: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["filePath", "content", "description"] } };
    return generateJson(userPrompt, systemInstruction, schema);
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
    const userPrompt = `Generate a full-stack feature for: "${prompt}"`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                filePath: { type: Type.STRING, enum: ['Component.tsx', 'functions/index.js', 'functions/package.json', 'firestore.rules'] },
                content: { type: Type.STRING },
                description: { type: Type.STRING }
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
    const prompt = `Convert this schedule to a cron expression: "${description}"`;
    const schema = { type: Type.OBJECT, properties: { minute: { type: Type.STRING }, hour: { type: Type.STRING }, dayOfMonth: { type: Type.STRING }, month: { type: Type.STRING }, dayOfWeek: { type: Type.STRING } }, required: ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates a harmonious 6-color palette based on a given base color.
 * @param baseColor The base color (e.g., '#RRGGBB', 'blue').
 * @returns A promise resolving to an object containing an array of hex color strings.
 */
export const generateColorPalette = (baseColor: string): Promise<{ colors: string[] }> => {
    const systemInstruction = "You are a color theory expert. Generate a 6-color palette based on the given base color.";
    const prompt = `Generate a harmonious 6-color palette based on the color ${baseColor}.`;
    const schema = { type: Type.OBJECT, properties: { colors: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["colors"] };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates an array of realistic mock data objects based on a schema description.
 * @param description A natural language description of the data schema.
 * @param count The number of mock data objects to generate.
 * @returns A promise resolving to an array of mock data objects.
 */
export const generateMockData = (description: string, count: number): Promise<object[]> => {
    const systemInstruction = "You are an expert data scientist who creates realistic mock data based on a schema description. You must respond with only a valid JSON array of objects.";
    const prompt = `Generate an array of ${count} mock data objects based on the following schema description. Respond with only the JSON array.\n\nSchema: "${description}"`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {} }}; // Freeform objects
    return generateJson(prompt, systemInstruction, schema, 0.8);
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
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                vulnerability: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
                description: { type: Type.STRING },
                mitigation: { type: Type.STRING },
                exploitSuggestion: { type: Type.STRING, description: "A cURL command, code snippet, or description of how to exploit the vulnerability." }
            },
            required: ['vulnerability', 'severity', 'description', 'mitigation', 'exploitSuggestion']
        }
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates boilerplate CRUD API endpoint files for an Express or Fastify server from a SQL schema.
 * @param schema The SQL table schema.
 * @param framework The backend framework ('express' or 'fastify').
 * @returns A promise resolving to an array of GeneratedFile objects for the API endpoints.
 */
export const sqlToApiEndpoints = (schema: string, framework: 'express' | 'fastify'): Promise<GeneratedFile[]> => {
    const systemInstruction = "You are an expert backend developer who generates boilerplate CRUD API endpoints from a SQL schema.";
    const prompt = `Generate boilerplate CRUD API endpoint files for a ${framework} server based on the following SQL table schema. Create separate files for routes, controllers, and models.\n\nSQL:\n\`\`\`sql\n${schema}\n\`\`\``;
    const filesSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, content: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["filePath", "content", "description"] } };
    return generateJson(prompt, systemInstruction, filesSchema);
};

/**
 * Detects and reports code smells in a given code snippet, providing structured details.
 * @param code The code to analyze for smells.
 * @returns A promise resolving to an array of CodeSmell objects.
 */
export const detectCodeSmells = (code: string): Promise<CodeSmell[]> => {
    const systemInstruction = "You are an expert software engineer who identifies code smells like long methods, large classes, feature envy, etc.";
    const prompt = `Analyze the following code for code smells and provide explanations.\n\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { smell: { type: Type.STRING }, line: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["smell", "line", "explanation"] } };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates 3-5 relevant, single-word, lowercase tags for a code snippet.
 * @param code The code snippet for which to generate tags.
 * @returns A promise resolving to an array of tag strings.
 */
export const generateTagsForCode = (code: string): Promise<string[]> => {
    const systemInstruction = "You are an AI assistant that analyzes code and suggests relevant tags.";
    const prompt = `Generate 3-5 relevant, single-word, lowercase tags for this code snippet to help categorize it. Respond with only a JSON array of strings.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Performs a structured code review, providing a summary and specific, actionable suggestions.
 * @param code The code to review.
 * @returns A promise resolving to a StructuredReview object.
 */
export const reviewCodeStructured = (code: string): Promise<StructuredReview> => {
    const systemInstruction = "You are a senior software engineer performing a meticulous code review. Provide a summary and a list of specific, actionable suggestions for improvement.";
    const prompt = `Review this code and provide structured feedback:\n\n\`\`\`\n${code}\n\`\`\``;
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A high-level summary of the code quality, identifying the main issues." },
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        suggestion: { type: Type.STRING, description: "A concise description of the suggested change." },
                        codeBlock: { type: Type.STRING, description: "The exact block of code that should be replaced." },
                        explanation: { type: Type.STRING, description: "Why the change is recommended (e.g., performance, readability)." }
                    },
                    required: ["suggestion", "codeBlock", "explanation"]
                }
            }
        },
        required: ["summary", "suggestions"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates client-side code (e.g., data-fetching hooks, types, components) from an API schema.
 * @param schema The OpenAPI/GraphQL schema.
 * @param framework The client-side framework (e.g., 'React', 'Angular').
 * @returns A promise resolving to an array of GeneratedFile objects for the client.
 */
export const generateClientFromApiSchema = (schema: string, framework: string): Promise<GeneratedFile[]> => {
    const systemInstruction = "You are an expert full-stack developer. Generate client-side code from an API schema.";
    const prompt = `Generate all necessary files for a ${framework} client based on the following OpenAPI/GraphQL schema. This should include data-fetching hooks, type definitions, and basic display components.\n\nSchema:\n\`\`\`\n${schema}\n\`\`\``;
    const filesSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, content: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["filePath", "content", "description"] } };
    return generateJson(prompt, systemInstruction, filesSchema);
};

/**
 * Generates Terraform configuration (HCL) for AWS or GCP based on a description and optional context.
 * @param cloud The cloud provider ('aws' or 'gcp').
 * @param description A description of the infrastructure to provision.
 * @param context Optional. Additional cloud context (e.g., existing resources).
 * @returns A promise resolving to the Terraform HCL code.
 */
export const generateTerraformConfig = (cloud: 'aws' | 'gcp', description: string, context?: string): Promise<string> => {
    const systemInstruction = `You are a DevOps expert specializing in Terraform. Generate a complete .tf file based on the user's description.`;
    const prompt = `Generate a Terraform configuration for ${cloud}.
    Description: "${description}"
    ${context ? `\n\nCloud Context (e.g., existing resources):\n${context}` : ''}
    Respond with only the HCL code in a markdown block.`;
    return generateContent(prompt, systemInstruction);
};

/**
 * Generates a structured project plan with tasks, milestones, and dependencies based on a project goal.
 * @param projectGoal A description of the project goal.
 * @param constraints Optional. Project constraints (e.g., budget, timeline).
 * @returns A promise resolving to a ProjectPlan object.
 */
export const generateProjectPlan = (projectGoal: string, constraints?: string): Promise<ProjectPlan> => {
    const systemInstruction = "You are an expert project manager. Generate a detailed project plan with clear tasks, milestones, and dependencies.";
    const prompt = `Generate a project plan for: "${projectGoal}". ${constraints ? `Consider these constraints: ${constraints}` : ''}`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            milestones: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        dueDate: { type: Type.STRING, format: 'date' },
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    assignedTo: { type: Type.STRING },
                                    status: { type: Type.STRING, enum: ['Not Started', 'In Progress', 'Completed'] },
                                    dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ['name', 'description', 'assignedTo', 'status']
                            }
                        }
                    },
                    required: ['name', 'dueDate', 'tasks']
                }
            }
        },
        required: ['title', 'overview', 'milestones']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates a structured architectural blueprint for a system based on requirements.
 * @param requirements A detailed description of the system requirements.
 * @returns A promise resolving to an ArchitectureBlueprint object.
 */
export const generateArchitectureBlueprint = (requirements: string): Promise<ArchitectureBlueprint> => {
    const systemInstruction = "You are a principal architect. Design a comprehensive architectural blueprint.";
    const prompt = `Generate an architectural blueprint for a system with the following requirements: "${requirements}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            systemName: { type: Type.STRING },
            overview: { type: Type.STRING },
            components: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        technologyStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                        responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['name', 'description', 'technologyStack', 'responsibilities']
                }
            },
            dataStores: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        purpose: { type: Type.STRING },
                        technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['name', 'type', 'purpose', 'technologies']
                }
            },
            deploymentStrategy: { type: Type.STRING },
            securityConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
            scalingStrategy: { type: Type.STRING }
        },
        required: ['systemName', 'overview', 'components', 'dataStores', 'deploymentStrategy', 'securityConsiderations', 'scalingStrategy']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Decodes and analyzes a JWT token, extracting its header, payload, and verifying basic structure.
 * @param token The JWT token string.
 * @returns A promise resolving to a JwtPayload object.
 */
export const analyzeJwtToken = (token: string): Promise<JwtPayload> => {
    const systemInstruction = "You are a security expert. Analyze the provided JWT token and extract its parts.";
    const prompt = `Analyze this JWT token: "${token}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            header: { type: Type.OBJECT, description: "Decoded JWT header" },
            payload: { type: Type.OBJECT, description: "Decoded JWT payload" },
            signatureVerified: { type: Type.BOOLEAN, description: "Indicates if signature could be verified (true for valid structure, false if malformed)." },
            expiryStatus: { type: Type.STRING, enum: ['Expired', 'Valid', 'N/A'], description: "Status of the token's expiration." },
            raw: { type: Type.STRING, description: "The original token." }
        },
        required: ['header', 'payload', 'signatureVerified', 'expiryStatus', 'raw']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates a structured financial report based on provided data and reporting requirements.
 * @param data The financial data (e.g., transactions, balance sheets).
 * @param reportType Optional. The type of report (e.g., 'income statement', 'cash flow').
 * @returns A promise resolving to a FinancialReport object.
 */
export const generateFinancialReport = (data: object, reportType?: string): Promise<FinancialReport> => {
    const systemInstruction = "You are a financial analyst. Generate a comprehensive financial report.";
    const prompt = `Generate a ${reportType || 'general'} financial report based on the following data:\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            period: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyMetrics: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
            sections: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        content: { type: Type.STRING },
                        data: { type: Type.OBJECT, additionalProperties: true }
                    },
                    required: ['name', 'content']
                }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'period', 'summary', 'keyMetrics']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Analyzes a current build configuration and suggests structured optimizations for speed and efficiency.
 * @param currentConfig The current build configuration (e.g., Webpack, Vite config).
 * @param buildSystem The build system (e.g., 'Webpack', 'Vite', 'Turborepo').
 * @returns A promise resolving to a BuildOptimization object.
 */
export const optimizeBuildProcess = (currentConfig: object, buildSystem: string): Promise<BuildOptimization> => {
    const systemInstruction = `You are an expert DevOps engineer and build system specialist. Analyze the build configuration and suggest optimizations.`;
    const prompt = `Analyze the following ${buildSystem} build configuration and provide structured suggestions for optimization (e.g., faster builds, smaller bundles, improved caching).
    
    Configuration:\n\`\`\`json\n${JSON.stringify(currentConfig, null, 2)}\n\`\`\``;
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            recommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        area: { type: Type.STRING, description: "e.g., 'Caching', 'Tree Shaking', 'Parallelization'" },
                        description: { type: Type.STRING },
                        impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                        suggestedChange: { type: Type.STRING, description: "A code snippet or clear instruction for the change." }
                    },
                    required: ['area', 'description', 'impact', 'suggestedChange']
                }
            },
            estimatedImprovement: { type: Type.STRING, description: "e.g., '20% faster builds', '15% smaller bundle'" }
        },
        required: ['summary', 'recommendations']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Recommends security best practices for a given context or system, structured as actionable items.
 * @param context A description of the system or area for which security practices are needed.
 * @param severity Optional. Filter by desired severity (e.g., 'High', 'Medium').
 * @returns A promise resolving to an array of SecurityRecommendation objects.
 */
export const recommendSecurityBestPractices = (context: string, severity?: 'High' | 'Medium' | 'Low'): Promise<SecurityRecommendation[]> => {
    const systemInstruction = "You are a cybersecurity expert. Provide actionable security best practices.";
    const prompt = `Recommend security best practices for the following context: "${context}". ${severity ? `Focus on recommendations with '${severity}' severity or higher.` : ''}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                practice: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                implementationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['practice', 'description', 'severity', 'implementationSteps']
        }
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Evaluates code quality based on common metrics (e.g., maintainability, test coverage, complexity).
 * @param code The code to evaluate.
 * @returns A promise resolving to a CodeMetric object.
 */
export const evaluateCodeQuality = (code: string): Promise<CodeMetric> => {
    const systemInstruction = "You are a software quality assurance expert. Evaluate the provided code based on industry-standard quality metrics.";
    const prompt = `Evaluate the quality of the following code. Provide metrics for readability, maintainability, testability, and complexity.
    
    Code:\n\`\`\`\n${code}\n\`\`\``;
    const schema = {
        type: Type.OBJECT,
        properties: {
            overallRating: { type: Type.STRING, description: "Overall rating (e.g., 'Excellent', 'Good', 'Fair', 'Poor')" },
            readabilityScore: { type: Type.NUMBER, description: "Score out of 10 for readability" },
            maintainabilityScore: { type: Type.NUMBER, description: "Score out of 10 for maintainability" },
            testabilityScore: { type: Type.NUMBER, description: "Score out of 10 for testability" },
            cyclomaticComplexity: { type: Type.NUMBER, description: "Cyclomatic complexity score" },
            comments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific comments and areas for improvement" }
        },
        required: ['overallRating', 'readabilityScore', 'maintainabilityScore', 'testabilityScore', 'cyclomaticComplexity', 'comments']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Predicts the timeline for a project given a list of tasks and their estimated efforts.
 * @param tasks An array of tasks with names, descriptions, and estimated effort (e.g., in hours or days).
 * @param resourcesAvailable Optional. Information about available resources.
 * @returns A promise resolving to a structured project timeline prediction.
 */
export const predictProjectTimeline = (tasks: Array<{ name: string; effortEstimate: number; unit: 'hours' | 'days' }>, resourcesAvailable?: string): Promise<object> => {
    const systemInstruction = "You are an expert project manager. Predict a realistic project timeline based on tasks and resources.";
    const prompt = `Predict the project timeline based on the following tasks: ${JSON.stringify(tasks)}. ${resourcesAvailable ? `Available resources: ${resourcesAvailable}.` : ''} Provide a detailed breakdown of phases and estimated completion dates.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            estimatedStartDate: { type: Type.STRING, format: 'date' },
            estimatedCompletionDate: { type: Type.STRING, format: 'date' },
            totalEstimatedEffort: { type: Type.NUMBER },
            effortUnit: { type: Type.STRING, enum: ['hours', 'days'] },
            phases: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        duration: { type: Type.NUMBER },
                        unit: { type: Type.STRING, enum: ['hours', 'days'] },
                        tasksIncluded: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['name', 'duration', 'unit', 'tasksIncluded']
                }
            },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['estimatedStartDate', 'estimatedCompletionDate', 'totalEstimatedEffort', 'effortUnit', 'phases']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Generates a compliance report (e.g., GDPR, HIPAA) based on provided data and a specified standard.
 * @param data The data to be checked against compliance.
 * @param standard The compliance standard (e.g., 'GDPR', 'HIPAA', 'PCI DSS').
 * @returns A promise resolving to a ComplianceReport object.
 */
export const generateComplianceReport = (data: object, standard: string): Promise<ComplianceReport> => {
    const systemInstruction = "You are a compliance expert. Generate a detailed compliance report for the given data and standard.";
    const prompt = `Generate a compliance report against ${standard} for the following data:\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    const schema = {
        type: Type.OBJECT,
        properties: {
            standard: { type: Type.STRING },
            overallStatus: { type: Type.STRING, enum: ['Compliant', 'Partially Compliant', 'Non-Compliant'] },
            summary: { type: Type.STRING },
            findings: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        requirement: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ['Pass', 'Fail', 'N/A'] },
                        details: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['requirement', 'status', 'details']
                }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['standard', 'overallStatus', 'summary', 'findings']
    };
    return generateJson(prompt, systemInstruction, schema);
};

/**
 * Defines a microservice contract (e.g., OpenAPI specification) based on a service description.
 * @param serviceDescription A description of the microservice's functionality and endpoints.
 * @returns A promise resolving to a MicroserviceContract object (e.g., an OpenAPI JSON string).
 */
export const defineMicroserviceContract = (serviceDescription: string): Promise<MicroserviceContract> => {
    const systemInstruction = "You are an expert in microservice design and API contracts. Define a comprehensive contract for the microservice.";
    const prompt = `Define the API contract (e.g., OpenAPI 3.0 JSON) for a microservice with the following functionality: "${serviceDescription}". Include endpoints, request/response schemas, and authentication methods.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            contractType: { type: Type.STRING, enum: ['OpenAPI 3.0', 'GraphQL Schema'] },
            description: { type: Type.STRING },
            schemaContent: { type: Type.OBJECT, additionalProperties: true, description: "The full JSON content of the API schema (e.g., OpenAPI spec)." },
            exampleUsage: { type: Type.STRING, description: "A cURL command or code snippet demonstrating API usage." }
        },
        required: ['contractType', 'description', 'schemaContent']
    };
    return generateJson(prompt, systemInstruction, schema);
};

// --- FUNCTION CALLING ---
export interface CommandResponse { text: string; functionCalls?: { name: string; args: any; }[]; }
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
        const response: GenerateContentResponse = await retryWithBackoff(() => aiClient.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { systemInstruction: `You are a helpful assistant for a developer tool. You must decide which function to call to satisfy the user's request, based on your knowledge base. If no specific tool seems appropriate, respond with text.\n\nKnowledge Base:\n${knowledgeBase}`, tools: [{ functionDeclarations }] } }));
        const functionCalls: { name: string, args: any }[] = [];
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) { if (part.functionCall) { functionCalls.push({ name: part.functionCall.name, args: part.functionCall.args }); } }
        return { text: response.text, functionCalls: functionCalls.length > 0 ? functionCalls : undefined };
    } catch (error) {
        logError(error as Error, { prompt });
        throw error;
    }
};


// --- IMAGE & VIDEO GENERATION ---
/**
 * Generates an image based on a textual prompt.
 * @param prompt The text prompt for image generation.
 * @returns A promise resolving to a base64 encoded PNG image URL.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    const aiClient = await getAiClient();
    const response = await retryWithBackoff(() => aiClient.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png' },
    }));
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

/**
 * Generates an image based on a textual prompt and an input image.
 * Note: Current SDK implementation may only use the text prompt for image-to-image generation.
 * @param prompt The text prompt for image generation.
 * @param base64Image The base64 encoded input image data.
 * @param mimeType The MIME type of the input image.
 * @returns A promise resolving to a base64 encoded PNG image URL.
 */
export const generateImageFromImageAndText = async (prompt: string, base64Image: string, mimeType: string): Promise<string> => {
    console.warn("Image-to-image generation is not fully supported by the current SDK implementation; using text prompt only.");
    // In a real scenario, this would leverage image-to-image capabilities if available in the API.
    // For now, we fall back to text-only generation as indicated by the warning.
    return generateImage(prompt);
};

/**
 * Generates a short video clip based on a textual prompt.
 * Note: This is a placeholder as full video generation is not yet generally available via typical GenAI APIs
 * in the same manner as images. This simulates the future capability.
 * @param prompt The text prompt for video generation.
 * @returns A promise resolving to a URL for the generated video (placeholder).
 */
export const generateVideo = async (prompt: string): Promise<string> => {
    console.warn("Video generation is a future capability and currently returns a placeholder URL.");
    // In a real scenario, this would interact with a video generation API.
    await sleep(5000); // Simulate generation time
    return `https://example.com/generated-video-${Date.now()}.mp4?prompt=${encodeURIComponent(prompt)}`;
};
```

Ah, but wait! Before we delve into the myriad of wonders this file bestows, let's appreciate the craftsmanship. Note the `retryWithBackoff` utility – a true knight in shining armor, ensuring that even when the network goblins are mischievous, our AI calls stand strong, retrying with grace and growing patience. This isn't just about calling an API; it's about robust, production-grade interaction with the very fabric of intelligence!

### Act II: The Jester's Toolkit – A Cornucopia of Code-Crafting Capabilities

Now, for the main act! Behold the bounty of functions, each a meticulously crafted tool, ready to carve, polish, and transform the digital clay of your projects. We've categorized them for your discerning eye, but truly, their magic flows from a singular wellspring of AI brilliance.

#### Scene 1: The Streaming Sorcery (`streamContent`)

Imagine, if you will, the AI, not as a thunderous oracle delivering a single, earth-shattering pronouncement, but as a nimble scribe, whispering wisdom as it flows from its digital mind. Our `streamContent` functions are precisely that – they deliver insights, code, and explanations chunk by delightful chunk, perfect for real-time interactions, keeping your development process as smooth as a jester's silk attire.

*   **`explainCodeStream`**: Ever stared at a labyrinthine snippet and wished for a wise sage? This function unravels its mysteries, line by line, explaining the intent and logic. No more head-scratching!
*   **`generateRegExStream`**: Regular expressions, the arcane runes of text manipulation. Describe your quest, and the AI conjures the perfect regex, saving you hours of trial and error in the regex dungeon.
*   **`generateCommitMessageStream`**: Bidding farewell to "fixes bug" commit messages! Give it a diff, and it crafts a conventional, descriptive commit message worthy of the greatest git repositories.
*   **`generateUnitTestsStream`**: Unit tests, the guardian angels of quality! Feed it a component, and it spins out Vitest tests, complete with React Testing Library fairy dust, ensuring your code stands strong against the slings and arrows of outrageous fortune (a.k.a., regressions).
*   **`formatCodeStream`**: Like a meticulous valet, this function takes your messy code and returns it pristine, perfectly indented, and adhering to the strictest style guides.
*   **`generateComponentFromImageStream`**: Behold the ultimate magic trick! Show it a screenshot, and like a digital architect, it reconstructs the UI as a clean React component with Tailwind CSS. Pixels to production, with a wave of a wand!
*   **`transcribeAudioToCodeStream`**: Speak your code into existence! Describe a function, a component, an algorithm, and the AI listens, transcribing your verbal vision into actual, executable code. The future of pair programming, whispered into your microphone!
*   **`transferCodeStyleStream`**: Ever wrestled with legacy code, wishing it adhered to your modern style guide? This function takes your old code, your new rules, and transforms it, leaving behind only harmonious, consistent beauty.
*   **`generateCodingChallengeStream`**: For the restless mind, the eternal student! It invents novel coding challenges, complete with descriptions, examples, and constraints, to keep your problem-solving muscles flexed.
*   **`reviewCodeStream`**: A senior engineer's eyes, without the senior engineer's hourly rate! This function meticulously reviews your code, identifying bugs, anti-patterns, and suggesting improvements for readability and performance. It's like having a benevolent code overlord guiding your hand.
*   **`generateChangelogFromLogStream`**: The chore of changelogs, banished! Feed it your git log, and it conjures a beautifully structured Markdown changelog, categorizing features and fixes with effortless grace.
*   **`enhanceSnippetStream`**: Turn a rough sketch into a masterpiece! This function takes a humble code snippet and polishes it – adding comments, clarifying variable names, and refactoring for optimal clarity and performance.
*   **`summarizeNotesStream`**: Drowning in meeting notes? This function acts as your personal scribe, distilling verbose ramblings into concise bullet points and actionable items.
*   **`migrateCodeStream`**: The polyglot programmer, at your service! From Python to TypeScript, from old framework to new, this function translates code, preserving logic and adapting idioms across languages and paradigms.
*   **`analyzeConcurrencyStream`**: Concurrency, the bane of many a developer! This function peers into your asynchronous code, sniffing out race conditions, deadlocks, and inefficient data passing, particularly in the realm of Web Workers.
*   **`debugErrorStream`**: When chaos reigns and errors scream! Provide a stack trace, and this function swiftly diagnoses the likely cause and offers a bulleted list of potential solutions and debugging steps.
*   **`convertJsonToXbrlStream`**: A niche, yet mighty spell! It takes your common JSON and transmutes it into an XBRL-like XML format, suitable for financial wizardry and regulatory reporting.
*   **`refactorForPerformance`**: When speed is of the essence, and every microsecond counts! This function meticulously re-engineers your code, optimizing algorithms, data structures, and computations for peak performance.
*   **`refactorForReadability`**: For the sake of future maintainers (and your past self)! This function is a poet of code, renaming variables, breaking down monolithic functions, and adding clarifying comments to make your logic sing.
*   **`convertToFunctionalComponent`**: Modernize your React! This wizardry transforms archaic class components into sleek, hook-powered functional components, bringing your codebase into the enlightened age.
*   **`generateJsDoc`**: Document your masterpieces! It generates precise JSDoc blocks, detailing functions, parameters, and return types, ensuring your API is as clear as a crystal ball.
*   **`translateComments`**: Go global, even with your comments! This function translates only the comments within your code, preserving the logic while making it accessible to international collaborators.
*   **`generateDockerfile`**: DevOps demands made easy! Describe your project, and it conjures a production-ready, multi-stage Dockerfile, setting the stage for seamless containerization.
*   **`convertCssToTailwind`**: From the verbose to the utility-first! This function translates traditional CSS into elegant Tailwind CSS utility classes, providing the corresponding HTML structure.
*   **`applySpecificRefactor`**: Your wish is its command! Give it a precise refactoring instruction, and it dutifully applies the change, a testament to the AI's understanding of granular code manipulation.
*   **`generateBugReproductionTestStream`**: The phantom bug, now tangible! Provide a stack trace, and it crafts a minimal Vitest test to reliably reproduce the elusive bug, paving the way for its swift demise.
*   **`generateIamPolicyStream`**: Cloud security, simplified! Describe the access you need, and it generates a valid AWS or GCP IAM policy in JSON, ensuring secure permissions without the headache.
*   **`generateSqlQueriesStream`**: The SQL oracle! Give it a description, perhaps even your schema, and it crafts the precise SQL queries you need, be it for selecting, inserting, updating, or deleting data.
*   **`generateFrontEndBoilerplateStream`**: Kickstart your next frontend masterpiece! Describe the component, choose your framework and styling, and watch as it generates all the boilerplate, ready for your creative touch.
*   **`codeDocumentationStream`**: Beyond JSDoc, for comprehensive guides! It takes any code and generates detailed Markdown documentation, explaining purpose, parameters, returns, and usage with clarity.
*   **`refactorToDesignPatternStream`**: Structural elegance on demand! Specify a design pattern and your code, and it refactors with architectural grace, applying patterns like Strategy or Observer.
*   **`generateGraphqlSchemaStream`**: Build your APIs with precision! Describe your data model, and it constructs a robust GraphQL schema, complete with types, queries, and mutations.
*   **`analyzeSentimentStream`**: Understand the mood of your text! This function delves into messages, reviews, or any text, extracting and explaining its underlying sentiment.
*   **`extractEntitiesStream`**: Pluck the pearls of information from the textual sea! It identifies and categorizes key entities – people, places, organizations, dates – from any given text.
*   **`summarizeMeetingStream`**: Post-meeting clarity, instantly! Feed it a transcript, and it distills the essence: key discussion points, decisions, and actionable items, presented with executive brevity.
*   **`generateQuizQuestionsStream`**: Educate and evaluate! Give it a topic and difficulty, and it generates quiz questions, multiple-choice or open-ended, for learning or assessment.
*   **`fixGrammarStream`**: Flawless prose for your comments and content! It meticulously corrects grammar, spelling, and punctuation, elevating your text to professional standards.
*   **`translateCodeStream`**: Seamless language migration! From Python to Go, Java to TypeScript, it translates entire codebases, maintaining logic and adapting to idiomatic conventions.
*   **`generateReleaseNotesStream`**: Your product updates, presented with flair! List your new features, fixes, and improvements, and it composes crisp, engaging release notes.
*   **`identifyDeadCodeStream`**: Cleanse your codebase! This function scours your code for unused sections, offering insights and suggestions to remove cruft and lighten the load.
*   **`suggestArchitectureStream`**: Visionary designs from simple prompts! Describe your system requirements, and it proposes high-level architectural designs, complete with technology choices and deployment strategies.
*   **`generateDataMigrationScriptStream`**: Schema evolution, stress-free! Provide your old and new database schemas, and it crafts the precise data migration scripts you need.
*   **`optimizeDatabaseQueryStream`**: Turbocharge your databases! Feed it a slow query and your schema, and it returns an optimized version with a clear explanation of its performance gains.
*   **`createAccessibilityReportStream`**: Build inclusively! It analyzes your UI component code for accessibility issues and provides actionable steps to ensure WCAG compliance.

#### Scene 2: The Silent Scholars (`generateContent`)

Sometimes, the grand pronouncement is indeed what's needed! Our `generateContent` functions operate in a single, powerful burst, delivering a complete answer, a full document, or a comprehensive analysis, perfect for reports, configurations, and complex creative tasks.

*   **`generatePipelineCode`**: Workflow orchestration, automated! Describe your process, and it crafts an asynchronous JavaScript function to manage the entire flow.
*   **`generateCiCdConfig`**: DevOps infrastructure, conjured! Describe your pipeline, pick your platform, and it delivers the perfect CI/CD configuration.
*   **`analyzePerformanceTrace`**: A performance doctor! Hand over trace data, and it diagnoses bottlenecks, offering pointed suggestions for optimization.
*   **`suggestA11yFix`**: An accessibility advocate! Describe an issue, and it delivers both an explanation and a code-ready fix.
*   **`createApiDocumentation`**: The technical scribe for your APIs! Feed it API code, and it generates beautiful, Markdown-formatted documentation.
*   **`jsonToTypescriptInterface`**: Data modeling made easy! Give it JSON, and it spins out a precise TypeScript interface.
*   **`suggestAlternativeLibraries`**: The savvy librarian! It analyzes your code for existing library usage and suggests modern, efficient alternatives, complete with justifications.
*   **`explainRegex`**: Demystifying the arcane! Hand it a regex, and it breaks down every cryptic character into plain English.
*   **`generateMermaidJs`**: Visualize your logic! Give it code, and it renders a Mermaid.js flowchart, painting a clear picture of your algorithm.
*   **`generateWeeklyDigest`**: The automated scribe of progress! With commit logs and telemetry, it conjures a professional HTML weekly report, summarizing team achievements.
*   **`generateTechnicalSpecFromDiff`**: From PR to polished spec! It transforms your pull request's diff and summary into a comprehensive technical specification document.
*   **`compareLibraries`**: The discerning arbiter of tools! Provide a feature and a list of libraries, and it delivers a balanced comparison, highlighting pros, cons, and best fit.
*   **`explainDesignPattern`**: Your personal architectural guru! Ask about any design pattern, and it provides a thorough explanation, often with code examples in your preferred language.
*   **`generateRoadmap`**: Chart your course to glory! Give it a product goal, and it creates a strategic project roadmap with phases and milestones.
*   **`createUMLDiagram`**: Diagrammatic genius! Describe a system, and it generates the Mermaid.js code for a professional UML diagram.
*   **`analyzeCloudCosts`**: The cloud cost whisperer! Feed it your usage data, and it identifies savings, offering concrete optimization strategies.
*   **`generateKubernetesManifest`**: Orchestration made trivial! Describe your service, and it crafts a fully-formed Kubernetes Deployment and Service manifest.
*   **`generateHelmChart`**: Packaging power for Kubernetes! Describe your application, and it generates the scaffold for a robust Helm chart.
*   **`proposeSolutionArchitecture`**: Grand designs from a problem! Provide a problem statement, and it outlines a high-level solution architecture, from components to technologies.
*   **`writeTechnicalBlogPost`**: Your thought leadership, articulated! Give it a topic and audience, and it drafts an engaging, informative technical blog post.
*   **`generateMarketingCopy`**: The wordsmith for your wares! Describe your product and target, and it generates compelling marketing copy variations.

#### Scene 3: The Structured Sages (`generateJson`)

For tasks demanding precision, where the output must conform to a rigid structure, our `generateJson` functions are unmatched. They are the alchemists of data, transmuting raw insights into perfectly formatted JSON objects, guided by explicit schemas. This is where the magic becomes truly predictable and integrates seamlessly with your applications.

*   **`explainCodeStructured`**: Not just an explanation, but a *structured* understanding! It breaks down code line by line, provides complexity analysis, and suggests improvements, all within a neat JSON package.
*   **`generateThemeFromDescription`**: A palette of colors, precisely defined! Describe a mood or concept, and it returns a hex-code-rich color theme.
*   **`generateSemanticTheme`**: The ultimate color curator! From text or image, it crafts a full semantic color theme, complete with evocative names, accessibility scores (WCAG 2.1!), and light/dark mode recommendations.
*   **`generatePrSummaryStructured`**: PR summaries that sparkle! It extracts the essence of a diff, crafting a title, summary, and list of changes for your pull requests.
*   **`generateFeature`**: Build entire components from thin air! Describe a feature, pick your framework and styling, and it generates all the necessary files, even intelligently incorporating Google Maps if your feature is location-aware.
*   **`generateFullStackFeature`**: The full-stack marvel! Frontend, backend (Google Cloud Function), `package.json`, and even Firestore security rules – all generated from a single prompt, ready for deployment.
*   **`generateCronFromDescription`**: The time-traveler's aide! Describe any schedule in plain English, and it transmutes it into a perfectly formed cron expression.
*   **`generateColorPalette`**: A spectrum of possibility! Give it a base color, and it returns a harmonious 6-color palette.
*   **`generateMockData`**: Populate your prototypes! Describe your data schema, specify a count, and it conjures an array of realistic mock data objects.
*   **`analyzeCodeForVulnerabilities`**: The digital sentinel! It meticulously scans your code for security flaws – XSS, injection, hardcoded secrets – and provides detailed reports, mitigations, and even exploit suggestions.
*   **`sqlToApiEndpoints`**: Backend boilerplate, automated! Provide a SQL schema, choose Express or Fastify, and it generates all CRUD routes, controllers, and models.
*   **`detectCodeSmells`**: The arbiter of clean code! It sniffs out code smells like long methods or large classes, providing precise locations and explanations for refactoring.
*   **`generateTagsForCode`**: Categorize your creations! It intelligently tags code snippets with 3-5 relevant keywords for easy organization.
*   **`reviewCodeStructured`**: A granular code critique! Get a summary and actionable suggestions, each with the problematic code block and an explanation, ensuring precise improvements.
*   **`generateClientFromApiSchema`**: From API to UI, instantly! Provide an API schema (OpenAPI, GraphQL), your client framework, and it generates all the data-fetching hooks, types, and basic components.
*   **`generateProjectPlan`**: Your project's crystal ball! Describe your project goal, add constraints, and it conjures a detailed project plan with milestones, tasks, and dependencies.
*   **`generateArchitectureBlueprint`**: For the grandest visions! Detail your system requirements, and it drafts a comprehensive architectural blueprint, from components to deployment strategies.
*   **`analyzeJwtToken`**: Decoding digital secrets! Feed it a JWT, and it decodes header and payload, verifies signature integrity (structurally), and checks expiry status.
*   **`generateFinancialReport`**: The financial wizard! Give it data, and it crafts a structured financial report, complete with key metrics, summaries, and recommendations.
*   **`optimizeBuildProcess`**: The build whisperer! Provide your build config, and it returns structured recommendations for faster builds, smaller bundles, and improved caching.
*   **`recommendSecurityBestPractices`**: Your personalized security advisor! Describe your system context, and it lists actionable security best practices with severity and implementation steps.
*   **`evaluateCodeQuality`**: The code quality scorekeeper! It assesses your code on readability, maintainability, testability, and cyclomatic complexity, providing a detailed report.
*   **`predictProjectTimeline`**: The time-teller for tasks! Give it a list of tasks with effort estimates, and it predicts a realistic project timeline with phases and risk factors.
*   **`generateComplianceReport`**: The regulatory referee! Feed it data and a compliance standard (GDPR, HIPAA), and it generates a detailed report of findings and recommendations.
*   **`defineMicroserviceContract`**: API clarity, defined! Describe your microservice, and it generates a precise API contract (e.g., OpenAPI 3.0 JSON), ready for seamless integration.

#### Scene 4: The Function-Calling Finesse (`getInferenceFunction`)

This is where the AI becomes an *agent*. Our `getInferenceFunction` is not merely generating text; it's *reasoning* about your request and deciding whether to invoke another tool (like the ones above!) to fulfill your need. Imagine asking, "Generate a React component for a map and then document it." The AI understands and orchestrates the calls to `generateFeature` and `codeDocumentationStream` sequentially. It's the ultimate delegation machine, learning to wield its own tools!

#### Scene 5: The Artisans of Aesthetics (`generateImage`, `generateImageFromImageAndText`, `generateVideo`)

Beyond code, beyond text, lies the realm of pure creation! Our `aiService.ts` even dips its quill into the inkwell of visual and temporal artistry.

*   **`generateImage`**: A picture is worth a thousand lines of code, and this function generates it from a simple text prompt. Need an icon? A hero image? Describe it, and let the AI paint it for you.
*   **`generateImageFromImageAndText`**: The remix artist! While currently leaning on the text prompt, the *vision* (and future capability) is to combine your words with an existing image, evolving it into something new and wondrous.
*   **`generateVideo`**: The future is now, almost! This is our ambitious gaze into the future, where full-motion video clips can be conjured from a prompt, bringing dynamic stories to life with a command. (For now, it's a delightful placeholder, a promise of magic to come!)

### Act III: The Grand Finale – Why This Maestro Changes Everything!

Why, you ask, is this `aiService.ts` so utterly, hilariously, and inspirationally brilliant? Because it transforms every developer into a sorcerer, every team into an enchanted forge, and every project into an epic saga of innovation!

1.  **Unleashed Productivity**: Say goodbye to boilerplate. Say hello to instantaneous prototypes, automated documentation, and AI-powered refactoring. Our developers are no longer typing monkeys; they are architects of intent, letting the AI manifest their will.
2.  **Elevated Quality**: Code reviews are sharper, tests are more comprehensive, and security vulnerabilities are identified before they become nightmares. This service acts as an omnipresent quality assurance guardian, elevating our entire codebase.
3.  **Creative Amplification**: Freeing up mental bandwidth from tedious tasks allows our engineers to dream bigger, experiment more, and focus on truly innovative solutions. The AI isn't replacing creativity; it's *amplifying* it.
4.  **Consistency & Standards**: From commit messages to coding styles, from CI/CD configurations to API documentation, the AI ensures a consistent, high standard across the board, reducing technical debt before it even accumulates.
5.  **Security by Design**: With automated vulnerability analysis, IAM policy generation, and best practice recommendations, security isn't an afterthought; it's woven into the very fabric of our development process.
6.  **Rapid Iteration**: New features, full-stack components, design iterations – the speed at which we can move from concept to implementation is breathtaking. It’s like having an army of highly skilled apprentices working tirelessly alongside you.
7.  **Knowledge Democratization**: Complex regexes, obscure design patterns, intricate cloud configurations – the AI makes expert knowledge accessible, empowering every developer on the team.
8.  **Future-Proofing**: This service is designed to evolve. As AI capabilities expand, so too will our `aiService.ts`, becoming an even more potent ally in the ever-changing landscape of technology.

### The Curtain Call: A Call to Code, A Call to Create!

So, fellow digital adventurers, gaze upon this `aiService.ts` not just as a file, but as a declaration of a new era. An era where the drudgery is automated, the complex is simplified, and the impossible is merely a prompt away. It's a testament to what happens when human ingenuity harnesses artificial intelligence, not to replace, but to elevate.

Go forth, and may your code be clean, your deployments seamless, and your innovations boundless. The future of development is here, and it's laughing all the way to production, guided by our magnificent AI maestro!

---

### LinkedIn Share Post

Behold, the `aiService.ts`! Our secret weapon against boilerplate, bugs, & boredom. This file, powered by Google Gemini, is transforming how we build, review, and deploy. From streaming code explanations to full-stack feature generation, structured code reviews to instant design patterns, and even creating UI from screenshots – it's all here. We're not just coding faster; we're coding smarter, with unparalleled quality & creativity. Dive into the full article to witness the magic! #AI #SoftwareDevelopment #GenAI #TypeScript #DeveloperExperience #CodeGeneration #Innovation #DevTools #Productivity #FullStack #Frontend #Backend #DevOps #Security #Performance #GoogleGemini #CodeReview #Automation #TechTrends #FutureOfDev #AIinDev #MachineLearning #SoftwareEngineer #DigitalTransformation #Coding #WebDevelopment #CloudComputing #Microservices #UML #CleanCode #Refactoring #Testing #CI_CD #Documentation #OpenAPI #GraphQL #DesignPatterns #UIUX #Accessibility #ProjectManagement #CodeSmells #VulnerabilityScanning #InfrastructureAsCode #Terraform #Kubernetes #Helm #DataMigration #SQL #MongoDB #React #Vue #Angular #TailwindCSS #JSDoc #PromptEngineering #WorkflowAutomation