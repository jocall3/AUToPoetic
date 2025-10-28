/**
 * @file This module provides an adapter for interacting with the GitHub-related
 * functionalities of the Backend-for-Frontend (BFF) service. It abstracts away
 * the direct GraphQL communication for GitHub operations, adhering to the new
 * zero-trust, microservice-oriented architecture.
 * @module services/githubService
 * @see module:services/bffService for the underlying API client.
 * @security All GitHub API interactions are proxied through the BFF. The client application
 * never handles GitHub personal access tokens or other secrets.
 * @version 2.0.0
 */

import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import type { Repo, FileNode, GitHubFile } from '../types'; // Assumes GitHubFile is defined in types.ts
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
   * @param {string} [owner] - The owner of the repositories to fetch.
   * @param {number} [limit] - The maximum number of repositories to return.
   * @returns {Promise<Repo[]>} A promise that resolves to an array of repository objects.
   * @throws {Error} If the GraphQL request to the BFF fails or returns an error.
   * @example const repos = await githubService.getRepos('my-username', 10);
   */
  getRepos(owner?: string, limit?: number): Promise<Repo[]>;

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
   * @returns {Promise<GitHubFile>} A promise that resolves to the GitHubFile object containing the file content.
   * @throws {Error} If the GraphQL request to the BFF fails or returns an error.
   * @example const file = await githubService.getFileContent('my-org', 'my-repo', 'src/index.ts');
   */
  getFileContent(owner: string, repo: string, path: string): Promise<GitHubFile>;

  /**
   * Commits a single file change to a branch in a repository.
   * This aligns with the BFF's single-file commit mutation.
   * @param {string} owner - The owner of the repository.
   * @param {string} repo - The name of the repository.
   * @param {string} path - The path of the file to commit.
   * @param {string} content - The new content for the file.
   * @param {string} message - The commit message.
   * @param {string} [branch='main'] - The branch to commit to. Defaults to 'main'.
   * @returns {Promise<string>} A promise that resolves to the URL of the new commit.
   * @throws {Error} If the GraphQL mutation to the BFF fails or returns an error.
   * @example
   * await githubService.commitFile(
   *   'my-org',
   *   'my-repo',
   *   'README.md',
   *   'New content',
   *   'feat: Update README'
   * );
   */
  commitFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string
  ): Promise<string>;
}

/**
 * @class GitHubAdapter
 * @implements {IGitHubService}
 * @description Implements the IGitHubService interface by making GraphQL requests to the BFF,
 *              conforming to the defined GraphQL schema.
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
  public async getRepos(owner?: string, limit?: number): Promise<Repo[]> {
    const query = `
      query GetUserRepos($owner: String, $limit: Int) {
        githubRepos(owner: $owner, limit: $limit) {
          id
          name
          fullName
          private
          htmlUrl
          description
          owner
        }
      }
    `;

    const variables = { owner, limit };
    const response = await this.bffClient.query<{ githubRepos: Repo[] }>(query, variables);
    return response.githubRepos;
  }

  /**
   * @inheritdoc
   */
  public async getRepoTree(owner: string, repo: string): Promise<FileNode> {
    // Assuming the BFF schema includes 'githubRepoTree' as it's a critical feature.
    const query = `
      query GetRepoTree($owner: String!, $repo: String!) {
        githubRepoTree(owner: $owner, repo: $repo) {
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
    `;

    const variables = { owner, repo };
    const response = await this.bffClient.query<{ githubRepoTree: FileNode }>(query, variables);
    return response.githubRepoTree;
  }

  /**
   * @inheritdoc
   */
  public async getFileContent(owner: string, repo: string, path: string): Promise<GitHubFile> {
    const query = `
      query GetFileContent($owner: String!, $repo: String!, $path: String!) {
        githubFileContent(owner: $owner, repo: $repo, path: $path) {
          path
          content
          sha
        }
      }
    `;

    const variables = { owner, repo, path };
    const response = await this.bffClient.query<{ githubFileContent: GitHubFile }>(query, variables);
    return response.githubFileContent;
  }

  /**
   * @inheritdoc
   */
  public async commitFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = 'main'
  ): Promise<string> {
    const mutation = `
      mutation CommitFile($input: GitHubCommitFileInput!) {
        githubCommitFile(input: $input)
      }
    `;

    const variables = { 
      input: { owner, repo, branch, message, path, content }
    };
    const response = await this.bffClient.mutate<{ githubCommitFile: string }>(mutation, variables);
    return response.githubCommitFile;
  }
}
