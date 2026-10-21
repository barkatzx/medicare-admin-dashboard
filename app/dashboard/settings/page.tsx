"use client";

import { useEffect, useState } from "react";
import { api } from "@/config/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  Shield,
  User,
  Globe,
  Phone,
  MapPin,
  Clock,
  Edit,
  Eye,
  EyeOff,
  AlertCircle,
  Calendar,
  Plus,
  Trash2,
  Home,
  Save,
  Star,
  RefreshCw,
  Settings,
  ChevronRight,
  Lock,
  Fingerprint,
  AtSign,
  Building2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import toast from "react-hot-toast";
import { parseDeviceInfo, type DeviceInfo } from "@/components/utils/deviceInfo";

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface Profile {
  id: string;
  email: string;
  phone_number: string;
  name: string;
  pharmacy_name: string | null;
  role: string;
  isApproved: boolean;
  createdAt: string;
  defaultAddressId: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    pharmacy_name: "",
    phone_number: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Bangladesh",
    isDefault: false,
  });

  useEffect(() => {
    setDeviceInfo(parseDeviceInfo(navigator.userAgent));
  }, []);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please login again.");
      setLoading(false);
      return;
    }
    await fetchAllData();
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchProfile();
      await fetchAddresses();
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      setError(error?.message || "Failed to load data");
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      if (data) {
        setProfile(data);
        setEditForm({
          name: data.name || "",
          pharmacy_name: data.pharmacy_name || "",
          phone_number: data.phone_number || "",
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      throw error;
    }
  };

  const fetchAddresses = async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      setAddresses([]);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.updateProfile(editForm);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      await fetchProfile();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await api.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordModalOpen(false);
      setShowPassword(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password");
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.country) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressForm);
        toast.success("Address updated successfully");
      } else {
        await api.createAddress(addressForm);
        toast.success("Address added successfully");
      }
      setIsAddressModalOpen(false);
      setEditingAddress(null);
      setAddressForm({
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bangladesh",
        isDefault: false,
      });
      await fetchAddresses();
      await fetchProfile();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        await api.deleteAddress(addressId);
        toast.success("Address deleted successfully");
        await fetchAddresses();
        await fetchProfile();
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete address");
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await api.setDefaultAddress(addressId);
      toast.success("Default address updated");
      await fetchAddresses();
      await fetchProfile();
    } catch (error: any) {
      toast.error(error?.message || "Failed to set default address");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle size={24} className="text-rose-600" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-700">{error}</p>
          <p className="mb-5 text-xs text-gray-400">
            Please try again or sign in again
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={fetchAllData} className="gap-2">
              <RefreshCw size={15} />
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/login")}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const profileFields = [
    { icon: User, label: "Full name", value: profile.name || "N/A" },
    {
      icon: Building2,
      label: "Pharmacy name",
      value: profile.pharmacy_name || "N/A",
    },
    { icon: AtSign, label: "Email address", value: profile.email },
    { icon: Phone, label: "Phone number", value: profile.phone_number },
    {
      icon: Calendar,
      label: "Member since",
      value: new Date(profile.createdAt).toLocaleDateString(),
    },
    { icon: Shield, label: "Role", value: profile.role?.toUpperCase() },
  ];

  return (
    <div className="min-w-0 space-y-5 md:space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* ─── Main column ─────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 md:space-y-6 lg:col-span-2">
          {/* Profile */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 md:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <User size={15} strokeWidth={2.25} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Profile information
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    View and manage your personal information
                  </p>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 md:min-h-0"
                >
                  <Edit size={13} />
                  Edit
                </button>
              )}
            </div>

            <div className="p-4 md:p-6">
              {isEditing ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      {
                        label: "Full name",
                        key: "name" as const,
                        type: "text",
                        placeholder: "Enter your full name",
                      },
                      {
                        label: "Pharmacy name",
                        key: "pharmacy_name" as const,
                        type: "text",
                        placeholder: "Enter pharmacy name",
                      },
                      {
                        label: "Phone number",
                        key: "phone_number" as const,
                        type: "tel",
                        placeholder: "Enter phone number",
                      },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={editForm[key]}
                          placeholder={placeholder}
                          onChange={(e) =>
                            setEditForm({ ...editForm, [key]: e.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500"
                      />
                      <p className="mt-1 text-[11px] font-medium text-gray-400">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-3">
                    <Button onClick={handleUpdateProfile} className="min-h-11 gap-2 sm:min-h-0">
                      <Save size={15} />
                      Save changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                      className="min-h-11 sm:min-h-0"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {profileFields.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-inset ring-gray-100">
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {label}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 md:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <MapPin size={15} strokeWidth={2.25} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Saved addresses
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Manage your delivery addresses
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    street: "",
                    city: "",
                    state: "",
                    postalCode: "",
                    country: "Bangladesh",
                    isDefault: false,
                  });
                  setIsAddressModalOpen(true);
                }}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 md:min-h-0"
              >
                <Plus size={13} />
                Add
              </button>
            </div>

            <div className="p-4 md:p-6">
              {addresses.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                    <MapPin size={22} className="text-gray-300" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-500">
                    No saved addresses
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Add your first delivery address to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <article
                      key={address.id}
                      className={`group relative rounded-xl border p-4 transition-all ${
                        address.isDefault
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              address.isDefault
                                ? "bg-blue-100 text-blue-600"
                                : "bg-white text-gray-500 ring-1 ring-inset ring-gray-100"
                            }`}
                          >
                            <Home size={13} />
                          </span>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-gray-900">
                              {address.street}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
                              {address.city}
                              {address.state ? `, ${address.state}` : ""}
                              {address.postalCode
                                ? ` ${address.postalCode}`
                                : ""}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-gray-400">
                              {address.country}
                            </p>
                          </div>
                        </div>

                        {address.isDefault && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200/60">
                            <Star size={9} className="fill-current" />
                            Default
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                        <button
                          onClick={() => {
                            setEditingAddress(address);
                            setAddressForm({
                              street: address.street,
                              city: address.city,
                              state: address.state,
                              postalCode: address.postalCode,
                              country: address.country,
                              isDefault: address.isDefault,
                            });
                            setIsAddressModalOpen(true);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 transition-all hover:bg-blue-100 md:h-7 md:w-7"
                          title="Edit address"
                        >
                          <Edit size={13} />
                        </button>

                        {!address.isDefault && (
                          <>
                            <button
                              onClick={() =>
                                handleSetDefaultAddress(address.id)
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 transition-all hover:bg-amber-100 md:h-7 md:w-7"
                              title="Set as default"
                            >
                              <Star size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 transition-all hover:bg-rose-100 md:h-7 md:w-7"
                              title="Delete address"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Sidebar ─────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 md:space-y-6">
          {/* Security */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-4 md:px-6">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Shield size={15} strokeWidth={2.25} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Security
                </h3>
                <p className="text-[11px] text-gray-500">
                  Protect your account
                </p>
              </div>
            </div>

            <div className="space-y-1 p-3">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <Lock size={15} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Change password
                  </span>
                </div>
                <ChevronRight
                  size={15}
                  className="text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>

              <button className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:bg-gray-50">
                <div className="flex items-center gap-2.5">
                  <Fingerprint size={15} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Two-factor auth
                  </span>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Soon
                </span>
              </button>
            </div>
          </div>

          {/* Sessions */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 md:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Monitor size={15} strokeWidth={2.25} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Session
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Where you&apos;re signed in
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {deviceInfo && (
                <div className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 px-3 py-3 sm:px-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-inset ring-gray-100">
                    {deviceInfo.deviceType === "Mobile" ? (
                      <Smartphone size={16} />
                    ) : deviceInfo.deviceType === "Tablet" ? (
                      <Tablet size={16} />
                    ) : (
                      <Monitor size={16} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {deviceInfo.browser}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {deviceInfo.deviceType} · {deviceInfo.os}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                    This device
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change password"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Current password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    oldPassword: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              New password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Confirm new password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              placeholder="Confirm your new password"
            />
          </div>

          {passwordData.newPassword &&
            passwordData.confirmPassword &&
            passwordData.newPassword !== passwordData.confirmPassword && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-inset ring-rose-100">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span className="text-xs font-medium text-rose-700">
                  Passwords do not match
                </span>
              </div>
            )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
              className="min-h-11 flex-1 sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              className="min-h-11 flex-1 sm:min-h-0"
            >
              Update password
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title={editingAddress ? "Edit address" : "Add new address"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Street address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={addressForm.street}
              onChange={(e) =>
                setAddressForm({ ...addressForm, street: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, city: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                State
              </label>
              <input
                type="text"
                value={addressForm.state}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, state: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Postal code
              </label>
              <input
                type="text"
                value={addressForm.postalCode}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, postalCode: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Country <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={addressForm.country}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, country: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 transition-colors hover:bg-gray-50">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) =>
                setAddressForm({ ...addressForm, isDefault: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Set as default address
            </span>
          </label>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsAddressModalOpen(false)}
              className="min-h-11 flex-1 sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAddress}
              className="min-h-11 flex-1 sm:min-h-0"
            >
              {editingAddress ? "Update address" : "Add address"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
