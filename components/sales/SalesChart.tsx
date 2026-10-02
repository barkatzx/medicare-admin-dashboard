// src/components/dashboard/SalesChart.tsx
"use client";

import { useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSalesData } from "@/store/slices/salesSlice";
import { useState } from "react";
import { Loader2, TrendingUp, ShoppingCart, Package, Star } from "lucide-react";

type Period = "daily" | "weekly" | "monthly" | "yearly";
type ChartType = "area" | "composed";

interface ChartDataItem {
  label: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
  itemsSold: number;
}

// ─── Tooltip ────────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-gray-100 rounded-xl shadow-xl p-4 min-w-[180px]">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {label}
      </p>
      {payload.map((entry: any) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-6 mb-1.5"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-900">
            {entry.dataKey === "sales" || entry.dataKey === "avgOrderValue"
              ? `৳${Number(entry.value).toLocaleString()}`
              : Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  gradient,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  icon: React.ElementType;
}) => (
  <div className={`rounded-2xl p-4 ${gradient}`}>
    <div className="flex items-center justify-between mb-3">
      <Icon size={18} className="text-white/80" />
      {sub && (
        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
          {sub}
        </span>
      )}
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
    <p className="text-xs text-white/70 mt-0.5">{label}</p>
  </div>
);

// ─── Period Button ────────────────────────────────────────────────────────────

const PeriodBtn = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
      active
        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
        : "text-gray-500 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesChart() {
  const dispatch = useAppDispatch();
  const { salesData, loading } = useAppSelector((state) => state.sales);

  const [period, setPeriod] = useState<Period>("weekly");
  const [chartType, setChartType] = useState<ChartType>("area");

  useEffect(() => {
    dispatch(fetchSalesData(period));
  }, [dispatch, period]);

  // For daily, API returns a single object — wrap it so the chart always gets an array
  const chartData: ChartDataItem[] = useMemo(() => {
    const raw = salesData[period];
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    // daily: single object
    return [raw as ChartDataItem];
  }, [salesData, period]);

  const totalRevenue = chartData.reduce((s, d) => s + d.sales, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);
  const totalItems = chartData.reduce((s, d) => s + d.itemsSold, 0);
  const bestSales = Math.max(...chartData.map((d) => d.sales), 0);
  const avgRevenue = chartData.length ? totalRevenue / chartData.length : 0;

  const periodLabel = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year",
  }[period];

  const isLoading = loading && !chartData.length;

  return (
    <div className="rounded-2xl border border-gray-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Sales Overview With Analysis
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{periodLabel}</p>
        </div>

        {/* Period Tabs */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
          {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
            <PeriodBtn
              key={p}
              active={period === p}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </PeriodBtn>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Revenue"
          value={`৳${totalRevenue.toLocaleString()}`}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={TrendingUp}
        />
        <StatCard
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={ShoppingCart}
        />
        <StatCard
          label="Items Sold"
          value={totalItems.toLocaleString()}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          icon={Package}
        />
        <StatCard
          label={period === "daily" ? "Avg Order Value" : "Peak Revenue"}
          value={`৳${(period === "daily" ? avgRevenue : bestSales).toLocaleString()}`}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          icon={Star}
        />
      </div>

      {/* Chart Type Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Chart style:</span>
        {(["area", "composed"] as ChartType[]).map((t) => (
          <button
            key={t}
            onClick={() => setChartType(t)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              chartType === t
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {t === "area" ? "Area" : "Bar + Line"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl z-10">
            <Loader2 size={28} className="text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={340}>
          {chartType === "area" ? (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                }
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                name="Revenue (৳)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#gradSales)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradOrders)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          ) : (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                }
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
              />
              <Bar
                yAxisId="left"
                dataKey="sales"
                name="Revenue (৳)"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                opacity={0.85}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
