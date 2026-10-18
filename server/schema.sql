-- StaffSync Pro — Postgres schema (replaces Base44's managed entities)
-- Run once against the app's database (Replit's built-in Postgres sets
-- DATABASE_URL automatically; see server/db.js).

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  approved      BOOLEAN NOT NULL DEFAULT FALSE,
  created_date  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                           TEXT NOT NULL,
  date_of_birth                       DATE,
  email                               TEXT,
  phone                               TEXT,
  emergency_contact_name              TEXT,
  emergency_contact_phone             TEXT,
  emergency_contact_relationship      TEXT,
  joining_date                        DATE NOT NULL,
  initial_salary                      NUMERIC NOT NULL,
  current_salary                      NUMERIC,
  current_title                       TEXT NOT NULL,
  contract_basis                      TEXT NOT NULL DEFAULT 'full_time'
                                         CHECK (contract_basis IN ('full_time', 'part_time', 'daily', 'contract')),
  status                              TEXT NOT NULL DEFAULT 'active'
                                         CHECK (status IN ('active', 'on_leave', 'terminated', 'resigned')),
  last_working_day                    DATE,
  notice_period_end_date              DATE,
  photo_url                           TEXT,
  benefit_medical_insurance           BOOLEAN NOT NULL DEFAULT FALSE,
  benefit_car                         BOOLEAN NOT NULL DEFAULT FALSE,
  benefit_phone                       BOOLEAN NOT NULL DEFAULT FALSE,
  benefit_laptop                      BOOLEAN NOT NULL DEFAULT FALSE,
  bonus_months_salary                 TEXT,
  benefit_other                       BOOLEAN NOT NULL DEFAULT FALSE,
  benefit_other_note                  TEXT,
  agreed_annual_leave_days            NUMERIC,
  doc_degrees_submitted               BOOLEAN NOT NULL DEFAULT FALSE,
  doc_degrees_url                     TEXT,
  doc_drivers_license_submitted       BOOLEAN NOT NULL DEFAULT FALSE,
  doc_drivers_license_url             TEXT,
  doc_nda_submitted                   BOOLEAN NOT NULL DEFAULT FALSE,
  doc_nda_url                         TEXT,
  doc_employment_offer_submitted      BOOLEAN NOT NULL DEFAULT FALSE,
  doc_employment_offer_url            TEXT,
  doc_employment_contract_submitted   BOOLEAN NOT NULL DEFAULT FALSE,
  doc_employment_contract_url         TEXT,
  doc_proof_of_address_submitted      BOOLEAN NOT NULL DEFAULT FALSE,
  doc_proof_of_address_url            TEXT,
  doc_police_clearance_submitted      BOOLEAN NOT NULL DEFAULT FALSE,
  doc_police_clearance_url            TEXT,
  doc_resume_submitted                BOOLEAN NOT NULL DEFAULT FALSE,
  doc_resume_url                      TEXT,
  doc_resignation_letter_submitted    BOOLEAN NOT NULL DEFAULT FALSE,
  doc_resignation_letter_url          TEXT,
  doc_liability_clearance_submitted   BOOLEAN NOT NULL DEFAULT FALSE,
  doc_liability_clearance_url         TEXT,
  doc_personal_extract_submitted      BOOLEAN NOT NULL DEFAULT FALSE,
  doc_personal_extract_url            TEXT,
  doc_family_book_submitted           BOOLEAN NOT NULL DEFAULT FALSE,
  doc_family_book_url                 TEXT,
  ssnf_registered                     BOOLEAN NOT NULL DEFAULT FALSE,
  ssnf_rate                           NUMERIC,
  ssnf_registration_date              DATE,
  created_by_id                       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date_sys                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date_sys                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_increments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date    DATE NOT NULL,
  previous_salary   NUMERIC,
  new_salary        NUMERIC NOT NULL,
  amount            NUMERIC,
  reason            TEXT,
  created_by_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bonuses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  amount            NUMERIC NOT NULL,
  reason            TEXT NOT NULL,
  created_by_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS title_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE,
  reason            TEXT,
  created_by_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaves (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  leave_type        TEXT NOT NULL DEFAULT 'paid' CHECK (leave_type IN ('paid', 'unpaid')),
  reason            TEXT,
  created_by_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_year           INTEGER NOT NULL,
  period_month          INTEGER NOT NULL,
  timeliness            BOOLEAN NOT NULL DEFAULT FALSE,
  attendance_logging    BOOLEAN NOT NULL DEFAULT FALSE,
  presentation          BOOLEAN NOT NULL DEFAULT FALSE,
  responsiveness        BOOLEAN NOT NULL DEFAULT FALSE,
  end_of_day_report     BOOLEAN NOT NULL DEFAULT FALSE,
  care_of_tools         BOOLEAN NOT NULL DEFAULT FALSE,
  customer_service      BOOLEAN NOT NULL DEFAULT FALSE,
  deviations_notes      TEXT,
  admin_notes           TEXT,
  created_by_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date_sys      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date_sys      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ssnf_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date    DATE NOT NULL,
  rate              NUMERIC NOT NULL,
  previous_rate     NUMERIC,
  reason            TEXT,
  created_by_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date_sys  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salary_increments_employee ON salary_increments(employee_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_employee ON bonuses(employee_id);
CREATE INDEX IF NOT EXISTS idx_title_history_employee ON title_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_ssnf_history_employee ON ssnf_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
