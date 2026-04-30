import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import cmuLogo from "../../Chiang_mai_university_logo.png";
import googleLogo from "../../Google.png";

import { Button } from "@/components/ui/button";

import { getCurrentUser } from "@/lib/auth";
import { isCmuOAuthEnabled } from "@/lib/cmu-oauth";
import { isGoogleOAuthEnabled } from "@/lib/google-oauth";
import { getPostLoginPathForUser } from "@/lib/user-management";

const oauthMessages: Record<string, string> = {
  cancelled: "การเข้าสู่ระบบด้วย CMU Entra ID ถูกยกเลิก กรุณาลองใหม่อีกครั้ง",
  configuration: "CMU Entra ID OAuth ยังตั้งค่าไม่ครบถ้วน กรุณาตรวจสอบตัวแปรใน .env",
  disabled: "CMU Entra ID OAuth ยังไม่พร้อมใช้งานในสภาพแวดล้อมนี้",
  failed: "ไม่สามารถยืนยันตัวตนผ่าน CMU Entra ID ได้ กรุณาลองใหม่อีกครั้ง",
  "invalid-state": "สถานะการยืนยันตัวตนไม่ถูกต้อง กรุณาเริ่มการเข้าสู่ระบบใหม่อีกครั้ง",
  "missing-code": "ไม่พบรหัสยืนยันจาก CMU Entra ID กรุณาลองใหม่อีกครั้ง",
  "not-provisioned": "อีเมลนี้ยังไม่ได้รับการสร้างบัญชีโดยผู้ดูแลระบบ จึงไม่สามารถเข้าสู่ระบบด้วย CMU Entra ID ได้",
  "google-cancelled": "การเข้าสู่ระบบด้วย Google ถูกยกเลิก กรุณาลองใหม่อีกครั้ง",
  "google-configuration": "Google OAuth ยังตั้งค่าไม่ครบถ้วน กรุณาตรวจสอบตัวแปรใน .env",
  "google-disabled": "Google OAuth ยังไม่พร้อมใช้งานในสภาพแวดล้อมนี้",
  "google-failed": "ไม่สามารถยืนยันตัวตนผ่าน Google ได้ กรุณาลองใหม่อีกครั้ง",
  "google-invalid-state": "สถานะการยืนยันตัวตนของ Google ไม่ถูกต้อง กรุณาเริ่มการเข้าสู่ระบบใหม่อีกครั้ง",
  "google-missing-code": "ไม่พบรหัสยืนยันจาก Google กรุณาลองใหม่อีกครั้ง",
  "google-not-provisioned": "อีเมล Google นี้ยังไม่ได้รับการสร้างบัญชีโดยผู้ดูแลระบบ จึงไม่สามารถเข้าสู่ระบบได้",
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
  const googleOAuthEnabled = isGoogleOAuthEnabled();

  if (currentUser) {
    redirect(await getPostLoginPathForUser(currentUser));
  }

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10 sm:py-14">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ backgroundImage: "var(--gradient-mesh)" }}
      />

      <div className="w-full max-w-[52rem] overflow-hidden rounded-[2rem] border border-[color:var(--color-shell-border)] shadow-elegant">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Brand section */}
          <div
            className="relative overflow-hidden p-8 text-white sm:p-10 lg:p-12"
            style={{
              backgroundImage: "var(--gradient-brand)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background:
                  "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.4), transparent 34%), radial-gradient(circle at 82% 78%, rgba(255,255,255,0.22), transparent 26%)",
              }}
            />

            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-24 rounded-full bg-white/8" />
            <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-16 rounded-full bg-white/6" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div className="space-y-5">
                <span className="section-kicker bg-white/14 text-white ring-white/20">
                  Internship Portal
                </span>
                <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                  ระบบบริหารจัดการนักศึกษาฝึกงานของมหาวิทยาลัยเชียงใหม่
                </h1>
              </div>
              <p className="text-xs text-white/50">© 2026 Chiang Mai University</p>
            </div>
          </div>

          {/* Login section */}
          <div
            className="p-8 sm:p-10 lg:p-12"
            style={{ backgroundImage: "var(--gradient-panel)" }}
          >
            <div className="mb-6 space-y-3">
              <span className="section-kicker">Sign In</span>
              <h2 className="text-3xl font-semibold text-slate-950">เข้าสู่ระบบ</h2>
            </div>

            {oauthMessage ? (
              <p className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {oauthMessage}
              </p>
            ) : null}

            <div className="space-y-4">
              {cmuOAuthEnabled ? (
                <Button
                  asChild
                  size="lg"
                  className="h-13 w-full justify-between rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(24,24,36,0.18)] hover:bg-slate-900"
                >
                  <Link href="/intern/login/cmu">
                    <span className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow-[0_8px_18px_rgba(15,23,42,0.22)] ring-1 ring-white/20">
                        <Image src={cmuLogo} alt="Chiang Mai University" className="size-9 object-cover" priority />
                      </span>
                      <span>เข้าสู่ระบบด้วย CMU Entra ID</span>
                    </span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button type="button" size="lg" disabled className="h-13 w-full rounded-2xl bg-slate-100 text-sm font-semibold text-slate-400">
                  <span className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_16px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
                      <Image src={cmuLogo} alt="Chiang Mai University" className="size-9 object-cover opacity-80" priority />
                    </span>
                    <span>เข้าสู่ระบบด้วย CMU Entra ID</span>
                  </span>
                </Button>
              )}

              {!cmuOAuthEnabled ? (
                <p className="text-xs text-slate-400">ยังไม่พบการตั้งค่า CMU OAuth ครบถ้วน</p>
              ) : null}

              {googleOAuthEnabled ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 w-full justify-between rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(92,78,112,0.08)]"
                >
                  <Link href="/intern/login/google">
                    <span className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80">
                        <Image src={googleLogo} alt="Google" className="size-6 object-contain" priority />
                      </span>
                      <span>เข้าสู่ระบบด้วย Google</span>
                    </span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button type="button" size="lg" disabled className="h-13 w-full rounded-2xl bg-slate-100 text-sm font-semibold text-slate-400">
                  <span className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_16px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
                      <Image src={googleLogo} alt="Google" className="size-6 object-contain opacity-80" priority />
                    </span>
                    <span>เข้าสู่ระบบด้วย Google</span>
                  </span>
                </Button>
              )}

              {!googleOAuthEnabled ? (
                <p className="text-xs text-slate-400">ยังไม่พบการตั้งค่า Google OAuth ครบถ้วนในตัวแปรสภาพแวดล้อม</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
