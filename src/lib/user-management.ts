export const USER_ROLES = {
  Student: "Student",
  Admin: "Admin",
  Superadmin: "Superadmin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

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

export function getPostLoginPath(role: UserRole) {
  return canAccessUserManagement(role) ? "/intern/manage-users" : "/intern/profile";
}

export function getAccountPagePath(role: UserRole, userId: string) {
  return role === USER_ROLES.Student ? "/intern/profile" : `/intern/manage-users/${userId}`;
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
  return canManagerEditUser(managerRole, targetRole) || (canAccessUserManagement(managerRole) && (options?.isSelf ?? false));
}