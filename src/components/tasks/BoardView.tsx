import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Plus } from 'lucide-react';
import type { TaskStatus } from '../../types';

const columns: { status: TaskStatus; label: string; color: string; dotColor: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-gray-400', dotColor: 'bg-gray-400' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-400', dotColor: 'bg-blue-400' },
  { status: 'pending', label: 'Pending', color: 'bg-orange-400', dotColor: 'bg-orange-400' },
  { status: 'in_review', label: 'In Review', color: 'bg-yellow-400', dotColor: 'bg-yellow-400' },
  { status: 'done', label: 'Done', color: 'bg-green-400', dotColor: 'bg-green-400' },
];

export default function BoardView() {
  const { getTasksByStatus, selectTask, moveTask, addTask, getUserById, getTagById, selectedSpaceId, selectedListId } = useStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => { setDragOverColumn(null); };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) moveTask(draggedTaskId, status);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleQuickAdd = (status: TaskStatus) => {
    if (!quickAddTitle.trim()) return;
    addTask({ title: quickAddTitle.trim(), status, spaceId: selectedSpaceId || '', listId: selectedListId || '' });
    setQuickAddTitle('');
    setQuickAddColumn(null);
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-6">
      {columns.map(col => {
        const colTasks = getTasksByStatus(col.status);
        return (
          <div key={col.status}
            className={cn("flex min-w-[280px] flex-1 flex-col rounded-xl bg-gray-800/20 transition-colors",
              dragOverColumn === col.status && "bg-violet-500/5 ring-1 ring-violet-500/20"
            )}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.status)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", col.dotColor)} />
                <span className="text-sm font-semibold text-white">{col.label}</span>
                <span className="rounded-full bg-gray-700/60 px-1.5 py-0.5 text-[10px] text-gray-400">{colTasks.length}</span>
              </div>
            </div>

            <div className={cn("h-0.5 mx-3 rounded-full mb-2", col.dotColor)} style={{ opacity: 0.3 }} />

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
              {colTasks.map(task => (
                <div key={task.id}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <button onClick={() => selectTask(task.id)}
                    className="w-full rounded-lg border border-gray-700/50 bg-[#282c34] p-3 text-left transition hover:border-gray-600">
                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {task.tags.map(tagId => {
                          const tag = getTagById(tagId);
                          if (!tag) return null;
                          return (
                            <span key={tag.id} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: tag.color + '25', color: tag.color }}>
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className={cn("text-sm font-medium", task.status === 'done' ? "text-gray-500 line-through" : "text-white")}>{task.title}</p>
                    {task.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {task.assigneeIds.slice(0, 3).map(id => {
                          const user = getUserById(id);
                          if (!user) return null;
                          return (
                            <div key={id} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#282c34] text-[8px] font-semibold text-white"
                              style={{ backgroundColor: user.color }} title={user.name}>
                              {user.name.charAt(0)}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.subtasks.length > 0 && (
                          <span className="text-[10px] text-gray-500">
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-[10px] text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Priority indicator */}
                    <div className="mt-2 flex items-center gap-1">
                      <div className={cn("h-1.5 w-1.5 rounded-full",
                        task.priority === 'urgent' ? 'bg-red-400' : task.priority === 'high' ? 'bg-orange-400' : task.priority === 'normal' ? 'bg-blue-400' : 'bg-gray-400'
                      )} />
                      <span className="text-[9px] text-gray-600 capitalize">{task.priority}</span>
                    </div>
                  </button>
                </div>
              ))}

              {/* Quick Add */}
              {quickAddColumn === col.status ? (
                <div className="rounded-lg border border-gray-700 bg-[#282c34] p-3">
                  <input autoFocus value={quickAddTitle} onChange={e => setQuickAddTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleQuickAdd(col.status);
                      if (e.key === 'Escape') { setQuickAddColumn(null); setQuickAddTitle(''); }
                    }}
                    placeholder="Task name..."
                    className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => handleQuickAdd(col.status)} className="rounded-md bg-violet-600 px-2.5 py-1 text-xs text-white hover:bg-violet-500">Add</button>
                    <button onClick={() => { setQuickAddColumn(null); setQuickAddTitle(''); }} className="rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-white">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setQuickAddColumn(col.status)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-gray-700/30 hover:text-gray-300">
                  <Plus size={12} /> New Task
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
