import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { X, User, Tag, Database, Plus, Trash2, LogOut, Bell, RefreshCw, Image } from 'lucide-react';
import { toast } from 'sonner';
import { changelogData } from '../../utils/changelogData';
import { getEncryptedItem, setEncryptedItem, STORAGE_KEYS } from '../../utils/crypto';
import { supabase } from '../../lib/supabase';

type TabKey = 'profile' | 'tags' | 'notifications' | 'data' | 'changelog' | 'branding';

const colorOptions = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export default function SettingsModal() {
  const {
    setShowSettingsModal, currentUser, tags, addTag, deleteTag,
    spaces, lists, tasks, comments, logout,
    failedSyncQueue, retryFailedSyncItem, discardFailedSyncItem, clearFailedSyncQueue,
    settingsActiveTab, systemCompanyName, systemLogoBase64, updateBrandingSettings
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<TabKey>((settingsActiveTab || 'profile') as TabKey);

  useEffect(() => {
    if (settingsActiveTab) {
      setActiveTab(settingsActiveTab as TabKey);
    }
  }, [settingsActiveTab]);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Change password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error('Masukkan password baru Anda!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password minimal harus 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok!');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password berhasil diperbarui!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Gagal memperbarui password: ' + err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const [telegramWebhook, setTelegramWebhook] = useState(getEncryptedItem(STORAGE_KEYS.TELEGRAM_WEBHOOK_URL, 'TELEGRAM_WEBHOOK_URL') || '');
  const [telegramToken, setTelegramToken] = useState(getEncryptedItem(STORAGE_KEYS.TELEGRAM_BOT_TOKEN, 'TELEGRAM_BOT_TOKEN') || '');
  const [telegramChatId, setTelegramChatId] = useState(getEncryptedItem(STORAGE_KEYS.TELEGRAM_CHAT_ID, 'TELEGRAM_CHAT_ID') || '');

  const [tempCompanyName, setTempCompanyName] = useState(systemCompanyName || 'CLICKHUB');
  const [tempLogoBase64, setTempLogoBase64] = useState(systemLogoBase64 || '');

  useEffect(() => {
    if (systemCompanyName) setTempCompanyName(systemCompanyName);
  }, [systemCompanyName]);

  useEffect(() => {
    if (systemLogoBase64) setTempLogoBase64(systemLogoBase64);
  }, [systemLogoBase64]);

  if (!currentUser) return null;

  const isFullAdmin = ['ROOT', 'SUPER_ADMIN', 'ADMIN'].includes(currentUser.role);
  const isManagerOrAdmin = ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role);

  const tabItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={14} /> },
    ...(isManagerOrAdmin ? [{ key: 'tags' as TabKey, label: 'Tags', icon: <Tag size={14} /> }] : []),
    ...(isFullAdmin ? [{ key: 'branding' as TabKey, label: 'Branding & Labels', icon: <Image size={14} /> }] : []),
    ...(isFullAdmin ? [{ key: 'notifications' as TabKey, label: 'Notifications', icon: <Bell size={14} /> }] : []),
    { key: 'data', label: 'Data', icon: <Database size={14} /> },
    { key: 'changelog', label: 'Changelog', icon: <RefreshCw size={14} /> },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 150 * 1024) {
      toast.error('File logo terlalu besar! Maksimal ukuran logo adalah 150KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setTempLogoBase64(event.target.result as string);
        toast.success('Logo berhasil diunggah secara lokal. Jangan lupa simpan!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
    toast.info('Menyimpan pengaturan branding...');
    try {
      await updateBrandingSettings(tempCompanyName.trim(), tempLogoBase64);
      toast.success('Pengaturan branding berhasil disimpan ke database!');
    } catch (err: any) {
      toast.error('Gagal menyimpan branding: ' + err.message);
    }
  };

  const handleSaveTelegram = () => {
    setEncryptedItem(STORAGE_KEYS.TELEGRAM_WEBHOOK_URL, telegramWebhook.trim());
    setEncryptedItem(STORAGE_KEYS.TELEGRAM_BOT_TOKEN, telegramToken.trim());
    setEncryptedItem(STORAGE_KEYS.TELEGRAM_CHAT_ID, telegramChatId.trim());
    toast.success('Telegram settings saved successfully!');
  };

  const handleTestTelegram = async () => {
    if (!telegramToken.trim() && !telegramWebhook.trim()) {
      toast.error('Please configure Webhook URL or Bot Token first!');
      return;
    }
    toast.info('Sending test alert...');
    try {
      setEncryptedItem(STORAGE_KEYS.TELEGRAM_WEBHOOK_URL, telegramWebhook.trim());
      setEncryptedItem(STORAGE_KEYS.TELEGRAM_BOT_TOKEN, telegramToken.trim());
      setEncryptedItem(STORAGE_KEYS.TELEGRAM_CHAT_ID, telegramChatId.trim());
      
      const { triggerTelegramAlert } = useStore.getState();
      await triggerTelegramAlert(
        '🔔 ClickHub Test Alert',
        `This is a test notification from ClickHub settings for user **${currentUser.name}**.`
      );
      toast.success('Test alert triggered! Check your Telegram channel.');
    } catch (err: any) {
      toast.error('Failed to trigger test alert: ' + err.message);
    }
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    addTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setShowNewTag(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSettingsModal(false)}>
      <div className="w-full max-w-xl rounded-2xl border border-gray-700 bg-[#1e2028] shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">⚙️ Settings</h2>
          <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex">
          <div className="w-40 border-r border-gray-800 p-3">
            {tabItems.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                  activeTab === tab.key ? "bg-violet-600/15 text-violet-400" : "text-gray-500 hover:bg-gray-800 hover:text-white"
                )}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">
            {activeTab === 'profile' && (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-white">Your Profile</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: currentUser.color }}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{currentUser.name}</p>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                    <p className="text-xs text-gray-600">{currentUser.role} • {currentUser.department}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Name</label>
                    <input value={currentUser.name} readOnly className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Email</label>
                    <input value={currentUser.email} readOnly className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white outline-none" />
                  </div>
                </div>
                <form onSubmit={handleChangePassword} className="mt-5 border-t border-gray-800 pt-4 space-y-3">
                  <h4 className="text-xs font-extrabold text-violet-400 uppercase tracking-wider mb-2">Ganti Password</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] text-gray-500 font-bold uppercase">Password Baru</label>
                      <input 
                        type="password"
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 karakter..." 
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition duration-200" 
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-gray-500 font-bold uppercase">Konfirmasi Password</label>
                      <input 
                        type="password"
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password..." 
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition duration-200" 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={changingPassword}
                    className="w-full rounded-lg bg-violet-650 hover:bg-violet-600 disabled:bg-violet-850 disabled:text-gray-500 py-2 text-xs font-bold text-white transition active:scale-98 cursor-pointer"
                  >
                    {changingPassword ? 'Memperbarui...' : 'Simpan Password Baru'}
                  </button>
                </form>

                <div className="mt-5 border-t border-gray-800 pt-4">
                  <h4 className="text-xs font-extrabold text-violet-400 uppercase tracking-wider mb-2">Panduan Penggunaan</h4>
                  <p className="text-xs text-gray-400 mb-3">Butuh bantuan mengenal tata letak fitur and fungsi ikon ClickHub?</p>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('start-clickhub-tour'));
                      }, 200);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-650 hover:bg-violet-600 px-3.5 py-2 text-xs font-bold text-white transition-all active:scale-95 shadow-md shadow-violet-600/20"
                  >
                    Mulai Tur Panduan Aplikasi
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'tags' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Manage Tags</h3>
                  <button onClick={() => setShowNewTag(true)} className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs text-white hover:bg-violet-500">
                    <Plus size={12} /> Add Tag
                  </button>
                </div>

                {showNewTag && (
                  <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/30 p-3">
                    <div className="flex gap-2 mb-2">
                      <input autoFocus value={newTagName} onChange={e => setNewTagName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') setShowNewTag(false); }}
                        placeholder="Tag name..."
                        className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
                      <button onClick={handleAddTag} className="rounded-md bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500">Add</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Color:</span>
                      {colorOptions.map(c => (
                        <button key={c} onClick={() => setNewTagColor(c)}
                          className={cn("h-5 w-5 rounded-full", newTagColor === c && "ring-2 ring-white ring-offset-1 ring-offset-[#1e2028]")}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {tags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-800/30">
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: tag.color + '25', color: tag.color }}>{tag.name}</span>
                      <button onClick={() => deleteTag(tag.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-white">Telegram Alert Settings</h3>
                <p className="mb-4 text-xs text-gray-400">Configure credentials for system alerts (low stock, CSAT, deletion requests).</p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Telegram Webhook URL</label>
                    <input
                      type="text"
                      value={telegramWebhook}
                      onChange={e => setTelegramWebhook(e.target.value)}
                      placeholder="http://192.168.5.9:8888/api/webhook/nms"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Telegram Bot Token</label>
                    <input
                      type="password"
                      value={telegramToken}
                      onChange={e => setTelegramToken(e.target.value)}
                      placeholder="Enter Telegram Bot Token..."
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Telegram Chat ID</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={e => setTelegramChatId(e.target.value)}
                      placeholder="Enter Chat ID..."
                      className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveTelegram} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition">
                      Save Settings
                    </button>
                    <button onClick={handleTestTelegram} className="rounded-lg bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition">
                      Test Alert
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-white">Data & Storage</h3>
                <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-gray-800/30 p-3 text-center">
                    <p className="text-lg font-bold text-white">{spaces.length}</p><p className="text-gray-500">Spaces</p>
                  </div>
                  <div className="rounded-lg bg-gray-800/30 p-3 text-center">
                    <p className="text-lg font-bold text-white">{lists.length}</p><p className="text-gray-500">Lists</p>
                  </div>
                  <div className="rounded-lg bg-gray-800/30 p-3 text-center">
                    <p className="text-lg font-bold text-white">{tasks.length}</p><p className="text-gray-500">Tasks</p>
                  </div>
                  <div className="rounded-lg bg-gray-800/30 p-3 text-center">
                    <p className="text-lg font-bold text-white">{comments.length}</p><p className="text-gray-500">Comments</p>
                  </div>
                </div>

                {failedSyncQueue && failedSyncQueue.length > 0 && (
                  <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <h4 className="mb-1 text-xs font-semibold text-yellow-450 uppercase tracking-wide">Failed Sync Queue ({failedSyncQueue.length})</h4>
                    <p className="mb-3 text-[11px] text-gray-500">Some operations failed to sync due to validation or database constraints. You can retry or discard them.</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                      {failedSyncQueue.map(item => (
                        <div key={item.id} className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-900/60 p-2.5 text-[11px]">
                          <div className="flex items-center justify-between text-gray-300">
                            <span className="font-semibold">{item.action.toUpperCase()} - {item.table}</span>
                            <div className="flex gap-2">
                              <button onClick={() => retryFailedSyncItem(item.id)} className="text-violet-400 hover:text-violet-300 transition">Retry</button>
                              <button onClick={() => discardFailedSyncItem(item.id)} className="text-red-400 hover:text-red-300 transition">Discard</button>
                            </div>
                          </div>
                          {item.error && <p className="text-red-400 font-mono text-[10px] break-all">{item.error}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        const items = [...failedSyncQueue];
                        for (const item of items) {
                          await retryFailedSyncItem(item.id);
                        }
                      }} className="rounded bg-violet-600 px-2 py-1 text-xs text-white hover:bg-violet-500 transition">
                        Retry All
                      </button>
                      <button onClick={clearFailedSyncQueue} className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition">
                        Clear All
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                    <h4 className="mb-1 text-sm font-medium text-red-400">Danger Zone</h4>
                    <p className="mb-3 text-xs text-gray-500">Reset all data back to defaults. This cannot be undone.</p>
                    <button onClick={() => { localStorage.removeItem('clickhub-storage'); window.location.reload(); }}
                      className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/30">
                      Reset All Data
                    </button>
                  </div>
                  <div className="rounded-lg border border-gray-700 p-4">
                    <h4 className="mb-1 text-sm font-medium text-gray-300">Account</h4>
                    <p className="mb-3 text-xs text-gray-500">Sign out of your account.</p>
                    <button onClick={() => { logout(); setShowSettingsModal(false); }}
                      className="flex items-center gap-1.5 rounded-lg bg-gray-700/50 px-3 py-1.5 text-xs text-gray-300 hover:text-white">
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-white">System Branding & Labels</h3>
                <p className="mb-4 text-xs text-gray-400">Sesuaikan logo dan nama pabrik/perusahaan yang akan dicetak di stiker thermal asset secara dinamis.</p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Nama Perusahaan / Pabrik</label>
                    <input 
                      value={tempCompanyName} 
                      onChange={e => setTempCompanyName(e.target.value)} 
                      placeholder="Contoh: NEXCORP" 
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" 
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Logo Perusahaan (JPG/PNG)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                        id="branding-logo-upload" 
                      />
                      <label 
                        htmlFor="branding-logo-upload" 
                        className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 px-3 py-2 text-xs text-white transition-colors"
                      >
                        <Image size={14} /> Pilih Logo
                      </label>
                      {tempLogoBase64 && (
                        <button 
                          onClick={() => setTempLogoBase64('')} 
                          className="rounded-lg bg-rose-950/30 border border-rose-900/50 hover:bg-rose-900/30 px-3 py-2 text-xs text-rose-450 transition-colors"
                        >
                          <Trash2 size={12} className="inline mr-1" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview Area */}
                  <div className="border border-gray-800 rounded-xl bg-gray-900/50 p-4 flex flex-col items-center gap-3">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Pratinjau Label Stiker</p>
                    <div className="w-56 h-32 border border-gray-400 bg-white rounded-md p-2 text-black flex flex-col justify-between select-none">
                      <div className="text-[9px] font-black text-center border-b border-black pb-0.5 uppercase tracking-widest flex items-center justify-center gap-1">
                        {tempLogoBase64 ? (
                          <img src={tempLogoBase64} alt="Logo" className="h-3.5 object-contain" />
                        ) : null}
                        <span>{tempCompanyName || 'CLICKHUB'} IT ASSET</span>
                      </div>
                      <div className="flex flex-1 mt-1.5 gap-2 items-center">
                        <div className="flex-1 flex flex-col justify-between h-full text-[8px] font-medium leading-tight">
                          <div>
                            <p className="font-bold text-[9px]">Dell Latitude 5540</p>
                            <p className="text-gray-600 mt-0.5">Brand: Dell</p>
                            <p className="text-gray-600">S/N: DL-5540-001</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-gray-500 font-bold bg-gray-200 px-1 py-0.5 rounded-sm inline-block">LAPTOP</p>
                          </div>
                        </div>
                        <div className="w-16 h-16 border border-gray-300 flex items-center justify-center rounded-xs p-0.5 bg-gray-50">
                          <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-80">
                            {[...Array(16)].map((_, i) => (
                              <div key={i} className={cn("rounded-xs", (i % 3 === 0 || i % 7 === 0 || i === 0 || i === 15) ? "bg-black" : "bg-transparent")} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleSaveBranding} 
                      className="rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors shadow"
                    >
                      Simpan Pengaturan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'changelog' && (
              <div className="flex flex-col h-[400px]">
                <h3 className="mb-1 text-sm font-semibold text-white">System Changelog & Updates</h3>
                <p className="mb-4 text-xs text-gray-400">Track all versions, features, updates, and database patches implemented in ClickHub.</p>
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[320px]">
                  {changelogData.map((item) => (
                    <div key={item.version} className="relative pl-5 border-l border-gray-800 last:border-0 pb-3">
                      <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-violet-500 ring-4 ring-[#1e2028]" />
                      
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-bold text-white font-mono">{item.version}</span>
                        <span className="text-[10px] text-gray-500">{item.date}</span>
                      </div>
                      
                      {item.added && item.added.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold text-emerald-450 uppercase tracking-wider block mb-0.5">Added</span>
                          <ul className="list-disc pl-4 text-xs text-gray-400 space-y-1">
                            {item.added.map((add, i) => (
                              <li key={i}>{add}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {item.fixed && item.fixed.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold text-amber-450 uppercase tracking-wider block mb-0.5">Fixed</span>
                          <ul className="list-disc pl-4 text-xs text-gray-400 space-y-1">
                            {item.fixed.map((fix, i) => (
                              <li key={i}>{fix}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.changed && item.changed.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold text-sky-450 uppercase tracking-wider block mb-0.5">Changed</span>
                          <ul className="list-disc pl-4 text-xs text-gray-400 space-y-1">
                            {item.changed.map((ch, i) => (
                              <li key={i}>{ch}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
