"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrders, updateOrderStatus } from "@/store/slices/orderSlice";
import {
  Package,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import InvoicePDF from "../../../components/orders/InvoicePDF";
import InvoiceView from "../../../components/orders/InvoiceView";
import { isFullOrderId } from "@/components/orders/orderSearch";

export default function CancelOrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, pagination, fetching, query } = useAppSelector(
    (state) => state.orders,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const searchingById = isFullOrderId(searchTerm);

  useEffect(() => {
    if (searchingById) return;
    dispatch(
      fetchOrders({ page: currentPage, limit: 10, status: "cancelled" }),
    );
  }, [dispatch, currentPage, searchingById]);

  useEffect(() => {
    if (!searchingById) return;
    dispatch(
      fetchOrders({
        page: 1,
        limit: 10,
        status: "cancelled",
        search: searchTerm,
        orderId: searchTerm,
      }),
    );
  }, [dispatch, searchTerm, searchingById]);

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
          limit: 10,
          status: "cancelled",
          search: searchTerm,
          orderId: isFullOrderId(searchTerm) ? searchTerm : undefined,
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

  const filteredOrders = orders.filter((order) => {
    if (order.status.toLowerCase() !== "cancelled") return false;

    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(search) ||
      order.user.name.toLowerCase().includes(search) ||
      order.user.email.toLowerCase().includes(search)
    );
  });

  const queryMatches =
    query?.page === currentPage &&
    query.status === "cancelled" &&
    (searchingById
      ? query.search === searchTerm && query.orderId === searchTerm
      : !query.orderId);

  if (fetching || !queryMatches) {
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
    <div className="space-y-6">
      {/* ─── Orders Table ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <XCircle size={15} strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Cancelled orders
              </h2>
              <p className="text-[11px] text-gray-500">
                {pagination?.total ?? 0}{" "}
                {(pagination?.total ?? 0) === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by order ID, name, or email…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-50"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Package size={22} className="text-gray-300" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">
              No cancelled orders found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try adjusting your search
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
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
        )}

        {/* ─── Pagination ────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs font-medium tabular-nums text-gray-500">
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
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={fetching || currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                        className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold tabular-nums transition-all ${
                          isActive
                            ? "bg-rose-600 text-white shadow-[0_1px_2px_rgba(244,63,94,0.3)]"
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
