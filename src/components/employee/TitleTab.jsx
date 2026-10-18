import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, BadgeCheck } from 'lucide-react';
import { formatDate } from '@/lib/hr-utils';

export default function TitleTab({ employee, isAdmin, onUpdated }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ start_date: '', title: '', reason: '' });

  const load = async () => {
    try {
      const list = await base44.entities.TitleHistory.filter({ employee_id: employee.id }, '-start_date');
      setHistory(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [employee.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.title) return;
    setSaving(true);
    try {
      const currentActive = history.find((h) => !h.end_date);
      if (currentActive) {
        await base44.entities.TitleHistory.update(currentActive.id, { end_date: form.start_date });
      }
      await base44.entities.TitleHistory.create({
        employee_id: employee.id,
        title: form.title,
        start_date: form.start_date,
        reason: form.reason,
      });
      await base44.entities.Employee.update(employee.id, { current_title: form.title });
      setForm({ start_date: '', title: '', reason: '' });
      setOpen(false);
      onUpdated();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-xs text-indigo-500 font-medium">Current Title</p>
            <p className="text-xl font-semibold text-indigo-700">{employee.current_title || '—'}</p>
          </div>
          <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Title Changes</p>
            <p className="text-lg font-semibold text-slate-600">{history.length}</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Record Title Change
          </Button>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Title</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
            ) : history.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8"><BadgeCheck className="w-5 h-5 mx-auto mb-2 text-slate-300" />No title history recorded yet.</TableCell></TableRow>
            ) : history.map((h) => {
              const isCurrent = !h.end_date;
              return (
                <TableRow key={h.id} className="hover:bg-slate-50">
                  <TableCell>
                    <span className="font-medium text-slate-800 flex items-center gap-2">
                      {h.title}
                      {isCurrent && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Current</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">{formatDate(h.start_date)}</TableCell>
                  <TableCell className="text-slate-500">{h.end_date ? formatDate(h.end_date) : '—'}</TableCell>
                  <TableCell className="text-slate-500">{h.reason || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Title Change</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">New Title</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Engineer" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Effective Date</Label>
              <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Promotion, department transfer…" rows={2} />
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