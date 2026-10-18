import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { UserPlus, Trash2, ShieldCheck, Eye, Mail, Loader2, KeyRound } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadUsers = async () => {
    try {
      const list = await base44.entities.User.list();
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
    else setLoading(false);
  }, [isAdmin]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setError('');
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      showToast(`Invitation sent to ${inviteEmail}`);
      loadUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to invite user.');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    try {
      await base44.entities.User.update(uid, { role: newRole });
      loadUsers();
      showToast('Role updated.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update role.');
    }
  };

  const handleResetPassword = async (u) => {
    try {
      const { tempPassword } = await base44.users.resetPassword(u.id);
      showToast(`New temporary password for ${u.email}: ${tempPassword} — share this with them directly.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to reset password.');
    }
  };

  const handleDelete = async (u) => {
    if (u.id === user?.id) {
      setError("You can't delete your own account.");
      return;
    }
    if (!window.confirm(`Remove ${u.email} from the app?`)) return;
    try {
      await base44.entities.User.delete(u.id);
      loadUsers();
      showToast('User removed.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">Invite team members and manage their access roles.</p>
      </div>

      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-amber-800">
              You have <strong>viewer</strong> rights. Only admins can invite, edit, or remove users.
            </p>
          </CardContent>
        </Card>
      )}

      {toast && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
        </div>
      )}

      {isAdmin && (
        <Card className="border-slate-200 shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" /> Invite a New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Email Address</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" required />
              </div>
              <div className="w-40">
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Standard Viewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={inviting} className="bg-indigo-600 hover:bg-indigo-700">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team Members ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800">{u.full_name || '—'}</TableCell>
                  <TableCell className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select value={u.role || 'user'} onValueChange={(v) => handleRoleChange(u.id, v)}>
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Standard Viewer</span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Admin</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={u.role === 'admin' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : ''}>
                        {u.role === 'admin' ? <><ShieldCheck className="w-3 h-3 mr-1" /> Admin</> : <><Eye className="w-3 h-3 mr-1" /> Viewer</>}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleResetPassword(u)} title="Reset password">
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(u)} title="Remove user">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}