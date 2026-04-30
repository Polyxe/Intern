import { redirect } from "next/navigation";

import { logout } from "@/app/actions/session";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getPostLoginPath, USER_ROLES } from "@/lib/user-management";

import { TermsForm } from "./terms-form";

const termsItems = [
  "ข้อมูลส่วนตัวและข้อมูลฝึกงานที่กรอกต้องเป็นข้อมูลล่าสุดและตรวจสอบได้",
  "ไฟล์แนบที่อัปโหลดต้องเกี่ยวข้องกับการฝึกงาน และต้องไม่ละเมิดสิทธิ์ของผู้อื่น",
  "ผู้ดูแลระบบสามารถใช้ข้อมูลนี้เพื่อพิจารณา ติดตาม และจัดการสถานะการฝึกงานได้",
  "หากมีการเปลี่ยนแปลงข้อมูลสำคัญ นักศึกษาต้องกลับมาอัปเดตข้อมูลในระบบด้วยตนเอง",
];

export default async function StudentTermsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/intern/login");
  }

  if (currentUser.role !== USER_ROLES.Student) {
    redirect(getPostLoginPath(currentUser.role));
  }

  if (currentUser.acceptedTermsAt) {
    redirect("/intern/profile");
  }

  return (
    <main className="page-shell" data-student-flow>
      <div className="page-grid mx-auto max-w-5xl">
        <section className="page-hero p-8 sm:p-10">
          <div className="relative space-y-6">
            <span className="section-kicker bg-white/14 text-white ring-white/20">
              ขั้นตอนแรกก่อนเริ่มใช้งาน
            </span>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">ยอมรับข้อตกลงการใช้งานสำหรับนักศึกษา</h1>
            </div>
          </div>
        </section>

        <section className="card-surface p-8 sm:p-10">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">ข้อตกลงโดยสรุป</h2>
            </div>

            <div className="space-y-3">
              {termsItems.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-[color:var(--color-shell-border)] bg-[linear-gradient(135deg,_rgba(247,242,252,0.96),_rgba(255,248,242,0.96))] px-5 py-4 text-sm leading-7 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>

            <TermsForm />

            <form action={logout}>
              <Button
                type="submit"
                variant="secondary"
                className="shadow-soft-brand h-11 rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)]"
              >
                ออกจากระบบ
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}