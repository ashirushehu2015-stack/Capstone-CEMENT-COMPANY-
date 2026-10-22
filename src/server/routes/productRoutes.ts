import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';

const router = Router();

const productSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(3),
  brand: z.literal('Sokoto Cement'),
  grade: z.enum(['32.5R', '42.5R', '42.5N']),
  bagWeightKg: z.number().default(50),
  bagsPerTrailer: z.number().default(600),
  tonnesPerTrailer: z.number().default(30),
  pricePerTrailer: z.number().positive(),
  pricePerBagEquivalent: z.number().positive(),
  availableTrailers: z.number().nonnegative(),
  reorderLevelTrailers: z.number().nonnegative(),
  minOrderTrailers: z.number().int().positive().default(1),
  maxOrderTrailers: z.number().int().positive().optional(),
  description: z.string().min(5),
  applications: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  imageUrl: z.string().min(5),
  isActive: z.boolean().default(true),
});

// GET /api/products (Public)
router.get('/', (_req, res) => {
  const products = db.getAllProducts();
  return res.json({ success: true, products });
});

// GET /api/products/:id (Public)
router.get('/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  return res.json({ success: true, product });
});

// PUT /api/products/:id (Manager and Admin)
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'STORE_MANAGER'), (req: AuthenticatedRequest, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const updated = db.updateProduct(req.params.id, parsed.data, {
      id: req.user!.userId,
      name: req.user!.fullName,
      role: req.user!.role,
    });
    return res.json({ success: true, product: updated, message: 'Sokoto Cement trailer pricing updated successfully' });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message || 'Failed to update product' });
  }
});

export default router;
