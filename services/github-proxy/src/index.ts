// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file This is the entry point for the GitHub Proxy Microservice.
 *       It provides a secure, server-side interface for interacting with the GitHub API,
 *       abstracting direct token management from client-side applications.
 *       It leverages Dependency Injection for modularity and testability, and integrates
 *       with a conceptual AuthGateway for zero-trust token retrieval.
 */

import 'reflect-metadata';
import express from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container, injectable, inject } from 'inversify';
import { Octokit } from 'octokit';
import bodyParser from 'body-parser';
import cors from 'cors';

// --- Configuration Constants ---
/**
 * @const {number} PORT The port on which the GitHub Proxy Microservice will listen.
 *                   Defaults to 3001.
 */
const PORT: number = parseInt(process.env.PORT || '3001', 10);

/**
 * @const {string} AUTH_GATEWAY_URL The base URL for the AuthGateway Microservice.
 *                                 This is where GitHub tokens are securely retrieved from.
 *                                 @security This URL must be configured for internal network access only.
 */
const AUTH_GATEWAY_URL: string = process.env.AUTH_GATEWAY_URL || 'http://localhost:3002/api/v1/auth';

/**
 * @const {string} GITHUB_API_VERSION The GitHub API version to use for all requests.
 *                                   Ensures consistency across interactions.
 */
const GITHUB_API_VERSION: string = '2022-11-28';

/**
 * @const {string} USER_AGENT The User-Agent header for GitHub API requests.
 *                           Identifies the caller to GitHub for better logging and debugging.
 */
const USER_AGENT: string = 'GitHubProxyMicroservice-CitibankDemoApp/1.0';

// --- Dependency Injection Identifiers ---
/**
 * @const {symbol} TYPES Defines symbolic identifiers for dependency injection.
 *                     This prevents naming collisions and makes dependency resolution explicit.
 */
const TYPES = {
  GitHubService: Symbol.for('GitHubService'),
  GitHubController: Symbol.for('GitHubController'),
  AuthGatewayClient: Symbol.for('AuthGatewayClient'),
};

// --- Core Interfaces ---
/**
 * @interface IAuthGatewayClient
 * @description Defines the contract for a client interacting with the AuthGateway Microservice.
 *              Responsible for securely fetching GitHub Personal Access Tokens (PATs).
 *              @security This interface specifies retrieval of sensitive tokens and must be implemented
 *                        with secure communication (e.g., mTLS, authenticated requests).
 */
interface IAuthGatewayClient {
  /**
   * @method getGitHubPat
   * @description Retrieves a GitHub Personal Access Token (PAT) for a given user ID.
   * @param {string} userId The unique identifier of the user requesting the PAT.
   * @returns {Promise<string>} A promise that resolves with the plaintext GitHub PAT.
   * @throws {Error} If the PAT cannot be retrieved (e.g., user not found, token expired).
   * @security The token is returned in plaintext and must be handled with utmost care.
   */
  getGitHubPat(userId: string): Promise<string>;
}

/**
 * @interface IGitHubService
 * @description Defines the core contract for interacting with the GitHub API via this proxy.
 *              Methods should reflect common GitHub operations, abstracted from direct API calls.
 */
interface IGitHubService {
  /**
   * @method getUserRepos
   * @description Fetches a list of repositories owned by a specific user.
   * @param {string} userId The ID of the user whose repositories are to be fetched.
   * @returns {Promise<any[]>} A promise that resolves with an array of repository objects.
   * @throws {Error} If GitHub API call fails or authentication is unsuccessful.
   */
  getUserRepos(userId: string): Promise<any[]>;

  /**
   * @method getRepoFileContent
   * @description Retrieves the content of a specific file from a GitHub repository.
   * @param {string} userId The ID of the user performing the action.
   * @param {string} owner The owner of the repository.
   * @param {string} repo The name of the repository.
   * @param {string} path The path to the file within the repository.
   * @returns {Promise<string>} A promise that resolves with the file's content as a string.
   * @throws {Error} If the file is not found or GitHub API call fails.
   */
  getRepoFileContent(userId: string, owner: string, repo: string, path: string): Promise<string>;

  /**
   * @method commitFileChanges
   * @description Commits changes to a file in a GitHub repository.
   * @param {string} userId The ID of the user performing the action.
   * @param {string} owner The owner of the repository.
   * @param {string} repo The name of the repository.
   * @param {string} branch The target branch for the commit (e.g., 'main').
   * @param {{ path: string; content: string }[]} files An array of file objects to commit, each with its path and new content.
   * @param {string} message The commit message.
   * @returns {Promise<string>} A promise that resolves with the URL of the new commit.
   * @throws {Error} If the commit operation fails.
   */
  commitFileChanges(userId: string, owner: string, repo: string, branch: string, files: { path: string; content: string }[], message: string): Promise<string>;

  /**
   * @method createIssue
   * @description Creates a new issue in a GitHub repository.
   * @param {string} userId The ID of the user creating the issue.
   * @param {string} owner The owner of the repository.
   * @param {string} repo The name of the repository.
   * @param {string} title The title of the issue.
   * @param {string} body The body content of the issue.
   * @param {string[]} labels Optional. Labels to apply to the issue.
   * @param {string[]} assignees Optional. Assignees for the issue.
   * @returns {Promise<any>} A promise that resolves with the created issue object.
   * @throws {Error} If the issue creation fails.
   */
  createIssue(userId: string, owner: string, repo: string, title: string, body: string, labels?: string[], assignees?: string[]): Promise<any>;

  /**
   * @method createPullRequest
   * @description Creates a new pull request in a GitHub repository.
   * @param {string} userId The ID of the user creating the PR.
   * @param {string} owner The owner of the repository.
   * @param {string} repo The name of the repository.
   * @param {string} title The title of the pull request.
   * @param {string} head The name of the branch where changes are made.
   * @param {string} base The name of the branch to merge changes into (e.g., 'main').
   * @param {string} body The body content of the pull request.
   * @returns {Promise<any>} A promise that resolves with the created pull request object.
   * @throws {Error} If the pull request creation fails.
   */
  createPullRequest(userId: string, owner: string, repo: string, title: string, head: string, base: string, body: string): Promise<any>;
}

// --- AuthGateway Client Implementation ---
/**
 * @class AuthGatewayClient
 * @implements {IAuthGatewayClient}
 * @description Implements the client logic for interacting with the AuthGateway Microservice.
 *              This class handles making authenticated HTTP requests to the AuthGateway
 *              to retrieve sensitive GitHub tokens. It's the secure hand reaching into the vault.
 */
@injectable()
class AuthGatewayClient implements IAuthGatewayClient {
  private readonly baseUrl: string;

  /**
   * @constructor
   * @description Initializes the AuthGatewayClient with the AuthGateway's base URL.
   */
  constructor() {
    this.baseUrl = AUTH_GATEWAY_URL;
    console.log(`AuthGatewayClient initialized, targeting AuthGateway at: ${this.baseUrl}`);
  }

  /**
   * @method getGitHubPat
   * @description Retrieves a GitHub Personal Access Token (PAT) for a given user ID from the AuthGateway.
   *              @security The actual PAT is transmitted over the wire (within the internal network) and must be handled carefully.
   * @param {string} userId The unique identifier of the user.
   * @returns {Promise<string>} A promise that resolves with the plaintext GitHub PAT.
   * @throws {Error} If the request to AuthGateway fails or returns an invalid response.
   */
  public async getGitHubPat(userId: string): Promise<string> {
    try {
      console.log(`Requesting GitHub PAT for user ${userId} from AuthGateway.`);
      // In a real scenario, this request would include internal service authentication (e.g., JWT from BFF, mTLS).
      const response = await fetch(`${this.baseUrl}/github-pat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId, // Example: Pass user ID for authorization lookup in AuthGateway
          // 'Authorization': 'Bearer <internal_service_jwt>' // Critical for internal service security
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        console.error(`AuthGateway failed to provide PAT for user ${userId}: ${response.status} - ${errorBody.message}`);
        throw new Error(`Failed to retrieve GitHub PAT from AuthGateway: ${errorBody.message || response.statusText}`);
      }

      const data = await response.json();
      if (!data.pat) {
        throw new Error('AuthGateway response missing GitHub PAT.');
      }
      console.log(`Successfully retrieved GitHub PAT for user ${userId} (first 5 chars: ${data.pat.substring(0,5)}...).`);
      return data.pat;
    } catch (error: any) {
      console.error(`Error in AuthGatewayClient.getGitHubPat: ${error.message}`, error.stack);
      throw new Error(`AuthGateway access failed: ${error.message}`);
    }
  }
}

// --- GitHub Service Implementation ---
/**
 * @class GitHubService
 * @implements {IGitHubService}
 * @description Implements the actual business logic for interacting with the GitHub API.
 *              It uses an injected `AuthGatewayClient` to retrieve user-specific GitHub tokens
 *              and then performs operations using `Octokit`.
 *              @security This service operates on the server-side, enabling secure token handling.
 */
@injectable()
class GitHubService implements IGitHubService {
  private readonly authGatewayClient: IAuthGatewayClient;

  /**
   * @constructor
   * @description Initializes the GitHubService with an injected AuthGatewayClient.
   * @param {IAuthGatewayClient} authGatewayClient The client for communicating with the AuthGateway.
   */
  constructor(@inject(TYPES.AuthGatewayClient) authGatewayClient: IAuthGatewayClient) {
    this.authGatewayClient = authGatewayClient;
    console.log('GitHubService initialized.');
  }

  /**
   * @method _createOctokitInstance
   * @description Internal helper to create an `Octokit` instance with the given token.
   * @param {string} token The plaintext GitHub token (PAT or OAuth token).
   * @returns {Octokit} A new `Octokit` instance.
   * @private
   */
  private _createOctokitInstance(token: string): Octokit {
    return new Octokit({
      auth: token,
      request: {
        headers: {
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          'User-Agent': USER_AGENT,
        },
      },
    });
  }

  /**
   * @method _getAuthenticatedOctokit
   * @description Retrieves a GitHub PAT from the AuthGateway and creates an `Octokit` instance.
   * @param {string} userId The ID of the user.
   * @returns {Promise<Octokit>} A promise that resolves with an authenticated `Octokit` instance.
   * @throws {Error} If PAT retrieval or Octokit initialization fails.
   * @private
   */
  private async _getAuthenticatedOctokit(userId: string): Promise<Octokit> {
    const pat = await this.authGatewayClient.getGitHubPat(userId);
    return this._createOctokitInstance(pat);
  }

  /**
   * @method getUserRepos
   * @inheritdoc
   */
  public async getUserRepos(userId: string): Promise<any[]> {
    console.log(`Fetching repositories for user ${userId}...`);
    try {
      const octokit = await this._getAuthenticatedOctokit(userId);
      const { data } = await octokit.request('GET /user/repos', {
        type: 'owner',
        sort: 'updated',
        per_page: 100,
      });
      console.log(`Found ${data.length} repositories for user ${userId}.`);
      return data;
    } catch (error: any) {
      console.error(`Error fetching repos for user ${userId}: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch user repositories: ${error.message}`);
    }
  }

  /**
   * @method getRepoFileContent
   * @inheritdoc
   */
  public async getRepoFileContent(userId: string, owner: string, repo: string, path: string): Promise<string> {
    console.log(`Fetching file content for ${owner}/${repo}/${path} for user ${userId}...`);
    try {
      const octokit = await this._getAuthenticatedOctokit(userId);
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner, repo, path
      });

      if (Array.isArray(data) || data.type !== 'file' || typeof data.content !== 'string') {
        throw new Error('Path did not point to a valid file or content was missing.');
      }
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      console.log(`File content for ${path} fetched successfully (size: ${content.length}).`);
      return content;
    } catch (error: any) {
      console.error(`Error fetching file content for ${owner}/${repo}/${path}: ${error.message}`, error.stack);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * @method commitFileChanges
   * @inheritdoc
   */
  public async commitFileChanges(userId: string, owner: string, repo: string, branch: string, files: { path: string; content: string }[], message: string): Promise<string> {
    console.log(`Committing ${files.length} changes to ${owner}/${repo}/${branch} for user ${userId}...`);
    try {
      const octokit = await this._getAuthenticatedOctokit(userId);

      // Get latest commit SHA
      const { data: refData } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
        owner, repo, ref: `heads/${branch}`,
      });
      const latestCommitSha = refData.object.sha;

      // Get base tree SHA
      const { data: commitData } = await octokit.request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', {
        owner, repo, commit_sha: latestCommitSha,
      });
      const baseTreeSha = commitData.tree.sha;

      // Create blobs for new/updated files
      const blobPromises = files.map(file =>
        octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
          owner, repo, content: file.content, encoding: 'utf-8',
        })
      );
      const blobs = await Promise.all(blobPromises);

      // Create new tree
      const tree = blobs.map((blob, index) => ({
        path: files[index].path,
        mode: '100644' as const, // Standard file mode
        type: 'blob' as const,
        sha: blob.data.sha,
      }));

      const { data: newTree } = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
        owner, repo, base_tree: baseTreeSha, tree,
      });

      // Create new commit
      const { data: newCommit } = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
        owner, repo, message, tree: newTree.sha, parents: [latestCommitSha],
      });

      // Update branch reference
      await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
        owner, repo, ref: `heads/${branch}`, sha: newCommit.sha,
      });

      console.log(`Successfully committed changes to ${owner}/${repo}/${branch}. Commit URL: ${newCommit.html_url}`);
      return newCommit.html_url;
    } catch (error: any) {
      console.error(`Error committing changes to ${owner}/${repo}/${branch}: ${error.message}`, error.stack);
      throw new Error(`Failed to commit file changes: ${error.message}`);
    }
  }

  /**
   * @method createIssue
   * @inheritdoc
   */
  public async createIssue(userId: string, owner: string, repo: string, title: string, body: string, labels?: string[], assignees?: string[]): Promise<any> {
    console.log(`Creating issue in ${owner}/${repo} with title: "${title}" for user ${userId}...`);
    try {
      const octokit = await this._getAuthenticatedOctokit(userId);
      const { data } = await octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner, repo, title, body, labels, assignees
      });
      console.log(`Issue created: #${data.number} - ${data.html_url}`);
      return data;
    } catch (error: any) {
      console.error(`Error creating issue in ${owner}/${repo}: ${error.message}`, error.stack);
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  /**
   * @method createPullRequest
   * @inheritdoc
   */
  public async createPullRequest(userId: string, owner: string, repo: string, title: string, head: string, base: string, body: string): Promise<any> {
    console.log(`Creating PR in ${owner}/${repo} from ${head} to ${base} with title: "${title}" for user ${userId}...`);
    try {
      const octokit = await this._getAuthenticatedOctokit(userId);
      const { data } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner, repo, title, head, base, body
      });
      console.log(`Pull Request created: #${data.number} - ${data.html_url}`);
      return data;
    } catch (error: any) {
      console.error(`Error creating PR in ${owner}/${repo}: ${error.message}`, error.stack);
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }
}

// --- Express Controller ---
/**
 * @class GitHubController
 * @description Express.js controller to handle incoming HTTP requests related to GitHub operations.
 *              It receives requests from the BFF, delegates to `IGitHubService`,
 *              and returns responses. User authentication/authorization is assumed to be handled by the BFF/AuthGateway.
 */
@injectable()
class GitHubController {
  private readonly githubService: IGitHubService;

  /**
   * @constructor
   * @description Initializes the GitHubController with an injected IGitHubService.
   * @param {IGitHubService} githubService The service responsible for GitHub API interactions.
   */
  constructor(@inject(TYPES.GitHubService) githubService: IGitHubService) {
    this.githubService = githubService;
  }

  /**
   * @method getUserRepos
   * @description Handles GET requests to retrieve user repositories.
   * @param {express.Request} req The Express request object. Assumes `X-User-ID` header for user identification.
   * @param {express.Response} res The Express response object.
   * @returns {Promise<void>} Resolves when the response is sent.
   */
  public async getUserRepos(req: express.Request, res: express.Response): Promise<void> {
    const userId = req.headers['x-user-id'] as string; // Assume user ID from authenticated BFF request
    if (!userId) {
      res.status(401).send({ error: 'Unauthorized: User ID missing.' });
      return;
    }
    try {
      const repos = await this.githubService.getUserRepos(userId);
      res.json(repos);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  /**
   * @method getFileContent
   * @description Handles GET requests to retrieve file content from a repository.
   * @param {express.Request} req The Express request object.
   * @param {express.Response} res The Express response object.
   * @returns {Promise<void>} Resolves when the response is sent.
   */
  public async getFileContent(req: express.Request, res: express.Response): Promise<void> {
    const userId = req.headers['x-user-id'] as string;
    const { owner, repo, path } = req.query;
    if (!userId || !owner || !repo || !path) {
      res.status(400).send({ error: 'Missing required parameters: userId, owner, repo, path.' });
      return;
    }
    try {
      const content = await this.githubService.getRepoFileContent(userId, owner as string, repo as string, path as string);
      res.json({ content });
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  /**
   * @method commitChanges
   * @description Handles POST requests to commit file changes.
   * @param {express.Request} req The Express request object.
   * @param {express.Response} res The Express response object.
   * @returns {Promise<void>} Resolves when the response is sent.
   */
  public async commitChanges(req: express.Request, res: express.Response): Promise<void> {
    const userId = req.headers['x-user-id'] as string;
    const { owner, repo, branch, files, message } = req.body;
    if (!userId || !owner || !repo || !branch || !files || !message) {
      res.status(400).send({ error: 'Missing required parameters: userId, owner, repo, branch, files, message.' });
      return;
    }
    try {
      const commitUrl = await this.githubService.commitFileChanges(userId, owner, repo, branch, files, message);
      res.status(200).json({ commitUrl });
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  /**
   * @method createIssue
   * @description Handles POST requests to create a new GitHub issue.
   * @param {express.Request} req The Express request object.
   * @param {express.Response} res The Express response object.
   * @returns {Promise<void>} Resolves when the response is sent.
   */
  public async createIssue(req: express.Request, res: express.Response): Promise<void> {
    const userId = req.headers['x-user-id'] as string;
    const { owner, repo, title, body, labels, assignees } = req.body;
    if (!userId || !owner || !repo || !title || !body) {
      res.status(400).send({ error: 'Missing required parameters: userId, owner, repo, title, body.' });
      return;
    }
    try {
      const issue = await this.githubService.createIssue(userId, owner, repo, title, body, labels, assignees);
      res.status(201).json(issue);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  /**
   * @method createPullRequest
   * @description Handles POST requests to create a new GitHub pull request.
   * @param {express.Request} req The Express request object.
   * @param {express.Response} res The Express response object.
   * @returns {Promise<void>} Resolves when the response is sent.
   */
  public async createPullRequest(req: express.Request, res: express.Response): Promise<void> {
    const userId = req.headers['x-user-id'] as string;
    const { owner, repo, title, head, base, body } = req.body;
    if (!userId || !owner || !repo || !title || !head || !base || !body) {
      res.status(400).send({ error: 'Missing required parameters: userId, owner, repo, title, head, base, body.' });
      return;
    }
    try {
      const pr = await this.githubService.createPullRequest(userId, owner, repo, title, head, base, body);
      res.status(201).json(pr);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
}

// --- Dependency Injection Container Setup ---
/**
 * @const {Container} container The InversifyJS container for managing service dependencies.
 *                              This ensures that services are instantiated and injected correctly.
 */
const container = new Container();

// Bindings for services and controllers
container.bind<IAuthGatewayClient>(TYPES.AuthGatewayClient).to(AuthGatewayClient).inSingletonScope();
container.bind<IGitHubService>(TYPES.GitHubService).to(GitHubService).inSingletonScope();
container.bind<GitHubController>(TYPES.GitHubController).to(GitHubController).inSingletonScope();

console.log('InversifyJS container configured with service bindings.');

// --- Express Server Setup ---
/**
 * @const {InversifyExpressServer} server The Inversify Express server instance.
 *                                        Integrates InversifyJS with Express.js for route handling.
 */
const server = new InversifyExpressServer(container);

/**
 * @function config
 * @description Configures the Express application with middleware and routes.
 * @param {express.Application} app The Express application instance.
 * @returns {void}
 */
server.setConfig((app) => {
  app.use(bodyParser.json());
  app.use(cors());

  // GitHub API routes, protected by assuming an authenticated BFF calls this microservice
  app.get('/api/v1/github/repos', (req, res) => container.get<GitHubController>(TYPES.GitHubController).getUserRepos(req, res));
  app.get('/api/v1/github/repos/content', (req, res) => container.get<GitHubController>(TYPES.GitHubController).getFileContent(req, res));
  app.post('/api/v1/github/repos/commit', (req, res) => container.get<GitHubController>(TYPES.GitHubController).commitChanges(req, res));
  app.post('/api/v1/github/issues', (req, res) => container.get<GitHubController>(TYPES.GitHubController).createIssue(req, res));
  app.post('/api/v1/github/pulls', (req, res) => container.get<GitHubController>(TYPES.GitHubController).createPullRequest(req, res));

  // Basic health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('GitHub Proxy Microservice is healthy');
  });

  console.log('Express app configured with routes and middleware.');
});

/**
 * @const {express.Application} app The configured Express application.
 */
const app = server.build();

// --- Server Start ---
/**
 * @description Starts the Express server, making the GitHub Proxy Microservice available.
 */
app.listen(PORT, () => {
  console.log(`GitHub Proxy Microservice running on port ${PORT}`);
  console.log(`AuthGateway URL: ${AUTH_GATEWAY_URL}`);
  console.log(`GitHub API Version: ${GITHUB_API_VERSION}`);
  console.log(`User-Agent: ${USER_AGENT}`);
});

/**
 * @event SIGTERM Gracefully handles SIGTERM signals for clean shutdown.
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down GitHub Proxy Microservice...');
  process.exit(0);
});

/**
 * @event SIGINT Gracefully handles SIGINT signals (Ctrl+C) for clean shutdown.
 */
process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down GitHub Proxy Microservice...');
  process.exit(0);
});
