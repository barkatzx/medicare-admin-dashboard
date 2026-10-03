import {
  TSR_ORDER_STATUSES,
  type TSRPerformance,
  type TsrOrderStatus,
} from "@/config/api";
import { formatSalesCurrency, formatSalesNumber } from "@/components/sales/salesFormatters";
import { getStatusCount, getStatusValue, statusLabels } from "./metrics";

interface SummaryCardsProps {
  summary: TSRPerformance;
}

const tones: Record<TsrOrderStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  processing: "bg-violet-50 text-violet-600",
  shipped: "bg-cyan-50 text-cyan-600",
  delivered: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-rose-50 text-rose-600",
};

function displayCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? formatSalesCurrency(amount) : "—";
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const totalOrders = Number(summary.totalOrders);
  const validTotalOrders = Number.isFinite(totalOrders) ? totalOrders : 0;
  const totalValue = summary.totalOrderValue;

  return (
    <section
      aria-label="TSR sales summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <article className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-sm font-medium text-gray-500">Total Orders</p>
        <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">
          {formatSalesNumber(validTotalOrders)}
        </p>
        <p className="mt-1 text-xs text-gray-500">All order statuses</p>
      </article>
      <article className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-sm font-medium text-gray-500">Total Order Value</p>
        <p className="mt-3 truncate text-2xl font-bold tabular-nums text-gray-900">
          {displayCurrency(totalValue)}
        </p>
        <p className="mt-1 text-xs text-gray-500">Value of all orders</p>
      </article>

      {TSR_ORDER_STATUSES.map((status) => (
        <article
          key={status}
          className="rounded-2xl border border-gray-100 bg-white p-5"
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${tones[status].split(" ")[0]}`}
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-gray-500">
              {statusLabels[status]}
            </p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">
            {formatSalesNumber(getStatusCount(summary, status))}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-600">
            {displayCurrency(getStatusValue(summary, status) ?? null)}
          </p>
        </article>
      ))}
    </section>
  );
}
