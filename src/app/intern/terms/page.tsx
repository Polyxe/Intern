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
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/82 p-8 shadow-[0_22px_60px_rgba(112,90,138,0.14)] backdrop-blur sm:p-10">
          <span className="inline-flex items-center rounded-full border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] px-4 py-1.5 text-sm font-medium text-[color:var(--color-brand-violet-deep)] shadow-sm">
            ขั้นตอนแรกก่อนเริ่มใช้งาน
          </span>
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">ยอมรับข้อตกลงการใช้งานสำหรับนักศึกษา</h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              การเข้าสู่ระบบครั้งแรกของนักศึกษาต้องยืนยันข้อตกลงก่อน จึงจะสามารถเปิดโปรไฟล์ กรอกแบบฟอร์มฝึกงาน และอัปโหลดเอกสารประกอบได้
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white p-8 shadow-[0_22px_60px_rgba(112,90,138,0.16)] sm:p-10">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">ข้อตกลงโดยสรุป</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                โปรดอ่านเงื่อนไขต่อไปนี้อย่างย่อก่อนยืนยันการใช้งานระบบ
              </p>
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
                className="h-11 rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-[0_10px_24px_rgba(130,74,163,0.12)] hover:bg-[color:var(--color-surface-soft)]"
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