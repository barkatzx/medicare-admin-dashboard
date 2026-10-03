"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";
import { api, TSR_ORDER_STATUSES } from "@/config/api";
import type {
  SummaryResponse,
  Territory,
  TerritoryArea,
  TSRDetail,
  TsrOrderStatus,
  TsrSalesOrder,
  Pagination,
  TSRDetailResponse,
} from "@/config/api";
import {
  formatSalesCurrency,
  formatSalesNumber,
} from "@/components/sales/salesFormatters";
import { formatDateTime } from "@/components/utils/formatters";
import SummaryCards from "@/components/tsr-sales/SummaryCards";
import {
  formatMetricCurrency,
  statusLabels,
} from "@/components/tsr-sales/metrics";

const PAGE_SIZE = 20;
const ORDER_STATUSES: Array<TsrOrderStatus | "all"> = [
  "all",
  ...TSR_ORDER_STATUSES,
];

function areaName(area: TerritoryArea | null | undefined): string {
  return area?.name?.trim() || "—";
}

function getTerritory(person: TSRDetail): Territory {
  return (
    person.territory ?? {
      division: person.division,
      district: person.district,
      upazila: person.upazila,
    }
  );
}

function currency(value: number | string | null | undefined): string {
  return formatMetricCurrency(value, formatSalesCurrency);
}

function profileFromResponse(response: TSRDetailResponse): {
  profile: TSRDetail;
  summary: SummaryResponse;
} {
  if ("tsr" in response) {
    const profile = response.tsr;
    return {
      profile,
      summary: response.summary ?? response.performance ?? response,
    };
  }
  return {
    profile: response,
    summary: response,
  };
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-4 text-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-rose-100"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

function statusLabel(status: string): string {
  const normalized = status.toLowerCase();
  const match = TSR_ORDER_STATUSES.find((option) => option === normalized);
  return match ? statusLabels[match] : status || "—";
}

function isTsrOrderStatus(value: string): value is TsrOrderStatus {
  return TSR_ORDER_STATUSES.some((status) => status === value);
}

function locationLine(area: TerritoryArea | null | undefined): string {
  return area?.name?.trim() || "—";
}

function orderDate(value: string): string {
  return Number.isNaN(new Date(value).getTime()) ? "—" : formatDateTime(value);
}

function OrderAddress({ order }: { order: TsrSalesOrder }) {
  const user = order.user;
  const location = [
    user?.upazila?.name,
    user?.district?.name,
    user?.division?.name,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  return (
    <span className="block max-w-[220px] whitespace-normal text-xs leading-5 text-gray-600">
      <span className="block">{user?.fullAddress?.trim() || "—"}</span>
      <span className="block text-gray-400">{location || "—"}</span>
    </span>
  );
}

export default function TsrSalesDetailPage() {
  const params = useParams<{ tsrId: string }>();
  const tsrId = params.tsrId;
  const [profile, setProfile] = useState<TSRDetail | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileReload, setProfileReload] = useState(0);

  const [orders, setOrders] = useState<TsrSalesOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersReload, setOrdersReload] = useState(0);
  const [status, setStatus] = useState<TsrOrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    api
      .getTsrSalesTsr(tsrId)
      .then((response) => {
        if (!active) return;
        const data = profileFromResponse(response);
        setProfile(data.profile);
        setSummary(data.summary);
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setProfileError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load TSR details.",
        );
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tsrId, profileReload]);

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    setOrdersError(null);
    api
      .getTsrSalesOrders(tsrId, {
        page,
        limit: PAGE_SIZE,
        status,
        search,
      })
      .then((response) => {
        if (!active) return;
        setOrders(response.orders);
        setPagination(response.pagination);
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setOrdersError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load TSR orders.",
        );
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tsrId, page, status, search, ordersReload]);

  useEffect(() => {
    if (!pagination) return;
    const lastPage = Math.max(1, pagination.totalPages);
    if (page > lastPage) setPage(lastPage);
  }, [page, pagination]);

  const reloadOrders = useCallback(
    () => setOrdersReload((current) => current + 1),
    [],
  );
  const territory = profile ? getTerritory(profile) : {};
  const currentPage = pagination?.page ?? page;
  const totalPages = pagination ? Math.max(1, pagination.totalPages) : 1;
  const territoryRows: Array<{
    label: string;
    area: TerritoryArea | null | undefined;
  }> = territory
    ? [
        { label: "Division", area: territory.division },
        { label: "District", area: territory.district },
        { label: "Upazila", area: territory.upazila },
      ]
    : [];

  return (
    <div className="space-y-6">
      {profileError ? (
        <ErrorPanel
          message={profileError}
          onRetry={() => setProfileReload((current) => current + 1)}
        />
      ) : profileLoading || !profile || !summary ? (
        <LoadingPanel label="Loading TSR profile…" />
      ) : (
        <>
          <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  TSR profile
                </p>
                <h2 className="mt-2 break-words text-lg font-semibold text-gray-900">
                  {profile.name?.trim() || "—"}
                </h2>
                <div className="mt-4 space-y-2.5 text-sm text-gray-600">
                  <p className="flex min-w-0 items-center gap-2">
                    <Mail size={15} className="shrink-0 text-gray-400" />
                    <span className="break-all">{profile.email || "—"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={15} className="shrink-0 text-gray-400" />
                    {profile.phone_number || profile.phone || "—"}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 text-gray-400"
                    />
                    <span>
                      {profile.fullAddress?.trim() ||
                        territory?.fullAddress?.trim() ||
                        "—"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <MapPin size={14} />
                  Territory
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {territoryRows.map(({ label, area }) => (
                    <div key={label} className="min-w-0">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                        {areaName(area)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <SummaryCards summary={summary} />
        </>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Package size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Orders</h2>
              <p className="text-[11px] text-gray-500">
                {pagination?.total ?? 0}{" "}
                {(pagination?.total ?? 0) === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search orders or customers"
                aria-label="Search TSR orders"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-50"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                Status
              </span>
              <select
                value={status}
                onChange={(event) => {
                  const value = event.target.value;
                  setStatus(
                    value === "all" || isTsrOrderStatus(value) ? value : "all",
                  );
                  setPage(1);
                }}
                aria-label="Filter orders by status"
                className="min-w-36 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-50"
              >
                {ORDER_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All" : statusLabels[option]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {ordersError ? (
          <div className="p-5">
            <ErrorPanel message={ordersError} onRetry={reloadOrders} />
          </div>
        ) : ordersLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium text-gray-500">
                Loading orders…
              </p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <Package size={24} className="text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              No orders found.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try changing the status filter or search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1750px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Pharmacy</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Address</th>
                  {/* <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Upazila</th> */}
                  <th className="px-4 py-3 text-right">Order Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const user = order.user;
                  const rowId = order.id || order.orderId || "";
                  const expanded = expandedOrder === rowId;
                  return (
                    <Fragment key={rowId}>
                      <tr className="group transition-colors hover:bg-gray-50/80">
                        <td className="px-4 py-4">
                          <code className="whitespace-nowrap rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700">
                            #{order.orderId || order.id || "—"}
                          </code>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-800">
                          {user?.name?.trim() || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {user?.pharmacy_name || order.pharmacy?.name || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {user?.phone_number || user?.phone || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {user?.email || user?.email || "—"}
                        </td>
                        <td className="px-4 py-4">
                          <OrderAddress order={order} />
                        </td>
                        {/* <td className="px-4 py-4 text-xs text-gray-600">
                          {locationLine(user?.division)}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600">
                          {locationLine(user?.district)}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600">
                          {locationLine(user?.upazila)}
                        </td> */}
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold tabular-nums text-gray-700">
                          {currency(order.totalAmount ?? order.totalOrderValue)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-600">
                          {order.createdAt ? orderDate(order.createdAt) : "—"}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!ordersError && !ordersLoading && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-gray-500">
              {pagination
                ? `Showing ${pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1}–${Math.min(currentPage * pagination.limit, pagination.total)} of ${formatSalesNumber(pagination.total)} orders`
                : " "}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="min-w-20 text-center text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
