"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { markAllRead, markOneRead } from "@/app/actions/notifications";

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

type NotificationBellProps = {
  initialNotifications: Notification[];
  initialUnreadCount: number;
};

function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 transition ${hasUnread ? "animate-[wiggle_0.8s_ease-in-out]" : ""}`}
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "เมื่อกี้";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export function NotificationBell({ initialNotifications, initialUnreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleToggle() {
    setIsOpen((prev) => !prev);
  }

  function handleMarkOne(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    startTransition(() => {
      markOneRead(id);
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    startTransition(() => {
      markAllRead();
    });
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={`การแจ้งเตือน${unreadCount > 0 ? ` (${unreadCount} ใหม่)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur text-white transition hover:bg-white/18"
      >
        <BellIcon hasUnread={unreadCount > 0} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef6c1e] px-1 text-[10px] font-bold text-white ring-2 ring-[color:var(--gradient-brand,#7c3aed)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="การแจ้งเตือน"
          className="absolute right-0 top-12 z-50 w-80 sm:w-96 origin-top-right rounded-3xl border border-[color:var(--color-shell-border)] bg-white/95 shadow-[0_20px_60px_rgba(116,70,145,0.18)] backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-3xl bg-[linear-gradient(135deg,rgba(247,239,252,0.98),rgba(252,240,248,0.98))] px-5 py-4 border-b border-[color:var(--color-shell-border)]">
            <h2 className="text-sm font-semibold text-[color:var(--color-brand-violet-deep)]">
              การแจ้งเตือน
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(239,108,30,0.15)] px-1.5 text-[10px] font-bold text-[color:var(--color-brand-orange-deep)]">
                  {unreadCount}
                </span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[color:var(--color-brand-violet-deep)] transition hover:text-[color:var(--color-brand-violet)] underline-offset-2 hover:underline"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Notification list */}
          <ul className="max-h-[360px] overflow-y-auto divide-y divide-[color:var(--color-shell-border)]">
            {notifications.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-slate-400">
                ไม่มีการแจ้งเตือน
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 ${
                    n.isRead ? "opacity-70" : "bg-[rgba(247,239,252,0.4)]"
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[color:var(--color-brand-orange-deep)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold leading-snug ${n.isRead ? "text-slate-500" : "text-slate-800"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 line-clamp-3">
                      {n.message}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">{formatRelativeTime(n.createdAt)}</span>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkOne(n.id)}
                          className="text-[10px] font-medium text-[color:var(--color-brand-violet-deep)] transition hover:underline"
                        >
                          อ่านแล้ว
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="rounded-b-3xl border-t border-[color:var(--color-shell-border)] px-5 py-3">
              <p className="text-center text-[10px] text-slate-400">
                แสดง {notifications.length} รายการล่าสุด
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
