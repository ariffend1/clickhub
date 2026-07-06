import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { X } from 'lucide-react';
import type { TaskStatus, Priority } from '../../types';

export default function CreateTaskModal() {
  const { setShowCreateTaskModal, addTask, spaces, lists, users, selectedSpaceId, selectedListId } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('normal');
  const [spaceId, setSpaceId] = useState(selectedSpaceId || '');
  const [listId, setListId] = useState(selectedListId || '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [selectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurInterval, setRecurInterval] = useState(1);
  const [recurUnit, setRecurUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('weeks');
  const [recurBehavior, setRecurBehavior] = useState<'create_new' | 'reset_status'>('create_new');

  const spaceLists = lists.filter(l => l.spaceId === spaceId);

  const handleSubmit = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description,
      status,
      priority,
      assigneeIds,
      tags: selectedTags,
      spaceId,
      listId,
      dueDate: dueDate || null,
      isRecurring,
      recurInterval,
      recurUnit,
      recurBehavior
    });
    setShowCreateTaskModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreateTaskModal(false)}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-[#1e2028] shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Create New Task</h2>
          <button onClick={() => setShowCreateTaskModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Task Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter task title..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add description..." rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="normal">🔵 Normal</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Space</label>
              <select value={spaceId} onChange={e => { setSpaceId(e.target.value); setListId(''); }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                <option value="">Select space</option>
                {spaces.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">List</label>
              <select value={listId} onChange={e => setListId(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                <option value="">Select list</option>
                {spaceLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Assignees</label>
              <select onChange={e => { if (e.target.value && !assigneeIds.includes(e.target.value)) setAssigneeIds([...assigneeIds, e.target.value]); e.target.value = ''; }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                <option value="">Add assignee</option>
                {users.filter(u => !assigneeIds.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              {assigneeIds.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {assigneeIds.map(id => {
                    const user = users.find(u => u.id === id);
                    return <span key={id} className="flex items-center gap-1 rounded-full bg-gray-700/50 px-2 py-0.5 text-[10px] text-gray-300">
                      {user?.name} <button onClick={() => setAssigneeIds(assigneeIds.filter(a => a !== id))} className="text-gray-500 hover:text-red-400"><X size={8} /></button>
                    </span>;
                  })}
                </div>
              )}
            </div>
            <div className="col-span-2 border-t border-gray-800 pt-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-400">
                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-violet-600 focus:ring-0" />
                Ulangi Task Ini (Recurring Task)
              </label>
              {isRecurring && (
                <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-500">Setiap (Interval)</label>
                    <input type="number" min={1} value={recurInterval} onChange={e => setRecurInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-500">Satuan Waktu</label>
                    <select value={recurUnit} onChange={e => setRecurUnit(e.target.value as any)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-2 py-1.5 text-xs text-white outline-none">
                      <option value="days">Hari</option>
                      <option value="weeks">Minggu</option>
                      <option value="months">Bulan</option>
                      <option value="years">Tahun</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-500">Perilaku</label>
                    <select value={recurBehavior} onChange={e => setRecurBehavior(e.target.value as any)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-2 py-1.5 text-xs text-white outline-none">
                      <option value="create_new">Buat Task Baru</option>
                      <option value="reset_status">Reset Status Task</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateTaskModal(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button onClick={handleSubmit} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Create Task</button>
          </div>
        </div>
      </div>
    </div>
  );
}
