import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit3, User } from "lucide-react";

import { AccountProfileOverview } from "@/components/account-profile-overview";
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
import { canAccessUserManagement, getDisplayName, requiresStudentTermsAcceptance } from "@/lib/user-management";

export default async function InternProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (requiresStudentTermsAcceptance(currentUser)) {
    redirect("/intern/terms");
  }

  const canManageUsers = canAccessUserManagement(currentUser.role);
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
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {isStudent ? getDisplayName(currentUser) : "ข้อมูลบัญชีผู้ใช้"}
                </h1>
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
                  <Link href="/intern/application">
                    <Edit3 className="size-4" />
                    {application ? (canEditApplication ? "แก้ไขข้อมูลฝึกงาน" : "เปิดดูข้อมูลฝึกงาน") : "เริ่มกรอกข้อมูลฝึกงาน"}
                  </Link>
                </Button>
              ) : canManageUsers ? (
                <div className="rounded-2xl border border-white/16 bg-white/10 px-4 py-3 text-sm leading-6 text-white/78 backdrop-blur">
                  ใช้แถบนำทางด้านบนเพื่อเปิดหน้า `จัดการผู้ใช้` และกลับมาที่บัญชีของคุณได้ตลอดเวลา
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {isStudent ? (
          <StudentProfileOverview
            heading={`โปรไฟล์ของ ${getDisplayName(currentUser)}`}
            description="ระบบรวมข้อมูลส่วนตัว ข้อมูลการฝึกงาน และไฟล์แนบทั้งหมดไว้ในมุมมองเดียว เพื่อให้ตรวจสอบได้ง่ายทั้งสำหรับนักศึกษาและผู้ดูแล"
            user={currentUser}
            application={application}
          />
        ) : (
          <AccountProfileOverview
            heading={`บัญชีของ ${getDisplayName(currentUser)}`}
            description="ข้อมูลในหน้านี้เป็นข้อมูลบัญชีพื้นฐานที่ถูกสร้างไว้ตั้งแต่ต้นสำหรับการใช้งานระบบจัดการบัญชี"
            user={currentUser}
          />
        )}

        {canManageUsers ? (
          <section className="card-surface p-8 sm:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full bg-[color:var(--color-brand-surface)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                  User Management
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">แดชบอร์ดจัดการบัญชีผู้ใช้</h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  เปิดหน้าจัดการเพื่อสร้างบัญชีใหม่ ดูรายการผู้ใช้ที่เข้าถึงได้ และเปิดรายละเอียดรายบัญชีสำหรับการจัดการต่อ
                </p>
              </div>

              <div className="rounded-2xl border border-[color:var(--color-shell-border)] bg-white/70 px-4 py-3 text-sm leading-6 text-slate-600">
                หน้า `จัดการผู้ใช้` ถูกผูกไว้ใน navbar แล้ว และจะแสดงสถานะ active เมื่อคุณเข้าไปทำงานต่อ
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function displayActionHint(canEditApplication: boolean) {
  return canEditApplication
    ? "แบบฟอร์มนี้ยังเปิดให้แก้ไขได้ และการเปลี่ยนแปลงจะสะท้อนบนโปรไฟล์ทันทีหลังบันทึก"
    : "แบบฟอร์มนี้อยู่ในสถานะแบบอ่านอย่างเดียว เพราะสถานะฝึกงานเสร็จสิ้นแล้ว";
}