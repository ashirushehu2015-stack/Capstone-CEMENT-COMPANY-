import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { hashPassword, verifyPassword, generateSessionToken, revokeSessionToken } from '../auth.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name required'),
  phone: z.string().min(10, 'Valid Nigerian phone number required'),
  companyName: z.string().optional(),
  officeAddress: z.string().optional(),
  homeAddress: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  role: z.enum(['MANAGER', 'ASSISTANT_MANAGER', 'AGENT', 'ADMIN', 'STORE_MANAGER', 'SALES_OFFICER', 'DELIVERY_OFFICER']),
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { email, password, fullName, phone, companyName, officeAddress, homeAddress, address, city, state } = parsed.data;
  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = db.createUser({
    email,
    fullName,
    phone,
    companyName: companyName || '',
    role: 'CUSTOMER',
    isActive: true,
    officeAddress: officeAddress || address,
    homeAddress: homeAddress,
    address: officeAddress || address,
    city,
    state,
    passwordHash: hash,
    passwordSalt: salt,
  });

  const token = generateSessionToken({
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
    role: newUser.role,
    phone: newUser.phone,
    companyName: newUser.companyName,
    address: newUser.address,
  });

  return res.status(201).json({
    success: true,
    token,
    user: newUser,
    message: 'Customer account registered successfully',
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { email, password } = parsed.data;
  const user = db.findUserByEmail(email);
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const token = generateSessionToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    companyName: user.companyName,
    address: user.address,
  });

  const { passwordHash, passwordSalt, ...sanitized } = user;
  return res.json({
    success: true,
    token,
    user: sanitized,
    message: `Welcome back, ${user.fullName}`,
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = db.findUserById(req.user!.userId);
  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }
  const { passwordHash, passwordSalt, ...sanitized } = user;
  return res.json({ success: true, user: sanitized });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeSessionToken(authHeader.split(' ')[1]);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/staff (Manager and Admin)
router.get('/staff', authenticate, requireRole('ADMIN', 'MANAGER'), (_req, res) => {
  const users = db.getAllUsers().filter((u) => u.role !== 'CUSTOMER');
  return res.json({ success: true, staff: users });
});

// POST /api/auth/staff (Manager and Admin)
router.post('/staff', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res) => {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { email, password, fullName, phone, role } = parsed.data;
  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const { hash, salt } = hashPassword(password);
  const newStaff = db.createUser({
    email,
    fullName,
    phone,
    role,
    isActive: true,
    passwordHash: hash,
    passwordSalt: salt,
  });

  db.appendAuditLog({
    userId: req.user!.userId,
    userName: req.user!.fullName,
    userRole: req.user!.role,
    action: 'CREATE_STAFF_ACCOUNT',
    entityType: 'USER',
    entityId: newStaff.id,
    details: `Created new staff member ${newStaff.fullName} (${newStaff.email}) with role ${newStaff.role}.`,
  });

  return res.status(201).json({ success: true, staff: newStaff, message: 'Staff account created successfully' });
});

export default router;
