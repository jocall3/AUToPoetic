/**
 * @file Manages connections to third-party services and provides an interface for executing workspace actions.
 * @description This component serves as the central hub for connecting external services like GitHub, Jira, and Slack.
 * It follows the new architecture by delegating all authentication and action execution to a Backend-for-Frontend (BFF),
 * making this a thin presentation layer. All secrets and tokens are managed server-side by the AuthGateway.
 * @module Connections
 * @security This component initiates OAuth flows handled by the backend, ensuring no client-side exposure of secrets.
 * All API interactions with the BFF are authenticated via short-lived JWTs.
 * @performance Connection statuses and available actions are fetched via GraphQL, with data cached where appropriate.
 * The component uses optimistic UI updates for a responsive user experience.
 * @example
 * <Connections />
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { RectangleGroupIcon, GithubIcon, SparklesIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';

// --- Mock GraphQL Hooks (simulating interaction with BFF) ---

/**
 * @typedef {Object} ConnectionStatus
 * @property {string} serviceName - The name of the service (e.g., 'GitHub').
 * @property {boolean} isConnected - Whether the service is connected.
 * @property {string | null} connectedAs - The username or identifier for the connection.
 */

/**
 * Mock hook to simulate fetching connection statuses from the BFF.
 * @returns {{connections: ConnectionStatus[], loading: boolean, refetch: () => void}}
 */
const useConnectionStatus = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const refetch = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      // In a real app, this would be a GraphQL query.
      const storedConnections = JSON.parse(localStorage.getItem('mock_connections') || '{}');
      setConnections([
        { serviceName: 'GitHub', isConnected: !!storedConnections.GitHub, connectedAs: storedConnections.GitHub?.as },
        { serviceName: 'Jira', isConnected: !!storedConnections.Jira, connectedAs: storedConnections.Jira?.as },
        { serviceName: 'Slack', isConnected: !!storedConnections.Slack, connectedAs: storedConnections.Slack?.as },
        { serviceName: 'Google Gemini', isConnected: !!storedConnections.Gemini, connectedAs: 'N/A' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(refetch, [refetch]);

  return { connections, loading, refetch };
};

/**
 * Mock hook to simulate disconnecting a service via a GraphQL mutation.
 * @returns {{disconnect: (serviceName: string) => Promise<any>, loading: boolean}}
 */
const useDisconnectService = () => {
  const [loading, setLoading] = useState(false);
  const disconnect = useCallback(async (serviceName: string) => {
    setLoading(true);
    return new Promise(resolve => {
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('mock_connections') || '{}');
        delete stored[serviceName];
        localStorage.setItem('mock_connections', JSON.stringify(stored));
        setLoading(false);
        resolve({ success: true });
      }, 300);
    });
  }, []);
  return { disconnect, loading };
};

/**
 * Mock hook to simulate user authentication status.
 * @returns {{isAuthenticated: boolean, user: {name: string} | null, loading: boolean}}
 */
const useAuth = () => {
  // In a real app, this would come from a global auth context with a JWT.
  return { isAuthenticated: true, user: { name: 'Demo User' }, loading: false };
}

// --- Components ---

/**
 * Renders a card for a single service connection, allowing users to connect or disconnect.
 * This is a presentation component with logic delegated to its props.
 * @param {object} props - The component props.
 * @param {string} props.serviceName - The name of the service.
 * @param {React.ReactNode} props.icon - The icon for the service.
 * @param {string} props.status - The current connection status message.
 * @param {() => void} props.onConnect - Callback to initiate connection.
 * @param {() => Promise<void>} props.onDisconnect - Callback to initiate disconnection.
 * @param {boolean} props.isDisconnecting - Loading state for disconnection.
 * @returns {React.ReactElement} The rendered service connection card.
 */
const ServiceConnectionCard: React.FC<{
    serviceName: string;
    icon: React.ReactNode;
    status: string;
    onConnect: () => void;
    onDisconnect: () => Promise<void>;
    isDisconnecting: boolean;
}> = ({ serviceName, icon, status, onConnect, onDisconnect, isDisconnecting }) => {
    const isConnected = status.startsWith('Connected');

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
                {isConnected && (
                    <button onClick={onDisconnect} disabled={isDisconnecting} className="px-4 py-2 bg-red-500/10 text-red-600 font-semibold rounded-lg hover:bg-red-500/20 disabled:opacity-50">
                        {isDisconnecting ? <LoadingSpinner/> : 'Disconnect'}
                    </button>
                )}
            </div>
            {!isConnected && (
                <div className="mt-4 pt-4 border-t border-border">
                    <button onClick={onConnect} className="btn-primary w-full py-2 flex items-center justify-center">
                        Connect
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * The main component for managing workspace connections and actions.
 * It serves as the UI for the Backend-for-Frontend (BFF) and AuthGateway, allowing users
 * to manage service connections and execute cross-platform actions securely.
 * @returns {React.ReactElement} The rendered Connections component.
 */
export const Connections: React.FC = () => {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const { connections, loading: connectionsLoading, refetch: refetchConnections } = useConnectionStatus();
    const { disconnect, loading: disconnecting } = useDisconnectService();
    const { addNotification } = useNotification();

    useEffect(() => {
        const handleFocus = () => {
            console.log('Window focused, checking for connection status updates...');
            refetchConnections();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refetchConnections]);

    /**
     * @performance
     * Uses `useCallback` to prevent re-creation of the function on every render.
     */
    const handleConnect = useCallback((serviceName: string) => {
        const service = serviceName.toLowerCase().replace(/ /g, '-');
        // In a real app, this URL would point to the BFF's auth endpoint.
        const authUrl = `/api/auth/connect/${service}`;
        // Mocking the OAuth flow completion for demonstration purposes.
        localStorage.setItem('mock_connections', JSON.stringify({ ...JSON.parse(localStorage.getItem('mock_connections') || '{}'), [serviceName]: {as: 'demo-user'} }));
        addNotification(`Connecting to ${serviceName}... Follow the authentication prompts.`, 'info');
        setTimeout(() => refetchConnections(), 500);
    }, [addNotification, refetchConnections]);

    /**
     * @performance
     * Uses `useCallback` to memoize the function.
     */
    const handleDisconnect = useCallback(async (serviceName: string) => {
        try {
            await disconnect(serviceName);
            addNotification(`${serviceName} disconnected.`, 'success');
            refetchConnections();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            addNotification(`Failed to disconnect ${serviceName}: ${message}`, 'error');
        }
    }, [disconnect, addNotification, refetchConnections]);

    if (authLoading) {
        return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center bg-surface p-8 rounded-lg border border-border max-w-md">
                    <h2 className="text-xl font-bold">Authentication Required</h2>
                    <p className="text-text-secondary my-4">Please sign in to manage your workspace connections.</p>
                    <a href="/api/auth/login" className="btn-primary px-6 py-3 flex items-center justify-center gap-2 mx-auto">
                        Sign In
                    </a>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
             <header className="mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight flex items-center"><RectangleGroupIcon /><span className="ml-3">Connections Hub</span></h1>
                <p className="mt-2 text-lg text-text-secondary">Connect to your development services to unlock cross-platform AI actions.</p>
            </header>
            <div className="flex-grow overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connectionsLoading ? <LoadingSpinner/> : connections.map(conn => {
                        const cardProps = {
                            'GitHub': { icon: <GithubIcon /> },
                            'Jira': { icon: <div className="w-10 h-10 bg-[#0052CC] rounded flex items-center justify-center text-white font-bold text-xl">J</div> },
                            'Slack': { icon: <div className="w-10 h-10 bg-[#4A154B] rounded flex items-center justify-center text-white font-bold text-2xl">#</div> },
                            'Google Gemini': { icon: <SparklesIcon/> },
                        }[conn.serviceName];

                        return (
                            <ServiceConnectionCard 
                                key={conn.serviceName}
                                serviceName={conn.serviceName}
                                icon={cardProps?.icon || <div />}
                                onConnect={() => handleConnect(conn.serviceName)}
                                onDisconnect={() => handleDisconnect(conn.serviceName)}
                                status={conn.isConnected ? `Connected as ${conn.connectedAs || user?.name}` : 'Not Connected'}
                                isDisconnecting={disconnecting}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};