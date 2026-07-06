import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { isPast } from 'date-fns';

const statusLabels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', pending: 'Pending', in_review: 'In Review', done: 'Done' };
const statusColors: Record<string, string> = { todo: 'bg-gray-400', in_progress: 'bg-blue-400', pending: 'bg-orange-400', in_review: 'bg-yellow-400', done: 'bg-green-400' };
const priorityColors: Record<string, string> = { urgent: 'bg-red-400', high: 'bg-orange-400', normal: 'bg-blue-400', low: 'bg-gray-400' };
const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };

export default function DashboardsPage() {
  const { tasks, spaces, users, currentUser } = useStore();

  const isManagement = currentUser ? ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role) : false;

  // Filter tasks based on role
  const visibleTasks = isManagement 
    ? tasks 
    : (currentUser ? tasks.filter(t => t.assigneeIds.includes(currentUser.id)) : []);

  const statusData = ['todo', 'in_progress', 'pending', 'in_review', 'done'].map(s => ({ status: s, count: visibleTasks.filter(t => t.status === s).length }));
  const maxStatusCount = Math.max(...statusData.map(d => d.count), 1);
  
  const priorityData = ['urgent', 'high', 'normal', 'low'].map(p => ({ priority: p, count: visibleTasks.filter(t => t.priority === p).length }));
  const maxPriorityCount = Math.max(...priorityData.map(d => d.count), 1);
  
  const userData = users.map(u => ({ 
    user: u, 
    total: tasks.filter(t => t.assigneeIds.includes(u.id)).length, 
    done: tasks.filter(t => t.assigneeIds.includes(u.id) && t.status === 'done').length 
  }));

  const spaceData = spaces.map(s => {
    const spaceTasks = visibleTasks.filter(t => t.spaceId === s.id);
    return { 
      space: s, 
      total: spaceTasks.length, 
      done: spaceTasks.filter(t => t.status === 'done').length, 
      overdue: spaceTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length 
    };
  });

  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter(t => t.status === 'done').length;
  const overdueTasks = visibleTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto p-8 bg-[#13151a] text-white">
      <div className="mb-8 relative">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2 tracking-tight">
          📊 <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300 text-glow-violet">Dashboards</span>
        </h1>
        <p className="text-xs text-gray-400 mt-2 max-w-2xl leading-relaxed">
          {isManagement 
            ? 'Ringkasan performa tim, tugas ruang kerja (Spaces), dan status operasional sistem secara keseluruhan.'
            : 'Ringkasan performa tugas personal Anda dan kemajuan pengerjaan.'
          }
        </p>
        <div className="glow-line mt-4 mb-2" />
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: isManagement ? 'Total Tasks (Global)' : 'Total Tasks saya', value: totalTasks, color: 'text-violet-400' },
          { label: 'Completed', value: completedTasks, color: 'text-green-400' },
          { label: 'Overdue', value: overdueTasks, color: 'text-red-400' },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="premium-card rounded-2xl p-5 text-center shadow-lg group hover:border-gray-700 transition duration-300">
            <p className={cn("text-3xl font-black mb-1 tracking-tight", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className={cn("grid gap-6", isManagement ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
        {/* Status Chart */}
        <div className="premium-card rounded-2xl p-6 shadow-lg">
          <h3 className="mb-4 text-sm font-bold text-gray-300 uppercase tracking-wider">Tasks by Status</h3>
          <div className="space-y-4">
            {statusData.map(d => (
              <div key={d.status}>
                <div className="flex justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <div className={cn("h-2.5 w-2.5 rounded-full shadow-inner", statusColors[d.status])} />
                    {statusLabels[d.status]}
                  </span>
                  <span className="text-xs text-gray-500 font-bold font-mono">{d.count} tasks</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800/60 overflow-hidden">
                  <div className={cn("h-2 rounded-full transition-all duration-500", statusColors[d.status])} style={{ width: `${(d.count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Chart */}
        <div className="premium-card rounded-2xl p-6 shadow-lg">
          <h3 className="mb-4 text-sm font-bold text-gray-300 uppercase tracking-wider">Tasks by Priority</h3>
          <div className="space-y-4">
            {priorityData.map(d => (
              <div key={d.priority}>
                <div className="flex justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <div className={cn("h-2.5 w-2.5 rounded-full shadow-inner", priorityColors[d.priority])} />
                    {priorityLabels[d.priority]}
                  </span>
                  <span className="text-xs text-gray-500 font-bold font-mono">{d.count} tasks</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800/60 overflow-hidden">
                  <div className={cn("h-2 rounded-full transition-all duration-500", priorityColors[d.priority])} style={{ width: `${(d.count / maxPriorityCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Workload - ONLY FOR ROOT, ADMIN, MANAGER */}
        {isManagement && (
          <div className="premium-card rounded-2xl p-6 shadow-lg">
            <h3 className="mb-4 text-sm font-bold text-gray-300 uppercase tracking-wider">Team Workload</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {userData.map(d => (
                <div key={d.user.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-inner uppercase" style={{ backgroundColor: d.user.color || '#5b21b6' }}>
                    {d.user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-gray-200">{d.user.name}</span>
                      <span className="text-[10px] text-gray-500 font-bold font-mono">{d.done}/{d.total} done</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800/60 overflow-hidden">
                      <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spaces Overview */}
        <div className="premium-card rounded-2xl p-6 shadow-lg">
          <h3 className="mb-4 text-sm font-bold text-gray-300 uppercase tracking-wider">Spaces</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {spaceData.map(d => (
              <div key={d.space.id} className="hover:bg-gray-800/20 p-1.5 rounded-lg transition duration-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <span className="text-base">{d.space.icon}</span> {d.space.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {d.overdue > 0 && <span className="rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 text-[9px] font-bold">{d.overdue} overdue</span>}
                    <span className="text-[10px] text-gray-500 font-bold font-mono">{d.done}/{d.total} tasks</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-800/60 overflow-hidden">
                  <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
