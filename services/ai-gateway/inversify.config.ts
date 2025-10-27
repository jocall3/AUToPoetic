/**
 * @file inversify.config.ts
 * @description This file is the heart of the AI Gateway microservice's Dependency Injection (DI) setup.
 * It uses InversifyJS to create a DI container, define service identifiers (TYPES),
 * and bind abstract interfaces to their concrete implementations. This approach promotes
 * loose coupling, enhances testability, and adheres to the principles of Clean Architecture
 * and the Dependency Inversion Principle.
 *
 * @see https://inversify.io/ for InversifyJS documentation.
 * @see The architectural directive on implementing a multi-layered, DI framework.
 * @performance This configuration is executed once at service startup. The performance impact is minimal.
 *              Service scopes (singleton, request, transient) are defined here, which affects runtime performance
 *              and memory usage.
 * @security This file does not handle secrets directly but orchestrates the injection of the ConfigService,
 *           which is responsible for securely loading configuration and secrets.
 */

import 'reflect-metadata';
import { Container } from 'inversify';

// --- Core Layer: Abstract Interfaces and Service Identifiers ---
import { TYPES } from './core/constants/types';
import { IConfigService } from './core/services/IConfigService';
import { ILogger } from './core/services/ILogger';
import { ICompletionStrategy } from './core/services/ICompletionStrategy';
import { ICompletionStrategyFactory } from './core/services/ICompletionStrategyFactory';
import { IAiOrchestrationService } from './core/services/IAiOrchestrationService';

// --- Business Layer: Concrete Use Case Implementations ---
import { AiOrchestrationService } from './business/services/AiOrchestrationService';
import { CompletionStrategyFactory } from './business/services/CompletionStrategyFactory';

// --- Infrastructure Layer: Adapters and External-Facing Implementations ---
import { ConfigService } from './infrastructure/services/ConfigService';
import { Logger } from './infrastructure/services/Logger';
import { GeminiApiAdapter } from './infrastructure/adapters/GeminiApiAdapter';
import { OpenAIApiAdapter } from './infrastructure/adapters/OpenAIApiAdapter';

// --- Presentation Layer: Controllers ---
import { AiGatewayController } from './controllers/AiGatewayController';

/**
 * @name AiGatewayContainer
 * @description The InversifyJS container instance for the AI Gateway microservice.
 * This container holds all the bindings and is responsible for resolving dependencies at runtime.
 * It is exported to be used in the main application entry point (`server.ts` or `index.ts`).
 * @example
 * import { container } from './inversify.config';
 * import { TYPES } from './core/constants/types';
 * import { AiGatewayController } from './controllers/AiGatewayController';
 *
 * const controller = container.get<AiGatewayController>(TYPES.AiGatewayController);
 * controller.setupRoutes(app);
 */
const container = new Container({
  defaultScope: 'Transient', // Services are new instances unless specified otherwise
  autoBindInjectable: true, // Automatically bind services decorated with @injectable()
});

// --- Infrastructure Layer Bindings ---
/**
 * @description Binds essential infrastructure services that support the entire application.
 * These are typically singletons as they manage shared state or resources (like configuration, logging).
 * @security The `ConfigService` is a critical component for security as it handles the loading and provision
 *           of secrets like API keys. Binding it as a singleton ensures it is initialized only once.
 * @performance Singleton scope is optimal for these services to avoid repeated setup costs.
 */
container.bind<IConfigService>(TYPES.IConfigService).to(ConfigService).inSingletonScope();
container.bind<ILogger>(TYPES.ILogger).to(Logger).inSingletonScope();

/**
 * @description Binds the concrete AI provider adapters (strategies) to the `ICompletionStrategy` interface.
 * This implements the **Strategy Design Pattern**. Each provider is given a unique name.
 * The `CompletionStrategyFactory` can then request a specific strategy by its name.
 * @see {CompletionStrategyFactory}
 * @see {ICompletionStrategy}
 */
container.bind<ICompletionStrategy>(TYPES.ICompletionStrategy).to(GeminiApiAdapter).whenTargetNamed('gemini');
container.bind<ICompletionStrategy>(TYPES.ICompletionStrategy).to(OpenAIApiAdapter).whenTargetNamed('openai');

// --- Business Layer Bindings ---
/**
 * @description Binds the business logic and orchestration services.
 * These services implement the core use cases of the AI Gateway.
 * @performance `AiOrchestrationService` is bound in request scope to handle state specific to a single
 *              incoming request, preventing data leakage between concurrent requests.
 */

// Binds the factory that creates AI provider strategies. Implements the Factory Pattern.
container.bind<ICompletionStrategyFactory>(TYPES.ICompletionStrategyFactory).to(CompletionStrategyFactory).inSingletonScope();

// Binds the main orchestration service that uses the factory to execute AI tasks.
container.bind<IAiOrchestrationService>(TYPES.IAiOrchestrationService).to(AiOrchestrationService).inRequestScope();


// --- Presentation Layer Bindings ---
/**
 * @description Binds the controllers that handle incoming requests (e.g., from the BFF via HTTP or gRPC).
 * Controllers are entry points into the service's logic and depend on business layer services.
 * They are bound in request scope to manage the lifecycle of a single API call.
 */
container.bind<AiGatewayController>(TYPES.AiGatewayController).to(AiGatewayController).inRequestScope();

export { container };
