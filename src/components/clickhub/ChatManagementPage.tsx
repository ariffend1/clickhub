import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { MessageCircle, Send, User, CheckCircle, Ticket, Clock, Check, ShieldAlert, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatManagementPage() {
  const { 
    chatSessions, 
    chatMessages, 
    currentUser, 
    claimChatSession, 
    sendChatReply, 
    closeChatSession, 
    requestCloseChatSession,
    convertChatToTicket,
    uploadChatFile,
    subscribeChatMessages,
    subscribeChatSessions
  } = useStore();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'in_progress' | 'closed'>('active');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Berkas melebihi batas ukuran 10MB.");
      return;
    }
    const uploadPromise = uploadChatFile(selectedSessionId, file);
    toast.promise(uploadPromise, {
      loading: `Mengirim ${file.name}...`,
      success: `Berhasil mengirim ${file.name}!`,
      error: (err) => `Gagal mengirim: ${err.message}`
    });
    try {
      const fileDetails = await uploadPromise;
      await sendChatReply(selectedSessionId, `Mengirim lampiran: ${file.name}`, fileDetails);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Koneksi internet tersambung kembali.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Koneksi internet terputus. Mode baca saja.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedSession = chatSessions.find(s => s.id === selectedSessionId);
  const messages = selectedSession ? chatMessages.filter(m => m.sessionId === selectedSession.id) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, selectedSessionId]);

  useEffect(() => {
    const unsubscribe = subscribeChatSessions();
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      const unsubscribe = subscribeChatMessages(selectedSessionId);
      return () => {
        unsubscribe();
      };
    }
  }, [selectedSessionId]);

  // Filter sessions based on tab
  const filteredSessions = chatSessions.filter(session => {
    if (activeTab === 'active') return session.status === 'OPEN';
    if (activeTab === 'in_progress') return session.status === 'IN_PROGRESS' || session.status === 'CLOSE_REQUESTED';
    return session.status === 'CLOSED';
  });

  const getSessionLastMessage = (sessionId: string) => {
    const sessionMsgs = chatMessages.filter(m => m.sessionId === sessionId);
    if (sessionMsgs.length === 0) return 'No messages';
    const last = sessionMsgs[sessionMsgs.length - 1];
    return last.content;
  };

  const getSessionLastTime = (sessionId: string) => {
    const sessionMsgs = chatMessages.filter(m => m.sessionId === sessionId);
    if (sessionMsgs.length === 0) return '';
    const last = sessionMsgs[sessionMsgs.length - 1];
    return new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendReply = async () => {
    if (!selectedSessionId || !replyInput.trim() || !isOnline) return;
    await sendChatReply(selectedSessionId, replyInput.trim());
    setReplyInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {!isOnline && (
        <div id="offline-banner" className="bg-red-950/80 border border-red-900/50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-red-400 animate-pulse mb-3 shrink-0">
          <ShieldAlert size={14} className="shrink-0" />
          <span>Koneksi Internet Terputus. Mode Baca Saja.</span>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/40 backdrop-blur-xl">
        {/* Sessions Sidebar */}
        <div className={cn("flex w-full md:w-80 flex-col border-r border-gray-800 bg-gray-900/30", selectedSessionId ? "hidden md:flex" : "flex")}>
          <div className="border-b border-gray-800 p-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle className="text-violet-500" size={20} />
              IT Support Console
            </h2>
            <p className="text-xs text-gray-400 mt-1">Manage employee real-time chat requests</p>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-gray-800 px-2 py-2 gap-1">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-200",
                activeTab === 'active'
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
              )}
            >
              Open ({chatSessions.filter(s => s.status === 'OPEN').length})
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-200",
                activeTab === 'in_progress'
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                  : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
              )}
            >
              Claimed ({chatSessions.filter(s => s.status === 'IN_PROGRESS' || s.status === 'CLOSE_REQUESTED').length})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-200",
                activeTab === 'closed'
                  ? "bg-gray-800 text-gray-300 border border-gray-700/50"
                  : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
              )}
            >
              Closed ({chatSessions.filter(s => s.status === 'CLOSED').length})
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <MessageCircle size={32} className="text-gray-700 mb-2" />
                <p className="text-sm font-semibold text-gray-500">No chat sessions found</p>
                <p className="text-xs text-gray-600 mt-1">Sessions matching status "{activeTab}" will appear here.</p>
              </div>
            ) : (
              filteredSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={cn(
                    "w-full text-left rounded-xl p-3 flex flex-col gap-1.5 transition-all duration-200 border",
                    selectedSessionId === session.id
                      ? "bg-violet-600/10 border-violet-500/40 text-white shadow-md shadow-violet-950/20"
                      : "bg-gray-900/10 border-transparent hover:bg-gray-900/40 text-gray-300"
                  )}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                      {session.employeeName}
                    </span>
                    <span className="text-[9px] text-gray-500 shrink-0">
                      {getSessionLastTime(session.id)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate w-full">
                    {getSessionLastMessage(session.id)}
                  </p>
                  {session.handlerName && (
                    <div className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold mt-1">
                      <User size={10} />
                      <span>Handled by: {session.handlerName}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Conversation Window */}
        <div className={cn("flex-1 flex flex-col bg-gray-950/20", !selectedSessionId ? "hidden md:flex" : "flex")}>
          {selectedSession ? (
            <>
              {/* Session Header */}
              <div className="flex items-center justify-between border-b border-gray-800 p-4 bg-gray-900/10">
                <div className="flex items-center min-w-0">
                  <button 
                    onClick={() => setSelectedSessionId(null)}
                    className="md:hidden mr-3 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors shrink-0"
                    title="Kembali"
                  >
                    ←
                  </button>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                      {selectedSession.employeeName}
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0",
                        selectedSession.status === 'OPEN' ? "bg-violet-600/10 border-violet-500/30 text-violet-400 animate-pulse" :
                        selectedSession.status === 'IN_PROGRESS' ? "bg-amber-600/10 border-amber-500/30 text-amber-400" :
                        selectedSession.status === 'CLOSE_REQUESTED' ? "bg-orange-600/10 border-orange-500/30 text-orange-400 animate-pulse" :
                        "bg-gray-800/40 border-gray-700/50 text-gray-400"
                      )}>
                        {selectedSession.status === 'IN_PROGRESS' ? 'CLAIMED' : 
                         selectedSession.status === 'CLOSE_REQUESTED' ? 'CLOSE PENDING' : 
                         selectedSession.status}
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">Session ID: {selectedSession.id}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {selectedSession.status === 'OPEN' && (
                    <button
                      disabled={!isOnline}
                      onClick={() => claimChatSession(selectedSession.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 transition-all duration-200 shadow-md shadow-violet-950/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Check size={14} />
                      Claim & Join Chat
                    </button>
                  )}

                  {selectedSession.status !== 'CLOSED' && (
                    <>
                      <button
                        disabled={!isOnline}
                        onClick={() => convertChatToTicket(selectedSession.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Ticket size={14} />
                        Convert to Ticket
                      </button>
                      
                      {selectedSession.status === 'CLOSE_REQUESTED' ? (
                        <>
                          <button
                            disabled={true}
                            className="flex items-center gap-1.5 rounded-lg bg-orange-600/10 border border-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-400/55 cursor-not-allowed"
                          >
                            <Clock size={14} className="animate-pulse" />
                            Pending User Confirm
                          </button>
                          <button
                            disabled={!isOnline}
                            onClick={() => {
                              if (confirm("Force close this session? This will bypass user confirmation.")) {
                                closeChatSession(selectedSession.id);
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <CheckCircle size={14} />
                            Force Close
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={!isOnline}
                          onClick={() => requestCloseChatSession(selectedSession.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          Close Session
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUser?.id;
                  const isSystem = msg.isSystem || msg.senderId === 'system';
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="rounded-full bg-gray-900 border border-gray-800 px-4 py-1 text-[10px] text-gray-400 font-medium">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", isMe ? "flex-row-reverse" : "")}>
                      {!isMe && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs text-white font-bold">
                          {msg.senderName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                        <span className="text-[10px] text-gray-500 font-semibold mb-0.5 px-1">{msg.senderName}</span>
                        <div className={cn(
                          "rounded-2xl px-4 py-2.5 shadow-sm text-xs font-normal border leading-relaxed",
                          isMe 
                            ? "bg-violet-600 text-white border-violet-500/30 rounded-tr-none" 
                            : "bg-gray-900/60 text-gray-200 border-gray-800 rounded-tl-none"
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
                          <p>{msg.content}</p>
                          <p className={cn("text-[9px] mt-1 text-right", isMe ? "text-violet-200" : "text-gray-500")}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Box */}
              <div className="border-t border-gray-800 p-4 bg-gray-900/10">
                {selectedSession.status === 'CLOSED' ? (
                  <div className="flex items-center gap-2 justify-center py-2 text-xs text-gray-500 font-semibold bg-gray-900/20 border border-gray-800/40 rounded-xl">
                    <ShieldAlert size={14} className="text-gray-600" />
                    This session is closed and cannot be replied to.
                  </div>
                ) : selectedSession.handlerId !== currentUser?.id ? (
                  <div className="flex items-center justify-between gap-4 p-3 border border-amber-500/20 bg-amber-600/5 rounded-xl">
                    <p className="text-xs text-amber-400 font-medium">You need to claim this chat session before replying.</p>
                    <button
                      disabled={!isOnline}
                      onClick={() => claimChatSession(selectedSession.id)}
                      className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Claim Sesi
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      disabled={!isOnline}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-gray-900 border border-gray-800 px-3 text-gray-400 hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed btn-chat-attach"
                      title="Kirim Berkas"
                    >
                      <Paperclip size={16} />
                    </button>
                    <input
                      disabled={!isOnline}
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && replyInput.trim() && isOnline) {
                          handleSendReply();
                        }
                      }}
                      placeholder={isOnline ? `Type your reply to ${selectedSession.employeeName}...` : "Mode Baca Saja (Offline)"}
                      className="flex-1 rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors disabled:opacity-50"
                    />
                    <button
                      disabled={!isOnline}
                      onClick={handleSendReply}
                      className="rounded-xl bg-violet-600 px-4 text-white hover:bg-violet-500 transition-all duration-200 flex items-center justify-center shadow-md shadow-violet-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle size={48} className="text-gray-800 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-400">No Chat Selected</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                Select a conversation from the sidebar console to begin assisting the employee.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
