"use client";

import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { useDebouncedValue } from "@/components/utils/useDebouncedValue";
import StatusBadge, {
  type StatusBadgeTone,
} from "@/components/ui/StatusBadge";
import { careerApi } from "@/services/career/career.api";
import type {
  CareerJob,
  CareerJobStatus,
} from "@/services/career/career.types";
import {
  Archive,
  CalendarDays,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const statuses: CareerJobStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
  "ARCHIVED",
];

export default function CareerJobsPage() {
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const requestKey = JSON.stringify([
    page,
    debouncedSearch,
    status,
    reloadVersion,
  ]);
  const [completedRequestKey, setCompletedRequestKey] = useState<string | null>(
    null,
  );
  const isLoading =
    completedRequestKey !== requestKey ||
    search !== debouncedSearch;

  const load = useCallback(async (signal: AbortSignal, activeRequestKey: string) => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedSearch.trim()) query.set("search", debouncedSearch.trim());
    if (status) query.set("status", status);
    try {
      const result = await careerApi.listJobs(query, signal);
      if (signal.aborted) return;
      setJobs(result.data);
      setError("");
      setPagination({ ...result.pagination, pages: result.pagination.pages || 1 });
    } catch (error) {
      if (signal.aborted) return;
      const message =
        error instanceof Error ? error.message : "Unable to load jobs";
      setError(message);
      toast.error(message);
    } finally {
      if (!signal.aborted) setCompletedRequestKey(activeRequestKey);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    if (search !== debouncedSearch) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        return load(controller.signal, requestKey);
      }
    });
    return () => controller.abort();
  }, [load, search, debouncedSearch, requestKey]);

  const refresh = () => setReloadVersion((version) => version + 1);

  const transition = async (
    job: CareerJob,
    action: "publish" | "close" | "archive",
  ) => {
    const label = action[0].toUpperCase() + action.slice(1);
    if (!window.confirm(`${label} “${job.title}”?`)) return;
    setActionId(job.id);
    try {
      await careerApi.transitionJob(job.id, action);
      toast.success(`Job ${action}ed`);
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Unable to ${action} job`,
      );
    } finally {
      setActionId(null);
    }
  };

  const getStatusTone = (jobStatus: CareerJobStatus): StatusBadgeTone => {
    switch (jobStatus) {
      case "PUBLISHED":
        return "success";
      case "DRAFT":
        return "neutral";
      case "CLOSED":
        return "warning";
      case "ARCHIVED":
        return "danger";
      default:
        return "neutral";
    }
  };

  // Desktop-only status styling
  const getDesktopStatus = (jobStatus: CareerJobStatus) => {
    switch (jobStatus) {
      case "PUBLISHED":
        return {
          pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
          dot: "bg-emerald-500",
        };
      case "DRAFT":
        return {
          pill: "bg-gray-50 text-gray-600 ring-gray-500/15",
          dot: "bg-gray-400",
        };
      case "CLOSED":
        return {
          pill: "bg-amber-50 text-amber-700 ring-amber-600/15",
          dot: "bg-amber-500",
        };
      case "ARCHIVED":
        return {
          pill: "bg-rose-50 text-rose-700 ring-rose-600/15",
          dot: "bg-rose-500",
        };
      default:
        return {
          pill: "bg-gray-50 text-gray-600 ring-gray-500/15",
          dot: "bg-gray-400",
        };
    }
  };

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-2xl md:p-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
          <label className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-100 px-2.5 md:max-w-md md:min-w-64 md:gap-2.5 md:rounded-xl md:border-gray-100 md:bg-gray-50/60 md:px-3.5 md:transition-all md:focus-within:border-blue-400 md:focus-within:bg-white md:focus-within:ring-4 md:focus-within:ring-blue-500/10">
            <Search
              size={15}
              className="shrink-0 text-gray-400 md:size-[17px] md:transition-colors md:group-focus-within:text-blue-500"
            />
            <input
              aria-label="Search jobs"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search title, department, location"
              className="w-full bg-transparent py-2 text-sm outline-none md:py-2.5 md:placeholder:text-gray-400"
            />
          </label>

          {/* Mobile / tablet select (unchanged) */}
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="h-9 w-28 shrink-0 rounded-lg border border-gray-100 bg-white px-2 text-xs md:hidden"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          {/* Desktop segmented status filter */}
          <div
            role="tablist"
            aria-label="Filter by status"
            className="hidden items-center gap-0.5 rounded-xl bg-gray-50 p-1 ring-1 ring-inset ring-gray-100 md:flex"
          >
            {[{ label: "All", value: "" }]
              .concat(
                statuses.map((item) => ({
                  label: item[0] + item.slice(1).toLowerCase(),
                  value: item,
                })),
              )
              .map((item) => {
                const active = status === item.value;
                return (
                  <button
                    key={item.value || "all"}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setPage(1);
                      setStatus(item.value);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                      active
                        ? "bg-white text-gray-900 ring-1 ring-inset ring-gray-100"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2 md:w-auto md:shrink-0 md:justify-end md:gap-2.5">
          <Button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs md:h-10 md:gap-0 md:rounded-xl md:px-4 md:text-sm"
          >
            <RefreshCw
              size={13}
              className={`md:mr-2 md:size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          <Link
            href="/dashboard/careers/jobs/create"
            className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 md:h-10 md:rounded-xl md:px-4 md:py-2 md:text-sm md:font-semibold"
          >
            <Plus size={13} className="mr-1 md:mr-2 md:size-4" />
            New job
          </Link>
        </div>
      </div>

      {/* Desktop table – redesigned */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  { label: "Job", align: "text-left" },
                  { label: "Department", align: "text-left" },
                  { label: "Type", align: "text-left" },
                  { label: "Location", align: "text-left" },
                  { label: "Status", align: "text-left" },
                  { label: "Applications", align: "text-center" },
                  { label: "Published", align: "text-left" },
                  { label: "Actions", align: "text-right" },
                ].map((heading) => (
                  <th
                    key={heading.label}
                    className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 ${heading.align}`}
                  >
                    {heading.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-20 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                      <span className="text-sm font-medium text-gray-500">
                        Loading jobs…
                      </span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-20 text-center text-red-600"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                        <XCircle size={22} className="text-red-500" />
                      </div>
                      <p className="text-sm font-medium">{error}</p>
                      <button
                        onClick={refresh}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <RefreshCw size={14} />
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && !error && jobs.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-20 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                        <Search size={26} className="text-gray-300" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        No career jobs found.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading &&
                jobs.map((job) => {
                  const tone = getDesktopStatus(job.status);
                  const applications = job._count?.applications ?? 0;
                  return (
                    <tr
                      key={job.id}
                      className="group transition-colors hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            className="max-w-[260px] truncate text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600"
                            href={`/dashboard/careers/jobs/${encodeURIComponent(job.id)}/edit`}
                          >
                            {job.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {job.department}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-100">
                          {job.employmentType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin
                            size={14}
                            className="shrink-0 text-gray-400"
                          />
                          {job.location}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${tone.pill}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${tone.dot}`}
                          />
                          {job.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                            applications > 0
                              ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15"
                              : "bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-100"
                          }`}
                        >
                          {applications}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {job.publishedAt ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                            <CalendarDays
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            {new Date(job.publishedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
                          {job.status !== "PUBLISHED" &&
                            job.status !== "ARCHIVED" && (
                              <button
                                disabled={actionId === job.id}
                                onClick={() => void transition(job, "publish")}
                                title="Publish"
                                aria-label="Publish"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-500 transition-colors hover:bg-emerald-200 disabled:opacity-40"
                              >
                                <Send size={14} />
                              </button>
                            )}
                          {job.status === "PUBLISHED" && (
                            <button
                              disabled={actionId === job.id}
                              onClick={() => void transition(job, "close")}
                              title="Close"
                              aria-label="Close"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-500 transition-colors hover:bg-amber-200 disabled:opacity-40"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          {job.status !== "ARCHIVED" && (
                            <button
                              disabled={actionId === job.id}
                              onClick={() => void transition(job, "archive")}
                              title="Archive"
                              aria-label="Archive"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-500 transition-colors hover:bg-rose-200 disabled:opacity-40"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile list – unchanged */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white md:hidden">
        {isLoading && (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
            <p className="mt-3 text-xs font-medium text-gray-500">
              Loading jobs…
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-4 text-center"
          >
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={refresh}
              className="text-xs font-semibold text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && jobs.length === 0 && (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Search size={22} className="text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">
              No career jobs found.
            </p>
          </div>
        )}

        {!isLoading && !error && jobs.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {jobs.map((job) => (
              <li key={job.id} className="min-w-0 px-3 py-3 active:bg-gray-50">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold uppercase text-blue-600">
                    {job.title?.charAt(0) || "J"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/careers/jobs/${encodeURIComponent(job.id)}/edit`}
                      className="block truncate text-sm font-medium text-gray-900 active:text-blue-600"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {job.department} · {job.location}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400">
                      {job.employmentType}
                      {job.publishedAt
                        ? ` · ${new Date(job.publishedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge
                    label={job.status.toLowerCase()}
                    tone={getStatusTone(job.status)}
                    className="shrink-0"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-50 pt-2">
                  <span className="inline-flex items-center rounded-full bg-pink-100 px-2 py-1 text-[10px] font-semibold tabular-nums text-pink-500">
                    {job._count?.applications ?? 0}{" "}
                    {(job._count?.applications ?? 0) === 1
                      ? "applicant"
                      : "applicants"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {job.status !== "PUBLISHED" &&
                      job.status !== "ARCHIVED" && (
                        <button
                          disabled={actionId === job.id}
                          onClick={() => void transition(job, "publish")}
                          title="Publish"
                          aria-label="Publish"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-500 transition-colors hover:bg-emerald-200 disabled:opacity-40"
                        >
                          <Send size={14} />
                        </button>
                      )}
                    {job.status === "PUBLISHED" && (
                      <button
                        disabled={actionId === job.id}
                        onClick={() => void transition(job, "close")}
                        title="Close"
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-500 transition-colors hover:bg-amber-200 disabled:opacity-40"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                    {job.status !== "ARCHIVED" && (
                      <button
                        disabled={actionId === job.id}
                        onClick={() => void transition(job, "archive")}
                        title="Archive"
                        aria-label="Archive"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-500 transition-colors hover:bg-rose-200 disabled:opacity-40"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination
        pagination={pagination}
        currentPage={page}
        loading={isLoading}
        onPageChange={setPage}
      />
    </section>
  );
}
