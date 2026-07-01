import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { MessageSquare, CheckCircle2, Bell, Check, Trash2, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/cn';

type InboxTab = 'notifications' | 'comments';

export default function InboxPage() {
  const { 
    getInboxItems, 
    getUserById, 
    selectTask, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    clearNotifications,
    tickets,
    setSelectedTicket
  } = useStore();

  const [activeTab, setActiveTab] = useState<InboxTab>('notifications');
  const commentItems = getInboxItems();

  const handleNotificationClick = async (n: any) => {
    // Mark as read
    await markNotificationRead(n.id);
    
    // Auto-navigate/open target if exists
    if (n.ticketId) {
      const targetTicket = tickets.find(t => t.id === n.ticketId);
      if (targetTicket) {
        setSelectedTicket(targetTicket);
      }
    } else if (n.taskId) {
      selectTask(n.taskId);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 bg-[var(--bg-main)] text-[var(--c-text)]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('notifications')}
              className={cn(
                "pb-3 text-sm font-semibold transition-all relative",
                activeTab === 'notifications' ? "text-violet-400 border-b-2 border-violet-500" : "text-gray-500 hover:text-white"
              )}
            >
              🔔 Notifikasi Sistem ({notifications.filter(n => !n.read).length})
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={cn(
                "pb-3 text-sm font-semibold transition-all relative",
                activeTab === 'comments' ? "text-violet-400 border-b-2 border-violet-500" : "text-gray-500 hover:text-white"
              )}
            >
              💬 Komentar Tugas ({commentItems.length})
            </button>
          </div>

          {activeTab === 'notifications' && notifications.length > 0 && (
            <div className="flex gap-2">
              <button 
                onClick={markAllNotificationsRead} 
                className="flex items-center gap-1 rounded bg-gray-800 hover:bg-gray-700 px-2.5 py-1 text-xs text-gray-300 font-semibold transition"
              >
                <Check size={12} /> Tandai Semua Dibaca
              </button>
              <button 
                onClick={clearNotifications} 
                className="flex items-center gap-1 rounded bg-red-950/20 hover:bg-red-950/40 px-2.5 py-1 text-xs text-red-400 font-semibold border border-red-900/10 transition"
              >
                <Trash2 size={12} /> Bersihkan
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: System Notifications */}
        {activeTab === 'notifications' && (
          notifications.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-[#282c34] py-16 text-center shadow-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-700/50">
                <CheckCircle2 size={28} className="text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Tidak ada notifikasi baru!</h3>
              <p className="mt-1 text-sm text-gray-500">Semua notifikasi sistem Anda telah dibaca.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const isTicket = n.type?.startsWith('ticket') || n.ticketId;
                const isChat = n.type?.startsWith('chat') || n.type === 'new_message';

                return (
                  <button 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition cursor-pointer relative",
                      n.read 
                        ? "border-gray-850 bg-[#282c34]/50 opacity-70 hover:border-gray-700" 
                        : "border-violet-500/20 bg-[#282c34] shadow-md hover:border-violet-500/35"
                    )}
                  >
                    {!n.read && (
                      <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                    )}
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                      isTicket ? "bg-blue-500/10 text-blue-400" : isChat ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-700/50 text-gray-300"
                    )}>
                      {isTicket ? <Ticket size={16} /> : isChat ? <MessageSquare size={16} /> : <Bell size={16} />}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-semibold text-white mb-0.5">{n.title}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                      <p className="mt-1.5 text-[10px] text-gray-600">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}

        {/* Tab 2: Original Task Comments */}
        {activeTab === 'comments' && (
          commentItems.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-[#282c34] py-16 text-center shadow-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-700/50">
                <MessageSquare size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Tidak ada komentar tugas!</h3>
              <p className="mt-1 text-sm text-gray-500">Belum ada komentar baru pada tugas yang ditugaskan ke Anda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commentItems.map(item => {
                const user = getUserById(item.userId);
                return (
                  <button key={item.id} onClick={() => selectTask(item.taskId)}
                    className="flex w-full items-start gap-4 rounded-xl border border-gray-800 bg-[#282c34] p-4 text-left transition hover:border-gray-700 hover:bg-[#2d313b] cursor-pointer">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: user?.color || '#666' }}>
                      {user?.name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{user?.name}</span>
                        <MessageSquare size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">commented on</span>
                        <span className="text-xs font-medium text-violet-400 truncate">{item.task?.title}</span>
                      </div>
                      <p className="text-sm text-gray-400">{item.content}</p>
                      <p className="mt-1.5 text-[10px] text-gray-600">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
