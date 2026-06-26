import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import {
  Home, Inbox, CheckSquare, BarChart3, ChevronDown, ChevronRight,
  Plus, LogOut, TicketCheck, Monitor, BookOpen, Shield,
  Sun, Moon, PanelLeftClose, PanelLeftOpen, Trash2, List, Settings,
  MessageSquare, FileText, Sparkles, X
} from 'lucide-react';

export default function Sidebar() {
  const {
    activePage, setActivePage, spaces, tasks, tickets, assets, chatSessions,
    currentUser, sidebarCollapsed, toggleSidebar,
    addSpace, addList, selectSpace, selectList, deleteSpace, deleteList,
    getSpaceLists, getUnreadNotificationCount, hasRole,
    theme, toggleTheme, logout, selectedSpaceId, selectedListId, setShowSettingsModal,
  } = useStore();

  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({ 'space-1': true });
  const [showNewSpace, setShowNewSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [showNewList, setShowNewList] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ type: 'space' | 'list'; id: string; x: number; y: number } | null>(null);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showIconGlossary, setShowIconGlossary] = useState(false);

  if (!currentUser) return null;

  const myTasksCount = tasks.filter(t => t.assigneeIds.includes(currentUser.id) && t.status !== 'done').length;
  const unreadCount = getUnreadNotificationCount();
  const openTickets = tickets.filter(t => t.assigneeId === currentUser.id && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
  const isAdmin = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']);
  const isHandler = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']);
  const canDeleteSpaceList = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']);
  const openChats = chatSessions.filter(s => s.status === 'OPEN').length;

  const isEmployee = currentUser.role === 'EMPLOYEE';

  const navItems = [
    { key: 'home' as const, icon: <Home size={16} />, label: 'Home', badge: null },
    { key: 'inbox' as const, icon: <Inbox size={16} />, label: 'Inbox', badge: unreadCount > 0 ? unreadCount : null },
    { key: 'my_tasks' as const, icon: <CheckSquare size={16} />, label: 'My Tasks', badge: myTasksCount },
    ...(!isEmployee ? [{ key: 'dashboards' as const, icon: <BarChart3 size={16} />, label: 'Dashboards', badge: null }] : []),
  ];

  const itItems = [
    { key: 'tickets' as const, icon: <TicketCheck size={16} />, label: 'Tickets', badge: openTickets },
    ...(!isEmployee ? [{ key: 'assets' as const, icon: <Monitor size={16} />, label: 'Assets', badge: assets.length }] : []),
    { key: 'knowledge' as const, icon: <BookOpen size={16} />, label: 'Knowledge', badge: null },
    ...(isHandler ? [
      { key: 'chat_admin' as const, icon: <MessageSquare size={16} />, label: 'Chat Admin', badge: openChats > 0 ? openChats : null },
      { key: 'reports' as const, icon: <FileText size={16} />, label: 'Reports', badge: null },
    ] : []),
  ];

  const handleContextMenu = (e: React.MouseEvent, type: 'space' | 'list', id: string) => {
    e.preventDefault();
    if (!canDeleteSpaceList) return; // Prevent opening context menu if user is not authorized
    setContextMenu({ type, id, x: e.clientX, y: e.clientY });
  };

  if (sidebarCollapsed) {
    return (
      <div className="flex h-full w-14 flex-col items-center border-r border-[var(--c-border)] bg-[var(--bg-sidebar)] py-3">
        <button onClick={toggleSidebar} className="mb-4 text-gray-500 hover:text-white"><PanelLeftOpen size={16} /></button>
        <div className="flex flex-col gap-1">
          {[...navItems, ...itItems].map(item => {
            const tooltipTexts: Record<string, { desc: string }> = {
              home: { desc: 'Beranda dashboard utama' },
              inbox: { desc: 'Kotak masuk notifikasi sistem' },
              my_tasks: { desc: 'Daftar tugas & checklist inspeksi' },
              dashboards: { desc: 'Statistik & performa grafik' },
              tickets: { desc: 'Laporan gangguan & tiket IT' },
              assets: { desc: 'Registri inventaris & jadwal PM' },
              knowledge: { desc: 'Solusi teknis & SOP IT' },
              chat_admin: { desc: 'IT live support chat' },
              reports: { desc: 'Depresiasi, CAPEX, & Leaderboard' }
            };
            return (
              <button key={item.key} onClick={() => setActivePage(item.key)} id={`tour-nav-${item.key}`}
                className={cn("group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  activePage === item.key ? "bg-violet-600/20 text-violet-400" : "text-gray-500 hover:bg-gray-800 hover:text-white"
                )}>
                {item.icon}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 text-[8px] text-white">{item.badge}</span>
                )}
                {/* CSS Tooltip */}
                <div className="absolute left-12 z-50 ml-1 scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-150 rounded-xl border border-gray-800 bg-gray-950/95 px-3.5 py-2.5 shadow-2xl pointer-events-none whitespace-nowrap font-sans text-left">
                  <p className="font-extrabold text-white text-[11px] mb-0.5">{item.label}</p>
                  <p className="text-gray-500 font-medium text-[9px] max-w-[180px] break-words whitespace-normal leading-tight">
                    {tooltipTexts[item.key]?.desc || ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {!isEmployee && (
          <div className="mt-auto flex flex-col gap-1">
            {spaces.map(space => (
              <button key={space.id} onClick={() => selectSpace(space.id)}
                className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-sm",
                  selectedSpaceId === space.id && activePage === 'spaces' ? "bg-gray-800" : "hover:bg-gray-800"
                )}>
                {space.icon}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-col gap-1">
          {isAdmin && <button onClick={() => setActivePage('admin')} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-white", activePage === 'admin' && "text-violet-400")}><Shield size={16} /></button>}
          <button onClick={() => setShowSettingsModal(true)} id="tour-nav-settings" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-white" title="Settings"><Settings size={16} /></button>
          <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-white" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          
          <div className="relative">
            <button
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              id="tour-help-btn-collapsed"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer",
                showHelpMenu
                  ? "bg-violet-650/20 text-violet-400 font-bold"
                  : "text-gray-500 hover:bg-gray-800 hover:text-white"
              )}
              title="Pusat Bantuan & Panduan"
            >
              ?
            </button>
            
            {showHelpMenu && (
              <div className="absolute left-12 bottom-0 z-50 ml-1 w-60 rounded-xl border border-gray-850 bg-[#1e2028]/95 backdrop-blur-xl p-3.5 shadow-2xl animate-slide-up text-gray-200">
                <div className="border-b border-gray-800 pb-2 mb-2">
                  <p className="font-extrabold text-[10px] text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={11} className="text-violet-400 animate-pulse" />
                    Pusat Bantuan ClickHub
                  </p>
                  <p className="text-[9px] text-gray-500">Panduan & Kamus Ikon Menu</p>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowHelpMenu(false);
                      window.dispatchEvent(new CustomEvent('start-clickhub-tour'));
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                  >
                    🚀 Mulai Tur Panduan Aplikasi
                  </button>
                  <button
                    onClick={() => {
                      setShowHelpMenu(false);
                      setShowIconGlossary(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                  >
                    📖 Kamus Fitur & Ikon Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-60 flex-col border-r border-[var(--c-border)] bg-[var(--bg-sidebar)]">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-[var(--c-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">C</div>
          <div>
            <span className="text-sm font-bold text-white">ClickHub</span>
            <p className="text-[9px] text-gray-500">IT Operations Platform</p>
          </div>
        </div>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-white"><PanelLeftClose size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {/* Quick Links */}
        <div className="mb-4 space-y-0.5">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActivePage(item.key)} id={`tour-nav-${item.key}`}
              className={cn("group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                activePage === item.key ? "bg-violet-600/15 text-violet-400" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-gray-700/60 px-1.5 py-0.5 text-[10px]">{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* IT Operations */}
        <div className="mb-4 border-t border-[var(--c-border)] pt-3">
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">IT Operations</p>
          {itItems.map(item => (
            <button key={item.key} onClick={() => setActivePage(item.key)} id={`tour-nav-${item.key}`}
              className={cn("group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                activePage === item.key ? "bg-violet-600/15 text-violet-400" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-gray-700/60 px-1.5 py-0.5 text-[10px]">{item.badge}</span>
              )}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => setActivePage('admin')} id="tour-nav-admin"
              className={cn("group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                activePage === 'admin' ? "bg-violet-600/15 text-violet-400" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}>
              <Shield size={16} /><span className="flex-1">Admin</span>
            </button>
          )}
        </div>

        {!isEmployee && (
          <div className="border-t border-[var(--c-border)] pt-3">
            {/* Spaces */}
            <div className="mb-1.5 flex items-center justify-between px-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Spaces</p>
              <button onClick={() => setShowNewSpace(true)} className="text-gray-600 hover:text-white"><Plus size={12} /></button>
            </div>

            {showNewSpace && (
              <div className="mb-2 px-2.5">
                <input autoFocus value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSpaceName.trim()) { addSpace(newSpaceName.trim(), '#6366F1', '📁'); setNewSpaceName(''); setShowNewSpace(false); }
                    if (e.key === 'Escape') { setShowNewSpace(false); setNewSpaceName(''); }
                  }}
                  placeholder="Space name..."
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-2.5 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              </div>
            )}

            {spaces.map(space => (
              <div key={space.id}>
                <button
                  onClick={() => { setExpandedSpaces(p => ({ ...p, [space.id]: !p[space.id] })); selectSpace(space.id); }}
                  onContextMenu={e => handleContextMenu(e, 'space', space.id)}
                  className={cn("group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                    selectedSpaceId === space.id && activePage === 'spaces' ? "bg-gray-800/50 text-white" : "text-gray-400 hover:bg-gray-800/30 hover:text-white"
                  )}>
                  {expandedSpaces[space.id] ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                  <span className="text-sm">{space.icon}</span>
                  <span className="flex-1 truncate">{space.name}</span>
                  <button onClick={e => { e.stopPropagation(); setShowNewList(space.id); }} className="hidden group-hover:block text-gray-600 hover:text-white"><Plus size={12} /></button>
                </button>

                {expandedSpaces[space.id] && (
                  <div className="ml-5 space-y-0.5 py-0.5">
                    {getSpaceLists(space.id).map(list => (
                      <button key={list.id}
                        onClick={() => { selectSpace(space.id); selectList(list.id); }}
                        onContextMenu={e => handleContextMenu(e, 'list', list.id)}
                        className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-left text-xs transition-colors",
                          selectedListId === list.id ? "bg-gray-800/50 text-white" : "text-gray-500 hover:bg-gray-800/30 hover:text-gray-300"
                        )}>
                        <List size={11} style={{ color: list.color }} />
                        <span className="truncate">{list.name}</span>
                      </button>
                    ))}
                    {showNewList === space.id ? (
                      <input autoFocus value={newListName} onChange={e => setNewListName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newListName.trim()) { addList(newListName.trim(), space.id, '#6366F1'); setNewListName(''); setShowNewList(null); }
                          if (e.key === 'Escape') { setShowNewList(null); setNewListName(''); }
                        }}
                        placeholder="List name..."
                        className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500" />
                    ) : (
                      <button onClick={() => setShowNewList(space.id)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-xs text-gray-600 hover:text-gray-400">
                        <Plus size={10} /> New List
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="border-t border-[var(--c-border)] px-2.5 py-1.5">
        <button onClick={() => setShowSettingsModal(true)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white">
          <Settings size={14} />
          Settings
        </button>
      </div>

      {/* Theme Toggle & Help */}
      <div className="border-t border-[var(--c-border)] px-2.5 py-1.5 flex gap-1.5">
        <button onClick={toggleTheme} className="flex-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white transition duration-150">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        <div className="relative">
          <button
            onClick={() => setShowHelpMenu(!showHelpMenu)}
            id="tour-help-btn"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-black transition-all active:scale-95 cursor-pointer",
              showHelpMenu
                ? "border-violet-500 bg-violet-650/10 text-violet-400"
                : "border-gray-850 bg-gray-900/30 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-750"
            )}
            title="Pusat Bantuan & Panduan"
          >
            ?
          </button>
          
          {showHelpMenu && (
            <div className="absolute left-full bottom-0 z-50 ml-2 w-60 rounded-xl border border-gray-850 bg-[#1e2028]/95 backdrop-blur-xl p-3.5 shadow-2xl animate-slide-up text-gray-200">
              <div className="border-b border-gray-800 pb-2 mb-2">
                <p className="font-extrabold text-[10px] text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={11} className="text-violet-400 animate-pulse" />
                  Pusat Bantuan ClickHub
                </p>
                <p className="text-[9px] text-gray-500">Panduan & Kamus Ikon Menu</p>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowHelpMenu(false);
                    window.dispatchEvent(new CustomEvent('start-clickhub-tour'));
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                >
                  🚀 Mulai Tur Panduan Aplikasi
                </button>
                <button
                  onClick={() => {
                    setShowHelpMenu(false);
                    setShowIconGlossary(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                >
                  📖 Kamus Fitur & Ikon Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-[var(--c-border)] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: currentUser.color }}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{currentUser.name}</p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="truncate text-[10px] text-gray-500">{currentUser.role} • {currentUser.department}</span>
              <span 
                onClick={() => setShowSettingsModal(true, 'changelog')}
                title="View Release Changelog"
                className="text-[9px] text-gray-500 hover:text-violet-400 cursor-pointer font-mono tracking-wider shrink-0 ml-1 hover:underline transition-colors"
              >
                v1.4.2
              </span>
            </div>
          </div>
          <button onClick={logout} className="text-gray-600 hover:text-red-400" title="Logout"><LogOut size={14} /></button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div className="fixed z-50 rounded-lg border border-gray-700 bg-[#282c34] py-1 shadow-lg" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button onClick={() => {
              if (contextMenu.type === 'space') {
                const space = spaces.find(s => s.id === contextMenu.id);
                const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus Space "${space ? space.name : 'ini'}"? Menghapus Space akan menghapus semua list dan task di dalamnya secara permanen.`);
                if (confirmed) deleteSpace(contextMenu.id);
              } else {
                const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus List ini beserta seluruh task di dalamnya secara permanen?`);
                if (confirmed) deleteList(contextMenu.id);
              }
              setContextMenu(null);
            }}
              className="flex w-full items-center gap-2 px-4 py-1.5 text-xs text-red-400 hover:bg-gray-700/50">
              <Trash2 size={12} /> Delete {contextMenu.type}
            </button>
          </div>
        </>
      )}

      {/* Icon Glossary Modal */}
      {showIconGlossary && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowIconGlossary(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-[#1e2028] p-6 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BookOpen className="text-violet-500" size={18} />
                Kamus Fitur & Ikon Menu ClickHub
              </h3>
              <button onClick={() => setShowIconGlossary(false)} className="text-gray-500 hover:text-white rounded-lg p-1 hover:bg-gray-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2.5 no-scrollbar">
              {[
                { key: 'home', icon: '🏠', name: 'Home', desc: 'Dashboard utama untuk memantau aktivitas sistem, tren SLA, status inventaris, and log aktivitas IT.' },
                { key: 'inbox', icon: '📥', name: 'Inbox', desc: 'Pusat notifikasi untuk melihat update terkini dari tiket, tugas baru, atau komentar obrolan tim.' },
                { key: 'my_tasks', icon: '✅', name: 'My Tasks', desc: 'Daftar tugas personal Anda, termasuk tugas Preventative Maintenance (PM) dan pengisian checklist harian.' },
                { key: 'tickets', icon: '🎫', name: 'Tickets', desc: 'Sistem helpdesk IT untuk melihat laporan tiket kerusakan, melakukan klaim perbaikan, and mencatat spare parts.' },
                { key: 'assets', icon: '🖥️', name: 'Assets', desc: 'Registri lengkap seluruh perangkat keras hardware, jadwal perawatan berkala, and pencetakan label QR.' },
                { key: 'knowledge', icon: '📖', name: 'Knowledge', desc: 'Dokumentasi solusi masalah IT (KB) dan SOP kerja untuk mempercepat penyelesaian insiden berulang.' },
                { key: 'chat_admin', icon: '💬', name: 'Chat Admin', desc: 'Platform bantuan obrolan langsung (live support chat) bagi karyawan untuk bertanya langsung ke tim IT.' },
                { key: 'reports', icon: '📊', name: 'Reports', desc: 'Analytics center untuk memantau biaya CAPEX, depresiasi linear aset, kepatuhan SLA, and point kinerja teknisi.' }
              ].map(item => (
                <button 
                  key={item.name} 
                  onClick={() => {
                    setActivePage(item.key);
                    setShowIconGlossary(false);
                  }}
                  className="flex w-full text-left gap-4 rounded-xl border border-gray-850 bg-gray-900/20 p-3 hover:border-violet-500 hover:bg-violet-600/5 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-2xl select-none shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/10">
                    {item.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-800 pt-4 mt-5 flex justify-end">
              <button 
                onClick={() => setShowIconGlossary(false)} 
                className="rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-bold px-4 py-2 transition-all active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
