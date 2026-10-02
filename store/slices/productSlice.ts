// src/store/slices/productSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, Product, TopProduct } from "@/config/api";
import toast from "react-hot-toast";

// src/store/slices/productSlice.ts

interface ProductState {
  products: Product[];
  topProducts: TopProduct[];
  loading: boolean;
  topProductsLoading: boolean;
  error: string | null;
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
  loading: false,
  topProductsLoading: false,
  error: null,
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
  async ({
    page,
    limit,
    search,
    categoryId,
  }: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
  }) => {
    const response = await api.getAllProducts(page, limit, search, categoryId);
    return response;
  },
);
export const fetchProductById = createAsyncThunk(
  "products/fetchById",
  async (id: string) => {
    const response = await api.getProductById(id);
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
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update stock");
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
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to set default image");
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
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch inventory stats",
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
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
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
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
        toast.success("Product created successfully");
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to create product");
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (p) => p.id === action.payload.id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        toast.success("Product updated successfully");
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to update product");
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
        toast.success("Product deleted successfully");
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to delete product");
      })
      // Update Product Stock
      .addCase(updateProductStock.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProductStock.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (p) => p.id === action.payload.id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        toast.success("Stock updated successfully");
      })
      .addCase(updateProductStock.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to update stock");
      })
      // Upload Product Images
      .addCase(uploadProductImages.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (p) => p.id === action.payload.productId,
        );
        if (index !== -1) {
          // Refresh the product to get updated images with isDefault flag
          // You might need to fetch the product again
          toast.success("Images uploaded successfully");
        }
      })
      // Set Default Product Image
      // In productSlice.ts extraReducers

      .addCase(setDefaultProductImage.pending, (state) => {
        state.loading = true;
      })
      .addCase(setDefaultProductImage.fulfilled, (state, action) => {
        state.loading = false;

        // Find the product
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

        toast.success("Default image updated successfully");
      })
      .addCase(setDefaultProductImage.rejected, (state, action) => {
        state.loading = false;
        toast.error(
          (action.payload as string) || "Failed to set default image",
        );
      })
      // Delete Product Image
      .addCase(deleteProductImage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProductImage.fulfilled, (state, action) => {
        state.loading = false;
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
        toast.success("Image deleted successfully");
      })
      .addCase(deleteProductImage.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to delete image");
      })

      // Create Product With Images
      .addCase(createProductWithImages.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProductWithImages.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
        toast.success("Product created with images successfully");
      })
      .addCase(createProductWithImages.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Failed to create product");
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
