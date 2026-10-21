"use client";

import ProductForm from "@/components/products/ProductForm";
import StockManagementModal from "@/components/products/StockManagementModal";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { api, Product } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCategories } from "@/store/slices/categorySlice";
import {
  fetchFeaturedProducts,
  updateFeaturedStatus,
} from "@/store/slices/featuredSlice";
import {
  deleteProduct,
  fetchInventoryStats,
  fetchProducts,
} from "@/store/slices/productSlice";
import {
  fetchTrendingProducts,
  updateTrendingStatus,
} from "@/store/slices/trendingSlice";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Heart,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const { products, loading, pagination, inventoryStats } = useAppSelector(
    (state) => state.products,
  );
  const { categories } = useAppSelector((state) => state.categories);
  const { pagination: trendingPagination } = useAppSelector(
    (state) => state.trending,
  );
  const { pagination: featuredPagination } = useAppSelector(
    (state) => state.featured,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stockCounts, setStockCounts] = useState<{
    lowStock: number | null;
    outOfStock: number | null;
  }>({ lowStock: null, outOfStock: null });

  const loadStockCounts = useCallback(async () => {
    try {
      const [lowStock, outOfStock] = await Promise.all([
        api.getLowStockProducts(1, 1),
        api.getOutOfStockProducts(1, 1),
      ]);
      setStockCounts({
        lowStock: lowStock.pagination.total,
        outOfStock: outOfStock.pagination.total,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load stock counts",
      );
    }
  }, []);

  const loadProducts = useCallback(() => {
    dispatch(
      fetchProducts({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        categoryId: filterCategory !== "all" ? filterCategory : undefined,
      }),
    );
    dispatch(fetchInventoryStats() as any);
    void loadStockCounts();
  }, [dispatch, currentPage, searchTerm, filterCategory, loadStockCounts]);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTrendingProducts() as any);
    dispatch(fetchFeaturedProducts() as any);
    dispatch(fetchInventoryStats() as any);
  }, [dispatch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteProduct(productToDelete)).unwrap();
      toast.success("Product deleted successfully");
      loadProducts();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await dispatch(
        updateFeaturedStatus({
          productId: product.id,
          featured: !product.featured,
        }) as any,
      );
      loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleTrending = async (product: Product) => {
    try {
      await dispatch(
        updateTrendingStatus({
          productId: product.id,
          trending: !product.trending,
        }) as any,
      );
      loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const getProductImage = (product: Product): string | null => {
    if (product.primaryImageId && product.images?.length) {
      const primary = product.images.find(
        (img) => img.id === product.primaryImageId,
      );
      if (primary?.url) return primary.url;
    }
    return product.images?.[0]?.url ?? null;
  };

  const renderProductActions = (product: Product) => (
    <div className="flex items-center gap-2 md:gap-1.5">
      <button
        type="button"
        onClick={() => handleToggleFeatured(product)}
        aria-label={
          product.featured
            ? `Remove ${product.name} from featured`
            : `Add ${product.name} to featured`
        }
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:h-auto md:w-auto md:p-2 ${
          product.featured
            ? "text-pink-600 bg-pink-100 hover:bg-pink-200"
            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
        }`}
        title={product.featured ? "Remove from Featured" : "Add to Featured"}
      >
        <Heart
          size={16}
          className={product.featured ? "fill-current" : ""}
        />
      </button>
      <button
        type="button"
        onClick={() => handleToggleTrending(product)}
        aria-label={
          product.trending
            ? `Remove ${product.name} from trending`
            : `Add ${product.name} to trending`
        }
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:h-auto md:w-auto md:p-2 ${
          product.trending
            ? "text-yellow-600 bg-yellow-100 hover:bg-yellow-200"
            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
        }`}
        title={product.trending ? "Remove from Trending" : "Add to Trending"}
      >
        <Star
          size={16}
          className={product.trending ? "fill-current" : ""}
        />
      </button>
      <button
        type="button"
        onClick={() => {
          setSelectedProduct(product);
          setIsStockModalOpen(true);
        }}
        aria-label={`Manage stock for ${product.name}`}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200 md:h-auto md:w-auto md:p-2"
        title="Manage Stock"
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          setEditingProduct(product);
          setIsModalOpen(true);
        }}
        aria-label={`Edit ${product.name}`}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200 md:h-auto md:w-auto md:p-2"
        title="Edit Product"
      >
        <Edit size={16} />
      </button>
      <button
        type="button"
        onClick={() => setProductToDelete(product.id)}
        disabled={isDeleting && productToDelete === product.id}
        aria-label={`Delete ${product.name}`}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50 md:h-auto md:w-auto md:p-2"
        title="Delete Product"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const getPageNumbers = (): number[] => {
    if (!pagination?.pages) return [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(pagination.pages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const totalValue =
    inventoryStats?.totalValue ??
    products.reduce(
      (sum, p) => sum + (p.discountedPrice ?? p.price) * p.stock,
      0,
    );

  const visibleProducts = showLowStock
    ? products.filter((p) => p.stock <= 20)
    : products;

  const stats = [
    {
      label: "Total Products",
      value: pagination?.total ?? products.length,
      icon: Package,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Low Stock",
      value: stockCounts.lowStock ?? "—",
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Out of Stock",
      value: stockCounts.outOfStock ?? "—",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Trending",
      value: trendingPagination.total,
      icon: Star,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Featured",
      value: featuredPagination.total,
      icon: Heart,
      color: "bg-pink-50 text-pink-600",
    },
  ];

  if (loading && products.length === 0 && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 md:space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="relative min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 md:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 md:text-sm">{label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">{value}</p>
              </div>
              <div
                className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:flex ${color}`}
              >
                <Icon size={22} className="text-current" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 sm:w-auto ${
            showLowStock
              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white "
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <AlertTriangle size={16} />
          {showLowStock ? "Show All" : "Low Stock Only"}
        </button>

        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2 bg-blue-600 shadow-lg sm:w-auto"
        >
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {searchTerm && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-xl">
          <Search size={14} className="text-blue-600" />
          <span>
            Results for:{" "}
            <strong className="text-gray-700">"{searchTerm}"</strong>
          </span>
          <button
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="ml-auto text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Package size={16} className="text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 md:text-lg">Products</h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full ml-2">
              {pagination?.total ?? products.length}
            </span>
          </div>
          <button
            onClick={loadProducts}
            type="button"
            aria-label="Refresh products"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition-colors hover:bg-gray-100 ${loading ? "animate-spin" : ""}`}
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">
                  Loading products...
                </p>
              </div>
            </div>
          )}

          {visibleProducts.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No products found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Product",
                      "Category",
                      // "Discounted",
                      "Distributor",
                      "MRP",
                      "TP",
                      "Stock",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => {
                    const imageUrl = getProductImage(product);
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  className="w-full h-full object-cover rounded-full border border-gray-200"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Package size={16} className="text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-900">
                                {product.name}
                              </p>
                              {/* {product.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {product.description.substring(0, 60)}...
                                </p>
                              )} */}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-6">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                            {product.category?.name ?? "N/A"}
                          </span>
                        </td>

                        {/* <td className="py-3 px-6">
                          {product.discountedPrice ? (
                            <span className="text-emerald-600 font-semibold">
                              {formatSalesCurrency(product.discountedPrice)}
                              {(product.discountPercent ?? 0) > 0 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({product.discountPercent}% off)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td> */}

                        <td className="py-3 px-6">
                          <span className="px-2.5 py-1 bg-olive-100 text-olive-600 text-xs font-medium rounded-lg">
                            {product.distributor ?? "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-6 font-semibold text-gray-900">
                          {formatSalesCurrency(product.price)}
                        </td>

                        <td className="py-3 px-6 text-sm font-medium text-gray-900">
                          {product.tp === null || product.tp === undefined
                            ? "N/A"
                            : formatSalesCurrency(product.tp)}
                        </td>

                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                product.stock > 20
                                  ? "bg-emerald-100 text-emerald-700"
                                  : product.stock > 0
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.stock} units
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-6">
                          {renderProductActions(product)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
              <ul className="divide-y divide-gray-100 md:hidden">
                {visibleProducts.map((product) => {
                  const imageUrl = getProductImage(product);
                  return (
                    <li key={product.id} className="min-w-0 p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name || "Product"}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <Package size={20} className="text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-gray-900">
                          {product.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {product.category?.name ?? "N/A"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          product.stock > 20
                            ? "bg-emerald-100 text-emerald-700"
                            : product.stock > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div className="min-w-0">
                        <p className="text-gray-400">Distributor</p>
                        <p className="mt-0.5 truncate font-medium text-gray-700">
                          {product.distributor ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">MRP</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {formatSalesCurrency(product.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">TP</p>
                        <p className="mt-0.5 font-medium text-gray-700">
                          {product.tp === null || product.tp === undefined
                            ? "N/A"
                            : formatSalesCurrency(product.tp)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                      {renderProductActions(product)}
                    </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:px-6">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>
            <div className="flex max-w-full items-center gap-1.5 overflow-x-auto sm:gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                aria-label="Previous page"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:bg-white disabled:opacity-50 md:h-auto md:w-auto md:p-2"
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={loading}
                  className={`min-h-10 min-w-10 shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all md:min-h-0 md:min-w-0 ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white border border-blue-600"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={currentPage === pagination.pages || loading}
                aria-label="Next page"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-white disabled:opacity-50 md:h-auto md:w-auto md:p-2"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSuccess={() => {
            setIsModalOpen(false);
            loadProducts();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <StockManagementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProduct}
        onSuccess={loadProducts}
      />

      <Modal
        isOpen={!!productToDelete}
        onClose={() => !isDeleting && setProductToDelete(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this product?
              </p>
              <p className="text-xs text-red-600 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              loading={isDeleting}
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
