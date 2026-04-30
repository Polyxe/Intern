"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getBrowserFileDeduplicationKey } from "@/lib/upload-file-deduplication";

type CappedMultiFileInputProps = {
  id: string;
  name: string;
  accept?: string;
  className?: string;
  disabled?: boolean;
  maxFiles: number;
  uploadedFileCount: number;
  existingFileKeys?: string[];
  description?: string;
  emptySelectionText?: string;
};

function formatFileSize(fileSize: number) {
  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}

function buildFileList(files: File[]) {
  const dataTransfer = new DataTransfer();

  for (const file of files) {
    dataTransfer.items.add(file);
  }

  return dataTransfer.files;
}

export function CappedMultiFileInput({
  id,
  name,
  accept,
  className,
  disabled = false,
  maxFiles,
  uploadedFileCount,
  existingFileKeys = [],
  description,
  emptySelectionText = "ยังไม่ได้เลือกไฟล์ใหม่",
}: CappedMultiFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const maxSelectableFiles = Math.max(0, maxFiles - uploadedFileCount);
  const visibleSelectedFiles = selectedFiles.slice(0, maxSelectableFiles);
  const remainingSelectionSlots = Math.max(0, maxSelectableFiles - visibleSelectedFiles.length);
  const isInputDisabled = disabled || remainingSelectionSlots === 0;

  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    if (visibleSelectedFiles.length === 0) {
      input.value = "";
      return;
    }

    input.files = buildFileList(visibleSelectedFiles);
  }, [visibleSelectedFiles]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.currentTarget.files ?? []).filter(
      (file) => file.size > 0 && file.name.trim().length > 0,
    );

    if (incomingFiles.length === 0) {
      return;
    }

    setSelectedFiles((currentFiles) => {
      const cappedCurrentFiles = currentFiles.slice(0, maxSelectableFiles);
      const knownFileKeys = new Set(existingFileKeys);

      for (const file of cappedCurrentFiles) {
        knownFileKeys.add(getBrowserFileDeduplicationKey(file));
      }

      const nextFiles = [...cappedCurrentFiles];

      for (const file of incomingFiles) {
        const fileKey = getBrowserFileDeduplicationKey(file);

        if (knownFileKeys.has(fileKey)) {
          continue;
        }

        knownFileKeys.add(fileKey);
        nextFiles.push(file);
      }

      return nextFiles;
    });
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((currentFiles) =>
      currentFiles
        .slice(0, maxSelectableFiles)
        .filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple
        className={className}
        disabled={isInputDisabled}
        onChange={handleChange}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center rounded-full bg-[color:var(--color-surface-soft)] px-3 py-1.5 text-[color:var(--color-brand-violet-deep)]">
          เลือกไว้แล้ว {visibleSelectedFiles.length} ไฟล์
        </span>
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 ring-1 ring-[color:var(--color-shell-border)]">
          เลือกเพิ่มได้อีก {remainingSelectionSlots} ไฟล์
        </span>
      </div>

      {description ? <p className="text-xs leading-5 text-slate-500">{description}</p> : null}

      {visibleSelectedFiles.length ? (
        <div className="grid gap-3">
          {visibleSelectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex flex-col gap-3 rounded-2xl border border-[color:var(--color-shell-border)] bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)]">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{file.name}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 shadow-none hover:bg-rose-100"
                onClick={() => removeSelectedFile(index)}
              >
                <Trash2 className="size-4" />
                ลบออกจากรายการ
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">{emptySelectionText}</p>
      )}
    </div>
  );
}