/**
 * @module components/ActionManager
 * @description Provides a primary user action interface, currently for downloading project source.
 * This component has been refactored to offload intensive processing to a web worker,
 * aligning with architectural directives for a more responsive UI.
 * @see {@link /services/workerPool/useWorkerPool} For task offloading to web workers.
 * @see {@link /ui/core/Button} For the core UI component used.
 */

import React, { useState, useCallback } from 'react';
import { useWorkerPool } from '@/services/workerPool/useWorkerPool'; // Assumed path for new Worker Pool Manager
import { useNotification } from '@/contexts/NotificationContext';
import { CoreButton } from '@/ui/core/Button'; // Assumed path for new Core UI library
import { ArrowDownTrayIcon } from './icons';
import { LoadingSpinner } from './shared';

/**
 * @class ActionManager
 * @description A floating action component that provides global actions for the application.
 * Its primary action is to trigger the download of the entire application source code,
 * including any dynamically generated files from the AI Feature Builder, as a single ZIP archive.
 *
 * @performance
 * The primary computational load (zipping files) is offloaded to a dedicated web worker via the
 * `useWorkerPool` hook. This prevents the main UI thread from blocking, ensuring the application
 * remains responsive even when zipping a large number of files. The component itself is lightweight.
 *
 * @security
 * This component triggers a download of source files. While the source code is client-side, this action
 * could be considered sensitive. In a production environment, this feature might be restricted to
 * specific user roles (e.g., 'admin', 'developer'). The component does not handle any credentials or
 * sensitive data directly.
 *
 * @example
 * ```tsx
 * <WorkspaceLayout>
 *   <ActionManager />
 *   // ... other layout children
 * </WorkspaceLayout>
 * ```
 */
export const ActionManager: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const workerPool = useWorkerPool();
    const { addNotification } = useNotification();

    /**
     * @function handleDownloadSource
     * @description A callback function to handle the click event for downloading the project source.
     * It enqueues a task to the worker pool to perform file gathering and zipping,
     * then processes the resulting Blob to trigger a browser download.
     *
     * @returns {Promise<void>}
     * @throws Will display a user notification if the worker task fails or if the worker pool is unavailable.
     * @security This function initiates a file download to the user's machine. The content is generated
     * client-side and is composed of the application's own source code and user-generated data from IndexedDB.
     */
    const handleDownloadSource = useCallback(async () => {
        if (!workerPool) {
            addNotification('Worker pool is not available. Cannot start download.', 'error');
            console.error("ActionManager: Worker pool is not available.");
            return;
        }

        setIsLoading(true);
        addNotification('Preparing project source for download...', 'info');

        try {
            /**
             * @task ZIP_PROJECT_SOURCE
             * @description A web worker task that gathers all static source files and any
             * AI-generated files from IndexedDB, compresses them into a single ZIP archive,
             * and returns the resulting Blob.
             */
            const zipBlob = await workerPool.enqueueTask<Blob>({
                type: 'ZIP_PROJECT_SOURCE',
                payload: {}, // No payload needed for this task
            });

            if (zipBlob instanceof Blob) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = 'devcore-ai-toolkit-source.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                addNotification('Source code ZIP download started!', 'success');
            } else {
                throw new Error('Worker did not return a valid Blob for zipping.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error("Failed to create or download ZIP file:", error);
            addNotification(`Error creating ZIP: ${errorMessage}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [workerPool, addNotification]);

    return (
        <div className="absolute top-6 right-6 z-10">
            <CoreButton
                variant="fab"
                aria-label="Download App Source Code & Generated Files"
                title="Download App Source Code & Generated Files"
                onClick={handleDownloadSource}
                disabled={isLoading}
                icon={isLoading ? <LoadingSpinner /> : <ArrowDownTrayIcon />}
            />
        </div>
    );
};
