"use client";

import { Printer } from "lucide-react";
import type { OrderedProduct } from "@/config/api";
import { formatSalesCurrency } from "@/components/sales/salesFormatters";

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
          <title>Ordered Products</title>
          <meta charset="utf-8" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 28px;
              color: #1f2937;
              font-family: 'Outfit', 'Helvetica', 'Arial', sans-serif;
            }
            header {
              margin-bottom: 10px;
              padding-bottom: 10px;
              text-align: center;
            }
            h1 { margin: 0 0 6px; font-size: 15px; }
            p { margin: 0; color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td {
              padding: 10px 8px;
              border-bottom: 1px solid #e5e7eb;
              text-align: left;
              vertical-align: top;
              font-size: 11px;
              overflow-wrap: anywhere;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: .04em;
            }
            .number { text-align: right; white-space: nowrap; }
            @page { size: landscape; margin: 12mm; }
            @media print {
              body { padding: 0; }
              tr { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <header>
            <h1>MediCarePLC — Ordered Products</h1>
            <p>Printed ${escapeHtml(new Date().toLocaleString())}</p>
          </header>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Distributor</th>
                <th class="number">Quantity</th>
                <th class="number">Price</th>
                <th class="number">TP</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
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
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      title="Print ordered products"
    >
      <Printer size={15} />
      Print
    </button>
  );
}
