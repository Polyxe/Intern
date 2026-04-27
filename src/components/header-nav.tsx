"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type HeaderNavLink = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav({
  links,
  mobile = false,
}: {
  links: HeaderNavLink[];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const isActive = isActivePath(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              mobile && "flex-1 rounded-2xl px-3 py-2 text-center",
              isActive
                ? "bg-white text-[color:var(--color-brand-violet-deep)] shadow-nav-pill"
                : "text-white/88 hover:bg-white hover:text-[color:var(--color-brand-violet-deep)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}