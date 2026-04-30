"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { ConfirmActionModal } from "@/components/confirm-action-modal";
import { Button } from "@/components/ui/button";
import {
  INTERNSHIP_APPLICATION_STATUSES,
  formatDateForDisplay,
  getInternshipStatus,
  getStatusChangeConfirmationContent,
  internshipStatusMeta,
  type InternshipApplicationStatus,
  type InternshipApplicationRecord,
  wasEditedAfterApproval,
} from "@/lib/internship-application";

import { updateManagedApplicationApproval, type ManageUsersState } from "./actions";

type ApplicationReviewFormProps = {
  application: InternshipApplicationRecord;
  userId: string;
  layout?: "panel" | "header";
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

export function ApplicationReviewForm({ application, userId, layout = "panel" }: ApplicationReviewFormProps) {
  const [state, formAction, pending] = useActionState(updateManagedApplicationApproval, initialState);
  const [selectedStatus, setSelectedStatus] = useState<InternshipApplicationStatus>(application.status);
  const [rejectionReason, setRejectionReason] = useState(application.rejectionReason ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const currentStatus = getInternshipStatus(application);
  const currentStatusMeta = internshipStatusMeta[currentStatus];
  const showsReapprovalNotice = wasEditedAfterApproval(application);
  const isHeaderLayout = layout === "header";
  const requiresRejectionReason = selectedStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected;
  const confirmation = useMemo(
    () => getStatusChangeConfirmationContent(application.status, selectedStatus),
    [application.status, selectedStatus],
  );

  return (
    <form ref={formRef} action={formAction} className={isHeaderLayout ? "space-y-4" : "space-y-5"}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={selectedStatus} />
      <input type="hidden" name="rejectionReason" value={rejectionReason} />

      {!isHeaderLayout ? (
        <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-[linear-gradient(135deg,_rgba(247,242,252,0.94),_rgba(255,249,243,0.94))] p-5">
          <p className="text-sm font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
            สถานะปัจจุบัน
          </p>
          <div className={`mt-3 inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${currentStatusMeta.badgeClassName}`}>
            {currentStatusMeta.label}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className={isHeaderLayout ? "text-sm font-medium text-white/88" : "text-sm font-medium text-slate-700"}>การดำเนินการของผู้ดูแล</p>

        <ReviewStatusActionButtons
          layout={layout}
          currentStatus={currentStatus}
          onChoose={(status) => {
            setSelectedStatus(status);
            setRejectionReason("");
            setConfirmOpen(true);
          }}
        />
      </div>

      {state.error ? (
        <p className={isHeaderLayout ? "rounded-2xl border border-rose-200/60 bg-rose-500/12 px-4 py-3 text-sm text-white" : "rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700"}>
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className={isHeaderLayout ? "rounded-2xl border border-emerald-200/60 bg-emerald-500/12 px-4 py-3 text-sm text-white" : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"}>
          {state.success}
        </p>
      ) : null}
      <ConfirmActionModal
        open={confirmOpen}
        title={confirmation.title}
        description={confirmation.description}
        confirmLabel={confirmation.confirmLabel}
        pending={pending}
        onCancel={() => {
          setSelectedStatus(application.status);
          setRejectionReason("");
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          const form = formRef.current;

          if (!form || !form.reportValidity()) {
            return;
          }

          form.requestSubmit();
          setConfirmOpen(false);
        }}
      >
        {requiresRejectionReason ? (
          <div className="space-y-2 pt-2">
            <label htmlFor={`rejectionReason-${userId}`} className="text-sm font-medium text-slate-700">
              เหตุผลในการปฏิเสธ
            </label>
            <textarea
              id={`rejectionReason-${userId}`}
              rows={4}
              required
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="ระบุเหตุผลที่นักศึกษาต้องแก้ไขก่อนส่งกลับเข้าระบบ"
              className="w-full rounded-[1.35rem] border border-[color:var(--color-shell-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]"
            />
          </div>
        ) : null}
      </ConfirmActionModal>
    </form>
  );
}

function ReviewStatusActionButtons({
  layout,
  currentStatus,
  onChoose,
}: {
  layout: "panel" | "header";
  currentStatus: InternshipApplicationStatus;
  onChoose: (status: InternshipApplicationStatus) => void;
}) {
  const { pending } = useFormStatus();
  const isHeaderLayout = layout === "header";
  const showsCompleteAction =
    currentStatus === INTERNSHIP_APPLICATION_STATUSES.Ongoing ||
    currentStatus === INTERNSHIP_APPLICATION_STATUSES.Finished;
  const primaryActionStatus = showsCompleteAction
    ? INTERNSHIP_APPLICATION_STATUSES.Finished
    : INTERNSHIP_APPLICATION_STATUSES.Ongoing;
  const primaryActionLabel = showsCompleteAction ? "ฝึกงานเสร็จสิ้น" : "อนุมัติ";
  const primaryActionDescription = showsCompleteAction
    ? "เสร็จสิ้นการฝึกงาน"
    : "เปลี่ยนสถานะเป็นกำลังฝึกงาน";

  return (
    <div className={isHeaderLayout ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className={
          isHeaderLayout
            ? "h-auto min-h-12 justify-start rounded-[1.35rem] border border-white/18 bg-white/10 px-5 py-4 text-left text-sm font-semibold text-white shadow-none backdrop-blur transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
            : "h-auto min-h-12 justify-start rounded-[1.35rem] border border-rose-200 bg-rose-50 px-5 py-4 text-left text-sm font-semibold text-rose-700 shadow-[0_14px_28px_rgba(244,63,94,0.12)] transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        }
        disabled={pending || currentStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected}
        onClick={() => onChoose(INTERNSHIP_APPLICATION_STATUSES.Rejected)}
      >
        <span className="flex flex-col items-start">
          <span>ปฏิเสธ</span>
          <span className={isHeaderLayout ? "mt-1 text-xs font-medium text-white/72" : "mt-1 text-xs font-medium text-rose-600/80"}>
            ส่งแบบฟอร์มกลับไปให้แก้ไขและรอส่งใหม่
          </span>
        </span>
      </Button>

      <Button
        type="button"
        size="lg"
        className={`h-auto min-h-12 justify-start rounded-[1.35rem] px-5 py-4 text-left text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${
          showsCompleteAction
            ? "bg-[linear-gradient(135deg,_#13b981,_#0f9f73)] shadow-[0_16px_30px_rgba(16,185,129,0.24)]"
            : "bg-[linear-gradient(135deg,_#a464d4,_#8e55b7)] shadow-[0_16px_30px_rgba(142,85,183,0.28)]"
        }`}
        disabled={pending || currentStatus === primaryActionStatus}
        onClick={() => onChoose(primaryActionStatus)}
      >
        <span className="flex flex-col items-start">
          <span>{primaryActionLabel}</span>
          <span className="mt-1 text-xs font-medium text-white/80">{primaryActionDescription}</span>
        </span>
      </Button>

      {pending ? <p className={isHeaderLayout ? "text-sm text-white/72 sm:col-span-2" : "text-sm text-slate-500 sm:col-span-2"}>กำลังอัปเดตสถานะ...</p> : null}
    </div>
  );
}