export const USER_ROLES = {
  Student: "Student",
  Admin: "Admin",
  Superadmin: "Superadmin",
} as const;

import { prisma } from "@/lib/prisma";

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

type TermsAwareUser = {
  role: UserRole;
  acceptedTermsAt?: Date | null;
};

type TermsAwareAccountUser = TermsAwareUser & {
  id: string;
};

export const roleLabels: Record<UserRole, string> = {
  Student: "นักศึกษา",
  Admin: "ผู้ดูแลระบบ",
  Superadmin: "ผู้ดูแลระบบสูงสุด",
};

export function getDisplayName(user: { title: string; firstname: string; lastname: string }) {
  const name = [user.title, user.firstname, user.lastname]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");

  return name || "ยังไม่ระบุชื่อ";
}

export function canAccessUserManagement(role: UserRole) {
  return role === USER_ROLES.Admin || role === USER_ROLES.Superadmin;
}

export function requiresStudentTermsAcceptance(user: TermsAwareUser) {
  return user.role === USER_ROLES.Student && !user.acceptedTermsAt;
}

async function studentHasCompletedProfile(userId: string) {
  const application = await prisma.internshipApplication.findUnique({
    where: { userId },
    select: { id: true },
  });

  return Boolean(application);
}

export function getPostLoginPath(role: UserRole) {
  return canAccessUserManagement(role) ? "/intern/manage-users" : "/intern/profile";
}

export async function getPostLoginPathForUser(user: TermsAwareAccountUser) {
  if (requiresStudentTermsAcceptance(user)) {
    return "/intern/terms";
  }

  if (user.role === USER_ROLES.Student && !(await studentHasCompletedProfile(user.id))) {
    return "/intern/application";
  }

  return getPostLoginPath(user.role);
}

export function getAccountPagePath(role: UserRole, userId: string) {
  return role === USER_ROLES.Student ? "/intern/profile" : `/intern/manage-users/${userId}`;
}

export async function getAccountPagePathForUser(user: TermsAwareAccountUser) {
  if (requiresStudentTermsAcceptance(user)) {
    return "/intern/terms";
  }

  if (user.role === USER_ROLES.Student && !(await studentHasCompletedProfile(user.id))) {
    return "/intern/application";
  }

  return getAccountPagePath(user.role, user.id);
}

export function getAssignableRoles(role: UserRole) {
  if (role === USER_ROLES.Superadmin) {
    return [USER_ROLES.Admin, USER_ROLES.Student] as const;
  }

  if (role === USER_ROLES.Admin) {
    return [USER_ROLES.Student] as const;
  }

  return [] as const;
}

export function getRoleOptionsForManager(role: UserRole) {
  return getAssignableRoles(role).map((value) => ({
    value,
    label: roleLabels[value],
  }));
}

export function canManagerViewUser(managerRole: UserRole, targetRole: UserRole, options?: { isSelf?: boolean }) {
  const isSelf = options?.isSelf ?? false;

  if (managerRole === USER_ROLES.Superadmin) {
    return true;
  }

  if (managerRole === USER_ROLES.Admin) {
    return isSelf || targetRole === USER_ROLES.Student;
  }

  return false;
}

export function canManagerEditUser(managerRole: UserRole, targetRole: UserRole) {
  return canAccessUserManagement(managerRole) && targetRole === USER_ROLES.Student;
}

export function canManagerEditManagedAccount(managerRole: UserRole, targetRole: UserRole, options?: { isSelf?: boolean }) {
  if (managerRole === USER_ROLES.Superadmin) {
    return true;
  }

  if (managerRole === USER_ROLES.Admin && options?.isSelf) {
    return true;
  }

  return canManagerEditUser(managerRole, targetRole);
}

export function canManagerDeleteManagedAccount(
  managerRole: UserRole,
  targetRole: UserRole,
  options?: { isSelf?: boolean },
) {
  const isSelf = options?.isSelf ?? false;

  if (isSelf) {
    return false;
  }

  if (managerRole === USER_ROLES.Superadmin) {
    return true;
  }

  if (managerRole === USER_ROLES.Admin) {
    return targetRole === USER_ROLES.Student;
  }

  return false;
}