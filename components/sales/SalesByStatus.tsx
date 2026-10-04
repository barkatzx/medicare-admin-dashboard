"use client";

import type { SalesStatus } from "@/config/api";
import { BarChart3, Package, PieChart as PieIcon } from "lucide-react";
import { useState } from "react";
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
import { formatSalesCurrency, formatSalesNumber } from "./salesFormatters";

interface SalesByStatusProps {
  data: SalesStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const FALLBACK_STATUS_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type TabKey = "pie" | "bar";

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #f3f4f6",
  boxShadow: "0 4px 12px rgba(16,24,40,0.08)",
  fontSize: 12,
  padding: "8px 12px",
} as const;

export default function SalesByStatus({ data }: SalesByStatusProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("pie");

  const chartData = data.map((status, index) => ({
    ...status,
    color:
      STATUS_COLORS[status.status.toLowerCase()] ??
      FALLBACK_STATUS_COLORS[index % FALLBACK_STATUS_COLORS.length],
  }));

  const totalOrders = chartData.reduce(
    (sum, status) => sum + status.totalOrders,
    0,
  );
  const totalSales = chartData.reduce(
    (sum, status) => sum + status.totalSales,
    0,
  );

  const tabs: { key: TabKey; label: string; icon: typeof PieIcon }[] = [
    { key: "pie", label: "Order mix", icon: PieIcon },
    { key: "bar", label: "Sales value", icon: BarChart3 },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Sales by status
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Distribution and revenue across order statuses
          </p>
        </div>

        {chartData.length > 0 && (
          <div
            role="tablist"
            aria-label="Sales by status view"
            className="inline-flex w-fit items-center rounded-full bg-gray-100 p-1"
          >
            {tabs.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`panel-${key}`}
                  id={`tab-${key}`}
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon size={14} strokeWidth={2.25} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Package size={22} className="text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            No sales-by-status data available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Data will appear once orders are processed
          </p>
        </div>
      ) : (
        <div className="mt-8">
          {/* Chart canvas */}
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="relative h-[280px]"
          >
            {activeTab === "pie" ? (
              <>
                {/* Half-donut gauge */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="totalOrders"
                      nameKey="status"
                      cx="50%"
                      cy="92%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={112}
                      outerRadius={160}
                      paddingAngle={2}
                      cornerRadius={6}
                      stroke="none"
                    >
                      {chartData.map((status) => (
                        <Cell key={status.status} fill={status.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [
                        formatSalesNumber(Number(value)),
                        `${titleCase(String(name))} orders`,
                      ]}
                      labelFormatter={(label) => titleCase(String(label))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-col items-center">
                  <span className="text-5xl font-bold tabular-nums tracking-tight text-gray-900">
                    {formatSalesNumber(totalOrders)}
                  </span>
                  <span className="mt-1 text-sm text-gray-500">
                    total orders ·{" "}
                    <span className="font-medium tabular-nums text-gray-700">
                      {formatSalesCurrency(totalSales)}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid
                    stroke="#f3f4f6"
                    vertical={false}
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="status"
                    tickFormatter={(value: string) => titleCase(value)}
                    tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    width={56}
                    tickFormatter={(value: number) =>
                      value >= 1000
                        ? `৳${(value / 1000).toLocaleString("en-US")}k`
                        : `৳${formatSalesNumber(value)}`
                    }
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickCount={5}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [
                      formatSalesCurrency(Number(value)),
                      "Revenue",
                    ]}
                    labelFormatter={(label) => titleCase(String(label))}
                    cursor={{ fill: "rgba(249, 250, 251, 0.9)" }}
                  />
                  <Bar
                    dataKey="totalSales"
                    name="Sales"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={48}
                  >
                    {chartData.map((status) => (
                      <Cell key={status.status} fill={status.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status tiles */}
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3 sm:grid-cols-3">
            {chartData.map((status) => {
              const value =
                activeTab === "pie" ? status.totalOrders : status.totalSales;
              const total = activeTab === "pie" ? totalOrders : totalSales;
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;

              return (
                <div
                  key={status.status}
                  className="rounded-xl border border-gray-100 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="truncate text-xs font-medium capitalize text-gray-600">
                        {status.status}
                      </span>
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-gray-400">
                      {pct}%
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-gray-900">
                    {activeTab === "pie"
                      ? formatSalesNumber(value)
                      : formatSalesCurrency(value)}
                  </p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
