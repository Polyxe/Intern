import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FilePenLine, Layers3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { internshipApplicationSelect } from "@/lib/internship-application";
import {
  appendReturnTo,
  getCanonicalManageUsersHref,
  getValidatedManageUsersReturnTo,
} from "@/lib/manage-users-routing";
import { prisma } from "@/lib/prisma";
import {
  USER_ROLES,
  canAccessUserManagement,
  canManagerDeleteManagedAccount,
  canManagerEditManagedAccount,
  canManagerEditUser,
  canManagerViewUser,
  getDisplayName,
  roleLabels,
} from "@/lib/user-management";

import { AccountDetailsForm } from "../../account-details-form";
import { DeleteManagedAccountForm } from "../../delete-managed-account-form";
import { StudentDetailsForm } from "../../student-details-form";

type ManageUserEditPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{
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
  const backToListHref = returnTo ?? getCanonicalManageUsersHref(currentUser.role);
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

  if (!managedUser || !canManagerViewUser(currentUser.role, managedUser.role, { isSelf })) {
    notFound();
  }

  const canEditStudent = canManagerEditUser(currentUser.role, managedUser.role);
  const canEditAccount = canManagerEditManagedAccount(currentUser.role, managedUser.role, { isSelf });
  const canDeleteAccount = canManagerDeleteManagedAccount(currentUser.role, managedUser.role, { isSelf });

  if (!canEditAccount) {
    redirect(appendReturnTo(`/intern/manage-users/${userId}`, returnTo));
  }

  const detailHref = appendReturnTo(`/intern/manage-users/${managedUser.id}`, returnTo);

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="page-hero p-8 sm:p-10">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.78fr)] lg:items-end">
            <div className="space-y-4">
              <span className="section-kicker bg-white/14 text-white ring-white/20">
                <FilePenLine className="size-3.5" />
                Editing Workspace
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  แก้ไขบัญชี {getDisplayName(managedUser)}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/78">
                  {canEditStudent
                    ? "หน้านี้จัดเลย์เอาต์ให้เหมือน intern form เพื่อให้ผู้ดูแลแก้ไขข้อมูลบัญชีและข้อมูลนักศึกษาได้ในพื้นที่ทำงานเดียว ขณะที่งานอนุมัติจะอยู่ในหน้าดูข้อมูล"
                    : "หน้านี้ใช้สำหรับแก้ไขข้อมูลบัญชีพื้นฐานเท่านั้น โดยคงโทนและจังหวะการจัดวางแบบเดียวกับ intern form"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
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
                <Button
                  asChild
                  variant="secondary"
                  className="h-11 rounded-full border border-white/20 bg-white/12 px-5 text-sm font-semibold text-white shadow-none backdrop-blur hover:bg-white/18"
                >
                  <Link href={backToListHref}>
                    <ArrowLeft className="size-4" />
                    กลับไปหน้ารายการ
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">บทบาทที่แก้ไข</p>
                <div className="mt-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/92">
                  {roleLabels[managedUser.role]}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  ฟอร์มด้านล่างจะเปิดเฉพาะข้อมูลที่บทบาทของคุณมีสิทธิ์แก้ไขจริงเท่านั้น
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">Workflow</p>
                <p className="mt-3 text-sm leading-7 text-white/78">
                  ปุ่มอนุมัติ ปฏิเสธ และเสร็จสิ้นถูกย้ายกลับไปไว้ที่หน้าดูข้อมูลแล้ว เพื่อให้การตรวจฟอร์มและการอนุมัติอยู่ในบริบทเดียวกัน
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="card-surface p-8 sm:p-10">
            <div className="flex flex-col gap-4 border-b border-[color:var(--color-shell-border)] pb-6">
              <span className="section-kicker bg-gradient-brand-soft ring-0">
                <Layers3 className="size-3.5" />
                Form Workspace
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">ข้อมูลที่แก้ไขได้</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  {canEditStudent
                    ? "ชุดฟอร์มนี้ครอบคลุมข้อมูลบัญชี ข้อมูลการศึกษา และรายละเอียดการฝึกงานทั้งหมดของนักศึกษา โดยคงโครงสร้างแบบเดียวกับฟอร์มนักศึกษาหน้าหลัก"
                    : "ชุดฟอร์มนี้แสดงเฉพาะข้อมูลบัญชีพื้นฐาน และตัดส่วนอนุมัติสถานะออกจากหน้าแก้ไขเพื่อให้โฟกัสกับงานบันทึกข้อมูล"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              {canEditStudent ? (
                <StudentDetailsForm user={managedUser} canEditEmail />
              ) : (
                <AccountDetailsForm
                  user={managedUser}
                  canEditEmail={currentUser.role === USER_ROLES.Superadmin || isSelf}
                  canEditProfileImage={isSelf}
                />
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="card-surface p-8 sm:p-10">
              <div className="space-y-3">
                <span className="section-kicker bg-gradient-brand-soft ring-0">
                  <ShieldCheck className="size-3.5" />
                  Editing Rules
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">ขอบเขตการแก้ไข</h2>
                <p className="text-sm leading-7 text-slate-600">
                  {canEditStudent
                    ? "สำหรับนักศึกษา ผู้ดูแลสามารถแก้ไขข้อมูลบัญชีและข้อมูลฝึกงานได้จากหน้านี้ ส่วนงานอนุมัติสถานะให้กลับไปทำต่อที่หน้าดูข้อมูล"
                    : "สำหรับผู้ดูแลระบบ หน้านี้จะแสดงเฉพาะข้อมูลบัญชีพื้นฐานเท่านั้น และไม่แสดงฟิลด์ข้อมูลนักศึกษา"}
                </p>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-5 text-sm leading-7 text-slate-600">
                เมื่อบันทึกข้อมูลแล้ว สามารถกลับไปที่หน้าดูข้อมูลเพื่อยืนยันผลลัพธ์และดำเนินการอนุมัติสถานะฝึกงานต่อได้ทันที
              </div>
            </section>

            {canDeleteAccount ? <DeleteManagedAccountForm userId={managedUser.id} /> : null}
          </aside>
        </section>
      </div>
    </main>
  );
}