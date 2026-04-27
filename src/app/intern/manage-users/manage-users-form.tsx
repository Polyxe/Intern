"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { createManagedUser, type ManageUsersState } from "./actions";

type ManageUsersFormProps = {
  allowedRoles: Array<{
    label: string;
    value: string;
  }>;
  cancelHref?: string;
  returnTo?: string | null;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white/95 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-2xl bg-gradient-accent px-6 text-sm font-semibold text-white shadow-accent-glow hover:opacity-95"
      disabled={pending}
    >
      {pending ? "กำลังบันทึก..." : "สร้างผู้ใช้"}
    </Button>
  );
}

export function ManageUsersForm({ allowedRoles, cancelHref, returnTo }: ManageUsersFormProps) {
  const [state, formAction] = useActionState(createManagedUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const singleAllowedRole = allowedRoles.length === 1 ? allowedRoles[0] : null;

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <div className="grid gap-3 rounded-[1.35rem] border border-[color:var(--color-shell-border)] bg-white px-4 py-4 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Step 1</p>
          <p className="mt-1 font-medium text-slate-900">ระบุบัญชี</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Step 2</p>
          <p className="mt-1 font-medium text-slate-900">กำหนดบทบาท</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Step 3</p>
          <p className="mt-1 font-medium text-slate-900">บันทึกทันที</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="example@cmu.ac.th"
            className={inputClassName}
            required
          />
        </div>

        {singleAllowedRole ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">สิทธิ์การใช้งาน</label>
            <input type="hidden" name="role" value={singleAllowedRole.value} />
            <div className={`${inputClassName} flex items-center bg-slate-50 text-slate-500`}>{singleAllowedRole.label}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="role" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              สิทธิ์การใช้งาน
            </label>
            <select id="role" name="role" defaultValue={allowedRoles[0]?.value} className={inputClassName} required>
              {allowedRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            คำนำหน้า
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="ไม่กรอกจะใช้ค่าเริ่มต้น"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="firstname" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            ชื่อ
          </label>
          <input
            id="firstname"
            name="firstname"
            type="text"
            placeholder="ไม่กรอกจะใช้อีเมลส่วนหน้าแทน"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="lastname" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            นามสกุล
          </label>
          <input id="lastname" name="lastname" type="text" placeholder="ไม่บังคับ" className={inputClassName} />
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-500">
        ผู้ดูแลระบบสามารถสร้างบัญชีใหม่ได้ตามสิทธิ์ของตนเอง โดยระบุอีเมลที่อนุญาตให้เข้าสู่ระบบผ่าน CMU Entra ID หรือ Google OAuth
      </p>

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-soft-brand transition hover:bg-[color:var(--color-surface-soft)]"
          >
            ยกเลิก
          </Link>
        ) : null}
      </div>
    </form>
  );
}