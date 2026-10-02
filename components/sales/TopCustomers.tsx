"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, Crown, Package, TrendingUp } from "lucide-react";
import type { TopCustomer } from "@/config/api";
import { formatSalesCurrency, formatSalesNumber } from "./salesFormatters";

interface TopCustomersProps {
  customers: TopCustomer[];
}

const BAR_COLORS = [
  "#10b981", // emerald-500 — leader
  "#34d399", // emerald-400
  "#6ee7b7", // emerald-300
  "#a7f3d0", // emerald-200
  "#d1fae5", // emerald-100
  "#ecfdf5", // emerald-50
];

export default function TopCustomers({ customers }: TopCustomersProps) {
  const totalSales = customers.reduce(
    (sum, customer) => sum + customer.totalSales,
    0,
  );

  const maxSales = Math.max(
    0,
    ...customers.map((customer) => customer.totalSales),
  );

  const leader = customers[0];

  // Reverse so leader renders at the top of the horizontal bar chart
  const chartData = [...customers]
    .map((customer, index) => ({
      id: customer.id,
      name: customer.customerName,
      pharmacy: customer.pharmacyName,
      orders: customer.totalOrders,
      sales: customer.totalSales,
      rank: index + 1,
      color: BAR_COLORS[Math.min(index, BAR_COLORS.length - 1)],
    }))
    .reverse();

  return (
    <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {/* Header */}

      {customers.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Package size={22} className="text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            No top customers available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Customer rankings will appear once sales are recorded
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Leader spotlight */}
          {leader && (
            <article className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/50 blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
                    <Crown size={18} strokeWidth={2.25} />
                  </span>

                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold uppercase text-emerald-600 ring-1 ring-inset ring-emerald-100">
                    {leader.customerName?.charAt(0) ?? "?"}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                      Top customer
                    </p>
                    <p className="mt-0.5 truncate text-base font-semibold tracking-tight text-gray-900">
                      {leader.customerName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">
                      {leader.pharmacyName || "N/A"} ·{" "}
                      {formatSalesNumber(leader.totalOrders)} orders
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">
                    {formatSalesCurrency(leader.totalSales)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                    total sales
                  </p>
                </div>
              </div>

              <div className="relative mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-emerald-100">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-emerald-600">
                  {totalSales > 0
                    ? ((leader.totalSales / totalSales) * 100).toFixed(1)
                    : "0.0"}
                  % of total
                </span>
              </div>
            </article>
          )}

          {/* Recharts horizontal bar chart */}
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 76, bottom: 4, left: 4 }}
                barCategoryGap="22%"
              >
                <XAxis type="number" hide domain={[0, maxSales || 1]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: string) =>
                    value.length > 18 ? `${value.slice(0, 17)}…` : value
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(16, 185, 129, 0.06)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 12px rgba(16,24,40,0.08)",
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  formatter={(value, _name, payload) => {
                    const rank = payload?.payload?.rank ?? 0;
                    const orders = payload?.payload?.orders ?? 0;
                    const pharmacy = payload?.payload?.pharmacy;
                    const pct =
                      maxSales > 0
                        ? ((Number(value) / maxSales) * 100).toFixed(0)
                        : "0";
                    return [
                      `${formatSalesCurrency(Number(value))} · ${pct}% of leader`,
                      `#${rank}${pharmacy ? ` · ${pharmacy}` : ""} · ${formatSalesNumber(orders)} orders`,
                    ];
                  }}
                />
                <Bar
                  dataKey="sales"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                  label={{
                    position: "right",
                    formatter: (value: number) => formatSalesCurrency(value),
                    fill: "#6b7280",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
