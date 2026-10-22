"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrders, updateOrderStatus } from "@/store/slices/orderSlice";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import InvoicePDF from "../../../../components/orders/InvoicePDF";
import InvoiceView from "../../../../components/orders/InvoiceView";

export default function CancelOrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, pagination, fetching, error, query } = useAppSelector(
    (state) => state.orders,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const normalizedSearch = debouncedSearchTerm.trim();
  const isSearchDebouncing = searchTerm.trim() !== normalizedSearch;

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      fetchOrders({
        page: currentPage,
        limit: 20,
        status: "cancelled",
        search: normalizedSearch || undefined,
      }),
    );
  }, [dispatch, currentPage, normalizedSearch]);

  useEffect(() => {
    if (pagination && currentPage > pagination.totalPages) {
      setCurrentPage(Math.max(1, pagination.totalPages));
    }
  }, [currentPage, pagination]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await dispatch(
        updateOrderStatus({ orderId, status: newStatus }),
      ).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
      dispatch(
        fetchOrders({
          page: currentPage,
          limit: 20,
          status: "cancelled",
          search: normalizedSearch || undefined,
        }),
      );
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.toLowerCase() === "cancelled") {
      return <XCircle size={14} className="text-rose-600" />;
    }
    return <Package size={14} className="text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === "cancelled") {
      return "bg-rose-50 text-rose-700 ring-rose-200/60";
    }
    return "bg-gray-50 text-gray-700 ring-gray-200/60";
  };

  const filteredOrders = orders.filter(
    (order) => order.status.toLowerCase() === "cancelled",
  );

  const queryMatches =
    query?.page === currentPage &&
    query.status === "cancelled" &&
    query.search === (normalizedSearch || undefined);

  if (fetching || isSearchDebouncing || !queryMatches) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-[3px] border-rose-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">
            Loading cancelled orders…
          </p>
        </div>
      </div>
    );
  }

  const totalCancelledValue = filteredOrders.reduce(
    (sum, order) => sum + parseFloat(order.totalAmount),
    0,
  );

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      {/* ─── Orders Table ────────────────────────────────────────── */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 md:h-8 md:w-8">
              <XCircle
                size={14}
                strokeWidth={2.25}
                className="md:size-[15px]"
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                Cancelled orders
              </h2>
              <p className="text-[11px] text-gray-500 md:text-xs">
                {pagination?.total ?? 0}{" "}
                {(pagination?.total ?? 0) === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
          <div className="relative w-full min-w-0 md:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search order ID…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 md:rounded-xl md:py-2.5 md:pl-10 md:pr-4 md:focus:ring-4 md:focus:ring-rose-50"
            />
          </div>
        </div>

        {error ? (
          <div
            className="flex min-h-[240px] items-center justify-center px-4 text-center text-xs text-rose-600 md:min-h-[280px] md:px-6 md:text-sm"
            role="alert"
          >
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[280px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Package size={22} className="text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500 md:mt-4">
              {normalizedSearch
                ? "No orders found for this Order ID."
                : "No cancelled orders found"}
            </p>
            <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
              Try adjusting your search
            </p>
          </div>
        ) : (
          <>
            {/* Mobile list – redesigned */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {filteredOrders.map((order) => (
                <li
                  key={order.id}
                  className="min-w-0 px-3 py-3 active:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-xs font-bold uppercase text-rose-600">
                      {order.user.name?.charAt(0) ?? "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {order.user.name}
                        </p>
                        <code className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-500">
                          #{order.id.slice(-6)}
                        </code>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {order.user.phone_number}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums text-gray-900">
                          {parseFloat(order.totalAmount).toLocaleString()} ৳
                        </span>
                        <span className="flex items-center gap-1 text-[10px] tabular-nums text-gray-400">
                          <Calendar size={9} className="shrink-0" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${getStatusColor(order.status)}`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-50 pt-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {order.payment?.method?.toUpperCase() ?? "N/A"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <InvoiceView order={order} />
                      <InvoicePDF order={order} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table – unchanged */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3">Order ID</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="group transition-colors hover:bg-gray-50/80"
                    >
                      <td className="px-6 py-4">
                        <code className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700 transition-colors group-hover:bg-white">
                          #{order.id.slice(-8)}
                        </code>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[11px] font-bold uppercase text-rose-600 ring-1 ring-inset ring-rose-100">
                            {order.user.name?.charAt(0) ?? "?"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {order.user.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {order.user.phone_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold tabular-nums text-gray-900">
                          {parseFloat(order.totalAmount).toLocaleString()} ৳
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          {order.payment?.method?.toUpperCase() ?? "N/A"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium tabular-nums text-gray-500">
                          <Calendar size={13} />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <InvoiceView order={order} />
                          <InvoicePDF order={order} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ─── Pagination – compact on mobile ──────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium tabular-nums text-gray-500 sm:text-xs">
                <span className="hidden sm:inline">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {pagination.total}
                  </span>{" "}
                  orders
                </span>
                <span className="sm:hidden">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total}
                </span>
              </p>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={fetching || currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const startPage = Math.max(
                      1,
                      Math.min(currentPage - 2, pagination.totalPages - 4),
                    );
                    const pageNum = startPage + i;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={fetching}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums transition-all md:h-8 md:min-w-8 ${
                          isActive
                            ? "bg-rose-600 text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                  disabled={fetching || currentPage === pagination.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
