// src/app/dashboard/orders/InvoicePDF.tsx
"use client";

import { Printer } from "lucide-react";

interface InvoiceItem {
  quantity: number;
  price: string | number;
  product: { name: string };
}

interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
}

interface InvoiceOrder {
  id: string;
  createdAt: string | Date;
  totalAmount: string | number;
  user: {
    name: string;
    pharmacy_name?: string;
    phone_number?: string;
  };
  shippingAddress?: ShippingAddress | null;
  items?: InvoiceItem[];
}

interface InvoicePDFProps {
  order: InvoiceOrder;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (value: string | number): string =>
  `${Number(value).toLocaleString()} ৳`;

const INVOICE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --brand: #1d4ed8;
    --brand-soft: #eff6ff;
    --brand-line: #dbeafe;
    --ink: #0f172a;
    --ink-soft: #334155;
    --muted: #64748b;
    --line: #eeeeee;
    --bg: #f7f7f7;
  }

  html, body {
    background: #eef2f7;
    color: var(--ink);
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  body { padding: 16px 12px; }

  .invoice {
    margin: 0 auto;
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
  }

  .paper-inner { padding: 22px 26px 18px; }

  /* Header */
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
    width: 45px;
    height: 45px;
    object-fit: contain;
    border-radius: 8px;
    background: var(--brand-soft);
    padding: 5px;
    border: 1px solid var(--brand-line);
  }

  .brand-name {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .brand-tag {
    font-size: 11px;
    color: var(--muted);
    margin-top: 1px;
  }

  .invoice-meta { text-align: right; }

  .invoice-meta h2 {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.10em;
    color: var(--brand);
    line-height: 1;
    margin-bottom: 5px;
  }

  .meta-row {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.55;
  }

  .meta-row strong { color: var(--ink); font-weight: 600; }

  /* Info grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }

  .label {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: var(--brand);
    margin-bottom: 6px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .label::before {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--brand);
  }

  .name {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .detail {
    font-size: 11.5px;
    color: var(--muted);
    line-height: 1.5;
  }

  .detail strong { color: var(--ink-soft); font-weight: 500; }

  /* Items table */
  .items { padding-top: 14px; }

  .items h3 {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: var(--muted);
    margin-bottom: 8px;
  }

  table { width: 100%; border-collapse: separate; border-spacing: 0; }

  thead th {
    background: var(--bg);
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    text-align: left;
    padding: 7px 10px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    border-left: 1px solid var(--line);
  }

  thead th:first-child { border-top-left-radius: 6px; }
  thead th:last-child {
    border-top-right-radius: 6px;
    border-right: 1px solid var(--line);
  }

  th.num { text-align: right; width: 110px; }
  th.total-col { width: 120px; }
  th.center { text-align: center; width: 60px; }

  tbody td {
    padding: 7px 10px;
    font-size: 11.5px;
    color: var(--ink-soft);
    border-bottom: 1px solid var(--line);
    border-left: 1px solid var(--line);
    vertical-align: middle;
    background: #ffffff;
  }

  tbody td:last-child { border-right: 1px solid var(--line); }
  tbody tr:nth-child(even) td { background: var(--bg); }

  .product-name { font-weight: 500; color: var(--ink); }

  td.center { text-align: center; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.sub { color: var(--muted); }
  td.total { font-weight: 600; color: var(--ink); }

  tfoot td {
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 700;
    background: var(--brand-soft);
    border-bottom: 1px solid var(--line);
    border-left: 1px solid var(--line);
    border-right: 1px solid var(--line);
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* Footer */
  .footer {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
    text-align: center;
  }

  .footer-thanks {
    font-size: 12px;
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

  .footer-contact strong { color: var(--ink-soft); font-weight: 600; }
  .footer-contact span { margin: 0 6px; }

  @media print {
    @page { size: A4; margin: 12mm; }
    html, body { background: #ffffff; }
    body { padding: 0; }
    .invoice { border-radius: 0; }
    .paper-inner { padding: 0; }
    thead th, tfoot td, tbody tr:nth-child(even) td {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tbody tr { page-break-inside: avoid; }
  }
`;

function renderBilledTo(user: InvoiceOrder["user"]): string {
  return `
    <div class="info-block">
      <div class="label">Billed To</div>
      <div class="name">${escapeHtml(user.name)}</div>
      <div class="detail">
        ${user.pharmacy_name ? `${escapeHtml(user.pharmacy_name)}<br/>` : ""}
        ${user.phone_number ? `Phone: <strong>${escapeHtml(user.phone_number)}</strong>` : ""}
      </div>
    </div>`;
}

function renderShippedTo(address?: ShippingAddress | null): string {
  const body = address
    ? `
      <div class="name">${escapeHtml(address.city || "Delivery Address")}</div>
      <div class="detail">
        ${escapeHtml(address.street)}<br/>
        ${escapeHtml(address.city)}${address.state ? `, ${escapeHtml(address.state)}` : ""}<br/>
        ${escapeHtml(address.postalCode)}${address.country ? `, ${escapeHtml(address.country)}` : ""}
      </div>`
    : `<div class="detail">No shipping address available</div>`;

  return `
    <div class="info-block">
      <div class="label">Shipped To</div>
      ${body}
    </div>`;
}

function renderItemRow(item: InvoiceItem): string {
  const unitPrice = Number(item.price);
  return `
    <tr>
      <td><div class="product-name">${escapeHtml(item.product.name)}</div></td>
      <td class="center">${escapeHtml(item.quantity)}</td>
      <td class="num sub">${formatMoney(unitPrice)}</td>
      <td class="num total">${formatMoney(unitPrice * item.quantity)}</td>
    </tr>`;
}

function buildInvoiceHtml(order: InvoiceOrder): string {
  const invoiceNo = order.id.slice(-8).toUpperCase();
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const logoUrl = `${window.location.origin}/logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice #${invoiceNo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${INVOICE_STYLES}</style>
</head>
<body>
  <div class="invoice">
    <div class="paper-inner">

      <header class="header">
        <div class="brand">
          <img src="${logoUrl}" alt="MediCarePLC" class="brand-logo" />
          <div>
            <div class="brand-name">MediCarePLC</div>
            <div class="brand-tag">Your Trusted B2B Sales Partner</div>
          </div>
        </div>
        <div class="invoice-meta">
          <h2>INVOICE</h2>
          <div class="meta-row">Invoice No: <strong>#${invoiceNo}</strong></div>
          <div class="meta-row">Date: ${invoiceDate}</div>
        </div>
      </header>

      <section class="info-grid">
        ${renderBilledTo(order.user)}
        ${renderShippedTo(order.shippingAddress)}
      </section>

      <section class="items">
        <h3>Order Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th class="center">Qty</th>
              <th class="num">Unit Price</th>
              <th class="num total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items ?? []).map(renderItemRow).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">Total Amount: ${formatMoney(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer class="footer">
        <div class="footer-thanks">Thank you for choosing MediCarePLC.</div>
        <div class="footer-note">
          For any inquiries, please contact <strong>support@medicareplc.com</strong>
        </div>
      </footer>

    </div>
  </div>

  <script>
    window.onafterprint = function () { window.close(); };
    window.onload = function () {
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      ready.then(function () { window.print(); });
    };
  </script>
</body>
</html>`;
}

export default function InvoicePDF({ order }: InvoicePDFProps) {
  const printInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(buildInvoiceHtml(order));
    printWindow.document.close();
  };

  return (
    <button
      onClick={printInvoice}
      className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors"
      title="Print Invoice"
    >
      <Printer size={16} />
    </button>
  );
}
