import { randomBytes, scryptSync } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
}

export function createOAuthOnlyPasswordHash() {
  return hashPassword(randomBytes(32).toString("hex"));
}