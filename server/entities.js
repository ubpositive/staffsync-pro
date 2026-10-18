import express from 'express';
import { query } from './db.js';
import { requireAuth } from './auth.js';

// ---------------------------------------------------------------------------
// Generic entity CRUD, standing in for Base44's `entities.<Name>` SDK module.
// Each config below encodes the same row-level-security rules that used to
// live in base44/entities/<Name>.jsonc, so behavior carries over unchanged:
// every entity here is readable by any authenticated user (Standard Viewers
// included) and writable only by admins.
// ---------------------------------------------------------------------------

function isAdmin(u) { return u.role === 'admin'; }

const ADMIN_ONLY_WRITE = {
  canCreate: (u) => isAdmin(u),
  canRead: () => true,
  canUpdate: (u) => isAdmin(u),
  canDelete: (u) => isAdmin(u),
};

const ENTITY_CONFIGS = {
  Employee: {
    table: 'employees',
    sysCreatedCol: 'created_date_sys',
    sysUpdatedCol: 'updated_date_sys',
    columns: [
      'full_name', 'date_of_birth', 'email', 'phone',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
      'joining_date', 'initial_salary', 'current_salary', 'current_title', 'contract_basis',
      'status', 'last_working_day', 'notice_period_end_date', 'photo_url',
      'benefit_medical_insurance', 'benefit_car', 'benefit_phone', 'benefit_laptop',
      'bonus_months_salary', 'benefit_other', 'benefit_other_note', 'agreed_annual_leave_days',
      'doc_degrees_submitted', 'doc_degrees_url',
      'doc_drivers_license_submitted', 'doc_drivers_license_url',
      'doc_nda_submitted', 'doc_nda_url',
      'doc_employment_offer_submitted', 'doc_employment_offer_url',
      'doc_employment_contract_submitted', 'doc_employment_contract_url',
      'doc_proof_of_address_submitted', 'doc_proof_of_address_url',
      'doc_police_clearance_submitted', 'doc_police_clearance_url',
      'doc_resume_submitted', 'doc_resume_url',
      'doc_resignation_letter_submitted', 'doc_resignation_letter_url',
      'doc_liability_clearance_submitted', 'doc_liability_clearance_url',
      'doc_personal_extract_submitted', 'doc_personal_extract_url',
      'doc_family_book_submitted', 'doc_family_book_url',
      'ssnf_registered', 'ssnf_rate', 'ssnf_registration_date',
    ],
    ...ADMIN_ONLY_WRITE,
  },
  SalaryIncrement: {
    table: 'salary_increments',
    sysCreatedCol: 'created_date_sys',
    sysUpdatedCol: 'updated_date_sys',
    columns: ['employee_id', 'effective_date', 'previous_salary', 'new_salary', 'amount', 'reason'],
    ...ADMIN_ONLY_WRITE,
  },
  Bonus: {
    table: 'bonuses',
    sysCreatedCol: 'created_date_sys',
    sysUpdatedCol: 'updated_date_sys',
    columns: ['employee_id', 'date', 'amount', 'reason'],
    ...ADMIN_ONLY_WRITE,
  },
  TitleHistory: {
    table: 'title_history',
    sysCreatedCol: 'created_date_sys',
    sysUpdatedCol: 'updated_date_sys',
    columns: ['employee_id', 'title', 'start_date', 'end_date', 'reason'],
    ...ADMIN_ONLY_WRITE,
  },
  Leave: {
    table: 'leaves',
    sysCreatedCol: 'created_date_sys',
    sysUpdatedCol: 'updated_date_sys',
    columns: ['employee_id', 'start_date', 'end_date', 'leave_type', 'reason'],
    ...ADMIN_ONLY_WRITE,
  },
  Evaluation: {
    table: 'evaluations',
    sysCreatedCol: 'created_date_sys',
    sysUpdatedCol: 'updated_date_sys',
    columns: [
      'employee_id', 'period_year', 'period_month',
      'timeliness', 'attendance_logging', 'presentation', 'responsiveness',
      'end_of_day_report', 'care_of_tools', 'customer_service',
      'deviations_notes', 'admin_notes',
    ],
    ...ADMIN_ONLY_WRITE,
  },
  SSNFHistory: {
    table: 'ssnf_history',
    sysCreatedCol: 'created_date_sys',
    sysUpdatedCol: 'updated_date_sys',
    columns: ['employee_id', 'effective_date', 'rate', 'previous_rate', 'reason'],
    ...ADMIN_ONLY_WRITE,
  },
};

function rowToJson(config, row) {
  const out = { id: row.id, created_by_id: row.created_by_id };
  for (const col of config.columns) out[col] = row[col];
  out.created_date = row[config.sysCreatedCol];
  out.updated_date = row[config.sysUpdatedCol];
  return out;
}

// Parses base44-style sort strings, including multi-column sort as used by
// EvaluationTab ("-period_year,-period_month"). Unknown fields are dropped.
function parseSort(config, sortParam) {
  if (!sortParam) return [{ col: config.sysCreatedCol, dir: 'DESC' }];
  const parts = String(sortParam).split(',').map((s) => s.trim()).filter(Boolean);
  const clauses = parts.map((field) => {
    const dir = field.startsWith('-') ? 'DESC' : 'ASC';
    const name = field.replace(/^-/, '');
    const col = name === 'created_date' ? config.sysCreatedCol
      : name === 'updated_date' ? config.sysUpdatedCol
      : name === 'id' ? 'id'
      : config.columns.includes(name) ? name
      : null;
    return col ? { col, dir } : null;
  }).filter(Boolean);
  return clauses.length ? clauses : [{ col: config.sysCreatedCol, dir: 'DESC' }];
}

function orderByClause(clauses) {
  return clauses.map((c) => `${c.col} ${c.dir} NULLS LAST`).join(', ');
}

export function makeEntityRouter(name) {
  const config = ENTITY_CONFIGS[name];
  if (!config) throw new Error(`Unknown entity: ${name}`);
  const router = express.Router();
  router.use(requireAuth);

  // list: GET /?sort=-created_date&limit=200
  router.get('/', async (req, res, next) => {
    try {
      const clauses = parseSort(config, req.query.sort);
      const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 1000);
      const { rows } = await query(
        `SELECT * FROM ${config.table} ORDER BY ${orderByClause(clauses)} LIMIT $1`,
        [limit]
      );
      const visible = rows.filter((r) => config.canRead(req.user, r));
      res.json(visible.map((r) => rowToJson(config, r)));
    } catch (err) { next(err); }
  });

  // filter: POST /filter  { field: value, ... }?sort=-date — equality match + optional sort,
  // like base44's .filter(query, sort)
  router.post('/filter', async (req, res, next) => {
    try {
      const filters = req.body || {};
      const keys = Object.keys(filters).filter((k) => config.columns.includes(k));
      const clauses = keys.map((k, i) => `${k} = $${i + 1}`);
      const values = keys.map((k) => filters[k]);
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const order = parseSort(config, req.query.sort);
      const { rows } = await query(
        `SELECT * FROM ${config.table} ${where} ORDER BY ${orderByClause(order)}`,
        values
      );
      const visible = rows.filter((r) => config.canRead(req.user, r));
      res.json(visible.map((r) => rowToJson(config, r)));
    } catch (err) { next(err); }
  });

  // get: GET /:id — single record (used by EmployeeDetail)
  router.get('/:id', async (req, res, next) => {
    try {
      const { rows } = await query(`SELECT * FROM ${config.table} WHERE id = $1`, [req.params.id]);
      const row = rows[0];
      if (!row) return res.status(404).json({ message: 'Not found' });
      if (!config.canRead(req.user, row)) return res.status(403).json({ message: 'Not allowed' });
      res.json(rowToJson(config, row));
    } catch (err) { next(err); }
  });

  router.post('/', async (req, res, next) => {
    try {
      if (!config.canCreate(req.user)) return res.status(403).json({ message: 'Not allowed' });
      const payload = req.body || {};
      const cols = config.columns.filter((c) => payload[c] !== undefined);
      const values = cols.map((c) => payload[c]);
      const placeholders = cols.map((_, i) => `$${i + 2}`);
      const { rows } = await query(
        `INSERT INTO ${config.table} (created_by_id${cols.length ? ', ' + cols.join(', ') : ''})
         VALUES ($1${placeholders.length ? ', ' + placeholders.join(', ') : ''}) RETURNING *`,
        [req.user.id, ...values]
      );
      res.json(rowToJson(config, rows[0]));
    } catch (err) { next(err); }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const { rows: existingRows } = await query(`SELECT * FROM ${config.table} WHERE id = $1`, [req.params.id]);
      const existing = existingRows[0];
      if (!existing) return res.status(404).json({ message: 'Not found' });
      if (!config.canUpdate(req.user, existing)) return res.status(403).json({ message: 'Not allowed' });
      const payload = req.body || {};
      const cols = config.columns.filter((c) => payload[c] !== undefined);
      if (cols.length === 0) return res.json(rowToJson(config, existing));
      const setClauses = cols.map((c, i) => `${c} = $${i + 2}`);
      const values = cols.map((c) => payload[c]);
      const { rows } = await query(
        `UPDATE ${config.table} SET ${setClauses.join(', ')}, ${config.sysUpdatedCol} = now()
         WHERE id = $1 RETURNING *`,
        [req.params.id, ...values]
      );
      res.json(rowToJson(config, rows[0]));
    } catch (err) { next(err); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const { rows: existingRows } = await query(`SELECT * FROM ${config.table} WHERE id = $1`, [req.params.id]);
      const existing = existingRows[0];
      if (!existing) return res.status(404).json({ message: 'Not found' });
      if (!config.canDelete(req.user, existing)) return res.status(403).json({ message: 'Not allowed' });
      await query(`DELETE FROM ${config.table} WHERE id = $1`, [req.params.id]);
      res.json({ success: true });
    } catch (err) { next(err); }
  });

  return router;
}

// Real-time parity: Base44's `.subscribe()` pushed live updates over a
// websocket. The frontend shim (src/api/base44Client.js) polls this
// lightweight "has anything changed" endpoint instead for Employee —
// the only entity any page subscribes to.
export function registerChangeFeedRoute(app) {
  app.get('/api/entities/:name/changed-since', requireAuth, async (req, res, next) => {
    try {
      const config = ENTITY_CONFIGS[req.params.name];
      if (!config) return res.status(404).json({ message: 'Unknown entity' });
      const since = req.query.since ? new Date(req.query.since) : new Date(0);
      const { rows } = await query(
        `SELECT count(*)::int AS n FROM ${config.table} WHERE ${config.sysUpdatedCol} > $1`,
        [since]
      );
      res.json({ changed: rows[0].n > 0, now: new Date().toISOString() });
    } catch (err) { next(err); }
  });
}

export { ENTITY_CONFIGS };
