"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Camera, Mail, Save, UserRound, type LucideIcon } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { formatDateForInput } from "@/lib/internship-application";
import { normalizeSexValue, sexOptions } from "@/lib/sex";

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
  canEditProfileImage: boolean;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-brand-focus-ring)]";

const textareaClassName =
  "min-h-28 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-brand-focus-ring)]";

const fileInputClassName =
  "block w-full rounded-2xl border border-dashed border-[color:var(--color-shell-border)] bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(242,106,33,0.12)] file:px-4 file:py-2 file:font-semibold file:text-[color:var(--color-brand-orange-deep)] hover:file:bg-[rgba(242,106,33,0.18)] disabled:cursor-not-allowed disabled:bg-slate-50";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-xl bg-gradient-accent px-6 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
      disabled={pending}
    >
      <Save className="size-4" />
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
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-900/90">
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 shadow-elegant">
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl" />
      <div className="relative flex flex-col gap-2 border-b border-[color:var(--color-shell-border)] bg-gradient-brand-soft px-6 py-5 md:flex-row md:items-center md:px-8">
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
            <Icon className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950 md:text-xl">{title}</h2>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="relative grid gap-4 px-6 py-7 md:grid-cols-2 md:px-8">{children}</div>
    </section>
  );
}

export function AccountDetailsForm({ user, canEditEmail, canEditProfileImage }: AccountDetailsFormProps) {
  const [state, formAction] = useActionState(updateManagedAccountDetails, initialState);
  const today = formatDateForInput(new Date());

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={user.id} />

      <section className="overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-gradient-brand-soft p-6 shadow-elegant md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-brand opacity-70 blur-md" />
              <div className="relative">
                <UserAvatar
                  firstName={user.firstname}
                  lastName={user.lastname}
                  imagePath={user.profileImagePath}
                  className="h-24 w-24 border-4 border-white/80 ring-4 ring-white/60"
                  textClassName="text-2xl"
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
                Account Edit Canvas
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{`${user.firstname} ${user.lastname}`.trim()}</h2>
              <p className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-[color:var(--color-brand-ring-soft)]">
                <Mail className="size-4 shrink-0 text-[color:var(--color-brand-violet-deep)]" />
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-2xl border border-[color:var(--color-shell-border)] bg-white/82 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                <Camera className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950">รูปโปรไฟล์</p>
              </div>
            </div>

            <div className="mt-4">
              <Field label="" htmlFor="profilePhoto">
                <input
                  id="profilePhoto"
                  name="profilePhoto"
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={!canEditProfileImage}
                  className={fileInputClassName}
                />
              </Field>
            </div>
          </div>
        </div>
      </section>

      <Section icon={UserRound} title="ข้อมูลบัญชี" description="">
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
            <select id="sex" name="sex" defaultValue={normalizeSexValue(user.sex)} className={inputClassName}>
              <option value="">ยังไม่ระบุ</option>
              {sexOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              max={today}
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
          <Field label="สถาบัน" htmlFor="institution">
            <input id="institution" name="institution" type="text" defaultValue={user.institution ?? undefined} className={inputClassName} />
          </Field>
          <Field label="ที่อยู่" htmlFor="address" className="md:col-span-2">
            <textarea id="address" name="address" defaultValue={user.address ?? undefined} className={textareaClassName} />
          </Field>
      </Section>

      {state.error ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 shadow-sm">
          <p>{state.error}</p>
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <p>{state.success}</p>
        </div>
      ) : null}

      <div className="flex justify-end rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-5 shadow-elegant sm:p-6">
        <SubmitButton />
      </div>
    </form>
  );
}