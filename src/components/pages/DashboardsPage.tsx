import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { isPast } from 'date-fns';


const statusLabels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const statusColors: Record<string, string> = { todo: 'bg-gray-400', in_progress: 'bg-blue-400', in_review: 'bg-yellow-400', done: 'bg-green-400' };
const priorityColors: Record<string, string> = { urgent: 'bg-red-400', high: 'bg-orange-400', normal: 'bg-blue-400', low: 'bg-gray-400' };
const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };

export default function DashboardsPage() {
  const { tasks, spaces, users } = useStore();

  const statusData = ['todo', 'in_progress', 'in_review', 'done'].map(s => ({ status: s, count: tasks.filter(t => t.status === s).length }));
  const maxStatusCount = Math.max(...statusData.map(d => d.count), 1);
  const priorityData = ['urgent', 'high', 'normal', 'low'].map(p => ({ priority: p, count: tasks.filter(t => t.priority === p).length }));
  const maxPriorityCount = Math.max(...priorityData.map(d => d.count), 1);
  const userData = users.map(u => ({ user: u, total: tasks.filter(t => t.assigneeIds.includes(u.id)).length, done: tasks.filter(t => t.assigneeIds.includes(u.id) && t.status === 'done').length }));
  const spaceData = spaces.map(s => {
    const spaceTasks = tasks.filter(t => t.spaceId === s.id);
    return { space: s, total: spaceTasks.length, done: spaceTasks.filter(t => t.status === 'done').length, overdue: spaceTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length };
  });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">📊 Dashboards</h1>
        <p className="text-xs text-gray-500">Overview of all your projects and team performance.</p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: totalTasks, color: 'text-violet-400' },
          { label: 'Completed', value: completedTasks, color: 'text-green-400' },
          { label: 'Overdue', value: overdueTasks, color: 'text-red-400' },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-800 bg-[#282c34] p-5 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Tasks by Status</h3>
          <div className="space-y-3">
            {statusData.map(d => (
              <div key={d.status}>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    <div className={cn("h-2 w-2 rounded-full", statusColors[d.status])} />{statusLabels[d.status]}
                  </span>
                  <span className="text-xs text-gray-500">{d.count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-700">
                  <div className={cn("h-2 rounded-full", statusColors[d.status])} style={{ width: `${(d.count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Chart */}
        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Tasks by Priority</h3>
          <div className="space-y-3">
            {priorityData.map(d => (
              <div key={d.priority}>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    <div className={cn("h-2 w-2 rounded-full", priorityColors[d.priority])} />{priorityLabels[d.priority]}
                  </span>
                  <span className="text-xs text-gray-500">{d.count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-700">
                  <div className={cn("h-2 rounded-full", priorityColors[d.priority])} style={{ width: `${(d.count / maxPriorityCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Workload */}
        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Team Workload</h3>
          <div className="space-y-3">
            {userData.map(d => (
              <div key={d.user.id} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: d.user.color }}>{d.user.name.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-300">{d.user.name}</span>
                    <span className="text-[10px] text-gray-500">{d.done}/{d.total} done</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-700">
                    <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spaces */}
        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Spaces</h3>
          <div className="space-y-3">
            {spaceData.map(d => (
              <div key={d.space.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-xs text-gray-300">{d.space.icon} {d.space.name}</span>
                  <div className="flex items-center gap-2">
                    {d.overdue > 0 && <span className="text-[10px] text-red-400">{d.overdue} overdue</span>}
                    <span className="text-[10px] text-gray-500">{d.done}/{d.total}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-700">
                  <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
