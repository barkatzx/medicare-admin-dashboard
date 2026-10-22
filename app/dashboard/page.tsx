"use client";

import SalesChart from "@/components/sales/SalesChart";
import { api, type Order, type User } from "@/config/api";
import { Clock, ShoppingCart, Users, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const PAGE_SIZE = 100;
const BATCH_SIZE = 5;
const DISPLAY_LIMIT = 5;

const isPendingCustomer = (user: User) =>
  !user.isApproved && user.role === "customer";

function newestFirst<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );
}

/** Collects pending customers, fetching extra pages until there are enough to display. */
async function fetchPendingCustomers(): Promise<User[]> {
  const firstPage = await api.getUsers(1, PAGE_SIZE);
  const users = firstPage.users.filter(isPendingCustomer);
  const totalPages = Number(firstPage.pagination?.pages) || 1;

  for (
    let start = 2;
    users.length < DISPLAY_LIMIT && start <= totalPages;
    start += BATCH_SIZE
  ) {
    const pageNumbers = Array.from(
      { length: Math.min(BATCH_SIZE, totalPages - start + 1) },
      (_, i) => start + i,
    );
    const pages = await Promise.all(
      pageNumbers.map((p) => api.getUsers(p, PAGE_SIZE)),
    );
    users.push(
      ...pages.flatMap((page) => page.users.filter(isPendingCustomer)),
    );
  }
  return users;
}

/* ------------------------------ Panel shell ------------------------------ */

function PendingPanel<T>({
  title,
  icon: Icon,
  iconClass,
  items,
  loading,
  error,
  emptyTitle,
  emptyHint,
  renderItem,
}: {
  title: string;
  icon: LucideIcon;
  iconClass: string;
  items: T[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyHint: string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <section className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white md:rounded-2xl">
      <header className="flex items-center gap-2 border-b border-gray-100 px-3 py-3 md:gap-2.5 md:px-6 md:py-4">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-8 md:w-8 ${iconClass}`}
        >
          <Icon size={14} strokeWidth={2.25} className="md:size-[15px]" />
        </span>
        <h2 className="text-sm font-semibold text-gray-900 md:text-base">
          {title}
        </h2>
      </header>

      <div className="px-3 py-1.5 md:px-6 md:py-2">
        {loading ? (
          <div
            className="space-y-2 py-2"
            aria-label={`Loading ${title.toLowerCase()}`}
          >
            {Array.from({ length: DISPLAY_LIMIT }, (_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-gray-100 md:h-14 md:rounded-xl"
              />
            ))}
          </div>
        ) : error ? (
          <div className="my-2 rounded-lg bg-rose-50 p-3 ring-1 ring-inset ring-rose-100 md:my-3 md:rounded-xl md:p-4">
            <p className="text-xs font-medium text-rose-700 md:text-sm">
              {error}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center py-6 text-center md:min-h-[200px] md:py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 md:h-12 md:w-12">
              <Icon size={18} className="text-gray-300 md:size-[22px]" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500 md:mt-4">
              {emptyTitle}
            </p>
            <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
              {emptyHint}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(renderItem)}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------- Page ---------------------------------- */

export default function DashboardPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    (async () => {
      try {
        const [ordersResponse, users] = await Promise.all([
          api.getAllOrders(1, DISPLAY_LIMIT, "pending"),
          fetchPendingCustomers(),
        ]);
        if (!isCurrent) return;
        setPendingOrders(
          newestFirst(ordersResponse.orders).slice(0, DISPLAY_LIMIT),
        );
        setPendingUsers(newestFirst(users).slice(0, DISPLAY_LIMIT));
      } catch (loadError) {
        console.error("Failed to load dashboard pending items:", loadError);
        if (isCurrent) setError("Unable to load pending orders and users.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <SalesChart />
      <div className="flex min-w-0 flex-col gap-3 md:gap-5 lg:flex-row">
        <PendingPanel
          title="Pending orders"
          icon={ShoppingCart}
          iconClass="bg-amber-50 text-amber-600"
          items={pendingOrders}
          loading={loading}
          error={error}
          emptyTitle="No pending orders"
          emptyHint="New orders will appear here"
          renderItem={(order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-2 py-3 md:gap-3 md:py-3.5"
            >
              <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold uppercase text-amber-600 md:rounded-full md:text-[11px] md:ring-1 md:ring-inset md:ring-amber-100">
                  {order.user?.name?.charAt(0) || "?"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 md:font-semibold">
                    {order.user?.name || "Customer"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                    <Clock size={10} className="shrink-0 md:size-[11px]" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold tabular-nums text-gray-900 md:text-sm">
                  {Number(order.totalAmount).toLocaleString()} ৳
                </p>
                <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-amber-600 md:px-2 md:ring-1 md:ring-inset md:ring-amber-200/60">
                  {order.status}
                </span>
              </div>
            </div>
          )}
        />

        <PendingPanel
          title="Pending users"
          icon={Users}
          iconClass="bg-blue-50 text-blue-600"
          items={pendingUsers}
          loading={loading}
          error={error}
          emptyTitle="No pending users"
          emptyHint="New registrations will appear here"
          renderItem={(user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-2 py-3 md:gap-3 md:py-3.5"
            >
              <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold uppercase text-blue-600 md:rounded-full md:text-[11px] md:ring-1 md:ring-inset md:ring-blue-100">
                  {user.name?.charAt(0) || "U"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 md:font-semibold">
                    {user.name || "Unnamed user"}
                  </p>
                  <p className="truncate text-[11px] font-medium text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-medium tabular-nums text-gray-500">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </p>
                <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 md:px-2 md:ring-1 md:ring-inset md:ring-amber-200/60">
                  Pending
                </span>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
