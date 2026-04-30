import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit3 } from "lucide-react";

import { StudentProfileOverview } from "@/components/student-profile-overview";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import {
  canStudentEditApplication,
  getInternshipStatus,
  internshipApplicationSelect,
  internshipStatusMeta,
} from "@/lib/internship-application";
import { prisma } from "@/lib/prisma";
import {
  canAccessUserManagement,
  getAccountPagePath,
  getDisplayName,
  requiresStudentTermsAcceptance,
} from "@/lib/user-management";

export default async function InternProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (requiresStudentTermsAcceptance(currentUser)) {
    redirect("/intern/terms");
  }

  const canManageUsers = canAccessUserManagement(currentUser.role);

  if (canManageUsers) {
    redirect(getAccountPagePath(currentUser.role, currentUser.id));
  }

  const isStudent = currentUser.role === "Student";
  const application =
    isStudent
      ? await prisma.internshipApplication.findUnique({
          where: { userId: currentUser.id },
          select: internshipApplicationSelect,
        })
      : null;

  if (isStudent && !application) {
    redirect("/intern/application");
  }

  const applicationStatus = application ? getInternshipStatus(application) : null;
  const applicationStatusMeta = applicationStatus ? internshipStatusMeta[applicationStatus] : null;
  const canEditApplication = application ? canStudentEditApplication(application) : true;

  return (
    <main className="page-shell" data-student-flow={isStudent ? true : undefined}>
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="page-hero p-8 sm:p-10">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">

              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{getDisplayName(currentUser)}</h1>
              </div>

              {isStudent && application ? (
                <p className="text-sm text-white/75">
                  {displayActionHint(canEditApplication)}
                </p>
              ) : isStudent ? (
                <p className="text-sm text-white/75">เมื่อบันทึกฟอร์มครั้งแรก ข้อมูลทั้งหมดจะถูกรวมเข้ามาแสดงบนหน้าโปรไฟล์นี้ทันที</p>
              ) : null}
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              {applicationStatusMeta ? (
                <div className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur ${applicationStatusMeta.badgeClassName}`}>
                  {applicationStatusMeta.label}
                </div>
              ) : null}

              {isStudent ? (
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-xl bg-gradient-accent px-5 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
                >
                  <Link href={application ? (canEditApplication ? "/intern/application?edit=1" : "/intern/application") : "/intern/application"}>
                    <Edit3 className="size-4" />
                    {application ? (canEditApplication ? "แก้ไขโปรไฟล์และข้อมูลฝึกงาน" : "เปิดดูข้อมูลฝึกงาน") : "เริ่มกรอกข้อมูลฝึกงาน"}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <StudentProfileOverview
          heading={`โปรไฟล์ของ ${getDisplayName(currentUser)}`}
          user={currentUser}
          application={application}
        />
      </div>
    </main>
  );
}

function displayActionHint(canEditApplication: boolean) {
  return canEditApplication
    ? "แบบฟอร์มนี้ยังเปิดให้แก้ไขได้ และการเปลี่ยนแปลงจะสะท้อนบนโปรไฟล์ทันทีหลังบันทึก"
    : "แบบฟอร์มนี้อยู่ในสถานะแบบอ่านอย่างเดียว เพราะสถานะฝึกงานเสร็จสิ้นแล้ว";
}