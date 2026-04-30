import { redirect } from "next/navigation";
import { Briefcase, FilePenLine } from "lucide-react";

import { InternshipApplicationForm } from "@/app/intern/application/application-form";
import { InternshipApplicationOverview } from "@/components/internship-application-overview";
import { getCurrentUser } from "@/lib/auth";
import {
  canStudentEditApplication,
  getInternshipStatus,
  internshipApplicationSelect,
  internshipStatusMeta,
} from "@/lib/internship-application";
import { getStudentApplicationDraft } from "@/lib/internship-application-draft";
import {
  normalizeInternshipApplicationWizardStep,
  type InternshipApplicationWizardStep,
} from "@/lib/internship-application-form";
import { prisma } from "@/lib/prisma";
import { getStudentInternshipProfileHref } from "@/lib/student-profile-routing";
import { getDisplayName, getPostLoginPath, requiresStudentTermsAcceptance, USER_ROLES } from "@/lib/user-management";

type StudentProfileFlowSearchParams = Promise<{
  step?: string;
}>;

function hasCompletedStudentWizardStepOne(currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return Boolean(
    currentUser.profileImagePath &&
      currentUser.title.trim() &&
      currentUser.firstname.trim() &&
      currentUser.lastname.trim() &&
      currentUser.sex?.trim() &&
      currentUser.birthDate &&
      currentUser.address?.trim() &&
      currentUser.institution?.trim(),
  );
}

function getHeroDescription(options: {
  hasApplication: boolean;
  editingExistingApplication: boolean;
  canEdit: boolean;
}) {
  if (options.editingExistingApplication) {
    return "อัปเดตข้อมูลโปรไฟล์และรายละเอียดการฝึกงานของคุณในเส้นทางเดียวกัน แล้วบันทึกการเปลี่ยนแปลงตามขั้นตอน";
  }

  if (!options.hasApplication) {
    return "กรอกข้อมูลโปรไฟล์และรายละเอียดการฝึกงานให้ครบ ระบบจะรวมข้อมูลทั้งหมดไว้ในหน้าโปรไฟล์นี้ทันทีหลังบันทึก";
  }

  return options.canEdit
    ? "โปรไฟล์นี้แสดงข้อมูลที่คุณส่งล่าสุด และสามารถแก้ไขได้จากปุ่ม Edit intern form บนแถบนำทาง"
    : "โปรไฟล์นี้อยู่ในโหมดอ่านอย่างเดียว เนื่องจากสถานะฝึกงานเสร็จสิ้นแล้ว";
}

function getModeMeta(options: {
  hasApplication: boolean;
  editingExistingApplication: boolean;
  canEdit: boolean;
}) {
  if (options.editingExistingApplication) {
    return {
      label: "กำลังแก้ไขข้อมูล",
      description: "บันทึกแต่ละขั้นตอนได้จากหน้าแก้ไขนี้โดยตรง",
    };
  }

  if (!options.hasApplication) {
    return {
      label: "เริ่มกรอกข้อมูลครั้งแรก",
      description: "สร้างโปรไฟล์และฟอร์มฝึกงานจากขั้นตอนด้านล่าง",
    };
  }

  return {
    label: "ดูข้อมูลที่ส่งแล้ว",
    description: options.canEdit
      ? "ใช้ปุ่ม Edit intern form บนแถบนำทางเมื่อต้องการแก้ไขข้อมูล"
      : "สถานะปัจจุบันปิดการแก้ไขแล้ว",
  };
}

export async function StudentProfileFlowPage({
  searchParams,
  requestedEdit = false,
}: {
  searchParams?: StudentProfileFlowSearchParams;
  requestedEdit?: boolean;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (currentUser.role !== USER_ROLES.Student) {
    redirect(getPostLoginPath(currentUser.role));
  }

  if (requiresStudentTermsAcceptance(currentUser)) {
    redirect("/intern/terms");
  }

  const application = await prisma.internshipApplication.findUnique({
    where: { userId: currentUser.id },
    select: internshipApplicationSelect,
  });

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedStep = normalizeInternshipApplicationWizardStep(resolvedSearchParams.step);
  const hasStepParam = Boolean(resolvedSearchParams.step);
  const canEdit = application ? canStudentEditApplication(application) : true;
  const editingExistingApplication = requestedEdit && Boolean(application) && canEdit;

  if (requestedEdit && application && !canEdit) {
    redirect(getStudentInternshipProfileHref());
  }

  const draft = !application || editingExistingApplication ? await getStudentApplicationDraft(currentUser.id) : null;
  const stepOneCompleted = hasCompletedStudentWizardStepOne(currentUser);
  const resumedStep = draft?.completedStep === 2 ? 3 : stepOneCompleted ? 2 : 1;
  const currentStep = application
    ? requestedStep
    : hasStepParam
      ? requestedStep > resumedStep
        ? resumedStep
        : requestedStep
      : resumedStep;
  const viewMode = Boolean(application) && !editingExistingApplication;
  const status = application ? getInternshipStatus(application) : null;
  const statusMeta = status ? internshipStatusMeta[status] : null;
  const modeMeta = getModeMeta({
    hasApplication: Boolean(application),
    editingExistingApplication,
    canEdit,
  });

  if (application && !requestedEdit && hasStepParam) {
    redirect(getStudentInternshipProfileHref());
  }

  if (!application) {
    const canonicalHref = getStudentInternshipProfileHref({
      edit: requestedEdit,
      step: currentStep,
    });

    if ((hasStepParam && currentStep !== requestedStep) || (!hasStepParam && currentStep !== 1)) {
      redirect(canonicalHref);
    }
  }

  return (
    <main className="page-shell" data-student-flow>
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="page-hero p-8 sm:p-10">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-end">
            <div className="self-center space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <Briefcase className="size-3.5" />
                Internship Profile
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {getDisplayName(currentUser)}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-white/78 sm:text-base">
                  {getHeroDescription({
                    hasApplication: Boolean(application),
                    editingExistingApplication,
                    canEdit,
                  })}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">สถานะการฝึกงาน</p>
                <div className="mt-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/92">
                  {statusMeta?.label ?? "ยังไม่ส่งข้อมูล"}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">โหมดปัจจุบัน</p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/20">
                    <FilePenLine className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/92">{modeMeta.label}</p>
                    <p className="mt-1 text-sm leading-6 text-white/68">{modeMeta.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {viewMode && application ? (
          <InternshipApplicationOverview
            application={application}
            heading="ข้อมูลแบบฟอร์มฝึกงานของฉัน"
          />
        ) : (
          <InternshipApplicationForm
            application={application}
            currentUser={currentUser}
            draftValues={draft?.values}
            step={currentStep as InternshipApplicationWizardStep}
            editingExistingApplication={editingExistingApplication}
          />
        )}
      </div>
    </main>
  );
}