import crypto from "node:crypto";
import { env } from "../config/env.js";

const CURRENT_KEY_ID = "k1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // Recommended for AES-GCM
const KEY_BUFFER = Buffer.from(env.FIELD_ENCRYPTION_KEY, "hex");

if (KEY_BUFFER.length !== 32) {
  throw new Error("FIELD_ENCRYPTION_KEY must be exactly 32 bytes (256 bits)");
}

/**
 * Encrypts a sensitive string (NIC or Phone) using AES-256-GCM.
 * Formats output as: `<keyId>:<iv_hex>:<authTag_hex>:<cipher_hex>`.
 */
export function encryptField(plainText?: string): string | undefined {
  if (!plainText) return undefined;

  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${CURRENT_KEY_ID}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an encrypted field string formatted as `<keyId>:<iv_hex>:<authTag_hex>:<cipher_hex>`.
 */
export function decryptField(encryptedText?: string): string | undefined {
  if (!encryptedText) return undefined;

  const parts = encryptedText.split(":");
  if (parts.length !== 4) {
    // If not encrypted or in legacy format, return as is or undefined
    return encryptedText;
  }

  const [, ivHex, authTagHex, cipherHex] = parts;
  if (!ivHex || !authTagHex || !cipherHex) {
    return undefined;
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, "hex")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return undefined;
  }
}

/**
 * Masks sensitive values showing only the last 4 characters.
 * Example: "918234567V" -> "••••••567V", "+94 77 123 4567" -> "••••••••4567".
 */
export function maskSensitiveValue(value?: string): string {
  if (!value) return "••••";
  if (value.length <= 4) return "••••";
  const lastFour = value.slice(-4);
  return `${"•".repeat(Math.min(value.length - 4, 8))}${lastFour}`;
}
