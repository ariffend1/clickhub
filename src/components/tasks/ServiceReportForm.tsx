import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  FileText, Clock, Camera, Trash2, Send, Save, Lock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Task, ServiceReport, ServiceReportFinalStatus, ActionStep, ServiceReportUsedPart } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { toast } from 'sonner';
import SearchableDropdown from '../common/SearchableDropdown';

interface ServiceReportFormProps {
  task: Task;
}

export default function ServiceReportForm({ task }: ServiceReportFormProps) {
  const { 
    serviceReports, actionChips, tickets, users, inventories, currentUser,
    saveServiceReportDraft, submitServiceReportFinal, setShowTaskModal
  } = useStore();


  const ticket = task.ticketId ? (tickets || []).find(t => t.id === task.ticketId) : null;
  const reporter = ticket ? (users || []).find(u => u.id === ticket.reporterId) : null;

  // Existing report for this task
  const existingReport = (serviceReports || []).find(r => r.taskId === task.id);
  const isReadOnly = existingReport ? (!existingReport.isDraft && task.status === 'done') : false;

  // State
  const [diagnosa, setDiagnosa] = useState('');
  const [actionSteps, setActionSteps] = useState<ActionStep[]>([]);
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string | null>(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string | null>(null);
  const [usedParts, setUsedParts] = useState<ServiceReportUsedPart[]>([]);
  const [finalStatus, setFinalStatus] = useState<ServiceReportFinalStatus>('COMPLETED_NORMAL');
  const [temporaryReason, setTemporaryReason] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('');
  const [escalationTargetId, setEscalationTargetId] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [unrepairableReason, setUnrepairableReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [technicianDurationNotes, setTechnicianDurationNotes] = useState('');
  const [customStepTitle, setCustomStepTitle] = useState('');
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  // Auto Timer Calculation (Immutable)
  const startTime = task.createdAt ? new Date(task.createdAt).getTime() : Date.now();
  const endTime = existingReport?.submittedAt ? new Date(existingReport.submittedAt).getTime() : Date.now();
  const calculatedDurationMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0) return `${hours} jam ${m} menit`;
    return `${m} menit`;
  };

  // Load existing report state into form
  useEffect(() => {
    if (existingReport) {
      setDiagnosa(existingReport.diagnosa || '');
      setActionSteps(existingReport.actionSteps || []);
      setBeforePhotoUrl(existingReport.beforePhotoUrl || null);
      setAfterPhotoUrl(existingReport.afterPhotoUrl || null);
      setUsedParts(existingReport.usedParts || []);
      setFinalStatus(existingReport.finalStatus || 'COMPLETED_NORMAL');
      setTemporaryReason(existingReport.temporaryReason || '');
      setFollowUpPlan(existingReport.followUpPlan || '');
      setEscalationTargetId(existingReport.escalationTargetId || '');
      setEscalationReason(existingReport.escalationReason || '');
      setUnrepairableReason(existingReport.unrepairableReason || '');
      setAdditionalNotes(existingReport.additionalNotes || '');
      setTechnicianDurationNotes(existingReport.technicianDurationNotes || '');
    }
  }, [existingReport]);

  const activeChips = (actionChips || []).filter(c => !c.isHidden);
  const managers = (users || []).filter(u => ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(u.role));

  const handleAddStepFromChip = (chip: { id: string; label: string; icon: string }) => {
    if (isReadOnly) return;
    const newStep: ActionStep = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      chipId: chip.id,
      title: `${chip.icon} ${chip.label}`,
      notes: ''
    };
    setActionSteps(prev => [...prev, newStep]);
  };

  const handleAddCustomStep = () => {
    if (isReadOnly || !customStepTitle.trim()) return;
    const newStep: ActionStep = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      title: `⚡ ${customStepTitle.trim()}`,
      notes: ''
    };
    setActionSteps(prev => [...prev, newStep]);
    setCustomStepTitle('');
  };

  const handleRemoveStep = (stepId: string) => {
    if (isReadOnly) return;
    setActionSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const handleUpdateStepNotes = (stepId: string, notes: string) => {
    if (isReadOnly) return;
    setActionSteps(prev => prev.map(s => s.id === stepId ? { ...s, notes } : s));
  };

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = err => reject(err);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'BEFORE' | 'AFTER') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (type === 'BEFORE') setUploadingBefore(true);
      else setUploadingAfter(true);

      const compressedFile = await compressImage(file);
      const base64Str = await fileToBase64(compressedFile);

      if (type === 'BEFORE') setBeforePhotoUrl(base64Str);
      else setAfterPhotoUrl(base64Str);

      toast.success(`Foto ${type === 'BEFORE' ? 'Kondisi Awal' : 'Setelah Perbaikan'} berhasil diunggah.`);
    } catch (err: any) {
      toast.error('Gagal mengompresi foto.');
    } finally {
      if (type === 'BEFORE') setUploadingBefore(false);
      else setUploadingAfter(false);
    }

  };


  const handleAddPart = (inventoryId: string) => {
    if (isReadOnly || !inventoryId) return;
    if (usedParts.some(p => p.inventoryId === inventoryId)) {
      toast.error('Item part ini sudah ditambahkan.');
      return;
    }
    setUsedParts(prev => [...prev, { inventoryId, quantity: 1, notes: '' }]);
  };

  const handleRemovePart = (inventoryId: string) => {
    if (isReadOnly) return;
    setUsedParts(prev => prev.filter(p => p.inventoryId !== inventoryId));
  };

  const handleSaveDraft = async () => {
    try {
      const payload: Partial<ServiceReport> = {
        taskId: task.id,
        ticketId: task.ticketId || null,
        assetId: ticket?.assetId || null,
        diagnosa,
        actionSteps,
        beforePhotoUrl,
        afterPhotoUrl,
        usedParts,
        finalStatus,
        temporaryReason,
        followUpPlan,
        escalationTargetId,
        escalationReason,
        unrepairableReason,
        additionalNotes,
        systemDurationMinutes: calculatedDurationMinutes,
        technicianDurationNotes,
        isDraft: true
      };
      await saveServiceReportDraft(task.id, payload);
      toast.success('Draft Laporan Pekerjaan berhasil disimpan.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan draft.');
    }
  };

  const handleSubmitFinal = async () => {
    if (!diagnosa.trim()) {
      toast.error('Harap isi Diagnosa & Temuan Kerusakan terlebih dahulu.');
      return;
    }
    if (actionSteps.length === 0) {
      toast.error('Harap tambahkan minimal 1 Langkah Perbaikan.');
      return;
    }
    if (finalStatus === 'TEMPORARY_DONE' && (!temporaryReason.trim() || !followUpPlan.trim())) {
      toast.error('Harap isi alasan selesai sementara dan rencana tindak lanjut.');
      return;
    }
    if (finalStatus === 'ESCALATED' && (!escalationTargetId || !escalationReason.trim())) {
      toast.error('Harap pilih atasan penanggung jawab dan isi alasan eskalasi.');
      return;
    }
    if (finalStatus === 'UNREPAIRABLE' && !unrepairableReason.trim()) {
      toast.error('Harap isi penjelasan mengapa unit tidak dapat diperbaiki.');
      return;
    }

    try {
      const payload: Partial<ServiceReport> = {
        taskId: task.id,
        ticketId: task.ticketId || null,
        assetId: ticket?.assetId || null,
        diagnosa: diagnosa.trim(),
        actionSteps,
        beforePhotoUrl,
        afterPhotoUrl,
        usedParts,
        finalStatus,
        temporaryReason: temporaryReason.trim(),
        followUpPlan: followUpPlan.trim(),
        escalationTargetId,
        escalationReason: escalationReason.trim(),
        unrepairableReason: unrepairableReason.trim(),
        additionalNotes: additionalNotes.trim(),
        systemDurationMinutes: calculatedDurationMinutes,
        technicianDurationNotes: technicianDurationNotes.trim(),
        isDraft: false,
        submittedAt: new Date().toISOString(),
        submittedById: currentUser?.id || null
      };

      toast.info('Mengirim & memfinalisasi Laporan Pekerjaan...');
      await submitServiceReportFinal(task.id, payload);
      toast.success('Laporan Pekerjaan difinalisasi! Tugas telah diselesaikan.');
      setShowTaskModal(false);
    } catch (err: any) {

      toast.error(err.message || 'Gagal memfinalisasi laporan.');
    }
  };

  return (
    <div className="mt-6 border-t border-gray-800 pt-6 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-violet-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Laporan Pekerjaan Teknis (Service Report)
          </h3>
        </div>
        {isReadOnly ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <Lock size={12} /> Terkunci (Finalized)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Save size={12} /> {existingReport?.isDraft ? 'Draft Tersimpan' : 'Mode Pengisian'}
          </span>
        )}
      </div>

      {/* Auto-filled Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-gray-800 bg-[#161820] p-3 text-xs">
        <div>
          <span className="text-gray-500 block text-[10px] uppercase font-semibold">Pelapor & Departemen</span>
          <span className="text-gray-200 font-medium">{reporter?.name || 'User'} ({reporter?.department || 'IT'})</span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px] uppercase font-semibold">Tiket & Keluhan</span>
          <span className="text-gray-200 font-medium truncate block" title={ticket?.description}>
            #{ticket?.id.slice(0, 8).toUpperCase() || 'N/A'}: {ticket?.title || task.title}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px] uppercase font-semibold">Prioritas & SLA</span>
          <span className="text-gray-200 font-medium">{ticket?.priority || task.priority.toUpperCase()} | SLA: Normal</span>
        </div>
      </div>

      {/* Immutable Timer & Technician Duration Correction */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Clock size={14} className="text-violet-400" /> Auto-Timer Sistem (Immutable)
          </span>
          <span className="font-mono text-xs font-bold text-violet-300 bg-violet-950/60 px-3 py-1 rounded-lg border border-violet-800/40">
            ⏱️ {formatMinutes(calculatedDurationMinutes)}
          </span>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">
            Penjelasan / Catatan Koreksi Durasi (Opsional)
          </label>
          <input
            type="text"
            disabled={isReadOnly}
            placeholder="Misal: Durasi sistem 3 jam karena jeda pemadaman listrik 1.5 jam. Efektif kerja: 1.5 jam."
            value={technicianDurationNotes}
            onChange={e => setTechnicianDurationNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Diagnosa & Temuan */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
           Diagnosa & Temuan Kerusakan <span className="text-red-400">*</span>
        </label>
        <textarea
          disabled={isReadOnly}
          rows={2}
          placeholder="Uraikan penyebab kerusakan sebenarnya yang ditemukan di lapangan..."
          value={diagnosa}
          onChange={e => setDiagnosa(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800/60 p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500 disabled:opacity-60"
        />
      </div>

      {/* Quick Action Chips & Langkah Perbaikan */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
          🛠️ Langkah Perbaikan (Ketuk Chip Aksi Cepat) <span className="text-red-400">*</span>
        </label>

        {!isReadOnly && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {activeChips.map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleAddStepFromChip(chip)}
                  className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition active:scale-95"
                >
                  <span>{chip.icon}</span> {chip.label}
                </button>
              ))}
            </div>

            {/* Custom Step Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Ketikan langkah custom lainnya..."
                value={customStepTitle}
                onChange={e => setCustomStepTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCustomStep(); }}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomStep}
                className="rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-1.5 text-xs text-gray-200 font-medium"
              >
                + Tambah
              </button>
            </div>
          </div>
        )}

        {/* Selected Steps List */}
        <div className="space-y-2">
          {actionSteps.length === 0 ? (
            <p className="text-xs italic text-gray-500">Belum ada langkah perbaikan ditambahkan.</p>
          ) : (
            actionSteps.map((step, idx) => (
              <div key={step.id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300">
                    {idx + 1}. {step.title}
                  </span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(step.id)}
                      className="text-gray-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={isReadOnly}
                  placeholder="Catatan tambahan untuk langkah ini (opsional)..."
                  value={step.notes || ''}
                  onChange={e => handleUpdateStepNotes(step.id, e.target.value)}
                  className="w-full rounded border border-gray-800 bg-gray-950 px-2.5 py-1 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-gray-700 disabled:opacity-60"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Foto Before & After */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 space-y-2">
          <span className="block text-xs font-semibold text-gray-400">📸 Foto Kondisi Awal (Before)</span>
          {beforePhotoUrl ? (
            <div className="relative group">
              <img src={beforePhotoUrl} alt="Before" className="h-32 w-full object-cover rounded-lg border border-gray-800" />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setBeforePhotoUrl(null)}
                  className="absolute top-2 right-2 bg-red-600/80 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ) : (
            <label className={cn("flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-gray-700 bg-gray-800/30 transition", !isReadOnly && "cursor-pointer hover:border-violet-500")}>
              <Camera size={20} className="text-gray-500 mb-1" />
              <span className="text-[11px] text-gray-400">{uploadingBefore ? 'Mengompresi...' : 'Unggah Foto Sebelum'}</span>
              <input type="file" accept="image/*" disabled={isReadOnly} onChange={e => handlePhotoUpload(e, 'BEFORE')} className="hidden" />
            </label>
          )}
        </div>

        {/* After */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 space-y-2">
          <span className="block text-xs font-semibold text-gray-400">📸 Foto Setelah Perbaikan (After)</span>
          {afterPhotoUrl ? (
            <div className="relative group">
              <img src={afterPhotoUrl} alt="After" className="h-32 w-full object-cover rounded-lg border border-gray-800" />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setAfterPhotoUrl(null)}
                  className="absolute top-2 right-2 bg-red-600/80 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ) : (
            <label className={cn("flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-gray-700 bg-gray-800/30 transition", !isReadOnly && "cursor-pointer hover:border-violet-500")}>
              <Camera size={20} className="text-gray-500 mb-1" />
              <span className="text-[11px] text-gray-400">{uploadingAfter ? 'Mengompresi...' : 'Unggah Foto Sesudah'}</span>
              <input type="file" accept="image/*" disabled={isReadOnly} onChange={e => handlePhotoUpload(e, 'AFTER')} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Spare Part Digunakan */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
          📦 Spare Part / Component Digunakan
        </label>
        {!isReadOnly && (
          <div className="w-full">
            <SearchableDropdown
              options={(inventories || []).map(inv => ({
                value: inv.id,
                label: inv.name,
                sublabel: `SKU: ${inv.sku} | Stok: ${inv.quantity} ${inv.unit}`
              }))}
              value=""
              onChange={val => { if (val) handleAddPart(val); }}
              placeholder="+ Pilih Spare Part dari Inventory..."
              searchPlaceholder="Cari nama atau SKU part..."
              emptyLabel="+ Pilih Spare Part..."
            />
          </div>
        )}

        <div className="space-y-2">
          {usedParts.map(part => {
            const inv = (inventories || []).find(i => i.id === part.inventoryId);
            return (
              <div key={part.inventoryId} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-2.5">
                <div>
                  <span className="text-xs font-semibold text-gray-200">{inv?.name || 'Part'}</span>
                  <span className="text-[10px] text-gray-500 block">SKU: {inv?.sku || '-'} | Stok Saat Ini: {inv?.quantity || 0}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-400">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      disabled={isReadOnly}
                      value={part.quantity}
                      onChange={e => {
                        const qty = Math.max(1, parseInt(e.target.value) || 1);
                        setUsedParts(prev => prev.map(p => p.inventoryId === part.inventoryId ? { ...p, quantity: qty } : p));
                      }}
                      className="w-14 rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-white text-center outline-none disabled:opacity-60"
                    />
                  </div>
                  {!isReadOnly && (
                    <button type="button" onClick={() => handleRemovePart(part.inventoryId)} className="text-gray-500 hover:text-red-400 p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hasil Akhir & Auto Follow-Up Config */}
      <div className="space-y-3 rounded-xl border border-gray-800 bg-[#161820] p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-200">
          🎯 Status Hasil Akhir Pekerjaan <span className="text-red-400">*</span>
        </label>

        <select
          disabled={isReadOnly}
          value={finalStatus}
          onChange={e => setFinalStatus(e.target.value as ServiceReportFinalStatus)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-violet-500 disabled:opacity-60"
        >
          <option value="COMPLETED_NORMAL">✅ Selesai — Berfungsi Normal</option>
          <option value="TEMPORARY_DONE">⚠️ Selesai Sementara (Perlu Task Follow-Up)</option>
          <option value="NEED_PART">🔄 Perlu Part / Purchase Request Order</option>
          <option value="ESCALATED">⬆️ Eskalasi ke Manager / Atasan</option>
          <option value="UNREPAIRABLE">❌ Tidak Bisa Diperbaiki (Afkir / Write-Off)</option>
        </select>

        {/* Dynamic fields based on finalStatus */}
        {finalStatus === 'TEMPORARY_DONE' && (
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div>
              <label className="block text-[11px] font-semibold text-amber-400 mb-1">Alasan Selesai Sementara *</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Misal: Printer berfungsi tapi warna pudar, menunggu toner replacement..."
                value={temporaryReason}
                onChange={e => setTemporaryReason(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-amber-400 mb-1">Rencana Tindak Lanjut (Auto-Create Follow-Up Task) *</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Deskripsi tugas lanjutan yang akan dikerjakan berikutnya..."
                value={followUpPlan}
                onChange={e => setFollowUpPlan(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>
        )}

        {finalStatus === 'ESCALATED' && (
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div>
              <label className="block text-[11px] font-semibold text-red-400 mb-1">Eskalasi Kepada (Manager/Atasan) *</label>
              <select
                disabled={isReadOnly}
                value={escalationTargetId}
                onChange={e => setEscalationTargetId(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none"
              >
                <option value="">-- Pilih Atasan --</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-red-400 mb-1">Alasan & Detail Eskalasi *</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                placeholder="Jelaskan kendala teknis/keputusan yang membutuhkan arahan atasan..."
                value={escalationReason}
                onChange={e => setEscalationReason(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>
        )}

        {finalStatus === 'UNREPAIRABLE' && (
          <div className="pt-2 border-t border-gray-800">
            <label className="block text-[11px] font-semibold text-red-400 mb-1">Alasan Unit Tidak Bisa Diperbaiki *</label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              placeholder="Uraikan kerusakan fatal yang menyebabkan unit harus diafkir/diganti baru..."
              value={unrepairableReason}
              onChange={e => setUnrepairableReason(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-xs text-white placeholder-gray-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Catatan Tambahan (Free-Text) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          📝 Catatan Tambahan / Rekomendasi Bebas (Opsional)
        </label>
        <textarea
          rows={2}
          disabled={isReadOnly}
          placeholder="Catatan rekomendasi pencegahan atau informasi pendukung lainnya..."
          value={additionalNotes}
          onChange={e => setAdditionalNotes(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800/60 p-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500 disabled:opacity-60"
        />
      </div>

      {/* Bottom Action Buttons */}
      {!isReadOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300 transition"
          >
            <Save size={14} /> Simpan Draft
          </button>
          <button
            type="button"
            onClick={handleSubmitFinal}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-semibold text-white transition shadow-lg shadow-violet-500/20 active:scale-95"
          >
            <Send size={14} /> Selesaikan & Finalisasi Laporan
          </button>
        </div>
      )}
    </div>
  );
}
