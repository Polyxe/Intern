import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getPostLoginPathForUser } from "@/lib/user-management";

export default async function InternEntryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  redirect(await getPostLoginPathForUser(currentUser));
}