import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { AUTH_PROVIDERS, createSession } from "@/lib/session";
import { getPostLoginPathForUser } from "@/lib/user-management";

const GOOGLE_OAUTH_STATE_COOKIE_NAME = "google_oauth_state";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const DEFAULT_CALLBACK_PATH = "/intern/login/google/callback";
const DEFAULT_LOCAL_CALLBACK_URL = `http://localhost:3000${DEFAULT_CALLBACK_PATH}`;

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string | null;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
};

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export class GoogleOAuthAccountNotProvisionedError extends Error {
  constructor(email: string) {
    super(`Google OAuth account is not provisioned for ${email}.`);
    this.name = "GoogleOAuthAccountNotProvisionedError";
  }
}

function getEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function resolveGoogleOAuthCallbackUrl(configuredCallbackUrl: string | null, origin?: string | null) {
  if (!configuredCallbackUrl) {
    if (!origin) {
      return DEFAULT_LOCAL_CALLBACK_URL;
    }

    return new URL(DEFAULT_CALLBACK_PATH, origin).toString();
  }

  if (!origin) {
    return configuredCallbackUrl;
  }

  try {
    const configuredUrl = new URL(configuredCallbackUrl);
    const requestOriginUrl = new URL(origin);
    const isLocalDevelopmentOverride =
      process.env.NODE_ENV !== "production" &&
      isLoopbackHost(configuredUrl.hostname) &&
      isLoopbackHost(requestOriginUrl.hostname) &&
      configuredUrl.pathname === DEFAULT_CALLBACK_PATH;

    if (isLocalDevelopmentOverride) {
      return new URL(DEFAULT_CALLBACK_PATH, origin).toString();
    }
  } catch {
    return configuredCallbackUrl;
  }

  return configuredCallbackUrl;
}

function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = getEnvValue("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = getEnvValue("GOOGLE_OAUTH_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    callbackUrl: getEnvValue("GOOGLE_OAUTH_CALLBACK_URL") || null,
  };
}

function splitFullName(fullName: string | undefined) {
  const value = fullName?.trim() ?? "";

  if (!value) {
    return { firstName: "", lastName: "" };
  }

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

async function exchangeCodeForAccessToken(code: string, redirectUri: string) {
  const config = getGoogleOAuthConfig();

  if (!config) {
    throw new Error("Google OAuth is not configured.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Google OAuth token exchange failed.");
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("Google OAuth token response did not include an access token.");
  }

  return payload.access_token;
}

async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Google user info request failed.");
  }

  return (await response.json()) as GoogleUserInfo;
}

async function resolveProvisionedUser(payload: GoogleUserInfo) {
  const email = normalizeEmail(payload.email ?? "");

  if (!email || payload.email_verified === false) {
    throw new Error("Google account email is missing or unverified.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      acceptedTermsAt: true,
      title: true,
      firstname: true,
      lastname: true,
      institution: true,
    },
  });

  if (!existingUser) {
    throw new GoogleOAuthAccountNotProvisionedError(email);
  }

  const splitName = splitFullName(payload.name);
  const firstName = payload.given_name?.trim() || splitName.firstName;
  const lastName = payload.family_name?.trim() || splitName.lastName;
  const nextTitle = existingUser.title.trim() || "คุณ";
  const needsUpdate =
    !existingUser.title.trim() ||
    (!existingUser.firstname.trim() && Boolean(firstName)) ||
    (!existingUser.lastname.trim() && Boolean(lastName));

  if (needsUpdate) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        title: nextTitle,
        firstname: existingUser.firstname.trim() || firstName || email.split("@")[0] || "user",
        lastname: existingUser.lastname.trim() || lastName,
      },
    });
  }

  return existingUser;
}

export function isGoogleOAuthEnabled() {
  return getGoogleOAuthConfig() !== null;
}

export function getGoogleOAuthCallbackPath() {
  return DEFAULT_CALLBACK_PATH;
}

export function getGoogleOAuthCallbackUrl(origin?: string | null) {
  const configured = getGoogleOAuthConfig()?.callbackUrl ?? null;

  return resolveGoogleOAuthCallbackUrl(configured, origin);
}

export async function createGoogleOAuthAuthorizationUrl(origin: string) {
  const config = getGoogleOAuthConfig();

  if (!config) {
    throw new Error("Google OAuth is not configured.");
  }

  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();

  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const authorizationUrl = new URL(GOOGLE_AUTH_URL);
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", getGoogleOAuthCallbackUrl(origin));
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");

  return authorizationUrl.toString();
}

export async function verifyGoogleOAuthState(state: string | null) {
  const cookieStore = await cookies();
  const storedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE_NAME)?.value ?? null;

  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);

  if (!state || !storedState) {
    return false;
  }

  const providedState = Buffer.from(state);
  const expectedState = Buffer.from(storedState);

  if (providedState.length !== expectedState.length) {
    return false;
  }

  return timingSafeEqual(providedState, expectedState);
}

export async function completeGoogleOAuthLogin(code: string, origin: string) {
  const accessToken = await exchangeCodeForAccessToken(code, getGoogleOAuthCallbackUrl(origin));
  const userInfo = await fetchGoogleUserInfo(accessToken);
  const user = await resolveProvisionedUser(userInfo);

  await createSession(user.id, AUTH_PROVIDERS.google);

  return getPostLoginPathForUser(user);
}