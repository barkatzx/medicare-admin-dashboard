export type CareerEmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "TEMPORARY";
export type CareerWorkplaceType = "ONSITE" | "REMOTE" | "HYBRID";
export type CareerJobStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type CareerApplicationStatus =
  | "NEW"
  | "REVIEWING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "REJECTED"
  | "HIRED";

export interface CareerJob {
  id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: CareerEmploymentType;
  workplaceType: CareerWorkplaceType;
  location: string;
  shortDescription: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  qualifications: string | null;
  salaryMin: string | number | null;
  salaryMax: string | number | null;
  salaryCurrency: string | null;
  applicationDeadline: string | null;
  status: CareerJobStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
}

export interface CareerApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentLocation?: string | null;
  education?: string | null;
  experienceYears: number | null;
  currentCompany?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  coverLetter?: string | null;
  resumeOriginalName?: string;
  resumeUrl?: string;
  resumeUrlExpiresIn?: number;
  status: CareerApplicationStatus;
  adminNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  job: { id: string; title: string; slug?: string; department?: string };
}

export interface CareerPage<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CareerJobInput {
  title: string;
  slug: string;
  department: string;
  employmentType: CareerEmploymentType;
  workplaceType: CareerWorkplaceType;
  location: string;
  shortDescription: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  qualifications: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  applicationDeadline: string | null;
}
