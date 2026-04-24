"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import {
  getNotificationsForUser,
  getUnreadCountForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export async function fetchNotifications() {
  const currentUser = await getCurrentUser();

  if (!currentUser) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser(currentUser.id),
    getUnreadCountForUser(currentUser.id),
  ]);

  return { notifications, unreadCount };
}

export async function markOneRead(notificationId: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser) return;

  await markNotificationRead(notificationId, currentUser.id);
  revalidatePath("/");
}

export async function markAllRead() {
  const currentUser = await getCurrentUser();

  if (!currentUser) return;

  await markAllNotificationsRead(currentUser.id);
  revalidatePath("/");
}
