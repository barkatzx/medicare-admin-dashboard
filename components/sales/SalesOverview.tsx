import type { SalesOverviewData } from "@/config/api";
import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { formatSalesCurrency, formatSalesNumber } from "./salesFormatters";

interface SalesOverviewProps {
  summary: SalesOverviewData;
}

export default function SalesOverview({ summary }: SalesOverviewProps) {
  const metrics = [
    {
      label: "Lifetime sales",
      value: formatSalesCurrency(summary.totalSales),
      icon: CircleDollarSign,
      tone: "bg-blue-50 text-blue-600",
      accent: "bg-blue-500",
    },
    {
      label: "Total orders",
      value: formatSalesNumber(summary.totalOrders),
      icon: ShoppingCart,
      tone: "bg-violet-50 text-violet-600",
      accent: "bg-violet-500",
    },
    {
      label: "Average order value",
      value: formatSalesCurrency(summary.averageOrderValue),
      icon: BarChart3,
      tone: "bg-cyan-50 text-cyan-600",
      accent: "bg-cyan-500",
    },
    {
      label: "Items sold",
      value: formatSalesNumber(summary.totalItemsSold),
      icon: Boxes,
      tone: "bg-emerald-50 text-emerald-600",
      accent: "bg-emerald-500",
    },
    {
      label: "Total discounts",
      value: formatSalesCurrency(summary.totalDiscounts),
      icon: Tag,
      tone: "bg-amber-50 text-amber-600",
      accent: "bg-amber-500",
    },
    {
      label: "Active customers",
      value: formatSalesNumber(summary.totalCustomers),
      icon: Users,
      tone: "bg-pink-50 text-pink-600",
      accent: "bg-pink-500",
    },
  ];

  return (
    <section
      aria-label="Sales summary"
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5 2xl:grid-cols-6"
    >
      {metrics.map(({ label, value, icon: Icon, tone, accent }) => (
        <article
          key={label}
          className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone} transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10`}
            >
              <Icon size={19} strokeWidth={2} />
            </div>
          </div>

          <p className="mt-3 truncate text-xl font-bold tabular-nums tracking-tight text-gray-900 sm:mt-4 sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-gray-500 sm:text-sm">
            {label}
          </p>
        </article>
      ))}
    </section>
  );
}
