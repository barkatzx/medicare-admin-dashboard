"use client";

import StockManagementModal from "@/components/products/StockManagementModal";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import { api, type Product, type ProductPagination } from "@/config/api";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const PRODUCTS_PER_PAGE = 20;

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductPagination>({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await api.getLowStockProducts(page, PRODUCTS_PER_PAGE);
      const totalPages = Math.max(1, result.pagination.totalPages);
      if (page > totalPages) {
        setCurrentPage(totalPages);
        return;
      }

      setProducts(result.products);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load low-stock products",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts(currentPage);
  }, [currentPage, loadProducts]);

  const totalPages = Math.max(1, pagination.totalPages);

  const getProductImage = (product: Product): string | null => {
    if (product.primaryImageId && product.images?.length) {
      const primaryImage = product.images.find(
        (image) => image.id === product.primaryImageId,
      );
      if (primaryImage?.url) return primaryImage.url;
    }

    return product.images?.[0]?.url ?? null;
  };

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-lg bg-amber-100 p-1.5">
              <AlertTriangle size={14} className="text-amber-600 md:size-4" />
            </span>
            <h1 className="text-sm font-semibold text-gray-900 md:text-lg">
              Low Stock
            </h1>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 md:px-2.5 md:text-xs">
              {pagination.total}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void loadProducts(currentPage)}
            disabled={loading}
            title="Refresh products"
            aria-label="Refresh low-stock products"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition-colors hover:bg-gray-100 disabled:opacity-50 md:h-10 md:w-10"
          >
            <RefreshCw
              size={16}
              className={`text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent md:h-10 md:w-10" />
                <p className="text-xs font-medium text-gray-500 md:text-sm">
                  Loading...
                </p>
              </div>
            </div>
          )}

          {!loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 md:mb-4 md:h-20 md:w-20">
                <Package size={28} className="text-gray-400 md:size-8" />
              </div>
              <p className="text-sm font-medium text-gray-500 md:text-base">
                No low-stock products
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table – unchanged */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {[
                        "Product",
                        "Category",
                        "Distributor",
                        "MRP",
                        "TP",
                        "Stock",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const imageUrl = getProductImage(product);
                      const stockTone =
                        product.stock === 0
                          ? "bg-red-100 text-red-700"
                          : product.stock <= 10
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700";

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={product.name ?? ""}
                                    className="w-full h-full object-cover rounded-full border border-gray-200"
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <Package
                                    size={16}
                                    className="text-amber-600"
                                  />
                                )}
                              </div>
                              <p className="text-sm text-gray-900">
                                {product.name}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              {product.category?.name ?? "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="rounded-lg bg-olive-100 px-2.5 py-1 text-xs font-medium text-olive-600">
                              {product.distributor ?? "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-semibold text-gray-900">
                            {formatSalesCurrency(product.price)}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {product.tp == null
                              ? "N/A"
                              : formatSalesCurrency(product.tp)}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stockTone}`}
                            >
                              {product.stock} units
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(product)}
                              title="Manage Stock"
                              aria-label={`Manage stock for ${product.name}`}
                              className="rounded-lg bg-emerald-100 p-2 text-emerald-600 transition-colors hover:bg-emerald-200"
                            >
                              <Pencil size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list – redesigned */}
              <ul className="divide-y divide-gray-100 md:hidden">
                {products.map((product) => {
                  const imageUrl = getProductImage(product);
                  const stockTone =
                    product.stock === 0
                      ? "bg-red-50 text-red-600"
                      : product.stock <= 10
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-emerald-600";

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
                              alt={product.name ?? "Product"}
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
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          aria-label={`Manage stock for ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors active:scale-95"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Pagination – compact on mobile */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-3 py-3 sm:px-6 sm:py-4">
            <p className="text-[11px] text-gray-500 sm:text-sm">
              <span className="hidden sm:inline">
                Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–
                {Math.min(currentPage * PRODUCTS_PER_PAGE, pagination.total)} of{" "}
                {pagination.total}
              </span>
              <span className="sm:hidden">
                {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–
                {Math.min(currentPage * PRODUCTS_PER_PAGE, pagination.total)} of{" "}
                {pagination.total}
              </span>
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl md:h-auto md:w-auto md:p-2"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[60px] text-center text-xs font-medium text-gray-600 sm:text-sm">
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl md:h-auto md:w-auto md:p-2"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <StockManagementModal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onSuccess={() => void loadProducts(currentPage)}
      />
    </div>
  );
}
