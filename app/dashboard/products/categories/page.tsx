"use client";

import Button from "@/components/ui/Button";
import Loading from "@/components/ui/loading";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Table from "@/components/ui/Table";
import { api } from "@/config/api";
import type { Category } from "@/config/api";
import { getApiErrorMessage } from "@/config/api/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/store/slices/categorySlice";
import {
  AlertCircle,
  Edit,
  Feather,
  Folder,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, loading } = useAppSelector((state) => state.categories);

  const [categoryCounts, setCategoryCounts] = useState<
    Record<string, number | null>
  >({});
  const [countsLoading, setCountsLoading] = useState(false);
  const isCountsLoading = categories.length > 0 && countsLoading;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (categories.length === 0) return;

    const controller = new AbortController();
    const fetchCounts = async () => {
      setCountsLoading(true);
      const results = await Promise.allSettled(
        categories.map((category) =>
          api.getAllProducts(1, 1, undefined, category.id, controller.signal),
        ),
      );
      if (controller.signal.aborted) return;

      const counts: Record<string, number | null> = {};
      results.forEach((result, index) => {
        const category = categories[index];
        if (result.status === "fulfilled") {
          counts[category.id] = result.value.pagination.total;
        } else {
          counts[category.id] = null;
          toast.error(
            getApiErrorMessage(
              result.reason,
              `Failed to load ${category.name} product count`,
            ),
          );
        }
      });
      setCategoryCounts(counts);
      setCountsLoading(false);
    };

    void fetchCounts();
    return () => controller.abort();
  }, [categories]);

  const getProductCount = (categoryId: string) =>
    categoryCounts[categoryId];

  const handleRefresh = () => {
    dispatch(fetchCategories());
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDesc("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDesc(category.description || "");
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      if (editingCategory) {
        await dispatch(
          updateCategory({
            id: editingCategory.id,
            name: categoryName,
            description: categoryDesc,
          }),
        ).unwrap();
      } else {
        await dispatch(
          createCategory({ name: categoryName, description: categoryDesc }),
        ).unwrap();
      }
      setIsModalOpen(false);
      setCategoryName("");
      setCategoryDesc("");
      setEditingCategory(null);
      dispatch(fetchCategories());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save category",
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    const productCount = getProductCount(deletingCategory.id);
    if (productCount === null || productCount === undefined) {
      toast.error("Product count is unavailable. Refresh categories and try again.");
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      return;
    }
    if (productCount > 0) {
      toast.error(
        `Cannot delete category with ${productCount} product(s). Please reassign or delete the products first.`,
      );
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      return;
    }
    try {
      await dispatch(deleteCategory(deletingCategory.id)).unwrap();
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      dispatch(fetchCategories());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      );
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const countsComplete = categories.every(
    (category) => typeof categoryCounts[category.id] === "number",
  );
  const totalProducts = categories.reduce(
    (total, category) => total + (categoryCounts[category.id] ?? 0),
    0,
  );
  const categoriesWithProducts = categories.filter(
    (category) => (categoryCounts[category.id] ?? 0) > 0,
  ).length;
  const emptyCategories = categories.length - categoriesWithProducts;
  const canShowProductCounts = !isCountsLoading && countsComplete;
  const deletingProductCount = deletingCategory
    ? getProductCount(deletingCategory.id)
    : null;

  if (loading && categories.length === 0) {
    return <Loading message="Loading categories..." />;
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-8">
      {/* Stats – compact on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {[
          {
            label: "Total Categories",
            value: categories.length,
            icon: Folder,
            gradient: "from-blue-500 to-indigo-600",
            color: "text-blue-600",
          },
          {
            label: "Total Products",
            value: isCountsLoading
              ? "..."
              : countsComplete
                ? totalProducts
                : "Unavailable",
            icon: Package,
            gradient: "from-emerald-500 to-teal-600",
            color: "text-emerald-600",
          },
          {
            label: "With Products",
            value: isCountsLoading
              ? "..."
              : countsComplete
                ? categoriesWithProducts
                : "Unavailable",
            icon: Layers,
            gradient: "from-purple-500 to-pink-600",
            color: "text-purple-600",
          },
          {
            label: "Empty",
            value: isCountsLoading
              ? "..."
              : countsComplete
                ? emptyCategories
                : "Unavailable",
            icon: AlertCircle,
            gradient: "from-amber-500 to-orange-600",
            color: "text-amber-600",
          },
        ].map(({ label, value, icon: Icon, gradient, color }) => (
          <div
            key={label}
            className="group relative min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white p-3 transition-all duration-300 md:rounded-2xl md:p-6"
          >
            <div className="relative flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500 md:text-sm">
                  {label}
                </p>
                <p
                  className={`mt-0.5 text-xl font-bold md:mt-1 md:text-3xl ${color}`}
                >
                  {value}
                </p>
              </div>
              <div
                className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 sm:flex ${gradient}`}
              >
                <Icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and actions – compact on mobile */}
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-4">
        <SearchInput
          label="Search categories"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          containerClassName="relative min-w-0 flex-1"
          inputClassName="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:pl-12 md:pr-10 md:py-3 md:rounded-xl"
        />
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <button
            onClick={handleRefresh}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-gray-200 sm:min-h-11 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Button
            onClick={handleOpenCreateModal}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs sm:min-h-11 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
          >
            <Plus size={14} />
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white md:rounded-2xl">
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-1.5">
              <Folder size={14} className="text-blue-600 md:size-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 md:text-lg">
              Categories
            </h2>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 md:px-2.5 md:text-xs">
              {filteredCategories.length}
            </span>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 md:mb-4 md:h-20 md:w-20">
              <Folder size={28} className="text-gray-400 md:size-8" />
            </div>
            <p className="text-sm font-medium text-gray-500 md:text-base">
              {searchTerm
                ? "No categories match your search"
                : "No categories found"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 md:mt-4 md:text-sm"
              >
                Create your first category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table – unchanged */}
            <Table view="desktop">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((category, index) => {
                    const productCount = getProductCount(category.id);
                    return (
                      <tr
                        key={category.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                      >
                        <td className="py-3 px-6 text-sm text-gray-500">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <Feather size={14} className="text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          {category.description ? (
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {category.description}
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              No description
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6">
                          {isCountsLoading ? (
                            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                          ) : (
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${productCount == null ? "bg-amber-50 text-amber-700" : productCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}
                            >
                              {productCount ?? "Unavailable"}
                              {productCount === 1
                                ? " product"
                                : productCount == null
                                  ? ""
                                  : " products"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(category)}
                              aria-label={`Edit ${category.name}`}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-200 rounded-lg transition-all duration-200"
                              title="Edit category"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(category)}
                              disabled={!canShowProductCounts}
                              aria-label={`Delete ${category.name}`}
                              className="p-2 text-red-600 bg-red-50 hover:bg-red-200 rounded-lg transition-all duration-200"
                              title="Delete category"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Table>

            {/* Mobile list – redesigned */}
            <Table view="mobile">
              <ul className="divide-y divide-gray-100">
                {paginatedCategories.map((category) => {
                  const productCount = getProductCount(category.id);

                  return (
                    <li
                      key={category.id}
                      className="min-w-0 px-3 py-3 active:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                          <Feather size={17} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {category.name}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-gray-500">
                            {category.description || (
                              <span className="italic text-gray-400">
                                No description
                              </span>
                            )}
                          </p>
                        </div>
                        {isCountsLoading ? (
                          <div className="h-6 w-14 shrink-0 animate-pulse rounded-full bg-gray-200" />
                        ) : (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              productCount == null
                                ? "bg-amber-50 text-amber-700"
                                : productCount > 0
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {productCount ?? "Unavailable"}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-gray-50 pt-2.5">
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          Actions
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(category)}
                            aria-label={`Edit ${category.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors active:scale-95"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(category)}
                            disabled={!canShowProductCounts}
                            aria-label={`Delete ${category.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors active:scale-95"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Table>
          </>
        )}

        <Pagination
          pagination={{
            page: currentPage,
            limit: itemsPerPage,
            total: filteredCategories.length,
            pages: totalPages,
          }}
          currentPage={currentPage}
          loading={loading}
          recordLabel="categories"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Electronics, Clothing, Books"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={categoryDesc}
              onChange={(e) => setCategoryDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Brief description of the category"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Category"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete{" "}
                <strong className="text-gray-900">
                  &quot;{deletingCategory?.name}&quot;
                </strong>
                ?
              </p>
              {deletingProductCount == null ? (
                <p className="mt-2 text-xs text-amber-700">
                  Product count is unavailable. Refresh categories before
                  deleting this category.
                </p>
              ) : deletingProductCount > 0 ? (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ This category has {deletingProductCount}{" "}
                  product(s). Reassign or delete them first.
                </p>
              ) : (
                <p className="text-xs text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              disabled={
                deletingProductCount == null || deletingProductCount > 0
              }
            >
              Delete Category
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
