import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Users,
  Settings,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Check,
  X,
  Loader2,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  apiReports,
  apiOrders,
  apiInventory,
  apiPayments,
  apiDeliveries,
  apiProducts,
  apiAuth
} from '../services/api.ts';
import type {
  Order,
  StockMovement,
  PaymentRecord,
  Product,
  AuditLog,
  BusinessSettings,
  User,
  OrderStatus,
  UserRole,
  StockReceipt,
  OpeningStockEntry,
  TruckIssuanceAllocation,
  AcceptanceTestResult,
} from '../types/index.ts';
import { StockRegistrationTab } from './StockRegistrationTab.tsx';
import { OpeningStockTab } from './OpeningStockTab.tsx';
import { AcceptanceTestsTab } from './AcceptanceTestsTab.tsx';

interface StaffDashboardProps {
  onClose: () => void;
  onViewOrderReceipt: (order: Order) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onClose, onViewOrderReceipt }) => {
  const { user, isAdmin, isManager, isAssistantManager, isAgent, isStoreManager, isSalesOfficer, isCashier, isDeliveryOfficer } = useAuth();

  // Active Tab
  type TabType =
    | 'overview'
    | 'stock_registration'
    | 'orders'
    | 'inventory'
    | 'opening_stock'
    | 'acceptance_tests'
    | 'payments'
    | 'deliveries'
    | 'products'
    | 'staff'
    | 'audit'
    | 'settings';

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (isDeliveryOfficer) return 'deliveries';
    if (isCashier) return 'payments';
    return 'overview';
  });

  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

  // Modals inside dashboard
  const [showReceiveGoodsModal, setShowReceiveGoodsModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState<Order | null>(null);
  const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState<Order | null>(null);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);

  // Form states for modals
  const [receiveForm, setReceiveForm] = useState({
    productId: '',
    trailersReceived: 1, // 1 trailer trip = 600 bags (30 tonnes)
    batchNumber: 'SKT-KLB-2026-B08',
    plantKilnReference: 'Kalambaina Kiln Line 2',
    notes: 'Direct factory trailer dispatch to depot yard',
  });

  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    trailerChange: -1,
    type: 'DAMAGED_BAGS_REPACKED' as 'DAMAGED_BAGS_REPACKED' | 'DEPOT_AUDIT_ADJUSTMENT',
    reason: 'Damaged bags offloaded and repacked under depot supervision',
  });

  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CASH_AT_STORE' | 'POS_TERMINAL',
    amount: 0,
    referenceNumber: '',
    payerName: '',
    destinationAccount: 'Zenith Bank - 1018492049',
    notes: '',
  });

  const [stockReceipts, setStockReceipts] = useState<StockReceipt[]>([]);
  const [openingStockEntries, setOpeningStockEntries] = useState<OpeningStockEntry[]>([]);
  const [issuingModalData, setIssuingModalData] = useState<{
    order: Order;
    allocation: TruckIssuanceAllocation;
  } | null>(null);
  const [issuingForm, setIssuingForm] = useState({
    truckHeadReg: 'SKK-782-XA',
    trailerBedReg: 'T-904-SOK',
    driverName: 'Musa Danladi',
    driverPhone: '+234 812 555 6677',
    recipientSignatureName: '',
    notes: 'Direct physical issuance of 600 bags with official Kalambaina security pass.',
  });
  const [rejectOrderModal, setRejectOrderModal] = useState<Order | null>(null);
  const [orderRejectionReason, setOrderRejectionReason] = useState<string>('');

  const [driverForm, setDriverForm] = useState({
    deliveryOfficerId: 'usr_driver_001',
    truckTractorHeadReg: 'SKK-782-XA',
    trailerBedReg: 'T-904-SOK',
    driverPhone: '+234 812 555 6677',
    notes: '30-Ton Articulated Trailer haulage dispatched',
  });

  const [confirmDeliveryForm, setConfirmDeliveryForm] = useState({
    recipientSignatureName: '',
    proofOfDeliveryNotes: 'All 600 bags in trailer offloaded and stacked at site in pristine condition.',
  });

  const [newStaffForm, setNewStaffForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'SALES_OFFICER' as UserRole,
  });

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, ordersRes, productsRes, receiptsRes, openingRes] = await Promise.all([
        apiReports.getAnalytics().catch(() => null),
        apiOrders.getAll().catch(() => ({ orders: [] })),
        apiProducts.getAll().catch(() => ({ products: [] })),
        apiInventory.getReceipts().catch(() => ({ receipts: [] })),
        apiInventory.getOpeningStock().catch(() => ({ entries: [] })),
      ]);

      if (analyticsRes) setAnalytics(analyticsRes);
      if (ordersRes) setOrders(ordersRes.orders);
      if (receiptsRes?.receipts) setStockReceipts(receiptsRes.receipts);
      if (openingRes?.entries) setOpeningStockEntries(openingRes.entries);

      if (productsRes) {
        setProducts(productsRes.products);
        if (productsRes.products.length > 0) {
          setReceiveForm((prev) => ({ ...prev, productId: productsRes.products[0].id }));
          setAdjustForm((prev) => ({ ...prev, productId: productsRes.products[0].id }));
        }
      }

      if (isAdmin || isStoreManager || isSalesOfficer || isCashier || isManager || isAssistantManager) {
        const movRes = await apiInventory.getMovements().catch(() => ({ movements: [] }));
        setStockMovements(movRes.movements);
      }

      if (isAdmin || isCashier || isStoreManager || isManager) {
        const payRes = await apiPayments.getAll().catch(() => ({ payments: [] }));
        setPayments(payRes.payments);
      }

      if (isAdmin || isStoreManager || isDeliveryOfficer || isSalesOfficer || isAgent) {
        const delRes = await apiDeliveries.getAll().catch(() => ({ deliveries: [] }));
        setDeliveries(delRes.deliveries);
      }

      if (isAdmin || isManager) {
        const [logsRes, staffRes, settingsRes] = await Promise.all([
          apiReports.getAuditLogs().catch(() => ({ logs: [] })),
          apiAuth.getStaff().catch(() => ({ staff: [] })),
          apiReports.getSettings().catch(() => ({ settings: null })),
        ]);
        setAuditLogs(logsRes.logs);
        setStaffList(staffRes.staff);
        if (settingsRes?.settings) setBusinessSettings(settingsRes.settings);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagerApproveOrder = async (orderId: string) => {
    try {
      const res = await apiOrders.approveByManager(orderId);
      showNotification('success', res.message || 'Order approved by Manager. Stock reserved.');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Approval failed');
    }
  };

  const handleManagerRejectOrder = async () => {
    if (!rejectOrderModal || !orderRejectionReason.trim()) {
      showNotification('error', 'Rejection reason is required.');
      return;
    }
    try {
      const res = await apiOrders.rejectByManager(rejectOrderModal.id, orderRejectionReason);
      showNotification('success', res.message || 'Order rejected by Manager.');
      setRejectOrderModal(null);
      setOrderRejectionReason('');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Rejection failed');
    }
  };

  const handleAgentIssueTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingModalData) return;
    try {
      const res = await apiOrders.issueTruckByAgent(issuingModalData.order.id, {
        truckAllocationId: issuingModalData.allocation.id,
        ...issuingForm,
      });
      showNotification('success', res.message || 'Truck physically issued (600 bags deducted from inventory).');
      setIssuingModalData(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Physical cement issuance failed');
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // --- Handlers ---
  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiInventory.receiveGoods(receiveForm);
      showNotification('success', `Goods receipt recorded: ${receiveForm.trailersReceived} trailer(s) (${receiveForm.trailersReceived * 600} bags) added.`);
      setShowReceiveGoodsModal(false);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to record receipt');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiInventory.adjustStock(adjustForm);
      showNotification('success', `Stock adjusted by ${adjustForm.trailerChange} trailer(s).`);
      setShowAdjustStockModal(false);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Adjustment failed');
    }
  };

  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPayments.recordOffline(paymentForm);
      showNotification('success', `Verified payment recorded for Order. Order marked as Paid.`);
      setShowRecordPaymentModal(false);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to record payment');
    }
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignDriverModal) return;
    try {
      await apiDeliveries.assign(showAssignDriverModal.id, driverForm);
      showNotification('success', `Driver & Rig ${driverForm.truckTractorHeadReg} / ${driverForm.trailerBedReg} assigned.`);
      setShowAssignDriverModal(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to assign driver');
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    try {
      await apiDeliveries.dispatch(orderId, {});
      showNotification('success', 'Order marked as DISPATCHED.');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to dispatch');
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConfirmDeliveryModal) return;
    try {
      await apiDeliveries.confirmDelivery(showConfirmDeliveryModal.id, confirmDeliveryForm);
      showNotification('success', 'Delivery confirmed and signed off!');
      setShowConfirmDeliveryModal(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to confirm delivery');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiAuth.createStaff(newStaffForm);
      showNotification('success', `New staff account created: ${newStaffForm.fullName}`);
      setShowCreateStaffModal(false);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create staff');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, notes?: string) => {
    try {
      await apiOrders.updateStatus(orderId, { status, notes });
      showNotification('success', `Order status updated to ${status}`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update order status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Dashboard Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">A.A. Master Nig. Limited — Operations Portal</h1>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">
                {user?.role === 'MANAGER' && 'Manager (Approval Authority)'}
                {user?.role === 'ASSISTANT_MANAGER' && 'Assistant Manager (Queue Review)'}
                {user?.role === 'CASHIER' && 'Cashier (Payment Reconciliation)'}
                {user?.role === 'AGENT' && 'Agent (Production Site Stock Issuance)'}
                {!['MANAGER', 'ASSISTANT_MANAGER', 'CASHIER', 'AGENT'].includes(user?.role || '') && user?.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sokoto Cement Kalambaina Plant Wholesale Terminal • Active Operator: <strong>{user?.fullName}</strong> ({user?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-colors"
          >
            Back to Public Storefront
          </button>
        </div>
      </header>

      {/* Global Notification Banner */}
      {actionMessage && (
        <div
          className={`px-6 py-3 text-xs font-bold flex items-center justify-between ${
            actionMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300 border-b border-emerald-800' : 'bg-rose-950 text-rose-300 border-b border-rose-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 space-y-1 overflow-y-auto">
          {(isAdmin || isManager || isStoreManager || isCashier) && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Executive Overview
            </button>
          )}

          {/* Section 2: Staff Stock Registration Module */}
          {(isAdmin || isManager || isAssistantManager || isStoreManager || isSalesOfficer) && (
            <button
              onClick={() => setActiveTab('stock_registration')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'stock_registration'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-400" /> Stock Receipts (Sec. 2)
              {stockReceipts.filter((r) => r.status === 'PENDING_VERIFICATION').length > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {stockReceipts.filter((r) => r.status === 'PENDING_VERIFICATION').length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Orders & Issuance
            {orders.filter((o) => o.managerApprovalStatus === 'PENDING_REVIEW' || o.status === 'PAID').length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {orders.filter((o) => o.managerApprovalStatus === 'PENDING_REVIEW' || o.status === 'PAID').length}
              </span>
            )}
          </button>

          {(isAdmin || isManager || isAssistantManager || isStoreManager || isSalesOfficer) && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" /> Authoritative Ledger
            </button>
          )}

          {/* Section 4: Opening Stock Registration */}
          {(isAdmin || isManager || isAssistantManager || isStoreManager) && (
            <button
              onClick={() => setActiveTab('opening_stock')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'opening_stock'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" /> Opening Stock (Sec. 4)
            </button>
          )}

          {/* Section 8: Acceptance Tests Suite */}
          <button
            onClick={() => setActiveTab('acceptance_tests')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'acceptance_tests'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-emerald-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 16 Acceptance Tests
          </button>

          {(isAdmin || isCashier || isStoreManager || isManager) && (
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'payments'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Cashier: Payment Reconciliations
            </button>
          )}

          <button
            onClick={() => setActiveTab('deliveries')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'deliveries'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" /> Agent: Production Site Truck Issuance
          </button>

          {(isAdmin || isStoreManager) && (
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" /> Cement Catalog Prices
            </button>
          )}

          {(isAdmin || isManager) && (
            <>
              <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Executive Management
              </div>
              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'staff'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> Staff & RBAC Accounts
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Immutable Audit Trail
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" /> Depots & Fee Settings
              </button>
            </>
          )}
        </aside>

        {/* Workspace Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && analytics && (
            <div className="space-y-6">
              {/* Top Financial Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400 block">Total Verified Revenue</span>
                  <span className="text-2xl font-black text-amber-400 font-['Plus_Jakarta_Sans']">
                    ₦{analytics.metrics.totalRevenueNGN.toLocaleString('en-NG')}
                  </span>
                  <span className="text-[11px] text-emerald-400 mt-1 block">From verified bank & online payments</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400 block">Total Cement Bags Sold</span>
                  <span className="text-2xl font-black text-white font-['Plus_Jakarta_Sans']">
                    {analytics.metrics.totalBagsSold.toLocaleString()} Bags
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                    ~{((analytics.metrics.totalBagsSold * 50) / 1000).toFixed(1)} Metric Tonnes
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400 block">Available Depot Stock</span>
                  <span className="text-2xl font-black text-cyan-400 font-['Plus_Jakarta_Sans']">
                    {analytics.metrics.totalStockBagsOnHand.toLocaleString()} Bags
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Valuation: ₦{analytics.metrics.stockValuationNGN.toLocaleString('en-NG')}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400 block">Pending Orders Requiring Action</span>
                  <span className="text-2xl font-black text-rose-400 font-['Plus_Jakarta_Sans']">
                    {analytics.metrics.pendingOrdersCount + analytics.metrics.activeProcessingOrdersCount}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {analytics.metrics.pendingOrdersCount} awaiting payment • {analytics.metrics.activeProcessingOrdersCount} processing
                  </span>
                </div>
              </div>

              {/* Brand Distribution & Payment Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                    Brand Sales Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.brandSales as Record<string, { bags: number; revenueNGN: number }>).map(
                      ([brand, stats]) => (
                        <div key={brand} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block text-sm">{brand}</span>
                            <span className="text-xs text-slate-400">{stats.bags} Bags Sold</span>
                          </div>
                          <span className="font-bold text-amber-400 font-mono text-sm">
                            ₦{stats.revenueNGN.toLocaleString('en-NG')}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                    Payment Method Reconciliations
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      analytics.paymentMethodStats as Record<string, { count: number; totalNGN: number }>
                    ).map(([method, stats]) => (
                      <div key={method} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block text-sm">{method.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-400">{stats.count} Verified Transactions</span>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono text-sm">
                          ₦{stats.totalNGN.toLocaleString('en-NG')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Customer Orders Management</h2>
                  <p className="text-xs text-slate-400">Review line items, confirm payments, and dispatch cement orders</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Order No</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Bags / Weight</th>
                      <th className="p-3.5">Fulfillment</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{o.orderNumber}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{o.customerName}</span>
                          <span className="text-[11px] text-slate-400">{o.customerPhone}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{o.totalTrailers} trailer(s)</span>
                          <span className="text-[11px] text-emerald-400 font-mono">
                            {o.totalBags.toLocaleString()} bags ({o.totalTonnes}T)
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-xs font-semibold text-slate-300 block">
                            {o.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? 'Articulated Haulage' : 'Factory Gate Collection'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {o.fulfillmentType === 'FACTORY_TRAILER_HAULAGE'
                              ? o.deliveryDetails?.city || 'Interstate'
                              : o.collectionDetails?.plantDepotLocation?.split(',')[0] || 'Kalambaina Depot'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold font-mono text-white">
                          ₦{o.totalAmount.toLocaleString('en-NG')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              o.status === 'COMPLETED' || o.status === 'DELIVERED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : o.status === 'CANCELLED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : o.status === 'PAID'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => onViewOrderReceipt(o)}
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                            title="View Waybill & Gate Pass"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Section 1 & 5: Manager Order Approval Controls */}
                          {(o.managerApprovalStatus === 'PENDING_REVIEW' || o.status === 'PENDING_APPROVAL') && (
                            <>
                              {(isManager || isAdmin) ? (
                                <>
                                  <button
                                    onClick={() => handleManagerApproveOrder(o.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px]"
                                    title="Manager Approval: Atomically reserve stock in terminal"
                                  >
                                    Approve & Reserve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectOrderModal(o);
                                      setOrderRejectionReason('');
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px]"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-amber-400 font-sans italic">
                                  Awaiting Manager Approval
                                </span>
                              )}
                            </>
                          )}

                          {/* Section 1 & 6: 100% Full Payment Verification */}
                          {(o.status === 'APPROVED_AWAITING_PAYMENT' || o.status === 'PENDING_PAYMENT' || o.status === 'PAYMENT_UNDER_VERIFICATION') && (isAdmin || isCashier || isManager || isStoreManager) && (
                            <button
                              onClick={() => {
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  orderId: o.id,
                                  amount: o.totalAmount,
                                  payerName: o.customerName || prev.payerName,
                                  referenceNumber: 'ZEN-REF-' + Math.floor(100000 + Math.random() * 900000),
                                }));
                                setShowRecordPaymentModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px]"
                            >
                              Verify 100% Payment
                            </button>
                          )}

                          {/* Section 1 & 6: Agent Physical Cement Issuance (Truck by Truck) */}
                          {(o.status === 'PAID' || o.status === 'PARTIALLY_ISSUED') && (
                            <>
                              {(isAgent || isAdmin) ? (
                                (() => {
                                  const nextPendingAlloc = o.truckAllocations?.find((a) => a.status === 'PENDING_ISSUANCE');
                                  if (nextPendingAlloc) {
                                    return (
                                      <button
                                        onClick={() => {
                                          setIssuingModalData({ order: o, allocation: nextPendingAlloc });
                                          setIssuingForm((prev) => ({
                                            ...prev,
                                            recipientSignatureName: o.customerName,
                                          }));
                                        }}
                                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-[11px] shadow-sm animate-pulse"
                                        title={`Issue ${nextPendingAlloc.truckLabel} (600 bags)`}
                                      >
                                        Issue {nextPendingAlloc.truckLabel} (Agent)
                                      </button>
                                    );
                                  }
                                  return null;
                                })()
                              ) : (
                                <span className="text-[10px] text-teal-400 font-sans font-bold">
                                  Ready for Agent Issuance ({o.issuedTrucksCount || 0}/{o.totalTrailers} Issued)
                                </span>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: Staff Stock Registration Module */}
          {activeTab === 'stock_registration' && (
            <StockRegistrationTab
              products={products}
              receipts={stockReceipts}
              onRefresh={loadAllData}
              onNotification={showNotification}
            />
          )}

          {/* Section 4: Opening Stock Baseline Registration */}
          {activeTab === 'opening_stock' && (
            <OpeningStockTab
              products={products}
              entries={openingStockEntries}
              onRefresh={loadAllData}
              onNotification={showNotification}
            />
          )}

          {/* Section 8: Automated Acceptance Tests Suite */}
          {activeTab === 'acceptance_tests' && (
            <AcceptanceTestsTab
              onNotification={showNotification}
              onRefreshParent={loadAllData}
            />
          )}

          {/* TAB 3: INVENTORY & STOCK MOVEMENTS */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Authoritative Cement Inventory Ledger</h2>
                  <p className="text-xs text-slate-400">Track trailer deliveries from plants, stock reservations, and adjustments</p>
                </div>
                {(isAdmin || isStoreManager) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAdjustStockModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      Damage / Audit Adjustment
                    </button>
                    <button
                      onClick={() => setShowReceiveGoodsModal(true)}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Receive Factory Trailer
                    </button>
                  </div>
                )}
              </div>

              {/* Stock Balances Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => {
                  const isLow = p.availableTrailers <= p.reorderLevelTrailers;
                  return (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{p.brand}</span>
                          <h4 className="text-sm font-bold text-white">{p.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">{p.sku}</span>
                        </div>
                        {isLow ? (
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">
                            Low Supply ({p.availableTrailers} TRL)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                            Yard Ready ({p.availableTrailers} TRL)
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Available Trailers:</span>
                          <span className="text-base font-black text-white">{p.availableTrailers} trailers</span>
                          <span className="text-[10px] text-slate-500 block">{(p.availableTrailers * p.bagsPerTrailer).toLocaleString()} bags</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Reserved Trailers:</span>
                          <span className="text-base font-bold text-amber-400">{p.reservedTrailers} trailers</span>
                          <span className="text-[10px] text-slate-500 block">{(p.reservedTrailers * p.bagsPerTrailer).toLocaleString()} bags</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Immutable Movement Ledger Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Immutable Stock Movements Ledger (Trailers & Bags)
                  </h3>
                  <span className="text-xs text-slate-400">{stockMovements.length} logged events</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Movement Type</th>
                      <th className="p-3 text-center">Trailer Change</th>
                      <th className="p-3 text-center">Resulting Trailers</th>
                      <th className="p-3">Authorized By</th>
                      <th className="p-3">Reason / Details</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {stockMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-amber-400">{m.movementReference}</td>
                        <td className="p-3 font-sans font-semibold text-white">{m.productName}</td>
                        <td className="p-3 font-sans">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {m.movementType}
                          </span>
                        </td>
                        <td className={`p-3 text-center font-bold ${(m.quantityTrucks || m.trailerChange || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {(m.quantityTrucks || m.trailerChange || 0) > 0 ? `+${m.quantityTrucks || m.trailerChange} TRL` : `${m.quantityTrucks || m.trailerChange || 0} TRL`}
                        </td>
                        <td className="p-3 text-center text-white">{m.resultingPhysicalBags ? `${Math.floor(m.resultingPhysicalBags / 600)} TRL (${m.resultingPhysicalBags.toLocaleString()} bags)` : `${m.resultingTrailers || 0} TRL`}</td>
                        <td className="p-3 font-sans text-slate-300">{m.approvingUserName || m.authorizedByName || m.userResponsibleName} ({m.approvingUserRole || m.userRole})</td>
                        <td className="p-3 font-sans text-slate-400 max-w-xs truncate">{m.reason}</td>
                        <td className="p-3 text-slate-500">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENTS & CASHIER DESK */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Cashier & Accounts Payment Reconciliation</h2>
                  <p className="text-xs text-slate-400">Reconcile bank transfers, POS slips, and online Paystack settlements</p>
                </div>
              </div>

              {/* Payments List Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Payment ID</th>
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Amount (₦)</th>
                      <th className="p-3.5">Verification Details</th>
                      <th className="p-3.5">Verified By</th>
                      <th className="p-3.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono text-slate-400">{p.id}</td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">{p.orderNumber}</td>
                        <td className="p-3.5 font-bold text-white">{p.customerName}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-extrabold text-emerald-400">
                          ₦{p.amount.toLocaleString('en-NG')}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {p.bankTransferReference && `Ref: ${p.bankTransferReference}`}
                          {p.gatewayReference && `Gateway: ${p.gatewayReference}`}
                          {p.posTerminalId && `POS: ${p.posTerminalId}`}
                        </td>
                        <td className="p-3.5 text-slate-300">{p.verifiedByStaffName}</td>
                        <td className="p-3.5 text-slate-500 font-mono">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DELIVERIES & DISPATCH */}
          {activeTab === 'deliveries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Agent Kalambaina Plant Gate Clearance &amp; Loading</h2>
                  <p className="text-xs text-slate-400">Haruna Danladi physically inspects arriving customer rigs, verifies gate passes, and loads 600 bags per trailer</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Ex-Factory Policy:</strong> A.A. Master Nig. Limited does not handle delivery. All arriving rigs are customer-dispatched commercial transporters.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliveries.map((del) => {
                  const isDispatched = del.status === 'DISPATCHED' || del.status === 'FULLY_ISSUED';
                  const isDelivered = del.status === 'DELIVERED' || del.status === 'COMPLETED';
                  const contactPerson = del.deliveryDetails?.recipientName || del.customerName;
                  const contactPhone = del.deliveryDetails?.recipientPhone || del.customerPhone;
                  const truckHead = del.collectionDetails?.truckHeadReg || del.deliveryDetails?.truckTractorHeadReg || 'PENDING';
                  const trailerBed = del.collectionDetails?.trailerBedReg || del.deliveryDetails?.trailerBedReg || 'FLATBED';

                  return (
                    <div key={del.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-amber-400 block">{del.orderNumber}</span>
                          <span className="text-sm font-bold text-white">{contactPerson}</span>
                          <span className="text-xs text-slate-400 block">{contactPhone}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isDelivered
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isDispatched
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {del.status}
                        </span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                        <p className="text-slate-300">
                          <strong>Loading Terminal:</strong> {del.collectionDetails?.plantDepotLocation || 'Kalambaina Main Plant Loading Terminal'}
                        </p>
                        <p className="text-amber-400 font-mono font-bold">
                          <strong>Gate Pass:</strong> {del.collectionDetails?.collectionPassCode || 'AAM-PASS-ACTIVE'}
                        </p>
                        <p className="text-emerald-400 font-bold">
                          <strong>Allocation:</strong> {del.totalTrailers} Trailer(s) • {del.totalBags.toLocaleString()} bags ({del.totalTonnes}T)
                        </p>
                        <p className="text-slate-300 font-mono pt-1">
                          <strong>Customer Rig:</strong> {truckHead} | {trailerBed}
                        </p>
                        {del.collectionDetails?.driverName && (
                          <p className="text-slate-400">
                            <strong>Driver:</strong> {del.collectionDetails.driverName} ({del.collectionDetails.transporterName})
                          </p>
                        )}
                      </div>

                      {/* Delivery Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onViewOrderReceipt(del)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Waybill
                        </button>

                        {!del.deliveryDetails?.truckTractorHeadReg && (isAdmin || isStoreManager) && (
                          <button
                            onClick={() => setShowAssignDriverModal(del)}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-xs"
                          >
                            Assign Trailer Rig
                          </button>
                        )}

                        {del.status === 'PROCESSING' && del.deliveryDetails?.truckTractorHeadReg && (
                          <button
                            onClick={() => handleDispatchOrder(del.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs"
                          >
                            Dispatch Trailer Rig
                          </button>
                        )}

                        {del.status === 'DISPATCHED' && (
                          <button
                            onClick={() => {
                              setConfirmDeliveryForm({
                                recipientSignatureName: del.deliveryDetails?.recipientName || '',
                                proofOfDeliveryNotes: 'Offloaded and stacked at site.',
                              });
                              setShowConfirmDeliveryModal(del);
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs"
                          >
                            Confirm Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: PRODUCT PRICING & SPECIFICATIONS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Cement Brand & Price Configuration</h2>
                  <p className="text-xs text-slate-400">Update advertised bag prices, min order quantities, and reorder levels</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {p.brand} • Grade {p.grade}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">{p.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">{p.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400 font-mono block">
                          ₦{p.pricePerTrailer.toLocaleString('en-NG')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (₦{p.pricePerBagEquivalent.toLocaleString('en-NG')}/bag eqv)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Available Yard:</span>
                        <span className="font-bold text-white">{p.availableTrailers} trailers</span>
                        <span className="text-[10px] text-slate-500 block">{(p.availableTrailers * p.bagsPerTrailer).toLocaleString()} bags</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Reorder Threshold:</span>
                        <span className="font-bold text-amber-400">{p.reorderLevelTrailers} trailers</span>
                        <span className="text-[10px] text-slate-500 block">Depot trigger</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Min Purchase:</span>
                        <span className="font-bold text-emerald-400">{p.minOrderTrailers} trailer</span>
                        <span className="text-[10px] text-slate-500 block">600 bags (30T)</span>
                      </div>
                    </div>

                    {/* Inline Quick Price Update for Store Manager */}
                    <div className="pt-2 flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <label className="text-[11px] text-slate-400 whitespace-nowrap">Trailer Price (₦):</label>
                        <input
                          type="number"
                          defaultValue={p.pricePerTrailer}
                          id={`price_${p.id}`}
                          className="w-40 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const input = document.getElementById(`price_${p.id}`) as HTMLInputElement;
                          const newPrice = Number(input.value);
                          if (newPrice > 0) {
                            try {
                              await apiProducts.update(p.id, {
                                pricePerTrailer: newPrice,
                                pricePerBagEquivalent: Math.round(newPrice / p.bagsPerTrailer),
                              });
                              showNotification('success', `Trailer price updated for ${p.name} to ₦${newPrice.toLocaleString('en-NG')}`);
                              loadAllData();
                            } catch (err: any) {
                              showNotification('error', err.message || 'Price update failed');
                            }
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors"
                      >
                        Update Trailer Price
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: STAFF MANAGEMENT (ADMIN ONLY) */}
          {activeTab === 'staff' && isAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Staff Accounts & RBAC Directory</h2>
                  <p className="text-xs text-slate-400">Manage store managers, sales officers, cashiers, and drivers</p>
                </div>
                <button
                  onClick={() => setShowCreateStaffModal(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Staff Member
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Assigned Role</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-white">{s.fullName}</td>
                        <td className="p-3.5 text-slate-400 font-mono">{s.email}</td>
                        <td className="p-3.5 text-slate-300">{s.phone}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                            {s.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT TRAIL (ADMIN ONLY) */}
          {activeTab === 'audit' && isAdmin && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">System Security & Audit Log</h2>
                <p className="text-xs text-slate-400">Immutable chronological record of administrative actions, stock movements, and financial approvals</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Event Details</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-sans">
                          <span className="font-bold text-white block">{log.userName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.userRole}</span>
                        </td>
                        <td className="p-3 text-amber-400 font-bold">{log.action}</td>
                        <td className="p-3 text-slate-300">{log.entityType} ({log.entityId})</td>
                        <td className="p-3 font-sans text-slate-300 max-w-md">{log.details}</td>
                        <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS & DELIVERY MATRIX */}
          {activeTab === 'settings' && isAdmin && businessSettings && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Business Settings & Delivery Fee Matrix</h2>
                <p className="text-xs text-slate-400">Configure Zenith Bank account details, depot locations, and regional haulage fees</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Official Corporate Profile & Banking
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Company Name:</span>
                      <span className="font-bold text-white">{businessSettings.storeName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Registration (CAC RC):</span>
                      <span className="font-mono text-white">{businessSettings.rcNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Bank Account:</span>
                      <span className="font-bold text-emerald-400">
                        {businessSettings.bankAccount.bankName} • {businessSettings.bankAccount.accountNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Interstate Trailer Haulage Zones & Transit Times
                  </h3>
                  {businessSettings.interstateHaulageZones?.map((z) => (
                    <div key={z.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white block">{z.name}</span>
                        <span className="text-[10px] text-slate-400">Est: {z.estimatedDeliveryDays}</span>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold block mt-1">
                        ₦{z.haulageFeePerTrailer.toLocaleString()} / 30-Ton Trailer
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: RECEIVE GOODS (FACTORY KILN LINE DISPATCH) */}
      {showReceiveGoodsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" /> Receive Factory Kiln Production (Kalambaina Plant)
              </h3>
              <button onClick={() => setShowReceiveGoodsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReceiveGoods} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Select Sokoto Cement Product</label>
                <select
                  value={receiveForm.productId}
                  onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Trailers Received (600 Bags / 30T each)</label>
                  <input
                    type="number"
                    min={1}
                    value={receiveForm.trailersReceived}
                    onChange={(e) => setReceiveForm({ ...receiveForm, trailersReceived: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold font-mono"
                  />
                  <span className="text-[10px] text-emerald-400">{(receiveForm.trailersReceived * 600).toLocaleString()} bags total</span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.batchNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                    placeholder="e.g. SKT-KLB-2026-B08"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Plant Kiln Reference Line</label>
                <input
                  type="text"
                  required
                  value={receiveForm.plantKilnReference}
                  onChange={(e) => setReceiveForm({ ...receiveForm, plantKilnReference: e.target.value })}
                  placeholder="e.g. Kalambaina Kiln Line 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Receipt Notes / Quality Inspection</label>
                <input
                  type="text"
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  placeholder="e.g. Lab tested 42.5 MPa, verified valve bags intact"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveGoodsModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Confirm Trailer Batch Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Stock Adjustment / Depot Audit
              </h3>
              <button onClick={() => setShowAdjustStockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Select Product</label>
                <select
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.availableTrailers} trailers / {(p.availableTrailers * p.bagsPerTrailer).toLocaleString()} bags)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Adjustment Type</label>
                  <select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="DAMAGED_BAGS_REPACKED">Damaged Bags Repacked</option>
                    <option value="DEPOT_AUDIT_ADJUSTMENT">Depot Audit Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Trailer Change (Negative for deduction)</label>
                  <input
                    type="number"
                    value={adjustForm.trailerChange}
                    onChange={(e) => setAdjustForm({ ...adjustForm, trailerChange: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Trailers (1 TRL = 600 bags)</span>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason & Supporting Audit Notes</label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. 1 trailer re-bagged under quality control due to rain cover tear"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CASHIER PAYMENT VERIFICATION */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Cashier Payment Verification
              </h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordOfflinePayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (Credit Alert)</option>
                    <option value="CASH_AT_STORE">Cash at Depot Register</option>
                    <option value="POS_TERMINAL">POS Terminal Slip</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Amount Reconciled (₦)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Transaction Ref / POS Terminal Ref</label>
                <input
                  type="text"
                  required
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Payer Account / Customer Name</label>
                <input
                  type="text"
                  value={paymentForm.payerName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                  placeholder="e.g. Babatunde Raji"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Confirm & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN DRIVER & ARTICULATED RIG */}
      {showAssignDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" /> Assign 30-Ton Trailer Rig & Driver
              </h3>
              <button onClick={() => setShowAssignDriverModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignDriver} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Articulated Fleet Captain / Driver</label>
                <select
                  value={driverForm.deliveryOfficerId}
                  onChange={(e) => setDriverForm({ ...driverForm, deliveryOfficerId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="usr_driver_001">Haruna Danladi (Articulated Fleet Captain)</option>
                  <option value="usr_driver_002">Bello Gusau (Kalambaina Heavy Rig Master)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Truck Tractor Head Reg</label>
                  <input
                    type="text"
                    required
                    value={driverForm.truckTractorHeadReg}
                    onChange={(e) => setDriverForm({ ...driverForm, truckTractorHeadReg: e.target.value })}
                    placeholder="e.g. SKK-782-XA"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Trailer Bed Reg</label>
                  <input
                    type="text"
                    required
                    value={driverForm.trailerBedReg}
                    onChange={(e) => setDriverForm({ ...driverForm, trailerBedReg: e.target.value })}
                    placeholder="e.g. T-904-SOK"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={driverForm.driverPhone}
                  onChange={(e) => setDriverForm({ ...driverForm, driverPhone: e.target.value })}
                  placeholder="e.g. +234 812 555 6677"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignDriverModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Assign to Rig
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRM PROOF OF DELIVERY */}
      {showConfirmDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Confirm Delivery at Site
              </h3>
              <button onClick={() => setShowConfirmDeliveryModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmDelivery} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Recipient Name (Person Signing on Site)</label>
                <input
                  type="text"
                  required
                  value={confirmDeliveryForm.recipientSignatureName}
                  onChange={(e) =>
                    setConfirmDeliveryForm({ ...confirmDeliveryForm, recipientSignatureName: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Proof of Delivery Notes / Condition</label>
                <input
                  type="text"
                  required
                  value={confirmDeliveryForm.proofOfDeliveryNotes}
                  onChange={(e) =>
                    setConfirmDeliveryForm({ ...confirmDeliveryForm, proofOfDeliveryNotes: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDeliveryModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Sign Off Waybill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE STAFF ACCOUNT */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Create Staff Account
              </h3>
              <button onClick={() => setShowCreateStaffModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.fullName}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Assigned Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="STORE_MANAGER">Store Manager</option>
                    <option value="SALES_OFFICER">Sales Officer</option>
                    <option value="CASHIER">Cashier / Accounts Officer</option>
                    <option value="DELIVERY_OFFICER">Delivery Officer / Driver</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGER ORDER REJECTION */}
      {rejectOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <X className="w-5 h-5 text-rose-500" /> Reject Customer Order
            </h3>
            <p className="text-xs text-slate-300">
              Rejecting Order <strong className="text-amber-400">{rejectOrderModal.orderNumber}</strong> for{' '}
              <strong className="text-white">{rejectOrderModal.customerName}</strong> ({rejectOrderModal.totalTrailers} trucks / {rejectOrderModal.totalBags.toLocaleString()} bags).
            </p>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                required
                value={orderRejectionReason}
                onChange={(e) => setOrderRejectionReason(e.target.value)}
                placeholder="State supply constraints, compliance issues, or customer cancellation request..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectOrderModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManagerRejectOrder}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGENT PHYSICAL CEMENT ISSUANCE */}
      {issuingModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-400" /> Physical Cement Issuance (Agent Only)
                </h3>
                <p className="text-xs text-slate-400">
                  {issuingModalData.allocation.truckLabel} — Order {issuingModalData.order.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setIssuingModalData(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-teal-950/40 border border-teal-800/50 p-3 rounded-xl text-xs text-teal-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-teal-200">
                <Check className="w-4 h-4 text-emerald-400" /> Mandatory Physical Gate Deduction
              </div>
              <p>
                Issuing this payload deducts exactly <strong>600 bags (30 tonnes)</strong> from physical inventory and issues official factory gate pass code: <code className="text-amber-400 font-mono">{issuingModalData.allocation.waybillPassCode}</code>.
              </p>
            </div>

            <form onSubmit={handleAgentIssueTruck} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Truck Tractor Head Reg *</label>
                  <input
                    type="text"
                    required
                    value={issuingForm.truckHeadReg}
                    onChange={(e) => setIssuingForm({ ...issuingForm, truckHeadReg: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trailer Bed Reg *</label>
                  <input
                    type="text"
                    required
                    value={issuingForm.trailerBedReg}
                    onChange={(e) => setIssuingForm({ ...issuingForm, trailerBedReg: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={issuingForm.driverName}
                    onChange={(e) => setIssuingForm({ ...issuingForm, driverName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver Phone Number</label>
                  <input
                    type="text"
                    value={issuingForm.driverPhone}
                    onChange={(e) => setIssuingForm({ ...issuingForm, driverPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Receiving Buyer / Representative Name *</label>
                <input
                  type="text"
                  required
                  value={issuingForm.recipientSignatureName}
                  onChange={(e) => setIssuingForm({ ...issuingForm, recipientSignatureName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issuance Notes</label>
                <textarea
                  rows={2}
                  value={issuingForm.notes}
                  onChange={(e) => setIssuingForm({ ...issuingForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIssuingModalData(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Issue Truck (Deduct 600 Bags)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
