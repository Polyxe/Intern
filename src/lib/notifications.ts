import { prisma } from "@/lib/prisma";
import { USER_ROLES } from "@/lib/user-management";
import { sendNotificationEmail } from "@/lib/email";

type NotificationEmailOptions = {
  recipientEmail: string;
  subject?: string;
  heading?: string;
  actionPath?: string;
  actionLabel?: string;
};

type AdminNotificationEmailOptions = {
  subject?: string;
  heading?: string;
  actionPath?: string;
  actionLabel?: string;
};

async function deliverNotificationEmail(
  title: string,
  message: string,
  options?: {
    recipients?: string[];
    subject?: string;
    heading?: string;
    actionPath?: string;
    actionLabel?: string;
  },
) {
  const recipients = options?.recipients?.filter(Boolean) ?? [];

  if (recipients.length === 0) {
    return;
  }

  await sendNotificationEmail({
    to: recipients,
    subject: options?.subject ?? title,
    heading: options?.heading ?? title,
    message,
    action:
      options?.actionPath && options?.actionLabel
        ? {
            path: options.actionPath,
            label: options.actionLabel,
          }
        : undefined,
  });
}

export async function createNotification(userId: string, title: string, message: string) {
  await prisma.notification.create({
    data: { userId, title, message },
  });
}

export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  options?: { email?: NotificationEmailOptions },
) {
  await createNotification(userId, title, message);

  if (!options?.email?.recipientEmail) {
    return;
  }

  await deliverNotificationEmail(title, message, {
    recipients: [options.email.recipientEmail],
    subject: options.email.subject,
    heading: options.email.heading,
    actionPath: options.email.actionPath,
    actionLabel: options.email.actionLabel,
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

export async function notifyAdmins(
  title: string,
  message: string,
  options?: { email?: AdminNotificationEmailOptions },
) {
  const admins = await prisma.user.findMany({
    where: { role: { in: [USER_ROLES.Admin, USER_ROLES.Superadmin] } },
    select: { id: true, email: true },
  });

  if (admins.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, title, message })),
  });

  await deliverNotificationEmail(title, message, {
    recipients: admins.map((admin) => admin.email),
    subject: options?.email?.subject,
    heading: options?.email?.heading,
    actionPath: options?.email?.actionPath,
    actionLabel: options?.email?.actionLabel,
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
