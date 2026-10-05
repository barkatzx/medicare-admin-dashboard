"use client";

import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import { api, type Product } from "@/config/api";
import { ArrowLeft, Package, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface DistributorInfo {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

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

  useEffect(() => {
    if (!distributorId) return;

    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [distributorData, productData] = await Promise.all([
          api.getDistributorById(distributorId),
          api.getDistributorProducts(distributorId),
        ]);

        if (!active) return;
        setDistributor(distributorData ?? null);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (error) {
        if (!active) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load distributor data",
        );
        setDistributor(null);
        setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [distributorId]);

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

  if (loading) {
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
    <div className="space-y-6">
      {/* ─── Back link ───────────────────────────────────────────── */}
      <Link
        href="/dashboard/distributors"
        className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <ArrowLeft
          size={14}
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        Back to distributors
      </Link>

      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold uppercase text-blue-600 ring-1 ring-inset ring-blue-100">
            {distributor?.name?.charAt(0) || "D"}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">
              Distributor
            </p>
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-gray-900">
              {distributor?.name || "Distributor details"}
            </h1>
            {/* {distributor?.createdAt ? (
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                Created {formatDateTime(distributor.createdAt)}
              </p>
            ) : null} */}
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500 ring-1 ring-inset ring-gray-100 sm:self-auto">
          <Package size={12} />
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Package size={22} className="text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            No products found
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Products assigned to this distributor will appear here
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Package size={15} strokeWidth={2.25} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Products
                </h2>
                <p className="text-[11px] text-gray-500">
                  {categoryCount}{" "}
                  {categoryCount === 1 ? "category" : "categories"} •{" "}
                  {products.length} items
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Discount</th>
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
                            className="h-8 w-8 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-300">
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
                        {formatMoney(product.discountedPrice)}
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
                          <span className="text-[11px] font-medium text-gray-400">
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
                          <span className="text-[11px] font-medium text-gray-400">
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
        </div>
      )}
    </div>
  );
}
