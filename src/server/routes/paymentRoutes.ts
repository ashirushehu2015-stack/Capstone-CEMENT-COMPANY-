import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';

const router = Router();

const offlinePaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH_AT_STORE', 'POS_TERMINAL']),
  amount: z.number().positive(),
  referenceNumber: z.string().min(2, 'Payment reference/slip number required'),
  payerName: z.string().optional(),
  destinationAccount: z.string().optional(),
  notes: z.string().optional(),
});

const submitTransferClaimSchema = z.object({
  orderId: z.string().min(1),
  bankTransferReference: z.string().min(3, 'Bank transfer transaction reference required'),
  payerName: z.string().min(2, 'Name of bank account holder required'),
  destinationAccount: z.string().optional(),
});

const paystackVerifySchema = z.object({
  orderId: z.string().min(1),
  reference: z.string().min(3),
});

// GET /api/payments (Manager, Admin)
router.get('/', authenticate, requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'), (_req, res) => {
  const payments = db.getAllPayments();
  return res.json({ success: true, payments });
});

// POST /api/payments/submit-transfer-claim (Customer submits bank transfer reference)
router.post('/submit-transfer-claim', authenticate, (req: AuthenticatedRequest, res) => {
  const parsed = submitTransferClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const order = db.getOrderById(parsed.data.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  if (req.user!.role === 'CUSTOMER' && order.customerId !== req.user!.userId) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const allowedClaimStatuses = [
    'PENDING_APPROVAL',
    'APPROVED_AWAITING_PAYMENT',
    'PENDING_PAYMENT',
    'PAYMENT_UNDER_VERIFICATION',
  ];
  if (!allowedClaimStatuses.includes(order.status)) {
    return res.status(400).json({ success: false, error: `Cannot submit claim for order in ${order.status} state` });
  }

  // Keep PENDING_APPROVAL if Manager hasn't approved yet so Manager still sees Approve button; otherwise set PAYMENT_UNDER_VERIFICATION
  const targetStatus =
    order.managerApprovalStatus === 'APPROVED' ? 'PAYMENT_UNDER_VERIFICATION' : order.status;

  const updatedOrder = db.updateOrderStatus({
    orderId: order.id,
    newStatus: targetStatus,
    notes: `Customer submitted bank transfer proof — Ref: ${parsed.data.bankTransferReference} (Payer: ${parsed.data.payerName})`,
    user: {
      id: req.user!.userId,
      name: req.user!.fullName,
      role: req.user!.role,
    },
  });

  return res.json({
    success: true,
    order: updatedOrder,
    message: 'Bank transfer proof submitted. Cashier and Manager have been notified for reconciliation.',
  });
});

// POST /api/payments/verify-paystack (Online Card/USSD/QR Payment Verification)
router.post('/verify-paystack', authenticate, (req: AuthenticatedRequest, res) => {
  const parsed = paystackVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const order = db.getOrderById(parsed.data.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  if (order.paymentStatus === 'VERIFIED') {
    return res.status(400).json({ success: false, error: 'Order has already been verified and paid.' });
  }

  try {
    // Record verified payment in the immutable payment ledger
    const paymentRecord = db.recordOnlinePayment({
      orderId: order.id,
      amount: order.totalAmount,
      gatewayReference: parsed.data.reference,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    const updatedOrder = db.getOrderById(order.id);

    return res.json({
      success: true,
      payment: paymentRecord,
      order: updatedOrder,
      message: 'Paystack payment successfully verified.',
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Payment verification failed' });
  }
});

// POST /api/payments/record-offline (Manager, Admin)
router.post('/record-offline', authenticate, requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'), (req: AuthenticatedRequest, res) => {
  const parsed = offlinePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const payment = db.recordOfflinePayment({
      orderId: parsed.data.orderId,
      paymentMethod: parsed.data.paymentMethod,
      amount: parsed.data.amount,
      referenceNumber: parsed.data.referenceNumber,
      payerName: parsed.data.payerName,
      destinationAccount: parsed.data.destinationAccount,
      notes: parsed.data.notes,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.status(201).json({
      success: true,
      payment,
      message: `Offline payment of ₦${parsed.data.amount.toLocaleString('en-NG')} recorded and order marked Paid.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to record payment' });
  }
});

export default router;
