import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL = '30d';

if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is not set — using an insecure default. Set it in Replit Secrets before going live.');
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    approved: row.approved,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

// StaffSync Pro has two roles, matching Base44's User entity and the
// Settings/User Management page: 'admin' (full read/write everywhere) and
// 'user' (read-only everywhere — shown in the UI as "Standard Viewer").
export async function createUser({ email, password, role = 'user', approved = false, full_name = null }) {
  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, role, approved, full_name)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [email, password_hash, role, approved, full_name]
  );
  return rows[0];
}

export { toPublicUser };

// Express middleware: requires a valid bearer token, attaches req.user (full row).
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    if (!user.approved) return res.status(403).json({ message: 'Account pending admin approval' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    next();
  };
}

export function registerAuthRoutes(app) {
  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
      const existing = await findUserByEmail(email);
      if (existing) return res.status(409).json({ message: 'An account with that email already exists' });
      // First account ever created becomes an approved admin, so there is
      // always someone able to approve everyone else.
      const { rows: countRows } = await query('SELECT count(*)::int AS n FROM users');
      const isFirstUser = countRows[0].n === 0;
      const user = await createUser({
        email,
        password,
        role: isFirstUser ? 'admin' : 'user',
        approved: isFirstUser,
      });
      if (isFirstUser) {
        return res.json({ token: signToken(user), user: toPublicUser(user) });
      }
      res.json({ pendingApproval: true, message: 'Account created. An admin needs to approve it before you can log in.' });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
      const user = await findUserByEmail(email);
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
      if (!user.approved) return res.status(403).json({ message: 'Your account is pending admin approval' });
      res.json({ token: signToken(user), user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json(toPublicUser(req.user));
  });
}
