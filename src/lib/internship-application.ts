import type { Prisma } from "@/generated/prisma/client";

import { internshipWorkFileSelect } from "@/lib/internship-work";

export const INTERNSHIP_APPLICATION_STATUSES = {
  Pending: "Pending",
  Rejected: "Rejected",
  Ongoing: "Ongoing",
  Finished: "Finished",
} as const;

export type InternshipApplicationStatus =
  (typeof INTERNSHIP_APPLICATION_STATUSES)[keyof typeof INTERNSHIP_APPLICATION_STATUSES];

export const MANAGE_USER_ROLE_FILTERS = {
  Student: "student",
  Admin: "admin",
} as const;

export type ManageUserRoleFilter = (typeof MANAGE_USER_ROLE_FILTERS)[keyof typeof MANAGE_USER_ROLE_FILTERS];

export const STUDENT_STATUS_FILTERS = {
  All: "all",
  NoApplication: "no-application",
  Pending: "pending",
  Rejected: "rejected",
  Ongoing: "on-going",
  NeedsFollowUp: "needs-follow-up",
  Finished: "finished",
} as const;

export type StudentStatusFilter = (typeof STUDENT_STATUS_FILTERS)[keyof typeof STUDENT_STATUS_FILTERS];

export const studentStatusFilterOrder: StudentStatusFilter[] = [
  STUDENT_STATUS_FILTERS.All,
  STUDENT_STATUS_FILTERS.NoApplication,
  STUDENT_STATUS_FILTERS.Pending,
  STUDENT_STATUS_FILTERS.Rejected,
  STUDENT_STATUS_FILTERS.Ongoing,
  STUDENT_STATUS_FILTERS.NeedsFollowUp,
  STUDENT_STATUS_FILTERS.Finished,
];

export const studentStatusFilterMeta: Record<
  StudentStatusFilter,
  {
    label: string;
    emptyStateLabel: string;
    badgeClassName: string;
    pillClassName: string;
  }
> = {
  all: {
    label: "ทั้งหมด",
    emptyStateLabel: "ทั้งหมด",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-800",
    pillClassName: "border-sky-200 bg-white text-sky-800 hover:border-sky-300 hover:bg-sky-50",
  },
  "no-application": {
    label: "ยังไม่มีใบสมัคร",
    emptyStateLabel: "ยังไม่มีใบสมัคร",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
    pillClassName: "border-amber-200 bg-white text-amber-800 hover:border-amber-300 hover:bg-amber-50",
  },
  pending: {
    label: "รอตรวจสอบ",
    emptyStateLabel: "รอตรวจสอบ",
    badgeClassName:
      "border-orange-200 bg-[rgba(242,106,33,0.12)] text-[color:var(--color-brand-orange-deep)]",
    pillClassName:
      "border-orange-200 bg-white text-[color:var(--color-brand-orange-deep)] hover:bg-[rgba(242,106,33,0.08)]",
  },
  rejected: {
    label: "ถูกปฏิเสธ",
    emptyStateLabel: "ถูกปฏิเสธ",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    pillClassName: "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  },
  "on-going": {
    label: "กำลังฝึกงาน",
    emptyStateLabel: "กำลังฝึกงาน",
    badgeClassName:
      "border-[rgba(142,85,183,0.18)] bg-[rgba(142,85,183,0.12)] text-[color:var(--color-brand-violet-deep)]",
    pillClassName:
      "border-[rgba(142,85,183,0.2)] bg-white text-[color:var(--color-brand-violet-deep)] hover:bg-[rgba(142,85,183,0.08)]",
  },
  "needs-follow-up": {
    label: "มีการแก้ไข",
    emptyStateLabel: "มีการแก้ไข",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-800",
    pillClassName: "border-orange-200 bg-white text-orange-800 hover:border-orange-300 hover:bg-orange-50",
  },
  finished: {
    label: "ฝึกงานเสร็จสิ้น",
    emptyStateLabel: "ฝึกงานเสร็จสิ้น",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pillClassName: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  },
};

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
  rejectionReason: true,
  status: true,
  approvedAt: true,
  finishedAt: true,
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
  workFiles: {
    select: internshipWorkFileSelect,
    orderBy: {
      createdAt: "desc",
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InternshipApplicationSelect;

export type InternshipApplicationRecord = Prisma.InternshipApplicationGetPayload<{
  select: typeof internshipApplicationSelect;
}>;

export const internshipStatusMeta: Record<
  InternshipApplicationStatus,
  {
    label: string;
    description: string;
    badgeClassName: string;
    headerBadgeClassName: string;
  }
> = {
  Pending: {
    label: studentStatusFilterMeta.pending.label,
    description: "รอผู้ดูแลตรวจสอบ",
    badgeClassName: studentStatusFilterMeta.pending.badgeClassName,
    headerBadgeClassName: studentStatusFilterMeta.pending.pillClassName,
  },
  Rejected: {
    label: studentStatusFilterMeta.rejected.label,
    description: "ถูกส่งกลับให้แก้ไข",
    badgeClassName: studentStatusFilterMeta.rejected.badgeClassName,
    headerBadgeClassName: studentStatusFilterMeta.rejected.pillClassName,
  },
  Ongoing: {
    label: studentStatusFilterMeta["on-going"].label,
    description: "อนุมัติแล้วและอยู่ระหว่างฝึกงาน",
    badgeClassName: studentStatusFilterMeta["on-going"].badgeClassName,
    headerBadgeClassName: studentStatusFilterMeta["on-going"].pillClassName,
  },
  Finished: {
    label: studentStatusFilterMeta.finished.label,
    description: "ปิดสถานะแล้วและล็อกการแก้ไข",
    badgeClassName: studentStatusFilterMeta.finished.badgeClassName,
    headerBadgeClassName: studentStatusFilterMeta.finished.pillClassName,
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

export function getStudentStatusFilterForApplication(
  application: Pick<InternshipApplicationRecord, "status"> | null,
): StudentStatusFilter {
  if (!application) {
    return STUDENT_STATUS_FILTERS.NoApplication;
  }

  if (application.status === INTERNSHIP_APPLICATION_STATUSES.Pending) {
    return STUDENT_STATUS_FILTERS.Pending;
  }

  if (application.status === INTERNSHIP_APPLICATION_STATUSES.Rejected) {
    return STUDENT_STATUS_FILTERS.Rejected;
  }

  if (application.status === INTERNSHIP_APPLICATION_STATUSES.Ongoing) {
    return STUDENT_STATUS_FILTERS.Ongoing;
  }

  return STUDENT_STATUS_FILTERS.Finished;
}

export function matchesStudentStatusFilter(
  application: Pick<InternshipApplicationRecord, "status" | "editedAfterApprovalAt"> | null,
  filter: StudentStatusFilter,
) {
  if (filter === STUDENT_STATUS_FILTERS.All) {
    return true;
  }

  if (filter === STUDENT_STATUS_FILTERS.NeedsFollowUp) {
    return wasEditedAfterApproval(application);
  }

  return getStudentStatusFilterForApplication(application) === filter;
}

export function getInternshipStatus(
  application: Pick<InternshipApplicationRecord, "status">,
): InternshipApplicationStatus {
  return application.status;
}

export function canStudentEditApplication(
  application: Pick<InternshipApplicationRecord, "status">,
) {
  return application.status !== INTERNSHIP_APPLICATION_STATUSES.Finished;
}

export function canStudentManageWorkFiles(
  application: Pick<InternshipApplicationRecord, "status">,
) {
  return application.status === INTERNSHIP_APPLICATION_STATUSES.Ongoing;
}

export function isApprovedInternshipStatus(status: InternshipApplicationStatus) {
  return status === INTERNSHIP_APPLICATION_STATUSES.Ongoing || status === INTERNSHIP_APPLICATION_STATUSES.Finished;
}

export function wasEditedAfterApproval(
  application: Pick<InternshipApplicationRecord, "editedAfterApprovalAt"> | null,
) {
  return Boolean(application?.editedAfterApprovalAt);
}

export function getManageUsersEmptyStateMessage(filters: {
  role: ManageUserRoleFilter;
  studentStatus: StudentStatusFilter;
}) {
  if (filters.role === MANAGE_USER_ROLE_FILTERS.Admin) {
    return "ไม่พบบัญชีผู้ดูแลระบบในขณะนี้";
  }

  if (filters.studentStatus === STUDENT_STATUS_FILTERS.All) {
    return "ไม่พบบัญชีนักศึกษาในขณะนี้";
  }

  return `ไม่พบบัญชีนักศึกษาที่อยู่ในสถานะ ${studentStatusFilterMeta[filters.studentStatus].emptyStateLabel}`;
}

export function getLifecycleStatusLabel(status: InternshipApplicationStatus) {
  return internshipStatusMeta[status].label;
}

export function getStatusChangeConfirmationContent(
  currentStatus: InternshipApplicationStatus,
  nextStatus: InternshipApplicationStatus,
) {
  if (nextStatus === INTERNSHIP_APPLICATION_STATUSES.Pending) {
    return {
      title: "ยืนยันการเปลี่ยนสถานะกลับเป็นรอตรวจสอบ",
      description:
        currentStatus === INTERNSHIP_APPLICATION_STATUSES.Finished
          ? "การเปลี่ยนกลับเป็นรอตรวจสอบจะเปิดรอบการพิจารณาใหม่ ล้างข้อมูลเวลาอนุมัติและเวลาเสร็จสิ้น และอนุญาตให้นักศึกษาแก้ไขข้อมูลได้อีกครั้ง"
          : "การเปลี่ยนกลับเป็นรอตรวจสอบจะส่งแบบฟอร์มกลับเข้าสู่รอบการพิจารณาอีกครั้ง และล้างข้อมูลเวลาอนุมัติปัจจุบัน",
      confirmLabel: "ยืนยันเป็นรอตรวจสอบ",
    };
  }

  if (nextStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected) {
    return {
      title: "ยืนยันการปฏิเสธแบบฟอร์มฝึกงาน",
      description:
        "เมื่อปฏิเสธแล้ว สถานะอนุมัติและเวลาเสร็จสิ้นจะถูกล้างออก นักศึกษาจะกลับมาแก้ไขข้อมูลได้ และต้องส่งแบบฟอร์มเข้ามาใหม่เพื่อให้ผู้ดูแลพิจารณาอีกครั้ง",
      confirmLabel: "ยืนยันการปฏิเสธ",
    };
  }

  if (nextStatus === INTERNSHIP_APPLICATION_STATUSES.Ongoing) {
    return {
      title: "ยืนยันการอนุมัติแบบฟอร์มฝึกงาน",
      description:
        currentStatus === INTERNSHIP_APPLICATION_STATUSES.Finished
          ? "การเปลี่ยนกลับเป็นกำลังฝึกงานจะเปิดสถานะฝึกงานอีกครั้ง ล้างเวลาเสร็จสิ้น และอนุญาตให้นักศึกษาแก้ไขข้อมูลได้ตามปกติ"
          : currentStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected
            ? "การอนุมัติจะล้างสถานะปฏิเสธเดิมและย้ายแบบฟอร์มเข้าสู่ช่วงกำลังฝึกงานทันที"
            : "การเปลี่ยนสถานะนี้หมายถึงผู้ดูแลอนุมัติแบบฟอร์มแล้ว และนักศึกษาจะอยู่ในช่วงกำลังฝึกงานทันที",
      confirmLabel: "ยืนยันการอนุมัติ",
    };
  }

  return {
    title: "ยืนยันการเปลี่ยนสถานะเป็นฝึกงานเสร็จสิ้น",
    description:
      "การเปลี่ยนสถานะเป็นฝึกงานเสร็จสิ้นจะบันทึกเวลาเสร็จสิ้น ล้างธงมีการแก้ไข และล็อกการแก้ไขข้อมูลของนักศึกษาจนกว่าจะมีผู้ดูแลเปิดสถานะใหม่อีกครั้ง",
    confirmLabel: "ยืนยันฝึกงานเสร็จสิ้น",
  };
}