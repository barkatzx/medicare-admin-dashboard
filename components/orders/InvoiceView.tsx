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
        className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-lg transition-all duration-200 hover:scale-105"
        title="View Invoice"
      >
        <FileText size={16} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Invoice Preview"
        size="lg"
      >
        <div className="bg-white text-gray-900">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-[#eeeeee]">
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
            <div className="text-right">
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
          <div className="grid grid-cols-2 gap-6 py-3.5 border-b border-[#eeeeee]">
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
          <div className="pt-3.5">
            <div className="rounded-[10px] overflow-hidden border border-[#eeeeee]">
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
                      Total Due:{" "}
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
