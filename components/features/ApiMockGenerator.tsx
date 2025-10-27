/**
 * @file ApiMockGenerator.tsx
 * @description This micro-frontend provides a UI for generating mock API data using AI
 *              and serving it locally via a mock server powered by a service worker.
 * @module features/ApiMockGenerator
 * @see ApiMockGenerator
 * @security This component is a developer tool and processes user-provided strings to generate
 *           mock data. While it's intended for local development, inputs should be treated as
 *           potentially untrusted in any shared or production-like environment. The service worker
 *           only intercepts requests originating from the same origin.
 * @performance The AI-driven data generation is an asynchronous, network-bound operation.
 *              The main thread is kept free during this process. For extremely large data generation
 *              requests, the client-side JSON parsing and IndexedDB storage could be offloaded to a
 *              web worker via the WorkerPoolManager service for improved performance.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Core UI components from the new abstracted UI framework
import { Button } from '@core/ui/Button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@core/ui/Card';
import { Input } from '@core/ui/Input';
import { Label } from '@core/ui/Label';
import { NumberInput } from '@core/ui/NumberInput';
import { TextArea } from '@core/ui/TextArea';
import { StatusIndicator } from '@core/ui/StatusIndicator';
import { Icon } from '@core/ui/Icon';
import { Flex } from '@core/ui/Flex';
import { Box } from '@core/ui/Box';
import { Heading } from '@core/ui/Heading';
import { Text } from '@core/ui/Text';
import { CodeBlock } from '@core/ui/CodeBlock';

// Composite UI components
import { TabbedPane, Tab } from '@composite/ui/TabbedPane';
import { useNotification } from '@composite/ui/NotificationProvider';

// Hooks and services for BFF communication (GraphQL)
import { useGenerateMockDataMutation } from '@bff/hooks/apiMockHooks';

// Local, client-side services for mocking
import { startMockServer, stopMockServer, setMockRoutes, isMockServerRunning } from '../../services/mocking/mockServer.ts';
import { saveMockCollection, getAllMockCollections, deleteMockCollection, MockCollection } from '../../services/mocking/db.ts';

/**
 * @interface Route
 * @description Defines the structure for a mock API route.
 * @property {string} path - The URL path for the mock endpoint (e.g., "/api/users").
 * @property {'GET' | 'POST' | 'PUT' | 'DELETE'} method - The HTTP method for the route.
 */
interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

const exampleSchema = "a user with an id, name, email, and a nested address object containing a city and country";

/**
 * The ApiMockGenerator component.
 * A developer tool to generate mock API data based on a natural language schema and serve it via a local mock server.
 * It uses a service worker for intercepting requests and IndexedDB for persistence.
 *
 * @component
 * @returns {React.ReactElement} The rendered ApiMockGenerator component.
 * @example
 * ```tsx
 * <ApiMockGenerator />
 * ```
 */
export const ApiMockGenerator: React.FC = () => {
    const [schema, setSchema] = useState<string>(exampleSchema);
    const [count, setCount] = useState<number>(5);
    const [collectionName, setCollectionName] = useState<string>('users');
    const [collections, setCollections] = useState<MockCollection[]>([]);
    const [generatedData, setGeneratedData] = useState<any[] | null>(null);
    const [isServerRunning, setIsServerRunning] = useState<boolean>(isMockServerRunning());
    const [routes, setRoutes] = useState<Route[]>([{ path: '/api/users', method: 'GET' }]);
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

    const { addNotification } = useNotification();
    const [generateMockData, { loading: isGenerating, error: generationError }] = useGenerateMockDataMutation();

    /**
     * @function loadCollections
     * @description Fetches all saved mock collections from IndexedDB and updates the component's state.
     * @async
     */
    const loadCollections = useCallback(async () => {
        const storedCollections = await getAllMockCollections();
        setCollections(storedCollections);
        if (storedCollections.length > 0 && !activeCollectionId) {
            setActiveCollectionId(storedCollections[0].id);
        }
    }, [activeCollectionId]);

    useEffect(() => {
        loadCollections();
    }, [loadCollections]);

    /**
     * @function handleGenerate
     * @description Triggers the GraphQL mutation to generate mock data based on the current state.
     * On success, it saves the new collection to IndexedDB and updates the UI.
     * @async
     */
    const handleGenerate = useCallback(async () => {
        if (!schema.trim() || !collectionName.trim()) {
            addNotification({ title: 'Validation Error', message: 'Schema description and collection name are required.', status: 'error' });
            return;
        }

        try {
            const response = await generateMockData({
                variables: {
                    schema: schema,
                    count: count,
                },
            });

            const data = response.data?.generateMockData;
            if (!data) {
                throw new Error("Received no data from the AI service.");
            }

            setGeneratedData(data);
            const collectionId = collectionName.toLowerCase().replace(/[\s_]+/g, '-');
            const newCollection: MockCollection = { id: collectionId, schemaDescription: schema, data };
            await saveMockCollection(newCollection);
            addNotification({ title: 'Success', message: `Collection "${collectionId}" generated and saved.`, status: 'success' });
            await loadCollections(); // Refresh the list
            setActiveCollectionId(collectionId);
        } catch (err) {
            // Error is handled by the useGenerateMockDataMutation hook's `error` state.
            // Notification will be shown via useEffect.
        }
    }, [schema, collectionName, count, generateMockData, addNotification, loadCollections]);

    useEffect(() => {
        if(generationError) {
            addNotification({ title: 'Generation Failed', message: generationError.message, status: 'error'});
        }
    }, [generationError, addNotification]);

    /**
     * @function handleServerToggle
     * @description Starts or stops the mock server service worker.
     * @async
     */
    const handleServerToggle = useCallback(async () => {
        if (isServerRunning) {
            await stopMockServer();
            setIsServerRunning(false);
            addNotification({ title: 'Server Stopped', message: 'Mock server is no longer intercepting requests.', status: 'info' });
        } else {
            try {
                await startMockServer();
                setIsServerRunning(true);
                addNotification({ title: 'Server Started', message: 'Mock server is now active.', status: 'success' });
            } catch (err) {
                 addNotification({ title: 'Server Error', message: err instanceof Error ? err.message : 'Could not start mock server.', status: 'error' });
            }
        }
    }, [isServerRunning, addNotification]);
    
    /**
     * @function handleDeleteCollection
     * @description Deletes a collection from IndexedDB.
     * @param {string} id - The ID of the collection to delete.
     * @async
     */
    const handleDeleteCollection = async (id: string) => {
        await deleteMockCollection(id);
        addNotification({ title: 'Collection Deleted', message: `Collection "${id}" has been removed.`, status: 'info' });
        await loadCollections();
        if (activeCollectionId === id) {
            setActiveCollectionId(collections.length > 1 ? collections[0].id : null);
        }
    };

    useEffect(() => {
        if (isServerRunning) {
            const mockRoutes = collections.map(collection => ({
                path: `/api/${collection.id}`,
                method: 'GET',
                response: {
                    status: 200,
                    body: collection.data,
                }
            }));
            setMockRoutes(mockRoutes);
        }
    }, [collections, isServerRunning]);

    const activeCollectionData = useMemo(() => {
        return collections.find(c => c.id === activeCollectionId)?.data || generatedData;
    }, [activeCollectionId, collections, generatedData]);

    return (
        <Flex direction="column" className="h-full p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <Flex justify="between" align="start">
                    <Box>
                        <Heading as="h1" size="3xl" className="flex items-center">
                            <Icon name="ServerStackIcon" className="mr-3" />
                            AI API Mock Server
                        </Heading>
                        <Text color="secondary" className="mt-1">
                            Generate and serve mock API data locally using a service worker.
                        </Text>
                    </Box>
                    <Button onClick={handleServerToggle} variant="outline" className="flex items-center gap-2">
                        <StatusIndicator color={isServerRunning ? 'green' : 'gray'} />
                        {isServerRunning ? 'Server Running' : 'Server Stopped'}
                    </Button>
                </Flex>
            </header>

            <Flex className="flex-grow gap-6 min-h-0">
                <Card className="w-1/3 flex flex-col">
                    <CardHeader>
                        <CardTitle>Data Generator</CardTitle>
                        <CardDescription>Describe your data schema to generate a mock collection.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col gap-4">
                        <Box>
                            <Label htmlFor="schema-description">Schema Description</Label>
                            <TextArea id="schema-description" value={schema} onChange={(e) => setSchema(e.target.value)} rows={4} placeholder={exampleSchema} />
                        </Box>
                        <Flex gap="4">
                            <Box className="flex-grow">
                                <Label htmlFor="collection-name">Collection Name</Label>
                                <Input id="collection-name" type="text" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} placeholder="users" />
                            </Box>
                            <Box className="w-24">
                                <Label htmlFor="data-count">Count</Label>
                                <NumberInput id="data-count" value={count} onValueChange={(val) => setCount(val)} min={1} max={100} />
                            </Box>
                        </Flex>
                        <Button onClick={handleGenerate} disabled={isGenerating} className="mt-auto">
                            {isGenerating ? <Icon name="LoadingSpinner" /> : <Icon name="SparklesIcon" />}
                            Generate & Save
                        </Button>
                    </CardContent>
                </Card>

                <Card className="w-2/3 flex flex-col min-h-0">
                    <CardHeader>
                         <CardTitle>Collections & Routes</CardTitle>
                        <CardDescription>Manage your saved data collections and their corresponding API routes.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col min-h-0">
                        <TabbedPane defaultValue={activeCollectionId || "data-preview"}>
                            <Flex as="header" className="border-b border-border">
                                {collections.map(c => (
                                    <Tab key={c.id} value={c.id} onValueChange={() => setActiveCollectionId(c.id)}>
                                        <Flex align="center" gap="2">
                                            {c.id}
                                            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); handleDeleteCollection(c.id); }}>
                                                <Icon name="TrashIcon" />
                                            </Button>
                                        </Flex>
                                    </Tab>
                                ))}
                                 <Tab value="data-preview" onValueChange={() => setActiveCollectionId(null)}>Last Generated</Tab>
                            </Flex>
                            <Box className="flex-grow p-4 overflow-auto">
                               {isServerRunning && activeCollectionId && (
                                    <Box className="mb-4 p-2 bg-background-alt rounded-md border border-border">
                                        <Text size="sm" color="secondary">Live Endpoint:</Text>
                                        <CodeBlock language="bash" code={`curl http://localhost:port/api/${activeCollectionId}`} />
                                    </Box>
                                )}
                                <CodeBlock 
                                    language="json"
                                    code={activeCollectionData ? JSON.stringify(activeCollectionData, null, 2) : '// Select or generate a collection to view data.'}
                                />
                            </Box>
                        </TabbedPane>
                    </CardContent>
                </Card>
            </Flex>
        </Flex>
    );
};
};
