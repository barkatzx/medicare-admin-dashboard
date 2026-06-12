"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
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
  DollarSign,
  ShoppingBag,
  CreditCard,
  Clock,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import InvoicePDF from "../../../components/orders/InvoicePDF";
import InvoiceView from "../../../components/orders/InvoiceView";
import { api, DashboardData } from "@/config/api";

export default function PendingOrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, pagination, loading } = useAppSelector(
    (state) => state.orders,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState<string | null>(
    null,
  );
  const [dashboardStats, setDashboardStats] = useState<DashboardData | null>(
    null,
  );

  useEffect(() => {
    dispatch(
      fetchOrders({ page: currentPage, limit: 10, status: statusFilter }),
    );
  }, [dispatch, currentPage, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardData();
      setDashboardStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await dispatch(
        updateOrderStatus({ orderId, status: newStatus }),
      ).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
      fetchStats(); // Refresh stats after update
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
      fetchStats();
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
        return <Package size={16} className="text-yellow-600" />;
      case "confirmed":
        return <CheckCircle size={16} className="text-blue-600" />;
      case "processing":
        return <Truck size={16} className="text-purple-600" />;
      case "shipped":
        return <Truck size={16} className="text-indigo-600" />;
      case "delivered":
        return <CheckCircle size={16} className="text-green-600" />;
      case "cancelled":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-purple-100 text-purple-700";
      case "shipped":
        return "bg-indigo-100 text-indigo-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const status = order.status.toLowerCase();
    if (status === "delivered" || status === "cancelled") return false;

    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(search) ||
      order.user.name.toLowerCase().includes(search) ||
      order.user.email.toLowerCase().includes(search)
    );
  });

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading pending orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Showing Today's Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Today's Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardStats?.today.orders ?? 0}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp
                  size={12}
                  className={
                    dashboardStats?.growth.daily &&
                    dashboardStats.growth.daily > 0
                      ? "text-green-500"
                      : "text-gray-400"
                  }
                />
                <p className="text-[10px] text-gray-400">
                  Daily growth: {dashboardStats?.growth.daily.toFixed(1) ?? 0}%
                </p>
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Today's Revenue
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ৳{(dashboardStats?.today.sales ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Items Ordered</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {dashboardStats?.today.items ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Action Required
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {filteredOrders.length}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Pending processing
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search pending orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "processing", "shipped"].map(
            (status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            Active Order List ({filteredOrders.length})
          </h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No pending orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    Amount
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    Payment
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-6">
                      <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        #{order.id.slice(-8)}
                      </code>
                    </td>
                    <td className="py-3 px-6">
                      <p className="font-medium text-gray-900">
                        {order.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user.phone_number}
                      </p>
                    </td>
                    <td className="py-3 px-6">
                      <span className="font-bold text-gray-900">
                        {parseFloat(order.totalAmount).toLocaleString()} ৳
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            order.payment?.status === "paid"
                              ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                              : order.payment?.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200"
                                : "bg-red-100 text-red-700 ring-1 ring-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.payment?.status === "paid"
                                ? "bg-green-500"
                                : order.payment?.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                          {order.payment?.status ?? "N/A"}
                        </span>
                        {order.payment?.method && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                            <span className="text-xs text-gray-500 capitalize">
                              {order.payment.method}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <InvoiceView order={order} />
                        <InvoicePDF order={order} />
                        {order.payment?.status === "pending" &&
                          order.payment?.method === "cod" && (
                            <button
                              onClick={() => handleConfirmPayment(order.id)}
                              disabled={confirmingPayment === order.id}
                              className="p-2 bg-pink-100 text-pink-600 hover:bg-pink-200 rounded-lg transition-colors disabled:opacity-50"
                              title="Confirm Payment"
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                        <select
                          value={order.status.toLowerCase()}
                          onChange={(e) =>
                            handleStatusUpdate(order.id, e.target.value)
                          }
                          disabled={updatingStatus === order.id}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} orders
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100 text-gray-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
