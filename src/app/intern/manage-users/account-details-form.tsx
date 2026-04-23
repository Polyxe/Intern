"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { formatDateForInput } from "@/lib/internship-application";

import { updateManagedAccountDetails, type ManageUsersState } from "./actions";

type AccountDetailsFormProps = {
  user: {
    id: string;
    title: string;
    firstname: string;
    lastname: string;
    sex?: string | null;
    birthDate?: Date | null;
    address?: string | null;
    institution?: string | null;
    email: string;
    profileImagePath?: string | null;
  };
  canEditEmail: boolean;
  canEditPassword: boolean;
  canEditProfileImage: boolean;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]";

const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]";

const sexOptions = ["Male", "Female", "Other"];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(242,106,33,0.28)] hover:brightness-105"
      disabled={pending}
    >
      {pending ? "กำลังบันทึก..." : "บันทึกข้อมูลบัญชี"}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AccountDetailsForm({ user, canEditEmail, canEditPassword, canEditProfileImage }: AccountDetailsFormProps) {
  const [state, formAction] = useActionState(updateManagedAccountDetails, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="userId" value={user.id} />

      <section className="rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">ข้อมูลบัญชี</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">แก้ไขเฉพาะข้อมูลพื้นฐานของบัญชี โดยไม่แสดงชุดข้อมูลนักศึกษาหรือแบบฟอร์มฝึกงาน</p>
        </div>
        <div className="mt-6 rounded-[1.5rem] border border-[color:var(--color-shell-border)] bg-white/80 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar
              firstName={user.firstname}
              lastName={user.lastname}
              imagePath={user.profileImagePath}
              className="h-20 w-20 text-xl"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <h4 className="text-base font-semibold text-slate-950">รูปโปรไฟล์</h4>
              <p className="text-sm leading-6 text-slate-600">
                {canEditProfileImage
                  ? "อัปโหลด PNG หรือ JPG ขนาดไม่เกิน 5 MB เพื่ออัปเดตรูปโปรไฟล์ของคุณ"
                  : "บัญชีนี้ยังไม่เปิดให้เปลี่ยนรูปโปรไฟล์จากแดชบอร์ดของคุณ"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Field label="อัปโหลดรูปโปรไฟล์" htmlFor="profilePhoto">
              <input
                id="profilePhoto"
                name="profilePhoto"
                type="file"
                accept="image/png,image/jpeg"
                disabled={!canEditProfileImage}
                className={canEditProfileImage ? inputClassName : `${inputClassName} bg-slate-50 text-slate-500`}
              />
            </Field>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="คำนำหน้า" htmlFor="title">
            <input id="title" name="title" type="text" defaultValue={user.title} className={inputClassName} />
          </Field>
          <Field label="ชื่อ" htmlFor="firstname">
            <input id="firstname" name="firstname" type="text" defaultValue={user.firstname} className={inputClassName} required />
          </Field>
          <Field label="นามสกุล" htmlFor="lastname">
            <input id="lastname" name="lastname" type="text" defaultValue={user.lastname} className={inputClassName} />
          </Field>
          <Field label="เพศ" htmlFor="sex">
            <select id="sex" name="sex" defaultValue={user.sex ?? ""} className={inputClassName}>
              <option value="">ยังไม่ระบุ</option>
              {sexOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันเกิด" htmlFor="birthDate">
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={user.birthDate ? formatDateForInput(user.birthDate) : undefined}
              className={inputClassName}
            />
          </Field>
          <Field label="อีเมล" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              readOnly={!canEditEmail}
              className={canEditEmail ? inputClassName : `${inputClassName} bg-slate-50 text-slate-500`}
              required
            />
          </Field>
          <Field label={canEditPassword ? "ตั้งรหัสผ่านใหม่" : "รหัสผ่าน"} htmlFor="password">
            {canEditPassword ? (
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                className={inputClassName}
              />
            ) : (
              <input id="password" type="password" value="********" readOnly className={`${inputClassName} bg-slate-50 text-slate-500`} />
            )}
          </Field>
          <Field label="สถาบัน" htmlFor="institution">
            <input id="institution" name="institution" type="text" defaultValue={user.institution ?? undefined} className={inputClassName} />
          </Field>
          <Field label="ที่อยู่" htmlFor="address" className="md:col-span-2">
            <textarea id="address" name="address" defaultValue={user.address ?? undefined} className={textareaClassName} />
          </Field>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}