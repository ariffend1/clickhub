import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { MessageCircle, X, Send, Minimize2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatWidget() {
  const { 
    showChatWidget, setShowChatWidget, chatSessions, chatMessages, 
    currentUser, createChatSession, sendChatMessage, uploadChatFile,
    subscribeChatMessages, confirmCloseChatSession, rejectCloseChatSession 
  } = useStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mySession) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Berkas melebihi batas ukuran 10MB.");
      return;
    }
    const uploadPromise = uploadChatFile(mySession.id, file);
    toast.promise(uploadPromise, {
      loading: `Mengirim ${file.name}...`,
      success: `Berhasil mengirim ${file.name}!`,
      error: (err) => `Gagal mengirim: ${err.message}`
    });
    try {
      const fileDetails = await uploadPromise;
      await sendChatMessage(mySession.id, `Mengirim lampiran: ${file.name}`, fileDetails);
    } catch (err) {
      console.error(err);
    }
  };

  const mySession = currentUser ? chatSessions.find(s => s.employeeId === currentUser.id && s.status !== 'CLOSED') : null;
  const messages = mySession ? chatMessages.filter(m => m.sessionId === mySession.id) : [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (mySession) {
      const unsubscribe = subscribeChatMessages(mySession.id);
      return () => {
        unsubscribe();
      };
    }
  }, [mySession?.id]);

  if (!showChatWidget) {
    return (
      <button onClick={() => setShowChatWidget(true)} className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors">
        <MessageCircle size={22} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-96 w-80 flex-col rounded-2xl border border-gray-700 bg-[#1e2028] shadow-2xl animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">💬 IT Support Chat</h3>
          <p className="text-[10px] text-green-400">● Online</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowChatWidget(false)} className="rounded p-1 text-gray-500 hover:text-white"><Minimize2 size={14} /></button>
          <button onClick={() => setShowChatWidget(false)} className="rounded p-1 text-gray-500 hover:text-white"><X size={14} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {!mySession ? (
          <div className="flex h-full items-center justify-center">
            <button onClick={createChatSession} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Start Chat</button>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex gap-2", msg.senderId === currentUser?.id ? "flex-row-reverse" : "")}>
                {(msg.senderId !== currentUser?.id && !msg.isSystem) && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white">IT</div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-xl px-3 py-2",
                  msg.isSystem ? "mx-auto bg-gray-800/50 text-[10px] text-gray-400 text-center" :
                  msg.senderId === currentUser?.id ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300"
                )}>
                  {msg.fileUrl && msg.fileType?.startsWith('image/') ? (
                    <div className="mb-2 max-w-full rounded overflow-hidden cursor-pointer border border-gray-700/50 bg-black/20" onClick={() => window.open(msg.fileUrl, '_blank')}>
                      <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="max-h-32 object-contain" />
                    </div>
                  ) : msg.fileUrl ? (
                    <div className="mb-2 flex items-center gap-1.5 rounded bg-black/20 p-1.5 border border-gray-700/50 text-[10px]">
                      <span>📄</span>
                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline truncate hover:text-violet-200 text-violet-300 font-medium" title={msg.fileName}>
                        {msg.fileName || 'Download File'}
                      </a>
                      <span className="text-[8px] text-gray-500 flex-shrink-0">
                        ({(msg.fileSize ? msg.fileSize / 1024 : 0).toFixed(0)} KB)
                      </span>
                    </div>
                  ) : null}
                  <p className="text-xs">{msg.content}</p>
                  <p className={cn("text-[9px] mt-1", msg.senderId === currentUser?.id ? "text-violet-200" : "text-gray-500")}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Input */}
      {mySession && (
        <div className="border-t border-gray-800 p-3">
          {mySession.status === 'CLOSE_REQUESTED' && mySession.closeRequestedBy !== currentUser?.id && (
            <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-600/10 p-3 text-center">
              <p className="text-[11px] text-amber-400 font-medium mb-2">
                IT Support has requested to close this session. Has your issue been resolved?
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => confirmCloseChatSession(mySession.id)}
                  className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Yes, Close Chat
                </button>
                <button
                  onClick={() => rejectCloseChatSession(mySession.id)}
                  className="rounded bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-500 transition-colors cursor-pointer"
                >
                  No, Keep Open
                </button>
              </div>
            </div>
          )}

          {mySession.status === 'OPEN' || mySession.status === 'IN_PROGRESS' || mySession.status === 'CLOSE_REQUESTED' ? (
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-gray-800 border border-gray-700 px-2 text-gray-400 hover:text-white transition-colors btn-chat-attach"
                title="Kirim Berkas"
              >
                <Paperclip size={14} />
              </button>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { sendChatMessage(mySession.id, input.trim()); setInput(''); } }}
                placeholder={mySession.status === 'CLOSE_REQUESTED' ? "Chat is active. Reply or confirm above..." : "Type a message..."}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
              <button onClick={() => { if (input.trim()) { sendChatMessage(mySession.id, input.trim()); setInput(''); } }} className="rounded-lg bg-violet-600 px-3 text-white hover:bg-violet-500"><Send size={14} /></button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">This chat has been closed.</p>
              <button onClick={createChatSession} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500">New Chat</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
