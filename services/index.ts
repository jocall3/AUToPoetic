/**
 * @file This file is the central entry point for the application's client-side service layer.
 * It follows the architectural directives for a multi-layered, dependency-injected framework.
 * This file defines service identifiers, creates and configures the DI container,
 * binds service interfaces to their concrete implementations, and exports the container
 * and core abstractions for use throughout the application.
 *
 * @see {@link ../docs/architecture/adr-006-service-layer-refactor.md} for architectural details.
 * @security The container configuration is a critical security boundary. Ensure that only trusted service implementations are bound.
 * @performance This module should be imported only when service resolution is needed. The container is initialized once at application startup.
 * @example
 * import { serviceContainer, SERVICE_IDENTIFIER, type IWorkerPoolManager } from '@/services';
 * const workerManager = serviceContainer.get<IWorkerPoolManager>(SERVICE_IDENTIFIER.WorkerPoolManager);
 */

// This import is required by InversifyJS to enable dependency injection via decorators.
import 'reflect-metadata';

import { Container } from 'inversify';

// --- SERVICE IDENTIFIERS ---
// Symbols are used as unique, non-string identifiers for service bindings to prevent naming collisions.
export const SERVICE_IDENTIFIER = {
    // --- Business Layer ---
    WorkerPoolManager: Symbol.for('WorkerPoolManager'),
    ResourceOrchestrator: Symbol.for('ResourceOrchestrator'),

    // --- Infrastructure Layer ---
    BffAdapter: Symbol.for('BffAdapter'),
    LocalStorageAdapter: Symbol.for('LocalStorageAdapter'),
    TelemetryAdapter: Symbol.for('TelemetryAdapter'),
    LocalDatabaseAdapter: Symbol.for('LocalDatabaseAdapter'),

    // --- Client-Side Tooling Services (Refactored) ---
    AccessibilityService: Symbol.for('AccessibilityService'),
    PerformanceService: Symbol.for('PerformanceService'),
    StaticAnalysisService: Symbol.for('StaticAnalysisService'),
    MockServerService: Symbol.for('MockServerService'),
};

// --- CORE ABSTRACTIONS (Interfaces & Types) ---
// By exporting the core interfaces and types, other parts of the application
// can depend on abstractions, not on concrete implementations.
export * from './core/interfaces';
export * from './core/types';

// --- SERVICE IMPLEMENTATIONS ---
// Import concrete implementations for binding. These are internal to this module.
// Note: These paths reflect the new, refactored service layer architecture.
import { WorkerPoolManager } from './business/worker-pool.manager';
import { ResourceOrchestrator } from './business/resource-orchestrator';
import { BffGraphQLAdapter } from './infrastructure/bff-graphql.adapter';
import { LocalStorageAdapter } from './infrastructure/local-storage.adapter';
import { TelemetryAdapter } from './infrastructure/telemetry.adapter';
import { IndexedDBAdapter } from './infrastructure/indexed-db.adapter';
import { AccessibilityService } from './tools/accessibility.service';
import { PerformanceService } from './tools/performance.service';
import { StaticAnalysisService } from './tools/static-analysis.service';
import { MockServerService } from './tools/mock-server.service';

// Core Interfaces (for type safety during binding)
import type {
    IWorkerPoolManager,
    IResourceOrchestrator,
    IBffAdapter,
    ILocalStorageAdapter,
    ITelemetryAdapter,
    ILocalDatabaseAdapter,
    IAccessibilityService,
    IPerformanceService,
    IStaticAnalysisService,
    IMockServerService
} from './core/interfaces';

// --- DI CONTAINER ---
/**
 * @const serviceContainer
 * The singleton Dependency Injection container for the application.
 * It is configured with all service bindings and is exported for use in resolving service instances.
 */
export const serviceContainer = new Container({
    defaultScope: 'Singleton',
    autoBindInjectable: true,
});

// --- BINDINGS ---

// Business Layer Bindings
serviceContainer.bind<IWorkerPoolManager>(SERVICE_IDENTIFIER.WorkerPoolManager).to(WorkerPoolManager);
serviceContainer.bind<IResourceOrchestrator>(SERVICE_IDENTIFIER.ResourceOrchestrator).to(ResourceOrchestrator);

// Infrastructure Layer Bindings
serviceContainer.bind<IBffAdapter>(SERVICE_IDENTIFIER.BffAdapter).to(BffGraphQLAdapter);
serviceContainer.bind<ILocalStorageAdapter>(SERVICE_IDENTIFIER.LocalStorageAdapter).to(LocalStorageAdapter);
serviceContainer.bind<ITelemetryAdapter>(SERVICE_IDENTIFIER.TelemetryAdapter).to(TelemetryAdapter);
serviceContainer.bind<ILocalDatabaseAdapter>(SERVICE_IDENTIFIER.LocalDatabaseAdapter).to(IndexedDBAdapter);
serviceContainer.bind<IMockServerService>(SERVICE_IDENTIFIER.MockServerService).to(MockServerService);

// Client-Side Tooling Bindings
serviceContainer.bind<IAccessibilityService>(SERVICE_IDENTIFIER.AccessibilityService).to(AccessibilityService);
serviceContainer.bind<IPerformanceService>(SERVICE_IDENTIFIER.PerformanceService).to(PerformanceService);
serviceContainer.bind<IStaticAnalysisService>(SERVICE_IDENTIFIER.StaticAnalysisService).to(StaticAnalysisService);

// --- UTILITY EXPORTS ---
// Utilities that are pure functions and do not require state or dependencies can be exported directly.
// They are not managed by the DI container.
export * from './fileUtils';
export * from './componentLoader';
export * from './taxonomyService';
