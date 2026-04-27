"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { formatDateForInput, type InternshipApplicationRecord } from "@/lib/internship-application";
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
    application: InternshipApplicationRecord | null;
  };
  canEditEmail: boolean;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]";

const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[color:var(--color-brand-violet-deep)] focus:ring-4 focus:ring-[rgba(142,85,183,0.12)]";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#ff9248,_#f26a21)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(242,106,33,0.28)] hover:brightness-105"
      disabled={pending}
    >
      {pending ? "กำลังบันทึก..." : "บันทึกข้อมูลนักศึกษา"}
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function StudentDetailsForm({ user, canEditEmail }: StudentDetailsFormProps) {
  const [state, formAction] = useActionState(updateManagedStudentDetails, initialState);
  const application = user.application;
  const today = formatDateForInput(new Date());

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="userId" value={user.id} />

      <Section
        title="ข้อมูลส่วนตัว"
        description="ผู้ดูแลระบบสามารถแก้ไขข้อมูลโปรไฟล์ของนักศึกษาได้จากส่วนนี้ และกำหนดอีเมลที่ใช้เข้าสู่ระบบผ่าน OAuth ได้"
      >
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
          <input id="birthDate" name="birthDate" type="date" defaultValue={user.birthDate ? formatDateForInput(user.birthDate) : undefined} max={today} className={inputClassName} />
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

      <Section
        title="ข้อมูลการศึกษาและฝึกงาน"
        description="หากนักศึกษายังไม่มีแบบฟอร์มฝึกงาน ผู้ดูแลสามารถกรอกข้อมูลชุดนี้เพื่อสร้างโปรไฟล์ฝึกงานเบื้องต้นได้"
      >
        <Field label="รหัสนักศึกษา" htmlFor="studentId">
          <input id="studentId" name="studentId" type="text" defaultValue={application?.studentId ?? undefined} inputMode="numeric" maxLength={9} className={inputClassName} />
        </Field>
        <Field label="เบอร์โทรศัพท์" htmlFor="phoneNumber">
          <input id="phoneNumber" name="phoneNumber" type="tel" defaultValue={application?.phoneNumber ?? undefined} inputMode="numeric" maxLength={10} className={inputClassName} />
        </Field>
        <Field label="คณะ" htmlFor="faculty">
          <input id="faculty" name="faculty" type="text" defaultValue={application?.faculty ?? undefined} className={inputClassName} />
        </Field>
        <Field label="สาขา / หลักสูตร" htmlFor="program">
          <input id="program" name="program" type="text" defaultValue={application?.program ?? undefined} className={inputClassName} />
        </Field>
        <Field label="ชั้นปี" htmlFor="yearLevel">
          <input id="yearLevel" name="yearLevel" type="text" defaultValue={application?.yearLevel ?? undefined} inputMode="numeric" maxLength={1} className={inputClassName} />
        </Field>
        <Field label="ตำแหน่งฝึกงาน" htmlFor="internshipPosition">
          <input id="internshipPosition" name="internshipPosition" type="text" defaultValue={application?.internshipPosition ?? undefined} className={inputClassName} />
        </Field>
        <Field label="ชื่อบริษัท / หน่วยงาน" htmlFor="companyName">
          <input id="companyName" name="companyName" type="text" defaultValue={application?.companyName ?? undefined} className={inputClassName} />
        </Field>
        <Field label="ที่อยู่บริษัท" htmlFor="companyAddress" className="md:col-span-2">
          <textarea id="companyAddress" name="companyAddress" defaultValue={application?.companyAddress ?? undefined} className={textareaClassName} />
        </Field>
        <Field label="ชื่ออาจารย์นิเทศ" htmlFor="guidingProfessorFirstname">
          <input id="guidingProfessorFirstname" name="guidingProfessorFirstname" type="text" defaultValue={application?.guidingProfessorFirstname ?? undefined} className={inputClassName} />
        </Field>
        <Field label="นามสกุลอาจารย์นิเทศ" htmlFor="guidingProfessorLastname">
          <input id="guidingProfessorLastname" name="guidingProfessorLastname" type="text" defaultValue={application?.guidingProfessorLastname ?? undefined} className={inputClassName} />
        </Field>
        <Field label="เบอร์โทรอาจารย์นิเทศ" htmlFor="guidingProfessorPhoneNumber">
          <input id="guidingProfessorPhoneNumber" name="guidingProfessorPhoneNumber" type="tel" defaultValue={application?.guidingProfessorPhoneNumber ?? undefined} inputMode="numeric" maxLength={10} className={inputClassName} />
        </Field>
        <Field label="ชื่อผู้ดูแลสถานประกอบการ" htmlFor="companySupervisorName">
          <input id="companySupervisorName" name="companySupervisorName" type="text" defaultValue={application?.companySupervisorName ?? undefined} className={inputClassName} />
        </Field>
        <Field label="ตำแหน่งผู้ดูแล" htmlFor="companySupervisorRole">
          <input id="companySupervisorRole" name="companySupervisorRole" type="text" defaultValue={application?.companySupervisorRole ?? undefined} className={inputClassName} />
        </Field>
        <Field label="อีเมลผู้ดูแล" htmlFor="companySupervisorEmail">
          <input id="companySupervisorEmail" name="companySupervisorEmail" type="email" defaultValue={application?.companySupervisorEmail ?? undefined} className={inputClassName} />
        </Field>
        <Field label="เบอร์โทรผู้ดูแล" htmlFor="companySupervisorPhoneNumber">
          <input id="companySupervisorPhoneNumber" name="companySupervisorPhoneNumber" type="tel" defaultValue={application?.companySupervisorPhoneNumber ?? undefined} inputMode="numeric" maxLength={10} className={inputClassName} />
        </Field>
      </Section>

      <Section
        title="ช่วงเวลาและผู้ติดต่อฉุกเฉิน"
        description="ข้อมูลส่วนนี้ใช้กำหนดสถานะและติดต่อสำรองได้เมื่อจำเป็น"
      >
        <Field label="วันที่เริ่มฝึกงาน" htmlFor="internshipStartDate">
          <input id="internshipStartDate" name="internshipStartDate" type="date" defaultValue={application?.internshipStartDate ? formatDateForInput(application.internshipStartDate) : undefined} className={inputClassName} />
        </Field>
        <Field label="วันที่สิ้นสุดฝึกงาน" htmlFor="internshipEndDate">
          <input id="internshipEndDate" name="internshipEndDate" type="date" defaultValue={application?.internshipEndDate ? formatDateForInput(application.internshipEndDate) : undefined} className={inputClassName} />
        </Field>
        <Field label="ชื่อผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactName">
          <input id="emergencyContactName" name="emergencyContactName" type="text" defaultValue={application?.emergencyContactName ?? undefined} className={inputClassName} />
        </Field>
        <Field label="ความสัมพันธ์" htmlFor="emergencyContactRelationship">
          <input id="emergencyContactRelationship" name="emergencyContactRelationship" type="text" defaultValue={application?.emergencyContactRelationship ?? undefined} className={inputClassName} />
        </Field>
        <Field label="เบอร์โทรผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactPhoneNumber">
          <input id="emergencyContactPhoneNumber" name="emergencyContactPhoneNumber" type="tel" defaultValue={application?.emergencyContactPhoneNumber ?? undefined} inputMode="numeric" maxLength={10} className={inputClassName} />
        </Field>
        <Field label="หมายเหตุเพิ่มเติม" htmlFor="notes" className="md:col-span-2">
          <textarea id="notes" name="notes" defaultValue={application?.notes ?? undefined} className={textareaClassName} />
        </Field>
      </Section>

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
