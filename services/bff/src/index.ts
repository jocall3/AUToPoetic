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
import http from 'http';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSchema } from 'type-graphql';
import { Container, injectable, inject } from 'inversify';
import { Resolver, Query, Ctx, Arg, Mutation } from 'type-graphql';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// --- Constants & Configuration ---

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-secret-that-should-be-in-env-vars';

// --- Interfaces & Types ---

interface UserPayload {
  id: string;
  email: string;
  roles: string[];
}

interface IContext {
  user: UserPayload | null;
  token: string | null;
  container: Container;
}

// --- Dependency Injection Symbols ---

const TYPES = {
  AuthGatewayClient: Symbol.for('AuthGatewayClient'),
  GithubProxyClient: Symbol.for('GithubProxyClient'),
  AiGatewayClient: Symbol.for('AiGatewayClient'),
};

// --- Mock Service Clients (Infrastructure Layer) ---

@injectable()
class MockAuthGatewayClient {
  public async validateToken(token: string): Promise<UserPayload | null> {
    console.log('[BFF] Orchestrating call to AuthGateway: validateToken');
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      return decoded;
    } catch (err) {
      console.warn('[BFF] AuthGateway: Invalid token received.');
      return null;
    }
  }
}

@injectable()
class MockGithubProxyClient {
  public async getReposForUser(userId: string): Promise<any[]> {
    console.log(`[BFF] Orchestrating call to GithubProxy for user ${userId}`);
    return [{ id: '1', name: 'user-repo-one' }, { id: '2', name: 'user-repo-two' }];
  }
}

@injectable()
class MockAiGatewayClient {
  public async explainCode(userId: string, code: string): Promise<any> {
    console.log(`[BFF] Orchestrating call to AIGateway for user ${userId}`);
    return {
      summary: `This is a mock explanation from the BFF for the code: ${code.substring(0, 50)}...`,
      lineByLine: [],
      complexity: { time: 'O(n)', space: 'O(1)' },
      suggestions: ['Consider adding more comments.'],
    };
  }
}

// --- GraphQL Resolvers (Presentation Layer) ---

@Resolver()
@injectable()
class RootResolver {
  @Query(() => String)
  me(@Ctx() { user }: IContext): string {
    if (!user) {
      throw new Error('Authentication required');
    }
    return JSON.stringify(user);
  }
}

@Resolver()
@injectable()
class GithubResolver {
  constructor(@inject(TYPES.GithubProxyClient) private githubClient: MockGithubProxyClient) {}

  @Query(() => String)
  async githubRepos(@Ctx() { user }: IContext): Promise<string> {
    if (!user?.id) {
      throw new Error('Authentication required');
    }
    const repos = await this.githubClient.getReposForUser(user.id);
    return JSON.stringify(repos);
  }
}

@Resolver()
@injectable()
class AiResolver {
  constructor(@inject(TYPES.AiGatewayClient) private aiClient: MockAiGatewayClient) {}

  @Query(() => String)
  async aiCodeExplain(@Arg('code') code: string, @Ctx() { user }: IContext): Promise<string> {
    if (!user?.id) {
      throw new Error('Authentication required');
    }
    const explanation = await this.aiClient.explainCode(user.id, code);
    return JSON.stringify(explanation);
  }
}

// --- Server Setup ---

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Set up DI container
  const container = new Container();
  container.bind<MockAuthGatewayClient>(TYPES.AuthGatewayClient).to(MockAuthGatewayClient).inSingletonScope();
  container.bind<MockGithubProxyClient>(TYPES.GithubProxyClient).to(MockGithubProxyClient).inSingletonScope();
  container.bind<MockAiGatewayClient>(TYPES.AiGatewayClient).to(MockAiGatewayClient).inSingletonScope();
  container.bind<RootResolver>(RootResolver).toSelf().inRequestScope();
  container.bind<GithubResolver>(GithubResolver).toSelf().inRequestScope();
  container.bind<AiResolver>(AiResolver).toSelf().inRequestScope();


  const schema = await buildSchema({
    resolvers: [RootResolver, GithubResolver, AiResolver],
    container,
    // We'll emit the schema file for reference and for client-side codegen
    emitSchemaFile: path.resolve(__dirname, 'schema.graphql'),
    validate: false,
  });

  const server = new ApolloServer<IContext>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        let user: UserPayload | null = null;

        if (token) {
          const authGateway = container.get<MockAuthGatewayClient>(TYPES.AuthGatewayClient);
          user = await authGateway.validateToken(token);
        }

        return { user, token, container };
      },
    }),
  );

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 BFF Server ready at http://localhost:${PORT}/graphql`);
}

startServer().catch(error => {
  console.error('[BFF] Failed to start server:', error);
  process.exit(1);
});
