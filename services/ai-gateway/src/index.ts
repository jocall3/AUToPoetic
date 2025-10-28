/**
 * @file This is the main entry point for the AI Gateway Microservice.
 * @description This microservice is responsible for orchestrating interactions with various
 *              AI providers (e.g., Google Gemini, OpenAI). It implements a multi-layered
 *              architecture with Dependency Injection and design patterns to ensure
 *              scalability, maintainability, and robust error handling.
 *
 *              It exposes a RESTful API, validates incoming requests, and securely
 *              retrieves AI API keys from a centralized Auth Gateway, adhering to a zero-trust model.
 *              All business logic resides within the `AiService`, which utilizes a Strategy pattern
 *              to select the appropriate AI provider adapter.
 * @security This service fetches sensitive AI API keys from an `AuthGatewayService` on a per-request
 *           basis (or cached temporarily by AuthGatewayService). It does not store long-lived secrets itself.
 *           Incoming requests are assumed to be authenticated by an upstream BFF, but endpoint-specific
 *           authorization could be added.
 * @performance Utilizes connection pooling and efficient payload handling. Future enhancements could include
 *              request batching and asynchronous processing via a message queue.
 * @example
 * // To start the service:
 * // 1. Ensure Node.js is installed.
 * // 2. Run `npm install` to install dependencies.
 * // 3. Run `npm start` (or `node dist/index.js` if compiled).
 * //
 * // To interact with the service (example using cURL):
 * // curl -X POST http://localhost:PORT/api/v1/ai/generate \
 * // -H "Content-Type: application/json" \
 * // -H "Authorization: Bearer <JWT_TOKEN>" \
 * // -d '{"provider": "gemini", "prompt": "Tell me a joke about coding."}'
 * @see {@link https://inversify.io/ | InversifyJS}
 * @see {@link https://www.fastify.io/ | Fastify}
 */

import 'reflect-metadata'; // Required for InversifyJS
import Fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { container } from '../inversify.config';
import { AiGatewayController } from './controllers/AiGatewayController';
import { TYPES } from './core/constants/types';
import { IConfigService } from './core/services/IConfigService';
import { ILogger } from './core/services/ILogger';

/**
 * @function bootstrap
 * @description Initializes and starts the AI Gateway microservice.
 * This function sets up the Fastify server, registers essential plugins for security and
 * cross-origin requests, integrates the InversifyJS DI container to resolve the main
 * controller, registers the API routes, and starts listening for requests.
 * @returns {Promise<void>}
 */
async function bootstrap(): Promise<void> {
  const configService = container.get<IConfigService>(TYPES.IConfigService);
  const logger = container.get<ILogger>(TYPES.ILogger);

  const server: FastifyInstance = Fastify({
    logger: {
      level: configService.get<string>('LOG_LEVEL', 'info'),
      transport: configService.isProduction() ? undefined : {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register essential security and utility plugins
  await server.register(helmet);
  await server.register(cors, {
    origin: configService.get<string[]>('CORS_ALLOWED_ORIGINS'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
  await server.register(rateLimit, {
    max: configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
    timeWindow: configService.get<string>('RATE_LIMIT_TIME_WINDOW', '1 minute'),
  });

  // Resolve the main controller from the DI container
  const aiGatewayController = container.get<AiGatewayController>(TYPES.AiGatewayController);

  // Register API routes
  server.register(aiGatewayController.register.bind(aiGatewayController), { prefix: '/api/v1' });

  // Health check endpoint
  server.get('/health', async (request, reply) => {
    logger.info('Health check requested.');
    return reply.status(200).send({ status: 'ok', service: 'ai-gateway' });
  });

  // Start the server
  try {
    const port = configService.get<number>('PORT', 8080);
    await server.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

bootstrap().catch(error => {
  console.error('Failed to bootstrap AI Gateway service:', error);
  process.exit(1);
});
