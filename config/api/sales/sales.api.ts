import { apiClient, API_BASE_URL } from "../client";
import type {
  DashboardData,
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

export async function getTodayOrderedProducts(): Promise<any> {
  return apiClient.request("/sales/today-ordered-products");
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const data = await apiClient.request("/sales/dashboard");
    return data as DashboardData;
  } catch (error) {
    console.error("Dashboard API error, returning fallback data:", error);
    // Return fallback data instead of throwing
    return {
      today: { sales: 0, orders: 0, items: 0 },
      this_week: { sales: 0, orders: 0, items: 0 },
      this_month: { sales: 0, orders: 0, items: 0 },
      this_year: { sales: 0, orders: 0, items: 0 },
      lifetime: { sales: 0, orders: 0, customers: 0, products_sold: 0 },
      growth: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
      recent_orders: [],
    };
  }
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

export async function exportSalesData(format: "csv" | "pdf" = "csv") {
  const token = apiClient.getToken();
  const response = await fetch(
    `${API_BASE_URL}/sales/export?format=${format}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (format === "csv") {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-data-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return response;
}
