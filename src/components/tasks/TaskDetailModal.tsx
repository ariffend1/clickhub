import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { X, Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { TaskStatus, Priority } from '../../types';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-400' },
  { value: 'in_review', label: 'In Review', color: 'bg-yellow-400' },
  { value: 'done', label: 'Done', color: 'bg-green-400' },
];

const priorityOptions: { value: Priority; label: string; icon: string }[] = [
  { value: 'urgent', label: 'Urgent', icon: '🔴' },
  { value: 'high', label: 'High', icon: '🟠' },
  { value: 'normal', label: 'Normal', icon: '🔵' },
  { value: 'low', label: 'Low', icon: '⚪' },
];

export default function TaskDetailModal() {
  const {
    selectedTaskId, tasks, setShowTaskModal, updateTask, deleteTask,
    getTaskComments, addComment, getUserById,
    toggleSubtask, addSubtask, deleteSubtask, users, activities,
    currentUser, partRequests, inventories, addPartRequest
  } = useStore();

  const task = tasks.find(t => t.id === selectedTaskId);
  const [comment, setComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  
  const [showAddPart, setShowAddPart] = useState(false);
  const [partForm, setPartForm] = useState({ inventoryId: '', quantity: 1, notes: '' });

  if (!task) return null;

  const taskPartRequests = (partRequests || []).filter(pr => pr.taskId === task.id);

  const handleRequestPart = () => {
    if (!partForm.inventoryId || partForm.quantity <= 0) return;
    addPartRequest(partForm.inventoryId, partForm.quantity, partForm.notes, task.id);
    setPartForm({ inventoryId: '', quantity: 1, notes: '' });
    setShowAddPart(false);
  };

  const comments = getTaskComments(task.id);
  const taskActivities = activities.filter(a => a.taskId === task.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addComment(task.id, comment.trim());
    setComment('');
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowTaskModal(false)}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-700 bg-[#1e2028] shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })}
              className="rounded-lg border border-gray-700 bg-gray-800/50 px-2.5 py-1 text-xs text-white outline-none">
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={task.priority} onChange={e => updateTask(task.id, { priority: e.target.value as Priority })}
              className="rounded-lg border border-gray-700 bg-gray-800/50 px-2.5 py-1 text-xs text-white outline-none">
              {priorityOptions.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { deleteTask(task.id); setShowTaskModal(false); }} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={16} /></button>
            <button onClick={() => setShowTaskModal(false)} className="rounded-lg p-1.5 text-gray-500 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6">
          {/* Title */}
          {editingTitle ? (
            <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { updateTask(task.id, { title: editTitle }); setEditingTitle(false); } if (e.key === 'Escape') setEditingTitle(false); }}
              onBlur={() => { if (editTitle.trim()) updateTask(task.id, { title: editTitle }); setEditingTitle(false); }}
              className="mb-4 w-full bg-transparent text-xl font-bold text-white outline-none" />
          ) : (
            <h2 onClick={() => { setEditTitle(task.title); setEditingTitle(true); }} className="mb-4 cursor-pointer text-xl font-bold text-white hover:text-violet-300">{task.title}</h2>
          )}

          {/* Description */}
          {editingDesc ? (
            <textarea autoFocus value={editDesc} onChange={e => setEditDesc(e.target.value)}
              onBlur={() => { updateTask(task.id, { description: editDesc }); setEditingDesc(false); }}
              className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-gray-300 outline-none focus:border-violet-500" rows={3} />
          ) : (
            <p onClick={() => { setEditDesc(task.description); setEditingDesc(true); }}
              className="mb-6 cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              {task.description || 'Click to add description...'}
            </p>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Left */}
            <div>
              {/* Assignees */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Assignees</p>
                <div className="flex flex-wrap gap-2">
                  {task.assigneeIds.map(id => {
                    const user = getUserById(id);
                    if (!user) return null;
                    return (
                      <div key={id} className="flex items-center gap-2 rounded-full bg-gray-800/50 px-2.5 py-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ backgroundColor: user.color }}>{user.name.charAt(0)}</div>
                        <span className="text-xs text-gray-300">{user.name}</span>
                        <button onClick={() => updateTask(task.id, { assigneeIds: task.assigneeIds.filter(a => a !== id) })} className="text-gray-600 hover:text-red-400"><X size={10} /></button>
                      </div>
                    );
                  })}
                  {task.assigneeIds.length === 0 && currentUser && (
                    <button
                      onClick={() => updateTask(task.id, { assigneeIds: [currentUser.id] })}
                      className="rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                    >
                      Claim Task
                    </button>
                  )}
                  <select onChange={e => { if (e.target.value && !task.assigneeIds.includes(e.target.value)) updateTask(task.id, { assigneeIds: [...task.assigneeIds, e.target.value] }); e.target.value = ''; }}
                    className="rounded-full border border-gray-700 bg-gray-800/50 px-2 py-1 text-xs text-gray-400 outline-none">
                    <option value="">+ Add</option>
                    {users.filter(u => !task.assigneeIds.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Due Date</p>
                <input type="date" value={task.dueDate || ''} onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                  className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none" />
              </div>

              {/* Subtasks */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</p>
                <div className="space-y-1">
                  {task.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-800/30">
                      <button onClick={() => toggleSubtask(task.id, st.id)}
                        className={cn("flex h-4 w-4 items-center justify-center rounded border",
                          st.completed ? "border-green-500 bg-green-500" : "border-gray-600"
                        )}>
                        {st.completed && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <span className={cn("flex-1 text-xs", st.completed ? "text-gray-500 line-through" : "text-gray-300")}>{st.title}</span>
                      <button onClick={() => deleteSubtask(task.id, st.id)} className="hidden group-hover:block text-gray-600 hover:text-red-400"><Trash2 size={10} /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); }}
                    placeholder="Add subtask..."
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500" />
                  <button onClick={handleAddSubtask} className="rounded-lg bg-gray-700/50 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white"><Plus size={12} /></button>
                </div>
              </div>

              {/* Spare Parts / Bon Requests */}
              <div className="mb-4 border-t border-gray-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Spare Parts / Bon</p>
                  <button 
                    onClick={() => setShowAddPart(!showAddPart)}
                    className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium"
                  >
                    <Plus size={12} /> Request Part
                  </button>
                </div>

                {showAddPart && (
                  <div className="mb-3 rounded-lg border border-gray-700 bg-gray-800/30 p-3 space-y-2.5">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Item</label>
                      <select 
                        value={partForm.inventoryId}
                        onChange={e => setPartForm({ ...partForm, inventoryId: e.target.value })}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="">Select Part...</option>
                        {inventories.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} (Stock: {inv.quantity} {inv.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Quantity</label>
                        <input 
                          type="number"
                          min="1"
                          value={partForm.quantity}
                          onChange={e => setPartForm({ ...partForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Notes</label>
                        <input 
                          type="text"
                          placeholder="e.g. For replacement"
                          value={partForm.notes}
                          onChange={e => setPartForm({ ...partForm, notes: e.target.value })}
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button 
                        onClick={() => setShowAddPart(false)}
                        className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleRequestPart}
                        className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs text-white hover:bg-violet-500"
                      >
                        Request
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {taskPartRequests.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic">No parts requested for this task.</p>
                  ) : (
                    taskPartRequests.map(pr => {
                      const inv = inventories.find(i => i.id === pr.inventoryId);
                      return (
                        <div key={pr.id} className="flex items-center justify-between rounded-lg bg-gray-800/20 p-2 border border-gray-800/50">
                          <div>
                            <p className="text-xs font-medium text-gray-300">{inv?.name || 'Unknown Item'}</p>
                            <p className="text-[10px] text-gray-500">Qty: {pr.quantity} | {pr.notes || 'No notes'}</p>
                          </div>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                            pr.status === 'APPROVED' ? "bg-green-500/10 text-green-400" :
                            pr.status === 'REJECTED' ? "bg-red-500/10 text-red-400" :
                            "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {pr.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right - Comments & Activity */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Comments ({comments.length})</p>
              <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
                {comments.map(c => {
                  const user = getUserById(c.userId);
                  return (
                    <div key={c.id} className="rounded-lg bg-gray-800/30 p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ backgroundColor: user?.color || '#666' }}>{user?.name.charAt(0)}</div>
                        <span className="text-xs font-medium text-gray-300">{user?.name}</span>
                        <span className="text-[9px] text-gray-600">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-xs text-gray-400">{c.content}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500" />
                <button onClick={handleAddComment} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500">Send</button>
              </div>

              {/* Activity */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Activity</p>
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {taskActivities.slice(0, 5).map(act => {
                    const user = getUserById(act.userId);
                    return (
                      <div key={act.id} className="flex items-start gap-2">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-semibold text-white mt-0.5" style={{ backgroundColor: user?.color || '#666' }}>{user?.name.charAt(0)}</div>
                        <div>
                          <p className="text-[10px] text-gray-500"><span className="text-gray-400">{user?.name}</span> {act.description}</p>
                          <p className="text-[9px] text-gray-600">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
