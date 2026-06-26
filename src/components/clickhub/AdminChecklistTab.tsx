import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Trash2, Edit2, ClipboardList, Check, AlertTriangle } from 'lucide-react';
import type { TicketPriority, ChecklistTemplate, ChecklistTemplateItem } from '../../types';
import { toast } from 'sonner';

interface EditItemForm {
  id?: string;
  question: string;
  category: string;
  priorityOnFailure: TicketPriority;
  order: number;
}

export default function AdminChecklistTab() {
  const { checklistTemplates, addChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<EditItemForm[]>([
    { question: '', category: 'General', priorityOnFailure: 'MEDIUM', order: 0 }
  ]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setItems([{ question: '', category: 'General', priorityOnFailure: 'MEDIUM', order: 0 }]);
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleStartEdit = (tpl: ChecklistTemplate) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setDescription(tpl.description || '');
    if (tpl.items && tpl.items.length > 0) {
      setItems(tpl.items.map(item => ({
        id: item.id,
        question: item.question,
        category: item.category,
        priorityOnFailure: item.priorityOnFailure,
        order: item.order
      })));
    } else {
      setItems([{ question: '', category: 'General', priorityOnFailure: 'MEDIUM', order: 0 }]);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { question: '', category: 'General', priorityOnFailure: 'MEDIUM', order: items.length }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error('Template minimal harus memiliki satu item checklist.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemFieldChange = (index: number, field: keyof EditItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama template tidak boleh kosong.');
      return;
    }

    const invalidItem = items.some(item => !item.question.trim());
    if (invalidItem) {
      toast.error('Pertanyaan checklist tidak boleh kosong.');
      return;
    }

    const payloadItems = items.map((it, idx) => ({
      question: it.question.trim(),
      category: it.category.trim() || 'General',
      priorityOnFailure: it.priorityOnFailure,
      order: idx
    }));

    if (editingTemplate) {
      toast.info('Memperbarui template checklist...');
      await updateChecklistTemplate(editingTemplate.id, {
        name: name.trim(),
        description: description.trim(),
        items: payloadItems
      });
      toast.success('Template checklist berhasil diperbarui!');
    } else {
      toast.info('Membuat template checklist...');
      await addChecklistTemplate(name.trim(), description.trim(), payloadItems);
      toast.success('Template checklist berhasil dibuat!');
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Mas Bos yakin ingin menghapus template checklist ini?')) {
      toast.info('Menghapus template...');
      await deleteChecklistTemplate(id);
      toast.success('Template checklist berhasil dihapus.');
    }
  };

  if (isCreating || editingTemplate) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#282c34] p-6">
        <h3 className="mb-4 text-base font-bold text-white flex items-center gap-2">
          <ClipboardList className="text-violet-400" size={18} />
          {editingTemplate ? 'Edit Template Checklist' : 'Buat Template Checklist Baru'}
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-400">Nama Template</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Inspeksi Genset Harian"
                className="w-full rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-400">Deskripsi</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Contoh: Checklist pengecekan rutin genset di area ruang panel"
                className="w-full rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <div className="mb-3 flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Daftar Item Checklist</h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-violet-400 transition"
              >
                <Plus size={12} /> Tambah Item
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-gray-800/20 p-2.5 rounded-lg border border-gray-800">
                  <span className="text-xs text-gray-500 font-bold w-6">{idx + 1}.</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={item.question}
                      onChange={e => handleItemFieldChange(idx, 'question', e.target.value)}
                      placeholder="Masukkan pertanyaan inspeksi..."
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="w-40">
                    <input
                      type="text"
                      required
                      value={item.category}
                      onChange={e => handleItemFieldChange(idx, 'category', e.target.value)}
                      placeholder="Kategori tiket (e.g. Listrik)"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="w-36">
                    <select
                      value={item.priorityOnFailure}
                      onChange={e => handleItemFieldChange(idx, 'priorityOnFailure', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/40 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-500"
                    >
                      <option value="LOW">Low priority</option>
                      <option value="MEDIUM">Medium priority</option>
                      <option value="HIGH">High priority</option>
                      <option value="CRITICAL">Critical priority</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-violet-500/20"
            >
              <Check size={14} /> {editingTemplate ? 'Simpan Perubahan' : 'Buat Template'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white">Checklist Templates</h3>
          <p className="text-xs text-gray-500">Kelola master template inspeksi harian/inspeksi rutin klikhub</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition shadow-lg shadow-violet-500/20"
        >
          <Plus size={14} /> Buat Template Baru
        </button>
      </div>

      {checklistTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-[#282c34] p-12 text-center">
          <ClipboardList size={36} className="text-gray-600 mb-2" />
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Belum Ada Template Checklist</h4>
          <p className="max-w-xs text-xs text-gray-500 mt-1">Buat template checklist inspeksi harian untuk dilampirkan ke tugas-tugas lapangan teknisi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {checklistTemplates.map(tpl => (
            <div key={tpl.id} className="group relative flex flex-col justify-between rounded-xl border border-gray-800 bg-[#282c34]/50 p-4 hover:border-gray-700 transition">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ClipboardList size={16} className="text-violet-400" />
                  {tpl.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{tpl.description || 'Tidak ada deskripsi'}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium text-violet-400 border border-violet-500/20">
                    {tpl.items?.length || 0} Item Checklist
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-gray-800/50 pt-3">
                <button
                  onClick={() => handleStartEdit(tpl)}
                  className="flex items-center gap-1 rounded-lg bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 text-xs text-gray-300 transition"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="flex items-center gap-1 rounded-lg bg-red-950/20 hover:bg-red-950/40 px-2.5 py-1.5 text-xs text-red-400 border border-red-900/30 transition"
                >
                  <Trash2 size={12} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
