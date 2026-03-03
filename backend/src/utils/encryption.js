const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Gets the encryption key from environment variables
 * Ensures it is a 32-byte key (64 hex characters)
 */
function getKey() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters) in .env');
    }
    return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts plaintext using AES-256-GCM
 * Returns: v1:iv:authTag:ciphertext
 */
function encrypt(text) {
    if (!text) return null;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = getKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag().toString('base64');

        // Format: version:iv:authTag:ciphertext
        return `v1:${iv.toString('base64')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('Encryption failed:', error.message);
        throw new Error('Data encryption failed');
    }
}

/**
 * Decrypts ciphertext using AES-256-GCM
 */
function decrypt(payload) {
    if (!payload) return null;

    try {
        const parts = payload.split(':');
        if (parts[0] !== 'v1' || parts.length !== 4) {
            // Version check for future-proofing
            throw new Error('Invalid encryption format or version');
        }

        const iv = Buffer.from(parts[1], 'base64');
        const authTag = Buffer.from(parts[2], 'base64');
        const ciphertext = parts[3];

        const key = getKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        throw new Error('Data decryption failed');
    }
}

module.exports = {
    encrypt,
    decrypt
};
