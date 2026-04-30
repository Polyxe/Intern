import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FilePenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { internshipApplicationSelect } from "@/lib/internship-application";
import { normalizeInternshipApplicationWizardStep } from "@/lib/internship-application-form";
import { getManagedStudentEditDraft } from "@/lib/managed-student-edit-draft";
import {
  appendReturnTo,
  getValidatedManageUsersReturnTo,
} from "@/lib/manage-users-routing";
import { prisma } from "@/lib/prisma";
import {
  USER_ROLES,
  canAccessUserManagement,
  getAccountPagePath,
  canManagerEditManagedAccount,
  canManagerEditUser,
  canManagerViewUser,
  getDisplayName,
  requiresManagerProfileCompletion,
} from "@/lib/user-management";

import { AccountDetailsForm } from "../../account-details-form";
import { StudentDetailsForm } from "../../student-details-form";

type ManageUserEditPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
    step?: string;
    returnTo?: string;
  }>;
};

export default async function ManageUserEditPage({ params, searchParams }: ManageUserEditPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (!canAccessUserManagement(currentUser.role)) {
    redirect("/intern/profile");
  }

  const { userId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const returnTo = getValidatedManageUsersReturnTo(resolvedSearchParams.returnTo);
  const managedUser = await prisma.user.findUnique({
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
      profileImagePath: true,
      application: {
        select: internshipApplicationSelect,
      },
    },
  });
  const isSelf = managedUser?.id === currentUser.id;

  if (requiresManagerProfileCompletion(currentUser) && isSelf === false) {
    redirect(getAccountPagePath(currentUser.role, currentUser.id));
  }

  if (!managedUser || !canManagerViewUser(currentUser.role, managedUser.role, { isSelf })) {
    notFound();
  }

  const canEditStudent = canManagerEditUser(currentUser.role, managedUser.role);
  const canEditAccount = canManagerEditManagedAccount(currentUser.role, managedUser.role, { isSelf });
  const draft = canEditStudent && !managedUser.application
    ? await getManagedStudentEditDraft(currentUser.id, managedUser.id)
    : null;
  const requestedStep = normalizeInternshipApplicationWizardStep(resolvedSearchParams.step);
  const maxAvailableStep = canEditStudent
    ? managedUser.application || draft?.completedStep === 2
      ? 3
      : 2
    : 1;
  const currentStep = canEditStudent
    ? requestedStep > maxAvailableStep
      ? maxAvailableStep
      : requestedStep
    : 1;

  if (!canEditAccount) {
    redirect(appendReturnTo(`/intern/manage-users/${userId}`, returnTo));
  }

  if (canEditStudent && currentStep !== requestedStep) {
    redirect(appendReturnTo(`/intern/manage-users/${managedUser.id}/edit?step=${String(currentStep)}`, returnTo));
  }

  const detailHref = appendReturnTo(`/intern/manage-users/${managedUser.id}`, returnTo);

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="page-hero p-8 sm:p-10">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-end">
            <div className="self-center space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <FilePenLine className="size-3.5" />
                Account Edit
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  แก้ไขบัญชี {getDisplayName(managedUser)}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                  ใช้โครงหน้าแบบเดียวกับฟอร์มฝึกงานเพื่อให้การแก้ไขข้อมูลบัญชีอ่านง่าย บันทึกเร็ว และไล่ตรวจรายละเอียดได้เป็นช่วงชัดเจน
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end lg:self-start">
              <Button
                asChild
                variant="secondary"
                className="h-11 rounded-full border border-white/20 bg-white/12 px-5 text-sm font-semibold text-white shadow-none backdrop-blur hover:bg-white/18"
              >
                <Link href={detailHref}>
                  <ArrowLeft className="size-4" />
                  กลับไปหน้าดูข้อมูล
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {canEditStudent ? (
          <StudentDetailsForm
            user={managedUser}
            canEditEmail={currentUser.role === USER_ROLES.Superadmin}
            step={currentStep}
            draftValues={draft?.values}
            returnTo={returnTo}
          />
        ) : (
          <AccountDetailsForm
            user={managedUser}
            canEditEmail={currentUser.role === USER_ROLES.Superadmin}
            canEditProfileImage={isSelf}
          />
        )}
      </div>
    </main>
  );
}