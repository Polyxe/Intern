import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LoginForm } from "./login-form";

import { getCurrentUser } from "@/lib/auth";
import { getCmuOAuthCallbackUrl, isCmuOAuthEnabled } from "@/lib/cmu-oauth";
import { getPostLoginPath } from "@/lib/user-management";

const oauthMessages: Record<string, string> = {
  cancelled: "การเข้าสู่ระบบด้วย CMU Entra ID ถูกยกเลิก กรุณาลองใหม่อีกครั้ง",
  configuration: "CMU Entra ID OAuth ยังตั้งค่าไม่ครบถ้วน กรุณาตรวจสอบตัวแปรใน .env",
  disabled: "CMU Entra ID OAuth ยังไม่พร้อมใช้งานในสภาพแวดล้อมนี้",
  failed: "ไม่สามารถยืนยันตัวตนผ่าน CMU Entra ID ได้ กรุณาลองใหม่อีกครั้ง",
  "invalid-state": "สถานะการยืนยันตัวตนไม่ถูกต้อง กรุณาเริ่มการเข้าสู่ระบบใหม่อีกครั้ง",
  "missing-code": "ไม่พบรหัสยืนยันจาก CMU Entra ID กรุณาลองใหม่อีกครั้ง",
};

type InternLoginPageProps = {
  searchParams?: Promise<{
    oauth?: string;
  }>;
};

export default async function InternLoginPage({ searchParams }: InternLoginPageProps) {
  const currentUser = await getCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const oauthMessage = resolvedSearchParams.oauth ? oauthMessages[resolvedSearchParams.oauth] ?? "" : "";
  const cmuOAuthEnabled = isCmuOAuthEnabled();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const callbackHint = getCmuOAuthCallbackUrl(host ? `${protocol}://${host}` : undefined);

  if (currentUser) {
    redirect(getPostLoginPath(currentUser.role));
  }

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white/78 p-8 shadow-[0_22px_60px_rgba(112,90,138,0.12)] backdrop-blur sm:p-10 lg:p-12">
          <span className="inline-flex items-center rounded-full border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] px-4 py-1.5 text-sm font-medium text-[color:var(--color-brand-violet-deep)] shadow-sm">
            สำหรับผู้ใช้ที่ได้รับบัญชีจากผู้ดูแลระบบ
          </span>
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              เข้าสู่ระบบฝึกงาน
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              นักศึกษาสามารถเข้าสู่ระบบด้วย CMU Entra ID ได้ทันที ส่วนผู้ดูแลระบบและบัญชีที่ถูกสร้างไว้แล้วสามารถใช้อีเมลกับรหัสผ่านเดิมได้ตามปกติ
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-5">
              <h2 className="text-sm font-semibold text-slate-900">CMU Entra ID Callback</h2>
              <p className="mt-2 break-all text-sm leading-7 text-slate-600">{callbackHint}</p>
            </div>
            <div className="rounded-3xl border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-5">
              <h2 className="text-sm font-semibold text-slate-900">หลังจากเข้าสู่ระบบ</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">นักศึกษาจะถูกพาไปยังหน้าโปรไฟล์ ส่วนผู้ดูแลระบบจะถูกพาไปยังแดชบอร์ดจัดการบัญชีโดยอัตโนมัติ</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--color-shell-border)] bg-white p-8 shadow-[0_22px_60px_rgba(112,90,138,0.16)] sm:p-10">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-slate-950">เลือกวิธีเข้าสู่ระบบ</h2>
            <p className="text-sm leading-7 text-slate-500">CMU Entra ID เหมาะสำหรับนักศึกษา ส่วนบัญชีที่ผู้ดูแลระบบสร้างไว้แล้วยังใช้การเข้าสู่ระบบด้วยรหัสผ่านได้เหมือนเดิม</p>
          </div>

          {oauthMessage ? (
            <p className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
              {oauthMessage}
            </p>
          ) : null}

          <div className="space-y-4 rounded-3xl border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)] p-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-950">เข้าสู่ระบบด้วย CMU Entra ID</h3>
              <p className="text-sm leading-7 text-slate-600">
                ระบบจะดึงข้อมูลพื้นฐานจากบัญชีมหาวิทยาลัยและสร้างบัญชีนักศึกษาให้อัตโนมัติเมื่อเข้าสู่ระบบครั้งแรก
              </p>
            </div>

            {cmuOAuthEnabled ? (
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,_#8d5bb8,_#6f3f9f)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(111,63,159,0.24)] hover:brightness-105"
              >
                <Link href="/intern/login/cmu">เข้าสู่ระบบด้วย CMU Entra ID</Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,_#8d5bb8,_#6f3f9f)] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(111,63,159,0.24)]"
                disabled
              >
                เข้าสู่ระบบด้วย CMU Entra ID
              </Button>
            )}

            {!cmuOAuthEnabled ? (
              <p className="text-sm leading-7 text-slate-500">ยังไม่พบการตั้งค่า CMU OAuth ครบถ้วนในตัวแปรสภาพแวดล้อม</p>
            ) : null}
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--color-shell-border)]" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">หรือ</span>
            <div className="h-px flex-1 bg-[color:var(--color-shell-border)]" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-950">เข้าสู่ระบบด้วยบัญชีที่ผู้ดูแลระบบสร้างไว้</h3>
              <p className="text-sm leading-7 text-slate-500">ใช้สำหรับผู้ดูแลระบบหรือบัญชีที่ต้องการคงการเข้าสู่ระบบแบบรหัสผ่าน</p>
            </div>

          <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}