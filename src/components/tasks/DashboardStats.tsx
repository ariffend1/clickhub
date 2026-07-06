import { useStore } from '../../store/useStore';
import { CheckCircle2, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function DashboardStats() {
  const { getFilteredTasks } = useStore();
  const filteredTasks = getFilteredTasks();

  const stats = {
    total: filteredTasks.length,
    done: filteredTasks.filter(t => t.status === 'done').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length,
    overdue: filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
  };
  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: <BarChart3 size={18} />, color: 'bg-violet-500/10 text-violet-400' },
    { label: 'Completed', value: stats.done, icon: <CheckCircle2 size={18} />, color: 'bg-green-500/10 text-green-400', subtext: `${completionRate}% done` },
    { label: 'In Progress', value: stats.inProgress, icon: <Clock size={18} />, color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Overdue', value: stats.overdue, icon: <AlertTriangle size={18} />, color: 'bg-red-500/10 text-red-400' },
  ];

  return (
    <div className="mb-6 grid grid-cols-4 gap-4 px-6 pt-4">
      {statCards.map(card => (
        <div key={card.label} className="rounded-xl border border-gray-800 bg-[#282c34] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              {card.subtext && <p className="text-[10px] text-gray-500">{card.subtext}</p>}
            </div>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.color)}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
