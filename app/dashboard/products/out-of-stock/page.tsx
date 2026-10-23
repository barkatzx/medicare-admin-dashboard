"use client";

import StockManagementModal from "@/components/products/StockManagementModal";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import Loading from "@/components/ui/loading";
import Pagination from "@/components/ui/Pagination";
import Table from "@/components/ui/Table";
import { api, type Product, type ProductPagination } from "@/config/api";
import { Package, Pencil, RefreshCw } from "lucide-react";
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
            <span className="shrink-0 rounded-lg bg-red-100 p-1.5">
              <Package size={14} className="text-red-600 md:size-4" />
            </span>
            <h1 className="text-sm font-semibold text-gray-900 md:text-lg">
              Out of Stock
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
            aria-label="Refresh out-of-stock products"
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
              <Loading message="Loading..." variant="section" />
            </div>
          )}

          {!loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 md:mb-4 md:h-20 md:w-20">
                <Package size={28} className="text-gray-400 md:size-8" />
              </div>
              <p className="text-sm font-medium text-gray-500 md:text-base">
                No out-of-stock products
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table – unchanged */}
              <Table view="desktop">
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
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <Package
                                    size={16}
                                    className="text-blue-600"
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
              </Table>

              {/* Mobile list – redesigned */}
              <Table view="mobile">
                <ul className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const imageUrl = getProductImage(product);
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
                          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            0
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
              </Table>
            </>
          )}
        </div>

        <Pagination
          pagination={{
            page: currentPage,
            limit: PRODUCTS_PER_PAGE,
            total: pagination.total,
            pages: pagination.totalPages,
          }}
          currentPage={currentPage}
          loading={loading}
          recordLabel="products"
          onPageChange={setCurrentPage}
        />
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
