import type { Order } from "../orders/orders.types";
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

export interface SalesSummaryData {
  overall_summary: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
    totalDiscounts: number;
    totalCustomers: number;
    topProducts: Array<{
      id: string;
      name: string;
      price: string;
      images: Array<{ url: string }>;
      totalSold: number;
    }>;
    topCategories: Array<{
      id: string;
      name: string;
      totalSold: number;
    }>;
  };
  growth_percentage: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  sales_by_status: Array<{
    status: string;
    totalSales: number;
    totalOrders: number;
  }>;
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

export interface DashboardData {
  today: {
    sales: number;
    orders: number;
    items: number;
  };
  this_week: {
    sales: number;
    orders: number;
    items: number;
  };
  this_month: {
    sales: number;
    orders: number;
    items: number;
  };
  this_year: {
    sales: number;
    orders: number;
    items: number;
  };
  lifetime: {
    sales: number;
    orders: number;
    customers: number;
    products_sold: number;
  };
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  recent_orders: Order[];
}
