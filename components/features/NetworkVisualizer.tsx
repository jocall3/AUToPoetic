/**
 * @file Defines the NetworkVisualizer component for inspecting browser network activity.
 * @copyright James Burvel O'Callaghan III
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner'; // Assuming this will be aliased to a core-ui component

// --- Fictional UI Framework Imports ---
// These components are assumed to exist as part of the new abstracted UI framework.
const VStack: React.FC<{ children: React.ReactNode, spacing?: string, padding?: string, className?: string }> = ({ children, className }) => <div className={`flex flex-col gap-4 p-6 ${className}`}>{children}</div>;
const HStack: React.FC<{ children: React.ReactNode, justify?: string, verticalAlign?: string, spacing?: string, className?: string }> = ({ children, className }) => <div className={`flex items-center gap-4 ${className}`}>{children}</div>;
const Header: React.FC<{ level: number, icon: React.ReactNode, title: string, subtitle: string }> = ({ icon, title, subtitle }) => <div><h1 className="text-3xl font-bold flex items-center">{icon}<span className="ml-3">{title}</span></h1><p className="text-text-secondary mt-1">{subtitle}</p></div>;
const Button: React.FC<{ children: React.ReactNode, variant?: string, icon?: React.ReactNode, onClick: () => void, isLoading?: boolean, disabled?: boolean }> = ({ children, icon, onClick, isLoading }) => <button onClick={onClick} disabled={isLoading} className="btn-primary px-4 py-2 flex items-center gap-2">{isLoading ? <LoadingSpinner /> : <>{icon}{children}</>}</button>;
const Text: React.FC<{ children: React.ReactNode, variant?: string, size?: string, isTruncated?: boolean, title?: string, className?: string }> = ({ children, title, isTruncated, className }) => <span title={title} className={`${isTruncated ? 'truncate' : ''} ${className}`}>{children}</span>;
const StatCard: React.FC<{ title: string, value: string | number }> = ({ title, value }) => <div className="bg-surface border border-border p-3 rounded-lg text-center"><p className="text-xs text-text-secondary">{title}</p><p className="text-xl font-bold text-text-primary">{value}</p></div>;
import { ChartBarIcon, RefreshIcon } from '../icons'; // Assuming icons are part of the new framework
// A real Table component would be much more complex.
import { Table, ColumnDef } from '../../services/mocking/MockTable';

// --- Type Definitions with JSDoc ---

/**
 * @typedef {object} NetworkRequestEntry
 * @description Represents a processed network request entry, derived from PerformanceResourceTiming.
 * @property {string} name - The URL of the resource.
 * @property {string} shortName - A truncated version of the resource name.
 * @property {PerformanceResourceTiming['initiatorType']} initiatorType - The type of initiator for the request.
 * @property {number} transferSize - The size of the fetched resource in bytes.
 * @property {number} duration - The total time taken for the request in milliseconds.
 * @property {number} startTime - The start time of the request relative to the navigation start.
 * @example { name: 'https://example.com/script.js', shortName: 'script.js', initiatorType: 'script', ... }
 */
type NetworkRequestEntry = Pick<PerformanceResourceTiming, 'name' | 'initiatorType' | 'transferSize' | 'duration' | 'startTime'> & {
  shortName: string;
};

/**
 * @typedef {'name' | 'initiatorType' | 'transferSize' | 'duration'} SortKey
 * @description Defines the valid keys by which the network request table can be sorted.
 */
type SortKey = 'name' | 'initiatorType' | 'transferSize' | 'duration';

/**
 * @typedef {'asc' | 'desc'} SortDirection
 * @description Defines the sorting direction.
 */
type SortDirection = 'asc' | 'desc';

/**
 * @typedef {object} SortConfig
 * @description Represents the current sorting configuration for the table.
 * @property {SortKey} key - The column key to sort by.
 * @property {SortDirection} direction - The direction of the sort.
 */
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

// --- Helper Functions with JSDoc ---

/**
 * Formats a size in bytes into a human-readable string (e.g., KB, MB).
 * @param {number} bytes - The number of bytes to format.
 * @param {number} [decimals=2] - The number of decimal places to use.
 * @returns {string} A formatted, human-readable file size string.
 * @example
 * formatBytes(1024); // "1.00 KB"
 * formatBytes(1234567); // "1.18 MB"
 */
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


/**
 * Renders a visual waterfall bar for a network request.
 * @param {object} props - The component props.
 * @param {number} props.startTime - The start time of the request.
 * @param {number} props.duration - The duration of the request.
 * @param {number} props.totalDuration - The total duration of all requests for scaling.
 * @returns {React.ReactElement} A JSX element representing the waterfall bar.
 * @performance This is a lightweight presentational component with minimal re-render cost.
 */
const WaterfallBar: React.FC<{ startTime: number; duration: number; totalDuration: number }> = ({ startTime, duration, totalDuration }) => {
    const leftPercentage = totalDuration > 0 ? (startTime / totalDuration) * 100 : 0;
    const widthPercentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
  
    return (
      <HStack verticalAlign="center" spacing="md">
        <Text variant="monospace" size="sm" className="w-16 text-right text-text-secondary">{duration.toFixed(0)}ms</Text>
        <div className="flex-grow h-4 bg-surface rounded overflow-hidden" title={`Start: ${startTime.toFixed(0)}ms`}>
          <div
            className="h-4 bg-primary rounded"
            style={{ marginLeft: `${leftPercentage}%`, width: `${widthPercentage}%` }}
          />
        </div>
      </HStack>
    );
  };
  

/**
 * A component that visualizes network resource loading information for the current page.
 * It provides a summary of network activity and a detailed waterfall chart of all requests.
 *
 * @component
 * @returns {React.ReactElement} The NetworkVisualizer component.
 * @example
 * <NetworkVisualizer />
 * @performance
 * This component relies on the `performance.getEntriesByType` browser API, which is generally efficient.
 * Data processing (sorting, summarizing) is memoized to prevent unnecessary recalculations on re-renders.
 * Rendering a large number of rows (>500) could potentially impact performance, but this is unlikely in typical scenarios.
 * @security
 * This component only reads non-sensitive performance data from the local browser environment.
 * It does not transmit any data externally, posing a low security risk.
 */
export const NetworkVisualizer: React.FC = () => {
    const [requests, setRequests] = useState<NetworkRequestEntry[]>([]);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'duration', direction: 'desc' });
    const [isLoading, setIsLoading] = useState<boolean>(true);

    /**
     * Fetches and processes network performance entries from the browser.
     * @function
     * @private
     */
    const fetchRequests = useCallback(() => {
        setIsLoading(true);
        // Using a timeout to ensure all entries are captured after initial load.
        setTimeout(() => {
            const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
            const processedEntries = entries.map(entry => ({
                ...entry.toJSON(), // Use toJSON to get a plain object
                shortName: entry.name.split('/').pop()?.split('?')[0] || entry.name,
            }));
            setRequests(processedEntries);
            setIsLoading(false);
        }, 200);
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);
    
    const { totalSize, totalDuration, requestCount } = useMemo(() => {
        if (requests.length === 0) {
            return { totalSize: 0, totalDuration: 0, requestCount: 0 };
        }
        const size = requests.reduce((acc, req) => acc + req.transferSize, 0);
        const finishTime = Math.max(...requests.map(r => r.startTime + r.duration));
        return { totalSize: size, totalDuration: finishTime, requestCount: requests.length };
    }, [requests]);

    const sortedRequests = useMemo(() => {
        return [...requests].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [requests, sortConfig]);

    /**
     * Handles column header clicks to update the sorting configuration.
     * @param {SortKey} key - The key of the column to sort by.
     */
    const handleSort = (key: SortKey) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' }; // Default to descending for new column
        });
    };

    const columns = useMemo<ColumnDef<NetworkRequestEntry>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => <Text variant="monospace" size="sm" isTruncated title={row.original.name}>{row.original.shortName}</Text>,
            width: '40%',
        },
        {
            accessorKey: 'initiatorType',
            header: 'Type',
            cell: ({ getValue }) => <Text size="sm">{getValue()}</Text>,
            width: '15%',
        },
        {
            accessorKey: 'transferSize',
            header: 'Size',
            cell: ({ getValue }) => <Text variant="monospace" size="sm">{formatBytes(getValue())}</Text>,
            width: '15%',
        },
        {
            accessorKey: 'duration',
            header: 'Time / Waterfall',
            cell: ({ row }) => <WaterfallBar startTime={row.original.startTime} duration={row.original.duration} totalDuration={totalDuration} />,
            width: '30%',
        },
    ], [totalDuration]);
    
    return (
        <VStack spacing="lg" padding="xl" className="h-full">
            <HStack justify="between" verticalAlign="center">
                <Header
                    level={1}
                    icon={<ChartBarIcon />}
                    title="Network Visualizer"
                    subtitle="Inspect network resources with a summary and waterfall chart."
                />
                <Button
                    variant="secondary"
                    icon={<RefreshIcon />}
                    onClick={fetchRequests}
                    isLoading={isLoading}
                >
                    Refresh
                </Button>
            </HStack>

            <HStack spacing="md" className="grid grid-cols-2 md:grid-cols-4">
                <StatCard title="Total Requests" value={requestCount} />
                <StatCard title="Total Transferred" value={formatBytes(totalSize)} />
                <StatCard title="Finish Time" value={`${totalDuration.toFixed(0)}ms`} />
                <StatCard
                    title="Longest Request"
                    value={requests.length > 0 ? `${Math.max(...requests.map(r => r.duration)).toFixed(0)}ms` : '0ms'}
                />
            </HStack>

            <div className="flex-grow overflow-hidden bg-surface border border-border rounded-lg">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                ) : (
                    <Table<NetworkRequestEntry>
                        columns={columns}
                        data={sortedRequests}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        ariaLabel="Network Requests Table"
                    />
                )}
            </div>
        </VStack>
    );
};