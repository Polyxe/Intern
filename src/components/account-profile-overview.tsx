import { UserAvatar } from "@/components/user-avatar";
import { formatDateForDisplay } from "@/lib/internship-application";
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

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/80 p-5 shadow-sm">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-2 text-base font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

export function AccountProfileOverview({ heading, description, user }: AccountProfileOverviewProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-5">
          <UserAvatar
            firstName={user.firstname}
            lastName={user.lastname}
            imagePath={user.profileImagePath}
            className="h-24 w-24 border-[color:var(--color-shell-border)]"
            textClassName="text-2xl"
          />
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-[rgba(142,85,183,0.1)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
              Account Profile
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{heading}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,242,252,0.95))] p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">ข้อมูลบัญชี</h3>
          <p className="mt-1 text-sm text-slate-500">ข้อมูลที่ผู้ดูแลระบบสร้างไว้ตั้งแต่เริ่มต้นและรายละเอียดพื้นฐานของบัญชี</p>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailCard label="ชื่อ - นามสกุล" value={displayValue(getDisplayName(user))} />
          <DetailCard label="อีเมล" value={user.email} />
          <DetailCard label="สิทธิ์การใช้งาน" value={roleLabels[user.role]} />
          <DetailCard label="เพศ" value={displayValue(user.sex)} />
          <DetailCard label="วันเกิด" value={user.birthDate ? formatDateForDisplay(user.birthDate) : "-"} />
          <DetailCard label="สถาบัน" value={displayValue(user.institution)} />
          <div className="md:col-span-2 xl:col-span-3">
            <DetailCard label="ที่อยู่" value={displayValue(user.address)} />
          </div>
        </dl>
      </div>
    </section>
  );
}