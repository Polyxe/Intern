import { NextResponse } from "next/server";

import { createCmuOAuthAuthorizationUrl, isCmuOAuthEnabled } from "@/lib/cmu-oauth";

export async function GET(request: Request) {
  if (!isCmuOAuthEnabled()) {
    return NextResponse.redirect(new URL("/intern/login?oauth=disabled", request.url));
  }

  try {
    const requestUrl = new URL(request.url);
    const authorizationUrl = await createCmuOAuthAuthorizationUrl(requestUrl.origin);

    return NextResponse.redirect(authorizationUrl);
  } catch {
    return NextResponse.redirect(new URL("/intern/login?oauth=configuration", request.url));
  }
}