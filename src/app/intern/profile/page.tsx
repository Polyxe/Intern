import Link from "next/link";
import { redirect } from "next/navigation";

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
        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_22px_60px_rgba(112,90,138,0.14)] backdrop-blur sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] px-4 py-1.5 text-sm font-medium text-[color:var(--color-brand-violet-deep)] shadow-sm">
                เข้าสู่ระบบแล้ว
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {isStudent ? "โปรไฟล์นักศึกษา" : "ข้อมูลบัญชีผู้ใช้"}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                {isStudent
                  ? "โปรไฟล์นี้รวมข้อมูลส่วนตัวและข้อมูลการฝึกงานไว้ในที่เดียว โดยแบบฟอร์มฝึกงานถือเป็นข้อมูลโปรไฟล์ของนักศึกษาโดยตรง"
                  : "หน้านี้แสดงเฉพาะข้อมูลบัญชีพื้นฐานที่สร้างไว้ตั้งแต่เริ่มต้น โดยไม่แสดงแบบฟอร์มฝึกงานหรือข้อมูลนักศึกษาเพิ่มเติม"}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              {applicationStatusMeta ? (
                <div className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${applicationStatusMeta.badgeClassName}`}>
                  {applicationStatusMeta.label}
                </div>
              ) : null}

              {isStudent ? (
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(242,106,33,0.28)] hover:brightness-105"
                >
                  <Link href="/intern/application">
                    {application ? (canEditApplication ? "แก้ไขโปรไฟล์นักศึกษา" : "เปิดดูโปรไฟล์แบบอ่านอย่างเดียว") : "เริ่มกรอกโปรไฟล์นักศึกษา"}
                  </Link>
                </Button>
              ) : null}

              {isStudent && !application ? (
                <p className="text-sm leading-6 text-slate-500">เมื่อบันทึกฟอร์มครั้งแรก ข้อมูลทั้งหมดจะถูกรวมเข้ามาแสดงบนหน้าโปรไฟล์นี้ทันที</p>
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
          <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
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