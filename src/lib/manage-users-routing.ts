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

export function getDefaultManageUsersRoleFilter(managerRole: UserRole): ManageUserRoleFilter {
  return managerRole === USER_ROLES.Superadmin ? MANAGE_USER_ROLE_FILTERS.Student : MANAGE_USER_ROLE_FILTERS.Student;
}

export function getCanonicalManageUsersHref(
  managerRole: UserRole,
  filters?: {
    role?: ManageUserRoleFilter;
    studentStatus?: StudentStatusFilter;
  },
) {
  const role = filters?.role ?? getDefaultManageUsersRoleFilter(managerRole);
  const studentStatus = filters?.studentStatus ?? STUDENT_STATUS_FILTERS.All;
  const params = new URLSearchParams();

  if (managerRole === USER_ROLES.Superadmin) {
    params.set("role", role);
  }

  if (studentStatus !== STUDENT_STATUS_FILTERS.All) {
    params.set("studentStatus", studentStatus);
  }

  const query = params.toString();

  return query ? `${MANAGE_USERS_PATH}?${query}` : MANAGE_USERS_PATH;
}

export function resolveManageUsersFilters(managerRole: UserRole, searchParams: RawSearchParams | undefined) {
  const rawRole = getSingleValue(searchParams?.role);
  const rawStudentStatus = getSingleValue(searchParams?.studentStatus);
  const role =
    managerRole === USER_ROLES.Superadmin && isManageUserRoleFilter(rawRole)
      ? rawRole
      : getDefaultManageUsersRoleFilter(managerRole);
  const studentStatus = isStudentStatusFilter(rawStudentStatus)
    ? rawStudentStatus
    : STUDENT_STATUS_FILTERS.All;
  const canonicalHref = getCanonicalManageUsersHref(managerRole, {
    role,
    studentStatus,
  });
  const incomingParams = new URLSearchParams();

  if (rawRole) {
    incomingParams.set("role", rawRole);
  }

  if (rawStudentStatus) {
    incomingParams.set("studentStatus", rawStudentStatus);
  }

  const incomingHref = incomingParams.toString() ? `${MANAGE_USERS_PATH}?${incomingParams.toString()}` : MANAGE_USERS_PATH;

  return {
    role,
    studentStatus,
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