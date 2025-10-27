/**
 * @file This module provides an adapter for interacting with the GitHub-related
 * functionalities of the Backend-for-Frontend (BFF) service. It abstracts away
 * the direct GraphQL communication for GitHub operations, adhering to the new
 * zero-trust, microservice-oriented architecture.
 * @module services/githubService
 * @see module:services/bffService for the underlying API client.
 * @security All GitHub API interactions are proxied through the BFF. The client application
 * never handles GitHub personal access tokens or other secrets.
 */

import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import type { Repo, FileNode } from '../types';
import { IBffApiClient } from './bffService'; // Assumed to exist in the new architecture
import { SERVICE_IDENTIFIERS } from './serviceIdentifiers'; // Assumed to exist for DI

/**
 * @interface IGitHubService
 * @description Defines the contract for interacting with GitHub data via the BFF.
 * This represents the abstraction in the Core service layer, ensuring that business logic
 * is decoupled from the specific implementation of data fetching (GraphQL).
 * @security This service communicates with the BFF using a short-lived JWT for user
 * authentication. The BFF then orchestrates calls to the GitHubProxyService,
 * which securely retrieves the necessary third-party tokens from the AuthGateway.
 */
export interface IGitHubService {
  /**
   * Fetches the repositories for the currently authenticated user.
   * @returns {Promise<Repo[]>} A promise that resolves to an array of repository objects.
   * @throws {Error} If the GraphQL request to the BFF fails or returns an error.
   * @example const repos = await githubService.getRepos();
   */
  getRepos(): Promise<Repo[]>;

  /**
   * Fetches the hierarchical file tree for a specific repository.
   * @param {string} owner - The owner of the repository.
   * @param {string} repo - The name of the repository.
   * @returns {Promise<FileNode>} A promise that resolves to the root FileNode of the repository tree.
   * @throws {Error} If the GraphQL request to the BFF fails or returns an error.
   * @example const tree = await githubService.getRepoTree('my-org', 'my-repo');
   */
  getRepoTree(owner: string, repo: string): Promise<FileNode>;

  /**
   * Fetches the content of a specific file from a repository.
   * @param {string} owner - The owner of the repository.
   * @param {string} repo - The name of the repository.
   * @param {string} path - The path to the file within the repository.
   * @returns {Promise<string>} A promise that resolves to the string content of the file.
   * @throws {Error} If the GraphQL request to the BFF fails or returns an error.
   * @example const content = await githubService.getFileContent('my-org', 'my-repo', 'src/index.ts');
   */
  getFileContent(owner: string, repo: string, path: string): Promise<string>;

  /**
   * Commits one or more file changes to a branch in a repository.
   * @param {string} owner - The owner of the repository.
   * @param {string} repo - The name of the repository.
   * @param {Array<{ path: string; content: string }>} files - An array of file objects to commit.
   * @param {string} message - The commit message.
   * @param {string} [branch='main'] - The branch to commit to. Defaults to 'main'.
   * @returns {Promise<string>} A promise that resolves to the URL of the new commit.
   * @throws {Error} If the GraphQL mutation to the BFF fails or returns an error.
   * @example
   * await githubService.commitFiles(
   *   'my-org',
   *   'my-repo',
   *   [{ path: 'README.md', content: 'New content' }],
   *   'feat: Update README'
   * );
   */
  commitFiles(
    owner: string,
    repo: string,
    files: { path: string; content: string }[],
    message: string,
    branch?: string
  ): Promise<string>;
}

/**
 * @class GitHubAdapter
 * @implements {IGitHubService}
 * @description Implements the IGitHubService interface by making GraphQL requests to the BFF.
 * This class is part of the Infrastructure layer and is managed by a DI container.
 * @injectable
 * @performance This adapter's performance is dependent on the network latency to the BFF
 * and the performance of the BFF and downstream microservices (GitHubProxyService, AuthGateway).
 */
@injectable()
export class GitHubAdapter implements IGitHubService {
  private readonly bffClient: IBffApiClient;

  /**
   * @constructor
   * @param {IBffApiClient} bffClient - The injected BFF API client for making GraphQL requests.
   */
  public constructor(
    @inject(SERVICE_IDENTIFIERS.BffApiClient) bffClient: IBffApiClient
  ) {
    this.bffClient = bffClient;
  }

  /**
   * @inheritdoc
   */
  public async getRepos(): Promise<Repo[]> {
    const query = `
      query GetUserRepos {
        github {
          repos {
            id
            name
            full_name
            private
            html_url
            description
          }
        }
      }
    `;

    const response = await this.bffClient.query<{ github: { repos: Repo[] } }>(query);
    return response.github.repos;
  }

  /**
   * @inheritdoc
   */
  public async getRepoTree(owner: string, repo: string): Promise<FileNode> {
    const query = `
      query GetRepoTree($owner: String!, $repo: String!) {
        github {
          repoTree(owner: $owner, repo: $repo) {
            name
            path
            type
            children {
              name
              path
              type
              children {
                name
                path
                type
                children {
                  name
                  path
                  type
                }
              }
            }
          }
        }
      }
    `;

    const variables = { owner, repo };
    const response = await this.bffClient.query<{ github: { repoTree: FileNode } }>(query, variables);
    // The BFF would recursively fetch the full tree and return it.
    return response.github.repoTree;
  }

  /**
   * @inheritdoc
   */
  public async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const query = `
      query GetFileContent($owner: String!, $repo: String!, $path: String!) {
        github {
          fileContent(owner: $owner, repo: $repo, path: $path)
        }
      }
    `;

    const variables = { owner, repo, path };
    const response = await this.bffClient.query<{ github: { fileContent: string } }>(query, variables);
    return response.github.fileContent;
  }

  /**
   * @inheritdoc
   */
  public async commitFiles(
    owner: string,
    repo: string,
    files: { path: string; content: string }[],
    message: string,
    branch: string = 'main'
  ): Promise<string> {
    const mutation = `
      mutation CommitFiles($commitInput: GitHubCommitInput!) {
        github {
          commitFiles(input: $commitInput) {
            commitUrl
          }
        }
      }
    `;

    const variables = { 
      commitInput: { owner, repo, branch, message, files }
    };
    const response = await this.bffClient.mutate<{ github: { commitFiles: { commitUrl: string } } }>(mutation, variables);
    return response.github.commitFiles.commitUrl;
  }
}
