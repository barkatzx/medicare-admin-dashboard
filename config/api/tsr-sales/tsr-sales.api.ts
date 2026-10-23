import { apiClient } from "../client";
import type {
  Pagination,
  SummaryResponse,
  TSRDetailResponse,
  TsrSalesAllSummary,
  TsrSalesBestPerformance,
  TSROrdersResponse,
  TSRPerformance,
  TsrOrderStatus,
  TsrSalesOrder,
} from "./tsr-sales.types";

function requirePagination(value: unknown): Pagination {
  if (!value || typeof value !== "object") {
    throw new Error("TSR orders response is missing pagination metadata.");
  }

  const pagination = value as Record<string, unknown>;
  const page = Number(pagination.page);
  const limit = Number(pagination.limit);
  const total = Number(pagination.total);
  const totalPages = Number(pagination.totalPages);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(total) ||
    total < 0 ||
    !Number.isInteger(totalPages) ||
    totalPages < 0
  ) {
    throw new Error("TSR orders response contains invalid pagination metadata.");
  }

  return { page, limit, total, totalPages };
}

export async function getTsrSalesSummary(): Promise<SummaryResponse> {
  return apiClient.request<SummaryResponse>("/admin/tsr-sales/summary");
}

export async function getTsrSalesAllSummary(
  tsrId: string,
  signal?: AbortSignal,
): Promise<TsrSalesAllSummary> {
  const params = new URLSearchParams({ tsrId });
  return apiClient.request<TsrSalesAllSummary>(
    `/admin/tsr-sales/allsummary?${params.toString()}`,
    { signal },
  );
}

export async function getTsrSalesBestPerformance(
  signal?: AbortSignal,
): Promise<TsrSalesBestPerformance> {
  return apiClient.request<TsrSalesBestPerformance>(
    "/admin/tsr-sales/best-performance",
    { signal },
  );
}

export async function getTsrSalesTsrs(
  signal?: AbortSignal,
): Promise<TSRPerformance[]> {
  const response = await apiClient.request<
    TSRPerformance[] | { tsrs?: TSRPerformance[] }
  >("/admin/tsr-sales/tsrs", { signal });
  const tsrs = Array.isArray(response) ? response : response?.tsrs;
  if (!Array.isArray(tsrs)) {
    throw new Error("TSR performance response is missing the TSR list.");
  }
  return tsrs;
}

export async function getTsrSalesTsr(
  tsrId: string,
  signal?: AbortSignal,
): Promise<TSRDetailResponse> {
  return apiClient.request<TSRDetailResponse>(
    `/admin/tsr-sales/tsrs/${encodeURIComponent(tsrId)}`,
    { signal },
  );
}

export async function getTsrSalesOrders(
  tsrId: string,
  options: {
    page: number;
    limit: number;
    status?: TsrOrderStatus | "all";
    search?: string;
  },
  signal?: AbortSignal,
): Promise<TSROrdersResponse> {
  const params = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
  });
  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }
  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  const response = await apiClient.request<TSROrdersResponse>(
    `/admin/tsr-sales/tsrs/${encodeURIComponent(tsrId)}/orders?${params.toString()}`,
    { signal },
  );
  if (!Array.isArray(response?.orders)) {
    throw new Error("TSR orders response is missing the order list.");
  }

  return {
    orders: response.orders,
    pagination: requirePagination(response.pagination),
  };
}
