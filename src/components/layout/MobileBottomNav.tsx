import { useStore } from '../../store/useStore';
import { Home, CheckSquare, Ticket, HardDrive, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MobileBottomNavProps {
  onMenuToggle: () => void;
}

export default function MobileBottomNav({ onMenuToggle }: MobileBottomNavProps) {
  const { activePage, setActivePage } = useStore();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'my_tasks', label: 'Tugas', icon: CheckSquare },
    { id: 'tickets', label: 'Tiket', icon: Ticket },
    { id: 'assets', label: 'Aset', icon: HardDrive },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-panel)] border-t border-[var(--c-border)] shadow-2xl backdrop-blur-md px-1 py-1 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id as any)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all active:scale-95 cursor-pointer touch-manipulation min-h-[44px]",
              isActive
                ? "text-violet-400 bg-violet-500/10 font-semibold"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
            )}
          >
            <Icon size={18} className={cn("mb-0.5 transition-transform", isActive && "scale-110")} />
            <span>{item.label}</span>
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
