"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Package, Users } from "lucide-react";
import { api, type Order, type User } from "@/config/api";
import SalesChart from "@/components/sales/SalesChart";

const PAGE_SIZE = 100;
const DISPLAY_LIMIT = 5;

function newestFirst<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt ?? 0).getTime() -
      new Date(left.createdAt ?? 0).getTime(),
  );
}

export default function DashboardPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadPendingItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const [ordersResponse, firstUsersPage] = await Promise.all([
          api.getAllOrders(1, DISPLAY_LIMIT, "pending"),
          api.getUsers(1, PAGE_SIZE),
        ]);

        const users: User[] = firstUsersPage.users.filter(
          (user) => !user.isApproved && user.role !== "admin",
        );
        const totalUserPages = Number(firstUsersPage.pagination?.pages) || 1;

        for (
          let firstPageNumber = 2;
          users.length < DISPLAY_LIMIT && firstPageNumber <= totalUserPages;
          firstPageNumber += 5
        ) {
          const pageNumbers = Array.from(
            {
              length: Math.min(5, totalUserPages - firstPageNumber + 1),
            },
            (_, index) => firstPageNumber + index,
          );
          const pages = await Promise.all(
            pageNumbers.map((page) => api.getUsers(page, PAGE_SIZE)),
          );
          users.push(
            ...pages.flatMap((page) =>
              page.users.filter(
                (user) => !user.isApproved && user.role !== "admin",
              ),
            ),
          );
        }

        if (isCurrent) {
          setPendingOrders(
            newestFirst(ordersResponse.orders).slice(0, DISPLAY_LIMIT),
          );
          setPendingUsers(newestFirst(users).slice(0, DISPLAY_LIMIT));
        }
      } catch (loadError) {
        console.error("Failed to load dashboard pending items:", loadError);
        if (isCurrent) {
          setError("Unable to load pending orders and users.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    void loadPendingItems();
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <SalesChart />
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ─── Pending Orders ──────────────────────────────────────── */}
        <section className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Package size={15} strokeWidth={2.25} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Pending orders
                </h2>
              </div>
            </div>
          </header>

          <div className="px-6 py-2">
            {loading ? (
              <div
                className="space-y-2 py-2"
                aria-label="Loading pending orders"
              >
                {Array.from({ length: DISPLAY_LIMIT }, (_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="my-3 rounded-xl bg-rose-50 p-4 ring-1 ring-inset ring-rose-100">
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <Package size={22} className="text-gray-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  No pending orders
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  New orders will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="group flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold uppercase text-amber-600 ring-1 ring-inset ring-amber-100">
                        {order.user?.name?.charAt(0) || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {order.user?.name || "Customer"}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                          <Clock3 size={11} className="shrink-0" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-gray-900">
                        {Number(order.totalAmount).toLocaleString()} ৳
                      </p>
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-amber-700 ring-1 ring-inset ring-amber-200/60">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Pending Users ───────────────────────────────────────── */}
        <section className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Users size={15} strokeWidth={2.25} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Pending users
                </h2>
              </div>
            </div>
          </header>

          <div className="px-6 py-2">
            {loading ? (
              <div
                className="space-y-2 py-2"
                aria-label="Loading pending users"
              >
                {Array.from({ length: DISPLAY_LIMIT }, (_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="my-3 rounded-xl bg-rose-50 p-4 ring-1 ring-inset ring-rose-100">
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <Users size={22} className="text-gray-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  No pending users
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  New registrations will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="group flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold uppercase text-blue-600 ring-1 ring-inset ring-blue-100">
                        {user.name?.charAt(0) || "U"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
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
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/60">
                        Pending approval
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
