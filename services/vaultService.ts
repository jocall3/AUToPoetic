/**
 * @file Manages client-side storage for API keys and other credentials.
 * @module services/vaultService
 * @description This service provides a simplified, unencrypted mechanism for storing and retrieving
 * credentials, such as the user-provided Gemini API key, in the browser's local storage.
 * It replaces any previous master password-based vault system to align with a simpler,
 * user-provided key model for AI features.
 *
 * @security
 * This service stores credentials in plaintext in localStorage. This is NOT secure for production
 * secrets but is suitable for a developer tool where users provide their own API keys for
 * client-side use. Do not store sensitive, application-owned secrets with this service.
 * This is a transitional implementation. The final architecture will manage all secrets server-side
 * via an AuthGateway, as per the zero-trust security model directive.
 *
 * @performance
 * localStorage operations are synchronous and fast for small amounts of data like API keys.
 * The functions are async to maintain a consistent interface with potentially async storage
 * mechanisms in the future (like IndexedDB).
 */

const CREDENTIAL_PREFIX = 'devcore_credential_';

/**
 * Saves a credential to local storage. The credential is not encrypted.
 *
 * @param {string} service - The name of the service the credential belongs to (e.g., 'gemini_api_key').
 * @param {string} credential - The credential value to store.
 * @returns {Promise<void>} A promise that resolves when the credential has been saved.
 * @throws {Error} If storing to localStorage fails.
 * @example
 * await saveCredential('gemini_api_key', 'your-api-key-here');
 * @security Stores the credential in plaintext in localStorage, which is vulnerable to XSS attacks.
 */
export const saveCredential = async (service: string, credential: string): Promise<void> => {
  try {
    if (typeof service !== 'string' || !service) {
      throw new TypeError('Service name must be a non-empty string.');
    }
    if (typeof credential !== 'string') {
      throw new TypeError('Credential must be a string.');
    }
    const key = `${CREDENTIAL_PREFIX}${service}`;
    localStorage.setItem(key, credential);
  } catch (error) {
    console.error(`Failed to save credential for ${service}:`, error);
    throw new Error(`Could not save credential for ${service}.`);
  }
};

/**
 * Retrieves a credential from local storage.
 *
 * @param {string} service - The name of the service whose credential is to be retrieved.
 * @returns {Promise<string | null>} A promise that resolves with the credential string, or null if not found or if an error occurs.
 * @example
 * const apiKey = await getCredential('gemini_api_key');
 */
export const getCredential = async (service: string): Promise<string | null> => {
  try {
    if (typeof service !== 'string' || !service) {
      throw new TypeError('Service name must be a non-empty string.');
    }
    const key = `${CREDENTIAL_PREFIX}${service}`;
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get credential for ${service}:`, error);
    return null;
  }
};

/**
 * Deletes a credential from local storage.
 *
 * @param {string} service - The name of the service whose credential is to be deleted.
 * @returns {Promise<void>} A promise that resolves when the credential has been deleted.
 * @throws {Error} If deleting from localStorage fails.
 * @example
 * await deleteCredential('gemini_api_key');
 */
export const deleteCredential = async (service: string): Promise<void> => {
  try {
    if (typeof service !== 'string' || !service) {
      throw new TypeError('Service name must be a non-empty string.');
    }
    const key = `${CREDENTIAL_PREFIX}${service}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to delete credential for ${service}:`, error);
    throw new Error(`Could not delete credential for ${service}.`);
  }
};

/**
 * Retrieves a credential from local storage. This function serves as a compatibility layer
 * for parts of the application that previously used an encrypted vault and expected a
 * "decrypted" credential. In this simplified implementation, it directly calls `getCredential`.
 *
 * @param {string} service - The name of the service whose credential is to be retrieved (e.g., 'gemini_api_key').
 * @returns {Promise<string | null>} A promise that resolves with the credential string, or null if not found.
 * @example
 * const apiKey = await getDecryptedCredential('gemini_api_key');
 */
export const getDecryptedCredential = async (service: string): Promise<string | null> => {
  return getCredential(service);
};
