"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts } from "@/store/slices/productSlice";
import { fetchUsers } from "@/store/slices/userSlice";
import { fetchOrders } from "@/store/slices/orderSlice";
import Card from "@/components/ui/Card";
import DashboardStats from "@/components/dashboards/DashboardStats";
import dynamic from "next/dynamic";
import {
  ShoppingBag,
  ChevronRight,
  Calendar,
  Package,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Summary from "@/components/dashboards/summary";

const SalesChart = dynamic(() => import("@/components/charts/SalesChart"), {
  loading: () => <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />,
  ssr: false,
});

const TopProductsChart = dynamic(
  () => import("@/components/charts/TopProductsChart"),
  {
    loading: () => (
      <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
    ),
    ssr: false,
  },
);

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.products);
  const { users } = useAppSelector((state) => state.users);
  const { orders } = useAppSelector((state) => state.orders);
  const { statsData } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    Promise.all([
      dispatch(fetchProducts({ page: 1, limit: 20 })).unwrap(),
      dispatch(fetchUsers({ page: 1, limit: 20 })).unwrap(),
      dispatch(fetchOrders({ page: 1, limit: 10 })).unwrap(),
    ]).catch((err) => console.error("Background fetch error:", err));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <SalesChart />
      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <Summary />
        </Card>
        <Card className="col-span-1">
          <TopProductsChart />
        </Card>
      </div>

      <Card className="overflow-hidden border-0 rounded-xl">
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <ShoppingBag size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Latest 5 transactions
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto border-l border-r border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.slice(0, 5).map((order, idx) => (
                <tr
                  key={order.id}
                  className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-mono font-semibold">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <code className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                        #{order.id.slice(-8)}
                      </code>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                        {order.user?.name?.charAt(0) || "U"}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {order.user?.name || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-sm font-semibold text-gray-900">
                      {parseFloat(order.totalAmount).toLocaleString()} ৳
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    {/* FIX: moved conditional classes into a proper expression */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset transition-all ${
                        order.status === "completed" ||
                        order.status === "delivered"
                          ? "bg-green-50 text-green-700 ring-green-200"
                          : order.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
                            : order.status === "cancelled"
                              ? "bg-red-50 text-red-700 ring-red-200"
                              : "bg-gray-50 text-gray-700 ring-gray-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          order.status === "completed" ||
                          order.status === "delivered"
                            ? "bg-green-500"
                            : order.status === "pending"
                              ? "bg-yellow-500"
                              : order.status === "cancelled"
                                ? "bg-red-500"
                                : "bg-gray-500"
                        }`}
                      />
                      {order.status === "delivered"
                        ? "Delivered"
                        : order.status}
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Package size={12} />
                Total: {orders.length} orders
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={12} />
                Avg: ৳
                {(
                  orders.reduce(
                    (sum, o) => sum + parseFloat(o.totalAmount),
                    0,
                  ) / orders.length || 0
                ).toFixed(0)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Updated just now</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
