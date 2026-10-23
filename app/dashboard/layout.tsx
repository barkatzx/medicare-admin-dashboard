"use client";

import { useState, useCallback, useRef, useSyncExternalStore } from "react";
import { useAppSelector } from "@/store/hooks";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Spinner from "@/components/ui/Spinner";

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { isInitialized } = useAppSelector((state) => state.auth);
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot,
  );

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
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
      <div className="flex min-h-screen w-full flex-col overflow-x-hidden md:flex-row md:min-h-0">
        <Sidebar
          isMobileOpen={isMobileNavOpen}
          onMobileClose={closeMobileNav}
        />
        <div className="m-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-[#F9FAFB] md:m-3 md:rounded-xl md:border md:border-gray-100">
          <Header
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            isMobileNavOpen={isMobileNavOpen}
            menuButtonRef={mobileMenuButtonRef}
          />
          <main className="min-w-0 flex-1 overflow-y-auto p-3 md:p-5">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
