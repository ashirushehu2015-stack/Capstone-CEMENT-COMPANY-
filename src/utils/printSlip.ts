import type { PaymentRecord, Order } from '../types/index.ts';

interface PrintSlipOptions {
  receipt: PaymentRecord;
  order?: Order | null;
  mode: 'receipt' | 'audit';
}

export function printSlipDocument({ receipt, order, mode }: PrintSlipOptions): void {
  const isAudit = mode === 'audit';
  const trucksCount =
    order?.totalTrailers || Math.max(1, Math.round(receipt.amount / 6510000));
  const bagsCount = order?.totalBags || trucksCount * 600;
  const formattedDate = new Date(receipt.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedDateTime = new Date(receipt.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const docTitle = isAudit
    ? `Audit Slip - ${receipt.orderNumber} - AUD-${receipt.id.toUpperCase()}`
    : `Payment Receipt - ${receipt.orderNumber} - ${receipt.id.toUpperCase()}`;

  // Content for View 1: Official Wholesale Payment Receipt
  const receiptBodyHtml = `
    <!-- Letterhead -->
    <div class="header-band">
      <div>
        <div class="company-brand">
          <span class="gold-icon">&#127963;</span>
          <span class="company-name">A.A. MASTER NIG. LIMITED</span>
        </div>
        <p class="company-sub">Wholesale Cement Commercial &amp; Physical Loading Operations</p>
        <p class="company-meta">RC: RC-1928410 &bull; TIN: 29810419-0001</p>
        <p class="company-meta">Kalambaina Industrial Hub, Cement Works Expressway, Sokoto State</p>
      </div>
      <div class="header-right">
        <span class="badge-green">&#10003; 100% FULLY PAID</span>
        <div class="ref-row">Receipt #: <strong>${receipt.id.toUpperCase()}</strong></div>
        <div class="date-row">Date: <strong>${formattedDate}</strong></div>
      </div>
    </div>

    <!-- Customer & Order Section -->
    <div class="grid-2 mt-4">
      <div class="data-card">
        <span class="label">ISSUED TO (CUSTOMER):</span>
        <strong class="value-lg">${receipt.customerName}</strong>
        <span class="value-sub">${order?.companyName || receipt.bankPayerName || 'Wholesale Client'}</span>
        ${order?.customerPhone ? `<span class="value-sub">Phone: ${order.customerPhone}</span>` : ''}
      </div>
      <div class="data-card">
        <span class="label">WHOLESALE ORDER &amp; FULFILLMENT:</span>
        <strong class="value-lg text-amber">${receipt.orderNumber}</strong>
        <span class="value-sub">Ex-Factory Plant Collection (Direct Transporter Dispatch)</span>
        <span class="value-sub">Kalambaina Plant Weighbridge Clearance Bay</span>
      </div>
    </div>

    <!-- Itemized Order Table -->
    <table class="item-table mt-4">
      <thead>
        <tr>
          <th>Product Description</th>
          <th class="text-center">Trailers Ordered</th>
          <th class="text-center">Total Bags (x600)</th>
          <th class="text-right">Fixed Truck Rate</th>
          <th class="text-right">Total Reconciled</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Sokoto Cement (Kalambaina 42.5R)</strong>
            <div class="item-sku">SKU: AAM-SKT-600 &bull; 30 Tonnes / Truck</div>
          </td>
          <td class="text-center"><strong>${trucksCount} Full Truck${trucksCount > 1 ? 's' : ''}</strong></td>
          <td class="text-center text-green"><strong>${bagsCount.toLocaleString()} Bags</strong></td>
          <td class="text-right">&#8358;6,510,000</td>
          <td class="text-right text-green"><strong>&#8358;${receipt.amount.toLocaleString('en-NG')}</strong></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="text-right footer-label">TOTAL 100% UPFRONT AMOUNT PAID:</td>
          <td class="text-right footer-value text-green">&#8358;${receipt.amount.toLocaleString('en-NG')}</td>
        </tr>
        <tr>
          <td colspan="4" class="text-right subfooter-label">Outstanding Balance:</td>
          <td class="text-right subfooter-value">&#8358;0.00 (Zero Balance)</td>
        </tr>
      </tfoot>
    </table>

    <!-- Banking & Verification -->
    <div class="data-card mt-4">
      <div class="section-title text-amber">
        <span>&#127974;</span> Zenith Bank Settlement &amp; Treasury Verification
      </div>
      <div class="grid-2 mt-2">
        <div>
          <span class="label">Destination Corporate Account:</span>
          <strong>${receipt.destinationAccount || 'Zenith Bank - 1018492049'}</strong>
        </div>
        <div>
          <span class="label">Bank Transaction / Session ID:</span>
          <strong class="text-green font-mono">${receipt.bankTransferReference || receipt.gatewayReference || 'ZEN-TX-CONFIRMED'}</strong>
        </div>
        <div class="mt-2">
          <span class="label">Reconciled By Authorized Executive:</span>
          <strong>${receipt.verifiedByStaffName || 'Uwaisu Musa'} (Plant Depot Manager)</strong>
        </div>
        <div class="mt-2">
          <span class="label">Verification Timestamp:</span>
          <span class="font-mono">${formattedDateTime}</span>
        </div>
      </div>
    </div>

    <!-- Official Notice -->
    <div class="notice-box-green mt-4">
      <strong>Official Release Clearance:</strong> This official receipt certifies that payment was received 100% in full without credit or part payments. Transporter is authorized for physical truck clearance at the Kalambaina plant weighbridge.
    </div>
  `;

  // Content for View 2: Treasury Reconciliation Audit Slip
  const auditBodyHtml = `
    <!-- Letterhead -->
    <div class="header-band">
      <div>
        <div class="company-brand">
          <span class="purple-icon">&#128737;</span>
          <span class="company-name">A.A. MASTER NIG. LIMITED</span>
        </div>
        <p class="company-sub">Wholesale Cement Commercial &amp; Physical Loading Operations</p>
        <p class="company-meta">RC: RC-1928410 &bull; TIN: 29810419-0001</p>
        <p class="company-meta">Kalambaina Industrial Hub, Cement Works Expressway, Sokoto State</p>
      </div>
      <div class="header-right">
        <span class="badge-purple">AUDIT STATUS: VERIFIED</span>
        <div class="ref-row">Audit Ref: <strong>AUD-${receipt.id.toUpperCase()}</strong></div>
        <div class="date-row">Date: <strong>${formattedDate}</strong></div>
      </div>
    </div>

    <!-- Audit Header Banner -->
    <div class="audit-banner mt-3">
      <span class="banner-badge">TREASURY RECONCILIATION AUDIT SLIP</span>
      <span class="banner-sub">Internal Accounting &amp; Executive Compliance Proof &bull; 100% Upfront Direct Bank Settlement Verification</span>
    </div>

    <!-- Audit Data Grid -->
    <div class="grid-2 mt-4">
      <div class="data-card">
        <span class="label">INTERNAL PAYMENT ID:</span>
        <strong class="font-mono">${receipt.id}</strong>
      </div>
      <div class="data-card">
        <span class="label">LINKED ORDER ENTITY:</span>
        <strong class="font-mono text-amber">${receipt.orderNumber}</strong>
      </div>
      <div class="data-card">
        <span class="label">WHOLESALE CONTRACTOR:</span>
        <strong>${receipt.customerName}</strong>
      </div>
      <div class="data-card">
        <span class="label">PAYER ACCOUNT / LABEL:</span>
        <span class="font-mono">${receipt.bankPayerName || receipt.customerName}</span>
      </div>
      <div class="data-card">
        <span class="label">SETTLEMENT CHANNEL:</span>
        <strong class="text-green font-mono">${receipt.paymentMethod}</strong>
      </div>
      <div class="data-card">
        <span class="label">DESTINATION TREASURY:</span>
        <span class="font-mono">${receipt.destinationAccount || 'Zenith Bank - 1018492049'}</span>
      </div>
      <div class="data-card">
        <span class="label">BANK TRANSACTION ID / REF:</span>
        <strong class="text-green font-mono">${receipt.bankTransferReference || receipt.gatewayReference || 'ZEN-TX-CONFIRMED'}</strong>
      </div>
      <div class="data-card">
        <span class="label">EXACT INFLOW CLEARED:</span>
        <strong class="text-green font-mono text-lg">&#8358;${receipt.amount.toLocaleString('en-NG')}</strong>
      </div>
    </div>

    <!-- Verifier Attestation -->
    <div class="data-card mt-4">
      <span class="label">RECONCILING AUTHORITY ATTESTATION:</span>
      <div class="flex-between mt-2">
        <div>
          <strong class="text-lg">${receipt.verifiedByStaffName || 'Uwaisu Musa'}</strong>
          <div class="text-purple text-sm">Plant Depot General Manager (Approval Authority)</div>
        </div>
        <div class="text-right font-mono text-sm">
          <span>Cleared: ${formattedDateTime}</span>
        </div>
      </div>
      <div class="audit-notes mt-3 pt-2">
        <strong>Audit Notes:</strong> ${receipt.verificationNotes || 'Reconciled in bank portal; 100% full value confirmed. No partial balance.'}
      </div>
    </div>

    <!-- Compliance Certification Stamp -->
    <div class="notice-box-purple mt-4">
      <strong>Authoritative Accounting Record:</strong> This audit slip is an immutable corporate ledger record generated by A.A. Master Nig. Limited. It certifies that the physical cement allocation of <strong>${bagsCount.toLocaleString()} Bags (${trucksCount} Trailers)</strong> has received corresponding direct financial settlement at the designated treasury bank account prior to loading bay release clearance.
    </div>
  `;

  const fullPrintHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${docTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 100%;
            height: 100%;
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 11.5px;
            line-height: 1.45;
          }
          .document-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 16px 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            border: 1.5px solid #cbd5e1;
            border-radius: 12px;
          }
          .header-band {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            gap: 16px;
          }
          .company-brand {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .company-name {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #020617;
          }
          .company-sub {
            font-size: 11px;
            color: #334155;
            margin-top: 2px;
            font-weight: 600;
          }
          .company-meta {
            font-size: 10px;
            color: #64748b;
          }
          .header-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 3px;
          }
          .badge-green {
            background-color: #ecfdf5 !important;
            color: #047857 !important;
            border: 1.5px solid #a7f3d0 !important;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .badge-purple {
            background-color: #f5f3ff !important;
            color: #6b21a8 !important;
            border: 1.5px solid #d8b4fe !important;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-family: ui-monospace, monospace;
          }
          .ref-row {
            font-size: 11px;
            color: #475569;
            font-family: ui-monospace, monospace;
            margin-top: 2px;
          }
          .date-row {
            font-size: 10px;
            color: #64748b;
          }
          .audit-banner {
            background-color: #f5f3ff !important;
            border: 1.5px solid #d8b4fe !important;
            border-radius: 8px;
            padding: 10px 14px;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .banner-badge {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #6b21a8;
          }
          .banner-sub {
            font-size: 9.5px;
            color: #475569;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .data-card {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px;
            padding: 10px 12px;
          }
          .label {
            display: block;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #64748b;
            text-transform: uppercase;
          }
          .value-lg {
            display: block;
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          .value-sub {
            display: block;
            font-size: 10.5px;
            color: #475569;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }
          .item-table th {
            background-color: #f1f5f9 !important;
            color: #334155;
            text-transform: uppercase;
            font-size: 9.5px;
            font-weight: 800;
            padding: 8px 10px;
            border-bottom: 1.5px solid #cbd5e1;
          }
          .item-table td {
            padding: 9px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .item-table tfoot td {
            background-color: #f8fafc !important;
            padding: 8px 10px;
          }
          .item-sku {
            font-size: 9.5px;
            color: #64748b;
            font-family: ui-monospace, monospace;
          }
          .footer-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #334155;
          }
          .footer-value {
            font-size: 13px;
            font-weight: 900;
            font-family: ui-monospace, monospace;
          }
          .subfooter-label {
            font-size: 9.5px;
            color: #64748b;
          }
          .subfooter-value {
            font-size: 11px;
            color: #475569;
            font-family: ui-monospace, monospace;
          }
          .notice-box-green {
            background-color: #ecfdf5 !important;
            border: 1px solid #a7f3d0 !important;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 9.5px;
            color: #065f46;
            line-height: 1.4;
          }
          .notice-box-purple {
            background-color: #f5f3ff !important;
            border: 1px solid #d8b4fe !important;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 9.5px;
            color: #581c87;
            line-height: 1.4;
          }
          .audit-notes {
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #475569;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-green { color: #047857 !important; }
          .text-purple { color: #6b21a8 !important; }
          .text-amber { color: #b45309 !important; }
          .font-mono { font-family: ui-monospace, monospace; }
          .flex-between { display: flex; justify-content: space-between; align-items: center; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .mt-4 { margin-top: 16px; }
          .pt-2 { padding-top: 8px; }
          .text-sm { font-size: 10.5px; }
          .text-lg { font-size: 13.5px; }
          .gold-icon { color: #b45309; font-size: 16px; }
          .purple-icon { color: #6b21a8; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="document-container">
          ${isAudit ? auditBodyHtml : receiptBodyHtml}
        </div>
      </body>
    </html>
  `;

  // Create an off-screen iframe with real layout dimensions so Chrome renders it completely
  let iframe = document.getElementById('aam-isolated-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'aam-isolated-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1000px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.zIndex = '-999';
    iframe.style.visibility = 'visible';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(fullPrintHtml);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    }, 300);
  } else {
    window.print();
  }
}
