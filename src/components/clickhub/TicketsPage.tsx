import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Plus, Clock, CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react';
import type { TicketStatus, TicketPriority, Ticket } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { compressImage } from '../../utils/imageCompressor';

const formatCompressionMetrics = (fileSize: number, originalSize?: number) => {
  if (!originalSize || originalSize <= fileSize) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }
  const savedPercent = Math.round(((originalSize - fileSize) / originalSize) * 100);
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };
  return `${formatSize(fileSize)} / ${formatSize(originalSize)} (Hemat ${savedPercent}%)`;
};

function SlaBadge({ ticket }: { ticket: Ticket }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, [ticket.status]);

  if (!ticket.slaDeadline) return null;

  const deadline = new Date(ticket.slaDeadline).getTime();
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  if (isResolved) {
    const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : new Date(ticket.updatedAt).getTime();
    const met = resolvedTime <= deadline;
    if (met) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-semibold text-green-400 border border-green-500/20">
          SLA Met ✓
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold text-red-400 border border-red-500/20">
          SLA Missed ✗
        </span>
      );
    }
  }

  const diff = deadline - now;
  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
        SLA: {hours}h {minutes}m left
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold text-red-400 border border-red-500/20 animate-pulse">
        SLA Overdue: {hours}h {minutes}m
      </span>
    );
  }
}

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  OPEN: { label: 'Open', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: <AlertCircle size={14} /> },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Clock size={14} /> },
  RESOLVED: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-500/20', icon: <CheckCircle2 size={14} /> },
  CLOSED: { label: 'Closed', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: <XCircle size={14} /> },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string; dot: string }> = {
  LOW: { label: 'Low', color: 'text-gray-400', dot: 'bg-gray-400' },
  MEDIUM: { label: 'Medium', color: 'text-blue-400', dot: 'bg-blue-400' },
  HIGH: { label: 'High', color: 'text-orange-400', dot: 'bg-orange-400' },
  CRITICAL: { label: 'Critical', color: 'text-red-400', dot: 'bg-red-400' },
};

const categories = ['General', 'Network', 'Hardware', 'Software', 'Server', 'Security', 'Policy'];
const columns: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

import PageHelp from '../layout/PageHelpModal';

export default function TicketsPage() {
  const { 
    tickets, getUserById, currentUser, addTicket, updateTicket, hasRole, users,
    tasks, addTask, selectTask, assets, deleteTicket, approveDeleteTicket, rejectDeleteTicket,
    articles, submitTicketFeedback, addArticle, archivedTicketsLoaded, loadAllArchivedTickets,
    uploadAttachment, deleteAttachment, requestDeleteAttachment, rejectDeleteAttachment,
    addTicketHelper, requestAssigneeChange
  } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [category, setCategory] = useState('General');
  const [type, setType] = useState<'Incident' | 'Service Request'>('Incident');
  const [assigneeId, setAssigneeId] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'archive'>('board');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const currentTicket = selectedTicket ? (tickets.find(t => t.id === selectedTicket.id) || selectedTicket) : null;
  const isAdminManager = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']);
  const canModifyAttachments = isAdminManager || (currentUser && currentTicket && (currentTicket.reporterId === currentUser.id || currentTicket.assigneeId === currentUser.id));


  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [csatRating, setCsatRating] = useState(5);
  const [csatComment, setCsatComment] = useState('');
  const [readingArticle, setReadingArticle] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fileName: string; isDoc: boolean } | null>(null);
  const [deleteReasonInput, setDeleteReasonInput] = useState('');

  // Local state for ticket edits (manual save)
  const [tempStatus, setTempStatus] = useState<TicketStatus | ''>('');
  const [tempAssigneeId, setTempAssigneeId] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState<string>('');
  const [tempPriority, setTempPriority] = useState<TicketPriority | ''>('');
  const [tempType, setTempType] = useState<'Incident' | 'Service Request' | ''>('');
  const [tempAssetId, setTempAssetId] = useState<string | null>(null);
  const [tempResolution, setTempResolution] = useState<string>('');

  useEffect(() => {
    if (selectedTicket) {
      setCsatRating(selectedTicket.csatRating || 5);
      setCsatComment(selectedTicket.csatFeedback || '');
      setTempStatus(selectedTicket.status);
      setTempAssigneeId(selectedTicket.assigneeId);
      setTempCategory(selectedTicket.category || 'General');
      setTempPriority(selectedTicket.priority);
      setTempType(selectedTicket.type || 'Incident');
      setTempAssetId(selectedTicket.assetId || null);
      setTempResolution(selectedTicket.resolution || '');
    } else {
      setTempStatus('');
      setTempAssigneeId(null);
      setTempCategory('');
      setTempPriority('');
      setTempType('');
      setTempAssetId(null);
      setTempResolution('');
    }
  }, [selectedTicket]);

  // States for sub-task breakdown
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const canManage = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']);

  const filtered = tickets.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (!canManage && currentUser && t.reporterId !== currentUser.id) return false;
    
    // Filter active vs archived tickets depending on viewMode
    if (viewMode === 'archive') {
      return !!t.isArchived;
    } else {
      return !t.isArchived;
    }
  });

  const linkedTasks = selectedTicket ? tasks.filter(t => t.ticketId === selectedTicket.id) : [];

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const ticketId = await addTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        type,
        assigneeId: assigneeId || null
      });

      if (selectedFiles.length > 0) {
        toast.loading(`Mengunggah ${selectedFiles.length} lampiran...`, { id: 'upload-toast' });
        for (const file of selectedFiles) {
          await uploadAttachment(ticketId, file);
        }
        toast.success("Tiket & lampiran berhasil dibuat!", { id: 'upload-toast' });
      } else {
        toast.success("Tiket berhasil dibuat!");
      }

      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setCategory('General');
      setType('Incident');
      setAssigneeId('');
      setSelectedFiles([]);
      setShowCreate(false);
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal membuat tiket: ${err.message}`, { id: 'upload-toast' });
    }
  };

  const handleAddTask = () => {
    if (!selectedTicket || !newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      description: `Collaborative sub-task for ticket: ${selectedTicket.title}`,
      status: 'todo',
      priority: selectedTicket.priority.toLowerCase() === 'critical' ? 'urgent' : selectedTicket.priority.toLowerCase() as any,
      assigneeIds: newTaskAssignee ? [newTaskAssignee] : [],
      ticketId: selectedTicket.id
    });
    setNewTaskTitle('');
    setNewTaskAssignee('');
    setShowAddTask(false);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500">{filtered.length} tickets</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            <button onClick={() => setViewMode('board')} className={cn("rounded-lg px-3 py-1.5 text-xs", viewMode === 'board' ? "bg-violet-600/20 text-violet-400 font-semibold" : "text-gray-500 hover:text-white")}>Board</button>
            <button onClick={() => setViewMode('list')} className={cn("rounded-lg px-3 py-1.5 text-xs", viewMode === 'list' ? "bg-violet-600/20 text-violet-400 font-semibold" : "text-gray-500 hover:text-white")}>List</button>
            <button onClick={() => setViewMode('archive')} className={cn("rounded-lg px-3 py-1.5 text-xs", viewMode === 'archive' ? "bg-violet-600/20 text-violet-400 font-semibold" : "text-gray-500 hover:text-white")}>Archive (Zip)</button>
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none">
            <option value="all">All Priority</option>
            {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none">
            <option value="all">All Types</option>
            <option value="Incident">Incident</option>
            <option value="Service Request">Service Request</option>
          </select>
          {(canManage || currentUser?.role === 'EMPLOYEE') && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 btn-new-ticket">
              <Plus size={12} /> New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-[#1e2028] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-white">Create New Ticket</h2>
            <div className="space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ticket title..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Ticket Type</label>
                <select value={type} onChange={e => setType(e.target.value as 'Incident' | 'Service Request')}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none cursor-pointer">
                  <option value="Incident">Incident</option>
                  <option value="Service Request">Service Request</option>
                </select>
              </div>
              {currentUser?.role !== 'EMPLOYEE' && (
                <div className="grid grid-cols-2 gap-3">
                  <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)}
                    className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                    {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {currentUser?.role !== 'EMPLOYEE' && (
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                  <option value="">Assign to...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}

              {/* Attachment input */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Attachments (Maks. 10MB per file)</label>
                {isOnline ? (
                  <div className="border border-dashed border-gray-700 hover:border-violet-500 rounded-lg p-3 text-center bg-gray-850/20 hover:bg-gray-800/10 transition cursor-pointer relative">
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const validFiles = files.filter(f => {
                          if (f.size > 10 * 1024 * 1024) {
                            toast.error(`Berkas ${f.name} melebihi batas ukuran 10MB.`);
                            return false;
                          }
                          return true;
                        });

                        const processedFiles: File[] = [];
                        for (const file of validFiles) {
                          if (file.type.startsWith('image/') && file.type !== 'image/gif') {
                            try {
                              const compressed = await compressImage(file);
                              processedFiles.push(compressed);
                            } catch (err) {
                              console.warn("Failed to compress image, using original:", err);
                              processedFiles.push(file);
                            }
                          } else {
                            processedFiles.push(file);
                          }
                        }

                        setSelectedFiles(prev => [...prev, ...processedFiles]);
                      }}
                    />
                    <div className="text-xs text-gray-400">
                      <span className="text-violet-400 font-semibold">Click to upload</span> or drag and drop files here
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-red-900/30 rounded-lg p-3 text-center bg-red-950/10 text-xs text-red-400">
                    ⚠️ Upload lampiran hanya tersedia dalam mode online.
                  </div>
                )}

                {/* Selected files preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-800/40 border border-gray-800/80 rounded px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                          {file.type.startsWith('image/') ? (
                            <span className="text-sm">🖼️</span>
                          ) : (
                            <span className="text-sm">📄</span>
                          )}
                          <span className="text-gray-300 truncate" title={file.name}>{file.name}</span>
                          <span className="text-[10px] text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-gray-500 hover:text-red-400 p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowCreate(false); setSelectedFiles([]); }} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleCreate} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedTicket(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-700 bg-[#1e2028] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="text-left mb-3">
              <span className="text-[11px] font-semibold text-violet-400 block tracking-wide mb-1">
                #{selectedTicket.id.slice(0, 8).toUpperCase()} {selectedTicket.ticketNumber ? `(${selectedTicket.ticketNumber})` : ''}
              </span>
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-white leading-tight">{selectedTicket.title}</h2>
                <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-white ml-2 mt-1"><X size={18} /></button>
              </div>
            </div>

            {/* Delete Request Banners */}
            {selectedTicket.isDeleteRequested && (
              hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']) ? (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex flex-col gap-2">
                  <p className="text-xs text-red-400 font-semibold">⚠️ Deletion Requested for this Ticket</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => { await approveDeleteTicket(selectedTicket.id); setSelectedTicket(null); }}
                      className="rounded bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-500 transition-colors"
                    >
                      Approve Delete (Permanent)
                    </button>
                    <button 
                      onClick={async () => { await rejectDeleteTicket(selectedTicket.id, 'ARCHIVE'); setSelectedTicket(null); }}
                      className="rounded bg-gray-700 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-gray-600 transition-colors"
                    >
                      Reject & Archive (History)
                    </button>
                    <button 
                      onClick={async () => { await rejectDeleteTicket(selectedTicket.id, 'RESTORE'); setSelectedTicket({ ...selectedTicket, isDeleteRequested: false }); }}
                      className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      Restore to Board
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-400">
                  ⏳ Delete request pending admin approval.
                </div>
              )
            )}

            {/* Archived Info Banner */}
            {selectedTicket.isArchived && (
              <div className="mb-4 rounded-lg bg-gray-500/10 border border-gray-500/20 p-3 flex items-center justify-between text-xs text-gray-400">
                <span>📦 This ticket is Archived (History).</span>
                {hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']) && (
                  <button 
                    onClick={async () => { await rejectDeleteTicket(selectedTicket.id, 'RESTORE'); setSelectedTicket(null); }}
                    className="rounded bg-violet-600 px-2 py-1 text-[10px] text-white hover:bg-violet-500 transition-colors font-semibold"
                  >
                    Restore to Board
                  </button>
                )}
              </div>
            )}

            <p className="mb-4 text-sm text-gray-400">{selectedTicket.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div><span className="text-gray-500">Type:</span> <span className="text-violet-400 font-semibold">{selectedTicket.type || 'Incident'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={statusConfig[selectedTicket.status].color}>{statusConfig[selectedTicket.status].label}</span></div>
              <div><span className="text-gray-500">Priority:</span> <span className={priorityConfig[selectedTicket.priority].color}>{priorityConfig[selectedTicket.priority].label}</span></div>
              <div><span className="text-gray-500">Category:</span> <span className="text-gray-300">{selectedTicket.category}</span></div>
              <div><span className="text-gray-500">Reporter:</span> <span className="text-gray-300">{getUserById(selectedTicket.reporterId)?.name}</span></div>
              <div><span className="text-gray-500">Assignee:</span> <span className="text-gray-300">{selectedTicket.assigneeId ? getUserById(selectedTicket.assigneeId)?.name : 'Unassigned'}</span></div>
              <div><span className="text-gray-500">Created:</span> <span className="text-gray-300">{formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}</span></div>
              <div className="col-span-2">
                <span className="text-gray-500">Helpers:</span>{' '}
                <span className="text-gray-300 font-semibold">
                  {selectedTicket.helperAssigneeIds && selectedTicket.helperAssigneeIds.length > 0
                    ? selectedTicket.helperAssigneeIds.map(id => getUserById(id)?.name).filter(Boolean).join(', ')
                    : 'None'}
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-1">
                <span className="text-gray-500">SLA Status:</span>
                <SlaBadge ticket={selectedTicket} />
              </div>
              <div className="col-span-2 mt-1">
                <span className="text-gray-500">Linked Asset (Hardware):</span>{' '}
                <span className="text-gray-300 font-semibold">
                  {selectedTicket.assetId ? (
                    assets.find(a => a.id === selectedTicket.assetId)?.name || `Asset #${selectedTicket.assetId.slice(0, 8)}`
                  ) : (
                    'None linked'
                  )}
                </span>
              </div>
            </div>
            {canManage && (
              <div className="space-y-3 border-t border-gray-800 pt-4 mb-4">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Update Ticket Attributes & Collaboration</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400">Status</label>
                    <select 
                      value={tempStatus} 
                      onChange={e => setTempStatus(e.target.value as TicketStatus)}
                      className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none w-full cursor-pointer"
                    >
                      {columns.map(s => {
                        const isDisabled = s === 'OPEN' && selectedTicket.status !== 'OPEN';
                        return (
                          <option key={s} value={s} disabled={isDisabled}>
                            {statusConfig[s].label} {isDisabled ? '(Locked)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400">Assignee</label>
                    {(selectedTicket.status !== 'OPEN' && !isAdminManager) ? (
                      <div className="flex flex-col">
                        <select 
                          value={tempAssigneeId || ''} 
                          disabled={true}
                          className="rounded-lg border border-gray-700 bg-gray-800/30 px-3 py-1.5 text-xs text-gray-500 outline-none w-full cursor-not-allowed"
                        >
                          <option value="">{tempAssigneeId ? getUserById(tempAssigneeId)?.name : 'Unassigned'}</option>
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            const reason = window.prompt("Masukkan alasan pengajuan pergantian teknisi:");
                            if (reason && reason.trim()) {
                              try {
                                toast.loading('Mengirimkan pengajuan...', { id: 'req-assignee-toast' });
                                await requestAssigneeChange(selectedTicket.id, reason.trim());
                                toast.success("Pengajuan pergantian teknisi berhasil dikirim ke Manajer & Admin!", { id: 'req-assignee-toast' });
                              } catch (err: any) {
                                toast.error(`Gagal mengirim pengajuan: ${err.message}`, { id: 'req-assignee-toast' });
                              }
                            }
                          }}
                          className="mt-1 text-[10px] text-violet-400 hover:text-violet-300 font-semibold underline text-left cursor-pointer"
                        >
                          Ajukan Pergantian (Request Change)
                        </button>
                      </div>
                    ) : (
                      <select 
                        value={tempAssigneeId || ''} 
                        onChange={e => setTempAssigneeId(e.target.value || null)}
                        className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none w-full cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] text-gray-400 font-semibold text-gray-400">Minta Bantuan (Tambah Helper)</label>
                    <select
                      value=""
                      onChange={async e => {
                        if (e.target.value) {
                          toast.info('Menambahkan helper...');
                          await addTicketHelper(selectedTicket.id, e.target.value);
                          const updatedHelpers = selectedTicket.helperAssigneeIds ? [...selectedTicket.helperAssigneeIds] : [];
                          if (!updatedHelpers.includes(e.target.value)) {
                            updatedHelpers.push(e.target.value);
                          }
                          setSelectedTicket({ ...selectedTicket, helperAssigneeIds: updatedHelpers });
                          toast.success('Helper berhasil ditambahkan!');
                        }
                      }}
                      className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-violet-400 outline-none w-full cursor-pointer"
                    >
                      <option value="">+ Pilih Teknisi Helper (Minta Bantuan)</option>
                      {users
                        .filter(u => u.id !== selectedTicket.assigneeId && !(selectedTicket.helperAssigneeIds || []).includes(u.id))
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))
                      }
                    </select>
                    {/* Helper List with Cancel Buttons */}
                    {selectedTicket.helperAssigneeIds && selectedTicket.helperAssigneeIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 bg-gray-900/30 p-2 rounded-lg border border-gray-800/50">
                        {selectedTicket.helperAssigneeIds.map(helperId => {
                          const helperName = getUserById(helperId)?.name || 'Unknown';
                          const helperTasks = tasks.filter(t => t.ticketId === selectedTicket.id && (t.assigneeId === helperId || (t.assigneeIds && t.assigneeIds.includes(helperId))));
                          const isAccepted = helperTasks.some(t => t.status !== 'todo');
                          return (
                            <span key={helperId} className="flex items-center gap-1.5 bg-violet-900/30 border border-violet-800/50 rounded-full px-2.5 py-1 text-xs text-violet-300">
                              {helperName}
                              {!isAccepted ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    toast.info('Menghapus helper...');
                                    const updatedHelpers = selectedTicket.helperAssigneeIds ? selectedTicket.helperAssigneeIds.filter(id => id !== helperId) : [];
                                    await updateTicket(selectedTicket.id, { helperAssigneeIds: updatedHelpers });
                                    setSelectedTicket({ ...selectedTicket, helperAssigneeIds: updatedHelpers });
                                    toast.success('Helper berhasil dihapus!');
                                  }}
                                  className="text-violet-400 hover:text-red-400 font-bold ml-1 cursor-pointer transition-colors"
                                  title="Batalkan Helper"
                                >
                                  ✕
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-400 ml-1 cursor-help" title="Sudah Menerima / Mengerjakan Tugas">✓</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400">Category</label>
                    <select value={tempCategory} onChange={e => setTempCategory(e.target.value)}
                      className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none w-full cursor-pointer">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400">Priority</label>
                    <select value={tempPriority} onChange={e => setTempPriority(e.target.value as TicketPriority)}
                      className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none w-full cursor-pointer">
                      {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400">Ticket Type</label>
                    <select value={tempType} onChange={e => setTempType(e.target.value as 'Incident' | 'Service Request')}
                      className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none w-full cursor-pointer">
                      <option value="Incident">Incident</option>
                      <option value="Service Request">Service Request</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400">Link Asset (Hardware Device)</label>
                    <select value={tempAssetId || ''} onChange={e => setTempAssetId(e.target.value || null)}
                      className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none w-full cursor-pointer">
                      <option value="">No linked asset</option>
                      {assets.map(a => <option key={a.id} value={a.id}>{a.brand} {a.name} ({a.serialNumber})</option>)}
                    </select>
                  </div>
                  {canManage && (tempStatus === 'RESOLVED' || tempStatus === 'CLOSED') && (
                    <div className="col-span-2 flex flex-col gap-1 mt-2">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Catatan Resolusi (Solution)</label>
                      <textarea 
                        value={tempResolution} 
                        onChange={e => setTempResolution(e.target.value)}
                        placeholder="Tuliskan bagaimana masalah ini berhasil diselesaikan..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                      />
                    </div>
                  )}

                  {/* Manual Update Ticket Attributes Button with Business Rule Validations */}
                  <div className="col-span-2 mt-2 pt-2 border-t border-gray-800/60 flex flex-col gap-2">
                    <button
                      onClick={async () => {
                        // Rule 1: No regression to OPEN
                        if (tempStatus === 'OPEN' && selectedTicket.status !== 'OPEN') {
                          toast.error("Status yang sudah berjalan tidak bisa dikembalikan ke OPEN!");
                          return;
                        }

                        // Rule 2 & 3: RESOLVED / CLOSED requires at least 1 sub-task and all must be completed
                        if (tempStatus === 'RESOLVED' || tempStatus === 'CLOSED') {
                          const ticketTasks = tasks.filter(t => t.ticketId === selectedTicket.id);
                          
                          if (ticketTasks.length === 0) {
                            toast.error("Wajib membuat minimal 1 sub-task sebelum menyelesaikan tiket!");
                            return;
                          }

                          const hasUnfinishedTasks = ticketTasks.some(t => t.status !== 'done');
                          if (hasUnfinishedTasks) {
                            toast.error("Selesaikan semua sub-task terlebih dahulu!");
                            return;
                          }
                        }

                        try {
                          toast.loading('Menyimpan perubahan...', { id: 'save-ticket-toast' });
                          await updateTicket(selectedTicket.id, {
                            status: tempStatus as TicketStatus,
                            assigneeId: tempAssigneeId,
                            category: tempCategory,
                            priority: tempPriority as TicketPriority,
                            type: tempType as 'Incident' | 'Service Request',
                            assetId: tempAssetId,
                            resolution: tempResolution
                          });
                          setSelectedTicket({
                            ...selectedTicket,
                            status: tempStatus as TicketStatus,
                            assigneeId: tempAssigneeId,
                            category: tempCategory,
                            priority: tempPriority as TicketPriority,
                            type: tempType as 'Incident' | 'Service Request',
                            assetId: tempAssetId,
                            resolution: tempResolution
                          });
                          toast.success('Tiket berhasil diperbarui!', { id: 'save-ticket-toast' });
                        } catch (err: any) {
                          console.error(err);
                          toast.error(`Gagal memperbarui tiket: ${err.message}`, { id: 'save-ticket-toast' });
                        }
                      }}
                      className="w-full rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
                    >
                      Update Ticket
                    </button>
                  </div>

                  <div className="col-span-2 mt-2 pt-2 border-t border-gray-800/60 flex justify-between items-center">
                    {canManage && (selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                      <button 
                        onClick={async () => {
                          const title = `Solusi: ${selectedTicket.title}`;
                          const content = `# Solusi untuk: ${selectedTicket.title}\n\n### Masalah\n${selectedTicket.description}\n\n### Penyelesaian\n${selectedTicket.resolution || 'Telah diselesaikan dengan baik oleh tim IT Support.'}`;
                          await addArticle({
                            title,
                            content,
                            category: selectedTicket.category || 'General',
                            isPublic: true,
                            authorId: currentUser?.id || 'system'
                          });
                          alert('Draf Artikel Knowledge Base berhasil dibuat dari solusi tiket ini!');
                        }}
                        className="rounded bg-emerald-600/20 px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-600/30 transition-colors font-semibold"
                      >
                        📖 Terbitkan ke KB
                      </button>
                    )}
                    {!selectedTicket.isDeleteRequested && !selectedTicket.isArchived && (
                      <button 
                        onClick={async () => { 
                          await deleteTicket(selectedTicket.id); 
                          setSelectedTicket(null); 
                        }}
                        className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/30 transition-colors font-semibold ml-auto"
                      >
                        Request Ticket Deletion
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            <div className="mt-4 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Attachments ({(currentTicket?.attachments || []).length})</h3>
                {canModifyAttachments && (
                  isOnline ? (
                    <label className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium cursor-pointer">
                      <Plus size={12} /> Add File
                      <input
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("Berkas melebihi batas ukuran 10MB.");
                            return;
                          }
                          if (currentTicket) {
                            const uploadPromise = uploadAttachment(currentTicket.id, file);
                            toast.promise(uploadPromise, {
                              loading: `Mengunggah ${file.name}...`,
                              success: `Berhasil mengunggah ${file.name}!`,
                              error: (err) => `Gagal mengunggah: ${err.message}`
                            });
                            try {
                              await uploadPromise;
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <span className="text-[10px] text-red-500">Offline mode: Upload disabled</span>
                  )
                )}
              </div>

              {(currentTicket?.attachments || []).length === 0 ? (
                <p className="text-[11px] text-gray-500 italic">No attachments uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {/* Image grid */}
                  {(() => {
                    const images = (currentTicket?.attachments || []).filter(a => a.fileType.startsWith('image/'));
                    if (images.length === 0) return null;
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {images.map(img => (
                          <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square border border-gray-700 bg-gray-900 flex items-center justify-center">
                            <img src={img.fileUrl} alt={img.fileName} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(img.fileUrl, '_blank')} />
                            <div className="absolute bottom-1 left-1 bg-black/75 text-[8px] text-gray-200 px-1 py-0.5 rounded pointer-events-none font-medium truncate max-w-[90%] z-10">
                              {formatCompressionMetrics(img.fileSize, img.originalSize)}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-1.5 z-20">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => window.open(img.fileUrl, '_blank')}
                                  className="p-1 rounded bg-gray-800 text-gray-300 hover:text-white"
                                  title="Open original"
                                >
                                  👁️
                                </button>
                                {isOnline && !img.isDeleteRequested && canModifyAttachments && (
                                  <button
                                    onClick={async () => {
                                      if (isAdminManager) {
                                        if (confirm(`Apakah Anda yakin ingin menghapus lampiran "${img.fileName}" secara permanen?`)) {
                                          const deletePromise = deleteAttachment(img.id);
                                          toast.promise(deletePromise, {
                                            loading: "Menghapus...",
                                            success: "Lampiran berhasil dihapus!",
                                            error: (err) => `Gagal: ${err.message}`
                                          });
                                        }
                                      } else {
                                        setDeleteTarget({ id: img.id, fileName: img.fileName, isDoc: false });
                                      }
                                    }}
                                    className="p-1 rounded bg-red-900/60 text-red-400 hover:text-white btn-request-delete-img"
                                    title={isAdminManager ? "Delete Permanently" : "Request Delete"}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                              {isOnline && img.isDeleteRequested && (
                                isAdminManager ? (
                                  <div className="flex flex-col items-center gap-1 text-center bg-gray-900/80 p-1.5 rounded border border-red-500/20 max-w-full">
                                    <span className="text-[8px] text-red-400 font-semibold block truncate max-w-[120px]" title={img.deleteReason}>
                                      Alasan: "{img.deleteReason || 'Tidak ada alasan'}"
                                    </span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Approve permanent deletion of "${img.fileName}"?`)) {
                                            const deletePromise = deleteAttachment(img.id);
                                            toast.promise(deletePromise, {
                                              loading: "Deleting...",
                                              success: "Attachment deleted!",
                                              error: (err) => `Failed: ${err.message}`
                                            });
                                          }
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-green-700 text-white hover:bg-green-600 text-[8px] font-bold btn-approve-delete-img"
                                        title="Approve Delete"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const rejectPromise = rejectDeleteAttachment(img.id);
                                          toast.promise(rejectPromise, {
                                            loading: "Rejecting...",
                                            success: "Deletion request rejected!",
                                            error: (err) => `Failed: ${err.message}`
                                          });
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600 text-[8px] font-bold btn-reject-delete-img"
                                        title="Reject Request"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-semibold animate-pulse block text-center" title={`Alasan: ${img.deleteReason || ''}`}>
                                    ⏳ Pending Approve
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Documents / other files list */}
                  {(() => {
                    const docs = (currentTicket?.attachments || []).filter(a => !a.fileType.startsWith('image/'));
                    if (docs.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between rounded bg-gray-800/40 px-2.5 py-1.5 border border-gray-800/60 text-xs text-left">
                            <div className="flex items-center gap-2 truncate max-w-[60%]">
                              <span className="text-sm">📄</span>
                              <div className="truncate flex flex-col">
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-violet-300 hover:text-violet-200 hover:underline truncate font-medium" title={doc.fileName}>
                                  {doc.fileName}
                                </a>
                                <span className="text-[9px] text-gray-500">
                                  {formatCompressionMetrics(doc.fileSize, doc.originalSize)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <a
                                href={doc.fileUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-gray-400 hover:text-white rounded bg-gray-800"
                                title="Download"
                              >
                                📥
                              </a>
                              {isOnline && (
                                <>
                                  {doc.isDeleteRequested ? (
                                    isAdminManager ? (
                                      <div className="flex flex-col items-end gap-1 bg-gray-900/50 p-1 rounded border border-red-500/15 max-w-[150px]">
                                        <span className="text-[8px] text-red-400 font-semibold truncate max-w-full" title={doc.deleteReason}>
                                          Alasan: "{doc.deleteReason || 'Tidak ada alasan'}"
                                        </span>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={async () => {
                                              if (confirm(`Approve permanent deletion of "${doc.fileName}"?`)) {
                                                const deletePromise = deleteAttachment(doc.id);
                                                toast.promise(deletePromise, {
                                                  loading: "Deleting...",
                                                  success: "Attachment deleted!",
                                                  error: (err) => `Failed: ${err.message}`
                                                });
                                              }
                                            }}
                                            className="px-1.5 py-0.5 rounded bg-green-800 text-white hover:bg-green-700 text-[8px] font-bold btn-approve-delete-doc"
                                            title="Approve Delete"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={async () => {
                                              const rejectPromise = rejectDeleteAttachment(doc.id);
                                              toast.promise(rejectPromise, {
                                                loading: "Rejecting...",
                                                success: "Deletion request rejected!",
                                                error: (err) => `Failed: ${err.message}`
                                              });
                                            }}
                                            className="px-1.5 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600 text-[8px] font-bold btn-reject-delete-doc"
                                            title="Reject Request"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium animate-pulse" title={`Alasan: ${doc.deleteReason || ''}`}>
                                        ⏳ Pending Delete
                                      </span>
                                    )
                                  ) : (
                                    canModifyAttachments && (
                                      <button
                                        onClick={async () => {
                                          if (isAdminManager) {
                                            if (confirm(`Apakah Anda yakin ingin menghapus lampiran "${doc.fileName}" secara permanen?`)) {
                                              const deletePromise = deleteAttachment(doc.id);
                                              toast.promise(deletePromise, {
                                                loading: "Menghapus...",
                                                success: "Lampiran berhasil dihapus!",
                                                error: (err) => `Gagal: ${err.message}`
                                              });
                                            }
                                          } else {
                                            setDeleteTarget({ id: doc.id, fileName: doc.fileName, isDoc: true });
                                          }
                                        }}
                                        className="p-1 text-red-400 hover:text-red-300 rounded bg-red-950/20 btn-request-delete-doc"
                                        title={isAdminManager ? "Delete Permanently" : "Request Delete"}
                                      >
                                        🗑️
                                      </button>
                                    )
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* CSAT Rating Section */}
            {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
              <div className="mt-4 border-t border-gray-800 pt-4 bg-violet-950/10 rounded-xl p-3 border border-violet-900/20">
                <h3 className="text-xs font-semibold uppercase text-violet-400 tracking-wider mb-2">⭐ Kepuasan Layanan (CSAT)</h3>
                {selectedTicket.csatRating ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400 text-sm">
                        {'★'.repeat(selectedTicket.csatRating) + '☆'.repeat(5 - selectedTicket.csatRating)}
                      </div>
                      <span className="text-xs text-gray-300 font-semibold">{selectedTicket.csatRating} / 5</span>
                    </div>
                    {selectedTicket.csatFeedback && (
                      <p className="text-xs text-gray-400 italic">"{selectedTicket.csatFeedback}"</p>
                    )}
                  </div>
                ) : (
                  currentUser && selectedTicket.reporterId === currentUser.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Peringkat:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              key={star} 
                              onClick={() => setCsatRating(star)} 
                              className={cn("text-lg transition btn-star-rating", star <= csatRating ? "text-amber-400" : "text-gray-600 hover:text-gray-400")}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea 
                        value={csatComment} 
                        onChange={e => setCsatComment(e.target.value)} 
                        placeholder={
                          csatRating <= 3
                            ? "Mohon jelaskan secara detail kendala yang Anda alami agar kami dapat meningkatkan layanan di masa depan..."
                            : "Bagikan ulasan Anda tentang layanan IT kami..."
                        }
                        rows={2} 
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500 csat-comment-textarea"
                      />
                      <button 
                        onClick={async () => {
                          await submitTicketFeedback(selectedTicket.id, csatRating, csatComment);
                          setSelectedTicket({ ...selectedTicket, csatRating, csatFeedback: csatComment });
                        }}
                        disabled={csatRating <= 3 && !csatComment.trim()}
                        className={cn(
                          "rounded px-3 py-1.5 text-xs font-semibold text-white transition btn-submit-csat",
                          (csatRating <= 3 && !csatComment.trim())
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-violet-600 hover:bg-violet-500"
                        )}
                      >
                        Kirim Ulasan
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic font-medium">Menunggu feedback dari pembuat tiket.</p>
                  )
                )}
              </div>
            )}

            {/* Recommended Articles Section */}
            {(() => {
              const recArticles = articles.filter(art => {
                const catMatch = art.category.toLowerCase() === selectedTicket.category?.toLowerCase();
                const titleWords = selectedTicket.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                const keywordMatch = titleWords.some(word => 
                  art.title.toLowerCase().includes(word) || art.content.toLowerCase().includes(word)
                );
                return catMatch || keywordMatch;
              });
              if (recArticles.length === 0) return null;
              return (
                <div className="mt-4 border-t border-gray-800 pt-4">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">💡 Solusi Relevan (Knowledge Base)</h3>
                  <div className="space-y-2">
                    {recArticles.map(art => (
                      <div key={art.id} className="rounded-lg bg-violet-600/5 border border-violet-500/10 p-2 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-violet-300">{art.title}</p>
                          <p className="text-[10px] text-gray-500">{art.category}</p>
                        </div>
                        <button 
                          onClick={() => setReadingArticle(art)}
                          className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 btn-read-solution"
                        >
                          Baca Solusi →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Linked Tasks (Collaboration) */}
            <div className="mt-6 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Sub-tasks / Collaboration ({linkedTasks.length})</h3>
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium"
                >
                  <Plus size={12} /> Add Sub-task
                </button>
              </div>

              {showAddTask && (
                <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/30 p-3 space-y-2.5 animate-slide-up">
                  <input
                    type="text"
                    placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newTaskAssignee}
                      onChange={e => setNewTaskAssignee(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="">Assign to...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button
                      onClick={handleAddTask}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500 font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {linkedTasks.length === 0 ? (
                  <p className="text-[11px] text-gray-500 italic">No sub-tasks created. Break down this ticket into tasks to collaborate.</p>
                ) : (
                  linkedTasks.map(task => {
                    const assigneeUser = task.assigneeIds[0] ? getUserById(task.assigneeIds[0]) : null;
                    return (
                      <div
                        key={task.id}
                        onClick={() => { selectTask(task.id); setSelectedTicket(null); }}
                        className="flex items-center justify-between rounded-lg bg-gray-800/20 p-2.5 border border-gray-800/50 hover:border-gray-700 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            task.status === 'done' ? "bg-green-500" :
                            task.status === 'in_progress' ? "bg-blue-500" :
                            task.status === 'in_review' ? "bg-yellow-500" :
                            "bg-gray-500"
                          )} />
                          <span className="text-xs font-medium text-gray-300 hover:text-white transition-colors">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {assigneeUser ? (
                            <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{assigneeUser.name}</span>
                          ) : (
                            <span className="text-[10px] text-gray-600 italic">Unassigned</span>
                          )}
                          <span className="text-[10px] uppercase font-semibold text-gray-500">{task.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="flex gap-4 overflow-x-auto">
          {columns.map(status => {
            const colTickets = filtered
              .filter(t => t.status === status)
              .sort((a, b) => {
                if (status === 'RESOLVED' || status === 'CLOSED') {
                  const timeA = a.resolvedAt ? new Date(a.resolvedAt).getTime() : new Date(a.updatedAt || a.createdAt).getTime();
                  const timeB = b.resolvedAt ? new Date(b.resolvedAt).getTime() : new Date(b.updatedAt || b.createdAt).getTime();
                  return timeB - timeA;
                }
                const timeA = new Date(a.updatedAt || a.createdAt).getTime();
                const timeB = new Date(b.updatedAt || b.createdAt).getTime();
                return timeB - timeA;
              });
            const config = statusConfig[status];
            return (
              <div key={status} className="min-w-[260px] flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.bg, config.color)}>{config.icon} {config.label}</span>
                  <span className="text-xs text-gray-500">{colTickets.length}</span>
                </div>
                <div className="space-y-2">
                  {colTickets.map(ticket => {
                    const assignee = ticket.assigneeId ? getUserById(ticket.assigneeId) : null;
                    const pKey = (ticket.priority || 'MEDIUM').toUpperCase() as TicketPriority;
                    const pConfig = priorityConfig[pKey] || priorityConfig.MEDIUM;
                    return (
                      <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                        className="w-full rounded-lg border border-gray-700/50 bg-[#282c34] p-3 text-left hover:border-gray-600 transition">
                        {ticket.isDeleteRequested && (
                          <div className="mb-2 rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] text-red-400 text-center font-semibold animate-pulse">
                            🗑️ Deletion Requested
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-1.5 w-1.5 rounded-full", pConfig.dot)} />
                            <span className={cn("text-[10px]", pConfig.color)}>{pConfig.label}</span>
                            <span className="rounded-full bg-gray-700/50 px-1.5 py-0.5 text-[9px] text-gray-400">{ticket.category}</span>
                            <span className="rounded-full bg-violet-950/40 px-1.5 py-0.5 text-[9px] text-violet-300 border border-violet-850/30">{ticket.type || 'Incident'}</span>
                          </div>
                          <SlaBadge ticket={ticket} />
                        </div>
                        <p className="text-sm font-medium text-white mb-1">{ticket.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {assignee && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ backgroundColor: assignee.color }} title={`Assignee: ${assignee.name}`}>
                                {assignee.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-[10px] text-gray-500">By: {getUserById(ticket.reporterId)?.name || 'Unknown'}</span>
                          </div>
                          <span className="text-[9px] text-gray-600">{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View or Archive View */
        <div className="space-y-4">
          {viewMode === 'archive' && !archivedTicketsLoaded && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/15 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-violet-900/25">
              <div>
                <h4 className="text-sm font-semibold text-white">📦 Load Historical Archive</h4>
                <p className="text-xs text-gray-400">By default, only active tickets and tickets closed in the last 30 days are loaded. Retrieve all older historical tickets from the cloud database.</p>
              </div>
              <button 
                onClick={async () => {
                  const promise = loadAllArchivedTickets();
                  toast.promise(promise, {
                    loading: 'Loading historical tickets from Supabase...',
                    success: 'Successfully loaded all historical tickets!',
                    error: 'Failed to load historical tickets.'
                  });
                }}
                className="shrink-0 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors btn-load-historical"
              >
                Load All Historical Tickets
              </button>
            </div>
          )}

          <div className="rounded-xl border border-gray-800 bg-[#282c34] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">SLA Status</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => {
                const assignee = ticket.assigneeId ? getUserById(ticket.assigneeId) : null;
                const reporter = getUserById(ticket.reporterId);
                
                const sKey = (ticket.status || 'OPEN').toUpperCase() as TicketStatus;
                const sConfig = statusConfig[sKey] || statusConfig.OPEN;

                const pKey = (ticket.priority || 'MEDIUM').toUpperCase() as TicketPriority;
                const pConfig = priorityConfig[pKey] || priorityConfig.MEDIUM;

                const formattedDate = (() => {
                  try {
                    return formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });
                  } catch (e) {
                    return 'Unknown';
                  }
                })();

                return (
                  <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3"><span className="rounded bg-violet-950/40 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-800/30">{ticket.type || 'Incident'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{ticket.title}</span>
                        {ticket.isDeleteRequested && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[8px] font-bold text-red-400 animate-pulse border border-red-500/20">Deletion Requested</span>}
                        {ticket.isArchived && <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[8px] font-bold text-gray-400 border border-gray-700">Archived</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={cn("flex items-center gap-1 text-xs", sConfig.color)}>{sConfig.icon} {sConfig.label}</span></td>
                    <td className="px-4 py-3"><span className={cn("flex items-center gap-1 text-xs", pConfig.color)}><div className={cn("h-1.5 w-1.5 rounded-full", pConfig.dot)} />{pConfig.label}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-400">{ticket.category}</span></td>
                    <td className="px-4 py-3"><SlaBadge ticket={ticket} /></td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-300">{reporter?.name || 'Unknown'}</span></td>
                    <td className="px-4 py-3">{assignee ? <span className="text-xs text-gray-300">{assignee.name}</span> : <span className="text-xs text-gray-600">Unassigned</span>}</td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-500">{formattedDate}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {readingArticle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 modal-read-solution" onClick={() => setReadingArticle(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-[#1e2028] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white solution-article-title">{readingArticle.title}</h2>
              <button onClick={() => setReadingArticle(null)} className="text-gray-500 hover:text-white btn-close-solution"><X size={18} /></button>
            </div>
            <div className="text-xs text-gray-300 max-h-96 overflow-y-auto space-y-2 prose prose-invert">
              <p className="text-violet-400 font-semibold uppercase tracking-wider text-[9px] mb-2">{readingArticle.category}</p>
              <div className="whitespace-pre-wrap solution-article-content">{readingArticle.content}</div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setReadingArticle(null)} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 btn-close-solution-ok">Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 modal-delete-reason" onClick={() => { setDeleteTarget(null); setDeleteReasonInput(''); }}>
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-[#1e2028] p-5 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-2">Alasan Penghapusan Lampiran</h3>
            <p className="text-[11px] text-gray-400 mb-3">
              Mohon tuliskan alasan mengapa Anda ingin menghapus berkas <strong>{deleteTarget.fileName}</strong>. Permintaan ini akan ditinjau oleh Admin.
            </p>
            <textarea
              className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500 mb-4 delete-reason-textarea"
              rows={3}
              value={deleteReasonInput}
              onChange={e => setDeleteReasonInput(e.target.value)}
              placeholder="Contoh: Lampiran salah berkas / revisi berkas terbaru..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteReasonInput(''); }}
                className="rounded px-3 py-1.5 text-xs text-gray-400 hover:text-white btn-cancel-delete-reason"
              >
                Batal
              </button>
              <button
                disabled={!deleteReasonInput.trim()}
                onClick={async () => {
                  const reason = deleteReasonInput.trim();
                  if (!reason) return;
                  const requestPromise = requestDeleteAttachment(deleteTarget.id, reason);
                  toast.promise(requestPromise, {
                    loading: "Mengajukan hapus...",
                    success: "Permintaan hapus dikirim!",
                    error: (err) => `Gagal: ${err.message}`
                  });
                  setDeleteTarget(null);
                  setDeleteReasonInput('');
                }}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-semibold text-white transition btn-submit-delete-reason",
                  !deleteReasonInput.trim() ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-500"
                )}
              >
                Kirim Permintaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
