/**
 * @file This file serves as the master manifest for all dynamically loaded features (micro-frontends).
 * It provides the necessary metadata for the application shell, routing, and the ResourceOrchestrator
 * to discover, pre-fetch, and render features. This centralized manifest is a key component of the
 * federated micro-frontend architecture, enabling independent deployment and dynamic loading of features.
 *
 * @copyright James Burvel O'Callaghan III
 * @license Apache-2.0
 * @see IArchitectural Directives: "Transition to a Federated Micro-Frontend and Microservice Architecture"
 * @see IArchitectural Directives: "Introduce a Proactive Resource Orchestration Layer"
 * @see IArchitectural Directives: "Mandate Comprehensive JSDoc"
 */

import type { FeatureCategory, FeatureTag, FeatureStatus } from '../../constants.tsx';

/**
 * @interface FeatureRemote
 * @description Defines the remote entry configuration for a federated micro-frontend,
 * following the principles of Module Federation.
 * @security The 'url' should be sourced from a trusted, environment-specific configuration to prevent loading malicious code.
 * @performance The 'url' can be versioned or point to a CDN for optimal caching and delivery.
 */
export interface FeatureRemote {
  /**
   * The unique scope name of the remote container, used to avoid conflicts in the global scope.
   * @example "feature_aiCodeExplainer"
   */
  scope: string;

  /**
   * The URL where the remote's entry script (e.g., remoteEntry.js) is hosted.
   * In a production environment, this will be dynamically resolved by the ResourceOrchestrator.
   * @example "/remotes/ai-code-explainer/remoteEntry.js"
   */
  url: string;

  /**
   * The module to be exposed and loaded from the remote container.
   * This typically corresponds to the main component of the feature.
   * @example "./AiCodeExplainer"
   */
  module: string;
}

/**
 * @interface FeaturePrefetchHints
 * @description Provides hints to the ResourceOrchestrator for predictive pre-fetching,
 * aiming to improve perceived performance by loading resources before they are explicitly requested.
 * @performance These hints directly influence resource loading strategy and network usage.
 *              Incorrect hints could lead to wasted bandwidth or pre-fetching of unnecessary assets.
 */
export interface FeaturePrefetchHints {
  /**
   * An array of feature IDs that are frequently accessed *after* the current feature.
   * This allows for predictive loading of subsequent micro-frontends.
   * @example ["ai-pull-request-assistant", "ai-commit-generator"]
   */
  next?: string[];

  /**
   * An array of contextual keywords or application states in which this feature is likely to be used.
   * This can be used to pre-fetch features when the application enters a specific state.
   * @example ["code-review", "debugging-session"]
   */
  contexts?: string[];
}

/**
 * @interface FeatureManifestEntry
 * @description Represents the complete manifest entry for a single feature (micro-frontend).
 * This structured metadata is the single source of truth for a feature's identity,
 * loading mechanism, and integration into the application shell.
 */
export interface FeatureManifestEntry {
  /**
   * A unique kebab-case identifier for the feature.
   * @example "ai-code-explainer"
   * @required
   */
  id: string;

  /**
   * The human-readable name of the feature, displayed in the UI.
   * @example "AI Code Explainer"
   * @required
   */
  name: string;

  /**
   * A concise description of the feature's purpose and functionality.
   * @example "Get a structured analysis of code, including complexity."
   * @required
   */
  description: string;

  /**
   * The name of the icon component associated with the feature.
   * The UI framework will resolve this string to an actual icon component.
   * @example "CodeExplainerIcon"
   * @required
   */
  icon: string;

  /**
   * The category the feature belongs to, used for grouping and organization in the UI.
   * @example "AI Tools"
   * @required
   */
  category: FeatureCategory;

  /**
   * Configuration for loading this feature as a remote module.
   * @required
   */
  remote: FeatureRemote;

  /**
   * An array of tags for enhanced searchability and filtering.
   * @example ["AI-powered", "Documentation", "Learning"]
   */
  tags: FeatureTag[];

  /**
   * The current development or release status of the feature.
   * @example "GA"
   */
  status: FeatureStatus;

  /**
   * An array of permission strings required to access this feature.
   * Used by the authorization layer to control visibility and access.
   * @example ["feature:ai-tools:read", "feature:ai-code-explainer:execute"]
   */
  requiredPermissions?: string[];

  /**
   * Hints for the ResourceOrchestrator to enable predictive pre-fetching.
   */
  prefetchHints?: FeaturePrefetchHints;
}

/**
 * Creates a standardized remote configuration object for a feature.
 * @param id The feature's unique ID.
 * @param name The feature's name, used to derive module name.
 * @returns {FeatureRemote} The remote configuration object.
 * @private
 */
const createRemoteConfig = (id: string, name: string): FeatureRemote => ({
  scope: `feature_${id.replace(/-/g, '_')}`,
  url: `/remotes/${id}/remoteEntry.js`,
  module: `./${name.replace(/[^a-zA-Z0-9]/g, '')}`
});

/**
 * @const {FeatureManifestEntry[]} FEATURE_MANIFEST
 * @description The master manifest of all available features in the DevCore AI Toolkit.
 * This array serves as the single source of truth for feature discovery and loading.
 * Each entry is structured to support a federated micro-frontend architecture.
 */
export const FEATURE_MANIFEST: FeatureManifestEntry[] = [
  // Core & Workflow
  {
      id: "ai-command-center", name: "AI Command Center", description: "Use natural language to navigate and control the toolkit.",
      icon: "CommandCenterIcon", category: "Core", tags: ["AI-powered", "Productivity", "Automation"], status: "GA",
      remote: createRemoteConfig("ai-command-center", "AiCommandCenter")
  },
  {
      id: "project-explorer", name: "Project Explorer", description: "Manage and edit files from your connected repositories.",
      icon: "ProjectExplorerIcon", category: "Core", tags: ["Editor", "Productivity"], status: "GA",
      remote: createRemoteConfig("project-explorer", "ProjectExplorer")
  },
  {
      id: "workspace-connector-hub", name: "Workspace Connector Hub", description: "Connect to services like Jira, Slack & GitHub to orchestrate actions with AI.",
      icon: "RectangleGroupIcon", category: "Workflow", tags: ["Automation", "Collaboration", "AI-powered"], status: "GA",
      remote: createRemoteConfig("workspace-connector-hub", "WorkspaceConnectorHub")
  },
  {
      id: "logic-flow-builder", name: "Logic Flow Builder", description: "A visual tool for building application logic flows.",
      icon: "LogicFlowBuilderIcon", category: "Workflow", tags: ["Workflow", "Data Visualization", "Editor"], status: "Beta",
      remote: createRemoteConfig("logic-flow-builder", "LogicFlowBuilder")
  },

  // AI Tools
  {
      id: "ai-code-explainer", name: "AI Code Explainer", description: "Get a structured analysis of code, including complexity.",
      icon: "CodeExplainerIcon", category: "AI Tools", tags: ["AI-powered", "Documentation", "Learning"], status: "GA",
      remote: createRemoteConfig("ai-code-explainer", "AiCodeExplainer"),
      prefetchHints: { contexts: ["debugging-session"], next: ["one-click-refactor"] }
  },
  {
      id: "ai-feature-builder", name: "AI Feature Builder", description: "Generate code, tests, and commit messages from a prompt.",
      icon: "FeatureBuilderIcon", category: "AI Tools", tags: ["AI-powered", "Code Generation", "Automation"], status: "GA",
      remote: createRemoteConfig("ai-feature-builder", "AiFeatureBuilder"),
      prefetchHints: { next: ["deployment-preview"] }
  },
  {
      id: "ai-full-stack-builder", name: "AI Full-Stack Builder", description: "Generate a frontend component, backend cloud function, and database rules.",
      icon: "ServerStackIcon", category: "AI Tools", tags: ["AI-powered", "Code Generation", "Backend", "Frontend", "Database"], status: "Beta",
      remote: createRemoteConfig("ai-full-stack-builder", "AiFullStackFeatureBuilder")
  },
  {
      id: "ai-pull-request-assistant", name: "AI Pull Request Assistant", description: "Generate a structured PR summary from code diffs.",
      icon: "AiPullRequestAssistantIcon", category: "AI Tools", tags: ["AI-powered", "Git", "Productivity", "Automation"], status: "GA",
      remote: createRemoteConfig("ai-pull-request-assistant", "AiPullRequestAssistant"),
      prefetchHints: { contexts: ["code-review"] }
  },
  {
      id: "ai-commit-generator", name: "AI Commit Message Generator", description: "Smart, conventional commits via AI.",
      icon: "CommitGeneratorIcon", category: "AI Tools", tags: ["AI-powered", "Git", "Automation"], status: "GA",
      remote: createRemoteConfig("ai-commit-generator", "AiCommitGenerator")
  },
  {
      id: "ai-unit-test-generator", name: "AI Unit Test Generator", description: "Generate unit tests from source code.",
      icon: "UnitTestGeneratorIcon", category: "Testing", tags: ["AI-powered", "Code Generation", "Testing"], status: "GA",
      remote: createRemoteConfig("ai-unit-test-generator", "AiUnitTestGenerator")
  },

  // Frontend & Design
  {
      id: "theme-designer", name: "AI Theme Designer", description: "Generate, fine-tune, and export UI color themes.",
      icon: "ThemeDesignerIcon", category: "Design", tags: ["AI-powered", "Design", "UI/UX"], status: "GA",
      remote: createRemoteConfig("theme-designer", "ThemeDesigner")
  },
  {
      id: "css-grid-editor", name: "CSS Grid Visual Editor", description: "Drag-based layout builder for CSS Grid.",
      icon: "CssGridEditorIcon", category: "Frontend", tags: ["UI/UX", "Editor", "Design"], status: "GA",
      remote: createRemoteConfig("css-grid-editor", "CssGridEditor")
  },
  {
      id: "responsive-tester", name: "Responsive Tester", description: "Preview web pages at different screen sizes.",
      icon: "ResponsiveTesterIcon", category: "Frontend", tags: ["Testing", "UI/UX"], status: "GA",
      remote: createRemoteConfig("responsive-tester", "ResponsiveTester")
  },
  {
      id: "pwa-manifest-editor", name: "PWA Manifest Editor", description: "Configure and preview Progressive Web App manifests.",
      icon: "PwaManifestEditorIcon", category: "Frontend", tags: ["Mobile Development", "Editor"], status: "GA",
      remote: createRemoteConfig("pwa-manifest-editor", "PwaManifestEditor")
  },
  {
      id: "typography-lab", name: "Typography Lab", description: "Preview font pairings and get CSS import rules.",
      icon: "TypographyLabIcon", category: "Frontend", tags: ["Design", "UI/UX"], status: "GA",
      remote: createRemoteConfig("typography-lab", "TypographyLab")
  },

  // Productivity & Utilities
  {
      id: "portable-snippet-vault", name: "Snippet Vault", description: "Store, search, tag, and enhance reusable code snippets.",
      icon: "SnippetVaultIcon", category: "Productivity", tags: ["AI-powered", "Productivity", "Editor"], status: "GA",
      remote: createRemoteConfig("portable-snippet-vault", "SnippetVault")
  },
  {
      id: "digital-whiteboard", name: "Digital Whiteboard", description: "Organize ideas with interactive sticky notes and AI summaries.",
      icon: "DigitalWhiteboardIcon", category: "Productivity", tags: ["Collaboration", "AI-powered"], status: "GA",
      remote: createRemoteConfig("digital-whiteboard", "DigitalWhiteboard")
  },
  {
      id: "markdown-slides-generator", name: "Markdown Slides", description: "Turn markdown into a fullscreen presentation.",
      icon: "MarkdownSlidesIcon", category: "Productivity", tags: ["Documentation", "UI/UX"], status: "GA",
      remote: createRemoteConfig("markdown-slides-generator", "MarkdownSlides")
  },
  {
      id: "regex-sandbox", name: "RegEx Sandbox", description: "Visually test regular expressions and generate them with AI.",
      icon: "RegexSandboxIcon", category: "Testing", tags: ["Editor", "AI-powered"], status: "GA",
      remote: createRemoteConfig("regex-sandbox", "RegexSandbox")
  }
];
