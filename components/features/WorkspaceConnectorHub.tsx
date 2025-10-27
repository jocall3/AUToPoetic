/**
 * @file WorkspaceConnectorHub.tsx
 * @module components/features/WorkspaceConnectorHub
 * @description Manages connections to external services and provides a manual action runner.
 * This component has been refactored to align with the new zero-trust, microservice architecture.
 * All credential management and third-party API interactions are now handled server-side by the BFF
 * and dedicated microservices (e.g., AuthGateway, GitHubProxyService).
 * The client initiates OAuth flows via the BFF and executes actions via GraphQL mutations.
 * 
 * @security This component no longer handles any secrets (API keys, PATs, etc.). All operations are
 * authenticated via a short-lived JWT sent to the BFF with each request. The BFF orchestrates
 * secure token retrieval from the server-side vault (via AuthGateway) on a per-request basis.
 * @performance Connection statuses and available actions are fetched via GraphQL queries.
 *              These queries should be cached using a library like Apollo Client or TanStack Query
 *              to improve performance and reduce network load.
 * @see AuthGateway microservice documentation for details on OAuth flows.
 * @see BFF GraphQL schema for `userConnections`, `availableActions`, and `executeAction` definitions.
 * @example
 * <WorkspaceConnectorHub />
 */

import React, { useState, useMemo, useCallback } from 'react';

// NOTE: The following hooks are conceptual placeholders for the new BFF GraphQL client.
// In a real implementation, these would come from a library like Apollo Client or TanStack Query.
// They simulate fetching data and calling mutations on the BFF.
import {
    useUserConnectionsQuery,
    useAvailableActionsQuery,
    useExecuteActionMutation,
    useDisconnectServiceMutation,
} from '../../services/infra/bff/queries'; // Conceptual import path

import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { RectangleGroupIcon, GithubIcon, SparklesIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';
import { signInWithGoogle } from '../../services/googleAuthService.ts';

/**
 * @interface ServiceConnectionCardProps
 * @description Props for the ServiceConnectionCard component.
 */
interface ServiceConnectionCardProps {
    /** The name of the service (e.g., 'GitHub'). */
    serviceName: string;
    /** React node for the service's icon. */
    icon: React.ReactNode;
    /** The current connection status message. */
    status: string;
    /** A boolean indicating if a connect/disconnect operation is in progress. */
    isLoading: boolean;
    /** The base URL of the Backend-for-Frontend. */
    bffUrl: string;
    /** A function to refetch connection statuses. */
    refetchConnections: () => void;
}

/**
 * @component ServiceConnectionCard
 * @description A UI component that displays the connection status for a single external service
 * and provides buttons to connect or disconnect.
 * @param {ServiceConnectionCardProps} props The component props.
 * @returns {React.ReactElement} The rendered ServiceConnectionCard component.
 */
const ServiceConnectionCard: React.FC<ServiceConnectionCardProps> = ({ serviceName, icon, status, isLoading, bffUrl, refetchConnections }) => {
    const { addNotification } = useNotification();
    const isConnected = status !== 'Not Connected';

    const { mutate: disconnect, isLoading: isDisconnecting } = useDisconnectServiceMutation();

    const handleConnect = () => {
        const serviceKey = serviceName.toLowerCase().replace(/ /g, '-');
        // The client redirects to the BFF, which handles the OAuth2 dance with the AuthGateway.
        window.location.href = `${bffUrl}/auth/${serviceKey}/connect`;
    };

    const handleDisconnect = async () => {
        try {
            await disconnect(serviceName);
            addNotification(`${serviceName} disconnected successfully.`, 'info');
            refetchConnections();
        } catch (error) {
            addNotification(`Failed to disconnect ${serviceName}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    return (
        <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10">{icon}</div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">{serviceName}</h3>
                        <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-text-secondary'}`}>{status}</p>
                    </div>
                </div>
                {isConnected ? (
                    <button onClick={handleDisconnect} disabled={isLoading || isDisconnecting} className="px-4 py-2 bg-red-500/10 text-red-600 font-semibold rounded-lg hover:bg-red-500/20">
                        {isDisconnecting ? <LoadingSpinner /> : 'Disconnect'}
                    </button>
                ) : (
                    <button onClick={handleConnect} disabled={isLoading} className="btn-primary px-6 py-2">
                        {isLoading ? <LoadingSpinner /> : 'Connect'}
                    </button>
                )}
            </div>
        </div>
    );
};


/**
 * @component WorkspaceConnectorHub
 * @description The main feature component for managing service connections and executing workspace actions.
 * It serves as the primary UI for interacting with the AuthGateway and other microservices via the BFF.
 * @returns {React.ReactElement} The rendered WorkspaceConnectorHub component.
 */
export const WorkspaceConnectorHub: React.FC = () => {
    const { state } = useGlobalState();
    const { user, githubUser } = state;
    const { addNotification } = useNotification();

    // Conceptual: BFF URL would come from environment config.
    const BFF_URL = '/api';

    // Fetch connection statuses and available actions from the BFF
    const { data: connectionsData, isLoading: isLoadingConnections, refetch: refetchConnections } = useUserConnectionsQuery();
    const { data: actionsData, isLoading: isLoadingActions } = useAvailableActionsQuery();
    
    // Mutations for executing actions
    const { mutateAsync: executeAction, isLoading: isExecutingAction, error: executeError } = useExecuteActionMutation();

    const [selectedActionId, setSelectedActionId] = useState<string>('');
    const [actionParams, setActionParams] = useState<Record<string, any>>({});
    const [actionResult, setActionResult] = useState<string>('');

    const connectionStatuses = useMemo(() => {
        const statuses: Record<string, string> = {
            'Google Gemini': 'Not Connected',
            'GitHub': 'Not Connected',
            'Jira': 'Not Connected',
            'Slack': 'Not Connected',
        };
        connectionsData?.forEach(conn => {
            statuses[conn.serviceName] = conn.status === 'connected' 
                ? `Connected as ${conn.identity}` 
                : 'Connected';
        });
        if (githubUser) {
            statuses['GitHub'] = `Connected as ${githubUser.login}`;
        }
        return statuses;
    }, [connectionsData, githubUser]);

    const availableActions = useMemo(() => actionsData || [], [actionsData]);

    useEffect(() => {
        if (availableActions.length > 0 && !selectedActionId) {
            setSelectedActionId(availableActions[0].id);
        }
    }, [availableActions, selectedActionId]);

    const handleExecuteAction = useCallback(async () => {
        setActionResult('');
        try {
            const result = await executeAction({ actionId: selectedActionId, params: actionParams });
            setActionResult(JSON.stringify(result, null, 2));
            addNotification('Action executed successfully!', 'success');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during action execution.';
            setActionResult(`Error: ${errorMessage}`);
            addNotification(errorMessage, 'error');
        }
    }, [selectedActionId, actionParams, executeAction, addNotification]);

    const selectedAction = useMemo(() => availableActions.find(a => a.id === selectedActionId), [availableActions, selectedActionId]);

    if (!user) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center bg-surface p-8 rounded-lg border border-border max-w-md">
                    <h2 className="text-xl font-bold">Sign In Required</h2>
                    <p className="text-text-secondary my-4">Please sign in with your Google account to manage workspace connections.</p>
                    <button onClick={signInWithGoogle} className="btn-primary px-6 py-3 flex items-center justify-center gap-2 mx-auto">
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
             <header className="mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight flex items-center"><RectangleGroupIcon /><span className="ml-3">Workspace Connector Hub</span></h1>
                <p className="mt-2 text-lg text-text-secondary">Connect to your development services to unlock cross-platform AI actions.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                <div className="flex flex-col gap-6 overflow-y-auto pr-4">
                    <h2 className="text-2xl font-bold">Service Connections</h2>
                    <ServiceConnectionCard 
                        serviceName="Google Gemini"
                        icon={<SparklesIcon />}
                        status={connectionStatuses['Google Gemini']}
                        isLoading={isLoadingConnections}
                        bffUrl={BFF_URL}
                        refetchConnections={refetchConnections}
                    />
                    <ServiceConnectionCard 
                        serviceName="GitHub"
                        icon={<GithubIcon />}
                        status={connectionStatuses['GitHub']}
                        isLoading={isLoadingConnections}
                        bffUrl={BFF_URL}
                        refetchConnections={refetchConnections}
                    />
                    <ServiceConnectionCard 
                        serviceName="Jira"
                        icon={<div className="w-10 h-10 bg-[#0052CC] rounded flex items-center justify-center text-white font-bold text-xl">J</div>}
                        status={connectionStatuses['Jira']}
                        isLoading={isLoadingConnections}
                        bffUrl={BFF_URL}
                        refetchConnections={refetchConnections}
                    />
                    <ServiceConnectionCard 
                        serviceName="Slack"
                        icon={<div className="w-10 h-10 bg-[#4A154B] rounded flex items-center justify-center text-white font-bold text-2xl">#</div>}
                        status={connectionStatuses['Slack']}
                        isLoading={isLoadingConnections}
                        bffUrl={BFF_URL}
                        refetchConnections={refetchConnections}
                    />
                </div>
                <div className="flex flex-col gap-6 bg-surface p-6 border border-border rounded-lg">
                    <h2 className="text-2xl font-bold">Manual Action Runner</h2>
                    <div className="space-y-4">
                         <div>
                            <label className="text-sm font-medium">Action</label>
                            <select value={selectedActionId} onChange={e => setSelectedActionId(e.target.value)} disabled={isLoadingActions} className="w-full mt-1 p-2 bg-background border rounded">
                                {isLoadingActions && <option>Loading actions...</option>}
                                {availableActions.map(action => (
                                    <option key={action.id} value={action.id}>{action.service}: {action.description}</option>
                                ))}
                            </select>
                        </div>
                        {selectedAction?.parameters && Object.entries(selectedAction.parameters).map(([key, param]: [string, any]) => (
                            <div key={key}>
                                <label className="text-sm font-medium">{key} {param.required && '*'}</label>
                                <input 
                                    type={param.type}
                                    value={actionParams[key] || ''}
                                    onChange={e => setActionParams(p => ({...p, [key]: e.target.value}))}
                                    placeholder={param.default || ''}
                                    className="w-full mt-1 p-2 bg-background border rounded"
                                />
                            </div>
                        ))}
                        <button onClick={handleExecuteAction} disabled={isExecutingAction || !selectedAction} className="btn-primary w-full py-2 flex items-center justify-center gap-2">
                           {isExecutingAction ? <LoadingSpinner/> : <><SparklesIcon /> Execute Action</>}
                        </button>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Result</label>
                        <pre className="w-full h-48 mt-1 p-2 bg-background border rounded overflow-auto text-xs">{actionResult || (executeError ? `Error: ${executeError.message}` : 'Action results will appear here.')}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};
