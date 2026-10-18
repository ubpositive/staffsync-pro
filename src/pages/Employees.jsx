import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Plus, Search, Eye, Pencil, ChevronRight } from 'lucide-react';
import EmployeeFormDialog from '@/components/employee/EmployeeFormDialog';
import { formatCurrency, formatDate, calcAge, getSubmittedDocCount, REQUIRED_DOCS } from '@/lib/hr-utils';

const STATUS_STYLE = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200',
  terminated: 'bg-red-50 text-red-700 border-red-200',
  resigned: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function Employees() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadEmployees = async () => {
    try {
      const list = await base44.entities.Employee.list('-created_date', 500);
      setEmployees(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filtered = employees.filter((e) =>
    !search ||
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.current_title?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (emp) => { setEditing(emp); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); loadEmployees(); };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employees</h1>
          <p className="text-slate-500 text-sm mt-1">{employees.length} employee{employees.length !== 1 ? 's' : ''} in the directory</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        )}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, title, or email…"
          className="pl-9"
        />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[28%]">Employee</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-10">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-10">
                  {employees.length === 0 ? 'No employees yet.' : 'No matches found.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => {
                const age = calcAge(e.date_of_birth);
                const docCount = getSubmittedDocCount(e);
                return (
                  <TableRow key={e.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Link to={`/employees/${e.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {e.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{e.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">{e.email || '—'}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600">{e.current_title || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${STATUS_STYLE[e.status] || ''} capitalize`}>
                        {e.status?.replace('_', ' ') || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(e.joining_date)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{age != null ? `${age}` : '—'}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{formatCurrency(e.current_salary)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${docCount === REQUIRED_DOCS.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {docCount}/{REQUIRED_DOCS.length}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => openEdit(e)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        <Link to={`/employees/${e.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <EmployeeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} employee={editing} onSaved={onSaved} />
    </div>
  );
}