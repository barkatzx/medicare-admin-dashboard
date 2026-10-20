"use client";

import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import type { OrderedProduct } from "@/config/api";
import { Printer } from "lucide-react";

type ShipmentGroup = { distributor: string; products: OrderedProduct[] };

interface ShipmentPDFProps {
  groups: ShipmentGroup[];
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);

const PRINT_STYLES = `
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
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  body { padding: 16px; }

  /* Page (A4 portrait: 210mm - 2 x 12mm margins = 186mm content width) */
  .distributor-page {
    width: 186mm;
    max-width: 100%;
    margin: 0 auto 28px;
    break-after: page;
    page-break-after: always;
  }

  .distributor-page.last-page {
    break-after: auto;
    page-break-after: auto;
  }

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
    width: 36px;
    height: 36px;
    padding: 4px;
    border-radius: 6px;
    background: #f3f4f6;
    object-fit: contain;
  }

  .brand-name {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--brand);
    line-height: 1.1;
  }

  .brand-tag { font-size: 11px; color: var(--muted); margin-top: 1px; }

  .shipment-meta { text-align: right; }

  .shipment-meta h2 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--brand);
    line-height: 1;
    margin-bottom: 5px;
  }

  .shipment-meta .meta-row { font-size: 11px; color: var(--muted); }

  /* Distributor title */
  .distributor-title {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }

  .distributor-title .name { font-size: 13px; font-weight: 600; }
  .distributor-title .count { font-size: 10.5px; color: var(--muted); }

  /* Table */
  .table-wrap {
    margin-top: 14px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--line);
  }

  table { width: 100%; border-collapse: collapse; }

  th, td {
    padding: 7px 10px;
    border-bottom: 1px solid var(--line);
    border-right: 1px solid var(--line);
  }

  th:last-child, td:last-child { border-right: none; }

  thead th {
    background: var(--bg);
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    text-align: left;
  }

  tbody td {
    font-size: 11.5px;
    background: #ffffff;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  tbody tr:last-child td { border-bottom: none; }
  tbody tr.row-alt td { background: var(--bg); }
  tbody td.product { font-weight: 500; }
  tbody td.muted { color: var(--muted); }

  .number {
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  tfoot { display: table-row-group; }

  tfoot td {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand);
    background: var(--brand-soft);
    border-bottom: none;
    border-top: 1px solid var(--line);
  }

  /* Print */
  @page { size: A4 portrait; margin: 12mm; }

  @media print {
    body { padding: 0; }
    .distributor-page { margin-bottom: 0; }
    tr { break-inside: avoid; }
    thead { display: table-header-group; }
    thead th, tfoot td, tbody tr.row-alt td, .brand-logo {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

// Wait for the Outfit font before opening the print dialog
const PRINT_SCRIPT = `
  window.onload = function () {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      window.print();
      setTimeout(function () { window.close(); }, 500);
    });
  };
`;

const formatDate = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function renderRow(product: OrderedProduct, index: number): string {
  return `
        <tr class="${index % 2 === 1 ? "row-alt" : ""}">
          <td class="product">${escapeHtml(product.productName)}</td>
          <td>${escapeHtml(product.category?.name ?? "N/A")}</td>
          <td class="number">${product.quantity}</td>
          <td class="number">${formatSalesCurrency(product.price)}</td>
          <td class="number muted">${product.tp == null ? "N/A" : formatSalesCurrency(product.tp)}</td>
        </tr>`;
}

function renderPage(
  { distributor, products }: ShipmentGroup,
  isLast: boolean,
  date: string,
): string {
  const quantityTotal = products.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  const unitPriceTotal = products.reduce(
    (sum, product) => sum + Number(product.price) * product.quantity,
    0,
  );

  // TP total is only shown when every product has a TP
  const tpTotal = products.reduce<number | null>((sum, product) => {
    if (sum === null || product.tp == null) return null;
    return sum + Number(product.tp) * product.quantity;
  }, 0);

  return `
    <section class="distributor-page${isLast ? " last-page" : ""}">
      <header class="header">
        <div class="brand">
          <img src="/logo.png" alt="MediCarePLC" class="brand-logo" />
          <div>
            <div class="brand-name">MediCarePLC</div>
            <div class="brand-tag">Your Trusted B2B Sales Partner</div>
          </div>
        </div>
        <div class="shipment-meta">
          <h2>SHIPMENT</h2>
          <div class="meta-row">Date: ${date}</div>
        </div>
      </header>

      <div class="distributor-title">
        <div class="name">${escapeHtml(distributor)}</div>
        <div class="count">${products.length} product${products.length === 1 ? "" : "s"}</div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Company</th>
              <th class="number">Qty</th>
              <th class="number">MRP</th>
              <th class="number">TP</th>
            </tr>
          </thead>
          <tbody>${products.map(renderRow).join("")}</tbody>
          <tfoot>
            <tr>
              <td colspan="2">Total</td>
              <td class="number">${quantityTotal}</td>
              <td class="number">${formatSalesCurrency(unitPriceTotal)}</td>
              <td class="number">${tpTotal === null ? "N/A" : formatSalesCurrency(tpTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>`;
}

export default function ShipmentPDF({ groups }: ShipmentPDFProps) {
  const printShipment = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      console.error("Unable to open the shipment print window.");
      return;
    }

    const date = formatDate();
    const pages = groups
      .map((group, index) =>
        renderPage(group, index === groups.length - 1, date),
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Shipment</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    ${pages}
    <script>${PRINT_SCRIPT}</script>
  </body>
</html>`);
    printWindow.document.close();
  };

  return (
    <button
      type="button"
      onClick={printShipment}
      disabled={groups.length === 0}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
      title="Print distributor-wise today shipments"
    >
      <Printer size={14} strokeWidth={2.25} />
      Print
    </button>
  );
}
