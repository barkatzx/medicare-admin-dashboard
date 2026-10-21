"use client";

import StockManagementModal from "@/components/products/StockManagementModal";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import { api, type Product, type ProductPagination } from "@/config/api";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const PRODUCTS_PER_PAGE = 20;

export default function OutOfStockPage() {
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
      const result = await api.getOutOfStockProducts(page, PRODUCTS_PER_PAGE);
      const totalPages = Math.max(1, result.pagination.totalPages);
      if (page > totalPages) {
        setCurrentPage(totalPages);
        return;
      }

      setProducts(result.products);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load products",
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
    <div className="min-w-0 space-y-6">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-lg bg-red-100 p-1.5">
              <Package size={16} className="text-red-600" />
            </span>
            <h1 className="text-base font-semibold text-gray-900 md:text-lg">
              Out of Stock Products
            </h1>
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {pagination.total}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void loadProducts(currentPage)}
            disabled={loading}
            title="Refresh products"
            aria-label="Refresh out-of-stock products"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition-colors hover:bg-gray-100 disabled:opacity-50"
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
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-sm font-medium text-gray-500">
                  Loading out-of-stock products...
                </p>
              </div>
            </div>
          )}

          {!loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <Package size={32} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-500">
                No out-of-stock products
              </p>
            </div>
          ) : (
            <>
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
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Package size={16} className="text-blue-600" />
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
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            0 units
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

                <ul className="divide-y divide-gray-100 md:hidden">
                  {products.map((product) => {
                    const imageUrl = getProductImage(product);
                    return (
                      <li key={product.id} className="min-w-0 p-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
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
                          <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                            0 units
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
                            <p className="mt-0.5 font-semibold tabular-nums text-gray-900">
                              {formatSalesCurrency(product.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">TP</p>
                            <p className="mt-0.5 font-medium tabular-nums text-gray-700">
                              {product.tp == null
                                ? "N/A"
                                : formatSalesCurrency(product.tp)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            aria-label={`Manage stock for ${product.name}`}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-100 px-3 text-emerald-700 transition-colors hover:bg-emerald-200"
                          >
                            <Pencil size={15} />
                            <span className="text-xs font-medium">
                              Manage stock
                            </span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
        </div>

        {pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:px-6">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–
              {Math.min(currentPage * PRODUCTS_PER_PAGE, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:bg-white disabled:opacity-50 md:h-auto md:w-auto md:p-2"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:bg-white disabled:opacity-50 md:h-auto md:w-auto md:p-2"
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
