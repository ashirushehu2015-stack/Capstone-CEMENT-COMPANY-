import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';

const router = Router();

// Validation Schemas
const createStockReceiptSchema = z.object({
  supplierName: z.string().min(2, 'Supplier name required'),
  supplierReference: z.string().optional(),
  productId: z.string().min(1, 'Product selection required'),
  receiptDateTime: z.string().optional(),
  trucksReceived: z.number().int().positive('Number of trucks must be at least 1 full truck'),
  supplierDeliveryNote: z.string().optional().default('FACTORY-DIRECT'),
  vehicleReg: z.string().optional().default('FACTORY-DIRECT'),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  notesOrDiscrepancies: z.string().optional(),
  isDraft: z.boolean().optional(),
});

const approveReceiptSchema = z.object({
  verificationNotes: z.string().optional(),
});

const rejectReceiptSchema = z.object({
  reason: z.string().min(3, 'Rejection reason required'),
});

const reverseReceiptSchema = z.object({
  reversalReason: z.string().min(3, 'Authorised reversal justification required'),
});

const recordOpeningStockSchema = z.object({
  physicalCountDate: z.string().optional(),
  productId: z.string().min(1, 'Product required'),
  trucksCounted: z.number().int().nonnegative('Number of trucks cannot be negative'),
  countingStaffId: z.string().min(1, 'Counting staff ID required'),
  countingStaffName: z.string().min(2, 'Counting staff name required'),
  verifierId: z.string().min(1, 'Independent verifier ID required'),
  verifierName: z.string().min(2, 'Independent verifier name required'),
  notes: z.string().optional(),
});

const receiveGoodsSchema = z.object({
  productId: z.string().min(1),
  trailersReceived: z.number().int().positive('Number of trailers must be at least 1'),
  batchNumber: z.string().min(2, 'Clinker/Cement production batch number required'),
  plantKilnReference: z.string().min(2, 'Plant kiln or silo reference required (e.g. Kalambaina Kiln 2)'),
  notes: z.string().optional(),
});

const adjustStockSchema = z.object({
  productId: z.string().min(1),
  trailerChange: z.number().int().refine((val) => val !== 0, 'Trailer change cannot be zero'),
  type: z.enum(['DAMAGED_BAGS_REPACKED', 'DEPOT_AUDIT_ADJUSTMENT']),
  reason: z.string().min(3, 'Detailed reason required for audit compliance'),
});

// GET /api/inventory/dashboard-metrics (Section 7 Stock Management Dashboard)
router.get(
  '/dashboard-metrics',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER'),
  (_req, res) => {
    try {
      const metrics = db.getStockDashboardMetrics();
      return res.json({ success: true, metrics });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to load stock metrics' });
    }
  }
);

// GET /api/inventory/receipts (Section 2 Staff Stock Registration)
router.get(
  '/receipts',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER', 'SALES_OFFICER'),
  (req, res) => {
    try {
      let receipts = db.getAllStockReceipts();
      const { status, productId } = req.query;
      if (status && typeof status === 'string') {
        receipts = receipts.filter((r) => r.status === status);
      }
      if (productId && typeof productId === 'string') {
        receipts = receipts.filter((r) => r.productId === productId);
      }
      return res.json({ success: true, receipts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/inventory/receipts (Register stock receipt by Assistant Manager or Manager)
router.post(
  '/receipts',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER', 'SALES_OFFICER'),
  (req: AuthenticatedRequest, res) => {
    const parsed = createStockReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    try {
      const receipt = db.createStockReceipt({
        ...parsed.data,
        receiptDateTime: parsed.data.receiptDateTime || new Date().toISOString(),
        user: {
          id: req.user!.userId,
          name: req.user!.fullName,
          role: req.user!.role,
        },
      });

      return res.status(201).json({
        success: true,
        receipt,
        message: receipt.status === 'APPROVED'
          ? `Stock receipt ${receipt.receiptReference} registered and posted directly to inventory (${receipt.trucksReceived} trucks / ${receipt.totalBagsReceived.toLocaleString()} bags). No approval required.`
          : `Stock receipt ${receipt.receiptReference} saved as draft (${receipt.trucksReceived} trucks / ${receipt.totalBagsReceived.toLocaleString()} bags).`,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'Failed to register stock receipt' });
    }
  }
);

// POST /api/inventory/receipts/:id/approve (Manager approval - strictly Manager only; no self-approval)
router.post(
  '/receipts/:id/approve',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'),
  (req: AuthenticatedRequest, res) => {
    const parsed = approveReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    try {
      const result = db.approveStockReceipt({
        receiptId: req.params.id,
        verificationNotes: parsed.data.verificationNotes,
        user: {
          id: req.user!.userId,
          name: req.user!.fullName,
          role: req.user!.role,
        },
      });

      return res.json({
        success: true,
        receipt: result.receipt,
        movement: result.movement,
        message: `Stock receipt ${result.receipt.receiptReference} approved. ${result.receipt.totalBagsReceived.toLocaleString()} bags posted to physical inventory.`,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'Receipt approval failed' });
    }
  }
);

// POST /api/inventory/receipts/:id/reject (Manager rejection)
router.post(
  '/receipts/:id/reject',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'),
  (req: AuthenticatedRequest, res) => {
    const parsed = rejectReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    try {
      const receipt = db.rejectStockReceipt({
        receiptId: req.params.id,
        reason: parsed.data.reason,
        user: {
          id: req.user!.userId,
          name: req.user!.fullName,
          role: req.user!.role,
        },
      });

      return res.json({
        success: true,
        receipt,
        message: `Stock receipt ${receipt.receiptReference} has been rejected.`,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// POST /api/inventory/receipts/:id/reverse (Manager reversal)
router.post(
  '/receipts/:id/reverse',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'),
  (req: AuthenticatedRequest, res) => {
    const parsed = reverseReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    try {
      const result = db.reverseStockReceipt({
        receiptId: req.params.id,
        reversalReason: parsed.data.reversalReason,
        user: {
          id: req.user!.userId,
          name: req.user!.fullName,
          role: req.user!.role,
        },
      });

      return res.json({
        success: true,
        receipt: result.receipt,
        movement: result.movement,
        message: `Stock receipt ${result.receipt.receiptReference} reversed. Reversal entry recorded in ledger.`,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// GET /api/inventory/opening-stock (Section 4 Opening Stock)
router.get(
  '/opening-stock',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER'),
  (_req, res) => {
    try {
      const entries = db.getOpeningStockEntries();
      return res.json({ success: true, entries });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/inventory/opening-stock (Manager record opening stock baseline)
router.post(
  '/opening-stock',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'),
  (req: AuthenticatedRequest, res) => {
    const parsed = recordOpeningStockSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    try {
      const entry = db.recordOpeningStock({
        ...parsed.data,
        physicalCountDate: parsed.data.physicalCountDate || new Date().toISOString(),
        user: {
          id: req.user!.userId,
          name: req.user!.fullName,
          role: req.user!.role,
        },
      });

      return res.status(201).json({
        success: true,
        entry,
        message: `Opening stock recorded: ${entry.trucksCounted} full trucks (${entry.totalConfirmedBags.toLocaleString()} bags). Baseline established.`,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

// POST /api/inventory/acceptance-tests/run (Section 8 Automated Acceptance Tests Runner)
router.post(
  '/acceptance-tests/run',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER'),
  (_req, res) => {
    try {
      const results = db.runAcceptanceTests();
      const allPassed = results.every((r) => r.passed);
      const passedCount = results.filter((r) => r.passed).length;
      return res.json({
        success: true,
        summary: `${passedCount} of ${results.length} automated acceptance tests passed`,
        allPassed,
        results,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/inventory/movements (Section 3 Authoritative Inventory Ledger)
router.get(
  '/movements',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER', 'SALES_OFFICER', 'AGENT', 'DELIVERY_OFFICER'),
  (_req, res) => {
    const movements = db.getAllStockMovements();
    return res.json({ success: true, movements });
  }
);

// GET /api/inventory/stock-summary
router.get(
  '/stock-summary',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'STORE_MANAGER', 'SALES_OFFICER', 'AGENT'),
  (_req, res) => {
    const products = db.getAllProducts();
    const summary = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      grade: p.grade,
      pricePerTrailer: p.pricePerTrailer,
      pricePerBagEquivalent: p.pricePerBagEquivalent,
      physicalStockBags: p.physicalStockBags,
      reservedStockBags: p.reservedStockBags,
      availableStockBags: p.availableStockBags,
      availableTrailers: p.availableTrailers,
      reservedTrailers: p.reservedTrailers,
      totalPhysicalTrailers: Math.floor(p.physicalStockBags / 600),
      totalBagsEquivalent: p.availableStockBags,
      reorderLevelTrailers: p.reorderLevelTrailers,
      isLowStock: p.availableStockBags <= p.reorderLevelTrailers * 600,
      valuationNGN: p.availableStockBags * (p.costPerBagBasis || 9500),
      estimatedSalesValueNGN: p.availableStockBags * p.pricePerBag,
    }));
    return res.json({ success: true, summary });
  }
);

// POST /api/inventory/receive-goods (Plant production transfer into dispatch terminal)
router.post('/receive-goods', authenticate, requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'), (req: AuthenticatedRequest, res) => {
  const parsed = receiveGoodsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const result = db.receiveProductionTrailers({
      productId: parsed.data.productId,
      trailersReceived: parsed.data.trailersReceived,
      batchNumber: parsed.data.batchNumber,
      plantKilnReference: parsed.data.plantKilnReference,
      notes: parsed.data.notes,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.status(201).json({
      success: true,
      product: result.product,
      movement: result.movement,
      message: `Successfully received ${parsed.data.trailersReceived} Trailer loads (${(parsed.data.trailersReceived * result.product.bagsPerTrailer).toLocaleString()} bags) from ${parsed.data.plantKilnReference}`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to record trailer receipt' });
  }
});

// POST /api/inventory/adjust (Trailer inventory adjustment)
router.post('/adjust', authenticate, requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'), (req: AuthenticatedRequest, res) => {
  const parsed = adjustStockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const result = db.adjustTrailerStock({
      productId: parsed.data.productId,
      trailerChange: parsed.data.trailerChange,
      type: parsed.data.type,
      reason: parsed.data.reason,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName,
        role: req.user!.role,
      },
    });

    return res.json({
      success: true,
      product: result.product,
      movement: result.movement,
      message: `Trailer inventory adjusted by ${parsed.data.trailerChange} trailers for ${result.product.name}`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to adjust trailer stock' });
  }
});

export default router;
