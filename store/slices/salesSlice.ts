// src/store/slices/salesSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/config/api";
import type {
  DailySalesResponse,
  MonthlySalesResponse,
  SalesBreakdownEntry,
  YearlyResponse,
} from "@/config/api/sales/sales.types";
import toast from "react-hot-toast";

interface ChartDataItem {
  label: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
  itemsSold: number;
}

interface SalesState {
  salesData: Record<SalesPeriod, ChartDataItem[] | null>;
  loading: boolean;
  loadingByPeriod: Record<SalesPeriod, boolean>;
  activeRequestIds: Partial<Record<SalesPeriod, string>>;
  errorByPeriod: Partial<Record<SalesPeriod, string>>;
  error: string | null;
}

type SalesPeriod = "daily" | "weekly" | "monthly" | "yearly";

const initialState: SalesState = {
  salesData: {
    daily: null,
    weekly: null,
    monthly: null,
    yearly: null,
  },
  loading: false,
  loadingByPeriod: {
    daily: false,
    weekly: false,
    monthly: false,
    yearly: false,
  },
  activeRequestIds: {},
  errorByPeriod: {},
  error: null,
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function salesMetric(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function transformDaily(data: DailySalesResponse): ChartDataItem {
  return {
    label: data.date || "Today",
    sales: salesMetric(data.totalSales),
    orders: salesMetric(data.totalOrders),
    avgOrderValue: salesMetric(data.averageOrderValue),
    itemsSold: salesMetric(data.totalItemsSold),
  };
}

function transformWeekly(data: {
  daily_breakdown?: SalesBreakdownEntry[];
}): ChartDataItem[] {
  return (data.daily_breakdown ?? []).map((item, i) => ({
    label: DAY_NAMES[i % DAY_NAMES.length],
    sales: salesMetric(item.totalSales),
    orders: salesMetric(item.totalOrders),
    avgOrderValue: salesMetric(item.averageOrderValue),
    itemsSold: salesMetric(item.totalItemsSold),
  }));
}

function transformMonthly(data: MonthlySalesResponse): ChartDataItem[] {
  return (data.daily_breakdown ?? []).map((item, i) => ({
    label: `${i + 1}`,
    sales: salesMetric(item.totalSales),
    orders: salesMetric(item.totalOrders),
    avgOrderValue: salesMetric(item.averageOrderValue),
    itemsSold: salesMetric(item.totalItemsSold),
  }));
}

function transformYearly(data: YearlyResponse): ChartDataItem[] {
  return data.monthly_breakdown.map((item, i) => ({
    label: MONTH_NAMES[i] || `M${i + 1}`,
    sales: salesMetric(item.totalSales),
    orders: salesMetric(item.totalOrders),
    avgOrderValue: salesMetric(item.averageOrderValue),
    itemsSold: salesMetric(item.totalItemsSold),
  }));
}

export const fetchSalesData = createAsyncThunk<
  { period: SalesPeriod; data: ChartDataItem[] },
  SalesPeriod
>(
  "sales/fetchData",
  async (period, { signal }) => {
    switch (period) {
      case "daily":
        return {
          period,
          data: [transformDaily(await api.getDailySales(signal))],
        };
      case "weekly":
        return {
          period,
          data: transformWeekly(await api.getWeeklySales(signal)),
        };
      case "monthly":
        return {
          period,
          data: transformMonthly(await api.getMonthlySales(signal)),
        };
      case "yearly":
        return {
          period,
          data: transformYearly(await api.getYearlySales(signal)),
        };
    }
  },
);

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    clearSalesData: (state) => {
      state.salesData = {
        daily: null,
        weekly: null,
        monthly: null,
        yearly: null,
      };
      state.activeRequestIds = {};
      state.loadingByPeriod = {
        daily: false,
        weekly: false,
        monthly: false,
        yearly: false,
      };
      state.errorByPeriod = {};
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesData.pending, (state, action) => {
        const period = action.meta.arg;
        state.activeRequestIds[period] = action.meta.requestId;
        state.loadingByPeriod[period] = true;
        state.loading = true;
        delete state.errorByPeriod[period];
        state.error = null;
      })
      .addCase(fetchSalesData.fulfilled, (state, action) => {
        const period = action.meta.arg;
        if (state.activeRequestIds[period] !== action.meta.requestId) return;
        delete state.activeRequestIds[period];
        state.loadingByPeriod[period] = false;
        state.loading = Object.values(state.loadingByPeriod).some(Boolean);
        state.salesData[period] = action.payload.data;
      })
      .addCase(fetchSalesData.rejected, (state, action) => {
        const period = action.meta.arg;
        if (state.activeRequestIds[period] !== action.meta.requestId) return;
        delete state.activeRequestIds[period];
        state.loadingByPeriod[period] = false;
        state.loading = Object.values(state.loadingByPeriod).some(Boolean);
        if (!action.meta.aborted) {
          state.error = action.error.message || "Failed to fetch sales data";
          state.errorByPeriod[period] = state.error;
          toast.error("Failed to load sales data");
        }
      });
  },
});

export const { clearSalesData } = salesSlice.actions;
export default salesSlice.reducer;
