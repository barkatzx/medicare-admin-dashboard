// src/store/slices/featuredSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, Product } from "@/config/api";
import type { ProductPagination } from "@/config/api";
import toast from "react-hot-toast";

interface FeaturedState {
  featuredProducts: Product[];
  pagination: ProductPagination;
  loading: boolean;
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
  error: null,
};

// Fetch featured products
export const fetchFeaturedProducts = createAsyncThunk(
  "featured/fetchAll",
  async (page: number | undefined, { rejectWithValue }) => {
    try {
      const response = await api.getFeaturedProducts(page ?? 1);
      return response;
    } catch (error: any) {
      console.error("Fetch featured products error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch featured products",
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
    } catch (error: any) {
      console.error("Update featured status error:", error);
      return rejectWithValue(
        error.message || "Failed to update featured status",
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
    optimisticUpdate: (state, action) => {
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
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredProducts = action.payload.products;
        state.pagination = action.payload.pagination;
        if (action.payload.products.length === 0) {
          console.log("No featured products found");
        }
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch featured products";
        console.error("Featured fetch rejected:", state.error);
        // Don't show toast here to avoid spamming
      })

      // Update featured status
      .addCase(updateFeaturedStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateFeaturedStatus.fulfilled, (state, action) => {
        state.loading = false;
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
        state.loading = false;
        const errorMsg =
          (action.payload as string) || "Failed to update featured status";
        state.error = errorMsg;
        toast.error(errorMsg);
      });
  },
});

export const { clearError, optimisticUpdate } = featuredSlice.actions;
export default featuredSlice.reducer;
