"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/config/api";
import type { SalesSummaryData } from "@/config/api";
import {
  SalesByStatus,
  SalesGrowth,
  SalesOverview,
  TopCategories,
  TopCustomers,
  TopProducts,
} from "@/components/sales";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
  );
}

function SalesSummarySkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonBlock key={index} className="h-32" />
        ))}
      </div>
      <SkeletonBlock className="h-36" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SkeletonBlock className="h-[430px]" />
        <SkeletonBlock className="h-[430px]" />
      </div>
      <SkeletonBlock className="h-96" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<SalesSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const response = await api.getSalesSummary();
      setSummary(response);
    } catch (error) {
      console.error("Failed to load sales summary:", error);
      setHasError(true);
      toast.error("Unable to load sales analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (loading) {
    return <SalesSummarySkeleton />;
  }

  if (hasError || !summary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Activity size={22} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Sales analytics unavailable
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            We couldn&apos;t retrieve the sales summary. Check your connection
            and try again.
          </p>
          <button
            type="button"
            onClick={() => void loadSummary()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    overall_summary: overview,
    growth_percentage: growth,
    sales_by_status: statuses,
  } = summary;

  return (
    <div className="space-y-7 pb-8">
      <SalesOverview summary={overview} />
      <SalesGrowth growth={growth} />
      <SalesByStatus data={statuses} />
      <TopProducts products={overview.topProducts} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TopCategories categories={overview.topCategories} />
        <TopCustomers customers={overview.topCustomers} />
      </div>
    </div>
  );
}
