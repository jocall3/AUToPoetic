/**
 * @file This file is the central registry for all features available in the application.
 * It defines the metadata, categories, tags, and other properties for each feature,
 * providing a single source of truth that drives the UI, command palette, and AI orchestration.
 *
 * @security This file does not contain sensitive information. It defines application structure.
 * @performance This file contains a large static data structure (RAW_FEATURES). It is critical that
 * this data is constant and tree-shakable. The associated `FeatureManager` class provides
 * memoized or efficient ways to query this data without performance penalties.
 * @JSDoc-Date 2024-07-28
 * @JSDoc-Version 1.0.0
 */

import React from 'react';
import {
    CommandCenterIcon, CodeExplainerIcon, FeatureBuilderIcon, CodeMigratorIcon, ThemeDesignerIcon, SnippetVaultIcon,
    UnitTestGeneratorIcon, CommitGeneratorIcon, GitLogAnalyzerIcon, ConcurrencyAnalyzerIcon, RegexSandboxIcon,
    PromptCraftPadIcon, CodeFormatterIcon, JsonTreeIcon, CssGridEditorIcon, SchemaDesignerIcon, PwaManifestEditorIcon,
    MarkdownSlidesIcon, ScreenshotToComponentIcon, SvgPathEditorIcon, StyleTransferIcon, CodingChallengeIcon,
    CodeReviewBotIcon, ChangelogGeneratorIcon, CronJobBuilderIcon,
    AsyncCallTreeIcon, AudioToCodeIcon, CodeDiffGhostIcon, CodeSpellCheckerIcon, ColorPaletteGeneratorIcon, LogicFlowBuilderIcon,
    MetaTagEditorIcon, NetworkVisualizerIcon, ResponsiveTesterIcon, SassCompilerIcon, ImageGeneratorIcon, XbrlConverterIcon,
    DigitalWhiteboardIcon, TypographyLabIcon, AiPullRequestAssistantIcon, ProjectExplorerIcon,
    ServerStackIcon, DocumentTextIcon, ChartBarIcon, EyeIcon, PaperAirplaneIcon, CloudIcon, ShieldCheckIcon, CpuChipIcon, SparklesIcon,
    MailIcon, BugAntIcon, MagnifyingGlassIcon, RectangleGroupIcon, GcpIcon,
    CubeTransparentIcon, VariableIcon, FingerPrintIcon, CommandLineIcon, AdjustmentsHorizontalIcon, CodeBracketIcon,
    FolderOpenIcon, Bars3CenterLeftIcon, MagnifyingGlassCircleIcon, ChartPieIcon, SwatchIcon, Square2StackIcon,
    CheckBadgeIcon, CodeBracketSquareIcon, WifiIcon, BeakerIcon, LightBulbIcon, CircleStackIcon,
    CubeIcon, RocketLaunchIcon, GlobeAltIcon, PuzzlePieceIcon, UserGroupIcon, TrophyIcon,
    ArrowPathIcon, CurrencyDollarIcon, PresentationChartBarIcon, AcademicCapIcon,
    ArrowDownTrayIcon, WindowIcon, MegaphoneIcon
} from './components/icons.tsx';

export const CHROME_VIEW_IDS = ['features-list'] as const;

export const FEATURE_CATEGORIES = [
    'Core', 'AI Tools', 'Frontend', 'Testing', 'Database', 'Data', 'Productivity', 'Git',
    'Local Dev', 'Performance & Auditing', 'Deployment & CI/CD', 'Security', 'Workflow', 'Cloud',
    'Backend', 'APIs', 'Containerization', 'Observability', 'Design System', 'Compliance', 'Web3', 'Education'
] as const;
export type FeatureCategory = typeof FEATURE_CATEGORIES[number];

export const FEATURE_TAGS = [
    'AI-powered', 'UI/UX', 'Code Generation', 'DevOps', 'Data Visualization', 'Security Audit',
    'Performance Tuning', 'Testing', 'Debugging', 'Refactoring', 'Cloud Native', 'GraphQL', 'REST API',
    'Serverless', 'Kubernetes', 'CI/CD', 'Real-time', 'Editor', 'Documentation', 'Learning', 'Collaboration',
    'Design', 'Automation', 'Frontend Frameworks', 'Backend Services', 'Database Schema', 'Accessibility',
    'Mobile Development', 'Desktop Integration', 'Blockchain', 'Smart Contracts', 'Financial Data', 'Project Management'
] as const;
export type FeatureTag = typeof FEATURE_TAGS[number];

export const FEATURE_STATUSES = ['Beta', 'GA', 'Experimental', 'Deprecated', 'Coming Soon'] as const;
export type FeatureStatus = typeof FEATURE_STATUSES[number];

export const FEATURE_TIERS = ['Free', 'Pro', 'Enterprise'] as const;
export type FeatureTier = typeof FEATURE_TIERS[number];

export type SlotCategory = FeatureCategory;
export const SLOTS: SlotCategory[] = ['Core', 'AI Tools', 'Frontend', 'Testing', 'Git', 'Productivity', 'Deployment & CI/CD', 'Security'];

export interface RawFeature {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: FeatureCategory;
    tags?: FeatureTag[];
    status?: FeatureStatus;
    tier?: FeatureTier;
    keywords?: string[]; // For enhanced search capabilities
    relatedFeatures?: string[]; // IDs of related features
    externalDocsUrl?: string; // Link to external documentation
}

export const RAW_FEATURES: RawFeature[] = [
    // --- Domain 1: Local Development & Testing Parity ---
    {
        id: "api-mock-generator", name: "API Mock Server", description: "Generate mock API data from a description and serve it locally.",
        icon: <ServerStackIcon />, category: "Local Dev", tags: ["Backend Services", "Testing", "Automation"],
        keywords: ["mock", "api", "server", "data", "local"], tier: "Pro"
    },
    {
        id: "env-manager", name: ".env File Generator", description: "A graphical interface for creating and downloading .env files.",
        icon: <DocumentTextIcon />, category: "Local Dev", tags: ["Productivity", "Editor"],
        keywords: ["env", "environment", "variables", "config"]
    },

    // --- Domain 2: Performance & Optimization Intelligence ---
    {
        id: "performance-profiler", name: "AI Performance Profiler", description: "Analyze runtime traces and bundle stats with AI-powered advice.",
        icon: <ChartBarIcon />, category: "Performance & Auditing", tags: ["Performance Tuning", "AI-powered", "Observability"],
        keywords: ["performance", "profiler", "ai", "bundle", "runtime"], tier: "Pro"
    },
    {
        id: "a11y-auditor", name: "Accessibility Auditor", description: "Audit a live URL for accessibility issues and get AI-powered fixes.",
        icon: <EyeIcon />, category: "Performance & Auditing", tags: ["Accessibility", "UI/UX", "AI-powered"],
        keywords: ["accessibility", "a11y", "audit", "fixes", "frontend"], relatedFeatures: ["responsive-tester"]
    },
    {
        id: "tech-debt-sonar", name: "Tech Debt Sonar", description: "Scan code to find code smells and areas with high complexity.",
        icon: <MagnifyingGlassIcon />, category: "Performance & Auditing", tags: ["Code Generation", "Refactoring"],
        keywords: ["tech debt", "code quality", "complexity", "sonar", "static analysis"], tier: "Pro"
    },

    // --- Domain 3: Deployment & CI/CD Automation ---
    {
        id: "ci-cd-generator", name: "AI CI/CD Architect", description: "Generate CI/CD config files from a natural language description.",
        icon: <PaperAirplaneIcon />, category: "Deployment & CI/CD", tags: ["CI/CD", "Automation", "AI-powered"],
        keywords: ["ci/cd", "automation", "pipeline", "github actions", "gitlab ci", "jenkins"], tier: "Pro"
    },
    {
        id: "deployment-preview", name: "Static Deployment Preview", description: "See a live preview of files generated by the AI Feature Builder.",
        icon: <CloudIcon />, category: "Deployment & CI/CD", tags: ["CI/CD", "Frontend", "Real-time"],
        keywords: ["preview", "deployment", "static", "feature builder"], relatedFeatures: ["ai-feature-builder"]
    },
    {
        id: "terraform-generator", name: "AI Terraform Generator", description: "Generate Terraform config from a description and cloud context.",
        icon: <CpuChipIcon />, category: "Deployment & CI/CD", tags: ["Cloud Native", "DevOps", "AI-powered", "Automation"],
        keywords: ["terraform", "iaac", "infrastructure as code", "aws", "gcp", "azure"], tier: "Pro"
    },

    // --- Domain 4: Security & Vulnerability Scanning ---
    {
        id: "security-scanner", name: "AI Security Scanner", description: "Find common vulnerabilities in code with static analysis and AI.",
        icon: <ShieldCheckIcon />, category: "Security", tags: ["Security Audit", "AI-powered"],
        keywords: ["security", "vulnerability", "scanner", "static analysis", "sast"], tier: "Pro"
    },
    {
        id: "iam-policy-generator", name: "IAM Policy Generator", description: "Generate AWS or GCP IAM policies from a natural language description.",
        icon: <ShieldCheckIcon />, category: "Security", tags: ["Cloud Native", "Security Audit", "AI-powered"],
        keywords: ["iam", "aws", "gcp", "policy", "permissions"], tier: "Pro", relatedFeatures: ["iam-policy-visualizer"]
    },
    {
        id: "iam-policy-visualizer", name: "GCP IAM Policy Visualizer", description: "Visually test and audit GCP IAM permissions in real-time across your resources.",
        icon: <GcpIcon />, category: "Cloud", tags: ["Cloud Native", "Security Audit", "Data Visualization"],
        keywords: ["gcp", "iam", "policy", "visualizer", "audit", "permissions"], tier: "Pro", relatedFeatures: ["iam-policy-generator"]
    },

    // --- Existing Features (Re-categorized and Ordered) ---
    {
        id: "ai-command-center", name: "AI Command Center", description: "Use natural language to navigate and control the toolkit.",
        icon: <CommandCenterIcon />, category: "Core", tags: ["AI-powered", "Productivity", "Automation"],
        keywords: ["ai", "command", "control", "natural language", "voice control"]
    },
    {
        id: "project-explorer", name: "Project Explorer", description: "Manage and edit files from your connected repositories.",
        icon: <ProjectExplorerIcon />, category: "Core", tags: ["Editor", "Productivity"],
        keywords: ["file manager", "repository", "code editor", "project"]
    },
    {
        id: "workspace-connector-hub", name: "Workspace Connector Hub", description: "Connect to services like Jira, Slack & GitHub to orchestrate actions with AI.",
        icon: <RectangleGroupIcon />, category: "Workflow", tags: ["Automation", "Collaboration", "AI-powered"],
        keywords: ["integrations", "jira", "slack", "github", "orchestration", "workflow"]
    },
    {
        id: "linter-formatter", name: "AI Code Formatter", description: "AI-powered, real-time code formatting.",
        icon: <CodeFormatterIcon />, category: "Core", tags: ["AI-powered", "Refactoring", "Editor"],
        keywords: ["formatter", "linter", "code style", "prettier", "eslint"], relatedFeatures: ["ai-style-transfer"]
    },
    {
        id: "json-tree-navigator", name: "JSON Tree Navigator", description: "Navigate large JSON objects as a collapsible tree.",
        icon: <JsonTreeIcon />, category: "Core", tags: ["Data Visualization", "Editor"],
        keywords: ["json", "data", "viewer", "tree", "navigator"]
    },

    {
        id: "feature-forge", name: "Feature Forge", description: "Use AI to create new tools and add them to your desktop.",
        icon: <CpuChipIcon />, category: "AI Tools", tags: ["AI-powered", "Code Generation", "Productivity"],
        keywords: ["feature", "tool", "generator", "ai", "custom"], tier: "Enterprise", status: "Experimental"
    },
    {
        id: "ai-image-generator", name: "AI Image Generator", description: "Generate high-quality images from a text prompt.",
        icon: <ImageGeneratorIcon />, category: "AI Tools", tags: ["AI-powered", "Design", "Productivity"],
        keywords: ["image", "generator", "art", "prompt", "midjourney", "dalle"]
    },
    {
        id: "ai-code-explainer", name: "AI Code Explainer", description: "Get a structured analysis of code, including complexity.",
        icon: <CodeExplainerIcon />, category: "AI Tools", tags: ["AI-powered", "Documentation", "Learning"],
        keywords: ["code", "explainer", "analysis", "complexity", "understand", "refactor"]
    },
    {
        id: "ai-feature-builder", name: "AI Feature Builder", description: "Generate code, tests, and commit messages from a prompt or API schema.",
        icon: <FeatureBuilderIcon />, category: "AI Tools", tags: ["AI-powered", "Code Generation", "Automation"],
        keywords: ["feature", "builder", "code", "tests", "commit", "schema", "full stack"], tier: "Pro", relatedFeatures: ["ai-full-stack-builder"]
    },
    {
        id: "ai-full-stack-builder", name: "AI Full-Stack Builder", description: "Generate a frontend component, backend cloud function, and database rules from a single prompt.",
        icon: <ServerStackIcon />, category: "AI Tools", tags: ["AI-powered", "Code Generation", "Backend", "Frontend", "Database"],
        keywords: ["full stack", "frontend", "backend", "database", "serverless", "component", "cloud function"], tier: "Pro", relatedFeatures: ["ai-feature-builder"]
    },
    {
        id: "ai-personality-forge", name: "AI Personality Forge", description: "Architect, test, and save complex system prompts to create different 'AI personalities'.",
        icon: <SparklesIcon />, category: "AI Tools", tags: ["AI-powered", "Productivity", "Editor"],
        keywords: ["ai", "prompt engineering", "personality", "customization", "system prompt"], tier: "Pro"
    },
    {
        id: "ai-code-migrator", name: "AI Code Migrator", description: "Translate code between languages & frameworks.",
        icon: <CodeMigratorIcon />, category: "AI Tools", tags: ["AI-powered", "Code Generation", "Refactoring"],
        keywords: ["code", "migrator", "translate", "framework", "language", "conversion"], tier: "Pro"
    },
    {
        id: "theme-designer", name: "AI Theme Designer", description: "Generate, fine-tune, and export UI color themes from a text description or image.",
        icon: <ThemeDesignerIcon />, category: "AI Tools", tags: ["AI-powered", "Design", "UI/UX"],
        keywords: ["theme", "designer", "color palette", "ui", "ux", "branding"], relatedFeatures: ["color-palette-generator"]
    },
    {
        id: "one-click-refactor", name: "One-Click Refactor", description: "Apply common refactoring patterns to your code with a single click.",
        icon: <SparklesIcon />, category: "AI Tools", tags: ["AI-powered", "Refactoring", "Productivity"],
        keywords: ["refactor", "code improvement", "patterns", "quick fix"]
    },
    {
        id: "ai-commit-generator", name: "AI Commit Message Generator", description: "Smart, conventional commits via AI.",
        icon: <CommitGeneratorIcon />, category: "AI Tools", tags: ["AI-powered", "Git", "Automation"],
        keywords: ["commit", "message", "generator", "git", "conventional commits"]
    },
    {
        id: "prompt-craft-pad", name: "Prompt Craft Pad", description: "Save, edit, and manage your custom AI prompts with variable testing.",
        icon: <PromptCraftPadIcon />, category: "AI Tools", tags: ["AI-powered", "Editor", "Productivity"],
        keywords: ["prompt", "ai", "craft", "template", "testing", "management"]
    },
    {
        id: "ai-style-transfer", name: "AI Code Style Transfer", description: "Rewrite code to match a specific style guide.",
        icon: <StyleTransferIcon />, category: "AI Tools", tags: ["AI-powered", "Refactoring", "Code Generation"],
        keywords: ["style transfer", "code style", "formatter", "linter"], relatedFeatures: ["linter-formatter"]
    },
    {
        id: "ai-coding-challenge", name: "AI Coding Challenge Generator", description: "Generate unique coding exercises.",
        icon: <CodingChallengeIcon />, category: "AI Tools", tags: ["AI-powered", "Learning", "Education"],
        keywords: ["coding challenge", "exercise", "practice", "interview prep"]
    },
    {
        id: "code-review-bot", name: "AI Code Review Bot", description: "Get an automated code review with one-click refactoring.",
        icon: <CodeReviewBotIcon />, category: "AI Tools", tags: ["AI-powered", "Refactoring", "Git"],
        keywords: ["code review", "bot", "ai", "quality", "feedback"], tier: "Pro", relatedFeatures: ["ai-pull-request-assistant"]
    },
    {
        id: "ai-pull-request-assistant", name: "AI Pull Request Assistant", description: "Generate a structured PR summary from code diffs and populate a full template.",
        icon: <AiPullRequestAssistantIcon />, category: "AI Tools", tags: ["AI-powered", "Git", "Productivity", "Automation"],
        keywords: ["pull request", "pr", "summary", "diff", "ai", "automation"], tier: "Pro", relatedFeatures: ["code-review-bot", "ai-commit-generator"]
    },
    {
        id: "audio-to-code", name: "AI Audio-to-Code", description: "Speak your programming ideas and watch them turn into code.",
        icon: <AudioToCodeIcon />, category: "AI Tools", tags: ["AI-powered", "Code Generation", "Productivity"],
        keywords: ["audio", "voice", "code", "speech to code"]
    },

    {
        id: "css-grid-editor", name: "CSS Grid Visual Editor", description: "Drag-based layout builder for CSS Grid.",
        icon: <CssGridEditorIcon />, category: "Frontend", tags: ["UI/UX", "Editor", "Design"],
        keywords: ["css", "grid", "layout", "visual editor", "frontend"]
    },
    {
        id: "pwa-manifest-editor", name: "PWA Manifest Editor", description: "Configure and preview Progressive Web App manifests with a home screen simulator.",
        icon: <PwaManifestEditorIcon />, category: "Frontend", tags: ["Mobile Development", "Editor"],
        keywords: ["pwa", "manifest", "web app", "offline", "installable"]
    },
    {
        id: "typography-lab", name: "Typography Lab", description: "Preview font pairings and get CSS import rules.",
        icon: <TypographyLabIcon />, category: "Frontend", tags: ["Design", "UI/UX"],
        keywords: ["typography", "fonts", "css", "pairing", "web fonts"]
    },
    {
        id: "svg-path-editor", name: "SVG Path Editor", description: "Visually create and manipulate SVG path data with an interactive canvas.",
        icon: <SvgPathEditorIcon />, category: "Frontend", tags: ["Design", "Editor", "Data Visualization"],
        keywords: ["svg", "vector graphics", "path", "editor", "illustration"]
    },
    {
        id: "color-palette-generator", name: "AI Color Palette Generator", description: "Pick a base color and let Gemini design a beautiful palette.",
        icon: <ColorPaletteGeneratorIcon />, category: "Frontend", tags: ["AI-powered", "Design", "UI/UX"],
        keywords: ["color", "palette", "generator", "theme", "design system"], relatedFeatures: ["theme-designer"]
    },
    {
        id: "meta-tag-editor", name: "Meta Tag Editor", description: "Generate SEO/social media meta tags with a live social card preview.",
        icon: <MetaTagEditorIcon />, category: "Frontend", tags: ["UI/UX", "Editor"],
        keywords: ["meta tags", "seo", "social media", "ogp", "twitter card"]
    },
    {
        id: "responsive-tester", name: "Responsive Tester", description: "Preview your web pages at different screen sizes and custom resolutions.",
        icon: <ResponsiveTesterIcon />, category: "Frontend", tags: ["Testing", "UI/UX"],
        keywords: ["responsive design", "mobile", "tablet", "desktop", "screen size"], relatedFeatures: ["a11y-auditor"]
    },
    {
        id: "sass-scss-compiler", name: "SASS/SCSS Compiler", description: "A real-time SASS/SCSS to CSS compiler.",
        icon: <SassCompilerIcon />, category: "Frontend", tags: ["Frontend Frameworks", "Productivity"],
        keywords: ["sass", "scss", "css", "compiler", "preprocessor"]
    },

    {
        id: "ai-unit-test-generator", name: "AI Unit Test Generator", description: "Generate unit tests from source code.",
        icon: <UnitTestGeneratorIcon />, category: "Testing", tags: ["AI-powered", "Code Generation", "Testing"],
        keywords: ["unit test", "generator", "ai", "jest", "mocha", "vitest"], tier: "Pro", relatedFeatures: ["bug-reproducer"]
    },
    {
        id: "bug-reproducer", name: "Bug Reproducer", description: "Paste a stack trace to automatically generate a failing unit test.",
        icon: <BugAntIcon />, category: "Testing", tags: ["Testing", "Debugging", "Code Generation"],
        keywords: ["bug", "reproduce", "test case", "stack trace", "fail test"], tier: "Pro", relatedFeatures: ["ai-unit-test-generator"]
    },
    {
        id: "worker-thread-debugger", name: "AI Concurrency Analyzer", description: "Analyze JS for Web Worker issues like race conditions.",
        icon: <ConcurrencyAnalyzerIcon />, category: "Testing", tags: ["Debugging", "Performance Tuning", "AI-powered"],
        keywords: ["concurrency", "web worker", "race condition", "threads", "js"]
    },
    {
        id: "regex-sandbox", name: "RegEx Sandbox", description: "Visually test regular expressions, generate them with AI, and inspect match groups.",
        icon: <RegexSandboxIcon />, category: "Testing", tags: ["Editor", "AI-powered"],
        keywords: ["regex", "regular expression", "tester", "generator", "pattern matching"]
    },
    {
        id: "async-call-tree-viewer", name: "Async Call Tree Viewer", description: "Visualize a tree of asynchronous function calls from JSON data.",
        icon: <AsyncCallTreeIcon />, category: "Testing", tags: ["Data Visualization", "Debugging"],
        keywords: ["async", "call tree", "promises", "observability", "json"]
    },
    {
        id: "code-spell-checker", name: "Code Spell Checker", description: "A spell checker that finds common typos in code.",
        icon: <CodeSpellCheckerIcon />, category: "Testing", tags: ["Productivity", "Editor"],
        keywords: ["spell checker", "typos", "code quality", "linter"]
    },
    {
        id: "network-visualizer", name: "Network Visualizer", description: "Inspect network resources with a summary and visual waterfall chart.",
        icon: <NetworkVisualizerIcon />, category: "Testing", tags: ["Observability", "Data Visualization"],
        keywords: ["network", "http", "requests", "waterfall", "performance", "api calls"]
    },

    {
        id: "visual-git-tree", name: "Visual Git Tree", description: "Visually trace your git commit history with an interactive graph and an AI-powered summary.",
        icon: <GitLogAnalyzerIcon />, category: "Git", tags: ["Git", "Data Visualization", "AI-powered"],
        keywords: ["git", "history", "log", "tree", "branch", "commit"]
    },
    {
        id: "changelog-generator", name: "AI Changelog Generator", description: "Auto-build changelogs from raw git logs.",
        icon: <ChangelogGeneratorIcon />, category: "Git", tags: ["Git", "Automation", "Documentation"],
        keywords: ["changelog", "release notes", "git log", "automation"], tier: "Pro"
    },
    {
        id: "code-diff-ghost", name: "Code Diff Ghost", description: "Visualize code changes with a 'ghost typing' effect.",
        icon: <CodeDiffGhostIcon />, category: "Git", tags: ["Git", "Productivity"],
        keywords: ["code diff", "changes", "visualizer", "ghost typing"]
    },

    {
        id: "cron-job-builder", name: "AI Cron Job Builder", description: "Visually tool to configure cron jobs, with AI.",
        icon: <CronJobBuilderIcon />, category: "Deployment & CI/CD", tags: ["Automation", "AI-powered"],
        keywords: ["cron", "scheduler", "job", "automation"]
    },

    {
        id: "portable-snippet-vault", name: "Snippet Vault", description: "Store, search, tag, and enhance reusable code snippets with AI.",
        icon: <SnippetVaultIcon />, category: "Productivity", tags: ["AI-powered", "Productivity", "Editor"],
        keywords: ["snippet", "code reuse", "vault", "search", "tag"]
    },
    {
        id: "digital-whiteboard", name: "Digital Whiteboard", description: "Organize ideas with interactive sticky notes and get AI-powered summaries.",
        icon: <DigitalWhiteboardIcon />, category: "Productivity", tags: ["Collaboration", "AI-powered"],
        keywords: ["whiteboard", "notes", "ideas", "brainstorming", "summary"]
    },
    {
        id: "markdown-slides-generator", name: "Markdown Slides", description: "Turn markdown into a fullscreen presentation with an interactive overlay.",
        icon: <MarkdownSlidesIcon />, category: "Productivity", tags: ["Documentation", "UI/UX"],
        keywords: ["markdown", "slides", "presentation", "deck"]
    },
    {
        id: "weekly-digest-generator", name: "Weekly Digest Generator", description: "Generate and send a weekly project summary email via Gmail.",
        icon: <MailIcon />, category: "Productivity", tags: ["Automation", "Reporting", "AI-powered"],
        keywords: ["weekly digest", "summary", "report", "email", "gmail"], tier: "Pro"
    },
    {
        id: "gmail-addon-simulator", name: "Gmail Add-on Simulator", description: "A simulation of how contextual add-on scopes would work inside Gmail.",
        icon: <MailIcon />, category: "Productivity", tags: ["Productivity", "Workflow"],
        keywords: ["gmail", "addon", "simulator", "extension"]
    },

    {
        id: "schema-designer", name: "Schema Designer", description: "Visually design a database schema with a drag-and-drop interface and SQL export.",
        icon: <SchemaDesignerIcon />, category: "Database", tags: ["Database Schema", "Editor"],
        keywords: ["database", "schema", "designer", "sql", "erd"]
    },
    {
        id: "xbrl-converter", name: "XBRL Converter", description: "Convert JSON data to a simplified XBRL-like XML format using AI.",
        icon: <XbrlConverterIcon />, category: "Data", tags: ["Financial Data", "Data Visualization", "AI-powered"],
        keywords: ["xbrl", "json", "xml", "financial", "data conversion"], tier: "Enterprise"
    },
    {
        id: "logic-flow-builder", name: "Logic Flow Builder", description: "A visual tool for building application logic flows.",
        icon: <LogicFlowBuilderIcon />, category: "Workflow", tags: ["Workflow", "Data Visualization", "Editor"],
        keywords: ["logic", "flow", "builder", "workflow", "process", "diagram"]
    },

    // --- NEW FEATURES ---
    {
        id: "ai-algorithm-visualizer", name: "AI Algorithm Visualizer", description: "Upload code or describe an algorithm to visually see its execution and get AI-powered explanations.",
        icon: <CubeTransparentIcon />, category: "AI Tools", tags: ["AI-powered", "Learning", "Data Visualization"],
        keywords: ["algorithm", "data structure", "visualization", "learning", "education"], status: "Beta", tier: "Pro"
    },
    {
        id: "ai-test-data-generator", name: "AI Test Data Generator", description: "Generate realistic, anonymized test data based on schema descriptions or existing data samples.",
        icon: <VariableIcon />, category: "AI Tools", tags: ["AI-powered", "Testing", "Database Schema"],
        keywords: ["test data", "mock data", "generator", "anonymization", "privacy"], status: "Beta", tier: "Pro"
    },
    {
        id: "ai-api-spec-generator", name: "AI API Spec Generator", description: "Generate OpenAPI/Swagger specifications from existing code, database schemas, or natural language prompts.",
        icon: <CodeBracketIcon />, category: "AI Tools", tags: ["AI-powered", "APIs", "Documentation", "Backend"],
        keywords: ["api", "openapi", "swagger", "spec", "documentation", "rest", "graphql"], tier: "Pro"
    },
    {
        id: "figma-to-code", name: "Figma to Code Converter", description: "Convert Figma designs directly into production-ready frontend code, assisted by AI.",
        icon: <Square2StackIcon />, category: "Frontend", tags: ["UI/UX", "Code Generation", "Design", "AI-powered"],
        keywords: ["figma", "design to code", "frontend", "ui", "component"], status: "Experimental", tier: "Enterprise"
    },
    {
        id: "kubernetes-manifest-generator", name: "K8s Manifest Generator", description: "Generate Kubernetes YAML manifests for deployments, services, and ingresses from a high-level description.",
        icon: <CubeIcon />, category: "Containerization", tags: ["Kubernetes", "DevOps", "Automation", "Cloud Native"],
        keywords: ["kubernetes", "k8s", "yaml", "deployment", "service", "ingress"], tier: "Pro"
    },
    {
        id: "serverless-function-builder", name: "Serverless Function Builder", description: "Visually design and deploy serverless functions for AWS Lambda, GCP Cloud Functions, or Azure Functions.",
        icon: <RocketLaunchIcon />, category: "Serverless", tags: ["Serverless", "Backend", "Cloud Native", "DevOps"],
        keywords: ["serverless", "lambda", "cloud functions", "azure functions", "aws", "gcp", "azure"]
    },
    {
        id: "graphql-explorer", name: "GraphQL API Explorer", description: "Explore, test, and document GraphQL APIs with an interactive query builder and schema viewer.",
        icon: <GlobeAltIcon />, category: "APIs", tags: ["GraphQL", "Testing", "Documentation"],
        keywords: ["graphql", "api", "query", "schema", "introspection", "explorer"]
    },
    {
        id: "distributed-trace-analyzer", name: "Distributed Trace Analyzer", description: "Visualize and analyze end-to-end distributed traces to identify bottlenecks and errors across microservices.",
        icon: <Bars3CenterLeftIcon />, category: "Observability", tags: ["Observability", "Performance Tuning", "Data Visualization"],
        keywords: ["distributed tracing", "opentelemetry", "jaeger", "zipkin", "microservices", "bottleneck"], tier: "Enterprise"
    },
    {
        id: "secure-code-auditor", name: "AI Secure Code Auditor", description: "Perform in-depth security audits of your codebase, identifying OWASP top 10 vulnerabilities and suggesting AI-powered remediation.",
        icon: <FingerPrintIcon />, category: "Security", tags: ["Security Audit", "AI-powered", "Compliance"],
        keywords: ["security", "audit", "owasp", "vulnerability", "code scan", "remediation"], tier: "Enterprise", relatedFeatures: ["security-scanner"]
    },
    {
        id: "cli-command-builder", name: "AI CLI Command Builder", description: "Generate complex CLI commands for various tools (e.g., Git, Docker, Kubernetes) from natural language descriptions.",
        icon: <CommandLineIcon />, category: "Productivity", tags: ["AI-powered", "Automation", "DevOps"],
        keywords: ["cli", "command line", "bash", "shell", "git", "docker", "kubernetes"]
    },
    {
        id: "design-system-linter", name: "Design System Linter", description: "Audit UI components against your established design system rules and identify inconsistencies.",
        icon: <AdjustmentsHorizontalIcon />, category: "Design System", tags: ["UI/UX", "Design", "Testing", "Frontend Frameworks"],
        keywords: ["design system", "linter", "ui components", "consistency", "audit"], tier: "Pro"
    },
    {
        id: "seo-keyword-analyzer", name: "AI SEO Keyword Analyzer", description: "Analyze website content and suggest optimal keywords and content strategies using AI for improved search engine ranking.",
        icon: <MagnifyingGlassCircleIcon />, category: "AI Tools", tags: ["AI-powered", "Productivity", "Frontend"],
        keywords: ["seo", "keyword research", "content strategy", "ranking", "marketing"], tier: "Pro"
    },
    {
        id: "sentiment-analysis-debugger", name: "AI Sentiment Analysis Debugger", description: "Analyze text for sentiment, highlight key phrases, and debug AI models for biased or incorrect sentiment classification.",
        icon: <BeakerIcon />, category: "AI Tools", tags: ["AI-powered", "Testing", "Data"],
        keywords: ["sentiment analysis", "nlp", "ai model", "debugger", "bias"], status: "Experimental"
    },
    {
        id: "data-governance-auditor", name: "Data Governance Auditor", description: "Scan databases and data pipelines to ensure compliance with data governance policies and regulations (GDPR, HIPAA).",
        icon: <CheckBadgeIcon />, category: "Compliance", tags: ["Security Audit", "Database", "Data"],
        keywords: ["data governance", "gdpr", "hipaa", "compliance", "audit", "data privacy"], tier: "Enterprise"
    },
    {
        id: "blockchain-smart-contract-auditor", name: "Smart Contract Auditor", description: "Scan Solidity or other smart contract code for vulnerabilities and gas optimization issues.",
        icon: <PuzzlePieceIcon />, category: "Web3", tags: ["Security Audit", "Testing", "Blockchain"],
        keywords: ["blockchain", "smart contract", "solidity", "audit", "vulnerability", "gas optimization"], tier: "Enterprise", status: "Beta"
    },
    {
        id: "technical-interviewer-ai", name: "AI Technical Interviewer", description: "Simulate technical interviews with an AI, get feedback on your answers, and practice coding challenges.",
        icon: <UserGroupIcon />, category: "Education", tags: ["AI-powered", "Learning"],
        keywords: ["interview prep", "technical interview", "coding challenge", "practice", "ai feedback"], status: "Beta"
    },
    {
        id: "code-quiz-generator", name: "AI Code Quiz Generator", description: "Generate multiple-choice or coding quizzes on any programming topic using AI.",
        icon: <AcademicCapIcon />, category: "Education", tags: ["AI-powered", "Learning"],
        keywords: ["quiz", "test", "programming", "education", "learning"], tier: "Pro"
    },
    {
        id: "download-center", name: "Download Center", description: "Manage and track all code snippets, generated assets, and reports for easy access.",
        icon: <ArrowDownTrayIcon />, category: "Productivity", tags: ["Productivity"],
        keywords: ["downloads", "assets", "reports", "files", "management"]
    },
    {
        id: "browser-extension-builder", name: "Browser Extension Builder", description: "Visually build and prototype browser extensions with AI-assisted code generation.",
        icon: <WindowIcon />, category: "Frontend", tags: ["Code Generation", "AI-powered"],
        keywords: ["browser extension", "chrome extension", "firefox addon", "web extension", "prototype"], status: "Coming Soon"
    },
    {
        id: "announcement-board", name: "Announcement Board", description: "Centralized hub for team announcements, updates, and feature rollouts.",
        icon: <MegaphoneIcon />, category: "Workflow", tags: ["Collaboration", "Productivity"],
        keywords: ["announcements", "updates", "team communication", "news"]
    }
];

export const ALL_FEATURE_IDS = RAW_FEATURES.map(f => f.id);

/**
 * Retrieves a feature by its unique ID.
 * @param id The ID of the feature to retrieve.
 * @returns The feature object, or undefined if not found.
 */
export function getFeatureById(id: string): RawFeature | undefined {
    return RAW_FEATURES.find(feature => feature.id === id);
}

/**
 * Filters features by a specific category.
 * @param category The category to filter by.
 * @returns An array of features belonging to the specified category.
 */
export function getFeaturesByCategory(category: FeatureCategory): RawFeature[] {
    return RAW_FEATURES.filter(feature => feature.category === category);
}

/**
 * Filters features that have a specific tag.
 * @param tag The tag to filter by.
 * @returns An array of features that include the specified tag.
 */
export function getFeaturesByTag(tag: FeatureTag): RawFeature[] {
    return RAW_FEATURES.filter(feature => feature.tags && feature.tags.includes(tag));
}

/**
 * Filters features by a specific status.
 * @param status The status to filter by.
 * @returns An array of features with the specified status.
 */
export function getFeaturesByStatus(status: FeatureStatus): RawFeature[] {
    return RAW_FEATURES.filter(feature => feature.status === status);
}

/**
 * Filters features by a specific tier.
 * @param tier The tier to filter by.
 * @returns An array of features available in the specified tier.
 */
export function getFeaturesByTier(tier: FeatureTier): RawFeature[] {
    return RAW_FEATURES.filter(feature => feature.tier === tier);
}

/**
 * Searches for features based on a query string, optionally filtered by categories and tags.
 * The search matches against feature name, description, and keywords.
 * @param query The search string.
 * @param options Optional filters including categories and tags.
 * @returns An array of matching features.
 */
export function searchFeatures(
    query: string,
    options?: { categories?: FeatureCategory[], tags?: FeatureTag[], status?: FeatureStatus[], tier?: FeatureTier[] }
): RawFeature[] {
    const lowerCaseQuery = query.toLowerCase();

    return RAW_FEATURES.filter(feature => {
        const matchesQuery =
            feature.name.toLowerCase().includes(lowerCaseQuery) ||
            feature.description.toLowerCase().includes(lowerCaseQuery) ||
            (feature.keywords && feature.keywords.some(kw => kw.toLowerCase().includes(lowerCaseQuery)));

        if (!matchesQuery) return false;

        if (options?.categories && options.categories.length > 0 && !options.categories.includes(feature.category)) {
            return false;
        }

        if (options?.tags && options.tags.length > 0 && (!feature.tags || !options.tags.some(t => feature.tags!.includes(t)))) {
            return false;
        }

        if (options?.status && options.status.length > 0 && (!feature.status || !options.status.includes(feature.status))) {
            return false;
        }

        if (options?.tier && options.tier.length > 0 && (!feature.tier || !options.tier.includes(feature.tier))) {
            return false;
        }

        return true;
    });
}

/**
 * Retrieves related features for a given feature ID.
 * @param featureId The ID of the feature to find related ones for.
 * @returns An array of related feature objects.
 */
export function getRelatedFeatures(featureId: string): RawFeature[] {
    const feature = getFeatureById(featureId);
    if (!feature || !feature.relatedFeatures || feature.relatedFeatures.length === 0) {
        return [];
    }
    return feature.relatedFeatures.map(id => getFeatureById(id)).filter(f => f !== undefined) as RawFeature[];
}

/**
 * A class to encapsulate feature discovery and management.
 * This can be instantiated or used statically.
 */
export class FeatureManager {
    private features: RawFeature[];

    constructor(features: RawFeature[] = RAW_FEATURES) {
        this.features = features;
    }

    public getById(id: string): RawFeature | undefined {
        return this.features.find(feature => feature.id === id);
    }

    public filterByCategory(category: FeatureCategory): RawFeature[] {
        return this.features.filter(feature => feature.category === category);
    }

    public filterByTag(tag: FeatureTag): RawFeature[] {
        return this.features.filter(feature => feature.tags && feature.tags.includes(tag));
    }

    public filterByStatus(status: FeatureStatus): RawFeature[] {
        return this.features.filter(feature => feature.status === status);
    }

    public filterByTier(tier: FeatureTier): RawFeature[] {
        return this.features.filter(feature => feature.tier === tier);
    }

    public search(
        query: string,
        options?: { categories?: FeatureCategory[], tags?: FeatureTag[], status?: FeatureStatus[], tier?: FeatureTier[] }
    ): RawFeature[] {
        const lowerCaseQuery = query.toLowerCase();

        return this.features.filter(feature => {
            const matchesQuery =
                feature.name.toLowerCase().includes(lowerCaseQuery) ||
                feature.description.toLowerCase().includes(lowerCaseQuery) ||
                (feature.keywords && feature.keywords.some(kw => kw.toLowerCase().includes(lowerCaseQuery)));

            if (!matchesQuery) return false;

            if (options?.categories && options.categories.length > 0 && !options.categories.includes(feature.category)) {
                return false;
            }

            if (options?.tags && options.tags.length > 0 && (!feature.tags || !options.tags.some(t => feature.tags!.includes(t)))) {
                return false;
            }

            if (options?.status && options.status.length > 0 && (!feature.status || !options.status.includes(feature.status))) {
                return false;
            }

            if (options?.tier && options.tier.length > 0 && (!feature.tier || !options.tier.includes(feature.tier))) {
                return false;
            }

            return true;
        });
    }

    public getRelated(featureId: string): RawFeature[] {
        const feature = this.getById(featureId);
        if (!feature || !feature.relatedFeatures || feature.relatedFeatures.length === 0) {
            return [];
        }
        return feature.relatedFeatures.map(id => this.getById(id)).filter(f => f !== undefined) as RawFeature[];
    }

    public getAllFeatures(): RawFeature[] {
        return [...this.features];
    }

    public getCategoryList(): FeatureCategory[] {
        return [...new Set(this.features.map(f => f.category))];
    }

    public getTagList(): FeatureTag[] {
        const allTags = this.features.flatMap(f => f.tags || []);
        return [...new Set(allTags)];
    }
}

// Optionally export a default instance for convenience
export const featureManager = new FeatureManager(RAW_FEATURES);
