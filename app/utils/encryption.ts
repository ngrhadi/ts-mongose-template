import crypto from 'crypto';

const encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('base64');
const algorithm = 'aes-256-cbc';
const iv = Buffer.alloc(16, 0); // Initialization vector (16 bytes of zeros)

/**
 * Encrypts a given text using AES-256-CBC.
 * @param text The text to encrypt.
 * @returns The encrypted text in base64 format.
 */
export function encrypt(text: string): string {
    try {
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'base64'), iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
        throw new Error('Encryption failed: Unknown error');
    }
}

/**
 * Decrypts a given encrypted text using AES-256-CBC.
 * @param encryptedText The encrypted text in base64 format.
 * @returns The decrypted plain text.
 */
export function decrypt(encryptedText: string): string {
    try {
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'base64'), iv);
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
        throw new Error('Decryption failed: Unknown error');
    }
}
