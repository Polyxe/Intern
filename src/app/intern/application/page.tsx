import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Edit3, Eye } from "lucide-react";

import { InternshipApplicationForm } from "./application-form";
import { InternshipApplicationOverview } from "@/components/internship-application-overview";
import { Button } from "@/components/ui/button";
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
import { getPostLoginPath, requiresStudentTermsAcceptance, USER_ROLES } from "@/lib/user-management";

function getStudentApplicationWizardHref(step: InternshipApplicationWizardStep, options?: { edit?: boolean }) {
  const params = new URLSearchParams();

  if (options?.edit) {
    params.set("edit", "1");
  }

  if (step > 1 || options?.edit) {
    params.set("step", String(step));
  }

  return params.size ? `/intern/application?${params.toString()}` : "/intern/application";
}

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

export default async function InternshipApplicationPage({
  searchParams,
}: {
  searchParams?: Promise<{
    edit?: string;
    step?: string;
  }>;
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
  const status = application ? getInternshipStatus(application) : null;
  const statusMeta = status ? internshipStatusMeta[status] : null;
  const canEdit = application ? canStudentEditApplication(application) : true;
  const requestedStep = normalizeInternshipApplicationWizardStep(resolvedSearchParams.step);
  const hasStepParam = Boolean(resolvedSearchParams.step);
  const editingExistingApplication = resolvedSearchParams.edit === "1" && Boolean(application) && canEdit;
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

  if (!application) {
    if ((hasStepParam && currentStep !== requestedStep) || (!hasStepParam && currentStep !== 1)) {
      redirect(getStudentApplicationWizardHref(currentStep));
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
                Internship Form
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">ฟอร์มนักศึกษาฝึกงาน</h1>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">สถานะการฝึกงาน</p>
                <div className="mt-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/92">
                  {statusMeta?.label ?? "ยังไม่ส่งข้อมูล"}
                </div>
              </div>
              {application ? (
                <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">การจัดการแบบฟอร์ม</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {viewMode ? (
                      canEdit ? (
                        <Button
                          asChild
                          size="sm"
                          className="h-10 rounded-full bg-gradient-accent px-4 text-sm font-semibold text-white shadow-accent-glow hover:opacity-95"
                        >
                          <Link href={getStudentApplicationWizardHref(1, { edit: true })}>
                            <Edit3 className="size-4" />
                            แก้ไขข้อมูล
                          </Link>
                        </Button>
                      ) : null
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="h-10 rounded-full border border-white/20 bg-white/12 px-4 text-sm font-semibold text-white shadow-none backdrop-blur hover:bg-white/18"
                      >
                        <Link href="/intern/application">
                          <Eye className="size-4" />
                          กลับไปดูข้อมูลที่ส่งแล้ว
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
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
            step={currentStep}
            editingExistingApplication={editingExistingApplication}
          />
        )}
      </div>
    </main>
  );
}