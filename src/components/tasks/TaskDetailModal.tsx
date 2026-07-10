import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { X, Trash2, Plus, ClipboardList, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { TaskStatus, Priority } from '../../types';
import { toast } from 'sonner';
import SearchableDropdown from '../common/SearchableDropdown';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-400' },
  { value: 'pending', label: 'Pending', color: 'bg-orange-400' },
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
    currentUser, partRequests, inventories, addPartRequest,
    checklistTemplates, checklistSubmissions, submitChecklist,
    activePage, triggerTelegramAlert, addAuditLog, hasRole
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

  // Inspection Checklist Form State
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, { value: 'OK' | 'FAIL'; notes: string }>>({});

  const isEmployee = currentUser?.role === 'EMPLOYEE';
  const isAdmin = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']);
  const isSharedSpace = activePage === 'spaces';
  const canDeleteDirectly = isAdmin || !isSharedSpace;

  const handleDeleteTask = async () => {
    if (!task) return;
    if (canDeleteDirectly) {
      if (window.confirm(`Hapus tugas "${task.title}"?`)) {
        await deleteTask(task.id);
        setShowTaskModal(false);
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
        setShowTaskModal(false);
        toast.success(`Permintaan hapus tugas telah dikirim ke Admin.`);
      }
    }
  };

  if (!task) return null;

  const hasTemplate = !!task.checklistTemplateId;
  const template = checklistTemplates.find(t => t.id === task.checklistTemplateId);
  const submission = checklistSubmissions.find(s => s.taskId === task.id);

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
            {isEmployee ? (
              <span className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold border",
                task.status === 'done' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                task.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                task.status === 'in_review' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-gray-500/10 text-gray-400 border-gray-500/20'
              )}>
                {statusOptions.find(s => s.value === task.status)?.label || task.status}
              </span>
            ) : (
              <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })}
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-2.5 py-1 text-xs text-white outline-none">
                {statusOptions.map(s => {
                  const isDisabled = s.value === 'done' && hasTemplate && !submission;
                  return (
                    <option key={s.value} value={s.value} disabled={isDisabled}>
                      {s.label} {isDisabled ? '(Locked)' : ''}
                    </option>
                  );
                })}
              </select>
            )}
            {!isEmployee && (
              <select value={task.priority} onChange={e => updateTask(task.id, { priority: e.target.value as Priority })}
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-2.5 py-1 text-xs text-white outline-none">
                {priorityOptions.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDeleteTask} 
              className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
              title={canDeleteDirectly ? "Hapus Tugas" : "Minta Hapus Tugas"}
            >
              <Trash2 size={16} />
            </button>
            <button onClick={() => setShowTaskModal(false)} className="rounded-lg p-1.5 text-gray-500 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6">
          {/* Title */}
          {editingTitle && !isEmployee ? (
            <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { updateTask(task.id, { title: editTitle }); setEditingTitle(false); } if (e.key === 'Escape') setEditingTitle(false); }}
              onBlur={() => { if (editTitle.trim()) updateTask(task.id, { title: editTitle }); setEditingTitle(false); }}
              className="mb-4 w-full bg-transparent text-xl font-bold text-white outline-none" />
          ) : (
            <h2
              onClick={() => { if (!isEmployee) { setEditTitle(task.title); setEditingTitle(true); } }}
              className={cn("mb-4 text-xl font-bold text-white", !isEmployee && "cursor-pointer hover:text-violet-300")}>
              {task.title}
            </h2>
          )}

          {/* Description */}
          {editingDesc && !isEmployee ? (
            <textarea autoFocus value={editDesc} onChange={e => setEditDesc(e.target.value)}
              onBlur={() => { updateTask(task.id, { description: editDesc }); setEditingDesc(false); }}
              className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm text-gray-300 outline-none focus:border-violet-500" rows={3} />
          ) : (
            <p
              onClick={() => { if (!isEmployee) { setEditDesc(task.description); setEditingDesc(true); } }}
              className={cn("mb-6 text-sm text-gray-400", !isEmployee && "cursor-pointer hover:text-gray-300")}>
              {task.description || (isEmployee ? 'Tidak ada deskripsi.' : 'Click to add description...')}
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
                        {!isEmployee && (
                          <button onClick={() => updateTask(task.id, { assigneeIds: task.assigneeIds.filter(a => a !== id) })} className="text-gray-600 hover:text-red-400"><X size={10} /></button>
                        )}
                      </div>
                    );
                  })}
                  {!isEmployee && (
                    <>
                      {task.assigneeIds.length === 0 && currentUser && (
                        <button
                          onClick={() => updateTask(task.id, { assigneeIds: [currentUser.id] })}
                          className="rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                        >
                          Claim Task
                        </button>
                      )}
                      <div className="w-32 shrink-0">
                        <SearchableDropdown
                          options={users.filter(u => !task.assigneeIds.includes(u.id)).map(u => ({
                            value: u.id,
                            label: u.name,
                            sublabel: u.role
                          }))}
                          value=""
                          onChange={val => { if (val) updateTask(task.id, { assigneeIds: [...task.assigneeIds, val] }); }}
                          placeholder="+ Add Member"
                          searchPlaceholder="Cari anggota tim..."
                          emptyLabel="+ Add Member"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Due Date</p>
                {isEmployee ? (
                  <span className="text-xs text-gray-400">{task.dueDate || 'Tidak ditentukan'}</span>
                ) : (
                  <input type="date" value={task.dueDate || ''} onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                    className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none" />
                )}
              </div>

              {/* Checklist Template Select (Admin/Manager only) */}
              {currentUser && ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role) && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Inspection Checklist</p>
                  <SearchableDropdown
                    options={checklistTemplates.map(tpl => ({
                      value: tpl.id,
                      label: tpl.name
                    }))}
                    value={task.checklistTemplateId || ''}
                    onChange={val => updateTask(task.id, { checklistTemplateId: val || null })}
                    placeholder="-- No Inspection --"
                    searchPlaceholder="Cari template..."
                    emptyLabel="-- No Inspection --"
                  />
                </div>
              )}

              {/* Recurring Settings */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase text-gray-500">
                  <input type="checkbox" checked={!!task.isRecurring} onChange={e => updateTask(task.id, { isRecurring: e.target.checked })}
                    className="rounded border-gray-700 bg-gray-800 text-violet-600 focus:ring-0" />
                  Ulangi Task Ini
                </label>
                {task.isRecurring && (
                  <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-gray-800 bg-gray-900/20 p-2">
                    <div>
                      <span className="block text-[8px] font-medium text-gray-500 uppercase">Setiap</span>
                      <input type="number" min={1} value={task.recurInterval || 1}
                        onChange={e => updateTask(task.id, { recurInterval: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full rounded border border-gray-700 bg-gray-800/50 px-2 py-1 text-[11px] text-white outline-none" />
                    </div>
                    <div>
                      <span className="block text-[8px] font-medium text-gray-500 uppercase">Satuan</span>
                      <select value={task.recurUnit || 'weeks'}
                        onChange={e => updateTask(task.id, { recurUnit: e.target.value as any })}
                        className="w-full rounded border border-gray-700 bg-gray-800/50 px-1 py-1 text-[11px] text-white outline-none">
                        <option value="days">Hari</option>
                        <option value="weeks">Minggu</option>
                        <option value="months">Bulan</option>
                        <option value="years">Tahun</option>
                      </select>
                    </div>
                    <div>
                      <span className="block text-[8px] font-medium text-gray-500 uppercase">Perilaku</span>
                      <select value={task.recurBehavior || 'create_new'}
                        onChange={e => updateTask(task.id, { recurBehavior: e.target.value as any })}
                        className="w-full rounded border border-gray-700 bg-gray-800/50 px-1 py-1 text-[11px] text-white outline-none">
                        <option value="create_new">Baru</option>
                        <option value="reset_status">Reset</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtasks */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</p>
                <div className="space-y-1">
                  {task.subtasks.map(st => (
                    <div key={st.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-800/30">
                      <button 
                        onClick={() => toggleSubtask(task.id, st.id)}
                        className={cn("flex h-4 w-4 items-center justify-center rounded border transition-colors",
                          st.completed ? "border-green-500 bg-green-500" : "border-gray-600 hover:border-violet-500"
                        )}
                      >
                        {st.completed && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <span 
                        onClick={() => toggleSubtask(task.id, st.id)}
                        className={cn("flex-1 text-xs cursor-pointer select-none", st.completed ? "text-gray-500 line-through" : "text-gray-300 hover:text-white")}
                      >
                        {st.title}
                      </span>
                      {!isEmployee && (
                        <button 
                          onClick={() => deleteSubtask(task.id, st.id)}
                          className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {!isEmployee && (
                  <div className="mt-2 flex gap-2">
                    <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); }}
                      placeholder="Add subtask..."
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500" />
                    <button onClick={handleAddSubtask} className="rounded-lg bg-gray-700/50 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white"><Plus size={12} /></button>
                  </div>
                )}
              </div>

              {/* Spare Parts / Bon Requests */}
              {!isEmployee && (
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
                      <SearchableDropdown
                        options={inventories.map(inv => ({
                          value: inv.id,
                          label: inv.name,
                          sublabel: `Stock: ${inv.quantity} ${inv.unit}`
                        }))}
                        value={partForm.inventoryId}
                        onChange={val => setPartForm({ ...partForm, inventoryId: val })}
                        placeholder="Select Part..."
                        searchPlaceholder="Cari spare part..."
                        emptyLabel="Select Part..."
                      />
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
              )}
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

          {/* Inspection Checklist Form or Submission Results */}
          {hasTemplate && template && (
            <div className="mt-6 border-t border-gray-800 pt-6">
              <h3 className="mb-3 text-sm font-bold text-white flex items-center gap-1.5">
                <ClipboardList className="text-violet-400" size={16} />
                Laporan Inspeksi: {template.name}
              </h3>
              
              {submission ? (
                // IF SUBMITTED: Render Results
                <div className="rounded-xl border border-gray-800 bg-[#282c34]/30 p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-800 pb-2">
                    <span>Diserahkan oleh: <strong className="text-gray-300">{getUserById(submission.submittedById)?.name || 'Unknown'}</strong></span>
                    <span>Pada: <strong>{new Date(submission.submittedAt).toLocaleString()}</strong></span>
                  </div>
                  <div className="space-y-2">
                    {template.items?.map((item, idx) => {
                      const ans = submission.values?.find(v => v.itemId === item.id);
                      return (
                        <div key={item.id} className="flex flex-col gap-1 p-2 rounded-lg bg-gray-900/40 border border-gray-900/60">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-xs text-gray-300 font-medium">{idx + 1}. {item.question}</span>
                            <span className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-bold shrink-0",
                              ans?.value === 'OK' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            )}>
                              {ans?.value || 'OK'}
                            </span>
                          </div>
                          {ans?.notes && (
                            <p className="text-[11px] text-gray-500 mt-0.5">Catatan: {ans.notes}</p>
                          )}
                          {ans?.createdTicketId && (
                            <p className="text-[10px] text-yellow-500/85 mt-0.5 font-medium flex items-center gap-1">
                              <AlertTriangle size={10} /> Tiket Kerusakan Otomatis Dibuat (ID: {ans.createdTicketId.substring(0,8)})
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // IF NOT SUBMITTED: Render Input Form
                <div className="rounded-xl border border-yellow-600/20 bg-yellow-600/5 p-4 space-y-4">
                  <p className="text-xs text-yellow-500 font-semibold flex items-center gap-1">
                    <AlertTriangle size={14} /> Status 'Done' dikunci sampai semua item checklist inspeksi dilaporkan.
                  </p>
                  
                  <div className="space-y-3">
                    {template.items?.map((item, idx) => {
                      const currentAns = checklistAnswers[item.id];
                      return (
                        <div key={item.id} className="p-3 rounded-lg bg-gray-900/50 border border-gray-800 space-y-2.5">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-xs text-white font-medium">{idx + 1}. {item.question}</span>
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setChecklistAnswers({
                                  ...checklistAnswers,
                                  [item.id]: { value: 'OK', notes: currentAns?.notes || '' }
                                })}
                                className={cn(
                                  "rounded px-2.5 py-1 text-[10px] font-bold border transition",
                                  currentAns?.value === 'OK'
                                    ? "bg-green-500/15 text-green-400 border-green-500/40"
                                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                                )}
                              >
                                OK
                              </button>
                              <button
                                type="button"
                                onClick={() => setChecklistAnswers({
                                  ...checklistAnswers,
                                  [item.id]: { value: 'FAIL', notes: currentAns?.notes || '' }
                                })}
                                className={cn(
                                  "rounded px-2.5 py-1 text-[10px] font-bold border transition",
                                  currentAns?.value === 'FAIL'
                                    ? "bg-red-500/15 text-red-400 border-red-500/40"
                                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                                )}
                              >
                                FAIL
                              </button>
                            </div>
                          </div>
                          
                          {currentAns?.value === 'FAIL' && (
                            <input
                              type="text"
                              required
                              placeholder="Deskripsikan kerusakannya/kendala..."
                              value={currentAns.notes}
                              onChange={e => setChecklistAnswers({
                                ...checklistAnswers,
                                [item.id]: { ...currentAns, notes: e.target.value }
                              })}
                              className="w-full rounded border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-red-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!template.items) return;
                        const unanswered = template.items.some(item => !checklistAnswers[item.id]);
                        if (unanswered) {
                          toast.error('Harap jawab semua item inspeksi terlebih dahulu.');
                          return;
                        }
                        const failWithoutNotes = template.items.some(item => {
                          const ans = checklistAnswers[item.id];
                          return ans.value === 'FAIL' && !ans.notes.trim();
                        });
                        if (failWithoutNotes) {
                          toast.error('Harap isi catatan kerusakan untuk item yang berstatus FAIL.');
                          return;
                        }

                        const payload = template.items.map(item => ({
                          itemId: item.id,
                          value: checklistAnswers[item.id].value,
                          notes: checklistAnswers[item.id].notes
                        }));

                        toast.info('Mengirim laporan inspeksi...');
                        await submitChecklist(task.id, template.id, payload);
                        toast.success('Laporan inspeksi dikirim! Status tugas diubah ke DONE.');
                      }}
                      className="rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-violet-500/20"
                    >
                      Kirim Laporan & Selesaikan Tugas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
