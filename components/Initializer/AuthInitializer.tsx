"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  checkAuthStatus,
  clearCredentials,
} from "@/store/slices/authSlice";
import { SESSION_EXPIRED_EVENT } from "@/config/api/client";
import Spinner from "../ui/Spinner";

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAppSelector((state) => state.auth);
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (mounted && !isInitialized) {
      dispatch(checkAuthStatus());
    }
  }, [dispatch, isInitialized, mounted]);

  useEffect(() => {
    const clearExpiredSession = () => dispatch(clearCredentials());
    window.addEventListener(SESSION_EXPIRED_EVENT, clearExpiredSession);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, clearExpiredSession);
  }, [dispatch]);

  // Ensure first client render matches server render (spinner)
  if (!mounted || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <Spinner />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
