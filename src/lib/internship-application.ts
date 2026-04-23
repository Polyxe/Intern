import type { Prisma } from "@/generated/prisma/client";

export const INTERNSHIP_APPLICATION_APPROVAL_STATUSES = {
  Pending: "Pending",
  Approved: "Approved",
} as const;

export type InternshipApplicationApprovalStatus =
  (typeof INTERNSHIP_APPLICATION_APPROVAL_STATUSES)[keyof typeof INTERNSHIP_APPLICATION_APPROVAL_STATUSES];

export const INTERNSHIP_STATUSES = {
  Pending: "Pending",
  Ongoing: "On-going",
  Completed: "Completed",
} as const;

export type InternshipStatus = (typeof INTERNSHIP_STATUSES)[keyof typeof INTERNSHIP_STATUSES];

export const internshipApplicationSelect = {
  id: true,
  userId: true,
  studentId: true,
  phoneNumber: true,
  faculty: true,
  program: true,
  yearLevel: true,
  internshipPosition: true,
  companyName: true,
  companyAddress: true,
  guidingProfessorFirstname: true,
  guidingProfessorLastname: true,
  guidingProfessorPhoneNumber: true,
  companySupervisorName: true,
  companySupervisorRole: true,
  companySupervisorEmail: true,
  companySupervisorPhoneNumber: true,
  internshipStartDate: true,
  internshipEndDate: true,
  emergencyContactName: true,
  emergencyContactRelationship: true,
  emergencyContactPhoneNumber: true,
  notes: true,
  approvalStatus: true,
  approvedAt: true,
  editedAfterApprovalAt: true,
  attachments: {
    select: {
      id: true,
      fileName: true,
      filePath: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InternshipApplicationSelect;

export type InternshipApplicationRecord = Prisma.InternshipApplicationGetPayload<{
  select: typeof internshipApplicationSelect;
}>;

export const internshipStatusMeta: Record<
  InternshipStatus,
  {
    label: string;
    description: string;
    badgeClassName: string;
  }
> = {
  Pending: {
    label: "Pending",
    description: "รอการอนุมัติจากผู้ดูแลระบบก่อนเริ่มสถานะฝึกงาน",
    badgeClassName:
      "border-orange-200 bg-[rgba(242,106,33,0.12)] text-[color:var(--color-brand-orange-deep)]",
  },
  "On-going": {
    label: "On-going",
    description: "แบบฟอร์มได้รับการอนุมัติและอยู่ในช่วงฝึกงาน",
    badgeClassName:
      "border-[rgba(142,85,183,0.18)] bg-[rgba(142,85,183,0.12)] text-[color:var(--color-brand-violet-deep)]",
  },
  Completed: {
    label: "Completed",
    description: "สิ้นสุดช่วงฝึกงานแล้ว จึงปิดการแก้ไขข้อมูลอัตโนมัติ",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

function getUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function formatDateForInput(date: Date) {
  return getUtcDateKey(date);
}

export function formatDateForDisplay(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function hasInternshipEnded(endDate: Date, now = new Date()) {
  return getUtcDateKey(now) > getUtcDateKey(endDate);
}

export function getInternshipStatus(
  application: Pick<InternshipApplicationRecord, "approvalStatus" | "internshipEndDate">,
  now = new Date(),
): InternshipStatus {
  if (application.approvalStatus === INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Pending) {
    return INTERNSHIP_STATUSES.Pending;
  }

  if (hasInternshipEnded(application.internshipEndDate, now)) {
    return INTERNSHIP_STATUSES.Completed;
  }

  return INTERNSHIP_STATUSES.Ongoing;
}

export function canStudentEditApplication(
  application: Pick<InternshipApplicationRecord, "approvalStatus" | "internshipEndDate">,
  now = new Date(),
) {
  return getInternshipStatus(application, now) !== INTERNSHIP_STATUSES.Completed;
}

export function wasEditedAfterApproval(
  application: Pick<InternshipApplicationRecord, "editedAfterApprovalAt"> | null,
) {
  return Boolean(application?.editedAfterApprovalAt);
}