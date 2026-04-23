import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "intern_session";
const SESSION_PROVIDER_COOKIE_NAME = "intern_auth_provider";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const AUTH_PROVIDERS = {
  password: "password",
  cmuEntra: "cmu-entra",
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? process.env.DATABASE_URL ?? "intern-local-session-secret";
}

function signSessionPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function encodeSession(userId: string, expiresAt: Date) {
  const payload = `${userId}.${expiresAt.getTime()}`;
  const encodedPayload = Buffer.from(payload).toString("base64url");

  return `${encodedPayload}.${signSessionPayload(payload)}`;
}

function decodeSession(sessionValue?: string) {
  if (!sessionValue) {
    return null;
  }

  const [encodedPayload, signature] = sessionValue.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expectedSignature = signSessionPayload(payload);
  const providedSignature = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (providedSignature.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedSignature, expectedSignatureBuffer)) {
    return null;
  }

  const [userId, expiresAt] = payload.split(".");
  const expiresAtTimestamp = Number(expiresAt);

  if (!userId || Number.isNaN(expiresAtTimestamp) || expiresAtTimestamp <= Date.now()) {
    return null;
  }

  return {
    userId,
    expiresAt: new Date(expiresAtTimestamp),
  };
}

export async function createSession(userId: string, authProvider: AuthProvider = AUTH_PROVIDERS.password) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(userId, expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  cookieStore.set(SESSION_PROVIDER_COOKIE_NAME, authProvider, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_PROVIDER_COOKIE_NAME);
}

export async function getSessionUserId() {
  const sessionValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = decodeSession(sessionValue);

  return session?.userId ?? null;
}

export async function getSessionAuthProvider() {
  const provider = (await cookies()).get(SESSION_PROVIDER_COOKIE_NAME)?.value;

  if (provider === AUTH_PROVIDERS.cmuEntra || provider === AUTH_PROVIDERS.password) {
    return provider;
  }

  return null;
}