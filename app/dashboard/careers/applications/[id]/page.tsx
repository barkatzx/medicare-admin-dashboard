"use client";

import { careerApi } from "@/services/career/career.api";
import type {
  CareerApplication,
  CareerApplicationStatus,
} from "@/services/career/career.types";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileDown,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const statuses: CareerApplicationStatus[] = [
  "NEW",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "REJECTED",
  "HIRED",
];

export default function CareerApplicationDetailsPage() {
  const params = useParams<{ id: string }>();
  const [application, setApplication] = useState<CareerApplication | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    careerApi
      .getApplication(params.id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setApplication(result);
        setNotes(result.adminNotes ?? "");
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load application";
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [params.id, loadKey]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError("");
    setLoadKey((key) => key + 1);
  };

  const updateStatus = async (status: CareerApplicationStatus) => {
    if (!application) return;
    setSaving(true);
    try {
      const updated = await careerApi.updateApplicationStatus(
        application.id,
        status,
      );
      setApplication({ ...application, ...updated });
      toast.success("Application status updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update status",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!application || saving) return;
    setSaving(true);
    try {
      const updated = await careerApi.updateApplicationNotes(
        application.id,
        notes,
      );
      setApplication({ ...application, adminNotes: updated.adminNotes });
      toast.success("Private notes saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save notes",
      );
    } finally {
      setSaving(false);
    }
  };

  const openResume = async () => {
    if (!application) return;
    try {
      const { resumeUrl } = await careerApi.getResume(application.id);
      window.open(resumeUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to access resume",
      );
    }
  };

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

  if (loading)
    return (
      <p className="p-4 text-sm text-gray-600 md:p-6 md:text-base">
        Loading application…
      </p>
    );
  if (!application)
    return (
      <div className="space-y-3 p-4 md:space-y-4 md:p-6">
        <p className="text-sm text-red-700 md:text-base">
          {loadError || "Application not found."}
        </p>
        <button
          onClick={handleRetry}
          className="text-xs font-semibold text-blue-700 underline md:text-sm"
        >
          Retry
        </button>
      </div>
    );

  const tone = getStatusTone(application.status);

  const detail = (label: string, value?: string | number | null) => (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-[11px]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-gray-900 md:text-[13px] md:font-medium">
        {value || "—"}
      </dd>
    </div>
  );

  return (
    <section className="mx-auto max-w-5xl space-y-4 md:space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/careers/applications"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 transition-colors active:text-blue-600 md:gap-2 md:text-[13px] md:hover:text-blue-600"
      >
        <ArrowLeft size={13} className="md:size-[15px]" /> Back
      </Link>

      {/* Header card */}
      <header className="flex flex-col gap-3 rounded-xl border border-gray-50 bg-white p-3.5 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-4 md:rounded-2xl md:border-gray-200 md:p-6">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-gray-500 md:text-[13px]">
            Application for {application.job.title}
          </p>
          <h1 className="mt-0.5 truncate text-base font-semibold text-gray-900 md:mt-1 md:text-[26px] md:font-bold md:tracking-tight">
            {application.fullName}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 md:mt-1.5 md:text-[13px]">
            <CalendarDays
              size={12}
              className="shrink-0 text-gray-400 md:size-[13px]"
            />
            {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 md:flex-col md:items-start md:gap-2">
          <span className="min-w-0 truncate text-[11px] text-gray-500 md:max-w-[220px] md:text-[11px]">
            {application.resumeOriginalName}
          </span>
          <button
            onClick={() => void openResume()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors active:bg-blue-700 md:gap-2 md:rounded-xl md:px-4 md:py-2.5 md:text-[13px] md:hover:bg-blue-700"
          >
            <FileDown size={13} className="md:size-[15px]" />
            Resume
          </button>
        </div>
      </header>

      <div className="grid gap-3.5 md:gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3.5 md:space-y-5">
          {/* Candidate info */}
          <section className="rounded-xl border border-gray-100 bg-white p-3.5 md:rounded-2xl md:border-gray-200 md:p-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 md:mb-4 md:text-[15px]">
              Candidate information
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-x-6 md:gap-y-5">
              {detail("Email", application.email)}
              {detail("Phone", application.phone)}
              {detail("Location", application.currentLocation)}
              {detail("Education", application.education)}
              {detail(
                "Experience",
                application.experienceYears == null
                  ? null
                  : `${application.experienceYears} years`,
              )}
              {detail("Current company", application.currentCompany)}
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-[11px]">
                  Portfolio
                </dt>
                <dd className="mt-1 text-sm md:text-[13px]">
                  {application.portfolioUrl ? (
                    <a
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline md:rounded-md md:border md:border-gray-100 md:bg-white md:px-2 md:py-1 md:text-[12px] md:font-medium md:transition-colors md:hover:border-blue-200 md:hover:bg-blue-50"
                      href={application.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open <ExternalLink size={11} className="md:size-[12px]" />
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-[11px]">
                  LinkedIn
                </dt>
                <dd className="mt-1 text-sm md:text-[13px]">
                  {application.linkedinUrl ? (
                    <a
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline md:rounded-md md:border md:border-gray-100 md:bg-white md:px-2 md:py-1 md:text-[12px] md:font-medium md:transition-colors md:hover:border-blue-200 md:hover:bg-blue-50"
                      href={application.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open <ExternalLink size={11} className="md:size-[12px]" />
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Cover letter */}
          <section className="rounded-xl border border-gray-100 bg-white p-3.5 md:rounded-2xl md:border-gray-200 md:p-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-900 md:mb-3 md:text-[15px]">
              Cover letter
            </h2>
            <p className="whitespace-pre-wrap text-xs leading-5 text-gray-700 md:text-[13px] md:leading-6">
              {application.coverLetter || "No cover letter provided."}
            </p>
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 md:rounded-2xl md:border-amber-200/70 md:p-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-900 md:mb-3 md:text-[15px]">
              Private notes
            </h2>
            <textarea
              aria-label="Administrative notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-lg border border-amber-200 bg-white p-2.5 text-sm outline-none focus:border-amber-500 md:rounded-xl md:border-amber-200 md:p-3.5 md:text-[13px] md:leading-6 md:transition-colors md:focus:border-amber-400 md:focus:ring-4 md:focus:ring-amber-500/10"
            />
            <button
              disabled={saving}
              onClick={() => void saveNotes()}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors active:bg-gray-800 disabled:opacity-50 md:mt-3 md:gap-2 md:rounded-xl md:px-4 md:py-2.5 md:text-[13px] md:hover:bg-gray-800"
            >
              <Save size={13} className="md:size-[14px]" /> Save
            </button>
          </section>
        </div>

        {/* Review sidebar */}
        <aside className="h-fit rounded-xl border border-gray-100 bg-white p-3.5 md:rounded-2xl md:border-gray-200 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 md:text-[15px]">
              Review
            </h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${tone.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {application.status.toLowerCase()}
            </span>
          </div>
          <label className="mt-3 block text-xs font-medium text-gray-700 md:mt-4 md:text-[13px] md:font-semibold md:text-gray-600">
            Application status
            <select
              disabled={saving}
              value={application.status}
              onChange={(event) =>
                void updateStatus(event.target.value as CareerApplicationStatus)
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 md:rounded-xl md:border-gray-200 md:bg-gray-50/60 md:px-3.5 md:py-2.5 md:text-[13px] md:focus:border-blue-400 md:focus:bg-white md:focus:ring-2 md:focus:ring-blue-500/10"
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-500 md:mt-4 md:text-[11px]">
            <CalendarDays
              size={11}
              className="shrink-0 text-gray-400 md:size-[11px]"
            />
            {application.reviewedAt
              ? `Last reviewed ${new Date(application.reviewedAt).toLocaleDateString()}`
              : "Not reviewed yet"}
          </p>
        </aside>
      </div>
    </section>
  );
}
