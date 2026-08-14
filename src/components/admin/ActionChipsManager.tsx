import { useState } from 'react';

import { useStore } from '../../store/useStore';
import { Plus, Eye, EyeOff, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function ActionChipsManager() {
  const { actionChips, addActionChip, updateActionChip, deleteActionChip, toggleHideActionChip, currentUser } = useStore();
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('🔧');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const isAdmin = currentUser && ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role);

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
        <ShieldAlert size={16} /> Akses ditolak. Hanya Admin/Manager yang dapat mengelola Aksi Pekerjaan.
      </div>
    );
  }

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast.error('Harap masukkan nama label chip.');
      return;
    }
    try {
      await addActionChip(newLabel.trim(), newIcon.trim() || '🔧');
      setNewLabel('');
      setNewIcon('🔧');
      toast.success(`Chip aksi "${newLabel.trim()}" berhasil ditambahkan.`);
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambahkan chip aksi.');
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    try {
      await updateActionChip(id, { label: editLabel.trim(), icon: editIcon.trim() || '🔧' });
      setEditingId(null);
      toast.success('Chip aksi berhasil diperbarui.');
    } catch (e: any) {
      toast.error(e.message || 'Gagal memperbarui chip aksi.');
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (window.confirm(`Hapus chip aksi custom "${label}"?`)) {
      try {
        await deleteActionChip(id);
        toast.success(`Chip "${label}" berhasil dihapus.`);
      } catch (e: any) {
        toast.error(e.message || 'Gagal menghapus chip.');
      }
    }
  };

  const standardChips = (actionChips || []).filter(c => c.isStandard);
  const customChips = (actionChips || []).filter(c => !c.isStandard);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-white">Manajemen Chip Aksi Pekerjaan Teknis</h3>
        <p className="text-xs text-gray-400 mt-1">
          Chip aksi memudahkan teknisi mengetuk (*tap*) langkah kerja yang dilakukan saat membuat Laporan Pekerjaan.
        </p>
      </div>

      {/* Form Add Custom Chip */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase text-violet-400">➕ Tambah Chip Aksi Custom Baru</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Emoji (misal: ⚡)"
            value={newIcon}
            onChange={e => setNewIcon(e.target.value)}
            className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white text-center outline-none focus:border-violet-500"
          />
          <input
            type="text"
            placeholder="Label Aksi (misal: Flash Firmware)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-semibold text-white transition"
          >
            <Plus size={14} /> Tambah Chip
          </button>
        </div>
      </div>

      {/* Standard Chips List */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-gray-400">🔒 Chip Standar Bawaan Sistem ({standardChips.length})</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {standardChips.map(chip => (
            <div key={chip.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-2.5">
              <span className={`text-xs font-medium ${chip.isHidden ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                {chip.icon} {chip.label}
              </span>
              <button
                onClick={() => toggleHideActionChip(chip.id)}
                title={chip.isHidden ? "Tampilkan di Form Laporan" : "Sembunyikan dari Form Laporan"}
                className={`rounded p-1 transition ${chip.isHidden ? 'text-gray-600 hover:text-green-400' : 'text-gray-400 hover:text-amber-400'}`}
              >
                {chip.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Chips List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase text-gray-400">✨ Chip Custom Ditambahkan Admin ({customChips.length})</h4>
        {customChips.length === 0 ? (
          <p className="text-xs italic text-gray-500">Belum ada chip custom tambahan.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {customChips.map(chip => (
              <div key={chip.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 p-2.5">
                {editingId === chip.id ? (
                  <div className="flex items-center gap-1.5 flex-1 mr-2">
                    <input
                      type="text"
                      value={editIcon}
                      onChange={e => setEditIcon(e.target.value)}
                      className="w-12 rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-xs text-white text-center"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-white"
                    />
                    <button onClick={() => handleSaveEdit(chip.id)} className="text-green-400 hover:text-green-300 p-1"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 p-1"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className={`text-xs font-medium ${chip.isHidden ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                      {chip.icon} {chip.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleHideActionChip(chip.id)}
                        className={`rounded p-1 ${chip.isHidden ? 'text-gray-600 hover:text-green-400' : 'text-gray-400 hover:text-amber-400'}`}
                      >
                        {chip.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => { setEditingId(chip.id); setEditLabel(chip.label); setEditIcon(chip.icon); }}
                        className="rounded p-1 text-gray-400 hover:text-violet-400"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(chip.id, chip.label)}
                        className="rounded p-1 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
