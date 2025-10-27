/**
 * @file dbService.ts
 * @module services/infrastructure
 * @description Provides a client-side persistence layer using IndexedDB. This service is responsible
 * for storing non-sensitive, user-generated content such as AI-generated code files and custom-built features.
 * All sensitive data, such as API tokens and secrets, is managed server-side by the AuthGateway and is not stored here.
 * This service acts as an adapter for the 'idb' library, exposing a clean, async API for database operations.
 *
 * @see {@link https://github.com/jakearchibald/idb} for the underlying library.
 * @performance This service uses IndexedDB, which is an asynchronous API and should not block the main thread.
 *              Operations are generally fast for small to medium-sized data. Large files (>50MB) may see performance degradation.
 * @security This service MUST NOT be used to store any sensitive information, PII, or credentials. It is for non-sensitive application state only.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { GeneratedFile, CustomFeature } from '../types';

/**
 * The name of the IndexedDB database.
 * @constant {string}
 */
const DB_NAME = 'devcore-client-storage';

/**
 * The version of the database schema. Increment this number when the schema changes.
 * @constant {number}
 */
const DB_VERSION = 1;

/**
 * The name of the object store for AI-generated files.
 * @constant {string}
 */
const FILES_STORE_NAME = 'generated-files';

/**
 * The name of the object store for user-created custom features.
 * @constant {string}
 */
const CUSTOM_FEATURES_STORE_NAME = 'custom-features';

/**
 * @interface DevCoreClientDB
 * @description Defines the schema for the client-side IndexedDB database.
 * This schema includes object stores for generated files and custom features.
 */
interface DevCoreClientDB extends DBSchema {
  [FILES_STORE_NAME]: {
    key: string; // The primary key is the file path.
    value: GeneratedFile;
    indexes: { 'by-filePath': string };
  };
  [CUSTOM_FEATURES_STORE_NAME]: {
    key: string; // The primary key is the feature ID.
    value: CustomFeature;
    indexes: { 'by-id': string };
  };
}

/**
 * A promise that resolves to the opened IndexedDB database instance.
 * This singleton promise ensures the database is opened only once.
 * The `upgrade` callback handles schema creation and migration.
 * @private
 */
const dbPromise: Promise<IDBPDatabase<DevCoreClientDB>> = openDB<DevCoreClientDB>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    // This runs if the database doesn't exist or the version number is higher.
    if (oldVersion < 1) {
      if (!db.objectStoreNames.contains(FILES_STORE_NAME)) {
        const filesStore = db.createObjectStore(FILES_STORE_NAME, {
          keyPath: 'filePath',
        });
        filesStore.createIndex('by-filePath', 'filePath', { unique: true });
      }
      if (!db.objectStoreNames.contains(CUSTOM_FEATURES_STORE_NAME)) {
        const featuresStore = db.createObjectStore(CUSTOM_FEATURES_STORE_NAME, { keyPath: 'id' });
        featuresStore.createIndex('by-id', 'id', { unique: true });
      }
    }
  },
});

// --- Generated Files Store ---

/**
 * Saves or updates an AI-generated file in the `generated-files` object store.
 * If a file with the same `filePath` already exists, it will be overwritten.
 *
 * @param {GeneratedFile} file The file object to save, containing `filePath` and `content`.
 * @returns {Promise<void>} A promise that resolves when the file has been successfully saved.
 * @throws {Error} Throws an error if the database operation fails.
 * @example
 * await saveFile({ filePath: 'components/Button.tsx', content: '...', description: 'A button component' });
 */
export const saveFile = async (file: GeneratedFile): Promise<void> => {
  const db = await dbPromise;
  await db.put(FILES_STORE_NAME, file);
};

/**
 * Retrieves all AI-generated files from the `generated-files` object store.
 *
 * @returns {Promise<GeneratedFile[]>} A promise that resolves with an array of all saved files.
 * @throws {Error} Throws an error if the database operation fails.
 * @example
 * const allFiles = await getAllFiles();
 * console.log(allFiles);
 */
export const getAllFiles = async (): Promise<GeneratedFile[]> => {
  const db = await dbPromise;
  return db.getAll(FILES_STORE_NAME);
};

/**
 * Retrieves a single AI-generated file by its path.
 *
 * @param {string} filePath The unique path of the file to retrieve.
 * @returns {Promise<GeneratedFile | undefined>} A promise that resolves with the file object, or `undefined` if not found.
 * @throws {Error} Throws an error if the database operation fails.
 * @example
 * const buttonFile = await getFileByPath('components/Button.tsx');
 */
export const getFileByPath = async (filePath: string): Promise<GeneratedFile | undefined> => {
  const db = await dbPromise;
  return db.get(FILES_STORE_NAME, filePath);
};

/**
 * Deletes all files from the `generated-files` object store.
 * This is a destructive operation and should be used with caution.
 *
 * @returns {Promise<void>} A promise that resolves when all files have been cleared.
 * @throws {Error} Throws an error if the database operation fails.
 * @example
 * await clearAllFiles();
 */
export const clearAllFiles = async (): Promise<void> => {
  const db = await dbPromise;
  await db.clear(FILES_STORE_NAME);
};

// --- Custom Features Store ---

/**
 * Saves or updates a user-created custom feature in the `custom-features` object store.
 * If a feature with the same `id` exists, it will be overwritten.
 *
 * @param {CustomFeature} feature The custom feature object to save.
 * @returns {Promise<void>} A promise that resolves when the feature has been successfully saved.
 * @throws {Error} Throws an error if the database operation fails.
 * @example
 * await saveCustomFeature({ id: 'custom-123', name: 'My Tool', ... });
 */
export const saveCustomFeature = async (feature: CustomFeature): Promise<void> => {
  const db = await dbPromise;
  await db.put(CUSTOM_FEATURES_STORE_NAME, feature);
};

/**
 * Retrieves all user-created custom features from the `custom-features` object store.
 *
 * @returns {Promise<CustomFeature[]>} A promise that resolves with an array of all saved custom features.
 * @throws {Error} Throws an error if the database operation fails.
 * @example
 * const myFeatures = await getAllCustomFeatures();
 */
export const getAllCustomFeatures = async (): Promise<CustomFeature[]> => {
  const db = await dbPromise;
  return db.getAll(CUSTOM_FEATURES_STORE_NAME);
};

/**
 * Deletes a specific custom feature by its unique ID.
 *
 * @param {string} id The unique identifier of the feature to delete.
 * @returns {Promise<void>} A promise that resolves when the feature has been deleted.
 * @throws {Error} Throws an error if the database operation fails.
 * @example
 * await deleteCustomFeature('custom-123');
 */
export const deleteCustomFeature = async (id: string): Promise<void> => {
  const db = await dbPromise;
  await db.delete(CUSTOM_FEATURES_STORE_NAME, id);
};

// --- Global Actions ---

/**
 * Clears all data from all object stores in the client-side database.
 * This is a destructive operation used for resetting application state.
 *
 * @returns {Promise<void>} A promise that resolves when all data has been cleared.
 * @throws {Error} Throws an error if any of the clear operations fail.
 * @example
 * await clearAllClientData();
 */
export const clearAllClientData = async (): Promise<void> => {
  const db = await dbPromise;
  await Promise.all([
    db.clear(FILES_STORE_NAME),
    db.clear(CUSTOM_FEATURES_STORE_NAME),
  ]);
};
