"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Spinner from "@/components/ui/Spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Server + first client render: render children as-is, no spinner
  // This ensures SSR output matches between server and client
  if (!mounted) {
    return <>{children}</>;
  }

  // ✅ After hydration: safe to read Redux state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-[#F9FAFB] border border-gray-100 rounded-xl m-3 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
