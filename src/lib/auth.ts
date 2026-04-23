import "server-only";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
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
      acceptedTermsAt: true,
    },
  });
}