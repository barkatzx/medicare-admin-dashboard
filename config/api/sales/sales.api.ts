import { apiClient } from "../client";
import type {
  OrderedProductsData,
  DailySalesResponse,
  MonthlySalesResponse,
  SalesSummaryData,
  TopProduct,
  WeeklySalesResponse,
  YearlyResponse,
} from "./sales.types";

export async function getTopProducts(
  limit: number = 10,
): Promise<TopProduct[]> {
  const data = await apiClient.request(`/sales/top-products?limit=${limit}`);
  return Array.isArray(data) ? data : [];
}

export async function getTodayOrderedProducts(
  signal?: AbortSignal,
): Promise<OrderedProductsData> {
  return apiClient.request("/sales/today-ordered-products", { signal });
}

export async function getDailySales(
  signal?: AbortSignal,
): Promise<DailySalesResponse> {
  return apiClient.request<DailySalesResponse>("/sales/daily", { signal });
}

export async function getWeeklySales(
  signal?: AbortSignal,
): Promise<WeeklySalesResponse> {
  return apiClient.request<WeeklySalesResponse>("/sales/weekly", { signal });
}

export async function getMonthlySales(
  signal?: AbortSignal,
): Promise<MonthlySalesResponse> {
  return apiClient.request<MonthlySalesResponse>("/sales/monthly", { signal });
}

export async function getSalesSummary(
  signal?: AbortSignal,
): Promise<SalesSummaryData> {
  return apiClient.request("/sales/summary", { signal });
}

export async function getYearlySales(
  signal?: AbortSignal,
): Promise<YearlyResponse> {
  const data = await apiClient.request<YearlyResponse>("/sales/yearly", {
    signal,
  });
  return data;
}
