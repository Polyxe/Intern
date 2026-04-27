import { NextResponse } from "next/server";

import { createGoogleOAuthAuthorizationUrl, isGoogleOAuthEnabled } from "@/lib/google-oauth";

export async function GET(request: Request) {
  if (!isGoogleOAuthEnabled()) {
    return NextResponse.redirect(new URL("/intern/login?oauth=google-disabled", request.url));
  }

  try {
    const requestUrl = new URL(request.url);
    const authorizationUrl = await createGoogleOAuthAuthorizationUrl(requestUrl.origin);

    return NextResponse.redirect(authorizationUrl);
  } catch {
    return NextResponse.redirect(new URL("/intern/login?oauth=google-configuration", request.url));
  }
}