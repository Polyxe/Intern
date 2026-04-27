"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

const MANAGE_USERS_PATH = "/intern/manage-users";
const MANAGE_USERS_NEW_PATH = "/intern/manage-users/new";

export function ManageUsersCreateLink({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCurrentAction = pathname === MANAGE_USERS_NEW_PATH;
  const shouldPreserveReturnTo = pathname === MANAGE_USERS_PATH;
  const href = new URL(MANAGE_USERS_NEW_PATH, "https://manage-users.local");

  if (shouldPreserveReturnTo) {
    const query = searchParams.toString();
    href.searchParams.set("returnTo", query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Link
      href={`${href.pathname}${href.search}`}
      aria-current={isCurrentAction ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-gradient-accent px-4 py-2 text-sm font-semibold text-white shadow-accent-glow transition hover:opacity-95",
        isCurrentAction && "bg-white/18 text-white shadow-none ring-1 ring-white/25",
        mobile && "w-full rounded-2xl px-4 py-3",
      )}
    >
      <Plus className="size-4" />
      สร้างบัญชี
    </Link>
  );
}