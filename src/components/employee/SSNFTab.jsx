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
import { Plus, ShieldCheck, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/hr-utils';

export default function SSNFTab({ employee, isAdmin, onUpdated }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('register'); // register | increase
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ effective_date: '', rate: '', registration_date: '', reason: '' });

  const load = async () => {
    try {
      const list = await base44.entities.SSNFHistory.filter({ employee_id: employee.id }, '-effective_date');
      setHistory(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [employee.id]);

  const openRegister = () => { setMode('register'); setForm({ effective_date: '', rate: '', reason: '' }); setOpen(true); };
  const openIncrease = () => { setMode('increase'); setForm({ effective_date: '', rate: '', reason: '' }); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.effective_date || !form.rate) return;
    setSaving(true);
    try {
      const newRate = Number(form.rate);
      if (mode === 'register') {
        await base44.entities.SSNFHistory.create({
          employee_id: employee.id,
          effective_date: form.effective_date,
          rate: newRate,
          reason: form.reason || 'Initial registration',
        });
        await base44.entities.Employee.update(employee.id, {
          ssnf_registered: true,
          ssnf_rate: newRate,
          ssnf_registration_date: form.effective_date,
        });
      } else {
        const prev = employee.ssnf_rate || 0;
        await base44.entities.SSNFHistory.create({
          employee_id: employee.id,
          effective_date: form.effective_date,
          rate: newRate,
          previous_rate: prev,
          reason: form.reason,
        });
        await base44.entities.Employee.update(employee.id, { ssnf_rate: newRate });
      }
      setOpen(false);
      onUpdated();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {employee.ssnf_registered ? (
            <>
              <div className="px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-500 font-medium">SSNF Status</p>
                <p className="text-lg font-semibold text-emerald-700 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Registered</p>
              </div>
              <div className="px-5 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-500 font-medium">Current Rate</p>
                <p className="text-2xl font-semibold text-indigo-700">{formatCurrency(employee.ssnf_rate)}</p>
              </div>
              <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Registered On</p>
                <p className="text-sm font-medium text-slate-600">{formatDate(employee.ssnf_registration_date)}</p>
              </div>
            </>
          ) : (
            <div className="px-5 py-3 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-xs text-slate-400 font-medium">SSNF Status</p>
              <p className="text-lg font-semibold text-slate-500">Not Registered</p>
            </div>
          )}
          <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Rate Changes</p>
            <p className="text-lg font-semibold text-slate-600">{history.length}</p>
          </div>
        </div>
        {isAdmin && (
          employee.ssnf_registered ? (
            <Button onClick={openIncrease} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Record Rate Change
            </Button>
          ) : (
            <Button onClick={openRegister} className="bg-indigo-600 hover:bg-indigo-700">
              <ShieldCheck className="w-4 h-4 mr-2" /> Register in SSNF
            </Button>
          )
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Effective Date</TableHead>
              <TableHead>Previous Rate</TableHead>
              <TableHead>New Rate</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
            ) : history.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8">No SSNF history yet.</TableCell></TableRow>
            ) : history.map((h) => (
              <TableRow key={h.id} className="hover:bg-slate-50">
                <TableCell className="text-slate-600">{formatDate(h.effective_date)}</TableCell>
                <TableCell className="text-slate-500">{h.previous_rate != null ? formatCurrency(h.previous_rate) : '—'}</TableCell>
                <TableCell className="font-medium text-slate-800">{formatCurrency(h.rate)}</TableCell>
                <TableCell>
                  {h.previous_rate != null ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <TrendingUp className="w-3.5 h-3.5" /> +{formatCurrency(h.rate - h.previous_rate)}
                    </span>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Initial</Badge>
                  )}
                </TableCell>
                <TableCell className="text-slate-500">{h.reason || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'register' ? 'Register in SSNF' : 'Record SSNF Rate Change'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">{mode === 'register' ? 'Registration Date' : 'Effective Date'}</Label>
              <Input type="date" required value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">SSNF Rate</Label>
              <Input type="number" required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
              {mode === 'increase' && <p className="text-xs text-slate-400 mt-1">Current rate: {formatCurrency(employee.ssnf_rate)}</p>}
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Annual adjustment…" rows={2} />
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