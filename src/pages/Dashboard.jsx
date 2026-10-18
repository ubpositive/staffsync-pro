import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, UserCheck, UserMinus, Wallet, FileWarning, ShieldAlert,
  CalendarOff, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDate, calcAge, getMissingDocs, getSubmittedDocCount, REQUIRED_DOCS } from '@/lib/hr-utils';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Employee.list('-created_date', 200);
        setEmployees(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = employees.length;
  const active = employees.filter((e) => e.status === 'active').length;
  const onLeave = employees.filter((e) => e.status === 'on_leave').length;
  const terminated = employees.filter((e) => e.status === 'terminated').length;
  const avgSalary = employees.length
    ? Math.round(employees.reduce((s, e) => s + (e.current_salary || 0), 0) / employees.length)
    : 0;

  const missingDocs = employees.filter((e) => getMissingDocs(e).length > 0);
  const notSsnf = employees.filter((e) => !e.ssnf_registered);
  const onLeaveEmps = employees.filter((e) => e.status === 'on_leave');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your workforce and compliance alerts</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Employees" value={total} color="indigo" />
        <StatCard icon={UserCheck} label="Active" value={active} color="emerald" />
        <StatCard icon={UserMinus} label="On Leave" value={onLeave} color="amber" />
        <StatCard icon={Wallet} label="Avg. Salary" value={formatCurrency(avgSalary)} color="slate" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <AlertCard
          icon={FileWarning}
          color="red"
          title="Missing Documents"
          count={missingDocs.length}
          emptyText="All employees have submitted their required documents."
        >
          {missingDocs.slice(0, 6).map((e) => (
            <AlertRow key={e.id} name={e.full_name} sub={`${getMissingDocs(e).length} of ${REQUIRED_DOCS.length} missing`} empId={e.id} />
          ))}
        </AlertCard>

        <AlertCard
          icon={ShieldAlert}
          color="orange"
          title="SSNF Not Registered"
          count={notSsnf.length}
          emptyText="All employees are registered in SSNF."
        >
          {notSsnf.slice(0, 6).map((e) => (
            <AlertRow key={e.id} name={e.full_name} sub="No SSNF record on file" empId={e.id} />
          ))}
        </AlertCard>

        <AlertCard
          icon={CalendarOff}
          color="amber"
          title="Employees On Leave"
          count={onLeaveEmps.length}
          emptyText="No employees currently on leave."
        >
          {onLeaveEmps.slice(0, 6).map((e) => (
            <AlertRow key={e.id} name={e.full_name} sub={e.current_title || '—'} empId={e.id} />
          ))}
        </AlertCard>

        <AlertCard
          icon={AlertTriangle}
          color="slate"
          title="Workforce Summary"
          count={null}
          emptyText=""
        >
          <div className="space-y-2.5 text-sm">
            <SummaryLine label="Terminated" value={terminated} />
            <SummaryLine label="Missing ≥1 document" value={missingDocs.length} />
            <SummaryLine label="Not in SSNF" value={notSsnf.length} />
            <SummaryLine label="Total registered" value={employees.filter((e) => e.ssnf_registered).length} />
          </div>
        </AlertCard>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ icon: Icon, color, title, count, emptyText, children }) {
  const colorMap = {
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
            {count !== null && <p className="text-sm text-slate-500">{count} employee{count !== 1 ? 's' : ''}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children && (Array.isArray(children) ? children.length > 0 : true) ? (
          <div className="space-y-2">{children}</div>
        ) : (
          <p className="text-sm text-slate-400 py-2">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AlertRow({ name, sub, empId }) {
  return (
    <Link
      to={`/employees/${empId}`}
      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
        <p className="text-xs text-slate-400 truncate">{sub}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0 ml-2" />
    </Link>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}