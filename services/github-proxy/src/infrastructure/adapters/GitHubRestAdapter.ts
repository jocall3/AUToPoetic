/**
 * @file This file defines the `GitHubRestAdapter` class, an infrastructure-layer adapter
 * for interacting with the external GitHub REST API. It is part of the `github-proxy`
 * microservice (BFF layer) and is responsible for making direct HTTP requests to GitHub.
 *
 * Adhering to a zero-trust model, this adapter expects to receive authenticated GitHub
 * tokens (e.g., Personal Access Tokens) for each request, which would be retrieved
 * by its calling service (e.g., `GitHubProxyService`'s business logic layer) from the
 * central `AuthGateway` microservice. This ensures the adapter itself does not store
 * or manage sensitive credentials.
 *
 * It abstracts the underlying HTTP client (`axios` in this case), provides robust
 * error handling, and integrates with the common telemetry system for observability.
 * Every interaction with the GitHub API is chronicled, ensuring transparency and reliability.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logError, logEvent, measurePerformance } from '../../telemetryService.ts';

// --- Core Interfaces for GitHub Entities (simplified for adapter's return types) ---

/**
 * @interface GitHubRepo
 * @description Represents a simplified GitHub repository object returned by the API.
 */
export interface GitHubRepo {
  /** The unique identifier for the repository. */
  id: number;
  /** The name of the repository. */
  name: string;
  /** The full name of the repository, including owner (e.g., 'owner/repo-name'). */
  full_name: string;
  /** Whether the repository is private. */
  private: boolean;
  /** The URL to the repository on GitHub. */
  html_url: string;
  /** A brief description of the repository, if provided. */
  description: string | null;
  /** The default branch name (e.g., 'main' or 'master'). */
  default_branch: string;
}

/**
 * @interface GitHubFileContent
 * @description Represents the content of a single file from a GitHub repository.
 */
export interface GitHubFileContent {
  /** The Base64 encoded content of the file. */
  content: string;
  /** The encoding type of the content (e.g., 'base64'). */
  encoding: string;
  /** The SHA hash of the file blob. */
  sha: string;
  /** The size of the file in bytes. */
  size: number;
  /** The type of the object (always 'file' for content). */
  type: 'file';
  /** The URL to the raw file content. */
  download_url: string;
}

/**
 * @interface GitHubTreeItem
 * @description Represents a single item (file or directory) within a GitHub Git Tree.
 */
export interface GitHubTreeItem {
  /** The path of the item relative to the tree root. */
  path: string;
  /** The mode of the item (e.g., '100644' for file, '040000' for directory). */
  mode: string;
  /** The type of the Git object ('blob' for file, 'tree' for directory). */
  type: 'blob' | 'tree' | 'commit';
  /** The SHA hash of the Git object. */
  sha: string;
  /** The size of the file in bytes (only for 'blob' type). */
  size?: number;
  /** The URL to the Git object. */
  url: string;
}

/**
 * @interface GitHubGitTree
 * @description Represents a GitHub Git Tree object.
 */
export interface GitHubGitTree {
  /** The SHA hash of the tree. */
  sha: string;
  /** The URL to the tree object. */
  url: string;
  /** An array of items within the tree. */
  tree: GitHubTreeItem[];
  /** Indicates if the tree was fetched recursively. */
  truncated?: boolean;
}

/**
 * @interface GitHubRef
 * @description Represents a Git reference (e.g., branch, tag).
 */
export interface GitHubRef {
  /** The full reference name (e.g., 'refs/heads/main'). */
  ref: string;
  /** The URL to the reference. */
  url: string;
  /** The Git object the reference points to. */
  object: {
    sha: string;
    type: 'commit' | 'tree' | 'blob';
    url: string;
  };
}

/**
 * @interface GitHubCommit
 * @description Represents a Git Commit object.
 */
export interface GitHubCommit {
  /** The SHA hash of the commit. */
  sha: string;
  /** The URL to the commit. */
  url: string;
  /** The HTML URL to the commit on GitHub. */
  html_url: string;
  /** Commit details including author, committer, and message. */
  commit: {
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    message: string;
    tree: { sha: string; url: string };
  };
  /** The parent commits. */
  parents: Array<{ sha: string; url: string; html_url: string }>;
}

/**
 * @interface GitHubBlob
 * @description Represents a Git Blob object (raw file content).
 */
export interface GitHubBlob {
  /** The Base64 encoded content of the blob. */
  content: string;
  /** The encoding type of the content (e.g., 'base64'). */
  encoding: string;
  /** The URL to the blob. */
  url: string;
  /** The SHA hash of the blob. */
  sha: string;
  /** The size of the blob in bytes. */
  size: number;
}

/**
 * @interface GitHubCreateIssueResponse
 * @description Represents the response from creating a GitHub issue.
 */
export interface GitHubCreateIssueResponse {
  /** The unique ID of the issue. */
  id: number;
  /** The issue number. */
  number: number;
  /** The URL to the issue on GitHub. */
  html_url: string;
  /** The title of the issue. */
  title: string;
  /** The state of the issue (e.g., 'open', 'closed'). */
  state: 'open' | 'closed';
}

/**
 * @interface GitHubCreatePullRequestResponse
 * @description Represents the response from creating a GitHub pull request.
 */
export interface GitHubCreatePullRequestResponse {
  /** The unique ID of the pull request. */
  id: number;
  /** The pull request number. */
  number: number;
  /** The URL to the pull request on GitHub. */
  html_url: string;
  /** The title of the pull request. */
  title: string;
  /** The state of the pull request (e.g., 'open', 'closed'). */
  state: 'open' | 'closed';
}

/**
 * @interface GitHubMergePullRequestResponse
 * @description Represents the response from merging a GitHub pull request.
 */
export interface GitHubMergePullRequestResponse {
  /** The SHA of the merge commit. */
  sha: string;
  /** Whether the pull request was merged successfully. */
  merged: boolean;
  /** A message indicating the result of the merge. */
  message: string;
  /** The URL to the merge commit. */
  url: string;
}

/**
 * @interface GitHubAdapterConfig
 * @description Configuration options for the `GitHubRestAdapter`.
 */
export interface GitHubAdapterConfig {
  /** The base URL for the GitHub API (e.g., 'https://api.github.com'). */
  baseUrl?: string;
  /** Default timeout for API requests in milliseconds. */
  timeoutMs?: number;
  /** Max number of retries for transient API errors. */
  maxRetries?: number;
  /** Initial delay in milliseconds for exponential backoff retries. */
  retryDelayMs?: number;
  /** Optional, custom Axios instance for advanced use cases (e.g., custom interceptors). */
  axiosInstance?: AxiosInstance;
  /** Optional context to attach to all telemetry logs from this adapter. */
  telemetryContext?: Record<string, any>;
}

/**
 * @class GitHubRestAdapter
 * @description Implements an adapter for the GitHub REST API, handling HTTP communication.
 * This adapter is designed to be consumed by a business logic layer (e.g., `GitHubProxyService`)
 * within a BFF microservice. It uses `axios` for HTTP requests, incorporates retry logic,
 * and logs all significant interactions via the central telemetry service.
 */
export class GitHubRestAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly _telemetryContext: Record<string, any>;

  /**
   * @constructor
   * @param {GitHubAdapterConfig} [config] - Configuration options for the adapter.
   */
  constructor(config?: GitHubAdapterConfig) {
    this.baseUrl = config?.baseUrl || 'https://api.github.com';
    this.maxRetries = config?.maxRetries ?? 3;
    this.retryDelayMs = config?.retryDelayMs ?? 500;
    this._telemetryContext = { adapter: 'GitHubRestAdapter', ...config?.telemetryContext };

    this.httpClient = config?.axiosInstance || axios.create({
      baseURL: this.baseUrl,
      timeout: config?.timeoutMs || 30000, // 30 seconds
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevCore-GitHubProxyService/1.0', // Identify our application
      },
    });

    logEvent('GitHubRestAdapter_Initialized', { baseUrl: this.baseUrl, timeout: this.httpClient.defaults.timeout, ...this._telemetryContext });
  }

  /**
   * @private
   * @method _sleep
   * @description Introduces a non-blocking delay. Used for implementing retry backoff.
   * @param {number} ms - The number of milliseconds to wait.
   * @returns {Promise<void>}
   */
  private async _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @private
   * @method _handleApiError
   * @description Centralized error handling for Axios API calls.
   * Logs the error and transforms it into a `GitHubRestAdapterError` (or similar custom error).
   * @param {AxiosError} error - The Axios error object.
   * @param {string} operationName - The name of the API operation that failed.
   * @param {Record<string, any>} context - Additional context specific to the failing operation.
   * @returns {Error} A standardized error object.
   */
  private _handleApiError(error: AxiosError, operationName: string, context: Record<string, any>): Error {
    const fullContext = { ...this._telemetryContext, ...context, operation: operationName };
    logError(error, fullContext);

    if (error.response) {
      const { status, data, headers } = error.response;
      const message = (data as any)?.message || error.message;
      logEvent('GitHubApiErrorResponse', { operationName, status, message, headers, ...fullContext }, 'error');

      if (status === 401 || status === 403) {
        return new Error(`GitHub Authentication Failed (${status}): ${message}. Ensure your token is valid and has the necessary permissions.`);
      }
      if (status === 404) {
        return new Error(`GitHub Resource Not Found (${status}): ${message}. The requested resource might not exist.`);
      }
      if (status === 422) {
        return new Error(`GitHub Validation Error (${status}): ${message}. Check your request parameters.`);
      }
      if (status === 429) {
        const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) : undefined;
        logEvent('GitHubRateLimitExceeded', { operationName, status, retryAfter, ...fullContext }, 'warn');
        return new Error(`GitHub Rate Limit Exceeded (${status}): ${message}. Please wait ${retryAfter || 'some'} seconds before retrying.`);
      }
      return new Error(`GitHub API Error (${status}): ${message}.`);
    } else if (error.request) {
      logEvent('GitHubApiNetworkError', { operationName, message: error.message, ...fullContext }, 'error');
      return new Error(`GitHub Network Error: No response received from GitHub API. Is the service available?`);
    } else {
      logEvent('GitHubApiClientError', { operationName, message: error.message, ...fullContext }, 'error');
      return new Error(`GitHub Client Error: Failed to setup request for GitHub API.`);
    }
  }

  /**
   * @private
   * @method _executeRequest
   * @description Generic wrapper for all HTTP requests to GitHub, implementing retry logic and error handling.
   * @template T - The expected return type of the successful request.
   * @param {string} method - The HTTP method ('get', 'post', 'put', 'delete').
   * @param {string} path - The API path relative to the base URL (e.g., '/user/repos').
   * @param {string} token - The GitHub authentication token (PAT or OAuth). Required.
   * @param {any} [data] - Request body data for 'post', 'put' methods.
   * @param {any} [params] - URL query parameters for 'get' method.
   * @returns {Promise<T>} A promise that resolves with the response data.
   * @throws {Error} If the request fails persistently after all retry attempts.
   */
  private async _executeRequest<T>(method: 'get' | 'post' | 'put' | 'delete', path: string, token: string, data?: any, params?: any): Promise<T> {
    if (!token) {
      throw new Error('Authentication token is required for GitHub API requests.');
    }
    const operationName = `GitHub.${method.toUpperCase()}:${path}`;
    const requestContext = { ...this._telemetryContext, method, path, hasData: !!data, hasParams: !!params };

    return measurePerformance(operationName, async () => {
      for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
        try {
          const response = await this.httpClient.request<T>({
            method,
            url: path,
            headers: { 'Authorization': `token ${token}` },
            data,
            params,
          });
          logEvent(`${operationName}_Success`, { status: response.status, attempt, ...requestContext });
          return response.data; 
        } catch (error: any) {
          const handledError = this._handleApiError(error as AxiosError, operationName, requestContext);
          logEvent(`${operationName}_Failure`, { error: handledError.message, status: error.response?.status, attempt, ...requestContext }, 'error');

          if (attempt <= this.maxRetries && (error.response?.status === 429 || error.response?.status === 500 || error.response?.status === 503)) {
            const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
            logEvent(`${operationName}_Retry`, { reason: handledError.message, delay, attempt, ...requestContext }, 'warn');
            await this._sleep(delay);
            continue;
          }
          throw handledError;
        }
      }
      // This line should technically be unreachable if throw is always called on final attempt
      throw new Error(`Failed to execute ${operationName} after ${this.maxRetries + 1} attempts. No further error details.`);
    });
  }

  // --- Public Adapter Methods (GitHub REST API Endpoints) ---

  /**
   * @method getAuthenticatedUserRepos
   * @description Fetches a list of repositories owned by the authenticated user.
   * @param {string} token - The GitHub authentication token (PAT or OAuth).
   * @param {number} [perPage=100] - The number of results to return per page (max 100).
   * @param {number} [page=1] - The page number of the results to fetch.
   * @returns {Promise<GitHubRepo[]>} A promise that resolves with an array of `GitHubRepo` objects.
   * @throws {Error} If authentication fails or the API call encounters an error.
   */
  public async getAuthenticatedUserRepos(token: string, perPage: number = 100, page: number = 1): Promise<GitHubRepo[]> {
    return this._executeRequest<GitHubRepo[]>('get', '/user/repos', token, undefined, { type: 'owner', sort: 'updated', per_page: perPage, page });
  }

  /**
   * @method getRepositoryTree
   * @description Fetches the Git tree for a specified repository branch or SHA.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} treeSha - The SHA hash of the tree to retrieve (e.g., commit SHA or tree SHA).
   * @param {boolean} [recursive=true] - If true, retrieves the tree recursively to its maximum depth.
   * @returns {Promise<GitHubGitTree>} A promise that resolves with a `GitHubGitTree` object.
   * @throws {Error} If the repository or tree is not found, or the API call fails.
   */
  public async getRepositoryTree(token: string, owner: string, repo: string, treeSha: string, recursive: boolean = true): Promise<GitHubGitTree> {
    return this._executeRequest<GitHubGitTree>('get', `/repos/${owner}/${repo}/git/trees/${treeSha}`, token, undefined, { recursive: recursive ? 'true' : 'false' });
  }

  /**
   * @method getFileBlobContent
   * @description Retrieves the raw content of a file (blob) from a GitHub repository.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} path - The path to the file within the repository.
   * @returns {Promise<GitHubFileContent>} A promise that resolves with a `GitHubFileContent` object, containing base64 encoded content.
   * @throws {Error} If the file is not found, or the API call fails.
   */
  public async getFileBlobContent(token: string, owner: string, repo: string, path: string): Promise<GitHubFileContent> {
    return this._executeRequest<GitHubFileContent>('get', `/repos/${owner}/${repo}/contents/${path}`, token);
  }

  /**
   * @method getBranchRef
   * @description Retrieves the Git reference for a specific branch (e.g., 'heads/main').
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} branch - The name of the branch (e.g., 'main').
   * @returns {Promise<GitHubRef>} A promise that resolves with a `GitHubRef` object.
   * @throws {Error} If the branch is not found, or the API call fails.
   */
  public async getBranchRef(token: string, owner: string, repo: string, branch: string): Promise<GitHubRef> {
    return this._executeRequest<GitHubRef>('get', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, token);
  }

  /**
   * @method getCommit
   * @description Retrieves a specific Git commit object by its SHA.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} commitSha - The SHA hash of the commit.
   * @returns {Promise<GitHubCommit>} A promise that resolves with a `GitHubCommit` object.
   * @throws {Error} If the commit is not found, or the API call fails.
   */
  public async getCommit(token: string, owner: string, repo: string, commitSha: string): Promise<GitHubCommit> {
    return this._executeRequest<GitHubCommit>('get', `/repos/${owner}/${repo}/git/commits/${commitSha}`, token);
  }

  /**
   * @method createBlob
   * @description Creates a new Git blob object in a repository.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} content - The content of the blob. Should be Base64 encoded for binary files.
   * @param {'utf-8' | 'base64'} encoding - The encoding of the content provided.
   * @returns {Promise<GitHubBlob>} A promise that resolves with the created `GitHubBlob` object.
   * @throws {Error} If the API call fails.
   */
  public async createBlob(token: string, owner: string, repo: string, content: string, encoding: 'utf-8' | 'base64' = 'utf-8'): Promise<GitHubBlob> {
    return this._executeRequest<GitHubBlob>('post', `/repos/${owner}/${repo}/git/blobs`, token, { content, encoding });
  }

  /**
   * @method createTree
   * @description Creates a new Git tree object in a repository.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} baseTreeSha - The SHA hash of the base tree to build upon.
   * @param {Array<{path: string; mode: string; type: 'blob' | 'tree' | 'commit'; sha: string;}>} treeItems - An array of tree entries (files/folders) to add or update.
   * @returns {Promise<GitHubGitTree>} A promise that resolves with the created `GitHubGitTree` object.
   * @throws {Error} If the API call fails.
   */
  public async createTree(token: string, owner: string, repo: string, baseTreeSha: string, treeItems: Array<{ path: string; mode: string; type: 'blob' | 'tree' | 'commit'; sha: string; }>): Promise<GitHubGitTree> {
    return this._executeRequest<GitHubGitTree>('post', `/repos/${owner}/${repo}/git/trees`, token, { base_tree: baseTreeSha, tree: treeItems });
  }

  /**
   * @method createCommit
   * @description Creates a new Git commit object in a repository.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} message - The commit message.
   * @param {string} treeSha - The SHA hash of the Git tree associated with this commit.
   * @param {string[]} parentShas - An array of SHA hashes of the parent commits.
   * @returns {Promise<GitHubCommit>} A promise that resolves with the created `GitHubCommit` object.
   * @throws {Error} If the API call fails.
   */
  public async createCommit(token: string, owner: string, repo: string, message: string, treeSha: string, parentShas: string[]): Promise<GitHubCommit> {
    return this._executeRequest<GitHubCommit>('post', `/repos/${owner}/${repo}/git/commits`, token, { message, tree: treeSha, parents: parentShas });
  }

  /**
   * @method updateRef
   * @description Updates a Git reference (e.g., a branch head) to point to a new commit SHA.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} ref - The reference name to update (e.g., 'heads/main').
   * @param {string} sha - The SHA hash of the commit to point the reference to.
   * @param {boolean} [force=false] - If true, updates the reference even if it's not a fast-forward merge.
   * @returns {Promise<GitHubRef>} A promise that resolves with the updated `GitHubRef` object.
   * @throws {Error} If the API call fails.
   */
  public async updateRef(token: string, owner: string, repo: string, ref: string, sha: string, force: boolean = false): Promise<GitHubRef> {
    return this._executeRequest<GitHubRef>('patch', `/repos/${owner}/${repo}/git/refs/${ref}`, token, { sha, force });
  }

  /**
   * @method createIssue
   * @description Creates a new issue in a GitHub repository.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} title - The title of the issue.
   * @param {string} [body] - The description of the issue.
   * @param {string[]} [labels] - An array of labels to apply to the issue.
   * @param {string[]} [assignees] - An array of GitHub usernames to assign to the issue.
   * @returns {Promise<GitHubCreateIssueResponse>} A promise that resolves with the created issue details.
   * @throws {Error} If the API call fails.
   */
  public async createIssue(token: string, owner: string, repo: string, title: string, body?: string, labels?: string[], assignees?: string[]): Promise<GitHubCreateIssueResponse> {
    return this._executeRequest<GitHubCreateIssueResponse>('post', `/repos/${owner}/${repo}/issues`, token, { title, body, labels, assignees });
  }

  /**
   * @method createPullRequest
   * @description Creates a new pull request in a GitHub repository.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {string} title - The title of the pull request.
   * @param {string} head - The name of the branch where your changes are (source branch).
   * @param {string} base - The name of the branch you want to merge into (target branch).
   * @param {string} [body] - The description of the pull request.
   * @param {boolean} [draft=false] - If true, creates a draft pull request.
   * @returns {Promise<GitHubCreatePullRequestResponse>} A promise that resolves with the created pull request details.
   * @throws {Error} If the API call fails.
   */
  public async createPullRequest(token: string, owner: string, repo: string, title: string, head: string, base: string, body?: string, draft: boolean = false): Promise<GitHubCreatePullRequestResponse> {
    return this._executeRequest<GitHubCreatePullRequestResponse>('post', `/repos/${owner}/${repo}/pulls`, token, { title, head, base, body, draft });
  }

  /**
   * @method mergePullRequest
   * @description Merges a pull request.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @param {number} pullNumber - The number of the pull request to merge.
   * @param {string} [commitTitle] - Title for the merge commit.
   * @param {string} [commitMessage] - Message for the merge commit.
   * @param {'merge' | 'squash' | 'rebase'} [mergeMethod='merge'] - The merge method to use.
   * @returns {Promise<GitHubMergePullRequestResponse>} A promise that resolves with the merge result.
   * @throws {Error} If the API call fails.
   */
  public async mergePullRequest(token: string, owner: string, repo: string, pullNumber: number, commitTitle?: string, commitMessage?: string, mergeMethod: 'merge' | 'squash' | 'rebase' = 'merge'): Promise<GitHubMergePullRequestResponse> {
    return this._executeRequest<GitHubMergePullRequestResponse>('put', `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, token, { commit_title: commitTitle, commit_message: commitMessage, merge_method: mergeMethod });
  }

  /**
   * @method deleteRepository
   * @description Deletes a repository.
   * @param {string} token - The GitHub authentication token.
   * @param {string} owner - The repository owner's username.
   * @param {string} repo - The repository name.
   * @returns {Promise<void>} A promise that resolves when the repository is deleted.
   * @throws {Error} If the API call fails.
   */
  public async deleteRepository(token: string, owner: string, repo: string): Promise<void> {
    await this._executeRequest<void>('delete', `/repos/${owner}/${repo}`, token);
  }
}