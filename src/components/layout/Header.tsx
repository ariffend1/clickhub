import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import {
  Search, X, Bell, LayoutGrid, List, Calendar,
  Filter, Plus, Check, Cloud, CloudOff, CloudLightning, RefreshCw, HelpCircle, BookOpen, Sparkles
} from 'lucide-react';
import type { Priority, ViewMode } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import PageHelp from './PageHelpModal';

const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'board', icon: <LayoutGrid size={14} />, label: 'Board' },
  { mode: 'list', icon: <List size={14} />, label: 'List' },
  { mode: 'calendar', icon: <Calendar size={14} />, label: 'Calendar' },
];

const priorities: { value: Priority | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'high', label: '🟠 High' },
  { value: 'normal', label: '🔵 Normal' },
  { value: 'low', label: '⚪ Low' },
];

const pageTitle: Record<string, string> = {
  home: '🏠 Home',
  inbox: '📥 Inbox',
  my_tasks: '✅ My Tasks',
  dashboards: '📊 Dashboards',
  tickets: '🎫 Tickets',
  assets: '🖥️ Assets',
  knowledge: '📖 Knowledge Base',
  admin: '🛡️ Admin',
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const {
    activePage, setActivePage, viewMode, setViewMode, searchQuery, setSearchQuery,
    filterPriority, filterAssignee, setFilterPriority, setFilterAssignee,
    notifications, showNotifications, setShowNotifications,
    markNotificationRead, markAllNotificationsRead, clearNotifications,
    getUnreadNotificationCount, users, setShowCreateTaskModal,
    selectedSpaceId, selectedListId, spaces, lists, currentUser,
    syncQueue, failedSyncQueue, processSyncQueue
  } = useStore();

  const unreadCount = getUnreadNotificationCount();
  const currentSpace = spaces.find(s => s.id === selectedSpaceId);
  const currentList = lists.find(l => l.id === selectedListId);

  const showViewSwitcher = activePage === 'spaces' || activePage === 'my_tasks';
  const [showFilter, setShowFilter] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processSyncQueue]);

  return (
    <div className="border-b border-[var(--c-border)] bg-[var(--bg-main)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuToggle}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-850/40 hover:text-white lg:hidden cursor-pointer shrink-0"
            title="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
            {activePage === 'spaces' ? (
              <>
                {currentSpace && (
                  <>
                    <span>{currentSpace.icon} {currentSpace.name}</span>
                    {currentList && (
                      <span className="text-gray-500"> / <span className="text-gray-300">{currentList.name}</span></span>
                    )}
                  </>
                )}
                {!currentSpace && 'All Tasks'}
              </>
            ) : (
              pageTitle[activePage] || 'ClickHub'
            )}
            {['home', 'inbox', 'my_tasks', 'tickets', 'assets', 'knowledge', 'reports'].includes(activePage) && (
              <PageHelp pageKey={activePage} />
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-32 md:w-64 rounded-lg border border-gray-700 bg-gray-800/50 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Cloud Sync Status */}
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-800/30 px-2.5 py-1.5 text-xs">
            {isOnline ? (
              failedSyncQueue.length > 0 ? (
                <>
                  <CloudLightning className="text-red-400 animate-pulse shrink-0" size={14} />
                  <span className="hidden md:inline text-[10px] font-semibold text-red-400">Sync Error</span>
                </>
              ) : syncQueue.length > 0 ? (
                <>
                  <RefreshCw className="text-yellow-400 animate-spin shrink-0" size={14} />
                  <span className="hidden md:inline text-[10px] font-semibold text-yellow-400">Syncing...</span>
                </>
              ) : (
                <>
                  <Cloud className="text-emerald-400 shrink-0" size={14} />
                  <span className="hidden md:inline text-[10px] font-semibold text-emerald-400">Synced</span>
                </>
              )
            ) : (
              <>
                <CloudOff className="text-gray-500 shrink-0" size={14} />
                <span className="hidden md:inline text-[10px] font-semibold text-gray-500">Offline</span>
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowHelpMenu(false); }}
              className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[var(--c-border)] bg-[var(--bg-panel)] shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between border-b border-[var(--c-border)] px-4 py-3">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-[10px] text-violet-400 hover:text-violet-300">Mark all read</button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} className="text-[10px] text-gray-500 hover:text-gray-300">Clear</button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">No notifications</p>
                  ) : (
                    notifications
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(n => (
                        <button key={n.id} onClick={() => {
                          markNotificationRead(n.id);
                          setShowNotifications(false);
                          if (n.link) {
                            if (n.link.startsWith('/')) {
                              const url = new URL(n.link, window.location.origin);
                              const page = url.pathname.slice(1);
                              if (page) {
                                setActivePage(page as any);
                                window.history.pushState({}, '', n.link);
                                window.dispatchEvent(new CustomEvent('app-route-change', { detail: { link: n.link } }));
                              }
                            }
                          }
                        }}
                          className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-700/30 cursor-pointer",
                            !n.read && "bg-violet-500/5"
                          )}>
                          {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white">{n.title}</p>
                            <p className="text-[11px] text-gray-400">{n.message}</p>
                            <p className="mt-1 text-[9px] text-gray-600">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Toolbar */}
      {showViewSwitcher && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 items-center justify-between border-t border-[var(--c-border)] px-4 lg:px-6 py-3 sm:py-2">
          <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {viewModes.map(v => (
              <button key={v.mode} onClick={() => setViewMode(v.mode)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition",
                  viewMode === v.mode ? "bg-violet-600/20 text-violet-400" : "text-gray-500 hover:bg-gray-800 hover:text-white"
                )}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Filter */}
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-800 hover:text-white",
                  (filterPriority !== 'all' || filterAssignee !== 'all') && "text-violet-400"
                )}>
                <Filter size={12} /> Filter
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-[var(--c-border)] bg-[var(--bg-panel)] p-3 shadow-2xl animate-slide-up">
                  <div className="mb-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Priority</p>
                    {priorities.map(p => (
                      <button key={p.value} onClick={() => setFilterPriority(p.value as Priority | 'all')}
                        className={cn("flex w-full items-center justify-between rounded-md px-2 py-1 text-xs",
                          filterPriority === p.value ? "bg-violet-600/20 text-violet-400" : "text-gray-400 hover:bg-gray-800"
                        )}>
                        {p.label}
                        {filterPriority === p.value && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Assignee</p>
                    <button onClick={() => setFilterAssignee('all')}
                      className={cn("flex w-full items-center justify-between rounded-md px-2 py-1 text-xs",
                        filterAssignee === 'all' ? "bg-violet-600/20 text-violet-400" : "text-gray-400 hover:bg-gray-800"
                      )}>All {filterAssignee === 'all' && <Check size={12} />}</button>
                    {users.map(u => (
                      <button key={u.id} onClick={() => setFilterAssignee(u.id)}
                        className={cn("flex w-full items-center justify-between rounded-md px-2 py-1 text-xs",
                          filterAssignee === u.id ? "bg-violet-600/20 text-violet-400" : "text-gray-400 hover:bg-gray-800"
                        )}>{u.name} {filterAssignee === u.id && <Check size={12} />}</button>
                    ))}
                  </div>
                  {(filterPriority !== 'all' || filterAssignee !== 'all') && (
                    <button onClick={() => { setFilterPriority('all'); setFilterAssignee('all'); }}
                      className="mt-2 w-full rounded-lg bg-gray-700/50 py-1.5 text-xs text-gray-400 hover:text-white">
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {currentUser?.role !== 'EMPLOYEE' && (
              <button onClick={() => setShowCreateTaskModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500">
                <Plus size={12} /> New Task
              </button>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
