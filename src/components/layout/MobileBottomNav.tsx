import { useStore } from '../../store/useStore';
import { Home, CheckSquare, Ticket, HardDrive, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MobileBottomNavProps {
  onMenuToggle: () => void;
}

export default function MobileBottomNav({ onMenuToggle }: MobileBottomNavProps) {
  const { activePage, setActivePage, tasks, tickets, currentUser, getUnreadNotificationCount } = useStore();

  const myTasksCount = currentUser
    ? tasks.filter(t => t.assigneeIds.includes(currentUser.id) && t.status !== 'done').length
    : 0;

  const openTicketsCount = currentUser
    ? tickets.filter(t => (t.assigneeId === currentUser.id || t.reporterId === currentUser.id) && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length
    : 0;

  const unreadCount = getUnreadNotificationCount();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'my_tasks', label: 'Tugas', icon: CheckSquare, badge: myTasksCount > 0 ? myTasksCount : null },
    { id: 'tickets', label: 'Tiket', icon: Ticket, badge: openTicketsCount > 0 ? openTicketsCount : null },
    { id: 'assets', label: 'Aset', icon: HardDrive, badge: null },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-panel)]/95 border-t border-[var(--c-border)] shadow-2xl backdrop-blur-xl px-1.5 py-1.5 flex items-center justify-around pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id as any)}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-medium transition-all active:scale-95 cursor-pointer touch-manipulation min-h-[44px]",
              isActive
                ? "text-violet-400 bg-violet-500/15 font-bold shadow-inner"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
            )}
          >
            <div className="relative">
              <Icon size={20} className={cn("transition-transform duration-200", isActive && "scale-110 text-violet-400")} />
              {item.badge !== null && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-violet-600 text-[9px] font-extrabold text-white shadow-md">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
      
      <button
        onClick={onMenuToggle}
        className="flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 transition-all active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
      >
        <Menu size={18} className="mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
