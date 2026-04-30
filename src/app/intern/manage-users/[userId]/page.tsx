import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, PencilLine } from "lucide-react";

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
  getAccountPagePath,
  getDisplayName,
  requiresManagerProfileCompletion,
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

  if (requiresManagerProfileCompletion(currentUser)) {
    redirect(getAccountPagePath(currentUser.role, currentUser.id));
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

        {/* ── Hero ── */}
        <section className="page-hero p-8 sm:p-10">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.78fr)] lg:items-center">
            <div className="space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <FileText className="size-3.5" />
                รีวิวข้อมูลบัญชี
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {getDisplayName(managedUser)}
                </h1>
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
                    className="h-11 rounded-full bg-gradient-accent px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(142,85,183,0.28)] hover:brightness-105"
                  >
                    <Link href={editHref}>
                      <PencilLine className="size-4" />
                      แก้ไขบัญชี
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">บทบาท</p>
                <div className="mt-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/92">
                  {roleLabels[managedUser.role]}
                </div>
              </div>

              {managedUser.role === "Student" ? (
                <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">สถานะฝึกงาน</p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
                        applicationStatusMeta?.headerBadgeClassName ?? "border-white/30 bg-white text-slate-700"
                      }`}
                    >
                      {applicationStatusMeta?.label ?? "ยังไม่มีแบบฟอร์ม"}
                    </span>
                  </div>
                </div>
              ) : null}

              {canReviewApplication && managedUser.application ? (
                <div className="sm:col-span-2 lg:col-span-1">
                  <ApplicationReviewForm application={managedUser.application} userId={managedUser.id} layout="header" />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── Account snapshot ── */}
        <section className="space-y-6">
          <div className="card-surface p-7 sm:p-8">
            

            <div className="mt-5">
              {managedUser.role === "Student" ? (
                <StudentProfileOverview
                  heading={`โปรไฟล์ของ ${getDisplayName(managedUser)}`}
                  user={managedUser}
                  application={managedUser.application}
                />
              ) : (
                <AccountProfileOverview
                  heading={`บัญชีของ ${getDisplayName(managedUser)}`}
                  user={managedUser}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
