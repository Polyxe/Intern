"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  Briefcase,
  CalendarDays,
  FileText,
  GraduationCap,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  canStudentEditApplication,
  formatDateForInput,
  getInternshipStatus,
  internshipStatusMeta,
  type InternshipApplicationRecord,
} from "@/lib/internship-application";
import { normalizePublicUploadPath } from "@/lib/public-paths";

import {
  deleteStudentAttachment,
  saveInternshipApplication,
  type InternshipApplicationFormState,
  type InternshipApplicationFormValues,
  type InternshipAttachmentActionState,
} from "./actions";

type InternshipApplicationFormProps = {
  application: InternshipApplicationRecord | null;
  currentUser: {
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
};

const initialState: InternshipApplicationFormState = {
  error: "",
  success: "",
  values: {
    title: "",
    firstname: "",
    lastname: "",
    sex: "",
    birthDate: "",
    address: "",
    institution: "",
    studentId: "",
    phoneNumber: "",
    faculty: "",
    program: "",
    yearLevel: "",
    internshipPosition: "",
    companyName: "",
    companyAddress: "",
    guidingProfessorFirstname: "",
    guidingProfessorLastname: "",
    guidingProfessorPhoneNumber: "",
    companySupervisorName: "",
    companySupervisorRole: "",
    companySupervisorEmail: "",
    companySupervisorPhoneNumber: "",
    internshipStartDate: "",
    internshipEndDate: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhoneNumber: "",
    notes: "",
  },
};

const deleteAttachmentInitialState: InternshipAttachmentActionState = {
  error: "",
};

const sexOptions = ["Male", "Female", "Other"];

const inputClassName =
  "h-11 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[rgba(142,85,183,0.12)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const textareaClassName =
  "min-h-28 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[rgba(142,85,183,0.12)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const fileInputClassName =
  "block w-full rounded-2xl border border-dashed border-[color:var(--color-shell-border)] bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(242,106,33,0.12)] file:px-4 file:py-2 file:font-semibold file:text-[color:var(--color-brand-orange-deep)] hover:file:bg-[rgba(242,106,33,0.18)] disabled:cursor-not-allowed disabled:bg-slate-50";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 rounded-xl bg-gradient-accent px-6 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
      disabled={pending || disabled}
    >
      <Save className="size-4" />
      {pending ? "กำลังบันทึก..." : "บันทึกข้อมูลนักศึกษา"}
    </Button>
  );
}

function DeleteAttachmentButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="secondary"
      className="h-10 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 shadow-none hover:bg-rose-100"
      disabled={pending || disabled}
    >
      <Trash2 className="size-4" />
      {pending ? "กำลังลบ..." : "ลบไฟล์"}
    </Button>
  );
}

function Field({
  children,
  label,
  htmlFor,
  hint,
  className,
}: {
  children: ReactNode;
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-900/90">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
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
  step: number;
  title: string;
  description: string;
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
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <span className="hidden rounded-full bg-white/75 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase ring-1 ring-[rgba(142,85,183,0.14)] md:inline-block">
          Step {String(step).padStart(2, "0")}
        </span>
      </div>
      <div className="relative grid gap-4 px-6 py-7 md:grid-cols-2 md:px-8">{children}</div>
    </section>
  );
}

function AttachmentDeleteForm({
  attachment,
  disabled,
}: {
  attachment: InternshipApplicationRecord["attachments"][number];
  disabled: boolean;
}) {
  const [state, formAction] = useActionState(deleteStudentAttachment, deleteAttachmentInitialState);

  return (
    <form action={formAction} className="rounded-2xl border border-[color:var(--color-shell-border)] bg-white/90 p-5">
      <input type="hidden" name="attachmentId" value={attachment.id} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[rgba(142,85,183,0.12)]">
            <FileText className="size-4" />
          </div>
          <div>
          <a
            href={normalizePublicUploadPath(attachment.filePath) ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-slate-950 underline-offset-4 hover:underline"
          >
            {attachment.fileName}
          </a>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{attachment.mimeType}</p>
          </div>
        </div>
        <DeleteAttachmentButton disabled={disabled} />
      </div>
      {state.error ? <p className="mt-3 text-sm text-rose-700">{state.error}</p> : null}
    </form>
  );
}

export function InternshipApplicationForm({ application, currentUser }: InternshipApplicationFormProps) {
  const [state, formAction] = useActionState(saveInternshipApplication, initialState);
  const isLocked = application ? !canStudentEditApplication(application) : false;
  const currentStatus = application ? getInternshipStatus(application) : null;
  const currentStatusMeta = currentStatus ? internshipStatusMeta[currentStatus] : null;
  const profileImagePath = currentUser.profileImagePath ?? null;
  const hasActionResult = Boolean(state.error || state.success);
  const isEditMode = Boolean(application);
  const applicationValues: InternshipApplicationFormValues = {
    title: currentUser.title,
    firstname: currentUser.firstname,
    lastname: currentUser.lastname,
    sex: currentUser.sex ?? "",
    birthDate: currentUser.birthDate ? formatDateForInput(currentUser.birthDate) : "",
    address: currentUser.address ?? "",
    institution: currentUser.institution ?? "",
    studentId: application?.studentId ?? "",
    phoneNumber: application?.phoneNumber ?? "",
    faculty: application?.faculty ?? "",
    program: application?.program ?? "",
    yearLevel: application?.yearLevel ?? "",
    internshipPosition: application?.internshipPosition ?? "",
    companyName: application?.companyName ?? "",
    companyAddress: application?.companyAddress ?? "",
    guidingProfessorFirstname: application?.guidingProfessorFirstname ?? "",
    guidingProfessorLastname: application?.guidingProfessorLastname ?? "",
    guidingProfessorPhoneNumber: application?.guidingProfessorPhoneNumber ?? "",
    companySupervisorName: application?.companySupervisorName ?? "",
    companySupervisorRole: application?.companySupervisorRole ?? "",
    companySupervisorEmail: application?.companySupervisorEmail ?? "",
    companySupervisorPhoneNumber: application?.companySupervisorPhoneNumber ?? "",
    internshipStartDate: application ? formatDateForInput(application.internshipStartDate) : "",
    internshipEndDate: application ? formatDateForInput(application.internshipEndDate) : "",
    emergencyContactName: application?.emergencyContactName ?? "",
    emergencyContactRelationship: application?.emergencyContactRelationship ?? "",
    emergencyContactPhoneNumber: application?.emergencyContactPhoneNumber ?? "",
    notes: application?.notes ?? "",
  };
  const formValues = hasActionResult ? state.values : applicationValues;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6" encType="multipart/form-data">
        {application && currentStatusMeta ? (
          <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-gradient-brand-soft p-6 shadow-elegant">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                  <Sparkles className="size-4" />
                  Current Status
                </p>
                <p className="mt-2 text-base leading-7 text-slate-600">{currentStatusMeta.description}</p>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${currentStatusMeta.badgeClassName}`}
              >
                {currentStatusMeta.label}
              </span>
            </div>

            {!isLocked ? (
              <p className="mt-4 text-sm leading-7 text-slate-500">
                หากแก้ไขข้อมูลหลังจากได้รับอนุมัติแล้ว ระบบจะแจ้งเตือนผู้ดูแลเพื่อพิจารณาการเปลี่ยนแปลงข้อมูลที่อาจมีผลต่อการฝึกงานของคุณ
              </p>
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-500">
                ขณะนี้นักศึกษาได้ฝึกงานเสร็จสิ้นแล้ว ระบบจึงปิดการแก้ไขข้อมูลโดยอัตโนมัติ
              </p>
            )}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-[color:var(--color-shell-border)] bg-gradient-brand-soft p-6 shadow-elegant md:p-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-brand opacity-70 blur-md" />
              <div className="relative">
                <UserAvatar
                  firstName={formValues.firstname}
                  lastName={formValues.lastname}
                  imagePath={profileImagePath}
                  className="h-36 w-36 border-4 border-white/80 ring-4 ring-white/60"
                  textClassName="text-3xl"
                />
              </div>
            </div>

            <div className="w-full max-w-xl">
              <Field label="อัปโหลดรูปโปรไฟล์" htmlFor="profilePhoto" hint="รองรับ PNG/JPG ขนาดไม่เกิน 5 MB">
                <input
                  id="profilePhoto"
                  name="profilePhoto"
                  type="file"
                  accept="image/png,image/jpeg"
                  className={fileInputClassName}
                  disabled={isLocked}
                />
              </Field>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-[color:var(--color-brand-orange-deep)]">
                <Upload className="size-3.5" />
                ใช้รูปถ่ายนักศึกษาที่ชัดเจนและอัปเดตล่าสุดเพื่อให้แสดงผลบนโปรไฟล์ได้ดีที่สุด
              </p>
            </div>
          </div>
        </section>

        <Section
          icon={User}
          step={1}
          title="ข้อมูลนักศึกษา"
          description="ข้อมูลส่วนนี้เป็นข้อมูลโปรไฟล์หลักของนักศึกษา"
        >
          <Field label="คำนำหน้า" htmlFor="title">
            <input id="title" name="title" defaultValue={formValues.title} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ชื่อ" htmlFor="firstname">
            <input id="firstname" name="firstname" defaultValue={formValues.firstname} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="นามสกุล" htmlFor="lastname">
            <input id="lastname" name="lastname" defaultValue={formValues.lastname} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="เพศ" htmlFor="sex">
            <select id="sex" name="sex" defaultValue={formValues.sex} className={inputClassName} disabled={isLocked} required>
              <option value="">เลือกเพศ</option>
              {sexOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันเกิด" htmlFor="birthDate">
            <input id="birthDate" name="birthDate" type="date" defaultValue={formValues.birthDate} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="อีเมล" htmlFor="email">
            <input id="email" type="email" value={currentUser.email} readOnly className={`${inputClassName} bg-slate-50 text-slate-500`} />
          </Field>
          {isEditMode ? (
            <Field label="รหัสผ่าน" htmlFor="password">
              <input id="password" type="password" value="********" readOnly className={`${inputClassName} bg-slate-50 text-slate-500`} />
            </Field>
          ) : null}
          <Field label="ที่อยู่" htmlFor="address" className="md:col-span-2">
            <textarea id="address" name="address" defaultValue={formValues.address} className={textareaClassName} disabled={isLocked} required />
          </Field>
          <Field label="สถาบัน" htmlFor="institution">
            <input id="institution" name="institution" defaultValue={formValues.institution} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="รหัสนักศึกษา" htmlFor="studentId">
            <input id="studentId" name="studentId" defaultValue={formValues.studentId} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="เบอร์โทรศัพท์" htmlFor="phoneNumber">
            <input id="phoneNumber" name="phoneNumber" type="tel" defaultValue={formValues.phoneNumber} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="คณะ" htmlFor="faculty">
            <input id="faculty" name="faculty" defaultValue={formValues.faculty} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="สาขา / หลักสูตร" htmlFor="program">
            <input id="program" name="program" defaultValue={formValues.program} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ชั้นปี" htmlFor="yearLevel">
            <input id="yearLevel" name="yearLevel" defaultValue={formValues.yearLevel} className={inputClassName} disabled={isLocked} required />
          </Field>
        </Section>

        <Section
          icon={Briefcase}
          step={2}
          title="รายละเอียดการฝึกงาน"
          description="ข้อมูลตำแหน่งฝึกงาน หน่วยงาน และอาจารย์นิเทศที่ใช้ติดตามการฝึกงาน"
        >
          <Field label="ตำแหน่งฝึกงาน" htmlFor="internshipPosition">
            <input id="internshipPosition" name="internshipPosition" defaultValue={formValues.internshipPosition} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ชื่อบริษัท / หน่วยงาน" htmlFor="companyName">
            <input id="companyName" name="companyName" defaultValue={formValues.companyName} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ที่อยู่บริษัท" htmlFor="companyAddress" className="md:col-span-2">
            <textarea id="companyAddress" name="companyAddress" defaultValue={formValues.companyAddress} className={textareaClassName} disabled={isLocked} required />
          </Field>
          <Field label="ชื่ออาจารย์นิเทศ" htmlFor="guidingProfessorFirstname">
            <input id="guidingProfessorFirstname" name="guidingProfessorFirstname" defaultValue={formValues.guidingProfessorFirstname} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="นามสกุลอาจารย์นิเทศ" htmlFor="guidingProfessorLastname">
            <input id="guidingProfessorLastname" name="guidingProfessorLastname" defaultValue={formValues.guidingProfessorLastname} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="เบอร์โทรอาจารย์นิเทศ" htmlFor="guidingProfessorPhoneNumber">
            <input id="guidingProfessorPhoneNumber" name="guidingProfessorPhoneNumber" type="tel" defaultValue={formValues.guidingProfessorPhoneNumber} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ชื่อผู้ดูแลในสถานประกอบการ" htmlFor="companySupervisorName">
            <input id="companySupervisorName" name="companySupervisorName" defaultValue={formValues.companySupervisorName} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ตำแหน่งผู้ดูแล" htmlFor="companySupervisorRole">
            <input id="companySupervisorRole" name="companySupervisorRole" defaultValue={formValues.companySupervisorRole} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="อีเมลผู้ดูแล" htmlFor="companySupervisorEmail">
            <input id="companySupervisorEmail" name="companySupervisorEmail" type="email" defaultValue={formValues.companySupervisorEmail} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="เบอร์โทรผู้ดูแล" htmlFor="companySupervisorPhoneNumber">
            <input id="companySupervisorPhoneNumber" name="companySupervisorPhoneNumber" type="tel" defaultValue={formValues.companySupervisorPhoneNumber} className={inputClassName} disabled={isLocked} required />
          </Field>
        </Section>

        <Section
          icon={CalendarDays}
          step={3}
          title="ช่วงเวลาและผู้ติดต่อฉุกเฉิน"
          description="ใช้คำนวณสถานะการฝึกงานและเก็บข้อมูลติดต่อสำรอง"
        >
          <Field label="วันที่เริ่มฝึกงาน" htmlFor="internshipStartDate">
            <input id="internshipStartDate" name="internshipStartDate" type="date" defaultValue={formValues.internshipStartDate} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="วันที่สิ้นสุดฝึกงาน" htmlFor="internshipEndDate">
            <input id="internshipEndDate" name="internshipEndDate" type="date" defaultValue={formValues.internshipEndDate} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ชื่อผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactName">
            <input id="emergencyContactName" name="emergencyContactName" defaultValue={formValues.emergencyContactName} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="ความสัมพันธ์" htmlFor="emergencyContactRelationship">
            <input id="emergencyContactRelationship" name="emergencyContactRelationship" defaultValue={formValues.emergencyContactRelationship} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="เบอร์โทรผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactPhoneNumber">
            <input id="emergencyContactPhoneNumber" name="emergencyContactPhoneNumber" type="tel" defaultValue={formValues.emergencyContactPhoneNumber} className={inputClassName} disabled={isLocked} required />
          </Field>
          <Field label="หมายเหตุเพิ่มเติม" htmlFor="notes" className="md:col-span-2">
            <textarea id="notes" name="notes" defaultValue={formValues.notes} className={textareaClassName} disabled={isLocked} />
          </Field>
        </Section>

        <Section
          icon={ShieldCheck}
          step={4}
          title="ไฟล์ประกอบการสมัคร"
          description="อัปโหลดเอกสารประกอบได้สูงสุด 5 ไฟล์ และจัดการลบไฟล์เดิมได้จากส่วนด้านล่าง"
        >
          <Field
            label="อัปโหลดไฟล์ใหม่"
            htmlFor="attachments"
            hint="รองรับ PDF/PNG/JPG ขนาดไม่เกิน 5 MB ต่อไฟล์ ระบบจะเพิ่มไฟล์ใหม่ต่อจากรายการเดิมโดยรวมแล้วไม่เกิน 5 ไฟล์"
            className="md:col-span-2"
          >
            <input
              id="attachments"
              name="attachments"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              multiple
              className={fileInputClassName}
              disabled={isLocked}
            />
          </Field>
        </Section>

        {state.error ? (
          <p className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 shadow-sm">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 shadow-sm">
            <p>{state.success}</p>
            <Link href="/intern/profile" className="mt-3 inline-flex font-semibold text-emerald-800 underline-offset-4 hover:underline">
              กลับไปดูข้อมูลบนหน้าโปรไฟล์
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col-reverse items-stretch justify-between gap-4 rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-5 shadow-elegant sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <GraduationCap className="size-5 text-[color:var(--color-brand-violet-deep)]" />
            ข้อมูลของคุณจะถูกบันทึก กรุณาตรวจสอบให้แน่ใจว่าข้อมูลทั้งหมดถูกต้องและครบถ้วนก่อนกดบันทึกข้อมูล
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/intern/profile"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-[color:var(--color-surface-soft)]"
            >
              กลับไปหน้าโปรไฟล์
            </Link>
            {isLocked ? (
              <p className="text-sm leading-6 text-slate-500">การแก้ไขถูกปิดไว้เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว</p>
            ) : (
              <SubmitButton disabled={false} />
            )}
          </div>
        </div>
      </form>

      <section className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/90 p-6 shadow-elegant">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">ไฟล์ที่อัปโหลดแล้ว</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              นักศึกษาสามารถลบไฟล์ที่อัปโหลดไว้ได้จากรายการนี้ หากสถานะยังไม่ถูกล็อก
            </p>
          </div>
          <div className="inline-flex w-fit items-center rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
            ทั้งหมด {application?.attachments.length ?? 0} ไฟล์
          </div>
        </div>

        {application?.attachments.length ? (
          <div className="mt-6 grid gap-4">
            {application.attachments.map((attachment) => (
              <AttachmentDeleteForm key={attachment.id} attachment={attachment} disabled={isLocked} />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-7 text-slate-500">ยังไม่มีไฟล์แนบในโปรไฟล์นี้</p>
        )}
      </section>
    </div>
  );
}
