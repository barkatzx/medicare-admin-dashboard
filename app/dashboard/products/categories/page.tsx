"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { api } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/store/slices/categorySlice";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Feather,
  Folder,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, loading } = useAppSelector((state) => state.categories);

  // ✅ Per-category product counts fetched from API (not from paginated Redux store)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {},
  );
  const [countsLoading, setCountsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // ✅ Fetch real product counts per category once categories are loaded
  useEffect(() => {
    if (categories.length === 0) return;

    const fetchCounts = async () => {
      setCountsLoading(true);
      const counts: Record<string, number> = {};
      await Promise.all(
        categories.map(async (category) => {
          try {
            const result = await api.getAllProducts(
              1,
              1,
              undefined,
              category.id,
            );
            counts[category.id] = result.pagination.total;
          } catch {
            counts[category.id] = 0;
          }
        }),
      );
      setCategoryCounts(counts);
      setCountsLoading(false);
    };

    fetchCounts();
  }, [categories]);

  // ✅ Uses real API counts, not in-memory Redux products
  const getProductCount = (categoryId: string) =>
    categoryCounts[categoryId] ?? 0;

  const handleRefresh = () => {
    dispatch(fetchCategories()); // useEffect above will re-fetch counts when categories updates
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDesc("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDesc(category.description || "");
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (category: any) => {
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

  // ✅ Stats derived from real API counts
  const totalProducts = Object.values(categoryCounts).reduce(
    (a, b) => a + b,
    0,
  );
  const categoriesWithProducts = categories.filter(
    (c) => (categoryCounts[c.id] ?? 0) > 0,
  ).length;
  const emptyCategories = categories.length - categoriesWithProducts;

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            value: countsLoading ? "..." : totalProducts,
            icon: Package,
            gradient: "from-emerald-500 to-teal-600",
            color: "text-emerald-600",
          },
          {
            label: "Categories with Products",
            value: countsLoading ? "..." : categoriesWithProducts,
            icon: Layers,
            gradient: "from-purple-500 to-pink-600",
            color: "text-purple-600",
          },
          {
            label: "Empty Categories",
            value: countsLoading ? "..." : emptyCategories,
            icon: AlertCircle,
            gradient: "from-amber-500 to-orange-600",
            color: "text-amber-600",
          },
        ].map(({ label, value, icon: Icon, gradient, color }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 transition-all duration-300"
          >
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center transform transition-transform duration-300`}
              >
                <Icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={handleRefresh}
          className="px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2 font-medium"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        <Button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600"
        >
          <Plus size={16} className="mr-2" />
          Add Category
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Folder size={16} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Category List
            </h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full ml-2">
              {filteredCategories.length} categories
            </span>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Folder size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {searchTerm
                ? "No categories match your search"
                : "No categories found"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first category
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
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
                    {/* <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID
                    </th> */}
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
                        {/* ✅ Dedicated Products column with real count */}
                        <td className="py-3 px-6">
                          {countsLoading ? (
                            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                          ) : (
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${productCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}
                            >
                              {productCount}{" "}
                              {productCount === 1 ? "product" : "products"}
                            </span>
                          )}
                        </td>
                        {/* <td className="py-3 px-6">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {category.id.slice(-8)}
                          </code>
                        </td> */}
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(category)}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-200 rounded-lg transition-all duration-200"
                              title="Edit category"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(category)}
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
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredCategories.length,
                    )}{" "}
                    of {filteredCategories.length} entries
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2)
                            pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white border border-blue-600"
                                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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
                  "{deletingCategory?.name}"
                </strong>
                ?
              </p>
              {deletingCategory && getProductCount(deletingCategory.id) > 0 ? (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ This category has {getProductCount(deletingCategory.id)}{" "}
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
                !!(deletingCategory && getProductCount(deletingCategory.id) > 0)
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
