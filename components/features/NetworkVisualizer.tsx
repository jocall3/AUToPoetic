/**
 * @file Defines the NetworkVisualizer component for inspecting browser network activity.
 * @copyright James Burvel O'Callaghan III
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ChartBarIcon, RefreshIcon } from '../icons';

// --- Type Definitions ---

/**
 * @typedef {object} NetworkRequestEntry
 * @description Represents a processed network request entry, derived from PerformanceResourceTiming.
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
 */
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

// --- Helper Functions ---

/**
 * Formats a size in bytes into a human-readable string (e.g., KB, MB).
 * @param {number} bytes - The number of bytes to format.
 * @returns {string} A formatted, human-readable file size string.
 */
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// --- UI Components (Local Implementation for this file) ---

/**
 * @interface ColumnDef
 * @description Defines a column for the local Table component.
 */
interface ColumnDef<T> {
  accessorKey: keyof T;
  header: string;
  cell: (props: { row: { original: T }; getValue: () => any }) => React.ReactNode;
  width?: string;
}

/**
 * @interface TableProps
 * @description Props for the local Table component.
 */
interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  ariaLabel: string;
}

/**
 * A simple, local table component to render the network requests.
 */
const Table = <T extends object>({ columns, data, sortConfig, onSort, ariaLabel }: TableProps<T>) => {
  return (
    <div className="h-full w-full overflow-auto">
      <table className="w-full text-sm" aria-label={ariaLabel}>
        <thead className="sticky top-0 bg-surface z-10">
          <tr className="border-b border-border">
            {columns.map(col => (
              <th key={String(col.accessorKey)} className="p-2 text-left font-semibold text-text-secondary" style={{ width: col.width }}>
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => onSort(col.accessorKey as SortKey)}
                >
                  {col.header}
                  {sortConfig.key === col.accessorKey && (
                    <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border hover:bg-surface-hover">
              {columns.map(col => (
                <td key={String(col.accessorKey)} className="p-2 align-middle">
                  {col.cell({ row: { original: row }, getValue: () => row[col.accessorKey] })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Renders a visual waterfall bar for a network request.
 */
const WaterfallBar: React.FC<{ startTime: number; duration: number; totalDuration: number }> = ({ startTime, duration, totalDuration }) => {
    const leftPercentage = totalDuration > 0 ? (startTime / totalDuration) * 100 : 0;
    const widthPercentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
  
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm w-16 text-right text-text-secondary">{duration.toFixed(0)}ms</span>
        <div className="flex-grow h-4 bg-gray-200 dark:bg-slate-700 rounded overflow-hidden" title={`Start: ${startTime.toFixed(0)}ms`}>
          <div
            className="h-4 bg-primary rounded"
            style={{ marginLeft: `${leftPercentage}%`, width: `${widthPercentage}%` }}
          />
        </div>
      </div>
    );
};

/**
 * A component that visualizes network resource loading information for the current page.
 */
export const NetworkVisualizer: React.FC = () => {
    const [requests, setRequests] = useState<NetworkRequestEntry[]>([]);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'duration', direction: 'desc' });
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchRequests = useCallback(() => {
        setIsLoading(true);
        setTimeout(() => {
            const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
            const processedEntries = entries.map(entry => ({
                name: entry.name,
                initiatorType: entry.initiatorType,
                transferSize: entry.transferSize,
                duration: entry.duration,
                startTime: entry.startTime,
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

    const handleSort = (key: SortKey) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' };
        });
    };

    const columns = useMemo<ColumnDef<NetworkRequestEntry>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => <span className="font-mono text-sm truncate" title={row.original.name}>{row.original.shortName}</span>,
            width: '40%',
        },
        {
            accessorKey: 'initiatorType',
            header: 'Type',
            cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
            width: '15%',
        },
        {
            accessorKey: 'transferSize',
            header: 'Size',
            cell: ({ getValue }) => <span className="font-mono text-sm">{formatBytes(getValue() as number)}</span>,
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
        <div className="h-full flex flex-col gap-6 p-8 text-text-primary">
            <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold flex items-center"><ChartBarIcon /><span className="ml-3">Network Visualizer</span></h1>
                  <p className="text-text-secondary mt-1">Inspect network resources with a summary and waterfall chart.</p>
                </div>
                <button
                    onClick={fetchRequests}
                    disabled={isLoading}
                    className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                    {isLoading ? <LoadingSpinner /> : <><RefreshIcon /><span>Refresh</span></>}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-border p-3 rounded-lg text-center"><p className="text-xs text-text-secondary">Total Requests</p><p className="text-xl font-bold text-text-primary">{requestCount}</p></div>
                <div className="bg-surface border border-border p-3 rounded-lg text-center"><p className="text-xs text-text-secondary">Total Transferred</p><p className="text-xl font-bold text-text-primary">{formatBytes(totalSize)}</p></div>
                <div className="bg-surface border border-border p-3 rounded-lg text-center"><p className="text-xs text-text-secondary">Finish Time</p><p className="text-xl font-bold text-text-primary">{`${totalDuration.toFixed(0)}ms`}</p></div>
                <div className="bg-surface border border-border p-3 rounded-lg text-center"><p className="text-xs text-text-secondary">Longest Request</p><p className="text-xl font-bold text-text-primary">{requests.length > 0 ? `${Math.max(...requests.map(r => r.duration)).toFixed(0)}ms` : '0ms'}</p></div>
            </div>

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
        </div>
    );
};
