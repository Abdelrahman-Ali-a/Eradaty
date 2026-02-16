"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import Link from "next/link";

type Notification = {
  id: string;
  type: "payment_reminder" | "performance_alert" | "payment" | "system";
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
};

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const j = await res.json();
        setNotifications(j.notifications?.slice(0, 5) ?? []); // Show only latest 5
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      // Silently fail - don't break the UI
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    // Listen for new notification events
    const handleNewNotification = () => {
      loadNotifications();
    };
    window.addEventListener("newNotification", handleNewNotification);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("newNotification", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    loadNotifications();
  }

  async function deleteNotification(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    loadNotifications();
  }

  async function markAllAsRead() {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => 
      fetch(`/api/notifications/${n.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
    ));
    loadNotifications();
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "payment_reminder": return "bg-blue-100 text-blue-700";
      case "performance_alert": return "bg-yellow-100 text-yellow-700";
      case "payment": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 transition-colors hover:bg-accent/50 ${!notif.read ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium">{notif.title}</h4>
                              {!notif.read && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notif.id)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border p-2">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-accent"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
