import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";

import { InternshipApplicationForm } from "@/app/intern/application/application-form";
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
    <main className="page-shell" data-student-flow>
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="page-hero p-8 sm:p-10">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-end">
            <div className="space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <Briefcase className="size-3.5" />
                Internship Form
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">ฟอร์มนักศึกษาฝึกงาน</h1>
                <p className="max-w-2xl text-base leading-8 text-white/78">
                  กรอกข้อมูลส่วนตัว รายละเอียดการฝึกงาน และเอกสารประกอบ
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">สถานะการฝึกงาน</p>
                <div className="mt-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/92">
                  {statusMeta?.label ?? "ยังไม่ส่งข้อมูล"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <InternshipApplicationForm application={application} currentUser={currentUser} />
      </div>
    </main>
  );
}