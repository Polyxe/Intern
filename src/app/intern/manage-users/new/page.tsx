import { redirect } from "next/navigation";

import { ManageUsersForm } from "@/app/intern/manage-users/manage-users-form";
import { getCurrentUser } from "@/lib/auth";
import {
  getCanonicalManageUsersHref,
  getValidatedManageUsersReturnTo,
} from "@/lib/manage-users-routing";
import { canAccessUserManagement, getRoleOptionsForManager } from "@/lib/user-management";

type ManageUsersCreatePageProps = {
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

export default async function ManageUsersCreatePage({ searchParams }: ManageUsersCreatePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (!canAccessUserManagement(currentUser.role)) {
    redirect("/intern/profile");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const returnTo = getValidatedManageUsersReturnTo(resolvedSearchParams.returnTo);
  const cancelHref = returnTo ?? getCanonicalManageUsersHref(currentUser.role);
  const allowedRoles = getRoleOptionsForManager(currentUser.role);

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="page-hero p-8 sm:p-10">
          <div className="space-y-4">
            <span className="section-kicker bg-white/14 text-white ring-white/20">Create Account</span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">สร้างบัญชีผู้ใช้ใหม่</h1>
              <p className="max-w-2xl text-base leading-8 text-white/78">
                ระบุอีเมลที่ได้รับสิทธิ์จากผู้ดูแล เลือกบทบาทที่อนุญาตตามสิทธิ์ของคุณ แล้วบันทึกเพื่อพาไปยังหน้ารายละเอียดของบัญชีที่สร้างทันที
              </p>
            </div>
          </div>
        </section>

        <section className="card-surface p-8 sm:p-10">
          <div className="mb-6 space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">ข้อมูลบัญชีเริ่มต้น</h2>
            <p className="text-sm leading-7 text-slate-600">
              บัญชีที่สร้างจากหน้านี้จะใช้ OAuth-only sign in และจะปรากฏบนหน้า `จัดการผู้ใช้` ทันทีหลังบันทึกสำเร็จ
            </p>
          </div>

          <ManageUsersForm allowedRoles={allowedRoles} cancelHref={cancelHref} returnTo={returnTo} />
        </section>
      </div>
    </main>
  );
}