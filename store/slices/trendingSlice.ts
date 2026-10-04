// src/store/slices/trendingSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, Product } from "@/config/api";
import type { ProductPagination } from "@/config/api";
import toast from "react-hot-toast";

interface TrendingState {
  trendingProducts: Product[];
  pagination: ProductPagination;
  loading: boolean;
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
  error: null,
};

// Fetch trending products
export const fetchTrendingProducts = createAsyncThunk(
  "trending/fetchAll",
  async (page: number | undefined, { rejectWithValue }) => {
    try {
      const response = await api.getTrendingProducts(page ?? 1);
      return response;
    } catch (error: any) {
      console.error("Fetch trending products error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch trending products",
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
    } catch (error: any) {
      console.error("Update trending status error:", error);
      return rejectWithValue(
        error.message || "Failed to update trending status",
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
    optimisticUpdate: (state, action) => {
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
      .addCase(fetchTrendingProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingProducts = action.payload.products;
        state.pagination = action.payload.pagination;
        if (action.payload.products.length === 0) {
          console.log("No trending products found");
        }
      })
      .addCase(fetchTrendingProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch trending products";
        console.error("Trending fetch rejected:", state.error);
        // Don't show toast here to avoid spamming
      })

      // Update trending status
      .addCase(updateTrendingStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTrendingStatus.fulfilled, (state, action) => {
        state.loading = false;
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
        state.loading = false;
        const errorMsg =
          (action.payload as string) || "Failed to update trending status";
        state.error = errorMsg;
        toast.error(errorMsg);
      });
  },
});

export const { clearError, optimisticUpdate } = trendingSlice.actions;
export default trendingSlice.reducer;
