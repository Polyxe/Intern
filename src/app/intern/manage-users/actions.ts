"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { INTERNSHIP_APPLICATION_APPROVAL_STATUSES, parseDateInput } from "@/lib/internship-application";
import { hashPassword, normalizeEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  canAccessUserManagement,
  canManagerEditManagedAccount,
  canManagerEditUser,
  canManagerViewUser,
  getAssignableRoles,
} from "@/lib/user-management";

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

  const assignableRoles = getAssignableRoles(currentUser.role);
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const requestedRole = String(formData.get("role") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const firstname = String(formData.get("firstname") ?? "").trim();
  const lastname = String(formData.get("lastname") ?? "").trim();

  if (!email || !password || !requestedRole) {
    return {
      error: "กรุณากรอกอีเมล รหัสผ่าน และสิทธิ์การใช้งานให้ครบถ้วน",
      success: "",
    };
  }

  if (!isValidEmail(email)) {
    return {
      error: "รูปแบบอีเมลไม่ถูกต้อง",
      success: "",
    };
  }

  if (password.length < 8) {
    return {
      error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
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

  await prisma.user.create({
    data: {
      title: title || "คุณ",
      firstname: firstname || getDefaultFirstname(email),
      lastname,
      email,
      password: hashPassword(password),
      role,
    },
  });

  revalidatePath("/intern/manage-users");

  return {
    error: "",
    success: "สร้างบัญชีผู้ใช้เรียบร้อยแล้ว",
  };
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

  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const firstname = String(formData.get("firstname") ?? "").trim();
  const lastname = String(formData.get("lastname") ?? "").trim();
  const sex = String(formData.get("sex") ?? "").trim();
  const birthDateValue = String(formData.get("birthDate") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const faculty = String(formData.get("faculty") ?? "").trim();
  const program = String(formData.get("program") ?? "").trim();
  const yearLevel = String(formData.get("yearLevel") ?? "").trim();
  const internshipPosition = String(formData.get("internshipPosition") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyAddress = String(formData.get("companyAddress") ?? "").trim();
  const guidingProfessorFirstname = String(formData.get("guidingProfessorFirstname") ?? "").trim();
  const guidingProfessorLastname = String(formData.get("guidingProfessorLastname") ?? "").trim();
  const guidingProfessorPhoneNumber = String(formData.get("guidingProfessorPhoneNumber") ?? "").trim();
  const companySupervisorName = String(formData.get("companySupervisorName") ?? "").trim();
  const companySupervisorRole = String(formData.get("companySupervisorRole") ?? "").trim();
  const companySupervisorEmail = String(formData.get("companySupervisorEmail") ?? "").trim();
  const companySupervisorPhoneNumber = String(formData.get("companySupervisorPhoneNumber") ?? "").trim();
  const internshipStartDateValue = String(formData.get("internshipStartDate") ?? "").trim();
  const internshipEndDateValue = String(formData.get("internshipEndDate") ?? "").trim();
  const emergencyContactName = String(formData.get("emergencyContactName") ?? "").trim();
  const emergencyContactRelationship = String(formData.get("emergencyContactRelationship") ?? "").trim();
  const emergencyContactPhoneNumber = String(formData.get("emergencyContactPhoneNumber") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!userId) {
    return {
      error: "ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข",
      success: "",
    };
  }

  if (!firstname) {
    return {
      error: "กรุณาระบุชื่อของนักศึกษา",
      success: "",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      application: {
        select: {
          id: true,
        },
      },
    },
  });
  const isSelf = targetUser?.id === currentUser.id;

  if (!targetUser || !canManagerViewUser(currentUser.role, targetUser.role, { isSelf })) {
    return {
      error: "ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข",
      success: "",
    };
  }

  if (!canManagerEditUser(currentUser.role, targetUser.role)) {
    return {
      error: "แก้ไขข้อมูลได้เฉพาะบัญชีนักศึกษา",
      success: "",
    };
  }

  const birthDate = birthDateValue ? parseDateInput(birthDateValue) : null;

  if (birthDateValue && !birthDate) {
    return {
      error: "วันเกิดไม่ถูกต้อง",
      success: "",
    };
  }

  const internshipStartDate = internshipStartDateValue ? parseDateInput(internshipStartDateValue) : null;
  const internshipEndDate = internshipEndDateValue ? parseDateInput(internshipEndDateValue) : null;
  const hasInternshipValues = [
    studentId,
    phoneNumber,
    faculty,
    program,
    yearLevel,
    internshipPosition,
    companyName,
    companyAddress,
    guidingProfessorFirstname,
    guidingProfessorLastname,
    guidingProfessorPhoneNumber,
    companySupervisorName,
    companySupervisorRole,
    companySupervisorEmail,
    companySupervisorPhoneNumber,
    internshipStartDateValue,
    internshipEndDateValue,
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactPhoneNumber,
    notes,
  ].some(Boolean);

  if ((hasInternshipValues || targetUser.application) && (!internshipStartDate || !internshipEndDate)) {
    return {
      error: "กรุณาระบุวันที่เริ่มและสิ้นสุดฝึกงานให้ถูกต้อง",
      success: "",
    };
  }

  if (internshipStartDate && internshipEndDate && internshipEndDate < internshipStartDate) {
    return {
      error: "วันที่สิ้นสุดฝึกงานต้องไม่ก่อนวันที่เริ่มต้น",
      success: "",
    };
  }

  if (
    (hasInternshipValues || targetUser.application) &&
    (!studentId ||
      !phoneNumber ||
      !faculty ||
      !program ||
      !yearLevel ||
      !internshipPosition ||
      !companyName ||
      !companyAddress ||
      !guidingProfessorFirstname ||
      !guidingProfessorLastname ||
      !guidingProfessorPhoneNumber ||
      !companySupervisorName ||
      !companySupervisorRole ||
      !companySupervisorEmail ||
      !companySupervisorPhoneNumber ||
      !emergencyContactName ||
      !emergencyContactRelationship ||
      !emergencyContactPhoneNumber)
  ) {
    return {
      error: "หากต้องการบันทึกข้อมูลฝึกงาน กรุณากรอกข้อมูลส่วนนั้นให้ครบถ้วน",
      success: "",
    };
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: userId },
      data: {
        title: title || "คุณ",
        firstname,
        lastname,
        sex: sex || null,
        birthDate,
        address: address || null,
        institution: institution || null,
      },
    });

    if (hasInternshipValues || targetUser.application) {
      await transaction.internshipApplication.upsert({
        where: { userId },
        update: {
          studentId,
          phoneNumber,
          faculty,
          program,
          yearLevel,
          internshipPosition,
          companyName,
          companyAddress,
          guidingProfessorFirstname,
          guidingProfessorLastname,
          guidingProfessorPhoneNumber,
          companySupervisorName,
          companySupervisorRole,
          companySupervisorEmail,
          companySupervisorPhoneNumber,
          internshipStartDate: internshipStartDate!,
          internshipEndDate: internshipEndDate!,
          emergencyContactName,
          emergencyContactRelationship,
          emergencyContactPhoneNumber,
          notes: notes || null,
        },
        create: {
          userId,
          studentId,
          phoneNumber,
          faculty,
          program,
          yearLevel,
          internshipPosition,
          companyName,
          companyAddress,
          guidingProfessorFirstname,
          guidingProfessorLastname,
          guidingProfessorPhoneNumber,
          companySupervisorName,
          companySupervisorRole,
          companySupervisorEmail,
          companySupervisorPhoneNumber,
          internshipStartDate: internshipStartDate!,
          internshipEndDate: internshipEndDate!,
          emergencyContactName,
          emergencyContactRelationship,
          emergencyContactPhoneNumber,
          notes: notes || null,
        },
      });
    }
  });

  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${userId}`);
  revalidatePath(`/intern/manage-users/${userId}/edit`);
  revalidatePath("/intern/profile");
  revalidatePath("/intern/application");

  return {
    error: "",
    success: "อัปเดตข้อมูลนักศึกษาและข้อมูลฝึกงานเรียบร้อยแล้ว",
  };
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

  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const firstname = String(formData.get("firstname") ?? "").trim();
  const lastname = String(formData.get("lastname") ?? "").trim();
  const sex = String(formData.get("sex") ?? "").trim();
  const birthDateValue = String(formData.get("birthDate") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();

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

  const birthDate = birthDateValue ? parseDateInput(birthDateValue) : null;

  if (birthDateValue && !birthDate) {
    return {
      error: "วันเกิดไม่ถูกต้อง",
      success: "",
    };
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
    },
  });

  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${userId}`);
  revalidatePath(`/intern/manage-users/${userId}/edit`);
  revalidatePath("/intern/profile");

  return {
    error: "",
    success: "อัปเดตข้อมูลบัญชีเรียบร้อยแล้ว",
  };
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

  const userId = String(formData.get("userId") ?? "");
  const requestedApprovalStatus = String(formData.get("approvalStatus") ?? "");

  if (!userId) {
    return {
      error: "ไม่พบผู้ใช้ที่ต้องการอัปเดต",
      success: "",
    };
  }

  if (
    requestedApprovalStatus !== INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Pending &&
    requestedApprovalStatus !== INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Approved
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
      role: true,
      application: {
        select: {
          id: true,
          approvedAt: true,
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

  await prisma.internshipApplication.update({
    where: { userId },
    data: {
      approvalStatus: requestedApprovalStatus,
      approvedAt:
        requestedApprovalStatus === INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Approved
          ? targetUser.application.approvedAt ?? new Date()
          : null,
    },
  });

  revalidatePath("/intern/manage-users");
  revalidatePath(`/intern/manage-users/${userId}`);
  revalidatePath(`/intern/manage-users/${userId}/edit`);
  revalidatePath("/intern/profile");
  revalidatePath("/intern/application");

  return {
    error: "",
    success:
      requestedApprovalStatus === INTERNSHIP_APPLICATION_APPROVAL_STATUSES.Approved
        ? "อนุมัติแบบฟอร์มและเปลี่ยนสถานะเป็น On-going เรียบร้อยแล้ว"
        : "เปลี่ยนสถานะกลับเป็น Pending เรียบร้อยแล้ว",
  };
}