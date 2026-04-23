import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessUserManagement,
  getAccountPagePath,
  getDisplayName,
  getRoleOptionsForManager,
  roleLabels,
  USER_ROLES,
} from "@/lib/user-management";

import { ManageUsersForm } from "./manage-users-form";

export default async function ManageUsersDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (!canAccessUserManagement(currentUser.role)) {
    redirect("/intern/profile");
  }

  const users = await prisma.user.findMany({
    where: currentUser.role === USER_ROLES.Admin ? { role: USER_ROLES.Student } : undefined,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      firstname: true,
      lastname: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  const allowedRoles = getRoleOptionsForManager(currentUser.role);

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_22px_60px_rgba(112,90,138,0.14)] backdrop-blur sm:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[rgba(142,85,183,0.1)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-brand-violet-deep)] uppercase">
                Management Dashboard
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                จัดการบัญชีผู้ใช้
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                {currentUser.role === USER_ROLES.Superadmin
                  ? "ดูแลบัญชีทั้งหมด สร้างผู้ดูแลระบบและนักศึกษา พร้อมเปิดดูรายละเอียดแต่ละบัญชีได้จากหน้านี้"
                  : "ดูแลบัญชีผู้ใช้งานที่เข้าถึงได้ สร้างบัญชีนักศึกษา และเปิดดูรายละเอียดแต่ละบัญชีได้จากหน้านี้"}
              </p>
            </div>

            <Button
              asChild
              variant="secondary"
              className="h-11 rounded-full border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-[0_10px_24px_rgba(130,74,163,0.12)] hover:bg-[color:var(--color-surface-soft)]"
            >
              <Link href={getAccountPagePath(currentUser.role, currentUser.id)}>เปิดบัญชีของฉัน</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">สร้างบัญชีผู้ใช้ใหม่</h2>
              <p className="text-sm leading-7 text-slate-600">
                {currentUser.role === USER_ROLES.Superadmin
                  ? "สร้างบัญชีใหม่ได้ทั้งบทบาทผู้ดูแลระบบและนักศึกษา"
                  : "สร้างบัญชีใหม่ได้เฉพาะบทบาทนักศึกษา"}
              </p>
            </div>

            <div className="mt-8">
              <ManageUsersForm allowedRoles={[...allowedRoles]} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_18px_48px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10">
            <div className="flex flex-col gap-3 border-b border-[color:var(--color-shell-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">บัญชีผู้ใช้ที่จัดการได้</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  คลิกที่ผู้ใช้เพื่อเปิดรายละเอียดบัญชีและดูข้อมูลเพิ่มเติม
                </p>
              </div>
              <div className="inline-flex w-fit items-center rounded-full bg-[color:var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
                ทั้งหมด {users.length} บัญชี
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/intern/manage-users/${user.id}`}
                  className="block rounded-3xl border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--color-brand-violet-deep)] hover:bg-white"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-950">{getDisplayName(user)}</h3>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
                        {roleLabels[user.role]}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">
                    สร้างเมื่อ {user.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}