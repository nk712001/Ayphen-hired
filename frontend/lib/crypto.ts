import crypto from 'crypto';

// Use a secure key from env or fallback for dev (DO NOT USE FALLBACK IN PROD)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-must-be-32-bytes!';
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
    if (!text) return text;

    // Ensure key is 32 bytes
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', key as any, iv as any);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()] as any);

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
    if (!text) return text;

    try {
        const parts = text.split(':');
        if (parts.length !== 3) return text; // Not encrypted or invalid format

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = Buffer.from(parts[2], 'hex');

        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key as any, iv as any);
        decipher.setAuthTag(authTag as any);

        let decrypted = decipher.update(encryptedText as any);
        decrypted = Buffer.concat([decrypted, decipher.final()] as any);

        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error);
        return text; // Return original on failure (or should we throw?)
    }
}
