import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer | null {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    // Fail loud in production. Silently returning null here would cause
    // every new OAuth/BYOK token to be written to the DB as plaintext,
    // which is exactly the failure mode encryption exists to prevent.
    // In dev/test we fall back to plaintext so local setup stays simple.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY must be set to a 64-char hex string in production',
      );
    }
    return null;
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a string in the format `iv:ciphertext:tag` (all base64).
 * If TOKEN_ENCRYPTION_KEY is not set, returns plaintext unchanged (dev fallback).
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    encrypted.toString('base64'),
    tag.toString('base64'),
  ].join(':');
}

/**
 * Decrypts a token previously encrypted by encryptToken.
 * Expects the format `iv:ciphertext:tag` (all base64).
 * If TOKEN_ENCRYPTION_KEY is not set, returns the input unchanged (dev fallback).
 */
export function decryptToken(encrypted: string): string {
  const key = getEncryptionKey();
  if (!key) return encrypted;

  const parts = encrypted.split(':');
  if (parts.length !== 3) return encrypted;

  const [ivB64, ciphertextB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
