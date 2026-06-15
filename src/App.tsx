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
import LoginPage from './components/auth/LoginPage';
import TicketsPage from './components/nexhub/TicketsPage';
import AssetsPage from './components/nexhub/AssetsPage';
import KnowledgeBasePage from './components/nexhub/KnowledgeBasePage';
import AdminPage from './components/nexhub/AdminPage';
import ChatWidget from './components/nexhub/ChatWidget';
import ChatManagementPage from './components/nexhub/ChatManagementPage';
import ReportsPage from './components/nexhub/ReportsPage';
import EquipmentCheckoutPage from './components/nexhub/EquipmentCheckoutPage';
import GoodsReceiptPage from './components/nexhub/GoodsReceiptPage';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Toaster } from 'sonner';

export default function App() {
  const {
    viewMode, showTaskModal, showCreateTaskModal, activePage,
    showSettingsModal, isAuthenticated, theme, hasRole, loadAllData
  } = useStore();

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
        return <TicketsPage />;
      case 'assets':
        return !hasRole(['EMPLOYEE']) ? <AssetsPage /> : <HomePage />;
      case 'knowledge':
        return <KnowledgeBasePage />;
      case 'chat_admin':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? <ChatManagementPage /> : <HomePage />;
      case 'reports':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? <ReportsPage /> : <HomePage />;
      case 'checkout':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? <EquipmentCheckoutPage /> : <HomePage />;
      case 'receipt':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']) ? <GoodsReceiptPage /> : <HomePage />;
      case 'admin':
        return hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']) ? <AdminPage /> : <HomePage />;
      case 'my_tasks':
        return (
          <>
            <DashboardStats />
            {viewMode === 'board' && <BoardView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'calendar' && <CalendarView />}
          </>
        );
      case 'spaces':
        return !hasRole(['EMPLOYEE']) ? (
          <>
            <DashboardStats />
            {viewMode === 'board' && <BoardView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'calendar' && <CalendarView />}
          </>
        ) : <HomePage />;
      default:
        return (
          <>
            <DashboardStats />
            {viewMode === 'board' && <BoardView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'calendar' && <CalendarView />}
          </>
        );
    }
  };

  return (
    <div data-theme={theme} className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--c-text)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-main)]">
        <Header />
        <main className="flex-1 overflow-hidden">
          {renderMainContent()}
        </main>
      </div>
      {showTaskModal && <TaskDetailModal />}
      {showCreateTaskModal && <CreateTaskModal />}
      {showSettingsModal && <SettingsModal />}
      <ChatWidget />
      <Toaster richColors position="top-right" />
    </div>
  );
}
