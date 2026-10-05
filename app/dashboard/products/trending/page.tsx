"use client";

import { RootState } from "@/store/index";
import {
  fetchTrendingProducts,
  updateTrendingStatus,
} from "@/store/slices/trendingSlice";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

export default function TrendingProductsPage() {
  const dispatch = useDispatch();
  const { trendingProducts, pagination, loading, error } = useSelector(
    (state: RootState) => state.trending,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchTrendingProducts(currentPage) as any);
  }, [dispatch, currentPage]);

  const handleRemoveTrending = async (productId: string) => {
    setUpdatingId(productId);
    try {
      await dispatch(
        updateTrendingStatus({ productId, trending: false }) as any,
      );
      toast.success("Product removed from trending");
    } catch (err) {
      console.error("Remove trending error:", err);
      toast.error("Failed to remove from trending");
    } finally {
      setUpdatingId(null);
    }
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
            onClick={() => dispatch(fetchTrendingProducts(currentPage) as any)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totalValue = trendingProducts.reduce(
    (sum, p) => sum + (p.finalPrice || p.price),
    0,
  );
  const totalStock = trendingProducts.reduce((sum, p) => sum + p.stock, 0);
  const categoryCount = new Set(trendingProducts.map((p) => p.categoryId)).size;

  const stats = [
    {
      label: "Total trending",
      value: pagination.total,
      icon: Star,
      accent: "bg-yellow-400",
      iconTone: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Total value",
      value: `৳${totalValue.toLocaleString()}`,
      icon: TrendingUp,
      accent: "bg-emerald-500",
      iconTone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Categories",
      value: categoryCount,
      icon: Shield,
      accent: "bg-violet-500",
      iconTone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Total stock",
      value: totalStock.toLocaleString(),
      icon: Package,
      accent: "bg-blue-500",
      iconTone: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, accent, iconTone }) => (
          <article
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone} transition-transform duration-200 group-hover:scale-105`}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  {label}
                </p>
                <p className="mt-0.5 truncate text-xl font-bold tabular-nums tracking-tight text-gray-900">
                  {value}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ─── Trending Products Table ─────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
              <Star size={15} strokeWidth={2.25} className="fill-current" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Trending products
              </h2>
              <p className="text-[11px] text-gray-500">
                {pagination.total}{" "}
                {pagination.total === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          {loading && trendingProducts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-yellow-500 border-t-transparent" />
              <p className="mt-3 text-xs font-medium text-gray-500">
                Loading trending products…
              </p>
            </div>
          ) : trendingProducts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <Star size={22} className="text-gray-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">
                No trending products yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-gray-400">
                Go to the Products page and click the star icon to mark products
                as trending
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {/* <th className="w-14 px-6 py-3">#</th> */}
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-center">Stock</th>
                    <th className="px-6 py-3">Discount</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trendingProducts.map((product, index) => {
                    const defaultImage =
                      product.images?.find((img) => img.isDefault) ||
                      product.images?.[0];
                    const isUpdating = updatingId === product.id;
                    const isTop = index === 0;
                    const isLow = product.stock <= 20;

                    return (
                      <tr
                        key={product.id}
                        className="group transition-colors hover:bg-gray-50/80"
                      >
                        {/* <td className="px-6 py-4">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-transform duration-200 group-hover:scale-105 ${
                              isTop
                                ? "bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-200/60"
                                : index < 3
                                  ? "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200/60"
                                  : "bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-100"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td> */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
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

                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold tabular-nums text-gray-900">
                              ৳
                              {(
                                product.finalPrice || product.price
                              ).toLocaleString()}
                            </span>
                            {product.discountPercent > 0 && (
                              <span className="text-[10px] font-medium tabular-nums text-gray-400 line-through">
                                ৳{product.price.toLocaleString()}
                              </span>
                            )}
                          </div>
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
                          {product.discountPercent > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                                −{product.discountPercent}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-400">
                              No discount
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleRemoveTrending(product.id)}
                              disabled={isUpdating}
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
            </div>
          )}
        </div>
        {pagination.totalPages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs font-medium tabular-nums text-gray-500">
                Page{" "}
                <span className="font-semibold text-gray-700">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {pagination.totalPages}
                </span>{" "}
                <span className="text-gray-400">
                  ({pagination.total} products)
                </span>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={loading || !pagination.hasPrevPage}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, index) => {
                    const firstPage = Math.max(
                      1,
                      Math.min(currentPage - 2, pagination.totalPages - 4),
                    );
                    const page = firstPage + index;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={loading}
                        className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold tabular-nums transition-all ${
                          page === currentPage
                            ? "bg-yellow-500 text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                        aria-current={page === currentPage ? "page" : undefined}
                      >
                        {page}
                      </button>
                    );
                  },
                )}

                <button
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pagination.totalPages, page + 1),
                    )
                  }
                  disabled={loading || !pagination.hasNextPage}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
