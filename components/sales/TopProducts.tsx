"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Crown, Package, TrendingUp } from "lucide-react";
import type { TopSalesProduct } from "@/config/api";
import { formatSalesCurrency, formatSalesNumber } from "./salesFormatters";

interface TopProductsProps {
  products: TopSalesProduct[];
}

const BAR_COLORS = [
  "#3b82f6", // blue-500 — leader
  "#60a5fa", // blue-400
  "#93c5fd", // blue-300
  "#bfdbfe", // blue-200
  "#dbeafe", // blue-100
  "#e0e7ff", // indigo-100
];

export default function TopProducts({ products }: TopProductsProps) {
  const maxSold = Math.max(0, ...products.map((product) => product.totalSold));
  const leader = products[0];

  // Reverse so leader renders at the top of the horizontal bar chart
  const chartData = [...products]
    .map((product, index) => ({
      id: product.id,
      name: product.name,
      sold: product.totalSold,
      price: Number(product.price),
      rank: index + 1,
      color: BAR_COLORS[Math.min(index, BAR_COLORS.length - 1)],
    }))
    .reverse();

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {/* Header */}

      {products.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Package size={22} className="text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            No top products available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Rankings will appear once sales are recorded
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Leader spotlight */}
          {leader && (
            <article className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50/40 p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-100/60 blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                    <Crown size={18} strokeWidth={2.25} />
                  </span>

                  <ProductImage
                    imageUrl={leader.images?.[0]?.url}
                    name={leader.name}
                    size={44}
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
                      Best seller
                    </p>
                    <p className="mt-0.5 truncate text-base font-semibold tracking-tight text-gray-900">
                      {leader.name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium tabular-nums text-gray-500">
                      {Number.isFinite(Number(leader.price))
                        ? formatSalesCurrency(Number(leader.price))
                        : "Price unavailable"}
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
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-amber-100">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-amber-600">
                  #1 of {products.length}
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
                margin={{ top: 4, right: 52, bottom: 4, left: 4 }}
                barCategoryGap="22%"
              >
                <XAxis type="number" hide domain={[0, maxSold || 1]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: string) =>
                    value.length > 20 ? `${value.slice(0, 19)}…` : value
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 12px rgba(16,24,40,0.08)",
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  formatter={(value, _name, payload) => {
                    const rank = payload?.payload?.rank ?? 0;
                    const price = payload?.payload?.price;
                    const priceLabel = Number.isFinite(price)
                      ? formatSalesCurrency(price)
                      : "Price unavailable";
                    return [
                      `${formatSalesNumber(Number(value))} units · ${priceLabel}`,
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

function ProductImage({
  imageUrl,
  name,
  size = 44,
}: {
  imageUrl?: string;
  name: string;
  size?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white"
      style={{ height: size, width: size }}
    >
      {imageUrl && !imageFailed ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          unoptimized
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-300">
          <Package size={Math.round(size * 0.42)} />
        </div>
      )}
    </div>
  );
}
