import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { internshipApplicationSelect } from "@/lib/internship-application";
import { prisma } from "@/lib/prisma";
import {
  canAccessUserManagement,
  canManagerEditManagedAccount,
  canManagerEditUser,
  canManagerViewUser,
  getDisplayName,
  roleLabels,
} from "@/lib/user-management";

import { ApplicationReviewForm } from "../../application-review-form";
import { AccountDetailsForm } from "../../account-details-form";
import { StudentDetailsForm } from "../../student-details-form";

type ManageUserEditPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function ManageUserEditPage({ params }: ManageUserEditPageProps) {
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

  const canEditStudent = canManagerEditUser(currentUser.role, managedUser.role);
  const canEditAccount = canManagerEditManagedAccount(currentUser.role, managedUser.role, { isSelf });

  if (!canEditAccount) {
    redirect(`/intern/manage-users/${userId}`);
  }

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_22px_60px_rgba(112,90,138,0.14)] backdrop-blur sm:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[rgba(142,85,183,0.1)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                Account Editing
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                แก้ไขบัญชี {getDisplayName(managedUser)}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                {canEditStudent
                  ? "หน้านี้แยกส่วนการแก้ไขข้อมูลนักศึกษาออกจากหน้าดูข้อมูล เพื่อให้จัดการข้อมูลบัญชีและแบบฟอร์มได้ชัดเจนขึ้น"
                  : "หน้านี้แสดงเฉพาะฟอร์มแก้ไขข้อมูลบัญชีพื้นฐาน โดยไม่มีชุดข้อมูลนักศึกษาหรือแบบฟอร์มฝึกงาน"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
                {roleLabels[managedUser.role]}
              </div>
              <Button
                asChild
                variant="secondary"
                className="h-11 rounded-full border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-[0_10px_24px_rgba(130,74,163,0.12)] hover:bg-[color:var(--color-surface-soft)]"
              >
                <Link href={`/intern/manage-users/${managedUser.id}`}>กลับไปหน้าดูข้อมูล</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
            {canEditStudent ? <StudentDetailsForm user={managedUser} /> : <AccountDetailsForm user={managedUser} />}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">ขอบเขตการแก้ไข</h2>
                <p className="text-sm leading-7 text-slate-600">
                  {canEditStudent
                    ? "สำหรับนักศึกษา ผู้ดูแลสามารถแก้ไขข้อมูลบัญชีและข้อมูลฝึกงานได้จากหน้านี้ พร้อมอัปเดตสถานะฝึกงานด้านข้าง"
                    : "สำหรับผู้ดูแลระบบ หน้านี้จะแสดงเฉพาะข้อมูลบัญชีพื้นฐานเท่านั้น และไม่แสดงฟิลด์ข้อมูลนักศึกษา"}
                </p>
              </div>
            </section>

            {managedUser.application && canEditStudent ? (
              <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">อนุมัติสถานะฝึกงาน</h2>
                  <p className="text-sm leading-7 text-slate-600">
                    ใช้ส่วนนี้สลับระหว่าง Pending และ On-going ส่วน Completed จะคำนวณอัตโนมัติหลังผ่านวันสิ้นสุดการฝึกงาน
                  </p>
                </div>

                <div className="mt-8">
                  <ApplicationReviewForm application={managedUser.application} userId={managedUser.id} />
                </div>
              </section>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}