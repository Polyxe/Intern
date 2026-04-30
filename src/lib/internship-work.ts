import type { Prisma } from "@/generated/prisma/client";

export const MAX_STUDENT_WORK_FILES = 5;
export const MAX_STUDENT_WORK_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const internshipWorkFileSelect = {
  id: true,
  fileName: true,
  filePath: true,
  mimeType: true,
  fileSize: true,
  createdAt: true,
} satisfies Prisma.InternshipWorkFileSelect;

export type InternshipWorkFileRecord = Prisma.InternshipWorkFileGetPayload<{
  select: typeof internshipWorkFileSelect;
}>;

export function formatInternshipWorkFileSize(fileSize: number) {
  return `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
}