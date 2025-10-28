/**
 * @file services/aiService.ts
 * @module services/ai
 * @description This module defines the client-side service layer for all AI interactions,
 *              adhering to the new federated microservice architecture. It completely abstracts
 *              the backend communication, replacing direct SDK calls with authenticated GraphQL
 *              requests to the Backend-for-Frontend (BFF).
 *
 *              All direct AI model interactions, prompt construction, and secret management are
 *              now handled server-side by the AIGatewayService, invoked by the BFF. This client-side
 *              service is a thin, secure adapter.
 * @see {AuthGateway} - All requests are authenticated via JWTs managed by the AuthGateway.
 * @see {WorkerPoolManager} - Heavy computations like prompt assembly are offloaded to web workers.
 */

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
  CommandResponse,
  ProjectPlan,
  ArchitectureBlueprint,
  JwtPayload,
  FinancialReport,
  BuildOptimization,
  SecurityRecommendation,
  CodeMetric,
  ComplianceReport,
  MicroserviceContract
} from '../types';

// --- BFF API Client (Conceptual) ---
// In a real application, this would be an injected service (e.g., using Inversify)
// that uses a library like Apollo Client or urql. It would also handle JWT attachment automatically.
const bffApiClient = {
  async request<T>(query: string, variables: Record<string, any>): Promise<T> {
    const token = sessionStorage.getItem('app_jwt'); // Placeholder for getting the auth token
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`BFF Request failed: ${response.statusText}`);
    }
    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL Error: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }
    return result.data;
  },

  async *streamRequest(query: string, variables: Record<string, any>): AsyncGenerator<string> {
    // This is a mock of a streaming response, e.g., via Server-Sent Events (SSE) or GraphQL subscriptions.
    // A real implementation would be more complex.
    console.log("Streaming query to BFF:", { query, variables });
    const mockResponse = `This is a streamed response from the mocked BFF for the prompt about ${variables.prompt || 'your topic'}`;
    for (const word of mockResponse.split(' ')) {
        await new Promise(r => setTimeout(r, 50));
        yield word + ' ';
    }
  }
};


// --- Unified AI Helpers (BFF Wrappers) ---

export async function* streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature = 0.5): AsyncGenerator<string> {
    const query = `
        subscription StreamAiContent($prompt: JSON!, $systemInstruction: String, $temperature: Float) {
            streamAiContent(prompt: $prompt, systemInstruction: $systemInstruction, temperature: $temperature)
        }
    `;
    try {
        const stream = bffApiClient.streamRequest(query, { prompt, systemInstruction, temperature });
        for await (const chunk of stream) {
            yield chunk;
        }
    } catch (error) {
        logError(error as Error, { prompt, systemInstruction });
        yield `\n\n**Error:** An error occurred while communicating with the AI service: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

export async function generateContent(prompt: string, systemInstruction: string, temperature = 0.5): Promise<string> {
    const mutation = `
        mutation GenerateAiContent($prompt: String!, $systemInstruction: String, $temperature: Float) {
            generateAiContent(prompt: $prompt, systemInstruction: $systemInstruction, temperature: $temperature)
        }
    `;
    try {
        const response = await bffApiClient.request<{ generateAiContent: string }>(mutation, { prompt, systemInstruction, temperature });
        return response.generateAiContent;
    } catch (error) {
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

export async function generateJson<T>(prompt: any, systemInstruction: string, schema: any, temperature = 0.2): Promise<T> {
    const mutation = `
        mutation GenerateAiJson($prompt: JSON!, $systemInstruction: String, $schemaJson: String!, $temperature: Float) {
            generateAiJson(prompt: $prompt, systemInstruction: $systemInstruction, schemaJson: $schemaJson, temperature: $temperature)
        }
    `;
    try {
        const response = await bffApiClient.request<{ generateAiJson: T }>(mutation, {
            prompt,
            systemInstruction,
            schemaJson: JSON.stringify(schema),
            temperature,
        });
        return response.generateAiJson;
    } catch (error) {
        logError(error as Error, { prompt, systemInstruction });
        throw error;
    }
}

export const generateAppFeatureComponent = (prompt: string): Promise<Omit<CustomFeature, 'id'>> => {
    const systemInstruction = "You are an expert software developer creating a new, self-contained React functional component... Respond with only a JSON object.";
    const validIcons = "CommandCenterIcon, CodeExplainerIcon, FeatureBuilderIcon, ...";

    const schema = {
        type: 'object',
        properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            code: { type: 'string' }
        },
        required: ["name", "description", "icon", "code"]
    };
    
    const fullPrompt = `Based on the user request, generate a new feature component.\n\nUser Request: "${prompt}"\n\nValid Icon Names: ${validIcons}.`;
    return generateJson(fullPrompt, systemInstruction, schema);
};

// --- Unified Feature Functions (Streaming) ---

export const explainCodeStream = (code: string) => streamContent(`Explain code: ${code}`, "Expert code explainer.");
export const generateRegExStream = (description: string) => streamContent(`Generate regex for: ${description}`, "Regex expert.");
export const generateCommitMessageStream = (diff: string) => streamContent(`Generate commit message for diff: ${diff}`, "Conventional commit expert.");
export const generateUnitTestsStream = (code: string) => streamContent(`Generate Vitest tests for: ${code}`, "Vitest expert.");
export const formatCodeStream = (code: string) => streamContent(`Format code: ${code}`, "Code formatter.");
export const generateComponentFromImageStream = (base64Image: string) => streamContent({ parts: [{ text: "Generate component from image" }, { inlineData: { mimeType: 'image/png', data: base64Image } }] }, "React/Tailwind expert.");
export const transcribeAudioToCodeStream = (base64Audio: string, mimeType: string) => streamContent({ parts: [{ text: "Transcribe to code" }, { inlineData: { mimeType, data: base64Audio } }] }, "Code transcription expert.");
export const transferCodeStyleStream = (args: { code: string, styleGuide: string }) => streamContent(`Transfer style for code: ${args.code} with guide: ${args.styleGuide}`, "Code style transfer expert.");
export const generateCodingChallengeStream = (_: any) => streamContent(`Generate a coding challenge.`, "Coding challenge creator.");
export const reviewCodeStream = (code: string, systemInstruction?: string) => streamContent(`Review code: ${code}`, systemInstruction || "Expert code reviewer.");
export const generateChangelogFromLogStream = (log: string) => streamContent(`Generate changelog from log: ${log}`, "Git expert.");
export const enhanceSnippetStream = (code: string) => streamContent(`Enhance snippet: ${code}`, "Code enhancement expert.");
export const summarizeNotesStream = (notes: string) => streamContent(`Summarize notes: ${notes}`, "Productivity assistant.");
export const migrateCodeStream = (code: string, from: string, to: string) => streamContent(`Migrate code from ${from} to ${to}: ${code}`, "Polyglot programmer.");
export const analyzeConcurrencyStream = (code: string) => streamContent(`Analyze concurrency in JS: ${code}`, "JS concurrency expert.");
export const debugErrorStream = (error: Error) => streamContent(`Debug error: ${error.message}\n${error.stack}`, "React debugging expert.");
export const convertJsonToXbrlStream = (json: string) => streamContent(`Convert JSON to XBRL: ${json}`, "Data format expert.");
export const refactorForPerformance = (code: string) => streamContent(`Refactor for performance: ${code}`, "Performance optimization expert.");
export const refactorForReadability = (code: string) => streamContent(`Refactor for readability: ${code}`, "Clean code expert.");
export const convertToFunctionalComponent = (classComponent: string) => streamContent(`Convert to functional component: ${classComponent}`, "React modernization expert.");
export const generateJsDoc = (code: string) => streamContent(`Generate JSDoc for: ${code}`, "JSDoc expert.");
export const getSolutionFeedbackStream = (challengeDescription: string, userSolution: string) => streamContent(`Get feedback for solution to challenge: ${challengeDescription}\nSolution: ${userSolution}`, "Programming instructor.");
export const generateCiCdConfigStream = (platform: string, description: string) => streamContent(`Generate CI/CD config for ${platform}: ${description}`, "DevOps expert.");

// --- Simple Generate Content (non-streaming) ---

export const generateBugReproductionTest = (stackTrace: string, context?: string): Promise<string> => generateContent(`Generate bug reproduction test for stack trace: ${stackTrace}\nContext: ${context || 'none'}`, "Debugging and testing expert.");
export const generateIamPolicy = (description: string, platform: 'aws' | 'gcp'): Promise<string> => generateContent(`Generate ${platform} IAM policy for: ${description}`, "Cloud security expert.");
export const suggestFontPairing = (description: string): Promise<{ headingFont: string; bodyFont: string; reasoning: string; }> => generateJson(`Suggest font pairing for: ${description}`, "UI/UX typography expert.", { type: 'object', properties: { headingFont: { type: 'string' }, bodyFont: { type: 'string' }, reasoning: { type: 'string' } } });
export const explainCronExpression = (cronExpression: string): Promise<string> => generateContent(`Explain cron: ${cronExpression}`, "Cron expert.");
export const applySpecificRefactor = (code: string, instruction: string): Promise<string> => generateContent(`Refactor code: ${code}\nInstruction: ${instruction}`, "AI refactoring assistant.");

// --- STRUCTURED JSON ---

export const explainCodeStructured = (code: string): Promise<StructuredExplanation> => generateJson(`Analyze code: ${code}`, "Expert code analyst.", { type: 'object', properties: { summary: { type: 'string' }, lineByLine: { type: 'array' }, complexity: { type: 'object' }, suggestions: { type: 'array' } } });
export const generateSemanticTheme = (prompt: { parts: any[] }): Promise<SemanticColorTheme> => generateJson(prompt, "UI/UX design expert for themes.", { type: 'object', properties: { mode: { type: 'string' }, palette: { type: 'object' }, theme: { type: 'object' }, accessibility: { type: 'object' } } });
export const generatePrSummaryStructured = (diff: string): Promise<StructuredPrSummary> => generateJson(`Generate PR summary for diff: ${diff}`, "Git expert.", { type: 'object', properties: { title: { type: 'string' }, summary: { type: 'string' }, changes: { type: 'array' } } });
export const generateFullStackFeature = (prompt: string, framework: string, styling: string): Promise<GeneratedFile[]> => generateJson(`Generate full stack feature for: ${prompt}, framework: ${framework}, styling: ${styling}`, "Full-stack AI developer.", { type: 'array' });
export const generateCronFromDescription = (description: string): Promise<CronParts> => generateJson(`Generate cron from: ${description}`, "Cron expert.", { type: 'object', properties: { minute: { type: 'string' }, hour: { type: 'string' }, dayOfMonth: { type: 'string' }, month: { type: 'string' }, dayOfWeek: { type: 'string' } } });
export const analyzeCodeForVulnerabilities = (code: string): Promise<SecurityVulnerability[]> => generateJson(`Analyze for vulnerabilities: ${code}`, "Security expert.", { type: 'array' });
export const detectCodeSmells = (code: string): Promise<CodeSmell[]> => generateJson(`Detect code smells in: ${code}`, "Code quality expert.", { type: 'array' });

// --- FUNCTION CALLING ---
export const getInferenceFunction = async (prompt: string, functionDeclarations: any[], knowledgeBase: string): Promise<CommandResponse> => {
    const mutation = `
        mutation GetInferenceFunction($prompt: String!, $tools: [JSONObject!]!, $knowledgeBase: String) {
            getInferenceFunction(prompt: $prompt, tools: $tools, knowledgeBase: $knowledgeBase) {
                text
                functionCalls {
                    name
                    args
                }
            }
        }
    `;
    try {
        const response = await bffApiClient.request<{ getInferenceFunction: CommandResponse }>(mutation, {
            prompt,
            tools: functionDeclarations,
            knowledgeBase
        });
        return response.getInferenceFunction;
    } catch (error) {
        logError(error as Error, { prompt });
        throw error;
    }
};

// --- IMAGE GENERATION ---
export const generateImage = async (prompt: string): Promise<string> => {
    const mutation = `
        mutation GenerateImage($prompt: String!) {
            generateImage(prompt: $prompt)
        }
    `;
    try {
        const response = await bffApiClient.request<{ generateImage: string }>(mutation, { prompt });
        return response.generateImage;
    } catch (error) {
        logError(error as Error, { prompt });
        throw error;
    }
};
