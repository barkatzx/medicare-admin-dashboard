import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { SalesGrowthData } from "@/config/api";
import { formatSalesPercent } from "./salesFormatters";

interface SalesGrowthProps {
  growth: SalesGrowthData;
}

export default function SalesGrowth({ growth }: SalesGrowthProps) {
  const periods = [
    ["Daily", growth.daily],
    ["Weekly", growth.weekly],
    ["Monthly", growth.monthly],
    ["Yearly", growth.yearly],
  ] as const;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {periods.map(([label, value]) => {
          const isPositive = value > 0;
          const isNegative = value < 0;
          const isNeutral = value === 0;
          const Icon = isNeutral
            ? Activity
            : isNegative
              ? ArrowDownRight
              : ArrowUpRight;

          return (
            <article
              key={label}
              className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {label}
                </p>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    isPositive
                      ? "bg-emerald-50 text-emerald-600"
                      : isNegative
                        ? "bg-rose-50 text-rose-600"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon size={15} strokeWidth={2.5} />
                </span>
              </div>

              <div className="mt-3">
                <span
                  className={`text-2xl font-bold tabular-nums tracking-tight ${
                    isPositive
                      ? "text-emerald-600"
                      : isNegative
                        ? "text-rose-600"
                        : "text-gray-700"
                  }`}
                >
                  {formatSalesPercent(value)}
                </span>
              </div>

              <p className="mt-1 text-[11px] font-medium text-gray-400">
                vs. previous {label.toLowerCase()}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
