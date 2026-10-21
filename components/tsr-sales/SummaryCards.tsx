import {
  TSR_ORDER_STATUSES,
  type TSRPerformance,
  type TsrOrderStatus,
} from "@/config/api";
import {
  formatSalesCurrency,
  formatSalesNumber,
} from "@/components/sales/salesFormatters";
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
      className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
    >
      <article className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 sm:p-5">
        <p className="text-xs font-medium text-gray-500 sm:text-sm">Total Orders</p>
        <p className="mt-2 text-xl font-bold tabular-nums text-gray-900 sm:mt-3 sm:text-2xl">
          {formatSalesNumber(validTotalOrders)}
        </p>
        <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">All order statuses</p>
      </article>
      <article className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 sm:p-5">
        <p className="text-xs font-medium text-gray-500 sm:text-sm">Total Order Value</p>
        <p className="mt-2 truncate text-xl font-bold tabular-nums text-gray-900 sm:mt-3 sm:text-2xl">
          {displayCurrency(totalValue)}
        </p>
        <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">Value of all orders</p>
      </article>

      {TSR_ORDER_STATUSES.map((status) => (
        <article
          key={status}
          className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 sm:p-5"
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${tones[status].split(" ")[0]}`}
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-gray-500 sm:text-sm">
              {statusLabels[status]}
            </p>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-gray-900 sm:mt-3 sm:text-2xl">
            {formatSalesNumber(getStatusCount(summary, status))}
          </p>
          <p className="mt-1 truncate text-xs font-semibold tabular-nums text-gray-600 sm:text-sm">
            {displayCurrency(getStatusValue(summary, status) ?? null)}
          </p>
        </article>
      ))}
    </section>
  );
}
