"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm?: () => void;
  children?: ReactNode;
};

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = "กำลังอัปเดต...",
  cancelLabel = "ยกเลิก",
  pending = false,
  onCancel,
  onConfirm,
  children,
}: ConfirmActionModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,16,48,0.4)] px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-white p-6 shadow-[0_24px_70px_rgba(56,24,94,0.22)]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
          {children}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-full border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-soft-brand"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type={onConfirm ? "button" : "submit"}
            className="h-11 rounded-full bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(242,106,33,0.24)] hover:brightness-105"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}