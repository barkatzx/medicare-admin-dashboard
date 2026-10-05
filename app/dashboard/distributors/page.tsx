"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { api } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createDistributor,
  deleteDistributor,
  fetchDistributors,
  updateDistributor,
} from "@/store/slices/distributorSlice";
import {
  AlertTriangle,
  ArrowRight,
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

interface DistributorRecord {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [distributorName, setDistributorName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

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
          count: (await api.getDistributorProducts(distributor.id)).length,
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
    distributor.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
    setDistributorName("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (distributor: DistributorRecord) => {
    setEditingDistributor(distributor);
    setDistributorName(distributor.name);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (distributor: DistributorRecord) => {
    setDeletingDistributor(distributor);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = distributorName.trim();

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
          }),
        ).unwrap();
      } else {
        await dispatch(
          createDistributor({
            name: trimmedName,
          }),
        ).unwrap();
      }

      setIsModalOpen(false);
      setDistributorName("");
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
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white ">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Store size={15} strokeWidth={2.25} />
            </span>
            <h2 className="text-sm font-semibold text-gray-900">
              Distributors ({filteredDistributors.length})
            </h2>
          </div>

          <div className="flex w-full items-center gap-2 md:max-w-xl">
            <label className="relative block flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                type="text"
                placeholder="Search distributor"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <button
              onClick={() => dispatch(fetchDistributors())}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900"
              title="Refresh"
              type="button"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <Button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-lg"
            >
              <Plus size={15} strokeWidth={2.5} />
              Add Distributor
            </Button>
          </div>
        </div>

        {filteredDistributors.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Truck size={22} className="text-gray-300" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">
              No distributors found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Add your first distributor to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">Distributor name</th>
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

                    <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums">
                      {productCountsLoading
                        ? "…"
                        : (productCounts[distributor.id] ?? "—")}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/distributors/${distributor.id}`}
                          className="group/link inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100 transition-all hover:bg-emerald-100"
                        >
                          <Eye size={18} />
                          View products
                          <ArrowRight
                            size={12}
                            className="transition-transform duration-200 group-hover/link:translate-x-0.5"
                          />
                        </Link>

                        <button
                          onClick={() => handleOpenEditModal(distributor)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 transition-all hover:bg-blue-100"
                          title="Edit distributor"
                          type="button"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenDeleteModal(distributor)}
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
        )}

        {/* ─── Pagination ────────────────────────────────────────── */}
        {filteredDistributors.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <p className="text-xs font-medium tabular-nums text-gray-500">
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
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((previous) => Math.max(1, previous - 1))
                }
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="min-w-20 text-center text-xs font-medium tabular-nums text-gray-500">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((previous) =>
                    Math.min(totalPages, previous + 1),
                  )
                }
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
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
            setDistributorName("");
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
              value={distributorName}
              onChange={(event) => setDistributorName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
              placeholder="e.g. Seba Drug House"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                if (!isSubmitting) {
                  setIsModalOpen(false);
                  setEditingDistributor(null);
                  setDistributorName("");
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
