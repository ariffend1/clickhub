import { ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import type { TaskStatus, Task } from '../../types';
import { format } from 'date-fns';
import { useState } from 'react';

const statusGroups: { status: TaskStatus; label: string; dotColor: string }[] = [
  { status: 'todo', label: 'To Do', dotColor: 'bg-gray-400' },
  { status: 'in_progress', label: 'In Progress', dotColor: 'bg-blue-400' },
  { status: 'in_review', label: 'In Review', dotColor: 'bg-yellow-400' },
  { status: 'done', label: 'Done', dotColor: 'bg-green-400' },
];

const priorityConfig = {
  urgent: { color: 'text-red-400', label: 'Urgent', icon: '🔴' },
  high: { color: 'text-orange-400', label: 'High', icon: '🟠' },
  normal: { color: 'text-blue-400', label: 'Normal', icon: '🔵' },
  low: { color: 'text-gray-400', label: 'Low', icon: '⚪' },
};

function TaskRow({ task }: { task: Task }) {
  const { selectTask, getUserById, getTagById, moveTask } = useStore();
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const priority = priorityConfig[task.priority];

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveTask(task.id, task.status === 'done' ? 'todo' : 'done');
  };

  return (
    <tr onClick={() => selectTask(task.id)} className="group cursor-pointer border-b border-gray-800/50 transition-colors hover:bg-gray-800/30">
      <td className="py-3 pl-4 pr-2">
        <button onClick={handleCheckbox}
          className={cn("flex h-5 w-5 items-center justify-center rounded border transition-colors",
            task.status === 'done' ? "border-green-500 bg-green-500" : "border-gray-600 hover:border-green-400"
          )}>
          {task.status === 'done' && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </td>
      <td className="py-3 pr-4">
        <div>
          <span className={cn("text-sm font-medium", task.status === 'done' ? "text-gray-500 line-through" : "text-white")}>{task.title}</span>
          {task.tags.length > 0 && (
            <div className="mt-1 flex gap-1">
              {task.tags.map(tagId => {
                const tag = getTagById(tagId);
                if (!tag) return null;
                return <span key={tag.id} className="rounded-full px-1.5 py-0 text-[10px]" style={{ backgroundColor: tag.color + '25', color: tag.color }}>{tag.name}</span>;
              })}
            </div>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex -space-x-1">
          {task.assigneeIds.slice(0, 3).map(id => {
            const user = getUserById(id);
            if (!user) return null;
            return <div key={id} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e2028] text-[9px] font-semibold text-white" style={{ backgroundColor: user.color }} title={user.name}>{user.name.charAt(0)}</div>;
          })}
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className={cn("text-xs", priority.color)}>{priority.icon} {priority.label}</span>
      </td>
      <td className="py-3 pr-4">
        {task.dueDate && <span className="text-xs text-gray-400">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>}
      </td>
      <td className="py-3 pr-4">
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1 w-16 rounded-full bg-gray-700">
              <div className="h-1 rounded-full bg-violet-500" style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-500">{completedSubtasks}/{totalSubtasks}</span>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function ListView() {
  const { getTasksByStatus } = useStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="h-full overflow-y-auto p-6">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="w-10 pb-3 pl-4 pr-2"></th>
            <th className="pb-3 pr-4">Task</th>
            <th className="w-32 pb-3 pr-4">Assignee</th>
            <th className="w-28 pb-3 pr-4">Priority</th>
            <th className="w-32 pb-3 pr-4">Due Date</th>
            <th className="w-36 pb-3 pr-4">Progress</th>
          </tr>
        </thead>
        <tbody>
          {statusGroups.map(group => {
            const tasks = getTasksByStatus(group.status);
            const isCollapsed = collapsed[group.status];
            return (
              <tr key={group.status}>
                <td colSpan={6} className="p-0">
                  <table className="w-full"><tbody>
                    <tr><td colSpan={6}>
                      <button onClick={() => setCollapsed(p => ({ ...p, [group.status]: !p[group.status] }))}
                        className="flex w-full items-center gap-2 bg-gray-800/30 px-4 py-2.5 text-left">
                        {isCollapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                        <div className={cn("h-2 w-2 rounded-full", group.dotColor)} />
                        <span className="text-sm font-semibold text-white">{group.label}</span>
                        <span className="text-xs text-gray-500">({tasks.length})</span>
                      </button>
                    </td></tr>
                    {!isCollapsed && tasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </tbody></table>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
