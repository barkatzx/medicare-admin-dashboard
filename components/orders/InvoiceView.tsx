// src/app/dashboard/orders/components/InvoiceView.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { FileText } from "lucide-react";
import type { Order, OrderItem } from "@/config/api/orders/orders.types";

interface InvoiceViewProps {
  order: Order;
}

export default function InvoiceView({ order }: InvoiceViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const invoiceNo = order.id.slice(-8).toUpperCase();
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-all duration-200 active:scale-95 hover:bg-purple-100 sm:h-8 sm:w-8 sm:bg-purple-100"
        title="View Invoice"
        aria-label="View invoice"
      >
        <FileText size={14} className="sm:size-4" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Invoice Preview"
        size="lg"
      >
        <div className="min-w-0 bg-white text-gray-900">
          {/* Header */}
          <div className="flex flex-col gap-2.5 border-b border-[#eeeeee] pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-3.5">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gray-100 p-1.5 sm:p-2">
                <img
                  src="/logo.png"
                  alt="MediCarePLC"
                  className="h-8 w-8 rounded-lg object-contain sm:h-9 sm:w-9"
                />
              </div>
              <div>
                <p className="text-[15px] font-bold leading-none tracking-tight text-blue-700 sm:text-[17px]">
                  MediCarePLC
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500 sm:mt-1 sm:text-[11px]">
                  Your Trusted B2B Sales Partner
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="mb-1 text-[16px] font-bold leading-none tracking-[0.10em] text-blue-700 sm:mb-1.5 sm:text-[18px]">
                INVOICE
              </p>
              <p className="text-[10px] leading-relaxed text-gray-500 sm:text-[11px]">
                Invoice No:{" "}
                <span className="font-semibold text-gray-900">
                  #{invoiceNo}
                </span>
              </p>
              <p className="text-[10px] leading-relaxed text-gray-500 sm:text-[11px]">
                Order Date: {invoiceDate}
              </p>
            </div>
          </div>

          {/* Billed / Shipped */}
          <div className="grid grid-cols-1 gap-3 border-b border-[#eeeeee] py-3 sm:grid-cols-2 sm:gap-6 sm:py-3.5">
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.10em] text-blue-700 sm:mb-1.5 sm:text-[9.5px]">
                Billed To
              </p>
              <p className="text-xs font-semibold leading-tight sm:text-[13px]">
                {order.user.name}
              </p>
              <div className="mt-0.5 text-[11px] leading-relaxed text-gray-500 sm:text-[11.5px]">
                {order.user.pharmacy_name && (
                  <>
                    {order.user.pharmacy_name}
                    <br />
                  </>
                )}
                {order.user.phone_number && (
                  <>
                    Phone:{" "}
                    <span className="font-medium text-gray-900">
                      {order.user.phone_number}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.10em] text-blue-700 sm:mb-1.5 sm:text-[9.5px]">
                Shipped To
              </p>
              {order.shippingAddress ? (
                <>
                  <p className="text-xs font-semibold leading-tight sm:text-[13px]">
                    {order.shippingAddress.street || "Delivery Address"}
                  </p>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-gray-500 sm:text-[11.5px]">
                    {order.shippingAddress.city}
                    {order.shippingAddress.state
                      ? `, ${order.shippingAddress.state}`
                      : ""}
                    <br />
                    {order.shippingAddress.postalCode}
                    {order.shippingAddress.country
                      ? `, ${order.shippingAddress.country}`
                      : ""}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-gray-500 sm:text-[11.5px]">
                  No shipping address available
                </p>
              )}
            </div>
          </div>

          {/* Order Summary table */}
          <div className="min-w-0 pt-3">
            {/* Mobile list – redesigned */}
            <div className="space-y-2 sm:hidden">
              {order.items?.map((item: OrderItem, idx: number) => (
                <article
                  key={item.id ?? idx}
                  className="min-w-0 rounded-lg border border-gray-100 px-3 py-2.5"
                >
                  <p className="break-words text-xs font-medium leading-5 text-gray-900">
                    {item.product.name}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-gray-50 pt-1.5">
                    <span className="text-[11px] tabular-nums text-gray-500">
                      {item.quantity} ×{" "}
                      {parseFloat(item.price).toLocaleString()} ৳
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-gray-900">
                      {(
                        parseFloat(item.price) * item.quantity
                      ).toLocaleString()}{" "}
                      ৳
                    </span>
                  </div>
                </article>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-blue-700/70">
                  Total
                </span>
                <span className="text-xs font-bold tabular-nums text-blue-700">
                  {parseFloat(order.totalAmount).toLocaleString()} ৳
                </span>
              </div>
            </div>

            {/* Desktop table – unchanged */}
            <div className="hidden overflow-x-auto rounded-[10px] border border-[#eeeeee] sm:block">
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr>
                    <th className="text-left bg-[#f7f7f7] border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500 last:border-r-0">
                      Product
                    </th>
                    <th className="text-center bg-[#f7f7f7] border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500 w-[60px] last:border-r-0">
                      Qty
                    </th>
                    <th className="text-right bg-[#f7f7f7] border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500 w-[110px] last:border-r-0">
                      Unit Price
                    </th>
                    <th className="text-right bg-[#f7f7f7] border-b border-[#eeeeee] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-gray-500 w-[120px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: OrderItem, idx: number) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 1 ? "bg-[#f7f7f7]" : "bg-white"}
                    >
                      <td className="border-b border-r border-[#eeeeee] px-2.5 py-1.5 last:border-r-0">
                        {item.product.name}
                      </td>
                      <td className="border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-center last:border-r-0">
                        {item.quantity}
                      </td>
                      <td className="border-b border-r border-[#eeeeee] px-2.5 py-1.5 text-right text-gray-500 tabular-nums whitespace-nowrap last:border-r-0">
                        {parseFloat(item.price).toLocaleString()} ৳
                      </td>
                      <td className="border-b border-[#eeeeee] px-2.5 py-1.5 text-right font-semibold tabular-nums whitespace-nowrap">
                        {(
                          parseFloat(item.price) * item.quantity
                        ).toLocaleString()}{" "}
                        ৳
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={4}
                      className="bg-blue-50 px-2.5 py-2 text-right text-[12px] font-bold text-blue-700 tabular-nums whitespace-nowrap"
                    >
                      Total Amount:{" "}
                      {parseFloat(order.totalAmount).toLocaleString()} ৳
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
