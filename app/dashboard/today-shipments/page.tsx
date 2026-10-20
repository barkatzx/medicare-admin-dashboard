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
  const distributorProducts = new Map<string, OrderedProduct[]>();
  for (const product of products) {
    const distributor = product.distributor ?? "N/A";
    const groupProducts = distributorProducts.get(distributor);

    if (groupProducts) {
      groupProducts.push(product);
    } else {
      distributorProducts.set(distributor, [product]);
    }
  }
  const distributorGroups = Array.from(
    distributorProducts,
    ([distributor, groupProducts]) => ({
      distributor,
      products: groupProducts,
    }),
  );

  return (
    <section>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-[#eeeeee]">
        <div>
          <h1 className="text-[17px] font-bold leading-none tracking-tight text-blue-700">
            Today Shipments
          </h1>
        </div>
        <ShipmentPDF groups={distributorGroups} />
      </div>

      {distributorGroups.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center border-b border-[#eeeeee]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
            <PackageOpen size={20} className="text-gray-300" />
          </div>
          <p className="mt-3 text-[12px] font-medium text-gray-500">
            No today shipment products found.
          </p>
        </div>
      ) : (
        <div>
          {distributorGroups.map(
            ({ distributor, products: groupProducts }, groupIndex) => {
              const unitPriceTotal = groupProducts.reduce(
                (sum, product) => sum + product.price * product.quantity,
                0,
              );
              const tpTotal = groupProducts.reduce<number | null>(
                (sum, product) => {
                  if (sum === null || product.tp === null) return null;
                  return sum + product.tp * product.quantity;
                },
                0,
              );

              return (
                <section
                  key={distributor}
                  className="pt-3.5 pb-3.5 border-b border-[#eeeeee] last:border-b-0"
                >
                  {/* Distributor sub-header */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h2 className="text-[13px] font-semibold text-gray-900">
                      {distributor}
                    </h2>
                    <span className="text-[10.5px] text-gray-500">
                      {groupProducts.length} product
                      {groupProducts.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Rounded, bordered table — same recipe as the invoice */}
                  <div className="rounded-[10px] overflow-hidden border border-[#eeeeee]">
                    <table className="w-full table-fixed border-collapse text-[11.5px]">
                      <caption className="sr-only">
                        Today shipment products for {distributor}
                      </caption>
                      <colgroup>
                        <col className="w-[52%]" />
                        <col className="w-[16%]" />
                        <col className="w-[16%]" />
                        <col className="w-[16%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-[#f7f7f7]">
                          <th
                            scope="col"
                            className="text-left border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500"
                          >
                            Product
                          </th>
                          <th
                            scope="col"
                            className="text-right border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500"
                          >
                            Qty
                          </th>
                          <th
                            scope="col"
                            className="text-right border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500"
                          >
                            Unit Price
                          </th>
                          <th
                            scope="col"
                            className="text-right border-b border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500"
                          >
                            TP
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupProducts.map((product, index) => (
                          <tr
                            key={`${product.productName}-${index}`}
                            className={
                              index % 2 === 1 ? "bg-[#f7f7f7]" : "bg-white"
                            }
                          >
                            <td className="break-words border-b border-r border-[#eeeeee] px-2.5 py-1.5 font-medium text-gray-900">
                              {product.productName}
                            </td>
                            <td className="border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-right tabular-nums text-gray-700">
                              {product.quantity}
                            </td>
                            <td className="border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-right font-semibold tabular-nums text-gray-900 whitespace-nowrap">
                              {formatSalesCurrency(product.price)}
                            </td>
                            <td className="border-b border-[#eeeeee] px-2.5 py-1.5 text-right tabular-nums text-gray-600 whitespace-nowrap">
                              {product.tp === null
                                ? "N/A"
                                : formatSalesCurrency(product.tp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan={2}
                            className="bg-blue-50 px-2.5 py-2 text-left text-[12px] font-bold text-blue-700"
                          >
                            Totals
                          </td>
                          <td className="bg-blue-50 px-2 py-2 text-right text-[9px] font-bold leading-tight text-blue-700">
                            {/* <span className="block">Total Unit Price Amount</span> */}
                            <span className="mt-1 block whitespace-nowrap text-[11px] tabular-nums">
                              {formatSalesCurrency(unitPriceTotal)}
                            </span>
                          </td>
                          <td className="bg-blue-50 px-2 py-2 text-right text-[9px] font-bold leading-tight text-blue-700">
                            {/* <span className="block">Total TP Price</span> */}
                            <span className="mt-1 block whitespace-nowrap text-[11px] tabular-nums">
                              {tpTotal === null
                                ? "N/A"
                                : formatSalesCurrency(tpTotal)}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              );
            },
          )}
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
