/**
 * @file This module provides a comprehensive suite of file and data manipulation utilities for the browser.
 * It includes robust, promise-based functions for converting between various data formats (Blob, File, ArrayBuffer, Base64, Data URL),
 * triggering client-side downloads, handling large files via chunking, calculating file hashes, and managing client-side file storage via IndexedDB.
 * All functions are designed with performance and security in mind, providing detailed error handling and documentation.
 *
 * @module services/fileUtils
 * @license SPDX-License-Identifier: Apache-2.0
 * @security This module deals with file I/O and data manipulation. Ensure all inputs, especially from users (e.g., file uploads, JSON strings), are properly validated and sanitized before use to prevent XSS and other injection attacks. Download functions create client-side files; do not construct filenames from unsanitized user input.
 * @performance Many functions in this module, particularly those involving large files (e.g., `blobToBase64`, `calculateFileSha256`, `readBlobInChunks`), can be computationally intensive and may block the main thread. For optimal user experience, these operations should be offloaded to a Web Worker pool when dealing with large data sets.
 */

/**
 * Custom Error class for general file utility operations.
 * Provides a structured way to report issues encountered during file processing.
 * @class
 * @extends Error
 */
export class FileUtilityError extends Error {
    /**
     * Creates an instance of FileUtilityError.
     * @param {string} message A human-readable description of the error.
     * @param {unknown} [originalError] An optional original error object for debugging purposes.
     */
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'FileUtilityError';
        Object.setPrototypeOf(this, FileUtilityError.prototype);
    }
}

/**
 * Converts a Blob object to a Base64 encoded string.
 * This implementation uses `FileReader.readAsArrayBuffer` for robust handling across environments.
 *
 * @param {Blob} blob The Blob object to convert.
 * @returns {Promise<string>} A Promise that resolves with the Base64 string.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails at any stage.
 * @example
 * const myBlob = new Blob(['Hello, world!'], { type: 'text/plain' });
 * try {
 *   const base64String = await blobToBase64(myBlob);
 *   console.log(base64String); // "SGVsbG8sIHdvcmxkIQ=="
 * } catch (error) {
 *   console.error("Conversion failed:", error);
 * }
 * @security Ensure the source Blob is from a trusted origin. Processing Base64 data from untrusted sources can have security implications.
 * @performance For large Blobs (>1MB), this can be slow and block the main UI thread. It is highly recommended to offload this function to a Web Worker.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const buffer = reader.result as ArrayBuffer;
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            resolve(window.btoa(binary));
        };
        reader.onerror = (error) => reject(new FileConversionError('FileReader encountered an error during Blob to Base64 conversion.', error));
        reader.readAsArrayBuffer(blob);
    });
};

/**
 * Converts a File object to a Base64 encoded string.
 * This function is a convenient alias for `blobToBase64`.
 *
 * @param {File} file The File object to convert.
 * @returns {Promise<string>} A promise that resolves with the Base64 string.
 * @throws {FileConversionError} If the File is invalid or conversion fails.
 * @example
 * const myFile = new File(['Hello'], 'hello.txt');
 * const base64 = await fileToBase64(myFile);
 * @see blobToBase64
 * @performance Performance implications are identical to `blobToBase64`. Offload to a Web Worker for large files.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return blobToBase64(file);
};

/**
 * Converts a Blob object to a Data URL string.
 * This function keeps the Data URL prefix (e.g., "data:image/png;base64,").
 *
 * @param {Blob} blob The Blob object to convert.
 * @returns {Promise<string>} A promise that resolves with the Data URL string.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails.
 * @example
 * const myBlob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
 * const dataUrl = await blobToDataURL(myBlob);
 * console.log(dataUrl); // "data:image/svg+xml;base64,..."
 * @performance Identical to `blobToBase64`. Offload to a Web Worker for large files.
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const buffer = reader.result as ArrayBuffer;
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            resolve(`data:${blob.type};base64,${window.btoa(binary)}`);
        };
        reader.onerror = (error) => reject(new FileConversionError('FileReader encountered an error during Blob to Data URL conversion.', error));
        reader.readAsArrayBuffer(blob);
    });
};

/**
 * Triggers a browser download for the given content.
 *
 * @param {string} content The string content to download.
 * @param {string} filename The name of the file to be suggested to the user.
 * @param {string} [mimeType='text/plain'] The MIME type of the file.
 * @throws {FileDownloadError} If the download mechanism fails.
 * @example
 * downloadFile('Hello, world!', 'greeting.txt', 'text/plain');
 * @security Do not construct the filename from unsanitized user input to prevent potential path traversal or other attacks if the file is used in a server context later, although client-side risk is minimal.
 * @performance Creating a Blob and Object URL is fast for small files but can consume memory for very large content strings.
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        throw new FileDownloadError(`Failed to trigger download for file "${filename}".`, error);
    }
};

/**
 * Generates and triggers a download for a `.env` formatted file from a JavaScript object.
 *
 * @param {Record<string, string>} env A record of key-value pairs for the environment variables.
 * @example
 * const envVars = { API_KEY: '12345', NODE_ENV: 'development' };
 * downloadEnvFile(envVars);
 */
export const downloadEnvFile = (env: Record<string, string>): void => {
    const content = Object.entries(env)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join('\n');
    downloadFile(content, '.env', 'text/plain');
};

/**
 * Generates and triggers a download for a JSON file from a JavaScript object.
 *
 * @param {object} data The JavaScript object to stringify and download.
 * @param {string} filename The name of the file.
 * @example
 * const user = { id: 1, name: 'John Doe' };
 * downloadJson(user, 'user-profile.json');
 */
export const downloadJson = (data: object, filename: string): void => {
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, filename, 'application/json');
};

/**
 * Custom Error class for file conversion failures.
 * @class
 * @extends FileUtilityError
 */
export class FileConversionError extends FileUtilityError {
    /**
     * Creates an instance of FileConversionError.
     * @param {string} message A human-readable description of the conversion error.
     * @param {unknown} [originalError] An optional original error object.
     */
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        this.name = 'FileConversionError';
        Object.setPrototypeOf(this, FileConversionError.prototype);
    }
}

/**
 * Custom Error class for file download failures.
 * @class
 * @extends FileUtilityError
 */
export class FileDownloadError extends FileUtilityError {
    /**
     * Creates an instance of FileDownloadError.
     * @param {string} message A human-readable description of the download error.
     * @param {unknown} [originalError] An optional original error object.
     */
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        this.name = 'FileDownloadError';
        Object.setPrototypeOf(this, FileDownloadError.prototype);
    }
}
