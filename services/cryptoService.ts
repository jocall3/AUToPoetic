// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Welcome, noble seeker of secrets, to the illustrious Crypto-Jester's Citadel!
 * Within these digital walls lies the "Ultimate Security Extravaganza 3000" - a cryptographic service
 * designed not just for security, but for a delightful dance with daring data.
 *
 * This isn't just code; it's a symphony of bytes, a ballet of bits, orchestrated to protect your
 * most precious digital whispers with unyielding fortitude and a touch of the theatrical.
 *
 * Developed by the esteemed James Burvel O'Callaghan III, President of Citibank Demo Business Inc.,
 * this service embodies the pinnacle of cryptographic engineering, infused with the wisdom
 * of ages and the wit of a seasoned jester.
 *
 * May your data be ever encrypted, and your secrets safe from prying eyes (and clumsy jester pranks!).
 */

// === Jester's Secret Configuration Scrolls ===

/**
 * @const {string} KEY_ALGORITHM The principal algorithm for symmetric encryption. AES-GCM for robust, authenticated encryption.
 */
const KEY_ALGORITHM: AesKeyAlgorithm['name'] = 'AES-GCM';

/**
 * @const {number} KEY_LENGTH The length of the symmetric key in bits. 256 bits for formidable strength.
 */
const KEY_LENGTH = 256;

/**
 * @const {string} PBKDF2_ALGORITHM The key derivation function algorithm. PBKDF2 for password-based key derivation.
 */
const PBKDF2_ALGORITHM: Pbkdf2KeyAlgorithm['name'] = 'PBKDF2';

/**
 * @const {string} PBKDF2_HASH The hashing algorithm used within PBKDF2. SHA-256 for solid cryptographic foundation.
 */
const PBKDF2_HASH: 'SHA-256' | 'SHA-512' = 'SHA-256';

/**
 * @const {number} PBKDF2_ITERATIONS The number of iterations for PBKDF2. A higher number increases resistance to brute-force attacks.
 */
const PBKDF2_ITERATIONS = 250000;

/**
 * @const {number} SALT_LENGTH_BYTES The length of the cryptographic salt in bytes. A longer salt ensures greater randomness.
 */
const SALT_LENGTH_BYTES = 32;

/**
 * @const {number} IV_LENGTH_BYTES The length of the Initialization Vector (IV) in bytes. 12 bytes is standard for AES-GCM.
 */
const IV_LENGTH_BYTES = 12;

/**
 * @const {number} AUTH_TAG_LENGTH_BITS The length of the authentication tag in bits for AES-GCM. 128 bits provides strong integrity.
 */
const AUTH_TAG_LENGTH_BITS = 128;

/**
 * @const {number} JESTER_MAGIC_BYTE_HEADER A unique magic byte header to identify encrypted blobs from the Crypto-Jester's Toolkit.
 */
const JESTER_MAGIC_BYTE_HEADER = 0xCC;

/**
 * @const {number} JESTER_VERSION_BYTE The version of the encryption scheme. Allows for future upgrades.
 */
const JESTER_VERSION_BYTE = 0x01;

/**
 * @const {number} JESTER_HEADER_LENGTH The total length of the Jester's magic header (Magic Byte + Version Byte).
 */
const JESTER_HEADER_LENGTH = 2;

// === Jester's Trusty Translators ===
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// === Jester's Error Scrolls ===

/**
 * Represents a generic cryptographic error from the Jester's Toolkit.
 */
export class CryptoJesterError extends Error {
    /**
     * Creates an instance of CryptoJesterError.
     * @param message A descriptive message about the error.
     * @param code An optional, machine-readable error code.
     */
    constructor(message: string, public code: string = 'CRYPTO_JESTER_GENERIC_ERROR') {
        super(`[Jester's Error Scroll - Code: ${code}] ${message}`);
        this.name = 'CryptoJesterError';
    }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends CryptoJesterError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

/**
 * Error thrown when a key operation fails (e.g., incorrect key usage, invalid key format).
 */
export class KeyOperationError extends CryptoJesterError {
    constructor(message: string) {
        super(message, 'KEY_OPERATION_ERROR');
        this.name = 'KeyOperationError';
    }
}

/**
 * Error thrown when an encrypted blob is malformed, corrupted, or tampered with.
 */
export class MalformedCiphertextError extends CryptoJesterError {
    constructor(message: string) {
        super(message, 'MALFORMED_CIPHERTEXT_ERROR');
        this.name = 'MalformedCiphertextError';
    }
}

// === Jester's Utility Spells and Charms ===

const validateArrayBuffer = (buffer: ArrayBuffer | undefined | null, name: string): void => {
    if (!buffer || buffer.byteLength === 0) {
        throw new ValidationError(`The Jester's ${name} cannot be an empty or non-existent scroll!`);
    }
};

const validateString = (str: string | undefined | null, name: string): void => {
    if (typeof str !== 'string' || str.trim().length === 0) {
        throw new ValidationError(`The Jester's ${name} cannot be a silent whisper or empty parchment!`);
    }
};

export const generateUuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const arrayBufferToHex = (buffer: ArrayBuffer): string => {
    validateArrayBuffer(buffer, 'buffer for hex encoding');
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

// === Jester's Key-Crafting Workbench ===

export interface KeyDerivationOptions {
    salt?: ArrayBuffer;
    iterations?: number;
    hash?: 'SHA-256' | 'SHA-512';
    keyLength?: number;
    correlationId?: string;
}

export const deriveKey = async (
    password: string,
    options: KeyDerivationOptions = {}
): Promise<{ key: CryptoKey; salt: ArrayBuffer }> => {
    validateString(password, 'password for key derivation');

    const salt = options.salt || generateSalt(SALT_LENGTH_BYTES, options.correlationId);
    const iterations = options.iterations || PBKDF2_ITERATIONS;
    const hash = options.hash || PBKDF2_HASH;
    const keyLength = options.keyLength || KEY_LENGTH;

    try {
        const masterKey = await crypto.subtle.importKey(
            'raw',
            textEncoder.encode(password),
            { name: PBKDF2_ALGORITHM },
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: PBKDF2_ALGORITHM,
                salt,
                iterations,
                hash,
            },
            masterKey,
            { name: KEY_ALGORITHM, length: keyLength },
            true,
            ['encrypt', 'decrypt']
        );
        return { key: derivedKey, salt };
    } catch (e: any) {
        throw new KeyOperationError(`Failed to derive key, the Jester's spell faltered: ${e.message}`);
    }
};

export const generateSalt = (lengthBytes: number = SALT_LENGTH_BYTES, correlationId?: string): ArrayBuffer => {
    try {
        const salt = crypto.getRandomValues(new Uint8Array(lengthBytes));
        return salt.buffer;
    } catch (e: any) {
        throw new CryptoJesterError(`Failed to generate salt: ${e.message}`, 'SALT_GENERATION_ERROR');
    }
};

export const generateIv = (lengthBytes: number = IV_LENGTH_BYTES, correlationId?: string): Uint8Array => {
    try {
        const iv = crypto.getRandomValues(new Uint8Array(lengthBytes));
        return iv;
    } catch (e: any) {
        throw new CryptoJesterError(`Failed to generate IV: ${e.message}`, 'IV_GENERATION_ERROR');
    }
};

// === Encryption & Decryption Spells ===

export interface EncryptionOptions {
    iv?: Uint8Array;
    tagLength?: number;
    additionalAuthenticatedData?: ArrayBuffer;
    correlationId?: string;
}

export const encryptString = async (
    plaintext: string,
    key: CryptoKey,
    options: EncryptionOptions = {}
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> => {
    validateString(plaintext, 'plaintext for encryption');
    if (!key || key.type !== 'secret' || !key.usages.includes('encrypt')) {
        throw new KeyOperationError("Key must be a valid secret key with 'encrypt' usage.");
    }

    const iv = options.iv || generateIv();
    const encodedPlaintext = textEncoder.encode(plaintext);

    try {
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: KEY_ALGORITHM,
                iv,
                tagLength: options.tagLength || AUTH_TAG_LENGTH_BITS,
                additionalData: options.additionalAuthenticatedData,
            },
            key,
            encodedPlaintext
        );
        return { ciphertext, iv };
    } catch (e: any) {
        throw new CryptoJesterError(`Encryption failed: ${e.message}`, 'ENCRYPTION_FAILED');
    }
};

export const encryptStringAndPackage = async (
    plaintext: string,
    password: string,
    options: KeyDerivationOptions & EncryptionOptions = {}
): Promise<ArrayBuffer> => {
    validateString(plaintext, 'plaintext for packaging');
    validateString(password, 'password for packaging encryption');

    try {
        const salt = options.salt || generateSalt();
        const { key } = await deriveKey(password, { ...options, salt });
        const { ciphertext, iv } = await encryptString(plaintext, key, options);

        const totalLength = JESTER_HEADER_LENGTH + salt.byteLength + iv.byteLength + ciphertext.byteLength;
        const packagedBlob = new Uint8Array(totalLength);
        let offset = 0;

        packagedBlob[offset++] = JESTER_MAGIC_BYTE_HEADER;
        packagedBlob[offset++] = JESTER_VERSION_BYTE;
        packagedBlob.set(new Uint8Array(salt), offset);
        offset += salt.byteLength;
        packagedBlob.set(iv, offset);
        offset += iv.byteLength;
        packagedBlob.set(new Uint8Array(ciphertext), offset);

        return packagedBlob.buffer;
    } catch (e: any) {
        throw new CryptoJesterError(`Packaging spell failed: ${e.message}`, 'ENCRYPTION_PACKAGING_FAILED');
    }
};

export interface DecryptionOptions {
    tagLength?: number;
    additionalAuthenticatedData?: ArrayBuffer;
    correlationId?: string;
}

export const decryptString = async (
    ciphertext: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array,
    options: DecryptionOptions = {}
): Promise<string> => {
    validateArrayBuffer(ciphertext, 'ciphertext for decryption');
    if (!key || key.type !== 'secret' || !key.usages.includes('decrypt')) {
        throw new KeyOperationError("Key must be a valid secret key with 'decrypt' usage.");
    }

    try {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: KEY_ALGORITHM,
                iv,
                tagLength: options.tagLength || AUTH_TAG_LENGTH_BITS,
                additionalData: options.additionalAuthenticatedData,
            },
            key,
            ciphertext
        );
        return textDecoder.decode(decrypted);
    } catch (e: any) {
        if (e instanceof DOMException && e.message.includes('tag mismatch')) {
            throw new MalformedCiphertextError("Authentication tag mismatch. Data may be tampered with or key/IV is incorrect.");
        }
        throw new CryptoJesterError(`Decryption failed: ${e.message}`, 'DECRYPTION_FAILED');
    }
};

export const decryptPackagedString = async (
    packagedBlob: ArrayBuffer,
    password: string,
    options: KeyDerivationOptions & DecryptionOptions = {}
): Promise<string> => {
    validateArrayBuffer(packagedBlob, 'packaged blob for decryption');
    validateString(password, 'password for packaged decryption');

    const view = new Uint8Array(packagedBlob);
    let offset = 0;

    try {
        if (view.byteLength < JESTER_HEADER_LENGTH + SALT_LENGTH_BYTES + IV_LENGTH_BYTES) {
            throw new MalformedCiphertextError("Packaged blob is too short to be valid.");
        }

        const magicByte = view[offset++];
        const versionByte = view[offset++];

        if (magicByte !== JESTER_MAGIC_BYTE_HEADER) {
            throw new MalformedCiphertextError(`Invalid magic header (0x${magicByte.toString(16)}).`);
        }
        if (versionByte !== JESTER_VERSION_BYTE) {
            throw new MalformedCiphertextError(`Unsupported version (0x${versionByte.toString(16)}).`);
        }

        const salt = packagedBlob.slice(offset, offset + SALT_LENGTH_BYTES);
        offset += SALT_LENGTH_BYTES;

        const iv = new Uint8Array(packagedBlob.slice(offset, offset + IV_LENGTH_BYTES));
        offset += IV_LENGTH_BYTES;

        const ciphertext = packagedBlob.slice(offset);

        const { key } = await deriveKey(password, { ...options, salt });
        return await decryptString(ciphertext, key, iv, options);
    } catch (e: any) {
        throw new CryptoJesterError(`Packaged decryption stumbled: ${e.message}`, 'DECRYPTION_PACKAGING_FAILED');
    }
};
