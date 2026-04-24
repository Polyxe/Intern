import { prisma } from "@/lib/prisma";
import { USER_ROLES } from "@/lib/user-management";

export async function createNotification(userId: string, title: string, message: string) {
  await prisma.notification.create({
    data: { userId, title, message },
  });
}

export async function createNotificationsForAdmins(title: string, message: string) {
  const admins = await prisma.user.findMany({
    where: { role: { in: [USER_ROLES.Admin, USER_ROLES.Superadmin] } },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, title, message })),
  });
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCountForUser(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
