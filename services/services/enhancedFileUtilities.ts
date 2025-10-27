/**
 * @file This module provides a comprehensive and robust suite of client-side file and data conversion utilities.
 * It includes functions for converting between Blob, File, ArrayBuffer, Base64, and Data URL formats,
 * as well as advanced features for downloading files, chunked reading, hashing, image manipulation,
 * and a client-side file storage service using IndexedDB.
 * It is designed with type safety, detailed error handling, and comprehensive JSDoc to be a foundational
 * utility for any web application dealing with file-like data.
 * @security This module deals with file data. While it performs client-side operations only, ensure that any
 *           data passed to these functions from external sources is properly sanitized.
 * @performance For very large files (>1GB), chunked reading and processing are recommended over loading the
 *              entire file into memory. Functions like `blobToBase64` may cause memory pressure with huge files.
 * @see services/fileUtils.ts
 * @author James Burvel O'Callaghan III
 * @copyright Citibank Demo Business Inc.
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Custom Error Classes ---

/**
 * @class FileUtilityError
 * @description Custom Error class for general file utility operations, providing structured error reporting.
 * @example
 * try {
 *   const blob = textToBlob(123); // Invalid input
 * } catch (e) {
 *   if (e instanceof FileUtilityError) {
 *     console.error('File Utility Error:', e.message, e.originalError);
 *   }
 * }
 */
export class FileUtilityError extends Error {
  /**
   * @param {string} message A human-readable description of the error.
   * @param {unknown} [originalError] An optional original error object for debugging.
   */
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'FileUtilityError';
    Object.setPrototypeOf(this, FileUtilityError.prototype);
  }
}

/**
 * @class FileConversionError
 * @description Custom Error class for failures during file conversions (e.g., Blob to Base64).
 */
export class FileConversionError extends FileUtilityError {
  /**
   * @param {string} message A human-readable description of the conversion error.
   * @param {unknown} [originalError] The original error object (e.g., from FileReader).
   */
  constructor(message: string, originalError?: unknown) {
    super(message, originalError);
    this.name = 'FileConversionError';
    Object.setPrototypeOf(this, FileConversionError.prototype);
  }
}

/**
 * @class FileDownloadError
 * @description Custom Error class for failures during file download operations.
 */
export class FileDownloadError extends FileUtilityError {
  /**
   * @param {string} message A human-readable description of the download error.
   * @param {unknown} [originalError] The original error object (e.g., DOMException).
   */
  constructor(message: string, originalError?: unknown) {
    super(message, originalError);
    this.name = 'FileDownloadError';
    Object.setPrototypeOf(this, FileDownloadError.prototype);
  }
}

// --- Type Definitions ---

/**
 * @typedef {Blob | File} FileLike
 * @description Union type representing objects that behave like a file, typically Blob or File instances.
 */
export type FileLike = Blob | File;

/**
 * @interface DownloadOptions
 * @description Interface defining options for file download operations.
 */
export interface DownloadOptions {
  /** The MIME type of the file. If not provided, it attempts to infer or defaults to 'application/octet-stream'. */
  mimeType?: string;
  /** Whether to revoke the URL created by `URL.createObjectURL` immediately after triggering the download. Defaults to `true` to prevent memory leaks. */
  revokeObjectUrl?: boolean;
  /** An optional HTMLAnchorElement to use for triggering the download. If not provided, a new one is created. */
  anchorElement?: HTMLAnchorElement;
  /** A callback function to execute right before the download link is clicked. */
  onDownloadStart?: () => void;
  /** A callback function to execute if an error occurs during the download process. */
  onDownloadError?: (error: FileDownloadError) => void;
}

/**
 * @interface FileChunk
 * @description Represents a segment (chunk) of a larger file, useful for stream-like processing.
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
 * @interface ReadChunkOptions
 * @description Configuration options for the `readBlobInChunks` function.
 */
export interface ReadChunkOptions {
  /** The size of each chunk in bytes. Defaults to 1MB (1024 * 1024 bytes). */
  chunkSize?: number;
  /** Optional callback to report progress, receiving current bytes read and total bytes. */
  onProgress?: (bytesRead: number, totalBytes: number) => void;
  /**
   * Optional callback for each chunk processed.
   * Returning `false` from this callback (or `Promise<false>`) will stop further chunk processing.
   */
  onChunk?: (chunk: FileChunk) => boolean | void | Promise<boolean | void>;
}

// --- Core Conversion Utilities ---

/**
 * @private
 * @function arrayBufferToBase64Internal
 * @description Internal helper to convert an ArrayBuffer to a Base64 string robustly.
 * @param {ArrayBuffer} buffer The ArrayBuffer to convert.
 * @returns {string} The Base64 encoded string.
 * @throws {FileConversionError} If conversion fails.
 */
const arrayBufferToBase64Internal = (buffer: ArrayBuffer): string => {
  try {
    if (!buffer || !(buffer instanceof ArrayBuffer)) {
      throw new TypeError('Input must be a valid ArrayBuffer.');
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (error) {
    throw new FileConversionError('Failed to convert ArrayBuffer to Base64.', error);
  }
};

/**
 * @function arrayBufferToBase64
 * @description Converts an ArrayBuffer to a Base64 string.
 * @param {ArrayBuffer} buffer The ArrayBuffer containing binary data.
 * @returns {string} The Base64 encoded string.
 * @throws {FileConversionError} If the buffer is invalid or encoding fails.
 */
export const arrayBufferToBase64 = arrayBufferToBase64Internal;

/**
 * @function base64ToArrayBuffer
 * @description Converts a Base64 string back into an ArrayBuffer.
 * @param {string} base64 The Base64 encoded string.
 * @returns {ArrayBuffer} The decoded ArrayBuffer.
 * @throws {FileConversionError} If the Base64 string is invalid or decoding fails.
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  try {
    if (typeof base64 !== 'string' || !base64) {
      throw new TypeError('Input must be a non-empty string.');
    }
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    throw new FileConversionError('Failed to convert Base64 to ArrayBuffer. Invalid Base64 string?', error);
  }
};

/**
 * @function base64ToBlob
 * @description Converts a Base64 string to a Blob object.
 * @param {string} base64 The Base64 encoded string.
 * @param {string} [mimeType='application/octet-stream'] The MIME type of the content.
 * @returns {Blob} A Blob object containing the decoded data.
 * @throws {FileConversionError} If the Base64 string is invalid.
 */
export const base64ToBlob = (base64: string, mimeType: string = 'application/octet-stream'): Blob => {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64);
    return new Blob([arrayBuffer], { type: mimeType });
  } catch (error) {
    throw new FileConversionError('Failed to convert Base64 to Blob.', error);
  }
};

/**
 * @function extractBase64FromDataURL
 * @description Extracts the Base64 encoded data portion from a Data URL string.
 * @param {string} dataUrl The Data URL string.
 * @returns {string} The Base64 encoded string part.
 * @throws {FileConversionError} If the Data URL format is invalid.
 */
export const extractBase64FromDataURL = (dataUrl: string): string => {
  try {
    if (typeof dataUrl !== 'string' || !dataUrl) {
      throw new TypeError('Input must be a non-empty string.');
    }
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
      throw new Error('Invalid Data URL format: missing data separator.');
    }
    return parts[1];
  } catch (error) {
    throw new FileConversionError('Failed to extract Base64 from Data URL.', error);
  }
};

/**
 * @function extractMimeTypeFromDataURL
 * @description Extracts the MIME type from a Data URL string.
 * @param {string} dataUrl The Data URL string.
 * @returns {string} The MIME type string.
 * @throws {FileConversionError} If the Data URL format is invalid.
 */
export const extractMimeTypeFromDataURL = (dataUrl: string): string => {
  try {
    if (typeof dataUrl !== 'string' || !dataUrl) {
      throw new TypeError('Input must be a non-empty string.');
    }
    const match = dataUrl.match(/^data:([a-zA-Z0-9\/\-.]+);/);
    if (match && match[1]) {
      return match[1];
    }
    throw new Error('MIME type not found in Data URL.');
  } catch (error) {
    throw new FileConversionError('Failed to extract MIME type from Data URL.', error);
  }
};

/**
 * @function dataURLToBlob
 * @description Converts a Data URL string into a Blob object.
 * @param {string} dataUrl The Data URL string.
 * @returns {Promise<Blob>} A Promise that resolves with the Blob object.
 * @throws {FileConversionError} If the Data URL is invalid.
 */
export const dataURLToBlob = async (dataUrl: string): Promise<Blob> => {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from Data URL with status: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    throw new FileConversionError('Failed to convert Data URL to Blob.', error);
  }
};

/**
 * @function dataURLToArrayBuffer
 * @description Converts a Data URL string into an ArrayBuffer.
 * @param {string} dataUrl The Data URL string.
 * @returns {Promise<ArrayBuffer>} A Promise that resolves with the ArrayBuffer.
 * @throws {FileConversionError} If the Data URL is invalid.
 */
export const dataURLToArrayBuffer = async (dataUrl: string): Promise<ArrayBuffer> => {
  try {
    const blob = await dataURLToBlob(dataUrl);
    return await blob.arrayBuffer();
  } catch (error) {
    throw new FileConversionError('Failed to convert Data URL to ArrayBuffer.', error);
  }
};

/**
 * @function blobToBase64
 * @description Converts a Blob or File object to a Base64 encoded string.
 * @param {FileLike} blob The Blob or File object to convert.
 * @returns {Promise<string>} A promise that resolves with the Base64 string.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails.
 */
export const blobToBase64 = (blob: FileLike): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!(blob instanceof Blob)) {
        throw new TypeError('Input must be a valid Blob or File object.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          if (reader.result instanceof ArrayBuffer) {
            resolve(arrayBufferToBase64Internal(reader.result));
          } else {
            reject(new FileConversionError('FileReader did not return an ArrayBuffer.'));
          }
        } catch (error) {
          reject(new FileConversionError('Failed to encode ArrayBuffer to Base64.', error));
        }
      };
      reader.onerror = (e) => reject(new FileConversionError('FileReader error during conversion.', (e.target as FileReader).error));
      reader.readAsArrayBuffer(blob);
    } catch (error) {
      reject(new FileConversionError('Failed to initiate Blob to Base64 conversion.', error));
    }
  });
};

/**
 * @function fileToBase64
 * @description Converts a File object to a Base64 encoded string.
 * @param {File} file The File object to convert.
 * @returns {Promise<string>} A promise that resolves with the Base64 string.
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
 * @function blobToDataURL
 * @description Converts a Blob object to a Data URL string.
 * @param {FileLike} blob The Blob or File object to convert.
 * @returns {Promise<string>} A promise that resolves with the Data URL string.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails.
 */
export const blobToDataURL = (blob: FileLike): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!(blob instanceof Blob)) {
        throw new TypeError('Input must be a valid Blob or File object.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new FileConversionError('FileReader did not return a string for Data URL conversion.'));
        }
      };
      reader.onerror = (e) => reject(new FileConversionError('FileReader error during conversion.', (e.target as FileReader).error));
      reader.readAsDataURL(blob);
    } catch (error) {
      reject(new FileConversionError('Failed to initiate Blob to Data URL conversion.', error));
    }
  });
};

/**
 * @function fileToDataURL
 * @description Converts a File object to a Data URL string.
 * @param {File} file The File object to convert.
 * @returns {Promise<string>} A promise that resolves with the Data URL string.
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
 * @function blobToText
 * @description Converts a Blob object to a plain text string using UTF-8 encoding.
 * @param {FileLike} blob The Blob or File object to convert.
 * @returns {Promise<string>} A Promise that resolves with the text content.
 * @throws {FileConversionError} If the Blob is invalid or conversion fails.
 */
export const blobToText = (blob: FileLike): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!(blob instanceof Blob)) {
        throw new TypeError('Input must be a valid Blob or File object.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new FileConversionError('FileReader did not return a string.'));
        }
      };
      reader.onerror = (e) => reject(new FileConversionError('FileReader error during conversion.', (e.target as FileReader).error));
      reader.readAsText(blob);
    } catch (error) {
      reject(new FileConversionError('Failed to initiate Blob to Text conversion.', error));
    }
  });
};

/**
 * @function fileToText
 * @description Converts a File object to a plain text string.
 * @param {File} file The File object to convert.
 * @returns {Promise<string>} A Promise that resolves with the text content.
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
 * @function blobToJson
 * @description Converts a Blob object to a JavaScript object by parsing its content as JSON.
 * @template T The expected type of the JSON object.
 * @param {FileLike} blob The Blob or File object containing JSON data.
 * @returns {Promise<T>} A Promise that resolves with the parsed JavaScript object.
 * @throws {FileConversionError} If the Blob is invalid or its content is not valid JSON.
 */
export const blobToJson = async <T = unknown>(blob: FileLike): Promise<T> => {
  try {
    const textContent = await blobToText(blob);
    return JSON.parse(textContent) as T;
  } catch (error) {
    throw new FileConversionError('Failed to convert Blob to JSON. Ensure content is valid JSON.', error);
  }
};

/**
 * @function fileToJson
 * @description Converts a File object to a JavaScript object by parsing its content as JSON.
 * @template T The expected type of the JSON object.
 * @param {File} file The File object containing JSON data.
 * @returns {Promise<T>} A Promise that resolves with the parsed JavaScript object.
 * @throws {FileConversionError} If the File is invalid or its content is not valid JSON.
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
 * @function textToArrayBuffer
 * @description Converts a plain string to an ArrayBuffer using UTF-8 encoding.
 * @param {string} text The string to convert.
 * @returns {ArrayBuffer} The encoded ArrayBuffer.
 * @throws {FileConversionError} If the input is not a string.
 */
export const textToArrayBuffer = (text: string): ArrayBuffer => {
  try {
    if (typeof text !== 'string') {
      throw new TypeError('Input must be a string.');
    }
    return new TextEncoder().encode(text).buffer;
  } catch (error) {
    throw new FileConversionError('Failed to convert text to ArrayBuffer.', error);
  }
};

/**
 * @function arrayBufferToText
 * @description Converts an ArrayBuffer back to a string using UTF-8 decoding.
 * @param {ArrayBuffer} buffer The ArrayBuffer to convert.
 * @returns {string} The decoded string.
 * @throws {FileConversionError} If the input is not a valid ArrayBuffer.
 */
export const arrayBufferToText = (buffer: ArrayBuffer): string => {
  try {
    if (!buffer || !(buffer instanceof ArrayBuffer)) {
      throw new TypeError('Input must be a valid ArrayBuffer.');
    }
    return new TextDecoder().decode(buffer);
  } catch (error) {
    throw new FileConversionError('Failed to convert ArrayBuffer to text.', error);
  }
};

/**
 * @function textToBlob
 * @description Creates a Blob object from a given string content.
 * @param {string} text The string content.
 * @param {string} [mimeType='text/plain'] The MIME type of the Blob.
 * @returns {Blob} A Blob object containing the string data.
 * @throws {FileUtilityError} If the input is not a string.
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
 * @function jsonToBlob
 * @description Creates a Blob object from a JavaScript object by stringifying it to JSON.
 * @param {object} data The JavaScript object to convert.
 * @param {string} [mimeType='application/json'] The MIME type of the Blob.
 * @returns {Blob} A Blob object containing the JSON string.
 * @throws {FileUtilityError} If the input is not a valid object.
 */
export const jsonToBlob = (data: object, mimeType: string = 'application/json'): Blob => {
  try {
    if (typeof data !== 'object' || data === null) {
      throw new TypeError('Input must be a non-null object.');
    }
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: mimeType });
  } catch (error) {
    throw new FileUtilityError('Failed to create Blob from JSON object.', error);
  }
};

/**
 * @function createFileFromString
 * @description Creates a File object from a string content, simulating a user-selected file.
 * @param {string} content The string content for the file.
 * @param {string} filename The desired filename.
 * @param {string} [mimeType='text/plain'] The MIME type of the file.
 * @returns {File} A simulated File object.
 * @throws {FileUtilityError} If inputs are invalid.
 */
export const createFileFromString = (content: string, filename: string, mimeType: string = 'text/plain'): File => {
  try {
    const blob = textToBlob(content, mimeType);
    return new File([blob], filename, { type: mimeType, lastModified: Date.now() });
  } catch (error) {
    throw new FileUtilityError('Failed to create File object from string.', error);
  }
};

// --- Download Utilities ---

/**
 * @function downloadBlob
 * @description Triggers a browser download for a Blob object.
 * @param {Blob} blob The Blob object to download.
 * @param {string} filename The suggested filename for the download.
 * @param {DownloadOptions} [options] Optional download configurations.
 * @returns {Promise<void>} A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the download fails.
 */
export const downloadBlob = async (blob: Blob, filename: string, options?: DownloadOptions): Promise<void> => {
  try {
    if (!(blob instanceof Blob)) throw new TypeError('Input must be a valid Blob object.');
    if (typeof filename !== 'string' || !filename) throw new TypeError('Filename must be a non-empty string.');

    const effectiveOptions: Required<DownloadOptions> = {
      mimeType: options?.mimeType || blob.type || 'application/octet-stream',
      revokeObjectUrl: options?.revokeObjectUrl ?? true,
      anchorElement: options?.anchorElement || document.createElement('a'),
      onDownloadStart: options?.onDownloadStart || (() => {}),
      onDownloadError: options?.onDownloadError || ((err) => console.error('Download error:', err)),
    };

    const url = URL.createObjectURL(blob);
    const a = effectiveOptions.anchorElement;
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    effectiveOptions.onDownloadStart();
    a.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    if (effectiveOptions.revokeObjectUrl) {
      URL.revokeObjectURL(url);
    }
    document.body.removeChild(a);

  } catch (error) {
    const downloadError = new FileDownloadError(`Failed to trigger download for "${filename}".`, error);
    options?.onDownloadError?.(downloadError);
    throw downloadError;
  }
};

/**
 * @function downloadTextFile
 * @description Triggers a browser download for string content.
 * @param {string} content The string content to download.
 * @param {string} filename The name of the file.
 * @param {DownloadOptions} [options] Optional download configurations.
 * @returns {Promise<void>} A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the download fails.
 */
export const downloadTextFile = async (content: string, filename: string, options?: DownloadOptions): Promise<void> => {
  try {
    const blob = textToBlob(content, options?.mimeType || 'text/plain');
    await downloadBlob(blob, filename, options);
  } catch (error) {
    throw new FileDownloadError(`Failed to trigger text file download for "${filename}".`, error);
  }
};

/**
 * @function downloadJson
 * @description Triggers a browser download for a JSON file from a JavaScript object.
 * @param {object} data The JavaScript object to stringify and download.
 * @param {string} [filename='data.json'] The name of the file.
 * @param {DownloadOptions} [options] Optional download configurations.
 * @returns {Promise<void>} A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the download fails.
 */
export const downloadJson = async (data: object, filename: string = 'data.json', options?: DownloadOptions): Promise<void> => {
  try {
    const blob = jsonToBlob(data);
    await downloadBlob(blob, filename, { ...options, mimeType: 'application/json' });
  } catch (error) {
    throw new FileDownloadError(`Failed to download JSON file "${filename}".`, error);
  }
};

/**
 * @function downloadEnvFile
 * @description Generates and downloads a `.env` formatted file.
 * @param {Record<string, string>} env A record of key-value pairs.
 * @param {string} [filename='.env'] The name of the file.
 * @param {DownloadOptions} [options] Optional download configurations.
 * @returns {Promise<void>} A Promise that resolves when the download is triggered.
 * @throws {FileDownloadError} If the download fails.
 */
export const downloadEnvFile = async (env: Record<string, string>, filename: string = '.env', options?: DownloadOptions): Promise<void> => {
  try {
    if (typeof env !== 'object' || env === null) {
      throw new TypeError('Input must be a non-null object.');
    }
    const content = Object.entries(env)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join('\n');
    await downloadTextFile(content, filename, { ...options, mimeType: 'text/plain' });
  } catch (error) {
    throw new FileDownloadError(`Failed to download .env file "${filename}".`, error);
  }
};

/**
 * @function downloadFile
 * @description Triggers a browser download for the given content.
 * @param {string} content The string content to download.
 * @param {string} filename The name of the file.
 * @param {string} [mimeType='text/plain'] The MIME type of the file.
 * @returns {Promise<void>} A Promise that resolves when the download is triggered.
 * @deprecated Use `downloadTextFile` for better clarity and error handling.
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): Promise<void> => {
    return downloadTextFile(content, filename, { mimeType });
};

// --- Filename & MIME Type Utilities ---

/**
 * @function getFileExtensionFromMimeType
 * @description Guesses a file extension from a MIME type.
 * @param {string} mimeType The MIME type string.
 * @returns {string | null} The common file extension or `null` if no match is found.
 */
export const getFileExtensionFromMimeType = (mimeType: string): string | null => {
  if (typeof mimeType !== 'string' || !mimeType) return null;
  const type = mimeType.toLowerCase().trim();
  const mapping: Record<string, string> = {
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'application/javascript': 'js',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
  };
  if (mapping[type]) return mapping[type];

  const parts = type.split('/');
  if (parts.length === 2) {
    const subType = parts[1];
    if (subType.includes('+')) {
      return subType.split('+')[0];
    }
    return subType.replace(/^(x-|vnd\.)/, '');
  }
  return null;
};

/**
 * @function sanitizeFilename
 * @description Sanitizes a string to be a safe filename.
 * @param {string} name The original string to sanitize.
 * @param {string} [replacement='_'] The character to replace invalid characters with.
 * @returns {string} A sanitized filename string.
 * @throws {FileUtilityError} If the input name is not a string.
 */
export const sanitizeFilename = (name: string, replacement: string = '_'): string => {
  try {
    if (typeof name !== 'string') {
      throw new TypeError('Input must be a string.');
    }
    const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    let sanitized = name
      .replace(/[\/?<>\\:*|"\^$\u0000-\u001F]/g, replacement)
      .replace(/\s/g, '-')
      .replace(/(-|_)+$/, '')
      .trim();

    if (!sanitized) return 'untitled';
    if (reservedNames.test(getFilenameWithoutExtension(sanitized))) {
      sanitized = `${sanitized}${replacement}file`;
    }
    return sanitized;
  } catch (error) {
    throw new FileUtilityError('Failed to sanitize filename.', error);
  }
};

/**
 * @function getFilenameWithoutExtension
 * @description Extracts the filename without its extension.
 * @param {string} filename The full filename.
 * @returns {string} The filename part without the extension.
 * @throws {FileUtilityError} If the filename is not a valid string.
 */
export const getFilenameWithoutExtension = (filename: string): string => {
    try {
        if (typeof filename !== 'string' || !filename) {
            throw new TypeError('Filename must be a non-empty string.');
        }
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return filename;
        }
        return filename.substring(0, lastDotIndex);
    } catch (error) {
        throw new FileUtilityError('Failed to get filename without extension.', error);
    }
};

// --- Advanced Utilities ---

/**
 * @function calculateFileSha256
 * @description Calculates the SHA-256 hash of a Blob or File object.
 * @param {FileLike} fileLike The Blob or File object to hash.
 * @returns {Promise<string>} A Promise that resolves with the SHA-256 hash as a hex string.
 * @throws {FileUtilityError} If the Web Crypto API is unavailable or hashing fails.
 */
export const calculateFileSha256 = async (fileLike: FileLike): Promise<string> => {
  try {
    if (!(fileLike instanceof Blob)) {
      throw new TypeError('Input must be a valid Blob or File object.');
    }
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not available.');
    }

    const buffer = await fileLike.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    throw new FileUtilityError('Failed to calculate SHA-256 hash of file.', error);
  }
};

/**
 * @function readBlobInChunks
 * @description Reads a Blob or File in chunks, ideal for large file processing.
 * @param {FileLike} fileLike The Blob or File object to read.
 * @param {ReadChunkOptions} [options={}] Configuration for reading chunks.
 * @returns {Promise<void>} A Promise that resolves when all chunks are processed.
 * @throws {FileUtilityError} If reading fails.
 */
export const readBlobInChunks = async (fileLike: FileLike, options: ReadChunkOptions = {}): Promise<void> => {
  try {
    if (!(fileLike instanceof Blob)) {
      throw new TypeError('Input must be a valid Blob or File object.');
    }

    const { chunkSize = 1024 * 1024, onProgress, onChunk } = options;
    const fileSize = fileLike.size;
    let offset = 0;
    let chunkIndex = 0;
    const totalChunks = Math.ceil(fileSize / chunkSize);

    while (offset < fileSize) {
      const end = Math.min(offset + chunkSize, fileSize);
      const slice = fileLike.slice(offset, end);
      const chunkData = await slice.arrayBuffer();

      const currentChunk: FileChunk = {
        data: chunkData,
        start: offset,
        end: end,
        totalSize: fileSize,
        chunkIndex: chunkIndex,
        totalChunks: totalChunks,
      };

      if (onChunk) {
        const result = await Promise.resolve(onChunk(currentChunk));
        if (result === false) {
          return;
        }
      }

      offset = end;
      chunkIndex++;
      onProgress?.(offset, fileSize);
    }
  } catch (error) {
    throw new FileUtilityError('Failed to read blob in chunks.', error);
  }
};
