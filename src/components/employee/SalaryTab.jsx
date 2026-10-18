import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/hr-utils';

export default function SalaryTab({ employee, isAdmin, onUpdated }) {
  const [increments, setIncrements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ effective_date: '', new_salary: '', reason: '' });

  const load = async () => {
    try {
      const list = await base44.entities.SalaryIncrement.filter({ employee_id: employee.id }, '-effective_date');
      setIncrements(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [employee.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.effective_date || !form.new_salary) return;
    setSaving(true);
    try {
      const prev = employee.current_salary || 0;
      const next = Number(form.new_salary);
      await base44.entities.SalaryIncrement.create({
        employee_id: employee.id,
        effective_date: form.effective_date,
        previous_salary: prev,
        new_salary: next,
        amount: next - prev,
        reason: form.reason,
      });
      await base44.entities.Employee.update(employee.id, { current_salary: next });
      setForm({ effective_date: '', new_salary: '', reason: '' });
      setOpen(false);
      onUpdated();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this salary record?')) return;
    await base44.entities.SalaryIncrement.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-xs text-indigo-500 font-medium">Current Salary</p>
            <p className="text-2xl font-semibold text-indigo-700">{formatCurrency(employee.current_salary)}</p>
          </div>
          <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Initial Salary</p>
            <p className="text-lg font-semibold text-slate-600">{formatCurrency(employee.initial_salary)}</p>
          </div>
          <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Total Increases</p>
            <p className="text-lg font-semibold text-slate-600">{increments.length}</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Record Increment
          </Button>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Date</TableHead>
              <TableHead>Previous</TableHead>
              <TableHead>New</TableHead>
              <TableHead>Increase</TableHead>
              <TableHead>Reason</TableHead>
              {isAdmin && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
            ) : increments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No salary increments recorded yet.</TableCell></TableRow>
            ) : increments.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50">
                <TableCell className="text-slate-600">{formatDate(s.effective_date)}</TableCell>
                <TableCell className="text-slate-500">{formatCurrency(s.previous_salary)}</TableCell>
                <TableCell className="font-medium text-slate-800">{formatCurrency(s.new_salary)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" /> +{formatCurrency(s.amount)}
                  </span>
                </TableCell>
                <TableCell className="text-slate-500">{s.reason || '—'}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => del(s.id)}>
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
          <DialogHeader><DialogTitle>Record Salary Increment</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Effective Date</Label>
              <Input type="date" required value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">New Salary</Label>
              <Input type="number" required value={form.new_salary} onChange={(e) => setForm({ ...form, new_salary: e.target.value })} />
              <p className="text-xs text-slate-400 mt-1">Previous: {formatCurrency(employee.current_salary)}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Annual review, promotion…" rows={2} />
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