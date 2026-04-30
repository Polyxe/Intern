import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Trash2, Users } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import {
  MANAGE_USER_ROLE_FILTERS,
  STUDENT_STATUS_FILTERS,
  getManageUsersEmptyStateMessage,
  getStudentStatusFilterForApplication,
  matchesStudentStatusFilter,
  studentStatusFilterMeta,
  studentStatusFilterOrder,
  wasEditedAfterApproval,
} from "@/lib/internship-application";
import {
  appendReturnTo,
  getCanonicalManageUsersHref,
  getManageUsersSearchFieldsForRole,
  MANAGE_USERS_SEARCH_FIELDS,
  resolveManageUsersFilters,
  type ManageUsersSearchField,
} from "@/lib/manage-users-routing";
import { prisma } from "@/lib/prisma";
import {
  USER_ROLES,
  canAccessUserManagement,
  canManagerDeleteManagedAccount,
  getAccountPagePath,
  getDisplayName,
  requiresManagerProfileCompletion,
  roleLabels,
} from "@/lib/user-management";
import { deleteManagedAccountFromForm } from "./actions";

import { ManageUsersSearchControls } from "./manage-users-search-controls";

type ManageUsersDashboardPageProps = {
  searchParams?: Promise<{
    role?: string;
    studentStatus?: string;
    query?: string;
    page?: string;
    fields?: string;
  }>;
};

const MANAGE_USERS_RESULTS_PER_PAGE = 5;

const searchControlClassName =
  "h-12 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white/95 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]";

const manageUsersSearchSections = [
  {
    label: "ข้อมูลบัญชี",
    filters: [
      { key: MANAGE_USERS_SEARCH_FIELDS.Name, label: "ชื่อผู้ใช้" },
      { key: MANAGE_USERS_SEARCH_FIELDS.Email, label: "อีเมล" },
      { key: MANAGE_USERS_SEARCH_FIELDS.Institution, label: "สถาบัน" },
    ],
  },
  {
    label: "ข้อมูลการศึกษา",
    filters: [
      { key: MANAGE_USERS_SEARCH_FIELDS.Faculty, label: "คณะ" },
      { key: MANAGE_USERS_SEARCH_FIELDS.YearLevel, label: "ชั้นปี" },
      { key: MANAGE_USERS_SEARCH_FIELDS.GuidingProfessor, label: "อาจารย์นิเทศ" },
    ],
  },
  {
    label: "ข้อมูลฝึกงาน",
    filters: [
      { key: MANAGE_USERS_SEARCH_FIELDS.InternshipPosition, label: "ตำแหน่งฝึกงาน" },
      { key: MANAGE_USERS_SEARCH_FIELDS.Company, label: "บริษัท / หน่วยงาน" },
      { key: MANAGE_USERS_SEARCH_FIELDS.CompanySupervisor, label: "ผู้ดูแลในสถานประกอบการ" },
    ],
  },
] as const;

type ManageUsersSearchableUser = {
  id: string;
  title: string;
  firstname: string;
  lastname: string;
  email: string;
  institution: string | null;
  application: {
    faculty: string;
    yearLevel: string;
    internshipPosition: string;
    companyName: string;
    guidingProfessorFirstname: string | null;
    guidingProfessorLastname: string | null;
    companySupervisorName: string;
  } | null;
};

type ManageUsersSearchEntry = {
  key: ManageUsersSearchField;
  label: string;
  value: string;
};

export default async function ManageUsersDashboardPage({ searchParams }: ManageUsersDashboardPageProps) {
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
      institution: true,
      email: true,
      role: true,
      createdAt: true,
      application: {
        select: {
          status: true,
          editedAfterApprovalAt: true,
          faculty: true,
          yearLevel: true,
          internshipPosition: true,
          companyName: true,
          guidingProfessorFirstname: true,
          guidingProfessorLastname: true,
          companySupervisorName: true,
        },
      },
    },
  });

  const allStudentUsers = users.filter((user) => user.role === USER_ROLES.Student);
  const allManagerUsers = users.filter((user) => user.role !== USER_ROLES.Student);
  const studentCounts = Object.fromEntries(
    studentStatusFilterOrder.map((statusFilter) => [
      statusFilter,
      allStudentUsers.filter((user) => matchesStudentStatusFilter(user.application, statusFilter)).length,
    ]),
  ) as Record<(typeof studentStatusFilterOrder)[number], number>;
  const visibleStudentStatusFilters = studentStatusFilterOrder.filter(
    (statusFilter) =>
      statusFilter !== STUDENT_STATUS_FILTERS.NeedsFollowUp || studentCounts[STUDENT_STATUS_FILTERS.NeedsFollowUp] > 0,
  );
  const filteredUsers =
    filters.role === MANAGE_USER_ROLE_FILTERS.Admin
      ? allManagerUsers
      : allStudentUsers.filter((user) => matchesStudentStatusFilter(user.application, filters.studentStatus));
  const queryTokens = getManageUsersSearchTokens(filters.query);
  const searchedUsers = queryTokens.length
    ? filteredUsers.filter((user) => matchesManageUsersSearch(user, filters.role, filters.selectedFields, queryTokens))
    : filteredUsers;
  const sortedUsers = [...searchedUsers].sort((left, right) => {
    const rightNeedsReview = Number(wasEditedAfterApproval(right.application));
    const leftNeedsReview = Number(wasEditedAfterApproval(left.application));

    if (rightNeedsReview !== leftNeedsReview) {
      return rightNeedsReview - leftNeedsReview;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / MANAGE_USERS_RESULTS_PER_PAGE));
  const currentPage = Math.min(filters.page, totalPages);

  if (filters.page !== currentPage) {
    redirect(
      getCanonicalManageUsersHref(currentUser.role, {
        role: filters.role,
        studentStatus: filters.studentStatus,
        query: filters.query,
        page: currentPage,
        fields: filters.selectedFields,
      }),
    );
  }

  const pageStartIndex = (currentPage - 1) * MANAGE_USERS_RESULTS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(pageStartIndex, pageStartIndex + MANAGE_USERS_RESULTS_PER_PAGE);
  const clearSearchHref = getCanonicalManageUsersHref(currentUser.role, {
    role: filters.role,
    studentStatus: filters.studentStatus,
  });
  const allSearchFields = getManageUsersSearchFieldsForRole(filters.role);
  const searchFieldSections =
    filters.role === MANAGE_USER_ROLE_FILTERS.Admin
      ? manageUsersSearchSections
          .map((section) => ({
            ...section,
            filters: section.filters.filter((filter) => allSearchFields.includes(filter.key)),
          }))
          .filter((section) => section.filters.length > 0)
      : manageUsersSearchSections;
  const paginationItems = getManageUsersPaginationItems(currentPage, totalPages);

  return (
    <main className="page-shell">
      <div className="page-grid">
        {/* ── Hero ── */}
        <section className="page-hero px-8 py-8 sm:px-10 sm:py-10">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.78fr)] lg:items-end">
            <div className="space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <Users className="size-3.5" />
                User Management
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  พื้นที่จัดการบัญชีสำหรับทีมดูแลระบบ
                </h1>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">นักศึกษา</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{allStudentUsers.length}</p>
                <p className="mt-1 text-xs text-white/58">บัญชีทั้งหมด</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">ผู้ดูแลระบบ</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{allManagerUsers.length}</p>
                <p className="mt-1 text-xs text-white/58">บัญชีทั้งหมด</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main card ── */}
        <section className="card-surface p-8 sm:p-9">
          {/* Card header */}
          <div className="flex flex-col gap-4 border-b border-[color:var(--color-shell-border)] pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="section-kicker bg-gradient-brand-soft ring-0">Active Accounts</span>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">บริหารบัญชีผู้ใช้</h2>
              </div>
              {filters.query ? (
                <div className="inline-flex items-center gap-2 self-start rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-medium text-[color:var(--color-brand-violet-deep)]">
                  พบ {sortedUsers.length} รายการจาก {filters.selectedFields.length} ตัวกรองที่เลือก
                </div>
              ) : null}
            </div>

            {/* Unified filter row */}
            <div className="flex flex-col gap-3">
              {currentUser.role === USER_ROLES.Superadmin ? (
                <div className="flex flex-wrap items-center gap-2">
                  <FilterPill
                    href={getCanonicalManageUsersHref(currentUser.role, {
                      role: MANAGE_USER_ROLE_FILTERS.Student,
                      studentStatus: filters.studentStatus,
                      query: filters.query,
                      fields: filters.selectedFields,
                    })}
                    label={`นักศึกษา ${allStudentUsers.length}`}
                    active={filters.role === MANAGE_USER_ROLE_FILTERS.Student}
                  />
                  <FilterPill
                    href={getCanonicalManageUsersHref(currentUser.role, {
                      role: MANAGE_USER_ROLE_FILTERS.Admin,
                      studentStatus: filters.studentStatus,
                      query: filters.query,
                      fields: filters.selectedFields,
                    })}
                    label={`ผู้ดูแลระบบ ${allManagerUsers.length}`}
                    active={filters.role === MANAGE_USER_ROLE_FILTERS.Admin}
                  />
                </div>
              ) : null}

              {filters.role === MANAGE_USER_ROLE_FILTERS.Student
                ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {visibleStudentStatusFilters.map((statusFilter) => (
                    <FilterPill
                      key={statusFilter}
                      href={getCanonicalManageUsersHref(currentUser.role, {
                        role: MANAGE_USER_ROLE_FILTERS.Student,
                        studentStatus: statusFilter,
                        query: filters.query,
                        fields: filters.selectedFields,
                      })}
                      label={studentStatusFilterMeta[statusFilter].label}
                      count={studentCounts[statusFilter]}
                      active={filters.studentStatus === statusFilter}
                      activeClassName={studentStatusFilterMeta[statusFilter].badgeClassName}
                      inactiveClassName={studentStatusFilterMeta[statusFilter].pillClassName}
                      layout="card"
                    />
                    ))}
                  </div>
                )
                : null}
            </div>
          </div>

          {/* Search */}
          <div className="mt-6">
            <ManageUsersSearchControls
              key={filters.role}
              managerRole={currentUser.role}
              role={filters.role}
              studentStatus={filters.studentStatus}
              query={filters.query}
              page={currentPage}
              selectedFields={filters.selectedFields}
              allFields={allSearchFields}
              canonicalHref={filters.canonicalHref}
              clearSearchHref={clearSearchHref}
              controlClassName={searchControlClassName}
              sections={searchFieldSections}
            />
          </div>

          {/* Results */}
          {sortedUsers.length ? (
            <div className="mt-6 space-y-4">
              <div className="card-surface flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-600">
                  แสดง {pageStartIndex + 1}-{Math.min(pageStartIndex + MANAGE_USERS_RESULTS_PER_PAGE, sortedUsers.length)} จาก {sortedUsers.length} บัญชี
                </p>
                {totalPages > 1 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <PaginationLink
                      href={getCanonicalManageUsersHref(currentUser.role, {
                        role: filters.role,
                        studentStatus: filters.studentStatus,
                        query: filters.query,
                        page: Math.max(1, currentPage - 1),
                        fields: filters.selectedFields,
                      })}
                      label="ก่อนหน้า"
                      disabled={currentPage === 1}
                    />
                    {paginationItems.map((pageNumber) => (
                      <PaginationLink
                        key={pageNumber}
                        href={getCanonicalManageUsersHref(currentUser.role, {
                          role: filters.role,
                          studentStatus: filters.studentStatus,
                          query: filters.query,
                          page: pageNumber,
                          fields: filters.selectedFields,
                        })}
                        label={String(pageNumber)}
                        active={pageNumber === currentPage}
                      />
                    ))}
                    <PaginationLink
                      href={getCanonicalManageUsersHref(currentUser.role, {
                        role: filters.role,
                        studentStatus: filters.studentStatus,
                        query: filters.query,
                        page: Math.min(totalPages, currentPage + 1),
                        fields: filters.selectedFields,
                      })}
                      label="ถัดไป"
                      disabled={currentPage === totalPages}
                    />
                  </div>
                ) : null}
              </div>

              {paginatedUsers.map((user) => {
                const statusFilter = getStudentStatusFilterForApplication(user.application);
                const detailHref = appendReturnTo(`/intern/manage-users/${user.id}`, filters.canonicalHref);
                const needsReview = wasEditedAfterApproval(user.application);
                const canDeleteAccount = canManagerDeleteManagedAccount(currentUser.role, user.role, {
                  isSelf: user.id === currentUser.id,
                });
                const previewItems = queryTokens.length
                  ? getManageUsersSearchPreviewItems(user, filters.role, filters.selectedFields, queryTokens)
                  : [];

                return (
                  <div
                    key={user.id}
                    className="group block rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-white/95 p-5 shadow-soft-brand transition hover:-translate-y-0.5 hover:border-[rgba(142,85,183,0.46)] hover:shadow-elegant"
                  >
                    <div className="flex items-center gap-4">
                      {/* Left: status badge */}
                      <div className="hidden shrink-0 sm:block">
                        {filters.role === MANAGE_USER_ROLE_FILTERS.Admin ? (
                          <span className="rounded-full bg-[color:var(--color-surface-soft)] px-3 py-1 text-xs font-medium text-slate-700">
                            {roleLabels[user.role]}
                          </span>
                        ) : (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${studentStatusFilterMeta[statusFilter].badgeClassName}`}
                          >
                            {studentStatusFilterMeta[statusFilter].label}
                          </span>
                        )}
                      </div>

                      {/* Center: user info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-950">
                            {getDisplayName(user)}
                          </h3>
                          {needsReview ? (
                            <span className="hidden shrink-0 sm:inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-900">
                              มีการแก้ไขหลังอนุมัติ
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{user.email}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                          {user.institution ? <span>{user.institution}</span> : null}
                          {user.application?.internshipPosition ? (
                            <span>{user.application.internshipPosition}</span>
                          ) : null}
                          <span>{user.createdAt.toLocaleString("th-TH", { dateStyle: "medium" })}</span>
                        </div>
                      </div>

                      <div className="shrink-0 self-center">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={detailHref}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--color-shell-border)] bg-white px-4 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] transition hover:border-[rgba(142,85,183,0.46)] hover:bg-[color:var(--color-surface-soft)]"
                          >
                            <Eye className="size-4" />
                            ดูข้อมูล
                          </Link>
                          {canDeleteAccount ? (
                            <form action={deleteManagedAccountFromForm}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="returnTo" value={filters.canonicalHref} />
                              <button
                                type="submit"
                                className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                              >
                                <Trash2 className="size-4" />
                                ลบบัญชี
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Mobile status badge */}
                    <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
                      {filters.role === MANAGE_USER_ROLE_FILTERS.Admin ? (
                        <span className="rounded-full bg-[color:var(--color-surface-soft)] px-3 py-1 text-xs font-medium text-slate-700">
                          {roleLabels[user.role]}
                        </span>
                      ) : (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${studentStatusFilterMeta[statusFilter].badgeClassName}`}
                        >
                          {studentStatusFilterMeta[statusFilter].label}
                        </span>
                      )}
                      {needsReview ? (
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-900">
                          มีการแก้ไขหลังอนุมัติ
                        </span>
                      ) : null}
                    </div>

                    {previewItems.length ? (
                      <div className="mt-4 rounded-[1.35rem] border border-[color:var(--color-shell-border)] bg-white/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
                          ตัวอย่างข้อมูลที่ตรงกับคำค้น
                        </p>
                        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {previewItems.map((item) => (
                            <div
                              key={`${user.id}-${item.label}`}
                              className="rounded-2xl border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] px-3 py-3"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                {item.label}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">
                                {renderHighlightedSearchText(item.value, queryTokens)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-[color:var(--color-shell-border)] bg-white/70 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-slate-900">
                {filters.query ? `ไม่พบผลลัพธ์สำหรับ "${filters.query}"` : getManageUsersEmptyStateMessage(filters)}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {filters.query
                  ? "ลองเปลี่ยนคำค้น หรือล้างการค้นหาเพื่อกลับไปดูรายการทั้งหมด"
                  : "ลองเปลี่ยนตัวกรองด้านบน หรือสร้างบัญชีใหม่จากปุ่มสร้างบัญชีบนแถบนำทาง"}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ── Shared filter pill ── */

function FilterPill({
  href,
  label,
  active,
  activeClassName,
  inactiveClassName,
  count,
  layout = "pill",
}: {
  href: string;
  label: string;
  active: boolean;
  activeClassName?: string;
  inactiveClassName?: string;
  count?: number;
  layout?: "pill" | "card";
}) {
  const isCard = layout === "card";

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`inline-flex border font-semibold transition ${
        isCard
          ? "min-h-28 flex-col items-start justify-between rounded-[1.45rem] px-4 py-3.5 text-left shadow-sm hover:-translate-y-0.5"
          : "items-center rounded-full px-4 py-2 text-sm"
      } ${
        active
          ? `${activeClassName ?? "border-[color:var(--color-brand-violet-deep)] bg-[color:var(--color-brand-violet-deep)] text-white shadow-nav-pill"} ${isCard ? "shadow-soft-brand ring-1 ring-black/5" : ""}`
          : `${inactiveClassName ?? "border-[color:var(--color-shell-border)] bg-white text-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-surface-soft)]"} ${isCard ? "hover:shadow-soft-brand" : ""}`
      }`}
    >
      {isCard ? (
        <>
          <span className="text-sm font-semibold leading-5">{label}</span>
          <span className="mt-3 text-2xl font-semibold tracking-tight">{count ?? 0}</span>
        </>
      ) : (
        label
      )}
    </Link>
  );
}

/* ── Search helpers ── */

function matchesManageUsersSearch(
  user: ManageUsersSearchableUser,
  role: typeof MANAGE_USER_ROLE_FILTERS.Admin | typeof MANAGE_USER_ROLE_FILTERS.Student,
  selectedFields: readonly ManageUsersSearchField[],
  queryTokens: string[],
) {
  if (!queryTokens.length) {
    return true;
  }

  const normalizedValues = getManageUsersSearchEntries(user, role)
    .filter((entry) => selectedFields.includes(entry.key))
    .map((entry) => normalizeManageUsersSearchValue(entry.value));

  return queryTokens.every((token) => normalizedValues.some((value) => value.includes(token)));
}

function getManageUsersSearchEntries(
  user: ManageUsersSearchableUser,
  role: typeof MANAGE_USER_ROLE_FILTERS.Admin | typeof MANAGE_USER_ROLE_FILTERS.Student,
): ManageUsersSearchEntry[] {
  const entries: ManageUsersSearchEntry[] = [
    { key: MANAGE_USERS_SEARCH_FIELDS.Name, label: "ชื่อผู้ใช้", value: getDisplayName(user) },
    { key: MANAGE_USERS_SEARCH_FIELDS.Email, label: "อีเมล", value: user.email },
    { key: MANAGE_USERS_SEARCH_FIELDS.Institution, label: "สถาบัน", value: user.institution ?? "" },
  ];

  if (role === MANAGE_USER_ROLE_FILTERS.Student) {
    entries.push(
      { key: MANAGE_USERS_SEARCH_FIELDS.Faculty, label: "คณะ", value: user.application?.faculty ?? "" },
      { key: MANAGE_USERS_SEARCH_FIELDS.YearLevel, label: "ชั้นปี", value: user.application?.yearLevel ?? "" },
      {
        key: MANAGE_USERS_SEARCH_FIELDS.InternshipPosition,
        label: "ตำแหน่งฝึกงาน",
        value: user.application?.internshipPosition ?? "",
      },
      { key: MANAGE_USERS_SEARCH_FIELDS.Company, label: "บริษัท / หน่วยงาน", value: user.application?.companyName ?? "" },
      {
        key: MANAGE_USERS_SEARCH_FIELDS.GuidingProfessor,
        label: "อาจารย์นิเทศ",
        value: [user.application?.guidingProfessorFirstname, user.application?.guidingProfessorLastname]
          .filter(Boolean)
          .join(" "),
      },
      {
        key: MANAGE_USERS_SEARCH_FIELDS.CompanySupervisor,
        label: "ผู้ดูแลในสถานประกอบการ",
        value: user.application?.companySupervisorName ?? "",
      },
    );
  }

  return entries.filter((entry) => entry.value.trim());
}

function getManageUsersSearchPreviewItems(
  user: ManageUsersSearchableUser,
  role: typeof MANAGE_USER_ROLE_FILTERS.Admin | typeof MANAGE_USER_ROLE_FILTERS.Student,
  selectedFields: readonly ManageUsersSearchField[],
  queryTokens: string[],
) {
  return getManageUsersSearchEntries(user, role)
    .filter((entry) => selectedFields.includes(entry.key))
    .map((entry) => ({
      ...entry,
      score: getManageUsersSearchMatchScore(entry.value, queryTokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label, "th"))
    .slice(0, 3);
}

function getManageUsersSearchMatchScore(value: string, queryTokens: string[]) {
  const normalizedValue = normalizeManageUsersSearchValue(value);

  return queryTokens.reduce((score, token) => score + Number(normalizedValue.includes(token)), 0);
}

function normalizeManageUsersSearchValue(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function getManageUsersSearchTokens(query: string) {
  return Array.from(new Set(normalizeManageUsersSearchValue(query).split(/\s+/).filter(Boolean)));
}

function renderHighlightedSearchText(value: string, queryTokens: string[]) {
  if (!queryTokens.length) {
    return value;
  }

  const normalizedTokens = Array.from(new Set(queryTokens)).sort((left, right) => right.length - left.length);
  const matcher = new RegExp(`(${normalizedTokens.map((token) => escapeRegExp(token)).join("|")})`, "gi");
  const parts = value.split(matcher);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    const isMatch = normalizedTokens.includes(part.toLocaleLowerCase());

    return isMatch ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-md bg-[rgba(242,106,33,0.18)] px-1 py-0.5 font-semibold text-[color:var(--color-brand-orange-deep)]"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getManageUsersPaginationItems(currentPage: number, totalPages: number) {
  const startPage = Math.max(1, currentPage - 1);
  const endPage = Math.min(totalPages, currentPage + 1);
  const items = new Set<number>([1, totalPages]);

  for (let page = startPage; page <= endPage; page += 1) {
    items.add(page);
  }

  return Array.from(items).sort((left, right) => left - right);
}

function PaginationLink({
  href,
  label,
  active = false,
  disabled = false,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition ${
        active
          ? "border-[color:var(--color-brand-violet-deep)] bg-[color:var(--color-brand-violet-deep)] text-white shadow-nav-pill"
          : "border-[color:var(--color-shell-border)] bg-white text-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-surface-soft)]"
      }`}
    >
      {label}
    </Link>
  );
}
