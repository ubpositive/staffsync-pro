import { format, differenceInYears, parseISO } from 'date-fns';

export function formatCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function calcAge(dobStr) {
  if (!dobStr) return null;
  try {
    return differenceInYears(new Date(), parseISO(dobStr));
  } catch {
    return null;
  }
}

export function yearsOfService(joiningStr) {
  if (!joiningStr) return null;
  try {
    return differenceInYears(new Date(), parseISO(joiningStr));
  } catch {
    return null;
  }
}

export const REQUIRED_DOCS = [
  { key: 'degrees', label: 'Degrees' },
  { key: 'drivers_license', label: "Driver's Licence" },
  { key: 'nda', label: 'Signed NDA' },
  { key: 'employment_offer', label: 'Signed Employment Offer' },
  { key: 'employment_contract', label: 'Employment Contract' },
  { key: 'proof_of_address', label: 'Proof of Address' },
  { key: 'police_clearance', label: 'Police Clearance' },
  { key: 'resume', label: 'Resume' },
  { key: 'resignation_letter', label: 'Resignation Letter' },
  { key: 'liability_clearance', label: 'Liability Clearance Letter' },
  { key: 'personal_extract', label: 'Personal Extract' },
  { key: 'family_book', label: 'Family Book' },
];

export const BENEFIT_DEFS = [
  { key: 'medical_insurance', label: 'Medical Insurance' },
  { key: 'car', label: 'Car' },
  { key: 'phone', label: 'Phone' },
  { key: 'laptop', label: 'Laptop' },
];

export function getMissingDocs(emp) {
  return REQUIRED_DOCS.filter(d => !emp[`doc_${d.key}_submitted`]);
}

export function getSubmittedDocCount(emp) {
  return REQUIRED_DOCS.filter(d => emp[`doc_${d.key}_submitted`]).length;
}

export const LEAVE_TIERS = [
  { label: 'Less than 1 year (pro-rata)', minYears: 0, maxYears: 1, days: 15, proRata: true },
  { label: '1–5 years', minYears: 1, maxYears: 5, days: 15 },
  { label: '5–15 years', minYears: 5, maxYears: 15, days: 17 },
  { label: '15+ years', minYears: 15, maxYears: Infinity, days: 30 },
];

export function getLeaveTier(tenure) {
  if (tenure == null) return LEAVE_TIERS[0];
  return LEAVE_TIERS.find((t) => tenure >= t.minYears && tenure < t.maxYears) || LEAVE_TIERS[LEAVE_TIERS.length - 1];
}

export function getLegalLeaveDays(employee) {
  const tenure = yearsOfService(employee?.joining_date);
  const tier = getLeaveTier(tenure);
  if (tier.proRata && tenure != null && tenure < 1) {
    const joined = employee?.joining_date ? parseISO(employee.joining_date) : null;
    if (!joined) return 15;
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    let months = (endOfYear.getFullYear() - joined.getFullYear()) * 12 + (endOfYear.getMonth() - joined.getMonth()) + 1;
    months = Math.min(Math.max(months, 0), 12);
    return Math.round((15 * months) / 12);
  }
  return tier.days;
}

export function getLeaveEntitlement(employee) {
  const tenure = yearsOfService(employee?.joining_date);
  const tier = getLeaveTier(tenure);
  const legalDays = getLegalLeaveDays(employee);
  const agreed = employee?.agreed_annual_leave_days;
  const agreedDays = agreed != null && !isNaN(agreed) ? Number(agreed) : null;
  const effective = agreedDays != null && agreedDays > legalDays ? agreedDays : legalDays;
  return { legalDays, agreedDays, effective, tierLabel: tier.label, tenure };
}