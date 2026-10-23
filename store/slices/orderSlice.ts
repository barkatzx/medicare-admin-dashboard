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
  activeMutationRequestIds: string[];
  query: FetchOrdersArgs | null;
}

interface FetchOrdersArgs {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export const ACTIVE_STATUS = "active";
const ACTIVE_STATUSES = ["pending", "confirmed", "processing", "shipped"];
const EMPTY_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
} as OrderPagination;

const initialState: OrderState = {
  orders: [],
  loading: false,
  fetching: false,
  error: null,
  pagination: null,
  activeFetchRequestId: null,
  activeMutationRequestIds: [],
  query: null,
};

export const fetchOrders = createAsyncThunk(
  "orders/fetchAll",
  async ({ page, limit, status, search }: FetchOrdersArgs) => {
    if (status !== ACTIVE_STATUS) {
      return api.getAllOrders(page, limit, status, search);
    }

    // The API filters by a single status, so merge the active ones and paginate here.
    const perStatus = await Promise.all(
      ACTIVE_STATUSES.map(async (s) => {
        const first = await api.getAllOrders(1, 100, s, search);
        const rest = await Promise.all(
          Array.from(
            { length: Math.max(0, first.pagination.totalPages - 1) },
            (_, i) => api.getAllOrders(i + 2, 100, s, search),
          ),
        );
        return [first, ...rest].flatMap((r) => r.orders);
      }),
    );
    const merged = perStatus
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    const total = merged.length;
    const totalPages = Math.ceil(total / limit);
    return {
      orders: merged.slice((page - 1) * limit, page * limit),
      pagination: { ...EMPTY_PAGINATION, page, limit, total, totalPages },
    };
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
        state.error = action.error.message || "Failed to fetch orders";
        toast.error(state.error);
      })
      .addCase(updateOrderStatus.pending, (state, action) => {
        state.activeMutationRequestIds.push(action.meta.requestId);
        state.loading = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading = state.activeMutationRequestIds.length > 0;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload,
          };
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading = state.activeMutationRequestIds.length > 0;
      })
      .addCase(confirmPayment.pending, (state, action) => {
        state.activeMutationRequestIds.push(action.meta.requestId);
        state.loading = true;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading = state.activeMutationRequestIds.length > 0;
        // Find the order and update its payment status
        const index = state.orders.findIndex(
          (o) => o.id === action.payload.orderId,
        );
        if (index !== -1 && state.orders[index].payment) {
          state.orders[index].payment.status = "paid";
          state.orders[index].payment.paidAt = new Date().toISOString();
        }
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading = state.activeMutationRequestIds.length > 0;
      });
  },
});

export default orderSlice.reducer;
