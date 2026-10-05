"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { User } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteUser, fetchUsers } from "@/store/slices/userSlice";
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

const TSR = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.users);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userForLocation, setUserForLocation] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsers({ role: "TSR", limit: PAGE_SIZE })).finally(() => {
      setHasLoaded(true);
    });
  }, [dispatch]);

  const tsrUsers = users.filter((user) => user.role === "TSR");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchingUsers = tsrUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.phone_number.toLowerCase().includes(normalizedSearch) ||
      user.pharmacy_name?.toLowerCase().includes(normalizedSearch),
  );
  const totalPages = Math.ceil(matchingUsers.length / PAGE_SIZE);
  const page = Math.min(currentPage, Math.max(totalPages, 1));
  const pageUsers = matchingUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, Math.max(totalPages, 1)));
  }, [totalPages]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchUsers({ role: "TSR", limit: PAGE_SIZE }));
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete.id);
    try {
      await dispatch(deleteUser(userToDelete.id)).unwrap();
      setUserToDelete(null);
    } catch {
      // The user slice reports deletion errors through its existing toast.
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-white border border-gray-100">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UsersIcon size={15} strokeWidth={2.25} />
            </span>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">TSR List</h1>
              <p className="text-[11px] text-gray-500">
                {tsrUsers.length} {tsrUsers.length === 1 ? "TSR" : "TSRs"}
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
                type="search"
                aria-label="Search TSR users"
                placeholder="Search by name, email, or phone…"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-50"
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="border-b border-rose-100 bg-rose-50 px-6 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {!hasLoaded || (loading && users.length === 0) ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500">
              Loading TSR users…
            </p>
          </div>
        ) : pageUsers.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <UsersIcon size={22} className="text-gray-300" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">
              {normalizedSearch
                ? "No TSR users match your search."
                : "No TSR users found."}
            </p>
            {normalizedSearch && (
              <p className="mt-1 text-xs text-gray-400">
                Try adjusting your search.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Approval status</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageUsers.map((user) => (
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
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                        TSR
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                          user.isApproved
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                            : "bg-amber-50 text-amber-700 ring-amber-200/60"
                        }`}
                      >
                        {user.isApproved && <CheckCircle size={11} />}
                        {user.isApproved ? "Approved" : "Pending"}
                      </span>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setUserForLocation(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 transition-all hover:bg-emerald-100"
                          title="View location"
                          aria-label={`View location for ${user.name || user.email}`}
                        >
                          <MapPin size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 transition-all hover:bg-rose-100"
                          title="Delete user"
                          aria-label={`Delete ${user.name || user.email}`}
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

        {pageUsers.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs font-medium tabular-nums text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, matchingUsers.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {matchingUsers.length}
                </span>{" "}
                TSR users
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((value) => value - 1)}
                    disabled={page <= 1 || loading}
                    aria-label="Previous page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      (number) =>
                        number === 1 ||
                        number === totalPages ||
                        Math.abs(number - page) <= 1,
                    )
                    .reduce<(number | "...")[]>(
                      (result, number, index, pages) => {
                        if (
                          index > 0 &&
                          number - (pages[index - 1] as number) > 1
                        ) {
                          result.push("...");
                        }
                        result.push(number);
                        return result;
                      },
                      [],
                    )
                    .map((number, index) =>
                      number === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1 text-xs font-medium text-gray-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={number}
                          type="button"
                          onClick={() => setCurrentPage(number)}
                          disabled={loading}
                          aria-current={page === number ? "page" : undefined}
                          className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold tabular-nums transition-all ${
                            page === number
                              ? "bg-emerald-500 text-white shadow-[0_1px_2px_rgba(16,185,129,0.35)]"
                              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {number}
                        </button>
                      ),
                    )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((value) => value + 1)}
                    disabled={page >= totalPages || loading}
                    aria-label="Next page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete{" "}
              <strong className="font-semibold text-gray-900">
                {userToDelete?.name || userToDelete?.email}
              </strong>
              ?
            </p>
            <p className="mt-1 text-xs font-medium text-rose-600">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => setUserToDelete(null)}
              disabled={deletingId !== null}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deletingId === userToDelete?.id}
              className="flex-1"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={userForLocation !== null}
        onClose={() => setUserForLocation(null)}
        title={`${userForLocation?.name || "User"} location`}
      >
        {userForLocation && (
          <div className="space-y-5">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Full address
              </h4>
              <p className="mt-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                {userForLocation.fullAddress || "N/A"}
              </p>
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  {
                    label: "Division",
                    area: userForLocation.division,
                    id: userForLocation.divisionId,
                  },
                  {
                    label: "District",
                    area: userForLocation.district,
                    id: userForLocation.districtId,
                  },
                  {
                    label: "Upazila",
                    area: userForLocation.upazila,
                    id: userForLocation.upazilaId,
                  },
                ] as const
              ).map(({ label, area, id }) => (
                <section
                  key={label}
                  className="min-w-0 rounded-xl border border-gray-100 p-4"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {label}
                  </h4>
                  <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                    {area?.name || "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {area?.bnName || "N/A"}
                  </p>
                  <dl className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-xs">
                    <div>
                      <dt className="text-gray-400">Code</dt>
                      <dd className="mt-0.5 break-all font-medium text-gray-700">
                        {area?.code || "N/A"}
                      </dd>
                    </div>
                    <div></div>
                  </dl>
                </section>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TSR;
