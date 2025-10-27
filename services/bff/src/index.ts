/**
 * @file services/bff/src/index.ts
 * @description Main entry point for the Backend-for-Frontend (BFF) GraphQL service.
 * This service acts as a secure gateway between the micro-frontends and the downstream microservices.
 * It handles JWT-based authentication, orchestrates API calls, and exposes a unified GraphQL schema.
 * @module BFF
 * @see {@link https://www.apollographql.com/docs/apollo-server/ | Apollo Server Docs}
 * @see {@link https://typegraphql.com/ | TypeGraphQL Docs}
 * @see {@link https://inversify.io/ | InversifyJS Docs}
 */

import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import http from 'http';
import { Container, injectable, inject } from 'inversify';
import { Resolver, Query, Ctx, Arg } from 'type-graphql';

// --- Constants & Configuration ---

/**
 * @constant {number} PORT
 * @description The port on which the BFF server will listen.
 * Defaults to 4000 or the value of the PORT environment variable.
 * @performance Network performance depends on the hosting environment.
 */
const PORT = process.env.PORT || 4000;

/**
 * @constant {string} JWT_SECRET
 * @description The secret key used to verify JWT signatures.
 * @security In a production environment, this MUST be a long, complex, random string and
 * should be managed securely via environment variables or a secrets management service (e.g., HashiCorp Vault).
 * It must match the secret used by the AuthGateway microservice to sign the tokens.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-and-long-jwt-key-that-is-not-this';

/**
 * @interface IContext
 * @description Defines the shape of the GraphQL context object, which is created for each request and passed to all resolvers.
 * It holds request-scoped state, including the authenticated user's information.
 * @property {object | null} user - The decoded JWT payload of the authenticated user. Null if unauthenticated.
 * @property {string | null} token - The raw JWT from the Authorization header.
 * @property {Container} container - The dependency injection container for resolving services.
 */
interface IContext {
  user: { id: string; [key: string]: any } | null;
  token: string | null;
  container: Container;
}

// --- Dependency Injection Symbols ---

/**
 * @constant {object} TYPES
 * @description Defines symbols for dependency injection bindings, preventing naming collisions.
 */
const TYPES = {
  AuthGatewayClient: Symbol.for('AuthGatewayClient'),
  GithubService: Symbol.for('GithubService'),
  AiService: Symbol.for('AiService'),
};

// --- Mock Service Clients & Adapters (Infrastructure Layer) ---

/**
 * @class MockAuthGatewayClient
 * @description A mock client to simulate calls to the AuthGateway microservice.
 * In a real system, this would be an adapter making HTTP/gRPC requests to the actual service.
 * @security This client is responsible for retrieving sensitive third-party tokens on behalf of the user.
 * @performance Caching of retrieved tokens could be implemented here to reduce latency and load on the AuthGateway.
 */
@injectable()
class MockAuthGatewayClient {
  /**
   * Retrieves a third-party service token (e.g., GitHub PAT) for a given user from the AuthGateway.
   * @param {string} userId - The ID of the user for whom to retrieve the token.
   * @param {'github' | 'jira'} service - The service for which the token is needed.
   * @returns {Promise<string>} A promise that resolves to the third-party token.
   * @throws Will throw an error if the token is not found or retrieval fails.
   * @example
   * const githubToken = await authGateway.getThirdPartyToken('user-123', 'github');
   */
  async getThirdPartyToken(userId: string, service: 'github' | 'jira'): Promise<string> {
    console.log(`[BFF] Orchestrating call to AuthGateway: getThirdPartyToken for user ${userId}, service ${service}`);
    // In a real system, this would be an authenticated service-to-service request.
    if (service === 'github') {
      return `mock_github_pat_for_${userId}`;
    }
    throw new Error(`Token for service '${service}' not found for user '${userId}'.`);
  }
}

// --- Mock Business Layer Services ---

/**
 * @class MockGithubService
 * @description A mock business service for handling GitHub-related logic.
 * It uses the AuthGatewayClient to fetch necessary credentials before calling the GitHubProxyService.
 */
@injectable()
class MockGithubService {
  constructor(@inject(TYPES.AuthGatewayClient) private authGateway: MockAuthGatewayClient) {}

  /**
   * Fetches repositories for a user by orchestrating calls to the AuthGateway and then the GitHubProxyService.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object[]>} A promise resolving to a list of mock repositories.
   */
  async getReposForUser(userId: string): Promise<object[]> {
    const token = await this.authGateway.getThirdPartyToken(userId, 'github');
    console.log(`[BFF] Orchestrating call to GithubProxyService with token: ${token.substring(0, 15)}...`);
    // In a real system: return await this.githubProxyClient.getRepos(token);
    return [{ id: '1', name: 'repo-one' }, { id: '2', name: 'repo-two' }];
  }
}

/**
 * @class MockAiService
 * @description A mock business service for handling AI-related logic.
 */
@injectable()
class MockAiService {
  /**
   * Gets an explanation for a code snippet by calling the AIGatewayService.
   * @param {string} userId - The ID of the user making the request.
   * @param {string} code - The code snippet to explain.
   * @returns {Promise<string>} A promise resolving to a mock explanation.
   */
  async explainCode(userId: string, code: string): Promise<string> {
    console.log(`[BFF] Orchestrating call to AIGatewayService: explainCode for user ${userId}`);
    // In a real system: return await this.aiGatewayClient.explainCode(code);
    return `This is a mock explanation from the BFF for the code: ${code.substring(0, 30)}...`;
  }
}

// --- GraphQL Resolvers (Presentation Layer) ---

@Resolver()
class GithubResolver {
  /**
   * GraphQL query to fetch repositories for the authenticated user.
   * @param {IContext} context - The GraphQL request context, containing the authenticated user.
   * @returns {Promise<string>} A JSON string representing the list of repositories.
   * @throws Throws an authentication error if the user is not logged in.
   */
  @Query(() => String)
  async userRepositories(@Ctx() { user, container }: IContext): Promise<string> {
    if (!user?.id) {
      throw new Error('Authentication required');
    }
    const githubService = container.get<MockGithubService>(TYPES.GithubService);
    const repos = await githubService.getReposForUser(user.id);
    return JSON.stringify(repos);
  }
}

@Resolver()
class AiResolver {
  /**
   * GraphQL query to get an explanation for a piece of code.
   * @param {string} code - The code snippet to explain.
   * @param {IContext} context - The GraphQL request context.
   * @returns {Promise<string>} A promise resolving to the AI-generated explanation.
   * @throws Throws an authentication error if the user is not logged in.
   */
  @Query(() => String)
  async explainCode(@Arg('code') code: string, @Ctx() { user, container }: IContext): Promise<string> {
    if (!user?.id) {
      throw new Error('Authentication required');
    }
    const aiService = container.get<MockAiService>(TYPES.AiService);
    const explanation = await aiService.explainCode(user.id, code);
    return explanation;
  }
}

/**
 * @function startServer
 * @description Initializes and starts the BFF Apollo GraphQL server.
 * This function sets up the Express application, configures middleware (CORS, JSON parsing, JWT auth),
 * builds the GraphQL schema, creates an Apollo Server instance, and starts listening for requests.
 * @security Implements JWT authentication middleware to protect the GraphQL endpoint.
 * @returns {Promise<void>}
 */
async function startServer(): Promise<void> {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());

  // Set up Dependency Injection container
  const container = new Container();
  container.bind<MockAuthGatewayClient>(TYPES.AuthGatewayClient).to(MockAuthGatewayClient).inSingletonScope();
  container.bind<MockGithubService>(TYPES.GithubService).to(MockGithubService).inSingletonScope();
  container.bind<MockAiService>(TYPES.AiService).to(MockAiService).inSingletonScope();

  // Build GraphQL schema using type-graphql
  const schema = await buildSchema({
    resolvers: [GithubResolver, AiResolver],
    container, // Use the DI container for resolver instantiation
    validate: false, // Disabled for simplicity in this example
  });

  // Create Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }): IContext => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      let user: IContext['user'] = null;

      if (token) {
        try {
          // In a real Zero-Trust architecture, we'd also verify the token's signature
          // using a public key fetched from the AuthGateway's JWKS endpoint.
          const decoded = jwt.verify(token, JWT_SECRET);
          if (typeof decoded === 'object' && 'id' in decoded) {
            user = decoded as IContext['user'];
          }
        } catch (err) {
          console.warn('[BFF Auth] Invalid JWT token received:', (err as Error).message);
          // Allow request to proceed as unauthenticated. Authorization is handled in resolvers.
        }
      }

      return { user, token, container };
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  await apolloServer.start();

  // Apply Apollo middleware to Express app
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  const httpServer = http.createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`ðŸš€ BFF Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`ðŸ’¡ This Backend-for-Frontend (BFF) serves as the GraphQL gateway for all micro-frontends.`);
    console.log(`ðŸ”’ It enforces JWT authentication and orchestrates calls to downstream microservices.`);
  });
}

/**
 * @entrypoint
 * @description Main entry point for the BFF service. Catches any unhandled errors during startup.
 */
startServer().catch(error => {
  console.error('[BFF] Failed to start server:', error);
  process.exit(1);
});
