"use client";

import { RootState } from "@/store/index";
import {
  fetchFeaturedProducts,
  updateFeaturedStatus,
} from "@/store/slices/featuredSlice";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

export default function FeaturedProductsPage() {
  const dispatch = useDispatch();
  const { featuredProducts, pagination, loading, error } = useSelector(
    (state: RootState) => state.featured,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchFeaturedProducts(currentPage) as any);
  }, [dispatch, currentPage]);

  const handleRemoveFeatured = async (productId: string) => {
    setUpdatingId(productId);
    try {
      await dispatch(
        updateFeaturedStatus({ productId, featured: false }) as any,
      );
      toast.success("Product removed from featured");
    } catch (err) {
      console.error("Remove featured error:", err);
      toast.error("Failed to remove from featured");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefresh = () => {
    dispatch(fetchFeaturedProducts(currentPage) as any);
  };

  if (error && !loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle size={24} className="text-rose-600" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-700">
            Failed to load featured products
          </p>
          <p className="mb-5 text-xs text-gray-400">{error}</p>
          <button
            onClick={() => dispatch(fetchFeaturedProducts(currentPage) as any)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totalValue = featuredProducts.reduce(
    (sum, p) => sum + (p.finalPrice || p.price),
    0,
  );
  const totalStock = featuredProducts.reduce((sum, p) => sum + p.stock, 0);
  const categoryCount = new Set(featuredProducts.map((p) => p.categoryId)).size;

  return (
    <div className="min-w-0 space-y-6">
      {/* ─── Featured Products Table ─────────────────────────────── */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
              <Heart size={15} strokeWidth={2.25} className="fill-current" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Featured products
              </h2>
              <p className="text-[11px] text-gray-500">
                {pagination.total}{" "}
                {pagination.total === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh featured products"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 ${
              loading ? "animate-spin" : ""
            } md:hidden`}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="relative">
          {loading && featuredProducts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-pink-500 border-t-transparent" />
              <p className="mt-3 text-xs font-medium text-gray-500">
                Loading featured products…
              </p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <Heart size={22} className="text-gray-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">
                No featured products yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-gray-400">
                Go to the Products page and click the heart icon to mark
                products as featured
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {/* <th className="w-14 px-6 py-3">#</th> */}
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Distributors</th>
                    <th className="px-6 py-3 text-right">MRP</th>
                    <th className="px-6 py-3 text-right">TP</th>
                    <th className="px-6 py-3 text-center">Stock</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {featuredProducts.map((product, index) => {
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
                                ? "bg-pink-100 text-pink-700 ring-1 ring-inset ring-pink-200/60"
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
                              onClick={() => handleRemoveFeatured(product.id)}
                              disabled={isUpdating}
                              aria-label={`Remove ${product.name} from featured`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-600 ring-1 ring-inset ring-pink-100 transition-all hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-100 disabled:opacity-50"
                              title="Remove from featured"
                            >
                              {isUpdating ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Heart
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

                <ul className="divide-y divide-gray-100 md:hidden">
                  {featuredProducts.map((product, index) => {
                    const defaultImage =
                      product.images?.find((img) => img.isDefault) ||
                      product.images?.[0];
                    const isUpdating = updatingId === product.id;
                    const isLow = product.stock <= 20;

                    return (
                      <li key={product.id} className="min-w-0 p-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                            {defaultImage?.url ? (
                              <Image
                                src={defaultImage.url}
                                alt={product.name || "Product"}
                                fill
                                sizes="48px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Package size={20} className="text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="break-words text-sm font-semibold text-gray-900">
                                {product.name}
                              </p>
                              {index === 0 && (
                                <span className="shrink-0 rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {product.category?.name || "Uncategorized"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
                              isLow
                                ? "bg-rose-50 text-rose-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {product.stock} in stock
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
                              ৳{product.price.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">TP</p>
                            <p className="mt-0.5 font-medium tabular-nums text-gray-700">
                              {product.tp === null || product.tp === undefined
                                ? "N/A"
                                : `৳${product.tp.toLocaleString()}`}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveFeatured(product.id)}
                            disabled={isUpdating}
                            aria-label={`Remove ${product.name} from featured`}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-pink-50 px-3 text-pink-700 ring-1 ring-inset ring-pink-100 transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-100 disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Heart size={15} className="fill-current" />
                            )}
                            <span className="text-xs font-medium">
                              Remove from featured
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
        {pagination.totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4 sm:px-6">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
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

              <div className="flex max-w-full items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={loading || !pagination.hasPrevPage}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
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
                        className={`h-10 min-w-10 shrink-0 rounded-lg px-2 text-xs font-semibold tabular-nums transition-all md:h-8 md:min-w-8 ${
                          page === currentPage
                            ? "bg-pink-600 text-white shadow-[0_1px_2px_rgba(219,39,119,0.3)]"
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
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
