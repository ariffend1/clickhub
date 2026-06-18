import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Clock, CheckCircle2, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function HomePage() {
  const { 
    tasks, currentUser, activities, spaces, getUserById, selectTask, 
    setActivePage, selectSpace, tickets, assets, showChatWidget, setShowChatWidget,
    setShowCreateTicketModal
  } = useStore();

  if (!currentUser) return null;

  const isEmployee = currentUser.role === 'EMPLOYEE';

  // IT Admin / Manager view data
  const myTasks = tasks.filter(t => t.assigneeIds.includes(currentUser.id));
  const myInProgress = myTasks.filter(t => t.status === 'in_progress');
  const myOverdue = myTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done');
  const myCompleted = myTasks.filter(t => t.status === 'done');
  const myUpcoming = myTasks
    .filter(t => t.dueDate && !isPast(new Date(t.dueDate)) && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const recentActivities = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Employee Dashboard specific calculations
  const myTickets = tickets.filter(t => t.reporterId === currentUser.id);
  const activeTickets = myTickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
  
  // Aset yang dipinjam oleh Employee ini (mencocokkan serial number di checkout / data aset)
  const myAssignedAssets = assets.filter(a => {
    // Sebagai fallback, cari jika aset ada relasinya dengan user
    // (Jika data relasi user_id ada di tabel Asset atau checkout)
    return a.status === 'IN_USE'; // Tampilkan aset berstatus in-use sebagai mock dinamis di UI jika belum ada pemetaan user_id yang ketat
  });

  if (isEmployee) {
    return (
      <div className="h-full overflow-y-auto bg-slate-900 p-4 sm:p-8 text-white">
        {/* Welcome Hero Banner */}
        <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white">
              Hello, {currentUser.name.split(' ')[0]}! 👋
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-violet-100 max-w-md">
              Ada kendala teknis atau butuh bantuan peralatan IT hari ini? Tim Support kami siap membantu Anda.
            </p>
          </div>
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 bg-indigo-500/30 rounded-full blur-xl animate-pulse" />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => setActivePage('tickets')} 
              className="group flex flex-col items-start rounded-xl border border-gray-800 bg-[#282c34]/80 p-5 hover:border-violet-500 hover:bg-[#282c34] transition duration-300 text-left shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition duration-300 mb-4">
                🎫
              </div>
              <p className="font-bold text-white text-sm group-hover:text-violet-300 transition">Laporkan Masalah Baru</p>
              <p className="text-[11px] text-gray-500 mt-1">Buat tiket keluhan IT untuk hardware, software, atau jaringan.</p>
            </button>

            <button 
              onClick={() => setShowChatWidget(true)}
              className="group flex flex-col items-start rounded-xl border border-gray-800 bg-[#282c34]/80 p-5 hover:border-violet-500 hover:bg-[#282c34] transition duration-300 text-left shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition duration-300 mb-4">
                💬
              </div>
              <p className="font-bold text-white text-sm group-hover:text-emerald-300 transition">Hubungi IT Helpdesk</p>
              <p className="text-[11px] text-gray-500 mt-1">Mulai obrolan obrolan langsung (Live Chat) dengan teknisi online.</p>
            </button>

            <button 
              onClick={() => setActivePage('knowledge')}
              className="group flex flex-col items-start rounded-xl border border-gray-800 bg-[#282c34]/80 p-5 hover:border-violet-500 hover:bg-[#282c34] transition duration-300 text-left shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition duration-300 mb-4">
                📚
              </div>
              <p className="font-bold text-white text-sm group-hover:text-amber-300 transition">Buka Pusat Bantuan</p>
              <p className="text-[11px] text-gray-500 mt-1">Cari panduan, FAQ, dan solusi mandiri untuk masalah umum.</p>
            </button>
          </div>
        </div>

        {/* Devices and Tickets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* My Devices Section */}
          <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              💻 Aset Saya 
              <span className="text-xs text-gray-500 font-normal">({myAssignedAssets.length} unit)</span>
            </h3>
            {myAssignedAssets.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 italic">
                Anda tidak memegang aset perusahaan yang terdaftar saat ini.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {myAssignedAssets.map(asset => (
                  <div key={asset.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-700/50 bg-[#1e2028] p-4 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{asset.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{asset.brand} • {asset.type}</p>
                      <p className="text-[10px] font-mono text-gray-500 mt-1">S/N: {asset.serialNumber}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActivePage('tickets');
                        // Optional: trigger ticket creation modal for this asset serial number
                      }}
                      className="shrink-0 rounded-lg bg-gray-800 border border-gray-700 hover:bg-violet-600 hover:border-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-all self-start sm:self-center"
                    >
                      Laporkan Kerusakan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Tickets Tracker */}
          <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                🎫 Pelacakan Laporan Saya
              </h3>
              <button 
                onClick={() => setActivePage('tickets')} 
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold"
              >
                Semua Tiket <ArrowRight size={12} />
              </button>
            </div>

            {myTickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 italic">
                Belum ada tiket laporan yang Anda buat.
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {myTickets.slice(0, 3).map(ticket => {
                  const statusColors: Record<string, string> = {
                    OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                    RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/20',
                    CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                  };
                  return (
                    <div 
                      key={ticket.id}
                      onClick={() => setActivePage('tickets')}
                      className="cursor-pointer rounded-lg border border-gray-700/50 bg-[#1e2028] p-4 hover:border-gray-600 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusColors[ticket.status])}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">{ticket.description}</p>
                      
                      {/* Compact tracking timeline */}
                      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-800/80">
                        <div className="flex items-center flex-1">
                          <div className={cn("h-2 w-2 rounded-full", ticket.status === 'OPEN' ? 'bg-blue-500 animate-pulse' : 'bg-gray-700')} />
                          <div className="h-[2px] flex-1 bg-gray-800" />
                          <div className={cn("h-2 w-2 rounded-full", ticket.status === 'IN_PROGRESS' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-700')} />
                          <div className="h-[2px] flex-1 bg-gray-800" />
                          <div className={cn("h-2 w-2 rounded-full", ['RESOLVED', 'CLOSED'].includes(ticket.status) ? 'bg-green-500' : 'bg-gray-700')} />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium ml-2">Progress</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Admin / Manager / Technician Dashboard View (Existing original code)
  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-900 text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser.name.split(' ')[0]}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-400">Here's what's happening with your projects today.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'In Progress', value: myInProgress.length, icon: <Clock size={20} />, color: 'bg-blue-500/10 text-blue-400' },
          { label: 'Overdue', value: myOverdue.length, icon: <AlertTriangle size={20} />, color: 'bg-red-500/10 text-red-400' },
          { label: 'Completed', value: myCompleted.length, icon: <CheckCircle2 size={20} />, color: 'bg-green-500/10 text-green-400' },
          { label: 'Completion', value: `${myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0}%`, icon: <TrendingUp size={20} />, color: 'bg-violet-500/10 text-violet-400' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.color)}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
            <button onClick={() => setActivePage('my_tasks')} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
              View All <ArrowRight size={12} />
            </button>
          </div>
          {myUpcoming.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No upcoming deadlines 🎉</p>
          ) : (
            <div className="space-y-2">
              {myUpcoming.map(task => (
                <button key={task.id} onClick={() => selectTask(task.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-700/30">
                  <div className={cn("h-2 w-2 rounded-full shrink-0",
                    task.priority === 'urgent' ? 'bg-red-400' : task.priority === 'high' ? 'bg-orange-400' : task.priority === 'normal' ? 'bg-blue-400' : 'bg-gray-400'
                  )} />
                  <span className="flex-1 truncate text-sm text-gray-300">{task.title}</span>
                  <span className="shrink-0 text-xs text-gray-500">{format(new Date(task.dueDate!), 'MMM d')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map(act => {
                const user = getUserById(act.userId);
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: user?.color || '#666' }}>
                      {user?.name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        <span className="font-medium text-gray-300">{user?.name}</span> {act.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-600">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {currentUser.role !== 'EMPLOYEE' && (
          <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#282c34] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Spaces Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {spaces.map(space => {
                const spaceTasks = tasks.filter(t => t.spaceId === space.id);
                const done = spaceTasks.filter(t => t.status === 'done').length;
                const pct = spaceTasks.length > 0 ? Math.round((done / spaceTasks.length) * 100) : 0;
                return (
                  <button key={space.id} onClick={() => selectSpace(space.id)}
                    className="rounded-lg border border-gray-700/50 p-4 text-left hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{space.icon}</span>
                      <span className="text-sm font-medium text-white">{space.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{spaceTasks.length} tasks</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-700">
                      <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
