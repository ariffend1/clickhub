import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BoardView from './components/tasks/BoardView';
import ListView from './components/tasks/ListView';
import CalendarView from './components/tasks/CalendarView';
import TaskDetailModal from './components/tasks/TaskDetailModal';
import CreateTaskModal from './components/tasks/CreateTaskModal';
import DashboardStats from './components/tasks/DashboardStats';
import HomePage from './components/pages/HomePage';
import InboxPage from './components/pages/InboxPage';
import DashboardsPage from './components/pages/DashboardsPage';
import SettingsModal from './components/layout/SettingsModal';
import TourGuide from './components/layout/TourGuide';
import LoginPage from './components/auth/LoginPage';
import TicketsPage from './components/clickhub/TicketsPage';
import AssetsPage from './components/clickhub/AssetsPage';
import KnowledgeBasePage from './components/clickhub/KnowledgeBasePage';
import AdminPage from './components/clickhub/AdminPage';
import ChatWidget from './components/clickhub/ChatWidget';
import ChatManagementPage from './components/clickhub/ChatManagementPage';
import ReportsPage from './components/clickhub/ReportsPage';
import EquipmentCheckoutPage from './components/clickhub/EquipmentCheckoutPage';
import GoodsReceiptPage from './components/clickhub/GoodsReceiptPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Toaster } from 'sonner';
import { isSupabaseConfigured } from './lib/supabase';
import { cn } from './utils/cn';

export default function App() {
  const {
    viewMode, showTaskModal, showCreateTaskModal, activePage,
    showSettingsModal, isAuthenticated, theme, hasRole, loadAllData
  } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100 font-sans w-full">
        <div className="w-full max-w-2xl rounded-2xl border border-rose-900/30 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Configuration Missing</h1>
              <p className="text-sm text-slate-400">ClickHub requires Supabase credentials to run.</p>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300">How to Fix This:</h2>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-450 leading-relaxed">
                <li>
                  Jika berjalan secara <strong>lokal</strong>, pastikan berkas <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-rose-450">.env</code> ada di direktori utama dan berisi kunci Supabase yang valid.
                </li>
                <li>
                  Jika berjalan di <strong>Vercel / Production</strong>, tambahkan variabel lingkungan (*Environment Variables*) berikut pada pengaturan proyek Vercel Anda:
                </li>
              </ol>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
              <div>
                <span className="text-rose-400 font-semibold">VITE_SUPABASE_URL</span>
                <span className="text-slate-500"> = </span>
                <span className="text-emerald-400">https://your-project.supabase.co</span>
              </div>
              <div>
                <span className="text-rose-400 font-semibold">VITE_SUPABASE_ANON_KEY</span>
                <span className="text-slate-500"> = </span>
                <span className="text-emerald-400">your-anon-public-key</span>
              </div>
              <div>
                <span className="text-rose-400 font-semibold">VITE_BYPASS_AUTH</span>
                <span className="text-slate-500"> = </span>
                <span className="text-emerald-400">false</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Note: Setelah menambahkan variabel lingkungan di Vercel, pastikan untuk memicu build/deploy ulang (*Redeploy*) agar perubahan diterapkan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  const renderMainContent = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'inbox':
        return <InboxPage />;
      case 'dashboards':
        return !hasRole(['EMPLOYEE']) ? <DashboardsPage /> : <HomePage />;
      case 'tickets':
        return (
          <ErrorBoundary>
            <TicketsPage />
          </ErrorBoundary>
        );
      case 'assets':
        return !hasRole(['EMPLOYEE']) ? (
          <ErrorBoundary>
            <AssetsPage />
          </ErrorBoundary>
        ) : <HomePage />;
      case 'knowledge':
        return <KnowledgeBasePage />;
      case 'chat_admin':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? <ChatManagementPage /> : <HomePage />;
      case 'reports':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? <ReportsPage /> : <HomePage />;
      case 'checkout':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? <EquipmentCheckoutPage /> : <HomePage />;
      case 'receipt':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? (
          <ErrorBoundary>
            <GoodsReceiptPage />
          </ErrorBoundary>
        ) : <HomePage />;
      case 'admin':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']) ? <AdminPage /> : <HomePage />;
      case 'my_tasks':
        return (
          <div className="flex flex-col h-full w-full overflow-hidden">
            <DashboardStats />
            {viewMode === 'board' && <BoardView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'calendar' && <CalendarView />}
          </div>
        );
      case 'spaces':
        return !hasRole(['EMPLOYEE']) ? (
          <div className="flex flex-col h-full w-full overflow-hidden">
            <DashboardStats />
            {viewMode === 'board' && <BoardView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'calendar' && <CalendarView />}
          </div>
        ) : <HomePage />;
      default:
        return (
          <div className="flex flex-col h-full w-full overflow-hidden">
            <DashboardStats />
            {viewMode === 'board' && <BoardView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'calendar' && <CalendarView />}
          </div>
        );
    }
  };

  return (
    <div data-theme={theme} className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--c-text)]">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full transition-transform duration-300 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-main)]">
        <Header onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-hidden">
          <div key={activePage} className="h-full w-full overflow-hidden animate-page-entry">
            {renderMainContent()}
          </div>
        </main>
      </div>
      {showTaskModal && <TaskDetailModal />}
      {showCreateTaskModal && <CreateTaskModal />}
      {showSettingsModal && <SettingsModal />}
      <ChatWidget />
      <TourGuide />
      <Toaster richColors position="top-right" />
    </div>
  );
}
