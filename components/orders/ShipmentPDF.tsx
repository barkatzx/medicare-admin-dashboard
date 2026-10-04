"use client";

import { formatSalesCurrency } from "@/components/sales/salesFormatters";
import type { OrderedProduct } from "@/config/api";
import { Printer } from "lucide-react";

interface ShipmentPDFProps {
  products: OrderedProduct[];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export default function ShipmentPDF({ products }: ShipmentPDFProps) {
  const printShipment = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = products
      .map(
        (product) => `
          <tr>
            <td>${escapeHtml(product.productName)}</td>
            <td>${escapeHtml(product.distributor ?? "N/A")}</td>
            <td class="number">${product.quantity}</td>
            <td class="number">${formatSalesCurrency(product.price)}</td>
            <td class="number">${
              product.tp === null ? "N/A" : formatSalesCurrency(product.tp)
            }</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 28px;
              color: #1f2937;
              font-family: 'Outfit', 'Helvetica', 'Arial', sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            header {
              border-bottom: 1px solid #e5e7eb;
              text-align: center;
            }
            h1 {
              margin: 0 0 6px;
              font-size: 16px;
              font-weight: 600;
              letter-spacing: -0.01em;
              color: #111827;
            }
            p {
              margin: 0;
              color: #6b7280;
              font-size: 11px;
              font-weight: 400;
              letter-spacing: 0.02em;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td {
              padding: 10px 10px;
              border-bottom: 1px solid #f1f5f9;
              text-align: left;
              vertical-align: top;
              font-size: 11px;
              overflow-wrap: anywhere;
            }
            th {
              background: #f8fafc;
              color: #64748b;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              border-bottom: 1px solid #e2e8f0;
            }
            tbody tr:nth-child(even) { background: #fafbfc; }
            td:first-child { font-weight: 500; color: #111827; }
            .number {
              text-align: right;
              white-space: nowrap;
              font-variant-numeric: tabular-nums;
            }
            tfoot td {
              padding-top: 14px;
              border-top: 1px solid #e2e8f0;
              border-bottom: none;
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }
            @page { size: landscape; margin: 12mm; }
            @media print {
              body { padding: 0; }
              tr { break-inside: avoid; }
              thead { display: table-header-group; }
            }
          </style>
        </head>
        <body>
          <header>
            <h1>MediCarePLC</h1>
          </header>
          <table>
            <thead>
              <tr>
                <th>Product name</th>
                <th>Distributor</th>
                <th class="number">Quantity</th>
                <th class="number">MRP</th>
                <th class="number">TP</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2">${products.length} product${products.length === 1 ? "" : "s"}</td>
                <td class="number" colspan="3">Total quantity: ${products.reduce((sum, p) => sum + p.quantity, 0)}</td>
              </tr>
            </tfoot>
          </table>
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
    <button
      type="button"
      onClick={printShipment}
      disabled={products.length === 0}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
      title="Print ordered products"
    >
      <Printer size={14} strokeWidth={2.25} />
      Print
    </button>
  );
}
