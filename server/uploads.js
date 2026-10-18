import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { requireAuth, requireRole } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

// 20MB cap — plenty for the employee document types (IDs, contracts,
// scanned letters) this app tracks; nothing here is video/large media.
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

export const uploadsRouter = express.Router();

// Stands in for base44.integrations.Core.UploadFile({ file }), used by
// DocumentsTab to upload each of the 12 tracked document types. Any
// authenticated user can upload (Employee writes are still admin-gated at
// the entity layer — DocumentsTab only lets admins check the box), but we
// still require admin here since only admins can edit employee records.
uploadsRouter.post('/', requireAuth, requireRole('admin'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file provided' });
  res.json({ file_url: `/uploads/${req.file.filename}` });
});
