/**
 * @file This module defines the comprehensive taxonomy for all features within the DevCore AI Toolkit.
 * It provides a structured, queryable service for accessing metadata about each feature,
 * which is essential for dynamic UI generation, AI command orchestration, and resource management.
 * 
 * @module services/taxonomyService
 * @security This service handles non-sensitive metadata. No special security considerations are required.
 * @performance The taxonomy data is static and loaded into memory. All retrieval operations are synchronous and highly performant (O(1) or O(n) for small n).
 */

/**
 * @interface FeatureInputSchema
 * @description Defines the expected input structure for a feature, ensuring type safety and clear documentation for AI orchestration.
 * @property {string} paramName - The name of the parameter.
 * @property {'string' | 'number' | 'boolean' | 'code' | 'file' | 'json'} type - The data type of the parameter.
 * @property {string} description - A human-readable description of what the parameter is for.
 * @property {boolean} isRequired - Whether the parameter is mandatory for the feature to function.
 * @property {any} [defaultValue] - An optional default value if the parameter is not provided.
 * @property {string[]} [examples] - An array of example values for the parameter.
 */
export interface FeatureInputSchema {
    paramName: string;
    type: 'string' | 'number' | 'boolean' | 'code' | 'file' | 'json';
    description: string;
    isRequired: boolean;
    defaultValue?: any;
    examples?: string[];
}

/**
 * @interface FeatureTaxonomyItem
 * @description Represents a single, detailed entry in the feature taxonomy. This rich metadata model drives
 * the behavior of the AI Command Center, the feature palette, and other dynamic parts of the application.
 * @property {string} id - The unique identifier for the feature (e.g., 'ai-code-explainer').
 * @property {string} name - The user-facing name of the feature (e.g., 'AI Code Explainer').
 * @property {string} description - A concise, one-sentence description of the feature's purpose.
 * @property {string} category - The primary category the feature belongs to (e.g., 'AI Tools').
 * @property {FeatureInputSchema[]} inputs - A structured array defining the inputs the feature accepts.
 * @property {string[]} tags - Keywords for searching and filtering (e.g., 'refactoring', 'git').
 * @property {string} [status] - The development status of the feature (e.g., 'Beta', 'GA').
 */
export interface FeatureTaxonomyItem {
    id: string;
    name: string;
    description: string;
    category: string;
    inputs: FeatureInputSchema[];
    tags: string[];
    status?: string;
}

/**
 * @class TaxonomyService
 * @description Provides a centralized, queryable source for feature metadata.
 * This service encapsulates the static feature taxonomy data, offering methods to retrieve
 * information about available tools. It is designed to be a singleton and injected
 * via a DI container into other services that require knowledge of the feature set.
 *
 * @example
 * ```typescript
 * const taxonomyService = new TaxonomyService();
 * const allAiTools = taxonomyService.getFeaturesByCategory('AI Tools');
 * const explainer = taxonomyService.getFeatureById('ai-code-explainer');
 * ```
 */
export class TaxonomyService {
    /**
     * @private
     * @static
     * @readonly
     * @property {Map<string, FeatureTaxonomyItem>} featureMap - An internal map for O(1) lookup of features by their ID.
     */
    private static readonly featureMap: Map<string, FeatureTaxonomyItem> = new Map();

    /**
     * @private
     * @static
     * @readonly
     * @property {FeatureTaxonomyItem[]} featureList - The complete, static list of all feature taxonomy items.
     * @description This is the single source of truth for all feature metadata in the application.
     */
    private static readonly featureList: FeatureTaxonomyItem[] = [
        {
            id: "ai-command-center",
            name: "AI Command Center",
            description: "The main entry point. Use natural language to navigate and control the entire toolkit. Can call other tools.",
            category: "Core",
            inputs: [
                { paramName: "prompt", type: "string", description: "A natural language prompt describing the desired action.", isRequired: true, examples: ["explain this code: ...", "design a theme with space vibes"] }
            ],
            tags: ["natural-language", "orchestration", "ai-powered"],
            status: "GA"
        },
        {
            id: "workspace-connector-hub",
            name: "Workspace Connector Hub",
            description: "A central hub to execute actions on connected third-party services like Jira, Slack, GitHub, Vercel, and more.",
            category: "Workflow",
            inputs: [
                 { paramName: "actionId", type: "string", description: "The ID of the action to execute (e.g., 'jira_create_ticket').", isRequired: true },
                 { paramName: "params", type: "json", description: "A JSON object of parameters for the action.", isRequired: true }
            ],
            tags: ["integration", "workflow", "automation", "api"],
            status: "GA"
        },
        {
            id: "ai-code-explainer",
            name: "AI Code Explainer",
            description: "Accepts a code snippet and provides a detailed, structured analysis including summary, line-by-line breakdown, complexity, suggestions, and a visual flowchart.",
            category: "AI Tools",
            inputs: [
                { paramName: "code", type: "code", description: "The code snippet to be explained.", isRequired: true }
            ],
            tags: ["code-analysis", "documentation", "learning", "ai-powered"],
            status: "GA"
        },
        {
            id: "theme-designer",
            name: "AI Theme Designer",
            description: "Generates a complete UI color theme, including a semantic palette and accessibility scores, from a simple text description or an uploaded image.",
            category: "AI Tools",
            inputs: [
                { paramName: "description", type: "string", description: "A description of the desired aesthetic.", isRequired: false, examples: ["a calm, minimalist theme for a blog"] },
                { paramName: "imageFile", type: "file", description: "An image to draw color inspiration from.", isRequired: false }
            ],
            tags: ["ui-design", "color-palette", "accessibility", "ai-powered"],
            status: "GA"
        },
        {
            id: "regex-sandbox",
            name: "RegEx Sandbox",
            description: "Generates a regular expression from a natural language description. Also allows testing expressions against a string.",
            category: "Testing",
            inputs: [
                { paramName: "description", type: "string", description: "A natural language description of the pattern to match.", isRequired: true, examples: ["find all email addresses"] }
            ],
            tags: ["regex", "pattern-matching", "testing", "ai-powered"],
            status: "GA"
        },
        {
            id: "ai-pull-request-assistant",
            name: "AI Pull Request Assistant",
            description: "Takes 'before' and 'after' code snippets, calculates the diff, generates a structured pull request summary (title, description, changes), and populates a full PR template.",
            category: "AI Tools",
            inputs: [
                { paramName: "beforeCode", type: "code", description: "The original code before changes.", isRequired: true },
                { paramName: "afterCode", type: "code", description: "The new code with changes.", isRequired: true }
            ],
            tags: ["pull-request", "git", "ai-powered", "workflow"],
            status: "GA"
        },
        {
            id: "visual-git-tree",
            name: "AI Git Log Analyzer",
            description: "Intelligently parses a raw 'git log' output to create a categorized and well-formatted changelog, separating new features from bug fixes.",
            category: "Git",
            inputs: [
                { paramName: "gitLog", type: "string", description: "The raw output from a 'git log' command.", isRequired: true }
            ],
            tags: ["git", "version-control", "changelog", "ai-powered"],
            status: "GA"
        },
        {
            id: "cron-job-builder",
            name: "AI Cron Job Builder",
            description: "Generates a valid cron expression from a natural language description of a schedule.",
            category: "Deployment",
            inputs: [
                { paramName: "scheduleDescription", type: "string", description: "A natural language description of the schedule.", isRequired: true, examples: ["every weekday at 5pm"] }
            ],
            tags: ["cron", "scheduling", "automation", "ai-powered"],
            status: "GA"
        },
        {
            id: "ai-code-migrator",
            name: "AI Code Migrator",
            description: "Translate code between languages & frameworks.",
            category: "AI Tools",
            inputs: [
                { paramName: "code", type: "code", description: "The code snippet to convert.", isRequired: true },
                { paramName: "sourceLanguage", type: "string", description: "The source language/framework.", isRequired: true },
                { paramName: "targetLanguage", type: "string", description: "The target language/framework.", isRequired: true }
            ],
            tags: ["code-conversion", "refactoring", "ai-powered"],
            status: "Beta"
        },
        {
            id: "ai-commit-generator",
            name: "AI Commit Message Generator",
            description: "Generates a conventional commit message from a git diff.",
            category: "AI Tools",
            inputs: [
                { paramName: "gitDiff", type: "string", description: "A string containing a git diff.", isRequired: true }
            ],
            tags: ["git", "commit", "ai-powered", "workflow"],
            status: "GA"
        },
        {
            id: "worker-thread-debugger",
            name: "AI Concurrency Analyzer",
            description: "Analyzes JavaScript code for potential Web Worker concurrency issues like race conditions.",
            category: "Testing",
            inputs: [
                { paramName: "javascriptCode", type: "code", description: "The JavaScript code to analyze for concurrency issues.", isRequired: true }
            ],
            tags: ["concurrency", "web-workers", "debugging", "ai-powered"],
            status: "Beta"
        },
        {
            id: "xbrl-converter",
            name: "XBRL Converter",
            description: "Converts a JSON object into a simplified XBRL-like XML format.",
            category: "Data",
            inputs: [
                { paramName: "json", type: "json", description: "A string containing valid JSON data.", isRequired: true }
            ],
            tags: ["finance", "data-conversion", "xml", "ai-powered"],
            status: "GA"
        },
        {
            id: "api-mock-generator",
            name: "API Mock Server",
            description: "Generates mock API data from a description and serves it locally using a service worker.",
            category: "Local Dev",
            inputs: [
                { paramName: "schemaDescription", type: "string", description: "A text description of the data schema.", isRequired: true, examples: ["a user with id, name, and email"] }
            ],
            tags: ["mock-api", "testing", "frontend", "ai-powered"],
            status: "GA"
        },
        {
            id: "env-manager",
            name: ".env Manager",
            description: "A graphical interface for creating and managing .env files.",
            category: "Local Dev",
            inputs: [
                { paramName: "variables", type: "json", description: "Key-value pairs for environment variables.", isRequired: true }
            ],
            tags: ["configuration", "utility"],
            status: "GA"
        },
        {
            id: "performance-profiler",
            name: "AI Performance Profiler",
            description: "Analyze runtime performance traces and bundle stats to get AI-powered optimization advice.",
            category: "Performance & Auditing",
            inputs: [
                { paramName: "performanceData", type: "json", description: "Runtime trace or bundle stats JSON.", isRequired: true }
            ],
            tags: ["performance", "optimization", "auditing", "ai-powered"],
            status: "GA"
        },
        {
            id: "a11y-auditor",
            name: "Accessibility Auditor",
            description: "Audit a live URL for accessibility issues and get AI-powered suggestions for fixes.",
            category: "Performance & Auditing",
            inputs: [
                { paramName: "url", type: "string", description: "The URL of the website to audit.", isRequired: true }
            ],
            tags: ["accessibility", "a11y", "auditing", "ai-powered"],
            status: "GA"
        },
        {
            id: "ci-cd-generator",
            name: "AI CI/CD Pipeline Architect",
            description: "Generate CI/CD configuration files (e.g., GitHub Actions YAML) from a natural language description.",
            category: "Deployment & CI/CD",
            inputs: [
                { paramName: "description", type: "string", description: "A text description of the desired deployment stages.", isRequired: true }
            ],
            tags: ["ci-cd", "automation", "devops", "ai-powered"],
            status: "GA"
        },
        {
            id: "deployment-preview",
            name: "Static Deployment Previewer",
            description: "See a live preview of files generated by the AI Feature Builder as if they were statically deployed.",
            category: "Deployment & CI/CD",
            inputs: [],
            tags: ["deployment", "preview", "frontend"],
            status: "GA"
        },
        {
            id: "security-scanner",
            name: "AI Security Scanner",
            description: "Perform static analysis on code snippets to find common vulnerabilities and get AI-driven mitigation advice.",
            category: "Security",
            inputs: [
                { paramName: "code", type: "code", description: "A code snippet to scan for vulnerabilities.", isRequired: true }
            ],
            tags: ["security", "sast", "vulnerability-scan", "ai-powered"],
            status: "Beta"
        },
        {
            id: "gmail-addon-simulator",
            name: "Gmail Add-on Simulator",
            description: "A simulation of how contextual add-on scopes would work inside Gmail to read emails and compose replies.",
            category: "Productivity",
            inputs: [],
            tags: ["gmail", "automation", "simulation"],
            status: "GA"
        },
        {
            id: "iam-policy-visualizer",
            name: "GCP IAM Policy Visualizer",
            description: "Visually test what a user can and cannot do across a set of Google Cloud resources.",
            category: "Cloud",
            inputs: [
                { paramName: "resources", type: "json", description: "A list of full GCP resource names.", isRequired: true },
                { paramName: "permissions", type: "json", description: "A list of permission strings to test.", isRequired: true }
            ],
            tags: ["gcp", "iam", "security", "visualization"],
            status: "GA"
        }
    ];

    /**
     * @constructor
     * @description Initializes the TaxonomyService, populating the internal feature map for efficient lookups.
     * This is intended to be run once when the service is instantiated.
     * @performance This constructor has an O(n) complexity where n is the number of features, as it iterates through the static list once. This is negligible for the expected number of features.
     */
    constructor() {
        if (TaxonomyService.featureMap.size === 0) {
            for (const feature of TaxonomyService.featureList) {
                TaxonomyService.featureMap.set(feature.id, feature);
            }
        }
    }

    /**
     * Retrieves all feature taxonomy items.
     * @returns {FeatureTaxonomyItem[]} An array of all feature taxonomy items.
     * @example
     * ```typescript
     * const allFeatures = taxonomyService.getAllFeatures();
     * console.log(`There are ${allFeatures.length} features available.`);
     * ```
     */
    public getAllFeatures(): FeatureTaxonomyItem[] {
        return [...TaxonomyService.featureList];
    }

    /**
     * Retrieves a single feature taxonomy item by its unique ID.
     * @param {string} id - The unique identifier of the feature.
     * @returns {FeatureTaxonomyItem | undefined} The feature taxonomy item if found, otherwise undefined.
     * @performance O(1) due to internal map-based lookup.
     * @example
     * ```typescript
     * const feature = taxonomyService.getFeatureById('ai-code-explainer');
     * if (feature) {
     *   console.log(feature.name); // "AI Code Explainer"
     * }
     * ```
     */
    public getFeatureById(id: string): FeatureTaxonomyItem | undefined {
        return TaxonomyService.featureMap.get(id);
    }

    /**
     * Retrieves all feature taxonomy items belonging to a specific category.
     * @param {string} category - The category name to filter by (e.g., 'AI Tools').
     * @returns {FeatureTaxonomyItem[]} An array of feature taxonomy items in the specified category.
     * @performance O(n) where n is the total number of features. This is acceptable as n is small.
     * @example
     * ```typescript
     * const aiTools = taxonomyService.getFeaturesByCategory('AI Tools');
     * aiTools.forEach(tool => console.log(tool.name));
     * ```
     */
    public getFeaturesByCategory(category: string): FeatureTaxonomyItem[] {
        return TaxonomyService.featureList.filter(feature => feature.category === category);
    }
}

// Export a singleton instance for easy, non-DI use if needed,
// but the primary pattern should be dependency injection of the class.
export const taxonomyService = new TaxonomyService();
