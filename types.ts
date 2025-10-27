/**
 * @file types.ts
 * @description This file contains the core domain models, interfaces, and type
 * definitions used across the micro-frontend architecture of the application.
 * It serves as a single source of truth for data structures, ensuring consistency
 * between different parts of the system, including UI components, services, and
 * communication protocols.
 *
 * @security This file should not contain any sensitive data or secrets. It defines
 * the shape of data, not the data itself.
 * @performance Be mindful of the size and complexity of types. While TypeScript
 * types are erased at runtime, overly complex types can slow down the development
 * and build processes.
 * @see constants.tsx for related constant definitions.
 */

import type React from 'react';
import { CHROME_VIEW_IDS, FEATURE_CATEGORIES } from './constants.tsx';

// ==========================================================================
// SECTION: Core Application & Shell Types
// ==========================================================================

/**
 * @typedef {'light' | 'dark'} ThemeMode
 * @description Represents the base color mode of the application theme.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * @typedef {string} MicroFrontendId
 * @description A unique string identifier for a micro-frontend.
 * @example "ai-code-explainer"
 */
export type MicroFrontendId = string;

/**
 * @typedef {typeof CHROME_VIEW_IDS[number]} ChromeViewType
 * @description Represents the ID of a core UI view that is part of the application shell,
 * not a pluggable micro-frontend (e.g., 'settings').
 */
export type ChromeViewType = typeof CHROME_VIEW_IDS[number];

/**
 * @typedef {MicroFrontendId | ChromeViewType} ViewType
 * @description A union type representing any possible view that can be rendered in the main
 * content area of the application shell.
 */
export type ViewType = MicroFrontendId | ChromeViewType;

/**
 * @interface AppUser
 * @description Represents the authenticated user of the application. This data is typically
 * derived from the JWT provided by the AuthGateway and enriched by the BFF.
 * @security This object is client-side and should not contain sensitive permissions data
 * that could be tampered with. Authorization is always re-verified server-side.
 */
export interface AppUser {
  /**
   * @property {string} uid - The user's unique identifier (e.g., from the OIDC provider).
   */
  uid: string;
  /**
   * @property {string | null} displayName - The user's display name.
   */
  displayName: string | null;
  /**
   * @property {string | null} email - The user's primary email address.
   */
  email: string | null;
  /**
   * @property {string | null} photoURL - A URL pointing to the user's profile picture.
   */
  photoURL: string | null;
  /**
   * @property {('free' | 'pro' | 'enterprise')} tier - The user's subscription tier.
   */
  tier: 'free' | 'pro' | 'enterprise';
  /**
   * @property {string[]} roles - An array of roles assigned to the user, which may
   * influence UI presentation (e.g., showing an 'Admin' badge).
   */
  roles: string[];
}

/**
 * @interface SidebarItem
 * @description Defines the structure for an item in the main application sidebar,
 * used for navigation.
 */
export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: ViewType;
  props?: any;
  action?: () => void;
}

// ==========================================================================
// SECTION: Micro-Frontend & Workspace Types
// ==========================================================================

/**
 * @typedef {typeof FEATURE_CATEGORIES[number]} MicroFrontendCategory
 * @description A category used to group related micro-frontends in the UI.
 */
export type MicroFrontendCategory = typeof FEATURE_CATEGORIES[number];

/**
 * @interface MicroFrontendManifest
 * @description Defines the metadata for a micro-frontend application. This manifest
 * is used by the shell application (WorkspaceManager) to load, display, and interact
 * with a micro-frontend.
 * @see WorkspaceManager in the Composite UI library for how these manifests are used.
 */
export interface MicroFrontendManifest {
  /**
   * @property {MicroFrontendId} id - A unique identifier for the micro-frontend.
   * @example "ai-code-explainer"
   */
  id: MicroFrontendId;
  /**
   * @property {string} name - The human-readable name of the micro-frontend.
   * @example "AI Code Explainer"
   */
  name: string;
  /**
   * @property {string} description - A brief description of the micro-frontend's purpose.
   */
  description: string;
  /**
   * @property {React.ReactNode} icon - A React component to be used as the icon.
   */
  icon: React.ReactNode;
  /**
   * @property {MicroFrontendCategory} category - The category this micro-frontend belongs to.
   */
  category: MicroFrontendCategory;
  /**
   * @property {React.FC<any>} component - A lazy-loaded React component that serves as the
   * entry point for the micro-frontend. In a federated architecture, this would be
   * replaced or supplemented with remote entry details.
   * @security The component is loaded at runtime. Ensure the source is trusted.
   * @performance This component is lazy-loaded to improve initial application load time.
   */
  component: React.FC<any>;
  /**
   * @property {boolean} [isCustom] - Flag indicating if this is a user-generated
   * feature from the Feature Forge.
   */
  isCustom?: boolean;
  /**
   * @property {string} [code] - For custom features, this holds the AI-generated source code.
   * This is NOT executed directly for security reasons but is used for display and management.
   * @security This code is from an AI and should be treated as untrusted. It is
   * never evaluated directly in the main application thread.
   */
  code?: string;
}

/**
 * @interface WindowState
 * @description Represents the state of a single window within the 'desktop' workspace mode.
 * This includes its position, size, and stacking order.
 */
export interface WindowState {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
}

// ==========================================================================
// SECTION: Theme Engine Types
// ==========================================================================

/**
 * @interface ThemeColors
 * @description Defines the complete color system for a theme, including a raw palette
 * and its semantic application to UI roles.
 */
export interface ThemeColors {
  /** @property {Record<string, string>} palette - A map of named colors. E.g., { blue500: '#3b82f6' }. */
  palette: Record<string, string>;
  /** @property {string} primary - The primary brand or interactive color. */
  primary: string;
  /** @property {string} background - The main background color of the application. */
  background: string;
  /** @property {string} surface - The background color for elevated surfaces like cards and modals. */
  surface: string;
  /** @property {string} textPrimary - The color for primary text content. */
  textPrimary: string;
  /** @property {string} textSecondary - The color for secondary or less important text. */
  textSecondary: string;
  /** @property {string} textOnPrimary - The color for text placed on top of a primary-colored background. */
  textOnPrimary: string;
  /** @property {string} border - The color for borders and dividers. */
  border: string;
}

/**
 * @interface ThemeTypography
 * @description Defines the typography system for a theme.
 */
export interface ThemeTypography {
  /** @property {string} primaryFont - The font family for primary text and headings. */
  primaryFont: string;
  /** @property {string} secondaryFont - The font family for body text or UI elements. */
  secondaryFont: string;
  /** @property {string} monoFont - The font family for code blocks and monospaced text. */
  monoFont: string;
}

/**
 * @interface ThemeDefinition
 * @description A comprehensive schema for defining a UI theme. This object is
 * consumed by the ThemeEngine to apply styles dynamically across the application.
 */
export interface ThemeDefinition {
  /**
   * @property {string} id - A unique identifier for the theme.
   * @example "ocean-breeze-dark"
   */
  id: string;
  /**
   * @property {string} name - A human-readable name for the theme.
   * @example "Ocean Breeze (Dark)"
   */
  name: string;
  /**
   * @property {ThemeMode} mode - The base color mode of the theme.
   */
  mode: ThemeMode;
  /**
   * @property {ThemeColors} colors - The color palette and semantic color assignments.
   */
  colors: ThemeColors;
  /**
   * @property {ThemeTypography} typography - Defines the font families.
   */
  typography: ThemeTypography;
}

/**
 * @interface ThemeState
 * @description Represents the current state of the theme in the application,
 * including the active mode and any custom theme overrides.
 */
export interface ThemeState {
  /** @property {ThemeMode} mode - The current active theme mode. */
  mode: ThemeMode;
  /** @property {string | null} activeThemeId - The ID of the currently applied custom theme, if any. */
  activeThemeId: string | null;
}


// ==========================================================================
// SECTION: Web Worker Communication Protocol
// ==========================================================================

/**
 * @enum TaskPriority
 * @description Defines the priority levels for tasks to be executed by a Web Worker.
 * This allows the WorkerPoolManager to prioritize important computations.
 */
export enum TaskPriority {
  LOW,
  NORMAL,
  HIGH,
}

/**
 * @interface WorkerTask
 * @description Represents a task to be sent to a Web Worker for processing. This is part
 * of the standardized messaging protocol between the main thread and the worker pool.
 */
export interface WorkerTask<T = any> {
  /** @property {string} taskId - A unique identifier for the task, used to correlate requests with responses. */
  taskId: string;
  /**
   * @property {string} taskName - The name of the function or operation the worker should perform.
   * @example "markdownToHtml", "calculateDiff"
   */
  taskName: string;
  /**
   * @property {T} payload - The data required for the worker to perform the task.
   * This payload must be serializable (e.g., via the structured clone algorithm).
   */
  payload: T;
  /**
   * @property {TaskPriority} [priority=TaskPriority.NORMAL] - The priority of the task,
   * which can be used by the WorkerPoolManager to schedule execution.
   */
  priority?: TaskPriority;
}

/**
 * @interface WorkerResponse
 * @description Represents a response sent back from a Web Worker to the main thread.
 * It contains the result of a completed task or an error if the task failed.
 */
export interface WorkerResponse<T = any> {
  /** @property {string} taskId - The unique identifier of the task this response corresponds to. */
  taskId: string;
  /** @property {T | null} result - The data produced by the worker task. Null if an error occurred. */
  result: T | null;
  /** @property {string | null} error - An error message if the task failed. Null if the task was successful. */
  error: string | null;
}

// ==========================================================================
// SECTION: Domain Models & External Service Types
// ==========================================================================

/**
 * @interface GeneratedFile
 * @description Represents a file generated by an AI service, containing its path and content.
 */
export interface GeneratedFile {
  filePath: string;
  content: string;
  description: string;
}

/**
 * @interface FileNode
 * @description Represents a node in a file system tree, which can be either a file or a folder.
 * Used by the ProjectExplorer.
 */
export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

/**
 * @interface Repo
 * @description Represents a GitHub repository as returned by the GitHub API proxy.
 */
export interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  owner: { login: string };
}

/**
 * @interface GitHubUser
 * @description Represents a GitHub user profile as returned by the GitHub API proxy.
 */
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
}

// ==========================================================================
// SECTION: AI Model & Service Interaction Types
// ==========================================================================

/**
 * @interface StructuredPrSummary
 * @description The structured JSON output from the AI when summarizing a pull request.
 */
export interface StructuredPrSummary {
  title: string;
  summary: string;
  changes: string[];
}

/**
 * @interface StructuredExplanation
 * @description The structured JSON output from the AI when explaining a code snippet.
 */
export interface StructuredExplanation {
  summary: string;
  lineByLine: { lines: string; explanation: string }[];
  complexity: { time: string; space: string };
  suggestions: string[];
}

/**
 * @interface StructuredReviewSuggestion
 * @description A single, specific suggestion within a structured code review.
 */
export interface StructuredReviewSuggestion {
  suggestion: string;
  codeBlock: string;
  explanation: string;
}

/**
 * @interface StructuredReview
 * @description The structured JSON output from the AI when performing a code review.
 */
export interface StructuredReview {
  summary: string;
  suggestions: StructuredReviewSuggestion[];
}

/**
 * @interface SystemPrompt
 * @description Defines a configurable AI personality, including persona, rules, and examples.
 * Used by the AiPersonalityForge.
 */
export interface SystemPrompt {
  id: string;
  name: string;
  persona: string;
  rules: string[];
  outputFormat: 'json' | 'markdown' | 'text';
  exampleIO: { input: string; output: string }[];
}

/**
 * @interface SecurityVulnerability
 * @description A structured representation of a security vulnerability identified by the AI scanner.
 */
export interface SecurityVulnerability {
  vulnerability: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  description: string;
  mitigation: string;
  exploitSuggestion?: string;
}

/**
 * @interface CodeSmell
 * @description A structured representation of a code smell or technical debt issue identified by the AI.
 */
export interface CodeSmell {
  smell: string;
  line: number;
  explanation: string;
}

/**
 * @interface SlideSummary
 * @description Represents the content for a single slide generated from Markdown.
 */
export interface SlideSummary {
  title: string;
  body: string;
}

/**
 * @deprecated The EncryptedData interface is deprecated as of the architectural
 * shift to a server-side, zero-trust authentication model. The client no longer
 * handles or stores encrypted secrets. All secrets management is now handled by
 * the AuthGateway microservice and a server-side vault.
 * @see AuthGateway microservice documentation for details on the new security model.
 */
export interface EncryptedData {}
