import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, FileStack, FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import {
  canStudentEditApplication,
  getInternshipStatus,
  internshipApplicationSelect,
  internshipStatusMeta,
} from "@/lib/internship-application";
import { prisma } from "@/lib/prisma";
import { getPostLoginPath, requiresStudentTermsAcceptance, USER_ROLES } from "@/lib/user-management";

import { StudentWorkSubmission } from "./student-work-submission";

export default async function StudentWorkPage() {
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

  const status = application ? getInternshipStatus(application) : null;
  const statusMeta = status ? internshipStatusMeta[status] : null;
  const canManageWorkFiles = application ? canStudentEditApplication(application) : false;

  return (
    <main className="page-shell" data-student-flow>
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="page-hero p-8 sm:p-10">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-end">
            <div className="self-center space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <FolderKanban className="size-3.5" />
                Internship Work
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">ผลงานระหว่างฝึกงาน</h1>
                <p className="max-w-3xl text-sm leading-7 text-white/78 sm:text-base">
                  พื้นที่สำหรับเก็บไฟล์ผลงานที่ต้องใช้ตลอดช่วงฝึกงาน และเปิดให้ผู้ดูแลตรวจสอบจากหน้ารายละเอียดบัญชีได้ทันที
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">สถานะการฝึกงาน</p>
                <div className="mt-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/92">
                  {statusMeta?.label ?? "ยังไม่มีข้อมูลฝึกงาน"}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">ไฟล์ที่เก็บไว้</p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/20">
                    <FileStack className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/92">{application?.workFiles.length ?? 0} ไฟล์</p>
                    <p className="mt-1 text-sm leading-6 text-white/68">
                      {canManageWorkFiles ? "สามารถอัปโหลดและจัดการผลงานได้จากหน้านี้" : "อยู่ในโหมดอ่านอย่างเดียว"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {application ? (
          <StudentWorkSubmission application={application} canManageWorkFiles={canManageWorkFiles} />
        ) : (
          <section className="card-surface p-8 sm:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-gradient-brand-soft text-[color:var(--color-brand-violet-deep)] ring-1 ring-[color:var(--color-brand-ring-soft)]">
                <BriefcaseBusiness className="size-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">ยังไม่มีข้อมูลฝึกงาน</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                บันทึกโปรไฟล์และข้อมูลฝึกงานก่อน แล้วระบบจะเปิดพื้นที่สำหรับเก็บผลงานให้โดยอัตโนมัติ
              </p>
              <div className="mt-6 flex justify-center">
                <Button asChild className="h-11 rounded-full bg-gradient-accent px-5 text-sm font-semibold text-white shadow-accent-glow hover:opacity-95">
                  <Link href="/intern/profile">ไปที่หน้าโปรไฟล์ฝึกงาน</Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}