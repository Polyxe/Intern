"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";

import { CappedMultiFileInput } from "@/components/capped-multi-file-input";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  canStudentEditApplication,
  formatDateForInput,
  getInternshipStatus,
  internshipStatusMeta,
  type InternshipApplicationRecord,
} from "@/lib/internship-application";
import {
  defaultInternshipApplicationFormValues,
  getNextInternshipApplicationWizardStep,
  getPreviousInternshipApplicationWizardStep,
  internshipApplicationStepFieldNames,
  internshipApplicationWizardMeta,
  internshipApplicationWizardStepOrder,
  mergeInternshipApplicationFormValues,
  type InternshipApplicationFormValues,
  type InternshipApplicationWizardStep,
} from "@/lib/internship-application-form";
import { getInternshipAttachmentDownloadPath } from "@/lib/public-paths";
import { normalizeSexValue, sexOptions } from "@/lib/sex";

import {
  deleteStudentAttachment,
  saveInternshipApplication,
  type InternshipApplicationFieldErrors,
  type InternshipApplicationFormState,
  type InternshipAttachmentActionState,
} from "./actions";
import { getUploadFileDeduplicationKey } from "@/lib/upload-file-deduplication";

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
  draftValues?: Partial<InternshipApplicationFormValues> | null;
  step: InternshipApplicationWizardStep;
  editingExistingApplication: boolean;
};

const initialState: InternshipApplicationFormState = {
  error: "",
  success: "",
  fieldErrors: {},
  values: defaultInternshipApplicationFormValues,
};

const deleteAttachmentInitialState: InternshipAttachmentActionState = {
  error: "",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-brand-focus-ring)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const textareaClassName =
  "min-h-28 w-full rounded-xl border border-[color:var(--color-shell-border)] bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--color-brand-violet-deep)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-brand-focus-ring)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const fileInputClassName =
  "block w-full rounded-2xl border border-dashed border-[color:var(--color-shell-border)] bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(242,106,33,0.12)] file:px-4 file:py-2 file:font-semibold file:text-[color:var(--color-brand-orange-deep)] hover:file:bg-[rgba(242,106,33,0.18)] disabled:cursor-not-allowed disabled:bg-slate-50";

const MAX_ATTACHMENT_COUNT = 5;

function getControlClassName(baseClassName: string, hasError: boolean) {
  return hasError
    ? `${baseClassName} border-rose-300 bg-rose-50/70 focus:border-rose-500 focus:ring-rose-100`
    : baseClassName;
}

function buildCurrentUserFormValues(currentUser: InternshipApplicationFormProps["currentUser"]) {
  return {
    title: currentUser.title,
    firstname: currentUser.firstname,
    lastname: currentUser.lastname,
    sex: normalizeSexValue(currentUser.sex),
    birthDate: currentUser.birthDate ? formatDateForInput(currentUser.birthDate) : "",
    address: currentUser.address ?? "",
    institution: currentUser.institution ?? "",
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
    internshipStartDate: formatDateForInput(application.internshipStartDate),
    internshipEndDate: formatDateForInput(application.internshipEndDate),
    emergencyContactName: application.emergencyContactName,
    emergencyContactRelationship: application.emergencyContactRelationship,
    emergencyContactPhoneNumber: application.emergencyContactPhoneNumber,
    notes: application.notes ?? "",
  } satisfies Partial<InternshipApplicationFormValues>;
}

function SubmitButton({
  disabled,
  formId,
  label,
  pending,
}: {
  disabled: boolean;
  formId: string;
  label: string;
  pending: boolean;
}) {
  return (
    <Button
      type="submit"
      form={formId}
      size="lg"
      className="h-12 rounded-xl bg-gradient-accent px-6 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
      disabled={pending || disabled}
    >
      <Save className="size-4" />
      {pending ? "กำลังบันทึก..." : label}
    </Button>
  );
}

function NextStepButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="lg"
      className="h-12 rounded-xl bg-gradient-accent px-6 text-sm font-bold text-white shadow-accent-glow hover:opacity-95"
      disabled={disabled}
      onClick={onClick}
    >
      <ChevronRight className="size-4" />
      ไปขั้นตอนถัดไป
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
  error,
  required,
  className,
}: {
  children: ReactNode;
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <label htmlFor={htmlFor} className={error ? "text-sm font-semibold text-rose-700" : "text-sm font-semibold text-slate-900/90"}>
        <span>{label}</span>
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-base leading-none text-rose-600">
              *
            </span>
            <span className="sr-only">required</span>
          </>
        ) : null}
      </label>
      {children}
      {error ? <p className="text-xs leading-5 text-rose-700">{error}</p> : null}
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
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)]">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{attachment.fileName}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{attachment.mimeType}</p>
            <a
              href={getInternshipAttachmentDownloadPath(attachment.filePath, attachment.fileName) ?? undefined}
              download={attachment.fileName}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-accent px-3 py-2 text-xs font-semibold text-white shadow-accent-glow transition hover:opacity-95"
            >
              <Download className="size-3.5" />
              ดาวน์โหลดไฟล์
            </a>
          </div>
        </div>
        <DeleteAttachmentButton disabled={disabled} />
      </div>
      {state.error ? <p className="mt-3 text-sm text-rose-700">{state.error}</p> : null}
    </form>
  );
}

function isFormControl(
  element: Element | null,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function getStepForFieldErrors(
  fieldErrors: InternshipApplicationFieldErrors,
): InternshipApplicationWizardStep | null {
  for (const wizardStep of internshipApplicationWizardStepOrder) {
    if (internshipApplicationStepFieldNames[wizardStep].some((fieldName) => Boolean(fieldErrors[fieldName]))) {
      return wizardStep;
    }
  }

  return null;
}

function WizardProgress({ step }: { step: InternshipApplicationWizardStep }) {
  return (
    <section className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-6 shadow-elegant">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-violet-deep)]">
            Internship Application Wizard
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {internshipApplicationWizardMeta[step].title}
          </h2>
        </div>
        <div className="inline-flex w-fit items-center rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
          ขั้นตอนที่ {step} / 3
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {internshipApplicationWizardStepOrder.map((wizardStep) => {
          const isActive = wizardStep === step;
          const isCompleted = wizardStep < step;

          return (
            <div
              key={wizardStep}
              className={`rounded-2xl border px-4 py-4 text-sm transition ${
                isActive
                  ? "border-[color:var(--color-brand-violet-deep)] bg-[rgba(142,85,183,0.08)] text-[color:var(--color-brand-violet-deep)]"
                  : isCompleted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-[color:var(--color-shell-border)] bg-white text-slate-500"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Step {String(wizardStep).padStart(2, "0")}
              </p>
              <p className="mt-2 font-semibold">{internshipApplicationWizardMeta[wizardStep].title}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function InternshipApplicationForm({
  application,
  currentUser,
  draftValues,
  step,
  editingExistingApplication,
}: InternshipApplicationFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(saveInternshipApplication, initialState);
  const [activeStep, setActiveStep] = useState(step);
  const isLocked = application ? !canStudentEditApplication(application) : false;
  const currentStatus = application ? getInternshipStatus(application) : null;
  const currentStatusMeta = currentStatus ? internshipStatusMeta[currentStatus] : null;
  const profileImagePath = currentUser.profileImagePath ?? null;
  const isProfilePhotoRequired = !profileImagePath;
  const existingAttachmentCount = application?.attachments.length ?? 0;
  const fieldErrors: InternshipApplicationFieldErrors = state.fieldErrors;
  const validationMessages = [...new Set(Object.values(fieldErrors).filter(Boolean))];
  const hasActionResult = Boolean(state.error || state.success || validationMessages.length);
  const formValues = hasActionResult
    ? state.values
    : mergeInternshipApplicationFormValues(
        buildApplicationFormValues(application),
        draftValues,
        buildCurrentUserFormValues(currentUser),
      );
  const currentStep = getStepForFieldErrors(state.fieldErrors) ?? activeStep;

  function goToNextStep() {
    if (isLocked || currentStep === 3) {
      return;
    }

    const form = formRef.current;

    if (!form) {
      setActiveStep(getNextInternshipApplicationWizardStep(currentStep));
      return;
    }

    for (const fieldName of internshipApplicationStepFieldNames[currentStep]) {
      const controls = form.elements.namedItem(fieldName);
      const elements = controls instanceof RadioNodeList ? Array.from(controls).filter(isFormControl) : [controls].filter(isFormControl);

      for (const element of elements) {
        if (!element.reportValidity()) {
          return;
        }
      }
    }

    setActiveStep(getNextInternshipApplicationWizardStep(currentStep));
  }

  function goToPreviousStep() {
    if (currentStep === 1) {
      return;
    }

    setActiveStep(getPreviousInternshipApplicationWizardStep(currentStep));
  }

  const previousHref = currentStep === 1 && editingExistingApplication ? "/intern/profile" : null;

  return (
    <div className="space-y-6">
      <WizardProgress step={currentStep} />

      <form
        id={formId}
        ref={formRef}
        action={formAction}
        className="space-y-6"
        encType="multipart/form-data"
        onKeyDown={(event) => {
          if (currentStep < 3 && event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="wizardStep" value={String(currentStep)} />

        {application && currentStatusMeta ? (
          <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-gradient-brand-soft p-6 shadow-elegant">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                  <Sparkles className="size-4" />
                  สถานะปัจจุบัน
                </p>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${currentStatusMeta.badgeClassName}`}
              >
                {currentStatusMeta.label}
              </span>
            </div>
          </div>
        ) : null}

        <div className={currentStep === 1 ? "space-y-6" : "hidden space-y-6"}>
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
                  <Field
                    label="อัปโหลดรูปโปรไฟล์"
                    htmlFor="profilePhoto"
                    hint="รองรับ PNG/JPG ขนาดไม่เกิน 5 MB"
                    error={fieldErrors.profilePhoto}
                    required={isProfilePhotoRequired}
                  >
                    <input
                      id="profilePhoto"
                      name="profilePhoto"
                      type="file"
                      accept="image/png,image/jpeg"
                      className={getControlClassName(fileInputClassName, Boolean(fieldErrors.profilePhoto))}
                      disabled={isLocked}
                      required={isProfilePhotoRequired}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <Section icon={User} step={1} title="ข้อมูลส่วนตัว">
              <Field label="คำนำหน้า" htmlFor="title" error={fieldErrors.title} required>
                <input id="title" name="title" defaultValue={formValues.title} className={getControlClassName(inputClassName, Boolean(fieldErrors.title))} disabled={isLocked} required />
              </Field>
              <Field label="ชื่อ" htmlFor="firstname" error={fieldErrors.firstname} required>
                <input id="firstname" name="firstname" defaultValue={formValues.firstname} className={getControlClassName(inputClassName, Boolean(fieldErrors.firstname))} disabled={isLocked} required />
              </Field>
              <Field label="นามสกุล" htmlFor="lastname" error={fieldErrors.lastname} required>
                <input id="lastname" name="lastname" defaultValue={formValues.lastname} className={getControlClassName(inputClassName, Boolean(fieldErrors.lastname))} disabled={isLocked} required />
              </Field>
              <Field label="เพศ" htmlFor="sex" error={fieldErrors.sex} required>
                <select id="sex" name="sex" defaultValue={formValues.sex} className={getControlClassName(inputClassName, Boolean(fieldErrors.sex))} disabled={isLocked} required>
                  <option value="">เลือกเพศ</option>
                  {sexOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="วันเกิด" htmlFor="birthDate" error={fieldErrors.birthDate} required>
                <input id="birthDate" name="birthDate" type="date" defaultValue={formValues.birthDate} className={getControlClassName(inputClassName, Boolean(fieldErrors.birthDate))} disabled={isLocked} required />
              </Field>
              <Field label="อีเมล" htmlFor="email">
                <input id="email" type="email" value={currentUser.email} readOnly className={`${inputClassName} bg-slate-50 text-slate-500`} />
              </Field>
              <Field label="สถาบัน" htmlFor="institution" error={fieldErrors.institution} required>
                <input id="institution" name="institution" defaultValue={formValues.institution} className={getControlClassName(inputClassName, Boolean(fieldErrors.institution))} disabled={isLocked} required />
              </Field>
              <Field label="ที่อยู่" htmlFor="address" error={fieldErrors.address} required className="md:col-span-2">
                <textarea id="address" name="address" defaultValue={formValues.address} className={getControlClassName(textareaClassName, Boolean(fieldErrors.address))} disabled={isLocked} required />
              </Field>
            </Section>
        </div>

        <div className={currentStep === 2 ? "space-y-6" : "hidden space-y-6"}>
          <Section icon={GraduationCap} step={2} title="ข้อมูลการศึกษา">
            <Field label="รหัสนักศึกษา" htmlFor="studentId" error={fieldErrors.studentId} required>
              <input id="studentId" name="studentId" defaultValue={formValues.studentId} inputMode="numeric" pattern="\d+" title="รหัสนักศึกษาต้องเป็นตัวเลขเท่านั้น" className={getControlClassName(inputClassName, Boolean(fieldErrors.studentId))} disabled={isLocked} required />
            </Field>
            <Field label="เบอร์โทรศัพท์" htmlFor="phoneNumber" error={fieldErrors.phoneNumber} required>
              <input id="phoneNumber" name="phoneNumber" type="tel" defaultValue={formValues.phoneNumber} inputMode="numeric" maxLength={10} pattern="\d{9,10}" title="เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก" className={getControlClassName(inputClassName, Boolean(fieldErrors.phoneNumber))} disabled={isLocked} required />
            </Field>
            <Field label="คณะ" htmlFor="faculty" error={fieldErrors.faculty} required>
              <input id="faculty" name="faculty" defaultValue={formValues.faculty} className={getControlClassName(inputClassName, Boolean(fieldErrors.faculty))} disabled={isLocked} required />
            </Field>
            <Field label="สาขา / หลักสูตร" htmlFor="program" error={fieldErrors.program} required>
              <input id="program" name="program" defaultValue={formValues.program} className={getControlClassName(inputClassName, Boolean(fieldErrors.program))} disabled={isLocked} required />
            </Field>
            <Field label="ชั้นปี" htmlFor="yearLevel" error={fieldErrors.yearLevel} required>
              <input id="yearLevel" name="yearLevel" defaultValue={formValues.yearLevel} inputMode="numeric" min={1} max={4} maxLength={1} pattern="[1-4]" title="ชั้นปีต้องอยู่ระหว่าง 1 ถึง 4" className={getControlClassName(inputClassName, Boolean(fieldErrors.yearLevel))} disabled={isLocked} required />
            </Field>
            <Field label="ชื่ออาจารย์นิเทศ" htmlFor="guidingProfessorFirstname" error={fieldErrors.guidingProfessorFirstname} required>
              <input id="guidingProfessorFirstname" name="guidingProfessorFirstname" defaultValue={formValues.guidingProfessorFirstname} className={getControlClassName(inputClassName, Boolean(fieldErrors.guidingProfessorFirstname))} disabled={isLocked} required />
            </Field>
            <Field label="นามสกุลอาจารย์นิเทศ" htmlFor="guidingProfessorLastname" error={fieldErrors.guidingProfessorLastname} required>
              <input id="guidingProfessorLastname" name="guidingProfessorLastname" defaultValue={formValues.guidingProfessorLastname} className={getControlClassName(inputClassName, Boolean(fieldErrors.guidingProfessorLastname))} disabled={isLocked} required />
            </Field>
            <Field label="เบอร์โทรอาจารย์นิเทศ" htmlFor="guidingProfessorPhoneNumber" error={fieldErrors.guidingProfessorPhoneNumber} required>
              <input id="guidingProfessorPhoneNumber" name="guidingProfessorPhoneNumber" type="tel" defaultValue={formValues.guidingProfessorPhoneNumber} inputMode="numeric" maxLength={10} pattern="\d{9,10}" title="เบอร์โทรอาจารย์นิเทศต้องเป็นตัวเลข 9-10 หลัก" className={getControlClassName(inputClassName, Boolean(fieldErrors.guidingProfessorPhoneNumber))} disabled={isLocked} required />
            </Field>
          </Section>
        </div>

        <div className={currentStep === 3 ? "space-y-6" : "hidden space-y-6"}>
            <Section icon={Briefcase} step={3} title="รายละเอียดการฝึกงาน">
              <Field label="ตำแหน่งฝึกงาน" htmlFor="internshipPosition" error={fieldErrors.internshipPosition} required>
                <input id="internshipPosition" name="internshipPosition" defaultValue={formValues.internshipPosition} className={getControlClassName(inputClassName, Boolean(fieldErrors.internshipPosition))} disabled={isLocked} required />
              </Field>
              <Field label="ชื่อบริษัท / หน่วยงาน" htmlFor="companyName" error={fieldErrors.companyName} required>
                <input id="companyName" name="companyName" defaultValue={formValues.companyName} className={getControlClassName(inputClassName, Boolean(fieldErrors.companyName))} disabled={isLocked} required />
              </Field>
              <Field label="ที่อยู่บริษัท" htmlFor="companyAddress" error={fieldErrors.companyAddress} required className="md:col-span-2">
                <textarea id="companyAddress" name="companyAddress" defaultValue={formValues.companyAddress} className={getControlClassName(textareaClassName, Boolean(fieldErrors.companyAddress))} disabled={isLocked} required />
              </Field>
              <Field label="ชื่อผู้ดูแลในสถานประกอบการ" htmlFor="companySupervisorName" error={fieldErrors.companySupervisorName} required>
                <input id="companySupervisorName" name="companySupervisorName" defaultValue={formValues.companySupervisorName} className={getControlClassName(inputClassName, Boolean(fieldErrors.companySupervisorName))} disabled={isLocked} required />
              </Field>
              <Field label="ตำแหน่งผู้ดูแล" htmlFor="companySupervisorRole" error={fieldErrors.companySupervisorRole} required>
                <input id="companySupervisorRole" name="companySupervisorRole" defaultValue={formValues.companySupervisorRole} className={getControlClassName(inputClassName, Boolean(fieldErrors.companySupervisorRole))} disabled={isLocked} required />
              </Field>
              <Field label="อีเมลผู้ดูแล" htmlFor="companySupervisorEmail" error={fieldErrors.companySupervisorEmail} required>
                <input id="companySupervisorEmail" name="companySupervisorEmail" type="email" defaultValue={formValues.companySupervisorEmail} className={getControlClassName(inputClassName, Boolean(fieldErrors.companySupervisorEmail))} disabled={isLocked} required />
              </Field>
              <Field label="เบอร์โทรผู้ดูแล" htmlFor="companySupervisorPhoneNumber" error={fieldErrors.companySupervisorPhoneNumber}>
                <input id="companySupervisorPhoneNumber" name="companySupervisorPhoneNumber" type="tel" defaultValue={formValues.companySupervisorPhoneNumber} inputMode="numeric" maxLength={10} pattern="\d{9,10}" title="หากระบุเบอร์โทรผู้ดูแล ต้องเป็นตัวเลข 9-10 หลัก" className={getControlClassName(inputClassName, Boolean(fieldErrors.companySupervisorPhoneNumber))} disabled={isLocked} />
              </Field>
              <Field label="วันที่เริ่มฝึกงาน" htmlFor="internshipStartDate" error={fieldErrors.internshipStartDate} required>
                <input id="internshipStartDate" name="internshipStartDate" type="date" defaultValue={formValues.internshipStartDate} className={getControlClassName(inputClassName, Boolean(fieldErrors.internshipStartDate))} disabled={isLocked} required />
              </Field>
              <Field label="วันที่สิ้นสุดฝึกงาน" htmlFor="internshipEndDate" error={fieldErrors.internshipEndDate} required>
                <input id="internshipEndDate" name="internshipEndDate" type="date" defaultValue={formValues.internshipEndDate} className={getControlClassName(inputClassName, Boolean(fieldErrors.internshipEndDate))} disabled={isLocked} required />
              </Field>
              <Field label="ชื่อผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactName" error={fieldErrors.emergencyContactName} required>
                <input id="emergencyContactName" name="emergencyContactName" defaultValue={formValues.emergencyContactName} className={getControlClassName(inputClassName, Boolean(fieldErrors.emergencyContactName))} disabled={isLocked} required />
              </Field>
              <Field label="ความสัมพันธ์" htmlFor="emergencyContactRelationship" error={fieldErrors.emergencyContactRelationship} required>
                <input id="emergencyContactRelationship" name="emergencyContactRelationship" defaultValue={formValues.emergencyContactRelationship} className={getControlClassName(inputClassName, Boolean(fieldErrors.emergencyContactRelationship))} disabled={isLocked} required />
              </Field>
              <Field label="เบอร์โทรผู้ติดต่อฉุกเฉิน" htmlFor="emergencyContactPhoneNumber" error={fieldErrors.emergencyContactPhoneNumber} required>
                <input id="emergencyContactPhoneNumber" name="emergencyContactPhoneNumber" type="tel" defaultValue={formValues.emergencyContactPhoneNumber} inputMode="numeric" maxLength={10} pattern="\d{9,10}" title="เบอร์โทรผู้ติดต่อฉุกเฉินต้องเป็นตัวเลข 9-10 หลัก" className={getControlClassName(inputClassName, Boolean(fieldErrors.emergencyContactPhoneNumber))} disabled={isLocked} required />
              </Field>
              <Field label="หมายเหตุเพิ่มเติม" htmlFor="notes" className="md:col-span-2">
                <textarea id="notes" name="notes" defaultValue={formValues.notes} className={textareaClassName} disabled={isLocked} />
              </Field>
            </Section>

            <Section icon={ShieldCheck} step={3} title="ไฟล์ประกอบการสมัคร">
              <Field label="อัปโหลดไฟล์ใหม่" htmlFor="attachments" hint="รองรับ PDF/PNG/JPG ขนาดไม่เกิน 5 MB ต่อไฟล์ ระบบจะเพิ่มไฟล์ใหม่ต่อจากรายการเดิมโดยรวมแล้วไม่เกิน 5 ไฟล์" error={fieldErrors.attachments} className="md:col-span-2">
                <CappedMultiFileInput
                  key={`attachments-${existingAttachmentCount}`}
                  id="attachments"
                  name="attachments"
                  accept="application/pdf,image/png,image/jpeg"
                  className={getControlClassName(fileInputClassName, Boolean(fieldErrors.attachments))}
                  disabled={isLocked}
                  maxFiles={MAX_ATTACHMENT_COUNT}
                  uploadedFileCount={existingAttachmentCount}
                  existingFileKeys={(application?.attachments ?? []).map((attachment) =>
                    getUploadFileDeduplicationKey(attachment.fileName, attachment.fileSize),
                  )}
                  description="การเลือกไฟล์รอบใหม่จะต่อจากรายการที่เลือกไว้เดิมโดยอัตโนมัติ หากเกินโควตา ระบบจะรับเฉพาะไฟล์ตามลำดับที่เลือกจนเต็ม 5 ไฟล์"
                  emptySelectionText="ยังไม่ได้เลือกไฟล์ประกอบใหม่"
                />
              </Field>
            </Section>
        </div>

        {state.error ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 shadow-sm">
            <p>{state.error}</p>
            {validationMessages.length > 1 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {validationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </form>

      {currentStep === 3 && application ? (
        <section className="rounded-3xl border border-[color:var(--color-shell-border)] bg-white/90 p-6 shadow-elegant">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">ไฟล์ที่อัปโหลดแล้ว</h2>
            </div>
            <div className="inline-flex w-fit items-center rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
              ทั้งหมด {application.attachments.length} ไฟล์
            </div>
          </div>

          {application.attachments.length ? (
            <div className="mt-6 grid gap-4">
              {application.attachments.map((attachment) => (
                <AttachmentDeleteForm key={attachment.id} attachment={attachment} disabled={isLocked} />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-7 text-slate-500">ยังไม่มีไฟล์แนบในโปรไฟล์นี้</p>
          )}
        </section>
      ) : null}

      <div className="flex flex-col-reverse items-stretch justify-between gap-4 rounded-3xl border border-[color:var(--color-shell-border)] bg-white/86 p-5 shadow-elegant sm:flex-row sm:items-center sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-slate-900 shadow-none transition hover:border-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-brand-violet-deep)] hover:text-white"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="size-4" />
              ย้อนกลับ
            </Button>
          ) : previousHref ? (
            <Link
              href={previousHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-brand-violet-deep)] hover:text-white"
            >
              <ChevronLeft className="size-4" />
              กลับไปดูข้อมูลที่ส่งแล้ว
            </Link>
          ) : null}
          {isLocked ? (
            <p className="text-sm leading-6 text-slate-500">การแก้ไขถูกปิดไว้เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว</p>
          ) : currentStep === 3 ? (
            <SubmitButton
              disabled={false}
              formId={formId}
              label={internshipApplicationWizardMeta[currentStep].submitLabel}
              pending={pending}
            />
          ) : (
            <NextStepButton disabled={pending} onClick={goToNextStep} />
          )}
        </div>
      </div>
    </div>
  );
}