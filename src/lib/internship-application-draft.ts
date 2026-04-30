import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type {
  InternshipApplicationFormValues,
  InternshipApplicationWizardStep,
} from "@/lib/internship-application-form";

const STUDENT_APPLICATION_DRAFT_COOKIE_NAME = "intern_application_draft";
const STUDENT_APPLICATION_DRAFT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type StudentApplicationDraftPayload = {
  userId: string;
  completedStep: InternshipApplicationWizardStep;
  values: InternshipApplicationFormValues;
};

function getDraftSecret() {
  return process.env.AUTH_SESSION_SECRET ?? process.env.DATABASE_URL ?? "intern-local-session-secret";
}

function signDraftPayload(payload: string) {
  return createHmac("sha256", getDraftSecret()).update(payload).digest("base64url");
}

function encodeDraft(payload: StudentApplicationDraftPayload) {
  const serializedPayload = JSON.stringify(payload);
  const encodedPayload = Buffer.from(serializedPayload).toString("base64url");

  return `${encodedPayload}.${signDraftPayload(serializedPayload)}`;
}

function decodeDraft(cookieValue?: string | null) {
  if (!cookieValue) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const serializedPayload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const expectedSignature = Buffer.from(signDraftPayload(serializedPayload));
    const providedSignature = Buffer.from(signature);

    if (expectedSignature.length !== providedSignature.length) {
      return null;
    }

    if (!timingSafeEqual(expectedSignature, providedSignature)) {
      return null;
    }

    return JSON.parse(serializedPayload) as StudentApplicationDraftPayload;
  } catch {
    return null;
  }
}

export async function getStudentApplicationDraft(userId: string) {
  const cookieValue = (await cookies()).get(STUDENT_APPLICATION_DRAFT_COOKIE_NAME)?.value;
  const draft = decodeDraft(cookieValue);

  if (!draft || draft.userId !== userId) {
    return null;
  }

  return draft;
}

export async function saveStudentApplicationDraft(payload: StudentApplicationDraftPayload) {
  const expiresAt = new Date(Date.now() + STUDENT_APPLICATION_DRAFT_DURATION_MS);

  (await cookies()).set(STUDENT_APPLICATION_DRAFT_COOKIE_NAME, encodeDraft(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearStudentApplicationDraft() {
  (await cookies()).delete(STUDENT_APPLICATION_DRAFT_COOKIE_NAME);
}