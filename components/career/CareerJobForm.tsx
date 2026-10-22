"use client";

import Button from "@/components/ui/Button";
import { careerApi } from "@/services/career/career.api";
import type {
  CareerEmploymentType,
  CareerJob,
  CareerJobInput,
  CareerJobStatus,
  CareerWorkplaceType,
} from "@/services/career/career.types";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const employmentTypes: CareerEmploymentType[] = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
];
const workplaceTypes: CareerWorkplaceType[] = ["ONSITE", "REMOTE", "HYBRID"];
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const emptyJob: CareerJobInput = {
  title: "",
  slug: "",
  department: "",
  employmentType: "FULL_TIME",
  workplaceType: "ONSITE",
  location: "",
  shortDescription: "",
  description: "",
  responsibilities: null,
  requirements: null,
  qualifications: null,
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  applicationDeadline: null,
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 md:rounded-xl md:border-gray-200 md:bg-gray-50/60 md:px-3.5 md:py-2.5 md:focus:bg-white";
const labelClass =
  "block text-xs font-medium text-gray-700 md:text-[13px] md:font-semibold md:text-gray-600";

export default function CareerJobForm({ jobId }: { jobId?: string }) {
  const [job, setJob] = useState<CareerJobInput>(emptyJob);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [saving, setSaving] = useState(false);
  const [jobStatus, setJobStatus] = useState<CareerJobStatus>("DRAFT");
  const [slugEdited, setSlugEdited] = useState(Boolean(jobId));

  useEffect(() => {
    if (!jobId) return;
    careerApi
      .getJob(jobId)
      .then((data: CareerJob) => {
        setJobStatus(data.status);
        setJob({
          title: data.title,
          slug: data.slug,
          department: data.department,
          employmentType: data.employmentType,
          workplaceType: data.workplaceType,
          location: data.location,
          shortDescription: data.shortDescription,
          description: data.description,
          responsibilities: data.responsibilities,
          requirements: data.requirements,
          qualifications: data.qualifications,
          salaryMin: data.salaryMin == null ? null : Number(data.salaryMin),
          salaryMax: data.salaryMax == null ? null : Number(data.salaryMax),
          salaryCurrency: data.salaryCurrency,
          applicationDeadline: data.applicationDeadline?.slice(0, 10) ?? null,
        });
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const set = <K extends keyof CareerJobInput>(
    key: K,
    value: CareerJobInput[K],
  ) => setJob((current) => ({ ...current, [key]: value }));

  const submit = async (publish: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...job,
        ...(publish
          ? { status: "PUBLISHED" as const }
          : jobId
            ? {}
            : { status: "DRAFT" as const }),
        ...(job.applicationDeadline
          ? {
              applicationDeadline: new Date(
                `${job.applicationDeadline}T23:59:59.999Z`,
              ).toISOString(),
            }
          : {}),
      };
      if (jobId) {
        await careerApi.updateJob(jobId, payload);
      } else {
        await careerApi.createJob(payload);
      }
      toast.success(
        publish ? "Job published" : jobId ? "Job changes saved" : "Draft saved",
      );
      window.location.assign("/dashboard/careers/jobs");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save job",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-600">Loading job…</p>;

  return (
    <section className="mx-auto max-w-4xl space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/dashboard/careers/jobs"
            className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 transition-colors active:text-blue-600 md:mb-2 md:text-[13px] md:hover:text-blue-600"
          >
            <ArrowLeft size={13} className="md:size-[15px]" /> Back to jobs
          </Link>
          <h1 className="text-base font-semibold text-gray-900 md:text-[26px] md:font-bold md:tracking-tight">
            {jobId ? "Edit job" : "Create a job"}
          </h1>
          <p className="mt-0.5 hidden text-[11px] text-gray-500 sm:block md:mt-1 md:text-sm">
            {jobId
              ? "Update the details of this job posting."
              : "Fill in the details below to create a new job posting."}
          </p>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(false);
        }}
        className="grid gap-3.5 rounded-xl border border-gray-100 bg-white p-3.5 md:grid-cols-2 md:gap-6 md:rounded-2xl md:p-6"
      >
        <label className={labelClass}>
          Job title *
          <input
            className={fieldClass}
            required
            value={job.title}
            onChange={(event) => {
              const title = event.target.value;
              setJob((current) => ({
                ...current,
                title,
                ...(!slugEdited ? { slug: slugify(title) } : {}),
              }));
            }}
          />
        </label>
        <label className={labelClass}>
          Slug *
          <input
            className={fieldClass}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={job.slug}
            onChange={(event) => {
              setSlugEdited(true);
              set("slug", slugify(event.target.value));
            }}
          />
        </label>
        <label className={labelClass}>
          Department *
          <input
            className={fieldClass}
            required
            value={job.department}
            onChange={(event) => set("department", event.target.value)}
          />
        </label>
        <label className={labelClass}>
          Employment type *
          <select
            className={fieldClass}
            value={job.employmentType}
            onChange={(event) =>
              set("employmentType", event.target.value as CareerEmploymentType)
            }
          >
            {employmentTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Workplace type *
          <select
            className={fieldClass}
            value={job.workplaceType}
            onChange={(event) =>
              set("workplaceType", event.target.value as CareerWorkplaceType)
            }
          >
            {workplaceTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Location *
          <input
            className={fieldClass}
            required
            value={job.location}
            onChange={(event) => set("location", event.target.value)}
          />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Short description *
          <textarea
            className={fieldClass}
            required
            rows={2}
            maxLength={500}
            value={job.shortDescription}
            onChange={(event) => set("shortDescription", event.target.value)}
          />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Full description *
          <textarea
            className={fieldClass}
            required
            rows={5}
            value={job.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </label>
        {(
          [
            ["responsibilities", "Responsibilities"],
            ["requirements", "Requirements"],
            ["qualifications", "Qualifications"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className={`${labelClass} md:col-span-2`}>
            {label}
            <textarea
              className={fieldClass}
              rows={4}
              value={job[key] ?? ""}
              onChange={(event) => set(key, event.target.value || null)}
            />
          </label>
        ))}
        <label className={labelClass}>
          Minimum salary
          <input
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            value={job.salaryMin ?? ""}
            onChange={(event) =>
              set(
                "salaryMin",
                event.target.value ? Number(event.target.value) : null,
              )
            }
          />
        </label>
        <label className={labelClass}>
          Maximum salary
          <input
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            value={job.salaryMax ?? ""}
            onChange={(event) =>
              set(
                "salaryMax",
                event.target.value ? Number(event.target.value) : null,
              )
            }
          />
        </label>
        <label className={labelClass}>
          Salary currency
          <input
            className={fieldClass}
            maxLength={8}
            placeholder="BDT"
            value={job.salaryCurrency ?? ""}
            onChange={(event) =>
              set("salaryCurrency", event.target.value || null)
            }
          />
        </label>
        <label className={labelClass}>
          Application deadline
          <input
            className={fieldClass}
            type="date"
            value={job.applicationDeadline ?? ""}
            onChange={(event) =>
              set("applicationDeadline", event.target.value || null)
            }
          />
        </label>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3.5 md:col-span-2 md:gap-2.5 md:pt-5">
          <Button
            type="submit"
            disabled={saving}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors active:bg-blue-700 disabled:opacity-50 md:h-auto md:rounded-xl md:px-4 md:py-2.5 md:text-sm md:font-semibold"
          >
            <Save size={14} className="md:size-[15px]" />
            {jobId ? "Save" : "Save draft"}
          </Button>
          <button
            type="button"
            disabled={saving || jobStatus === "ARCHIVED"}
            onClick={() => void submit(true)}
            className="flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors active:bg-emerald-700 disabled:opacity-50 md:h-auto md:rounded-xl md:px-4 md:py-2.5 md:text-sm md:font-semibold md:hover:bg-emerald-700"
          >
            {saving
              ? "Saving…"
              : jobStatus === "PUBLISHED"
                ? "Publish changes"
                : "Publish"}
          </button>
        </div>
      </form>
    </section>
  );
}
