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
  DollarSign,
  Edit3,
  KeyRound,
  UserCheck,
  UserX,
  Trash2,
  Copy,
  Shield,
  Lock,
  LogOut,
  Phone,
  Mail,
  Filter,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Info,
  Printer,
  Landmark,
  Receipt
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
  const { user, isAdmin, isManager, isAssistantManager, isAgent, isStoreManager, isSalesOfficer, isDeliveryOfficer, switchUserRoleDemo, logout } = useAuth();

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
  const [customerList, setCustomerList] = useState<User[]>([]);
  const [userDirectoryTab, setUserDirectoryTab] = useState<'staff' | 'customers'>('staff');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

  // Strict RBAC: Automatically enforce authorized view when switching roles
  useEffect(() => {
    if (isAgent && !['deliveries', 'orders', 'acceptance_tests'].includes(activeTab)) {
      setActiveTab('deliveries');
    } else if (isAssistantManager && !['orders', 'stock_registration', 'inventory', 'opening_stock', 'acceptance_tests'].includes(activeTab)) {
      setActiveTab('orders');
    }
  }, [user?.role, isAgent, isAssistantManager]);

  // Modals inside dashboard
  // Enhanced Payment Reconciliation state
  const [paymentSubTab, setPaymentSubTab] = useState<'pending' | 'reconciled' | 'treasury'>('reconciled');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [viewingPaymentReceipt, setViewingPaymentReceipt] = useState<PaymentRecord | null>(null);
  const [receiptModalMode, setReceiptModalMode] = useState<'receipt' | 'audit'>('receipt');
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);

  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState<Order | null>(null);
  const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState<Order | null>(null);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);



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
    role: 'ASSISTANT_MANAGER' as UserRole,
  });

  // Staff & RBAC Accounts Module States
  const [staffSubTab, setStaffSubTab] = useState<'directory' | 'matrix' | 'protocols'>('directory');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('ALL');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [editStaffForm, setEditStaffForm] = useState<{
    fullName: string;
    phone: string;
    role: UserRole;
    isActive: boolean;
  }>({
    fullName: '',
    phone: '',
    role: 'MANAGER',
    isActive: true,
  });

  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);

  const [deleteStaffTarget, setDeleteStaffTarget] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      }

      if (isAdmin || isStoreManager || isSalesOfficer || isManager || isAssistantManager) {
        const movRes = await apiInventory.getMovements().catch(() => ({ movements: [] }));
        setStockMovements(movRes.movements);
      }

      if (isAdmin || isStoreManager || isManager) {
        const payRes = await apiPayments.getAll().catch(() => ({ payments: [] }));
        setPayments(payRes.payments);
      }

      if (isAdmin || isStoreManager || isDeliveryOfficer || isSalesOfficer || isAgent) {
        const delRes = await apiDeliveries.getAll().catch(() => ({ deliveries: [] }));
        setDeliveries(delRes.deliveries);
      }

      if (isAdmin || isManager) {
        const [logsRes, staffRes, customersRes, settingsRes] = await Promise.all([
          apiReports.getAuditLogs().catch(() => ({ logs: [] })),
          apiAuth.getStaff().catch(() => ({ staff: [] })),
          apiAuth.getCustomers().catch(() => ({ customers: [] })),
          apiReports.getSettings().catch(() => ({ settings: null })),
        ]);
        setAuditLogs(logsRes.logs);
        setStaffList(staffRes.staff);
        setCustomerList(customersRes.customers);
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
      setNewStaffForm({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'SALES_OFFICER' as UserRole,
      });
      setShowCreateStaffModal(false);
      setNewStaffForm({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'ASSISTANT_MANAGER',
      });
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create staff');
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await apiAuth.updateStaff(editingStaff.id, editStaffForm);
      showNotification('success', `Staff member ${editStaffForm.fullName} profile updated!`);
      setEditingStaff(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update staff');
    }
  };

  const handleToggleStaffStatus = async (targetStaff: User) => {
    try {
      const res = await apiAuth.toggleStaffStatus(targetStaff.id);
      showNotification('success', res.message || `Status updated for ${targetStaff.fullName}`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update account status');
    }
  };

  const handleResetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordTarget) return;
    try {
      const res = await apiAuth.resetStaffPassword(resetPasswordTarget.id, customPasswordInput || undefined);
      setGeneratedTempPassword(res.temporaryPassword || customPasswordInput || 'Password updated');
      showNotification('success', `Password successfully updated for ${resetPasswordTarget.fullName}!`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset password');
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaffTarget) return;
    try {
      await apiAuth.deleteStaff(deleteStaffTarget.id);
      showNotification('success', `Staff account for ${deleteStaffTarget.fullName} deleted.`);
      setDeleteStaffTarget(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to remove staff member');
    }
  };

  const handleSwitchToStaffDemo = async (role: UserRole, staffName: string) => {
    try {
      await switchUserRoleDemo(role);
      showNotification('success', `Switched operator context to ${staffName} (${role})`);
    } catch {
      showNotification('error', `Failed to authenticate into role ${role}`);
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
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-white">A.A. Master Nig. Limited — Operations Portal</h1>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                user?.role === 'MANAGER'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                  : user?.role === 'ASSISTANT_MANAGER'
                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                  : 'bg-teal-950/80 text-teal-300 border-teal-700'
              }`}>
                {user?.role === 'MANAGER' && '👔 Manager (Approval Authority)'}
                {user?.role === 'ASSISTANT_MANAGER' && '📋 Assistant Manager (Queue Review)'}
                {user?.role === 'AGENT' && '🚛 Sales & Issuing Agent (Loading Bay)'}
                {!['MANAGER', 'ASSISTANT_MANAGER', 'AGENT'].includes(user?.role || '') && user?.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kalambaina Plant Wholesale Terminal • Active Operator: <strong className="text-white">{user?.fullName}</strong> ({user?.email})
            </p>
          </div>
        </div>

        {/* Top Header Actions & RBAC Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Quick RBAC Role Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
            <span className="text-[10px] text-slate-500 font-bold px-1.5 uppercase hidden md:inline">RBAC Role:</span>
            <button
              onClick={() => handleSwitchToStaffDemo('MANAGER', 'Uwaisu Musa')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                user?.role === 'MANAGER'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Switch to Depot Manager: Full Order Approvals & Financial Reconciliations"
            >
              👔 Manager
            </button>
            <button
              onClick={() => handleSwitchToStaffDemo('ASSISTANT_MANAGER', 'Mamuda Ahmed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                user?.role === 'ASSISTANT_MANAGER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Switch to Assistant Manager: Queue Review & Document Audit"
            >
              📋 Asst. Mgr
            </button>
            <button
              onClick={() => handleSwitchToStaffDemo('AGENT', 'Isiyaka Sulaiman')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                user?.role === 'AGENT'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Switch to Sales & Issuing Agent: Weighbridge & Truck Gate Clearance"
            >
              🚛 Sales Agent
            </button>
          </div>

          <button
            onClick={loadAllData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={async () => {
              await logout();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl border border-rose-800/80 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors"
            title="Sign Out to Public Storefront"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md transition-colors"
          >
            Back to Storefront
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
          {(isAdmin || isManager) && (
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
          {(isAdmin || isManager || isAssistantManager) && !isAgent && (
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
            <ShoppingBag className="w-4 h-4" /> {isAgent ? "Loading Bay Dispatch Queue" : isAssistantManager ? "Orders & Queue Review" : "Orders & Approvals"}
            {orders.filter((o) => o.managerApprovalStatus === 'PENDING_REVIEW' || o.status === 'PAID').length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {orders.filter((o) => o.managerApprovalStatus === 'PENDING_REVIEW' || o.status === 'PAID').length}
              </span>
            )}
          </button>

          {(isAdmin || isManager || isAssistantManager) && !isAgent && (
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
          {(isAdmin || isManager || isAssistantManager) && !isAgent && (
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

          {(isAdmin || isManager) && (
            (() => {
            const pendingOrdersCount = orders.filter(
              (o) =>
                o.status === 'PAYMENT_UNDER_VERIFICATION' ||
                o.status === 'APPROVED_AWAITING_PAYMENT' ||
                o.status === 'PENDING_PAYMENT' ||
                (o.managerApprovalStatus === 'APPROVED' && o.status !== 'PAID' && o.status !== 'FULLY_ISSUED' && o.status !== 'CANCELLED')
            ).length;
            return (
              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'payments'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Manager: Payment Reconciliations
                {pendingOrdersCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            );
          })()
          )}

          {(isAdmin || isManager || isAgent) && (
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
          )}

          {(isAdmin || isManager) && (
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
                    Product Grade Sales Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      (analytics.productSales || analytics.brandSales || {}) as Record<
                        string,
                        { bags: number; revenueNGN: number }
                      >
                    ).map(([brand, stats]) => (
                      <div key={brand} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block text-sm">{brand}</span>
                          <span className="text-xs text-slate-400">{(stats?.bags || 0).toLocaleString()} Bags Sold</span>
                        </div>
                        <span className="font-bold text-amber-400 font-mono text-sm">
                          ₦{(stats?.revenueNGN || 0).toLocaleString('en-NG')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                    Payment Method Reconciliations
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      (analytics.paymentMethodStats || {}) as Record<string, { count: number; totalNGN: number }>
                    ).map(([method, stats]) => (
                      <div key={method} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block text-sm">{method.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-400">{stats?.count || 0} Verified Transactions</span>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono text-sm">
                          ₦{(stats?.totalNGN || 0).toLocaleString('en-NG')}
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
                                : o.status === 'PAID' || o.status === 'PARTIALLY_ISSUED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {o.status === 'PAID' || o.status === 'PARTIALLY_ISSUED'
                              ? 'FULLY PAID'
                              : o.status.replace(/_/g, ' ')}
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
                          {(o.status === 'APPROVED_AWAITING_PAYMENT' || o.status === 'PENDING_PAYMENT' || o.status === 'PAYMENT_UNDER_VERIFICATION') && (isAdmin || isManager || isStoreManager) && (
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

          {/* TAB 4: ENHANCED PAYMENTS & TREASURY DESK */}
          {activeTab === 'payments' && (() => {
            const pendingPaymentOrders = orders.filter(
              (o) =>
                o.status === 'PAYMENT_UNDER_VERIFICATION' ||
                o.status === 'APPROVED_AWAITING_PAYMENT' ||
                o.status === 'PENDING_PAYMENT' ||
                (o.managerApprovalStatus === 'APPROVED' && o.status !== 'PAID' && o.status !== 'FULLY_ISSUED' && o.status !== 'CANCELLED')
            );
            const totalReconciledAmount = payments.reduce((acc, p) => acc + p.amount, 0);
            const totalPendingAmount = pendingPaymentOrders.reduce((acc, o) => acc + o.totalAmount, 0);

            const filteredPayments = payments.filter((p) => {
              const matchesSearch =
                !paymentSearchQuery.trim() ||
                p.orderNumber.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                p.customerName.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                (p.bankTransferReference && p.bankTransferReference.toLowerCase().includes(paymentSearchQuery.toLowerCase())) ||
                (p.bankPayerName && p.bankPayerName.toLowerCase().includes(paymentSearchQuery.toLowerCase()));

              const matchesMethod =
                paymentMethodFilter === 'ALL' || p.paymentMethod === paymentMethodFilter;

              return matchesSearch && matchesMethod;
            });

            return (
              <div className="space-y-6">
                {/* Header with Direct Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                      <CreditCard className="w-4 h-4" /> Manager Treasury &amp; Payment Reconciliation
                    </div>
                    <h2 className="text-xl font-black text-white mt-1">
                      Zenith Bank 100% Upfront Wire Reconciliation
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                      Cross-check wholesale orders against Zenith Bank corporate credit alerts. Reconcile 100% full invoice values, clear customer payment claims, and audit authoritative treasury settlement slips.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      onClick={() => {
                        const firstPending = pendingPaymentOrders[0];
                        if (firstPending) {
                          setPaymentForm({
                            orderId: firstPending.id,
                            amount: firstPending.totalAmount,
                            paymentMethod: 'BANK_TRANSFER',
                            referenceNumber: firstPending.bankTransferReference || 'ZEN-TX-' + Math.floor(10000000 + Math.random() * 90000000),
                            payerName: firstPending.customerName,
                            destinationAccount: 'Zenith Bank - 1018492049',
                            notes: `100% full wire transfer reconciled with Zenith Bank credit alert by Manager Uwaisu Musa.`,
                          });
                        } else {
                          setPaymentForm({
                            orderId: '',
                            amount: 0,
                            paymentMethod: 'BANK_TRANSFER',
                            referenceNumber: 'ZEN-TX-' + Math.floor(10000000 + Math.random() * 90000000),
                            payerName: '',
                            destinationAccount: 'Zenith Bank - 1018492049',
                            notes: `Direct wire transfer reconciled with Zenith Bank credit alert by Manager Uwaisu Musa.`,
                          });
                        }
                        setShowRecordPaymentModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4" /> Reconcile Wire Payment
                    </button>

                    <button
                      onClick={loadAllData}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                      title="Refresh Inflows &amp; Reconciliations"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Top Executive Treasury KPIs (4 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Total Reconciled */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>Total Reconciled Inflow</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono truncate">
                      ₦{totalReconciledAmount.toLocaleString('en-NG')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {payments.length} Verified Settlement{payments.length === 1 ? '' : 's'} (100% Upfront)
                    </div>
                  </div>

                  {/* KPI 2: Pending Queue */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>Pending Clearance Queue</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono">
                      {pendingPaymentOrders.length} Order{pendingPaymentOrders.length === 1 ? '' : 's'}
                    </div>
                    <div className="text-[10px] text-amber-400 font-semibold mt-1 truncate">
                      ₦{totalPendingAmount.toLocaleString('en-NG')} Awaiting Verification
                    </div>
                  </div>

                  {/* KPI 3: Official Zenith Bank Account */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>Zenith Corporate Treasury</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('1018492049');
                          setCopiedBankAcc(true);
                          setTimeout(() => setCopiedBankAcc(false), 2000);
                        }}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        title="Copy Account Number"
                      >
                        {copiedBankAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBankAcc ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-lg font-black text-white font-mono tracking-wider">
                      1018492049
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      A.A. Master Nig. Ltd • Zenith Bank
                    </div>
                  </div>

                  {/* KPI 4: Treasury Policy */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>Governance Mandate</span>
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-sm font-black text-purple-300 mt-1">
                      100% Upfront Wire Only
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Zero Credit Sales • Cashier Desk Excluded
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Pending Queue vs Reconciled Ledger vs Zenith Details */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setPaymentSubTab('reconciled')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      paymentSubTab === 'reconciled'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Reconciled Transactions Ledger ({payments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSubTab('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      paymentSubTab === 'pending'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Wire Clearance Queue
                    {pendingPaymentOrders.length > 0 && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                        {pendingPaymentOrders.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSubTab('treasury')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      paymentSubTab === 'treasury'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" /> Zenith Treasury Profile &amp; Protocol
                  </button>
                </div>

                {/* SUBTAB 1: PENDING WIRE CLEARANCE QUEUE */}
                {paymentSubTab === 'pending' && (
                  <div className="space-y-4">
                    {pendingPaymentOrders.length === 0 ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-white">All Wholesale Inflows Reconciled</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          There are currently no orders awaiting bank transfer verification. All approved customer orders have been fully paid and cleared for production site issuance.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <strong>Manager Verification Action Required:</strong> {pendingPaymentOrders.length} wholesale order(s) awaiting wire cross-check against Zenith Bank statement.
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            Pending Value: ₦{totalPendingAmount.toLocaleString('en-NG')}
                          </span>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                              <tr>
                                <th className="p-3.5">Order Ref</th>
                                <th className="p-3.5">Customer &amp; Company</th>
                                <th className="p-3.5">Trailers / Quantity</th>
                                <th className="p-3.5">Amount Due (100%)</th>
                                <th className="p-3.5">Customer Bank Reference</th>
                                <th className="p-3.5">Order Status</th>
                                <th className="p-3.5 text-right">Reconciliation Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {pendingPaymentOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="p-3.5 font-mono font-bold text-amber-400">{o.orderNumber}</td>
                                  <td className="p-3.5">
                                    <strong className="text-white block">{o.customerName}</strong>
                                    <span className="text-[11px] text-slate-400">{o.companyName || o.customerPhone}</span>
                                  </td>
                                  <td className="p-3.5 font-mono text-slate-300">
                                    {o.totalTrailers} Truck{o.totalTrailers > 1 ? 's' : ''} ({o.totalBags.toLocaleString()} Bags)
                                  </td>
                                  <td className="p-3.5 font-mono font-black text-amber-400 text-sm">
                                    ₦{o.totalAmount.toLocaleString('en-NG')}
                                  </td>
                                  <td className="p-3.5">
                                    {o.bankTransferReference ? (
                                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                                        Ref: {o.bankTransferReference}
                                      </span>
                                    ) : o.notes && o.notes.includes('Ref:') ? (
                                      <span className="font-mono text-amber-300 text-[11px] block max-w-xs truncate">
                                        {o.notes}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 italic text-[11px]">Awaiting proof submission</span>
                                    )}
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse">
                                      {o.status.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      onClick={() => {
                                        setPaymentForm({
                                          orderId: o.id,
                                          amount: o.totalAmount,
                                          paymentMethod: 'BANK_TRANSFER',
                                          referenceNumber: o.bankTransferReference || 'ZEN-TX-' + Math.floor(10000000 + Math.random() * 90000000),
                                          payerName: o.customerName,
                                          destinationAccount: 'Zenith Bank - 1018492049',
                                          notes: `100% full wire transfer reconciled with Zenith Bank credit alert by Manager Uwaisu Musa.`,
                                        });
                                        setShowRecordPaymentModal(true);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 ml-auto shadow-md"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Reconcile &amp; Clear Payment
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 2: RECONCILED TRANSACTIONS LEDGER */}
                {paymentSubTab === 'reconciled' && (
                  <div className="space-y-4">
                    {/* Search and Filters */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={paymentSearchQuery}
                          onChange={(e) => setPaymentSearchQuery(e.target.value)}
                          placeholder="Search by Payment ID, Order Number, Customer, Bank Reference..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        {paymentSearchQuery && (
                          <button
                            onClick={() => setPaymentSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                          <Filter className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">All Payment Channels</option>
                            <option value="BANK_TRANSFER">Zenith Bank Transfer</option>
                            <option value="PAYSTACK_CARD">Online Paystack</option>
                            <option value="POS_TERMINAL">POS Slip</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Payments Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                      {filteredPayments.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          No payments found matching your search.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="p-3.5">Payment ID</th>
                              <th className="p-3.5">Order Ref</th>
                              <th className="p-3.5">Customer &amp; Payer</th>
                              <th className="p-3.5">Channel</th>
                              <th className="p-3.5">Amount Reconciled (₦)</th>
                              <th className="p-3.5">Bank Reference / Details</th>
                              <th className="p-3.5">Verified By</th>
                              <th className="p-3.5">Reconciled Time</th>
                              <th className="p-3.5 text-right">Receipt &amp; Audit Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {filteredPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 font-mono text-slate-400">{p.id}</td>
                                <td className="p-3.5 font-mono font-bold text-amber-400">{p.orderNumber}</td>
                                <td className="p-3.5">
                                  <strong className="text-white block">{p.customerName}</strong>
                                  {p.bankPayerName && p.bankPayerName !== p.customerName && (
                                    <span className="text-[10px] text-slate-400 font-mono block">Payer: {p.bankPayerName}</span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                    p.paymentMethod === 'BANK_TRANSFER'
                                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}>
                                    {p.paymentMethod === 'BANK_TRANSFER' ? '🏦 Zenith Bank Wire' : p.paymentMethod}
                                  </span>
                                </td>
                                <td className="p-3.5 font-mono font-extrabold text-emerald-400 text-sm">
                                  ₦{p.amount.toLocaleString('en-NG')}
                                </td>
                                <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                                  {p.bankTransferReference ? (
                                    <span className="text-white font-bold block">{p.bankTransferReference}</span>
                                  ) : (
                                    p.gatewayReference || p.posTerminalId || 'Confirmed'
                                  )}
                                  <span className="text-[10px] text-slate-500 block">{p.destinationAccount || 'Zenith Bank - 1018492049'}</span>
                                </td>
                                <td className="p-3.5 text-slate-300">
                                  <span className="font-semibold text-white block">{p.verifiedByStaffName || 'Uwaisu Musa'}</span>
                                  <span className="text-[10px] text-emerald-400">Plant Depot Manager</span>
                                </td>
                                <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                                  {new Date(p.createdAt).toLocaleDateString()}
                                  <span className="block text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleTimeString()}</span>
                                </td>
                                <td className="p-3.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setViewingPaymentReceipt(p);
                                        setReceiptModalMode('receipt');
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white text-[11px] font-bold border border-emerald-800 transition-colors flex items-center gap-1 shadow-sm"
                                      title="View &amp; Print Customer Wholesale Payment Receipt"
                                    >
                                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>View / Print Receipt</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setViewingPaymentReceipt(p);
                                        setReceiptModalMode('audit');
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-[11px] font-bold border border-slate-700 transition-colors flex items-center gap-1 shadow-sm"
                                      title="View Treasury Clearance Audit Slip"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Audit Slip</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: ZENITH BANK DETAILS & POLICY */}
                {paymentSubTab === 'treasury' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Zenith Corporate Bank Details */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-5 h-5 text-amber-400" />
                          <h3 className="font-bold text-white text-sm">Official Corporate Treasury Account</h3>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Operational &amp; Active
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Account Number:</span>
                          <div className="flex items-center justify-between mt-1">
                            <strong className="text-xl font-mono text-emerald-400 tracking-wider">1018492049</strong>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText('1018492049');
                                setCopiedBankAcc(true);
                                setTimeout(() => setCopiedBankAcc(false), 2000);
                              }}
                              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold"
                            >
                              {copiedBankAcc ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedBankAcc ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Bank:</span>
                            <strong className="text-white">Zenith Bank PLC</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Branch:</span>
                            <strong className="text-white">Kalambaina Industrial Area, Sokoto</strong>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Account Name:</span>
                          <strong className="text-white">A.A. Master Nig. Limited - Treasury Operations</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Sort Code:</span>
                            <span className="font-mono text-slate-300">057150013</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Currency:</span>
                            <span className="font-mono text-slate-300">NGN (₦)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Treasury Directives */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-white text-sm">Corporate Treasury Governance Mandates</h3>
                      </div>

                      <div className="space-y-3 text-xs text-slate-300">
                        <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl space-y-1">
                          <strong className="text-purple-300 block font-bold">1. 100% Upfront Wire Settlement Only</strong>
                          <p className="text-[11px] text-slate-400">
                            Full invoice payment must be confirmed in Zenith Bank statement before loading pass generation. Partial or deferred payments are strictly blocked by the system.
                          </p>
                        </div>

                        <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-1">
                          <strong className="text-blue-300 block font-bold">2. Elimination of Cashier Desk</strong>
                          <p className="text-[11px] text-slate-400">
                            All physical cash handling at the plant site is prohibited. Wholesale customers wire funds directly to the corporate treasury account.
                          </p>
                        </div>

                        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1">
                          <strong className="text-emerald-300 block font-bold">3. Manager Sole Clearance Authority</strong>
                          <p className="text-[11px] text-slate-400">
                            Manager Uwaisu Musa is the designated executive with bank portal access to verify credit alerts and release dispatch authorization to Agent Isiyaka Sulaiman.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 5: DELIVERIES & DISPATCH */}
          {activeTab === 'deliveries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Agent Kalambaina Plant Gate Clearance &amp; Loading</h2>
                  <p className="text-xs text-slate-400">Isiyaka Sulaiman physically inspects arriving customer rigs, verifies gate passes, and loads 600 bags per trailer</p>
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
                          Sokoto Cement • Factory Direct
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">{p.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">{p.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400 font-mono block">
                          ₦{(p.pricePerTrailer || 6510000).toLocaleString('en-NG')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (₦{(p.pricePerBag || (p as any).pricePerBagEquivalent || 10850).toLocaleString('en-NG')}/bag)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Available Yard:</span>
                        <span className="font-bold text-white">{p.availableTrailers} trailers</span>
                        <span className="text-[10px] text-slate-500 block">{(p.availableTrailers * (p.bagsPerTrailer || 600)).toLocaleString()} bags</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Reorder Threshold:</span>
                        <span className="font-bold text-amber-400">{p.reorderThresholdTrailers ?? (p as any).reorderLevelTrailers ?? 15} trailers</span>
                        <span className="text-[10px] text-slate-500 block">Depot trigger</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Min Purchase:</span>
                        <span className="font-bold text-emerald-400">{p.minimumOrderTrailers ?? (p as any).minOrderTrailers ?? 1} trailer</span>
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
                                pricePerBag: Math.round(newPrice / (p.bagsPerTrailer || 600)),
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

          {/* TAB 7: USER & RBAC MANAGEMENT (ADMIN & MANAGER) */}
          {activeTab === 'staff' && (isAdmin || isManager) && (
            <div className="space-y-6">
              {/* Sub-tab Switcher: Staff vs Customers */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setUserDirectoryTab('staff')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    userDirectoryTab === 'staff'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Staff Personnel ({staffList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserDirectoryTab('customers')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    userDirectoryTab === 'customers'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Registered Customers ({customerList.length})
                </button>
              </div>

              {userDirectoryTab === 'staff' ? (
            <div className="space-y-6">
              {/* Executive Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0a1836] to-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> KALAMBAINA PLANT RBAC DIRECTORY
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Policy Active
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-400" /> Staff &amp; RBAC Accounts
                  </h2>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Authorized identity directory, operational role assignments, credentials governance, and strict separation of duties across A.A. Master Nig. Limited.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={loadAllData}
                    className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    title="Refresh Personnel Directory"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setNewStaffForm({
                        email: '',
                        password: '',
                        fullName: '',
                        phone: '',
                        role: 'ASSISTANT_MANAGER',
                      });
                      setShowCreateStaffModal(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-amber-600/20 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" /> Provision Staff Account
                  </button>
                </div>
              </div>

              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Total Personnel</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {staffList.length}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                    {staffList.filter((s) => s.isActive).length} Active • {staffList.filter((s) => !s.isActive).length} Suspended
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Operational Roles</span>
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    3
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Manager, Asst. Mgr, Issuing Agent
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Depot Manager</span>
                    <KeyRound className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-base font-black text-white truncate">
                    Uwaisu Musa
                  </div>
                  <div className="text-[10px] text-purple-300 mt-1">
                    Chief Approval &amp; Treasury Authority
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Cashier Desk</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-black text-emerald-400 mt-1">
                    Excluded By Policy
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Manager reconciles wire directly
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Directory vs RBAC Matrix vs Operational Directives */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setStaffSubTab('directory')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    staffSubTab === 'directory'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Personnel Directory ({staffList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffSubTab('matrix')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    staffSubTab === 'matrix'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Role &amp; Permission Matrix (RBAC)
                </button>
                <button
                  type="button"
                  onClick={() => setStaffSubTab('protocols')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    staffSubTab === 'protocols'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Kalambaina Plant Protocols
                </button>
              </div>

              {/* SUBTAB 1: PERSONNEL DIRECTORY */}
              {staffSubTab === 'directory' && (
                <div className="space-y-4">
                  {/* Filter and Search Bar */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        placeholder="Search personnel by name, email, phone number, or role..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      {staffSearchQuery && (
                        <button
                          onClick={() => setStaffSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={staffRoleFilter}
                          onChange={(e) => setStaffRoleFilter(e.target.value)}
                          className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Staff ({staffList.length})</option>
                          <option value="MANAGER">Manager (Uwaisu Musa)</option>
                          <option value="ASSISTANT_MANAGER">Assistant Manager (Mamuda Ahmed)</option>
                          <option value="AGENT">Issuing Agent (Isiyaka Sulaiman)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                        <select
                          value={staffStatusFilter}
                          onChange={(e) => setStaffStatusFilter(e.target.value as any)}
                          className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="ACTIVE">Active Only</option>
                          <option value="SUSPENDED">Suspended Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Staff Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    {staffList.filter((s) => {
                      const matchesSearch =
                        !staffSearchQuery.trim() ||
                        s.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                        s.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                        s.phone.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                        s.role.toLowerCase().includes(staffSearchQuery.toLowerCase());

                      const matchesRole =
                        staffRoleFilter === 'ALL' ||
                        s.role === staffRoleFilter ||
                        (staffRoleFilter === 'MANAGER' && (s.role === 'MANAGER' || s.role === 'STORE_MANAGER')) ||
                        (staffRoleFilter === 'ASSISTANT_MANAGER' && (s.role === 'ASSISTANT_MANAGER' || s.role === 'SALES_OFFICER')) ||
                        (staffRoleFilter === 'AGENT' && (s.role === 'AGENT' || s.role === 'DELIVERY_OFFICER'));

                      const matchesStatus =
                        staffStatusFilter === 'ALL' ||
                        (staffStatusFilter === 'ACTIVE' && s.isActive) ||
                        (staffStatusFilter === 'SUSPENDED' && !s.isActive);

                      return matchesSearch && matchesRole && matchesStatus;
                    }).length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <Users className="w-8 h-8 text-slate-600 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-300">No personnel match your search criteria</h4>
                        <p className="text-xs text-slate-500">Try adjusting your keyword or reset filters.</p>
                        <button
                          onClick={() => {
                            setStaffSearchQuery('');
                            setStaffRoleFilter('ALL');
                            setStaffStatusFilter('ALL');
                          }}
                          className="text-xs text-amber-400 underline font-bold mt-2"
                        >
                          Clear all filters
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="p-3.5">Personnel / Identity</th>
                              <th className="p-3.5">Official Contact</th>
                              <th className="p-3.5">Assigned Operational Role</th>
                              <th className="p-3.5">Security Status</th>
                              <th className="p-3.5 text-right">Actions &amp; RBAC Control</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {staffList
                              .filter((s) => {
                                const matchesSearch =
                                  !staffSearchQuery.trim() ||
                                  s.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                  s.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                  s.phone.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                  s.role.toLowerCase().includes(staffSearchQuery.toLowerCase());

                                const matchesRole =
                                  staffRoleFilter === 'ALL' ||
                                  s.role === staffRoleFilter ||
                                  (staffRoleFilter === 'MANAGER' && (s.role === 'MANAGER' || s.role === 'STORE_MANAGER')) ||
                                  (staffRoleFilter === 'ASSISTANT_MANAGER' && (s.role === 'ASSISTANT_MANAGER' || s.role === 'SALES_OFFICER')) ||
                                  (staffRoleFilter === 'AGENT' && (s.role === 'AGENT' || s.role === 'DELIVERY_OFFICER'));

                                const matchesStatus =
                                  staffStatusFilter === 'ALL' ||
                                  (staffStatusFilter === 'ACTIVE' && s.isActive) ||
                                  (staffStatusFilter === 'SUSPENDED' && !s.isActive);

                                return matchesSearch && matchesRole && matchesStatus;
                              })
                              .map((s) => {
                                const isCurrentUser = s.id === user?.id;
                                const isDepotManager = s.role === 'MANAGER' || s.id === 'usr_mgr_001';

                                return (
                                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                                    {/* Personnel Name and Avatar */}
                                    <td className="p-3.5">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-inner ${
                                            s.role === 'ADMIN'
                                              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                                              : s.role === 'MANAGER' || s.role === 'STORE_MANAGER'
                                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                                              : s.role === 'ASSISTANT_MANAGER' || s.role === 'SALES_OFFICER'
                                              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                                              : 'bg-teal-600/20 text-teal-400 border border-teal-500/40'
                                          }`}
                                        >
                                          {s.fullName
                                            .split(' ')
                                            .map((p) => p[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <strong className="text-white font-bold">{s.fullName}</strong>
                                            {isCurrentUser && (
                                              <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase px-1.5 py-0.2 rounded border border-amber-500/30">
                                                You
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                                            <span>{s.email}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(s.email);
                                                setCopiedId(`email_${s.id}`);
                                                setTimeout(() => setCopiedId(null), 2000);
                                              }}
                                              title="Copy email address"
                                              className="text-slate-500 hover:text-slate-300 transition-colors ml-1"
                                            >
                                              {copiedId === `email_${s.id}` ? (
                                                <Check className="w-3 h-3 text-emerald-400" />
                                              ) : (
                                                <Copy className="w-3 h-3" />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="p-3.5">
                                      <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                                        <span>{s.phone}</span>
                                      </div>
                                    </td>

                                    {/* Role Badge */}
                                    <td className="p-3.5">
                                      {s.role === 'ADMIN' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[11px]">
                                          <KeyRound className="w-3 h-3" /> Executive Administrator
                                        </span>
                                      )}
                                      {(s.role === 'MANAGER' || s.role === 'STORE_MANAGER') && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold text-[11px]">
                                          <ShieldCheck className="w-3 h-3" /> 1. Depot Manager (Approval)
                                        </span>
                                      )}
                                      {(s.role === 'ASSISTANT_MANAGER' || s.role === 'SALES_OFFICER') && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold text-[11px]">
                                          <FileText className="w-3 h-3" /> 2. Assistant Manager (Queue)
                                        </span>
                                      )}
                                      {(s.role === 'AGENT' || s.role === 'DELIVERY_OFFICER') && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 font-bold text-[11px]">
                                          <Truck className="w-3 h-3" /> 3. Issuing Agent (Plant Site)
                                        </span>
                                      )}
                                    </td>

                                    {/* Status */}
                                    <td className="p-3.5">
                                      {s.isActive ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                          Operational
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-bold">
                                          <UserX className="w-3 h-3" /> Suspended
                                        </span>
                                      )}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-3.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {/* Switch Demo Context button */}
                                        <button
                                          type="button"
                                          onClick={() => handleSwitchToStaffDemo(s.role, s.fullName)}
                                          title={`Test active UI as ${s.fullName} (${s.role})`}
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold"
                                        >
                                          <ExternalLink className="w-3 h-3 text-amber-400" />
                                          <span className="hidden lg:inline">Test Role</span>
                                        </button>

                                        {/* Edit Profile button */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingStaff(s);
                                            setEditStaffForm({
                                              fullName: s.fullName,
                                              phone: s.phone,
                                              role: s.role,
                                              isActive: s.isActive,
                                            });
                                          }}
                                          title="Edit Staff Member"
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700 transition-colors"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Reset Password button */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setResetPasswordTarget(s);
                                            setCustomPasswordInput('');
                                            setGeneratedTempPassword(null);
                                          }}
                                          title="Reset Credentials"
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors"
                                        >
                                          <KeyRound className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Toggle Active / Suspended */}
                                        {!isDepotManager && !isCurrentUser && (
                                          <button
                                            type="button"
                                            onClick={() => handleToggleStaffStatus(s)}
                                            title={s.isActive ? 'Suspend account access' : 'Activate account access'}
                                            className={`p-1.5 rounded-lg border transition-colors ${
                                              s.isActive
                                                ? 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border-slate-700 hover:border-rose-800'
                                                : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-800'
                                            }`}
                                          >
                                            {s.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                          </button>
                                        )}

                                        {/* Delete Staff Member */}
                                        {!isDepotManager && !isCurrentUser && (
                                          <button
                                            type="button"
                                            onClick={() => setDeleteStaffTarget(s)}
                                            title="Delete Staff Account"
                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: ROLE & PERMISSION MATRIX (RBAC) */}
              {staffSubTab === 'matrix' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-bold text-white">
                        Kalambaina Plant Role-Based Access Control (RBAC) Authority Matrix
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Formal delegation of authority for A.A. Master Nig. Limited wholesale operations. Built on the principle of least privilege to prevent inventory discrepancy and safeguard multi-million Naira trailer loads (₦6,510,000 per 30T truck).
                    </p>
                  </div>

                  {/* Matrix Comparison Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3.5 w-1/3">System Operational Function</th>
                          <th className="p-3.5 text-center bg-blue-950/20 text-blue-300">
                            1. Manager
                            <span className="block text-[10px] text-slate-400 font-normal">Uwaisu Musa</span>
                          </th>
                          <th className="p-3.5 text-center bg-indigo-950/20 text-indigo-300">
                            2. Asst. Manager
                            <span className="block text-[10px] text-slate-400 font-normal">Mamuda Ahmed</span>
                          </th>
                          <th className="p-3.5 text-center bg-teal-950/20 text-teal-300">
                            3. Issuing Agent
                            <span className="block text-[10px] text-slate-400 font-normal">Isiyaka Sulaiman</span>
                          </th>
                          
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px]">
                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Customer Wholesale Order Review &amp; Approval
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 font-bold text-emerald-400">
                            ✅ Full Approval Authority
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 font-bold text-amber-400">
                            ⚠️ Queue Review Only
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            100% Upfront Payment Reconciliation &amp; Verification
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 font-bold text-emerald-400">
                            ✅ Primary Treasury Authority
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Plant Stock Intake &amp; Waybill Recording (Section 2)
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 font-bold text-blue-400">
                            👁️ Oversight &amp; Audit
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 font-bold text-emerald-400">
                            ✅ Primary Entry Officer
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Physical Articulated Truck Loading (600 Bags / 30T)
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 font-bold text-emerald-400">
                            ✅ Exclusive Plant Site Authority
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Truck Tractor &amp; Trailer Bed Number Verification
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 font-bold text-emerald-400">
                            ✅ Mandatory Plant Gate Check
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Driver Credentials &amp; Recipient Signature Sign-Off
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 font-bold text-emerald-400">
                            ✅ Official Dispatch Release
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Staff RBAC Provisioning &amp; Password Resets
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 font-bold text-emerald-400">
                            ✅ Authorized
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Immutable Security Audit Trail Oversight
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 font-bold text-emerald-400">
                            ✅ Audit Review
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          
                        </tr>

                        <tr className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">
                            Zenith Bank Treasury &amp; Regional Haulage Matrix
                          </td>
                          <td className="p-3 text-center bg-blue-950/10 font-bold text-emerald-400">
                            ✅ Full Configuration &amp; Treasury Oversight
                          </td>
                          <td className="p-3 text-center bg-indigo-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                          <td className="p-3 text-center bg-teal-950/10 text-slate-500">
                            ❌ Prohibited
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Cashier Exclusion Policy Banner */}
                  <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <strong className="text-white block font-bold">
                        Corporate Governance: Complete Elimination of the Cashier Role
                      </strong>
                      <p className="text-emerald-200/90 leading-relaxed">
                        To protect company capital and prevent cash handling discrepancies, A.A. Master Nig. Limited operates with 100% upfront banking settlement. Wholesale buyers remit directly to Zenith Bank (Account: 1018492049), and verification is conducted by Uwaisu Musa (Plant Depot Manager) prior to physical loading by Isiyaka Sulaiman.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: KALAMBAINA PLANT PROTOCOLS */}
              {staffSubTab === 'protocols' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">1. Dual Control &amp; Separation of Duties</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      No single staff member may simultaneously approve an order, verify funds, and dispatch stock. The Depot Manager approves and reconciles funds, while the physical Issuing Agent handles the loading bay, ensuring full tripartite checks.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Truck className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">2. Articulated Trailer Standard (600 Bags)</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      All factory allocations are strictly measured in 600-bag articulated trailers (30 metric tonnes). The Issuing Agent verifies that the tractor plate and trailer bed registration numbers match before stamping the gate pass.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">3. Zero Credit &amp; 100% Upfront Wire Rule</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Under Board directive, credit sales and partial payments are prohibited. Cement is released only after the Depot Manager validates verified Zenith Bank credit reference numbers.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">4. Immutable Audit Trail &amp; Identity Tracking</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Every administrative sign-in, order approval, stock intake receipt, and truck issuance is time-stamped and bound to the staff member's ID in the system's tamper-evident audit ledger.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Contractor / Buyer</th>
                    <th className="p-3.5">Company / Enterprise</th>
                    <th className="p-3.5">Email (Login ID)</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Registered Location</th>
                    <th className="p-3.5">Created Date</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customerList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        No registered customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    customerList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-white">{c.fullName}</td>
                        <td className="p-3.5 text-slate-300">{c.companyName || '—'}</td>
                        <td className="p-3.5 text-slate-400 font-mono">{c.email}</td>
                        <td className="p-3.5 text-slate-300 font-mono">{c.phone}</td>
                        <td className="p-3.5 text-slate-400">
                          {[c.city, c.state].filter(Boolean).join(', ') || c.address || '—'}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                            Verified Customer
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

          {/* TAB 8: AUDIT TRAIL (ADMIN & MANAGER) */}
          {activeTab === 'audit' && (isAdmin || isManager) && (
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
          {activeTab === 'settings' && (isAdmin || isManager) && businessSettings && (
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

            {/* MODAL: VIEW & PRINT PAYMENT RECEIPT & TREASURY AUDIT SLIP */}
      {viewingPaymentReceipt && (() => {
        const matchingOrder = orders.find(
          (o) => o.id === viewingPaymentReceipt.orderId || o.orderNumber === viewingPaymentReceipt.orderNumber
        );
        const trucksCount = matchingOrder?.totalTrailers || Math.max(1, Math.round(viewingPaymentReceipt.amount / 6510000));
        const bagsCount = matchingOrder?.totalBags || trucksCount * 600;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 text-xs my-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Top Control Bar */}
              <div className="no-print flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Payment Documentation Desk</h3>
                    <p className="text-[11px] text-slate-400">Order: <strong className="text-amber-400">{viewingPaymentReceipt.orderNumber}</strong> • Receipt: <span className="font-mono text-emerald-400">{viewingPaymentReceipt.id}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setViewingPaymentReceipt(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* View Switcher: Wholesale Customer Receipt vs Treasury Audit Slip */}
              <div className="no-print flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold shadow-inner">
                <button
                  type="button"
                  onClick={() => setReceiptModalMode('receipt')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    receiptModalMode === 'receipt'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Official Wholesale Payment Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalMode('audit')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    receiptModalMode === 'audit'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Treasury Reconciliation Audit Slip</span>
                </button>
              </div>

              {/* VIEW 1: OFFICIAL WHOLESALE PAYMENT RECEIPT */}
              {receiptModalMode === 'receipt' && (
                <div id="printable-payment-receipt" className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 text-slate-200">
                  {/* Receipt Header / Letterhead */}
                  <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-amber-400" />
                        <h4 className="text-base font-black text-white tracking-wide">A.A. MASTER NIG. LIMITED</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Wholesale Cement Commercial &amp; Physical Loading Operations</p>
                      <p className="text-[10px] text-slate-500 font-mono">RC: RC-1928410 • TIN: 29810419-0001</p>
                      <p className="text-[10px] text-slate-500">Kalambaina Industrial Hub, Cement Works Expressway, Sokoto State</p>
                    </div>

                    <div className="sm:text-right space-y-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Fully Paid
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Receipt #: <strong className="text-white font-mono">{viewingPaymentReceipt.id.toUpperCase()}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Date: {new Date(viewingPaymentReceipt.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Customer & Order Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Issued To (Customer):</span>
                      <strong className="text-white text-sm block mt-0.5">{viewingPaymentReceipt.customerName}</strong>
                      <span className="text-slate-400 text-[11px] block">{matchingOrder?.companyName || viewingPaymentReceipt.bankPayerName || 'Wholesale Client'}</span>
                      {matchingOrder?.customerPhone && (
                        <span className="text-slate-400 text-[10px] font-mono block">Phone: {matchingOrder.customerPhone}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Wholesale Order &amp; Fulfillment:</span>
                      <strong className="text-amber-400 font-mono text-sm block mt-0.5">{viewingPaymentReceipt.orderNumber}</strong>
                      <span className="text-slate-300 text-[11px] block">Ex-Factory Plant Collection (Direct Transporter Dispatch)</span>
                      <span className="text-slate-400 text-[10px] block">Kalambaina Plant Weighbridge Clearance Bay</span>
                    </div>
                  </div>

                  {/* Itemized Order Summary */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-3">Product Description</th>
                          <th className="p-3 text-center">Trailers Ordered</th>
                          <th className="p-3 text-center">Total Bags (x600)</th>
                          <th className="p-3 text-right">Fixed Truck Rate</th>
                          <th className="p-3 text-right">Total Reconciled</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                        <tr>
                          <td className="p-3 font-sans">
                            <strong className="text-white block">Sokoto Cement (Kalambaina 42.5R)</strong>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: AAM-SKT-600 • 30 Tonnes / Truck</span>
                          </td>
                          <td className="p-3 text-center text-white font-bold">{trucksCount} Full Truck{trucksCount > 1 ? 's' : ''}</td>
                          <td className="p-3 text-center text-emerald-400 font-bold">{bagsCount.toLocaleString()} Bags</td>
                          <td className="p-3 text-right text-slate-300">₦6,510,000</td>
                          <td className="p-3 text-right text-emerald-400 font-black text-xs">₦{viewingPaymentReceipt.amount.toLocaleString('en-NG')}</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-slate-900/80 font-bold border-t border-slate-800">
                        <tr>
                          <td colSpan={4} className="p-3 text-right text-slate-300 uppercase text-[10px] tracking-wider">
                            Total 100% Upfront Amount Paid:
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-400 text-sm font-black">
                            ₦{viewingPaymentReceipt.amount.toLocaleString('en-NG')}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="p-2 text-right text-slate-400 text-[10px]">
                            Outstanding Balance:
                          </td>
                          <td className="p-2 text-right font-mono text-slate-300 text-xs">
                            ₦0.00 (Zero Balance)
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Banking Verification Details */}
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
                      <Landmark className="w-4 h-4" />
                      <span>Zenith Bank Settlement &amp; Treasury Verification</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Destination Corporate Account:</span>
                        <strong className="text-white font-mono">{viewingPaymentReceipt.destinationAccount || 'Zenith Bank - 1018492049'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Bank Transaction / Session ID:</span>
                        <strong className="text-emerald-400 font-mono">{viewingPaymentReceipt.bankTransferReference || viewingPaymentReceipt.gatewayReference || 'ZEN-TX-CONFIRMED'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Reconciled By Authorized Executive:</span>
                        <strong className="text-white">{viewingPaymentReceipt.verifiedByStaffName || 'Uwaisu Musa'} (Plant Depot Manager)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Verification Timestamp:</span>
                        <span className="text-slate-300 font-mono">{new Date(viewingPaymentReceipt.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Certified Footnote */}
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[10px] text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Official Release Clearance:</strong> This official receipt certifies that payment was received 100% in full without credit or part payments. Transporter is authorized for physical truck clearance at the Kalambaina plant weighbridge.
                    </span>
                  </div>
                </div>
              )}

              {/* VIEW 2: TREASURY RECONCILIATION AUDIT SLIP */}
              {receiptModalMode === 'audit' && (
                <div id="printable-audit-slip" className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 text-slate-200">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                        <h4 className="text-sm font-black text-white">TREASURY RECONCILIATION AUDIT SLIP</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Internal Accounting &amp; Executive Compliance Proof</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-black uppercase font-mono">
                      AUDIT STATUS: VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Internal Payment ID:</span>
                      <span className="font-mono text-white font-bold">{viewingPaymentReceipt.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Linked Order Entity:</span>
                      <span className="font-mono text-amber-400 font-bold">{viewingPaymentReceipt.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Wholesale Contractor:</span>
                      <strong className="text-white">{viewingPaymentReceipt.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Payer Account / Label:</span>
                      <span className="text-slate-300 font-mono">{viewingPaymentReceipt.bankPayerName || viewingPaymentReceipt.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Settlement Channel:</span>
                      <span className="font-mono text-emerald-400 font-bold">{viewingPaymentReceipt.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination Treasury:</span>
                      <span className="font-mono text-slate-300">{viewingPaymentReceipt.destinationAccount || 'Zenith Bank - 1018492049'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Transaction ID / Ref:</span>
                      <span className="font-mono text-emerald-400 font-bold">{viewingPaymentReceipt.bankTransferReference || viewingPaymentReceipt.gatewayReference || 'ZEN-TX-CONFIRMED'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Exact Inflow Cleared:</span>
                      <span className="font-mono text-emerald-400 font-black text-sm">₦{viewingPaymentReceipt.amount.toLocaleString('en-NG')}</span>
                    </div>
                  </div>

                  {/* Verifier Attestation */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Reconciling Authority Attestation:</span>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <strong className="text-white text-sm block">{viewingPaymentReceipt.verifiedByStaffName || 'Uwaisu Musa'}</strong>
                        <span className="text-purple-300 text-[11px]">Plant Depot General Manager (Approval Authority)</span>
                      </div>
                      <div className="text-right font-mono text-[11px] text-slate-400">
                        <span>Cleared: {new Date(viewingPaymentReceipt.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <strong>Audit Notes:</strong> {viewingPaymentReceipt.verificationNotes || 'Reconciled in bank portal; 100% full value confirmed. No partial balance.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="no-print flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceiptModalMode(receiptModalMode === 'receipt' ? 'audit' : 'receipt')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  {receiptModalMode === 'receipt' ? 'Switch to Treasury Audit Slip →' : '← Switch to Customer Payment Receipt'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print {receiptModalMode === 'receipt' ? 'Official Receipt' : 'Audit Slip'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingPaymentReceipt(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: MANAGER PAYMENT VERIFICATION */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Manager Payment Verification
              </h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordOfflinePayment} className="space-y-3">
              {!paymentForm.orderId && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Select Wholesale Order to Reconcile *</label>
                  <select
                    value={paymentForm.orderId}
                    onChange={(e) => {
                      const selOrder = orders.find((o) => o.id === e.target.value);
                      if (selOrder) {
                        setPaymentForm({
                          ...paymentForm,
                          orderId: selOrder.id,
                          amount: selOrder.totalAmount,
                          payerName: selOrder.customerName,
                          referenceNumber: selOrder.bankTransferReference || 'ZEN-TX-' + Math.floor(10000000 + Math.random() * 90000000),
                        });
                      }
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="">-- Choose Approved Wholesale Order --</option>
                    {orders
                      .filter((o) => o.status !== 'PAID' && o.status !== 'FULLY_ISSUED' && o.status !== 'CANCELLED')
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.orderNumber} — {o.customerName} (₦{o.totalAmount.toLocaleString('en-NG')} • {o.totalTrailers} Trucks)
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {paymentForm.orderId && (
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Reconciling Order:</span>
                    <strong className="text-amber-400 font-mono text-sm">
                      {orders.find((o) => o.id === paymentForm.orderId)?.orderNumber || paymentForm.orderId}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Required:</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      ₦{paymentForm.amount.toLocaleString('en-NG')}
                    </strong>
                  </div>
                </div>
              )}
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
                  <option value="usr_driver_001">Isiyaka Sulaiman (Articulated Fleet Captain)</option>
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
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" /> Provision Staff Account
                </h3>
                <p className="text-[11px] text-slate-400">
                  Assign official credentials for A.A. Master Nig. Limited operational staff.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateStaffModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ibrahim Aliyu"
                    value={newStaffForm.fullName}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Operational Role *</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="MANAGER">1. Depot Manager (Approval Authority)</option>
                    <option value="ASSISTANT_MANAGER">2. Assistant Manager (Queue & Stock Registration)</option>
                    <option value="AGENT">3. Issuing Agent (Kalambaina Loading Bay)</option>
                    <option value="CASHIER">4. Cashier (Treasury & 100% Upfront Reconciliations)</option>
                    <option value="ADMIN">Executive Administrator (Directorate)</option>
                    <option value="STORE_MANAGER">Store / Depot Manager</option>
                    <option value="SALES_OFFICER">Sales Officer</option>
                    <option value="DELIVERY_OFFICER">Delivery Officer / Driver</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@aamaster.ng"
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Telephone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 803 000 0000"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Password (min 6 characters) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = 'AAMaster-' + Math.floor(100000 + Math.random() * 900000);
                      setNewStaffForm({ ...newStaffForm, password: generated });
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    Generate Random Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                  placeholder="Enter secure initial password..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block">RBAC Governance Note:</span>
                <span>
                  {newStaffForm.role === 'MANAGER' && 'Has exclusive authority to approve wholesale customer orders and reconcile 100% upfront wire transfers.'}
                  {newStaffForm.role === 'ASSISTANT_MANAGER' && 'Authorized to review the wholesale order queue, check customer documents, and register factory stock intake (Section 2).'}
                  {newStaffForm.role === 'AGENT' && 'Assigned to the Kalambaina Plant loading bay for physical vehicle bed checks, driver license verification, and 600-bag truck issuance.'}
                  {newStaffForm.role === 'ADMIN' && 'Full executive access across all inventory lines, staff RBAC directory, pricing matrices, and immutable audit logs.'}
                </span>
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
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF MEMBER */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-400" /> Edit Personnel Profile
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">{editingStaff.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStaffForm.fullName}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Telephone Number *</label>
                <input
                  type="tel"
                  required
                  value={editStaffForm.phone}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Assigned Operational Role *</label>
                <select
                  value={editStaffForm.role}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="MANAGER">1. Depot Manager (Approval &amp; Treasury)</option>
                  <option value="ASSISTANT_MANAGER">2. Assistant Manager (Queue Review &amp; Stock Intake)</option>
                  <option value="AGENT">3. Issuing Agent (Kalambaina Loading Bay)</option>
                  <option value="ADMIN">Executive Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editStaffForm.isActive}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, isActive: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                />
                <label htmlFor="editIsActive" className="text-slate-300 font-semibold cursor-pointer">
                  Account is Active and authorized for system operations
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Save Profile Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetPasswordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" /> Reset Staff Credentials
                </h3>
                <p className="text-[11px] text-slate-400">
                  {resetPasswordTarget.fullName} ({resetPasswordTarget.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedTempPassword ? (
              <div className="space-y-4">
                <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Password Successfully Reset!
                  </div>
                  <p className="text-xs">
                    Please provide the new temporary credentials to <strong>{resetPasswordTarget.fullName}</strong>:
                  </p>
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-sm text-white">
                    <span>{generatedTempPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedTempPassword);
                        setCopiedId('temp_pass');
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      {copiedId === 'temp_pass' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'temp_pass' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setResetPasswordTarget(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetStaffPassword} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold">New Password (or Leave Empty for Auto-Gen)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const random = 'AAMaster-' + Math.floor(100000 + Math.random() * 900000);
                        setCustomPasswordInput(random);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter new password (min 6 characters)..."
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Clicking "Apply New Password" will update the salt hash and log this action in the security audit trail.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setResetPasswordTarget(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Apply New Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DELETE STAFF CONFIRMATION */}
      {deleteStaffTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Remove Staff Member?</h3>
                <p className="text-[11px] text-slate-400">Action is irreversible but historical audit trail is preserved.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <strong className="text-white">{deleteStaffTarget.fullName}</strong>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300">{deleteStaffTarget.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="text-amber-400 font-bold">{deleteStaffTarget.role}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteStaffTarget(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
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
