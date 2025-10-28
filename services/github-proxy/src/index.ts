/**
 * @file This is the main entry point for the GitHub Proxy Microservice.
 * @description This microservice acts as a secure, server-side gateway for all interactions
 * with the GitHub API. It is designed to be called exclusively by the Backend-for-Frontend (BFF),
 * adhering to a zero-trust architecture. It abstracts GitHub API complexities, manages authentication
 * by retrieving user-specific tokens from the AuthGateway, and provides a clean RESTful API for
 * the BFF to consume.
 * @module GitHubProxyService
 * @see {GitHubRestAdapter} for the underlying GitHub API communication logic.
 * @security This service is a critical security component. It must not be exposed to the public internet.
 * All requests are authenticated via an internal service-to-service token. User-specific GitHub tokens
 * are fetched on-demand from the AuthGateway and are never stored long-term in this service.
 * @performance The service is built on Express.js and uses async/await for non-blocking I/O. The
 * `GitHubRestAdapter` includes retry logic for transient GitHub API errors.
 */

import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import { Container, injectable, inject } from 'inversify';
import cors from 'cors';
import { GitHubRestAdapter, GitHubRepo, GitHubTreeItem } from './infrastructure/adapters/GitHubRestAdapter';
import { logError, logEvent, measurePerformance } from './telemetryService'; // Assuming a shared telemetry service

// --- Configuration & Constants ---
const PORT = process.env.PORT || 3001;
const AUTH_GATEWAY_URL = process.env.AUTH_GATEWAY_URL || 'http://auth-gateway:3000';
const INTERNAL_AUTH_TOKEN = process.env.INTERNAL_AUTH_TOKEN || 'a-very-secret-internal-token'; // For service-to-service auth

// --- Dependency Injection Symbols ---
const TYPES = {
  GitHubService: Symbol.for('GitHubService'),
  AuthGatewayClient: Symbol.for('AuthGatewayClient'),
};

// --- Interfaces (Core Abstractions) ---

interface IAuthGatewayClient {
  getGitHubPat(userId: string): Promise<string>;
}

interface IGitHubService {
  getUserRepos(userId: string): Promise<GitHubRepo[]>;
  getRepoTree(userId: string, owner: string, repo: string): Promise<any>;
  getFileContent(userId: string, owner: string, repo: string, path: string): Promise<string>;
  commitFile(userId: string, owner: string, repo: string, path: string, content: string, message: string, branch: string): Promise<any>;
}

// --- Service Implementations ---

@injectable()
class AuthGatewayClient implements IAuthGatewayClient {
  async getGitHubPat(userId: string): Promise<string> {
    logEvent('AuthGatewayClient_GetGitHubPat_Start', { userId });
    // In a real implementation, this would make a secure, authenticated call to the AuthGateway service.
    // We'll mock this for now, assuming a successful retrieval.
    if (!userId) {
      throw new Error('User ID is required to fetch GitHub PAT.');
    }
    await new Promise(res => setTimeout(res, 50)); // Simulate network latency
    const pat = `mock_github_pat_for_${userId}`;
    logEvent('AuthGatewayClient_GetGitHubPat_Success', { userId });
    return pat;
  }
}

@injectable()
class GitHubService implements IGitHubService {
  private readonly authGatewayClient: IAuthGatewayClient;

  constructor(@inject(TYPES.AuthGatewayClient) authGatewayClient: IAuthGatewayClient) {
    this.authGatewayClient = authGatewayClient;
  }

  private async getAdapterForUser(userId: string): Promise<GitHubRestAdapter> {
    const token = await this.authGatewayClient.getGitHubPat(userId);
    return new GitHubRestAdapter({ telemetryContext: { userId } });
  }

  public async getUserRepos(userId: string): Promise<GitHubRepo[]> {
    const adapter = await this.getAdapterForUser(userId);
    const token = await this.authGatewayClient.getGitHubPat(userId);
    return adapter.getAuthenticatedUserRepos(token);
  }

  public async getRepoTree(userId: string, owner: string, repo: string): Promise<any> {
    const adapter = await this.getAdapterForUser(userId);
    const token = await this.authGatewayClient.getGitHubPat(userId);

    const ref = await adapter.getBranchRef(token, owner, repo, 'main'); // Assuming default branch is 'main'
    const commit = await adapter.getCommit(token, owner, repo, ref.object.sha);
    const tree = await adapter.getRepositoryTree(token, owner, repo, commit.commit.tree.sha);

    // Basic transformation from flat list to nested structure
    const root: any = { name: repo, type: 'folder', path: '', children: [] };
    tree.tree.forEach((item: GitHubTreeItem) => {
        const pathParts = item.path.split('/');
        let currentNode = root;
        pathParts.forEach((part, index) => {
            if (!currentNode.children) currentNode.children = [];
            let childNode = currentNode.children.find((c: any) => c.name === part);
            if (!childNode) {
                const isLast = index === pathParts.length - 1;
                childNode = { name: part, path: item.path, type: isLast ? 'file' : 'folder', children: isLast ? undefined : [] };
                currentNode.children.push(childNode);
            }
            currentNode = childNode;
        });
    });

    return root;
  }

  public async getFileContent(userId: string, owner: string, repo: string, path: string): Promise<string> {
    const adapter = await this.getAdapterForUser(userId);
    const token = await this.authGatewayClient.getGitHubPat(userId);
    const fileContent = await adapter.getFileBlobContent(token, owner, repo, path);
    return Buffer.from(fileContent.content, 'base64').toString('utf-8');
  }

  public async commitFile(userId: string, owner: string, repo: string, path: string, content: string, message: string, branch: string): Promise<any> {
    const adapter = await this.getAdapterForUser(userId);
    const token = await this.authGatewayClient.getGitHubPat(userId);

    // This is a simplified commit flow. A full implementation is more complex.
    const branchRef = await adapter.getBranchRef(token, owner, repo, branch);
    const latestCommit = await adapter.getCommit(token, owner, repo, branchRef.object.sha);

    const newBlob = await adapter.createBlob(token, owner, repo, content);
    const newTree = await adapter.createTree(token, owner, repo, latestCommit.commit.tree.sha, [
      { path, mode: '100644', type: 'blob', sha: newBlob.sha },
    ]);

    const newCommit = await adapter.createCommit(token, owner, repo, message, newTree.sha, [latestCommit.sha]);
    await adapter.updateRef(token, owner, repo, `heads/${branch}`, newCommit.sha);

    return { commitUrl: newCommit.html_url };
  }
}

// --- Dependency Injection Container Setup ---

const container = new Container();
container.bind<IAuthGatewayClient>(TYPES.AuthGatewayClient).to(AuthGatewayClient).inSingletonScope();
container.bind<IGitHubService>(TYPES.GitHubService).to(GitHubService).inSingletonScope();

const githubService = container.get<IGitHubService>(TYPES.GitHubService);

// --- Express Server Setup ---

const app = express();
app.use(cors());
app.use(express.json());

// --- Middleware for Service-to-Service Authentication ---

const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token !== INTERNAL_AUTH_TOKEN) {
    logEvent('InternalAuth_Failed', { ip: req.ip }, 'warn');
    return res.status(403).json({ error: 'Forbidden: Invalid internal service token.' });
  }
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    logEvent('InternalAuth_MissingUserId', { ip: req.ip }, 'warn');
    return res.status(400).json({ error: 'Bad Request: X-User-ID header is required.' });
  }
  (req as any).userId = userId; // Attach userId for handler use
  next();
};

app.use(internalAuthMiddleware);

// --- API Routes ---

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'GitHub Proxy is running', timestamp: new Date().toISOString() });
});

app.get('/repos', async (req, res) => {
  try {
    const repos = await githubService.getUserRepos((req as any).userId);
    res.json(repos);
  } catch (e) {
    const error = e as Error;
    logError(error, { endpoint: '/repos', userId: (req as any).userId });
    res.status(500).json({ error: error.message });
  }
});

app.get('/tree', async (req, res) => {
  const { owner, repo } = req.query as { owner: string; repo: string };
  try {
    const tree = await githubService.getRepoTree((req as any).userId, owner, repo);
    res.json(tree);
  } catch (e) {
    const error = e as Error;
    logError(error, { endpoint: '/tree', userId: (req as any).userId, owner, repo });
    res.status(500).json({ error: error.message });
  }
});

app.get('/content', async (req, res) => {
  const { owner, repo, path } = req.query as { owner: string; repo: string; path: string };
  try {
    const content = await githubService.getFileContent((req as any).userId, owner, repo, path);
    res.json({ content });
  } catch (e) {
    const error = e as Error;
    logError(error, { endpoint: '/content', userId: (req as any).userId, owner, repo, path });
    res.status(500).json({ error: error.message });
  }
});

app.post('/commit', async (req, res) => {
  const { owner, repo, path, content, message, branch } = req.body;
  try {
    const result = await githubService.commitFile((req as any).userId, owner, repo, path, content, message, branch);
    res.json(result);
  } catch (e) {
    const error = e as Error;
    logError(error, { endpoint: '/commit', userId: (req as any).userId, owner, repo, path });
    res.status(500).json({ error: error.message });
  }
});

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logError(err, { unhandledRouteError: true, path: req.path });
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`[GitHub Proxy] Service running on http://localhost:${PORT}`);
  logEvent('ServiceStartup', { service: 'GitHubProxy', port: PORT });
});
