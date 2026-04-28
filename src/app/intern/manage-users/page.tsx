import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

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
  getManageUsersSearchFieldsForRole,
  MANAGE_USERS_SEARCH_FIELDS,
  resolveManageUsersFilters,
  type ManageUsersSearchField,
} from "@/lib/manage-users-routing";
import { prisma } from "@/lib/prisma";
import {
  USER_ROLES,
  canAccessUserManagement,
  getDisplayName,
  roleLabels,
} from "@/lib/user-management";

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
                    query: filters.query,
                    fields: filters.selectedFields,
                  })}
                  label="นักศึกษา"
                  active={filters.role === MANAGE_USER_ROLE_FILTERS.Student}
                />
                <RoleFilterLink
                  href={getCanonicalManageUsersHref(currentUser.role, {
                    role: MANAGE_USER_ROLE_FILTERS.Admin,
                    studentStatus: filters.studentStatus,
                    query: filters.query,
                    fields: filters.selectedFields,
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
                        query: filters.query,
                        fields: filters.selectedFields,
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

            <div className="rounded-[1.6rem] border border-[rgba(142,85,183,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,240,249,0.94))] p-5 shadow-[0_12px_28px_rgba(112,90,138,0.08)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
                    Search Filters
                  </p>
                  <h3 className="text-lg font-semibold text-slate-950">ค้นหาบัญชีจากข้อมูลที่ต้องการได้ทันที</h3>
                  <p className="text-sm leading-6 text-slate-500">
                    เลือกฟิลด์ที่ต้องการค้นหาด้วยการคลิก แล้วพิมพ์คำค้นต่อเนื่องได้โดยไม่หลุดออกจากช่องค้นหา
                  </p>
                </div>

                {filters.query ? (
                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(142,85,183,0.18)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--color-brand-violet-deep)] shadow-sm">
                    พบ {sortedUsers.length} รายการจาก {filters.selectedFields.length} ตัวกรองที่เลือก
                  </div>
                ) : null}
              </div>

              <ManageUsersSearchControls
                key={`${filters.role}:${filters.selectedFields.join(",")}`}
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
          </div>

          {sortedUsers.length ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[rgba(142,85,183,0.12)] bg-[rgba(255,255,255,0.82)] px-5 py-4 shadow-[0_10px_24px_rgba(112,90,138,0.06)] sm:flex-row sm:items-center sm:justify-between">
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
                const previewItems = queryTokens.length
                  ? getManageUsersSearchPreviewItems(user, filters.role, filters.selectedFields, queryTokens)
                  : [];

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

                    {previewItems.length ? (
                      <div className="mt-4 rounded-[1.35rem] border border-[rgba(142,85,183,0.12)] bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
                          ตัวอย่างข้อมูลที่ตรงกับคำค้น
                        </p>
                        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {previewItems.map((item) => (
                            <div
                              key={`${user.id}-${item.label}`}
                              className="rounded-2xl border border-[rgba(142,85,183,0.12)] bg-[rgba(248,244,251,0.9)] px-3 py-3"
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

                    <p className="mt-4 text-sm text-slate-500">
                      สร้างเมื่อ {user.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-[color:var(--color-shell-border)] bg-white/70 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-slate-900">
                {filters.query ? `ไม่พบผลลัพธ์สำหรับ \"${filters.query}\"` : getManageUsersEmptyStateMessage(filters)}
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