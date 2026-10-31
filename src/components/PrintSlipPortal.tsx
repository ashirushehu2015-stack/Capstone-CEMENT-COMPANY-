import React from 'react';
import { createPortal } from 'react-dom';
import type { PaymentRecord, Order } from '../types/index.ts';

interface PrintSlipPortalProps {
  receipt: PaymentRecord;
  order?: Order | null;
  mode: 'receipt' | 'audit';
}

export const PrintSlipPortal: React.FC<PrintSlipPortalProps> = ({
  receipt,
  order,
  mode,
}) => {
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

  return createPortal(
    <div
      id="printable-slip-portal"
      className="hidden print:block font-sans text-slate-900 bg-white"
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        padding: '24px',
        margin: '0',
      }}
    >
      {isAudit ? (
        /* ============================================================== */
        /* VIEW 2: TREASURY RECONCILIATION AUDIT SLIP                     */
        /* ============================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Audit Slip Corporate Letterhead */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🛡</span>
                <h4
                  style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    color: '#020617',
                    margin: 0,
                  }}
                >
                  A.A. MASTER NIG. LIMITED
                </h4>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: '#334155',
                  fontWeight: 600,
                  marginTop: '3px',
                  marginBottom: '2px',
                }}
              >
                Wholesale Cement Commercial &amp; Physical Loading Operations
              </p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontFamily: 'monospace' }}>
                RC: RC-1928410 • TIN: 29810419-0001
              </p>
              <p style={{ fontSize: '10px', color: '#475569', margin: 0 }}>
                Kalambaina Industrial Hub, Cement Works Expressway, Sokoto State
              </p>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#f5f3ff',
                  color: '#6b21a8',
                  border: '1.5px solid #d8b4fe',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                }}
              >
                AUDIT STATUS: VERIFIED
              </span>
              <div style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>
                Audit Ref: <strong style={{ color: '#020617' }}>AUD-{receipt.id.toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Date: {formattedDate}</div>
            </div>
          </div>

          {/* Audit Banner */}
          <div
            style={{
              backgroundColor: '#f5f3ff',
              border: '1.5px solid #d8b4fe',
              borderRadius: '8px',
              padding: '10px 14px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#6b21a8',
                letterSpacing: '0.5px',
                display: 'block',
              }}
            >
              TREASURY RECONCILIATION AUDIT SLIP
            </span>
            <span style={{ fontSize: '9.5px', color: '#475569' }}>
              Internal Accounting &amp; Executive Compliance Proof — 100% Upfront Direct Bank Settlement Verification
            </span>
          </div>

          {/* Key-Value Data Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px 14px',
            }}
          >
            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                INTERNAL PAYMENT ID:
              </span>
              <strong style={{ fontSize: '12px', color: '#020617', fontFamily: 'monospace' }}>{receipt.id}</strong>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                LINKED ORDER ENTITY:
              </span>
              <strong style={{ fontSize: '12px', color: '#b45309', fontFamily: 'monospace' }}>{receipt.orderNumber}</strong>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                WHOLESALE CONTRACTOR:
              </span>
              <strong style={{ fontSize: '12px', color: '#020617' }}>{receipt.customerName}</strong>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                PAYER ACCOUNT / LABEL:
              </span>
              <span style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace' }}>
                {receipt.bankPayerName || receipt.customerName}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                SETTLEMENT CHANNEL:
              </span>
              <strong style={{ fontSize: '11px', color: '#047857', fontFamily: 'monospace' }}>
                {receipt.paymentMethod}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                DESTINATION TREASURY:
              </span>
              <span style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace' }}>
                {receipt.destinationAccount || 'Zenith Bank - 1018492049'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                BANK TRANSACTION ID / REF:
              </span>
              <strong style={{ fontSize: '11px', color: '#047857', fontFamily: 'monospace' }}>
                {receipt.bankTransferReference || receipt.gatewayReference || 'ZEN-TX-CONFIRMED'}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                EXACT INFLOW CLEARED:
              </span>
              <strong style={{ fontSize: '14px', color: '#047857', fontFamily: 'monospace', fontWeight: 900 }}>
                ₦{receipt.amount.toLocaleString('en-NG')}
              </strong>
            </div>
          </div>

          {/* Verifier Attestation */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              RECONCILING AUTHORITY ATTESTATION:
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#020617', display: 'block' }}>
                  {receipt.verifiedByStaffName || 'Uwaisu Musa'}
                </strong>
                <span style={{ fontSize: '10.5px', color: '#6b21a8', fontWeight: 600 }}>
                  Plant Depot General Manager (Approval Authority)
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }}>
                Cleared: {formattedDateTime}
              </div>
            </div>
            <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#475569' }}>
              <strong>Audit Notes:</strong>{' '}
              {receipt.verificationNotes || 'Reconciled in bank portal; 100% full value confirmed. No partial balance.'}
            </div>
          </div>

          {/* Compliance Certification Stamp */}
          <div
            style={{
              backgroundColor: '#f5f3ff',
              border: '1px solid #d8b4fe',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '9.5px',
              color: '#581c87',
              lineHeight: 1.45,
            }}
          >
            <strong>Authoritative Accounting Record:</strong> This audit slip is an immutable corporate ledger record generated by A.A. Master Nig. Limited. It certifies that the physical cement allocation of{' '}
            <strong>
              {bagsCount.toLocaleString()} Bags ({trucksCount} Trailers)
            </strong>{' '}
            has received corresponding direct financial settlement at the designated treasury bank account prior to loading bay release clearance.
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* VIEW 1: OFFICIAL WHOLESALE PAYMENT RECEIPT                     */
        /* ============================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏛</span>
                <h4
                  style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    color: '#020617',
                    margin: 0,
                  }}
                >
                  A.A. MASTER NIG. LIMITED
                </h4>
              </div>
              <p style={{ fontSize: '11px', color: '#334155', fontWeight: 600, marginTop: '3px', marginBottom: '2px' }}>
                Wholesale Cement Commercial &amp; Physical Loading Operations
              </p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontFamily: 'monospace' }}>
                RC: RC-1928410 • TIN: 29810419-0001
              </p>
              <p style={{ fontSize: '10px', color: '#475569', margin: 0 }}>
                Kalambaina Industrial Hub, Cement Works Expressway, Sokoto State
              </p>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1.5px solid #a7f3d0',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                ✓ 100% FULLY PAID
              </span>
              <div style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>
                Receipt #: <strong style={{ color: '#020617' }}>{receipt.id.toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Date: {formattedDate}</div>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px 14px',
            }}
          >
            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                ISSUED TO (CUSTOMER):
              </span>
              <strong style={{ fontSize: '13px', color: '#020617', display: 'block', marginTop: '2px' }}>
                {receipt.customerName}
              </strong>
              <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>
                {order?.companyName || receipt.bankPayerName || 'Wholesale Client'}
              </span>
              {order?.customerPhone && (
                <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', display: 'block' }}>
                  Phone: {order.customerPhone}
                </span>
              )}
            </div>

            <div>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                WHOLESALE ORDER &amp; FULFILLMENT:
              </span>
              <strong style={{ fontSize: '13px', color: '#b45309', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                {receipt.orderNumber}
              </strong>
              <span style={{ fontSize: '11px', color: '#334155', display: 'block' }}>
                Ex-Factory Plant Collection (Direct Transporter Dispatch)
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>
                Kalambaina Plant Weighbridge Clearance Bay
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div style={{ borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', textTransform: 'uppercase', fontSize: '9.5px', color: '#334155' }}>
                    Product Description
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', textTransform: 'uppercase', fontSize: '9.5px', color: '#334155' }}>
                    Trailers Ordered
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', textTransform: 'uppercase', fontSize: '9.5px', color: '#334155' }}>
                    Total Bags (x600)
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', textTransform: 'uppercase', fontSize: '9.5px', color: '#334155' }}>
                    Fixed Truck Rate
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', textTransform: 'uppercase', fontSize: '9.5px', color: '#334155' }}>
                    Total Reconciled
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>
                    <strong style={{ color: '#020617', display: 'block' }}>Sokoto Cement (Kalambaina 42.5R)</strong>
                    <span style={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'monospace' }}>
                      SKU: AAM-SKT-600 • 30 Tonnes / Truck
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#020617', fontWeight: 700 }}>
                    {trucksCount} Full Truck{trucksCount > 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#047857', fontWeight: 700 }}>
                    {bagsCount.toLocaleString()} Bags
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>₦6,510,000</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#047857', fontWeight: 900 }}>
                    ₦{receipt.amount.toLocaleString('en-NG')}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '1.5px solid #cbd5e1' }}>
                  <td colSpan={4} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#334155' }}>
                    Total 100% Upfront Amount Paid:
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#047857', fontSize: '13px' }}>
                    ₦{receipt.amount.toLocaleString('en-NG')}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td colSpan={4} style={{ padding: '6px 10px', textAlign: 'right', fontSize: '9.5px', color: '#64748b' }}>
                    Outstanding Balance:
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                    ₦0.00 (Zero Balance)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Banking Verification Details */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 700, fontSize: '11px' }}>
              <span>🏦</span>
              <span>Zenith Bank Settlement &amp; Treasury Verification</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', paddingTop: '4px' }}>
              <div>
                <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block' }}>Destination Corporate Account:</span>
                <strong style={{ color: '#020617', fontFamily: 'monospace' }}>
                  {receipt.destinationAccount || 'Zenith Bank - 1018492049'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block' }}>Bank Transaction / Session ID:</span>
                <strong style={{ color: '#047857', fontFamily: 'monospace' }}>
                  {receipt.bankTransferReference || receipt.gatewayReference || 'ZEN-TX-CONFIRMED'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block' }}>Reconciled By Authorized Executive:</span>
                <strong style={{ color: '#020617' }}>
                  {receipt.verifiedByStaffName || 'Uwaisu Musa'} (Plant Depot Manager)
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block' }}>Verification Timestamp:</span>
                <span style={{ color: '#475569', fontFamily: 'monospace' }}>{formattedDateTime}</span>
              </div>
            </div>
          </div>

          {/* Certified Footnote */}
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '9.5px',
              color: '#065f46',
              lineHeight: 1.45,
            }}
          >
            <strong>Official Release Clearance:</strong> This official receipt certifies that payment was received 100% in full without credit or part payments. Transporter is authorized for physical truck clearance at the Kalambaina plant weighbridge.
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
