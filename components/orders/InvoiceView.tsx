// src/app/dashboard/orders/components/InvoiceView.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  FileText,
  Printer,
  Download,
  Building2,
  Calendar,
  Hash,
  CreditCard,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle,
} from "lucide-react";

interface InvoiceViewProps {
  order: any;
}

export default function InvoiceView({ order }: InvoiceViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const calculateSubtotal = () => {
    return (
      order.items?.reduce(
        (sum: number, item: any) =>
          sum + parseFloat(item.price) * item.quantity,
        0,
      ) || 0
    );
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id.slice(-8)}</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; padding: 40px; background: white; }
          .invoice-container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
          .header h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
          .invoice-title { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; background: #f9fafb; padding: 15px; border-radius: 8px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .total-section { text-align: right; margin-top: 20px; padding-top: 10px; border-top: 2px solid #e5e7eb; }
          .total-row { font-size: 18px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-delivered { background: #d1fae5; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>MediCare</h1>
            <p>Your Trusted Healthcare Partner</p>
          </div>
          <div class="invoice-title">TAX INVOICE</div>
          <div class="info-grid">
            <div><strong>Invoice Number:</strong> INV-${order.id.slice(-8).toUpperCase()}</div>
            <div><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Order ID:</strong> ${order.id}</div>
            <div><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div><strong>Name:</strong> ${order.user.name}</div>
            <div><strong>Pharmacy:</strong> ${order.user.pharmacy_name || "N/A"}</div>
            <div><strong>Phone:</strong> ${order.user.phone_number}</div>
            ${
              order.shippingAddress
                ? `
              <div><strong>Address:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}</div>
            `
                : ""
            }
          </div>
          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
              <tbody>
                ${order.items
                  ?.map(
                    (item: any) => `
                  <tr><td>${item.product.name}</td><td>${item.quantity}</td><td>${parseFloat(item.price).toLocaleString()} ৳</td><td>${(parseFloat(item.price) * item.quantity).toLocaleString()} ৳</td></tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="total-section"><div class="total-row">Total Amount: ${parseFloat(order.totalAmount).toLocaleString()} ৳</div></div>
          </div>
          <div class="footer"><p>Thank you for shopping with MediCare!</p><p>For queries: support@medicare.com</p></div>
        </div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

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
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="text-center pb-6">
            <h2 className="text-2xl font-bold text-blue-600">MediCarePLC</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your Trusted Healthcare Partner
            </p>
          </div>

          {/* Invoice Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Hash size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Invoice Number</p>
              </div>
              <p className="font-mono text-sm font-semibold text-gray-900">
                INV-{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Invoice Date</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Hash size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Order ID</p>
              </div>
              <p className="font-mono text-sm font-semibold text-gray-900">
                {order.id.slice(-12)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={12} className="text-gray-400" />
                <p className="text-xs text-gray-500">Order Date</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <User size={14} className="text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">
                  Customer Information
                </h4>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span> {order.user.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Pharmacy:</span>{" "}
                  {order.user.pharmacy_name || "N/A"}
                </p>
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <Phone size={12} className="text-gray-400" />
                  {order.user.phone_number}
                </p>
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <Mail size={12} className="text-gray-400" />
                  {order.user.email}
                </p>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <MapPin size={14} className="text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    Shipping Address
                  </h4>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                  <p>
                    {order.shippingAddress.postalCode},{" "}
                    {order.shippingAddress.country}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items Table */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-blue-600" />
                <h4 className="font-semibold text-gray-900">Order Items</h4>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {item.product.name}
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {parseFloat(item.price).toLocaleString()} ৳
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                        {(
                          parseFloat(item.price) * item.quantity
                        ).toLocaleString()}{" "}
                        ৳
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium text-gray-700">
                  {calculateSubtotal().toLocaleString()} ৳
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-blue-600">
                  {parseFloat(order.totalAmount).toLocaleString()} ৳
                </span>
              </div>
              {order.payment?.method === "cod" && (
                <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                  <CreditCard size={12} />
                  <span>Cash on Delivery</span>
                </div>
              )}
              {order.payment?.status === "paid" && (
                <div className="flex items-center justify-end gap-1 text-xs text-green-600">
                  <CheckCircle size={12} />
                  <span>Payment Confirmed</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === "delivered"
                  ? "bg-green-100 text-green-700"
                  : order.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : order.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
              }`}
            >
              <Truck size={14} />
              Order Status: {order.status.toUpperCase()}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Thank you for shopping with MediCarePLC!
            </p>
            <p className="text-xs text-gray-400 mt-1">
              For any queries, please contact us at support@medicareplc.com
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
