"use client";

import CareerJobForm from "@/components/career/CareerJobForm";
import { useParams } from "next/navigation";

export default function EditCareerJobPage() {
  const params = useParams<{ id: string }>();
  return <CareerJobForm jobId={params.id} />;
}
