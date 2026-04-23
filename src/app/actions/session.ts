"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCmuLogoutUrl } from "@/lib/cmu-oauth";
import { INTERN_BASE_PATH } from "@/lib/public-paths";
import { AUTH_PROVIDERS, clearSession, getSessionAuthProvider } from "@/lib/session";

export async function logout() {
  const authProvider = await getSessionAuthProvider();
  await clearSession();

  if (authProvider === AUTH_PROVIDERS.cmuEntra) {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const logoutUrl = getCmuLogoutUrl(host ? `${protocol}://${host}` : undefined);

    if (logoutUrl) {
      redirect(logoutUrl);
    }
  }

  redirect(INTERN_BASE_PATH);
}