"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { User, UserRole } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteUser, fetchUsers } from "@/store/slices/userSlice";
import {
  Calendar,
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
import { useDebouncedValue } from "@/components/utils/useDebouncedValue";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;
const TSR_PAGE_ROLES: UserRole[] = ["TSR", "admin"];

const TSR = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.users);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userForLocation, setUserForLocation] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const search = useDebouncedValue(searchTerm.trim());

  useEffect(() => {
    dispatch(
      fetchUsers({
        role: TSR_PAGE_ROLES,
        limit: PAGE_SIZE,
        ...(search && { search }),
      }),
    ).finally(() => {
      setHasLoaded(true);
    });
  }, [dispatch, search]);

  const tsrUsers = users.filter((user) => TSR_PAGE_ROLES.includes(user.role));
  const matchingUsers = tsrUsers;
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
    dispatch(
      fetchUsers({
        role: TSR_PAGE_ROLES,
        limit: PAGE_SIZE,
        ...(search && { search }),
      }),
    );
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
    <div className="space-y-4 md:space-y-6">
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 md:h-8 md:w-8">
                <UsersIcon
                  size={14}
                  strokeWidth={2.25}
                  className="md:size-[15px]"
                />
              </span>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-900 md:text-base">
                  TSR &amp; Admin
                </h1>
                <p className="text-[11px] text-gray-500 md:text-xs">
                  {tsrUsers.length} {tsrUsers.length === 1 ? "user" : "users"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
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
                type="search"
                aria-label="Search TSR and admin users"
                placeholder="Search by email or phone…"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:rounded-xl md:py-2.5 md:pl-10 md:pr-4 md:focus:ring-4 md:focus:ring-emerald-50"
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="hidden items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="border-b border-rose-100 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 md:px-6 md:py-3 md:text-sm"
          >
            {error}
          </div>
        )}

        {!hasLoaded || (loading && users.length === 0) ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[280px]">
            <div className="mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent md:mb-4 md:h-10 md:w-10" />
            <p className="text-xs font-medium text-gray-500 md:text-sm">
              Loading users…
            </p>
          </div>
        ) : pageUsers.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[280px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <UsersIcon size={22} className="text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500 md:mt-4">
              {searchTerm.trim()
                ? "No users match your search."
                : "No TSR or admin users found."}
            </p>
            {searchTerm.trim() && (
              <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
                Try adjusting your search.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table – unchanged */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Role</th>
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
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            user.role === "admin"
                              ? "bg-purple-50 text-purple-700 ring-purple-100"
                              : "bg-blue-50 text-blue-700 ring-blue-100"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "TSR"}
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

            {/* Mobile list – redesigned */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {pageUsers.map((user) => (
                <li
                  key={user.id}
                  className="min-w-0 px-3 py-3 active:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold uppercase text-white">
                      {user.name?.charAt(0) || "U"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {user.name || "N/A"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {user.email}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] tabular-nums text-gray-400">
                          <Phone size={10} className="shrink-0" />
                          {user.phone_number}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] tabular-nums text-gray-400">
                          <Calendar size={10} className="shrink-0" />
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "TSR"}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-gray-50 pt-2.5">
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      Actions
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUserForLocation(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors active:scale-95"
                        title="View location"
                        aria-label={`View location for ${user.name || user.email}`}
                      >
                        <MapPin size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors active:scale-95"
                        title="Delete user"
                        aria-label={`Delete ${user.name || user.email}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Pagination – compact on mobile */}
        {pageUsers.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium tabular-nums text-gray-500 sm:text-xs">
                <span className="hidden sm:inline">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, matchingUsers.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {matchingUsers.length}
                  </span>{" "}
                  users
                </span>
                <span className="sm:hidden">
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, matchingUsers.length)} of{" "}
                  {matchingUsers.length}
                </span>
              </p>
              {totalPages > 1 && (
                <div className="flex max-w-full items-center gap-1 overflow-x-auto sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((value) => value - 1)}
                    disabled={page <= 1 || loading}
                    aria-label="Previous page"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
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
                          className="shrink-0 px-1 text-xs font-medium text-gray-400"
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
                          className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums transition-all md:h-8 md:min-w-8 ${
                            page === number
                              ? "bg-emerald-500 text-white"
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
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
