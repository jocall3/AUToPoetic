/**
 * @file db.ts
 * @description This module provides a client-side database service for storing and managing mock API data collections. It utilizes IndexedDB via the 'idb' library to persist data locally in the browser. This service is intended for development and testing purposes, primarily to support the ApiMockGenerator feature.
 * @module services/mocking/db
 * @see ApiMockGenerator.tsx
 * @see services/mocking/mockServer.ts
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * @constant {string} DB_NAME
 * @description The name of the IndexedDB database used for storing mock data.
 * @security This database is client-side and can be inspected by users with developer tools. No sensitive production data should ever be stored here.
 */
const DB_NAME = 'devcore-mock-db';

/**
 * @constant {number} DB_VERSION
 * @description The version of the database schema. Incrementing this version will trigger the `upgrade` callback in `openDB`.
 * @performance Schema changes should be handled carefully to avoid performance issues during database upgrades, especially with large datasets.
 */
const DB_VERSION = 1;

/**
 * @constant {string} STORE_NAME
 * @description The name of the object store within IndexedDB that holds the mock collections.
 */
const STORE_NAME = 'mock-collections';

/**
 * @interface MockCollection
 * @description Defines the structure for a single collection of mock data.
 * @property {string} id - The unique identifier for the collection, used as the primary key.
 * @property {string} schemaDescription - The natural language description of the data schema used to generate the mock data.
 * @property {any[]} data - An array of generated mock data objects.
 */
export interface MockCollection {
  id: string;
  schemaDescription: string;
  data: any[];
}

/**
 * @interface MockDB
 * @description Defines the schema for the IndexedDB database, extending the `DBSchema` type from the 'idb' library.
 * @property {Object} mock-collections - The definition for the 'mock-collections' object store.
 */
interface MockDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: MockCollection;
  };
}

/**
 * @private
 * @description A promise that resolves to an open IDBDatabase instance.
 * This singleton pattern ensures that the database is opened only once per application lifecycle.
 * @returns {Promise<IDBPDatabase<MockDB>>} A promise resolving to the database instance.
 */
const dbPromise: Promise<IDBPDatabase<MockDB>> = openDB<MockDB>(DB_NAME, DB_VERSION, {
  /**
   * @description The upgrade callback, executed when the database is first created or when the version number is increased.
   * This is where schema migrations, such as creating object stores and indexes, are performed.
   * @param {IDBPDatabase<MockDB>} db - The database instance.
   */
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  },
});

/**
 * @function saveMockCollection
 * @description Saves or updates a mock data collection in the IndexedDB store. If a collection with the same `id` exists, it will be overwritten.
 * @param {MockCollection} collection - The mock collection object to save.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws {Error} Throws an error if the IndexedDB operation fails.
 * @example
 * const myCollection = { id: 'users', schemaDescription: 'a user with name and email', data: [{ name: 'Alice', email: 'alice@example.com' }] };
 * await saveMockCollection(myCollection);
 * @performance Write operations on IndexedDB are generally fast, but performance can degrade with very large `data` arrays. Consider chunking for multi-megabyte collections.
 */
export const saveMockCollection = async (collection: MockCollection): Promise<void> => {
  try {
    const db = await dbPromise;
    await db.put(STORE_NAME, collection);
  } catch (error) {
    console.error('Failed to save mock collection:', error);
    throw new Error(`Could not save mock collection with id "${collection.id}": ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * @function getMockCollection
 * @description Retrieves a single mock data collection by its unique ID.
 * @param {string} id - The unique identifier of the collection to retrieve.
 * @returns {Promise<MockCollection | undefined>} A promise that resolves with the mock collection object, or `undefined` if no collection with that ID is found.
 * @throws {Error} Throws an error if the IndexedDB operation fails.
 * @example
 * const usersCollection = await getMockCollection('users');
 * if (usersCollection) {
 *   console.log(usersCollection.data);
 * }
 */
export const getMockCollection = async (id: string): Promise<MockCollection | undefined> => {
  try {
    const db = await dbPromise;
    return db.get(STORE_NAME, id);
  } catch (error) {
    console.error(`Failed to get mock collection with id "${id}":`, error);
    throw new Error(`Could not retrieve mock collection with id "${id}": ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * @function getAllMockCollections
 * @description Retrieves all mock data collections stored in the database.
 * @returns {Promise<MockCollection[]>} A promise that resolves with an array of all mock collection objects.
 * @throws {Error} Throws an error if the IndexedDB operation fails.
 * @example
 * const allCollections = await getAllMockCollections();
 * allCollections.forEach(collection => console.log(collection.id));
 * @performance Be cautious when using this function if a very large number of collections or large collections are stored, as it loads all data into memory.
 */
export const getAllMockCollections = async (): Promise<MockCollection[]> => {
  try {
    const db = await dbPromise;
    return db.getAll(STORE_NAME);
  } catch (error) {
    console.error('Failed to get all mock collections:', error);
    throw new Error(`Could not retrieve all mock collections: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * @function deleteMockCollection
 * @description Deletes a mock data collection from the database by its unique ID.
 * @param {string} id - The unique identifier of the collection to delete.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws {Error} Throws an error if the IndexedDB operation fails.
 * @example
 * await deleteMockCollection('users');
 */
export const deleteMockCollection = async (id: string): Promise<void> => {
  try {
    const db = await dbPromise;
    await db.delete(STORE_NAME, id);
  } catch (error) {
    console.error(`Failed to delete mock collection with id "${id}":`, error);
    throw new Error(`Could not delete mock collection with id "${id}": ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * @function clearAllMockCollections
 * @description Deletes all mock data collections from the store. Use with caution.
 * @returns {Promise<void>} A promise that resolves when the store has been cleared.
 * @throws {Error} Throws an error if the IndexedDB operation fails.
 * @example
 * await clearAllMockCollections();
 */
export const clearAllMockCollections = async (): Promise<void> => {
    try {
        const db = await dbPromise;
        await db.clear(STORE_NAME);
    } catch (error) {
        console.error('Failed to clear all mock collections:', error);
        throw new Error(`Could not clear mock collections store: ${error instanceof Error ? error.message : String(error)}`);
    }
};
