import { apiClient } from "../client";
import type {
  OrderedProductsData,
  SalesSummaryData,
  TopProduct,
  YearlyResponse,
} from "./sales.types";

export async function getTopProducts(
  limit: number = 10,
): Promise<TopProduct[]> {
  const data = await apiClient.request(`/sales/top-products?limit=${limit}`);
  return Array.isArray(data) ? data : [];
}

export async function getTodayOrderedProducts(): Promise<OrderedProductsData> {
  return apiClient.request("/sales/today-ordered-products");
}

export async function getDailySales(): Promise<any> {
  return apiClient.request("/sales/daily");
}

export async function getWeeklySales(): Promise<any> {
  return apiClient.request("/sales/weekly");
}

export async function getMonthlySales(): Promise<any> {
  return apiClient.request("/sales/monthly");
}

export async function getSalesSummary(): Promise<SalesSummaryData> {
  return apiClient.request("/sales/summary");
}

export async function getYearlySales(): Promise<YearlyResponse> {
  const data = await apiClient.request("/sales/yearly");
  return data;
}
