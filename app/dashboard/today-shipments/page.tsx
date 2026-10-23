"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, PackageOpen, RefreshCw } from "lucide-react";
import { api } from "@/config/api";
import type {
  Distributor,
  OrderedProduct,
  OrderedProductsData,
  Product,
} from "@/config/api";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import ShipmentPDF from "@/components/orders/ShipmentPDF";
import { orderShipmentProductsByCompany } from "@/components/orders/shipmentProductOrdering";

function formatDistributorAddress(distributor: Distributor): string {
  return [
    distributor.fullAddress,
    distributor.upazila?.name,
    distributor.district?.name,
    distributor.division?.name,
  ]
    .filter(Boolean)
    .join(", ");
}

async function getMatchingCatalogProducts(
  orderedProducts: OrderedProduct[],
): Promise<Product[]> {
  const productNames = [
    ...new Set(
      orderedProducts
        .filter((product) => product.category === undefined)
        .map((product) => product.productName.trim())
        .filter(Boolean),
    ),
  ];
  const batchSize = 5;
  const catalogProducts: Product[] = [];

  for (let index = 0; index < productNames.length; index += batchSize) {
    const batch = productNames.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map((name) => api.getAllProducts(1, 20, name)),
    );
    catalogProducts.push(...results.flatMap((result) => result.products));
  }

  return catalogProducts;
}

function addProductCategories(
  orderedProducts: OrderedProduct[],
  catalogProducts: Product[],
): OrderedProduct[] {
  const productsByName = new Map<string, Product[]>();
  for (const product of catalogProducts) {
    const name = product.name?.trim().toLocaleLowerCase();
    if (!name) continue;
    const matches = productsByName.get(name) ?? [];
    matches.push(product);
    productsByName.set(name, matches);
  }

  return orderedProducts.map((orderedProduct) => {
    if (orderedProduct.category) return orderedProduct;

    const matches = productsByName.get(
      orderedProduct.productName.trim().toLocaleLowerCase(),
    );
    const matchingProduct =
      matches?.find(
        (product) => product.distributor === orderedProduct.distributor,
      ) ?? (matches?.length === 1 ? matches[0] : undefined);

    return {
      ...orderedProduct,
      category: matchingProduct?.category ?? null,
    };
  });
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
  );
}

function OrderedProductsSkeleton() {
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
      </div>
      <SkeletonBlock className="h-[360px]" />
    </div>
  );
}

function OrderProductsTable({
  products,
  addresses,
}: {
  products: OrderedProduct[];
  addresses: Record<string, string>;
}) {
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
      address: addresses[distributor] ?? "",
      products: groupProducts,
    }),
  );

  return (
    <section className="min-w-0 rounded-xl bg-white p-3 md:rounded-2xl md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#eeeeee] pb-3">
        <h1 className="text-sm font-semibold md:text-lg md:font-bold">
          Today Shipments
        </h1>
        <ShipmentPDF groups={distributorGroups} />
      </div>

      {distributorGroups.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center border-b border-[#eeeeee] px-4 text-center md:min-h-[240px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
            <PackageOpen size={20} className="text-gray-300" />
          </div>
          <p className="mt-3 text-xs font-medium text-gray-500 md:text-[12px]">
            No today shipment products found.
          </p>
        </div>
      ) : (
        <div>
          {distributorGroups.map(
            ({ distributor, address, products: groupProducts }) => {
              const orderedGroupProducts =
                orderShipmentProductsByCompany(groupProducts);
              const quantityTotal = groupProducts.reduce(
                (sum, product) => sum + product.quantity,
                0,
              );
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
                  className="min-w-0 border-b border-[#eeeeee] py-3.5 last:border-b-0"
                >
                  {/* Distributor sub-header */}
                  <div className="mb-2.5 flex items-start justify-between gap-2 md:mb-2 md:block md:text-center">
                    <div className="min-w-0">
                      <h2 className="break-words text-sm font-semibold text-gray-900 md:text-xl md:font-bold">
                        {distributor}
                      </h2>
                      {address ? (
                        <p className="mt-0.5 break-words text-[11px] text-gray-500 md:mt-0.5 md:text-sm">
                          {address}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 md:hidden">
                      {groupProducts.length} item
                      {groupProducts.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Mobile list – redesigned */}
                  <div className="space-y-2 md:hidden">
                    {orderedGroupProducts.map((product, index) => (
                      <article
                        key={`${product.productName}-${index}`}
                        className="min-w-0 rounded-lg border border-gray-100 px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-50 text-[10px] font-semibold tabular-nums text-gray-500">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words text-xs font-medium leading-snug text-gray-900">
                              {product.productName}
                            </h3>
                            <p className="mt-0.5 break-words text-[11px] text-gray-500">
                              {product.category?.name ?? "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-gray-50 pt-1.5">
                          <span className="text-[11px] tabular-nums text-gray-500">
                            {product.quantity} ×{" "}
                            {formatSalesCurrency(product.price)}
                          </span>
                          <span className="text-[11px] tabular-nums text-gray-400">
                            TP{" "}
                            {product.tp === null
                              ? "N/A"
                              : formatSalesCurrency(product.tp)}
                          </span>
                        </div>
                      </article>
                    ))}

                    <div className="flex items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-700/70">
                          Qty
                        </p>
                        <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-blue-700">
                          {quantityTotal}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-700/70">
                          Total MRP
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold tabular-nums text-blue-700">
                          {formatSalesCurrency(unitPriceTotal)}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-700/70">
                          Total TP
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold tabular-nums text-blue-700">
                          {tpTotal === null
                            ? "N/A"
                            : formatSalesCurrency(tpTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop table – unchanged */}
                  <div className="hidden overflow-hidden rounded-[10px] border border-[#eeeeee] md:block">
                    <table className="w-full table-fixed border-collapse text-[11.5px]">
                      <caption className="sr-only">
                        Today shipment products for {distributor}
                      </caption>
                      <colgroup>
                        <col className="w-[36%]" />
                        <col className="w-[24%]" />
                        <col className="w-[13%]" />
                        <col className="w-[14%]" />
                        <col className="w-[13%]" />
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
                            className="text-left border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500"
                          >
                            Company
                          </th>
                          <th
                            scope="col"
                            className="text-right border-b border-r border-[#eeeeee] px-2 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500"
                          >
                            Qty
                          </th>
                          <th
                            scope="col"
                            className="text-right border-b border-r border-[#eeeeee] px-2 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500"
                          >
                            MRP
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
                        {orderedGroupProducts.map((product, index) => (
                          <tr
                            key={`${product.productName}-${index}`}
                            className={
                              index % 2 === 1 ? "bg-[#f7f7f7]" : "bg-white"
                            }
                          >
                            <td className="break-words border-b border-r border-[#eeeeee] px-2.5 py-1.5 font-medium text-gray-900">
                              {product.productName}
                            </td>
                            <td className="break-words border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-gray-700">
                              {product.category?.name ?? "N/A"}
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
                            Total
                          </td>
                          <td className="bg-blue-50 px-2 py-2 text-right text-[11px] font-bold tabular-nums text-blue-700">
                            {quantityTotal}
                          </td>
                          <td className="bg-blue-50 px-2 py-2 text-right text-[9px] font-bold leading-tight text-blue-700">
                            <span className="mt-1 block whitespace-nowrap text-[11px] tabular-nums">
                              {formatSalesCurrency(unitPriceTotal)}
                            </span>
                          </td>
                          <td className="bg-blue-50 px-2 py-2 text-right text-[9px] font-bold leading-tight text-blue-700">
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
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  const loadOrderedProducts = useCallback(
    (signal?: AbortSignal) => api.getTodayOrderedProducts(signal),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadOrderedProducts(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setOrderedProducts(data);
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load ordered products:", error);
        setHasError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadOrderedProducts]);

  const handleRetry = () => {
    setLoading(true);
    setHasError(false);
    loadOrderedProducts()
      .then((data) => setOrderedProducts(data))
      .catch((error: unknown) => {
        console.error("Failed to load ordered products:", error);
        setHasError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    api
      .getAllDistributor(controller.signal)
      .then((distributors) => {
        if (controller.signal.aborted) return;
        const map: Record<string, string> = {};
        for (const distributor of distributors) {
          map[distributor.name] = formatDistributorAddress(distributor);
        }
        setAddresses(map);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load distributor addresses:", error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      !orderedProducts?.products.some(
        (product) => product.category === undefined,
      )
    ) {
      return;
    }

    let cancelled = false;
    void getMatchingCatalogProducts(orderedProducts.products)
      .then((catalogProducts) => {
        if (cancelled) return;
        setOrderedProducts((current) =>
          current
            ? {
                ...current,
                products: addProductCategories(
                  current.products,
                  catalogProducts,
                ),
              }
            : current,
        );
      })
      .catch((error) => {
        console.error("Failed to load shipment product categories:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [orderedProducts]);

  if (loading) {
    return <OrderedProductsSkeleton />;
  }

  if (hasError || !orderedProducts) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl border border-gray-100 bg-white p-6 text-center md:rounded-2xl md:p-8 md:shadow-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-600 md:mb-4 md:h-12 md:w-12 md:rounded-xl">
            <Activity size={20} className="md:size-[22px]" />
          </div>
          <h1 className="text-base font-semibold text-gray-900 md:text-lg">
            Ordered products unavailable
          </h1>
          <p className="mt-1.5 text-xs text-gray-500 md:mt-2 md:text-sm">
            Unable to load ordered products. Check your connection and try
            again.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:mt-5 md:px-4 md:py-2.5 md:text-sm"
          >
            <RefreshCw size={14} className="md:size-[15px]" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-8">
      <OrderProductsTable
        products={orderedProducts.products}
        addresses={addresses}
      />
    </div>
  );
}
