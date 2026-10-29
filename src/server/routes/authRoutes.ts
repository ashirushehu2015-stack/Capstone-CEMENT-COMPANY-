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
  const staffRoles = ['MANAGER', 'ASSISTANT_MANAGER', 'AGENT', 'STORE_MANAGER', 'SALES_OFFICER', 'DELIVERY_OFFICER'];
  const users = db.getAllUsers().filter((u) => staffRoles.includes(u.role) && u.email !== 'admin@aamaster.ng' && u.email !== 'ashirushehu2015@gmail.com');
  return res.json({ success: true, staff: users });
});

// GET /api/auth/customers (Manager and Admin)
router.get('/customers', authenticate, requireRole('ADMIN', 'MANAGER'), (_req, res) => {
  const customers = db.getCustomers();
  return res.json({ success: true, customers });
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

// PUT /api/auth/staff/:id (Update Staff Profile & Role)
router.put('/staff/:id', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updateSchema = z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    role: z.enum(['MANAGER', 'ASSISTANT_MANAGER', 'AGENT', 'ADMIN', 'STORE_MANAGER', 'SALES_OFFICER', 'DELIVERY_OFFICER']).optional(),
    isActive: z.boolean().optional(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const existing = db.findUserById(id);
  if (!existing || existing.role === 'CUSTOMER') {
    return res.status(404).json({ success: false, error: 'Staff member not found' });
  }

  const updated = db.updateUser(id, parsed.data);

  db.appendAuditLog({
    userId: req.user!.userId,
    userName: req.user!.fullName,
    userRole: req.user!.role,
    action: 'UPDATE_STAFF_ACCOUNT',
    entityType: 'USER',
    entityId: id,
    details: `Updated staff ${existing.fullName}: ${JSON.stringify(parsed.data)}`,
  });

  return res.json({ success: true, staff: updated, message: 'Staff profile updated successfully' });
});

// PATCH /api/auth/staff/:id/toggle-status (Suspend or Activate Account)
router.patch('/staff/:id/toggle-status', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  if (id === req.user!.userId) {
    return res.status(400).json({ success: false, error: 'Cannot deactivate your own active session account' });
  }

  const existing = db.findUserById(id);
  if (!existing || existing.role === 'CUSTOMER') {
    return res.status(404).json({ success: false, error: 'Staff member not found' });
  }

  if (existing.role === 'MANAGER' || existing.id === 'usr_mgr_001') {
    return res.status(403).json({ success: false, error: 'Cannot suspend primary executive administrator accounts' });
  }

  const newStatus = !existing.isActive;
  const updated = db.updateUser(id, { isActive: newStatus });

  db.appendAuditLog({
    userId: req.user!.userId,
    userName: req.user!.fullName,
    userRole: req.user!.role,
    action: newStatus ? 'ACTIVATE_STAFF_ACCOUNT' : 'SUSPEND_STAFF_ACCOUNT',
    entityType: 'USER',
    entityId: id,
    details: `${newStatus ? 'Activated' : 'Suspended'} staff access for ${existing.fullName} (${existing.role})`,
  });

  return res.json({
    success: true,
    staff: updated,
    message: `Account for ${existing.fullName} is now ${newStatus ? 'ACTIVE' : 'SUSPENDED'}.`,
  });
});

// POST /api/auth/staff/:id/reset-password (Set or generate temporary password)
router.post('/staff/:id/reset-password', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const resetSchema = z.object({
    password: z.string().min(6).optional(),
  });

  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const existing = db.findUserById(id);
  if (!existing || existing.role === 'CUSTOMER') {
    return res.status(404).json({ success: false, error: 'Staff member not found' });
  }

  const newPass = parsed.data.password || 'AAMaster-' + Math.floor(100000 + Math.random() * 900000);
  const { hash, salt } = hashPassword(newPass);

  db.updateUser(id, {
    passwordHash: hash,
    passwordSalt: salt,
  });

  db.appendAuditLog({
    userId: req.user!.userId,
    userName: req.user!.fullName,
    userRole: req.user!.role,
    action: 'RESET_STAFF_PASSWORD',
    entityType: 'USER',
    entityId: id,
    details: `Reset password for staff member ${existing.fullName} (${existing.email})`,
  });

  return res.json({
    success: true,
    temporaryPassword: newPass,
    message: `Password successfully updated for ${existing.fullName}`,
  });
});

// DELETE /api/auth/staff/:id (Delete Staff Member)
router.delete('/staff/:id', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  if (id === req.user!.userId) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own active session account' });
  }

  const existing = db.findUserById(id);
  if (!existing || existing.role === 'CUSTOMER') {
    return res.status(404).json({ success: false, error: 'Staff member not found' });
  }

  if (existing.role === 'MANAGER' || existing.id === 'usr_mgr_001') {
    return res.status(403).json({ success: false, error: 'Cannot delete primary executive administrator accounts' });
  }

  db.deleteUser(id);

  db.appendAuditLog({
    userId: req.user!.userId,
    userName: req.user!.fullName,
    userRole: req.user!.role,
    action: 'DELETE_STAFF_ACCOUNT',
    entityType: 'USER',
    entityId: id,
    details: `Permanently removed staff account ${existing.fullName} (${existing.email}) [${existing.role}]`,
  });

  return res.json({ success: true, message: `Staff member ${existing.fullName} removed successfully` });
});

export default router;
