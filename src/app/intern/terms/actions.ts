"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostLoginPath, getPostLoginPathForUser, USER_ROLES } from "@/lib/user-management";

export type AcceptTermsState = {
  error: string;
};

export async function acceptStudentTerms(_: AcceptTermsState, formData: FormData): Promise<AcceptTermsState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (currentUser.role !== USER_ROLES.Student) {
    redirect(getPostLoginPath(currentUser.role));
  }

  if (currentUser.acceptedTermsAt) {
    redirect("/intern/profile");
  }

  if (formData.get("acceptTerms") !== "yes") {
    return {
      error: "กรุณาเลือกยอมรับข้อตกลงก่อนดำเนินการต่อ",
    };
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      acceptedTermsAt: new Date(),
    },
  });

  revalidatePath("/intern");
  revalidatePath("/intern/profile");
  revalidatePath("/intern/profile/edit");
  revalidatePath("/intern/terms");

  redirect(await getPostLoginPathForUser({
    id: currentUser.id,
    role: currentUser.role,
    acceptedTermsAt: new Date(),
  }));
}