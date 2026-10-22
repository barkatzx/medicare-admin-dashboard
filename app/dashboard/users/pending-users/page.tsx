"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { api } from "@/config/api";
import type { User } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  approveUser,
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
  Clock,
  Phone,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useDebouncedValue } from "@/components/utils/useDebouncedValue";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PendingUsersPage() {
  const dispatch = useAppDispatch();
  const { users, loading, pagination, promotionLoadingIds } = useAppSelector(
    (state) => state.users,
  );
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingUsersTotal, setPendingUsersTotal] = useState<number | null>(
    null,
  );
  const [countRefresh, setCountRefresh] = useState(0);

  const [hasLoaded, setHasLoaded] = useState(false);
  const search = useDebouncedValue(searchTerm.trim());

  const buildQuery = (page: number, limit: number) => ({
    page,
    limit,
    role: "customer" as const,
    isApproved: false,
    ...(search && { search }),
  });

  useEffect(() => {
    dispatch(fetchUsers(buildQuery(1, 20))).finally(() => setHasLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, search]);

  useEffect(() => {
    let isCurrent = true;

    const countPendingUsers = async () => {
      try {
        const pageSize = 100;
        const firstPage = await api.getUsers(1, pageSize);
        let pendingCount = firstPage.users.filter(
          (user) => !user.isApproved && user.role === "customer",
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
          pendingCount += pages.reduce(
            (total, page) =>
              total +
              page.users.filter(
                (user) => !user.isApproved && user.role === "customer",
              ).length,
            0,
          );
        }

        if (isCurrent) setPendingUsersTotal(pendingCount);
      } catch (error) {
        console.error("Failed to load total pending users:", error);
        if (isCurrent) {
          setPendingUsersTotal(null);
        }
      }
    };

    void countPendingUsers();
    return () => {
      isCurrent = false;
    };
  }, [countRefresh]);

  const handlePageChange = (newPage: number) => {
    dispatch(fetchUsers(buildQuery(newPage, pagination.limit)));
  };

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    await dispatch(approveUser(userId));
    setCountRefresh((count) => count + 1);
    setApprovingId(null);
    window.dispatchEvent(new Event("usersUpdated"));
  };

  const handlePromote = async (userId: string) => {
    try {
      await dispatch(promoteUserToTSR(userId)).unwrap();
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
      window.dispatchEvent(new Event("usersUpdated"));
    } catch (error: any) {
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(
    (user) => !user.isApproved && user.role === "customer",
  );

  const handleRefresh = () => {
    dispatch(fetchUsers(buildQuery(pagination.page, pagination.limit)));
    setCountRefresh((count) => count + 1);
  };

  const renderUserActions = (user: User) => (
    <div className="flex items-center justify-end gap-2">
      {user.role === "customer" && (
        <button
          onClick={() => handlePromote(user.id)}
          disabled={promotionLoadingIds.includes(user.id)}
          aria-label={`Promote ${user.name || "user"} to TSR`}
          className="inline-flex h-10 items-center gap-1 rounded-lg bg-blue-50 px-3 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100 transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:px-2.5"
          title="Promote customer to TSR"
        >
          {promotionLoadingIds.includes(user.id) ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <ArrowUpRight size={13} />
          )}
        </button>
      )}
      <button
        onClick={() => handleApprove(user.id)}
        disabled={approvingId === user.id}
        aria-label={`Approve ${user.name || "user"}`}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 transition-all hover:bg-emerald-100 disabled:opacity-50 md:h-8 md:w-8"
        title="Approve user"
      >
        {approvingId === user.id ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <CheckCircle size={14} />
        )}
      </button>
      <button
        onClick={() => handleDeleteClick(user)}
        aria-label={`Delete ${user.name || "user"}`}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 transition-all hover:bg-rose-100 md:h-8 md:w-8"
        title="Delete user"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  // Mobile action buttons (compact, icon-only)
  const renderMobileUserActions = (user: User) => (
    <div className="flex items-center justify-end gap-1.5">
      {user.role === "customer" && (
        <button
          onClick={() => handlePromote(user.id)}
          disabled={promotionLoadingIds.includes(user.id)}
          aria-label={`Promote ${user.name || "user"} to TSR`}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {promotionLoadingIds.includes(user.id) ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <ArrowUpRight size={14} />
          )}
        </button>
      )}
      <button
        onClick={() => handleApprove(user.id)}
        disabled={approvingId === user.id}
        aria-label={`Approve ${user.name || "user"}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors active:scale-95 disabled:opacity-50"
      >
        {approvingId === user.id ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <CheckCircle size={14} />
        )}
      </button>
      <button
        onClick={() => handleDeleteClick(user)}
        aria-label={`Delete ${user.name || "user"}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors active:scale-95"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  if (loading && users.length === 0 && !hasLoaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-[3px] border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">
            Loading pending users…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ─── Pending Approvals Table ─────────────────────────────── */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 md:h-8 md:w-8">
                <Clock
                  size={14}
                  strokeWidth={2.25}
                  className="md:size-[15px]"
                />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                  Pending approvals
                </h2>
                <p className="text-[11px] text-gray-500 md:text-xs">
                  {pendingUsersTotal === null
                    ? "Total unavailable"
                    : `${pendingUsersTotal} ${
                        pendingUsersTotal === 1 ? "user" : "users"
                      }`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 md:hidden"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-3">
            <div className="relative w-full md:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="text"
                placeholder="Search by email or phone…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 md:rounded-xl md:py-2.5 md:pl-10 md:pr-4 md:focus:ring-4 md:focus:ring-amber-50"
              />
            </div>
            <button
              onClick={handleRefresh}
              className="hidden items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 md:inline-flex"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading && filteredUsers.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[280px]">
            <div className="mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-amber-500 border-t-transparent md:mb-4 md:h-10 md:w-10" />
            <p className="text-xs font-medium text-gray-500 md:text-sm">
              Loading users…
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[280px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Clock size={22} className="text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500 md:mt-4">
              No pending approvals
            </p>
            <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
              {searchTerm
                ? "Try adjusting your search"
                : "All user requests have been processed"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table – unchanged */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Pharmacy</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-amber-50/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold uppercase text-white">
                            {user.name?.charAt(0) || "U"}
                          </span>
                          <span className="truncate text-sm font-semibold text-gray-900">
                            {user.name || "Unnamed User"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="truncate text-xs text-gray-500">
                          {user.pharmacy_name || "N/A"}
                        </p>
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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/60">
                          <Clock size={11} />
                          Pending
                        </span>
                      </td>

                      <td className="px-6 py-4">{renderUserActions(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list – redesigned */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className="min-w-0 px-3 py-3 active:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold uppercase text-white">
                      {user.name?.charAt(0) || "U"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {user.name || "Unnamed User"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {user.pharmacy_name || "N/A"}
                        {user.phone_number ? ` · ${user.phone_number}` : ""}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Calendar
                          size={10}
                          className="shrink-0 text-gray-400"
                        />
                        <span className="text-[11px] tabular-nums text-gray-400">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                      <Clock size={10} />
                      Pending
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-gray-50 pt-2.5">
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      Actions
                    </span>
                    {renderMobileUserActions(user)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ─── Pagination – compact on mobile ──────────────────── */}
        {pagination.pages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium tabular-nums text-gray-500 sm:text-xs">
                <span className="hidden sm:inline">
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
                </span>
                <span className="sm:hidden">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total}
                </span>
              </p>

              <div className="flex max-w-full items-center gap-1 overflow-x-auto sm:gap-1.5">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
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
                        className="shrink-0 px-1 text-xs font-medium text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p as number)}
                        disabled={loading}
                        className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums transition-all md:h-8 md:min-w-8 ${
                          pagination.page === p
                            ? "bg-amber-500 text-white"
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
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
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
