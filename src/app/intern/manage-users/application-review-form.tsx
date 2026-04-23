"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  formatDateForDisplay,
  getInternshipStatus,
  internshipStatusMeta,
  INTERNSHIP_APPLICATION_APPROVAL_STATUSES,
  type InternshipApplicationRecord,
  wasEditedAfterApproval,
} from "@/lib/internship-application";

import { updateManagedApplicationApproval, type ManageUsersState } from "./actions";

type ApplicationReviewFormProps = {
  application: InternshipApplicationRecord;
  userId: string;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(242,106,33,0.28)] hover:brightness-105"
      disabled={pending}
    >
      {pending ? "กำลังอัปเดต..." : "อัปเดตสถานะฝึกงาน"}
    </Button>
  );
}

export function ApplicationReviewForm({ application, userId }: ApplicationReviewFormProps) {
  const [state, formAction] = useActionState(updateManagedApplicationApproval, initialState);
  const derivedStatus = getInternshipStatus(application);
  const derivedStatusMeta = internshipStatusMeta[derivedStatus];
  const showsReapprovalNotice = wasEditedAfterApproval(application);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="userId" value={userId} />

      {showsReapprovalNotice ? (
        <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-5 text-sm leading-7 text-orange-900">
          นักศึกษาได้แก้ไขข้อมูลหลังการอนุมัติเมื่อ{" "}
          {application.editedAfterApprovalAt ? formatDateForDisplay(application.editedAfterApprovalAt) : "ล่าสุด"}
          ระบบได้ส่งแบบฟอร์มกลับมาให้ตรวจสอบอีกครั้งแล้ว
        </div>
      ) : null}

      <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-[linear-gradient(135deg,_rgba(247,242,252,0.94),_rgba(255,249,243,0.94))] p-5">
        <p className="text-sm font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
          Derived Status
        </p>
        <div className={`mt-3 inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${derivedStatusMeta.badgeClassName}`}>
          {derivedStatusMeta.label}
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">{derivedStatusMeta.description}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="approvalStatus" className="text-sm font-medium text-slate-700">
          การอนุมัติจากผู้ดูแล
        </label>
        <select
          id="approvalStatus"
          name="approvalStatus"
          defaultValue={application.approvalStatus}
          className="h-12 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]"
        >
          <option value={INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Pending}>Pending</option>
          <option value={INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Approved}>On-going</option>
        </select>
        <p className="text-xs leading-5 text-slate-500">
          สถานะ Completed ไม่ต้องเลือกเอง ระบบจะอัปเดตให้อัตโนมัติเมื่อพ้นวันสิ้นสุดการฝึกงาน
        </p>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}