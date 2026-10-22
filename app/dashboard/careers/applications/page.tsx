"use client";

import { careerApi } from "@/services/career/career.api";
import type {
  CareerApplication,
  CareerApplicationStatus,
} from "@/services/career/career.types";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const statuses: CareerApplicationStatus[] = [
  "NEW",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "REJECTED",
  "HIRED",
];

export default function CareerApplicationsPage() {
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (status) query.set("status", status);
    try {
      const result = await careerApi.listApplications(query);
      setApplications(result.data);
      setPages(result.pagination.pages || 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load applications";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const getStatusTone = (applicationStatus: CareerApplicationStatus) => {
    switch (applicationStatus) {
      case "NEW":
        return {
          pill: "bg-blue-50 text-blue-700 ring-blue-600/15",
          dot: "bg-blue-500",
        };
      case "REVIEWING":
        return {
          pill: "bg-violet-50 text-violet-700 ring-violet-600/15",
          dot: "bg-violet-500",
        };
      case "SHORTLISTED":
        return {
          pill: "bg-cyan-50 text-cyan-700 ring-cyan-600/15",
          dot: "bg-cyan-500",
        };
      case "INTERVIEW":
        return {
          pill: "bg-amber-50 text-amber-700 ring-amber-600/15",
          dot: "bg-amber-500",
        };
      case "REJECTED":
        return {
          pill: "bg-rose-50 text-rose-700 ring-rose-600/15",
          dot: "bg-rose-500",
        };
      case "HIRED":
        return {
          pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
          dot: "bg-emerald-500",
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
      {/* Filters */}
      <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 md:flex-row md:flex-wrap md:items-center md:gap-3 md:rounded-2xl md:p-4">
        <label className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 px-2.5 md:min-w-52 md:gap-2.5 md:rounded-xl md:border-gray-200 md:bg-gray-50/60 md:px-3.5 md:transition-all md:focus-within:border-blue-400 md:focus-within:bg-white md:focus-within:ring-4 md:focus-within:ring-blue-500/10">
          <Search
            size={15}
            className="shrink-0 text-gray-400 md:size-[16px] md:transition-colors md:group-focus-within:text-blue-500"
          />
          <input
            aria-label="Search applicants"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Candidate name or email"
            className="w-full bg-transparent py-2 text-sm outline-none md:py-2.5 md:placeholder:text-gray-400"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 md:contents">
          <label className="flex items-center gap-1.5">
            <span className="hidden text-[13px] font-medium text-gray-500 md:inline">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-xs outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 md:w-auto md:flex-none md:rounded-xl md:border-gray-200 md:bg-gray-50/60 md:px-3 md:py-2.5 md:text-sm md:focus:bg-white"
            >
              <option value="">All statuses</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 transition-colors active:bg-gray-50 disabled:opacity-50 md:w-auto md:rounded-xl md:border-gray-100 md:px-3.5 md:py-2.5 md:text-[13px] md:font-semibold md:text-gray-600 md:hover:text-gray-900"
          >
            <RefreshCw
              size={13}
              className={`md:size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Desktop table – unchanged */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  { label: "Candidate", align: "text-left" },
                  { label: "Contact", align: "text-left" },
                  { label: "Job", align: "text-left" },
                  { label: "Experience", align: "text-left" },
                  { label: "Status", align: "text-left" },
                  { label: "Submitted", align: "text-left" },
                  { label: "Details", align: "text-right" },
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
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-20 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                      <span className="text-sm font-medium text-gray-500">
                        Loading applications…
                      </span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-20 text-center text-red-600"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <p className="text-sm font-medium">{error}</p>
                      <button
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <RefreshCw size={14} />
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && applications.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-20 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                        <Search size={26} className="text-gray-300" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        No applications found.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                applications.map((application) => {
                  const tone = getStatusTone(application.status);
                  return (
                    <tr
                      key={application.id}
                      className="group transition-colors hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {application.fullName}
                          </span>
                          {/* {application.status === "NEW" && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 ring-1 ring-inset ring-blue-600/15">
                              New
                            </span>
                          )} */}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          className="text-sm text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                          href={`mailto:${application.email}`}
                        >
                          {application.email}
                        </a>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {application.phone}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="line-clamp-1 text-sm text-gray-700">
                          {application.job.title}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {application.experienceYears == null
                          ? "—"
                          : `${application.experienceYears} years`}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${tone.pill}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${tone.dot}`}
                          />
                          {application.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                          <CalendarDays
                            size={14}
                            className="shrink-0 text-gray-400"
                          />
                          {new Date(application.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          className="flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-colors px-2 py-1 hover:bg-emerald-200"
                          href={`/dashboard/careers/applications/${encodeURIComponent(application.id)}`}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile list – redesigned */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white md:hidden">
        {loading && (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
            <p className="mt-3 text-xs font-medium text-gray-500">
              Loading applications…
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-4 text-center"
          >
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={() => void load()}
              className="text-xs font-semibold text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Search size={22} className="text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">
              No applications found.
            </p>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {applications.map((application) => {
              const tone = getStatusTone(application.status);
              return (
                <li
                  key={application.id}
                  className="min-w-0 px-3 py-3 active:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold uppercase text-blue-600">
                      {application.fullName?.charAt(0) || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {application.fullName}
                        </p>
                        {application.status === "NEW" && (
                          <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {application.email}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-400">
                        {application.phone}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${tone.pill}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${tone.dot}`}
                      />
                      {application.status.toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-50 pt-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-gray-700">
                        {application.job.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10px] tabular-nums text-gray-400">
                          {application.experienceYears == null
                            ? "—"
                            : `${application.experienceYears} yrs`}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] tabular-nums text-gray-400">
                          <CalendarDays size={9} className="shrink-0" />
                          {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/careers/applications/${encodeURIComponent(application.id)}`}
                      className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 transition-colors active:scale-95"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination – compact on mobile */}
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span className="text-[11px] text-gray-500 md:text-sm md:tabular-nums">
          <span className="md:hidden">
            {page}/{pages}
          </span>
          <span className="hidden md:inline">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{pages}</span>
          </span>
        </span>
        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors disabled:opacity-40 md:h-9 md:w-9 md:rounded-xl md:border-gray-100 md:hover:bg-gray-50 md:hover:text-gray-900"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            disabled={page >= pages || loading}
            onClick={() => setPage((current) => current + 1)}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors disabled:opacity-40 md:h-9 md:w-9 md:rounded-xl md:border-gray-100 md:hover:bg-gray-50 md:hover:text-gray-900"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
