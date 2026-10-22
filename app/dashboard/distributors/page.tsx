"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { api, type Distributor, type LocationArea } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createDistributor,
  deleteDistributor,
  fetchDistributors,
  updateDistributor,
} from "@/store/slices/distributorSlice";
import {
  AlertTriangle,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type DistributorRecord = Distributor;

const emptyForm = {
  name: "",
  fullAddress: "",
  divisionId: "",
  districtId: "",
  upazilaId: "",
};

function formatAddress(distributor: Distributor): string {
  return [
    distributor.fullAddress,
    distributor.upazila?.name,
    distributor.district?.name,
    distributor.division?.name,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function DistributorsPage() {
  const dispatch = useAppDispatch();
  const { distributors, loading } = useAppSelector(
    (state) => state.distributors,
  );

  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {},
  );
  const [productCountsLoading, setProductCountsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] =
    useState<DistributorRecord | null>(null);
  const [deletingDistributor, setDeletingDistributor] =
    useState<DistributorRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [divisions, setDivisions] = useState<LocationArea[]>([]);
  const [districts, setDistricts] = useState<LocationArea[]>([]);
  const [upazilas, setUpazilas] = useState<LocationArea[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    api
      .getDivisions()
      .then(setDivisions)
      .catch(() => toast.error("Failed to load divisions"));
  }, []);

  useEffect(() => {
    if (!form.divisionId) {
      setDistricts([]);
      return;
    }
    let active = true;
    api
      .getDistricts(form.divisionId)
      .then((data) => active && setDistricts(data))
      .catch(() => toast.error("Failed to load districts"));
    return () => {
      active = false;
    };
  }, [form.divisionId]);

  useEffect(() => {
    if (!form.districtId) {
      setUpazilas([]);
      return;
    }
    let active = true;
    api
      .getUpazilas(form.districtId)
      .then((data) => active && setUpazilas(data))
      .catch(() => toast.error("Failed to load upazilas"));
    return () => {
      active = false;
    };
  }, [form.districtId]);

  useEffect(() => {
    dispatch(fetchDistributors());
  }, [dispatch]);

  useEffect(() => {
    if (loading) {
      setProductCountsLoading(true);
      return;
    }

    if (distributors.length === 0) {
      setProductCounts({});
      setProductCountsLoading(false);
      return;
    }

    let active = true;
    setProductCounts({});
    setProductCountsLoading(true);

    const loadProductCounts = async () => {
      const results = await Promise.allSettled(
        distributors.map(async (distributor) => ({
          distributorId: distributor.id,
          distributorName: distributor.name,
          count: (await api.getDistributorProductsPage(distributor.id, 1, 1))
            .pagination.total,
        })),
      );

      if (!active) return;

      const counts: Record<string, number> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          counts[result.value.distributorId] = result.value.count;
        } else {
          toast.error(
            result.reason instanceof Error
              ? result.reason.message
              : "Failed to load distributor product count",
          );
        }
      });

      setProductCounts(counts);
      setProductCountsLoading(false);
    };

    void loadProductCounts();

    return () => {
      active = false;
    };
  }, [distributors, loading]);

  const filteredDistributors = distributors.filter((distributor) =>
    `${distributor.name} ${formatAddress(distributor)}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredDistributors.length / itemsPerPage),
    );
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredDistributors.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDistributors.length / itemsPerPage),
  );
  const paginatedDistributors = filteredDistributors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleOpenCreateModal = () => {
    setEditingDistributor(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (distributor: DistributorRecord) => {
    setEditingDistributor(distributor);
    setForm({
      name: distributor.name,
      fullAddress: distributor.fullAddress ?? "",
      divisionId: distributor.divisionId ?? "",
      districtId: distributor.districtId ?? "",
      upazilaId: distributor.upazilaId ?? "",
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (distributor: DistributorRecord) => {
    setDeletingDistributor(distributor);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    const details = {
      fullAddress: form.fullAddress.trim() || null,
      divisionId: form.divisionId.trim() || null,
      districtId: form.districtId.trim() || null,
      upazilaId: form.upazilaId.trim() || null,
    };

    if (!trimmedName) {
      toast.error("Distributor name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingDistributor) {
        await dispatch(
          updateDistributor({
            id: editingDistributor.id,
            name: trimmedName,
            ...details,
          }),
        ).unwrap();
      } else {
        await dispatch(
          createDistributor({
            name: trimmedName,
            ...details,
          }),
        ).unwrap();
      }

      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingDistributor(null);
      dispatch(fetchDistributors());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save distributor",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDistributor) return;

    setIsDeleting(true);

    try {
      await dispatch(deleteDistributor(deletingDistributor.id)).unwrap();
      setIsDeleteModalOpen(false);
      setDeletingDistributor(null);
      dispatch(fetchDistributors());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete distributor",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && distributors.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">
            Loading distributors…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-3 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 md:h-8 md:w-8">
              <Store size={14} strokeWidth={2.25} className="md:size-[15px]" />
            </span>
            <h2 className="min-w-0 truncate text-sm font-semibold text-gray-900 md:text-base">
              Distributors
            </h2>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 md:px-2.5 md:text-xs">
              {filteredDistributors.length}
            </span>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 md:max-w-xl md:flex-row md:items-center">
            <label className="relative block flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                type="text"
                placeholder="Search distributor"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 md:rounded-xl md:py-2.5 md:pl-10 md:pr-4 md:focus:ring-4 md:focus:ring-blue-50"
              />
            </label>

            <div className="grid grid-cols-2 gap-2 md:contents">
              <button
                onClick={() => dispatch(fetchDistributors())}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 md:h-10 md:min-h-0 md:w-10 md:shrink-0 md:rounded-xl md:px-0"
                title="Refresh"
                aria-label="Refresh distributors"
                type="button"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="md:hidden">Refresh</span>
              </button>
              <Button
                onClick={handleOpenCreateModal}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs md:h-10 md:min-h-0 md:w-10 md:rounded-xl md:px-0"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span className="md:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {filteredDistributors.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[280px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Truck size={22} className="text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500 md:mt-4">
              No distributors found
            </p>
            <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Add your first distributor to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table – unchanged */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3">Distributor name</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3 text-right">Products</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedDistributors.map((distributor) => (
                    <tr
                      key={distributor.id}
                      className="group transition-colors hover:bg-gray-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold uppercase text-blue-600 ring-1 ring-inset ring-blue-100">
                            {distributor.name?.charAt(0) || "D"}
                          </span>
                          <span className="truncate text-sm font-semibold text-gray-900">
                            {distributor.name}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-xs px-6 py-4 text-sm text-gray-600">
                        {formatAddress(distributor) || "—"}
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums">
                        {productCountsLoading
                          ? "…"
                          : (productCounts[distributor.id] ?? "—")}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/distributors/${distributor.id}`}
                            className="group/link flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 transition-all hover:bg-emerald-100"
                          >
                            <Eye size={18} />
                          </Link>

                          <button
                            onClick={() => handleOpenEditModal(distributor)}
                            aria-label={`Edit ${distributor.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 transition-all hover:bg-blue-100"
                            title="Edit distributor"
                            type="button"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenDeleteModal(distributor)}
                            aria-label={`Delete ${distributor.name}`}
                            disabled={
                              isDeleting &&
                              deletingDistributor?.id === distributor.id
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete distributor"
                            type="button"
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
              {paginatedDistributors.map((distributor) => (
                <li
                  key={distributor.id}
                  className="min-w-0 px-3 py-3 active:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold uppercase text-blue-600">
                      {distributor.name?.charAt(0) || "D"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {distributor.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {formatAddress(distributor) || "No address"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gray-600">
                      {productCountsLoading
                        ? "…"
                        : (productCounts[distributor.id] ?? "—")}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-gray-50 pt-2.5">
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      Actions
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/distributors/${distributor.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors active:scale-95"
                        aria-label={`View ${distributor.name}`}
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(distributor)}
                        aria-label={`Edit ${distributor.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors active:scale-95"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(distributor)}
                        disabled={
                          isDeleting &&
                          deletingDistributor?.id === distributor.id
                        }
                        aria-label={`Delete ${distributor.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
        {filteredDistributors.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-3 py-3 sm:px-6 sm:py-4">
            <p className="text-[11px] font-medium tabular-nums text-gray-500 sm:text-xs">
              <span className="hidden sm:inline">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredDistributors.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {filteredDistributors.length}
                </span>{" "}
                distributors
              </span>
              <span className="sm:hidden">
                {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredDistributors.length,
                )}{" "}
                of {filteredDistributors.length}
              </span>
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((previous) => Math.max(1, previous - 1))
                }
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:px-3 md:h-8"
              >
                Previous
              </button>

              <span className="min-w-[60px] text-center text-xs font-medium tabular-nums text-gray-500 sm:min-w-20">
                {currentPage}/{totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((previous) =>
                    Math.min(totalPages, previous + 1),
                  )
                }
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:px-3 md:h-8"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsModalOpen(false);
            setEditingDistributor(null);
            setForm(emptyForm);
          }
        }}
        title={editingDistributor ? "Edit distributor" : "Add distributor"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Distributor name
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="e.g. Seba Drug House"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Full address
            </label>
            <input
              value={form.fullAddress}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  fullAddress: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="House, road, area"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Division
            </label>
            <select
              value={form.divisionId}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  divisionId: event.target.value,
                  districtId: "",
                  upazilaId: "",
                }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting}
            >
              <option value="">Select division</option>
              {divisions.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              District
            </label>
            <select
              value={form.districtId}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  districtId: event.target.value,
                  upazilaId: "",
                }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting || !form.divisionId}
            >
              <option value="">Select district</option>
              {districts.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Upazila
            </label>
            <select
              value={form.upazilaId}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  upazilaId: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting || !form.districtId}
            >
              <option value="">Select upazila</option>
              {upazilas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                if (!isSubmitting) {
                  setIsModalOpen(false);
                  setEditingDistributor(null);
                  setForm(emptyForm);
                }
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              {editingDistributor ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setDeletingDistributor(null);
          }
        }}
        title="Delete distributor"
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
                  “{deletingDistributor?.name}”
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
              onClick={() => {
                if (!isDeleting) {
                  setIsDeleteModalOpen(false);
                  setDeletingDistributor(null);
                }
              }}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              loading={isDeleting}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
