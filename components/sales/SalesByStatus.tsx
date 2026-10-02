"use client";

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
import { BarChart3, Package, PieChart as PieIcon } from "lucide-react";
import type { SalesStatus } from "@/config/api";
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
  border: "1px solid #f1f5f9",
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
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">
            Order health
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">
            Sales by status
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Distribution and revenue across order statuses
          </p>
        </div>

        {chartData.length > 0 && (
          <div className="hidden items-center gap-6 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Orders
              </p>
              <p className="mt-0.5 text-base font-semibold tabular-nums tracking-tight text-gray-900">
                {formatSalesNumber(totalOrders)}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Revenue
              </p>
              <p className="mt-0.5 text-base font-semibold tabular-nums tracking-tight text-gray-900">
                {formatSalesCurrency(totalSales)}
              </p>
            </div>
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 text-center">
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left — Tabbed chart panel */}
          <div className="min-w-0">
            {/* Tab switcher */}
            <div
              role="tablist"
              aria-label="Sales by status view"
              className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1"
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
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-white text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-inset ring-gray-100"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2.25} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Chart canvas */}
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="relative mt-4 h-[340px]"
            >
              {activeTab === "pie" ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="totalOrders"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={2}
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
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Total
                    </span>
                    <span className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-gray-900">
                      {formatSalesNumber(totalOrders)}
                    </span>
                    <span className="mt-0.5 text-[11px] font-medium text-gray-400">
                      orders
                    </span>
                  </div>
                </>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid
                      stroke="#f1f5f9"
                      horizontal={false}
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(value: number) =>
                        value >= 1000
                          ? `৳${(value / 1000).toLocaleString("en-US")}k`
                          : `৳${formatSalesNumber(value)}`
                      }
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickCount={5}
                    />
                    <YAxis
                      type="category"
                      dataKey="status"
                      width={90}
                      tickFormatter={(value: string) => titleCase(value)}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => [
                        formatSalesCurrency(Number(value)),
                        "Revenue",
                      ]}
                      labelFormatter={(label) => titleCase(String(label))}
                      cursor={{ fill: "rgba(248, 250, 252, 0.8)" }}
                    />
                    <Bar
                      dataKey="totalSales"
                      name="Sales"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={28}
                    >
                      {chartData.map((status) => (
                        <Cell key={status.status} fill={status.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right — Legend / breakdown list */}
          <aside className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {activeTab === "pie" ? "Order mix" : "Sales value"}
              </p>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                {activeTab === "pie" ? "Orders" : "Revenue"}
              </span>
            </div>

            <div className="space-y-1">
              {chartData.map((status) => {
                const value =
                  activeTab === "pie" ? status.totalOrders : status.totalSales;
                const total = activeTab === "pie" ? totalOrders : totalSales;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;

                return (
                  <div
                    key={status.status}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium capitalize text-gray-600">
                      {status.status}
                    </span>
                    <span className="w-9 text-right text-[11px] tabular-nums text-gray-400">
                      {pct}%
                    </span>
                    <span className="w-20 text-right text-xs font-semibold tabular-nums text-gray-900">
                      {activeTab === "pie"
                        ? formatSalesNumber(value)
                        : formatSalesCurrency(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
