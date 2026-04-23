import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AccountProfileOverview } from "@/components/account-profile-overview";
import { StudentProfileOverview } from "@/components/student-profile-overview";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { internshipApplicationSelect } from "@/lib/internship-application";
import { prisma } from "@/lib/prisma";
import {
  canAccessUserManagement,
  canManagerEditManagedAccount,
  canManagerViewUser,
  getDisplayName,
  roleLabels,
} from "@/lib/user-management";

type ManageUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function ManageUserDetailPage({ params }: ManageUserDetailPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (!canAccessUserManagement(currentUser.role)) {
    redirect("/intern/profile");
  }

  const { userId } = await params;
  const managedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      title: true,
      firstname: true,
      lastname: true,
      sex: true,
      birthDate: true,
      address: true,
      institution: true,
      email: true,
      role: true,
      profileImagePath: true,
      application: {
        select: internshipApplicationSelect,
      },
    },
  });
  const isSelf = managedUser?.id === currentUser.id;

  if (!managedUser || !canManagerViewUser(currentUser.role, managedUser.role, { isSelf })) {
    notFound();
  }

  const canEditAccount = canManagerEditManagedAccount(currentUser.role, managedUser.role, { isSelf });

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_22px_60px_rgba(112,90,138,0.14)] backdrop-blur sm:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[rgba(142,85,183,0.1)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                Account Details
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {getDisplayName(managedUser)}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                {managedUser.role === "Student"
                  ? "เปิดดูข้อมูลบัญชีผู้ใช้และข้อมูลโปรไฟล์นักศึกษาแบบอ่านอย่างเดียวจากหน้านี้"
                  : "เปิดดูข้อมูลบัญชีพื้นฐานที่สร้างไว้ตั้งแต่เริ่มต้น โดยไม่มีข้อมูลฟอร์มนักศึกษาเพิ่มเติม"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canEditAccount ? (
                <Button
                  asChild
                  className="h-11 rounded-full bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(242,106,33,0.24)] hover:brightness-105"
                >
                  <Link href={`/intern/manage-users/${managedUser.id}/edit`}>แก้ไขบัญชี</Link>
                </Button>
              ) : null}

              <Button
                asChild
                variant="secondary"
                className="h-11 rounded-full border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-[0_10px_24px_rgba(130,74,163,0.12)] hover:bg-[color:var(--color-surface-soft)]"
              >
                <Link href="/intern/manage-users">กลับไปแดชบอร์ด</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
            <div className="flex flex-col gap-4 border-b border-[color:var(--color-shell-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">สรุปข้อมูลบัญชี</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">ดูข้อมูลแบบอ่านอย่างเดียวแยกจากหน้าแก้ไข เพื่อให้จัดวางข้อมูลแต่ละบทบาทได้ชัดเจนขึ้น</p>
              </div>
              <div className="inline-flex w-fit items-center rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
                {roleLabels[managedUser.role]}
              </div>
            </div>

            <div className="mt-6">
              <AccountProfileOverview
                heading={`บัญชีของ ${getDisplayName(managedUser)}`}
                description="ข้อมูลส่วนนี้แสดงรายละเอียดบัญชีพื้นฐานที่ถูกสร้างไว้ตั้งแต่เริ่มต้น"
                user={managedUser}
              />
            </div>
          </div>

          {managedUser.role === "Student" ? (
            <div className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
              <StudentProfileOverview
                heading="ข้อมูลโปรไฟล์นักศึกษา"
                description="ผู้ดูแลสามารถดูข้อมูลส่วนตัว ข้อมูลฝึกงาน และไฟล์แนบทั้งหมดของนักศึกษาได้จากมุมมองเดียว"
                user={managedUser}
                application={managedUser.application}
              />
            </div>
          ) : null}

          {!canEditAccount ? (
            <div className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 text-sm leading-7 text-slate-600 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
              บัญชีประเภทนี้ยังไม่เปิดให้แก้ไขจากแดชบอร์ดของคุณ
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}