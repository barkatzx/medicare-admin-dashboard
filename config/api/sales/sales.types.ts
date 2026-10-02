import type { Product } from "../products/products.types";

export interface DailySalesData {
  date: string;
  sales: number;
  orders: number;
}

export interface WeeklySalesData {
  week: string;
  sales: number;
  orders: number;
}

export interface MonthlySalesData {
  month: string;
  sales: number;
  orders: number;
}

export interface SalesOverviewData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalDiscounts: number;
  totalCustomers: number;
  topProducts: TopSalesProduct[];
  topCategories: TopCategory[];
  topCustomers: TopCustomer[];
}

export interface SalesGrowthData {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export interface SalesStatus {
  status: string;
  totalSales: number;
  totalOrders: number;
}

export interface TopSalesProduct {
  id: string;
  name: string;
  price: string;
  images: Array<{ url: string }>;
  totalSold: number;
}

export interface TopCategory {
  id: string;
  name: string;
  totalSold: number;
}

export interface TopCustomer {
  id: string;
  customerName: string;
  pharmacyName: string | null;
  totalOrders: number;
  totalSales: number;
}

export interface SalesSummaryData {
  overall_summary: SalesOverviewData;
  growth_percentage: SalesGrowthData;
  sales_by_status: SalesStatus[];
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalProducts: number;
}

export interface YearlyResponse {
  monthly_breakdown: Array<{
    period: "monthly";
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
  }>;
  yearly_totals: {
    totalSales: number;
    totalOrders: number;
    totalItemsSold: number;
  };
  average_monthly_sales: number;
  best_month?: {
    period: "monthly";
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
  };
}

export interface TopProduct extends Product {
  totalSold: number;
  totalRevenue: number;
}
