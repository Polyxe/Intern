import { redirect } from "next/navigation";
import { Briefcase, Sparkles, User } from "lucide-react";

import { InternshipApplicationForm } from "@/app/intern/application/application-form";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth";
import {
  canStudentEditApplication,
  getInternshipStatus,
  internshipApplicationSelect,
  internshipStatusMeta,
} from "@/lib/internship-application";
import { prisma } from "@/lib/prisma";
import { getPostLoginPath, requiresStudentTermsAcceptance, USER_ROLES } from "@/lib/user-management";

export default async function InternshipApplicationPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (currentUser.role !== USER_ROLES.Student) {
    redirect(getPostLoginPath(currentUser.role));
  }

  if (requiresStudentTermsAcceptance(currentUser)) {
    redirect("/intern/terms");
  }

  const application = await prisma.internshipApplication.findUnique({
    where: { userId: currentUser.id },
    select: internshipApplicationSelect,
  });

  const status = application ? getInternshipStatus(application) : null;
  const statusMeta = status ? internshipStatusMeta[status] : null;
  const canEdit = application ? canStudentEditApplication(application) : true;

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-6">
          <div className="text-center">
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              <span className="text-gradient-brand">ฟอร์มนักศึกษาฝึกงาน</span>
            </h1>
          </div>
        </section>

        <InternshipApplicationForm application={application} currentUser={currentUser} />
      </div>
    </main>
  );
}