"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, PackageOpen, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import type { OrderedProduct, OrderedProductsData } from "@/config/api";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import ShipmentPDF from "@/components/orders/ShipmentPDF";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
  );
}

function OrderedProductsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
      </div>
      <SkeletonBlock className="h-[360px]" />
    </div>
  );
}

function OrderProductsTable({ products }: { products: OrderedProduct[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Products</h2>
          <p className="mt-1 text-xs text-gray-500">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <ShipmentPDF products={products} />
      </div>

      {products.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <PackageOpen size={22} className="text-gray-300" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            No pending or confirmed ordered products found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-left">
            <caption className="sr-only">
              Ordered products with distributor, quantity, price, and TP
            </caption>
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <th scope="col" className="px-5 py-3 sm:px-6">
                  Product Name
                </th>
                <th scope="col" className="px-4 py-3">
                  Distributor
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Quantity
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Price
                </th>
                <th scope="col" className="px-5 py-3 text-right sm:px-6">
                  TP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product, index) => (
                <tr
                  key={`${product.productName}-${index}`}
                  className="transition-colors hover:bg-gray-50/80"
                >
                  <td className="break-words px-5 py-4 text-sm font-medium leading-5 text-gray-900 sm:px-6">
                    {product.productName}
                  </td>
                  <td className="break-words px-4 py-4 text-sm text-gray-600">
                    {product.distributor ?? "N/A"}
                  </td>
                  <td className="px-4 py-4 text-right text-sm tabular-nums text-gray-700">
                    {product.quantity}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium tabular-nums text-gray-900">
                    {formatSalesCurrency(product.price)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-gray-600 sm:px-6">
                    {product.tp === null
                      ? "N/A"
                      : formatSalesCurrency(product.tp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function TodayShipmentsPage() {
  const [orderedProducts, setOrderedProducts] =
    useState<OrderedProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadOrderedProducts = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const response = await api.getTodayOrderedProducts();
      setOrderedProducts(response);
    } catch (error) {
      console.error("Failed to load ordered products:", error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrderedProducts();
  }, [loadOrderedProducts]);

  if (loading) {
    return <OrderedProductsSkeleton />;
  }

  if (hasError || !orderedProducts) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Activity size={22} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Ordered products unavailable
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Unable to load ordered products. Check your connection and try
            again.
          </p>
          <button
            type="button"
            onClick={() => void loadOrderedProducts()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <OrderProductsTable products={orderedProducts.products} />
    </div>
  );
}
