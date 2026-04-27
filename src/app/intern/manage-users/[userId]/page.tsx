import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, PencilLine, ShieldCheck } from "lucide-react";

import { AccountProfileOverview } from "@/components/account-profile-overview";
import { ClearSearchParamOnce } from "@/components/clear-search-param-once";
import { StudentProfileOverview } from "@/components/student-profile-overview";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import {
  getInternshipStatus,
  internshipApplicationSelect,
  internshipStatusMeta,
} from "@/lib/internship-application";
import {
  appendReturnTo,
  getCanonicalManageUsersHref,
  getValidatedManageUsersReturnTo,
} from "@/lib/manage-users-routing";
import { prisma } from "@/lib/prisma";
import {
  canAccessUserManagement,
  canManagerEditUser,
  canManagerEditManagedAccount,
  canManagerViewUser,
  getDisplayName,
  roleLabels,
} from "@/lib/user-management";

import { ApplicationReviewForm } from "../application-review-form";

type ManageUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    returnTo?: string;
  }>;
};

export default async function ManageUserDetailPage({ params, searchParams }: ManageUserDetailPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (!canAccessUserManagement(currentUser.role)) {
    redirect("/intern/profile");
  }

  const { userId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const created = resolvedSearchParams.created === "1";
  const returnTo = getValidatedManageUsersReturnTo(resolvedSearchParams.returnTo);
  const backToListHref = returnTo ?? getCanonicalManageUsersHref(currentUser.role);
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
  const canReviewApplication =
    Boolean(managedUser.application) && canManagerEditUser(currentUser.role, managedUser.role);
  const editHref = appendReturnTo(`/intern/manage-users/${managedUser.id}/edit`, returnTo);
  const applicationStatus = managedUser.application ? getInternshipStatus(managedUser.application) : null;
  const applicationStatusMeta = applicationStatus ? internshipStatusMeta[applicationStatus] : null;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl space-y-8">
        {created ? <ClearSearchParamOnce param="created" /> : null}

        {created ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
            สร้างบัญชีผู้ใช้เรียบร้อยแล้ว
          </div>
        ) : null}

        <section className="page-hero p-8 sm:p-10">
          <div className="relative flex flex-col gap-6">
            <div className="space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <FileText className="size-3.5" />
                Account Review
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {getDisplayName(managedUser)}
                </h1>
              </div>

            </div>

            <div className="flex flex-col gap-4 rounded-[1.8rem] border border-white/16 bg-white/10 p-5 backdrop-blur xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/92">
                    {roleLabels[managedUser.role]}
                  </div>
                  <div
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
                      applicationStatusMeta?.headerBadgeClassName ?? "border-white/30 bg-white text-slate-700"
                    }`}
                  >
                    {applicationStatusMeta?.label ?? "ยังไม่มีแบบฟอร์ม"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    variant="secondary"
                    className="h-11 rounded-full border border-white/20 bg-white/12 px-5 text-sm font-semibold text-white shadow-none backdrop-blur hover:bg-white/18"
                  >
                    <Link href={backToListHref}>
                      <ArrowLeft className="size-4" />
                      กลับไปหน้ารายการ
                    </Link>
                  </Button>

                  {canEditAccount ? (
                    <Button
                      asChild
                      className="h-11 rounded-full bg-[linear-gradient(135deg,_#a464d4,_#8e55b7)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(142,85,183,0.28)] hover:brightness-105"
                    >
                      <Link href={editHref}>
                        <PencilLine className="size-4" />
                        แก้ไขบัญชี
                      </Link>
                    </Button>
                  ) : (
                    <div className="rounded-2xl border border-white/16 bg-white/10 px-4 py-3 text-sm leading-6 text-white/78 backdrop-blur">
                      บัญชีประเภทนี้ยังไม่เปิดให้แก้ไขจากแดชบอร์ดของคุณ
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full xl:max-w-[34rem]">
                {canReviewApplication && managedUser.application ? (
                  <ApplicationReviewForm application={managedUser.application} userId={managedUser.id} layout="header" />
                ) : (
                  <div className="rounded-[1.35rem] border border-white/18 bg-white/8 p-4 text-sm leading-7 text-white/78 backdrop-blur">
                    {managedUser.application
                      ? "บัญชีนี้เปิดให้ดูข้อมูลได้ แต่บทบาทของคุณยังไม่สามารถเปลี่ยนสถานะฝึกงานได้"
                      : "นักศึกษายังไม่มีแบบฟอร์มฝึกงานในระบบ จึงยังไม่แสดงปุ่มอนุมัติหรือปฏิเสธ"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="card-surface p-8 sm:p-10">
            <div className="flex flex-col gap-4 border-b border-[color:var(--color-shell-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <span className="section-kicker bg-gradient-brand-soft ring-0">
                  <ShieldCheck className="size-3.5" />
                  Account Snapshot
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">สรุปข้อมูลบัญชี</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                    ดูข้อมูลแบบอ่านอย่างเดียวแยกจากหน้าแก้ไข เพื่อให้ตรวจสอบข้อมูลพื้นฐานก่อนลงมือแก้ไขหรือเปลี่ยนสถานะได้ชัดเจนขึ้น
                  </p>
                </div>
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
            <div className="card-surface p-8 sm:p-10">
              <StudentProfileOverview
                heading="ข้อมูลโปรไฟล์นักศึกษา"
                description="ผู้ดูแลสามารถดูข้อมูลส่วนตัว ข้อมูลฝึกงาน และไฟล์แนบทั้งหมดของนักศึกษาได้จากมุมมองเดียว"
                user={managedUser}
                application={managedUser.application}
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}