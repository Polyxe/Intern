import { CalendarDays, Mail, MapPin, ShieldCheck, User, type LucideIcon } from "lucide-react";

import { formatDateForDisplay } from "@/lib/internship-application";
import { getSexLabel } from "@/lib/sex";
import { getDisplayName, roleLabels, type UserRole } from "@/lib/user-management";

type AccountProfileOverviewProps = {
  heading: string;
  description: string;
  user: {
    title: string;
    firstname: string;
    lastname: string;
    sex?: string | null;
    birthDate?: Date | null;
    address?: string | null;
    institution?: string | null;
    email: string;
    role: UserRole;
    profileImagePath?: string | null;
  };
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function DetailRow({ icon: Icon, label, value }: { icon?: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-shell-border)] bg-white/80 px-4 py-3">
      {Icon ? (
        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[rgba(142,85,183,0.12)]">
          <Icon className="size-4" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">{label}</p>
        <p className="mt-1 text-sm font-medium break-words text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function AccountProfileOverview({ heading, description, user }: AccountProfileOverviewProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 shadow-elegant">
      <div className="pointer-events-none absolute -top-20 -right-16 size-52 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl" />
      <div className="relative flex items-center gap-3 border-b border-[color:var(--color-shell-border)] bg-gradient-brand-soft px-6 py-4">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{heading}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="relative px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow icon={User} label="ชื่อ - นามสกุล" value={displayValue(getDisplayName(user))} />
          <DetailRow icon={Mail} label="อีเมล" value={user.email} />
          <DetailRow icon={ShieldCheck} label="สิทธิ์การใช้งาน" value={roleLabels[user.role]} />
          <DetailRow label="เพศ" value={displayValue(getSexLabel(user.sex))} />
          <DetailRow icon={CalendarDays} label="วันเกิด" value={user.birthDate ? formatDateForDisplay(user.birthDate) : "-"} />
          <DetailRow label="สถาบัน" value={displayValue(user.institution)} />
          <div className="md:col-span-2 xl:col-span-3">
            <DetailRow icon={MapPin} label="ที่อยู่" value={displayValue(user.address)} />
          </div>
        </div>
      </div>
    </section>
  );
}