"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Briefcase, ChevronLeft, GraduationCap, Mail, Save, Sparkles, User, type LucideIcon } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { formatDateForInput, type InternshipApplicationRecord } from "@/lib/internship-application";
import {
  getPreviousInternshipApplicationWizardStep,
  internshipApplicationWizardStepOrder,
  mergeInternshipApplicationFormValues,
  type InternshipApplicationFormValues,
  type InternshipApplicationWizardStep,
} from "@/lib/internship-application-form";
import { appendReturnTo } from "@/lib/manage-users-routing";
import { normalizeSexValue, sexOptions } from "@/lib/sex";

import { updateManagedStudentDetails, type ManageUsersState } from "./actions";

type StudentDetailsFormProps = {
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
    application: InternshipApplicationRecord | null;
  };
  canEditEmail: boolean;
  step: InternshipApplicationWizardStep;
  draftValues?: Partial<InternshipApplicationFormValues> | null;
  returnTo?: string | null;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-brand-focus-ring)]";

const textareaClassName =
  "min-h-28 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-brand-focus-ring)]";

const studentEditWizardMeta: Record<
  InternshipApplicationWizardStep,
  {
    title: string;
    description: string;
    submitLabel: string;
  }
> = {
  1: {
    title: "ข้อมูลส่วนตัว",
    description: "อัปเดตข้อมูลบัญชีพื้นฐานของนักศึกษา แล้วไปต่อยังข้อมูลการศึกษา",
    submitLabel: "บันทึกและไปขั้นตอนถัดไป",
  },
  2: {
    title: "ข้อมูลการศึกษา",
    description: "บันทึกข้อมูลการศึกษาและอาจารย์นิเทศก่อนเข้าสู่รายละเอียดการฝึกงาน",
    submitLabel: "บันทึกและไปขั้นตอนถัดไป",
  },
  3: {
    title: "รายละเอียดการฝึกงาน",
    description: "บันทึกข้อมูลฝึกงานและผู้ติดต่อฉุกเฉิน จากนั้นกลับไปหน้าสรุปข้อมูล",
    submitLabel: "บันทึกและกลับไปหน้าดูข้อมูล",
  },
};

function StepSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-xl bg-gradient-accent px-6 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
      disabled={pending}
    >
      <Save className="size-4" />
      {pending ? "กำลังบันทึก..." : label}
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
  step,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  step: InternshipApplicationWizardStep;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 shadow-elegant">
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl" />
      <div className="relative flex flex-col gap-2 border-b border-[color:var(--color-shell-border)] bg-gradient-brand-soft px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
            <Icon className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950 md:text-xl">{title}</h2>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
        </div>
        <span className="hidden rounded-full bg-white/75 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase ring-1 ring-[color:var(--color-brand-ring-soft)] md:inline-block">
          Step {String(step).padStart(2, "0")}
        </span>
      </div>
      <div className="relative grid gap-4 px-6 py-7 md:grid-cols-2 md:px-8">{children}</div>
    </section>
  );
}

function ManagedStudentSummary({
  user,
  step,
}: {
  user: StudentDetailsFormProps["user"];
  step: InternshipApplicationWizardStep;
}) {
  return (
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
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
              <Sparkles className="size-3.5" />
              Managed Student Dossier
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{`${user.firstname} ${user.lastname}`.trim()}</h2>
            <p className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-[color:var(--color-brand-ring-soft)]">
              <Mail className="size-4 shrink-0 text-[color:var(--color-brand-violet-deep)]" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--color-shell-border)] bg-white/82 px-5 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
            ช่วงที่กำลังแก้ไข
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{studentEditWizardMeta[step].title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{studentEditWizardMeta[step].description}</p>
        </div>
      </div>
    </section>
  );
}

function WizardProgress({
  step,
  maxAvailableStep,
}: {
  step: InternshipApplicationWizardStep;
  maxAvailableStep: InternshipApplicationWizardStep;
}) {
  return (
    <section className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-6 shadow-elegant">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
            Save And Continue Wizard
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {studentEditWizardMeta[step].title}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {studentEditWizardMeta[step].description}
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-sm">
          ขั้นตอน {step} / 3
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {internshipApplicationWizardStepOrder.map((wizardStep) => {
          const isActive = wizardStep === step;
          const isCompleted = wizardStep < step;
          const isEnabled = wizardStep <= maxAvailableStep;

          const className = `rounded-2xl border px-4 py-4 text-left text-sm transition ${
            isActive
              ? "border-[color:var(--color-brand-violet-deep)] bg-[rgba(142,85,183,0.08)] text-[color:var(--color-brand-violet-deep)]"
              : isCompleted
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-[color:var(--color-shell-border)] bg-white text-slate-500"
          } ${isEnabled ? "" : "opacity-60"}`;

          return (
            <div key={wizardStep} className={className} aria-disabled={!isEnabled}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Step {String(wizardStep).padStart(2, "0")}
              </p>
              <p className="mt-2 font-semibold">{studentEditWizardMeta[wizardStep].title}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function buildCurrentUserFormValues(user: StudentDetailsFormProps["user"]) {
  return {
    title: user.title,
    firstname: user.firstname,
    lastname: user.lastname,
    sex: normalizeSexValue(user.sex),
    birthDate: user.birthDate ? formatDateForInput(user.birthDate) : "",
    address: user.address ?? "",
    institution: user.institution ?? "",
  } satisfies Partial<InternshipApplicationFormValues>;
}

function buildApplicationFormValues(application: InternshipApplicationRecord | null) {
  if (!application) {
    return null;
  }

  return {
    studentId: application.studentId,
    phoneNumber: application.phoneNumber,
    faculty: application.faculty,
    program: application.program,
    yearLevel: application.yearLevel,
    internshipPosition: application.internshipPosition,
    companyName: application.companyName,
    companyAddress: application.companyAddress,
    guidingProfessorFirstname: application.guidingProfessorFirstname ?? "",
    guidingProfessorLastname: application.guidingProfessorLastname ?? "",
    guidingProfessorPhoneNumber: application.guidingProfessorPhoneNumber ?? "",
    companySupervisorName: application.companySupervisorName,
    companySupervisorRole: application.companySupervisorRole,
    companySupervisorEmail: application.companySupervisorEmail,
    companySupervisorPhoneNumber: application.companySupervisorPhoneNumber ?? "",
    internshipStartDate: application.internshipStartDate ? formatDateForInput(application.internshipStartDate) : "",
    internshipEndDate: application.internshipEndDate ? formatDateForInput(application.internshipEndDate) : "",
    emergencyContactName: application.emergencyContactName,
    emergencyContactRelationship: application.emergencyContactRelationship,
    emergencyContactPhoneNumber: application.emergencyContactPhoneNumber,
    notes: application.notes ?? "",
  } satisfies Partial<InternshipApplicationFormValues>;
}

export function StudentDetailsForm({ user, canEditEmail, step, draftValues, returnTo }: StudentDetailsFormProps) {
  const [state, formAction] = useActionState(updateManagedStudentDetails, initialState);
  const application = user.application;
  const today = formatDateForInput(new Date());
  const maxAvailableStep = application || draftValues ? 3 : 2;
  const formValues = mergeInternshipApplicationFormValues(
    buildApplicationFormValues(application),
    draftValues,
    buildCurrentUserFormValues(user),
  );
  const previousStep = step > 1 ? getPreviousInternshipApplicationWizardStep(step) : null;
  const previousHref = previousStep
    ? appendReturnTo(`/intern/manage-users/${user.id}/edit?step=${String(previousStep)}`, returnTo)
    : appendReturnTo(`/intern/manage-users/${user.id}`, returnTo);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="editStep" value={String(step)} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <ManagedStudentSummary user={user} step={step} />

      <WizardProgress step={step} maxAvailableStep={maxAvailableStep} />

      {step === 1 ? (
        <Section icon={User} step={1} title="ข้อมูลส่วนตัว" description="อัปเดตข้อมูลบัญชีพื้นฐานของนักศึกษาให้ครบก่อนเข้าสู่ข้อมูลการศึกษา">
          <Field label="คำนำหน้า" htmlFor="title">
            <input id="title" name="title" type="text" defaultValue={formValues.title} className={inputClassName} />
          </Field>
          <Field label="ชื่อ" htmlFor="firstname">
            <input id="firstname" name="firstname" type="text" defaultValue={formValues.firstname} className={inputClassName} required />
          </Field>
          <Field label="นามสกุล" htmlFor="lastname">
            <input id="lastname" name="lastname" type="text" defaultValue={formValues.lastname} className={inputClassName} />
          </Field>
          <Field label="เพศ" htmlFor="sex">
            <select id="sex" name="sex" defaultValue={formValues.sex} className={inputClassName}>
              <option value="">ยังไม่ระบุ</option>
              {sexOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันเกิด" htmlFor="birthDate">
            <input id="birthDate" name="birthDate" type="date" defaultValue={formValues.birthDate || undefined} max={today} className={inputClassName} />
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
            <input id="institution" name="institution" type="text" defaultValue={formValues.institution} className={inputClassName} />
          </Field>
          <Field label="ที่อยู่" htmlFor="address" className="md:col-span-2">
            <textarea id="address" name="address" defaultValue={formValues.address} className={textareaClassName} />
          </Field>
        </Section>
      ) : null}

      {step === 2 ? (
        <Section icon={GraduationCap} step={2} title="ข้อมูลการศึกษา" description="บันทึกข้อมูลนักศึกษาและอาจารย์นิเทศก่อนเข้าสู่รายละเอียดการฝึกงาน">
          <Field label="รหัสนักศึกษา" htmlFor="studentId">
            <input id="studentId" name="studentId" type="text" defaultValue={formValues.studentId} inputMode="numeric" maxLength={9} className={inputClassName} />
          </Field>
          <Field label="เบอร์โทรศัพท์" htmlFor="phoneNumber">
            <input id="phoneNumber" name="phoneNumber" type="tel" defaultValue={formValues.phoneNumber} inputMode="numeric" maxLength={10} className={inputClassName} />
          </Field>
          <Field label="คณะ" htmlFor="faculty">
            <input id="faculty" name="faculty" type="text" defaultValue={formValues.faculty} className={inputClassName} />
          </Field>
          <Field label="สาขา / หลักสูตร" htmlFor="program">
            <input id="program" name="program" type="text" defaultValue={formValues.program} className={inputClassName} />
          </Field>
          <Field label="ชั้นปี" htmlFor="yearLevel">
            <input id="yearLevel" name="yearLevel" type="text" defaultValue={formValues.yearLevel} inputMode="numeric" maxLength={1} className={inputClassName} />
          </Field>
          <Field label="ชื่ออาจารย์นิเทศ" htmlFor="guidingProfessorFirstname">
            <input id="guidingProfessorFirstname" name="guidingProfessorFirstname" type="text" defaultValue={formValues.guidingProfessorFirstname} className={inputClassName} />
          </Field>
          <Field label="นามสกุลอาจารย์นิเทศ" htmlFor="guidingProfessorLastname">
            <input id="guidingProfessorLastname" name="guidingProfessorLastname" type="text" defaultValue={formValues.guidingProfessorLastname} className={inputClassName} />
          </Field>
          <Field label="เบอร์โทรอาจารย์นิเทศ" htmlFor="guidingProfessorPhoneNumber">
            <input id="guidingProfessorPhoneNumber" name="guidingProfessorPhoneNumber" type="tel" defaultValue={formValues.guidingProfessorPhoneNumber} inputMode="numeric" maxLength={10} className={inputClassName} />
          </Field>
        </Section>
      ) : null}

      {step === 3 ? (
        <Section icon={Briefcase} step={3} title="รายละเอียดการฝึกงาน" description="เก็บข้อมูลองค์กร ช่วงเวลา และผู้ติดต่อฉุกเฉินในช่วงสุดท้ายของแบบฟอร์ม">
          <Field label="ตำแหน่งฝึกงาน" htmlFor="internshipPosition">
            <input id="internshipPosition" name="internshipPosition" type="text" defaultValue={formValues.internshipPosition} className={inputClassName} />
          </Field>
          <Field label="ชื่อบริษัท / หน่วยงาน" htmlFor="companyName">
            <input id="companyName" name="companyName" type="text" defaultValue={formValues.companyName} className={inputClassName} />
          </Field>
          <Field label="ที่อยู่บริษัท" htmlFor="companyAddress" className="md:col-span-2">
            <textarea id="companyAddress" name="companyAddress" defaultValue={formValues.companyAddress} className={textareaClassName} />
          </Field>
          <Field label="ชื่อผู้ดูแลสถานประกอบการ" htmlFor="companySupervisorName">
            <input id="companySupervisorName" name="companySupervisorName" type="text" defaultValue={formValues.companySupervisorName} className={inputClassName} />
          </Field>
          <Field label="ตำแหน่งผู้ดูแล" htmlFor="companySupervisorRole">
            <input id="companySupervisorRole" name="companySupervisorRole" type="text" defaultValue={formValues.companySupervisorRole} className={inputClassName} />
          </Field>
          <Field label="อีเมลผู้ดูแล" htmlFor="companySupervisorEmail">
            <input id="companySupervisorEmail" name="companySupervisorEmail" type="email" defaultValue={formValues.companySupervisorEmail} className={inputClassName} />
          </Field>
          <Field label="เบอร์โทรผู้ดูแล" htmlFor="companySupervisorPhoneNumber">
            <input id="companySupervisorPhoneNumber" name="companySupervisorPhoneNumber" type="tel" defaultValue={formValues.companySupervisorPhoneNumber} inputMode="numeric" maxLength={10} className={inputClassName} />
          </Field>
          <Field label="วันที่เริ่มฝึกงาน" htmlFor="internshipStartDate">
            <input id="internshipStartDate" name="internshipStartDate" type="date" defaultValue={formValues.internshipStartDate || undefined} className={inputClassName} />
          </Field>
          <Field label="วันที่สิ้นสุดฝึกงาน" htmlFor="internshipEndDate">
            <input id="internshipEndDate" name="internshipEndDate" type="date" defaultValue={formValues.internshipEndDate || undefined} className={inputClassName} />
          </Field>
          <Field label="ชื่อผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactName">
            <input id="emergencyContactName" name="emergencyContactName" type="text" defaultValue={formValues.emergencyContactName} className={inputClassName} />
          </Field>
          <Field label="ความสัมพันธ์" htmlFor="emergencyContactRelationship">
            <input id="emergencyContactRelationship" name="emergencyContactRelationship" type="text" defaultValue={formValues.emergencyContactRelationship} className={inputClassName} />
          </Field>
          <Field label="เบอร์โทรผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactPhoneNumber">
            <input id="emergencyContactPhoneNumber" name="emergencyContactPhoneNumber" type="tel" defaultValue={formValues.emergencyContactPhoneNumber} inputMode="numeric" maxLength={10} className={inputClassName} />
          </Field>
          <Field label="หมายเหตุเพิ่มเติม" htmlFor="notes" className="md:col-span-2">
            <textarea id="notes" name="notes" defaultValue={formValues.notes} className={textareaClassName} />
          </Field>
        </Section>
      ) : null}

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

      <div className="flex flex-col-reverse items-stretch justify-between gap-4 rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-5 shadow-elegant sm:flex-row sm:items-center sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={previousHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-brand-violet-deep)] hover:text-white"
          >
            <ChevronLeft className="size-4" />
            {step > 1 ? "ย้อนกลับ" : "กลับไปหน้าดูข้อมูล"}
          </Link>
          <p className="text-sm leading-6 text-slate-500">{studentEditWizardMeta[step].description}</p>
        </div>
        <StepSubmitButton label={studentEditWizardMeta[step].submitLabel} />
      </div>
    </form>
  );
}
