/**
 * Encryption utilities for sensitive data (Z-API tokens, etc.)
 * Uses AES-256-GCM for authenticated encryption
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  // Derive a key from the secret using scrypt
  return scryptSync(secret, "neondash-salt", KEY_LENGTH);
}

/**
 * Encrypt a string value
 * Returns format: salt:iv:tag:ciphertext (base64 encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return [salt.toString("base64"), iv.toString("base64"), tag.toString("base64"), encrypted].join(
    ":"
  );
}

/**
 * Decrypt a string value
 * Expects format: salt:iv:tag:ciphertext (base64 encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const [_salt, ivB64, tagB64, ciphertext] = encryptedData.split(":");

  if (!ivB64 || !tagB64 || !ciphertext) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Safe decrypt that returns null on error
 */
export function safeDecrypt(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) return null;
  try {
    return decrypt(encryptedData);
  } catch {
    return null;
  }
}
