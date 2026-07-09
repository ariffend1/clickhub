import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Plus, MoreHorizontal, ChevronLeft, Trash2, Flag, CheckSquare } from 'lucide-react';
import type { TaskStatus, Priority } from '../../types';
import { toast } from 'sonner';

const columns: { status: TaskStatus; label: string; dotColor: string; emptyIcon: string; emptyMsg: string }[] = [
  { status: 'todo', label: 'To Do', dotColor: 'bg-gray-400', emptyIcon: '📋', emptyMsg: 'Tidak ada tugas baru. Tambahkan tugas pertama!' },
  { status: 'in_progress', label: 'In Progress', dotColor: 'bg-blue-400', emptyIcon: '🚀', emptyMsg: 'Belum ada tugas yang sedang dikerjakan.' },
  { status: 'pending', label: 'Pending', dotColor: 'bg-orange-400', emptyIcon: '⏳', emptyMsg: 'Tidak ada tugas yang ditunda.' },
  { status: 'in_review', label: 'In Review', dotColor: 'bg-yellow-400', emptyIcon: '🔍', emptyMsg: 'Tidak ada tugas dalam peninjauan.' },
  { status: 'done', label: 'Done', dotColor: 'bg-green-400', emptyIcon: '✅', emptyMsg: 'Tugas selesai akan muncul di sini. Kerja bagus! ☕' },
];

const priorityConfig = {
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', flagColor: '#f87171' },
  high:   { label: 'High',   color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', flagColor: '#fb923c' },
  normal: { label: 'Normal', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', flagColor: '#60a5fa' },
  low:    { label: 'Low',    color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', flagColor: '#9ca3af' },
};

function getDueBadge(dueDate: string | null | undefined, status: TaskStatus) {
  if (!dueDate) return null;
  if (status === 'done') return { text: new Date(dueDate).toLocaleDateString('id', { month: 'short', day: 'numeric' }), cls: 'bg-gray-800/40 text-gray-600 line-through border border-gray-700/30' };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
  const text = due.toLocaleDateString('id', { month: 'short', day: 'numeric' });
  if (diff < 0) return { text, cls: 'bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse' };
  if (diff === 0) return { text: 'Hari ini', cls: 'bg-orange-500/10 text-orange-400 border border-orange-500/25' };
  if (diff <= 3) return { text, cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
  return { text, cls: 'bg-gray-700/30 text-gray-500 border border-gray-700/20' };
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-700/30 bg-[#282c34] p-3 animate-pulse">
      <div className="mb-2 h-2.5 w-16 rounded-full bg-gray-700/60" />
      <div className="mb-1 h-3.5 w-full rounded bg-gray-700/50" />
      <div className="mb-3 h-3 w-3/4 rounded bg-gray-700/40" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-6 rounded-full bg-gray-700/50" />
        <div className="h-2 w-12 rounded-full bg-gray-700/40" />
      </div>
    </div>
  );
}

export default function BoardView() {
  const { getTasksByStatus, selectTask, moveTask, addTask, getUserById, getTagById,
    selectedSpaceId, selectedListId, updateTask, deleteTask, currentUser, hasRole,
    activePage, triggerTelegramAlert, addAuditLog } = useStore();

  const isAdmin = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']);
  const isSharedSpace = activePage === 'spaces';
  const canDeleteDirectly = isAdmin || !isSharedSpace;

  const handleDeleteTask = async (task: any) => {
    if (canDeleteDirectly) {
      if (window.confirm(`Hapus tugas "${task.title}"?`)) {
        deleteTask(task.id);
        setActiveMenu(null);
        toast.success(`Tugas "${task.title}" berhasil dihapus.`);
      }
    } else {
      if (window.confirm(`Kirim permintaan hapus untuk tugas "${task.title}" ke Admin?`)) {
        const taskNumber = task.id.slice(0, 8).toUpperCase();
        await triggerTelegramAlert(
          `🗑️ Permintaan Hapus Tugas: #${taskNumber}`,
          `Boss, ada permintaan penghapusan tugas di Space oleh **${currentUser?.name || 'Staf'}**:\n\n**Tugas:** ${task.title}\n**Deskripsi:** ${task.description || '-'}\n\n*Persetujuan Admin diperlukan.*`,
          'WARN'
        );
        addAuditLog('TASK_DELETE_REQUESTED', `Requested deletion for task "${task.title}"`);
        setActiveMenu(null);
        toast.success(`Permintaan hapus tugas telah dikirim ke Admin.`);
      }
    }
  };

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // taskId of open quick-action menu
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // Drag-to-scroll refs
  const boardRef = useRef<HTMLDivElement>(null);
  const isDraggingBoard = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const velocityX = useRef(0);
  const lastMouseX = useRef(0);
  const lastTime = useRef(0);
  const rafId = useRef<number | null>(null);

  // Simulate skeleton loader on mount
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Update scroll shadows
  const updateShadows = useCallback(() => {
    const el = boardRef.current;
    if (!el) return;
    setShowLeftShadow(el.scrollLeft > 8);
    setShowRightShadow(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    updateShadows();
    el.addEventListener('scroll', updateShadows, { passive: true });
    const ro = new ResizeObserver(updateShadows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateShadows); ro.disconnect(); };
  }, [updateShadows]);

  // --- Drag-to-scroll with inertia ---
  const applyMomentum = useCallback(() => {
    if (!boardRef.current) return;
    velocityX.current *= 0.92;
    if (Math.abs(velocityX.current) < 0.5) { rafId.current = null; return; }
    boardRef.current.scrollLeft -= velocityX.current;
    rafId.current = requestAnimationFrame(applyMomentum);
  }, []);

  const handleBoardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger on the board background (not on interactive children)
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (['button', 'input', 'textarea', 'a', 'select'].includes(tag)) return;
    const closest = (e.target as HTMLElement).closest('[data-draggable="true"]');
    if (closest) return; // Don't interfere with card drag
    isDraggingBoard.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = boardRef.current?.scrollLeft ?? 0;
    lastMouseX.current = e.clientX;
    lastTime.current = Date.now();
    velocityX.current = 0;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    document.body.style.userSelect = 'none';
    if (boardRef.current) boardRef.current.style.cursor = 'grabbing';
  };

  const handleBoardMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingBoard.current || !boardRef.current) return;
    const now = Date.now();
    const dt = now - lastTime.current || 1;
    velocityX.current = (lastMouseX.current - e.clientX) / dt * 16;
    lastMouseX.current = e.clientX;
    lastTime.current = now;
    boardRef.current.scrollLeft = scrollStartX.current - (e.clientX - dragStartX.current);
  }, []);

  const handleBoardMouseUp = useCallback(() => {
    if (!isDraggingBoard.current) return;
    isDraggingBoard.current = false;
    document.body.style.userSelect = '';
    if (boardRef.current) boardRef.current.style.cursor = 'grab';
    rafId.current = requestAnimationFrame(applyMomentum);
  }, [applyMomentum]);

  useEffect(() => {
    document.addEventListener('mousemove', handleBoardMouseMove);
    document.addEventListener('mouseup', handleBoardMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleBoardMouseMove);
      document.removeEventListener('mouseup', handleBoardMouseUp);
    };
  }, [handleBoardMouseMove, handleBoardMouseUp]);

  // --- Card drag-and-drop ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, status: string) => { e.preventDefault(); setDragOverColumn(status); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) moveTask(draggedTaskId, status);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // --- Quick Add ---
  const handleQuickAdd = (status: TaskStatus) => {
    if (!quickAddTitle.trim()) return;
    addTask({ title: quickAddTitle.trim(), status, spaceId: selectedSpaceId || '', listId: selectedListId || '' });
    setQuickAddTitle('');
    setQuickAddColumn(null);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handler = () => setActiveMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [activeMenu]);

  const toggleCollapse = (status: string) =>
    setCollapsedCols(p => ({ ...p, [status]: !p[status] }));

  const normalPriority = (p: string): Priority => {
    const v = (p || 'normal').toLowerCase();
    if (v === 'medium') return 'normal';
    if (['urgent', 'high', 'low', 'normal'].includes(v)) return v as Priority;
    return 'normal';
  };

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      {/* Left scroll shadow */}
      <div className={cn(
        'pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 transition-opacity duration-300',
        'bg-gradient-to-r from-[var(--bg-main)] to-transparent',
        showLeftShadow ? 'opacity-100' : 'opacity-0'
      )} />
      {/* Right scroll shadow */}
      <div className={cn(
        'pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 transition-opacity duration-300',
        'bg-gradient-to-l from-[var(--bg-main)] to-transparent',
        showRightShadow ? 'opacity-100' : 'opacity-0'
      )} />

      {/* Board container */}
      <div
        ref={boardRef}
        className="flex h-full gap-3 overflow-x-auto p-4 cursor-grab select-none"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
        onMouseDown={handleBoardMouseDown}
      >
        {columns.map(col => {
          const colTasks = getTasksByStatus(col.status);
          const isCollapsed = collapsedCols[col.status];

          // Collapsed column view
          if (isCollapsed) {
            return (
              <div key={col.status}
                className="flex w-10 shrink-0 flex-col items-center rounded-xl bg-gray-800/30 py-3 gap-2 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleCollapse(col.status)}
                title={`Expand ${col.label}`}
              >
                <div className={cn('h-2 w-2 rounded-full shrink-0', col.dotColor)} />
                <span className="writing-mode-vertical text-[10px] font-semibold text-gray-400 rotate-180"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  {col.label}
                </span>
                <span className="rounded-full bg-gray-700/60 px-1 py-0.5 text-[9px] text-gray-500">{colTasks.length}</span>
                <ChevronLeft size={12} className="text-gray-600 mt-auto" />
              </div>
            );
          }

          return (
            <div key={col.status}
              className={cn(
                'flex min-w-[280px] w-[280px] shrink-0 flex-col rounded-xl bg-gray-800/20 transition-colors',
                dragOverColumn === col.status && 'bg-violet-500/5 ring-1 ring-violet-500/20'
              )}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', col.dotColor)} />
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                  <span className="rounded-full bg-gray-700/60 px-1.5 py-0.5 text-[10px] text-gray-400">{colTasks.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleCollapse(col.status)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:bg-gray-700/40 hover:text-gray-300 transition-colors"
                    title="Collapse column"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    onClick={() => setQuickAddColumn(col.status)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:bg-gray-700/40 hover:text-gray-300 transition-colors"
                    title="Add task"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              <div className={cn('h-0.5 mx-3 rounded-full mb-2', col.dotColor)} style={{ opacity: 0.3 }} />

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>

                {/* Skeleton loader */}
                {isLoading && [1, 2].map(i => <SkeletonCard key={i} />)}

                {!isLoading && colTasks.map(task => {
                  const priority = priorityConfig[normalPriority(task.priority)];
                  const dueBadge = getDueBadge(task.dueDate, task.status);
                  const completedSubs = task.subtasks.filter(s => s.completed).length;
                  const totalSubs = task.subtasks.length;
                  const subProgress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;

                  return (
                    <div key={task.id}
                      data-draggable="true"
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      className="cursor-grab active:cursor-grabbing group relative"
                    >
                      <button onClick={() => selectTask(task.id)}
                        className="w-full rounded-lg border border-gray-700/50 bg-[#282c34] p-3 text-left transition-all hover:border-gray-600 hover:shadow-lg hover:shadow-black/20">

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {task.tags.map(tagId => {
                              const tag = getTagById(tagId);
                              if (!tag) return null;
                              return (
                                <span key={tag.id} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                                  style={{ backgroundColor: tag.color + '25', color: tag.color }}>
                                  {tag.name}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Title */}
                        <p className={cn('text-sm font-medium leading-snug',
                          task.status === 'done' ? 'text-gray-500 line-through' : 'text-white')}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>
                        )}

                        {/* Subtask progress bar */}
                        {totalSubs > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] text-gray-600 flex items-center gap-1">
                                <CheckSquare size={8} />
                                {completedSubs}/{totalSubs}
                              </span>
                              <span className="text-[9px] text-gray-600">{Math.round(subProgress)}%</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-gray-700/50">
                              <div className="h-1 rounded-full transition-all duration-500"
                                style={{
                                  width: `${subProgress}%`,
                                  backgroundColor: subProgress === 100 ? '#10b981' : '#7c3aed'
                                }} />
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="mt-2.5 flex items-center justify-between">
                          {/* Assignees */}
                          <div className="flex -space-x-1.5">
                            {task.assigneeIds.slice(0, 3).map(id => {
                              const user = getUserById(id);
                              if (!user) return null;
                              return (
                                <div key={id}
                                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#282c34] text-[7px] font-semibold text-white"
                                  style={{ backgroundColor: user.color }} title={user.name}>
                                  {user.name.charAt(0)}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* Due date badge */}
                            {dueBadge && (
                              <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium', dueBadge.cls)}>
                                {dueBadge.text}
                              </span>
                            )}
                            {/* Priority badge */}
                            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium border', priority.bg, priority.color, priority.border)}>
                              <Flag size={7} className="inline mr-0.5" />
                              {priority.label}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Quick Action Menu button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === task.id ? null : task.id); }}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-700/80 text-gray-300 hover:bg-gray-600 backdrop-blur-sm shadow-lg"
                        >
                          <MoreHorizontal size={12} />
                        </button>

                        {activeMenu === task.id && (
                          <div
                            className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-gray-700/60 bg-gray-900/95 backdrop-blur-xl p-1.5 shadow-2xl animate-scale-up"
                            onClick={e => e.stopPropagation()}
                          >
                            <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-600">Ubah Prioritas</p>
                            {(['urgent', 'high', 'normal', 'low'] as Priority[]).map(p => {
                              const pc = priorityConfig[p];
                              return (
                                <button key={p}
                                  onClick={() => { updateTask(task.id, { priority: p }); setActiveMenu(null); }}
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-gray-700/50',
                                    normalPriority(task.priority) === p ? `${pc.color} font-semibold` : 'text-gray-400'
                                  )}>
                                  <Flag size={10} style={{ color: pc.flagColor }} />
                                  {pc.label}
                                  {normalPriority(task.priority) === p && <span className="ml-auto text-[8px] text-gray-500">✓ Aktif</span>}
                                </button>
                              );
                            })}
                            <div className="my-1 border-t border-gray-700/40" />
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={10} />
                              {canDeleteDirectly ? 'Hapus Tugas' : 'Minta Hapus Tugas'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Beautiful Empty State */}
                {!isLoading && colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-3 text-center gap-2 opacity-60">
                    <span className="text-3xl">{col.emptyIcon}</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{col.emptyMsg}</p>
                  </div>
                )}

                {/* Quick Add */}
                {quickAddColumn === col.status ? (
                  <div className="rounded-lg border border-violet-500/30 bg-[#282c34] p-3 shadow-lg shadow-violet-500/5">
                    <input autoFocus value={quickAddTitle}
                      onChange={e => setQuickAddTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleQuickAdd(col.status);
                        if (e.key === 'Escape') { setQuickAddColumn(null); setQuickAddTitle(''); }
                      }}
                      placeholder="Nama tugas..."
                      className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleQuickAdd(col.status)} className="rounded-md bg-violet-600 px-2.5 py-1 text-xs text-white hover:bg-violet-500 transition-colors">Tambah</button>
                      <button onClick={() => { setQuickAddColumn(null); setQuickAddTitle(''); }} className="rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-white transition-colors">Batal</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setQuickAddColumn(col.status)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-gray-700/30 hover:text-gray-300 transition-colors">
                    <Plus size={12} /> New Task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
