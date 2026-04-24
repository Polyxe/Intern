import Link from "next/link";

import { logout } from "@/app/actions/session";
import { fetchNotifications } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth";
import { INTERN_BASE_PATH } from "@/lib/public-paths";
import {
  canAccessUserManagement,
  getAccountPagePathForUser,
  getPostLoginPathForUser,
  USER_ROLES,
} from "@/lib/user-management";

function LogoMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-10 w-10 drop-shadow-[0_5px_8px_rgba(116,70,145,0.22)]"
    >
      <defs>
        <linearGradient id="logo-orange" x1="12" x2="44" y1="10" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb267" />
          <stop offset="1" stopColor="#ef6c1e" />
        </linearGradient>
        <linearGradient id="logo-gray" x1="38" x2="58" y1="14" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d9d6df" />
          <stop offset="1" stopColor="#a7a0b3" />
        </linearGradient>
      </defs>
      <path
        fill="url(#logo-orange)"
        d="M31.5 4 52 16v23L31.5 51 11 39V16L31.5 4Z"
      />
      <path
        fill="#fff7ef"
        d="M31.5 13 44 20.4v14.2L31.5 42 19 34.6V20.4L31.5 13Z"
      />
      <path
        fill="#fff"
        d="M31.5 20.5 38.3 24.5v6.8l-6.8 4-6.8-4v-6.8l6.8-4Z"
      />
      <path
        fill="url(#logo-gray)"
        d="M52 16 59 21v24l-13 7V39l6-3.6V20.6L52 16Z"
      />
      <path
        fill="#f1eef5"
        d="M44 20.4 52 16v19.4l-8 4.8V20.4Z"
      />
    </svg>
  );
}

export async function AppHeader() {
  const currentUser = await getCurrentUser();
  const logoHref = currentUser ? await getPostLoginPathForUser(currentUser) : INTERN_BASE_PATH;
  const accountHref = currentUser ? await getAccountPagePathForUser(currentUser) : INTERN_BASE_PATH;
  const accountLabel = currentUser?.role === USER_ROLES.Student ? "Student Profile" : "My Account";
  const navLinks = currentUser
    ? currentUser.role === USER_ROLES.Student
      ? [
          { href: "/intern/profile", label: "โปรไฟล์" },
          { href: "/intern/application", label: "ฟอร์มฝึกงาน" },
        ]
      : canAccessUserManagement(currentUser.role)
        ? [
            { href: "/intern/profile", label: "บัญชีของฉัน" },
            { href: "/intern/manage-users", label: "จัดการผู้ใช้" },
          ]
        : [{ href: accountHref, label: "บัญชีของฉัน" }]
    : [];

  const notificationData = currentUser ? await fetchNotifications() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/25 bg-gradient-brand text-white shadow-glow">
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay [background:radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />

      <div className="relative mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={logoHref} className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/30 backdrop-blur-sm">
            <LogoMark />
          </div>
          <div className="leading-tight">
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
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full px-4 py-1.5 text-sm font-semibold text-white/88 transition hover:bg-white/14 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
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
              <div className="hidden text-right leading-tight sm:block">
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
        <nav className="relative mx-auto flex max-w-7xl items-center gap-1 border-t border-white/10 px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 rounded-xl px-3 py-1.5 text-center text-sm font-semibold text-white/88 transition hover:bg-white/15 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}