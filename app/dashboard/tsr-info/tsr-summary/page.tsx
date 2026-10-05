"use client";

import {
  formatSalesCurrency,
  formatSalesNumber,
} from "@/components/sales/salesFormatters";
import type {
  TsrSalesAllSummary,
  TsrSalesBestPerformance,
  TsrSalesSummaryEntry,
  TsrSalesSummaryPeriod,
} from "@/config/api";
import { api } from "@/config/api";
import {
  AreaChart,
  Award,
  ChevronDown,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";

type SummaryPeriodKey = "today" | "weekly" | "monthly" | "yearly";

type TsrOption = {
  id: string;
  name: string | null;
  email: string | null;
  upazilaName: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTsrOption(value: unknown): TsrOption {
  if (!isRecord(value)) {
    throw new Error("TSR response contains an invalid TSR entry.");
  }

  const id = typeof value.id === "string" ? value.id : value.tsrId;
  const name =
    typeof value.name === "string"
      ? value.name
      : typeof value.tsrName === "string" || value.tsrName === null
        ? value.tsrName
        : value.name === null
          ? null
          : undefined;
  const email = typeof value.email === "string" ? value.email : null;
  const directUpazila = isRecord(value.upazila) ? value.upazila : null;
  const territory = isRecord(value.territory) ? value.territory : null;
  const territoryUpazila =
    territory && isRecord(territory.upazila) ? territory.upazila : null;
  const upazilaName = directUpazila?.name ?? territoryUpazila?.name;

  if (typeof id !== "string" || !id) {
    throw new Error("TSR response contains an entry without a valid TSR ID.");
  }
  if (typeof name !== "string" && name !== null) {
    throw new Error("TSR response contains an entry without a valid TSR name.");
  }

  return {
    id,
    name,
    email,
    upazilaName: typeof upazilaName === "string" ? upazilaName : null,
  };
}

const periods: {
  key: SummaryPeriodKey;
  title: string;
  description?: string;
}[] = [
  {
    key: "today",
    title: "Today",
  },
  {
    key: "weekly",
    title: "Weekly",
  },
  {
    key: "monthly",
    title: "Monthly",
  },
  {
    key: "yearly",
    title: "Yearly",
  },
];

function currency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? formatSalesCurrency(amount) : "—";
}

function count(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "—"
    : formatSalesNumber(value);
}

function BestTsrCard({
  title,
  tsr,
  metric,
}: {
  title: string;
  tsr: TsrSalesSummaryEntry | null;
  metric: "orders" | "value";
}) {
  return (
    <article className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-amber-600">
        <Award size={16} />
        <h3 className="text-sm text-gray-600">{title}</h3>
      </div>
      {tsr ? (
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-700">{tsr.tsrName || "—"}</p>
            <p className="mt-1 text-xs tabular-nums text-gray-500">
              {metric === "orders"
                ? currency(tsr.totalOrderValue)
                : `${count(tsr.totalOrders)} orders`}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-gray-700">
            {metric === "orders"
              ? `${count(tsr.totalOrders)} orders`
              : currency(tsr.totalOrderValue)}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">No sales data</p>
      )}
    </article>
  );
}

function PeriodSection({
  title,
  description,
  tsrName,
  period,
}: {
  title: string;
  description?: string;
  tsrName: string;
  period: TsrSalesSummaryPeriod;
}) {
  return (
    <section
      aria-label={`${title} TSR sales summary`}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
    >
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <AreaChart size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{tsrName}</p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-xl bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <ShoppingBag size={15} />
              <p className="text-xs font-medium">Total Orders</p>
            </div>
            <p className="mt-3 text-lg font-bold text-gray-900">
              {count(period.totalOrders)}
            </p>
          </article>
          <article className="rounded-xl bg-white border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-500">
              Total Order Value
            </p>
            <p className="mt-3 truncate text-lg font-bold text-gray-900">
              {currency(period.totalOrderValue)}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function SummarySkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-5 xl:grid-cols-2 mt-5"
      aria-label="Loading TSR sales summary"
    >
      {periods.map(({ key }) => (
        <div
          key={key}
          className="h-48 animate-pulse rounded-2xl border border-gray-100 bg-white"
        />
      ))}
    </div>
  );
}

function BestPerformanceSection({
  performance,
  loading,
}: {
  performance: TsrSalesBestPerformance | null;
  loading: boolean;
}) {
  return (
    <section className="space-y-4">
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {periods.map(({ key }) => (
            <div
              key={key}
              className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white"
            />
          ))}
        </div>
      ) : performance ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {periods.map(({ key, title }) => (
            <article
              key={key}
              className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4"
            >
              <h3 className="text-sm text-gray-900">{title}</h3>
              <BestTsrCard
                title="Most Orders"
                tsr={performance[key].bestTsrByOrderCount}
                metric="orders"
              />
              <BestTsrCard
                title="Highest Order Value"
                tsr={performance[key].bestTsrByOrderValue}
                metric="value"
              />
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
          Best TSR performance is unavailable.
        </p>
      )}
    </section>
  );
}

export default function TSRSummary() {
  const [tsrs, setTsrs] = useState<TsrOption[]>([]);
  const [selectedTsrId, setSelectedTsrId] = useState("");
  const [tsrSearch, setTsrSearch] = useState("");
  const [tsrDropdownOpen, setTsrDropdownOpen] = useState(false);
  const [summary, setSummary] = useState<TsrSalesAllSummary | null>(null);
  const [bestPerformance, setBestPerformance] =
    useState<TsrSalesBestPerformance | null>(null);
  const [tsrsLoading, setTsrsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bestPerformanceLoading, setBestPerformanceLoading] = useState(true);
  const [tsrsError, setTsrsError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [bestPerformanceError, setBestPerformanceError] = useState<
    string | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTsrsLoading(true);
    setBestPerformanceLoading(true);
    setTsrsError(null);
    setBestPerformanceError(null);

    void Promise.allSettled([
      api.getTsrSalesTsrs(),
      api.getTsrSalesBestPerformance(),
    ]).then(([tsrResult, performanceResult]) => {
      if (cancelled) return;

      if (tsrResult.status === "fulfilled") {
        try {
          setTsrs(tsrResult.value.map(normalizeTsrOption));
        } catch (caughtError: unknown) {
          setTsrsError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load the TSR list.",
          );
        }
      } else {
        setTsrsError(
          tsrResult.reason instanceof Error
            ? tsrResult.reason.message
            : "Unable to load the TSR list.",
        );
      }
      setTsrsLoading(false);

      if (performanceResult.status === "fulfilled") {
        setBestPerformance(performanceResult.value);
      } else {
        setBestPerformanceError(
          performanceResult.reason instanceof Error
            ? performanceResult.reason.message
            : "Unable to load best TSR performance.",
        );
      }
      setBestPerformanceLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedTsrId) {
      setSummary(null);
      setSummaryError(null);
      setSummaryLoading(false);
      return;
    }

    let cancelled = false;
    setSummary(null);
    setSummaryLoading(true);
    setSummaryError(null);

    void api
      .getTsrSalesAllSummary(selectedTsrId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return;
        setSummaryError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load the selected TSR sales summary.",
        );
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTsrId, refreshKey]);

  const selectedTsr = tsrs.find((tsr) => tsr.id === selectedTsrId);
  const filteredTsrs = tsrs.filter((tsr) =>
    [tsr.name, tsr.email]
      .filter(Boolean)
      .some((value) =>
        value?.toLowerCase().includes(tsrSearch.trim().toLowerCase()),
      ),
  );
  const loading = tsrsLoading || summaryLoading || bestPerformanceLoading;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-5  sm:p-6">
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="relative w-full sm:w-94"
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              ) {
                setTsrDropdownOpen(false);
              }
            }}
          >
            <button
              id="tsr-sales-selection"
              type="button"
              role="combobox"
              aria-label="Select TSR Name"
              aria-haspopup="listbox"
              aria-expanded={tsrDropdownOpen}
              disabled={tsrsLoading || tsrs.length === 0}
              onClick={() => setTsrDropdownOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="truncate">
                {selectedTsr
                  ? `${selectedTsr.name?.trim() || selectedTsr.email || "TSR"}${selectedTsr.upazilaName ? ` — ${selectedTsr.upazilaName}` : ""}`
                  : tsrsLoading
                    ? "Loading TSRs..."
                    : "Select TSR Name"}
              </span>
              <ChevronDown size={16} className="ml-3 shrink-0 text-gray-500" />
            </button>
            {tsrDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                <label className="relative block border-b border-gray-100 p-2">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    autoFocus
                    value={tsrSearch}
                    onChange={(event) => setTsrSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setTsrDropdownOpen(false);
                      }
                    }}
                    placeholder="Search TSR names..."
                    aria-label="Search TSR names"
                    className="w-full rounded-lg bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <div
                  role="listbox"
                  aria-label="TSR names and Upazilas"
                  className="max-h-60 overflow-y-auto p-1"
                >
                  {filteredTsrs.length > 0 ? (
                    filteredTsrs.map((tsr) => (
                      <button
                        key={tsr.id}
                        type="button"
                        role="option"
                        aria-selected={tsr.id === selectedTsrId}
                        onClick={() => {
                          setSelectedTsrId(tsr.id);
                          setTsrSearch("");
                          setTsrDropdownOpen(false);
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-gray-900"
                      >
                        {tsr.name?.trim() || tsr.email}
                        {tsr.upazilaName && (
                          <span className="ml-1 text-gray-500">
                            — {tsr.upazilaName}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      No TSRs match your search.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex items-center bg-gray-50 justify-center gap-2 self-end rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:self-auto"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        {/* <p className="mt-3 text-sm text-gray-500">
          Today includes pending and confirmed orders across all dates. Weekly,
          monthly, and yearly ranges are calculated by the backend.
        </p> */}
        {tsrsError && (
          <p role="alert" className="mt-3 text-sm text-rose-700">
            {tsrsError}
          </p>
        )}
        {!tsrsLoading && !tsrsError && tsrs.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">No TSRs are available.</p>
        )}
        {summaryError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm font-medium text-rose-700">{summaryError}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {summaryLoading ? (
          <SummarySkeleton />
        ) : summary ? (
          <div className="space-y-5 mt-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {periods.map(({ key, title, description }) => (
                <PeriodSection
                  key={key}
                  title={title}
                  description={description}
                  tsrName={
                    selectedTsr?.name?.trim() ||
                    selectedTsr?.email ||
                    "Selected TSR"
                  }
                  period={summary[key]}
                />
              ))}
            </div>
          </div>
        ) : selectedTsrId ? (
          <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
            No summary is available for the selected TSR.
          </p>
        ) : (
          <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500 mt-5">
            Select a TSR to view their Today, Weekly, Monthly, and Yearly sales.
          </p>
        )}
      </section>

      {bestPerformanceError && (
        <p role="alert" className="text-sm text-rose-700">
          {bestPerformanceError}
        </p>
      )}
      <BestPerformanceSection
        performance={bestPerformance}
        loading={bestPerformanceLoading}
      />
    </div>
  );
}
