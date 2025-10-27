/**
 * @file This module serves as the central feature manifest for the application.
 * It orchestrates the lazy loading of all feature components, mapping unique feature IDs
 * from the `RAW_FEATURES` constant to their dynamically imported React components.
 * This file is critical for the pluggable architecture, allowing the application to scale by adding
 * new features without modifying the core application structure.
 * @module components/features/index
 * @see {@link ../../constants.tsx} for the raw feature metadata.
 * @see {@link ../../services/componentLoader.ts} for the resilient component loading strategy.
 * @performance This file uses a resilient lazy loading mechanism (`lazyWithJesterResilience`) to handle
 * network failures and chunk loading errors that can occur during new deployments. This improves
 * application stability and user experience by preventing crashes due to loading failures.
 * @security As this module dynamically imports code, it relies on the integrity of the bundled chunks.
 * The build system's security and Content Security Policy (CSP) are crucial to prevent loading of
 * malicious or unauthorized code. All lazy-loaded components are wrapped in a React Suspense
 * boundary with a fallback UI, and an ErrorBoundary should be used higher up the component tree to catch
 * any rendering errors within the loaded features.
 */

import React from 'react';
import type { Feature } from '../../types.ts';
import { RAW_FEATURES } from '../../constants.tsx';
import { lazyWithJesterResilience } from '../../services/componentLoader.ts';

/**
 * @constant {Record<string, React.FC<any>>} componentMap
 * @description A mapping from feature ID strings to their lazily-loaded React functional components.
 * Each entry uses `lazyWithJesterResilience` to wrap a dynamic `import()` statement, ensuring that
 * components are only loaded when needed and that the loading process is resilient to failures.
 * @example
 * 'ai-command-center': lazyWithJesterResilience(() => import('./AiCommandCenter.tsx'), 'AiCommandCenter')
 */
const componentMap: Record<string, React.FC<any>> = {
    'ai-command-center': lazyWithJesterResilience(() => import('./AiCommandCenter.tsx'), 'AiCommandCenter'),
    'project-explorer': lazyWithJesterResilience(() => import('./ProjectExplorer.tsx'), 'ProjectExplorer'),
    'workspace-connector-hub': lazyWithJesterResilience(() => import('./WorkspaceConnectorHub.tsx'), 'WorkspaceConnectorHub'),
    'ai-code-explainer': lazyWithJesterResilience(() => import('./AiCodeExplainer.tsx'), 'AiCodeExplainer'),
    'ai-feature-builder': lazyWithJesterResilience(() => import('./AiFeatureBuilder.tsx'), 'AiFeatureBuilder'),
    'regex-sandbox': lazyWithJesterResilience(() => import('./RegexSandbox.tsx'), 'RegexSandbox'),
    'portable-snippet-vault': lazyWithJesterResilience(() => import('./SnippetVault.tsx'), 'SnippetVault'),
    'css-grid-editor': lazyWithJesterResilience(() => import('./CssGridEditor.tsx'), 'CssGridEditor'),
    'ai-commit-generator': lazyWithJesterResilience(() => import('../AiCommitGenerator.tsx'), 'AiCommitGenerator'),
    'json-tree-navigator': lazyWithJesterResilience(() => import('./JsonTreeNavigator.tsx'), 'JsonTreeNavigator'),
    'xbrl-converter': lazyWithJesterResilience(() => import('./XbrlConverter.tsx'), 'XbrlConverter'),
    'ai-unit-test-generator': lazyWithJesterResilience(() => import('./AiUnitTestGenerator.tsx'), 'AiUnitTestGenerator'),
    'prompt-craft-pad': lazyWithJesterResilience(() => import('./PromptCraftPad.tsx'), 'PromptCraftPad'),
    'linter-formatter': lazyWithJesterResilience(() => import('./CodeFormatter.tsx'), 'CodeFormatter'),
    'schema-designer': lazyWithJesterResilience(() => import('./SchemaDesigner.tsx'), 'SchemaDesigner'),
    'pwa-manifest-editor': lazyWithJesterResilience(() => import('./PwaManifestEditor.tsx'), 'PwaManifestEditor'),
    'markdown-slides-generator': lazyWithJesterResilience(() => import('./MarkdownSlides.tsx'), 'MarkdownSlides'),
    'screenshot-to-component': lazyWithJesterResilience(() => import('./ScreenshotToComponent.tsx'), 'ScreenshotToComponent'),
    'digital-whiteboard': lazyWithJesterResilience(() => import('./DigitalWhiteboard.tsx'), 'DigitalWhiteboard'),
    'theme-designer': lazyWithJesterResilience(() => import('./ThemeDesigner.tsx'), 'ThemeDesigner'),
    'svg-path-editor': lazyWithJesterResilience(() => import('./SvgPathEditor.tsx'), 'SvgPathEditor'),
    'ai-style-transfer': lazyWithJesterResilience(() => import('./AiStyleTransfer.tsx'), 'AiStyleTransfer'),
    'ai-coding-challenge': lazyWithJesterResilience(() => import('../AiCodingChallenge.tsx'), 'AiCodingChallenge'),
    'typography-lab': lazyWithJesterResilience(() => import('./TypographyLab.tsx'), 'TypographyLab'),
    'code-review-bot': lazyWithJesterResilience(() => import('./CodeReviewBot.tsx'), 'CodeReviewBot'),
    'ai-pull-request-assistant': lazyWithJesterResilience(() => import('./AiPullRequestAssistant.tsx'), 'AiPullRequestAssistant'),
    'changelog-generator': lazyWithJesterResilience(() => import('./ChangelogGenerator.tsx'), 'ChangelogGenerator'),
    'cron-job-builder': lazyWithJesterResilience(() => import('./CronJobBuilder.tsx'), 'CronJobBuilder'),
    'ai-code-migrator': lazyWithJesterResilience(() => import('./AiCodeMigrator.tsx'), 'AiCodeMigrator'),
    'visual-git-tree': lazyWithJesterResilience(() => import('./VisualGitTree.tsx'), 'VisualGitTree'),
    'worker-thread-debugger': lazyWithJesterResilience(() => import('./WorkerThreadDebugger.tsx'), 'WorkerThreadDebugger'),
    'ai-image-generator': lazyWithJesterResilience(() => import('./AiImageGenerator.tsx'), 'AiImageGenerator'),
    'async-call-tree-viewer': lazyWithJesterResilience(() => import('./AsyncCallTreeViewer.tsx'), 'AsyncCallTreeViewer'),
    'audio-to-code': lazyWithJesterResilience(() => import('./AudioToCode.tsx'), 'AudioToCode'),
    'code-diff-ghost': lazyWithJesterResilience(() => import('./CodeDiffGhost.tsx'), 'CodeDiffGhost'),
    'code-spell-checker': lazyWithJesterResilience(() => import('./CodeSpellChecker.tsx'), 'CodeSpellChecker'),
    'color-palette-generator': lazyWithJesterResilience(() => import('./ColorPaletteGenerator.tsx'), 'ColorPaletteGenerator'),
    'logic-flow-builder': lazyWithJesterResilience(() => import('./LogicFlowBuilder.tsx'), 'LogicFlowBuilder'),
    'meta-tag-editor': lazyWithJesterResilience(() => import('./MetaTagEditor.tsx'), 'MetaTagEditor'),
    'network-visualizer': lazyWithJesterResilience(() => import('./NetworkVisualizer.tsx'), 'NetworkVisualizer'),
    'responsive-tester': lazyWithJesterResilience(() => import('./ResponsiveTester.tsx'), 'ResponsiveTester'),
    'sass-scss-compiler': lazyWithJesterResilience(() => import('./SassScssCompiler.tsx'), 'SassScssCompiler'),
    'api-mock-generator': lazyWithJesterResilience(() => import('./ApiMockGenerator.tsx'), 'ApiMockGenerator'),
    'env-manager': lazyWithJesterResilience(() => import('./EnvManager.tsx'), 'EnvManager'),
    'performance-profiler': lazyWithJesterResilience(() => import('./PerformanceProfiler.tsx'), 'PerformanceProfiler'),
    'a11y-auditor': lazyWithJesterResilience(() => import('./AccessibilityAuditor.tsx'), 'AccessibilityAuditor'),
    'ci-cd-generator': lazyWithJesterResilience(() => import('./CiCdPipelineGenerator.tsx'), 'CiCdPipelineGenerator'),
    'deployment-preview': lazyWithJesterResilience(() => import('./DeploymentPreview.tsx'), 'DeploymentPreview'),
    'security-scanner': lazyWithJesterResilience(() => import('./SecurityScanner.tsx'), 'SecurityScanner'),
    'terraform-generator': lazyWithJesterResilience(() => import('./TerraformGenerator.tsx'), 'TerraformGenerator'),
    'ai-personality-forge': lazyWithJesterResilience(() => import('./AiPersonalityForge.tsx'), 'AiPersonalityForge'),
    'weekly-digest-generator': lazyWithJesterResilience(() => import('./WeeklyDigestGenerator.tsx'), 'WeeklyDigestGenerator'),
    'one-click-refactor': lazyWithJesterResilience(() => import('./OneClickRefactor.tsx'), 'OneClickRefactor'),
    'bug-reproducer': lazyWithJesterResilience(() => import('./BugReproducer.tsx'), 'BugReproducer'),
    'tech-debt-sonar': lazyWithJesterResilience(() => import('./TechDebtSonar.tsx'), 'TechDebtSonar'),
    'iam-policy-generator': lazyWithJesterResilience(() => import('./IamPolicyGenerator.tsx'), 'IamPolicyGenerator'),
    'iam-policy-visualizer': lazyWithJesterResilience(() => import('./IamPolicyVisualizer.tsx'), 'IamPolicyVisualizer'),
    'gmail-addon-simulator': lazyWithJesterResilience(() => import('./GmailAddonSimulator.tsx'), 'GmailAddonSimulator'),
    'feature-forge': lazyWithJesterResilience(() => import('./FeatureForge.tsx'), 'FeatureForge'),
    'ai-full-stack-builder': lazyWithJesterResilience(() => import('./AiFullStackFeatureBuilder.tsx'), 'AiFullStackFeatureBuilder'),
};

/**
 * @constant {Feature[]} ALL_FEATURES
 * @description An array of fully hydrated Feature objects. This is the primary export used by UI components
 * like the FeatureDock and CommandPalette to display and launch features. It merges the raw metadata
 * from `RAW_FEATURES` with the corresponding lazily-loaded component from `componentMap`.
 */
export const ALL_FEATURES: Feature[] = RAW_FEATURES.map(feature => ({
    ...feature,
    component: componentMap[feature.id],
}));

/**
 * @constant {Map<string, Feature>} FEATURES_MAP
 * @description A Map for O(1) lookup of Feature objects by their ID. This is a performance optimization
 * for scenarios where a specific feature's full object (including its component) is needed quickly,
 * without iterating through the `ALL_FEATURES` array.
 */
export const FEATURES_MAP = new Map(ALL_FEATURES.map(f => [f.id, f]));
