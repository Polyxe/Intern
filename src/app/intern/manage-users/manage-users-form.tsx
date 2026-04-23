"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { createManagedUser, type ManageUsersState } from "./actions";

type ManageUsersFormProps = {
  allowedRoles: Array<{
    label: string;
    value: string;
  }>;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(242,106,33,0.28)] hover:brightness-105"
      disabled={pending}
    >
      {pending ? "กำลังบันทึก..." : "สร้างผู้ใช้"}
    </Button>
  );
}

export function ManageUsersForm({ allowedRoles }: ManageUsersFormProps) {
  const [state, formAction] = useActionState(createManagedUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
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

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            className={inputClassName}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
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

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
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
          <label htmlFor="firstname" className="text-sm font-medium text-slate-700">
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
          <label htmlFor="lastname" className="text-sm font-medium text-slate-700">
            นามสกุล
          </label>
          <input id="lastname" name="lastname" type="text" placeholder="ไม่บังคับ" className={inputClassName} />
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-500">
        ผู้ดูแลระบบสามารถสร้างบัญชีใหม่ได้ตามสิทธิ์ของตนเอง และระบบจะเข้ารหัสรหัสผ่านก่อนบันทึกเสมอ
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

      <SubmitButton />
    </form>
  );
}