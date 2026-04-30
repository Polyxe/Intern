import type { ReactNode } from "react";
import {
  BookOpen,
  Building2,
  Briefcase,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  User,
  Users,
  VenusAndMars,
  type LucideIcon,
} from "lucide-react";

import {
  formatDateForDisplay,
  getInternshipStatus,
  internshipStatusMeta,
  type InternshipApplicationRecord,
  wasEditedAfterApproval,
} from "@/lib/internship-application";
import { getInternshipAttachmentDownloadPath } from "@/lib/public-paths";
import { getSexLabel } from "@/lib/sex";
import { roleLabels, type UserRole } from "@/lib/user-management";

type StudentProfileOverviewProps = {
  heading: string;
  description?: string;
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
  application: InternshipApplicationRecord | null;
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function getUtcDayValue(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getDayDifference(from: Date, to: Date) {
  return Math.floor((getUtcDayValue(to) - getUtcDayValue(from)) / 86_400_000);
}

function computeProgress(startDate?: Date | null, endDate?: Date | null) {
  if (!startDate || !endDate) {
    return {
      percent: 0,
      phase: "unknown" as const,
      daysTotal: 0,
      daysRemaining: 0,
    };
  }

  const now = new Date();
  const daysTotal = Math.max(1, getDayDifference(startDate, endDate) + 1);

  if (getUtcDayValue(now) < getUtcDayValue(startDate)) {
    return {
      percent: 0,
      phase: "before" as const,
      daysTotal,
      daysRemaining: daysTotal,
    };
  }

  if (getUtcDayValue(now) > getUtcDayValue(endDate)) {
    return {
      percent: 100,
      phase: "done" as const,
      daysTotal,
      daysRemaining: 0,
    };
  }

  const elapsedDays = Math.min(daysTotal, getDayDifference(startDate, now) + 1);
  const daysRemaining = Math.max(0, getDayDifference(now, endDate));

  return {
    percent: Math.max(1, Math.min(100, Math.round((elapsedDays / daysTotal) * 100))),
    phase: "active" as const,
    daysTotal,
    daysRemaining,
  };
}

function DetailCard({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 shadow-elegant ${className ?? ""}`}>
      <div className="pointer-events-none absolute -top-20 -right-16 size-52 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl" />
      <div className="relative flex items-center gap-2.5 border-b border-[color:var(--color-shell-border)] bg-gradient-brand-soft px-5 py-3.5">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="relative grid gap-3.5 px-5 py-5">{children}</div>
    </section>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-[color:var(--color-shell-border)] bg-white/80 px-4 py-2.5">
      {Icon ? (
        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)]">
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

export function StudentProfileOverview({ heading, description, user, application }: StudentProfileOverviewProps) {
  const status = application ? getInternshipStatus(application) : null;
  const statusMeta = status ? internshipStatusMeta[status] : null;
  const showsReapprovalNotice = wasEditedAfterApproval(application);
  const showsRejectionReason = status === "Rejected" && Boolean(application?.rejectionReason?.trim());
  const progress = computeProgress(application?.internshipStartDate, application?.internshipEndDate);

  return (
    <section className="space-y-5">
      {showsReapprovalNotice ? (
        <div className="rounded-[1.5rem] border border-orange-200 bg-orange-50/85 p-4 text-sm leading-7 text-orange-900 shadow-sm">
          แบบฟอร์มนี้ถูกแก้ไขหลังจากได้รับการอนุมัติเมื่อ{" "}
          {application?.editedAfterApprovalAt ? formatDateForDisplay(application.editedAfterApprovalAt) : "ล่าสุด"}
          ระบบจึงส่งกลับมาอยู่ในรอบการตรวจสอบใหม่โดยอัตโนมัติ
        </div>
      ) : null}

      {showsRejectionReason ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/90 p-4 text-sm leading-7 text-rose-900 shadow-sm">
          <p className="font-semibold">เหตุผลที่ผู้ดูแลปฏิเสธแบบฟอร์ม</p>
          <p className="mt-2 whitespace-pre-wrap">{application?.rejectionReason}</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-5 shadow-elegant lg:col-span-2">
          <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl" />
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">สถานะฝึกงาน</p>
          <div className="mt-2.5 flex items-center gap-3">
            {statusMeta ? (
              <span className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.badgeClassName}`}>
                {statusMeta.label}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                ยังไม่มีสถานะ
              </span>
            )}
          </div>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
            <Clock3 className="size-3.5" />
            อัปเดตล่าสุด {application ? formatDateForDisplay(application.updatedAt) : "-"}
          </p>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-5 shadow-elegant lg:col-span-3">
          <div className="pointer-events-none absolute -bottom-16 -left-10 size-52 rounded-full bg-gradient-accent opacity-[0.12] blur-3xl" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">ความคืบหน้าการฝึกงาน</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{progress.percent}% เสร็จสิ้น</h3>
              <p className="mt-1 text-sm text-slate-600">
                {progress.phase === "before" && "ยังไม่เริ่มฝึกงาน กำหนดการเริ่มต้นถูกบันทึกไว้แล้ว"}
                {progress.phase === "active" && `เหลืออีก ${progress.daysRemaining} วัน จากทั้งหมด ${progress.daysTotal} วัน`}
                {progress.phase === "done" && "ช่วงเวลาฝึกงานสิ้นสุดแล้วและข้อมูลถูกเก็บไว้เป็นประวัติ"}
                {progress.phase === "unknown" && "เพิ่มวันที่เริ่มและสิ้นสุดเพื่อให้ระบบคำนวณความคืบหน้าได้"}
              </p>
            </div>
            <span className="hidden rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-semibold text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)] sm:inline-block">
              {application?.internshipStartDate ? formatDateForDisplay(application.internshipStartDate) : "-"} →{" "}
              {application?.internshipEndDate ? formatDateForDisplay(application.internshipEndDate) : "-"}
            </span>
          </div>

          <div className="mt-4">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-soft)]">
              <div className="h-full rounded-full bg-gradient-accent shadow-accent-glow" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                เริ่ม {application?.internshipStartDate ? formatDateForDisplay(application.internshipStartDate) : "-"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-[color:var(--color-brand-orange-deep)]" />
                สิ้นสุด {application?.internshipEndDate ? formatDateForDisplay(application.internshipEndDate) : "-"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <DetailCard icon={User} title={heading} description={description}>
          <DetailRow icon={User} label="ชื่อ - นามสกุล" value={displayValue(`${user.title} ${user.firstname} ${user.lastname}`.trim())} />
          <DetailRow icon={VenusAndMars} label="เพศ" value={displayValue(getSexLabel(user.sex))} />
          <DetailRow icon={CalendarDays} label="วันเกิด" value={user.birthDate ? formatDateForDisplay(user.birthDate) : "-"} />
          <DetailRow icon={Mail} label="อีเมล" value={user.email} />
          <DetailRow icon={School} label="สถาบัน" value={displayValue(user.institution)} />
          <DetailRow icon={ShieldCheck} label="สิทธิ์การใช้งาน" value={roleLabels[user.role]} />
          <DetailRow icon={MapPin} label="ที่อยู่" value={displayValue(user.address)} />
        </DetailCard>

        <DetailCard icon={GraduationCap} title="ข้อมูลการศึกษา">
          <DetailRow icon={IdCard} label="รหัสนักศึกษา" value={displayValue(application?.studentId)} />
          <DetailRow icon={Phone} label="เบอร์โทรศัพท์" value={displayValue(application?.phoneNumber)} />
          <DetailRow icon={Building2} label="คณะ" value={displayValue(application?.faculty)} />
          <DetailRow icon={BookOpen} label="สาขา / หลักสูตร" value={displayValue(application?.program)} />
          <DetailRow icon={GraduationCap} label="ชั้นปี" value={displayValue(application?.yearLevel)} />
          <DetailRow icon={User} label="อาจารย์นิเทศ" value={displayValue([application?.guidingProfessorFirstname, application?.guidingProfessorLastname].filter(Boolean).join(" "))} />
          <DetailRow icon={Phone} label="เบอร์โทรอาจารย์นิเทศ" value={displayValue(application?.guidingProfessorPhoneNumber)} />
        </DetailCard>

        <DetailCard icon={Briefcase} title="รายละเอียดการฝึกงาน" className="md:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailRow icon={Briefcase} label="ตำแหน่งฝึกงาน" value={displayValue(application?.internshipPosition)} />
            <DetailRow icon={Building2} label="หน่วยงาน / บริษัท" value={displayValue(application?.companyName)} />
            <DetailRow icon={MapPin} label="ที่อยู่บริษัท" value={displayValue(application?.companyAddress)} />
            <DetailRow icon={User} label="ผู้ดูแลในสถานประกอบการ" value={displayValue(application?.companySupervisorName)} />
            <DetailRow icon={Briefcase} label="ตำแหน่งผู้ดูแล" value={displayValue(application?.companySupervisorRole)} />
            <DetailRow icon={Mail} label="อีเมลผู้ดูแล" value={displayValue(application?.companySupervisorEmail)} />
            <DetailRow icon={Phone} label="เบอร์โทรผู้ดูแล" value={displayValue(application?.companySupervisorPhoneNumber)} />
            <DetailRow icon={User} label="ผู้ติดต่อฉุกเฉิน" value={displayValue(application?.emergencyContactName)} />
            <DetailRow icon={Users} label="ความสัมพันธ์" value={displayValue(application?.emergencyContactRelationship)} />
            <DetailRow icon={Phone} label="เบอร์โทรฉุกเฉิน" value={displayValue(application?.emergencyContactPhoneNumber)} />
            <div className="md:col-span-2">
              <DetailRow icon={FileText} label="หมายเหตุเพิ่มเติม" value={displayValue(application?.notes)} />
            </div>
          </div>
        </DetailCard>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-5 shadow-elegant">
        <div className="pointer-events-none absolute -top-20 -right-16 size-52 rounded-full bg-gradient-brand opacity-[0.07] blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">ไฟล์ประกอบการสมัคร</h2>
          </div>
          <div className="inline-flex w-fit items-center rounded-full bg-gradient-brand-soft px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)]">
            ทั้งหมด {application?.attachments.length ?? 0} ไฟล์
          </div>
        </div>

        {application?.attachments.length ? (
          <div className="relative mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {application.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group rounded-2xl border border-[color:var(--color-shell-border)] bg-white/90 p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-brand-violet-deep)]"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)] group-hover:bg-white/16 group-hover:text-white group-hover:ring-white/20">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950 group-hover:text-white">{attachment.fileName}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500 group-hover:text-white/70">{attachment.mimeType}</p>
                    <p className="mt-3 text-sm text-slate-600 group-hover:text-white/80">{(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <a
                    href={getInternshipAttachmentDownloadPath(attachment.filePath, attachment.fileName) ?? undefined}
                    download={attachment.fileName}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-3 py-2 text-xs font-semibold text-white shadow-accent-glow transition hover:opacity-95"
                  >
                    <Download className="size-3.5" />
                    ดาวน์โหลด
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="relative mt-4 text-sm leading-7 text-slate-500">ยังไม่มีไฟล์แนบในโปรไฟล์นี้</p>
        )}
      </section>
    </section>
  );
}