import Image from "next/image";
import Link from "next/link";

import logoSm from "@/app/logo-sm.png";
import { logout } from "@/app/actions/session";
import { HeaderNav } from "@/components/header-nav";
import { ManageUsersCreateLink } from "@/components/manage-users-create-link";
import { fetchNotifications } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { StudentFlowThemeController } from "@/components/student-flow-theme-controller";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth";
import { INTERN_BASE_PATH } from "@/lib/public-paths";
import {
  canAccessUserManagement,
  getAccountPagePathForUser,
  getPostLoginPathForUser,
  USER_ROLES,
} from "@/lib/user-management";

export async function AppHeader() {
  const currentUser = await getCurrentUser();
  const isStudent = currentUser?.role === USER_ROLES.Student;
  const logoHref = currentUser ? await getPostLoginPathForUser(currentUser) : INTERN_BASE_PATH;
  const accountHref = currentUser ? await getAccountPagePathForUser(currentUser) : INTERN_BASE_PATH;
  const accountLabel = currentUser?.role === USER_ROLES.Student ? "Student Profile" : "My Account";
  const navLinks = currentUser
    ? currentUser.role === USER_ROLES.Student
      ? [
          { href: "/intern/profile/edit", label: "แก้ไขฟอร์มฝึกงาน" },
          { href: "/intern/work", label: "ผลงาน" },
        ]
      : canAccessUserManagement(currentUser.role)
        ? [{ href: "/intern/manage-users", label: "จัดการผู้ใช้" }]
        : []
    : [];

  const notificationData = currentUser ? await fetchNotifications() : null;

  return (
    <>
      <StudentFlowThemeController isStudent={isStudent} />
      <header className="sticky top-0 z-40 border-b border-white/25 bg-gradient-brand text-white shadow-glow">
        <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay [background:radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />

        <div className="relative mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={logoHref} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/30 backdrop-blur-sm">
              <Image
                src={logoSm}
                alt=""
                aria-hidden="true"
                className="h-10 w-10 object-contain drop-shadow-[0_5px_8px_rgba(116,70,145,0.22)]"
                priority
              />
            </div>
            <div className="text-center leading-tight">
              <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                Internship Management System
              </p>
              <p className="hidden text-xs text-white/70 sm:block">ระบบบริหารจัดการนักศึกษาฝึกงาน</p>
            </div>
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-3">
              {navLinks.length ? (
                <nav className="hidden items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/20 backdrop-blur md:flex">
                  <HeaderNav links={navLinks} />
                </nav>
              ) : null}

              {currentUser && canAccessUserManagement(currentUser.role) ? (
                <div className="hidden md:flex">
                  <ManageUsersCreateLink />
                </div>
              ) : null}

              {notificationData && (
                <NotificationBell
                  initialNotifications={notificationData.notifications}
                  initialUnreadCount={notificationData.unreadCount}
                />
              )}

              <Link
                href={accountHref}
                className="flex items-center gap-3 rounded-full bg-white/10 py-1.5 pr-3 pl-1.5 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
              >
                <UserAvatar
                  firstName={currentUser.firstname}
                  lastName={currentUser.lastname}
                  imagePath={currentUser.profileImagePath}
                  className="h-10 w-10 ring-2 ring-white/40"
                />
                <div className="hidden text-center leading-tight sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    {accountLabel}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {currentUser.firstname} {currentUser.lastname}
                  </p>
                </div>
              </Link>

              <form action={logout}>
                <Button
                  type="submit"
                  variant="secondary"
                  className="h-10 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white shadow-none backdrop-blur hover:bg-white/18"
                >
                  ออกจากระบบ
                </Button>
              </form>
            </div>
          ) : (
            <div aria-hidden="true" className="min-h-10 min-w-24" />
          )}
        </div>

        {currentUser && navLinks.length ? (
          <div className="relative mx-auto max-w-7xl border-t border-white/10 px-4 py-2 md:hidden">
            <nav className="flex items-center gap-1">
              <HeaderNav links={navLinks} mobile />
            </nav>
            {canAccessUserManagement(currentUser.role) ? (
              <div className="mt-2">
                <ManageUsersCreateLink mobile />
              </div>
            ) : null}
          </div>
        ) : null}
      </header>
    </>
  );
}