"use client";

import { api, type AdminNotification } from "@/config/api";
import { getApiErrorMessage } from "@/config/api/client";
import { useAppSelector } from "@/store/hooks";
import {
  getPushStatus,
  listenForForegroundMessages,
  requestPushPermission,
  syncPushToken,
  type PushStatus,
} from "@/config/push";
import {
  AlertCircle,
  Bell,
  BellRing,
  Inbox,
  Loader2,
  ShoppingCart,
  UserCheck,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 60_000;

const ROUTES: Partial<Record<AdminNotification["type"], string>> = {
  order: "/dashboard/orders/pending-orders",
  approval: "/dashboard/users/pending-users",
};

const SOUND_KEY = "adminNotificationSound";

/* ----------------------- Display-only helpers (UI) ---------------------- */

const TYPE_STYLES: Record<string, { icon: LucideIcon; wrap: string }> = {
  order: { icon: ShoppingCart, wrap: "bg-blue-50 text-blue-600" },
  approval: { icon: UserCheck, wrap: "bg-amber-50 text-amber-600" },
};
const DEFAULT_TYPE_STYLE = { icon: Bell, wrap: "bg-gray-100 text-gray-600" };

function formatRelative(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);
  const seenIdsRef = useRef(new Set<string>());
  const soundEnabledRef = useRef(true);
  const isOpenRef = useRef(false);

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
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const stored = localStorage.getItem(SOUND_KEY) !== "off";
    soundEnabledRef.current = stored;
    const id = setTimeout(() => setSoundEnabled(stored), 0);
    return () => clearTimeout(id);
  }, []);

  // Browsers only allow audio after a user gesture, so unlock on first interaction.
  useEffect(() => {
    if (!enabled) return;
    const unlock = () => {
      try {
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume();
      } catch {
        // Audio unsupported; notifications still work silently.
      }
    };
    // iOS/Android only treat click/touchend/keydown as audio-unlocking gestures.
    const events = ["pointerdown", "click", "touchend", "keydown"] as const;
    const handler = () => {
      unlock();
      if (audioRef.current?.state === "running") {
        events.forEach((e) => window.removeEventListener(e, handler));
      }
    };
    events.forEach((e) => window.addEventListener(e, handler));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [enabled]);

  const playSound = useCallback(() => {
    const ctx = audioRef.current;
    if (!soundEnabledRef.current || !ctx || ctx.state !== "running") return;
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + index * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.3);
    });
  }, []);

  // Detect support, silently register when permission was already granted.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void getPushStatus().then((status) => {
      if (cancelled) return;
      setPushStatus(status);
      if (status === "granted") {
        syncPushToken().catch((err) =>
          console.warn("Push registration failed", err),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || pushStatus !== "granted") return;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = listenForForegroundMessages((payload) => {
        const id = payload.data?.notificationId;
        if (id) {
          if (seenIdsRef.current.has(id)) return;
          seenIdsRef.current.add(id);
        }
        playSound();
        // FCM only auto-displays in the background; cover a hidden-but-alive page.
        if (document.visibilityState === "hidden" && payload.notification) {
          void navigator.serviceWorker.ready.then((reg) =>
            reg.showNotification(payload.notification?.title || "MediCarePLC", {
              body: payload.notification?.body,
              icon: "/icon-192x192.png",
              data: payload.data,
            }),
          );
        }
        void refreshUnreadCount();
        if (isOpenRef.current) void loadPage(1);
      });
    } catch (err) {
      console.warn("Foreground push listener failed", err);
    }
    return () => unsubscribe?.();
  }, [enabled, pushStatus, playSound, refreshUnreadCount, loadPage]);

  // The service worker asks an already-open window to navigate on click.
  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK" && event.data.url) {
        router.push(event.data.url);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [enabled, router]);

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

  const enablePush = async () => {
    setIsEnablingPush(true);
    try {
      const permission = await requestPushPermission();
      setPushStatus(permission);
      if (permission === "granted") {
        await syncPushToken();
        toast.success("Push notifications enabled");
      }
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Failed to enable push notifications"),
      );
    } finally {
      setIsEnablingPush(false);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    localStorage.setItem(SOUND_KEY, next ? "on" : "off");
  };

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={toggle}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          isOpen
            ? "border-blue-200 text-blue-600 shadow-sm"
            : "border-gray-100 text-gray-600 hover:border-gray-200 hover:text-blue-600"
        }`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
            {badge}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-2 right-2 top-16 z-50 flex max-h-[calc(100vh-5rem)] origin-top-right flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[400px]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={
                soundEnabled
                  ? "Mute notification sound"
                  : "Unmute notification sound"
              }
              title={soundEnabled ? "Sound on" : "Sound off"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          {/* Push prompts */}
          {pushStatus === "default" && (
            <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/60 px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                  <BellRing size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Never miss an update
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                    Get alerts for new orders and approval requests, even when
                    the dashboard is closed.
                  </p>
                  <button
                    type="button"
                    onClick={() => void enablePush()}
                    disabled={isEnablingPush}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isEnablingPush && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {isEnablingPush
                      ? "Enabling..."
                      : "Enable push notifications"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {pushStatus === "denied" && (
            <div className="flex shrink-0 items-start gap-2 border-b border-gray-100 bg-amber-50/60 px-4 py-2.5">
              <AlertCircle
                size={14}
                className="mt-0.5 flex-none text-amber-600"
              />
              <p className="text-xs leading-relaxed text-gray-600">
                Push notifications are blocked. Allow them in your browser or
                device settings to receive alerts.
              </p>
            </div>
          )}

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <ul className="divide-y divide-gray-100" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="flex animate-pulse items-start gap-3 px-4 py-3.5"
                  >
                    <span className="h-9 w-9 flex-none rounded-full bg-gray-100" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-2/3 rounded bg-gray-100" />
                      <span className="block h-3 w-full rounded bg-gray-100" />
                      <span className="block h-2.5 w-1/4 rounded bg-gray-100" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : error && notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertCircle size={20} />
                </span>
                <p className="text-sm font-medium text-gray-900">
                  Couldn&apos;t load notifications
                </p>
                <p className="mt-1 text-xs text-gray-500">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadPage(1)}
                  className="mt-4 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Inbox size={22} />
                </span>
                <p className="text-sm font-medium text-gray-900">
                  You&apos;re all caught up
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  New orders and approval requests will show up here.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-100">
                  {notifications.map((item) => {
                    const style = TYPE_STYLES[item.type] ?? DEFAULT_TYPE_STYLE;
                    const TypeIcon = style.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => void handleSelect(item)}
                          className={`group relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors focus:outline-none focus-visible:bg-gray-50 ${
                            item.isRead
                              ? "bg-white hover:bg-gray-50"
                              : "bg-blue-50/50 hover:bg-blue-50"
                          }`}
                        >
                          {!item.isRead && (
                            <span className="absolute left-0 top-0 h-full w-0.5 bg-blue-600" />
                          )}
                          <span
                            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${style.wrap} ${
                              item.isRead ? "opacity-70" : ""
                            }`}
                          >
                            <TypeIcon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span
                                className={`block text-sm leading-snug text-gray-900 ${
                                  item.isRead ? "font-medium" : "font-semibold"
                                }`}
                              >
                                {item.title}
                              </span>
                              <time
                                dateTime={item.createdAt}
                                title={new Date(item.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  },
                                )}
                                className="flex-none pt-0.5 text-[11px] text-gray-400"
                              >
                                {formatRelative(item.createdAt)}
                              </time>
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[13px] leading-relaxed text-gray-600">
                              {item.message}
                            </span>
                          </span>
                          {!item.isRead && (
                            <span className="mt-2 h-2 w-2 flex-none rounded-full bg-blue-600" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {hasMore && (
                  <div className="border-t border-gray-100 p-2">
                    <button
                      type="button"
                      onClick={() => void loadPage(page + 1)}
                      disabled={isLoadingMore}
                      className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-60"
                    >
                      {isLoadingMore && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      {isLoadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
