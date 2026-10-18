import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ensureSchema } from './db.js';
import { registerAuthRoutes } from './auth.js';
import { usersRouter } from './users.js';
import { makeEntityRouter, registerChangeFeedRoute } from './entities.js';
import { uploadsRouter, uploadsDir } from './uploads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());

registerAuthRoutes(app);
app.use('/api/users', usersRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/uploads', express.static(uploadsDir));
app.use('/api/entities/Employee', makeEntityRouter('Employee'));
app.use('/api/entities/SalaryIncrement', makeEntityRouter('SalaryIncrement'));
app.use('/api/entities/Bonus', makeEntityRouter('Bonus'));
app.use('/api/entities/TitleHistory', makeEntityRouter('TitleHistory'));
app.use('/api/entities/Leave', makeEntityRouter('Leave'));
app.use('/api/entities/Evaluation', makeEntityRouter('Evaluation'));
app.use('/api/entities/SSNFHistory', makeEntityRouter('SSNFHistory'));
registerChangeFeedRoute(app);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the built frontend (npm run build outputs to dist/) and let React
// Router handle client-side routes.
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 3000;

ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`StaffSync Pro server listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to prepare database schema:', err);
    process.exit(1);
  });
