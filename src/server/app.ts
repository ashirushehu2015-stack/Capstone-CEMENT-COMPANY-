import express from 'express';
import authRoutes from './routes/authRoutes.ts';
import productRoutes from './routes/productRoutes.ts';
import orderRoutes from './routes/orderRoutes.ts';
import inventoryRoutes from './routes/inventoryRoutes.ts';
import paymentRoutes from './routes/paymentRoutes.ts';
import deliveryRoutes from './routes/deliveryRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security & CORS headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'BuildCem Nigeria API',
    currency: 'NGN',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler for unmatched /api requests
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

export default app;
