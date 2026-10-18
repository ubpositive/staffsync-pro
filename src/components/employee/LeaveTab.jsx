import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Plus, Trash2, CalendarDays, Info } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { formatDate, getLeaveEntitlement } from '@/lib/hr-utils';

export default function LeaveTab({ employee, isAdmin, onUpdated }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agreeSaving, setAgreeSaving] = useState(false);
  const [agreedDays, setAgreedDays] = useState('');
  const [form, setForm] = useState({ start_date: '', end_date: '', leave_type: 'paid', reason: '' });

  const load = async () => {
    try {
      const list = await base44.entities.Leave.filter({ employee_id: employee.id }, '-start_date');
      setLeaves(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [employee.id]);
  useEffect(() => { setAgreedDays(employee.agreed_annual_leave_days ?? ''); }, [employee.agreed_annual_leave_days]);

  const thisYear = new Date().getFullYear();
  const dayCount = (l) => {
    try { return differenceInDays(parseISO(l.end_date), parseISO(l.start_date)) + 1; } catch { return 0; }
  };
  const inYear = (l) => {
    try { return parseISO(l.start_date).getFullYear() === thisYear; } catch { return false; }
  };
  const paidDays = leaves.filter((l) => l.leave_type === 'paid').reduce((s, l) => s + dayCount(l), 0);
  const unpaidDays = leaves.filter((l) => l.leave_type === 'unpaid').reduce((s, l) => s + dayCount(l), 0);
  const paidDaysThisYear = leaves.filter((l) => l.leave_type === 'paid' && inYear(l)).reduce((s, l) => s + dayCount(l), 0);

  const entitlement = getLeaveEntitlement(employee);
  const remaining = entitlement.effective - paidDaysThisYear;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) return;
    setSaving(true);
    try {
      await base44.entities.Leave.create({
        employee_id: employee.id,
        start_date: form.start_date,
        end_date: form.end_date,
        leave_type: form.leave_type,
        reason: form.reason,
      });
      setForm({ start_date: '', end_date: '', leave_type: 'paid', reason: '' });
      setOpen(false);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this leave record?')) return;
    await base44.entities.Leave.delete(id);
    load();
  };

  const saveAgreed = async () => {
    setAgreeSaving(true);
    try {
      const val = agreedDays === '' ? null : Number(agreedDays);
      await base44.entities.Employee.update(employee.id, { agreed_annual_leave_days: val });
      onUpdated();
    } catch (err) { console.error(err); }
    finally { setAgreeSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-500 font-medium">Paid Leave Days</p>
            <p className="text-2xl font-semibold text-emerald-700">{paidDays}</p>
          </div>
          <div className="px-5 py-3 rounded-xl bg-slate-100 border border-slate-200">
            <p className="text-xs text-slate-400 font-medium">Unpaid Leave Days</p>
            <p className="text-2xl font-semibold text-slate-600">{unpaidDays}</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Leave
          </Button>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Annual Leave Entitlement — {thisYear}</h3>
          <span className="text-xs text-slate-400">{entitlement.tierLabel}</span>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <EntBox label="Legal Minimum" value={entitlement.legalDays} tone="slate" />
          <EntBox label="Entitlement" value={entitlement.effective} tone="indigo" hint={entitlement.agreedDays != null ? `Agreed: ${entitlement.agreedDays}` : 'No override'} />
          <EntBox label="Used (this year)" value={paidDaysThisYear} tone="amber" />
          <EntBox label="Remaining" value={remaining} tone={remaining < 0 ? 'red' : 'emerald'} />
        </div>
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span>Per Lebanese labor law, annual leave scales with years of service. Any unused leave expires on December 31 and does not carry over to the next year.</span>
        </div>
        {isAdmin && (
          <div className="flex items-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="w-44">
              <Label className="text-xs text-slate-500 mb-1.5 block">Agreed Annual Leave Days</Label>
              <Input type="number" min="0" value={agreedDays} onChange={(e) => setAgreedDays(e.target.value)} placeholder="Optional" />
            </div>
            <Button variant="outline" size="sm" onClick={saveAgreed} disabled={agreeSaving}>
              {agreeSaving ? 'Saving…' : 'Save'}
            </Button>
            <p className="text-xs text-slate-400 pb-2">Used only if higher than the legal minimum ({entitlement.legalDays} days).</p>
          </div>
        )}
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              {isAdmin && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
            ) : leaves.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8"><CalendarDays className="w-5 h-5 mx-auto mb-2 text-slate-300" />No leave records yet.</TableCell></TableRow>
            ) : leaves.map((l) => (
              <TableRow key={l.id} className="hover:bg-slate-50">
                <TableCell className="text-slate-600">{formatDate(l.start_date)}</TableCell>
                <TableCell className="text-slate-600">{formatDate(l.end_date)}</TableCell>
                <TableCell className="text-slate-500">{dayCount(l)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={l.leave_type === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                    {l.leave_type === 'paid' ? 'Paid' : 'Unpaid'}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500">{l.reason || '—'}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => del(l.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Leave Record</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">Start Date</Label>
                <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">End Date</Label>
                <Input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Leave Type</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Reason</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Annual, sick, personal…" />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EntBox({ label, value, tone, hint }) {
  const toneMap = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${toneMap[tone]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-semibold leading-tight">{value}</p>
      {hint && <p className="text-[11px] opacity-60 mt-0.5">{hint}</p>}
    </div>
  );
}