-- StaffSync Pro — real data migrated from Base44 (captured via the Data browser
-- in the Base44 editor dashboard on 2026-10-18). Run once against a freshly
-- created schema (server/schema.sql) to load the live production data.
--
-- Source: Base44 app id 6a9418c94e578e7f1b551774, Data > Employee / SalaryIncrement.
-- Bonus, Evaluation, Leave, SSNFHistory, TitleHistory were all empty (0 records)
-- in Base44 at the time of migration.

BEGIN;

-- Fixed UUIDs so the SalaryIncrement inserts below can reference them.
-- (Base44's own record ids were 6a94206d283e3b092279a3f8 for Malek Jomaa and
-- 6a941e6c768b315a78a1ff34 for Hussein Deeb; we mint fresh UUIDs here since
-- Base44's ids are 24-char Mongo-style ids, not UUIDs.)

INSERT INTO employees (
  id, full_name, date_of_birth, email, phone,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
  joining_date, initial_salary, current_salary, current_title,
  contract_basis, status, last_working_day, notice_period_end_date, photo_url,
  benefit_medical_insurance, benefit_car, benefit_phone, benefit_laptop,
  bonus_months_salary, benefit_other, benefit_other_note, agreed_annual_leave_days,
  doc_degrees_submitted, doc_degrees_url,
  doc_drivers_license_submitted, doc_drivers_license_url,
  doc_nda_submitted, doc_nda_url,
  doc_employment_offer_submitted, doc_employment_offer_url,
  doc_employment_contract_submitted, doc_employment_contract_url,
  doc_proof_of_address_submitted, doc_proof_of_address_url,
  doc_police_clearance_submitted, doc_police_clearance_url,
  doc_resume_submitted, doc_resume_url,
  doc_resignation_letter_submitted, doc_resignation_letter_url,
  doc_liability_clearance_submitted, doc_liability_clearance_url,
  doc_personal_extract_submitted, doc_personal_extract_url,
  doc_family_book_submitted, doc_family_book_url,
  ssnf_registered, ssnf_rate, ssnf_registration_date
) VALUES
(
  '11111111-1111-1111-1111-111111111101',
  'Malek Jomaa', NULL, 'malekjomaa118@gmail.com', '+961 76 843489',
  'Maysaa', '+961 81 892140', 'Mother',
  '2025-04-02', 600, 800, 'Assistant Field Service Technician',
  'full_time', 'active', NULL, NULL, NULL,
  FALSE, FALSE, FALSE, FALSE,
  NULL, FALSE, NULL, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/47e8dd3a6_MalekJomaa-DriversLicense.pdf',
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/5a4e753db_MalekJomaa-WorkOffer.pdf',
  FALSE, NULL,
  FALSE, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/143b99369_MALEKJOMAA.pdf',
  FALSE, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/e6380d390_MalekJomaa-PersonalExtract.pdf',
  FALSE, NULL,
  FALSE, NULL, NULL
),
(
  '11111111-1111-1111-1111-111111111102',
  'Manaf Hujeyri', NULL, 'manafhjr@gmail.com', '+961 70 216376',
  'Riham', '+961 70 216 376', 'Wife',
  '2022-08-04', 600, 600, 'Senior Field Service Technician',
  'full_time', 'active', NULL, NULL, NULL,
  FALSE, FALSE, TRUE, FALSE,
  '2 months', FALSE, NULL, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/18e5de7db_ManafHujairi-Degree.pdf',
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/b2223716e_ManafHujeyri-NDA.pdf',
  FALSE, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/7d79a3f39_ManafHujairi-ProofofResidence.pdf',
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/cf4910cf1_Manafohujeyri.pdf',
  FALSE, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/4c31e9474_ManafHujairi-PersonalExtract.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/da02f2c15_ManafHujairi-FamilyExtract.pdf',
  TRUE, NULL, NULL
),
(
  '11111111-1111-1111-1111-111111111103',
  'Zein Nasrallah', NULL, 'nassrallahzein3@gmail.com', '+961 3 009792',
  'Hussein', '+961 71 354 466', 'Father',
  '2026-05-12', 600, 600, 'Assistant field Service Technician',
  'full_time', 'active', NULL, NULL, NULL,
  FALSE, FALSE, FALSE, FALSE,
  NULL, FALSE, NULL, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/68371247e_ZeinNasrallah-DriversLicense.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/71faa034d_ZeinNasrallah-NDA.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/c5d8655cc_ZeinNasrallah-WorkOffer.pdf',
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/7dfdb2faa_ZeinNasrallah-ProofofResidence.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/7e178d505_ZeinNasrallah-JudicialClearance.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/c656371e9_ZEINNASRALLAH.pdf',
  FALSE, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/e9c963682_ZeinNasrallah-PersonalExtract.pdf',
  FALSE, NULL,
  FALSE, NULL, NULL
),
(
  '11111111-1111-1111-1111-111111111104',
  'Hussein Deeb', '2000-08-14', 'Eng.housseindeeb@gmail.com', '+961 70 169594',
  NULL, NULL, NULL,
  '2022-08-15', 600, 900, 'Senior Field Service Engineer',
  'full_time', 'resigned', '2026-08-15', '2026-09-11', NULL,
  FALSE, FALSE, FALSE, FALSE,
  '2 months', FALSE, NULL, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/c8047fd0e_HuseeinDeeb-Degree.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/76faed3c5_HusseinDeeb-DriversLicense.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/2f5ca11c0_HusseinDeebNDA.jpeg',
  FALSE, NULL,
  FALSE, NULL,
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/96dd8890d_Huseein-JudicialClearance.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/9728d3231_CVHousseinDeeb.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/c94cc05cb_ResignationHusseinDeeb.pdf',
  FALSE, NULL,
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/230ff2154_HusseinDeeb-PersonalExtract.pdf',
  TRUE, 'https://base44.app/api/apps/6a9418c94e578e7f1b551774/files/mp/public/6a9418c94e578e7f1b551774/37657fe26_HusseinDeeb-FamilyExtract.pdf',
  TRUE, 3825000, NULL
);

-- SalaryIncrement history (3 records total in Base44; Manaf and Zein had none).
INSERT INTO salary_increments (employee_id, effective_date, previous_salary, new_salary, amount, reason) VALUES
('11111111-1111-1111-1111-111111111104', '2024-09-01', 150, 750, 600, NULL),
('11111111-1111-1111-1111-111111111104', '2025-09-01', 750, 900, 150, NULL),
('11111111-1111-1111-1111-111111111101', '2025-08-10', 600, 800, 200, NULL);

-- Bonus, title_history, leaves, evaluations, ssnf_history: left empty —
-- Base44 had 0 records in each of these entities at migration time.

COMMIT;
