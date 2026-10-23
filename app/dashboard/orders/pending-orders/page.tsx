"use client";

import { api } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  confirmPayment,
  ACTIVE_STATUS,
  fetchOrders,
  updateOrderStatus,
} from "@/store/slices/orderSlice";
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import Loading from "@/components/ui/loading";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Table from "@/components/ui/Table";
import { useDebouncedValue } from "@/components/utils/useDebouncedValue";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import InvoicePDF from "../../../../components/orders/InvoicePDF";
import InvoiceView from "../../../../components/orders/InvoiceView";

export default function PendingOrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, pagination, fetching, error, query } = useAppSelector(
    (state) => state.orders,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const apiStatus = statusFilter === "all" ? ACTIVE_STATUS : statusFilter;
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 200);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeOrderTotal, setActiveOrderTotal] = useState<number | null>(null);
  const [countRefresh, setCountRefresh] = useState(0);
  const [confirmingPayment, setConfirmingPayment] = useState<string | null>(
    null,
  );
  const normalizedSearch = debouncedSearchTerm.trim();
  const isSearchDebouncing = searchTerm.trim() !== normalizedSearch;
  const effectivePage = pagination
    ? Math.min(currentPage, Math.max(1, pagination.totalPages))
    : currentPage;

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
    dispatch(
      fetchOrders({
        page: effectivePage,
        limit: 20,
        status: apiStatus,
        search: normalizedSearch || undefined,
      }),
    );
  }, [dispatch, effectivePage, normalizedSearch, apiStatus]);

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
          page: effectivePage,
          limit: 20,
          status: apiStatus,
          search: normalizedSearch || undefined,
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
    return true;
  });

  const queryMatches =
    query?.page === effectivePage &&
    query.status === apiStatus &&
    query.search === (normalizedSearch || undefined);

  if (fetching || isSearchDebouncing || !queryMatches) {
    return <Loading message="Loading pending orders…" />;
  }

  const statusTabs = ["all", "pending", "confirmed", "processing", "shipped"];

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      {/* ─── Orders Table ────────────────────────────────────────── */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 md:h-8 md:w-8">
              <Package
                size={14}
                strokeWidth={2.25}
                className="md:size-[15px]"
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                Pending orders
              </h2>
              <p className="text-[11px] text-gray-500 md:text-xs">
                {activeOrderTotal === null
                  ? "Total unavailable"
                  : `${activeOrderTotal} ${
                      activeOrderTotal === 1 ? "order" : "orders"
                    }`}
              </p>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-3">
            <SearchInput
              label="Search orders by order ID"
              placeholder="Search order ID…"
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              containerClassName="relative w-full md:w-64"
              inputClassName="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 md:rounded-xl md:py-2.5 md:pl-10 md:pr-10 md:focus:ring-4 md:focus:ring-blue-50"
            />
            <div
              role="tablist"
              aria-label="Filter by status"
              className="flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50/80 p-1 md:w-fit md:rounded-xl"
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
                    className={`min-h-8 shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition-all duration-200 md:min-h-0 md:rounded-lg md:px-3.5 md:py-2 md:text-xs ${
                      isActive
                        ? "bg-white text-gray-900 ring-1 ring-inset ring-gray-100"
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
                : "No pending orders found"}
            </p>
            <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
              Try adjusting your filters or search
            </p>
          </div>
        ) : (
          <>
            {/* Mobile list – redesigned */}
            <Table view="mobile">
              <ul className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const paymentStatus = order.payment?.status;
                  const paymentTone =
                    paymentStatus === "paid"
                      ? "bg-emerald-50 text-emerald-600"
                      : paymentStatus === "pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-rose-50 text-rose-600";
                  const paymentDot =
                    paymentStatus === "paid"
                      ? "bg-emerald-500"
                      : paymentStatus === "pending"
                        ? "bg-amber-500"
                        : "bg-rose-500";

                  return (
                    <li
                      key={order.id}
                      className="min-w-0 px-3 py-3 active:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold uppercase text-blue-600">
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
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${paymentTone}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${paymentDot}`}
                          />
                          {paymentStatus ?? "N/A"}
                        </span>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <InvoiceView order={order} />
                          <InvoicePDF order={order} />
                          {paymentStatus === "pending" &&
                            order.payment?.method === "cod" && (
                              <button
                                onClick={() => handleConfirmPayment(order.id)}
                                disabled={confirmingPayment === order.id}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600 transition-colors active:scale-95 disabled:opacity-50"
                                aria-label="Confirm payment"
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
                            aria-label={`Update order ${order.id.slice(-8)} status`}
                            className="h-8 min-w-0 max-w-[110px] truncate rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-700 transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Table>

            {/* Desktop table – unchanged */}
            <Table view="desktop">
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
            </Table>
          </>
        )}

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            pagination={{
              ...pagination,
              pages: pagination.totalPages,
            }}
            currentPage={effectivePage}
            loading={fetching}
            recordLabel="orders"
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
