"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { deleteStoredFiles, saveUploadedFile } from "@/lib/file-storage";
import {
  isFutureDate,
  isValidPhoneNumber,
  isValidStudentId,
  isValidYearLevel,
} from "@/lib/form-validation";
import {
  INTERNSHIP_APPLICATION_STATUSES,
  getLifecycleStatusLabel,
  parseDateInput,
  type InternshipApplicationStatus,
} from "@/lib/internship-application";
import {
  getNextInternshipApplicationWizardStep,
  internshipApplicationFormTextFieldNames,
  mergeInternshipApplicationFormValues,
  normalizeInternshipApplicationWizardStep,
  type InternshipApplicationFormValues,
} from "@/lib/internship-application-form";
import { clearManagedStudentEditDraft, getManagedStudentEditDraft, saveManagedStudentEditDraft } from "@/lib/managed-student-edit-draft";
import { appendReturnTo, getValidatedManageUsersReturnTo } from "@/lib/manage-users-routing";
import { createOAuthOnlyPasswordHash, normalizeEmail } from "@/lib/password";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  USER_ROLES,
  canAccessUserManagement,
  canManagerDeleteManagedAccount,
  canManagerEditManagedAccount,
  canManagerEditUser,
  canManagerViewUser,
  getAccountPagePath,
  getAssignableRoles,
  requiresManagerProfileCompletion,
  roleLabels,
} from "@/lib/user-management";

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

export type ManageUsersState = {
  error: string;
  success: string;
};

function getDefaultFirstname(email: string) {
  const localPart = email.split("@")[0]?.trim();

  return localPart || "user";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createErrorState(error: string): ManageUsersState {
  return {
    error,
    success: "",
  };
}

function formatDateForAction(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildManagedStudentCurrentFormValues(user: {
  title: string;
  firstname: string;
  lastname: string;
  sex?: string | null;
  birthDate?: Date | null;
  address?: string | null;
  institution?: string | null;
}) {
  return {
    title: user.title,
    firstname: user.firstname,
    lastname: user.lastname,
    sex: user.sex ?? "",
    birthDate: user.birthDate ? formatDateForAction(user.birthDate) : "",
    address: user.address ?? "",
    institution: user.institution ?? "",
  } satisfies Partial<InternshipApplicationFormValues>;
}

function buildManagedExistingApplicationFormValues(existingApplication: {
  studentId: string;
  phoneNumber: string;
  faculty: string;
  program: string;
  yearLevel: string;
  internshipPosition: string;
  companyName: string;
  companyAddress: string;
  guidingProfessorFirstname: string | null;
  guidingProfessorLastname: string | null;
  guidingProfessorPhoneNumber: string | null;
  companySupervisorName: string;
  companySupervisorRole: string;
  companySupervisorEmail: string;
  companySupervisorPhoneNumber: string | null;
  internshipStartDate: Date;
  internshipEndDate: Date;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhoneNumber: string;
  notes: string | null;
}) {
  return {
    studentId: existingApplication.studentId,
    phoneNumber: existingApplication.phoneNumber,
    faculty: existingApplication.faculty,
    program: existingApplication.program,
    yearLevel: existingApplication.yearLevel,
    internshipPosition: existingApplication.internshipPosition,
    companyName: existingApplication.companyName,
    companyAddress: existingApplication.companyAddress,
    guidingProfessorFirstname: existingApplication.guidingProfessorFirstname ?? "",
    guidingProfessorLastname: existingApplication.guidingProfessorLastname ?? "",
    guidingProfessorPhoneNumber: existingApplication.guidingProfessorPhoneNumber ?? "",
    companySupervisorName: existingApplication.companySupervisorName,
    companySupervisorRole: existingApplication.companySupervisorRole,
    companySupervisorEmail: existingApplication.companySupervisorEmail,
    companySupervisorPhoneNumber: existingApplication.companySupervisorPhoneNumber ?? "",
    internshipStartDate: formatDateForAction(existingApplication.internshipStartDate),
    internshipEndDate: formatDateForAction(existingApplication.internshipEndDate),
    emergencyContactName: existingApplication.emergencyContactName,
    emergencyContactRelationship: existingApplication.emergencyContactRelationship,
    emergencyContactPhoneNumber: existingApplication.emergencyContactPhoneNumber,
    notes: existingApplication.notes ?? "",
  } satisfies Partial<InternshipApplicationFormValues>;
}

function getSubmittedInternshipFormValues(formData: FormData) {
  const values: Partial<InternshipApplicationFormValues> = {};

  for (const fieldName of internshipApplicationFormTextFieldNames) {
    if (formData.has(fieldName)) {
      values[fieldName] = String(formData.get(fieldName) ?? "").trim();
    }
  }

  return values;
}

function getManageUserEditHref(userId: string, step: number, returnTo: string | null) {
  return appendReturnTo(`/intern/manage-users/${userId}/edit?step=${String(step)}`, returnTo);
}

export async function createManagedUser(
  _: ManageUsersState,
  formData: FormData,
): Promise<ManageUsersState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUserManagement(currentUser.role)) {
    return {
      error: "คุณไม่มีสิทธิ์จัดการบัญชีผู้ใช้",
      success: "",
    };
  }

  if (requiresManagerProfileCompletion(currentUser)) {
    return {
      error: "กรุณากรอกข้อมูลโปรไฟล์ผู้ดูแลให้ครบก่อน จึงจะจัดการบัญชีผู้ใช้ได้",
      success: "",
    };
  }

  const assignableRoles = getAssignableRoles(currentUser.role);
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const requestedRole = String(formData.get("role") ?? "");
  const requestedReturnTo = getValidatedManageUsersReturnTo(String(formData.get("returnTo") ?? "") || null);
  const title = String(formData.get("title") ?? "").trim();
  const firstname = String(formData.get("firstname") ?? "").trim();
  const lastname = String(formData.get("lastname") ?? "").trim();

  if (!email || !requestedRole) {
    return {
      error: "กรุณากรอกอีเมลและสิทธิ์การใช้งานให้ครบถ้วน",
      success: "",
    };
  }

  if (!isValidEmail(email)) {
    return {
      error: "รูปแบบอีเมลไม่ถูกต้อง",
      success: "",
    };
  }

  const role = assignableRoles.find((value) => value === requestedRole);

  if (!role) {
    return {
      error: "คุณไม่มีสิทธิ์กำหนดสิทธิ์การใช้งานนี้",
      success: "",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      error: "อีเมลนี้ถูกใช้งานแล้ว",
      success: "",
    };
  }

  const createdUser = await prisma.user.create({
    data: {
      title: title || "คุณ",
      firstname: firstname || getDefaultFirstname(email),
      lastname,
      email,
      password: createOAuthOnlyPasswordHash(),
      role,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/intern/manage-users");

  const destination = new URL(`/intern/manage-users/${createdUser.id}`, "https://manage-users.local");
  destination.searchParams.set("created", "1");

  if (requestedReturnTo) {
    destination.searchParams.set("returnTo", requestedReturnTo);
  }

  redirect(`${destination.pathname}${destination.search}`);
}

export async function updateManagedStudentDetails(
  _: ManageUsersState,
  formData: FormData,
): Promise<ManageUsersState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUserManagement(currentUser.role)) {
    return {
      error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้",
      success: "",
    };
  }

  if (requiresManagerProfileCompletion(currentUser)) {
    return createErrorState("กรุณากรอกข้อมูลโปรไฟล์ผู้ดูแลให้ครบก่อน จึงจะจัดการบัญชีผู้ใช้ได้");
  }

  const userId = String(formData.get("userId") ?? "");
  const currentStep = normalizeInternshipApplicationWizardStep(String(formData.get("editStep") ?? ""));
  const requestedReturnTo = getValidatedManageUsersReturnTo(String(formData.get("returnTo") ?? "") || null);
  const title = String(formData.get("title") ?? "").trim();
  const firstname = String(formData.get("firstname") ?? "").trim();
  const lastname = String(formData.get("lastname") ?? "").trim();
  const sex = String(formData.get("sex") ?? "").trim();
  const birthDateValue = String(formData.get("birthDate") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!userId) {
    return createErrorState("ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      title: true,
      firstname: true,
      lastname: true,
      sex: true,
      birthDate: true,
      address: true,
      institution: true,
      email: true,
      role: true,
      application: {
        select: {
          id: true,
          studentId: true,
          phoneNumber: true,
          faculty: true,
          program: true,
          yearLevel: true,
          internshipPosition: true,
          companyName: true,
          companyAddress: true,
          guidingProfessorFirstname: true,
          guidingProfessorLastname: true,
          guidingProfessorPhoneNumber: true,
          companySupervisorName: true,
          companySupervisorRole: true,
          companySupervisorEmail: true,
          companySupervisorPhoneNumber: true,
          internshipStartDate: true,
          internshipEndDate: true,
          emergencyContactName: true,
          emergencyContactRelationship: true,
          emergencyContactPhoneNumber: true,
          notes: true,
        },
      },
    },
  });
  const isSelf = targetUser?.id === currentUser.id;

  if (!targetUser || !canManagerViewUser(currentUser.role, targetUser.role, { isSelf })) {
    return createErrorState("ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข");
  }

  if (!canManagerEditUser(currentUser.role, targetUser.role)) {
    return createErrorState("แก้ไขข้อมูลได้เฉพาะบัญชีนักศึกษา");
  }

  const canEditEmail = currentUser.role === USER_ROLES.Superadmin;
  const nextEmail = currentStep === 1 && canEditEmail ? email : targetUser.email;
  const draft = targetUser.application
    ? null
    : await getManagedStudentEditDraft(currentUser.id, targetUser.id);
  const baseValues = mergeInternshipApplicationFormValues(
    targetUser.application ? buildManagedExistingApplicationFormValues(targetUser.application) : undefined,
    draft?.values,
    buildManagedStudentCurrentFormValues(targetUser),
  );
  const submittedValues = getSubmittedInternshipFormValues(formData);
  const mergedValues = mergeInternshipApplicationFormValues(baseValues, submittedValues);

  if (!nextEmail) {
    return createErrorState("กรุณาระบุอีเมลของผู้ใช้");
  }

  if (!isValidEmail(nextEmail)) {
    return createErrorState("รูปแบบอีเมลไม่ถูกต้อง");
  }

  if (nextEmail !== targetUser.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      return createErrorState("อีเมลนี้ถูกใช้งานแล้ว");
    }
  }

  if (currentStep === 1 && !firstname) {
    return createErrorState("กรุณาระบุชื่อของนักศึกษา");
  }

  const birthDate = birthDateValue ? parseDateInput(birthDateValue) : null;

  if (currentStep === 1 && birthDateValue && !birthDate) {
    return createErrorState("วันเกิดไม่ถูกต้อง");
  }

  if (currentStep === 1 && birthDate && isFutureDate(birthDate)) {
    return createErrorState("วันเกิดต้องไม่เป็นวันที่ในอนาคต");
  }

  if (currentStep >= 2 && !mergedValues.studentId) {
    return createErrorState("กรุณาระบุรหัสนักศึกษา");
  }

  if (currentStep >= 2 && !mergedValues.phoneNumber) {
    return createErrorState("กรุณาระบุเบอร์โทรศัพท์");
  }

  if (currentStep >= 2 && !mergedValues.faculty) {
    return createErrorState("กรุณาระบุคณะ");
  }

  if (currentStep >= 2 && !mergedValues.program) {
    return createErrorState("กรุณาระบุสาขา / หลักสูตร");
  }

  if (currentStep >= 2 && !mergedValues.yearLevel) {
    return createErrorState("กรุณาระบุชั้นปี");
  }

  if (currentStep >= 2 && !mergedValues.guidingProfessorFirstname) {
    return createErrorState("กรุณาระบุชื่ออาจารย์นิเทศ");
  }

  if (currentStep >= 2 && !mergedValues.guidingProfessorLastname) {
    return createErrorState("กรุณาระบุนามสกุลอาจารย์นิเทศ");
  }

  if (currentStep >= 2 && !mergedValues.guidingProfessorPhoneNumber) {
    return createErrorState("กรุณาระบุเบอร์โทรอาจารย์นิเทศ");
  }

  if (mergedValues.studentId && !isValidStudentId(mergedValues.studentId)) {
    return createErrorState("รหัสนักศึกษาต้องเป็นตัวเลขเท่านั้น");
  }

  if (mergedValues.phoneNumber && !isValidPhoneNumber(mergedValues.phoneNumber)) {
    return createErrorState("เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก");
  }

  if (mergedValues.guidingProfessorPhoneNumber && !isValidPhoneNumber(mergedValues.guidingProfessorPhoneNumber)) {
    return createErrorState("เบอร์โทรอาจารย์นิเทศต้องเป็นตัวเลข 9-10 หลัก");
  }

  if (mergedValues.yearLevel && !isValidYearLevel(mergedValues.yearLevel)) {
    return createErrorState("ชั้นปีต้องอยู่ระหว่าง 1 ถึง 4");
  }

  if (currentStep === 1) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        title: title || "คุณ",
        firstname,
        lastname,
        sex: sex || null,
        birthDate,
        address: address || null,
        institution: institution || null,
        email: nextEmail,
      },
    });

    await notifyUser(
      userId,
      "ข้อมูลบัญชีของคุณถูกอัปเดตโดยผู้ดูแลระบบ",
      `${roleLabels[currentUser.role]}ได้อัปเดตข้อมูลบัญชีของคุณแล้ว กรุณาตรวจสอบข้อมูลล่าสุดในระบบ`,
      {
        email: {
          recipientEmail: nextEmail,
          subject: "ข้อมูลบัญชีของคุณถูกอัปเดตโดยผู้ดูแลระบบ",
          actionPath: "/intern/profile",
          actionLabel: "เปิดดูข้อมูลของฉัน",
        },
      },
    );

    revalidatePath("/intern/manage-users");
    revalidatePath(`/intern/manage-users/${userId}`);
    revalidatePath(`/intern/manage-users/${userId}/edit`);
    revalidatePath("/intern/profile");

    redirect(getManageUserEditHref(userId, getNextInternshipApplicationWizardStep(currentStep), requestedReturnTo));
  }

  if (currentStep === 2) {
    if (targetUser.application) {
      await prisma.internshipApplication.update({
        where: { userId },
        data: {
          studentId: mergedValues.studentId,
          phoneNumber: mergedValues.phoneNumber,
          faculty: mergedValues.faculty,
          program: mergedValues.program,
          yearLevel: mergedValues.yearLevel,
          guidingProfessorFirstname: mergedValues.guidingProfessorFirstname,
          guidingProfessorLastname: mergedValues.guidingProfessorLastname,
          guidingProfessorPhoneNumber: mergedValues.guidingProfessorPhoneNumber,
        },
      });

      await clearManagedStudentEditDraft();
      revalidatePath("/intern/manage-users");
      revalidatePath(`/intern/manage-users/${userId}`);
      revalidatePath(`/intern/manage-users/${userId}/edit`);
      revalidatePath("/intern/profile");
      revalidatePath("/intern/application");

      redirect(getManageUserEditHref(userId, getNextInternshipApplicationWizardStep(currentStep), requestedReturnTo));
    }

    await saveManagedStudentEditDraft({
      managerUserId: currentUser.id,
      targetUserId: userId,
      completedStep: currentStep,
      values: {
        studentId: mergedValues.studentId,
        phoneNumber: mergedValues.phoneNumber,
        faculty: mergedValues.faculty,
        program: mergedValues.program,
        yearLevel: mergedValues.yearLevel,
        guidingProfessorFirstname: mergedValues.guidingProfessorFirstname,
        guidingProfessorLastname: mergedValues.guidingProfessorLastname,
        guidingProfessorPhoneNumber: mergedValues.guidingProfessorPhoneNumber,
      },
    });

    redirect(getManageUserEditHref(userId, getNextInternshipApplicationWizardStep(currentStep), requestedReturnTo));
  }

  if (!mergedValues.internshipPosition) {
    return createErrorState("กรุณาระบุตำแหน่งฝึกงาน");
  }

  if (!mergedValues.companyName) {
    return createErrorState("กรุณาระบุชื่อบริษัท / หน่วยงาน");
  }

  if (!mergedValues.companyAddress) {
    return createErrorState("กรุณาระบุที่อยู่บริษัท");
  }

  if (!mergedValues.companySupervisorName) {
    return createErrorState("กรุณาระบุชื่อผู้ดูแลสถานประกอบการ");
  }

  if (!mergedValues.companySupervisorRole) {
    return createErrorState("กรุณาระบุตำแหน่งผู้ดูแล");
  }

  if (!mergedValues.companySupervisorEmail) {
    return createErrorState("กรุณาระบุอีเมลผู้ดูแลในสถานประกอบการ");
  }

  if (!isValidEmail(mergedValues.companySupervisorEmail)) {
    return createErrorState("อีเมลผู้ดูแลในสถานประกอบการไม่ถูกต้อง");
  }

  if (mergedValues.companySupervisorPhoneNumber && !isValidPhoneNumber(mergedValues.companySupervisorPhoneNumber)) {
    return createErrorState("เบอร์โทรผู้ดูแลต้องเป็นตัวเลข 9-10 หลัก");
  }

  if (!mergedValues.internshipStartDate || !mergedValues.internshipEndDate) {
    return createErrorState("กรุณาระบุวันที่เริ่มและสิ้นสุดฝึกงานให้ครบถ้วน");
  }

  const internshipStartDate = parseDateInput(mergedValues.internshipStartDate);
  const internshipEndDate = parseDateInput(mergedValues.internshipEndDate);

  if (!internshipStartDate || !internshipEndDate) {
    return createErrorState("กรุณาระบุวันที่เริ่มและสิ้นสุดฝึกงานให้ถูกต้อง");
  }

  if (internshipEndDate < internshipStartDate) {
    return createErrorState("วันที่สิ้นสุดฝึกงานต้องไม่ก่อนวันที่เริ่มต้น");
  }

  if (!mergedValues.emergencyContactName) {
    return createErrorState("กรุณาระบุชื่อผู้ติดต่อฉุกเฉิน");
  }

  if (!mergedValues.emergencyContactRelationship) {
    return createErrorState("กรุณาระบุความสัมพันธ์ของผู้ติดต่อฉุกเฉิน");
  }

  if (!mergedValues.emergencyContactPhoneNumber) {
    return createErrorState("กรุณาระบุเบอร์โทรผู้ติดต่อฉุกเฉิน");
  }

  if (!isValidPhoneNumber(mergedValues.emergencyContactPhoneNumber)) {
    return createErrorState("เบอร์โทรผู้ติดต่อฉุกเฉินต้องเป็นตัวเลข 9-10 หลัก");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: userId },
      data: {
        title: targetUser.title || "คุณ",
        firstname: targetUser.firstname,
        lastname: targetUser.lastname,
        sex: targetUser.sex || null,
        birthDate: targetUser.birthDate,
        address: targetUser.address || null,
        institution: targetUser.institution || null,
        email: nextEmail,
      },
    });

    await transaction.internshipApplication.upsert({
      where: { userId },
      update: {
        studentId: mergedValues.studentId,
        phoneNumber: mergedValues.phoneNumber,
        faculty: mergedValues.faculty,
        program: mergedValues.program,
        yearLevel: mergedValues.yearLevel,
        internshipPosition: mergedValues.internshipPosition,
        companyName: mergedValues.companyName,
        companyAddress: mergedValues.companyAddress,
        guidingProfessorFirstname: mergedValues.guidingProfessorFirstname,
        guidingProfessorLastname: mergedValues.guidingProfessorLastname,
        guidingProfessorPhoneNumber: mergedValues.guidingProfessorPhoneNumber,
        companySupervisorName: mergedValues.companySupervisorName,
        companySupervisorRole: mergedValues.companySupervisorRole,
        companySupervisorEmail: mergedValues.companySupervisorEmail,
        companySupervisorPhoneNumber: mergedValues.companySupervisorPhoneNumber || null,
        internshipStartDate,
        internshipEndDate,
        emergencyContactName: mergedValues.emergencyContactName,
        emergencyContactRelationship: mergedValues.emergencyContactRelationship,
        emergencyContactPhoneNumber: mergedValues.emergencyContactPhoneNumber,
        notes: mergedValues.notes || null,
      },
      create: {
        userId,
        studentId: mergedValues.studentId,
        phoneNumber: mergedValues.phoneNumber,
        faculty: mergedValues.faculty,
        program: mergedValues.program,
        yearLevel: mergedValues.yearLevel,
        internshipPosition: mergedValues.internshipPosition,
        companyName: mergedValues.companyName,
        companyAddress: mergedValues.companyAddress,
        guidingProfessorFirstname: mergedValues.guidingProfessorFirstname,
        guidingProfessorLastname: mergedValues.guidingProfessorLastname,
        guidingProfessorPhoneNumber: mergedValues.guidingProfessorPhoneNumber,
        companySupervisorName: mergedValues.companySupervisorName,
        companySupervisorRole: mergedValues.companySupervisorRole,
        companySupervisorEmail: mergedValues.companySupervisorEmail,
        companySupervisorPhoneNumber: mergedValues.companySupervisorPhoneNumber || null,
        internshipStartDate,
        internshipEndDate,
        emergencyContactName: mergedValues.emergencyContactName,
        emergencyContactRelationship: mergedValues.emergencyContactRelationship,
        emergencyContactPhoneNumber: mergedValues.emergencyContactPhoneNumber,
        notes: mergedValues.notes || null,
      },
    });
  });

  await clearManagedStudentEditDraft();

  await notifyUser(
    userId,
    "ข้อมูลฝึกงานของคุณถูกอัปเดตโดยผู้ดูแลระบบ",
    `${roleLabels[currentUser.role]}ได้อัปเดตข้อมูลนักศึกษาและข้อมูลฝึกงานของคุณแล้ว กรุณาตรวจสอบข้อมูลล่าสุดในระบบ`,
    {
      email: {
        recipientEmail: nextEmail,
        subject: "ข้อมูลฝึกงานของคุณถูกอัปเดตโดยผู้ดูแลระบบ",
        actionPath: "/intern/profile",
        actionLabel: "เปิดดูข้อมูลของฉัน",
      },
    },
  );

  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${userId}`);
  revalidatePath(`/intern/manage-users/${userId}/edit`);
  revalidatePath("/intern/profile");
  revalidatePath("/intern/application");

  redirect(appendReturnTo(`/intern/manage-users/${userId}`, requestedReturnTo));
}

export async function updateManagedAccountDetails(
  _: ManageUsersState,
  formData: FormData,
): Promise<ManageUsersState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUserManagement(currentUser.role)) {
    return {
      error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้",
      success: "",
    };
  }

  if (requiresManagerProfileCompletion(currentUser)) {
    return {
      error: "กรุณากรอกข้อมูลโปรไฟล์ผู้ดูแลให้ครบก่อน จึงจะจัดการบัญชีผู้ใช้ได้",
      success: "",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const firstname = String(formData.get("firstname") ?? "").trim();
  const lastname = String(formData.get("lastname") ?? "").trim();
  const sex = String(formData.get("sex") ?? "").trim();
  const birthDateValue = String(formData.get("birthDate") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const profilePhotoEntry = formData.get("profilePhoto");
  const profilePhoto = profilePhotoEntry instanceof File && profilePhotoEntry.size > 0 ? profilePhotoEntry : null;

  if (!userId) {
    return {
      error: "ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข",
      success: "",
    };
  }

  if (!firstname) {
    return {
      error: "กรุณาระบุชื่อของผู้ใช้",
      success: "",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      title: true,
      firstname: true,
      lastname: true,
      email: true,
      profileImagePath: true,
      role: true,
    },
  });
  const isSelf = targetUser?.id === currentUser.id;

  if (!targetUser || !canManagerViewUser(currentUser.role, targetUser.role, { isSelf })) {
    return {
      error: "ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข",
      success: "",
    };
  }

  if (!canManagerEditManagedAccount(currentUser.role, targetUser.role, { isSelf })) {
    return {
      error: "บัญชีนี้ยังไม่เปิดให้แก้ไขจากแดชบอร์ด",
      success: "",
    };
  }

  const canEditEmail = currentUser.role === USER_ROLES.Superadmin;
  const nextEmail = canEditEmail ? email : targetUser.email;

  if (!nextEmail) {
    return {
      error: "กรุณาระบุอีเมลของผู้ใช้",
      success: "",
    };
  }

  if (!isValidEmail(nextEmail)) {
    return {
      error: "รูปแบบอีเมลไม่ถูกต้อง",
      success: "",
    };
  }

  if (profilePhoto && !isSelf) {
    return {
      error: "อัปเดตรูปโปรไฟล์ได้เฉพาะบัญชีของคุณเอง",
      success: "",
    };
  }

  if (profilePhoto && !ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(profilePhoto.type)) {
    return {
      error: "รูปโปรไฟล์ต้องเป็นไฟล์ PNG หรือ JPG เท่านั้น",
      success: "",
    };
  }

  if (profilePhoto && profilePhoto.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return {
      error: "รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB",
      success: "",
    };
  }

  if (nextEmail !== targetUser.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      return {
        error: "อีเมลนี้ถูกใช้งานแล้ว",
        success: "",
      };
    }
  }

  const birthDate = birthDateValue ? parseDateInput(birthDateValue) : null;

  if (birthDateValue && !birthDate) {
    return {
      error: "วันเกิดไม่ถูกต้อง",
      success: "",
    };
  }

  if (birthDate && isFutureDate(birthDate)) {
    return {
      error: "วันเกิดต้องไม่เป็นวันที่ในอนาคต",
      success: "",
    };
  }

  const newFilePaths: string[] = [];

  try {
    const savedProfilePhoto = profilePhoto
      ? await saveUploadedFile(profilePhoto, `profile-photos/${currentUser.id}`)
      : null;

    if (savedProfilePhoto) {
      newFilePaths.push(savedProfilePhoto.filePath);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        title: title || "คุณ",
        firstname,
        lastname,
        sex: sex || null,
        birthDate,
        address: address || null,
        institution: institution || null,
        email: nextEmail,
        ...(savedProfilePhoto ? { profileImagePath: savedProfilePhoto.filePath } : {}),
      },
    });

    if (savedProfilePhoto && targetUser.profileImagePath) {
      await deleteStoredFiles([targetUser.profileImagePath]);
    }
  } catch {
    await deleteStoredFiles(newFilePaths);

    return {
      error: "ไม่สามารถบันทึกรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
      success: "",
    };
  }

  if (targetUser.role === USER_ROLES.Student) {
    await notifyUser(
      userId,
      "ข้อมูลบัญชีของคุณถูกอัปเดตโดยผู้ดูแลระบบ",
      `${roleLabels[currentUser.role]}ได้อัปเดตข้อมูลบัญชีของคุณแล้ว กรุณาตรวจสอบข้อมูลล่าสุดในระบบ`,
      {
        email: {
          recipientEmail: nextEmail,
          subject: "ข้อมูลบัญชีของคุณถูกอัปเดตโดยผู้ดูแลระบบ",
          actionPath: "/intern/profile",
          actionLabel: "เปิดดูข้อมูลของฉัน",
        },
      },
    );
  }

  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${userId}`);
  revalidatePath(`/intern/manage-users/${userId}/edit`);
  revalidatePath("/intern/profile");

  redirect(isSelf ? getAccountPagePath(currentUser.role, currentUser.id) : `/intern/manage-users/${userId}`);
}

export async function deleteManagedAccount(
  _: ManageUsersState,
  formData: FormData,
): Promise<ManageUsersState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUserManagement(currentUser.role)) {
    return {
      error: "คุณไม่มีสิทธิ์ลบบัญชีผู้ใช้",
      success: "",
    };
  }

  if (requiresManagerProfileCompletion(currentUser)) {
    return {
      error: "กรุณากรอกข้อมูลโปรไฟล์ผู้ดูแลให้ครบก่อน จึงจะจัดการบัญชีผู้ใช้ได้",
      success: "",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const requestedReturnTo = getValidatedManageUsersReturnTo(String(formData.get("returnTo") ?? "") || null);

  if (!userId) {
    return {
      error: "ไม่พบบัญชีผู้ใช้ที่ต้องการลบ",
      success: "",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      profileImagePath: true,
      application: {
        select: {
          attachments: {
            select: {
              filePath: true,
            },
          },
        },
      },
    },
  });
  const isSelf = targetUser?.id === currentUser.id;

  if (!targetUser || !canManagerViewUser(currentUser.role, targetUser.role, { isSelf })) {
    return {
      error: "ไม่พบบัญชีผู้ใช้ที่ต้องการลบ",
      success: "",
    };
  }

  if (!canManagerDeleteManagedAccount(currentUser.role, targetUser.role, { isSelf })) {
    return {
      error: "บัญชีนี้ยังไม่เปิดให้ลบจากแดชบอร์ด",
      success: "",
    };
  }

  const filePaths = [
    targetUser.profileImagePath,
    ...(targetUser.application?.attachments.map((attachment) => attachment.filePath) ?? []),
  ].filter((value): value is string => Boolean(value));

  await prisma.user.delete({
    where: { id: userId },
  });

  await deleteStoredFiles(filePaths);

  revalidatePath("/intern/manage-users");
  redirect(requestedReturnTo ?? "/intern/manage-users");
}

export async function deleteManagedAccountFromForm(formData: FormData): Promise<void> {
  await deleteManagedAccount(
    {
      error: "",
      success: "",
    },
    formData,
  );
}

export async function updateManagedApplicationApproval(
  _: ManageUsersState,
  formData: FormData,
): Promise<ManageUsersState> {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUserManagement(currentUser.role)) {
    return {
      error: "คุณไม่มีสิทธิ์อัปเดตสถานะฝึกงาน",
      success: "",
    };
  }

  if (requiresManagerProfileCompletion(currentUser)) {
    return {
      error: "กรุณากรอกข้อมูลโปรไฟล์ผู้ดูแลให้ครบก่อน จึงจะจัดการบัญชีผู้ใช้ได้",
      success: "",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const requestedStatus = String(formData.get("status") ?? "") as InternshipApplicationStatus;
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!userId) {
    return {
      error: "ไม่พบผู้ใช้ที่ต้องการอัปเดต",
      success: "",
    };
  }

  if (
    requestedStatus !== INTERNSHIP_APPLICATION_STATUSES.Pending &&
    requestedStatus !== INTERNSHIP_APPLICATION_STATUSES.Rejected &&
    requestedStatus !== INTERNSHIP_APPLICATION_STATUSES.Ongoing &&
    requestedStatus !== INTERNSHIP_APPLICATION_STATUSES.Finished
  ) {
    return {
      error: "สถานะที่เลือกไม่ถูกต้อง",
      success: "",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      title: true,
      firstname: true,
      lastname: true,
      email: true,
      role: true,
      application: {
        select: {
          id: true,
          status: true,
          approvedAt: true,
          finishedAt: true,
        },
      },
    },
  });

  if (!targetUser || !canManagerViewUser(currentUser.role, targetUser.role, { isSelf: targetUser?.id === currentUser.id })) {
    return {
      error: "ไม่พบข้อมูลผู้ใช้ที่ต้องการอัปเดต",
      success: "",
    };
  }

  if (!canManagerEditUser(currentUser.role, targetUser.role)) {
    return {
      error: "อัปเดตสถานะได้เฉพาะบัญชีนักศึกษา",
      success: "",
    };
  }

  if (!targetUser.application) {
    return {
      error: "นักศึกษายังไม่มีแบบฟอร์มฝึกงานให้ตรวจสอบ",
      success: "",
    };
  }

  if (targetUser.application.status === requestedStatus) {
    return {
      error: "สถานะที่เลือกตรงกับสถานะปัจจุบันอยู่แล้ว",
      success: "",
    };
  }

  if (requestedStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected && !rejectionReason) {
    return {
      error: "กรุณาระบุเหตุผลในการปฏิเสธแบบฟอร์มฝึกงาน",
      success: "",
    };
  }

  const now = new Date();
  const nextApprovedAt =
    requestedStatus === INTERNSHIP_APPLICATION_STATUSES.Pending ||
    requestedStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected
      ? null
      : targetUser.application.approvedAt ?? now;
  const nextFinishedAt =
    requestedStatus === INTERNSHIP_APPLICATION_STATUSES.Finished ? now : null;

  await prisma.internshipApplication.update({
    where: { userId },
    data: {
      status: requestedStatus,
      rejectionReason:
        requestedStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected ? rejectionReason : null,
      approvedAt: nextApprovedAt,
      finishedAt: nextFinishedAt,
      editedAfterApprovalAt: null,
    },
  });

  const statusLabel = getLifecycleStatusLabel(requestedStatus);
  await notifyUser(
    userId,
    "สถานะการฝึกงานของคุณเปลี่ยนแปลง",
    requestedStatus === INTERNSHIP_APPLICATION_STATUSES.Rejected && rejectionReason
      ? `ผู้ดูแลระบบได้อัปเดตสถานะการฝึกงานของคุณเป็น "${statusLabel}" พร้อมระบุเหตุผลว่า "${rejectionReason}"`
      : `ผู้ดูแลระบบได้อัปเดตสถานะการฝึกงานของคุณเป็น "${statusLabel}"`,
    {
      email: {
        recipientEmail: targetUser.email,
        subject: "สถานะการฝึกงานของคุณเปลี่ยนแปลง",
        actionPath: "/intern/profile",
        actionLabel: "ดูสถานะฝึกงานล่าสุด",
      },
    },
  );

  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${userId}`);
  revalidatePath(`/intern/manage-users/${userId}/edit`);
  revalidatePath("/intern/profile");
  revalidatePath("/intern/application");

  return {
    error: "",
    success: `อัปเดตสถานะฝึกงานเป็น ${statusLabel} เรียบร้อยแล้ว`,
  };
}