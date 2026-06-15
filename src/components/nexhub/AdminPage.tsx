import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { BarChart3, Users, FileText, AlertTriangle, Server, TicketCheck, Plus, X } from 'lucide-react';
import type { UserRole } from '../../types';
import { isPast } from 'date-fns';
import { toast } from 'sonner';

type Tab = 'overview' | 'users' | 'logs';

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  ROOT: { label: 'Root', color: 'bg-red-500/20 text-red-400' },
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-500/20 text-purple-400' },
  ADMIN: { label: 'Admin', color: 'bg-blue-500/20 text-blue-400' },
  MANAGER: { label: 'Manager', color: 'bg-amber-500/20 text-amber-400' },
  TECHNICIAN: { label: 'Technician', color: 'bg-green-500/20 text-green-400' },
  EMPLOYEE: { label: 'Employee', color: 'bg-gray-500/20 text-gray-400' },
};

export default function AdminPage() {
  const { tickets, assets, tasks, users, auditLogs, adminAddUser } = useStore();
  const [tab, setTab] = useState<Tab>('overview');

  // Add User states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('EMPLOYEE');
  const [newUserDept, setNewUserDept] = useState('IT');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  const stats = {
    openTickets: tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    criticalTickets: tickets.filter(t => t.priority === 'CRITICAL' && t.status !== 'CLOSED').length,
    activeUsers: users.filter(u => u.isActive).length,
    assetValue: assets.reduce((sum, a) => sum + a.price, 0),
    totalTasks: tasks.length,
    overdueTasks: tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length,
    recentLogs: auditLogs.slice(0, 20),
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
    { key: 'users', label: 'Users', icon: <Users size={14} /> },
    { key: 'logs', label: 'Audit Logs', icon: <FileText size={14} /> },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🛡️ Admin Panel</h1>
        <p className="text-xs text-gray-500">System management & monitoring</p>
      </div>

      <div className="mb-6 flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition",
              tab === t.key ? "bg-violet-600/20 text-violet-400" : "text-gray-500 hover:bg-gray-800 hover:text-white"
            )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'overview' && (
          <div>
            <div className="mb-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Open Tickets', value: stats.openTickets, icon: <TicketCheck size={18} />, color: 'text-red-400', bg: 'bg-red-500/10' },
                { label: 'Critical', value: stats.criticalTickets, icon: <AlertTriangle size={18} />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Active Users', value: stats.activeUsers, icon: <Users size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Asset Value', value: formatPrice(stats.assetValue), icon: <Server size={18} />, color: 'text-green-400', bg: 'bg-green-500/10' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs text-gray-500">{s.label}</p><p className={cn("text-xl font-bold", s.color)}>{s.value}</p></div>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.bg, s.color)}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
                <h3 className="mb-3 text-sm font-semibold text-white">🎫 Tickets</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Open</span><span className="text-white">{tickets.filter(t => t.status === 'OPEN').length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">In Progress</span><span className="text-white">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Resolved</span><span className="text-white">{tickets.filter(t => t.status === 'RESOLVED').length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Closed</span><span className="text-white">{tickets.filter(t => t.status === 'CLOSED').length}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
                <h3 className="mb-3 text-sm font-semibold text-white">🖥️ Assets</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="text-white">{assets.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Available</span><span className="text-white">{assets.filter(a => a.status === 'AVAILABLE').length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">In Use</span><span className="text-white">{assets.filter(a => a.status === 'IN_USE').length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Maintenance</span><span className="text-white">{assets.filter(a => a.status === 'MAINTENANCE').length}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
                <h3 className="mb-3 text-sm font-semibold text-white">📊 System</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Total Tasks</span><span className="text-white">{stats.totalTasks}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Overdue</span><span className="text-red-400">{stats.overdueTasks}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Articles</span><span className="text-white">{useStore.getState().articles.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Audit Logs</span><span className="text-white">{auditLogs.length}</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Recent Activity</h3>
              <div className="space-y-2">
                {stats.recentLogs.slice(0, 8).map(log => {
                  const user = users.find(u => u.id === log.userId);
                  return (
                    <div key={log.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-800/30">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ backgroundColor: user?.color || '#666' }}>{user?.name.charAt(0) || '?'}</div>
                      <span className="flex-1 text-xs text-gray-400"><span className="text-gray-300">{user?.name}</span> — {log.details}</span>
                      <span className="text-[9px] text-gray-600">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center bg-[#282c34] p-4 rounded-xl border border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-white">Registered Users ({users.length})</h3>
                <p className="text-[10px] text-gray-500">Manage user accounts and roles</p>
              </div>
              <button
                onClick={() => {
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setNewUserRole('EMPLOYEE');
                  setNewUserDept('IT');
                  setNewUserPhone('');
                  setErrorMsg('');
                  setShowAddUserModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 transition-all shadow-md shadow-violet-950/20"
              >
                <Plus size={14} /> Add User
              </button>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#282c34] overflow-hidden">
              <table className="w-full">
                <thead>
                <tr className="border-b border-gray-700 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const role = roleLabels[u.role] || roleLabels.EMPLOYEE;
                  return (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: u.color }}>{u.name.charAt(0)}</div>
                          <div><p className="text-sm text-white">{u.name}</p><p className="text-[10px] text-gray-500">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px]", role.color)}>{role.label}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-400">{u.department || '—'}</span></td>
                      <td className="px-4 py-3"><span className={cn("text-xs", u.isActive ? "text-green-400" : "text-gray-500")}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="rounded-xl border border-gray-800 bg-[#282c34] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Time</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => {
                  const user = users.find(u => u.id === log.userId);
                  return (
                    <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3"><span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-300">{user?.name || 'System'}</span></td>
                      <td className="px-4 py-3"><span className="rounded-full bg-gray-700/50 px-2 py-0.5 text-[10px] text-gray-400">{log.action}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-400">{log.details}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#1e2028] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add New User</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            {errorMsg && (
              <div className="p-3 bg-rose-600/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. john@clickhub.com"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role *</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-2 py-2 text-xs text-white outline-none focus:border-violet-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    placeholder="e.g. IT, HR"
                    className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  placeholder="e.g. +62812345678"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="rounded-lg bg-gray-950 border border-gray-800 hover:bg-gray-900 text-gray-400 text-xs font-bold px-4 py-2 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
                    setErrorMsg('Please fill in all required fields.');
                    return;
                  }
                  if (newUserPassword.length < 6) {
                    setErrorMsg('Password must be at least 6 characters.');
                    return;
                  }
                  setSubmitting(true);
                  setErrorMsg('');
                  const res = await adminAddUser(
                    newUserName.trim(),
                    newUserEmail.trim(),
                    newUserPassword,
                    newUserRole,
                    newUserDept.trim(),
                    newUserPhone.trim()
                  );
                  setSubmitting(false);
                  if (res.success) {
                    toast.success(`User "${newUserName}" successfully added!`);
                    setShowAddUserModal(false);
                  } else {
                    setErrorMsg(res.error || 'Failed to create user');
                  }
                }}
                className="rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 transition-all shadow-md shadow-violet-950/20"
              >
                {submitting ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
