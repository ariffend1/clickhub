import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Clock, CheckCircle2, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function HomePage() {
  const { tasks, currentUser, activities, spaces, getUserById, selectTask, setActivePage, selectSpace } = useStore();

  if (!currentUser) return null;

  const myTasks = tasks.filter(t => t.assigneeIds.includes(currentUser.id));
  const myInProgress = myTasks.filter(t => t.status === 'in_progress');
  const myOverdue = myTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done');
  const myCompleted = myTasks.filter(t => t.status === 'done');
  const myUpcoming = myTasks
    .filter(t => t.dueDate && !isPast(new Date(t.dueDate)) && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const recentActivities = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser.name.split(' ')[0]}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-400">Here's what's happening with your projects today.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'In Progress', value: myInProgress.length, icon: <Clock size={20} />, color: 'bg-blue-500/10 text-blue-400' },
          { label: 'Overdue', value: myOverdue.length, icon: <AlertTriangle size={20} />, color: 'bg-red-500/10 text-red-400' },
          { label: 'Completed', value: myCompleted.length, icon: <CheckCircle2 size={20} />, color: 'bg-green-500/10 text-green-400' },
          { label: 'Completion', value: `${myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0}%`, icon: <TrendingUp size={20} />, color: 'bg-violet-500/10 text-violet-400' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.color)}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
            <button onClick={() => setActivePage('my_tasks')} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
              View All <ArrowRight size={12} />
            </button>
          </div>
          {myUpcoming.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No upcoming deadlines 🎉</p>
          ) : (
            <div className="space-y-2">
              {myUpcoming.map(task => (
                <button key={task.id} onClick={() => selectTask(task.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-700/30">
                  <div className={cn("h-2 w-2 rounded-full shrink-0",
                    task.priority === 'urgent' ? 'bg-red-400' : task.priority === 'high' ? 'bg-orange-400' : task.priority === 'normal' ? 'bg-blue-400' : 'bg-gray-400'
                  )} />
                  <span className="flex-1 truncate text-sm text-gray-300">{task.title}</span>
                  <span className="shrink-0 text-xs text-gray-500">{format(new Date(task.dueDate!), 'MMM d')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map(act => {
                const user = getUserById(act.userId);
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: user?.color || '#666' }}>
                      {user?.name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        <span className="font-medium text-gray-300">{user?.name}</span> {act.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-600">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {currentUser.role !== 'EMPLOYEE' && (
          <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#282c34] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Spaces Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {spaces.map(space => {
                const spaceTasks = tasks.filter(t => t.spaceId === space.id);
                const done = spaceTasks.filter(t => t.status === 'done').length;
                const pct = spaceTasks.length > 0 ? Math.round((done / spaceTasks.length) * 100) : 0;
                return (
                  <button key={space.id} onClick={() => selectSpace(space.id)}
                    className="rounded-lg border border-gray-700/50 p-4 text-left hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{space.icon}</span>
                      <span className="text-sm font-medium text-white">{space.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{spaceTasks.length} tasks</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-700">
                      <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
