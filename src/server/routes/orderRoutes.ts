import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';

const router = Router();

// Order Schema - STRICTLY TRAILERS ONLY (min 1 trailer)
const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      trailerCount: z.number().int().positive('Minimum order is 1 Trailer (600 bags / 30 tonnes)'),
    })
  ).min(1, 'At least one Sokoto Cement grade trailer load is required'),
  companyName: z.string().optional(),
  fulfillmentType: z.enum(['FACTORY_TRAILER_HAULAGE', 'FACTORY_GATE_COLLECTION']),
  deliveryDetails: z
    .object({
      recipientName: z.string().min(2),
      recipientPhone: z.string().min(10),
      siteAddress: z.string().min(5),
      landmark: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      deliveryZoneId: z.string().min(1),
    })
    .optional(),
  collectionDetails: z
    .object({
      plantDepotId: z.string().min(1),
      transporterName: z.string().min(2),
      transporterPhone: z.string().min(10),
      truckHeadReg: z.string().min(3),
      trailerBedReg: z.string().min(3),
      driverName: z.string().min(2),
      driverLicenseNo: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.enum(['PAYSTACK_CARD', 'BANK_TRANSFER', 'CASH_AT_STORE', 'POS_TERMINAL']),
  customerNotes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING_PAYMENT',
    'PAYMENT_UNDER_VERIFICATION',
    'PAID',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_COLLECTION',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'REFUND_PENDING',
    'REFUNDED',
  ]),
  notes: z.string().optional(),
  deliveryOfficerId: z.string().optional(),
  deliveryOfficerName: z.string().optional(),
  truckTractorHeadReg: z.string().optional(),
  trailerBedReg: z.string().optional(),
  driverPhone: z.string().optional(),
  proofOfDeliveryNotes: z.string().optional(),
  recipientSignatureName: z.string().optional(),
});

// POST /api/orders (Wholesale Trailer Orders)
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const user = db.findUserById(req.user!.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User profile not found' });
    }

    const order = db.createOrderWithReservation({
      customerId: user.id,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.phone,
      companyName: parsed.data.companyName || user.companyName,
      items: parsed.data.items,
      fulfillmentType: parsed.data.fulfillmentType,
      deliveryDetails: parsed.data.deliveryDetails,
      collectionDetails: parsed.data.collectionDetails,
      paymentMethod: parsed.data.paymentMethod,
      customerNotes: parsed.data.customerNotes,
    });

    return res.status(201).json({
      success: true,
      order,
      message: `Trailer Order ${order.orderNumber} placed for ${order.totalTrailers} Trailer(s) (${order.totalBags.toLocaleString()} bags / ${order.totalTonnes} tonnes). Stock reserved at Kalambaina plant.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to process trailer order' });
  }
});

// GET /api/orders
router.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { role, userId } = req.user!;
  if (role === 'CUSTOMER') {
    const orders = db.getOrdersForCustomer(userId);
    return res.json({ success: true, orders });
  }

  let orders = db.getAllOrders();
  const { status, fulfillment, search } = req.query;

  if (status && typeof status === 'string') {
    orders = orders.filter((o) => o.status === status);
  }
  if (fulfillment && typeof fulfillment === 'string') {
    orders = orders.filter((o) => o.fulfillmentType === fulfillment);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.companyName && o.companyName.toLowerCase().includes(q))
    );
  }

  return res.json({ success: true, orders });
});

// GET /api/orders/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (req.user!.role === 'CUSTOMER' && order.customerId !== req.user!.userId) {
    return res.status(403).json({ success: false, error: 'Access denied to this order' });
  }

  return res.json({ success: true, order });
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, (req: AuthenticatedRequest, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const updated = db.updateOrderStatus({
      orderId: req.params.id,
      newStatus: parsed.data.status,
      notes: parsed.data.notes,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
      deliveryOfficerId: parsed.data.deliveryOfficerId,
      deliveryOfficerName: parsed.data.deliveryOfficerName,
      truckTractorHeadReg: parsed.data.truckTractorHeadReg,
      trailerBedReg: parsed.data.trailerBedReg,
      driverPhone: parsed.data.driverPhone,
      proofOfDeliveryNotes: parsed.data.proofOfDeliveryNotes,
      recipientSignatureName: parsed.data.recipientSignatureName,
    });

    return res.json({
      success: true,
      order: updated,
      message: `Trailer order status updated to ${updated.status}`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Status transition failed' });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (req.user!.role === 'CUSTOMER' && order.customerId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = db.cancelOrder({
      orderId: req.params.id,
      reason: req.body.reason || 'Trailer order cancelled by request. Stock released back to plant terminal.',
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.json({
      success: true,
      order: updated,
      message: `Order ${updated.orderNumber} cancelled and reserved Trailer(s) released.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to cancel order' });
  }
});

// POST /api/orders/:id/approve-manager (Manager Approval Only - Section 1 & 5)
router.post('/:id/approve-manager', authenticate, requireRole('MANAGER', 'ADMIN', 'STORE_MANAGER'), (req: AuthenticatedRequest, res) => {
  try {
    const order = db.approveOrderByManager({
      orderId: req.params.id,
      notes: req.body.notes,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.json({
      success: true,
      order,
      message: `Order ${order.orderNumber} approved by Manager. ${order.totalTrailers} truck(s) (${order.totalBags.toLocaleString()} bags) reserved in terminal inventory.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to approve order' });
  }
});

// POST /api/orders/:id/reject-manager (Manager Rejection Only - Section 1)
router.post('/:id/reject-manager', authenticate, requireRole('MANAGER', 'ADMIN', 'STORE_MANAGER'), (req: AuthenticatedRequest, res) => {
  if (!req.body.reason) {
    return res.status(400).json({ success: false, error: 'Rejection reason is mandatory.' });
  }

  try {
    const order = db.rejectOrderByManager({
      orderId: req.params.id,
      reason: req.body.reason,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.json({
      success: true,
      order,
      message: `Order ${order.orderNumber} rejected by Manager. Reason: ${req.body.reason}`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to reject order' });
  }
});

// POST /api/orders/:id/record-payment (Record 100% Full Payment - Section 1 & 6: Cashier or Manager)
router.post('/:id/record-payment', authenticate, requireRole('CASHIER', 'MANAGER', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  const { amount, paymentMethod, referenceNumber, payerName, destinationAccount, notes } = req.body;
  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
  }
  if (!referenceNumber) {
    return res.status(400).json({ success: false, error: 'Payment reference number is required.' });
  }

  try {
    const result = db.recordPayment({
      orderId: req.params.id,
      amount,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      referenceNumber,
      payerName,
      destinationAccount,
      notes,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.json({
      success: true,
      payment: result.payment,
      order: result.order,
      message: `100% Full payment of ₦${amount.toLocaleString('en-NG')} verified for Order ${result.order.orderNumber}. Ready for Agent issuance.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Payment verification failed' });
  }
});

// POST /api/orders/:id/issue-truck (Physical Cement Issuance: Agent Only - Section 1 & 6)
router.post('/:id/issue-truck', authenticate, requireRole('AGENT', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  const { truckAllocationId, truckHeadReg, trailerBedReg, driverName, driverPhone, recipientSignatureName, notes } = req.body;
  if (!truckAllocationId) {
    return res.status(400).json({ success: false, error: 'Truck allocation ID required.' });
  }
  if (!truckHeadReg || !trailerBedReg || !driverName || !recipientSignatureName) {
    return res.status(400).json({
      success: false,
      error: 'Truck head reg, trailer bed reg, driver name, and recipient signature name are all mandatory for physical issuance.',
    });
  }

  try {
    const result = db.issueTruckByAgent({
      orderId: req.params.id,
      truckAllocationId,
      truckHeadReg,
      trailerBedReg,
      driverName,
      driverPhone,
      recipientSignatureName,
      notes,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.json({
      success: true,
      order: result.order,
      allocation: result.allocation,
      movement: result.movement,
      message: `Successfully issued ${result.allocation.truckLabel} (600 bags) on rig ${truckHeadReg} / ${trailerBedReg}. Physical stock deducted.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Physical cement issuance failed' });
  }
});

export default router;
