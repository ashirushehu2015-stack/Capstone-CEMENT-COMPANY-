import { Router } from 'express';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';

const router = Router();

// GET /api/reports/analytics (Admin, Store Manager, Cashier)
router.get('/analytics', authenticate, requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER', 'CASHIER'), (_req, res) => {
  const stockMetrics = db.getAuthoritativeMetrics();
  const orders = db.getAllOrders();
  const payments = db.getAllPayments();

  const totalRevenueNGN = payments.filter((p) => p.paymentStatus === 'VERIFIED').reduce((sum, p) => sum + p.amount, 0);
  const totalBagsSold = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED_BY_MANAGER').reduce((sum, o) => sum + o.totalBags, 0);
  const totalTrailersSold = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED_BY_MANAGER').reduce((sum, o) => sum + o.totalTrailers, 0);
  const pendingOrdersCount = orders.filter((o) => o.managerApprovalStatus === 'PENDING_REVIEW' || o.status === 'PENDING_APPROVAL').length;
  const activeProcessingOrdersCount = orders.filter((o) => o.status === 'PAID' || o.status === 'PARTIALLY_ISSUED').length;
  const dispatchedOrReadyCount = orders.filter((o) => o.status === 'DISPATCHED' || o.status === 'READY_FOR_COLLECTION').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const metrics = {
    ...stockMetrics,
    totalRevenueNGN,
    totalBagsSold,
    totalTrailersSold,
    totalTonnesSold: totalTrailersSold * 30,
    pendingOrdersCount,
    activeProcessingOrdersCount,
    dispatchedOrReadyCount,
    completedOrdersCount,
    totalStockBagsOnHand: stockMetrics.totalAvailableStockBags,
    stockValuationNGN: stockMetrics.totalCostValuationNGN,
  };

  // Product sales distribution
  const productSales: Record<string, { trailers: number; bags: number; revenueNGN: number }> = {};
  for (const o of orders) {
    if (o.status !== 'CANCELLED' && o.status !== 'REFUNDED') {
      for (const item of o.items) {
        if (!productSales[item.productName]) {
          productSales[item.productName] = { trailers: 0, bags: 0, revenueNGN: 0 };
        }
        productSales[item.productName].trailers += item.trailerCount;
        productSales[item.productName].bags += item.totalBags;
        productSales[item.productName].revenueNGN += item.subtotal;
      }
    }
  }

  // Payment method breakdown
  const paymentMethodStats: Record<string, { count: number; totalNGN: number }> = {};
  for (const p of payments) {
    if (p.paymentStatus === 'VERIFIED') {
      if (!paymentMethodStats[p.paymentMethod]) {
        paymentMethodStats[p.paymentMethod] = { count: 0, totalNGN: 0 };
      }
      paymentMethodStats[p.paymentMethod].count += 1;
      paymentMethodStats[p.paymentMethod].totalNGN += p.amount;
    }
  }

  return res.json({
    success: true,
    metrics,
    productSales,
    paymentMethodStats,
    recentOrders: orders.slice(0, 10),
    recentPayments: payments.slice(0, 10),
  });
});

// GET /api/reports/audit-logs (Manager and Admin)
router.get('/audit-logs', authenticate, requireRole('ADMIN', 'MANAGER'), (_req, res) => {
  const logs = db.getAuditLogs();
  return res.json({ success: true, logs });
});

// GET /api/settings (Public - for store info, delivery zones, bank account details)
router.get('/settings', (_req, res) => {
  const settings = db.getSettings();
  return res.json({ success: true, settings });
});

// PUT /api/settings (Manager and Admin)
router.put('/settings', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateSettings(req.body, {
      id: req.user!.userId,
      name: req.user!.fullName,
      role: req.user!.role,
    });
    return res.json({ success: true, settings: updated, message: 'Business settings updated successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update settings' });
  }
});

export default router;
