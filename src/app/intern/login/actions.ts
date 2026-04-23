"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { AUTH_PROVIDERS, createSession } from "@/lib/session";
import { getPostLoginPath } from "@/lib/user-management";

type SignInState = {
  error: string;
};

export async function signIn(_: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email.trim() || !password) {
    return {
      error: "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
    select: {
      id: true,
      password: true,
      role: true,
    },
  });

  if (!user || !verifyPassword(password, user.password)) {
    return {
      error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    };
  }

  await createSession(user.id, AUTH_PROVIDERS.password);
  redirect(getPostLoginPath(user.role));
}