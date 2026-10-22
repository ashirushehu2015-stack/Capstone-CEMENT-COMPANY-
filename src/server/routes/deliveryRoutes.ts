import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';

const router = Router();

const assignDeliverySchema = z.object({
  deliveryOfficerId: z.string().min(1),
  truckTractorHeadReg: z.string().min(2, 'Truck tractor head number required (e.g. SKK-782-XA)'),
  trailerBedReg: z.string().min(2, 'Trailer bed registration required (e.g. T-904-SOK)'),
  driverPhone: z.string().optional(),
  notes: z.string().optional(),
});

const confirmDeliverySchema = z.object({
  recipientSignatureName: z.string().min(2, 'Name of site engineer or receiving representative required'),
  proofOfDeliveryNotes: z.string().min(5, 'Delivery confirmation and offloading condition notes required'),
});

const confirmCollectionSchema = z.object({
  collectionPassCode: z.string().min(3),
  transporterName: z.string().min(2),
  notes: z.string().optional(),
});

// GET /api/deliveries
router.get('/', authenticate, requireRole('ADMIN', 'STORE_MANAGER', 'SALES_OFFICER', 'DELIVERY_OFFICER'), (req: AuthenticatedRequest, res) => {
  const allOrders = db.getAllOrders();
  const deliveryOrders = allOrders.filter(
    (o) => o.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' && o.status !== 'CANCELLED'
  );

  if (req.user!.role === 'DELIVERY_OFFICER') {
    const assignedOrPending = deliveryOrders.filter(
      (o) => !o.deliveryDetails?.deliveryOfficerId || o.deliveryDetails.deliveryOfficerId === req.user!.userId
    );
    return res.json({ success: true, deliveries: assignedOrPending });
  }

  return res.json({ success: true, deliveries: deliveryOrders });
});

// POST /api/deliveries/:orderId/assign
router.post('/:orderId/assign', authenticate, requireRole('ADMIN', 'STORE_MANAGER', 'SALES_OFFICER'), (req: AuthenticatedRequest, res) => {
  const parsed = assignDeliverySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const order = db.getOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  if (order.fulfillmentType !== 'FACTORY_TRAILER_HAULAGE') {
    return res.status(400).json({ success: false, error: 'Order is not configured for trailer haulage' });
  }

  const driverUser = db.findUserById(parsed.data.deliveryOfficerId);
  if (!driverUser) {
    return res.status(404).json({ success: false, error: 'Fleet delivery officer not found' });
  }

  try {
    const updated = db.updateOrderStatus({
      orderId: order.id,
      newStatus: order.status === 'PAID' || order.status === 'CONFIRMED' ? 'PROCESSING' : order.status,
      notes: `Assigned to Fleet Driver ${driverUser.fullName}. Tractor: ${parsed.data.truckTractorHeadReg}, Bed: ${parsed.data.trailerBedReg}`,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
      deliveryOfficerId: driverUser.id,
      deliveryOfficerName: driverUser.fullName,
      truckTractorHeadReg: parsed.data.truckTractorHeadReg,
      trailerBedReg: parsed.data.trailerBedReg,
      driverPhone: parsed.data.driverPhone || driverUser.phone,
    });

    return res.json({
      success: true,
      order: updated,
      message: `Trailer convoy assigned to ${driverUser.fullName} (${parsed.data.truckTractorHeadReg})`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/deliveries/:orderId/dispatch
router.post('/:orderId/dispatch', authenticate, requireRole('ADMIN', 'STORE_MANAGER', 'DELIVERY_OFFICER'), (req: AuthenticatedRequest, res) => {
  const order = db.getOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  try {
    const updated = db.updateOrderStatus({
      orderId: order.id,
      newStatus: 'DISPATCHED',
      notes: req.body.notes || 'Articulated trailer loaded, tarped, and dispatched through factory security gates.',
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
      truckTractorHeadReg: req.body.truckTractorHeadReg || order.deliveryDetails?.truckTractorHeadReg,
      trailerBedReg: req.body.trailerBedReg || order.deliveryDetails?.trailerBedReg,
    });

    return res.json({
      success: true,
      order: updated,
      message: `Trailer Order ${order.orderNumber} marked as DISPATCHED.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/deliveries/:orderId/confirm-delivery
router.post('/:orderId/confirm-delivery', authenticate, requireRole('ADMIN', 'STORE_MANAGER', 'DELIVERY_OFFICER'), (req: AuthenticatedRequest, res) => {
  const parsed = confirmDeliverySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const order = db.getOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  try {
    const updated = db.updateOrderStatus({
      orderId: order.id,
      newStatus: 'DELIVERED',
      notes: `Delivered to ${parsed.data.recipientSignatureName}. Offloading notes: ${parsed.data.proofOfDeliveryNotes}`,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
      recipientSignatureName: parsed.data.recipientSignatureName,
      proofOfDeliveryNotes: parsed.data.proofOfDeliveryNotes,
    });

    return res.json({
      success: true,
      order: updated,
      message: `Trailer Order ${order.orderNumber} confirmed DELIVERED at customer site.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/deliveries/:orderId/confirm-collection
router.post('/:orderId/confirm-collection', authenticate, requireRole('ADMIN', 'STORE_MANAGER', 'SALES_OFFICER'), (req: AuthenticatedRequest, res) => {
  const parsed = confirmCollectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const order = db.getOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  if (order.fulfillmentType !== 'FACTORY_GATE_COLLECTION') {
    return res.status(400).json({ success: false, error: 'Order is not configured for factory gate pickup' });
  }

  if (order.collectionDetails?.collectionPassCode !== parsed.data.collectionPassCode) {
    return res.status(400).json({ success: false, error: 'Invalid Gate Passcode. Security verification failed.' });
  }

  try {
    const updated = db.updateOrderStatus({
      orderId: order.id,
      newStatus: 'COMPLETED',
      notes: `Trailer handed over to Transporter ${parsed.data.transporterName}. Gate pass verified.`,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.json({
      success: true,
      order: updated,
      message: `Factory Gate handover verified for ${order.orderNumber}. Order COMPLETED.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
