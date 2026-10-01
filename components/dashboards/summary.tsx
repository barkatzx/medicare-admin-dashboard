// src/components/dashboard/SalesByStatus.tsx
"use client";

import { api } from "@/config/api";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StatusData {
  status: string;
  totalSales: number;
  totalOrders: number;
}

interface SalesByStatusData {
  sales_by_status: StatusData[];
}

const STATUS_CONFIG: Record<
  string,
  { icon: any; color: string; bgColor: string; label: string }
> = {
  delivered: {
    icon: CheckCircle,
    color: "#10b981",
    bgColor: "bg-green-50",
    label: "Delivered",
  },
  pending: {
    icon: Clock,
    color: "#f59e0b",
    bgColor: "bg-yellow-50",
    label: "Pending",
  },
  confirmed: {
    icon: CheckCircle,
    color: "#3b82f6",
    bgColor: "bg-blue-50",
    label: "Confirmed",
  },
  processing: {
    icon: Truck,
    color: "#8b5cf6",
    bgColor: "bg-purple-50",
    label: "Processing",
  },
  shipped: {
    icon: Truck,
    color: "#06b6d4",
    bgColor: "bg-cyan-50",
    label: "Shipped",
  },
  cancelled: {
    icon: XCircle,
    color: "#ef4444",
    bgColor: "bg-red-50",
    label: "Cancelled",
  },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const config = STATUS_CONFIG[data.status];
    const Icon = config?.icon || Package;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[200px] animate-fade-in">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <div className={`p-1.5 rounded-lg ${config?.bgColor}`}>
            <Icon size={14} className="text-gray-700" />
          </div>
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {data.status}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Revenue</span>
            <span className="text-sm font-semibold text-gray-900">
              ৳{data.totalSales.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Orders</span>
            <span className="text-sm font-semibold text-gray-900">
              {data.totalOrders}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500">Average Value</span>
            <span className="text-sm font-semibold text-blue-600">
              ৳{(data.totalSales / (data.totalOrders || 1)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function Summary() {
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getSalesSummary();
      const statusData = response.sales_by_status.filter(
        (s: StatusData) => s.totalSales > 0 || s.totalOrders > 0,
      );
      setData(statusData);
    } catch (error) {
      console.error("Failed to fetch sales by status:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.totalSales, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.totalOrders, 0);
  const completedOrders =
    data.find((s) => s.status === "delivered")?.totalOrders || 0;
  const completionRate =
    totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-gray-100">
        <Package size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">No sales data available</p>
        <p className="text-sm text-gray-400 mt-1">
          Sales by status will appear here
        </p>
      </div>
    );
  }

  const pieData = data.map((item) => ({
    name: item.status,
    value: item.totalSales,
    status: item.status,
    totalSales: item.totalSales,
    totalOrders: item.totalOrders,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl">
            <CreditCard size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sales by Status
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Revenue distribution across order statuses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setChartType("pie")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              chartType === "pie"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Pie Chart
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              chartType === "bar"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            ৳{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Completion Rate</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {completionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-2xl p-6 border border-gray-100">
        {chartType === "pie" ? (
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_CONFIG[entry.status]?.color || "#9ca3af"}
                      opacity={
                        hoveredIndex === index || hoveredIndex === null
                          ? 1
                          : 0.6
                      }
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-xs text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold text-gray-800">
                ৳{totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {data.length} statuses
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f3f4f6" }}
              />
              <Bar dataKey="totalSales" radius={[8, 8, 0, 0]} maxBarSize={80}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_CONFIG[entry.status]?.color || "#9ca3af"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3">
        {data.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const Icon = config?.icon || Package;
          const percentage =
            totalRevenue > 0 ? (item.totalSales / totalRevenue) * 100 : 0;
          return (
            <div
              key={item.status}
              className="group relative overflow-hidden rounded-xl p-3 border border-gray-100 bg-white transition-all cursor-pointer flex-1 min-w-[140px]"
              onMouseEnter={() => setSelectedStatus(item.status)}
              onMouseLeave={() => setSelectedStatus(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${config?.bgColor}`}>
                  <Icon size={14} className="text-gray-700" />
                </div>
                <span className="text-xs font-medium capitalize text-gray-600">
                  {item.status}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ৳{item.totalSales.toLocaleString()}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {item.totalOrders} orders
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: config?.color || "#9ca3af",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
