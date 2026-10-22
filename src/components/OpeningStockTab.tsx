import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Clock,
  UserCheck,
  Calendar,
  Lock,
  Loader2
} from 'lucide-react';
import type { OpeningStockEntry, Product } from '../types/index.ts';
import { apiInventory } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface OpeningStockTabProps {
  products: Product[];
  entries: OpeningStockEntry[];
  onRefresh: () => void;
  onNotification: (type: 'success' | 'error', text: string) => void;
}

export const OpeningStockTab: React.FC<OpeningStockTabProps> = ({
  products,
  entries,
  onRefresh,
  onNotification,
}) => {
  const { user, isManager, isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    physicalCountDate: new Date().toISOString().slice(0, 10),
    productId: products[0]?.id || 'prod_sokoto_425r',
    trucksCounted: 20,
    countingStaffId: user?.id || 'usr_asst_mgr_001',
    countingStaffName: user?.fullName || 'Fatima Aliyu',
    verifierId: 'usr_mgr_001',
    verifierName: 'Engr. Sanusi Kalambaina',
    notes: 'Audited physical stock count of complete trailer payloads at Kalambaina Main Terminal.',
  });

  const selectedProduct = products.find((p) => p.id === form.productId) || products[0];
  const calculatedBags = form.trucksCounted * 600;

  // Has opening stock already been recorded for this product?
  const isBaselineEstablished = entries.some((e) => e.productId === form.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.trucksCounted < 0) {
      onNotification('error', 'Trucks counted cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiInventory.recordOpeningStock({
        ...form,
        physicalCountDate: new Date(form.physicalCountDate).toISOString(),
      });
      onNotification('success', res.message || 'Opening stock recorded successfully!');
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      onNotification('error', err.message || 'Failed to record opening stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Layers className="w-4 h-4" /> Section 4 — Opening Stock Registration
          </div>
          <h2 className="text-xl font-black text-white mt-1">Audited Baseline Stock Baseline</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            When the company starts using the system, stock is not assumed. This workflow establishes the initial
            physical inventory confirmed through an independent physical count. Opening stock can only be entered once.
          </p>
        </div>

        {(isManager || isAdmin) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Record Opening Stock
          </button>
        )}
      </div>

      {/* Rules Notice */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 font-mono space-y-1">
        <p className="text-slate-400">
          • <strong className="text-white">Single Submission Policy:</strong> Opening stock cannot be posted repeatedly to inflate inventory.
        </p>
        <p className="text-slate-400">
          • <strong className="text-amber-400">Manager Authorization:</strong> An unauthorised user (Buyer, Agent) cannot create opening stock.
        </p>
        <p className="text-slate-400">
          • <strong className="text-emerald-400">Auditable Baseline:</strong> Creates an immutable <code className="text-emerald-300">APPROVED_OPENING_STOCK</code> ledger movement.
        </p>
      </div>

      {/* Recorded Entries */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Established Inventory Baselines</h3>
          <span className="text-xs text-slate-400">{entries.length} Baseline(s) Recorded</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Lock className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Opening Stock Recorded</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Terminal balance begins at zero until an authorised opening stock count or approved supplier receipt is posted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Count Reference</th>
                  <th className="p-3.5">Physical Count Date</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5 text-center">Trucks Counted</th>
                  <th className="p-3.5 text-center">Confirmed Bags (x600)</th>
                  <th className="p-3.5">Counting Staff</th>
                  <th className="p-3.5">Verifier</th>
                  <th className="p-3.5">Manager Approver</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-amber-400">{entry.countReference}</td>
                    <td className="p-3.5 font-sans">
                      {new Date(entry.physicalCountDate).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 font-sans font-semibold text-white">{entry.productName}</td>
                    <td className="p-3.5 text-center font-bold text-white">{entry.trucksCounted} Trucks</td>
                    <td className="p-3.5 text-center font-bold text-emerald-400">
                      {entry.totalConfirmedBags.toLocaleString()} Bags
                    </td>
                    <td className="p-3.5 font-sans text-slate-300">{entry.countingStaffName}</td>
                    <td className="p-3.5 font-sans text-slate-300">{entry.verifierName}</td>
                    <td className="p-3.5 font-sans text-slate-300">{entry.approvedByManagerName}</td>
                    <td className="p-3.5 text-center font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Opening Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" /> Record Audited Opening Stock
                </h3>
                <p className="text-xs text-slate-400">Single-entry audited inventory baseline submission</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Grade {p.grade})
                    </option>
                  ))}
                </select>
                {isBaselineEstablished && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Warning: Opening stock has already been established for this product.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Physical Count Date</label>
                <input
                  type="date"
                  required
                  value={form.physicalCountDate}
                  onChange={(e) => setForm({ ...form, physicalCountDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">Number of Complete Trucks Counted *</label>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">600 bags / truck</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.trucksCounted}
                  onChange={(e) => setForm({ ...form, trucksCounted: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Total Confirmed Bags:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {form.trucksCounted} Trucks × 600 = {calculatedBags.toLocaleString()} Bags ({form.trucksCounted * 30}T)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Staff Conducting Count</label>
                  <input
                    type="text"
                    required
                    value={form.countingStaffName}
                    onChange={(e) => setForm({ ...form, countingStaffName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Independent Verifier</label>
                  <input
                    type="text"
                    required
                    value={form.verifierName}
                    onChange={(e) => setForm({ ...form, verifierName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audit Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isBaselineEstablished}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Submit Baseline ({calculatedBags.toLocaleString()} Bags)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
