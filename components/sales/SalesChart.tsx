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
  type TooltipProps,
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
}: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const displayLabel =
    typeof label === "string" || typeof label === "number"
      ? String(label)
      : "";
  return (
    <div className="min-w-[160px] rounded-lg border border-gray-100 bg-white p-3 shadow-xl md:min-w-[180px] md:rounded-xl md:p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:mb-3 md:text-xs">
        {displayLabel}
      </p>
      {payload.map((entry, index) => (
        <div
          key={String(entry.dataKey ?? entry.name ?? index)}
          className="mb-1.5 flex items-center justify-between gap-4 last:mb-0 md:gap-6"
        >
          <div className="flex items-center gap-1.5 md:gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full md:h-2.5 md:w-2.5"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] text-gray-600 md:text-xs">
              {entry.name}
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-900 md:text-xs">
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
  <div className={`rounded-xl p-3 md:rounded-2xl md:p-4 ${gradient}`}>
    <div className="mb-2 flex items-center justify-between md:mb-3">
      <Icon size={16} className="text-white/80 md:size-[18px]" />
      {sub && (
        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/70 md:text-[10px]">
          {sub}
        </span>
      )}
    </div>
    <p className="text-base font-bold text-white md:text-xl">{value}</p>
    <p className="mt-0.5 text-[10px] text-white/70 md:text-xs">{label}</p>
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
    className={`min-h-8 w-full rounded-lg px-1 py-1.5 text-[11px] font-medium transition-all duration-200 md:min-h-10 md:rounded-xl md:px-4 md:py-2 md:text-sm sm:w-auto ${
      active
        ? "bg-blue-600 text-white shadow-sm shadow-blue-200 md:shadow-md"
        : "text-gray-500 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesChart() {
  const dispatch = useAppDispatch();
  const { salesData, loadingByPeriod, errorByPeriod } = useAppSelector(
    (state) => state.sales,
  );

  const [period, setPeriod] = useState<Period>("weekly");
  const [chartType, setChartType] = useState<ChartType>("area");

  useEffect(() => {
    const request = dispatch(fetchSalesData(period));
    return () => request.abort();
  }, [dispatch, period]);

  const chartData: ChartDataItem[] = useMemo(
    () => salesData[period] ?? [],
    [salesData, period],
  );

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

  const isLoading = loadingByPeriod[period] && !chartData.length;

  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-gray-100 bg-white p-3 md:space-y-8 md:rounded-2xl md:p-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900 sm:text-lg md:gap-2 md:text-base">
            <TrendingUp
              size={16}
              className="shrink-0 text-blue-600 md:size-5"
            />
            <span className="truncate">Sales Overview</span>
          </h2>
          <p className="mt-0.5 text-[11px] text-gray-400 md:text-sm">
            {periodLabel}
          </p>
        </div>

        {/* Period Tabs */}
        <div className="grid w-full grid-cols-4 items-center gap-1 rounded-lg bg-gray-50 p-1 md:rounded-xl sm:w-auto">
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
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
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
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
        <span className="text-[11px] font-medium text-gray-400 md:text-xs">
          Chart style:
        </span>
        {(["area", "composed"] as ChartType[]).map((t) => (
          <button
            key={t}
            onClick={() => setChartType(t)}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all md:rounded-lg md:px-3 md:text-xs ${
              chartType === t
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {t === "area" ? "Area" : "Bar + Line"}
          </button>
        ))}
      </div>

      {errorByPeriod[period] && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          <span>{errorByPeriod[period]}</span>
          <button
            type="button"
            onClick={() => dispatch(fetchSalesData(period))}
            className="font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/80 md:rounded-xl">
            <Loader2
              size={24}
              className="mb-2 animate-spin text-blue-500 md:size-7"
            />
            <p className="text-xs text-gray-400 md:text-sm">Loading…</p>
          </div>
        )}

        <div className="h-[220px] w-full sm:h-[300px] md:h-[340px]">
          {!isLoading && !chartData.length && !errorByPeriod[period] ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No sales data available.
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
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
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(v) =>
                    `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  name="Revenue (৳)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gradSales)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradOrders)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(v) =>
                    `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="sales"
                  name="Revenue (৳)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  opacity={0.85}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
