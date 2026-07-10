"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, Check, Trash, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authenticated";

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-[var(--brand-primary)] border-2 border-[var(--bg-primary)] rounded-full px-1 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-2xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-[10px] font-bold text-[var(--brand-primary-light)] hover:text-white transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-primary)]">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 text-left transition-colors flex gap-3 items-start ${
                    !notif.read ? "bg-[var(--brand-primary)]/5" : "hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  {/* Read Dot */}
                  {!notif.read && (
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-[var(--brand-primary)] shrink-0" />
                  )}

                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-bold text-white text-xs truncate">{notif.title}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{notif.message}</p>
                    
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-[9px] text-[var(--text-muted)]">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <div className="flex items-center gap-2">
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => {
                              handleMarkAsRead(notif.id);
                              setIsOpen(false);
                            }}
                            className="text-[9px] font-bold text-[var(--brand-primary-light)] hover:underline"
                          >
                            View
                          </Link>
                        )}
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-[9px] font-bold text-[var(--text-secondary)] hover:text-white"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2">
                <span className="text-2xl">🔔</span>
                <p className="text-xs font-semibold text-[var(--text-secondary)]">All caught up!</p>
                <p className="text-[10px] text-[var(--text-muted)]">No new notifications.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
