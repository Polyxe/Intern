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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/80 p-5 shadow-sm">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-2 text-base font-semibold text-slate-950">{value}</dd>
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
    <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-[rgba(142,85,183,0.1)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
            Internship Application
          </span>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{heading}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
          </div>
        </div>

        <div
          className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.badgeClassName}`}
        >
          {statusMeta.label}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,242,252,0.95))] p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">ข้อมูลนักศึกษา</h3>
            <p className="mt-1 text-sm text-slate-500">ข้อมูลประจำตัวและสาขาวิชาของผู้สมัคร</p>
          </div>
          <dl className="grid gap-4">
            <DetailItem label="รหัสนักศึกษา" value={application.studentId} />
            <DetailItem label="เบอร์โทรศัพท์" value={application.phoneNumber} />
            <DetailItem label="คณะ" value={application.faculty} />
            <DetailItem label="สาขา / หลักสูตร" value={application.program} />
            <DetailItem label="ชั้นปี" value={application.yearLevel} />
          </dl>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(255,252,248,0.95),_rgba(255,244,235,0.95))] p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">รายละเอียดสถานประกอบการ</h3>
            <p className="mt-1 text-sm text-slate-500">ตำแหน่งฝึกงาน ข้อมูลบริษัท และผู้ดูแลในสถานประกอบการ</p>
          </div>
          <dl className="grid gap-4">
            <DetailItem label="ตำแหน่งฝึกงาน" value={application.internshipPosition} />
            <DetailItem label="ชื่อบริษัท / หน่วยงาน" value={application.companyName} />
            <DetailItem label="ที่อยู่บริษัท" value={application.companyAddress} />
            <DetailItem label="ชื่อผู้ดูแล" value={application.companySupervisorName} />
            <DetailItem label="ตำแหน่งผู้ดูแล" value={application.companySupervisorRole} />
            <DetailItem label="อีเมลผู้ดูแล" value={application.companySupervisorEmail} />
            <DetailItem label="เบอร์ผู้ดูแล" value={application.companySupervisorPhoneNumber} />
          </dl>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(247,251,255,0.95),_rgba(240,247,255,0.95))] p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">ช่วงเวลาและผู้ติดต่อฉุกเฉิน</h3>
            <p className="mt-1 text-sm text-slate-500">ใช้ติดตามสถานะการฝึกงานและการติดต่อสำรอง</p>
          </div>
          <dl className="grid gap-4">
            <DetailItem label="เริ่มฝึกงาน" value={formatDateForDisplay(application.internshipStartDate)} />
            <DetailItem label="สิ้นสุดฝึกงาน" value={formatDateForDisplay(application.internshipEndDate)} />
            <DetailItem label="ชื่อผู้ติดต่อฉุกเฉิน" value={application.emergencyContactName} />
            <DetailItem label="ความสัมพันธ์" value={application.emergencyContactRelationship} />
            <DetailItem label="เบอร์ผู้ติดต่อฉุกเฉิน" value={application.emergencyContactPhoneNumber} />
            <DetailItem
              label="หมายเหตุเพิ่มเติม"
              value={application.notes?.trim() ? application.notes : "-"}
            />
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(245,248,252,0.95))] p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">ไฟล์ประกอบการสมัคร</h3>
          <p className="mt-1 text-sm text-slate-500">เอกสารที่นักศึกษาอัปโหลดไว้สำหรับการตรวจสอบแบบฟอร์มฝึกงาน</p>
        </div>

        {hasAttachments ? (
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
                <p className="mt-3 text-sm text-slate-600">
                  {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-7 text-slate-500">ยังไม่มีไฟล์แนบในใบสมัครนี้</p>
        )}
      </div>
    </section>
  );
}