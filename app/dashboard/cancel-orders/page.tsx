"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchOrders,
  updateOrderStatus,
} from "@/store/slices/orderSlice";
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

export default function CancelOrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, pagination, loading } = useAppSelector(
    (state) => state.orders,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch cancelled orders
    dispatch(
      fetchOrders({ page: currentPage, limit: 10, status: "cancelled" }),
    );
  }, [dispatch, currentPage]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await dispatch(
        updateOrderStatus({ orderId, status: newStatus }),
      ).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.toLowerCase() === "cancelled") {
      return <XCircle size={16} className="text-red-600" />;
    }
    return <Package size={16} className="text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === "cancelled") {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
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

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading cancelled orders...</p>
        </div>
      </div>
    );
  }

  const totalCancelledValue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Cancelled Orders</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {pagination?.total ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Total cancellations</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Lost Revenue Est.</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ৳{totalCancelledValue.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">From current view</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
          </div>
        </div>

      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search cancelled orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <XCircle size={20} className="text-red-600" />
            Cancelled Orders List ({filteredOrders.length})
          </h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No cancelled orders found</p>
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
                      <span className="text-sm text-gray-600">
                        {order.payment?.method?.toUpperCase() ?? "N/A"}
                      </span>
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
