"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, RefreshCw, Search, Users } from "lucide-react";
import { api } from "@/config/api";
import type {
  SummaryResponse,
  StatusPerformanceMap,
  Territory,
  TerritoryArea,
  TSRPerformance,
} from "@/config/api";
import { TSR_ORDER_STATUSES } from "@/config/api";
import {
  formatSalesCurrency,
  formatSalesNumber,
} from "@/components/sales/salesFormatters";
import SummaryCards from "@/components/tsr-sales/SummaryCards";
import { getStatusCount, getStatusValue } from "@/components/tsr-sales/metrics";

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

function numericValue(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function aggregateTsrSummary(
  tsrs: TSRPerformance[],
  summary: SummaryResponse,
): SummaryResponse {
  const statusBreakdown: StatusPerformanceMap = {};
  for (const status of TSR_ORDER_STATUSES) {
    statusBreakdown[status] = tsrs.reduce(
      (total, tsr) => ({
        count: total.count + getStatusCount(tsr, status),
        value: total.value + numericValue(getStatusValue(tsr, status)),
      }),
      { count: 0, value: 0 },
    );
  }

  return {
    ...summary,
    totalOrders: tsrs.reduce(
      (total, tsr) => total + numericValue(tsr.totalOrders),
      0,
    ),
    totalOrderValue: tsrs.reduce(
      (total, tsr) => total + numericValue(tsr.totalOrderValue),
      0,
    ),
    statusBreakdown,
  };
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
    <div className="space-y-4 p-6" aria-label="Loading TSR performance">
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
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [tsrs, setTsrs] = useState<TSRPerformance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, tsrData] = await Promise.all([
        api.getTsrSalesSummary(),
        api.getTsrSalesTsrs(),
      ]);
      setSummary(summaryData);
      setTsrs(tsrData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load TSR sales data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const query = search.trim().toLowerCase();
  const filteredTsrs = tsrs.filter((tsr) =>
    [tsr.name, tsr.email, tsr.phone_number, tsr.phone, territoryText(tsr)]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query)),
  );

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorState message={error} onRetry={() => void loadData()} />
      ) : (
        <>
          {summary ? (
            <SummaryCards summary={aggregateTsrSummary(tsrs, summary)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
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
              <label className="relative w-full sm:max-w-xs">
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
                onClick={() => void loadData()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 sm:self-auto"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
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
              <div className="overflow-x-auto">
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
                            href={`/admin/tsr-sales/${encodeURIComponent(tsr.id)}`}
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
            )}
          </section>
        </>
      )}
    </div>
  );
}
