"use server";

import { revalidatePath } from "next/cache";

import {
  canStudentEditApplication,
  INTERNSHIP_APPLICATION_APPROVAL_STATUSES,
  parseDateInput,
} from "@/lib/internship-application";
import { getCurrentUser } from "@/lib/auth";
import { deleteStoredFiles, saveUploadedFile } from "@/lib/file-storage";
import { prisma } from "@/lib/prisma";
import { USER_ROLES } from "@/lib/user-management";

export type InternshipApplicationFormValues = {
  title: string;
  firstname: string;
  lastname: string;
  sex: string;
  birthDate: string;
  address: string;
  institution: string;
  studentId: string;
  phoneNumber: string;
  faculty: string;
  program: string;
  yearLevel: string;
  internshipPosition: string;
  companyName: string;
  companyAddress: string;
  guidingProfessorFirstname: string;
  guidingProfessorLastname: string;
  guidingProfessorPhoneNumber: string;
  companySupervisorName: string;
  companySupervisorRole: string;
  companySupervisorEmail: string;
  companySupervisorPhoneNumber: string;
  internshipStartDate: string;
  internshipEndDate: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhoneNumber: string;
  notes: string;
};

export type InternshipApplicationFormState = {
  error: string;
  success: string;
  values: InternshipApplicationFormValues;
};

export type InternshipAttachmentActionState = {
  error: string;
};

const MAX_ATTACHMENT_COUNT = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const ALLOWED_PROFILE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

function buildFormValues(formData: FormData): InternshipApplicationFormValues {
  return {
    title: getTextValue(formData, "title"),
    firstname: getTextValue(formData, "firstname"),
    lastname: getTextValue(formData, "lastname"),
    sex: getTextValue(formData, "sex"),
    birthDate: getTextValue(formData, "birthDate"),
    address: getTextValue(formData, "address"),
    institution: getTextValue(formData, "institution"),
    studentId: getTextValue(formData, "studentId"),
    phoneNumber: getTextValue(formData, "phoneNumber"),
    faculty: getTextValue(formData, "faculty"),
    program: getTextValue(formData, "program"),
    yearLevel: getTextValue(formData, "yearLevel"),
    internshipPosition: getTextValue(formData, "internshipPosition"),
    companyName: getTextValue(formData, "companyName"),
    companyAddress: getTextValue(formData, "companyAddress"),
    guidingProfessorFirstname: getTextValue(formData, "guidingProfessorFirstname"),
    guidingProfessorLastname: getTextValue(formData, "guidingProfessorLastname"),
    guidingProfessorPhoneNumber: getTextValue(formData, "guidingProfessorPhoneNumber"),
    companySupervisorName: getTextValue(formData, "companySupervisorName"),
    companySupervisorRole: getTextValue(formData, "companySupervisorRole"),
    companySupervisorEmail: getTextValue(formData, "companySupervisorEmail"),
    companySupervisorPhoneNumber: getTextValue(formData, "companySupervisorPhoneNumber"),
    internshipStartDate: getTextValue(formData, "internshipStartDate"),
    internshipEndDate: getTextValue(formData, "internshipEndDate"),
    emergencyContactName: getTextValue(formData, "emergencyContactName"),
    emergencyContactRelationship: getTextValue(formData, "emergencyContactRelationship"),
    emergencyContactPhoneNumber: getTextValue(formData, "emergencyContactPhoneNumber"),
    notes: getTextValue(formData, "notes"),
  };
}

function getFileValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return value instanceof File && value.size > 0 ? value : null;
}

function getFilesValue(formData: FormData, fieldName: string) {
  return formData.getAll(fieldName).filter((value): value is File => value instanceof File && value.size > 0);
}

function createState(values: InternshipApplicationFormValues, error = "", success = ""): InternshipApplicationFormState {
  return {
    error,
    success,
    values,
  };
}

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function saveInternshipApplication(
  _: InternshipApplicationFormState,
  formData: FormData,
): Promise<InternshipApplicationFormState> {
  const currentUser = await getCurrentUser();
  const values = buildFormValues(formData);

  if (!currentUser || currentUser.role !== USER_ROLES.Student) {
    return createState(values, "เฉพาะบัญชีนักศึกษาเท่านั้นที่ส่งแบบฟอร์มฝึกงานได้");
  }

  const profilePhoto = getFileValue(formData, "profilePhoto");
  const attachmentFiles = getFilesValue(formData, "attachments");

  if (
    !values.title ||
    !values.firstname ||
    !values.lastname ||
    !values.sex ||
    !values.birthDate ||
    !values.address ||
    !values.institution ||
    !values.studentId ||
    !values.phoneNumber ||
    !values.faculty ||
    !values.program ||
    !values.yearLevel ||
    !values.internshipPosition ||
    !values.companyName ||
    !values.companyAddress ||
    !values.guidingProfessorFirstname ||
    !values.guidingProfessorLastname ||
    !values.guidingProfessorPhoneNumber ||
    !values.companySupervisorName ||
    !values.companySupervisorRole ||
    !values.companySupervisorEmail ||
    !values.companySupervisorPhoneNumber ||
    !values.internshipStartDate ||
    !values.internshipEndDate ||
    !values.emergencyContactName ||
    !values.emergencyContactRelationship ||
    !values.emergencyContactPhoneNumber
  ) {
    return createState(values, "กรุณากรอกข้อมูลที่จำเป็นให้ครบทุกช่องก่อนบันทึก");
  }

  if (!isValidEmail(values.companySupervisorEmail)) {
    return createState(values, "อีเมลผู้ดูแลในสถานประกอบการไม่ถูกต้อง");
  }

  const birthDate = parseDateInput(values.birthDate);

  if (!birthDate) {
    return createState(values, "กรุณาระบุวันเกิดให้ถูกต้อง");
  }

  const internshipStartDate = parseDateInput(values.internshipStartDate);
  const internshipEndDate = parseDateInput(values.internshipEndDate);

  if (!internshipStartDate || !internshipEndDate) {
    return createState(values, "กรุณาระบุวันที่เริ่มและสิ้นสุดฝึกงานให้ถูกต้อง");
  }

  if (internshipEndDate < internshipStartDate) {
    return createState(values, "วันที่สิ้นสุดฝึกงานต้องไม่ก่อนวันที่เริ่มต้น");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      profileImagePath: true,
      application: {
        select: {
          id: true,
          approvalStatus: true,
          internshipEndDate: true,
          approvedAt: true,
          attachments: {
            select: {
              id: true,
              filePath: true,
            },
          },
        },
      },
    },
  });

  const existingApplication = existingUser?.application ?? null;

  if (existingApplication && !canStudentEditApplication(existingApplication)) {
    return createState(values, "ไม่สามารถแก้ไขข้อมูลได้อีก เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว");
  }

  if (!existingUser?.profileImagePath && !profilePhoto) {
    return createState(values, "กรุณาอัปโหลดรูปโปรไฟล์ก่อนบันทึกแบบฟอร์ม");
  }

  const existingAttachmentCount = existingApplication?.attachments.length ?? 0;

  if (existingAttachmentCount + attachmentFiles.length > MAX_ATTACHMENT_COUNT) {
    return createState(values, "ไฟล์ประกอบทั้งหมดต้องมีไม่เกิน 5 ไฟล์");
  }

  if (profilePhoto) {
    if (!ALLOWED_PROFILE_MIME_TYPES.has(profilePhoto.type)) {
      return createState(values, "รูปโปรไฟล์ต้องเป็นไฟล์ PNG หรือ JPG เท่านั้น");
    }

    if (profilePhoto.size > MAX_FILE_SIZE_BYTES) {
      return createState(values, "รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB");
    }
  }

  for (const attachment of attachmentFiles) {
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(attachment.type)) {
      return createState(values, "ไฟล์ประกอบต้องเป็น PDF, PNG หรือ JPG เท่านั้น");
    }

    if (attachment.size > MAX_FILE_SIZE_BYTES) {
      return createState(values, "ไฟล์ประกอบแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB");
    }
  }

  const newlySavedFilePaths: string[] = [];

  try {
    const savedProfilePhoto = profilePhoto
      ? await saveUploadedFile(profilePhoto, `profile-photos/${currentUser.id}`)
      : null;
    const savedAttachments =
      attachmentFiles.length > 0
        ? await Promise.all(
            attachmentFiles.map((attachment) =>
              saveUploadedFile(attachment, `internship-applications/${currentUser.id}`),
            ),
          )
        : [];

    newlySavedFilePaths.push(...savedAttachments.map((item) => item.filePath));

    if (savedProfilePhoto) {
      newlySavedFilePaths.push(savedProfilePhoto.filePath);
    }

    const oldProfileImagePath = existingUser?.profileImagePath ?? null;

    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: currentUser.id },
        data: {
          title: values.title,
          firstname: values.firstname,
          lastname: values.lastname,
          sex: values.sex,
          birthDate,
          address: values.address,
          institution: values.institution,
          ...(savedProfilePhoto ? { profileImagePath: savedProfilePhoto.filePath } : {}),
        },
      });

      const application = await transaction.internshipApplication.upsert({
        where: { userId: currentUser.id },
        update: {
          studentId: values.studentId,
          phoneNumber: values.phoneNumber,
          faculty: values.faculty,
          program: values.program,
          yearLevel: values.yearLevel,
          internshipPosition: values.internshipPosition,
          companyName: values.companyName,
          companyAddress: values.companyAddress,
          guidingProfessorFirstname: values.guidingProfessorFirstname,
          guidingProfessorLastname: values.guidingProfessorLastname,
          guidingProfessorPhoneNumber: values.guidingProfessorPhoneNumber,
          companySupervisorName: values.companySupervisorName,
          companySupervisorRole: values.companySupervisorRole,
          companySupervisorEmail: values.companySupervisorEmail,
          companySupervisorPhoneNumber: values.companySupervisorPhoneNumber,
          internshipStartDate,
          internshipEndDate,
          emergencyContactName: values.emergencyContactName,
          emergencyContactRelationship: values.emergencyContactRelationship,
          emergencyContactPhoneNumber: values.emergencyContactPhoneNumber,
          notes: values.notes || null,
          approvalStatus: INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Pending,
          approvedAt: null,
        },
        create: {
          userId: currentUser.id,
          studentId: values.studentId,
          phoneNumber: values.phoneNumber,
          faculty: values.faculty,
          program: values.program,
          yearLevel: values.yearLevel,
          internshipPosition: values.internshipPosition,
          companyName: values.companyName,
          companyAddress: values.companyAddress,
          guidingProfessorFirstname: values.guidingProfessorFirstname,
          guidingProfessorLastname: values.guidingProfessorLastname,
          guidingProfessorPhoneNumber: values.guidingProfessorPhoneNumber,
          companySupervisorName: values.companySupervisorName,
          companySupervisorRole: values.companySupervisorRole,
          companySupervisorEmail: values.companySupervisorEmail,
          companySupervisorPhoneNumber: values.companySupervisorPhoneNumber,
          internshipStartDate,
          internshipEndDate,
          emergencyContactName: values.emergencyContactName,
          emergencyContactRelationship: values.emergencyContactRelationship,
          emergencyContactPhoneNumber: values.emergencyContactPhoneNumber,
          notes: values.notes || null,
          approvalStatus: INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Pending,
        },
        select: {
          id: true,
        },
      });

      if (savedAttachments.length > 0) {
        await transaction.internshipApplicationAttachment.createMany({
          data: savedAttachments.map((attachment) => ({
            applicationId: application.id,
            fileName: attachment.fileName,
            filePath: attachment.filePath,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
          })),
        });
      }
    });

    if (savedProfilePhoto && oldProfileImagePath) {
      await deleteStoredFiles([oldProfileImagePath]);
    }
  } catch {
    await deleteStoredFiles(newlySavedFilePaths);

    return createState(values, "ไม่สามารถบันทึกไฟล์อัปโหลดได้ กรุณาลองใหม่อีกครั้ง");
  }

  revalidatePath("/intern/application");
  revalidatePath("/intern/profile");
  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${currentUser.id}`);

  return createState(
    values,
    "",
    existingApplication && existingApplication.approvalStatus !== INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Pending
      ? "บันทึกการแก้ไขเรียบร้อยแล้ว แบบฟอร์มถูกส่งกลับไปสถานะ Pending เพื่อรออนุมัติใหม่"
      : "บันทึกแบบฟอร์มฝึกงานเรียบร้อยแล้ว",
  );
}

export async function deleteStudentAttachment(
  _: InternshipAttachmentActionState,
  formData: FormData,
): Promise<InternshipAttachmentActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== USER_ROLES.Student) {
    return {
      error: "เฉพาะบัญชีนักศึกษาเท่านั้นที่ลบไฟล์ได้",
    };
  }

  const attachmentId = String(formData.get("attachmentId") ?? "");

  if (!attachmentId) {
    return {
      error: "ไม่พบไฟล์ที่ต้องการลบ",
    };
  }

  const attachment = await prisma.internshipApplicationAttachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      filePath: true,
      application: {
        select: {
          userId: true,
          approvalStatus: true,
          internshipEndDate: true,
        },
      },
    },
  });

  if (!attachment || attachment.application.userId !== currentUser.id) {
    return {
      error: "ไม่พบไฟล์ที่ต้องการลบ",
    };
  }

  if (!canStudentEditApplication(attachment.application)) {
    return {
      error: "ไม่สามารถลบไฟล์ได้อีก เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว",
    };
  }

  await prisma.internshipApplicationAttachment.delete({
    where: { id: attachmentId },
  });

  await deleteStoredFiles([attachment.filePath]);

  revalidatePath("/intern/application");
  revalidatePath("/intern/profile");

  return {
    error: "",
  };
}