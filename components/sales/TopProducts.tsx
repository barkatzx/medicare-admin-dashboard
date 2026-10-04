"use client";

import type { TopSalesProduct } from "@/config/api";
import { Crown, Package } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatSalesCurrency, formatSalesNumber } from "./salesFormatters";

interface TopProductsProps {
  products: TopSalesProduct[];
}

const SLICE_COLORS = [
  "#22d3ee", // cyan — leader
  "#a78bfa", // violet
  "#f472b6", // pink
  "#fbbf24", // amber
  "#34d399", // emerald
  "#60a5fa", // sky
];

export default function TopProducts({ products }: TopProductsProps) {
  const maxSold = Math.max(0, ...products.map((product) => product.totalSold));
  const leader = products[0];
  const totalSold = products.reduce(
    (sum, product) => sum + product.totalSold,
    0,
  );

  // Reverse so leader renders at the top of the horizontal bar chart
  const chartData = [...products]
    .map((product, index) => ({
      id: product.id,
      name: product.name,
      sold: product.totalSold,
      price: Number(product.price),
      rank: index + 1,
      color: SLICE_COLORS[Math.min(index, SLICE_COLORS.length - 1)],
    }))
    .reverse();

  // Ranked order (leader first) for the list
  const rankedData = [...chartData].reverse();

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 text-gray-900 sm:p-8">
      {products.length === 0 ? (
        <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-gray-100">
            <Package size={22} className="text-gray-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-700">
            No top products available
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Rankings will appear once sales are recorded
          </p>
        </div>
      ) : (
        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[440px_1fr]">
          {/* Recharts donut */}
          <div className="relative mx-auto h-[420px] w-full max-w-[440px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f3f4f6",
                    background: "#ffffff",
                    color: "#111827",
                    boxShadow: "0 4px 12px rgba(16,24,40,0.08)",
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#374151" }}
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
                <Pie
                  data={rankedData}
                  dataKey="sold"
                  nameKey="name"
                  innerRadius={130}
                  outerRadius={190}
                  paddingAngle={3}
                  cornerRadius={8}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {rankedData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Donut center */}
            {leader && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <Crown size={22} className="text-cyan-500" />
                <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-gray-900">
                  {formatSalesNumber(leader.totalSold)}
                </p>
                <p className="mt-1 max-w-[160px] truncate text-sm text-gray-500">
                  {leader.name}
                </p>
              </div>
            )}
          </div>

          {/* Ranked list */}
          <ol className="space-y-2 rounded-2xl bg-gray-50 p-3">
            {rankedData.map((entry, index) => {
              const product = products[index];
              const widthPct = maxSold > 0 ? (entry.sold / maxSold) * 100 : 0;
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums text-white"
                    style={{ backgroundColor: entry.color }}
                  >
                    {entry.rank}
                  </span>
                  <ProductImage
                    imageUrl={product?.images?.[0]?.url}
                    name={entry.name}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {entry.name}
                      </p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                        {formatSalesNumber(entry.sold)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: entry.color,
                          }}
                        />
                      </div>
                      <p className="shrink-0 text-xs tabular-nums text-gray-500">
                        {Number.isFinite(entry.price)
                          ? formatSalesCurrency(entry.price)
                          : "Price unavailable"}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
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
