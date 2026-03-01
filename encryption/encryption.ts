import * as crypto from 'crypto';
import dotenv from "dotenv";
dotenv.config();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; 

/**
 * Encrypts a plain text string.
 */
export function encryptField(text: string): string {
    const key = getEncryptionKey();
    
    // An Initialization Vector (IV) makes sure the same text encrypts differently every time.
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // We combine the IV and the encrypted data so we can use the IV later to decrypt it.
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a previously encrypted string.
 */
export function decryptField(encryptedData: string): string {
    const key = getEncryptionKey();
    
    // Split the IV and the encrypted text back apart
    const textParts = encryptedData.split(':');
    const iv = Buffer.from(textParts.shift() as string, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
}

/**
 * Helper to securely fetch and validate the environment variable key.
 */
function getEncryptionKey(): string {
    const key = process.env.DB_ENCRYPTION_KEY;
    // AES-256 requires a key that is exactly 32 characters (256 bits) long.
    if (!key || key.length !== 32) {
        throw new Error('Critical Error: DB_ENCRYPTION_KEY is not set or is not exactly 32 characters long.');
    }
    return key;
}
