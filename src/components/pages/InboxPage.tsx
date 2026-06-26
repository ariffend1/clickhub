import { useStore } from '../../store/useStore';
import { MessageSquare, CheckCircle2, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PageHelp from '../layout/PageHelpModal';

export default function InboxPage() {
  const { getInboxItems, getUserById, selectTask } = useStore();
  const inboxItems = getInboxItems();

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <p className="text-xs text-gray-500">Comments and updates on tasks assigned to you</p>
        </div>

        {inboxItems.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-[#282c34] py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-700/50">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">You're all caught up!</h3>
            <p className="mt-1 text-sm text-gray-500">No new messages in your inbox.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inboxItems.map(item => {
              const user = getUserById(item.userId);
              return (
                <button key={item.id} onClick={() => selectTask(item.taskId)}
                  className="flex w-full items-start gap-4 rounded-xl border border-gray-800 bg-[#282c34] p-4 text-left transition hover:border-gray-700 hover:bg-[#2d313b]">
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
        )}
      </div>
    </div>
  );
}
