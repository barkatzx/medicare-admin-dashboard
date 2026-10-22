// src/app/dashboard/products/StockManagementModal.tsx
"use client";

import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateProductStock } from "@/store/slices/productSlice";
import Button from "@/components/ui/Button";
import { RefreshCw, AlertCircle, Package, X, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface StockManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

export default function StockManagementModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StockManagementModalProps) {
  const dispatch = useAppDispatch();
  const [stockAmount, setStockAmount] = useState(1);
  const [operation, setOperation] = useState<"increment" | "decrement" | "set">(
    "increment",
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleUpdateStock = async () => {
    if (stockAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    console.log("Updating stock with:", {
      id: product.id,
      operation,
      stock: stockAmount,
    });

    setLoading(true);
    try {
      let result;
      if (operation === "set") {
        result = await dispatch(
          updateProductStock({ id: product.id, stock: stockAmount }),
        ).unwrap();
        console.log("Set stock result:", result);
      } else if (operation === "increment") {
        result = await dispatch(
          updateProductStock({
            id: product.id,
            operation: "increment",
            stock: stockAmount,
          }),
        ).unwrap();
        console.log("Increment result:", result);
      } else if (operation === "decrement") {
        if (product.stock - stockAmount < 0) {
          toast.error("Cannot decrement below 0");
          return;
        }
        result = await dispatch(
          updateProductStock({
            id: product.id,
            operation: "decrement",
            stock: stockAmount,
          }),
        ).unwrap();
        console.log("Decrement result:", result);
      }
      toast.success("Stock updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Stock update error details:", error);
      toast.error(error.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  const getNewStock = () => {
    if (operation === "increment") return product.stock + stockAmount;
    if (operation === "decrement")
      return Math.max(0, product.stock - stockAmount);
    return stockAmount;
  };

  const isLowStock = getNewStock() <= 10 && getNewStock() > 0;
  const isOutOfStock = getNewStock() === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-3 pt-4 pb-20 text-center sm:block sm:p-0 sm:px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
          &#8203;
        </span>

        {/* Modal */}
        <div className="relative inline-block w-full transform overflow-hidden rounded-xl bg-white align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:rounded-2xl sm:align-middle">
          {/* Header */}
          <div className="relative border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-lg sm:rounded-xl sm:p-2">
                  <Package size={16} className="text-white sm:size-[18px]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                    Manage Stock
                  </h3>
                  <p className="mt-0.5 truncate text-[11px] text-gray-500 sm:text-xs">
                    {product.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
            {/* Current Stock Display */}
            <div
              className={`rounded-lg p-3 transition-all duration-300 sm:rounded-xl sm:p-4 ${
                product.stock <= 10
                  ? "border border-red-200 bg-gradient-to-br from-red-50 to-rose-50"
                  : "border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 sm:text-xs">
                    Current Stock
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-bold sm:mt-1 sm:text-2xl ${
                      product.stock <= 10
                        ? "text-red-600"
                        : product.stock <= 20
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {product.stock} units
                  </p>
                </div>
                <div
                  className={`rounded-lg p-2 sm:rounded-xl sm:p-3 ${
                    product.stock <= 10
                      ? "bg-red-100"
                      : product.stock <= 20
                        ? "bg-amber-100"
                        : "bg-emerald-100"
                  }`}
                >
                  <Package
                    size={20}
                    className={`sm:size-6 ${
                      product.stock <= 10
                        ? "text-red-600"
                        : product.stock <= 20
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  />
                </div>
              </div>
              {product.stock <= 20 && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-600 sm:text-xs">
                  <AlertCircle size={11} className="sm:size-3" />
                  Low stock warning
                </div>
              )}
            </div>

            {/* Operation Type Selection */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
                Operation Type
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setOperation("increment")}
                  className={`group relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm sm:gap-2 ${
                    operation === "increment"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-200 sm:shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 sm:hover:scale-105"
                  }`}
                >
                  <Plus size={13} className="sm:size-3.5" />
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setOperation("decrement")}
                  className={`group relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm sm:gap-2 ${
                    operation === "decrement"
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm shadow-red-200 sm:shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 sm:hover:scale-105"
                  }`}
                >
                  <Minus size={13} className="sm:size-3.5" />
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setOperation("set")}
                  className={`group relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm sm:gap-2 ${
                    operation === "set"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-200 sm:shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 sm:hover:scale-105"
                  }`}
                >
                  <RefreshCw size={13} className="sm:size-3.5" />
                  Set
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
                {operation === "increment"
                  ? "Amount to Add"
                  : operation === "decrement"
                    ? "Amount to Remove"
                    : "New Stock Amount"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={stockAmount}
                  onChange={(e) =>
                    setStockAmount(parseInt(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-center text-base font-semibold transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:rounded-xl sm:px-4 sm:py-3 sm:text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 sm:text-sm">
                  units
                </div>
              </div>
            </div>

            {/* Preview New Stock */}
            <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:rounded-xl sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="rounded-md bg-white p-1 sm:rounded-lg sm:p-1.5">
                    <RefreshCw
                      size={12}
                      className="text-blue-600 sm:size-3.5"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 sm:text-sm">
                    New Stock Preview
                  </span>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold sm:text-xl ${
                      isOutOfStock
                        ? "text-red-600"
                        : isLowStock
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {getNewStock()} units
                  </p>
                  {isLowStock && !isOutOfStock && (
                    <p className="mt-0.5 text-[10px] text-amber-600 sm:text-xs">
                      ⚠️ Will be low stock
                    </p>
                  )}
                  {isOutOfStock && (
                    <p className="mt-0.5 text-[10px] text-red-600 sm:text-xs">
                      ⚠️ Will be out of stock
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Message */}
            {operation === "decrement" && stockAmount > product.stock && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 sm:rounded-xl sm:p-3">
                <AlertCircle
                  size={14}
                  className="shrink-0 text-red-500 sm:size-4"
                />
                <p className="text-[11px] text-red-600 sm:text-sm">
                  Cannot remove more than current stock ({product.stock} units)
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
            <Button
              onClick={handleUpdateStock}
              loading={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-sm shadow-sm hover:from-blue-700 hover:to-indigo-700 sm:rounded-xl sm:shadow-md"
              disabled={
                operation === "decrement" && stockAmount > product.stock
              }
            >
              {operation === "increment"
                ? "Add Stock"
                : operation === "decrement"
                  ? "Remove Stock"
                  : "Update Stock"}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-lg border-gray-200 text-sm hover:bg-gray-100 sm:rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
