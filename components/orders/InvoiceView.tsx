// src/app/dashboard/orders/components/InvoiceView.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { FileText, Printer } from "lucide-react";

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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice #${invoiceNo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }

          :root {
            --brand: #1d4ed8;
            --brand-soft: #eff6ff;
            --ink: #111111;
            --muted: #666666;
            --line: #eeeeee;
            --bg: #f7f7f7;
          }

          html, body {
            background: #ffffff;
            color: var(--ink);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          body { padding: 16px; }

          .invoice {
            max-width: 720px;
            margin: 0 auto;
            background: #ffffff;
          }

          /* ---------- Header ---------- */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--line);
          }

          .brand { display: flex; align-items: center; gap: 10px; }

          .brand-logo {
            width: 36px;
            height: 36px;
            object-fit: contain;
          }

          .brand-name {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: var(--brand);
            line-height: 1.1;
          }

          .brand-tag {
            font-size: 11px;
            color: var(--muted);
            margin-top: 1px;
          }

          .invoice-meta { text-align: right; }

          .invoice-meta h2 {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.10em;
            color: var(--brand);
            line-height: 1;
            margin-bottom: 5px;
          }

          .invoice-meta .meta-row {
            font-size: 11px;
            color: var(--muted);
            line-height: 1.55;
          }

          .invoice-meta .meta-row strong {
            color: var(--ink);
            font-weight: 600;
          }

          /* ---------- Info grid ---------- */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            padding: 14px 0;
            border-bottom: 1px solid var(--line);
          }

          .info-block .label {
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.10em;
            color: var(--brand);
            margin-bottom: 6px;
          }

          .info-block .name {
            font-size: 13px;
            font-weight: 600;
            color: var(--ink);
            margin-bottom: 2px;
          }

          .info-block .detail {
            font-size: 11.5px;
            color: var(--muted);
            line-height: 1.5;
          }

          .info-block .detail strong {
            color: var(--ink);
            font-weight: 500;
          }

          /* ---------- Items table ---------- */
          .items { padding-top: 14px; }

          .items h3 {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.10em;
            color: var(--muted);
            margin-bottom: 8px;
          }

          /* rounded table with 10px radius */
          .items .table-wrap {
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--line);
          }

          table { width: 100%; border-collapse: collapse; }

          thead th {
            background: var(--bg);
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
            text-align: left;
            padding: 7px 10px;
            border-bottom: 1px solid var(--line);
            border-right: 1px solid var(--line);
          }

          thead th:last-child { border-right: none; }

          thead th.num { text-align: right; }
          thead th.center { text-align: center; }

          tbody td {
            padding: 7px 10px;
            font-size: 11.5px;
            color: var(--ink);
            border-bottom: 1px solid var(--line);
            border-right: 1px solid var(--line);
            background: #ffffff;
          }

          tbody td:last-child { border-right: none; }
          tbody tr:last-child td { border-bottom: none; }

          tbody tr:nth-child(even) td { background: var(--bg); }

          td.center { text-align: center; }
          td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
          td.num.sub { color: var(--muted); }
          td.num.total { font-weight: 600; }

          /* ---------- Total Due row (single unified cell) ---------- */
          tfoot td.grand-single {
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 700;
            color: var(--brand);
            background: var(--brand-soft);
            border-top: 1px solid var(--line);
            text-align: right;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }

          /* ---------- Footer ---------- */
          .footer {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid var(--line);
            text-align: center;
          }

          .footer-thanks {
            font-size: 12px;
            color: var(--ink);
            font-weight: 600;
            margin-bottom: 3px;
          }

          .footer-note {
            font-size: 10.5px;
            color: var(--muted);
            line-height: 1.5;
            margin-bottom: 8px;
          }

          .footer-contact {
            font-size: 10.5px;
            color: var(--muted);
            line-height: 1.5;
          }

          .footer-contact strong { color: var(--brand); font-weight: 500; }

          .footer-contact span { color: var(--line); margin: 0 6px; }

          /* ---------- Print ---------- */
          @media print {
            @page { size: A4; margin: 12mm; }
            html, body { background: #ffffff; }
            body { padding: 0; }
            .no-print { display: none !important; }
            thead th, tfoot td.grand-single, tbody tr:nth-child(even) td {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            tbody tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">

          <header class="header">
            <div class="brand">
              <img src="/logo.png" alt="MediCarePLC" class="brand-logo" />
              <div>
                <div class="brand-name">MediCarePLC</div>
                <div class="brand-tag">Your Trusted Healthcare Partner</div>
              </div>
            </div>
            <div class="invoice-meta">
              <h2>INVOICE</h2>
              <div class="meta-row">Invoice No: <strong>#${invoiceNo}</strong></div>
              <div class="meta-row">Date: ${invoiceDate}</div>
            </div>
          </header>

          <section class="info-grid">
            <div class="info-block">
              <div class="label">Billed To</div>
              <div class="name">${order.user.name}</div>
              <div class="detail">
                ${order.user.pharmacy_name ? `${order.user.pharmacy_name}<br/>` : ""}
                ${order.user.phone_number ? `Phone: <strong>${order.user.phone_number}</strong>` : ""}
              </div>
            </div>
            <div class="info-block">
              <div class="label">Shipped To</div>
              ${
                order.shippingAddress
                  ? `
                <div class="name">${order.shippingAddress.city || "Delivery Address"}</div>
                <div class="detail">
                  ${order.shippingAddress.street}<br/>
                  ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}<br/>
                  ${order.shippingAddress.postalCode}${order.shippingAddress.country ? `, ${order.shippingAddress.country}` : ""}
                </div>
              `
                  : `<div class="detail">No shipping address available</div>`
              }
            </div>
          </section>

          <section class="items">
            <h3>Order Summary</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="center" style="width: 60px;">Qty</th>
                    <th class="num" style="width: 110px;">Unit Price</th>
                    <th class="num" style="width: 120px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items
                    ?.map(
                      (item: any) => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td class="center">${item.quantity}</td>
                      <td class="num sub">${parseFloat(item.price).toLocaleString()} ৳</td>
                      <td class="num total">${(parseFloat(item.price) * item.quantity).toLocaleString()} ৳</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="grand-single">
                      Total Due: ${parseFloat(order.totalAmount).toLocaleString()} ৳
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <footer class="footer">
            <div class="footer-thanks">Thank you for choosing MediCarePLC.</div>
            <div class="footer-note">
              This is a computer-generated invoice and does not require a signature.<br/>
              Please retain a copy for your records.
            </div>
            <div class="footer-contact">
              <strong>support@medicareplc.com</strong>
              <span>|</span>
              www.medicareplc.com
              <span>|</span>
              Mon – Fri, 9:00 – 18:00
            </div>
          </footer>

        </div>

        <script>
          window.onload = function () {
            window.print();
            setTimeout(function () { window.close(); }, 500);
          };
        </script>
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
                  Your Trusted Healthcare Partner
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
                Date: {invoiceDate}
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
            <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-gray-500 mb-2">
              Order Summary
            </p>
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
