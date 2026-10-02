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
import { Boxes, Medal, TrendingUp } from "lucide-react";
import type { TopCategory } from "@/config/api";
import { formatSalesNumber } from "./salesFormatters";

interface TopCategoriesProps {
  categories: TopCategory[];
}

const BAR_COLORS = [
  "#8b5cf6", // violet-500 — leader
  "#a78bfa", // violet-400
  "#c4b5fd", // violet-300
  "#ddd6fe", // violet-200
  "#ede9fe", // violet-100
  "#e9d5ff", // purple-200
];

export default function TopCategories({ categories }: TopCategoriesProps) {
  const maxSold = Math.max(
    0,
    ...categories.map((category) => category.totalSold),
  );

  const totalSold = categories.reduce(
    (sum, category) => sum + category.totalSold,
    0,
  );

  const leader = categories[0];

  // Reverse so leader renders at the top of the horizontal bar chart
  const chartData = [...categories]
    .map((category, index) => ({
      id: category.id,
      name: category.name,
      sold: category.totalSold,
      rank: index + 1,
      color: BAR_COLORS[Math.min(index, BAR_COLORS.length - 1)],
    }))
    .reverse();

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {categories.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Boxes size={22} className="text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            No top categories available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Category rankings will appear once sales are recorded
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Leader spotlight */}
          {leader && (
            <article className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/40 p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-100/50 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
                    <Medal size={18} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-500">
                      TopCategory
                    </p>
                    <p className="mt-0.5 truncate text-base font-semibold tracking-tight text-gray-900">
                      {leader.name}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">
                    {formatSalesNumber(leader.totalSold)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                    units sold
                  </p>
                </div>
              </div>

              <div className="relative mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-violet-100">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-violet-600">
                  {totalSold > 0
                    ? ((leader.totalSold / totalSold) * 100).toFixed(1)
                    : "0.0"}
                  % of total
                </span>
              </div>
            </article>
          )}

          {/* Recharts horizontal bar chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 52, bottom: 4, left: 4 }}
                barCategoryGap="22%"
              >
                <XAxis type="number" hide domain={[0, maxSold || 1]} />
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
                  cursor={{ fill: "rgba(139, 92, 246, 0.06)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 12px rgba(16,24,40,0.08)",
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  formatter={(value, _name, payload) => {
                    const rank = payload?.payload?.rank ?? 0;
                    const pct =
                      maxSold > 0
                        ? ((Number(value) / maxSold) * 100).toFixed(0)
                        : "0";
                    return [
                      `${formatSalesNumber(Number(value))} units · ${pct}% of leader`,
                      `Rank #${rank}`,
                    ];
                  }}
                />
                <Bar
                  dataKey="sold"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                  label={{
                    position: "right",
                    formatter: (value: number) => formatSalesNumber(value),
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
