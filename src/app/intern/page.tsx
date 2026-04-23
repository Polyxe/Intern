import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getPostLoginPath } from "@/lib/user-management";

export default async function InternEntryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  redirect(getPostLoginPath(currentUser.role));
}