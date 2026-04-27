import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { deleteStoredFiles, saveUploadedFile } from "@/lib/file-storage";
import { INTERN_BASE_PATH } from "@/lib/public-paths";
import { normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { AUTH_PROVIDERS, createSession } from "@/lib/session";
import { getPostLoginPathForUser, USER_ROLES } from "@/lib/user-management";

const CMU_OAUTH_STATE_COOKIE_NAME = "cmu_oauth_state";
const DEFAULT_CALLBACK_PATH = "/intern/api/auth/callback";
const DEFAULT_LOCAL_CALLBACK_URL = `http://localhost:3000${DEFAULT_CALLBACK_PATH}`;
const CALLBACK_URL_PLACEHOLDER = "http://your-domain.example/intern/api/auth/callback";
const DEFAULT_POST_LOGOUT_PATH = INTERN_BASE_PATH;
const DEFAULT_LOCAL_POST_LOGOUT_URL = `http://localhost:3000${DEFAULT_POST_LOGOUT_PATH}`;

type CmuOAuthConfig = {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  basicInfoUrl: string;
};

type CmuBasicInfo = {
  email: string;
  title: string;
  firstName: string;
  lastName: string;
  institution: string | null;
  profileImageSource: string | null;
};

const MAX_OAUTH_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_OAUTH_PROFILE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

export class CmuOAuthAccountNotProvisionedError extends Error {
  constructor(email: string) {
    super(`CMU OAuth account is not provisioned for ${email}.`);
    this.name = "CmuOAuthAccountNotProvisionedError";
  }
}

function getEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getCmuOAuthConfig(): CmuOAuthConfig | null {
  const config = {
    authUrl: getEnvValue("AUTH_URL"),
    tokenUrl: getEnvValue("TOKEN_URL"),
    clientId: getEnvValue("CLIENT_ID"),
    clientSecret: getEnvValue("CLIENT_SECRET"),
    scope: getEnvValue("SCOPE"),
    basicInfoUrl: getEnvValue("BASICINFO_URL"),
  } satisfies CmuOAuthConfig;

  return Object.values(config).every(Boolean) ? config : null;
}

function normalizeCallbackUrl(callbackUrl: string | null) {
  if (!callbackUrl) {
    return null;
  }

  if (callbackUrl === CALLBACK_URL_PLACEHOLDER) {
    return null;
  }

  return callbackUrl;
}

function findFirstString(value: unknown, candidateKeys: string[]) {
  const keys = new Set(candidateKeys.map((candidate) => candidate.toLowerCase()));
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (!current || typeof current !== "object") {
      continue;
    }

    const record = current as Record<string, unknown>;

    for (const [key, entry] of Object.entries(record)) {
      if (typeof entry === "string" && keys.has(key.toLowerCase())) {
        const trimmed = entry.trim();

        if (trimmed) {
          return trimmed;
        }
      }
    }

    queue.push(...Object.values(record));
  }

  return null;
}

function normalizeCmuEmail(email: string) {
  const normalized = normalizeEmail(email);

  if (!normalized.includes("@")) {
    return `${normalized}@cmu.ac.th`;
  }

  return normalized;
}

function normalizeProfileImageSource(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (/^https?:\/\//i.test(normalized) || /^data:image\//i.test(normalized)) {
    return normalized;
  }

  return null;
}

function normalizeImageMimeType(mimeType: string) {
  return mimeType.trim().toLowerCase() === "image/jpg" ? "image/jpeg" : mimeType.trim().toLowerCase();
}

function getImageExtension(mimeType: string) {
  switch (normalizeImageMimeType(mimeType)) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    default:
      return null;
  }
}

async function buildOauthProfilePhotoFile(profileImageSource: string) {
  if (profileImageSource.startsWith("data:image/")) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(profileImageSource);

    if (!match) {
      return null;
    }

    const mimeType = normalizeImageMimeType(match[1]);

    if (!ALLOWED_OAUTH_PROFILE_MIME_TYPES.has(mimeType)) {
      return null;
    }

    const buffer = Buffer.from(match[2], "base64");

    if (buffer.byteLength > MAX_OAUTH_PROFILE_IMAGE_SIZE_BYTES) {
      return null;
    }

    return new File([buffer], `oauth-profile.${getImageExtension(mimeType) ?? "jpg"}`, {
      type: mimeType,
    });
  }

  const response = await fetch(profileImageSource, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const mimeType = normalizeImageMimeType(response.headers.get("content-type")?.split(";")[0] ?? "");

  if (!ALLOWED_OAUTH_PROFILE_MIME_TYPES.has(mimeType)) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_OAUTH_PROFILE_IMAGE_SIZE_BYTES) {
    return null;
  }

  return new File([arrayBuffer], `oauth-profile.${getImageExtension(mimeType) ?? "jpg"}`, {
    type: mimeType,
  });
}

async function replaceUserProfileImageFromOauth(userId: string, profileImageSource: string, previousImagePath?: string | null) {
  try {
    const profilePhoto = await buildOauthProfilePhotoFile(profileImageSource);

    if (!profilePhoto) {
      return;
    }

    const savedProfilePhoto = await saveUploadedFile(profilePhoto, `profile-photos/${userId}`);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          profileImagePath: savedProfilePhoto.filePath,
        },
      });
    } catch {
      await deleteStoredFiles([savedProfilePhoto.filePath]);
      return;
    }

    if (previousImagePath) {
      await deleteStoredFiles([previousImagePath]);
    }
  } catch {
    // Ignore OAuth profile image import failures and continue login.
  }
}

function splitFullName(fullName: string | null) {
  if (!fullName) {
    return { firstName: "", lastName: "" };
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function extractBasicInfo(payload: unknown): CmuBasicInfo {
  const emailValue =
    findFirstString(payload, ["email", "mail", "cmuMail", "cmuitaccount", "itaccount", "account"]) ?? "";

  if (!emailValue) {
    throw new Error("CMU account email was not found in the basic info response.");
  }

  const fullName = findFirstString(payload, ["displayname", "displayName", "fullname", "fullName", "name"]);
  const splitName = splitFullName(fullName);
  const firstName =
    findFirstString(payload, ["firstname_en", "firstname_th", "firstname", "firstName", "given_name"]) ??
    splitName.firstName;
  const lastName =
    findFirstString(payload, ["lastname_en", "lastname_th", "lastname", "lastName", "family_name", "surname"]) ??
    splitName.lastName;

  return {
    email: normalizeCmuEmail(emailValue),
    title: findFirstString(payload, ["title_en", "title_th", "title", "prefix"]) ?? "คุณ",
    firstName: firstName || emailValue.split("@")[0] || "student",
    lastName: lastName || "",
    institution:
      findFirstString(payload, ["organizationname", "organizationName", "organization", "faculty", "division"]) ?? null,
    profileImageSource: normalizeProfileImageSource(
      findFirstString(payload, [
        "picture",
        "pictureurl",
        "pictureUrl",
        "photo",
        "photourl",
        "photoUrl",
        "avatar",
        "avatarurl",
        "avatarUrl",
        "profileimage",
        "profileImage",
        "profileimageurl",
        "profileImageUrl",
        "thumbnailphoto",
        "thumbnailPhoto",
      ]),
    ),
  };
}

async function exchangeCodeForAccessToken(code: string, redirectUri: string) {
  const config = getCmuOAuthConfig();

  if (!config) {
    throw new Error("CMU OAuth is not configured.");
  }

  const response = await fetch(config.tokenUrl, {
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
      scope: config.scope,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("CMU OAuth token exchange failed.");
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("CMU OAuth token response did not include an access token.");
  }

  return payload.access_token;
}

async function fetchCmuBasicInfo(accessToken: string) {
  const config = getCmuOAuthConfig();

  if (!config) {
    throw new Error("CMU OAuth is not configured.");
  }

  const response = await fetch(config.basicInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("CMU basic info request failed.");
  }

  return response.json();
}

async function upsertOauthUser(profile: CmuBasicInfo) {
  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email },
    select: {
      id: true,
      role: true,
      acceptedTermsAt: true,
      title: true,
      firstname: true,
      lastname: true,
      institution: true,
      profileImagePath: true,
      application: {
        select: {
          id: true,
        },
      },
    },
  });

  if (existingUser) {
    const shouldReplaceSeededProfile = existingUser.role === USER_ROLES.Student && !existingUser.application;
    const needsProfileBackfill =
      shouldReplaceSeededProfile ||
      !existingUser.title.trim() ||
      !existingUser.firstname.trim() ||
      (!existingUser.lastname.trim() && Boolean(profile.lastName)) ||
      (!existingUser.institution && Boolean(profile.institution));

    if (needsProfileBackfill) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          title: shouldReplaceSeededProfile ? profile.title : existingUser.title.trim() || profile.title,
          firstname: shouldReplaceSeededProfile ? profile.firstName : existingUser.firstname.trim() || profile.firstName,
          lastname: shouldReplaceSeededProfile ? profile.lastName || existingUser.lastname : existingUser.lastname.trim() || profile.lastName,
          institution: shouldReplaceSeededProfile ? profile.institution : existingUser.institution ?? profile.institution,
        },
      });
    }

    if (shouldReplaceSeededProfile && profile.profileImageSource) {
      await replaceUserProfileImageFromOauth(existingUser.id, profile.profileImageSource, existingUser.profileImagePath);
    }

    return existingUser;
  }

  throw new CmuOAuthAccountNotProvisionedError(profile.email);
}

export function isCmuOAuthEnabled() {
  return getCmuOAuthConfig() !== null;
}

export function getCmuOAuthCallbackPath() {
  return DEFAULT_CALLBACK_PATH;
}

export function getCmuOAuthCallbackUrl(origin?: string | null) {
  const configured = normalizeCallbackUrl(getEnvValue("CALLBACK_URL"));

  if (configured) {
    return configured;
  }

  if (!origin) {
    return DEFAULT_LOCAL_CALLBACK_URL;
  }

  return new URL(DEFAULT_CALLBACK_PATH, origin).toString();
}

export function getCmuProfessorCallbackHint() {
  const configured = normalizeCallbackUrl(getEnvValue("CALLBACK_URL"));

  return configured ?? DEFAULT_LOCAL_CALLBACK_URL;
}

export function getCmuLogoutUrl(origin?: string | null) {
  const configured = getEnvValue("LOGOUT_URL");

  if (!configured) {
    return null;
  }

  try {
    const logoutUrl = new URL(configured);
    const postLogoutRedirectUrl = origin
      ? new URL(DEFAULT_POST_LOGOUT_PATH, origin).toString()
      : DEFAULT_LOCAL_POST_LOGOUT_URL;

    logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUrl);

    return logoutUrl.toString();
  } catch {
    return null;
  }
}

export async function createCmuOAuthAuthorizationUrl(origin: string) {
  const config = getCmuOAuthConfig();

  if (!config) {
    throw new Error("CMU OAuth is not configured.");
  }

  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();

  cookieStore.set(CMU_OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const authorizationUrl = new URL(config.authUrl);
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", getCmuOAuthCallbackUrl(origin));
  authorizationUrl.searchParams.set("response_mode", "query");
  authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set("state", state);

  return authorizationUrl.toString();
}

export async function verifyCmuOAuthState(state: string | null) {
  const cookieStore = await cookies();
  const storedState = cookieStore.get(CMU_OAUTH_STATE_COOKIE_NAME)?.value ?? null;

  cookieStore.delete(CMU_OAUTH_STATE_COOKIE_NAME);

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

export async function completeCmuOAuthLogin(code: string, origin: string) {
  const accessToken = await exchangeCodeForAccessToken(code, getCmuOAuthCallbackUrl(origin));
  const basicInfoPayload = await fetchCmuBasicInfo(accessToken);
  const profile = extractBasicInfo(basicInfoPayload);
  const user = await upsertOauthUser(profile);

  await createSession(user.id, AUTH_PROVIDERS.cmuEntra);

  return getPostLoginPathForUser(user);
}