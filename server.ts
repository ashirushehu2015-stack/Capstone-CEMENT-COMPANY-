import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const distPath = path.resolve(__dirname, 'dist');

// Serve static build assets if available
app.use(express.static(distPath));

// Fallback all SPA navigation routes to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In development or if not yet built, return simple message
      res.status(200).send('BuildCem Server is running. In dev mode, access through Vite.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`BuildCem Server listening on port ${PORT}`);
});
