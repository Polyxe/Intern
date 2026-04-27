import "server-only";

import { NextResponse } from "next/server";

import {
  CmuOAuthAccountNotProvisionedError,
  completeCmuOAuthLogin,
  isCmuOAuthEnabled,
  verifyCmuOAuthState,
} from "@/lib/cmu-oauth";

function redirectToLogin(request: Request, reason: string) {
  return NextResponse.redirect(new URL(`/intern/login?oauth=${reason}`, request.url));
}

export async function handleCmuOAuthCallback(request: Request) {
  if (!isCmuOAuthEnabled()) {
    return redirectToLogin(request, "disabled");
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return redirectToLogin(request, "cancelled");
  }

  if (!code) {
    return redirectToLogin(request, "missing-code");
  }

  const stateIsValid = await verifyCmuOAuthState(state);

  if (!stateIsValid) {
    return redirectToLogin(request, "invalid-state");
  }

  try {
    const destination = await completeCmuOAuthLogin(code, requestUrl.origin);

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    if (error instanceof CmuOAuthAccountNotProvisionedError) {
      return redirectToLogin(request, "not-provisioned");
    }

    return redirectToLogin(request, "failed");
  }
}