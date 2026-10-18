import express from 'express';
import crypto from 'crypto';
import { query } from './db.js';
import { requireAuth, requireRole, createUser, findUserByEmail, toPublicUser } from './auth.js';

export const usersRouter = express.Router();
usersRouter.use(requireAuth);

function sortColumn(sortParam) {
  const dir = sortParam?.startsWith('-') ? 'DESC' : 'ASC';
  const field = (sortParam || 'created_date').replace(/^-/, '');
  const col = ['email', 'full_name', 'role', 'approved'].includes(field) ? field : 'created_date';
  return { col, dir };
}

// list — admin only (mirrors the Settings/User Management page, which is itself admin-gated)
usersRouter.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { col, dir } = sortColumn(req.query.sort);
    const { rows } = await query(`SELECT * FROM users ORDER BY ${col} ${dir}`);
    res.json(rows.map(toPublicUser));
  } catch (err) { next(err); }
});

usersRouter.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { role, approved } = req.body || {};
    if (req.params.id === req.user.id && role && role !== req.user.role) {
      return res.status(400).json({ message: "You can't change your own role" });
    }
    const sets = [];
    const values = [];
    if (role !== undefined) { values.push(role); sets.push(`role = $${values.length}`); }
    if (approved !== undefined) { values.push(approved); sets.push(`approved = $${values.length}`); }
    if (!sets.length) {
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
      return res.json(toPublicUser(rows[0]));
    }
    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE users SET ${sets.join(', ')}, updated_date = now() WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    res.json(toPublicUser(rows[0]));
  } catch (err) { next(err); }
});

usersRouter.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "You can't remove yourself" });
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Invite: admin creates the account up front (pre-approved) since there's no
// email service wired up. Returns a one-time temporary password for the
// admin to relay to the person directly — they should change it after login.
usersRouter.post('/invite', requireRole('admin'), async (req, res, next) => {
  try {
    const { email, role = 'user' } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'That email is already registered' });
    const tempPassword = crypto.randomBytes(6).toString('base64url');
    const user = await createUser({ email, password: tempPassword, role, approved: true });
    res.json({ user: toPublicUser(user), tempPassword });
  } catch (err) { next(err); }
});

// Admin-triggered password reset (stands in for base44's emailed reset link,
// since no email service is configured — see server/auth.js README note).
usersRouter.post('/:id/reset-password', requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const target = rows[0];
    if (!target) return res.status(404).json({ message: 'Not found' });
    const tempPassword = crypto.randomBytes(6).toString('base64url');
    const bcrypt = (await import('bcryptjs')).default;
    const password_hash = await bcrypt.hash(tempPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_date = now() WHERE id = $2', [password_hash, target.id]);
    res.json({ tempPassword });
  } catch (err) { next(err); }
});
