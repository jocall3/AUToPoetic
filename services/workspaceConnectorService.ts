/**
 * @file This service defines and manages the registry of all available workspace actions
 * and provides a single entry point for executing them.
 * @module services/workspaceConnectorService
 * @version 2.0.0
 * 
 * @description
 * In alignment with the microservice and BFF architecture, this client-side service
 * has been refactored. It no longer contains the direct execution logic for third-party APIs.
 * Instead, it serves two primary purposes:
 * 1.  Maintains the `ACTION_REGISTRY` as a metadata repository. This registry is crucial for
 *     UI components (like the `WorkspaceConnectorHub`) and the `AiCommandCenter` to discover
 *     available actions, their descriptions, and required parameters.
 * 2.  Provides a single, unified `executeWorkspaceAction` function. This function validates
 *     parameters on the client-side and then dispatches the action request as an authenticated
 *     GraphQL mutation to the Backend-for-Frontend (BFF). The BFF is now responsible for
 *     orchestrating the actual API calls to downstream microservices (e.g., JiraProxyService, GitHubProxyService).
 * 
 * @see {Architectural Directives: Transition to a Federated Micro-Frontend and Microservice Architecture}
 * @see {Architectural Directives: Implement a Server-Side Zero-Trust Authentication & Authorization Gateway}
 * 
 * @security This service communicates with the BFF using a short-lived JWT, adhering to a zero-trust model.
 *           The client never handles or stores long-lived third-party API tokens.
 * @performance Client-side parameter validation provides immediate feedback without a network round-trip.
 *                All heavy lifting and external API latency are handled on the server side.
 */

import { logError, logEvent } from './telemetryService.ts';

// #region BFF Communication Layer

/**
 * @summary Placeholder for a service that manages the application's JWT for BFF communication.
 * @description In a real application, this would be part of a robust session/auth management service.
 *              It would retrieve the JWT from secure storage (e.g., an HttpOnly cookie or secure in-memory store).
 * @returns {string | null} The JWT string or null if not authenticated.
 * @security This is a critical function for securing client-BFF communication.
 */
const getJwt = (): string | null => {
    // In this architecture, the client holds a short-lived JWT for authenticating with the BFF.
    return sessionStorage.getItem('app_jwt'); // Placeholder implementation.
};

const BFF_ENDPOINT = '/graphql'; // This should be configured via environment variables.

/**
 * @summary Executes a GraphQL request to the Backend-for-Frontend (BFF).
 * @description This function centralizes all communication with the BFF. It automatically attaches the
 *              user's authentication JWT to the request headers, fulfilling the zero-trust requirement.
 * @param {string} query The GraphQL query or mutation string.
 * @param {Record<string, any>} variables The variables for the GraphQL operation.
 * @returns {Promise<any>} The JSON data from the BFF's response.
 * @throws {Error} If the network request fails, the BFF returns a non-200 status, or GraphQL errors are present.
 * @security Transmits the JWT in the Authorization header for every request to the BFF.
 */
async function graphqlRequest(query: string, variables: Record<string, any>): Promise<any> {
    const token = getJwt();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(BFF_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`BFF request failed with status ${response.status}: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
        const errorMessage = jsonResponse.errors.map((err: any) => err.message).join('\n');
        throw new Error(`BFF returned GraphQL errors: ${errorMessage}`);
    }

    return jsonResponse.data;
}

// #endregion

/**
 * @interface WorkspaceAction
 * @description Defines the metadata for an action available in the Workspace Connector Hub.
 *              The `execute` method has been removed from this client-side interface as all
 *              execution logic now resides on the BFF and downstream microservices.
 */
export interface WorkspaceAction {
  /** The unique machine-readable identifier for this action. E.g., 'jira_create_ticket'. */
  id: string;
  /** The name of the third-party service this action belongs to. E.g., 'Jira', 'Slack'. */
  service: string;
  /** A human-readable description of what the action does. */
  description: string;
  /** A function that returns a schema defining the parameters required by this action. */
  getParameters: () => { [key: string]: { type: 'string' | 'number' | 'boolean' | 'array' | 'object', required: boolean, default?: any, enum?: string[], description?: string, items?: { type: 'string' | 'number' | 'boolean' } } };
}

/**
 * @constant ACTION_REGISTRY
 * @description A central registry (Map) that catalogs all available workspace actions.
 *              This registry serves as a metadata repository for the UI and AI Command Center
 *              to discover and understand available actions.
 */
export const ACTION_REGISTRY: Map<string, WorkspaceAction> = new Map();

// #region Action Definitions

// --- JIRA: The Agile Minstrel's Symphony ---
ACTION_REGISTRY.set('jira_create_ticket', {
  id: 'jira_create_ticket',
  service: 'Jira',
  description: 'Conjures forth a new issue within a Jira project.',
  getParameters: () => ({
    projectKey: { type: 'string', required: true, description: 'The key of the project, e.g., "JEST".' },
    summary: { type: 'string', required: true, description: 'A concise title for the issue.' },
    description: { type: 'string', required: false, description: 'A detailed description of the issue.' },
    issueType: { type: 'string', required: true, default: 'Task', enum: ['Story', 'Task', 'Bug', 'Epic'], description: 'The type of issue to create.' },
    assigneeEmail: { type: 'string', required: false, description: 'The email of the user to assign the issue to.' },
    priority: { type: 'string', required: false, default: 'Medium', enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'], description: 'The priority of the issue.' },
    labels: { type: 'array', required: false, items: { type: 'string' }, description: 'An array of labels to add.' }
  }),
});

ACTION_REGISTRY.set('jira_transition_issue', {
  id: 'jira_transition_issue',
  service: 'Jira',
  description: 'Moves a Jira issue from one status to another (e.g., "In Progress" to "Done").',
  getParameters: () => ({
    issueIdOrKey: { type: 'string', required: true, description: 'The ID or key of the issue to transition (e.g., "JEST-123").' },
    transitionName: { type: 'string', required: true, description: 'The name of the target status (e.g., "Done").' },
    comment: { type: 'string', required: false, description: 'An optional comment to add during the transition.' }
  }),
});

// --- SLACK: The Digital Town Crier ---
ACTION_REGISTRY.set('slack_post_message', {
  id: 'slack_post_message',
  service: 'Slack',
  description: 'Broadcasts a message to a chosen Slack channel.',
  getParameters: () => ({
    channel: { type: 'string', required: true, description: 'The channel name or ID (e.g., "#general" or "C12345").' },
    text: { type: 'string', required: true, description: 'The message content.' },
    username: { type: 'string', required: false, default: 'Jester Bot', description: 'The name of the bot posting the message.' },
    icon_emoji: { type: 'string', required: false, default: ':jester:', description: 'An emoji to use as the bot avatar.' },
    thread_ts: { type: 'string', required: false, description: 'The timestamp of a parent message to reply in a thread.' }
  }),
});

// --- GITHUB: The Code Weaver's Loom ---
ACTION_REGISTRY.set('github_create_repository', {
  id: 'github_create_repository',
  service: 'GitHub',
  description: 'Creates a new code repository in GitHub.',
  getParameters: () => ({
    name: { type: 'string', required: true, description: 'The name for the new repository.' },
    description: { type: 'string', required: false, description: 'A description of the repository.' },
    private: { type: 'boolean', required: false, default: false, description: 'Whether the repository should be private.' },
  }),
});

ACTION_REGISTRY.set('github_create_issue', {
  id: 'github_create_issue',
  service: 'GitHub',
  description: 'Opens a new issue within a GitHub repository.',
  getParameters: () => ({
    owner: { type: 'string', required: true, description: 'The owner of the repository.' },
    repo: { type: 'string', required: true, description: 'The name of the repository.' },
    title: { type: 'string', required: true, description: 'The title of the new issue.' },
    body: { type: 'string', required: false, description: 'The detailed description of the issue.' },
    labels: { type: 'array', required: false, items: { type: 'string' }, description: 'An array of labels to apply.' },
  }),
});

ACTION_REGISTRY.set('github_create_pull_request', {
    id: 'github_create_pull_request',
    service: 'GitHub',
    description: 'Initiates a new pull request on GitHub.',
    getParameters: () => ({
        owner: { type: 'string', required: true, description: 'The owner of the repository.' },
        repo: { type: 'string', required: true, description: 'The name of the repository.' },
        title: { type: 'string', required: true, description: 'The title of the pull request.' },
        head: { type: 'string', required: true, description: 'The name of the source branch.' },
        base: { type: 'string', required: true, default: 'main', description: 'The name of the target branch.' },
        body: { type: 'string', required: false, description: 'A detailed description of the changes.' },
        draft: { type: 'boolean', required: false, default: false, description: 'Set to true for a draft pull request.' }
    })
});

// #endregion

/**
 * @summary Executes a registered workspace action by dispatching it to the BFF.
 * @description This function is the single client-side entry point for all workspace automations.
 *              It finds the action in the registry to validate parameters, then constructs and sends
 *              a GraphQL mutation to the BFF for execution.
 * @param {string} actionId The unique identifier of the action to execute.
 * @param {any} params An object containing the parameters for the action.
 * @returns {Promise<any>} A promise that resolves with the data returned by the BFF upon successful action execution.
 * @throws {Error} If the action is not found, parameters are invalid, or the BFF call fails.
 * @example
 * ```typescript
 * const result = await executeWorkspaceAction('jira_create_ticket', {
 *   projectKey: 'PROJ',
 *   summary: 'Fix the login button',
 *   issueType: 'Bug'
 * });
 * console.log('New Jira ticket created:', result);
 * ```
 */
export async function executeWorkspaceAction(actionId: string, params: any): Promise<any> {
    const action = ACTION_REGISTRY.get(actionId);
    if (!action) {
        const notFoundError = new Error(`Action "${actionId}" not found in the registry.`);
        logError(notFoundError, { context: 'executeWorkspaceAction_lookup', actionId });
        throw notFoundError;
    }

    // --- Client-side Parameter Validation ---
    const expectedParams = action.getParameters();
    for (const key in expectedParams) {
        const paramDef = expectedParams[key];
        if (paramDef.required && (params[key] === undefined || params[key] === null || params[key] === '')) {
            const validationError = new Error(`Parameter "${key}" is required for action "${actionId}".`);
            logError(validationError, { context: 'executeWorkspaceAction_validation', actionId, parameter: key });
            throw validationError;
        }
    }

    logEvent('workspace_action_bff_request', { actionId, params });

    const mutation = `
        mutation ExecuteWorkspaceAction($actionId: String!, $params: JSON!) {
            executeWorkspaceAction(actionId: $actionId, params: $params) {
                success
                message
                data
            }
        }
    `;

    try {
        const result = await graphqlRequest(mutation, { actionId, params: params || {} });
        
        const actionResult = result.executeWorkspaceAction;

        if (!actionResult || !actionResult.success) {
            const errorMessage = actionResult?.message || `BFF failed to execute action '${actionId}'.`;
            throw new Error(errorMessage);
        }

        logEvent('workspace_action_bff_success', { actionId });
        return actionResult.data; // Return the actual data payload from the successful action
    } catch (error) {
        logError(error as Error, { context: 'executeWorkspaceAction_bff_call', actionId, params });
        // Re-throw the error to be handled by the calling UI component
        throw error;
    }
}
