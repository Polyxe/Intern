"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Download, FileText, LockKeyhole, Trash2, Upload } from "lucide-react";

import { CappedMultiFileInput } from "@/components/capped-multi-file-input";
import { Button } from "@/components/ui/button";
import { formatDateForDisplay, type InternshipApplicationRecord } from "@/lib/internship-application";
import {
  formatInternshipWorkFileSize,
  MAX_STUDENT_WORK_FILES,
  MAX_STUDENT_WORK_FILE_SIZE_BYTES,
} from "@/lib/internship-work";
import { getInternshipWorkDownloadPath } from "@/lib/public-paths";
import { getUploadFileDeduplicationKey } from "@/lib/upload-file-deduplication";

import {
  deleteStudentWorkFile,
  uploadStudentWorkFiles,
  type InternshipWorkActionState,
} from "./actions";

const initialActionState: InternshipWorkActionState = {
  error: "",
};

const fileInputClassName =
  "block w-full rounded-2xl border border-dashed border-[color:var(--color-shell-border)] bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(242,106,33,0.12)] file:px-4 file:py-2 file:font-semibold file:text-[color:var(--color-brand-orange-deep)] hover:file:bg-[rgba(242,106,33,0.18)] disabled:cursor-not-allowed disabled:bg-slate-50";

function UploadButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-11 rounded-full bg-gradient-accent px-5 text-sm font-semibold text-white shadow-accent-glow hover:opacity-95"
      disabled={pending || disabled}
    >
      <Upload className="size-4" />
      {pending ? "กำลังอัปโหลด..." : "เพิ่มผลงาน"}
    </Button>
  );
}

function DeleteWorkFileButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-10 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 shadow-none hover:bg-rose-100"
      disabled={pending || disabled}
    >
      <Trash2 className="size-4" />
      {pending ? "กำลังลบ..." : "ลบไฟล์"}
    </Button>
  );
}

function WorkFileDeleteForm({
  workFile,
  disabled,
}: {
  workFile: InternshipApplicationRecord["workFiles"][number];
  disabled: boolean;
}) {
  const [state, formAction] = useActionState(deleteStudentWorkFile, initialActionState);

  return (
    <form action={formAction} className="rounded-2xl border border-[color:var(--color-shell-border)] bg-white/90 p-5">
      <input type="hidden" name="workFileId" value={workFile.id} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[rgba(242,106,33,0.12)] text-[color:var(--color-brand-orange-deep)] ring-1 ring-orange-200">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{workFile.fileName}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              {formatDateForDisplay(workFile.createdAt)}
            </p>
            <p className="mt-2 text-sm text-slate-600">{formatInternshipWorkFileSize(workFile.fileSize)}</p>
            <a
              href={getInternshipWorkDownloadPath(workFile.filePath, workFile.fileName) ?? undefined}
              download={workFile.fileName}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-accent px-3 py-2 text-xs font-semibold text-white shadow-accent-glow transition hover:opacity-95"
            >
              <Download className="size-3.5" />
              ดาวน์โหลดไฟล์
            </a>
          </div>
        </div>
        <DeleteWorkFileButton disabled={disabled} />
      </div>
      {state.error ? <p className="mt-3 text-sm text-rose-700">{state.error}</p> : null}
    </form>
  );
}

export function StudentWorkSubmission({
  application,
  canManageWorkFiles,
}: {
  application: InternshipApplicationRecord;
  canManageWorkFiles: boolean;
}) {
  const [uploadState, uploadAction] = useActionState(uploadStudentWorkFiles, initialActionState);
  const remainingSlots = Math.max(0, MAX_STUDENT_WORK_FILES - application.workFiles.length);
  const maxFileSizeMb = MAX_STUDENT_WORK_FILE_SIZE_BYTES / (1024 * 1024);

  return (
    <div className="space-y-6">
      <section className="card-surface p-7 sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-orange-deep)]">
              Work Submission
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">บันทึกผลงานระหว่างฝึกงาน</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              อัปโหลดไฟล์ผลงานแบบ PDF ได้สูงสุด {MAX_STUDENT_WORK_FILES} ไฟล์ ไฟล์ละไม่เกิน {maxFileSizeMb} MB
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center rounded-full bg-gradient-brand-soft px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)]">
              อัปโหลดแล้ว {application.workFiles.length} / {MAX_STUDENT_WORK_FILES} ไฟล์
            </div>
            <div className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-[color:var(--color-shell-border)]">
              คงเหลือ {remainingSlots} ไฟล์
            </div>
          </div>
        </div>

        <form action={uploadAction} className="mt-6 space-y-4 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-white/80 p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900" htmlFor="files">
            เลือกไฟล์ผลงาน
          </label>
          <CappedMultiFileInput
            key={`work-files-${application.workFiles.length}`}
            id="files"
            name="files"
            accept="application/pdf,.pdf"
            className={fileInputClassName}
            disabled={!canManageWorkFiles}
            maxFiles={MAX_STUDENT_WORK_FILES}
            uploadedFileCount={application.workFiles.length}
            existingFileKeys={application.workFiles.map((workFile) =>
              getUploadFileDeduplicationKey(workFile.fileName, workFile.fileSize),
            )}
            description="การเลือกไฟล์รอบใหม่จะต่อจากรายการที่เลือกไว้เดิมโดยอัตโนมัติ หากเกินโควตา ระบบจะรับเฉพาะไฟล์ตามลำดับที่เลือกจนเต็มโควตา"
            emptySelectionText="ยังไม่ได้เลือกไฟล์ผลงานใหม่"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-500">
              รองรับเฉพาะไฟล์ PDF และสามารถอัปโหลดหลายไฟล์ในครั้งเดียว ระบบจะบันทึกเพิ่มจากรายการเดิมจนกว่าจะครบ {MAX_STUDENT_WORK_FILES} ไฟล์
            </p>
            <UploadButton disabled={!canManageWorkFiles || remainingSlots === 0} />
          </div>
          {uploadState.error ? <p className="text-sm text-rose-700">{uploadState.error}</p> : null}
        </form>

        {!canManageWorkFiles ? (
          <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-4 text-sm leading-7 text-amber-900 shadow-sm">
            <p className="inline-flex items-center gap-2 font-semibold">
              <LockKeyhole className="size-4" />
              สถานะฝึกงานเสร็จสิ้นแล้ว จึงไม่สามารถเพิ่มหรือลบผลงานได้อีก
            </p>
          </div>
        ) : null}
      </section>

      <section className="card-surface p-7 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">รายการผลงานที่อัปโหลด</h2>
          </div>
          <div className="inline-flex w-fit items-center rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
            ทั้งหมด {application.workFiles.length} ไฟล์
          </div>
        </div>

        {application.workFiles.length ? (
          <div className="mt-6 grid gap-4">
            {application.workFiles.map((workFile) => (
              <WorkFileDeleteForm key={workFile.id} workFile={workFile} disabled={!canManageWorkFiles} />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-7 text-slate-500">ยังไม่มีผลงานที่อัปโหลดในขณะนี้</p>
        )}
      </section>
    </div>
  );
}