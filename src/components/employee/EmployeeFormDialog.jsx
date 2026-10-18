import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { BENEFIT_DEFS } from '@/lib/hr-utils';

const emptyEmployee = {
  full_name: '', date_of_birth: '', email: '', phone: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
  joining_date: '', initial_salary: '', current_title: '', status: 'active', contract_basis: 'full_time',
  last_working_day: '', notice_period_end_date: '',
  benefit_medical_insurance: false, benefit_car: false, benefit_phone: false, benefit_laptop: false,
  bonus_months_salary: '', benefit_other: false, benefit_other_note: '',
  ssnf_registered: false, ssnf_rate: '', ssnf_registration_date: '',
};

export default function EmployeeFormDialog({ open, onOpenChange, employee, onSaved }) {
  const isEdit = !!employee;
  const [form, setForm] = useState(emptyEmployee);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      if (employee) {
        setForm({ ...emptyEmployee, ...employee, initial_salary: employee.initial_salary ?? '' });
      } else {
        setForm(emptyEmployee);
      }
    }
  }, [open, employee]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.joining_date || !form.current_title || !form.initial_salary) {
      setError('Full name, joining date, title, and initial salary are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        initial_salary: Number(form.initial_salary) || 0,
        current_salary: isEdit ? undefined : (Number(form.initial_salary) || 0),
        ssnf_rate: form.ssnf_rate ? Number(form.ssnf_rate) : undefined,
      };
      if (isEdit) {
        delete data.current_salary;
        await base44.entities.Employee.update(employee.id, data);
      } else {
        const created = await base44.entities.Employee.create(data);
        if (created && created.id && data.ssnf_registered && data.ssnf_rate) {
          await base44.entities.SSNFHistory.create({
            employee_id: created.id,
            effective_date: data.ssnf_registration_date || new Date().toISOString().slice(0, 10),
            rate: data.ssnf_rate,
            reason: 'Initial registration',
          });
        }
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const toggleBenefit = (k, checked) => set(k, checked);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Personal Information">
            <FormField label="Full Name" required>
              <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Jane Doe" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date of Birth">
                <Input type="date" value={form.date_of_birth || ''} onChange={(e) => set('date_of_birth', e.target.value)} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" />
              </FormField>
            </div>
            <FormField label="Phone Number">
              <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 0000" />
            </FormField>
          </Section>

          <Section title="Emergency Contact">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Contact Name">
                <Input value={form.emergency_contact_name || ''} onChange={(e) => set('emergency_contact_name', e.target.value)} />
              </FormField>
              <FormField label="Contact Phone">
                <Input value={form.emergency_contact_phone || ''} onChange={(e) => set('emergency_contact_phone', e.target.value)} />
              </FormField>
              <FormField label="Relationship">
                <Input value={form.emergency_contact_relationship || ''} onChange={(e) => set('emergency_contact_relationship', e.target.value)} placeholder="Spouse" />
              </FormField>
            </div>
          </Section>

          <Section title="Employment">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Joining Date" required>
                <Input type="date" value={form.joining_date || ''} onChange={(e) => set('joining_date', e.target.value)} />
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Employment Type">
              <Select value={form.contract_basis || 'full_time'} onValueChange={(v) => set('contract_basis', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            {(form.status === 'resigned' || form.status === 'terminated') && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Last Day of Work">
                  <Input type="date" value={form.last_working_day || ''} onChange={(e) => set('last_working_day', e.target.value)} />
                </FormField>
                <FormField label="Notice Period End Date">
                  <Input type="date" value={form.notice_period_end_date || ''} onChange={(e) => set('notice_period_end_date', e.target.value)} />
                </FormField>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField label={isEdit ? 'Initial Salary' : 'Base / Initial Salary'} required>
                <Input type="number" value={form.initial_salary || ''} onChange={(e) => set('initial_salary', e.target.value)} placeholder="0" />
              </FormField>
              <FormField label="Current Title" required>
                <Input value={form.current_title || ''} onChange={(e) => set('current_title', e.target.value)} placeholder="Senior Engineer" />
              </FormField>
            </div>
          </Section>

          <Section title="Benefits">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {BENEFIT_DEFS.map((b) => (
                <label key={b.key} className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox checked={!!form[`benefit_${b.key}`]} onCheckedChange={(c) => toggleBenefit(`benefit_${b.key}`, c)} />
                  <span className="text-sm text-slate-700">{b.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox checked={!!form.benefit_other} onCheckedChange={(c) => toggleBenefit('benefit_other', c)} />
                <span className="text-sm text-slate-700">Other</span>
              </label>
            </div>
            <FormField label="Bonus Months Salary">
              <Input value={form.bonus_months_salary || ''} onChange={(e) => set('bonus_months_salary', e.target.value)} placeholder="e.g. 1 month, 13th month" />
            </FormField>
            <FormField label="Other Benefits Description">
              <Textarea value={form.benefit_other_note || ''} onChange={(e) => set('benefit_other_note', e.target.value)} placeholder="Describe any other benefits provided…" rows={2} />
            </FormField>
          </Section>

          <Section title="SSNF Registration">
            <label className="flex items-center gap-2.5 cursor-pointer mb-3">
              <Checkbox checked={!!form.ssnf_registered} onCheckedChange={(c) => set('ssnf_registered', c)} />
              <span className="text-sm text-slate-700">Registered in SSNF</span>
            </label>
            {form.ssnf_registered && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="SSNF Rate">
                  <Input type="number" value={form.ssnf_rate ?? ''} onChange={(e) => set('ssnf_rate', e.target.value)} placeholder="0" />
                </FormField>
                <FormField label="Registration Date">
                  <Input type="date" value={form.ssnf_registration_date || ''} onChange={(e) => set('ssnf_registration_date', e.target.value)} />
                </FormField>
              </div>
            )}
          </Section>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
      <Separator className="mt-5" />
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-500 mb-1.5 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}