import {
  Briefcase,
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";

import {
  formatDateForDisplay,
  getInternshipStatus,
  internshipStatusMeta,
  type InternshipApplicationRecord,
} from "@/lib/internship-application";
import { normalizePublicUploadPath } from "@/lib/public-paths";

type InternshipApplicationOverviewProps = {
  application: InternshipApplicationRecord;
  heading: string;
  description: string;
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
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
  children: React.ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 shadow-elegant ${className ?? ""}`}>
      <div className="pointer-events-none absolute -top-20 -right-16 size-52 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl" />
      <div className="relative flex items-center gap-3 border-b border-[color:var(--color-shell-border)] bg-gradient-brand-soft px-6 py-4">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="relative grid gap-4 px-6 py-6">{children}</div>
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

export function InternshipApplicationOverview({
  application,
  heading,
  description,
}: InternshipApplicationOverviewProps) {
  const status = getInternshipStatus(application);
  const statusMeta = internshipStatusMeta[status];
  const hasAttachments = application.attachments.length > 0;

  return (
    <section className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-6 shadow-elegant">
        <div className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase ring-1 ring-[rgba(142,85,183,0.12)]">
              Internship Application
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{heading}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
            </div>
          </div>

          <div className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.badgeClassName}`}>
            {statusMeta.label}
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard icon={GraduationCap} title="ข้อมูลนักศึกษา" description="ข้อมูลประจำตัวและข้อมูลการศึกษาของผู้สมัคร">
          <DetailRow icon={User} label="รหัสนักศึกษา" value={displayValue(application.studentId)} />
          <DetailRow icon={Phone} label="เบอร์โทรศัพท์" value={displayValue(application.phoneNumber)} />
          <DetailRow label="คณะ" value={displayValue(application.faculty)} />
          <DetailRow label="สาขา / หลักสูตร" value={displayValue(application.program)} />
          <DetailRow label="ชั้นปี" value={displayValue(application.yearLevel)} />
          <DetailRow label="อาจารย์นิเทศ" value={displayValue([application.guidingProfessorFirstname, application.guidingProfessorLastname].filter(Boolean).join(" "))} />
          <DetailRow icon={Phone} label="เบอร์อาจารย์นิเทศ" value={displayValue(application.guidingProfessorPhoneNumber)} />
        </DetailCard>

        <DetailCard icon={Briefcase} title="รายละเอียดสถานประกอบการ" description="ตำแหน่งฝึกงาน ข้อมูลบริษัท และผู้ดูแลในสถานประกอบการ">
          <DetailRow icon={Briefcase} label="ตำแหน่งฝึกงาน" value={displayValue(application.internshipPosition)} />
          <DetailRow label="ชื่อบริษัท / หน่วยงาน" value={displayValue(application.companyName)} />
          <DetailRow icon={MapPin} label="ที่อยู่บริษัท" value={displayValue(application.companyAddress)} />
          <DetailRow label="ชื่อผู้ดูแล" value={displayValue(application.companySupervisorName)} />
          <DetailRow label="ตำแหน่งผู้ดูแล" value={displayValue(application.companySupervisorRole)} />
          <DetailRow icon={Mail} label="อีเมลผู้ดูแล" value={displayValue(application.companySupervisorEmail)} />
          <DetailRow icon={Phone} label="เบอร์ผู้ดูแล" value={displayValue(application.companySupervisorPhoneNumber)} />
        </DetailCard>

        <DetailCard icon={CalendarDays} title="ช่วงเวลาและผู้ติดต่อฉุกเฉิน" description="ข้อมูลวันที่ฝึกงานและการติดต่อสำรอง" className="md:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailRow icon={CalendarDays} label="เริ่มฝึกงาน" value={formatDateForDisplay(application.internshipStartDate)} />
            <DetailRow icon={CalendarDays} label="สิ้นสุดฝึกงาน" value={formatDateForDisplay(application.internshipEndDate)} />
            <DetailRow icon={ShieldCheck} label="ชื่อผู้ติดต่อฉุกเฉิน" value={displayValue(application.emergencyContactName)} />
            <DetailRow label="ความสัมพันธ์" value={displayValue(application.emergencyContactRelationship)} />
            <DetailRow icon={Phone} label="เบอร์ผู้ติดต่อฉุกเฉิน" value={displayValue(application.emergencyContactPhoneNumber)} />
            <div className="md:col-span-2">
              <DetailRow label="หมายเหตุเพิ่มเติม" value={displayValue(application.notes)} />
            </div>
          </div>
        </DetailCard>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/90 p-6 shadow-elegant">
        <div className="pointer-events-none absolute -top-20 -right-16 size-52 rounded-full bg-gradient-brand opacity-[0.07] blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">ไฟล์ประกอบการสมัคร</h3>
            <p className="mt-1 text-sm text-slate-500">เอกสารที่นักศึกษาอัปโหลดไว้สำหรับการตรวจสอบแบบฟอร์มฝึกงาน</p>
          </div>
          <div className="inline-flex w-fit items-center rounded-full bg-gradient-brand-soft px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] ring-1 ring-[rgba(142,85,183,0.12)]">
            ทั้งหมด {application.attachments.length} ไฟล์
          </div>
        </div>

        {hasAttachments ? (
          <div className="relative mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {application.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group rounded-2xl border border-[color:var(--color-shell-border)] bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-brand-violet-deep)]"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[rgba(142,85,183,0.12)] group-hover:bg-white/16 group-hover:text-white group-hover:ring-white/20">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950 group-hover:text-white">{attachment.fileName}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 group-hover:text-white/72">{attachment.mimeType}</p>
                    <p className="mt-3 text-sm text-slate-600 group-hover:text-white/82">{(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={normalizePublicUploadPath(attachment.filePath) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-[color:var(--color-shell-border)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--color-brand-violet-deep)] transition hover:border-white/30 hover:bg-white/90 group-hover:border-white/20 group-hover:bg-white/12 group-hover:text-white"
                  >
                    เปิดไฟล์
                  </a>
                  <a
                    href={normalizePublicUploadPath(attachment.filePath) ?? undefined}
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
          <p className="relative mt-5 text-sm leading-7 text-slate-500">ยังไม่มีไฟล์แนบในใบสมัครนี้</p>
        )}
      </section>
    </section>
  );
}