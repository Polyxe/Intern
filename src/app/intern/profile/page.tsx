import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Edit3, Sparkles, User } from "lucide-react";

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
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-brand p-8 text-white shadow-glow sm:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay [background:radial-gradient(circle_at_15%_20%,white,transparent_50%),radial-gradient(circle_at_85%_80%,white,transparent_45%)]" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase ring-1 ring-white/25 backdrop-blur">
                <User className="size-3.5" />
                {isStudent ? "Intern Profile" : "Account Overview"}
              </span>

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
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/intern/application"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
                  >
                    <Briefcase className="size-4" />
                    ดูฟอร์มฝึกงาน
                  </Link>

                  <Button
                    asChild
                    size="lg"
                    className="h-11 rounded-xl bg-gradient-accent px-5 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
                  >
                    <Link href="/intern/application">
                      <Edit3 className="size-4" />
                      {application ? (canEditApplication ? "แก้ไขโปรไฟล์" : "เปิดดูแบบอ่านอย่างเดียว") : "เริ่มกรอกโปรไฟล์"}
                    </Link>
                  </Button>
                </div>
              ) : canManageUsers ? (
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-xl bg-gradient-accent px-5 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
                >
                  <Link href="/intern/manage-users">
                    <Sparkles className="size-4" />
                    ไปยังแดชบอร์ดจัดการผู้ใช้
                  </Link>
                </Button>
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
          <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-elegant backdrop-blur sm:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full bg-[rgba(142,85,183,0.1)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                  User Management
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">แดชบอร์ดจัดการบัญชีผู้ใช้</h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  เปิดหน้าจัดการเพื่อสร้างบัญชีใหม่ ดูรายการผู้ใช้ที่เข้าถึงได้ และเปิดรายละเอียดรายบัญชีสำหรับการจัดการต่อ
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(242,106,33,0.28)] hover:brightness-105"
              >
                <Link href="/intern/manage-users">ไปยังแดชบอร์ด</Link>
              </Button>
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