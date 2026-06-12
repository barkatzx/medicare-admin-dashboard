// src/app/dashboard/orders/InvoicePDF.tsx
"use client";

import { Printer } from "lucide-react";

interface InvoicePDFProps {
  order: any;
}

export default function InvoicePDF({ order }: InvoicePDFProps) {
  const printInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id.slice(-8)}</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Outfit', 'Helvetica', 'Arial', sans-serif;
            padding: 20px;
            background: white;
            color: #333;
          }
          .invoice-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
          }
          .header h1 {
            color: #2563eb;
            font-size: 24px;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .header p {
            color: #6b7280;
            font-size: 12px;
            font-weight: 400;
          }
          .invoice-title {
            font-size: 18px;
            font-weight: 700;
            margin: 15px 0;
            text-align: center;
            color: #1f2937;
          }
          .info-section {
            margin-bottom: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 15px;
          }
          .info-item {
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 3px;
            letter-spacing: 0.3px;
          }
          .info-value {
            color: #1f2937;
            font-size: 12px;
            font-weight: 500;
          }
          .section {
            margin-bottom: 15px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
            color: #1f2937;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th {
            background: #f3f4f6;
            padding: 8px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
            font-weight: 400;
          }
          .total-section {
            margin-top: 5px;
            text-align: right;
          }
          .total-row {
            font-size: 14px;
            font-weight: 700;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
          }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-processing { background: #dbeafe; color: #1e40af; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .footer {
            margin-top: 20px;
            text-align: center;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 10px;
            font-weight: 400;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>MediCare</h1>
            <p>Your Trusted Healthcare Partner</p>
          </div>
          
          <div class="invoice-title">INVOICE</div>
          <!-- Customer Information and Shipping Address together -->
          <div class="section">
            <div class="info-grid">
              <div>
                <div class="info-label">Invoice Number</div>
                <div class="info-value">INV-${order.id.slice(-8).toUpperCase()}</div>
                <div class="info-label" style="margin-top: 8px;">Customer Name</div>
                <div class="info-value">${order.user.name}</div>
                <div class="info-label" style="margin-top: 8px;">Phone</div>
                <div class="info-value">${order.user.phone_number}</div>
                <div class="info-label" style="margin-top: 8px;">Invoice Date</div>
                <div class="info-value">${new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <div>

                <div class="info-label">Pharmacy Name</div>
                <div class="info-value">${order.user.pharmacy_name}</div>
                <div class="info-label" style="margin-top: 8px;">Shipping Address</div>
                ${
                  order.shippingAddress
                    ? `
                  <div class="info-value">${order.shippingAddress.street}</div>
                  <div class="info-value">${order.shippingAddress.city}, ${order.shippingAddress.state}</div>
                  <div class="info-value">${order.shippingAddress.postalCode}, ${order.shippingAddress.country}</div>
                `
                    : '<div class="info-value">No shipping address available</div>'
                }
                
              </div>
              
            </div>
          </div>

          <!-- Order Items -->
          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  ?.map(
                    (item: any) => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td style="text-align: center">${item.quantity}</td>
                    <td style="text-align: right">${parseFloat(item.price).toLocaleString()} ৳</td>
                    <td style="text-align: right">${(parseFloat(item.price) * item.quantity).toLocaleString()} ৳</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="total-section">
              <div class="total-row">Total Amount: ${parseFloat(order.totalAmount).toLocaleString()} ৳</div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with MediCare!</p>
            <p>For queries, contact: support@medicare.com</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
        </script>
      </body>
      </html>
    `);
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
