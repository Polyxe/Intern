"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { deleteStoredFiles, saveUploadedFile } from "@/lib/file-storage";
import { canStudentEditApplication } from "@/lib/internship-application";
import {
  MAX_STUDENT_WORK_FILES,
  MAX_STUDENT_WORK_FILE_SIZE_BYTES,
} from "@/lib/internship-work";
import { prisma } from "@/lib/prisma";
import { getBrowserFileDeduplicationKey, getUploadFileDeduplicationKey } from "@/lib/upload-file-deduplication";
import { USER_ROLES } from "@/lib/user-management";

export type InternshipWorkActionState = {
  error: string;
};

const ALLOWED_WORK_FILE_MIME_TYPES = new Set(["application/pdf"]);

function revalidateInternshipWorkPaths(userId: string) {
  revalidatePath("/intern/work");
  revalidatePath("/intern/profile");
  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${userId}`);
}

function getSubmittedFiles(formData: FormData, fieldName: string) {
  return formData.getAll(fieldName).filter((entry): entry is File => {
    return entry instanceof File && entry.size > 0 && entry.name.trim().length > 0;
  });
}

function limitFilesToRemainingSlots(files: File[], maxFiles: number, existingFileCount: number) {
  const remainingSlots = Math.max(0, maxFiles - existingFileCount);

  return files.slice(0, remainingSlots);
}

function filterDuplicateFiles(
  files: File[],
  existingFiles: ReadonlyArray<{ fileName: string; fileSize: number }>,
) {
  const knownFileKeys = new Set(
    existingFiles.map((file) => getUploadFileDeduplicationKey(file.fileName, file.fileSize)),
  );

  return files.filter((file) => {
    const fileKey = getBrowserFileDeduplicationKey(file);

    if (knownFileKeys.has(fileKey)) {
      return false;
    }

    knownFileKeys.add(fileKey);

    return true;
  });
}

function isAcceptedWorkFile(file: File) {
  const normalizedName = file.name.trim().toLowerCase();

  if (!normalizedName.endsWith(".pdf")) {
    return false;
  }

  return file.type === "" || ALLOWED_WORK_FILE_MIME_TYPES.has(file.type);
}

export async function uploadStudentWorkFiles(
  _: InternshipWorkActionState,
  formData: FormData,
): Promise<InternshipWorkActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== USER_ROLES.Student) {
    return {
      error: "เฉพาะบัญชีนักศึกษาเท่านั้นที่อัปโหลดผลงานได้",
    };
  }

  if (!currentUser.acceptedTermsAt) {
    return {
      error: "กรุณายอมรับข้อตกลงการใช้งานก่อนอัปโหลดผลงาน",
    };
  }

  const application = await prisma.internshipApplication.findUnique({
    where: { userId: currentUser.id },
    select: {
      id: true,
      status: true,
      workFiles: {
        select: {
          id: true,
          fileName: true,
          fileSize: true,
        },
      },
    },
  });

  if (!application) {
    return {
      error: "กรุณาบันทึกข้อมูลฝึกงานก่อน จึงจะอัปโหลดผลงานได้",
    };
  }

  if (!canStudentEditApplication(application)) {
    return {
      error: "ไม่สามารถอัปโหลดผลงานได้อีก เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว",
    };
  }

  const requestedFiles = getSubmittedFiles(formData, "files");

  if (requestedFiles.length === 0) {
    return {
      error: "กรุณาเลือกไฟล์ผลงานอย่างน้อย 1 ไฟล์",
    };
  }

  if (application.workFiles.length >= MAX_STUDENT_WORK_FILES) {
    return {
      error: `อัปโหลดผลงานได้สูงสุด ${MAX_STUDENT_WORK_FILES} ไฟล์ต่อบัญชี`,
    };
  }

  const files = limitFilesToRemainingSlots(
    filterDuplicateFiles(requestedFiles, application.workFiles),
    MAX_STUDENT_WORK_FILES,
    application.workFiles.length,
  );

  if (files.length === 0) {
    return {
      error: "ไฟล์ที่เลือกซ้ำกับรายการเดิมทั้งหมด",
    };
  }

  const oversizedFile = files.find((file) => file.size > MAX_STUDENT_WORK_FILE_SIZE_BYTES);

  if (oversizedFile) {
    return {
      error: `ไฟล์ ${oversizedFile.name} มีขนาดเกิน 50 MB`,
    };
  }

  const invalidFile = files.find((file) => !isAcceptedWorkFile(file));

  if (invalidFile) {
    return {
      error: `ไฟล์ ${invalidFile.name} ไม่ใช่ไฟล์ PDF`,
    };
  }

  const savedFilePaths: string[] = [];

  try {
    const savedFiles = await Promise.all(
      files.map((file) => saveUploadedFile(file, `internship-work-files/${currentUser.id}`)),
    );

    savedFilePaths.push(...savedFiles.map((file) => file.filePath));

    await prisma.internshipWorkFile.createMany({
      data: savedFiles.map((file) => ({
        applicationId: application.id,
        fileName: file.fileName,
        filePath: file.filePath,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
      })),
    });
  } catch {
    await deleteStoredFiles(savedFilePaths);

    return {
      error: "ไม่สามารถบันทึกไฟล์ผลงานได้ กรุณาลองใหม่อีกครั้ง",
    };
  }

  revalidateInternshipWorkPaths(currentUser.id);

  return {
    error: "",
  };
}

export async function deleteStudentWorkFile(
  _: InternshipWorkActionState,
  formData: FormData,
): Promise<InternshipWorkActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== USER_ROLES.Student) {
    return {
      error: "เฉพาะบัญชีนักศึกษาเท่านั้นที่ลบผลงานได้",
    };
  }

  if (!currentUser.acceptedTermsAt) {
    return {
      error: "กรุณายอมรับข้อตกลงการใช้งานก่อนจัดการผลงาน",
    };
  }

  const workFileId = String(formData.get("workFileId") ?? "");

  if (!workFileId) {
    return {
      error: "ไม่พบไฟล์ผลงานที่ต้องการลบ",
    };
  }

  const workFile = await prisma.internshipWorkFile.findUnique({
    where: { id: workFileId },
    select: {
      id: true,
      filePath: true,
      application: {
        select: {
          userId: true,
          status: true,
        },
      },
    },
  });

  if (!workFile || workFile.application.userId !== currentUser.id) {
    return {
      error: "ไม่พบไฟล์ผลงานที่ต้องการลบ",
    };
  }

  if (!canStudentEditApplication(workFile.application)) {
    return {
      error: "ไม่สามารถลบผลงานได้อีก เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว",
    };
  }

  await prisma.internshipWorkFile.delete({
    where: { id: workFileId },
  });

  await deleteStoredFiles([workFile.filePath]);

  revalidateInternshipWorkPaths(currentUser.id);

  return {
    error: "",
  };
}