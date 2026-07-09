import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

const priorityDot = { urgent: 'bg-red-400', high: 'bg-orange-400', normal: 'bg-blue-400', low: 'bg-gray-400' };

export default function CalendarView() {
  const { getFilteredTasks, selectTask, holidays } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const tasks = getFilteredTasks().filter(t => t.dueDate);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="flex-1 min-h-0 flex flex-col p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="rounded-lg p-2 text-gray-400 hover:bg-gray-700/50 hover:text-white"><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-700/50 hover:text-white">Today</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="rounded-lg p-2 text-gray-400 hover:bg-gray-700/50 hover:text-white"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{day}</div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map(day => {
          const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
          const dayHolidays = holidays.filter(h => isSameDay(new Date(h.date), day));
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className={cn("min-h-[100px] rounded-lg border p-2 transition-colors flex flex-col justify-between",
              isCurrentMonth ? "border-gray-800 bg-[#282c34]/50" : "border-transparent bg-transparent",
              today && "border-violet-500/50 bg-violet-500/5"
            )}>
              <div className="w-full flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className={cn("text-xs font-semibold", today ? "text-violet-400" : isCurrentMonth ? "text-gray-300" : "text-gray-600")}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Small Holiday Indicator dot */}
                  {dayHolidays.length > 0 && (
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      dayHolidays.some(h => h.isNational) ? "bg-rose-500" : "bg-purple-500"
                    )} />
                  )}
                </div>

                <div className="space-y-1">
                  {/* Draw holiday banners first */}
                  {dayHolidays.map(h => (
                    <div key={h.id} className={cn(
                      "flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold border truncate select-none",
                      h.isNational 
                        ? "bg-rose-600/10 border-rose-500/20 text-rose-400" 
                        : "bg-purple-600/10 border-purple-500/20 text-purple-400"
                    )} title={h.name}>
                      🇮🇩 {h.name}
                    </div>
                  ))}

                  {/* Draw task lists */}
                  {dayTasks.slice(0, 2).map(task => (
                    <button key={task.id} onClick={() => selectTask(task.id)}
                      className="flex w-full items-center gap-1.5 rounded-md bg-gray-700/40 px-1.5 py-0.5 text-left transition-colors hover:bg-gray-700/60">
                      <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", (() => {
                        const p = (task.priority || 'normal').toLowerCase();
                        const key = p === 'medium' ? 'normal' : p;
                        return priorityDot[key as keyof typeof priorityDot] || 'bg-gray-400';
                      })())} />
                      <span className="truncate text-[10px] text-gray-300">{task.title}</span>
                    </button>
                  ))}
                  {dayTasks.length > 2 && <span className="block text-center text-[9px] text-gray-500">+{dayTasks.length - 2} more</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
