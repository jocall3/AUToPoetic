/**
 * @file Jester's Grand Workspace Connector Service
 * @description This file defines the client-side interface for the Workspace Connector Hub.
 * It acts as a thin client, defining available actions and dispatching them to the
 * Backend-for-Frontend (BFF) for secure execution. This adheres to a zero-trust
 * architecture where no secrets are handled client-side.
 * @version 2.0.0
 * @author James Burvel O'Callaghan III, President Citibank Demo Business Inc.
 * @security This service communicates with a BFF using a short-lived JWT. All third-party credentials and API interactions are managed server-side.
 */

import { logError, logEvent } from './telemetryService.ts';

// --- Architectural Placeholders ---
// In a real implementation, these would be imported from dedicated service modules.

/**
 * @description Represents an error related to authentication or authorization.
 */
class JesterAuthError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'JesterAuthError';
    }
}

/**
 * @description Placeholder for a function that retrieves the current user's JWT.
 * @returns {string | null} The JWT or null if not authenticated.
 */
const getAuthToken = (): string | null => {
    // In a real app, this would get the token from a secure context or cookie.
    return sessionStorage.getItem('user_jwt');
};

/**
 * @description Placeholder for a function that sends authenticated GraphQL requests to the BFF.
 * @param {{ query: string, variables: any, token: string }} options - The request options.
 * @returns {Promise<any>} The data from the BFF.
 */
const bffGraphQLRequest = async ({ query, variables, token }: { query: string; variables: any; token: string }): Promise<any> => {
    // This would point to the actual BFF endpoint from a config file.
    const BFF_ENDPOINT = '/graphql'; // Example endpoint
    const response = await fetch(BFF_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join(', '));
    }
    return result.data;
};

// --- Core Service Definitions ---

/**
 * @interface WorkspaceAction
 * @description Defines the contract for an action within the Workspace Connector Hub.
 * It serves as a client-side blueprint, detailing the action's metadata and parameters for UI generation.
 * The `execute` method is a standardized dispatcher to the BFF.
 */
export interface WorkspaceAction {
  /** The unique identifier for this action, e.g., 'jira_create_ticket'. */
  id: string;
  /** The external service this action belongs to. */
  service: 'Jira' | 'Slack' | 'GitHub' | 'Google Calendar' | 'Trello' | 'Salesforce' | 'Email' | 'AI' | 'Weather' | 'Jester' | 'Transformation' | 'Decision';
  /** A user-friendly description of what the action does. */
  description: string;
  /**
   * @method getParameters
   * @description A function that returns a map of parameters required by the action.
   * This metadata is used by the UI to dynamically generate forms for user input.
   * @returns {Record<string, { type: string, required: boolean, default?: any, enum?: string[], description?: string }>} An object describing the action's parameters.
   */
  getParameters: () => { [key: string]: { type: string; required: boolean; default?: any; enum?: string[]; description?: string } };
  /**
   * @method execute
   * @description Client-side execution function. For most actions, this simply validates parameters
   * and forwards the request to the central `executeWorkspaceAction` handler which calls the BFF.
   * @param {any} params - The parameters for this specific execution, provided by the user.
   * @returns {Promise<any>} A promise resolving with the result from the BFF.
   * @throws {JesterAuthError} If the user is not authenticated.
   * @throws {Error} If the action fails on the client or server.
   */
  execute: (params: any) => Promise<any>;
}

/**
 * @constant ACTION_REGISTRY
 * @description A map cataloging all available Workspace Actions.
 * This registry is the single source of truth for the client-side application regarding what actions
 * can be performed, what parameters they need, and how to describe them to the user.
 */
export const ACTION_REGISTRY: Map<string, WorkspaceAction> = new Map();

/**
 * @function executeWorkspaceAction
 * @description The central dispatcher for all workspace actions. It securely sends action requests
 * to the Backend-for-Frontend (BFF), which then orchestrates communication with downstream microservices.
 * This function encapsulates the GraphQL mutation logic, authentication, and error handling, adhering to a zero-trust model.
 * @param {string} actionId - The unique identifier of the action to be performed, matching an ID in the ACTION_REGISTRY.
 * @param {any} params - The specific parameters required for the chosen action.
 * @returns {Promise<any>} A promise that resolves with the result data from the BFF if the action is successful.
 * @throws {JesterAuthError} If the user is not authenticated or the auth token is invalid.
 * @throws {Error} If the GraphQL request fails, the BFF returns an error, or the action execution on the server fails.
 * @security Requires a valid JWT from `getAuthToken`. The client never handles third-party API keys directly.
 * @performance Network latency to the BFF is the primary factor. It's a single network request from the client.
 * @example
 * ```typescript
 * const result = await executeWorkspaceAction('jira_create_ticket', { projectKey: 'PROJ', summary: 'New Task' });
 * ```
 */
export async function executeWorkspaceAction(actionId: string, params: any): Promise<any> {
    logEvent('workspace_action_execute_start', { actionId, params: Object.keys(params) });
    try {
        const token = getAuthToken();
        if (!token) {
            throw new JesterAuthError("User is not authenticated. The jester demands a valid pass to enter the court!", 'NOT_AUTHENTICATED');
        }

        const mutation = `
            mutation ExecuteWorkspaceAction($actionId: ID!, $params: JSONObject!) {
                executeWorkspaceAction(actionId: $actionId, params: $params) {
                    success
                    data
                    error
                }
            }
        `;

        const response = await bffGraphQLRequest({ query: mutation, variables: { actionId, params }, token });
        const result = response.executeWorkspaceAction;

        if (!result.success) {
            throw new Error(`The action '${actionId}' failed on the server: ${result.error}`);
        }

        logEvent('workspace_action_execute_success', { actionId });
        return result.data;
    } catch (error) {
        const err = error as Error;
        logError(err, { context: 'executeWorkspaceAction', actionId, params });
        throw new Error(`Failed to execute workspace action '${actionId}': ${err.message}`);
    }
}

/**
 * @function createBffAction
 * @description A factory function to create a `WorkspaceAction` object that is handled by the BFF.
 * This simplifies the ACTION_REGISTRY by abstracting the common execution logic.
 * @param {Omit<WorkspaceAction, 'execute'>} actionMeta - The metadata for the action (id, service, description, getParameters).
 * @returns {WorkspaceAction} A full `WorkspaceAction` object with an execute method that calls the BFF.
 */
function createBffAction(actionMeta: Omit<WorkspaceAction, 'execute'>): WorkspaceAction {
    return {
        ...actionMeta,
        execute: (params: any) => {
            const expectedParams = actionMeta.getParameters();
            for (const key of Object.keys(expectedParams)) {
                if (expectedParams[key].required && (params[key] === undefined || params[key] === null)) {
                    throw new Error(`Parameter "${key}" is required for action "${actionMeta.id}".`);
                }
            }
            return executeWorkspaceAction(actionMeta.id, params);
        }
    };
}

// --- Action Definitions ---

// All external service actions are now created using the `createBffAction` factory.
// The client-side implementation is gone, replaced by a call to the BFF.

ACTION_REGISTRY.set('jira_create_ticket', createBffAction({
  id: 'jira_create_ticket',
  service: 'Jira',
  description: 'Conjures forth a new issue within the hallowed halls of a Jira project.',
  getParameters: () => ({
    projectKey: { type: 'string', required: true, description: 'The secret key to the project castle, e.g., "JEST".' },
    summary: { type: 'string', required: true, description: 'A witty, concise title for the issue.' },
    description: { type: 'string', required: false, description: 'The epic saga detailing the issue.' },
    issueType: { type: 'string', required: true, default: 'Task', enum: ['Story', 'Task', 'Bug', 'Epic', 'Sub-task'], description: 'The categorization of this digital endeavor.' }
  })
}));

ACTION_REGISTRY.set('slack_post_message', createBffAction({
  id: 'slack_post_message',
  service: 'Slack',
  description: 'Broadcasts a message to a chosen Slack channel for virtual fanfare.',
  getParameters: () => ({
    channel: { type: 'string', required: true, description: 'The public square where the message shall echo, e.g., "#general".' },
    text: { type: 'string', required: true, description: 'The message itself, ready to inform or amuse.' },
    username: { type: 'string', required: false, default: 'Jester Bot', description: 'The name of the messenger.' }
  })
}));

ACTION_REGISTRY.set('github_create_issue', createBffAction({
  id: 'github_create_issue',
  service: 'GitHub',
  description: 'Unfurls a new issue within a specified GitHub repository.',
  getParameters: () => ({
    owner: { type: 'string', required: true, description: 'The esteemed owner of the repository.' },
    repo: { type: 'string', required: true, description: 'The name of the repository where the issue shall reside.' },
    title: { type: 'string', required: true, description: 'A catchy title for the new issue.' },
    body: { type: 'string', required: false, description: 'The detailed narrative of the issue.' }
  })
}));

// ... Add all other external service actions (GitHub PR, Google Calendar, Trello, Salesforce, etc.) using createBffAction
// Omitted for brevity, but the pattern is the same as above.

// --- Jester Utilities (Client-Side Logic) ---
/**
 * @section Jester Utilities
 * @description A collection of jester-specific utilities that run client-side for flair and amusement.
 * @security These actions are client-side only and do not interact with external services or handle sensitive data.
 * They are considered safe to execute in the browser environment.
 */
ACTION_REGISTRY.set('jester_log_joke', {
  id: 'jester_log_joke',
  service: 'Jester',
  description: 'Whispers a lighthearted joke into the logs to lighten the mood.',
  getParameters: () => ({
    category: { type: 'string', required: false, default: 'programming', enum: ['programming', 'dad-joke'] }
  }),
  execute: async (params) => {
    logEvent('jester_log_joke_attempt', { category: params.category });
    const jokes = {
      programming: "Why do programmers prefer dark mode? Because light attracts bugs!",
      'dad-joke': "I told my wife she was drawing her eyebrows too high. She looked surprised."
    };
    const joke = jokes[params.category as keyof typeof jokes] || jokes.programming;
    console.log(`%cJester's Joke:%c ${joke}`, 'font-weight: bold; color: purple;', 'color: inherit;');
    return { success: true, joke };
  }
});
