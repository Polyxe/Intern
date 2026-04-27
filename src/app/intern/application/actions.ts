"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  canStudentEditApplication,
  INTERNSHIP_APPLICATION_STATUSES,
  isApprovedInternshipStatus,
  parseDateInput,
} from "@/lib/internship-application";
import { getCurrentUser } from "@/lib/auth";
import { deleteStoredFiles, saveUploadedFile } from "@/lib/file-storage";
import {
  isFutureDate,
  isValidPhoneNumber,
  isValidSingleDigitNumber,
  isValidStudentId,
} from "@/lib/form-validation";
import { notifyAdmins } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getDisplayName } from "@/lib/user-management";
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

export type InternshipApplicationFieldName =
  | keyof InternshipApplicationFormValues
  | "email"
  | "profilePhoto"
  | "attachments";

export type InternshipApplicationFieldErrors = Partial<Record<InternshipApplicationFieldName, string>>;

export type InternshipApplicationFormState = {
  error: string;
  success: string;
  values: InternshipApplicationFormValues;
  fieldErrors: InternshipApplicationFieldErrors;
};

export type InternshipAttachmentActionState = {
  error: string;
};

const MAX_ATTACHMENT_COUNT = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const ALLOWED_PROFILE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const REQUIRED_FIELD_MESSAGES: Record<keyof Omit<InternshipApplicationFormValues, "notes">, string> = {
  title: "กรุณาระบุคำนำหน้า",
  firstname: "กรุณาระบุชื่อ",
  lastname: "กรุณาระบุนามสกุล",
  sex: "กรุณาเลือกเพศ",
  birthDate: "กรุณาระบุวันเกิด",
  address: "กรุณาระบุที่อยู่",
  institution: "กรุณาระบุสถาบัน",
  studentId: "กรุณาระบุรหัสนักศึกษา",
  phoneNumber: "กรุณาระบุเบอร์โทรศัพท์",
  faculty: "กรุณาระบุคณะ",
  program: "กรุณาระบุสาขา / หลักสูตร",
  yearLevel: "กรุณาระบุชั้นปี",
  internshipPosition: "กรุณาระบุตำแหน่งฝึกงาน",
  companyName: "กรุณาระบุชื่อบริษัท / หน่วยงาน",
  companyAddress: "กรุณาระบุที่อยู่บริษัท",
  guidingProfessorFirstname: "กรุณาระบุชื่ออาจารย์นิเทศ",
  guidingProfessorLastname: "กรุณาระบุนามสกุลอาจารย์นิเทศ",
  guidingProfessorPhoneNumber: "กรุณาระบุเบอร์โทรอาจารย์นิเทศ",
  companySupervisorName: "กรุณาระบุชื่อผู้ดูแลในสถานประกอบการ",
  companySupervisorRole: "กรุณาระบุตำแหน่งผู้ดูแล",
  companySupervisorEmail: "กรุณาระบุอีเมลผู้ดูแล",
  companySupervisorPhoneNumber: "กรุณาระบุเบอร์โทรผู้ดูแล",
  internshipStartDate: "กรุณาระบุวันที่เริ่มฝึกงาน",
  internshipEndDate: "กรุณาระบุวันที่สิ้นสุดฝึกงาน",
  emergencyContactName: "กรุณาระบุชื่อผู้ติดต่อฉุกเฉิน",
  emergencyContactRelationship: "กรุณาระบุความสัมพันธ์ของผู้ติดต่อฉุกเฉิน",
  emergencyContactPhoneNumber: "กรุณาระบุเบอร์โทรผู้ติดต่อฉุกเฉิน",
};

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

function createState(
  values: InternshipApplicationFormValues,
  options?: {
    error?: string;
    success?: string;
    fieldErrors?: InternshipApplicationFieldErrors;
  },
): InternshipApplicationFormState {
  return {
    error: options?.error ?? "",
    success: options?.success ?? "",
    values,
    fieldErrors: options?.fieldErrors ?? {},
  };
}

function getTextValue(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function addFieldError(
  fieldErrors: InternshipApplicationFieldErrors,
  fieldName: InternshipApplicationFieldName,
  message: string,
) {
  if (!fieldErrors[fieldName]) {
    fieldErrors[fieldName] = message;
  }
}

function createValidationState(
  values: InternshipApplicationFormValues,
  fieldErrors: InternshipApplicationFieldErrors,
): InternshipApplicationFormState {
  const uniqueMessages = [...new Set(Object.values(fieldErrors).filter(Boolean))];

  return createState(values, {
    error:
      uniqueMessages.length <= 1
        ? uniqueMessages[0] ?? "กรุณาตรวจสอบข้อมูลที่ระบุไว้ในแบบฟอร์มอีกครั้ง"
        : "กรุณาตรวจสอบข้อมูลที่ระบุไว้ในแบบฟอร์มอีกครั้ง",
    fieldErrors,
  });
}

function validateInternshipApplication({
  values,
  hasExistingProfilePhoto,
  existingAttachmentCount,
  profilePhoto,
  attachmentFiles,
}: {
  values: InternshipApplicationFormValues;
  hasExistingProfilePhoto: boolean;
  existingAttachmentCount: number;
  profilePhoto: File | null;
  attachmentFiles: File[];
}) {
  const fieldErrors: InternshipApplicationFieldErrors = {};

  for (const [fieldName, message] of Object.entries(REQUIRED_FIELD_MESSAGES)) {
    const typedFieldName = fieldName as keyof typeof REQUIRED_FIELD_MESSAGES;

    if (!values[typedFieldName]) {
      addFieldError(fieldErrors, typedFieldName, message);
    }
  }

  if (values.companySupervisorEmail && !isValidEmail(values.companySupervisorEmail)) {
    addFieldError(fieldErrors, "companySupervisorEmail", "อีเมลผู้ดูแลในสถานประกอบการไม่ถูกต้อง");
  }

  if (values.studentId && !isValidStudentId(values.studentId)) {
    addFieldError(fieldErrors, "studentId", "รหัสนักศึกษาต้องเป็นตัวเลข 9 หลัก");
  }

  if (values.phoneNumber && !isValidPhoneNumber(values.phoneNumber)) {
    addFieldError(fieldErrors, "phoneNumber", "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก");
  }

  if (values.guidingProfessorPhoneNumber && !isValidPhoneNumber(values.guidingProfessorPhoneNumber)) {
    addFieldError(fieldErrors, "guidingProfessorPhoneNumber", "เบอร์โทรอาจารย์นิเทศต้องเป็นตัวเลข 9-10 หลัก");
  }

  if (values.companySupervisorPhoneNumber && !isValidPhoneNumber(values.companySupervisorPhoneNumber)) {
    addFieldError(fieldErrors, "companySupervisorPhoneNumber", "เบอร์โทรผู้ดูแลต้องเป็นตัวเลข 9-10 หลัก");
  }

  if (values.emergencyContactPhoneNumber && !isValidPhoneNumber(values.emergencyContactPhoneNumber)) {
    addFieldError(fieldErrors, "emergencyContactPhoneNumber", "เบอร์โทรผู้ติดต่อฉุกเฉินต้องเป็นตัวเลข 9-10 หลัก");
  }

  if (values.yearLevel && !isValidSingleDigitNumber(values.yearLevel)) {
    addFieldError(fieldErrors, "yearLevel", "ชั้นปีต้องเป็นตัวเลข 1 หลัก");
  }

  const birthDate = values.birthDate ? parseDateInput(values.birthDate) : null;

  if (values.birthDate) {
    if (!birthDate) {
      addFieldError(fieldErrors, "birthDate", "กรุณาระบุวันเกิดให้ถูกต้อง");
    } else if (isFutureDate(birthDate)) {
      addFieldError(fieldErrors, "birthDate", "วันเกิดต้องไม่เป็นวันที่ในอนาคต");
    }
  }

  const internshipStartDate = values.internshipStartDate ? parseDateInput(values.internshipStartDate) : null;
  const internshipEndDate = values.internshipEndDate ? parseDateInput(values.internshipEndDate) : null;

  if (values.internshipStartDate && !internshipStartDate) {
    addFieldError(fieldErrors, "internshipStartDate", "กรุณาระบุวันที่เริ่มฝึกงานให้ถูกต้อง");
  }

  if (values.internshipEndDate && !internshipEndDate) {
    addFieldError(fieldErrors, "internshipEndDate", "กรุณาระบุวันที่สิ้นสุดฝึกงานให้ถูกต้อง");
  }

  if (internshipStartDate && internshipEndDate && internshipEndDate < internshipStartDate) {
    addFieldError(fieldErrors, "internshipEndDate", "วันที่สิ้นสุดฝึกงานต้องไม่ก่อนวันที่เริ่มต้น");
  }

  if (!hasExistingProfilePhoto && !profilePhoto) {
    addFieldError(fieldErrors, "profilePhoto", "กรุณาอัปโหลดรูปโปรไฟล์ก่อนบันทึกแบบฟอร์ม");
  }

  if (existingAttachmentCount + attachmentFiles.length > MAX_ATTACHMENT_COUNT) {
    addFieldError(fieldErrors, "attachments", "ไฟล์ประกอบทั้งหมดต้องมีไม่เกิน 5 ไฟล์");
  }

  if (profilePhoto) {
    if (!ALLOWED_PROFILE_MIME_TYPES.has(profilePhoto.type)) {
      addFieldError(fieldErrors, "profilePhoto", "รูปโปรไฟล์ต้องเป็นไฟล์ PNG หรือ JPG เท่านั้น");
    }

    if (profilePhoto.size > MAX_FILE_SIZE_BYTES) {
      addFieldError(fieldErrors, "profilePhoto", "รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB");
    }
  }

  for (const attachment of attachmentFiles) {
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(attachment.type)) {
      addFieldError(fieldErrors, "attachments", "ไฟล์ประกอบต้องเป็น PDF, PNG หรือ JPG เท่านั้น");
      break;
    }

    if (attachment.size > MAX_FILE_SIZE_BYTES) {
      addFieldError(fieldErrors, "attachments", "ไฟล์ประกอบแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB");
      break;
    }
  }

  return {
    fieldErrors,
    birthDate,
    internshipStartDate,
    internshipEndDate,
  };
}

export async function saveInternshipApplication(
  _: InternshipApplicationFormState,
  formData: FormData,
): Promise<InternshipApplicationFormState> {
  const currentUser = await getCurrentUser();
  const values = buildFormValues(formData);

  if (!currentUser || currentUser.role !== USER_ROLES.Student) {
    return createState(values, { error: "เฉพาะบัญชีนักศึกษาเท่านั้นที่ส่งแบบฟอร์มฝึกงานได้" });
  }

  if (!currentUser.acceptedTermsAt) {
    return createState(values, { error: "กรุณายอมรับข้อตกลงการใช้งานก่อนกรอกแบบฟอร์มฝึกงาน" });
  }

  const profilePhoto = getFileValue(formData, "profilePhoto");
  const attachmentFiles = getFilesValue(formData, "attachments");

  const existingUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      profileImagePath: true,
      application: {
        select: {
          id: true,
          status: true,
          approvedAt: true,
          finishedAt: true,
          editedAfterApprovalAt: true,
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
    return createState(values, { error: "ไม่สามารถแก้ไขข้อมูลได้อีก เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว" });
  }

  const existingAttachmentCount = existingApplication?.attachments.length ?? 0;

  const validation = validateInternshipApplication({
    values,
    hasExistingProfilePhoto: Boolean(existingUser?.profileImagePath),
    existingAttachmentCount,
    profilePhoto,
    attachmentFiles,
  });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return createValidationState(values, validation.fieldErrors);
  }

  const birthDate = validation.birthDate;
  const internshipStartDate = validation.internshipStartDate;
  const internshipEndDate = validation.internshipEndDate;

  if (!birthDate || !internshipStartDate || !internshipEndDate) {
    return createState(values, { error: "กรุณาตรวจสอบข้อมูลวันที่ในแบบฟอร์มอีกครั้ง" });
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
    const editedAfterApprovalAt =
      existingApplication?.status && isApprovedInternshipStatus(existingApplication.status)
        ? new Date()
        : existingApplication?.editedAfterApprovalAt ?? null;

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
          status:
            existingApplication?.status === INTERNSHIP_APPLICATION_STATUSES.Pending
              ? existingApplication.status
              : INTERNSHIP_APPLICATION_STATUSES.Pending,
          approvedAt:
            existingApplication?.status === INTERNSHIP_APPLICATION_STATUSES.Pending
              ? existingApplication.approvedAt ?? null
              : null,
          finishedAt: null,
          editedAfterApprovalAt,
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
          status: INTERNSHIP_APPLICATION_STATUSES.Pending,
          approvedAt: null,
          finishedAt: null,
          editedAfterApprovalAt: null,
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

    if (
      existingApplication?.status &&
      existingApplication.status !== INTERNSHIP_APPLICATION_STATUSES.Pending
    ) {
      const studentName = getDisplayName({
        title: values.title,
        firstname: values.firstname,
        lastname: values.lastname,
      });

      const notificationTitle = isApprovedInternshipStatus(existingApplication.status)
        ? "นักศึกษาแก้ไขข้อมูลฝึกงานหลังการอนุมัติ"
        : "นักศึกษาแก้ไขแบบฟอร์มที่ถูกปฏิเสธและส่งกลับใหม่";
      const notificationMessage = isApprovedInternshipStatus(existingApplication.status)
        ? `${studentName} ได้แก้ไขข้อมูลในแบบฟอร์มฝึกงานหลังการอนุมัติ ระบบได้ส่งคำขอกลับเข้าสู่สถานะรอตรวจสอบแล้ว`
        : `${studentName} ได้แก้ไขข้อมูลในแบบฟอร์มฝึกงานที่ถูกปฏิเสธ และส่งกลับเข้าสู่สถานะรอตรวจสอบแล้ว`;

      await notifyAdmins(
        notificationTitle,
        notificationMessage,
        {
          email: {
            subject: notificationTitle,
            actionPath: `/intern/manage-users/${currentUser.id}`,
            actionLabel: "เปิดหน้ารายละเอียดนักศึกษา",
          },
        },
      );
    }
  } catch {
    await deleteStoredFiles(newlySavedFilePaths);

    return createState(values, { error: "ไม่สามารถบันทึกไฟล์อัปโหลดได้ กรุณาลองใหม่อีกครั้ง" });
  }

  revalidatePath("/intern/application");
  revalidatePath("/intern/profile");
  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${currentUser.id}`);

  redirect("/intern/profile");
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

  if (!currentUser.acceptedTermsAt) {
    return {
      error: "กรุณายอมรับข้อตกลงการใช้งานก่อนจัดการไฟล์แนบ",
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
          status: true,
          approvedAt: true,
          finishedAt: true,
          editedAfterApprovalAt: true,
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

  await prisma.$transaction(async (transaction) => {
    await transaction.internshipApplicationAttachment.delete({
      where: { id: attachmentId },
    });

    await transaction.internshipApplication.update({
      where: { userId: currentUser.id },
      data: {
        status:
          attachment.application.status === INTERNSHIP_APPLICATION_STATUSES.Pending
            ? attachment.application.status
            : INTERNSHIP_APPLICATION_STATUSES.Pending,
        approvedAt: attachment.application.status === INTERNSHIP_APPLICATION_STATUSES.Pending ? undefined : null,
        finishedAt: null,
        editedAfterApprovalAt:
          attachment.application.status === INTERNSHIP_APPLICATION_STATUSES.Pending
            ? attachment.application.editedAfterApprovalAt ?? null
            : isApprovedInternshipStatus(attachment.application.status)
              ? new Date()
              : null,
      },
    });
  });

  await deleteStoredFiles([attachment.filePath]);

  if (attachment.application.status !== INTERNSHIP_APPLICATION_STATUSES.Pending) {
    const studentName = getDisplayName(currentUser);
    const notificationTitle = isApprovedInternshipStatus(attachment.application.status)
      ? "นักศึกษาแก้ไขข้อมูลฝึกงานหลังการอนุมัติ"
      : "นักศึกษาแก้ไขแบบฟอร์มที่ถูกปฏิเสธและส่งกลับใหม่";
    const notificationMessage = isApprovedInternshipStatus(attachment.application.status)
      ? `${studentName} ได้ลบไฟล์แนบในแบบฟอร์มฝึกงานหลังการอนุมัติ ระบบได้ส่งคำขอกลับเข้าสู่สถานะรอตรวจสอบแล้ว`
      : `${studentName} ได้ลบไฟล์แนบในแบบฟอร์มฝึกงานที่ถูกปฏิเสธ และส่งกลับเข้าสู่สถานะรอตรวจสอบแล้ว`;

    await notifyAdmins(
      notificationTitle,
      notificationMessage,
      {
        email: {
          subject: notificationTitle,
          actionPath: `/intern/manage-users/${currentUser.id}`,
          actionLabel: "เปิดหน้ารายละเอียดนักศึกษา",
        },
      },
    );
  }

  revalidatePath("/intern/application");
  revalidatePath("/intern/profile");
  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${currentUser.id}`);

  return {
    error: "",
  };
}