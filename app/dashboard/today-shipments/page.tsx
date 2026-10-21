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
    <section className="min-w-0 rounded-xl bg-white p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#eeeeee] pb-3.5">
        <div>
          <h1 className="text-base font-bold md:text-lg">Today Shipments</h1>
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
            ({ distributor, address, products: groupProducts }, groupIndex) => {
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
                  <div className="mb-3 text-center md:mb-2">
                    <h2 className="break-words text-lg font-bold text-gray-900 md:text-xl">
                      {distributor}
                    </h2>
                    {address ? (
                      <p className="mt-0.5 break-words text-xs text-gray-500 md:text-sm">
                        {address}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-gray-500">
                      {groupProducts.length} Product
                      {groupProducts.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {/* Rounded, bordered table — same recipe as the invoice */}
                  <div className="space-y-2 md:hidden">
                    {orderedGroupProducts.map((product, index) => (
                      <article
                        key={`${product.productName}-${index}`}
                        className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-semibold tabular-nums text-gray-500 ring-1 ring-inset ring-gray-200">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words text-sm font-semibold leading-snug text-gray-900">
                              {product.productName}
                            </h3>
                            <p className="mt-1 break-words text-xs text-gray-500">
                              {product.category?.name ?? "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-200 pt-2.5">
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                              Qty
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-gray-800">
                              {product.quantity}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                              MRP
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-gray-800">
                              {formatSalesCurrency(product.price)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                              TP
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-gray-800">
                              {product.tp === null
                                ? "N/A"
                                : formatSalesCurrency(product.tp)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-blue-50 p-3 text-blue-700">
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide">
                          Total qty
                        </p>
                        <p className="mt-0.5 truncate text-sm font-bold tabular-nums">
                          {quantityTotal}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide">
                          Total MRP
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold tabular-nums">
                          {formatSalesCurrency(unitPriceTotal)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide">
                          Total TP
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold tabular-nums">
                          {tpTotal === null
                            ? "N/A"
                            : formatSalesCurrency(tpTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

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
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  const loadOrderedProducts = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      setOrderedProducts(await api.getTodayOrderedProducts());
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

  useEffect(() => {
    api
      .getAllDistributor()
      .then((distributors) => {
        const map: Record<string, string> = {};
        for (const distributor of distributors) {
          map[distributor.name] = formatDistributorAddress(distributor);
        }
        setAddresses(map);
      })
      .catch((error) => {
        console.error("Failed to load distributor addresses:", error);
      });
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
      <OrderProductsTable
        products={orderedProducts.products}
        addresses={addresses}
      />
    </div>
  );
}
