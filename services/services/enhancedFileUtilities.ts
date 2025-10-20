// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Custom Error class for general file utility operations.
 * Provides a structured way to report issues encountered during file processing.
 */
export class FileUtilityError extends Error {
    /**
     * Creates an instance of FileUtilityError.
     * @param message A human-readable description of the error.
     * @param originalError An optional original error object for debugging purposes.
     */
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'FileUtilityError';
        // Set the prototype explicitly to ensure instanceof works correctly across different JS environments.
        Object.setPrototypeOf(this, FileUtilityError.prototype);
    }
}

/**
 * Custom Error class specifically for failures during file conversions (e.g., Blob to Base64, Data URL to Blob).
 * Extends `FileUtilityError` for specific categorization.
 */
export class FileConversionError extends FileUtilityError {
    /**
     * Creates an instance of FileConversionError.
     * @param message A human-readable description of the conversion error.
     * @param originalError An optional original error object (e.g., from FileReader, JSON.parse).
     */
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        this.name = 'FileConversionError';
        Object.setPrototypeOf(this, FileConversionError.prototype);
    }
}

/**
 * Custom Error class specifically for failures during file download operations.
 * Extends `FileUtilityError` for specific categorization.
 */
export class FileDownloadError extends FileUtilityError {
    /**
     * Creates an instance of FileDownloadError.
     * @param message A human-readable description of the download error.
     * @param originalError An optional original error object (e.g., DOMException, network error).
     */
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        this.name = 'FileDownloadError';
        Object.setPrototypeOf(this, FileDownloadError.prototype);
    }
}

/**
 * Union type representing objects that behave like a file, typically Blob or File instances.
 */
export type FileLike = Blob | File;

/**
 * Interface defining options for file download operations, providing fine-grained control.
 */
export interface DownloadOptions {
    /** The MIME type of the file. If not provided, it attempts to infer or defaults to 'application/octet-stream'. */
    mimeType?: string;
    /** Whether to revoke the URL created by `URL.createObjectURL` immediately after triggering the download. Defaults to `true` to prevent memory leaks. */
    revokeObjectUrl?: boolean;
    /** An optional HTMLAnchorElement to use for triggering the download. If not provided, a new one is created. */
    anchorElement?: HTMLAnchorElement;
    /** A callback function to execute right before the download link is clicked, allowing for UI updates or logging. */
    onDownloadStart?: () => void;
    /** A callback function to execute if an error occurs during the download process, providing error details. */
    onDownloadError?: (error: FileDownloadError) => void;
}

/**
 * Represents a segment (chunk) of a larger file, useful for stream-like processing or large file handling.
 */
export interface FileChunk {
    /** The actual chunk of data as an ArrayBuffer. */
    data: ArrayBuffer;
    /** The starting byte offset of this chunk within the original file. */
    start: number;
    /** The ending byte offset (exclusive) of this chunk within the original file. */
    end: number;
    /** The total size of the original file in bytes. */
    totalSize: number;
    /** The 0-based index of this specific chunk. */
    chunkIndex: number;
    /** The total number of chunks the file is divided into. */
    totalChunks: number;
}

/**
 * Configuration options for the `readBlobInChunks` function.
 */
export interface ReadChunkOptions {
    /** The size of each chunk in bytes. Defaults to 1MB (1024 * 1024 bytes). */
    chunkSize?: number;
    /** Optional callback to report progress, receiving current bytes read and total bytes. */
    onProgress?: (bytesRead: number, totalBytes: number) => void;
    /**
     * Optional callback for each chunk processed.
     * Receives the `FileChunk` object.
     * Returning `false` from this callback (or `Promise<false>`) will stop further chunk processing.
     */
    onChunk?: (chunk: FileChunk) => boolean | void | Promise<boolean | void>;
}

/**
 * @private
 * Internal helper function to convert an ArrayBuffer to a Base64 string.
 * This is the core logic for many Base64 conversions, designed for robustness.
 * @param buffer The ArrayBuffer to convert.
 * @returns The Base64 encoded string.
 * @throws {FileConversionError} If the input is not a valid ArrayBuffer or conversion fails.
 */
const arrayBufferToBase64Internal = (buffer: ArrayBuffer): string => {
    try {
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
            throw new TypeError('Input must be a valid ArrayBuffer.');
        }
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        // String.fromCharCode.apply(null, bytes) can hit stack limits for large buffers,
        // so a loop is used for maximum robustness.
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    } catch (error) {
        throw new FileConversionError('Failed to convert ArrayBuffer to Base64.', error);
    }
};

/**
 * Converts an ArrayBuffer to a Base64 string.
 * This is a foundational utility used for many file operations, ensuring binary data can be represented as text.
 * @param buffer The ArrayBuffer containing binary data to encode.
 * @returns The Base64 encoded string.
 * @throws {FileConversionError} If the buffer is invalid or the encoding process encounters an error.
 */
export const arrayBufferToBase64 = arrayBufferToBase64Internal;

/**
 * Converts a Base64 string back into an ArrayBuffer.
 * This is the inverse operation of `arrayBufferToBase64`, allowing retrieval of binary data from a Base64 string.
 * @param base64 The Base64 encoded string.
 * @returns The ArrayBuffer containing the decoded binary data.
 * @throws {FileConversionError} If the Base64 string is invalid, malformed, or decoding fails.
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    try {
        if (typeof base64 !== 'string' || !base64) {
            throw new TypeError('Input must be a non-empty string.');
        }
        const binaryString = window.atob(base64); // Decode Base64 to binary string
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer; // Return the underlying ArrayBuffer
    } catch (error) {
        throw new FileConversionError('Failed to convert Base64 to ArrayBuffer. Invalid Base64 string?', error);
    }
};

/**
 * Converts a Base64 string to a Blob object.
 * This is particularly useful for reconstructing file-like objects from Base64 data received from a server or stored locally.
 * @param base64 The Base64 encoded string representing the file's content.
 * @param mimeType The MIME type of the content within the Blob (e.g., 'image/png', 'application/pdf'). Defaults to 'application/octet-stream'.
 * @returns A Blob object containing the decoded data.
 * @throws {FileConversionError} If the Base64 string is invalid or if the Blob creation fails.
 */
export const base64ToBlob = (base64: string, mimeType: string = 'application/octet-stream'): Blob => {
    try {
        if (typeof base64 !== 'string' || !base64) {
            throw new TypeError('Input must be a non-empty string.');
        }
        const arrayBuffer = base64ToArrayBuffer(base64);
        return new Blob([arrayBuffer], { type: mimeType });
    } catch (error) {
        throw new FileConversionError('Failed to convert Base64 to Blob.', error);
    }
};

/**
 * Extracts the Base64 encoded data portion from a Data URL string.
 * A Data URL typically looks like "data:[<MIME-type>][;charset=<encoding>][;base64],<data>".
 * @param dataUrl The Data URL string (e.g., "data:image/png;base64,iVBORw...").
 * @returns The Base64 encoded string part of the Data URL.
 * @throws {FileConversionError} If the Data URL format is invalid or the Base64 part cannot be found.
 */
export const extractBase64FromDataURL = (dataUrl: string): string => {
    try {
        if (typeof dataUrl !== 'string' || !dataUrl) {
            throw new TypeError('Input must be a non-empty string.');
        }
        const parts = dataUrl.split(',');
        if (parts.length < 2) {
            throw new Error('Invalid Data URL format: missing comma separator indicating data start.');
        }
        return parts[1];
    } catch (error) {
        throw new FileConversionError('Failed to extract Base64 from Data URL.', error);
    }
};

/**
 * Extracts the MIME type from a Data URL string.
 * This helps in understanding the content type embedded within the Data URL.
 * @param dataUrl The Data URL string (e.g., "data:image/png;base64,iVBORw...").
 * @returns The MIME type string (e.g., 'image/png').
 * @throws {FileConversionError} If the Data URL format is invalid or the MIME type cannot be extracted.
 */
export const extractMimeTypeFromDataURL = (dataUrl: string): string => {
    try {
        if (typeof dataUrl !== 'string' || !dataUrl) {
            throw new TypeError('Input must be a non-empty string.');
        }
        const parts = dataUrl.split(';');
        if (parts.length < 1 || !parts[0].startsWith('data:')) {
            throw new Error('Invalid Data URL format: missing "data:" prefix or semicolon.');
        }
        const mimeTypePart = parts[0].substring(5); // Remove "data:" prefix
        return mimeTypePart || 'application/octet-stream'; // Default to generic if no type specified
    } catch (error) {
        throw new FileConversionError('Failed to extract MIME type from Data URL.', error);
    }
};

/**
 * Converts a Data URL string into a Blob object.
 * This is immensely useful for turning data embedded directly in markup or CSS/JS into a file-like object
 * that can be manipulated, saved, or uploaded.
 * @param dataUrl The Data URL string.
 * @returns A Promise that resolves with the Blob object.
 * @throws {FileConversionError} If the Data URL is invalid, malformed, or if conversion fails.
 */
export const dataURLToBlob = async (dataUrl: string): Promise<Blob> => {
    try {
        if (typeof dataUrl !== 'string' || !dataUrl) {
            throw new TypeError('Input must be a non-empty string.');
        }
        const base64 = extractBase64FromDataURL(dataUrl);
        const mimeType = extractMimeTypeFromDataURL(dataUrl);
        return base64ToBlob(base64, mimeType);
    } catch (error) {
        throw new FileConversionError('Failed to convert Data URL to Blob.', error);
    }
};

/**
 * Converts a Data URL string into an ArrayBuffer.
 * Useful when the raw binary data from a Data URL is needed for further processing (e.g., hashing, decryption).
 * @param dataUrl The Data URL string.
 * @returns A Promise that resolves with the ArrayBuffer.
 * @throws {FileConversionError} If the Data URL is invalid or conversion fails.
 */
export const dataURLToArrayBuffer = async (dataUrl: string): Promise<ArrayBuffer> => {
    try {
        if (typeof dataUrl !== 'string' || !dataUrl) {
            throw new TypeError('Input must be a non-empty string.');
        }
        const base64 = extractBase64FromDataURL(dataUrl);
        return base64ToArrayBuffer(base64);
    } catch (error) {
        throw new FileConversionError('Failed to convert Data URL to ArrayBuffer.', error);
    }
};

/**
 * Converts a Blob object to a Base64 encoded string.
 * This implementation uses `FileReader.readAsArrayBuffer` for robust handling across environments and then `arrayBufferToBase64Internal`.
 * @param blob The Blob object to convert.
 * @returns A Promise that resolves with the Base64 string.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails at any stage (reading or encoding).
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            if (!(blob instanceof Blob)) {
                throw new TypeError('Input must be a valid Blob object.');
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                try {
                    // FileReader.result can be string or ArrayBuffer depending on read method
                    if (reader.result instanceof ArrayBuffer) {
                        resolve(arrayBufferToBase64Internal(reader.result));
                    } else {
                        // This case should ideally not happen with readAsArrayBuffer
                        reject(new FileConversionError('FileReader did not return an ArrayBuffer for Blob to Base64 conversion.'));
                    }
                } catch (error) {
                    reject(new FileConversionError('Failed to encode ArrayBuffer to Base64 during Blob conversion.', error));
                }
            };
            reader.onerror = (error) => reject(new FileConversionError('FileReader encountered an error during Blob to Base64 conversion.', (error.target as FileReader).error));
            reader.readAsArrayBuffer(blob);
        } catch (error) {
            reject(new FileConversionError('Failed to initiate Blob to Base64 conversion.', error));
        }
    });
};

/**
 * Converts a File object to a Base64 encoded string.
 * This function serves as a convenient alias for `blobToBase64`, as a `File` object is a specialized type of `Blob`.
 * @param file The File object to convert.
 * @returns A promise that resolves with the Base64 string.
 * @throws {FileConversionError} If the File is invalid or conversion fails.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    try {
        if (!(file instanceof File)) {
            throw new TypeError('Input must be a valid File object.');
        }
        return blobToBase64(file);
    } catch (error) {
        return Promise.reject(new FileConversionError('Failed to initiate File to Base64 conversion.', error));
    }
};

/**
 * Converts a Blob object to a Data URL string.
 * The resulting string includes the `data:` prefix and the inferred MIME type, making it suitable for direct embedding
 * in HTML (e.g., `<img>` src, `<iframe>` src) or CSS.
 * @param blob The Blob object to convert.
 * @returns A promise that resolves with the Data URL string.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails.
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            if (!(blob instanceof Blob)) {
                throw new TypeError('Input must be a valid Blob object.');
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                try {
                    if (reader.result instanceof ArrayBuffer) {
                        const base64 = arrayBufferToBase64Internal(reader.result);
                        resolve(`data:${blob.type || 'application/octet-stream'};base64,${base64}`);
                    } else {
                        reject(new FileConversionError('FileReader did not return an ArrayBuffer for Blob to Data URL conversion.'));
                    }
                } catch (error) {
                    reject(new FileConversionError('Failed to encode ArrayBuffer to Base64 for Data URL conversion.', error));
                }
            };
            reader.onerror = (error) => reject(new FileConversionError('FileReader encountered an error during Blob to Data URL conversion.', (error.target as FileReader).error));
            reader.readAsArrayBuffer(blob);
        } catch (error) {
            reject(new FileConversionError('Failed to initiate Blob to Data URL conversion.', error));
        }
    });
};

/**
 * Converts a File object to a Data URL string.
 * This function is an alias for `blobToDataURL`, leveraging the fact that `File` extends `Blob`.
 * @param file The File object to convert.
 * @returns A promise that resolves with the Data URL string.
 * @throws {FileConversionError} If the File is invalid or conversion fails.
 */
export const fileToDataURL = (file: File): Promise<string> => {
    try {
        if (!(file instanceof File)) {
            throw new TypeError('Input must be a valid File object.');
        }
        return blobToDataURL(file);
    } catch (error) {
        return Promise.reject(new FileConversionError('Failed to initiate File to Data URL conversion.', error));
    }
};

/**
 * Converts a Blob object to a plain text string using UTF-8 encoding by default.
 * This is ideal for reading text-based files (like `.txt`, `.csv`, `.json`) from a Blob.
 * @param blob The Blob object to convert.
 * @returns A Promise that resolves with the text content.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails.
 */
export const blobToText = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            if (!(blob instanceof Blob)) {
                throw new TypeError('Input must be a valid Blob object.');
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new FileConversionError('FileReader did not return a string for Blob to Text conversion.'));
                }
            };
            reader.onerror = (error) => reject(new FileConversionError('FileReader encountered an error during Blob to Text conversion.', (error.target as FileReader).error));
            reader.readAsText(blob);
        } catch (error) {
            reject(new FileConversionError('Failed to initiate Blob to Text conversion.', error));
        }
    });
};

/**
 * Converts a File object to a plain text string using UTF-8 encoding.
 * This function is an alias for `blobToText`, simplifying file-to-text operations for `File` objects.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the text content.
 * @throws {FileConversionError} If the File is invalid or conversion fails.
 */
export const fileToText = (file: File): Promise<string> => {
    try {
        if (!(file instanceof File)) {
            throw new TypeError('Input must be a valid File object.');
        }
        return blobToText(file);
    } catch (error) {
        return Promise.reject(new FileConversionError('Failed to initiate File to Text conversion.', error));
    }
};

/**
 * Converts a Blob object to a JavaScript object by parsing its content as JSON.
 * This is crucial for handling JSON files loaded via file inputs or fetched as Blobs.
 * @param blob The Blob object expected to contain valid JSON data.
 * @returns A Promise that resolves with the parsed JavaScript object.
 * @throws {FileConversionError} If the Blob is invalid, its content is not valid JSON, or conversion fails.
 */
export const blobToJson = async <T = unknown>(blob: Blob): Promise<T> => {
    try {
        if (!(blob instanceof Blob)) {
            throw new TypeError('Input must be a valid Blob object.');
        }
        const textContent = await blobToText(blob);
        return JSON.parse(textContent) as T;
    } catch (error) {
        throw new FileConversionError('Failed to convert Blob to JSON. Ensure content is valid JSON.', error);
    }
};

/**
 * Converts a File object to a JavaScript object by parsing its content as JSON.
 * This function serves as an alias for `blobToJson`, streamlining the process for `File` objects.
 * @param file The File object expected to contain valid JSON data.
 * @returns A Promise that resolves with the parsed JavaScript object.
 * @throws {FileConversionError} If the File is invalid, its content is not valid JSON, or conversion fails.
 */
export const fileToJson = async <T = unknown>(file: File): Promise<T> => {
    try {
        if (!(file instanceof File)) {
            throw new TypeError('Input must be a valid File object.');
        }
        return await blobToJson<T>(file);
    } catch (error) {
        throw new FileConversionError('Failed to convert File to JSON. Ensure content is valid JSON.', error);
    }
};

/**
 * Converts a plain string to an ArrayBuffer using the specified encoding (UTF-8 by default).
 * This is fundamental for preparing string data for binary operations, network transmission, or storage.
 * @param text The string to convert.
 * @param encoding The character encoding to use (e.g., 'utf-8', 'iso-8859-1'). Defaults to 'utf-8'.
 * @returns The ArrayBuffer representation of the string.
 * @throws {FileConversionError} If the input is not a string or if the encoding fails.
 */
export const textToArrayBuffer = (text: string, encoding: string = 'utf-8'): ArrayBuffer => {
    try {
        if (typeof text !== 'string') {
            throw new TypeError('Input must be a string.');
        }
        const encoder = new TextEncoder(encoding);
        return encoder.encode(text).buffer;
    } catch (error) {
        throw new FileConversionError(`Failed to convert text to ArrayBuffer with encoding '${encoding}'.`, error);
    }
};

/**
 * Converts an ArrayBuffer back to a string using the specified decoding (UTF-8 by default).
 * This is the inverse of `textToArrayBuffer`, enabling interpretation of binary data as text.
 * @param buffer The ArrayBuffer to convert.
 * @param encoding The character encoding to use (e.g., 'utf-8', 'iso-8859-1'). Defaults to 'utf-8'.
 * @returns The decoded string.
 * @throws {FileConversionError} If the input is not a valid ArrayBuffer or decoding fails.
 */
export const arrayBufferToText = (buffer: ArrayBuffer, encoding: string = 'utf-8'): string => {
    try {
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
            throw new TypeError('Input must be a valid ArrayBuffer.');
        }
        const decoder = new TextDecoder(encoding);
        return decoder.decode(buffer);
    } catch (error) {
        throw new FileConversionError(`Failed to convert ArrayBuffer to text with encoding '${encoding}'.`, error);
    }
};

/**
 * Creates a Blob object from a given string content.
 * This is useful for dynamically generating text-based files in the browser (e.g., CSV, JSON, TXT).
 * @param text The string content.
 * @param mimeType The MIME type of the Blob. Defaults to 'text/plain'.
 * @returns A Blob object containing the string data.
 * @throws {FileUtilityError} If the input is not a string or if Blob creation fails.
 */
export const textToBlob = (text: string, mimeType: string = 'text/plain'): Blob => {
    try {
        if (typeof text !== 'string') {
            throw new TypeError('Input must be a string.');
        }
        return new Blob([text], { type: mimeType });
    } catch (error) {
        throw new FileUtilityError('Failed to create Blob from text.', error);
    }
};

/**
 * Creates a Blob object from a JavaScript object by first stringifying it to JSON.
 * This is ideal for generating JSON files on the client-side for download or further processing.
 * @param data The JavaScript object to stringify and convert.
 * @param mimeType The MIME type of the Blob. Defaults to 'application/json'.
 * @returns A Blob object containing the JSON string.
 * @throws {FileUtilityError} If the input is not a valid object or if Blob creation or JSON stringification fails.
 */
export const jsonToBlob = (data: object, mimeType: string = 'application/json'): Blob => {
    try {
        if (typeof data !== 'object' || data === null) {
            throw new TypeError('Input must be a non-null object.');
        }
        const jsonString = JSON.stringify(data, null, 2); // Pretty-print JSON
        return new Blob([jsonString], { type: mimeType });
    } catch (error) {
        throw new FileUtilityError('Failed to create Blob from JSON object.', error);
    }
};

/**
 * Creates a File object from a string content.
 * In a browser environment, true `File` objects are typically obtained from user input.
 * This function *simulates* a File object by creating a `Blob` and then constructing a `File` with additional metadata like `name` and `lastModified`.
 * It's useful for creating `File`-like objects programmatically for APIs that specifically expect `File` (though many accept `Blob`).
 * @param content The string content for the file.
 * @param filename The desired filename for the created File object.
 * @param mimeType The MIME type of the file. Defaults to 'text/plain'.
 * @param lastModified Optional timestamp (milliseconds since epoch) for `lastModified`. Defaults to `Date.now()`.
 * @returns A simulated File object.
 * @throws {FileUtilityError} If validation fails or the File object cannot be created.
 */
export const createFileFromString = (
    content: string,
    filename: string,
    mimeType: string = 'text/plain',
    lastModified: number = Date.now()
): File => {
    try {
        if (typeof content !== 'string') {
            throw new TypeError('Content must be a string.');
        }
        if (typeof filename !== 'string' || !filename) {
            throw new TypeError('Filename must be a non-empty string.');
        }
        const blob = new Blob([content], { type: mimeType });
        return new File([blob], filename, { type: mimeType, lastModified });
    } catch (error) {
        throw new FileUtilityError('Failed to create File object from string.', error);
    }
};

/**
 * Creates a File object from an existing Blob.
 * Similar to `createFileFromString`, this wraps a `Blob` in a `File` object, assigning it a name and last modified date.
 * This is useful for APIs that require a `File` object but you only have a `Blob`.
 * @param blob The Blob object to wrap.
 * @param filename The desired filename for the created File object.
 * @param lastModified Optional timestamp for `lastModified`. Defaults to `Date.now()`.
 * @returns A simulated File object.
 * @throws {FileUtilityError} If validation fails or the File object cannot be created.
 */
export const createFileFromBlob = (
    blob: Blob,
    filename: string,
    lastModified: number = Date.now()
): File => {
    try {
        if (!(blob instanceof Blob)) {
            throw new TypeError('Input must be a valid Blob object.');
        }
        if (typeof filename !== 'string' || !filename) {
            throw new TypeError('Filename must be a non-empty string.');
        }
        // The File constructor expects an array of Blob parts.
        return new File([blob], filename, { type: blob.type, lastModified });
    } catch (error) {
        throw new FileUtilityError('Failed to create File object from Blob.', error);
    }
};

/**
 * Triggers a browser download for the given Blob.
 * This is a foundational download utility, enabling client-side generation and download of binary or text data.
 * @param blob The Blob object to download.
 * @param filename The name of the file that will be suggested to the user.
 * @param options Optional download configurations, including MIME type, URL revocation, and callbacks.
 * @returns A Promise that resolves when the download is triggered (after a small delay for browser processing), or rejects on error.
 * @throws {FileDownloadError} If the download mechanism fails (e.g., invalid Blob, DOM manipulation issues).
 */
export const downloadBlob = async (
    blob: Blob,
    filename: string,
    options?: DownloadOptions
): Promise<void> => {
    try {
        if (!(blob instanceof Blob)) {
            throw new TypeError('Input must be a valid Blob object.');
        }
        if (typeof filename !== 'string' || !filename) {
            throw new TypeError('Filename must be a non-empty string.');
        }

        // Apply default options and merge with provided ones.
        const effectiveOptions: Required<DownloadOptions> = {
            mimeType: options?.mimeType || blob.type || 'application/octet-stream',
            revokeObjectUrl: options?.revokeObjectUrl ?? true,
            anchorElement: options?.anchorElement || document.createElement('a'),
            onDownloadStart: options?.onDownloadStart || (() => {}),
            onDownloadError: options?.onDownloadError || ((err) => { console.error('Download error:', err); }),
        };

        const url = URL.createObjectURL(blob);
        const a = effectiveOptions.anchorElement;

        a.href = url;
        a.download = filename;
        a.style.display = 'none'; // Hide the element to prevent visual disruption
        document.body.appendChild(a); // Append to body to make it clickable

        effectiveOptions.onDownloadStart(); // Execute pre-download callback
        a.click(); // Programmatically click the link to trigger download

        // Provide a small delay to ensure the browser registers the click and starts the download
        // before potentially revoking the URL or removing the element, which can cause issues on some browsers.
        await new Promise(resolve => setTimeout(resolve, 100));

        if (effectiveOptions.revokeObjectUrl) {
            URL.revokeObjectURL(url); // Clean up the object URL to free memory
        }
        document.body.removeChild(a); // Remove the temporary anchor element

    } catch (error) {
        const downloadError = new FileDownloadError(`Failed to trigger download for file "${filename}".`, error);
        options?.onDownloadError?.(downloadError); // Notify through callback if provided
        throw downloadError; // Re-throw for promise chain rejection
    }
};

/**
 * Triggers a browser download for the given ArrayBuffer.
 * This converts the ArrayBuffer to a Blob internally before initiating the download.
 * @param buffer The ArrayBuffer content to download.
 * @param filename The name of the file.
 * @param options Optional download configurations, including `mimeType`.
 * @returns A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the input is invalid, or the download mechanism fails.
 */
export const downloadArrayBuffer = async (
    buffer: ArrayBuffer,
    filename: string,
    options?: DownloadOptions
): Promise<void> => {
    try {
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
            throw new TypeError('Input must be a valid ArrayBuffer.');
        }
        const blob = new Blob([buffer], { type: options?.mimeType || 'application/octet-stream' });
        await downloadBlob(blob, filename, options);
    } catch (error) {
        throw new FileDownloadError(`Failed to trigger download for ArrayBuffer "${filename}".`, error);
    }
};

/**
 * Triggers a browser download for the given string content.
 * Internally converts the string to a Blob with the specified MIME type.
 * @param content The string content to download.
 * @param filename The name of the file.
 * @param options Optional download configurations, including `mimeType` (defaults to 'text/plain').
 * @returns A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the input is invalid or the download mechanism fails.
 */
export const downloadTextFile = async (
    content: string,
    filename: string,
    options?: DownloadOptions
): Promise<void> => {
    try {
        if (typeof content !== 'string') {
            throw new TypeError('Content must be a string.');
        }
        const blob = new Blob([content], { type: options?.mimeType || 'text/plain' });
        // Ensure explicit mimeType for text if not already provided
        await downloadBlob(blob, filename, { ...options, mimeType: options?.mimeType || 'text/plain' });
    } catch (error) {
        throw new FileDownloadError(`Failed to trigger text file download for "${filename}".`, error);
    }
};

/**
 * Triggers a browser download for a Data URL string.
 * This utility first converts the Data URL back into a Blob and then downloads it.
 * @param dataUrl The Data URL string to download.
 * @param filename The name of the file. If not provided, it attempts to infer from the Data URL or defaults to a generic name.
 * @param options Optional download configurations.
 * @returns A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the Data URL is invalid, parsing fails, or the download mechanism encounters an error.
 */
export const downloadDataURL = async (
    dataUrl: string,
    filename?: string,
    options?: DownloadOptions
): Promise<void> => {
    try {
        if (typeof dataUrl !== 'string' || !dataUrl) {
            throw new TypeError('Data URL must be a non-empty string.');
        }
        const blob = await dataURLToBlob(dataUrl); // Convert Data URL to Blob
        const inferredMimeType = extractMimeTypeFromDataURL(dataUrl);
        // Generate a filename if not provided, using inferred type or a generic binary extension
        const finalFilename = filename || `download-${Date.now()}.${getFileExtensionFromMimeType(inferredMimeType) || 'bin'}`;

        await downloadBlob(blob, finalFilename, { ...options, mimeType: inferredMimeType });
    } catch (error) {
        throw new FileDownloadError(`Failed to trigger Data URL download for "${filename || 'unknown'}".`, error);
    }
};

/**
 * Triggers a browser download for generic content (string, ArrayBuffer, or Blob).
 * This provides a unified, type-safe interface for downloading various content types without needing to choose specific `download*` functions.
 * @param content The content to download (can be a string, ArrayBuffer, or Blob).
 * @param filename The name of the file.
 * @param options Optional download configurations.
 * @returns A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the content type is unsupported or the download fails.
 */
export const downloadContent = async (
    content: string | ArrayBuffer | Blob,
    filename: string,
    options?: DownloadOptions
): Promise<void> => {
    if (typeof content === 'string') {
        await downloadTextFile(content, filename, options);
    } else if (content instanceof ArrayBuffer) {
        await downloadArrayBuffer(content, filename, options);
    } else if (content instanceof Blob) {
        await downloadBlob(content, filename, options);
    } else {
        throw new FileDownloadError('Unsupported content type for download. Must be string, ArrayBuffer, or Blob.');
    }
};

/**
 * Triggers a browser download for a JSON file.
 * This utility stringifies a JavaScript object to JSON format and then downloads it as a file.
 * @param data The JavaScript object to stringify and download.
 * @param filename The name of the file. Defaults to `data.json`.
 * @param options Optional download configurations.
 * @returns A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If JSON stringification or the download process fails.
 */
export const downloadJson = async (
    data: object,
    filename: string = 'data.json',
    options?: DownloadOptions
): Promise<void> => {
    try {
        if (typeof data !== 'object' || data === null) {
            throw new TypeError('Input must be a non-null object.');
        }
        const content = JSON.stringify(data, null, 2); // Pretty-print JSON
        await downloadTextFile(content, filename, { ...options, mimeType: 'application/json' });
    } catch (error) {
        throw new FileDownloadError(`Failed to download JSON file "${filename}".`, error);
    }
};

/**
 * Generates and triggers a download for a `.env` formatted file.
 * This is useful for exporting environment variables from a client-side application or configuration editor.
 * @param env A record of key-value pairs representing environment variables. Values are JSON.stringify-ed to handle complex types correctly.
 * @param filename The name of the `.env` file. Defaults to '.env'.
 * @param options Optional download configurations.
 * @returns A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If environment variable processing or the download fails.
 */
export const downloadEnvFile = async (
    env: Record<string, string>,
    filename: string = '.env',
    options?: DownloadOptions
): Promise<void> => {
    try {
        if (typeof env !== 'object' || env === null) {
            throw new TypeError('Input must be a non-null object.');
        }
        const content = Object.entries(env)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`) // JSON.stringify for robust value handling
            .join('\n');
        await downloadTextFile(content, filename, { ...options, mimeType: 'text/plain' });
    } catch (error) {
        throw new FileDownloadError(`Failed to download .env file "${filename}".`, error);
    }
};

/**
 * Triggers a browser download for the given content.
 * @param content The string content to download.
 * @param filename The name of the file.
 * @param mimeType The MIME type of the file. Defaults to 'text/plain'.
 * @returns A Promise that resolves when the download is triggered.
 * @deprecated This function is superseded by `downloadTextFile` and `downloadContent` for improved error handling and type flexibility.
 *             It is maintained for backward compatibility, internally using the more robust `downloadTextFile`.
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): Promise<void> => {
    return downloadTextFile(content, filename, { mimeType }).catch(error => {
        console.error('Legacy downloadFile failed and threw an error:', error);
        throw error; // Re-throw to maintain original function's implicit error propagation
    });
};


/**
 * Attempts to guess the common file extension based on a MIME type.
 * This is not exhaustive but covers a wide range of common cases, useful for suggesting filenames.
 * @param mimeType The MIME type string (e.g., 'image/png', 'application/json').
 * @returns The common file extension (e.g., 'png', 'json'), or `null` if no match is found.
 */
export const getFileExtensionFromMimeType = (mimeType: string): string | null => {
    if (typeof mimeType !== 'string' || !mimeType) {
        return null;
    }
    const type = mimeType.toLowerCase().trim();
    switch (type) {
        case 'text/plain': return 'txt';
        case 'text/html': return 'html';
        case 'text/css': return 'css';
        case 'text/javascript': case 'application/javascript': return 'js';
        case 'application/json': return 'json';
        case 'application/xml': case 'text/xml': return 'xml';
        case 'application/pdf': return 'pdf';
        case 'application/zip': return 'zip';
        case 'application/gzip': case 'application/x-gzip': return 'gz';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'xlsx';
        case 'application/vnd.ms-excel': return 'xls';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'docx';
        case 'application/msword': return 'doc';
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return 'pptx';
        case 'application/vnd.ms-powerpoint': return 'ppt';
        case 'image/jpeg': return 'jpg';
        case 'image/png': return 'png';
        case 'image/gif': return 'gif';
        case 'image/bmp': return 'bmp';
        case 'image/webp': return 'webp';
        case 'image/svg+xml': return 'svg';
        case 'image/tiff': return 'tiff';
        case 'audio/mpeg': return 'mp3';
        case 'audio/wav': case 'audio/x-wav': return 'wav';
        case 'video/mp4': return 'mp4';
        case 'video/webm': return 'webm';
        case 'font/ttf': return 'ttf';
        case 'font/otf': return 'otf';
        case 'font/woff': return 'woff';
        case 'font/woff2': return 'woff2';
        default: {
            const parts = type.split('/');
            if (parts.length === 2) {
                // Handle types like application/vnd.api+json -> json or image/x-icon -> ico
                if (parts[1].includes('+')) {
                    const subType = parts[1].split('+')[1];
                    if (subType === 'json') return 'json';
                    if (subType === 'xml') return 'xml';
                    if (subType === 'svg') return 'svg';
                }
                // Fallback for types like 'image/tiff' -> 'tiff' (if not explicitly handled above)
                // or 'application/octet-stream' for generic binary (returns 'octet-stream' which might not be desired)
                return parts[1].replace(/^(x-|vnd\.)/, ''); // Remove common prefixes
            }
            return null;
        }
    }
};

/**
 * Extracts the file extension from a given filename string.
 * This is useful for file categorization, icon selection, or MIME type inference.
 * @param filename The full filename (e.g., 'document.pdf', 'archive.tar.gz', 'photo').
 * @returns The file extension (e.g., 'pdf', 'gz'), or an empty string if no extension is found or the filename is invalid.
 * @throws {FileUtilityError} If the filename is not a valid string.
 */
export const getFileExtension = (filename: string): string => {
    try {
        if (typeof filename !== 'string' || !filename) {
            throw new TypeError('Filename must be a non-empty string.');
        }
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === 0) { // No dot, or starts with a dot (e.g., ".bashrc")
            return '';
        }
        return filename.substring(lastDotIndex + 1);
    } catch (error) {
        throw new FileUtilityError('Failed to get file extension.', error);
    }
};

/**
 * Extracts the filename without its extension.
 * This is helpful for displaying clean titles or generating new filenames.
 * @param filename The full filename (e.g., 'report.2023.pdf', 'image.jpg').
 * @returns The filename part without the extension (e.g., 'report.2023', 'image').
 * @throws {FileUtilityError} If the filename is not a valid string.
 */
export const getFilenameWithoutExtension = (filename: string): string => {
    try {
        if (typeof filename !== 'string' || !filename) {
            throw new TypeError('Filename must be a non-empty string.');
        }
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return filename; // No extension, return original filename
        }
        return filename.substring(0, lastDotIndex);
    } catch (error) {
        throw new FileUtilityError('Failed to get filename without extension.', error);
    }
};

/**
 * Sanitizes a string to be a safe and compatible filename across various operating systems.
 * This function removes or replaces characters that are typically invalid or problematic in filenames.
 * @param name The original string to sanitize.
 * @param replacement The character to replace invalid characters with. Defaults to '_'.
 * @returns A sanitized filename string. Returns 'untitled' if sanitization results in an empty string.
 * @throws {FileUtilityError} If the input name is not a string.
 */
export const sanitizeFilename = (name: string, replacement: string = '_'): string => {
    try {
        if (typeof name !== 'string') {
            throw new TypeError('Input must be a string.');
        }
        // Regex to replace characters generally forbidden in Windows/Unix filenames,
        // and control characters (U+0000-U+001F).
        // Common forbidden: / ? < > \ : * | " ^ $
        let sanitized = name
            .replace(/[/?<>\\:*|"^$\u0000-\u001F]/g, replacement)
            .replace(/\s/g, '-') // Replace spaces with hyphens for better URL/CLI compatibility
            .replace(/^(-|_)+|(-|_)+$/g, '') // Remove leading/trailing hyphens/underscores
            .replace(/\.+$/g, '',) // Remove trailing dots, which can be problematic on Windows
            .trim(); // Trim whitespace from ends

        if (!sanitized) {
            return 'untitled'; // Fallback if sanitization yields an empty string
        }

        // Handle specific Windows reserved names to prevent issues (e.g., CON, PRN, AUX, NUL, COM1-9, LPT1-9)
        const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
        if (reservedNames.test(sanitized)) {
            sanitized = `${sanitized}${replacement}file`;
        }

        return sanitized;
    } catch (error) {
        throw new FileUtilityError('Failed to sanitize filename.', error);
    }
};

/**
 * Formats a file size in bytes into a human-readable string (e.g., "1.2 MB", "500 KB", "3.4 GB").
 * @param bytes The size of the file in bytes.
 * @param decimals The number of decimal places to include in the formatted size. Defaults to 2.
 * @returns A human-readable file size string.
 * @throws {FileUtilityError} If the input `bytes` is not a valid non-negative number.
 */
export const getHumanReadableFileSize = (bytes: number, decimals: number = 2): string => {
    try {
        if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
            throw new TypeError('Bytes must be a non-negative number.');
        }
        if (bytes === 0) return '0 Bytes';

        const k = 1024; // Kilobyte equivalent
        const dm = decimals < 0 ? 0 : decimals; // Ensure decimals is non-negative
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k)); // Calculate the appropriate size unit index

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    } catch (error) {
        throw new FileUtilityError('Failed to format file size.', error);
    }
};

/**
 * Calculates the SHA-256 hash of a Blob or File object.
 * This utility uses the Web Crypto API (`crypto.subtle`) for secure and efficient hashing,
 * making it suitable for verifying file integrity or uniqueness on the client-side.
 * Since cryptographic operations are asynchronous, this function returns a Promise.
 * @param fileLike The Blob or File object for which to calculate the hash.
 * @returns A Promise that resolves with the SHA-256 hash as a hexadecimal string.
 * @throws {FileUtilityError} If the Web Crypto API is unavailable, the input is invalid, or hashing fails.
 */
export const calculateFileSha256 = async (fileLike: FileLike): Promise<string> => {
    try {
        if (!fileLike || (!(fileLike instanceof Blob) && !(fileLike instanceof File))) {
            throw new TypeError('Input must be a valid Blob or File object.');
        }
        if (!crypto || !crypto.subtle) {
            throw new Error('Web Crypto API (crypto.subtle) is not available in this environment. Cannot calculate SHA-256 hash.');
        }

        // Read the file/blob content into an ArrayBuffer
        const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = (error) => reject(new FileUtilityError('FileReader error during hash calculation.', (error.target as FileReader).error));
            reader.readAsArrayBuffer(fileLike);
        });

        // Compute the SHA-256 hash using the Web Crypto API
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        // Convert the ArrayBuffer hash to a hexadecimal string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hexHash;
    } catch (error) {
        throw new FileUtilityError('Failed to calculate SHA-256 hash of file.', error);
    }
};

/**
 * Reads a Blob or File object in chunks, providing callbacks for progress and individual chunks.
 * This is an advanced utility crucial for efficiently processing very large files in the browser
 * without loading their entire content into memory, preventing memory exhaustion.
 * @param fileLike The Blob or File object to read in chunks.
 * @param options Configuration for reading chunks, including `chunkSize`, `onProgress`, and `onChunk` callbacks.
 * @returns A Promise that resolves when all chunks have been processed or `onChunk` returns `false`, or rejects on error.
 * @throws {FileUtilityError} If the input is invalid, or if any FileReader or callback operation fails.
 */
export const readBlobInChunks = async (
    fileLike: FileLike,
    options: ReadChunkOptions = {}
): Promise<void> => {
    try {
        if (!fileLike || (!(fileLike instanceof Blob) && !(fileLike instanceof File))) {
            throw new TypeError('Input must be a valid Blob or File object.');
        }

        const { chunkSize = 1024 * 1024, onProgress, onChunk } = options;
        const fileSize = fileLike.size;
        let offset = 0;
        let chunkIndex = 0;
        const totalChunks = Math.ceil(fileSize / chunkSize);

        while (offset < fileSize) {
            const end = Math.min(offset + chunkSize, fileSize);
            const slice = fileLike.slice(offset, end); // Extract a slice (chunk) of the Blob

            // Read the current chunk into an ArrayBuffer
            const chunkData = await new Promise<ArrayBuffer>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as ArrayBuffer);
                reader.onerror = (error) => reject(new FileUtilityError(`FileReader error reading chunk at offset ${offset}.`, (error.target as FileReader).error));
                reader.readAsArrayBuffer(slice);
            });

            const currentChunk: FileChunk = {
                data: chunkData,
                start: offset,
                end: end,
                totalSize: fileSize,
                chunkIndex: chunkIndex,
                totalChunks: totalChunks,
            };

            if (onChunk) {
                // Execute the onChunk callback and await its result if it's a Promise
                const result = await Promise.resolve(onChunk(currentChunk));
                if (result === false) {
                    console.warn(`Chunk processing stopped by callback at chunk ${chunkIndex}.`);
                    return; // Exit the loop if the callback requests to stop
                }
            }

            offset = end;
            chunkIndex++;
            onProgress?.(offset, fileSize); // Report progress
        }
    } catch (error) {
        throw new FileUtilityError('Failed to read blob in chunks.', error);
    }
};

/**
 * Uploads a file to a specified URL using a `FormData` POST request.
 * This is the standard and most robust method for sending files from a web client to a server.
 * It supports progress tracking and additional form data.
 * @param file The File object to upload.
 * @param uploadUrl The URL endpoint where the file should be uploaded.
 * @param fieldName The name of the form field that will contain the file (e.g., 'file', 'attachment'). Defaults to 'file'.
 * @param additionalFields Optional record of extra form data fields (key-value pairs) to send along with the file.
 * @param onProgress Callback function for tracking upload progress, receives a `ProgressEvent`.
 * @returns A Promise that resolves with the server's response text upon successful upload.
 * @throws {FileUtilityError} If the input is invalid, a network error occurs, or the server responds with an error status.
 */
export const uploadFileViaForm = async (
    file: File,
    uploadUrl: string,
    fieldName: string = 'file',
    additionalFields: Record<string, string> = {},
    onProgress?: (event: ProgressEvent) => void
): Promise<string> => {
    try {
        if (!(file instanceof File)) {
            throw new TypeError('Input must be a valid File object.');
        }
        if (typeof uploadUrl !== 'string' || !uploadUrl) {
            throw new TypeError('Upload URL must be a non-empty string.');
        }

        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append(fieldName, file, file.name); // Append the file with its original name

            // Append any additional key-value pairs
            for (const key in additionalFields) {
                if (Object.prototype.hasOwnProperty.call(additionalFields, key)) {
                    formData.append(key, additionalFields[key]);
                }
            }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', uploadUrl, true); // Use POST method and asynchronous request

            // Attach progress event listener if provided
            if (onProgress) {
                xhr.upload.onprogress = onProgress;
            }

            // Handle successful response
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.responseText);
                } else {
                    // Treat non-2xx statuses as errors
                    reject(new FileUtilityError(`Upload failed with status ${xhr.status}: ${xhr.statusText}`, xhr.responseText));
                }
            };

            // Handle network errors
            xhr.onerror = (err) => {
                reject(new FileUtilityError('Network error during file upload.', err));
            };

            // Handle abort events
            xhr.onabort = () => {
                reject(new FileUtilityError('File upload was aborted by the user or system.'));
            };

            xhr.send(formData); // Send the FormData object
        });
    } catch (error) {
        throw new FileUtilityError('Failed to initiate file upload.', error);
    }
};

/**
 * Generates a revocable URL for an `object` or `iframe` element to display a Blob or File.
 * This is highly useful for creating in-browser previews of documents, images, or other media
 * without requiring them to be downloaded or converted to Data URLs.
 * IMPORTANT: Remember to call `URL.revokeObjectURL()` on the returned URL when it is no longer needed
 * to prevent memory leaks, especially when dealing with many previews.
 * @param fileLike The Blob or File object to preview.
 * @returns A URL string (e.g., 'blob:http://example.com/some-uuid').
 * @throws {FileUtilityError} If the input is invalid.
 */
export const createObjectURLForPreview = (fileLike: FileLike): string => {
    try {
        if (!fileLike || (!(fileLike instanceof Blob) && !(fileLike instanceof File))) {
            throw new TypeError('Input must be a valid Blob or File object.');
        }
        return URL.createObjectURL(fileLike);
    } catch (error) {
        throw new FileUtilityError('Failed to create object URL for preview.', error);
    }
};

/**
 * Revokes an object URL previously created by `URL.createObjectURL()`.
 * This is a critical memory management step. When an object URL is no longer used (e.g., a preview is closed),
 * revoking it frees up the associated memory in the browser.
 * Failing to revoke URLs can lead to significant memory leaks, especially in applications that generate many previews.
 * @param objectUrl The URL string to revoke (e.g., 'blob:http://example.com/some-uuid').
 */
export const revokeObjectURL = (objectUrl: string): void => {
    try {
        if (typeof objectUrl !== 'string' || !objectUrl) {
            console.warn('Attempted to revoke an invalid or empty object URL. This might indicate an issue, but is not fatal:', objectUrl);
            return; // Silently ignore invalid URLs during cleanup to avoid crashing
        }
        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        console.error('Error revoking object URL:', objectUrl, error);
        // Do not throw from a cleanup function, as it might prevent other cleanups.
    }
};

/**
 * Simulates a click on a hidden file input element, programmatically triggering the native file selection dialog.
 * This function provides a robust way to open the file selection dialog without needing a visible `<input type="file">` element.
 * Browser security prevents directly setting selected files or opening dialogs without user interaction, but this method mimics it.
 * @param accept Optional string specifying accepted file types (e.g., 'image/*', '.pdf', 'image/png,image/jpeg').
 * @param multiple Whether to allow the user to select multiple files. Defaults to `false`.
 * @returns A Promise that resolves with a `FileList` object containing the selected files, or `null` if the user cancels the dialog.
 * @throws {FileUtilityError} If DOM manipulation fails during the creation or cleanup of the input element.
 */
export const selectFileFromInput = (accept: string = '', multiple: boolean = false): Promise<FileList | null> => {
    return new Promise((resolve, reject) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.style.display = 'none'; // Keep the input element hidden
            input.accept = accept;
            input.multiple = multiple;

            // Event listener for when files are selected
            input.onchange = (event: Event) => {
                const files = (event.target as HTMLInputElement).files;
                document.body.removeChild(input); // Clean up the temporary input element
                resolve(files);
            };

            // Heuristic for detecting cancellation on some browsers where 'change' might not fire with null files
            const onFocusBack = () => {
                // Wait briefly, then check if input is still in DOM and no files were selected
                setTimeout(() => {
                    if (input.parentNode && (!input.files || input.files.length === 0)) {
                        document.body.removeChild(input);
                        resolve(null); // Resolve with null for cancellation
                    }
                }, 500); // Small delay to allow browser to process file selection (or lack thereof)
                window.removeEventListener('focus', onFocusBack); // Remove listener after check
            };
            window.addEventListener('focus', onFocusBack); // Add listener for window regaining focus

            document.body.appendChild(input); // Temporarily add to DOM to allow click
            input.click(); // Programmatically click to open file dialog
        } catch (error) {
            reject(new FileUtilityError('Failed to trigger file selection input.', error));
        }
    });
};

/**
 * Resizes an image provided as a Data URL and returns it as a Blob.
 * This is an advanced client-side image manipulation utility, leveraging the Canvas API
 * to efficiently scale images down before upload or display, saving bandwidth and memory.
 * @param imageUrl The Data URL of the source image (e.g., `data:image/jpeg;base64,...`).
 * @param maxWidth The maximum desired width for the resized image. If 0, width is not constrained.
 * @param maxHeight The maximum desired height for the resized image. If 0, height is not constrained.
 * @param quality The image quality for lossy formats (JPEG, WebP) from 0 to 1. Defaults to 0.9.
 * @param outputMimeType The desired output MIME type (e.g., 'image/jpeg', 'image/png', 'image/webp'). If not specified, the original MIME type is preserved.
 * @returns A Promise that resolves with the resized Blob.
 * @throws {FileUtilityError} If image loading, canvas operations, or Blob conversion fails.
 */
export const resizeImageBlob = async (
    imageUrl: string,
    maxWidth: number = 0,
    maxHeight: number = 0,
    quality: number = 0.9,
    outputMimeType?: string
): Promise<Blob> => {
    try {
        if (typeof imageUrl !== 'string' || !imageUrl) {
            throw new TypeError('Image URL must be a non-empty string (Data URL expected).');
        }

        const img = new Image();
        img.src = imageUrl;

        // Load the image asynchronously
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (event) => reject(
                new FileUtilityError('Failed to load image for resizing.', event)
            );
        });

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (maxWidth > 0 && width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
        }

        if (maxHeight > 0 && height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D rendering context for canvas. Browser might not support it.');
        }

        ctx.drawImage(img, 0, 0, width, height); // Draw the resized image onto the canvas

        const finalMimeType = outputMimeType || extractMimeTypeFromDataURL(imageUrl);

        // Convert canvas content to Blob
        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new FileConversionError('Canvas to Blob conversion failed during image resizing.'));
                }
            }, finalMimeType, quality); // Specify output MIME type and quality
        });
    } catch (error) {
        throw new FileUtilityError('Error during image resizing and Blob creation.', error);
    }
};

/**
 * Converts a Blob to a new Blob of a different MIME type. This is particularly effective for image format conversions
 * (e.g., PNG to JPEG, WebP to PNG) by utilizing the Canvas API. For non-image types, it attempts a direct Blob copy with a new MIME type.
 * @param sourceBlob The original Blob to convert.
 * @param targetMimeType The desired output MIME type for the new Blob.
 * @param quality For image conversions, the quality setting (0 to 1) for lossy formats like JPEG/WebP. Defaults to 0.9.
 * @returns A Promise that resolves with the converted Blob.
 * @throws {FileConversionError} If the input is invalid, or if the conversion process fails (e.g., unsupported conversion).
 */
export const convertBlobMimeType = async (
    sourceBlob: Blob,
    targetMimeType: string,
    quality: number = 0.9
): Promise<Blob> => {
    try {
        if (!(sourceBlob instanceof Blob)) {
            throw new TypeError('Source input must be a valid Blob object.');
        }
        if (typeof targetMimeType !== 'string' || !targetMimeType) {
            throw new TypeError('Target MIME type must be a non-empty string.');
        }

        if (sourceBlob.type === targetMimeType) {
            return sourceBlob; // No conversion needed, return original blob
        }

        // If both source and target are image types, use canvas for conversion
        if (sourceBlob.type.startsWith('image/') && targetMimeType.startsWith('image/')) {
            const dataUrl = await blobToDataURL(sourceBlob);
            // Use resizeImageBlob with 0 dimensions to keep original size, just change type/quality
            return await resizeImageBlob(dataUrl, 0, 0, quality, targetMimeType);
        }

        // For non-image conversions, or if image types are incompatible for canvas,
        // create a new blob by reading the original as ArrayBuffer and re-wrapping with the new MIME type.
        // Note: This is a generic conversion; it might not re-encode content appropriately for all format changes.
        // For example, changing 'text/plain' to 'application/json' will just change the MIME type, not parse/validate JSON.
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = (error) => reject(new FileConversionError('FileReader error during generic Blob type conversion.', (error.target as FileReader).error));
            reader.readAsArrayBuffer(sourceBlob);
        });
        return new Blob([arrayBuffer], { type: targetMimeType });

    } catch (error) {
        throw new FileConversionError(`Failed to convert Blob from ${sourceBlob.type} to ${targetMimeType}.`, error);
    }
};

/**
 * Checks if a given string is likely a Base64 encoded string.
 * This performs a basic regex check for typical Base64 characters and length conformity.
 * It does *not* guarantee that the string can be successfully decoded or represents valid binary data,
 * but provides a quick preliminary check.
 * @param str The string to check.
 * @returns True if the string looks like Base64, false otherwise.
 */
export const isBase64String = (str: string): boolean => {
    if (typeof str !== 'string' || str.length === 0) {
        return false;
    }
    // Strict Base64 regex: allows A-Z, a-z, 0-9, +, /, and optional padding characters (=) at the end.
    // Length must be a multiple of 4 (after removing padding).
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(str)) {
        return false;
    }
    // Validate length: must be a multiple of 4, considering padding.
    const strippedStr = str.replace(/=/g, ''); // Remove padding for length check
    return strippedStr.length % 4 === 0;
};


/**
 * Checks if a given string is likely a Data URL.
 * This performs a basic check for the "data:" prefix and the comma separator.
 * It does not fully validate the Data URL's MIME type, encoding, or the Base64 data part itself,
 * but offers a quick way to identify Data URL patterns.
 * @param str The string to check.
 * @returns True if the string looks like a Data URL, false otherwise.
 */
export const isDataURL = (str: string): boolean => {
    if (typeof str !== 'string' || str.length === 0) {
        return false;
    }
    // Data URL format: "data:[<MIME-type>][;charset=<encoding>][;base64],<data>"
    return str.startsWith('data:') && str.includes(',');
};

/**
 * A robust client-side storage service for File and Blob objects using IndexedDB.
 * This class provides methods to persist, retrieve, delete, and list file-like objects
 * within the user's browser, effectively creating a "virtual file system" for web applications.
 * This is useful for offline capabilities, temporary storage, or managing large user-generated content.
 */
export class BrowserStorageFileService {
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null = null;
    private dbVersion: number = 1;

    /**
     * Initializes a new instance of the BrowserStorageFileService.
     * @param dbName The name of the IndexedDB database to use. Defaults to 'EnhancedFileUtilityDB'.
     * @param storeName The name of the object store within the database. Defaults to 'files'.
     */
    constructor(dbName: string = 'EnhancedFileUtilityDB', storeName: string = 'files') {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    /**
     * Internal method to initialize and open the IndexedDB connection.
     * Handles database upgrades if necessary (e.g., creating the object store).
     * @returns A Promise that resolves with the IDBDatabase instance when connected.
     * @throws {FileUtilityError} If IndexedDB fails to open or create the object store.
     */
    private async initDb(): Promise<IDBDatabase> {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                return reject(new FileUtilityError('IndexedDB is not supported in this browser.'));
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    // Create an object store with 'id' as the primary key.
                    // IndexedDB can store Blob/File objects directly.
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(new FileUtilityError('Failed to open IndexedDB for file storage.', (event.target as IDBRequest).error));
            };
        });
    }

    /**
     * Puts a File or Blob object into the IndexedDB store.
     * This method can be used to add new files or update existing ones (if the ID matches).
     * @param fileLike The File or Blob object to store.
     * @param id An optional unique ID for the file. If not provided, a UUID is generated.
     * @returns A Promise that resolves with the ID of the stored file.
     * @throws {FileUtilityError} If the input is invalid or the IndexedDB operation fails.
     */
    public async putFile(fileLike: FileLike, id: string = crypto.randomUUID()): Promise<string> {
        try {
            if (!fileLike || (!(fileLike instanceof Blob) && !(fileLike instanceof File))) {
                throw new TypeError('Input must be a valid Blob or File object.');
            }
            if (typeof id !== 'string' || !id) {
                throw new TypeError('ID must be a non-empty string.');
            }

            const db = await this.initDb();
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            // Store the file-like object along with its ID, name, and type.
            // IndexedDB handles direct storage of Blob/File objects efficiently.
            const fileRecord = {
                id: id,
                file: fileLike,
                name: (fileLike as File).name || id, // Prefer File.name if available
                type: fileLike.type || 'application/octet-stream',
                lastModified: (fileLike as File).lastModified || Date.now()
            };
            const request = store.put(fileRecord);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(id);
                request.onerror = (event) => reject(new FileUtilityError(`Failed to store file '${id}' in IndexedDB.`, (event.target as IDBRequest).error));
            });
        } catch (error) {
            throw new FileUtilityError(`Error putting file into storage with ID '${id}'.`, error);
        }
    }

    /**
     * Retrieves a File or Blob object from the IndexedDB store by its ID.
     * @param id The unique ID of the file to retrieve.
     * @returns A Promise that resolves with the FileLike object, or `null` if the file is not found.
     * @throws {FileUtilityError} If the ID is invalid or the IndexedDB operation fails.
     */
    public async getFile(id: string): Promise<FileLike | null> {
        try {
            if (typeof id !== 'string' || !id) {
                throw new TypeError('ID must be a non-empty string.');
            }

            const db = await this.initDb();
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);

            const request = store.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result;
                    if (result && result.file) {
                        // If the stored item has 'file', 'name', 'type', 'lastModified' properties,
                        // reconstruct a File object for consistent return type, otherwise return the raw Blob.
                        if (result.file instanceof File) {
                             resolve(result.file);
                        } else if (result.file instanceof Blob && result.name && result.type && result.lastModified) {
                            // Reconstruct File from stored Blob and metadata
                            resolve(new File([result.file], result.name, {type: result.type, lastModified: result.lastModified}));
                        } else {
                             resolve(result.file); // Fallback to raw Blob if minimal metadata
                        }
                    } else {
                        resolve(null); // File not found
                    }
                };
                request.onerror = (event) => reject(new FileUtilityError(`Failed to retrieve file '${id}' from IndexedDB.`, (event.target as IDBRequest).error));
            });
        } catch (error) {
            throw new FileUtilityError(`Error getting file from storage with ID '${id}'.`, error);
        }
    }

    /**
     * Deletes a file from the IndexedDB store by its ID.
     * @param id The unique ID of the file to delete.
     * @returns A Promise that resolves when the file is successfully deleted.
     * @throws {FileUtilityError} If the ID is invalid or the IndexedDB operation fails.
     */
    public async deleteFile(id: string): Promise<void> {
        try {
            if (typeof id !== 'string' || !id) {
                throw new TypeError('ID must be a non-empty string.');
            }

            const db = await this.initDb();
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const request = store.delete(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(new FileUtilityError(`Failed to delete file '${id}' from IndexedDB.`, (event.target as IDBRequest).error));
            });
        } catch (error) {
            throw new FileUtilityError(`Error deleting file from storage with ID '${id}'.`, error);
        }
    }

    /**
     * Lists all unique IDs of files currently stored in IndexedDB.
     * @returns A Promise that resolves with an array of file IDs (strings).
     * @throws {FileUtilityError} If the IndexedDB operation fails.
     */
    public async listFileIds(): Promise<string[]> {
        try {
            const db = await this.initDb();
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);

            const request = store.getAllKeys(); // Retrieve all primary keys

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result as string[]);
                request.onerror = (event) => reject(new FileUtilityError('Failed to list file IDs from IndexedDB.', (event.target as IDBRequest).error));
            });
        } catch (error) {
            throw new FileUtilityError('Error listing file IDs from storage.', error);
        }
    }

    /**
     * Clears all files from the IndexedDB store. Use with caution as this action is irreversible.
     * @returns A Promise that resolves when the store is successfully cleared.
     * @throws {FileUtilityError} If the IndexedDB operation fails.
     */
    public async clearStore(): Promise<void> {
        try {
            const db = await this.initDb();
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const request = store.clear(); // Clear all objects in the store

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(new FileUtilityError('Failed to clear IndexedDB store.', (event.target as IDBRequest).error));
            });
        } catch (error) {
            throw new FileUtilityError('Error clearing file storage.', error);
        }
    }

    /**
     * Closes the IndexedDB connection. It's good practice to close the database when it's no longer needed.
     * Note: IndexedDB connections are often kept open for performance. Only call if truly necessary.
     */
    public closeDb(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

/**
 * An instantiated singleton of `BrowserStorageFileService` for common use across the application.
 * Applications can directly import and use `browserFileService` without needing to create new instances.
 */
export const browserFileService = new BrowserStorageFileService();