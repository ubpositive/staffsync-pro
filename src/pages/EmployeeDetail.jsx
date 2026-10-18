import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil } from 'lucide-react';
import EmployeeFormDialog from '@/components/employee/EmployeeFormDialog';
import OverviewTab from '@/components/employee/OverviewTab';
import SalaryTab from '@/components/employee/SalaryTab';
import BonusTab from '@/components/employee/BonusTab';
import TitleTab from '@/components/employee/TitleTab';
import DocumentsTab from '@/components/employee/DocumentsTab';
import SSNFTab from '@/components/employee/SSNFTab';
import LeaveTab from '@/components/employee/LeaveTab';
import EvaluationTab from '@/components/employee/EvaluationTab';
import { calcAge, yearsOfService, formatDate } from '@/lib/hr-utils';

const STATUS_STYLE = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200',
  terminated: 'bg-red-50 text-red-700 border-red-200',
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    try {
      const emp = await base44.entities.Employee.get(id);
      setEmployee(emp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/employees" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Link>
        <p className="text-slate-500">Employee not found.</p>
      </div>
    );
  }

  const refresh = () => { load(); setEditOpen(false); };
  const age = calcAge(employee.date_of_birth);
  const tenure = yearsOfService(employee.joining_date);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to="/employees" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-semibold">
            {employee.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{employee.full_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-slate-500 text-sm">{employee.current_title || '—'}</span>
              <Badge variant="outline" className={`${STATUS_STYLE[employee.status] || ''} capitalize`}>
                {employee.status?.replace('_', ' ') || '—'}
              </Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {age != null && <>Age {age} · </>}
              {tenure != null && <>{tenure} year{tenure !== 1 ? 's' : ''} of service</>}
              {tenure == null && <>Joined {formatDate(employee.joining_date)}</>}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
          <TabsTrigger value="titles">Titles</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="ssnf">SSNF</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-5"><OverviewTab employee={employee} /></TabsContent>
        <TabsContent value="salary" className="mt-5"><SalaryTab employee={employee} isAdmin={isAdmin} onUpdated={refresh} /></TabsContent>
        <TabsContent value="bonuses" className="mt-5"><BonusTab employee={employee} isAdmin={isAdmin} onUpdated={refresh} /></TabsContent>
        <TabsContent value="titles" className="mt-5"><TitleTab employee={employee} isAdmin={isAdmin} onUpdated={refresh} /></TabsContent>
        <TabsContent value="documents" className="mt-5"><DocumentsTab employee={employee} isAdmin={isAdmin} onUpdated={refresh} /></TabsContent>
        <TabsContent value="ssnf" className="mt-5"><SSNFTab employee={employee} isAdmin={isAdmin} onUpdated={refresh} /></TabsContent>
        <TabsContent value="leave" className="mt-5"><LeaveTab employee={employee} isAdmin={isAdmin} onUpdated={refresh} /></TabsContent>
        <TabsContent value="evaluations" className="mt-5"><EvaluationTab employee={employee} isAdmin={isAdmin} onUpdated={refresh} /></TabsContent>
      </Tabs>

      <EmployeeFormDialog open={editOpen} onOpenChange={setEditOpen} employee={employee} onSaved={refresh} />
    </div>
  );
}