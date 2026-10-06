"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { api } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  deleteUser,
  fetchUsers,
  promoteUserToTSR,
} from "@/store/slices/userSlice";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users as UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { users, loading, pagination, promotionLoadingIds } = useAppSelector(
    (state) => state.users,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCustomerTotal, setActiveCustomerTotal] = useState<number | null>(
    null,
  );
  const [countRefresh, setCountRefresh] = useState(0);

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    let isCurrent = true;

    const countActiveCustomers = async () => {
      try {
        const pageSize = 100;
        const firstPage = await api.getUsers(1, pageSize);
        let activeCount = firstPage.users.filter(
          (user) => user.isApproved && user.role === "customer",
        ).length;

        for (
          let firstPageNumber = 2;
          firstPageNumber <= firstPage.pagination.pages;
          firstPageNumber += 5
        ) {
          const pageNumbers = Array.from(
            {
              length: Math.min(
                5,
                firstPage.pagination.pages - firstPageNumber + 1,
              ),
            },
            (_, index) => firstPageNumber + index,
          );
          const pages = await Promise.all(
            pageNumbers.map((page) => api.getUsers(page, pageSize)),
          );
          activeCount += pages.reduce(
            (total, page) =>
              total +
              page.users.filter(
                (user) => user.isApproved && user.role === "customer",
              ).length,
            0,
          );
        }

        if (isCurrent) setActiveCustomerTotal(activeCount);
      } catch (error) {
        console.error("Failed to load total active customers:", error);
        if (isCurrent) setActiveCustomerTotal(null);
        if (isCurrent) {
          toast.error("Unable to load the total active customer count.");
        }
      }
    };

    void countActiveCustomers();
    return () => {
      isCurrent = false;
    };
  }, [countRefresh]);

  const handlePageChange = (newPage: number) => {
    dispatch(fetchUsers({ page: newPage, limit: pagination.limit }));
  };

  const handlePromote = async (userId: string) => {
    try {
      await dispatch(promoteUserToTSR(userId)).unwrap();
      toast.success("User promoted to TSR");
      setCountRefresh((count) => count + 1);
      window.dispatchEvent(new Event("usersUpdated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to promote user to TSR",
      );
    }
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    try {
      await dispatch(deleteUser(userToDelete.id)).unwrap();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setCountRefresh((count) => count + 1);
    } catch (error: any) {
    } finally {
      setDeletingId(null);
    }
  };

  const activeUsers = users.filter((user) => {
    const isActive = user.isApproved && user.role === "customer";
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm);
    return isActive && matchesSearch;
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Loading users…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Active Users Table ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck size={15} strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Active customers
              </h2>
              <p className="text-[11px] text-gray-500">
                {activeCustomerTotal === null
                  ? "Total users unavailable"
                  : `${activeCustomerTotal} ${
                      activeCustomerTotal === 1 ? "user" : "users"
                    }`}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by name, email, or phone…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-50"
              />
            </div>
            <button
              onClick={() => {
                dispatch(
                  fetchUsers({
                    page: pagination.page,
                    limit: pagination.limit,
                  }),
                );
                setCountRefresh((count) => count + 1);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {activeUsers.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <UsersIcon size={22} className="text-gray-300" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">
              No active customers found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchTerm
                ? "Try adjusting your search"
                : "Approved users will appear here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-bold uppercase text-white">
                          {user.name?.charAt(0) || "U"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user.name || "N/A"}
                          </p>
                          {user.pharmacy_name && (
                            <p className="truncate text-xs text-gray-500">
                              {user.pharmacy_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        <Mail size={13} className="shrink-0 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium tabular-nums text-gray-600">
                        <Phone size={13} className="shrink-0 text-gray-400" />
                        <span className="truncate">{user.phone_number}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium tabular-nums text-gray-500">
                        <Calendar
                          size={13}
                          className="shrink-0 text-gray-400"
                        />
                        <span>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                        <CheckCircle size={11} />
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === "customer" && (
                          <button
                            onClick={() => handlePromote(user.id)}
                            disabled={promotionLoadingIds.includes(user.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100 transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Promote customer to TSR"
                          >
                            {promotionLoadingIds.includes(user.id) ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <ArrowUpRight size={13} />
                            )}
                            Promote to TSR
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 transition-all hover:bg-rose-100"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ────────────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs font-medium tabular-nums text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {pagination.total}
                </span>{" "}
                users
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.pages ||
                      Math.abs(p - pagination.page) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                      acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-xs font-medium text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p as number)}
                        disabled={loading}
                        className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold tabular-nums transition-all ${
                          pagination.page === p
                            ? "bg-emerald-500 text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation Modal ───────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle size={18} className="text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete{" "}
                <strong className="font-semibold text-gray-900">
                  “{userToDelete?.name || userToDelete?.email}”
                </strong>
                ?
              </p>
              <p className="mt-1 text-xs font-medium text-rose-600">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              loading={deletingId === userToDelete?.id}
              className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
