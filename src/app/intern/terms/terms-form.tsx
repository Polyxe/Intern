"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { acceptStudentTerms, type AcceptTermsState } from "./actions";

const initialState: AcceptTermsState = {
  error: "",
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
      {pending ? "กำลังบันทึก..." : "ยอมรับและเข้าสู่ระบบต่อ"}
    </Button>
  );
}

export function TermsForm() {
  const [state, formAction] = useActionState(acceptStudentTerms, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-start gap-3 rounded-3xl border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-5 text-sm leading-7 text-slate-700">
        <input
          name="acceptTerms"
          type="checkbox"
          value="yes"
          className="mt-1 h-4 w-4 rounded border-[color:var(--color-shell-border)] text-[color:var(--color-brand-violet-deep)] focus:ring-[color:var(--color-brand-focus-ring)]"
          required
        />
        <span>
          ฉันยืนยันว่าข้อมูลที่จะกรอกในระบบเป็นข้อมูลจริง เอกสารที่อัปโหลดเป็นของฉันหรือได้รับอนุญาตให้ใช้งาน และยอมให้ผู้ดูแลระบบตรวจสอบข้อมูลเพื่อใช้ประกอบการจัดการฝึกงาน
        </span>
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}