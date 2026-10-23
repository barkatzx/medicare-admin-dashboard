"use client";

import {
  fetchTrendingProducts,
  updateTrendingStatus,
} from "@/store/slices/trendingSlice";
import Loading from "@/components/ui/loading";
import Pagination from "@/components/ui/Pagination";
import Table from "@/components/ui/Table";
import { AlertCircle, Loader2, Package, RefreshCw, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function TrendingProductsPage() {
  const dispatch = useAppDispatch();
  const { trendingProducts, pagination, loading, error } = useAppSelector(
    (state) => state.trending,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const request = dispatch(fetchTrendingProducts(currentPage));
    return () => request.abort();
  }, [dispatch, currentPage]);

  const handleRemoveTrending = async (productId: string) => {
    setUpdatingId(productId);
    try {
      const result = await dispatch(
        updateTrendingStatus({ productId, trending: false }),
      );
      if (updateTrendingStatus.fulfilled.match(result)) {
        const request = dispatch(fetchTrendingProducts(currentPage));
        await request;
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefresh = () => {
    dispatch(fetchTrendingProducts(currentPage));
  };

  if (error && !loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle size={24} className="text-rose-600" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-700">
            Failed to load trending products
          </p>
          <p className="mb-5 text-xs text-gray-400">{error}</p>
          <button
            onClick={() => dispatch(fetchTrendingProducts(currentPage))}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      {/* ─── Trending Products Table ─────────────────────────────── */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 md:h-8 md:w-8">
              <Star
                size={14}
                strokeWidth={2.25}
                className="fill-current md:size-[15px]"
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                Trending
              </h2>
              <p className="text-[11px] text-gray-500 md:text-xs">
                {pagination.total}{" "}
                {pagination.total === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh trending products"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 md:h-10 md:w-10 ${
              loading ? "animate-spin" : ""
            }`}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="relative">
          {loading && trendingProducts.length === 0 ? (
            <Loading message="Loading trending products…" variant="section" />
          ) : trendingProducts.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[280px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <Star size={22} className="text-gray-300" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-500 md:mt-4">
                No trending products yet
              </p>
              <p className="mt-1 max-w-xs text-[11px] text-gray-400 md:text-xs">
                Mark products as trending from the Products page
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table – unchanged */}
              <Table view="desktop">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Distributor</th>
                      <th className="px-6 py-3 text-right">MRP</th>
                      <th className="px-6 py-3 text-right">TP</th>
                      <th className="px-6 py-3 text-center">Stock</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trendingProducts.map((product, index) => {
                      const defaultImage =
                        product.images?.find((img) => img.isDefault) ||
                        product.images?.[0];
                      const isUpdating = updatingId === product.id;
                      const isLow = product.stock <= 20;

                      return (
                        <tr
                          key={product.id}
                          className="group transition-colors hover:bg-gray-50/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                {defaultImage?.url ? (
                                  <Image
                                    src={defaultImage.url}
                                    alt={product.name || "Product"}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Package
                                      size={16}
                                      className="text-gray-300"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-900">
                                  {product.name}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-inset ring-gray-100">
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-inset ring-gray-100">
                              {product.distributor ?? "N/A"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold tabular-nums text-gray-900">
                              ৳{product.price.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold tabular-nums text-gray-900">
                              {product.tp === null || product.tp === undefined
                                ? "N/A"
                                : `৳${product.tp.toLocaleString()}`}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset tabular-nums ${
                                isLow
                                  ? "bg-rose-50 text-rose-700 ring-rose-200/60"
                                  : "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                              }`}
                            >
                              {product.stock}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => handleRemoveTrending(product.id)}
                                disabled={isUpdating}
                                aria-label={`Remove ${product.name} from trending`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 ring-1 ring-inset ring-yellow-100 transition-all hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-100 disabled:opacity-50"
                                title="Remove from trending"
                              >
                                {isUpdating ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Star
                                    size={14}
                                    className="fill-current transition-transform duration-200 group-hover:scale-105"
                                  />
                                )}
                              </button>
                            </div>
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
                  {trendingProducts.map((product, index) => {
                    const defaultImage =
                      product.images?.find((img) => img.isDefault) ||
                      product.images?.[0];
                    const isUpdating = updatingId === product.id;
                    const isLow = product.stock <= 20;

                    return (
                      <li
                        key={product.id}
                        className="min-w-0 px-3 py-3 active:bg-gray-50"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                            {defaultImage?.url ? (
                              <Image
                                src={defaultImage.url}
                                alt={product.name || "Product"}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Package size={18} className="text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {product.name}
                              </p>
                              {index === 0 && (
                                <span className="shrink-0 rounded-full bg-yellow-50 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                                  Top
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-gray-500">
                              {product.category?.name || "Uncategorized"}
                              {product.distributor
                                ? ` · ${product.distributor}`
                                : ""}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs font-semibold tabular-nums text-gray-900">
                                ৳{product.price.toLocaleString()}
                              </span>
                              {product.tp != null && (
                                <span className="text-[11px] tabular-nums text-gray-400">
                                  TP ৳{product.tp.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                              isLow
                                ? "bg-rose-50 text-rose-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
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
                            onClick={() => handleRemoveTrending(product.id)}
                            disabled={isUpdating}
                            aria-label={`Remove ${product.name} from trending`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 transition-colors active:scale-95 disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Star size={14} className="fill-current" />
                            )}
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
            limit: 20,
            total: pagination.total,
            pages: pagination.totalPages,
          }}
          currentPage={currentPage}
          loading={loading}
          recordLabel="products"
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
