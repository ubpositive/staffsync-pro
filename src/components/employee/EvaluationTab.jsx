import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, ClipboardCheck, Check, X } from 'lucide-react';
import { formatDate } from '@/lib/hr-utils';

const CRITERIA = [
  { key: 'timeliness', label: 'Timeliness' },
  { key: 'attendance_logging', label: 'Logging Attendance In & Out' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'responsiveness', label: 'Responsiveness to Calls & Messages' },
  { key: 'end_of_day_report', label: 'Complete & Timely End-of-Day Report' },
  { key: 'care_of_tools', label: 'Care of Tools' },
  { key: 'customer_service', label: 'Customer Service Excellence' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const THIS_YEAR = new Date().getFullYear();

export default function EvaluationTab({ employee, isAdmin, onUpdated }) {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    period_month: new Date().getMonth(),
    period_year: THIS_YEAR,
    deviations_notes: '',
    admin_notes: '',
    checks: {},
  });

  const load = async () => {
    try {
      const list = await base44.entities.Evaluation.filter({ employee_id: employee.id }, '-period_year,-period_month');
      setEvals(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [employee.id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Evaluation.create({
        employee_id: employee.id,
        period_month: Number(form.period_month) + 1,
        period_year: Number(form.period_year),
        ...Object.fromEntries(CRITERIA.map((c) => [c.key, !!form.checks[c.key]])),
        deviations_notes: form.deviations_notes,
        admin_notes: form.admin_notes,
      });
      setForm({ period_month: new Date().getMonth(), period_year: THIS_YEAR, deviations_notes: '', admin_notes: '', checks: {} });
      setOpen(false);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const score = (ev) => CRITERIA.filter((c) => ev[c.key]).length;
  const toggleCheck = (key) => setForm((f) => ({ ...f, checks: { ...f.checks, [key]: !f.checks[key] } }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-400 font-medium">Evaluations on Record</p>
          <p className="text-lg font-semibold text-slate-600">{evals.length}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Evaluation
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-8">Loading…</p>
      ) : evals.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-10 flex flex-col items-center text-slate-400">
            <ClipboardCheck className="w-8 h-8 mb-2 text-slate-300" />
            <p className="text-sm">No evaluations recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evals.map((ev) => (
            <Card key={ev.id} className="border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {MONTHS[ev.period_month - 1] || ev.period_month} {ev.period_year}
                    </h3>
                    <p className="text-xs text-slate-400">Recorded {formatDate(ev.created_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-indigo-600">{score(ev)}/{CRITERIA.length}</p>
                    <p className="text-xs text-slate-400">criteria met</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                  {CRITERIA.map((c) => (
                    <div key={c.key} className="flex items-center gap-2 text-sm">
                      {ev[c.key] ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <X className="w-4 h-4 text-slate-300 shrink-0" />}
                      <span className={ev[c.key] ? 'text-slate-700' : 'text-slate-400'}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {(ev.deviations_notes || ev.admin_notes) && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    {ev.deviations_notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-1">DEVIATIONS</p>
                        <p className="text-sm text-slate-600">{ev.deviations_notes}</p>
                      </div>
                    )}
                    {ev.admin_notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-1">ADMIN NOTES</p>
                        <p className="text-sm text-slate-600">{ev.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Monthly Evaluation</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">Month</Label>
                <Select value={String(form.period_month)} onValueChange={(v) => setForm({ ...form, period_month: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">Year</Label>
                <Input type="number" value={form.period_year} onChange={(e) => setForm({ ...form, period_year: Number(e.target.value) })} />
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm font-semibold text-slate-700 mb-3">Evaluation Checklist</p>
              <div className="space-y-2.5">
                {CRITERIA.map((c) => (
                  <label key={c.key} className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox checked={!!form.checks[c.key]} onCheckedChange={() => toggleCheck(c.key)} />
                    <span className="text-sm text-slate-700">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Notes on Deviations</Label>
              <Textarea value={form.deviations_notes} onChange={(e) => setForm({ ...form, deviations_notes: e.target.value })} placeholder="Describe any deviations…" rows={2} />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Admin Notes</Label>
              <Textarea value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} placeholder="Additional administrative notes…" rows={2} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">{saving ? 'Saving…' : 'Submit Evaluation'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}