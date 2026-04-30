import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudentInternshipProfileHref } from "@/lib/student-profile-routing";

export default async function InternshipApplicationPage({
  searchParams,
}: {
  searchParams?: Promise<{
    edit?: string;
    step?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  const application = await prisma.internshipApplication.findUnique({
    where: { userId: currentUser.id },
    select: { id: true },
  });
  const resolvedSearchParams = (await searchParams) ?? {};
  redirect(
    getStudentInternshipProfileHref({
      edit: resolvedSearchParams.edit === "1" && Boolean(application),
      step: resolvedSearchParams.step,
    }),
  );
}