import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const distPath = path.resolve(__dirname, 'dist');

// Serve static build assets (JS, CSS, images)
app.use(
  express.static(distPath, {
    index: false,
    maxAge: '1h',
  })
);

// Return 404 for missing static asset files instead of falling through to index.html
app.use('/assets/*', (_req, res) => {
  res.status(404).send('Static asset not found');
});

// Fallback all SPA navigation routes to index.html with no-cache headers
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In development or if not yet built, return simple message
      res.status(200).send('BuildCem Server is running. In dev mode, access through Vite.');
    }
  });
});

const portNumber = Number(PORT) || 3000;
app.listen(portNumber, '0.0.0.0', () => {
  console.log(`BuildCem Server listening on http://0.0.0.0:${portNumber}`);
});
