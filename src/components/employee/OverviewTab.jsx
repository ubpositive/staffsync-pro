import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Phone, Mail, Calendar, Briefcase, HeartPulse, FileText } from 'lucide-react';
import { formatCurrency, formatDate, calcAge, yearsOfService, BENEFIT_DEFS, REQUIRED_DOCS, getSubmittedDocCount } from '@/lib/hr-utils';

export default function OverviewTab({ employee: e }) {
  const age = calcAge(e.date_of_birth);
  const tenure = yearsOfService(e.joining_date);
  const docCount = getSubmittedDocCount(e);

  return (
    <div className="grid grid-cols-2 gap-5">
      <InfoCard title="Personal Information" icon={<Briefcase className="w-4 h-4 text-indigo-600" />}>
        <InfoRow label="Full Name" value={e.full_name} />
        <InfoRow label="Date of Birth" value={e.date_of_birth ? `${formatDate(e.date_of_birth)}${age != null ? ` (${age} yrs)` : ''}` : '—'} />
        <InfoRow label="Email" value={e.email} icon={<Mail className="w-3.5 h-3.5 text-slate-400" />} />
        <InfoRow label="Phone" value={e.phone} icon={<Phone className="w-3.5 h-3.5 text-slate-400" />} />
      </InfoCard>

      <InfoCard title="Emergency Contact" icon={<HeartPulse className="w-4 h-4 text-rose-600" />}>
        <InfoRow label="Contact Name" value={e.emergency_contact_name} />
        <InfoRow label="Contact Phone" value={e.emergency_contact_phone} />
        <InfoRow label="Relationship" value={e.emergency_contact_relationship} />
      </InfoCard>

      <InfoCard title="Employment" icon={<Calendar className="w-4 h-4 text-emerald-600" />}>
        <InfoRow label="Joining Date" value={e.joining_date ? `${formatDate(e.joining_date)}${tenure != null ? ` · ${tenure} yr${tenure !== 1 ? 's' : ''}` : ''}` : '—'} />
        <InfoRow label="Current Title" value={e.current_title} />
        <InfoRow label="Employment Type" value={<span className="capitalize">{(e.contract_basis || 'full_time').replace('_', '-')}</span>} />
        <InfoRow label="Current Salary" value={formatCurrency(e.current_salary)} />
        <InfoRow label="Initial Salary" value={formatCurrency(e.initial_salary)} />
        <InfoRow label="Status" value={<span className="capitalize">{e.status?.replace('_', ' ')}</span>} />
        {(e.status === 'resigned' || e.status === 'terminated') && (
          <>
            <InfoRow label="Last Day of Work" value={e.last_working_day ? formatDate(e.last_working_day) : '—'} />
            <InfoRow label="Notice Period End" value={e.notice_period_end_date ? formatDate(e.notice_period_end_date) : '—'} />
          </>
        )}
      </InfoCard>

      <InfoCard title="Benefits" icon={<Check className="w-4 h-4 text-amber-600" />}>
        <div className="grid grid-cols-2 gap-2.5">
          {BENEFIT_DEFS.map((b) => (
            <BenefitItem key={b.key} label={b.label} active={!!e[`benefit_${b.key}`]} />
          ))}
          <BenefitItem label="Other" active={!!e.benefit_other} />
          {e.bonus_months_salary && (
            <div className="col-span-2 text-sm text-slate-600 py-1">
              <span className="text-slate-400">Bonus Months Salary: </span>
              <span className="font-medium">{e.bonus_months_salary}</span>
            </div>
          )}
          <div className="col-span-2 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-400 mb-1">Other Benefits</div>
            <p className="text-sm text-slate-600">{e.benefit_other_note || 'Not specified'}</p>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Documents Summary" icon={<FileText className="w-4 h-4 text-slate-600" />}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-lg font-semibold ${docCount === REQUIRED_DOCS.length ? 'text-emerald-600' : 'text-amber-600'}`}>
            {docCount}/{REQUIRED_DOCS.length}
          </span>
          <span className="text-sm text-slate-400">submitted</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {REQUIRED_DOCS.map((d) => (
            <div key={d.key} className="flex items-center gap-2 text-sm">
              {e[`doc_${d.key}_submitted`] ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={e[`doc_${d.key}_submitted`] ? 'text-slate-600' : 'text-slate-400'}>{d.label}</span>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-sm text-slate-400 shrink-0 flex items-center gap-1.5">{icon}{label}</span>
      <span className="text-sm text-slate-700 text-right font-medium">{value || '—'}</span>
    </div>
  );
}

function BenefitItem({ label, active }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {active ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
      <span className={active ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
    </div>
  );
}