import "server-only";

import { NextResponse } from "next/server";

import {
  completeGoogleOAuthLogin,
  GoogleOAuthAccountNotProvisionedError,
  isGoogleOAuthEnabled,
  verifyGoogleOAuthState,
} from "@/lib/google-oauth";

function redirectToLogin(request: Request, reason: string) {
  return NextResponse.redirect(new URL(`/intern/login?oauth=${reason}`, request.url));
}

export async function handleGoogleOAuthCallback(request: Request) {
  if (!isGoogleOAuthEnabled()) {
    return redirectToLogin(request, "google-disabled");
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return redirectToLogin(request, error === "access_denied" ? "google-cancelled" : "google-failed");
  }

  if (!code) {
    return redirectToLogin(request, "google-missing-code");
  }

  const stateIsValid = await verifyGoogleOAuthState(state);

  if (!stateIsValid) {
    return redirectToLogin(request, "google-invalid-state");
  }

  try {
    const destination = await completeGoogleOAuthLogin(code, requestUrl.origin);

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    if (error instanceof GoogleOAuthAccountNotProvisionedError) {
      return redirectToLogin(request, "google-not-provisioned");
    }

    return redirectToLogin(request, "google-failed");
  }
}