"use client";

import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slices/authSlice";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submittingRef = useRef(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || submittingRef.current) return;

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    submittingRef.current = true;
    try {
      await dispatch(login({ email, password })).unwrap();
    } catch {
      // The rejected thunk reports the login error through the auth slice.
    } finally {
      submittingRef.current = false;
    }
  };

  // ✅ Render nothing (or a neutral shell) until client is ready
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-3 sm:p-4" />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-3 sm:p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-100 bg-white p-5 sm:space-y-8 sm:p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admin Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the MediCarePLC Dashboard
          </p>
        </div>

        {/* Form */}
        <form className="mt-6 space-y-5 sm:mt-8 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-h-0"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-h-0"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600 sm:right-3 sm:h-auto sm:w-auto"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" loading={loading} className="min-h-11 w-full py-3 sm:py-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
        <div className="flex items-start justify-center gap-2 rounded-lg border border-red-200 bg-red-100 p-3 text-xs sm:p-4 sm:text-sm">
          <Lock size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p className="min-w-0">
            <span className="text-red-500">
              Only for authorized person. Please contact your administrator if
              you need access.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
