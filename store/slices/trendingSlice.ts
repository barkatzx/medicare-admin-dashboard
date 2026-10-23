// src/store/slices/trendingSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/config/api";
import type { Product } from "@/config/api";
import type { ProductPagination } from "@/config/api";
import { getApiErrorMessage } from "@/config/api/client";
import toast from "react-hot-toast";

interface TrendingState {
  trendingProducts: Product[];
  pagination: ProductPagination;
  loading: boolean;
  activeFetchRequestId: string | null;
  activeMutationRequestIds: string[];
  error: string | null;
}

const initialState: TrendingState = {
  trendingProducts: [],
  pagination: {
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  loading: false,
  activeFetchRequestId: null,
  activeMutationRequestIds: [],
  error: null,
};

// Fetch trending products
export const fetchTrendingProducts = createAsyncThunk(
  "trending/fetchAll",
  async (page: number | undefined, { rejectWithValue, signal }) => {
    try {
      const response = await api.getTrendingProducts(page ?? 1, signal);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch trending products"),
      );
    }
  },
);

// Update product trending status
export const updateTrendingStatus = createAsyncThunk(
  "trending/updateStatus",
  async (
    { productId, trending }: { productId: string; trending: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.updateProductTrendingStatus(
        productId,
        trending,
      );
      return { productId, trending, product: response };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update trending status"),
      );
    }
  },
);

const trendingSlice = createSlice({
  name: "trending",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Optimistic update for adding/removing
    optimisticUpdate: (
      state,
      action: PayloadAction<{ product: Product; trending: boolean }>,
    ) => {
      const { product, trending } = action.payload;
      if (trending) {
        if (!state.trendingProducts.find((p) => p.id === product.id)) {
          state.trendingProducts.push(product);
        }
      } else {
        state.trendingProducts = state.trendingProducts.filter(
          (p) => p.id !== product.id,
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch trending products
      .addCase(fetchTrendingProducts.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeFetchRequestId = action.meta.requestId;
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.activeFetchRequestId = null;
        state.loading = state.activeMutationRequestIds.length > 0;
        state.trendingProducts = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTrendingProducts.rejected, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.activeFetchRequestId = null;
        state.loading = state.activeMutationRequestIds.length > 0;
        if (action.meta.aborted) return;
        state.error =
          (action.payload as string) || "Failed to fetch trending products";
      })

      // Update trending status
      .addCase(updateTrendingStatus.pending, (state, action) => {
        state.activeMutationRequestIds.push(action.meta.requestId);
        state.loading = true;
      })
      .addCase(updateTrendingStatus.fulfilled, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading =
          state.activeFetchRequestId !== null ||
          state.activeMutationRequestIds.length > 0;
        if (action.payload.trending) {
          // Add to trending products
          if (
            !state.trendingProducts.find(
              (p) => p.id === action.payload.productId,
            )
          ) {
            state.trendingProducts.push(action.payload.product);
          }
          toast.success("Product added to trending");
        } else {
          // Remove from trending products
          state.trendingProducts = state.trendingProducts.filter(
            (p) => p.id !== action.payload.productId,
          );
          toast.success("Product removed from trending");
        }
      })
      .addCase(updateTrendingStatus.rejected, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading =
          state.activeFetchRequestId !== null ||
          state.activeMutationRequestIds.length > 0;
        const errorMsg =
          (action.payload as string) || "Failed to update trending status";
        state.error = errorMsg;
        toast.error(errorMsg);
      });
  },
});

export const { clearError, optimisticUpdate } = trendingSlice.actions;
export default trendingSlice.reducer;
