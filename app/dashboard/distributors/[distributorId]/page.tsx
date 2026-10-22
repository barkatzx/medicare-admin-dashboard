"use client";

import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import { api, type Distributor, type Product } from "@/config/api";
import { ArrowLeft, MapPin, Package, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type DistributorInfo = Distributor;

const PAGE_SIZE = 20;

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return formatSalesCurrency(value);
}

export default function DistributorProductsPage() {
  const params = useParams<{ distributorId: string }>();
  const distributorId = params.distributorId;

  const [distributor, setDistributor] = useState<DistributorInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!distributorId) return;

    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [distributorData, productData] = await Promise.all([
          api.getDistributorById(distributorId),
          api.getDistributorProductsPage(distributorId, page, PAGE_SIZE),
        ]);

        if (!active) return;
        setDistributor(distributorData ?? null);
        setProducts(productData.products);
        setTotalProducts(productData.pagination.total);
        setTotalPages(productData.pagination.totalPages);
      } catch (error) {
        if (!active) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load distributor data",
        );
        setDistributor(null);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [distributorId, page]);

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + (product.stock ?? 0), 0),
    [products],
  );

  const totalValue = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum +
          (product.discountedPrice ?? product.price ?? 0) *
            (product.stock ?? 0),
        0,
      ),
    [products],
  );

  const categoryCount = useMemo(
    () => new Set(products.map((product) => product.categoryId)).size,
    [products],
  );

  const addressParts = [
    distributor?.fullAddress,
    distributor?.upazila?.name,
    distributor?.district?.name,
    distributor?.division?.name,
  ].filter(Boolean);

  if (loading && !distributor) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">
            Loading distributor products…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      {/* ─── Back link ───────────────────────────────────────────── */}
      <Link
        href="/dashboard/distributors"
        className="group inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 md:px-2 md:text-xs"
      >
        <ArrowLeft
          size={13}
          className="transition-transform duration-200 group-hover:-translate-x-0.5 md:size-3.5"
        />
        Back
      </Link>

      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 sm:items-end">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold uppercase text-blue-600 md:h-11 md:w-11 md:rounded-full md:text-sm md:ring-1 md:ring-inset md:ring-blue-100">
            {distributor?.name?.charAt(0) || "D"}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600 md:text-[11px]">
              Distributor
            </p>
            <h1 className="mt-0.5 truncate text-base font-semibold tracking-tight text-gray-900 md:text-2xl">
              {distributor?.name || "Distributor details"}
            </h1>
            {addressParts.length > 0 ? (
              <p className="mt-0.5 flex items-start gap-1 text-[11px] font-medium text-gray-500 md:mt-1 md:gap-1.5 md:text-xs">
                <MapPin size={11} className="mt-0.5 shrink-0 md:size-[13px]" />
                <span className="break-words">{addressParts.join(", ")}</span>
              </p>
            ) : null}
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 md:gap-1.5 md:px-2.5 md:py-1 md:ring-1 md:ring-inset md:ring-gray-100">
          <Package size={11} className="md:size-3" />
          {totalProducts}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-4 text-center md:min-h-[280px] md:rounded-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Package size={22} className="text-gray-300" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-500 md:mt-4">
            No products found
          </p>
          <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
            Products assigned to this distributor will appear here
          </p>
        </div>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-2 md:gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 md:h-8 md:w-8">
                <Package
                  size={14}
                  strokeWidth={2.25}
                  className="md:size-[15px]"
                />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                  Products
                </h2>
                <p className="text-[10px] text-gray-500 md:text-[11px]">
                  {categoryCount}{" "}
                  {categoryCount === 1 ? "category" : "categories"} •{" "}
                  {totalProducts} items
                </p>
              </div>
            </div>
          </div>

          {/* Mobile list – redesigned */}
          <ul className="divide-y divide-gray-100 md:hidden">
            {products.map((product) => {
              const imageUrl = product.images?.[0]?.url;
              const categoryName =
                product.category?.name || product.categoryId || "—";

              return (
                <li
                  key={product.id}
                  className="min-w-0 px-3 py-3 active:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name || "Product image"}
                        className="h-10 w-10 shrink-0 rounded-lg border border-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-300">
                        <Package size={18} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {product.name || "Unnamed product"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {categoryName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums text-gray-900">
                          {formatMoney(product.price)}
                        </span>
                        {product.tp != null && (
                          <span className="text-[11px] tabular-nums text-gray-400">
                            TP {formatMoney(product.tp)}
                          </span>
                        )}
                      </div>
                    </div>
                    {product.featured && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
                        <Star size={11} className="fill-current" />
                      </span>
                    )}
                    {product.trending && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <TrendingUp size={11} />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop table – unchanged */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">TP</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Trending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const imageUrl = product.images?.[0]?.url;
                  return (
                    <tr
                      key={product.id}
                      className="group transition-colors hover:bg-gray-50/80"
                    >
                      <td className="px-4 py-4">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name || "Product image"}
                            className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-300">
                            <Package size={18} />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {product.name || "Unnamed product"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-inset ring-gray-100">
                          {product.category?.name || product.categoryId || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-gray-900">
                        {formatMoney(product.price)}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-gray-900">
                        {product.tp != null ? formatMoney(product.tp) : "—"}
                      </td>

                      <td className="px-4 py-4">
                        {product.featured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-semibold text-pink-700 ring-1 ring-inset ring-pink-200/60">
                            <Star size={11} className="fill-current" />
                            Yes
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                            No
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {product.trending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                            <TrendingUp size={11} />
                            Yes
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination – compact on mobile */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-3 py-3 md:px-6 md:py-3">
            <p className="text-[11px] text-gray-500 md:text-xs">
              <span className="hidden md:inline">
                Page {page} of {totalPages} • {totalProducts} products
              </span>
              <span className="md:hidden">
                {page}/{totalPages} • {totalProducts}
              </span>
            </p>
            <div className="flex gap-1.5 md:gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:px-3 md:text-xs"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:px-3 md:text-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
