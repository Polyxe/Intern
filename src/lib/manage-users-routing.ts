import type { UserRole } from "@/lib/user-management";
import { USER_ROLES } from "@/lib/user-management";
import {
  MANAGE_USER_ROLE_FILTERS,
  STUDENT_STATUS_FILTERS,
  studentStatusFilterOrder,
  type ManageUserRoleFilter,
  type StudentStatusFilter,
} from "@/lib/internship-application";

const MANAGE_USERS_PATH = "/intern/manage-users";
const MANAGE_USERS_RETURN_TO_BASE = "https://manage-users.local";

export const MANAGE_USERS_SEARCH_FIELDS = {
  Name: "name",
  Email: "email",
  Institution: "institution",
  Faculty: "faculty",
  YearLevel: "year-level",
  InternshipPosition: "internship-position",
  Company: "company",
  GuidingProfessor: "guiding-professor",
  CompanySupervisor: "company-supervisor",
} as const;

export type ManageUsersSearchField =
  (typeof MANAGE_USERS_SEARCH_FIELDS)[keyof typeof MANAGE_USERS_SEARCH_FIELDS];

const STUDENT_MANAGE_USERS_SEARCH_FIELDS: ManageUsersSearchField[] = [
  MANAGE_USERS_SEARCH_FIELDS.Name,
  MANAGE_USERS_SEARCH_FIELDS.Email,
  MANAGE_USERS_SEARCH_FIELDS.Institution,
  MANAGE_USERS_SEARCH_FIELDS.Faculty,
  MANAGE_USERS_SEARCH_FIELDS.YearLevel,
  MANAGE_USERS_SEARCH_FIELDS.InternshipPosition,
  MANAGE_USERS_SEARCH_FIELDS.Company,
  MANAGE_USERS_SEARCH_FIELDS.GuidingProfessor,
  MANAGE_USERS_SEARCH_FIELDS.CompanySupervisor,
];

const ADMIN_MANAGE_USERS_SEARCH_FIELDS: ManageUsersSearchField[] = [
  MANAGE_USERS_SEARCH_FIELDS.Name,
  MANAGE_USERS_SEARCH_FIELDS.Email,
  MANAGE_USERS_SEARCH_FIELDS.Institution,
];

type RawSearchParams = Record<string, string | string[] | undefined>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isStudentStatusFilter(value: string | undefined): value is StudentStatusFilter {
  return Boolean(value && studentStatusFilterOrder.includes(value as StudentStatusFilter));
}

function isManageUserRoleFilter(value: string | undefined): value is ManageUserRoleFilter {
  return value === MANAGE_USER_ROLE_FILTERS.Student || value === MANAGE_USER_ROLE_FILTERS.Admin;
}

function isManageUsersSearchField(value: string): value is ManageUsersSearchField {
  return Object.values(MANAGE_USERS_SEARCH_FIELDS).includes(value as ManageUsersSearchField);
}

function normalizeManageUsersSearchQuery(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeManageUsersPage(value: string | undefined) {
  const parsedValue = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

export function getDefaultManageUsersRoleFilter(managerRole: UserRole): ManageUserRoleFilter {
  return managerRole === USER_ROLES.Superadmin ? MANAGE_USER_ROLE_FILTERS.Student : MANAGE_USER_ROLE_FILTERS.Student;
}

export function getManageUsersSearchFieldsForRole(role: ManageUserRoleFilter) {
  return role === MANAGE_USER_ROLE_FILTERS.Admin
    ? ADMIN_MANAGE_USERS_SEARCH_FIELDS
    : STUDENT_MANAGE_USERS_SEARCH_FIELDS;
}

function normalizeManageUsersSearchFields(
  role: ManageUserRoleFilter,
  fields: string | readonly ManageUsersSearchField[] | undefined,
) {
  const availableFields = getManageUsersSearchFieldsForRole(role);
  const rawFields = Array.isArray(fields)
    ? fields
    : typeof fields === "string"
      ? fields
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  const validFieldSet = new Set(
    rawFields.filter((field): field is ManageUsersSearchField => isManageUsersSearchField(field)),
  );
  const normalizedFields = availableFields.filter((field) => validFieldSet.has(field));

  return normalizedFields.length ? normalizedFields : availableFields;
}

function areManageUsersSearchFieldsEqual(
  left: readonly ManageUsersSearchField[],
  right: readonly ManageUsersSearchField[],
) {
  return left.length === right.length && left.every((field, index) => field === right[index]);
}

export function getCanonicalManageUsersHref(
  managerRole: UserRole,
  filters?: {
    role?: ManageUserRoleFilter;
    studentStatus?: StudentStatusFilter;
    query?: string;
    page?: number;
    fields?: readonly ManageUsersSearchField[];
  },
) {
  const role = filters?.role ?? getDefaultManageUsersRoleFilter(managerRole);
  const studentStatus = filters?.studentStatus ?? STUDENT_STATUS_FILTERS.All;
  const query = normalizeManageUsersSearchQuery(filters?.query);
  const page = filters?.page && filters.page > 1 ? filters.page : 1;
  const selectedFields = normalizeManageUsersSearchFields(role, filters?.fields);
  const defaultFields = getManageUsersSearchFieldsForRole(role);
  const params = new URLSearchParams();

  if (managerRole === USER_ROLES.Superadmin) {
    params.set("role", role);
  }

  if (studentStatus !== STUDENT_STATUS_FILTERS.All) {
    params.set("studentStatus", studentStatus);
  }

  if (query) {
    params.set("query", query);
  }

  if (!areManageUsersSearchFieldsEqual(selectedFields, defaultFields)) {
    params.set("fields", selectedFields.join(","));
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString ? `${MANAGE_USERS_PATH}?${queryString}` : MANAGE_USERS_PATH;
}

export function resolveManageUsersFilters(managerRole: UserRole, searchParams: RawSearchParams | undefined) {
  const rawRole = getSingleValue(searchParams?.role);
  const rawStudentStatus = getSingleValue(searchParams?.studentStatus);
  const rawQuery = getSingleValue(searchParams?.query);
  const rawPage = getSingleValue(searchParams?.page);
  const rawFields = getSingleValue(searchParams?.fields);
  const role =
    managerRole === USER_ROLES.Superadmin && isManageUserRoleFilter(rawRole)
      ? rawRole
      : getDefaultManageUsersRoleFilter(managerRole);
  const studentStatus = isStudentStatusFilter(rawStudentStatus)
    ? rawStudentStatus
    : STUDENT_STATUS_FILTERS.All;
  const query = normalizeManageUsersSearchQuery(rawQuery);
  const page = normalizeManageUsersPage(rawPage);
  const selectedFields = normalizeManageUsersSearchFields(role, rawFields);
  const canonicalHref = getCanonicalManageUsersHref(managerRole, {
    role,
    studentStatus,
    query,
    page,
    fields: selectedFields,
  });
  const incomingParams = new URLSearchParams();

  if (rawRole) {
    incomingParams.set("role", rawRole);
  }

  if (rawStudentStatus) {
    incomingParams.set("studentStatus", rawStudentStatus);
  }

  if (rawQuery) {
    incomingParams.set("query", rawQuery);
  }

  if (rawFields) {
    incomingParams.set("fields", rawFields);
  }

  if (rawPage) {
    incomingParams.set("page", rawPage);
  }

  const incomingHref = incomingParams.toString() ? `${MANAGE_USERS_PATH}?${incomingParams.toString()}` : MANAGE_USERS_PATH;

  return {
    role,
    studentStatus,
    query,
    page,
    selectedFields,
    canonicalHref,
    shouldRedirect: incomingHref !== canonicalHref,
  };
}

export function getValidatedManageUsersReturnTo(returnTo: string | null | undefined) {
  if (!returnTo) {
    return null;
  }

  try {
    const url = new URL(returnTo, MANAGE_USERS_RETURN_TO_BASE);

    if (url.origin !== MANAGE_USERS_RETURN_TO_BASE) {
      return null;
    }

    if (!url.pathname.startsWith(MANAGE_USERS_PATH)) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function appendReturnTo(href: string, returnTo: string | null | undefined) {
  const validatedReturnTo = getValidatedManageUsersReturnTo(returnTo);

  if (!validatedReturnTo) {
    return href;
  }

  const url = new URL(href, MANAGE_USERS_RETURN_TO_BASE);
  url.searchParams.set("returnTo", validatedReturnTo);

  return `${url.pathname}${url.search}`;
}