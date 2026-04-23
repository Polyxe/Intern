import { redirect } from "next/navigation";

import { InternshipApplicationForm } from "@/app/intern/application/application-form";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth";
import {
  canStudentEditApplication,
  getInternshipStatus,
  internshipApplicationSelect,
  internshipStatusMeta,
} from "@/lib/internship-application";
import { prisma } from "@/lib/prisma";
import { getPostLoginPath, USER_ROLES } from "@/lib/user-management";

export default async function InternshipApplicationPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (currentUser.role !== USER_ROLES.Student) {
    redirect(getPostLoginPath(currentUser.role));
  }

  const application = await prisma.internshipApplication.findUnique({
    where: { userId: currentUser.id },
    select: internshipApplicationSelect,
  });

  const status = application ? getInternshipStatus(application) : null;
  const statusMeta = status ? internshipStatusMeta[status] : null;
  const canEdit = application ? canStudentEditApplication(application) : true;

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-[color:var(--color-shell-border)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.94)_0%,_rgba(248,241,252,0.96)_52%,_rgba(255,246,238,0.98)_100%)] p-8 shadow-[0_24px_64px_rgba(112,90,138,0.16)] backdrop-blur sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] lg:items-end">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-sm font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase shadow-sm">
                Student Portal
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  แบบฟอร์มสมัครฝึกงานสำหรับนักศึกษา
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-600">
                  กรอกข้อมูลการฝึกงานในหน้าจอเดียวให้ครบถ้วน แล้วระบบจะบันทึกลงฐานข้อมูลเพื่อนำไปแสดงบนโปรไฟล์ของคุณทันที
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/75 bg-white/82 p-6 shadow-[0_18px_40px_rgba(130,74,163,0.12)]">
              <p className="text-sm font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                Application Snapshot
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    firstName={currentUser.firstname}
                    lastName={currentUser.lastname}
                    imagePath={currentUser.profileImagePath}
                    className="h-16 w-16 border-[color:var(--color-shell-border)]"
                  />
                  <div>
                    <p className="text-sm text-slate-500">เจ้าของแบบฟอร์ม</p>
                    <p className="text-lg font-semibold text-slate-950">{[currentUser.title, currentUser.firstname, currentUser.lastname].filter(Boolean).join(" ")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">เจ้าของแบบฟอร์ม</p>
                  <p className="text-sm text-slate-500">สถานะปัจจุบัน</p>
                  {statusMeta ? (
                    <div className={`mt-2 inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.badgeClassName}`}>
                      {statusMeta.label}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-slate-700">ยังไม่ได้ส่งแบบฟอร์ม</p>
                  )}
                </div>
                <p className="text-sm leading-7 text-slate-500">
                  {application
                    ? canEdit
                      ? "คุณสามารถแก้ไขข้อมูลได้จนกว่าสถานะจะเปลี่ยนเป็น Completed"
                      : "แบบฟอร์มนี้ถูกล็อกแล้วเพราะสถานะฝึกงานเสร็จสิ้น"
                    : "หลังจากบันทึกครั้งแรก ข้อมูลทั้งหมดจะปรากฏบนหน้าโปรไฟล์ของคุณพร้อมปุ่มแก้ไข"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <InternshipApplicationForm application={application} currentUser={currentUser} />
      </div>
    </main>
  );
}