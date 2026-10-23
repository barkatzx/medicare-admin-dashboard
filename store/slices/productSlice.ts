// src/store/slices/productSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, Product, TopProduct } from "@/config/api";
import toast from "react-hot-toast";

// src/store/slices/productSlice.ts

interface ProductState {
  products: Product[];
  topProducts: TopProduct[];
  fetchingProducts: boolean;
  topProductsLoading: boolean;
  error: string | null;
  activeFetchRequestId: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  inventoryStats: {
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  } | null;
}

const initialState: ProductState = {
  products: [],
  topProducts: [],
  fetchingProducts: false,
  topProductsLoading: false,
  error: null,
  activeFetchRequestId: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  inventoryStats: null,
};

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (
    {
      page,
      limit,
      search,
      categoryId,
    }: {
      page: number;
      limit: number;
      search?: string;
      categoryId?: string;
    },
    { signal },
  ) => {
    const response = await api.getAllProducts(
      page,
      limit,
      search,
      categoryId,
      signal,
    );
    return response;
  },
);
export const fetchProductById = createAsyncThunk(
  "products/fetchById",
  async (id: string, { signal }) => {
    const response = await api.getProductById(id, signal);
    return response;
  },
);

export const createProduct = createAsyncThunk(
  "products/create",
  async (productData: Partial<Product>) => {
    const response = await api.createProduct(productData);
    return response;
  },
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, data }: { id: string; data: Partial<Product> }) => {
    const response = await api.updateProduct(id, data);
    return response;
  },
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id: string) => {
    await api.deleteProduct(id);
    return id;
  },
);

export const updateProductStock = createAsyncThunk(
  "products/updateStock",
  async (
    {
      id,
      operation,
      stock,
    }: { id: string; operation?: "increment" | "decrement"; stock: number },
    { rejectWithValue },
  ) => {
    try {
      let response;
      if (operation === "increment") {
        response = await api.incrementProductStock(id, stock);
      } else if (operation === "decrement") {
        response = await api.decrementProductStock(id, stock);
      } else {
        response = await api.updateProductStock(id, stock);
      }
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update stock",
      );
    }
  },
);

export const uploadProductImages = createAsyncThunk(
  "products/uploadImages",
  async ({ productId, images }: { productId: string; images: File[] }) => {
    const response = await api.addProductImages(productId, images);
    return { productId, response };
  },
);

export const setDefaultProductImage = createAsyncThunk(
  "products/setDefaultImage",
  async (
    { productId, imageId }: { productId: string; imageId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.setDefaultProductImage(productId, imageId);
      return { productId, imageId, response };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to set default image",
      );
    }
  },
);

export const deleteProductImage = createAsyncThunk(
  "products/deleteImage",
  async ({ productId, imageId }: { productId: string; imageId: string }) => {
    await api.deleteProductImage(productId, imageId);
    return { productId, imageId };
  },
);

export const createProductWithImages = createAsyncThunk(
  "products/createWithImages",
  async (formData: FormData) => {
    const response = await api.createProductWithImages(formData);
    return response;
  },
);

export const fetchTopProducts = createAsyncThunk(
  "products/fetchTop",
  async (limit: number = 10) => {
    const response = await api.getTopProducts(limit);
    return response;
  },
);

export const fetchInventoryStats = createAsyncThunk(
  "products/fetchInventoryStats",
  async (_, { rejectWithValue }) => {
    try {
      // Fetch with a large limit to calculate global stats
      const response = await api.getAllProducts(1, 1000);
      const allProducts = response.products;

      const lowStockCount = allProducts.filter(
        (p) => p.stock <= 20 && p.stock > 0,
      ).length;
      const outOfStockCount = allProducts.filter((p) => p.stock === 0).length;
      const totalValue = allProducts.reduce(
        (sum, p) => sum + (p.discountedPrice ?? p.price) * p.stock,
        0,
      );

      return { lowStockCount, outOfStockCount, totalValue };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch inventory stats",
      );
    }
  },
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Products
      // Fetch Products
      .addCase(fetchProducts.pending, (state, action) => {
        state.fetchingProducts = true;
        state.activeFetchRequestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.fetchingProducts = false;
        state.activeFetchRequestId = null;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (state.activeFetchRequestId !== action.meta.requestId) return;
        state.fetchingProducts = false;
        state.activeFetchRequestId = null;
        if (action.meta.aborted) return;
        state.error = action.error.message || "Failed to fetch products";
        toast.error("Failed to load products");
      })
      // Fetch Product By ID
      .addCase(fetchProductById.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p.id === action.payload.id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      // Create Product
      // Update Product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p.id === action.payload.id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      // Delete Product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      // Update Product Stock
      .addCase(updateProductStock.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p.id === action.payload.id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      // Upload Product Images
      // Set Default Product Image
      .addCase(setDefaultProductImage.fulfilled, (state, action) => {
        const productIndex = state.products.findIndex(
          (p) => p.id === action.payload.productId,
        );

        if (productIndex !== -1) {
          // Update isDefault flag for all images in this product
          if (state.products[productIndex].images) {
            state.products[productIndex].images = state.products[
              productIndex
            ].images?.map((img) => ({
              ...img,
              isDefault: img.id === action.payload.imageId,
            }));
          }

          // Update primaryImageId
          state.products[productIndex].primaryImageId = action.payload.imageId;
        }

      })
      // Delete Product Image
      .addCase(deleteProductImage.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p.id === action.payload.productId,
        );
        if (index !== -1) {
          // Remove the deleted image
          state.products[index].images =
            state.products[index].images?.filter(
              (img) => img.id !== action.payload.imageId,
            ) || [];

          // If the deleted image was primary, set a new primary
          if (state.products[index].primaryImageId === action.payload.imageId) {
            const newPrimary =
              state.products[index].images?.find((img) => img.isDefault) ||
              state.products[index].images?.[0];
            state.products[index].primaryImageId = newPrimary?.id || undefined;
          }
        }
      })
      // Create Product With Images
      .addCase(createProductWithImages.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      // Fetch Top Products
      .addCase(fetchTopProducts.pending, (state) => {
        state.topProductsLoading = true;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProductsLoading = false;
        state.topProducts = action.payload;
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.topProductsLoading = false;
        state.error = action.error.message || "Failed to fetch top products";
        toast.error("Failed to load top products");
      })
      // Fetch Inventory Stats
      .addCase(fetchInventoryStats.fulfilled, (state, action) => {
        state.inventoryStats = action.payload;
      });
  },
});

export default productSlice.reducer;
