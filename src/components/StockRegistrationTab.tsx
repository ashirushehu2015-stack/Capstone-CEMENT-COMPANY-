import React, { useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Clock,
  Truck,
  ShieldAlert,
  Search,
  Filter,
  Check,
  X,
  Loader2
} from 'lucide-react';
import type { StockReceipt, Product, UserRole } from '../types/index.ts';
import { apiInventory } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface StockRegistrationTabProps {
  products: Product[];
  receipts: StockReceipt[];
  onRefresh: () => void;
  onNotification: (type: 'success' | 'error', text: string) => void;
}

export const StockRegistrationTab: React.FC<StockRegistrationTabProps> = ({
  products,
  receipts,
  onRefresh,
  onNotification,
}) => {
  const { user, isManager, isAssistantManager, isAdmin, isAgent } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Rejection modal
  const [rejectingReceipt, setRejectingReceipt] = useState<StockReceipt | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Reversal modal
  const [reversingReceipt, setReversingReceipt] = useState<StockReceipt | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');

  // Approval notes modal
  const [approvingReceipt, setApprovingReceipt] = useState<StockReceipt | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('Physically inspected and verified at Kalambaina depot loading terminal.');

  // Form State for Stock Registration
  const [formData, setFormData] = useState({
    supplierName: 'BUA Cement Plc (Kalambaina Plant)',
    supplierReference: 'BUA-KLB-2026-DN88',
    productId: products[0]?.id || 'prod_sokoto_425r',
    trucksReceived: 1, // Fixed: bags per truck = exactly 600
    supplierDeliveryNote: 'FACTORY-DIRECT',
    vehicleReg: 'FACTORY-DIRECT',
    driverName: '',
    driverPhone: '',
    notesOrDiscrepancies: '',
    isDraft: false,
  });

  const selectedProduct = products.find((p) => p.id === formData.productId) || products[0];
  const calculatedBags = formData.trucksReceived * 600; // Formula: total_bags_received = number_of_trucks_received × 600

  // Filtered Receipts
  const filteredReceipts = receipts.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.receiptReference.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        r.supplierDeliveryNote.toLowerCase().includes(q) ||
        r.vehicleReg.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.trucksReceived < 1) {
      onNotification('error', 'Number of full trucks received must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiInventory.createReceipt({
        ...formData,
        receiptDateTime: new Date().toISOString(),
      });
      onNotification('success', res.message || 'Stock receipt registered successfully.');
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      onNotification('error', err.message || 'Failed to register stock receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!approvingReceipt) return;
    setIsSubmitting(true);
    try {
      const res = await apiInventory.approveReceipt(approvingReceipt.id, approvalNotes);
      onNotification('success', res.message || 'Receipt approved and inventory updated!');
      setApprovingReceipt(null);
      onRefresh();
    } catch (err: any) {
      onNotification('error', err.message || 'Approval failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingReceipt || !rejectionReason.trim()) {
      onNotification('error', 'Please specify a rejection reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiInventory.rejectReceipt(rejectingReceipt.id, rejectionReason);
      onNotification('success', res.message || 'Stock receipt rejected.');
      setRejectingReceipt(null);
      setRejectionReason('');
      onRefresh();
    } catch (err: any) {
      onNotification('error', err.message || 'Rejection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverse = async () => {
    if (!reversingReceipt || !reversalReason.trim()) {
      onNotification('error', 'Please specify an authorised reversal justification.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiInventory.reverseReceipt(reversingReceipt.id, reversalReason);
      onNotification('success', res.message || 'Receipt reversed and stock deducted in ledger.');
      setReversingReceipt(null);
      setReversalReason('');
      onRefresh();
    } catch (err: any) {
      onNotification('error', err.message || 'Reversal failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Truck className="w-4 h-4" /> Section 2 — Staff Stock Registration Module
          </div>
          <h2 className="text-xl font-black text-white mt-1">Sokoto Cement Physical Stock Receipts</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Register physical cement received from factory kilns or suppliers. Enforces strictly 600 bags per full truck.
            Stock increases authoritative inventory balance only upon Manager independent verification and approval.
          </p>
        </div>

        {(isManager || isAssistantManager || isAdmin) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Register New Stock
          </button>
        )}
      </div>

      {/* Rules & Permissions Info Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 space-y-1.5 font-mono">
        <div className="font-sans font-bold text-slate-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" /> Separation of Duties & Truck Rules
        </div>
        <p className="text-slate-400">
          • Receiving staff: Assistant Manager / Manager registers incoming stock. Receiving staff <strong className="text-amber-400">cannot approve their own receipt</strong>.
        </p>
        <p className="text-slate-400">
          • Approvals: <strong className="text-emerald-400">Manager only</strong>. Agents are prohibited from approving receipts.
        </p>
        <p className="text-slate-400">
          • Trucks: Fixed at <strong className="text-white">600 bags per truck</strong>. Formula: <span className="text-amber-400">total_bags_received = number_of_trucks × 600</span>.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference, supplier, waybill, or vehicle reg..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex rounded-lg overflow-hidden border border-slate-800 text-xs">
            {['ALL', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'REVERSED', 'DRAFT'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-[11px] font-bold transition-colors ${
                  statusFilter === st
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Receipt Ref</th>
                <th className="p-3.5">Supplier & PO Ref</th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5 text-center">Trucks Received</th>
                <th className="p-3.5 text-center">Total Bags (x600)</th>
                <th className="p-3.5">Intake Allocation</th>
                <th className="p-3.5">Staff & Verifier</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-sans">
                    No stock receipts found matching your current filter.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const isCreator = user?.id === r.receivingStaffId;
                  const canManagerApprove = (isManager || isAdmin) && !isCreator && r.status === 'PENDING_VERIFICATION';
                  const canReverse = (isManager || isAdmin) && r.status === 'APPROVED';

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-amber-400 font-mono">{r.receiptReference}</td>
                      <td className="p-3.5 font-sans">
                        <span className="font-bold text-white block">{r.supplierName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {r.supplierReference || r.supplierDeliveryNote}</span>
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className="text-white block font-semibold">{r.productName}</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">{r.cementBrand}</span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-white">
                        {r.trucksReceived} Trailer{r.trucksReceived > 1 ? 's' : ''}
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-400 font-mono">
                        {r.totalBagsReceived.toLocaleString()} Bags
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        <span className="text-emerald-400 font-bold block">Factory Direct</span>
                        <span className="text-[10px] text-slate-500">Self-Collection Plant</span>
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className="text-slate-300 block">Rec: {r.receivingStaffName}</span>
                        {r.verifierName ? (
                          <span className="text-[10px] text-emerald-400">Ver: {r.verifierName}</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 italic">Unverified</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : r.status === 'PENDING_VERIFICATION'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                              : r.status === 'REVERSED'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-sans space-x-1.5 whitespace-nowrap">
                        {canManagerApprove && (
                          <>
                            <button
                              onClick={() => setApprovingReceipt(r)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px]"
                              title="Approve and post stock into inventory"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectingReceipt(r);
                                setRejectionReason('');
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {r.status === 'PENDING_VERIFICATION' && isCreator && (
                          <span className="text-[10px] text-slate-500 italic block">
                            Self-approval prohibited (Separation of duties)
                          </span>
                        )}

                        {canReverse && (
                          <button
                            onClick={() => {
                              setReversingReceipt(r);
                              setReversalReason('');
                            }}
                            className="px-2 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 font-bold rounded text-[10px] flex items-center gap-1 inline-flex"
                          >
                            <RotateCcw className="w-3 h-3" /> Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REGISTER STOCK RECEIPT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" /> Register New Stock
                </h3>
                <p className="text-xs text-slate-400">Record direct factory stock purchase allocation at plant depot</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier Reference / PO #</label>
                  <input
                    type="text"
                    value={formData.supplierReference}
                    onChange={(e) => setFormData({ ...formData, supplierReference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cement Product *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - 600 Bags / Truck
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">Number of Full Trucks Received *</label>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">Fixed: 600 bags / truck</span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={formData.trucksReceived}
                  onChange={(e) => setFormData({ ...formData, trucksReceived: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Authoritative Calculation:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formData.trucksReceived} Trucks × 600 = {calculatedBags.toLocaleString()} Bags ({formData.trucksReceived * 30}T)
                  </span>
                </div>
              </div>

              

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Discrepancy Observations</label>
                <textarea
                  rows={2}
                  value={formData.notesOrDiscrepancies}
                  onChange={(e) => setFormData({ ...formData, notesOrDiscrepancies: e.target.value })}
                  placeholder="Note weighbridge slips, seal numbers, or offloading bay condition..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="draftCheckbox"
                  checked={formData.isDraft}
                  onChange={(e) => setFormData({ ...formData, isDraft: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500"
                />
                <label htmlFor="draftCheckbox" className="text-slate-400 text-xs cursor-pointer">
                  Save as Draft (will not enter verification queue until submitted)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Register New Stock ({calculatedBags.toLocaleString()} Bags)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGER APPROVAL */}
      {approvingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Verify & Approve Stock Receipt
            </h3>
            <p className="text-xs text-slate-300">
              You are approving Receipt <strong className="text-amber-400">{approvingReceipt.receiptReference}</strong> for{' '}
              <strong className="text-white">{approvingReceipt.trucksReceived} trucks</strong> ({approvingReceipt.totalBagsReceived.toLocaleString()} bags) from{' '}
              <strong className="text-white">{approvingReceipt.supplierName}</strong>.
            </p>
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-300">
              Authoritative stock on hand will increase by exactly <strong>{approvingReceipt.totalBagsReceived.toLocaleString()} bags</strong> upon this action.
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Verification Inspection Notes</label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingReceipt(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Post to Physical Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGER REJECTION */}
      {rejectingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" /> Reject Stock Receipt
            </h3>
            <p className="text-xs text-slate-300">
              Rejecting receipt <strong className="text-amber-400">{rejectingReceipt.receiptReference}</strong> will prevent it from entering inventory balance.
            </p>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State damaged seal, off-specification packaging, missing delivery note..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingReceipt(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANAGER REVERSAL */}
      {reversingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-400" /> Authorised Receipt Reversal
            </h3>
            <p className="text-xs text-slate-300">
              Reversing receipt <strong className="text-amber-400">{reversingReceipt.receiptReference}</strong> will post a compensating ledger movement of{' '}
              <strong className="text-rose-400">-{reversingReceipt.totalBagsReceived.toLocaleString()} bags</strong>. History is permanently preserved.
            </p>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Authorised Justification *</label>
              <textarea
                rows={3}
                required
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="State post-offloading weighbridge discrepancy or verified documentation error..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReversingReceipt(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleReverse}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Execute Reversal Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
