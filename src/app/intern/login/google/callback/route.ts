import { handleGoogleOAuthCallback } from "@/lib/google-oauth-callback";

export async function GET(request: Request) {
  return handleGoogleOAuthCallback(request);
}