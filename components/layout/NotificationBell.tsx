"use client";

import { api, type AdminNotification } from "@/config/api";
import { getApiErrorMessage } from "@/config/api/client";
import { useAppSelector } from "@/store/hooks";
import { Bell, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 60_000;

const ROUTES: Partial<Record<AdminNotification["type"], string>> = {
  order: "/dashboard/orders/pending-orders",
  approval: "/dashboard/users/pending-users",
};

interface NotificationBellProps {
  variant: "desktop" | "mobile";
}

export default function NotificationBell({ variant }: NotificationBellProps) {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // The header renders both layouts; only the visible one should fetch.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsActive(query.matches === (variant === "desktop"));
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [variant]);

  const enabled = isAdmin && isActive;

  const refreshUnreadCount = useCallback(async () => {
    try {
      setUnreadCount(await api.getAdminUnreadCount());
    } catch {
      // Background refresh failures are silent; the next tick retries.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const initial = setTimeout(refreshUnreadCount, 0);
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    const onFocus = () => void refreshUnreadCount();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, refreshUnreadCount]);

  const loadPage = useCallback(async (nextPage: number) => {
    const append = nextPage > 1;
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);
    try {
      const result = await api.getAdminNotifications(nextPage, PAGE_SIZE);
      setNotifications((current) => {
        if (!append) return result.notifications;
        const seen = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...result.notifications.filter((item) => !seen.has(item.id)),
        ];
      });
      setPage(nextPage);
      setHasMore(result.hasMore);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load notifications");
      setError(message);
      if (append) toast.error(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!enabled) return null;

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) void loadPage(1);
  };

  const handleSelect = async (notification: AdminNotification) => {
    const route = ROUTES[notification.type];
    if (!notification.isRead) {
      try {
        await api.markAdminNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, "Failed to mark notification as read"),
        );
        return;
      }
    }
    if (route) {
      setIsOpen(false);
      router.push(route);
    }
  };

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 transition-colors hover:text-blue-600"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {badge}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-2 right-2 top-16 z-50 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadPage(1)}
                  className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications
              </p>
            ) : (
              <>
                <ul className="divide-y divide-gray-100">
                  {notifications.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => void handleSelect(item)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          item.isRead ? "bg-white" : "bg-blue-50/60"
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 flex-none rounded-full ${
                            item.isRead ? "bg-transparent" : "bg-blue-600"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm text-gray-800 ${
                              item.isRead ? "font-medium" : "font-semibold"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-600">
                            {item.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-gray-400">
                            {new Date(item.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => void loadPage(page + 1)}
                    disabled={isLoadingMore}
                    className="flex w-full items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {isLoadingMore && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Load more
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
