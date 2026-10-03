import type {
  StatusPerformance,
  TSRPerformance,
  TsrOrderStatus,
} from "@/config/api";

export const statusLabels: Record<TsrOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function numericValue(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

export function formatMetricCurrency(
  value: number | string | null | undefined,
  formatter: (amount: number) => string,
): string {
  const amount = numericValue(value);
  return amount === null ? "—" : formatter(amount);
}

function getStatusMetric(
  record: TSRPerformance,
  status: TsrOrderStatus,
): StatusPerformance | number | undefined {
  return (
    record.statusBreakdown?.[status] ??
    record.statuses?.[status] ??
    record.ordersByStatus?.[status] ??
    record[status]
  );
}

export function getStatusCount(
  record: TSRPerformance,
  status: TsrOrderStatus,
): number {
  const metric = getStatusMetric(record, status);
  if (typeof metric === "number") return metric;
  return (
    numericValue(metric?.count ?? metric?.orders ?? metric?.totalOrders) ??
    numericValue(record.statusCounts?.[status]) ??
    numericValue(record[`${status}Count`]) ??
    0
  );
}

export function getStatusValue(
  record: TSRPerformance,
  status: TsrOrderStatus,
): number | string | null {
  const metric = getStatusMetric(record, status);
  if (typeof metric === "object" && metric !== null) {
    const value = metric.value ?? metric.orderValue ?? metric.totalOrderValue;
    if (value !== undefined && value !== null && numericValue(value) !== null) {
      return value;
    }
  }

  const value =
    record.statusValues?.[status] ?? record[`${status}OrderValue`];
  return value === undefined || numericValue(value) === null ? null : value;
}
