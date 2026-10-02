// src/app/dashboard/products/ProductForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  updateProduct,
  uploadProductImages,
  createProductWithImages,
  setDefaultProductImage,
  deleteProductImage,
  fetchProducts,
  createProduct,
} from "@/store/slices/productSlice";
import { createCategory, fetchCategories } from "@/store/slices/categorySlice";
import Button from "@/components/ui/Button";
import type { Product } from "@/config/api";
import {
  Upload,
  X,
  Package,
  Tag,
  Layers,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  DollarSign,
  FolderPlus,
  Star,
  Trash2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProductFormProps {
  product?: Product | null;
  categories: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  categories,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(
    product?.images || [],
  );
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(
    product?.primaryImageId || product?.images?.[0]?.id || null,
  );
  const [dragActive, setDragActive] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    discountedPrice: product?.discountedPrice || null,
    stock: product?.stock || 0,
    distributor: product?.distributor ?? "",
    tp: product?.tp ?? null,
    categoryId: product?.categoryId || "",
  });

  useEffect(() => {
    if (product?.images) {
      setExistingImages(product.images);
      setPrimaryImageId(
        product.primaryImageId || product.images[0]?.id || null,
      );
    }
  }, [product]);

  const refreshProduct = async () => {
    if (!product?.id) return;

    setRefreshing(true);
    try {
      const result = await dispatch(
        fetchProducts({ page: 1, limit: 20 }),
      ).unwrap();

      // result is { products, pagination }, not an array
      const updatedProduct = result.products.find(
        (p: any) => p.id === product.id,
      );

      if (updatedProduct) {
        setExistingImages(updatedProduct.images || []);
        const defaultImage = updatedProduct.images?.find(
          (img: any) => img.isDefault,
        );
        setPrimaryImageId(
          defaultImage?.id || updatedProduct.images?.[0]?.id || null,
        );
      }
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Add a refresh button in the UI
  {
    product && (
      <button
        type="button"
        onClick={refreshProduct}
        disabled={refreshing}
        className="ml-2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
        title="Refresh images"
      >
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
      </button>
    );
  }

  const selectedCategory = categories.find(
    (cat) => cat.id === formData.categoryId,
  );
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const discountPercent =
    formData.price &&
    formData.discountedPrice &&
    formData.discountedPrice < formData.price
      ? Math.round(
          ((formData.price - formData.discountedPrice) / formData.price) * 100,
        )
      : 0;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setCreatingCategory(true);
    try {
      const result = await dispatch(
        createCategory({ name: newCategoryName, description: newCategoryDesc }),
      ).unwrap();

      toast.success("Category created successfully");
      setFormData({ ...formData, categoryId: result.id });
      setNewCategoryName("");
      setNewCategoryDesc("");
      setIsCreateCategoryModalOpen(false);
      setIsCategoryDropdownOpen(false);
      await dispatch(fetchCategories());
    } catch (error: any) {
      toast.error(error?.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndAddImages(files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    validateAndAddImages(files);
  };

  const validateAndAddImages = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isValidType = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;

      if (!isValidType) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedImages([...selectedImages, ...validFiles]);
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // src/app/dashboard/products/ProductForm.tsx - Update the functions

  const removeExistingImage = async (imageId: string) => {
    if (!product?.id) {
      toast.error("Product not found");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        deleteProductImage({ productId: product.id, imageId }),
      ).unwrap();

      // Optimistically update UI
      setExistingImages(existingImages.filter((img) => img.id !== imageId));
      if (primaryImageId === imageId) {
        const newPrimary = existingImages.find((img) => img.id !== imageId);
        setPrimaryImageId(newPrimary?.id || null);
      }

      // Refresh to ensure consistency
      await refreshProduct();
    } catch (error: any) {
      console.error("Delete image error:", error);
      toast.error(error?.message || "Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  // src/app/dashboard/products/ProductForm.tsx

  const setAsPrimaryImage = async (imageId: string) => {
    if (!product?.id) {
      toast.error("Product not found");
      return;
    }

    setLoading(true);
    try {
      console.log("Setting default image:", { productId: product.id, imageId });

      await dispatch(
        setDefaultProductImage({ productId: product.id, imageId }),
      ).unwrap();

      // Update local state immediately for better UX
      setPrimaryImageId(imageId);
      setExistingImages(
        existingImages.map((img) => ({
          ...img,
          isDefault: img.id === imageId,
        })),
      );

      toast.success("Primary image updated");

      // Refresh product data from server to ensure consistency
      setTimeout(async () => {
        await refreshProduct();
      }, 500);
    } catch (error: any) {
      console.error("Set default image error:", error);
      toast.error(error?.message || "Failed to set primary image");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.categoryId || formData.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      if (product) {
        // Update existing product
        const updateData: Partial<Product> = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          discountedPrice: formData.discountedPrice,
          stock: formData.stock,
          distributor: formData.distributor || null,
          tp: formData.tp,
          categoryId: formData.categoryId,
        };

        if (primaryImageId) {
          updateData.primaryImageId = primaryImageId;
        }

        await dispatch(
          updateProduct({ id: product.id, data: updateData }),
        ).unwrap();
        toast.success("Product updated successfully");

        // Upload new images if any - uses 'images' field name
        if (selectedImages.length > 0) {
          setUploadingImages(true);
          try {
            await dispatch(
              uploadProductImages({
                productId: product.id,
                images: selectedImages,
              }),
            ).unwrap();
            toast.success(
              `${selectedImages.length} image(s) uploaded successfully`,
            );

            // Refresh to get updated images
            await dispatch(fetchProducts({ page: 1, limit: 20 })).unwrap();
            setSelectedImages([]);
            setImagePreviews([]);
          } catch (uploadError: any) {
            console.error("Upload error:", uploadError);
            toast.error(uploadError.message || "Failed to upload images");
          } finally {
            setUploadingImages(false);
          }
        }
      } else {
        // Create product without images first (simpler approach)
        const productData = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          discountedPrice: formData.discountedPrice,
          stock: formData.stock,
          distributor: formData.distributor || null,
          tp: formData.tp,
          categoryId: formData.categoryId,
        };

        const result = await dispatch(createProduct(productData)).unwrap();
        toast.success("Product created successfully");

        // Upload images after product creation - uses 'images' field name
        if (selectedImages.length > 0 && result.id) {
          setUploadingImages(true);
          try {
            await dispatch(
              uploadProductImages({
                productId: result.id,
                images: selectedImages,
              }),
            ).unwrap();
            toast.success(
              `${selectedImages.length} image(s) uploaded successfully`,
            );
          } catch (uploadError: any) {
            console.error("Upload error:", uploadError);
            toast.error(uploadError.message || "Failed to upload images");
          } finally {
            setUploadingImages(false);
          }
        }
      }
      onSuccess();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            {product && (
              <button
                type="button"
                onClick={refreshProduct}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Package
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              placeholder="e.g., Napa Extra 500mg"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Product description..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Layers
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
            />
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white flex items-center justify-between"
            >
              <span
                className={selectedCategory ? "text-gray-900" : "text-gray-400"}
              >
                {selectedCategory?.name || "Select Category"}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${isCategoryDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isCategoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen(false);
                      setIsCreateCategoryModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-gray-100"
                  >
                    <FolderPlus size={14} />
                    <span>Create New Category</span>
                  </button>

                  <div className="max-h-48 overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No categories found
                      </div>
                    ) : (
                      filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, categoryId: cat.id });
                            setCategorySearch("");
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                            formData.categoryId === cat.id
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{cat.name}</span>
                          {formData.categoryId === cat.id && (
                            <CheckCircle size={14} className="text-blue-600" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Distributor and TP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Distributor
            </label>
            <input
              type="text"
              value={formData.distributor}
              onChange={(e) =>
                setFormData({ ...formData, distributor: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              TP
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.tp ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tp: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Price and Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stock <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: parseInt(e.target.value) })
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Discounted Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Discounted Price
          </label>
          <div className="relative">
            <Tag
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="number"
              step="0.01"
              value={formData.discountedPrice || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountedPrice: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                })
              }
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
              min="0"
            />
          </div>
          {discountPercent > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <CheckCircle size={12} />
                {discountPercent}% OFF
              </div>
              <span className="text-xs text-gray-500">
                Customer saves ৳
                {(
                  formData.price - (formData.discountedPrice || 0)
                ).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Existing Images */}
        {product && existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Images
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Click the star icon to set as primary product image
            </p>
            <div className="grid grid-cols-3 gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group">
                  <div
                    className={`aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 shadow-sm transition-all ${
                      primaryImageId === img.id
                        ? "border-yellow-400 ring-2 ring-yellow-400/50"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || product.name || ""}
                      className="w-full h-full object-cover"
                    />
                    {primaryImageId === img.id && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={10} />
                        Primary
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAsPrimaryImage(img.id)}
                      disabled={loading}
                      className={`p-1.5 rounded-lg transition-all shadow-md ${
                        primaryImageId === img.id
                          ? "bg-yellow-400 text-yellow-800"
                          : "bg-white text-gray-600 hover:bg-yellow-50"
                      } disabled:opacity-50`}
                      title="Set as primary image"
                    >
                      <Star size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      disabled={loading}
                      className="p-1.5 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-all shadow-md disabled:opacity-50"
                      title="Delete image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Images */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {product ? "Add New Images" : "Product Images"}
          </label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              onChange={handleImageSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-3">
                <Upload size={32} className="text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, JPEG, WEBP up to 5MB
              </p>
              <p className="text-xs text-gray-400">
                You can select multiple images
              </p>
            </div>
          </div>

          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  New Images ({imagePreviews.length})
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImages([]);
                    setImagePreviews([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!product && imagePreviews.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <AlertCircle
              size={16}
              className="text-blue-600 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-blue-700">
              You can add images after creating the product. Click "Create
              Product" first, then upload images. The first image will be set as
              primary by default.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            loading={loading || uploadingImages}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
            disabled={loading || uploadingImages}
          >
            {uploadingImages ? (
              <>
                <Upload size={16} className="mr-2 animate-pulse" />
                Uploading Images...
              </>
            ) : product ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1 border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Create Category Modal */}
      {isCreateCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <FolderPlus size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Category
                </h3>
              </div>
              <button
                onClick={() => setIsCreateCategoryModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Electronics, Clothing, Books"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the category"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateCategory}
                  loading={creatingCategory}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <FolderPlus size={16} className="mr-2" />
                  Create Category
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateCategoryModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
