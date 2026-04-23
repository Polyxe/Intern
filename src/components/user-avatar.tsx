import Image from "next/image";

import { normalizePublicUploadPath } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  firstName: string;
  lastName: string;
  imagePath?: string | null;
  className?: string;
  textClassName?: string;
};

function getInitials(firstName: string, lastName: string) {
  return [firstName, lastName]
    .map((value) => value.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 2);
}

export function UserAvatar({
  firstName,
  lastName,
  imagePath,
  className,
  textClassName,
}: UserAvatarProps) {
  const initials = getInitials(firstName, lastName) || "U";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "User";
  const normalizedImagePath = normalizePublicUploadPath(imagePath);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border border-white/70 bg-[linear-gradient(135deg,_rgba(255,255,255,0.88),_rgba(246,236,252,0.95))] text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-[0_10px_24px_rgba(130,74,163,0.12)]",
        className,
      )}
      aria-label={fullName}
    >
      {normalizedImagePath ? (
        <Image src={normalizedImagePath} alt={fullName} fill unoptimized sizes="96px" className="object-cover" />
      ) : (
        <span className={cn("relative z-10", textClassName)}>{initials}</span>
      )}
    </div>
  );
}