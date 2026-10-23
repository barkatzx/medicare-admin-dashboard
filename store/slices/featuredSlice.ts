// src/store/slices/featuredSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/config/api";
import type { Product } from "@/config/api";
import type { ProductPagination } from "@/config/api";
import { getApiErrorMessage } from "@/config/api/client";
import toast from "react-hot-toast";

interface FeaturedState {
  featuredProducts: Product[];
  pagination: ProductPagination;
  loading: boolean;
  activeFetchRequestId: string | null;
  activeMutationRequestIds: string[];
  error: string | null;
}

const initialState: FeaturedState = {
  featuredProducts: [],
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

// Fetch featured products
export const fetchFeaturedProducts = createAsyncThunk(
  "featured/fetchAll",
  async (page: number | undefined, { rejectWithValue, signal }) => {
    try {
      const response = await api.getFeaturedProducts(page ?? 1, signal);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch featured products"),
      );
    }
  },
);

// Update product featured status
export const updateFeaturedStatus = createAsyncThunk(
  "featured/updateStatus",
  async (
    { productId, featured }: { productId: string; featured: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.updateProductFeaturedStatus(
        productId,
        featured,
      );
      return { productId, featured, product: response };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update featured status"),
      );
    }
  },
);

const featuredSlice = createSlice({
  name: "featured",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Optimistic update for adding/removing
    optimisticUpdate: (
      state,
      action: PayloadAction<{ product: Product; featured: boolean }>,
    ) => {
      const { product, featured } = action.payload;
      if (featured) {
        if (!state.featuredProducts.find((p) => p.id === product.id)) {
          state.featuredProducts.push(product);
        }
      } else {
        state.featuredProducts = state.featuredProducts.filter(
          (p) => p.id !== product.id,
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch featured products
      .addCase(fetchFeaturedProducts.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeFetchRequestId = action.meta.requestId;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.activeFetchRequestId = null;
        state.loading = state.activeMutationRequestIds.length > 0;
        state.featuredProducts = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.activeFetchRequestId = null;
        state.loading = state.activeMutationRequestIds.length > 0;
        if (action.meta.aborted) return;
        state.error =
          (action.payload as string) || "Failed to fetch featured products";
      })

      // Update featured status
      .addCase(updateFeaturedStatus.pending, (state, action) => {
        state.activeMutationRequestIds.push(action.meta.requestId);
        state.loading = true;
      })
      .addCase(updateFeaturedStatus.fulfilled, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading =
          state.activeFetchRequestId !== null ||
          state.activeMutationRequestIds.length > 0;
        if (action.payload.featured) {
          // Add to featured products
          if (
            !state.featuredProducts.find(
              (p) => p.id === action.payload.productId,
            )
          ) {
            state.featuredProducts.push(action.payload.product);
          }
          toast.success("Product added to featured");
        } else {
          // Remove from featured products
          state.featuredProducts = state.featuredProducts.filter(
            (p) => p.id !== action.payload.productId,
          );
          toast.success("Product removed from featured");
        }
      })
      .addCase(updateFeaturedStatus.rejected, (state, action) => {
        state.activeMutationRequestIds =
          state.activeMutationRequestIds.filter(
            (requestId) => requestId !== action.meta.requestId,
          );
        state.loading =
          state.activeFetchRequestId !== null ||
          state.activeMutationRequestIds.length > 0;
        const errorMsg =
          (action.payload as string) || "Failed to update featured status";
        state.error = errorMsg;
        toast.error(errorMsg);
      });
  },
});

export const { clearError, optimisticUpdate } = featuredSlice.actions;
export default featuredSlice.reducer;
