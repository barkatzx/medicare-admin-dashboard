"use client";

import ProductForm from "@/components/products/ProductForm";
import StockManagementModal from "@/components/products/StockManagementModal";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/loading";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Table from "@/components/ui/Table";
import { useDebouncedValue } from "@/components/utils/useDebouncedValue";
import { api, Product } from "@/config/api";
import { getApiErrorMessage } from "@/config/api/client";
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
  Edit,
  Heart,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const { products, fetchingProducts, pagination, inventoryStats } = useAppSelector(
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
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const isLoadingProducts =
    fetchingProducts || searchTerm !== debouncedSearchTerm;
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
      toast.error(getApiErrorMessage(error, "Failed to load stock counts"));
    }
  }, []);

  const loadProducts = useCallback(() => {
    if (searchTerm !== debouncedSearchTerm) return;
    dispatch(
      fetchProducts({
        page: currentPage,
        limit: 20,
        search: debouncedSearchTerm.trim() || undefined,
        categoryId: filterCategory !== "all" ? filterCategory : undefined,
      }),
    );
  }, [
    dispatch,
    currentPage,
    searchTerm,
    debouncedSearchTerm,
    filterCategory,
  ]);

  const refreshInventoryOverview = useCallback(() => {
    dispatch(fetchInventoryStats());
    void loadStockCounts();
  }, [dispatch, loadStockCounts]);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTrendingProducts());
    dispatch(fetchFeaturedProducts());
    void Promise.resolve().then(refreshInventoryOverview);
  }, [dispatch, refreshInventoryOverview]);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) return;
    const request = dispatch(
      fetchProducts({
        page: currentPage,
        limit: 20,
        search: debouncedSearchTerm.trim() || undefined,
        categoryId: filterCategory !== "all" ? filterCategory : undefined,
      }),
    );
    return () => request.abort();
  }, [
    dispatch,
    currentPage,
    debouncedSearchTerm,
    filterCategory,
    searchTerm,
  ]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteProduct(productToDelete)).unwrap();
      toast.success("Product deleted successfully");
      loadProducts();
      refreshInventoryOverview();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete product"));
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
        }),
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
        }),
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

  // Desktop action buttons (unchanged)
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
        <Heart size={16} className={product.featured ? "fill-current" : ""} />
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
        <Star size={16} className={product.trending ? "fill-current" : ""} />
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

  // Mobile action buttons (compact, icon-only)
  const renderMobileActions = (product: Product) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleToggleFeatured(product)}
        aria-label={
          product.featured
            ? `Remove ${product.name} from featured`
            : `Add ${product.name} to featured`
        }
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors active:scale-95 ${
          product.featured
            ? "bg-pink-50 text-pink-600"
            : "bg-gray-50 text-gray-400"
        }`}
      >
        <Heart size={14} className={product.featured ? "fill-current" : ""} />
      </button>
      <button
        type="button"
        onClick={() => handleToggleTrending(product)}
        aria-label={
          product.trending
            ? `Remove ${product.name} from trending`
            : `Add ${product.name} to trending`
        }
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors active:scale-95 ${
          product.trending
            ? "bg-yellow-50 text-yellow-600"
            : "bg-gray-50 text-gray-400"
        }`}
      >
        <Star size={14} className={product.trending ? "fill-current" : ""} />
      </button>
      <button
        type="button"
        onClick={() => {
          setSelectedProduct(product);
          setIsStockModalOpen(true);
        }}
        aria-label={`Manage stock for ${product.name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors active:scale-95"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={() => {
          setEditingProduct(product);
          setIsModalOpen(true);
        }}
        aria-label={`Edit ${product.name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors active:scale-95"
      >
        <Edit size={14} />
      </button>
      <button
        type="button"
        onClick={() => setProductToDelete(product.id)}
        disabled={isDeleting && productToDelete === product.id}
        aria-label={`Delete ${product.name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors active:scale-95 disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

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

  if (isLoadingProducts && products.length === 0 && currentPage === 1) {
    return <Loading message="Loading products..." />;
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-8">
      {/* Stats – compact on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="relative min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white p-3 md:rounded-2xl md:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500 md:text-sm">
                  {label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-gray-900 md:mt-1 md:text-3xl">
                  {value}
                </p>
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

      {/* Filters – stacked & compact on mobile */}
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-4">
        <div className="flex min-w-0 flex-1 gap-2 sm:contents">
          <SearchInput
            label="Search products"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            loading={isLoadingProducts}
            containerClassName="relative min-w-0 flex-1"
            inputClassName="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:pl-12 md:pr-10 md:py-3 md:rounded-xl"
          />

          <select
            value={filterCategory}
            onChange={(e) => {
              setCurrentPage(1);
              setFilterCategory(e.target.value);
            }}
            className="w-2/5 min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-auto md:rounded-xl md:px-3 md:py-3"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 gap-2 sm:contents">
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all sm:flex-none sm:px-5 sm:py-3 sm:text-sm sm:rounded-xl ${
              showLowStock
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <AlertTriangle size={14} />
            {showLowStock ? "Show All" : "Low Stock"}
          </button>

          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs shadow-md sm:w-auto sm:flex-none sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm sm:shadow-lg"
          >
            <Plus size={14} />
            Add
          </Button>
        </div>
      </div>

      {searchTerm && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2.5 text-xs text-gray-500 md:rounded-xl md:p-3 md:text-sm">
          <Search size={14} className="text-blue-600" />
          <span>
            Results for:{" "}
            <strong className="text-gray-700">
              &quot;{searchTerm}&quot;
            </strong>
          </span>
          <button
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table / List */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-1.5">
              <Package size={14} className="text-blue-600 md:size-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 md:text-lg">
              Products
            </h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 md:px-2.5 md:text-xs">
              {pagination?.total ?? products.length}
            </span>
          </div>
          <button
            onClick={loadProducts}
            type="button"
            aria-label="Refresh products"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition-colors hover:bg-gray-100 md:h-10 md:w-10 ${isLoadingProducts ? "animate-spin" : ""}`}
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="relative">
          {isLoadingProducts && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Loading message="Loading..." variant="section" />
            </div>
          )}

          {visibleProducts.length === 0 && !isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 md:mb-4 md:h-20 md:w-20">
                <Package size={28} className="text-gray-400 md:size-8" />
              </div>
              <p className="text-sm font-medium text-gray-500 md:text-base">
                No products found
              </p>
              <p className="mt-1 text-xs text-gray-400 md:text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table – unchanged */}
              <Table view="desktop">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {[
                        "Product",
                        "Category",
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
                                    alt={product.name ?? "Product"}
                                    className="w-full h-full object-cover rounded-full border border-gray-200"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Package
                                    size={16}
                                    className="text-blue-600"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-900">
                                  {product.name}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-6">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                              {product.category?.name ?? "N/A"}
                            </span>
                          </td>

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
              </Table>

              {/* Mobile list – redesigned */}
              <Table view="mobile">
                <ul className="divide-y divide-gray-100">
                  {visibleProducts.map((product) => {
                    const imageUrl = getProductImage(product);
                    const stockTone =
                      product.stock > 20
                        ? "bg-emerald-50 text-emerald-600"
                        : product.stock > 0
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600";
                    return (
                      <li
                        key={product.id}
                        className="min-w-0 px-3 py-3 active:bg-gray-50"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
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
                              <Package size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {product.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-gray-500">
                              {product.category?.name ?? "N/A"}
                              {product.distributor
                                ? ` · ${product.distributor}`
                                : ""}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs font-semibold tabular-nums text-gray-900">
                                {formatSalesCurrency(product.price)}
                              </span>
                              {product.tp != null && (
                                <span className="text-[11px] tabular-nums text-gray-400">
                                  TP {formatSalesCurrency(product.tp)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${stockTone}`}
                          >
                            {product.stock}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-gray-50 pt-2.5">
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">
                            Actions
                          </span>
                          {renderMobileActions(product)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Table>
            </>
          )}
        </div>

        {/* Pagination – compact on mobile */}
        {pagination && (
          <Pagination
            pagination={pagination}
            currentPage={currentPage}
            loading={isLoadingProducts}
            recordLabel="products"
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <ProductForm
          key={isModalOpen ? editingProduct?.id ?? "new-product" : "closed"}
          product={editingProduct}
          categories={categories}
          onSuccess={() => {
            setIsModalOpen(false);
            loadProducts();
            refreshInventoryOverview();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <StockManagementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProduct}
        onSuccess={() => {
          loadProducts();
          refreshInventoryOverview();
        }}
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
