import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import {
  MANAGE_USER_ROLE_FILTERS,
  STUDENT_STATUS_FILTERS,
  getManageUsersEmptyStateMessage,
  getStudentStatusFilterForApplication,
  studentStatusFilterMeta,
  studentStatusFilterOrder,
  wasEditedAfterApproval,
} from "@/lib/internship-application";
import {
  appendReturnTo,
  getCanonicalManageUsersHref,
  resolveManageUsersFilters,
} from "@/lib/manage-users-routing";
import { prisma } from "@/lib/prisma";
import {
  USER_ROLES,
  canAccessUserManagement,
  getDisplayName,
  roleLabels,
} from "@/lib/user-management";

type ManageUsersDashboardPageProps = {
  searchParams?: Promise<{
    role?: string;
    studentStatus?: string;
  }>;
};

export default async function ManageUsersDashboardPage({ searchParams }: ManageUsersDashboardPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (!canAccessUserManagement(currentUser.role)) {
    redirect("/intern/profile");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = resolveManageUsersFilters(currentUser.role, resolvedSearchParams);

  if (filters.shouldRedirect) {
    redirect(filters.canonicalHref);
  }

  const users = await prisma.user.findMany({
    where:
      currentUser.role === USER_ROLES.Admin
        ? { role: USER_ROLES.Student }
        : currentUser.role === USER_ROLES.Superadmin
          ? { id: { not: currentUser.id } }
          : undefined,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      firstname: true,
      lastname: true,
      email: true,
      role: true,
      createdAt: true,
      application: {
        select: {
          status: true,
          editedAfterApprovalAt: true,
        },
      },
    },
  });

  const allStudentUsers = users.filter((user) => user.role === USER_ROLES.Student);
  const allManagerUsers = users.filter((user) => user.role !== USER_ROLES.Student);
  const studentCounts = Object.fromEntries(
    studentStatusFilterOrder.map((statusFilter) => [
      statusFilter,
      statusFilter === STUDENT_STATUS_FILTERS.All
        ? allStudentUsers.length
        : allStudentUsers.filter((user) => getStudentStatusFilterForApplication(user.application) === statusFilter)
            .length,
    ]),
  ) as Record<(typeof studentStatusFilterOrder)[number], number>;
  const reviewFlagCount = allStudentUsers.filter((user) => wasEditedAfterApproval(user.application)).length;
  const filteredUsers =
    filters.role === MANAGE_USER_ROLE_FILTERS.Admin
      ? allManagerUsers
      : filters.studentStatus === STUDENT_STATUS_FILTERS.All
        ? allStudentUsers
        : allStudentUsers.filter(
            (user) => getStudentStatusFilterForApplication(user.application) === filters.studentStatus,
          );
  const sortedUsers = [...filteredUsers].sort((left, right) => {
    const rightNeedsReview = Number(wasEditedAfterApproval(right.application));
    const leftNeedsReview = Number(wasEditedAfterApproval(left.application));

    if (rightNeedsReview !== leftNeedsReview) {
      return rightNeedsReview - leftNeedsReview;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="page-hero px-8 py-8 sm:px-10 sm:py-10">
          <div className="relative">
            <div className="space-y-5">

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  พื้นที่จัดการบัญชีสำหรับทีมดูแลระบบ
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="card-surface p-8 sm:p-9">
          <div className="flex flex-col gap-6 border-b border-[color:var(--color-shell-border)] pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(142,85,183,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
                  Active Accounts
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">บริหารบัญชีผู้ใช้</h2>
                </div>
              </div>
            </div>

            {currentUser.role === USER_ROLES.Superadmin ? (
              <div className="flex flex-wrap gap-3">
                <RoleFilterLink
                  href={getCanonicalManageUsersHref(currentUser.role, {
                    role: MANAGE_USER_ROLE_FILTERS.Student,
                    studentStatus: filters.studentStatus,
                  })}
                  label="นักศึกษา"
                  active={filters.role === MANAGE_USER_ROLE_FILTERS.Student}
                />
                <RoleFilterLink
                  href={getCanonicalManageUsersHref(currentUser.role, {
                    role: MANAGE_USER_ROLE_FILTERS.Admin,
                    studentStatus: filters.studentStatus,
                  })}
                  label="ผู้ดูแลระบบ"
                  active={filters.role === MANAGE_USER_ROLE_FILTERS.Admin}
                />
              </div>
            ) : null}

            {filters.role === MANAGE_USER_ROLE_FILTERS.Student ? (
              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-6">
                  {studentStatusFilterOrder.map((statusFilter) => (
                    <Link
                      key={statusFilter}
                      href={getCanonicalManageUsersHref(currentUser.role, {
                        role: MANAGE_USER_ROLE_FILTERS.Student,
                        studentStatus: statusFilter,
                      })}
                      scroll={false}
                      aria-current={filters.studentStatus === statusFilter ? "page" : undefined}
                      className={`rounded-[1.45rem] border px-4 py-4 text-left shadow-sm transition ${
                        filters.studentStatus === statusFilter
                          ? "border-[color:var(--color-brand-violet-deep)] bg-[color:var(--color-brand-violet-deep)] text-white shadow-nav-pill"
                          : studentStatusFilterMeta[statusFilter].pillClassName
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">สถานะ</p>
                      <p className="mt-2 text-sm font-semibold">{studentStatusFilterMeta[statusFilter].label}</p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight">{studentCounts[statusFilter]}</p>
                    </Link>
                  ))}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800">
                  ต้องติดตาม {reviewFlagCount} บัญชี
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                ผู้ดูแลระบบทั้งหมด {allManagerUsers.length} บัญชี
              </div>
            )}
          </div>

          {sortedUsers.length ? (
            <div className="mt-6 space-y-4">
              {sortedUsers.map((user) => {
                const statusFilter = getStudentStatusFilterForApplication(user.application);
                const detailHref = appendReturnTo(`/intern/manage-users/${user.id}`, filters.canonicalHref);

                return (
                  <Link
                    key={user.id}
                    href={detailHref}
                    className="group block rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,244,251,0.92))] p-5 shadow-[0_10px_30px_rgba(112,90,138,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(142,85,183,0.46)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,236,250,0.98))] hover:shadow-[0_20px_38px_rgba(112,90,138,0.14)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {filters.role === MANAGE_USER_ROLE_FILTERS.Admin ? (
                            <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
                              {roleLabels[user.role]}
                            </span>
                          ) : (
                            <span
                              className={`rounded-full border px-3 py-1 font-semibold shadow-sm transition-colors ${studentStatusFilterMeta[statusFilter].badgeClassName}`}
                            >
                              {studentStatusFilterMeta[statusFilter].label}
                            </span>
                          )}
                          {wasEditedAfterApproval(user.application) ? (
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-semibold text-orange-900 shadow-sm transition-colors">
                              มีการแก้ไขหลังอนุมัติ
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-950 transition">
                            {getDisplayName(user)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-500 shadow-sm">
                        เปิดรายละเอียด
                        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                      สร้างเมื่อ {user.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-[color:var(--color-shell-border)] bg-white/70 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-slate-900">{getManageUsersEmptyStateMessage(filters)}</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                ลองเปลี่ยนตัวกรองด้านบน หรือสร้างบัญชีใหม่จากปุ่มสร้างบัญชีบนแถบนำทาง
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RoleFilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[color:var(--color-brand-violet-deep)] bg-[color:var(--color-brand-violet-deep)] text-white shadow-nav-pill"
          : "border-[color:var(--color-shell-border)] bg-white text-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-surface-soft)]"
      }`}
    >
      {label}
    </Link>
  );
}