import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Plus, Search, Edit2, Trash2, Globe, Lock } from 'lucide-react';
import type { Article } from '../../types';

const categories = ['All', 'Network', 'Hardware', 'Software', 'Server', 'Security', 'Policy', 'General'];

import PageHelp from '../layout/PageHelpModal';

export default function KnowledgeBasePage() {
  const { articles, addArticle, updateArticle, deleteArticle, getUserById, hasRole } = useStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selected, setSelected] = useState<Article | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', isPublic: true });

  const canManage = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']);

  const filtered = articles.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory !== 'All' && a.category !== activeCategory) return false;
    if (!canManage && !a.isPublic) return false; // Filter out private internal articles for Employees
    return true;
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    addArticle({ title: form.title.trim(), content: form.content, category: form.category, isPublic: form.isPublic });
    setForm({ title: '', content: '', category: 'General', isPublic: true });
    setShowCreate(false);
  };

  const handleUpdate = () => {
    if (!editingId || !form.title.trim()) return;
    updateArticle(editingId, { title: form.title.trim(), content: form.content, category: form.category, isPublic: form.isPublic });
    setEditingId(null);
    const updated = articles.find(a => a.id === editingId);
    if (updated) setSelected({ ...updated, ...form });
  };

  const startEdit = (article: Article) => {
    setForm({ title: article.title, content: article.content, category: article.category, isPublic: article.isPublic });
    setEditingId(article.id);
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h2 key={i} className="mb-3 text-lg font-bold text-white">{line.slice(2)}</h2>;
      if (line.startsWith('## ')) return <h3 key={i} className="mb-2 text-sm font-semibold text-white">{line.slice(3)}</h3>;
      if (line.startsWith('- [ ] ')) return <p key={i} className="text-sm text-gray-400">☐ {line.slice(6)}</p>;
      if (line.startsWith('- [x] ')) return <p key={i} className="text-sm text-green-400">✓ {line.slice(6)}</p>;
      if (line.startsWith('- ')) return <p key={i} className="text-sm text-gray-400">• {line.slice(2)}</p>;
      if (line.match(/^\d+\. /)) return <p key={i} className="text-sm text-gray-400">{line}</p>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-sm text-gray-400">{line}</p>;
    });
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-[#1a1d23] flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-1">
            📖 Knowledge Base
            <PageHelp pageKey="knowledge" />
          </h2>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
              className="w-full rounded-md border border-gray-700 bg-gray-800/50 py-2 pl-8 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500" />
          </div>
          <div className="flex flex-wrap gap-1">
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={cn("rounded-full px-2.5 py-1 text-[10px]", activeCategory === c ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white")}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map(article => {
            const author = getUserById(article.authorId);
            return (
              <button key={article.id} onClick={() => { setSelected(article); setEditingId(null); }}
                className={cn("w-full rounded-lg p-3 text-left mb-1 transition",
                  selected?.id === article.id ? "bg-violet-600/15 border border-violet-500/30" : "hover:bg-gray-800/50"
                )}>
                <div className="flex items-center gap-2 mb-1">
                  {article.isPublic ? <Globe size={10} className="text-green-400" /> : <Lock size={10} className="text-gray-500" />}
                  <span className="rounded-full bg-gray-700/50 px-1.5 py-0.5 text-[8px] text-gray-400">{article.category}</span>
                </div>
                <p className="text-sm font-medium text-white truncate">{article.title}</p>
                <p className="text-[10px] text-gray-600 mt-1">By {author?.name} • {new Date(article.updatedAt).toLocaleDateString()}</p>
              </button>
            );
          })}
        </div>
        {canManage && (
          <div className="p-3 border-t border-gray-800">
            <button onClick={() => { setShowCreate(true); setForm({ title: '', content: '', category: 'General', isPublic: true }); }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500">
              <Plus size={12} /> New Article
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {!selected && !showCreate ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">📖</p>
              <p className="text-lg font-semibold text-white">Select an article</p>
              <p className="text-sm text-gray-500">Choose from the sidebar or create a new one</p>
            </div>
          </div>
        ) : showCreate ? (
          <div className="max-w-2xl">
            <h2 className="mb-4 text-lg font-bold text-white">New Article</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Article title..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <div className="flex gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} /> Public
                </label>
              </div>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write article content (Markdown supported)..." rows={15}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 font-mono" />
              <div className="flex gap-3">
                <button onClick={handleCreate} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Publish</button>
                <button onClick={() => setShowCreate(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              </div>
            </div>
          </div>
        ) : selected && editingId ? (
          <div className="max-w-2xl">
            <h2 className="mb-4 text-lg font-bold text-white">Edit Article</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500" />
              <div className="flex gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} /> Public
                </label>
              </div>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={15}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-mono" />
              <div className="flex gap-3">
                <button onClick={handleUpdate} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Save</button>
                <button onClick={() => setEditingId(null)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              </div>
            </div>
          </div>
        ) : selected ? (
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="rounded-full bg-gray-700/50 px-2.5 py-1 text-xs text-gray-400">{selected.category}</span>
              {selected.isPublic ? <Globe size={12} className="text-green-400" /> : <Lock size={12} className="text-gray-500" />}
              {canManage && (
                <div className="ml-auto flex gap-2">
                  <button onClick={() => startEdit(selected)} className="rounded-lg p-1.5 text-gray-500 hover:text-white"><Edit2 size={14} /></button>
                  <button onClick={() => { deleteArticle(selected.id); setSelected(null); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">{selected.title}</h1>
            <p className="mb-6 text-xs text-gray-500">By {getUserById(selected.authorId)?.name} • Last updated {new Date(selected.updatedAt).toLocaleDateString()}</p>
            <div className="prose prose-invert max-w-none">
              {renderContent(selected.content)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
