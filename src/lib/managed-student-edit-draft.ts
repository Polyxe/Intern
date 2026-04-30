import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type {
  InternshipApplicationFormValues,
  InternshipApplicationWizardStep,
} from "@/lib/internship-application-form";

const MANAGED_STUDENT_EDIT_DRAFT_COOKIE_NAME = "managed_student_edit_draft";
const MANAGED_STUDENT_EDIT_DRAFT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type ManagedStudentEditDraftPayload = {
  managerUserId: string;
  targetUserId: string;
  completedStep: InternshipApplicationWizardStep;
  values: Partial<InternshipApplicationFormValues>;
};

function getDraftSecret() {
  return process.env.AUTH_SESSION_SECRET ?? process.env.DATABASE_URL ?? "intern-local-session-secret";
}

function signDraftPayload(payload: string) {
  return createHmac("sha256", getDraftSecret()).update(payload).digest("base64url");
}

function encodeDraft(payload: ManagedStudentEditDraftPayload) {
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

    return JSON.parse(serializedPayload) as ManagedStudentEditDraftPayload;
  } catch {
    return null;
  }
}

export async function getManagedStudentEditDraft(managerUserId: string, targetUserId: string) {
  const cookieValue = (await cookies()).get(MANAGED_STUDENT_EDIT_DRAFT_COOKIE_NAME)?.value;
  const draft = decodeDraft(cookieValue);

  if (!draft || draft.managerUserId !== managerUserId || draft.targetUserId !== targetUserId) {
    return null;
  }

  return draft;
}

export async function saveManagedStudentEditDraft(payload: ManagedStudentEditDraftPayload) {
  const expiresAt = new Date(Date.now() + MANAGED_STUDENT_EDIT_DRAFT_DURATION_MS);

  (await cookies()).set(MANAGED_STUDENT_EDIT_DRAFT_COOKIE_NAME, encodeDraft(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearManagedStudentEditDraft() {
  (await cookies()).delete(MANAGED_STUDENT_EDIT_DRAFT_COOKIE_NAME);
}