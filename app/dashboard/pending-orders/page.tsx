"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { api } from "@/config/api";
import {
  fetchOrders,
  updateOrderStatus,
  confirmPayment,
} from "@/store/slices/orderSlice";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import InvoicePDF from "../../../components/orders/InvoicePDF";
import InvoiceView from "../../../components/orders/InvoiceView";
import { isFullOrderId } from "@/components/orders/orderSearch";

export default function PendingOrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, pagination, fetching, query } = useAppSelector(
    (state) => state.orders,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeOrderTotal, setActiveOrderTotal] = useState<number | null>(null);
  const [countRefresh, setCountRefresh] = useState(0);
  const [confirmingPayment, setConfirmingPayment] = useState<string | null>(
    null,
  );
  const searchingById = isFullOrderId(searchTerm);

  useEffect(() => {
    let isCurrent = true;

    const loadActiveOrderTotal = async () => {
      try {
        const statusCounts = await Promise.all(
          ["pending", "confirmed", "processing", "shipped"].map((status) =>
            api.getAllOrders(1, 1, status),
          ),
        );

        if (isCurrent) {
          setActiveOrderTotal(
            statusCounts.reduce(
              (total, response) => total + response.pagination.total,
              0,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load active order counts:", error);
        if (isCurrent) {
          toast.error("Unable to load the total active order count.");
        }
      }
    };

    void loadActiveOrderTotal();
    return () => {
      isCurrent = false;
    };
  }, [countRefresh]);

  useEffect(() => {
    if (searchingById) return;
    dispatch(
      fetchOrders({ page: currentPage, limit: 10, status: statusFilter }),
    );
  }, [dispatch, currentPage, searchingById, statusFilter]);

  useEffect(() => {
    if (!searchingById) return;
    dispatch(
      fetchOrders({
        page: 1,
        limit: 10,
        status: statusFilter,
        search: searchTerm,
        orderId: searchTerm,
      }),
    );
  }, [dispatch, searchingById, searchTerm, statusFilter]);

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
      setCountRefresh((count) => count + 1);
      dispatch(
        fetchOrders({
          page: currentPage,
          limit: 10,
          status: statusFilter,
          search: searchTerm,
          orderId: isFullOrderId(searchTerm) ? searchTerm : undefined,
        }),
      );
      window.dispatchEvent(new Event("ordersUpdated"));
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    setConfirmingPayment(orderId);
    try {
      await dispatch(confirmPayment(orderId)).unwrap();
      toast.success("Payment confirmed successfully");
      window.dispatchEvent(new Event("ordersUpdated"));
    } catch {
      toast.error("Failed to confirm payment");
    } finally {
      setConfirmingPayment(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Package size={14} className="text-amber-600" />;
      case "confirmed":
        return <CheckCircle size={14} className="text-blue-600" />;
      case "processing":
        return <Truck size={14} className="text-violet-600" />;
      case "shipped":
        return <Truck size={14} className="text-cyan-600" />;
      case "delivered":
        return <CheckCircle size={14} className="text-emerald-600" />;
      case "cancelled":
        return <XCircle size={14} className="text-rose-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 ring-amber-200/60";
      case "confirmed":
        return "bg-blue-50 text-blue-700 ring-blue-200/60";
      case "processing":
        return "bg-violet-50 text-violet-700 ring-violet-200/60";
      case "shipped":
        return "bg-cyan-50 text-cyan-700 ring-cyan-200/60";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200/60";
      case "cancelled":
        return "bg-rose-50 text-rose-700 ring-rose-200/60";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-200/60";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderStatus = order.status.toLowerCase();
    if (
      statusFilter === "all"
        ? !["pending", "confirmed", "processing", "shipped"].includes(
            orderStatus,
          )
        : orderStatus !== statusFilter
    ) {
      return false;
    }
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
    query.status === statusFilter &&
    (searchingById
      ? query.search === searchTerm && query.orderId === searchTerm
      : !query.orderId);

  if (fetching || !queryMatches) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">
            Loading pending orders…
          </p>
        </div>
      </div>
    );
  }

  const statusTabs = ["all", "pending", "confirmed", "processing", "shipped"];

  return (
    <div className="space-y-6">
      {/* ─── Orders Table ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Package size={15} strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Pending orders
              </h2>
              <p className="text-[11px] text-gray-500">
                {activeOrderTotal === null
                  ? "Total orders unavailable"
                  : `${activeOrderTotal} ${
                      activeOrderTotal === 1 ? "order" : "orders"
                    }`}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
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
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <div
              role="tablist"
              aria-label="Filter by status"
              className="inline-flex w-fit items-center gap-1 self-start rounded-xl border border-gray-100 bg-gray-50/80 p-1 sm:self-auto"
            >
              {statusTabs.map((status) => {
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize transition-all duration-200 ${
                      isActive
                        ? "bg-white text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-inset ring-gray-100"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Package size={22} className="text-gray-300" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">
              No pending orders found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try adjusting your filters or search
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
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold uppercase text-blue-600 ring-1 ring-inset ring-blue-100">
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            order.payment?.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                              : order.payment?.status === "pending"
                                ? "bg-amber-50 text-amber-700 ring-amber-200/60"
                                : "bg-rose-50 text-rose-700 ring-rose-200/60"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              order.payment?.status === "paid"
                                ? "bg-emerald-500"
                                : order.payment?.status === "pending"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }`}
                          />
                          {order.payment?.status ?? "N/A"}
                        </span>
                      </div>
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

                        {order.payment?.status === "pending" &&
                          order.payment?.method === "cod" && (
                            <button
                              onClick={() => handleConfirmPayment(order.id)}
                              disabled={confirmingPayment === order.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-600 ring-1 ring-inset ring-pink-100 transition-all hover:bg-pink-100 disabled:opacity-50"
                              title="Confirm Payment"
                            >
                              <CreditCard size={14} />
                            </button>
                          )}

                        <select
                          value={order.status.toLowerCase()}
                          onChange={(e) =>
                            handleStatusUpdate(order.id, e.target.value)
                          }
                          disabled={updatingStatus === order.id}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
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
                            ? "bg-blue-600 text-white shadow-[0_1px_2px_rgba(37,99,235,0.3)]"
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
