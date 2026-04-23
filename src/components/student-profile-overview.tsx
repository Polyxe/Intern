import { UserAvatar } from "@/components/user-avatar";
import {
  formatDateForDisplay,
  getInternshipStatus,
  internshipStatusMeta,
  type InternshipApplicationRecord,
  wasEditedAfterApproval,
} from "@/lib/internship-application";
import { normalizePublicUploadPath } from "@/lib/public-paths";
import { roleLabels, type UserRole } from "@/lib/user-management";

type StudentProfileOverviewProps = {
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
  application: InternshipApplicationRecord | null;
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/80 p-5 shadow-sm">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-2 text-base font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

export function StudentProfileOverview({ heading, description, user, application }: StudentProfileOverviewProps) {
  const status = application ? getInternshipStatus(application) : null;
  const statusMeta = status ? internshipStatusMeta[status] : null;
  const showsReapprovalNotice = wasEditedAfterApproval(application);

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
              Student Profile
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{heading}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
            </div>
          </div>
        </div>

        {statusMeta ? (
          <div className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.badgeClassName}`}>
            {statusMeta.label}
          </div>
        ) : null}
      </div>

      {showsReapprovalNotice ? (
        <div className="mt-6 rounded-[1.5rem] border border-orange-200 bg-orange-50/80 p-5 text-sm leading-7 text-orange-900 shadow-sm">
          แบบฟอร์มนี้ถูกแก้ไขหลังจากได้รับการอนุมัติเมื่อ{" "}
          {application?.editedAfterApprovalAt ? formatDateForDisplay(application.editedAfterApprovalAt) : "ล่าสุด"},
          ขณะนี้จึงอยู่ระหว่างรอผู้ดูแลระบบตรวจสอบการแก้ไขรอบใหม่
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,242,252,0.95))] p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">ข้อมูลส่วนตัว</h3>
            <p className="mt-1 text-sm text-slate-500">ข้อมูลโปรไฟล์หลักของนักศึกษาและข้อมูลที่ตั้งต้นจากผู้ดูแลระบบ</p>
          </div>
          <dl className="grid gap-4">
            <DetailItem label="ชื่อ - นามสกุล" value={displayValue(`${user.title} ${user.firstname} ${user.lastname}`.trim())} />
            <DetailItem label="เพศ" value={displayValue(user.sex)} />
            <DetailItem label="วันเกิด" value={user.birthDate ? formatDateForDisplay(user.birthDate) : "-"} />
            <DetailItem label="อีเมล" value={user.email} />
            <DetailItem label="สถาบัน" value={displayValue(user.institution)} />
            <DetailItem label="สิทธิ์การใช้งาน" value={roleLabels[user.role]} />
            <DetailItem label="ที่อยู่" value={displayValue(user.address)} />
          </dl>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(255,252,248,0.95),_rgba(255,244,235,0.95))] p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">ข้อมูลการศึกษาและฝึกงาน</h3>
            <p className="mt-1 text-sm text-slate-500">ข้อมูลการเรียน ข้อมูลบริษัท และอาจารย์นิเทศ</p>
          </div>
          <dl className="grid gap-4">
            <DetailItem label="รหัสนักศึกษา" value={displayValue(application?.studentId)} />
            <DetailItem label="เบอร์โทรศัพท์" value={displayValue(application?.phoneNumber)} />
            <DetailItem label="คณะ" value={displayValue(application?.faculty)} />
            <DetailItem label="สาขา / หลักสูตร" value={displayValue(application?.program)} />
            <DetailItem label="ชั้นปี" value={displayValue(application?.yearLevel)} />
            <DetailItem label="ตำแหน่งฝึกงาน" value={displayValue(application?.internshipPosition)} />
            <DetailItem label="ชื่อบริษัท / หน่วยงาน" value={displayValue(application?.companyName)} />
            <DetailItem label="ที่อยู่บริษัท" value={displayValue(application?.companyAddress)} />
            <DetailItem label="ชื่ออาจารย์นิเทศ" value={displayValue([application?.guidingProfessorFirstname, application?.guidingProfessorLastname].filter(Boolean).join(" "))} />
            <DetailItem label="เบอร์โทรอาจารย์นิเทศ" value={displayValue(application?.guidingProfessorPhoneNumber)} />
          </dl>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(247,251,255,0.95),_rgba(240,247,255,0.95))] p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">ผู้ติดต่อและช่วงเวลา</h3>
            <p className="mt-1 text-sm text-slate-500">ข้อมูลผู้ดูแลสถานประกอบการ ผู้ติดต่อฉุกเฉิน และระยะเวลาฝึกงาน</p>
          </div>
          <dl className="grid gap-4">
            <DetailItem label="ชื่อผู้ดูแลสถานประกอบการ" value={displayValue(application?.companySupervisorName)} />
            <DetailItem label="ตำแหน่งผู้ดูแล" value={displayValue(application?.companySupervisorRole)} />
            <DetailItem label="อีเมลผู้ดูแล" value={displayValue(application?.companySupervisorEmail)} />
            <DetailItem label="เบอร์โทรผู้ดูแล" value={displayValue(application?.companySupervisorPhoneNumber)} />
            <DetailItem label="เริ่มฝึกงาน" value={application?.internshipStartDate ? formatDateForDisplay(application.internshipStartDate) : "-"} />
            <DetailItem label="สิ้นสุดฝึกงาน" value={application?.internshipEndDate ? formatDateForDisplay(application.internshipEndDate) : "-"} />
            <DetailItem label="ชื่อผู้ติดต่อฉุกเฉิน" value={displayValue(application?.emergencyContactName)} />
            <DetailItem label="ความสัมพันธ์" value={displayValue(application?.emergencyContactRelationship)} />
            <DetailItem label="เบอร์โทรผู้ติดต่อฉุกเฉิน" value={displayValue(application?.emergencyContactPhoneNumber)} />
            <DetailItem label="หมายเหตุเพิ่มเติม" value={displayValue(application?.notes)} />
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(245,248,252,0.95))] p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">ไฟล์ประกอบการสมัคร</h3>
          <p className="mt-1 text-sm text-slate-500">เอกสารที่แนบไว้ในโปรไฟล์นักศึกษา</p>
        </div>

        {application?.attachments.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {application.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={normalizePublicUploadPath(attachment.filePath) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--color-brand-violet-deep)] hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-950">{attachment.fileName}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{attachment.mimeType}</p>
                <p className="mt-3 text-sm text-slate-600">{(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-7 text-slate-500">ยังไม่มีไฟล์แนบในโปรไฟล์นี้</p>
        )}
      </div>
    </section>
  );
}