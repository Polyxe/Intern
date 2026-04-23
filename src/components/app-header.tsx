import Link from "next/link";

import { logout } from "@/app/actions/session";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth";
import { INTERN_BASE_PATH } from "@/lib/public-paths";
import { getAccountPagePath, getPostLoginPath, USER_ROLES } from "@/lib/user-management";

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
  const logoHref = currentUser ? getPostLoginPath(currentUser.role) : INTERN_BASE_PATH;
  const accountHref = currentUser ? getAccountPagePath(currentUser.role, currentUser.id) : INTERN_BASE_PATH;
  const accountLabel = currentUser?.role === USER_ROLES.Student ? "Student Profile" : "My Account";

  return (
    <header className="border-b border-white/45 bg-[linear-gradient(90deg,_rgba(250,232,244,0.95)_0%,_rgba(206,151,229,0.95)_55%,_rgba(156,80,199,0.98)_100%)] shadow-[0_6px_18px_rgba(130,74,163,0.12)] backdrop-blur">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={logoHref} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/78 shadow-[0_10px_24px_rgba(130,74,163,0.14)] ring-1 ring-white/65">
            <LogoMark />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-950 sm:text-xl">
              Internship Management System
            </p>
          </div>
        </Link>

        {currentUser ? (
          <div className="flex items-center gap-3">
            <Link
              href={accountHref}
              className="flex items-center gap-3 rounded-full border border-white/60 bg-white/78 px-3 py-2 shadow-[0_10px_24px_rgba(130,74,163,0.12)] transition hover:bg-white"
            >
              <div className="text-right leading-tight">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
                  {accountLabel}
                </p>
                <p className="text-sm font-semibold text-slate-950">
                  {currentUser.firstname} {currentUser.lastname}
                </p>
              </div>
              <UserAvatar
                firstName={currentUser.firstname}
                lastName={currentUser.lastname}
                imagePath={currentUser.profileImagePath}
                className="h-11 w-11"
              />
            </Link>

            <form action={logout}>
              <Button
                type="submit"
                variant="secondary"
                className="h-10 rounded-full border border-white/60 bg-white/85 px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-[0_10px_20px_rgba(130,74,163,0.12)] hover:bg-white"
              >
                ออกจากระบบ
              </Button>
            </form>
          </div>
        ) : (
          <div aria-hidden="true" className="min-h-10 min-w-24" />
        )}
      </div>
    </header>
  );
}