"use client";

import {
  formatSalesCurrency,
  formatSalesNumber,
} from "@/components/sales/salesFormatters";
import {
  getStatusCount,
  getStatusValue,
  statusLabels,
} from "@/components/tsr-sales/metrics";
import type {
  Territory,
  TerritoryArea,
  TsrOrderStatus,
  TSRPerformance,
} from "@/config/api";
import { api } from "@/config/api";
import { ArrowRight, RefreshCw, Search, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const SUMMARY_STATUSES: TsrOrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function territoryFor(tsr: TSRPerformance): Territory {
  return (
    tsr.territory ?? {
      // division: tsr.division,
      // district: tsr.district,
      upazila: tsr.upazila,
    }
  );
}

function territoryName(area: TerritoryArea | null | undefined): string {
  return area?.name?.trim() || "—";
}

function territoryText(tsr: TSRPerformance): string {
  const territory = territoryFor(tsr);
  return [
    // territoryName(territory.division),
    // territoryName(territory.district),
    territoryName(territory.upazila),
  ].join(" → ");
}

function currency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? formatSalesCurrency(amount) : "—";
}

function orderCount(value: number | null | undefined): string {
  const count = Number(value);
  return formatSalesNumber(Number.isFinite(count) ? count : 0);
}

function sumMetric(
  records: TSRPerformance[],
  getValue: (record: TSRPerformance) => number | string | null | undefined,
): number | null {
  let total = 0;
  let foundValue = false;

  for (const record of records) {
    const value = getValue(record);
    if (value === null || value === undefined || value === "") continue;

    const amount = Number(value);
    if (!Number.isFinite(amount)) continue;

    total += amount;
    foundValue = true;
  }

  return foundValue ? total : null;
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center"
    >
      <p className="text-sm font-medium text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
      >
        <RefreshCw size={15} />
        Retry
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4 md:space-y-4 md:p-6" aria-label="Loading TSR performance">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-xl bg-gray-100"
        />
      ))}
    </div>
  );
}

export default function TsrSalesPage() {
  const [tsrs, setTsrs] = useState<TSRPerformance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    (signal?: AbortSignal) => api.getTsrSalesTsrs(signal),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setTsrs(data);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load TSR sales data.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadData]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadData()
      .then((data) => setTsrs(data))
      .catch((caughtError: unknown) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load TSR sales data.",
        );
      })
      .finally(() => setLoading(false));
  };

  const query = search.trim().toLowerCase();
  const filteredTsrs = tsrs.filter((tsr) =>
    [tsr.name, tsr.email, tsr.phone_number, tsr.phone, territoryText(tsr)]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query)),
  );
  const totalOrders = sumMetric(tsrs, (tsr) => tsr.totalOrders) ?? 0;
  const totalOrderValue = sumMetric(tsrs, (tsr) => tsr.totalOrderValue);
  const statusTotals = SUMMARY_STATUSES.map((status) => ({
    status,
    count: sumMetric(tsrs, (tsr) => getStatusCount(tsr, status)) ?? 0,
    value: sumMetric(tsrs, (tsr) => getStatusValue(tsr, status)),
  }));

  return (
    <div className="min-w-0 space-y-5 md:space-y-6">
      {error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : (
        <>
          {!loading && (
            <section
              aria-label="TSR order summary"
              className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
            >
              <article className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 sm:p-5">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">
                  Total TSR Orders
                </p>
                <p className="mt-2 text-xl font-bold tabular-nums text-gray-900 sm:mt-3 sm:text-2xl">
                  {orderCount(totalOrders)}
                </p>
                <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">Across all TSRs</p>
              </article>
              <article className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 sm:p-5">
                <p className="text-xs font-medium text-gray-500 sm:text-sm">
                  Total TSR Order Value
                </p>
                <p className="mt-2 truncate text-xl font-bold tabular-nums text-gray-900 sm:mt-3 sm:text-2xl">
                  {currency(totalOrderValue)}
                </p>
                <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">Across all TSRs</p>
              </article>
              {statusTotals.map(({ status, count, value }) => (
                <article
                  key={status}
                  className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 sm:p-5"
                >
                  <p className="text-xs font-medium text-gray-500 sm:text-sm">
                    {statusLabels[status]} Orders
                  </p>
                  <p className="mt-2 text-xl font-bold tabular-nums text-gray-900 sm:mt-3 sm:text-2xl">
                    {orderCount(count)}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold tabular-nums text-gray-600 sm:text-sm">
                    {currency(value)}
                  </p>
                </article>
              ))}
            </section>
          )}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    TSR performance
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    {tsrs.length} {tsrs.length === 1 ? "TSR" : "TSRs"}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 gap-2 md:contents">
              <label className="relative min-w-0 flex-1 md:w-full md:flex-none md:max-w-xs">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search TSRs"
                  aria-label="Search TSR sales"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-50"
                />
              </label>
              <button
                type="button"
                onClick={handleRetry}
                disabled={loading}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 md:min-h-0 md:self-auto md:px-4 md:py-2.5"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              </div>
            </div>

            {loading ? (
              <TableSkeleton />
            ) : filteredTsrs.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
                <Users size={24} className="text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-500">
                  {tsrs.length === 0
                    ? "No TSR sales found."
                    : "No TSRs match your search."}
                </p>
              </div>
            ) : (
              <>
              <ul className="divide-y divide-gray-100 md:hidden">
                {filteredTsrs.map((tsr) => (
                  <li key={tsr.id} className="min-w-0 p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        {tsr.name?.trim().charAt(0) || "T"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-gray-900">
                          {tsr.name?.trim() || "—"}
                        </p>
                        <p className="mt-0.5 break-all text-xs text-gray-500">
                          {tsr.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Phone
                        </p>
                        <p className="mt-0.5 break-words text-xs font-medium text-gray-700">
                          {tsr.phone_number || tsr.phone || "—"}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Territory
                        </p>
                        <p className="mt-0.5 break-words text-xs font-medium text-gray-700">
                          {territoryText(tsr)}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Total orders
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-800">
                          {orderCount(tsr.totalOrders)}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Total value
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-gray-800">
                          {currency(tsr.totalOrderValue)}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/tsr-info/tsr-sales/${encodeURIComponent(tsr.id)}`}
                      className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      View Details
                      <ArrowRight size={13} />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-5 py-3">TSR</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Territory</th>
                      <th className="px-5 py-3 text-right">Total Orders</th>
                      <th className="px-5 py-3 text-right">Total Value</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTsrs.map((tsr) => (
                      <tr
                        key={tsr.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-gray-900">
                            {tsr.name?.trim() || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {tsr.email || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {tsr.phone_number || tsr.phone || "—"}
                        </td>
                        <td className="max-w-[250px] px-5 py-4 text-xs leading-5 text-gray-600">
                          {territoryText(tsr)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-gray-700">
                          {orderCount(tsr.totalOrders)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-gray-700">
                          {currency(tsr.totalOrderValue)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/tsr-info/tsr-sales/${encodeURIComponent(tsr.id)}`}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            View Details
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
