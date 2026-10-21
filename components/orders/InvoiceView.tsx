// src/app/dashboard/orders/components/InvoiceView.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { FileText } from "lucide-react";

interface InvoiceViewProps {
  order: any;
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
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-all duration-200 hover:bg-purple-200 hover:scale-105 sm:h-8 sm:w-8"
        title="View Invoice"
        aria-label="View invoice"
      >
        <FileText size={16} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Invoice Preview"
        size="lg"
      >
        <div className="min-w-0 bg-white text-gray-900">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-[#eeeeee] pb-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-gray-100 p-2 rounded-lg">
                <img
                  src="/logo.png"
                  alt="MediCarePLC"
                  className="w-9 h-9 object-contain rounded-lg"
                />
              </div>
              <div>
                <p className="text-[17px] font-bold leading-none tracking-tight text-blue-700">
                  MediCarePLC
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Your Trusted B2B Sales Partner
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[18px] font-bold tracking-[0.10em] leading-none mb-1.5 text-blue-700">
                INVOICE
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Invoice No:{" "}
                <span className="font-semibold text-gray-900">
                  #{invoiceNo}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Order Date: {invoiceDate}
              </p>
            </div>
          </div>

          {/* Billed / Shipped */}
          <div className="grid grid-cols-1 gap-4 border-b border-[#eeeeee] py-3.5 sm:grid-cols-2 sm:gap-6">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.10em] text-blue-700 mb-1.5">
                Billed To
              </p>
              <p className="text-[13px] font-semibold leading-tight">
                {order.user.name}
              </p>
              <div className="text-[11.5px] text-gray-500 leading-relaxed mt-0.5">
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
              <p className="text-[9.5px] font-bold uppercase tracking-[0.10em] text-blue-700 mb-1.5">
                Shipped To
              </p>
              {order.shippingAddress ? (
                <>
                  <p className="text-[13px] font-semibold leading-tight">
                    {order.shippingAddress.city || "Delivery Address"}
                  </p>
                  <div className="text-[11.5px] text-gray-500 leading-relaxed mt-0.5">
                    {order.shippingAddress.street}
                    <br />
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
                <p className="text-[11.5px] text-gray-500">
                  No shipping address available
                </p>
              )}
            </div>
          </div>

          {/* Order Summary table */}
          <div className="min-w-0 pt-3.5">
            <div className="space-y-2 sm:hidden">
              {order.items?.map((item: any, idx: number) => (
                <article
                  key={item.id ?? idx}
                  className={`min-w-0 rounded-lg border border-[#eeeeee] p-3 ${
                    idx % 2 === 1 ? "bg-[#f7f7f7]" : "bg-white"
                  }`}
                >
                  <p className="break-words text-xs font-semibold leading-5 text-gray-900">
                    {item.product.name}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#eeeeee] pt-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Quantity
                      </p>
                      <p className="mt-0.5 text-xs font-medium tabular-nums text-gray-700">
                        {item.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Unit price
                      </p>
                      <p className="mt-0.5 text-xs font-medium tabular-nums text-gray-700">
                        {parseFloat(item.price).toLocaleString()} ৳
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Total
                      </p>
                      <p className="mt-0.5 text-xs font-semibold tabular-nums text-gray-900">
                        {(
                          parseFloat(item.price) * item.quantity
                        ).toLocaleString()}{" "}
                        ৳
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-right text-xs font-bold tabular-nums text-blue-700">
                Total Amount: {parseFloat(order.totalAmount).toLocaleString()} ৳
              </div>
            </div>

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
                  {order.items?.map((item: any, idx: number) => (
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
