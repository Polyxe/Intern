import { handleCmuOAuthCallback } from "@/lib/cmu-oauth-callback";

export async function GET(request: Request) {
  return handleCmuOAuthCallback(request);
}