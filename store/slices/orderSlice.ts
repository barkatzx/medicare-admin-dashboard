// src/store/slices/orderSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/config/api";
import type { Order, OrderPagination } from "@/config/api";
import toast from "react-hot-toast";

interface OrderState {
  orders: Order[];
  loading: boolean;
  fetching: boolean;
  error: string | null;
  pagination: OrderPagination | null;
  activeFetchRequestId: string | null;
  query: FetchOrdersArgs | null;
}

interface FetchOrdersArgs {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  orderId?: string;
}

const initialState: OrderState = {
  orders: [],
  loading: false,
  fetching: false,
  error: null,
  pagination: null,
  activeFetchRequestId: null,
  query: null,
};

export const fetchOrders = createAsyncThunk(
  "orders/fetchAll",
  async ({ page, limit, status, orderId }: FetchOrdersArgs) => {
    if (orderId) {
      const order = await api.getOrderById(orderId);
      const matchesStatus =
        !status ||
        status === "all" ||
        order.status.toLowerCase() === status.toLowerCase();
      const orders = matchesStatus ? [order] : [];
      return {
        orders,
        pagination: {
          page: 1,
          limit,
          total: orders.length,
          totalPages: orders.length === 0 ? 0 : 1,
        },
      };
    }

    const response = await api.getAllOrders(page, limit, status);
    return response;
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ orderId, status }: { orderId: string; status: string }) => {
    const response = await api.updateOrderStatus(orderId, status);
    return response;
  },
);

export const confirmPayment = createAsyncThunk(
  "orders/confirmPayment",
  async (orderId: string) => {
    const response = await api.confirmPayment(orderId);
    return response;
  },
);

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state, action) => {
        state.fetching = true;
        state.error = null;
        state.orders = [];
        state.pagination = null;
        state.activeFetchRequestId = action.meta.requestId;
        state.query = action.meta.arg;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.fetching = false;
        state.activeFetchRequestId = null;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.fetching = false;
        state.activeFetchRequestId = null;
        if (
          action.meta.arg.orderId &&
          action.error.message?.includes("status 404")
        ) {
          state.orders = [];
          state.pagination = {
            page: 1,
            limit: action.meta.arg.limit,
            total: 0,
            totalPages: 0,
          };
          return;
        }
        state.error = action.error.message || "Failed to fetch orders";
        toast.error("Failed to fetch orders");
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload,
          };
        }
        toast.success("Order status updated successfully");
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to update order status");
      })
      .addCase(confirmPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.loading = false;
        // Find the order and update its payment status
        const index = state.orders.findIndex(
          (o) => o.id === action.payload.orderId,
        );
        if (index !== -1 && state.orders[index].payment) {
          state.orders[index].payment.status = "paid";
          state.orders[index].payment.paidAt = new Date().toISOString();
        }
        toast.success("Payment confirmed successfully");
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to confirm payment");
      });
  },
});

export default orderSlice.reducer;
