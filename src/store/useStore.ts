import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { ticketService } from '../services/ticketService';
import { taskService } from '../services/taskService';
import { assetService } from '../services/assetService';
import { operationsService } from '../services/operationsService';
import { chatService } from '../services/chatService';
import { knowledgeService } from '../services/knowledgeService';
import { userService } from '../services/userService';
import type {
  Task, Space, TaskList, Comment, Activity, User, Tag,
  TaskStatus, Priority, ViewMode, ActivePage, Notification,
  AuthUser, UserRole, Ticket, TicketStatus, TicketPriority, Asset, AssetStatus, Article, Attachment,
  ChatMessage, ChatSession, AuditLog, EquipmentCheckout, CheckoutItem, GoodsReceipt, Holiday, Inventory, MaintenanceSchedule,
  DirectoryCategory, DirectoryEntry, ConfigType,
  ChecklistTemplate, ChecklistTemplateItem, ChecklistSubmission, ChecklistSubmissionValue
} from '../types';
import { getEncryptedItem, STORAGE_KEYS } from '../utils/crypto';
import { compressImage } from '../utils/imageCompressor';

const calculateSlaDeadline = (priority: string, createdAt: string): string => {
  const date = new Date(createdAt);
  let hoursToAdd = 24; // default for Medium
  const p = priority.toUpperCase();
  if (p === 'CRITICAL' || p === 'URGENT') hoursToAdd = 2;
  else if (p === 'HIGH') hoursToAdd = 8;
  else if (p === 'MEDIUM') hoursToAdd = 24;
  else if (p === 'LOW') hoursToAdd = 48;

  date.setHours(date.getHours() + hoursToAdd);
  return date.toISOString();
};

const sanitizeDbId = (id: string | null | undefined, users?: User[]): string | null => {
  if (!id) return null;
  if (/^user-\d+$/.test(id)) {
    if (users && users.length > 0) {
      const dbUser = users.find(u => !/^user-\d+$/.test(u.id));
      if (dbUser) return dbUser.id;
    }
    return 'user-tech-001';
  }
  return id;
};

const sanitizeNullableDbId = (id: string | null | undefined): string | null => {
  if (!id) return null;
  if (/^user-\d+$/.test(id)) {
    return null;
  }
  return id;
};

export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  payload: any;
  eqColumn?: string;
  eqValue?: any;
}

interface AppState {
  syncQueue: SyncQueueItem[];
  failedSyncQueue: (SyncQueueItem & { error?: string })[];
  enqueueWrite: (table: string, action: 'insert' | 'update' | 'delete', payload: any, eqColumn?: string, eqValue?: any) => Promise<void>;
  processSyncQueue: () => Promise<void>;
  retryFailedSyncItem: (id: string) => Promise<void>;
  discardFailedSyncItem: (id: string) => void;
  clearFailedSyncQueue: () => void;
  triggerTelegramAlert: (subject: string, message: string, severity?: 'INFO' | 'WARN' | 'HIGH') => Promise<void>;
  loadAllData: () => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  currentUser: User | null;
  registeredUsers: AuthUser[];
  spaces: Space[];
  lists: TaskList[];
  tasks: Task[];
  comments: Comment[];
  activities: Activity[];
  users: User[];
  tags: Tag[];
  notifications: Notification[];
  tickets: Ticket[];
  assets: Asset[];
  articles: Article[];
  partRequests: any[];
  stockRequests: any[];
  inventories: Inventory[];
  maintenanceSchedules: MaintenanceSchedule[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];
  equipmentCheckouts: EquipmentCheckout[];
  goodsReceipts: GoodsReceipt[];
  holidays: Holiday[];
  auditLogs: AuditLog[];
  directoryCategories: DirectoryCategory[];
  directoryEntries: DirectoryEntry[];
  activePage: ActivePage;
  selectedSpaceId: string | null;
  selectedListId: string | null;
  selectedTaskId: string | null;
  selectedTicketId: string | null;
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  searchQuery: string;
  filterPriority: Priority | 'all';
  filterAssignee: string | 'all';
  showTaskModal: boolean;
  showTicketModal: boolean;
  showCreateTaskModal: boolean;
  showCreateTicketModal: boolean;
  showNotifications: boolean;
  showSettingsModal: boolean;
  settingsActiveTab: string;
  archivedTicketsLoaded: boolean;
  showChatWidget: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActivePage: (page: ActivePage) => void;
  addSpace: (name: string, color: string, icon: string) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  deleteSpace: (id: string) => void;
  selectSpace: (id: string | null) => void;
  addList: (name: string, spaceId: string, color: string) => void;
  updateList: (id: string, updates: Partial<TaskList>) => void;
  deleteList: (id: string) => void;
  selectList: (id: string | null) => void;
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  selectTask: (id: string | null) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  addComment: (taskId: string, content: string) => void;
  deleteComment: (id: string) => void;
  addTag: (name: string, color: string) => void;
  deleteTag: (id: string) => void;
  addTicket: (ticket: Partial<Ticket>) => Promise<string>;
  uploadAttachment: (ticketId: string, file: File) => Promise<Attachment>;
  uploadChatFile: (sessionId: string, file: File) => Promise<{ fileUrl: string; fileName: string; fileType: string; fileSize: number }>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  requestDeleteAttachment: (attachmentId: string, reason: string) => Promise<void>;
  rejectDeleteAttachment: (attachmentId: string) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  deleteTicket: (id: string) => Promise<void>;
  approveDeleteTicket: (id: string) => Promise<void>;
  rejectDeleteTicket: (id: string, actionType: 'ARCHIVE' | 'RESTORE') => Promise<void>;
  submitTicketFeedback: (ticketId: string, rating: number, feedback: string) => Promise<void>;
  selectTicket: (id: string | null) => void;
  addAsset: (asset: Partial<Asset>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addMaintenanceSchedule: (schedule: Partial<MaintenanceSchedule>) => Promise<void>;
  updateMaintenanceSchedule: (id: string, updates: Partial<MaintenanceSchedule>) => Promise<void>;
  deleteMaintenanceSchedule: (id: string) => Promise<void>;
  processMaintenanceSchedules: () => Promise<void>;
  addArticle: (article: Partial<Article>) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  createChatSession: () => Promise<void>;
  sendChatMessage: (sessionId: string, content: string, fileDetails?: { fileUrl?: string; fileName?: string; fileType?: string; fileSize?: number }) => Promise<void>;
  closeChatSession: (sessionId: string) => Promise<void>;
  requestCloseChatSession: (sessionId: string) => Promise<void>;
  confirmCloseChatSession: (sessionId: string) => Promise<void>;
  rejectCloseChatSession: (sessionId: string) => Promise<void>;
  claimChatSession: (sessionId: string) => Promise<void>;
  sendChatReply: (sessionId: string, content: string, fileDetails?: { fileUrl?: string; fileName?: string; fileType?: string; fileSize?: number }) => Promise<void>;
  subscribeChatMessages: (sessionId: string, onMessageReceived?: (msg: ChatMessage) => void) => () => void;
  subscribeChatSessions: () => () => void;
  convertChatToTicket: (sessionId: string) => Promise<void>;
  addEquipmentCheckout: (data: { items: { assetId: string | null; inventoryId: string | null; quantity: number }[]; purpose: string; expectedReturn: string }) => Promise<void>;
  approveEquipmentCheckout: (id: string) => Promise<void>;
  returnEquipmentItem: (checkoutId: string, itemId: string, condition: 'GOOD' | 'DAMAGED' | 'BROKEN', notes: string) => Promise<void>;
  adminAddUser: (name: string, email: string, password: string, role: UserRole, department?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  addGoodsReceipt: (data: { receiptNumber: string; purchaseRequestId: string | null; itemName: string; quantityOrdered: number; quantityReceived: number; destinationType: 'ASSET' | 'INVENTORY'; inventoryId?: string | null; assetId?: string | null; condition: 'GOOD' | 'DAMAGED' | 'INCOMPLETE'; notes?: string; assetSerialNumber?: string | null; assetLocation?: string | null; price?: number }) => Promise<void>;
  addInventoryMaster: (data: { name: string; sku: string; unit: string; location: string; minStock: number; description?: string }) => Promise<void>;
  updateInventoryMaster: (id: string, updates: Partial<{ name: string; sku: string; unit: string; location: string; minStock: number; description?: string }>) => Promise<void>;
  deleteInventoryMaster: (id: string) => Promise<void>;
  verifyInventoryItem: (id: string) => Promise<void>;
  addDirectoryConfig: (name: string, type: ConfigType, categoryName: string, value: string, notes: string, linkedAssetId: string) => Promise<void>;
  deleteDirectoryConfig: (id: string) => Promise<void>;
  requestDeleteDirectoryConfig: (id: string) => Promise<void>;
  approveDeleteDirectoryConfig: (id: string) => Promise<void>;
  rejectDeleteDirectoryConfig: (id: string) => Promise<void>;
  deleteDirectoryCategory: (id: string) => Promise<void>;
  addDirectoryCategory: (name: string) => Promise<DirectoryCategory>;
  addAuditLog: (action: string, details: string) => void;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setFilterPriority: (priority: Priority | 'all') => void;
  setFilterAssignee: (assignee: string | 'all') => void;
  setShowTaskModal: (show: boolean) => void;
  setShowTicketModal: (show: boolean) => void;
  setShowCreateTaskModal: (show: boolean) => void;
  setShowCreateTicketModal: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setShowSettingsModal: (show: boolean, tab?: string) => void;
  setShowChatWidget: (show: boolean) => void;
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  getTaskComments: (taskId: string) => Comment[];
  getSpaceLists: (spaceId: string) => TaskList[];
  getUserById: (id: string) => User | undefined;
  getTagById: (id: string) => Tag | undefined;
  getUnreadNotificationCount: () => number;
  getMyTasks: () => Task[];
  getInboxItems: () => (Comment & { task?: Task })[];
  hasRole: (roles: UserRole[]) => boolean;
  addPartRequest: (inventoryId: string, quantity: number, notes: string, taskId?: string, ticketId?: string) => Promise<void>;
  addStockRequest: (data: { type: 'RESTOCK' | 'NEW_ITEM'; inventoryId?: string; itemName: string; itemDescription?: string; category?: string; quantity: number; estimatedPrice?: number; reason: string }) => Promise<void>;
  approvePartRequest: (id: string) => Promise<void>;
  loadAllArchivedTickets: () => Promise<void>;
  systemCompanyName: string;
  systemLogoBase64: string;
  loadBrandingSettings: () => Promise<void>;
  updateBrandingSettings: (companyName: string, logoBase64: string) => Promise<void>;
  checklistTemplates: ChecklistTemplate[];
  checklistSubmissions: ChecklistSubmission[];
  addChecklistTemplate: (name: string, description: string, items: { question: string; priorityOnFailure: TicketPriority; category: string; order: number }[]) => Promise<void>;
  updateChecklistTemplate: (id: string, updates: Partial<ChecklistTemplate> & { items?: Omit<ChecklistTemplateItem, 'templateId'>[] }) => Promise<void>;
  deleteChecklistTemplate: (id: string) => Promise<void>;
  submitChecklist: (taskId: string, templateId: string, values: { itemId: string; value: 'OK' | 'FAIL'; notes?: string }[]) => Promise<void>;
  addTicketHelper: (ticketId: string, helperId: string) => Promise<void>;
  requestAssigneeChange: (ticketId: string, reason: string) => Promise<void>;
}

const defaultUsers: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john@clickhub.com', avatar: '', color: '#7C3AED', role: 'ROOT', department: 'IT', phone: '+62811', isActive: true },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@clickhub.com', avatar: '', color: '#EC4899', role: 'ADMIN', department: 'IT', phone: '+62812', isActive: true },
  { id: 'user-3', name: 'Bob Wilson', email: 'bob@clickhub.com', avatar: '', color: '#F59E0B', role: 'MANAGER', department: 'Engineering', phone: '+62813', isActive: true },
  { id: 'user-4', name: 'Alice Brown', email: 'alice@clickhub.com', avatar: '', color: '#10B981', role: 'TECHNICIAN', department: 'IT Support', phone: '+62814', isActive: true },
  { id: 'user-5', name: 'Charlie Davis', email: 'charlie@clickhub.com', avatar: '', color: '#3B82F6', role: 'EMPLOYEE', department: 'Marketing', phone: '+62815', isActive: true },
  { id: '09364ded-3fd0-48ac-9bf2-19b807c20748', name: 'Test Employee', email: 'employee-test@ithub.com', avatar: '', color: '#3B82F6', role: 'EMPLOYEE', department: 'Marketing', phone: '08123456789', isActive: true },
  { id: 'f810e5a9-0397-40b8-98dd-b11580d27fd9', name: 'Teknisi Test', email: 'tech@ithub.com', avatar: '', color: '#10B981', role: 'TECHNICIAN', department: 'IT Support', phone: '08123456780', isActive: true },
  { id: 'afc2a734-006a-4191-af89-3aee6c5f3dc1', name: 'Manager Test', email: 'manager@ithub.com', avatar: '', color: '#F59E0B', role: 'MANAGER', department: 'IT Management', phone: '08123456781', isActive: true },
];

const defaultRegisteredUsers: AuthUser[] = [
  { id: 'user-1', name: 'John Doe', email: 'john@clickhub.com', avatar: '', color: '#7C3AED', password: 'password123', role: 'ROOT', department: 'IT', isActive: true },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@clickhub.com', avatar: '', color: '#EC4899', password: 'password123', role: 'ADMIN', department: 'IT', isActive: true },
  { id: 'user-3', name: 'Bob Wilson', email: 'bob@clickhub.com', avatar: '', color: '#F59E0B', password: 'password123', role: 'MANAGER', department: 'Engineering', isActive: true },
  { id: 'user-4', name: 'Alice Brown', email: 'alice@clickhub.com', avatar: '', color: '#10B981', password: 'password123', role: 'TECHNICIAN', department: 'IT Support', isActive: true },
  { id: 'user-5', name: 'Charlie Davis', email: 'charlie@clickhub.com', avatar: '', color: '#3B82F6', password: 'password123', role: 'EMPLOYEE', department: 'Marketing', isActive: true },
  { id: '09364ded-3fd0-48ac-9bf2-19b807c20748', name: 'Test Employee', email: 'employee-test@ithub.com', avatar: '', color: '#3B82F6', password: 'password123', role: 'EMPLOYEE', department: 'Marketing', isActive: true },
  { id: 'f810e5a9-0397-40b8-98dd-b11580d27fd9', name: 'Teknisi Test', email: 'tech@ithub.com', avatar: '', color: '#10B981', password: 'password123', role: 'TECHNICIAN', department: 'IT Support', isActive: true },
  { id: 'afc2a734-006a-4191-af89-3aee6c5f3dc1', name: 'Manager Test', email: 'manager@ithub.com', avatar: '', color: '#F59E0B', password: 'password123', role: 'MANAGER', department: 'IT Management', isActive: true },
];

const defaultTags: Tag[] = [
  { id: 'tag-1', name: 'Bug', color: '#EF4444' },
  { id: 'tag-2', name: 'Feature', color: '#3B82F6' },
  { id: 'tag-3', name: 'Improvement', color: '#10B981' },
  { id: 'tag-4', name: 'Design', color: '#8B5CF6' },
  { id: 'tag-5', name: 'Documentation', color: '#F59E0B' },
  { id: 'tag-6', name: 'Research', color: '#EC4899' },
];

const defaultSpaces: Space[] = [
  { id: 'space-1', name: 'Engineering', color: '#7C3AED', icon: '🚀', order: 0 },
  { id: 'space-2', name: 'Marketing', color: '#EC4899', icon: '📢', order: 1 },
  { id: 'space-3', name: 'Design', color: '#F59E0B', icon: '🎨', order: 2 },
];

const defaultLists: TaskList[] = [
  { id: 'list-1', name: 'Sprint 24', color: '#7C3AED', spaceId: 'space-1', order: 0 },
  { id: 'list-2', name: 'Backlog', color: '#6B7280', spaceId: 'space-1', order: 1 },
  { id: 'list-3', name: 'Campaign Q1', color: '#EC4899', spaceId: 'space-2', order: 0 },
  { id: 'list-4', name: 'UI Redesign', color: '#F59E0B', spaceId: 'space-3', order: 0 },
];

const defaultTasks: Task[] = [
  { id: 'task-1', title: 'Setup CI/CD Pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', status: 'in_progress', priority: 'high', assigneeIds: ['user-1', 'user-2'], tags: ['tag-2'], subtasks: [{ id: 'st-1', title: 'Setup GitHub Actions workflow', completed: true }, { id: 'st-2', title: 'Configure staging environment', completed: false }], dueDate: '2026-06-15', createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z', spaceId: 'space-1', listId: 'list-1', order: 0, timeEstimate: 480, timeTracked: 240 },
  { id: 'task-2', title: 'Fix Authentication Bug', description: 'Users getting logged out randomly.', status: 'todo', priority: 'urgent', assigneeIds: ['user-1'], tags: ['tag-1'], subtasks: [{ id: 'st-4', title: 'Reproduce issue', completed: true }, { id: 'st-5', title: 'Debug token refresh', completed: false }], dueDate: '2026-05-25', createdAt: '2026-05-18T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z', spaceId: 'space-1', listId: 'list-1', order: 1, timeEstimate: 240, timeTracked: 60 },
  { id: 'task-3', title: 'Design Landing Page', description: 'Create modern landing page.', status: 'in_review', priority: 'high', assigneeIds: ['user-3', 'user-4'], tags: ['tag-4'], subtasks: [{ id: 'st-6', title: 'Wireframe', completed: true }, { id: 'st-7', title: 'High-fidelity mockup', completed: true }], dueDate: '2026-05-28', createdAt: '2026-05-10T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z', spaceId: 'space-3', listId: 'list-4', order: 0, timeEstimate: 960, timeTracked: 720 },
  { id: 'task-4', title: 'Write API Documentation', description: 'Document all REST API endpoints.', status: 'todo', priority: 'normal', assigneeIds: ['user-2'], tags: ['tag-5'], subtasks: [], dueDate: '2026-06-01', createdAt: '2026-05-15T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z', spaceId: 'space-1', listId: 'list-2', order: 0, timeEstimate: 360, timeTracked: 0 },
  { id: 'task-5', title: 'Social Media Campaign', description: 'Plan social media campaign for product launch.', status: 'in_progress', priority: 'high', assigneeIds: ['user-5'], tags: ['tag-2'], subtasks: [{ id: 'st-9', title: 'Content calendar', completed: true }, { id: 'st-10', title: 'Design assets', completed: false }], dueDate: '2026-06-10', createdAt: '2026-05-12T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z', spaceId: 'space-2', listId: 'list-3', order: 0, timeEstimate: 600, timeTracked: 180 },
  { id: 'task-6', title: 'Database Optimization', description: 'Optimize slow queries.', status: 'done', priority: 'high', assigneeIds: ['user-1'], tags: ['tag-3'], subtasks: [{ id: 'st-12', title: 'Identify slow queries', completed: true }, { id: 'st-13', title: 'Add indexes', completed: true }], dueDate: '2026-05-20', createdAt: '2026-05-05T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z', spaceId: 'space-1', listId: 'list-1', order: 2, timeEstimate: 480, timeTracked: 420 },
];

const defaultComments: Comment[] = [
  { id: 'com-1', taskId: 'task-1', userId: 'user-2', content: 'Started working on the GitHub Actions workflow.', createdAt: '2026-05-19T14:30:00Z' },
  { id: 'com-2', taskId: 'task-1', userId: 'user-1', content: 'Include test suite in pipeline. Need 80% coverage.', createdAt: '2026-05-19T15:00:00Z' },
];

const defaultActivities: Activity[] = [
  { id: 'act-1', type: 'created', taskId: 'task-1', userId: 'user-1', description: 'created task "Setup CI/CD Pipeline"', createdAt: '2026-05-01T10:00:00Z' },
  { id: 'act-2', type: 'moved', taskId: 'task-1', userId: 'user-1', description: 'moved task to "In Progress"', createdAt: '2026-05-15T10:00:00Z' },
];

const defaultNotifications: Notification[] = [
  { id: 'notif-1', type: 'assigned', title: 'New Assignment', message: 'Jane assigned you to "Setup CI/CD Pipeline"', taskId: 'task-1', read: false, createdAt: '2026-05-20T10:00:00Z' },
  { id: 'notif-2', type: 'ticket_assigned', title: 'New Ticket', message: 'Ticket #TK-001 assigned to you', ticketId: 'ticket-1', read: false, createdAt: '2026-05-20T08:00:00Z' },
  { id: 'notif-3', type: 'asset_alert', title: 'Asset Maintenance', message: 'Dell Latitude 5540 maintenance due in 3 days', read: false, createdAt: '2026-05-22T08:00:00Z' },
];

const defaultTickets: Ticket[] = [
  { id: 'ticket-1', title: 'VPN Connection Issues', description: 'Unable to connect to VPN since this morning. Error code 789.', status: 'OPEN', priority: 'HIGH', type: 'Incident', reporterId: 'user-5', assigneeId: 'user-4', category: 'Network', createdAt: '2026-05-20T08:00:00Z', updatedAt: '2026-05-20T08:00:00Z', resolvedAt: null },
  { id: 'ticket-2', title: 'Email Server Down', description: 'Company email server not responding since 9 AM.', status: 'IN_PROGRESS', priority: 'CRITICAL', type: 'Incident', reporterId: 'user-3', assigneeId: 'user-1', category: 'Server', createdAt: '2026-05-19T09:00:00Z', updatedAt: '2026-05-20T10:00:00Z', resolvedAt: null },
  { id: 'ticket-3', title: 'New Laptop Request', description: 'Need new laptop for new hire starting next week.', status: 'OPEN', priority: 'MEDIUM', type: 'Service Request', reporterId: 'user-3', assigneeId: 'user-2', category: 'Hardware', createdAt: '2026-05-18T14:00:00Z', updatedAt: '2026-05-18T14:00:00Z', resolvedAt: null },
  { id: 'ticket-4', title: 'Printer Not Working', description: '3rd floor printer showing offline.', status: 'RESOLVED', priority: 'LOW', type: 'Incident', reporterId: 'user-5', assigneeId: 'user-4', category: 'Hardware', createdAt: '2026-05-17T11:00:00Z', updatedAt: '2026-05-18T10:00:00Z', resolvedAt: '2026-05-18T10:00:00Z' },
  { id: 'ticket-5', title: 'Software License Renewal', description: 'Adobe Creative Cloud licenses expiring end of month.', status: 'OPEN', priority: 'MEDIUM', type: 'Service Request', reporterId: 'user-2', assigneeId: null, category: 'Software', createdAt: '2026-05-16T09:00:00Z', updatedAt: '2026-05-16T09:00:00Z', resolvedAt: null },
  { id: 'ticket-6', title: 'WiFi Access Point Failure', description: 'Meeting room AP not broadcasting. Users unable to connect.', status: 'CLOSED', priority: 'HIGH', type: 'Incident', reporterId: 'user-4', assigneeId: 'user-1', category: 'Network', createdAt: '2026-05-15T08:00:00Z', updatedAt: '2026-05-16T14:00:00Z', resolvedAt: '2026-05-16T14:00:00Z' },
];

const defaultAssets: Asset[] = [
  { id: 'asset-1', name: 'Dell Latitude 5540', brand: 'Dell', type: 'Laptop', serialNumber: 'DL-5540-001', location: 'Office A - Floor 3', status: 'DEPLOYED', purchaseDate: '2025-03-15', price: 15000000, vendor: 'Dell Indonesia', assignedToId: 'user-1', specs: { processor: 'Intel i7-1365U', ram: '16GB DDR5', storage: '512GB NVMe', os: 'Windows 11 Pro' }, createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'asset-2', name: 'MacBook Pro 14"', brand: 'Apple', type: 'Laptop', serialNumber: 'AP-MBP14-002', location: 'Office A - Floor 2', status: 'DEPLOYED', purchaseDate: '2025-06-01', price: 35000000, vendor: 'Apple Store', assignedToId: 'user-3', specs: { processor: 'Apple M3 Pro', ram: '18GB', storage: '512GB SSD', os: 'macOS Sonoma' }, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'asset-3', name: 'HP ProDesk 400', brand: 'HP', type: 'Desktop', serialNumber: 'HP-PD400-003', location: 'IT Room', status: 'IN_STORAGE', purchaseDate: '2024-09-10', price: 8000000, vendor: 'HP Indonesia', assignedToId: null, specs: { processor: 'Intel i5-13500', ram: '8GB DDR4', storage: '256GB SSD', os: 'Windows 11 Pro' }, createdAt: '2024-09-10T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'asset-4', name: 'Cisco Catalyst 9200', brand: 'Cisco', type: 'Switch', serialNumber: 'CS-9200-004', location: 'Server Room', status: 'DEPLOYED', purchaseDate: '2024-01-20', price: 25000000, vendor: 'Cisco Indonesia', assignedToId: null, specs: { processor: '-', ram: '-', storage: '-', ipAddress: '192.168.1.1' }, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'asset-5', name: 'Epson EcoTank L3250', brand: 'Epson', type: 'Printer', serialNumber: 'EP-ET3250-005', location: 'Office A - Floor 1', status: 'DEPLOYED', purchaseDate: '2025-02-05', price: 3500000, vendor: 'Epson Indonesia', assignedToId: null, specs: {}, createdAt: '2025-02-05T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'asset-6', name: 'Dell PowerEdge R750', brand: 'Dell', type: 'Server', serialNumber: 'DL-PE750-006', location: 'Server Room', status: 'DEPLOYED', purchaseDate: '2024-06-15', price: 85000000, vendor: 'Dell Indonesia', assignedToId: null, specs: { processor: 'Intel Xeon Gold 6338', ram: '128GB DDR4', storage: '4x 1TB NVMe RAID 10', ipAddress: '10.0.0.1' }, createdAt: '2024-06-15T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'asset-7', name: 'ThinkPad X1 Carbon', brand: 'Lenovo', type: 'Laptop', serialNumber: 'LN-X1C-007', location: 'Warehouse', status: 'MAINTENANCE', purchaseDate: '2024-08-22', price: 22000000, vendor: 'Lenovo Indonesia', assignedToId: null, specs: { processor: 'Intel i7-1365U', ram: '16GB LPDDR5', storage: '512GB SSD', os: 'Windows 11 Pro' }, createdAt: '2024-08-22T00:00:00Z', updatedAt: '2026-05-10T00:00:00Z' },
];

const defaultArticles: Article[] = [
  { id: 'art-1', title: 'How to Connect VPN', content: '# VPN Connection Guide\n\n1. Open Cisco AnyConnect\n2. Enter server: vpn.company.com\n3. Use your AD credentials\n4. Click Connect\n\nIf you encounter error 789, try restarting the VPN service.', category: 'Network', isPublic: true, authorId: 'user-1', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'art-2', title: 'Printer Setup Guide', content: '# Printer Setup\n\n1. Go to Settings > Printers\n2. Click Add Printer\n3. Search for printer on network\n4. Install drivers automatically', category: 'Hardware', isPublic: true, authorId: 'user-4', createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'art-3', title: 'Email Configuration', content: '# Email Setup\n\n- Server: mail.company.com\n- Port: 993 (IMAP) / 587 (SMTP)\n- Use full email as username', category: 'Software', isPublic: true, authorId: 'user-2', createdAt: '2026-03-05T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'art-4', title: 'Onboarding Checklist for IT', content: '# New Employee IT Checklist\n\n- [ ] Create AD account\n- [ ] Assign laptop\n- [ ] Setup email\n- [ ] Install standard software\n- [ ] Grant VPN access\n- [ ] Add to relevant groups', category: 'Policy', isPublic: false, authorId: 'user-1', createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
];

const defaultAuditLogs: AuditLog[] = [
  { id: 'log-1', action: 'TICKET_CREATED', details: 'Ticket "VPN Connection Issues" created', userId: 'user-5', createdAt: '2026-05-20T08:00:00Z' },
  { id: 'log-2', action: 'ASSET_ASSIGNED', details: 'Dell Latitude 5540 assigned to John Doe', userId: 'user-2', createdAt: '2026-05-19T14:00:00Z' },
  { id: 'log-3', action: 'USER_LOGIN', details: 'Jane Smith logged in', userId: 'user-2', createdAt: '2026-05-20T07:30:00Z' },
  { id: 'log-4', action: 'TICKET_RESOLVED', details: 'Ticket "Printer Not Working" resolved by Alice Brown', userId: 'user-4', createdAt: '2026-05-18T10:00:00Z' },
];

const sendTelegramAlertDirect = async (subject: string, message: string, severity: 'INFO' | 'WARN' | 'HIGH' = 'INFO'): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const webhookUrl = import.meta.env.VITE_TELEGRAM_WEBHOOK_URL || getEncryptedItem(STORAGE_KEYS.TELEGRAM_WEBHOOK_URL, 'TELEGRAM_WEBHOOK_URL') || 'http://192.168.5.9:8888/api/webhook/nms';
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'ClickHub',
        subject,
        message,
        severity
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return true;
    }
    console.warn('Failed to send Telegram notification to VM, trying direct fallback...');
  } catch (err) {
    console.warn('Error sending Telegram notification to VM, trying direct fallback...');
  }

  // Fallback: Send directly using Telegram Bot API
  try {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || getEncryptedItem(STORAGE_KEYS.TELEGRAM_BOT_TOKEN, 'TELEGRAM_BOT_TOKEN');
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || getEncryptedItem(STORAGE_KEYS.TELEGRAM_CHAT_ID, 'TELEGRAM_CHAT_ID');
    if (!token) {
      console.warn('Telegram direct fallback skipped: No TELEGRAM_BOT_TOKEN configured.');
      return false;
    }
    if (!chatId) {
      console.warn('Telegram direct fallback skipped: No TELEGRAM_CHAT_ID configured.');
      return false;
    }
    const formattedMessage = `*${subject}*\n\n${message}`.replace(/\*\*/g, '*');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'Markdown'
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (err) {
    console.error('Error sending direct Telegram message fallback:', err);
    return false;
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      isAuthenticated: false,
      currentUser: null,
      registeredUsers: defaultRegisteredUsers,
      syncQueue: [],
      failedSyncQueue: [],

      spaces: [],
      lists: [],
      tasks: [],
      comments: [],
      activities: [],
      users: defaultUsers,
      tags: [],
      notifications: [],

      tickets: [],
      assets: [],
      articles: [],
      partRequests: [],
      stockRequests: [],
      inventories: [],
      maintenanceSchedules: [],
      chatSessions: [],
      chatMessages: [],
      equipmentCheckouts: [],
      goodsReceipts: [],
      holidays: [],
      auditLogs: defaultAuditLogs,
      directoryCategories: [],
      directoryEntries: [],

      activePage: 'home',
      selectedSpaceId: 'space-1',
      selectedListId: null,
      selectedTaskId: null,
      selectedTicketId: null,
      viewMode: 'board',
      sidebarCollapsed: false,
      searchQuery: '',
      filterPriority: 'all',
      filterAssignee: 'all',
      showTaskModal: false,
      showTicketModal: false,
      showCreateTaskModal: false,
      showCreateTicketModal: false,
      showNotifications: false,
      showSettingsModal: false,
      settingsActiveTab: 'profile',
      archivedTicketsLoaded: false,
      showChatWidget: false,
      systemCompanyName: 'CLICKHUB',
      systemLogoBase64: '',
      checklistTemplates: [],
      checklistSubmissions: [],

      // SUPABASE LOAD DATA
      loadAllData: async () => {
        if (navigator.onLine) {
          try {
            await get().processSyncQueue();
          } catch (e) {
            console.error("SW: Offline sync queue error:", e);
          }
        }
        try {
          await get().loadBrandingSettings().catch(e => console.error(e));
          const cu = get().currentUser;
          const [
            dbUsers,
            dbSpaces,
            dbLists,
            dbTasks,
            dbTickets,
            dbAssets,
            dbArticles,
            dbInventories_data,
            dbPartRequests_data,
            dbStockRequests_data,
            dbChatSessions_data,
            dbHolidays_data,
            dbCheckouts_data,
            dbCheckoutItems_data,
            dbReceipts_data,
            dbMaintenanceSchedules_data,
            dbNotifs,
            dbAttachments,
            dbDirCategories,
            dbDirEntries,
            dbAuditLogs
          ] = await Promise.all([
            userService.getUsers().catch(e => { console.error("Error loading users:", e); return []; }),
            taskService.getSpaces().catch(e => { console.error("Error loading spaces:", e); return []; }),
            taskService.getTaskLists().catch(e => { console.error("Error loading lists:", e); return []; }),
            taskService.getTasks().catch(e => { console.error("Error loading tasks:", e); return []; }),
            ticketService.getAllTickets().catch(e => { console.error("Error loading tickets:", e); return []; }),
            assetService.getAssets().catch(e => { console.error("Error loading assets:", e); return []; }),
            knowledgeService.getArticles().catch(e => { console.error("Error loading articles:", e); return []; }),
            assetService.getInventories().catch(e => { console.error("Error loading inventories:", e); return []; }),
            assetService.getPartRequests().catch(e => { console.error("Error loading part requests:", e); return []; }),
            assetService.getStockRequests().catch(e => { console.error("Error loading stock requests:", e); return []; }),
            chatService.getChatSessions().catch(e => { console.error("Error loading chat sessions:", e); return []; }),
            operationsService.getHolidays().catch(e => { console.error("Error loading holidays:", e); return []; }),
            operationsService.getEquipmentCheckouts().catch(e => { console.error("Error loading checkouts:", e); return []; }),
            operationsService.getCheckoutItems().catch(e => { console.error("Error loading checkout items:", e); return []; }),
            operationsService.getGoodsReceipts().catch(e => { console.error("Error loading goods receipts:", e); return []; }),
            assetService.getMaintenanceSchedules().catch(e => { console.error("Error loading maintenance schedules:", e); return []; }),
            cu ? userService.getNotifications(cu.id).catch(e => { console.error("Error loading notifications:", e); return []; }) : Promise.resolve([]),
            ticketService.getAttachments().catch(e => { console.error("Error loading attachments:", e); return []; }),
            assetService.getDirectoryCategories().catch(e => { console.error("Error loading dir categories:", e); return []; }),
            assetService.getDirectoryEntries().catch(e => { console.error("Error loading dir entries:", e); return []; }),
            userService.getAuditLogs().catch(e => { console.error("Error loading audit logs:", e); return []; })
          ]);

          const taskIds = (dbTasks || []).map(t => t.id);
          const sessionIds = (dbChatSessions_data || []).map(s => s.id);

          const [
            dbChecklists, 
            dbChatMessages_data,
            dbTemplates,
            dbTemplateItems,
            dbSubmissions,
            dbSubmissionValues
          ] = await Promise.all([
            taskService.getChecklists(taskIds).catch(e => { console.error("Error loading checklists:", e); return []; }),
            chatService.getChatMessages(sessionIds).catch(e => { console.error("Error loading chat messages:", e); return []; }),
            Promise.resolve(supabase.from('ChecklistTemplate').select('*')).catch(e => { console.error("Error loading templates:", e); return { data: [] as any }; }),
            Promise.resolve(supabase.from('ChecklistTemplateItem').select('*').order('order', { ascending: true })).catch(e => { console.error("Error loading template items:", e); return { data: [] as any }; }),
            Promise.resolve(supabase.from('ChecklistSubmission').select('*')).catch(e => { console.error("Error loading submissions:", e); return { data: [] as any }; }),
            Promise.resolve(supabase.from('ChecklistSubmissionValue').select('*')).catch(e => { console.error("Error loading submission values:", e); return { data: [] as any }; })
          ]);

          const mappedUsers = (dbUsers || []).map(u => ({
            id: u.id,
            name: u.name || 'No Name',
            email: u.email,
            avatar: u.profilePhoto || '',
            color: '#7C3AED',
            role: u.role as UserRole,
            department: u.department || 'IT',
            phone: u.phone || '',
            isActive: !u.isBlocked
          }));

          const mappedSpaces = (dbSpaces || []).map(s => ({
            id: s.id,
            name: s.name,
            color: s.color,
            icon: s.icon,
            order: s.order
          }));

          const mappedLists = (dbLists || []).map(l => ({
            id: l.id,
            name: l.name,
            color: l.color,
            spaceId: l.spaceId,
            order: l.order
          }));

          const mappedTasks = (dbTasks || []).map(t => {
            const taskChecklists = (dbChecklists || []).filter(c => c.taskId === t.id && c.isDeleted !== true);
            return {
              id: t.id,
              title: t.title,
              description: t.description || '',
              status: (t.status || 'TODO').toLowerCase() === 'review' ? 'in_review' : (t.status || 'TODO').toLowerCase() as TaskStatus,
              priority: (t.priority || 'MEDIUM').toLowerCase() as Priority,
              assigneeIds: t.assigneeIds && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []),
              tags: [],
              subtasks: taskChecklists.map(c => ({
                id: c.id,
                title: c.content,
                completed: c.isCompleted
              })),
              dueDate: t.dueDate || null,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              spaceId: t.spaceId || '',
              listId: t.listId || '',
              order: 0,
              timeEstimate: 0,
              timeTracked: 0,
              ticketId: t.ticketId || null,
              isRecurring: !!t.isRecurring,
              recurInterval: t.recurInterval || 1,
              recurUnit: t.recurUnit || 'weeks',
              recurBehavior: t.recurBehavior || 'create_new',
              checklistTemplateId: t.checklistTemplateId || null
            };
          });

          const mappedTickets = (dbTickets || []).map(t => {
            const ticketAttachments = (dbAttachments || []).filter((a: any) => a.ticketId === t.id).map((a: any) => ({
              id: a.id,
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              fileType: a.fileType,
              fileSize: Number(a.fileSize),
              ticketId: a.ticketId,
              uploadedAt: a.uploadedAt,
              isDeleteRequested: !!a.isDeleteRequested,
              deleteReason: a.deleteReason || undefined,
              deleteRequestedById: a.deleteRequestedById || undefined,
              originalSize: a.originalSize ? Number(a.originalSize) : undefined
            }));
            return {
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status as TicketStatus,
              priority: t.priority as TicketPriority,
              reporterId: t.reporterId,
              assigneeId: t.assigneeId,
              helperAssigneeIds: t.helperAssigneeIds || [],
              category: t.category || 'General',
              assetId: t.assetId || null,
              slaDeadline: t.slaDeadline || null,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              resolvedAt: t.resolvedAt,
              isArchived: t.isArchived || false,
              isDeleteRequested: t.isDeleteRequested || false,
              csatRating: t.csatRating || null,
              csatFeedback: t.csatFeedback || null,
              attachments: ticketAttachments
            };
          });

          const mappedAssets = (dbAssets || []).map(a => ({
            id: a.id,
            name: a.name,
            brand: a.brand || '',
            type: a.type,
            serialNumber: a.serialNumber,
            location: a.location,
            status: a.status as AssetStatus,
            purchaseDate: a.purchaseDate,
            price: Number(a.price) || 0,
            vendor: a.vendor || '',
            assignedToId: null,
            specs: {
              processor: a.processor || undefined,
              ram: a.ramSize || undefined,
              storage: a.storageSize || undefined,
              os: a.osVersion || undefined,
              ipAddress: a.ipAddress || undefined
            },
            createdAt: a.createdAt,
            updatedAt: a.updatedAt
          }));

          const mappedArticles = (dbArticles || []).map(art => ({
            id: art.id,
            title: art.title,
            content: art.content,
            category: art.category,
            isPublic: art.isPublic,
            authorId: art.authorId,
            createdAt: art.createdAt,
            updatedAt: art.updatedAt
          }));

          const dbInventories = dbInventories_data || [];
          const dbPartRequests = dbPartRequests_data || [];
          const dbStockRequests = dbStockRequests_data || [];

          // Load ClickHub features data from Supabase
          const dbChatSessions = dbChatSessions_data || [];
          const dbChatMessages = dbChatMessages_data || [];
          const dbHolidays = dbHolidays_data || [];
          const dbCheckouts = dbCheckouts_data || [];
          const dbCheckoutItems = dbCheckoutItems_data || [];
          const dbReceipts = dbReceipts_data || [];

          const dbMaintenanceSchedules = dbMaintenanceSchedules_data || [];

          // Nest items inside checkouts
          const mappedCheckouts = (dbCheckouts || []).map(c => ({
            ...c,
            items: (dbCheckoutItems || []).filter(item => item.checkoutId === c.id)
          }));

          let mappedNotifications: Notification[] = [];
          if (dbNotifs && dbNotifs.length > 0) {
            mappedNotifications = dbNotifs.map(n => ({
              id: n.id,
              type: n.type === 'STOCK_ALERT' ? 'asset_alert' :
                    n.type === 'TICKET_ASSIGNED' ? 'ticket_assigned' :
                    n.type === 'SLA_WARNING' ? 'due_soon' :
                    n.type === 'COMMENT_NEW' ? 'commented' :
                    n.type === 'STATUS_CHANGE' ? 'status_changed' : 'assigned',
              title: n.title,
              message: n.message,
              read: n.isRead,
              createdAt: n.createdAt
            }));
          }

          const mappedTemplates: ChecklistTemplate[] = (dbTemplates?.data || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            createdAt: t.createdAt,
            items: (dbTemplateItems?.data || []).filter((item: any) => item.templateId === t.id).map((item: any) => ({
              id: item.id,
              templateId: item.templateId,
              question: item.question,
              priorityOnFailure: item.priorityOnFailure as TicketPriority,
              category: item.category,
              order: item.order
            }))
          }));

          const mappedSubmissions: ChecklistSubmission[] = (dbSubmissions?.data || []).map((s: any) => ({
            id: s.id,
            taskId: s.taskId,
            templateId: s.templateId,
            submittedById: s.submittedById,
            submittedAt: s.submittedAt,
            values: (dbSubmissionValues?.data || []).filter((v: any) => v.submissionId === s.id).map((v: any) => ({
              id: v.id,
              submissionId: v.submissionId,
              itemId: v.itemId,
              value: v.value as 'OK' | 'FAIL',
              notes: v.notes,
              createdTicketId: v.createdTicketId
            }))
          }));

          set({
            users: mappedUsers,
            spaces: mappedSpaces,
            lists: mappedLists,
            tasks: mappedTasks,
            tickets: mappedTickets,
            assets: mappedAssets,
            articles: mappedArticles,
            inventories: dbInventories || [],
            partRequests: dbPartRequests || [],
            stockRequests: dbStockRequests || [],
            chatSessions: dbChatSessions || [],
            chatMessages: dbChatMessages || [],
            checklistTemplates: mappedTemplates,
            checklistSubmissions: mappedSubmissions,
            holidays: (dbHolidays || []).map(h => ({
              id: h.id,
              name: h.name,
              date: h.date,
              year: h.year,
              isNational: h.isNational,
              isCutiBersama: h.isCutiBersama
            })),
            equipmentCheckouts: mappedCheckouts,
            goodsReceipts: dbReceipts || [],
            maintenanceSchedules: dbMaintenanceSchedules,
            notifications: mappedNotifications,
            directoryCategories: dbDirCategories || [],
            directoryEntries: dbDirEntries || [],
            auditLogs: (dbAuditLogs || []).map(log => ({
              id: log.id,
              action: log.action,
              details: log.details || '',
              userId: log.userId,
              createdAt: log.createdAt
            }))
          });

          // Run PM Scheduler Logic
          await get().processMaintenanceSchedules();
        } catch (err) {
          console.error("Error loading data from Supabase:", err);
        }
      },

      loadBrandingSettings: async () => {
        try {
          const { data, error } = await supabase
            .from('MasterData')
            .select('*')
            .eq('category', 'BRANDING');
          
          if (error) {
            console.error("Error loading branding settings:", error);
            return;
          }
          
          if (data && data.length > 0) {
            const companyNameRow = data.find(r => r.id === 'branding_company_name');
            const logoRow = data.find(r => r.id === 'branding_logo_base64');
            
            set({
              systemCompanyName: companyNameRow ? companyNameRow.name : 'CLICKHUB',
              systemLogoBase64: logoRow ? logoRow.name : ''
            });
          }
        } catch (err) {
          console.error("Failed to fetch branding from MasterData:", err);
        }
      },

      updateBrandingSettings: async (companyName, logoBase64) => {
        set({
          systemCompanyName: companyName,
          systemLogoBase64: logoBase64
        });
        
        try {
          const now = new Date().toISOString();
          const { error: err1 } = await supabase
            .from('MasterData')
            .upsert({
              id: 'branding_company_name',
              category: 'BRANDING',
              name: companyName,
              updatedAt: now
            });
            
          const { error: err2 } = await supabase
            .from('MasterData')
            .upsert({
              id: 'branding_logo_base64',
              category: 'BRANDING',
              name: logoBase64,
              updatedAt: now
            });
            
          if (err1 || err2) {
            console.error("Error saving branding settings to Supabase:", err1 || err2);
          }
        } catch (err) {
          console.error("Failed to upsert branding to MasterData:", err);
        }
      },

      addChecklistTemplate: async (name: string, description: string, items: { question: string; priorityOnFailure: TicketPriority; category: string; order: number }[]) => {
        try {
          const templateId = uuidv4();
          const { error: tErr } = await supabase.from('ChecklistTemplate').insert({
            id: templateId,
            name,
            description,
            createdAt: new Date().toISOString()
          });
          if (tErr) throw tErr;

          if (items.length > 0) {
            const dbItems = items.map((item, idx) => ({
              id: uuidv4(),
              templateId,
              question: item.question,
              priorityOnFailure: item.priorityOnFailure,
              category: item.category || 'General',
              order: item.order ?? idx
            }));
            const { error: iErr } = await supabase.from('ChecklistTemplateItem').insert(dbItems);
            if (iErr) throw iErr;
          }

          await get().loadAllData();
        } catch (err) {
          console.error("Failed to add checklist template:", err);
        }
      },

      updateChecklistTemplate: async (id: string, updates: Partial<ChecklistTemplate> & { items?: Omit<ChecklistTemplateItem, 'templateId'>[] }) => {
        try {
          if (updates.name || updates.description !== undefined) {
            const { error: tErr } = await supabase.from('ChecklistTemplate').update({
              name: updates.name,
              description: updates.description
            }).eq('id', id);
            if (tErr) throw tErr;
          }

          if (updates.items) {
            const { error: dErr } = await supabase.from('ChecklistTemplateItem').delete().eq('templateId', id);
            if (dErr) throw dErr;

            if (updates.items.length > 0) {
              const dbItems = updates.items.map((item, idx) => ({
                id: item.id || uuidv4(),
                templateId: id,
                question: item.question,
                priorityOnFailure: item.priorityOnFailure,
                category: item.category || 'General',
                order: item.order ?? idx
              }));
              const { error: iErr } = await supabase.from('ChecklistTemplateItem').insert(dbItems);
              if (iErr) throw iErr;
            }
          }

          await get().loadAllData();
        } catch (err) {
          console.error("Failed to update checklist template:", err);
        }
      },

      deleteChecklistTemplate: async (id: string) => {
        try {
          const { error } = await supabase.from('ChecklistTemplate').delete().eq('id', id);
          if (error) throw error;
          await get().loadAllData();
        } catch (err) {
          console.error("Failed to delete checklist template:", err);
        }
      },

      submitChecklist: async (taskId: string, templateId: string, values: { itemId: string; value: 'OK' | 'FAIL'; notes?: string }[]) => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) throw new Error("No authenticated user");

          const task = get().tasks.find(t => t.id === taskId);
          const template = get().checklistTemplates.find(t => t.id === templateId);
          const templateName = template ? template.name : 'Unknown Template';

          const submissionId = uuidv4();
          
          const { error: sErr } = await supabase.from('ChecklistSubmission').insert({
            id: submissionId,
            taskId,
            templateId,
            submittedById: currentUser.id,
            submittedAt: new Date().toISOString()
          });
          if (sErr) throw sErr;

          const submissionValues = [];
          for (const val of values) {
            const valId = uuidv4();
            let ticketId = null;

            if (val.value === 'FAIL') {
              const item = template?.items?.find(i => i.id === val.itemId);
              const question = item ? item.question : 'Unknown Question';
              const priority = item ? item.priorityOnFailure : 'MEDIUM';
              const category = item ? item.category : 'General';
              
              const newTicketId = uuidv4();
              ticketId = newTicketId;

              const { error: tErr } = await supabase.from('Ticket').insert({
                id: newTicketId,
                title: `Inspection Failure: ${templateName} - ${question}`,
                description: `Inspection item failed during task "${task ? task.title : taskId}" by ${currentUser.name}. Notes: ${val.notes || 'None'}`,
                status: 'OPEN',
                priority,
                reporterId: currentUser.id,
                assigneeId: currentUser.id,
                category,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              if (tErr) console.error("Auto ticket generation error:", tErr);
            }

            submissionValues.push({
              id: valId,
              submissionId,
              itemId: val.itemId,
              value: val.value,
              notes: val.notes || null,
              createdTicketId: ticketId
            });
          }

          if (submissionValues.length > 0) {
            const { error: vErr } = await supabase.from('ChecklistSubmissionValue').insert(submissionValues);
            if (vErr) throw vErr;
          }

          if (task) {
            const { error: taskErr } = await supabase.from('Task').update({ status: 'DONE' }).eq('id', taskId);
            if (taskErr) throw taskErr;
          }

          await get().loadAllData();
        } catch (err) {
          console.error("Failed to submit checklist:", err);
        }
      },

      addTicketHelper: async (ticketId: string, helperId: string) => {
        try {
          const ticket = get().tickets.find(t => t.id === ticketId);
          if (!ticket) throw new Error("Ticket not found");

          const helpers = ticket.helperAssigneeIds ? [...ticket.helperAssigneeIds] : [];
          if (!helpers.includes(helperId)) {
            helpers.push(helperId);
          }

          const { error } = await supabase
            .from('Ticket')
            .update({ helperAssigneeIds: helpers })
            .eq('id', ticketId);

          if (error) throw error;

          // Send in-app notification to the helper
          const notif = {
            id: uuidv4(),
            userId: helperId,
            title: 'Kolaborasi Tiket (Helper)',
            message: `Mas Bos, Anda ditambahkan sebagai helper untuk membantu penyelesaian tiket: "${ticket.title}"`,
            type: 'TICKET_ASSIGNED',
            isRead: false,
            createdAt: new Date().toISOString()
          };
          await userService.insertNotifications([notif]).catch(e => console.error("Helper notification error:", e));

          await get().loadAllData();
        } catch (err) {
          console.error("Failed to add ticket helper:", err);
        }
      },

      requestAssigneeChange: async (ticketId: string, reason: string) => {
        try {
          const ticket = get().tickets.find(t => t.id === ticketId);
          if (!ticket) throw new Error("Ticket not found");

          const ticketNumber = ticket.ticketNumber || ticket.id.slice(0, 8).toUpperCase();
          const requesterName = get().currentUser?.name || 'Teknisi';

          // Get all managers, admins, super admins, and root users
          const managers = get().users.filter(u => ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(u.role));

          const notifications = managers.map(m => ({
            id: uuidv4(),
            userId: m.id,
            title: 'Pengajuan Pergantian Assignee',
            message: `${requesterName} mengajukan pergantian assignee untuk tiket #${ticketNumber}. Alasan: "${reason}"`,
            type: 'TICKET_ASSIGNED' as const,
            isRead: false,
            createdAt: new Date().toISOString()
          }));

          if (notifications.length > 0) {
            await userService.insertNotifications(notifications);
          }
          await get().loadAllData();
        } catch (err) {
          console.error("Failed to submit assignee change request:", err);
          throw err;
        }
      },

      addDirectoryCategory: async (name: string) => {
        const id = uuidv4();
        const payload = {
          id,
          name,
          icon: 'folder',
          color: '#6B7280',
          order: 0,
          visibility: 'PUBLIC'
        };
        try {
          const data = await assetService.insertDirectoryCategory(payload);
          await get().loadAllData();
          return data;
        } catch (e) {
          console.error("Error creating directory category:", e);
          throw e;
        }
      },

      addDirectoryConfig: async (name, type: ConfigType, categoryName, value, notes, linkedAssetId) => {
        let category = get().directoryCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        let categoryId = category?.id;
        
        if (!categoryId) {
          const newCat = await get().addDirectoryCategory(categoryName);
          categoryId = newCat.id;
        }

        const id = uuidv4();
        const payload = {
          id,
          categoryId,
          name,
          value,
          description: notes || null,
          location: `${type}:${linkedAssetId || ''}`,
          isPublic: true
        };

        try {
          await assetService.insertDirectoryEntry(payload);
          get().addAuditLog('DIRECTORY_CONFIG_CREATED', `Config ${name} created in group ${categoryName}`);
          await get().loadAllData();
        } catch (e) {
          console.error("Error creating directory config:", e);
          throw e;
        }
      },

      deleteDirectoryConfig: async (id: string) => {
        try {
          await assetService.deleteDirectoryEntry(id);
          get().addAuditLog('DIRECTORY_CONFIG_DELETED', `Config ${id} deleted`);
          await get().loadAllData();
        } catch (e) {
          console.error("Error deleting directory config:", e);
          throw e;
        }
      },

      requestDeleteDirectoryConfig: async (id: string) => {
        const entry = get().directoryEntries.find(e => e.id === id);
        if (!entry) return;
        const [type, assetId] = entry.location ? entry.location.split(':') : ['SERVER_PHYSICAL', ''];
        const cu = get().currentUser;
        const newLocation = `${type}:${assetId || ''}:PENDING_DELETE:${cu?.id || 'unknown'}`;
        
        try {
          const { error } = await supabase
            .from('DirectoryEntry')
            .update({ location: newLocation, updatedAt: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
          get().addAuditLog('DIRECTORY_CONFIG_DELETE_REQUESTED', `Config ${entry.name} delete requested`);
          await get().loadAllData();
        } catch (e) {
          console.error("Error requesting directory config delete:", e);
          throw e;
        }
      },

      approveDeleteDirectoryConfig: async (id: string) => {
        try {
          const entry = get().directoryEntries.find(e => e.id === id);
          await assetService.deleteDirectoryEntry(id);
          get().addAuditLog('DIRECTORY_CONFIG_DELETED', `Config ${entry?.name || id} deletion approved`);
          await get().loadAllData();
        } catch (e) {
          console.error("Error approving directory config delete:", e);
          throw e;
        }
      },

      rejectDeleteDirectoryConfig: async (id: string) => {
        const entry = get().directoryEntries.find(e => e.id === id);
        if (!entry) return;
        const [type, assetId] = entry.location ? entry.location.split(':') : ['SERVER_PHYSICAL', ''];
        const newLocation = `${type}:${assetId || ''}:ACTIVE`;

        try {
          const { error } = await supabase
            .from('DirectoryEntry')
            .update({ location: newLocation, updatedAt: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
          get().addAuditLog('DIRECTORY_CONFIG_DELETE_REJECTED', `Config ${entry.name} delete request rejected`);
          await get().loadAllData();
        } catch (e) {
          console.error("Error rejecting directory config delete:", e);
          throw e;
        }
      },

      deleteDirectoryCategory: async (id: string) => {
        try {
          await assetService.deleteDirectoryCategory(id);
          get().addAuditLog('DIRECTORY_CATEGORY_DELETED', `Directory category ${id} deleted`);
          await get().loadAllData();
        } catch (e) {
          console.error("Error deleting directory category:", e);
          throw e;
        }
      },

      enqueueWrite: async (table, action, payload, eqColumn, eqValue) => {
        const newItem = {
          id: uuidv4(),
          table,
          action,
          payload,
          eqColumn,
          eqValue
        };
        const currentQueue = get().syncQueue || [];
        set({ syncQueue: [...currentQueue, newItem] });
        if (navigator.onLine) {
          await get().processSyncQueue();
        }
      },

      processSyncQueue: async () => {
        const queue = get().syncQueue || [];
        if (queue.length === 0) return;
        const remainingQueue = [...queue];
        for (const item of queue) {
          try {
            let res;
            if (item.table === 'TelegramNotification') {
              sendTelegramAlertDirect(item.payload.subject, item.payload.message, item.payload.severity).catch(err => {
                console.error("Async Telegram alert failed:", err);
              });
            } else {
              const isTaskTable = ['Space', 'TaskList', 'Task', 'Checklist', 'Comment'].includes(item.table);
              if (isTaskTable) {
                if (item.action === 'insert') {
                  if (item.table === 'Space') await taskService.insertSpace(item.payload);
                  else if (item.table === 'TaskList') await taskService.insertTaskList(item.payload);
                  else if (item.table === 'Task') await taskService.insertTask(item.payload);
                  else if (item.table === 'Checklist') await taskService.insertChecklist(item.payload);
                  else if (item.table === 'Comment') await taskService.insertComment(item.payload);
                } else if (item.action === 'update') {
                  if (item.table === 'Space') await taskService.updateSpace(item.eqValue, item.payload);
                  else if (item.table === 'TaskList') await taskService.updateTaskList(item.eqValue, item.payload);
                  else if (item.table === 'Task') await taskService.updateTask(item.eqValue, item.payload);
                  else if (item.table === 'Checklist') await taskService.updateChecklist(item.eqValue, item.payload);
                } else if (item.action === 'delete') {
                  if (item.table === 'Space') await taskService.deleteSpace(item.eqValue);
                  else if (item.table === 'TaskList') await taskService.deleteTaskList(item.eqValue);
                  else if (item.table === 'Task') await taskService.deleteTask(item.eqValue);
                  else if (item.table === 'Checklist') await taskService.deleteChecklist(item.eqValue);
                  else if (item.table === 'Comment') await taskService.deleteComment(item.eqValue);
                }
              } else {
                const isAssetTable = ['Asset', 'Inventory', 'InventoryTransaction', 'PartRequest', 'StockRequest', 'MaintenanceSchedule'].includes(item.table);
                if (isAssetTable) {
                  if (item.action === 'insert') {
                    if (item.table === 'Asset') await assetService.insertAsset(item.payload);
                    else if (item.table === 'PartRequest') await assetService.insertPartRequest(item.payload);
                    else if (item.table === 'StockRequest') await assetService.insertStockRequest(item.payload);
                    else if (item.table === 'InventoryTransaction') await assetService.insertInventoryTransaction(item.payload);
                    else if (item.table === 'MaintenanceSchedule') await assetService.insertMaintenanceSchedule(item.payload);
                  } else if (item.action === 'update') {
                    if (item.table === 'Asset') await assetService.updateAsset(item.eqValue, item.payload);
                    else if (item.table === 'Inventory') await assetService.updateInventoryQuantity(item.eqValue, item.payload.quantity);
                    else if (item.table === 'PartRequest') await assetService.updatePartRequestStatus(item.eqValue, item.payload);
                    else if (item.table === 'StockRequest') await assetService.updateStockRequestStatus(item.eqValue, item.payload);
                    else if (item.table === 'MaintenanceSchedule') await assetService.updateMaintenanceSchedule(item.eqValue, item.payload);
                  } else if (item.action === 'delete') {
                    if (item.table === 'Asset') await assetService.deleteAsset(item.eqValue);
                    else if (item.table === 'MaintenanceSchedule') await assetService.deleteMaintenanceSchedule(item.eqValue);
                  }
                } else {
                  const isOperationsTable = ['EquipmentCheckout', 'CheckoutItem', 'GoodsReceipt'].includes(item.table);
                  const isKnowledgeTable = item.table === 'Article';
                  if (isOperationsTable) {
                    if (item.action === 'insert') {
                      if (item.table === 'EquipmentCheckout') await operationsService.insertEquipmentCheckout(item.payload);
                      else if (item.table === 'CheckoutItem') await operationsService.insertCheckoutItem(item.payload);
                      else if (item.table === 'GoodsReceipt') await operationsService.insertGoodsReceipt(item.payload);
                    } else if (item.action === 'update') {
                      if (item.table === 'EquipmentCheckout') await operationsService.updateEquipmentCheckout(item.eqValue, item.payload);
                      else if (item.table === 'CheckoutItem') await operationsService.updateCheckoutItem(item.eqValue, item.payload);
                    }
                  } else if (isKnowledgeTable) {
                    if (item.action === 'insert') {
                      await knowledgeService.insertArticle(item.payload);
                    } else if (item.action === 'update') {
                      await knowledgeService.updateArticle(item.eqValue, item.payload);
                    } else if (item.action === 'delete') {
                      await knowledgeService.deleteArticle(item.eqValue);
                    }
                  } else {
                    if (item.action === 'insert') {
                      res = await supabase.from(item.table).upsert([item.payload]);
                    } else if (item.action === 'update') {
                      res = await supabase.from(item.table).update(item.payload).eq(item.eqColumn!, item.eqValue);
                    } else if (item.action === 'delete') {
                      res = await supabase.from(item.table).delete().eq(item.eqColumn!, item.eqValue);
                    }
                    if (res && res.error) {
                      throw res.error;
                    }
                  }
                }
              }
            }
            // Remove from queue
            const index = remainingQueue.findIndex(q => q.id === item.id);
            if (index !== -1) {
              remainingQueue.splice(index, 1);
            }
          } catch (err: any) {
            console.error(`Sync failed for queue item ${item.id} on table ${item.table}:`, err);
            const isNetworkErr = 
              !navigator.onLine ||
              err?.message?.includes('fetch') || 
              err?.message?.includes('Network') || 
              err?.message?.includes('delivery failed') ||
              err?.message?.includes('timeout') ||
              err?.message?.includes('502') ||
              err?.message?.includes('503') ||
              err?.message?.includes('504') ||
              err?.message?.includes('Connection') ||
              err?.message?.includes('connection') ||
              err?.code === 'P0000' ||
              err?.status === 502 ||
              err?.status === 503 ||
              err?.status === 504;
            if (isNetworkErr) {
              break;
            } else {
              // Push to failedSyncQueue instead of silently discarding
              const failedItem = { ...item, error: err?.message || String(err) };
              set(state => ({ failedSyncQueue: [...(state.failedSyncQueue || []), failedItem] }));
              
              const index = remainingQueue.findIndex(q => q.id === item.id);
              if (index !== -1) {
                remainingQueue.splice(index, 1);
              }
            }
          }
        }
        set({ syncQueue: remainingQueue });
      },

      retryFailedSyncItem: async (id) => {
        const item = get().failedSyncQueue.find(q => q.id === id);
        if (!item) return;
        const { error, ...syncItem } = item as any;
        set(state => ({
          failedSyncQueue: state.failedSyncQueue.filter(q => q.id !== id),
          syncQueue: [...(state.syncQueue || []), syncItem]
        }));
        if (navigator.onLine) {
          await get().processSyncQueue();
        }
      },

      discardFailedSyncItem: (id) => {
        set(state => ({
          failedSyncQueue: state.failedSyncQueue.filter(q => q.id !== id)
        }));
      },

      clearFailedSyncQueue: () => {
        set({ failedSyncQueue: [] });
      },

      triggerTelegramAlert: async (subject, message, severity = 'INFO') => {
        if (navigator.onLine) {
          const success = await sendTelegramAlertDirect(subject, message, severity);
          if (success) return;
        }
        await get().enqueueWrite('TelegramNotification', 'insert', { subject, message, severity });
      },

      // AUTH ACTIONS
      login: async (email, password) => {
        if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
          const user = get().registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
          if (user) {
            const { password: _, ...userWithoutPassword } = user;
            set({ currentUser: userWithoutPassword });
            await get().loadAllData();
            set({ isAuthenticated: true });
            get().addAuditLog('USER_LOGIN', `${user.name} logged in (Bypass)`);
            return { success: true };
          }
          const dbUser = await userService.getUserByEmailMaybe(email);
          if (dbUser) {
            const mappedUser: User = {
              id: dbUser.id,
              name: dbUser.name || dbUser.email,
              email: dbUser.email,
              avatar: dbUser.profilePhoto || '',
              color: '#7C3AED',
              role: dbUser.role as UserRole,
              department: dbUser.department || 'IT',
              phone: dbUser.phone || '',
              isActive: !dbUser.isBlocked
            };
            set({ currentUser: mappedUser });
            await get().loadAllData();
            set({ isAuthenticated: true });
            get().addAuditLog('USER_LOGIN', `${mappedUser.name} logged in (Bypass DB)`);
            return { success: true };
          }
          return { success: false, error: 'Invalid email or password' };
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { success: false, error: error.message };
          if (data?.user) {
            const dbUser = await userService.getUserByEmailSingle(email);
            if (dbUser) {
              const mappedUser: User = {
                id: dbUser.id,
                name: dbUser.name || dbUser.email,
                email: dbUser.email,
                avatar: dbUser.profilePhoto || '',
                color: '#7C3AED',
                role: dbUser.role as UserRole,
                department: dbUser.department || 'IT',
                phone: dbUser.phone || '',
                isActive: !dbUser.isBlocked
              };
              set({ currentUser: mappedUser });
              await get().loadAllData();
              set({ isAuthenticated: true });
              get().addAuditLog('USER_LOGIN', `${mappedUser.name} logged in`);
              return { success: true };
            }
          }
          return { success: false, error: 'User profile not found in database' };
        }
      },

      register: async (name, email, password, role) => {
        if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
          if (get().registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase()))
            return { success: false, error: 'Email already registered' };
          const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
          const newUser: AuthUser = {
            id: uuidv4(), name, email, avatar: '', color: colors[Math.floor(Math.random() * colors.length)],
            password, role: role || 'EMPLOYEE', isActive: true
          };
          const { password: _, ...userWithoutPassword } = newUser;
          set({ registeredUsers: [...get().registeredUsers, newUser], users: [...get().users, userWithoutPassword], isAuthenticated: true, currentUser: userWithoutPassword });
          return { success: true };
        } else {
          const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
          if (error) return { success: false, error: error.message };
          if (data?.user) {
            const newDbUser = {
              id: data.user.id,
              name,
              email,
              password: 'auth-service-managed',
              role: role || 'EMPLOYEE',
              isApproved: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await userService.insertUser(newDbUser);
            const mappedUser: User = {
              id: newDbUser.id,
              name,
              email,
              avatar: '',
              color: '#7C3AED',
              role: newDbUser.role as UserRole,
              department: 'IT',
              phone: '',
              isActive: true
            };
            set({ isAuthenticated: true, currentUser: mappedUser });
            await get().loadAllData();
            return { success: true };
          }
          return { success: false, error: 'Registration failed' };
        }
      },

      adminAddUser: async (name, email, password, role, department, phone) => {
        const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const userId = uuidv4();
        const now = new Date().toISOString();

        if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
          if (get().registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase()))
            return { success: false, error: 'Email already registered' };
          
          const newUser: AuthUser = {
            id: userId,
            name,
            email,
            avatar: '',
            color: randomColor,
            password,
            role: role || 'EMPLOYEE',
            department: department || 'IT',
            phone: phone || '',
            isActive: true
          };
          const { password: _, ...userWithoutPassword } = newUser;
          set({
            registeredUsers: [...get().registeredUsers, newUser],
            users: [...get().users, userWithoutPassword]
          });
        }

        const newDbUser = {
          id: userId,
          name,
          email: email.toLowerCase(),
          password: password,
          role: role || 'EMPLOYEE',
          isApproved: true,
          department: department || 'IT',
          phone: phone || '',
          isBlocked: false,
          createdAt: now,
          updatedAt: now
        };

        try {
          await userService.insertUser(newDbUser);
        } catch (error: any) {
          console.error("Error inserting user to Supabase:", error);
          return { success: false, error: error.message };
        }

        get().addAuditLog('USER_CREATED', `Admin added user "${name}"`);
        await get().loadAllData();
        return { success: true };
      },

      logout: async () => {
        const cu = get().currentUser;
        if (cu) get().addAuditLog('USER_LOGOUT', `${cu.name} logged out`);
        if (import.meta.env.VITE_BYPASS_AUTH !== 'true') {
          await supabase.auth.signOut();
        }
        set({ isAuthenticated: false, currentUser: null, activePage: 'home', showTaskModal: false, showTicketModal: false, showCreateTaskModal: false, showCreateTicketModal: false, showNotifications: false, showSettingsModal: false, showChatWidget: false });
      },

      // NAVIGATION & CORE CRUD
      setActivePage: (page) => set({ activePage: page, selectedSpaceId: page === 'spaces' ? get().selectedSpaceId : null, selectedListId: null }),

      addSpace: async (name, color, icon) => {
        const newSpace = { id: uuidv4(), name, color, icon, order: get().spaces.length };
        set({ spaces: [...get().spaces, newSpace] });
        await get().enqueueWrite('Space', 'insert', {
          id: newSpace.id,
          name: newSpace.name,
          color: newSpace.color,
          icon: newSpace.icon,
          order: newSpace.order,
          updatedAt: new Date().toISOString()
        });
      },
      updateSpace: async (id, updates) => {
        set({ spaces: get().spaces.map(s => s.id === id ? { ...s, ...updates } : s) });
        await get().enqueueWrite('Space', 'update', updates, 'id', id);
      },
      deleteSpace: async (id) => {
        set({ spaces: get().spaces.filter(s => s.id !== id), lists: get().lists.filter(l => l.spaceId !== id), tasks: get().tasks.filter(t => t.spaceId !== id) });
        await get().enqueueWrite('Space', 'delete', null, 'id', id);
      },
      selectSpace: (id) => set({ selectedSpaceId: id, selectedListId: null, activePage: 'spaces' }),

      addList: async (name, spaceId, color) => {
        const newList = { id: uuidv4(), name, color, spaceId, order: get().lists.filter(l => l.spaceId === spaceId).length };
        set({ lists: [...get().lists, newList] });
        await get().enqueueWrite('TaskList', 'insert', {
          id: newList.id,
          name: newList.name,
          color: newList.color,
          spaceId: newList.spaceId,
          order: newList.order,
          updatedAt: new Date().toISOString()
        });
      },
      updateList: async (id, updates) => {
        set({ lists: get().lists.map(l => l.id === id ? { ...l, ...updates } : l) });
        await get().enqueueWrite('TaskList', 'update', updates, 'id', id);
      },
      deleteList: async (id) => {
        set({ lists: get().lists.filter(l => l.id !== id), tasks: get().tasks.filter(t => t.listId !== id) });
        await get().enqueueWrite('TaskList', 'delete', null, 'id', id);
      },
      selectList: (id) => set({ selectedListId: id }),

      // TASK CRUD
      addTask: async (taskData) => {
        const cu = get().currentUser;
        const taskId = uuidv4();
        const task: Task = {
          id: taskId,
          title: taskData.title || 'Untitled',
          description: taskData.description || '',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'normal',
          assigneeIds: taskData.assigneeIds || [],
          tags: taskData.tags || [],
          subtasks: taskData.subtasks || [],
          dueDate: taskData.dueDate || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          spaceId: taskData.spaceId || get().selectedSpaceId || '',
          listId: taskData.listId || get().selectedListId || '',
          order: get().tasks.filter(t => t.status === (taskData.status || 'todo')).length,
          timeEstimate: taskData.timeEstimate || 0,
          timeTracked: taskData.timeTracked || 0,
          ticketId: taskData.ticketId || null,
          isRecurring: taskData.isRecurring || false,
          recurInterval: taskData.recurInterval || 1,
          recurUnit: taskData.recurUnit || 'weeks',
          recurBehavior: taskData.recurBehavior || 'create_new'
        };
        set({
          tasks: [...get().tasks, task],
          activities: [...get().activities, { id: uuidv4(), type: 'created', taskId: task.id, userId: cu?.id || '', description: `created task "${task.title}"`, createdAt: new Date().toISOString() }],
        });
        await get().enqueueWrite('Task', 'insert', {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status.toUpperCase() === 'IN_PROGRESS' ? 'IN_PROGRESS' : (task.status.toUpperCase() === 'IN_REVIEW' ? 'REVIEW' : task.status.toUpperCase()),
          priority: task.priority === 'urgent' ? 'CRITICAL' : (task.priority === 'normal' ? 'MEDIUM' : task.priority.toUpperCase()),
          assigneeId: sanitizeNullableDbId(task.assigneeIds[0]),
          assigneeIds: task.assigneeIds.map(id => sanitizeNullableDbId(id)).filter((id): id is string => id !== null),
          createdById: sanitizeNullableDbId(cu?.id),
          spaceId: task.spaceId || null,
          listId: task.listId || null,
          ticketId: task.ticketId || null,
          updatedAt: new Date().toISOString(),
          isRecurring: task.isRecurring,
          recurInterval: task.recurInterval,
          recurUnit: task.recurUnit,
          recurBehavior: task.recurBehavior
        });

        // Trigger Telegram alert if assignee exists
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          const assigneeNames = task.assigneeIds.map(id => get().getUserById(id)?.name || id);
          const taskPriorityMapped = task.priority === 'urgent' ? 'CRITICAL' : (task.priority === 'normal' ? 'MEDIUM' : task.priority.toUpperCase());
          const severity = taskPriorityMapped === 'CRITICAL' || taskPriorityMapped === 'HIGH' ? 'HIGH' : 'INFO';
          get().triggerTelegramAlert(
            `📌 Penugasan Tugas: ${task.title}`,
            `Boss, tugas "${task.title}" telah ditugaskan kepada: **${assigneeNames.join(', ')}**\n\n**Prioritas:** ${taskPriorityMapped}\n**Status:** ${task.status}`,
            severity
          );
        }
      },
      updateTask: async (id, updates) => {
        const oldTask = get().tasks.find(t => t.id === id);
        set({ tasks: get().tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) });
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.status !== undefined) dbUpdates.status = updates.status.toUpperCase() === 'IN_PROGRESS' ? 'IN_PROGRESS' : (updates.status.toUpperCase() === 'IN_REVIEW' ? 'REVIEW' : updates.status.toUpperCase());
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority === 'urgent' ? 'CRITICAL' : (updates.priority === 'normal' ? 'MEDIUM' : updates.priority.toUpperCase());
        if (updates.assigneeIds !== undefined) {
          dbUpdates.assigneeId = sanitizeNullableDbId(updates.assigneeIds[0]);
          dbUpdates.assigneeIds = updates.assigneeIds.map(id => sanitizeNullableDbId(id)).filter((id): id is string => id !== null);
        }
        if (updates.dueDate !== undefined) dbUpdates.dueDate = updates.dueDate;
        if (updates.isRecurring !== undefined) dbUpdates.isRecurring = updates.isRecurring;
        if (updates.recurInterval !== undefined) dbUpdates.recurInterval = updates.recurInterval;
        if (updates.recurUnit !== undefined) dbUpdates.recurUnit = updates.recurUnit;
        if (updates.recurBehavior !== undefined) dbUpdates.recurBehavior = updates.recurBehavior;

        if (Object.keys(dbUpdates).length > 0) {
          dbUpdates.updatedAt = new Date().toISOString();
          await get().enqueueWrite('Task', 'update', dbUpdates, 'id', id);
        }

        // Trigger Telegram alert if new assignee is set
        if (updates.assigneeIds !== undefined) {
          const oldAssignee = oldTask?.assigneeIds[0];
          const newAssignee = updates.assigneeIds[0];
          if (newAssignee && newAssignee !== oldAssignee) {
            const assigneeName = get().getUserById(newAssignee)?.name || newAssignee;
            const taskTitle = oldTask?.title || 'Untitled';
            const taskPriorityMapped = (oldTask?.priority || 'normal') === 'urgent' ? 'CRITICAL' : ((oldTask?.priority || 'normal') === 'normal' ? 'MEDIUM' : (oldTask?.priority || 'normal').toUpperCase());
            const severity = taskPriorityMapped === 'CRITICAL' || taskPriorityMapped === 'HIGH' ? 'HIGH' : 'INFO';
            get().triggerTelegramAlert(
              `📌 Penugasan Tugas Baru: ${taskTitle}`,
              `Boss, tugas "${taskTitle}" telah dialihkan/ditugaskan kepada: **${assigneeName}**`,
              severity
            );
          }
        }

        // Find matching ticket and update it (Opsi E)
        const currentTask = get().tasks.find(t => t.id === id);
        if (currentTask && currentTask.ticketId) {
          const matchingTicket = get().tickets.find(t => t.id === currentTask.ticketId);
          if (matchingTicket) {
            const ticketUpdates: any = {};
            
            if (updates.title !== undefined) {
              let cleanTitle = updates.title;
              const match = updates.title.match(/^Ticket #TK-[0-9A-F]{8}:\s*(.*)$/i);
              if (match) {
                cleanTitle = match[1];
              }
              if (matchingTicket.title !== cleanTitle) {
                ticketUpdates.title = cleanTitle;
              }
            }
            if (updates.description !== undefined) {
              if (matchingTicket.description !== updates.description) {
                ticketUpdates.description = updates.description;
              }
            }
            if (updates.priority !== undefined) {
              const mappedPriority = updates.priority === 'urgent' ? 'CRITICAL' :
                                     updates.priority === 'high' ? 'HIGH' :
                                     updates.priority === 'normal' ? 'MEDIUM' : 'LOW';
              if (matchingTicket.priority !== mappedPriority) {
                ticketUpdates.priority = mappedPriority;
              }
            }
            if (updates.status !== undefined) {
              const mappedStatus = updates.status === 'todo' ? 'OPEN' :
                                   updates.status === 'in_progress' ? 'IN_PROGRESS' : 'RESOLVED';
              if (matchingTicket.status !== mappedStatus) {
                ticketUpdates.status = mappedStatus;
              }
            }
            if (updates.assigneeIds !== undefined) {
              const newAssignee = updates.assigneeIds[0] || null;
              if (matchingTicket.assigneeId !== newAssignee) {
                ticketUpdates.assigneeId = sanitizeNullableDbId(newAssignee);
              }
            }
            
            if (Object.keys(ticketUpdates).length > 0) {
              await get().updateTicket(matchingTicket.id, ticketUpdates);
            }
          }
        }
      },
      deleteTask: async (id) => {
        set({ tasks: get().tasks.filter(t => t.id !== id), comments: get().comments.filter(c => c.taskId !== id) });
        await get().enqueueWrite('Task', 'delete', null, 'id', id);
      },
      moveTask: async (taskId, newStatus) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const previousTasks = get().tasks;
        const previousActivities = get().activities;
        const previousTickets = get().tickets;

        set({
          tasks: get().tasks.map(t => t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t),
          activities: [...get().activities, { id: uuidv4(), type: 'moved', taskId, userId: get().currentUser?.id || '', description: `moved "${task.title}" to "${newStatus}"`, createdAt: new Date().toISOString() }],
        });

        try {
          await get().enqueueWrite('Task', 'update', {
            status: newStatus.toUpperCase() === 'IN_PROGRESS' ? 'IN_PROGRESS' : (newStatus.toUpperCase() === 'IN_REVIEW' ? 'REVIEW' : newStatus.toUpperCase()),
            updatedAt: new Date().toISOString()
          }, 'id', taskId);

          // Find matching ticket and update status (Opsi E)
          if (task.ticketId) {
            const matchingTicket = get().tickets.find(t => t.id === task.ticketId);
            if (matchingTicket) {
              const mappedStatus = newStatus === 'todo' ? 'OPEN' :
                                   newStatus === 'in_progress' ? 'IN_PROGRESS' : 'RESOLVED';
              if (matchingTicket.status !== mappedStatus) {
                await get().updateTicket(matchingTicket.id, { status: mappedStatus });
              }
            }
          }
        } catch (error) {
          console.error("Failed to move task. Rolling back.", error);
          set({
            tasks: previousTasks,
            activities: previousActivities,
            tickets: previousTickets
          });
          throw error;
        }
      },
      selectTask: (id) => set({ selectedTaskId: id, showTaskModal: id !== null }),
      toggleSubtask: async (taskId, subtaskId) => {
        set({ tasks: get().tasks.map(t => t.id !== taskId ? t : { ...t, subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st), updatedAt: new Date().toISOString() }) });
        const task = get().tasks.find(t => t.id === taskId);
        const st = task?.subtasks.find(s => s.id === subtaskId);
        if (st) {
          await get().enqueueWrite('Checklist', 'update', { isCompleted: !st.completed }, 'id', subtaskId);
        }
      },
      addSubtask: async (taskId, title) => {
        const subtaskId = uuidv4();
        set({ tasks: get().tasks.map(t => t.id !== taskId ? t : { ...t, subtasks: [...t.subtasks, { id: subtaskId, title, completed: false }], updatedAt: new Date().toISOString() }) });
        await get().enqueueWrite('Checklist', 'insert', {
          id: subtaskId,
          content: title,
          isCompleted: false,
          taskId: taskId
        });
      },
      deleteSubtask: async (taskId, subtaskId) => {
        set({ tasks: get().tasks.map(t => t.id !== taskId ? t : { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId), updatedAt: new Date().toISOString() }) });
        await get().enqueueWrite('Checklist', 'update', { isDeleted: true }, 'id', subtaskId);
      },

      addComment: async (taskId, content) => {
        const cu = get().currentUser;
        const commentId = uuidv4();
        set({ comments: [...get().comments, { id: commentId, taskId, userId: cu?.id || '', content, createdAt: new Date().toISOString() }] });
        await get().enqueueWrite('Comment', 'insert', {
          id: commentId,
          content,
          ticketId: taskId, // ClickHub uses taskId as the primary comment container
          userId: sanitizeDbId(cu?.id, get().users) || ''
        });
      },
      deleteComment: async (id) => {
        set({ comments: get().comments.filter(c => c.id !== id) });
        await get().enqueueWrite('Comment', 'delete', null, 'id', id);
      },

      addTag: async (name, color) => set({ tags: [...get().tags, { id: uuidv4(), name, color }] }),
      deleteTag: async (id) => set({ tags: get().tags.filter(t => t.id !== id) }),

      // TICKET CRUD
      addTicket: async (data) => {
        const cu = get().currentUser;
        const ticketId = uuidv4();
        const now = new Date().toISOString();
        const slaDeadline = calculateSlaDeadline(data.priority || 'MEDIUM', now);
        const ticket: Ticket = {
          id: ticketId,
          title: data.title || 'Untitled',
          description: data.description || '',
          status: data.status || 'OPEN',
          priority: data.priority || 'MEDIUM',
          type: data.type || 'Incident',
          reporterId: data.reporterId || cu?.id || '',
          assigneeId: data.assigneeId || null,
          category: data.category || 'General',
          slaDeadline,
          createdAt: now,
          updatedAt: now,
          resolvedAt: null,
        };
        get().addAuditLog('TICKET_CREATED', `Ticket "${ticket.title}" created`);
        set({ tickets: [...get().tickets, ticket] });

        await get().enqueueWrite('Ticket', 'insert', {
          id: ticket.id,
          ticketNumber: ticket.id.slice(0, 8).toUpperCase(),
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          type: ticket.type,
          reporterId: sanitizeDbId(ticket.reporterId, get().users),
          assigneeId: sanitizeNullableDbId(ticket.assigneeId),
          category: ticket.category,
          slaDeadline: ticket.slaDeadline,
          updatedAt: now
        });

        // Trigger Telegram alert for new ticket
        const ticketNumber = ticket.id.slice(0, 8).toUpperCase();
        const severity = ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? 'HIGH' : 'INFO';
        get().triggerTelegramAlert(
          `🎫 Tiket Baru: #TK-${ticketNumber}`,
          `Boss, tiket baru telah dibuat:\n\n**Judul:** ${ticket.title}\n**Prioritas:** ${ticket.priority}\n**Kategori:** ${ticket.category}\n**Deskripsi:** ${ticket.description}\n**Pelapor:** ${cu?.name || 'Unknown'}`,
          severity
        );

        // Resolve valid spaceId and listId (Opsi E)
        let defSpaceId = '';
        let defListId = '';

        const mockSpaceIds = ['space-1', 'space-2', 'space-3'];
        const validSpaces = get().spaces.filter(s => !mockSpaceIds.includes(s.id));
        if (validSpaces.length > 0) {
          defSpaceId = validSpaces[0].id;
          const matchingList = get().lists.find(l => l.spaceId === defSpaceId && !['list-1', 'list-2', 'list-3', 'list-4'].includes(l.id));
          if (matchingList) {
            defListId = matchingList.id;
          }
        }

        // If not found in state, query database via taskService
        if (!defSpaceId) {
          try {
            const result = await taskService.getDefaultSpaceAndList();
            if (result.spaceId) {
              defSpaceId = result.spaceId;
              if (result.listId) {
                defListId = result.listId;
              }
            }
          } catch (err) {
            console.error("Error fetching default space/list from taskService:", err);
          }
        }

        // Final fallback to state defaults if database is completely empty
        if (!defSpaceId && get().spaces.length > 0) {
          defSpaceId = get().spaces[0].id;
          const matchingList = get().lists.find(l => l.spaceId === defSpaceId);
          if (matchingList) {
            defListId = matchingList.id;
          }
        }

        const taskPriority = ticket.priority === 'CRITICAL' ? 'urgent' :
                             ticket.priority === 'HIGH' ? 'high' :
                             ticket.priority === 'MEDIUM' ? 'normal' : 'low';

        await get().addTask({
          title: `Ticket #TK-${ticketNumber}: ${ticket.title}`,
          description: ticket.description,
          status: 'todo',
          priority: taskPriority,
          assigneeIds: ticket.assigneeId ? [ticket.assigneeId] : [],
          spaceId: defSpaceId || null as any,
          listId: defListId || null as any,
          ticketId: ticket.id
        });
        return ticketId;
      },

      uploadAttachment: async (ticketId, file) => {
        if (!navigator.onLine) {
          throw new Error('Offline mode: Uploading attachments is only available online.');
        }

        const originalSize = file.size;
        let fileToUpload = file;
        if (file.type.startsWith('image/') && file.type !== 'image/gif') {
          try {
            fileToUpload = await compressImage(file);
          } catch (e) {
            console.warn("Failed to compress image, using original:", e);
          }
        }

        const filePath = `tickets/${ticketId}/${fileToUpload.name}`;
        const { error: storageError } = await supabase.storage
          .from('attachments')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: true
          });

        if (storageError) {
          throw storageError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        const attachmentId = uuidv4();
        const now = new Date().toISOString();
        const newAttachment: Attachment = {
          id: attachmentId,
          fileName: fileToUpload.name,
          fileUrl: publicUrl,
          fileType: fileToUpload.type,
          fileSize: fileToUpload.size,
          ticketId: ticketId,
          uploadedAt: now,
          originalSize: originalSize
        };

        const { error: dbError } = await supabase.from('Attachment').insert([newAttachment]);
        if (dbError) {
          await supabase.storage.from('attachments').remove([filePath]);
          throw dbError;
        }

        set({
          tickets: get().tickets.map(t =>
            t.id === ticketId
              ? { ...t, attachments: [...(t.attachments || []), newAttachment] }
              : t
          )
        });

        get().addAuditLog('TICKET_ATTACHMENT_UPLOADED', `Uploaded attachment "${file.name}" for ticket ID ${ticketId}`);

        return newAttachment;
      },

      uploadChatFile: async (sessionId, file) => {
        if (!navigator.onLine) {
          throw new Error('Offline mode: Uploading attachments is only available online.');
        }

        let fileToUpload = file;
        if (file.type.startsWith('image/') && file.type !== 'image/gif') {
          try {
            fileToUpload = await compressImage(file);
          } catch (e) {
            console.warn("Failed to compress image, using original:", e);
          }
        }

        const filePath = `chats/${sessionId}/${fileToUpload.name}`;
        const { error: storageError } = await supabase.storage
          .from('attachments')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: true
          });

        if (storageError) {
          throw storageError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        return {
          fileUrl: publicUrl,
          fileName: fileToUpload.name,
          fileType: fileToUpload.type,
          fileSize: fileToUpload.size
        };
      },

      deleteAttachment: async (attachmentId) => {
        if (!navigator.onLine) {
          throw new Error('Offline mode: Deleting attachments is only available online.');
        }

        let attachment: Attachment | undefined;
        let ticketTitle = '';
        for (const t of get().tickets) {
          if (t.attachments) {
            attachment = t.attachments.find(a => a.id === attachmentId);
            if (attachment) {
              ticketTitle = t.title;
              break;
            }
          }
        }

        if (!attachment) {
          throw new Error('Attachment not found');
        }

        const filePath = `tickets/${attachment.ticketId}/${attachment.fileName}`;

        const { error: storageError } = await supabase.storage
          .from('attachments')
          .remove([filePath]);

        if (storageError) {
          console.error("Storage delete error:", storageError);
        }

        const { error: dbError } = await supabase
          .from('Attachment')
          .delete()
          .eq('id', attachmentId);

        if (dbError) {
          throw dbError;
        }

        if (attachment.deleteRequestedById) {
          const notif = {
            id: uuidv4(),
            userId: attachment.deleteRequestedById,
            title: 'Delete Request Approved ✅',
            message: `Permintaan hapus lampiran "${attachment.fileName}" untuk tiket "${ticketTitle}" telah disetujui Admin.`,
            type: 'TICKET_ASSIGNED',
            isRead: false,
            createdAt: new Date().toISOString()
          };
          await userService.insertNotifications([notif]).catch(e => console.error(e));
        }

        set({
          tickets: get().tickets.map(t =>
            t.id === attachment!.ticketId
              ? {
                  ...t,
                  attachments: (t.attachments || []).filter(a => a.id !== attachmentId)
                }
              : t
          )
        });

        get().addAuditLog('TICKET_ATTACHMENT_DELETED', `Deleted attachment "${attachment.fileName}"`);
      },

      requestDeleteAttachment: async (attachmentId, reason) => {
        if (!navigator.onLine) {
          throw new Error('Offline mode: Requesting attachment deletion is only available online.');
        }

        const cu = get().currentUser;
        let attachment: Attachment | undefined;
        let ticketTitle = '';
        for (const t of get().tickets) {
          if (t.attachments) {
            attachment = t.attachments.find(a => a.id === attachmentId);
            if (attachment) {
              ticketTitle = t.title;
              break;
            }
          }
        }

        if (!attachment) {
          throw new Error('Attachment not found');
        }

        const { error: dbError } = await supabase
          .from('Attachment')
          .update({ 
            isDeleteRequested: true,
            deleteReason: reason,
            deleteRequestedById: cu?.id || null
          })
          .eq('id', attachmentId);

        if (dbError) {
          throw dbError;
        }

        set({
          tickets: get().tickets.map(t =>
            t.id === attachment!.ticketId
              ? {
                  ...t,
                  attachments: (t.attachments || []).map(a =>
                    a.id === attachmentId 
                      ? { ...a, isDeleteRequested: true, deleteReason: reason, deleteRequestedById: cu?.id } 
                      : a
                  )
                }
              : t
          )
        });

        get().addAuditLog('TICKET_ATTACHMENT_DELETE_REQUESTED', `Requested deletion for attachment "${attachment.fileName}" reason: "${reason}"`);

        const adminUsers = get().users.filter(u => ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(u.role));
        const newDbNotifs = adminUsers.map(u => ({
          id: uuidv4(),
          userId: u.id,
          title: 'Attachment Delete Request 🗑️',
          message: `Deletion requested for "${attachment!.fileName}" in ticket "${ticketTitle}" by ${cu?.name || 'Unknown'}. Reason: "${reason}".`,
          type: 'TICKET_ASSIGNED',
          isRead: false,
          createdAt: new Date().toISOString()
        }));
        if (newDbNotifs.length > 0) {
          await userService.insertNotifications(newDbNotifs).catch(err => {
            console.error("Failed to insert notifications for attachment delete request:", err);
          });
        }
      },

      rejectDeleteAttachment: async (attachmentId) => {
        if (!navigator.onLine) {
          throw new Error('Offline mode: Rejecting attachment deletion is only available online.');
        }

        let attachment: Attachment | undefined;
        let ticketTitle = '';
        for (const t of get().tickets) {
          if (t.attachments) {
            attachment = t.attachments.find(a => a.id === attachmentId);
            if (attachment) {
              ticketTitle = t.title;
              break;
            }
          }
        }

        if (!attachment) {
          throw new Error('Attachment not found');
        }

        const { error: dbError } = await supabase
          .from('Attachment')
          .update({ isDeleteRequested: false })
          .eq('id', attachmentId);

        if (dbError) {
          throw dbError;
        }

        if (attachment.deleteRequestedById) {
          const notif = {
            id: uuidv4(),
            userId: attachment.deleteRequestedById,
            title: 'Delete Request Rejected ❌',
            message: `Permintaan hapus lampiran "${attachment.fileName}" untuk tiket "${ticketTitle}" ditolak oleh Admin.`,
            type: 'TICKET_ASSIGNED',
            isRead: false,
            createdAt: new Date().toISOString()
          };
          await userService.insertNotifications([notif]).catch(e => console.error(e));
        }

        set({
          tickets: get().tickets.map(t =>
            t.id === attachment!.ticketId
              ? {
                  ...t,
                  attachments: (t.attachments || []).map(a =>
                    a.id === attachmentId ? { ...a, isDeleteRequested: false } : a
                  )
                }
              : t
          )
        });

        get().addAuditLog('TICKET_ATTACHMENT_DELETE_REJECTED', `Rejected deletion request for attachment "${attachment.fileName}"`);
      },

      updateTicket: async (id, updates) => {
        const old = get().tickets.find(t => t.id === id);
        const resolvedAt = updates.status === 'RESOLVED' ? new Date().toISOString() : (updates.status === 'CLOSED' ? old?.resolvedAt || null : null);
        const inProgressAt = updates.status === 'IN_PROGRESS' ? new Date().toISOString() : (old?.inProgressAt || null);
        
        const previousTickets = get().tickets;
        const previousTasks = get().tasks;

        set({ tickets: get().tickets.map(t => t.id === id ? { 
          ...t, 
          ...updates, 
          resolvedAt: updates.resolvedAt !== undefined ? updates.resolvedAt : resolvedAt, 
          inProgressAt: updates.inProgressAt !== undefined ? updates.inProgressAt : inProgressAt,
          updatedAt: new Date().toISOString() 
        } : t) });

        try {
          const dbUpdates: any = { ...updates };
          if (updates.status !== undefined) {
            dbUpdates.status = updates.status;
            dbUpdates.resolvedAt = resolvedAt;
            dbUpdates.inProgressAt = inProgressAt;
          }
          if (dbUpdates.assigneeId !== undefined) {
            dbUpdates.assigneeId = sanitizeNullableDbId(dbUpdates.assigneeId);
          }
          if (dbUpdates.reporterId !== undefined) {
            dbUpdates.reporterId = sanitizeDbId(dbUpdates.reporterId, get().users);
          }
          dbUpdates.updatedAt = new Date().toISOString();
          await ticketService.updateTicket(id, dbUpdates);

          // Find matching task and update it (Opsi E)
          const matchingTask = get().tasks.find(t => t.ticketId === id);
          if (matchingTask) {
            const taskUpdates: any = {};
            const ticketNumber = id.slice(0, 8).toUpperCase();

            if (updates.title !== undefined) {
              const newTitle = `Ticket #TK-${ticketNumber}: ${updates.title}`;
              if (matchingTask.title !== newTitle) {
                taskUpdates.title = newTitle;
              }
            }
            if (updates.description !== undefined) {
              if (matchingTask.description !== updates.description) {
                taskUpdates.description = updates.description;
              }
            }
            if (updates.priority !== undefined) {
              const mappedPriority = updates.priority === 'CRITICAL' ? 'urgent' :
                                     updates.priority === 'HIGH' ? 'high' :
                                     updates.priority === 'MEDIUM' ? 'normal' : 'low';
              if (matchingTask.priority !== mappedPriority) {
                taskUpdates.priority = mappedPriority;
              }
            }
            if (updates.status !== undefined) {
              const mappedStatus = updates.status === 'OPEN' ? 'todo' :
                                   updates.status === 'IN_PROGRESS' ? 'in_progress' : 'done';
              if (matchingTask.status !== mappedStatus) {
                taskUpdates.status = mappedStatus;
              }
            }
            if (updates.assigneeId !== undefined) {
              const currentAssignee = matchingTask.assigneeIds[0] || null;
              if (currentAssignee !== updates.assigneeId) {
                taskUpdates.assigneeIds = updates.assigneeId ? [updates.assigneeId] : [];
              }
            }

            if (Object.keys(taskUpdates).length > 0) {
              await get().updateTask(matchingTask.id, taskUpdates);
            }
          }
          get().addAuditLog('TICKET_UPDATED', `Ticket "${old?.title}" updated`);
        } catch (error) {
          console.error("Failed to update ticket. Rolling back.", error);
          set({
            tickets: previousTickets,
            tasks: previousTasks
          });
          throw error;
        }
      },
      deleteTicket: async (id) => {
        const t = get().tickets.find(t => t.id === id);
        if (!t) return;

        get().addAuditLog('TICKET_DELETE_REQUESTED', `Delete requested for ticket "${t.title}"`);
        
        await ticketService.requestDeleteTicket(id);

        // Notify Admins
        const adminUsers = get().users.filter(u => ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(u.role));
        const newDbNotifs = adminUsers.map(u => ({
          id: uuidv4(),
          userId: u.id,
          title: 'Ticket Delete Request 🗑️',
          message: `Technician has requested deletion of ticket "${t.title}". Approval required.`,
          type: 'TICKET_ASSIGNED',
          isRead: false,
          createdAt: new Date().toISOString()
        }));
        if (newDbNotifs.length > 0) {
          await userService.insertNotifications(newDbNotifs);
        }

        const ticketNumber = id.slice(0, 8).toUpperCase();
        get().triggerTelegramAlert(
          `🗑️ Permintaan Hapus Tiket: #TK-${ticketNumber}`,
          `Boss, ada permintaan penghapusan tiket oleh staf/teknisi:\n\n**Tiket:** ${t.title}\n**Prioritas:** ${t.priority}\n**Kategori:** ${t.category}\n**Deskripsi:** ${t.description}\n\n*Persetujuan Admin diperlukan untuk menghapus tiket secara permanen.*`,
          'WARN'
        );

        await get().loadAllData();
      },
      approveDeleteTicket: async (id) => {
        const t = get().tickets.find(t => t.id === id);
        if (!t) return;

        get().addAuditLog('TICKET_DELETE_APPROVED', `Permanently deleted ticket "${t.title}"`);
        
        // Delete attachments from storage first
        const associatedAttachments = t.attachments || [];
        for (const attachment of associatedAttachments) {
          const filePath = `tickets/${id}/${attachment.fileName}`;
          await supabase.storage.from('attachments').remove([filePath]).catch(e => {
            console.error("Failed to delete attachment from storage on ticket delete:", e);
          });
        }

        set({ tickets: get().tickets.filter(t => t.id !== id) });
        await ticketService.deleteTicketPermanently(id);

        // Find matching task and delete it
        const matchingTask = get().tasks.find(task => task.ticketId === id);
        if (matchingTask) {
          await get().deleteTask(matchingTask.id);
        }
        await get().loadAllData();
      },
      rejectDeleteTicket: async (id, actionType) => {
        const t = get().tickets.find(t => t.id === id);
        if (!t) return;

        if (actionType === 'ARCHIVE') {
          get().addAuditLog('TICKET_ARCHIVED', `Archived ticket "${t.title}"`);
          await ticketService.updateArchiveStatus(id, true, false);
        } else {
          get().addAuditLog('TICKET_RESTORED', `Restored ticket "${t.title}" to active status`);
          await ticketService.updateArchiveStatus(id, false, false);
        }
        await get().loadAllData();
      },
      submitTicketFeedback: async (ticketId, rating, feedback) => {
        const t = get().tickets.find(tk => tk.id === ticketId);
        if (!t) return;

        get().addAuditLog('TICKET_CSAT_SUBMITTED', `Submitted CSAT rating ${rating}★ for ticket "${t.title}"`);

        set({
          tickets: get().tickets.map(tk =>
            tk.id === ticketId ? { ...tk, csatRating: rating, csatFeedback: feedback, updatedAt: new Date().toISOString() } : tk
          )
        });

        await ticketService.updateTicket(ticketId, {
          csatRating: rating,
          csatFeedback: feedback,
          updatedAt: new Date().toISOString()
        });

        const ticketNumber = ticketId.slice(0, 8).toUpperCase();
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const severity = rating <= 3 ? 'HIGH' : 'INFO';
        const subject = rating <= 3 ? `⚠️ CSAT Buruk: #TK-${ticketNumber}` : `⭐ CSAT Baru: #TK-${ticketNumber}`;

        get().triggerTelegramAlert(
          subject,
          `Boss, ada CSAT baru untuk Tiket **#TK-${ticketNumber}**:\n\n**Judul:** ${t.title}\n**Rating:** ${rating}/5 (${stars})\n**Ulasan:** ${feedback || '-'}\n**Reporter:** ${get().getUserById(t.reporterId)?.name || 'Unknown'}`,
          severity
        );
      },
      selectTicket: (id) => set({ selectedTicketId: id, showTicketModal: id !== null }),

      // ASSET CRUD
      addAsset: async (data) => {
        const assetId = uuidv4();
        const asset: Asset = {
          id: assetId,
          name: data.name || 'New Asset',
          brand: data.brand || '',
          type: data.type || 'Other',
          serialNumber: data.serialNumber || uuidv4().slice(0, 8).toUpperCase(),
          location: data.location || '',
          status: data.status || 'IN_STORAGE',
          purchaseDate: data.purchaseDate || null,
          price: data.price || 0,
          vendor: data.vendor || '',
          assignedToId: data.assignedToId || null,
          specs: data.specs || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        get().addAuditLog('ASSET_CREATED', `Asset "${asset.name}" added`);
        set({ assets: [...get().assets, asset] });

        await get().enqueueWrite('Asset', 'insert', {
          id: asset.id,
          name: asset.name,
          brand: asset.brand,
          type: asset.type,
          serialNumber: asset.serialNumber,
          location: asset.location,
          status: asset.status,
          purchaseDate: asset.purchaseDate,
          price: asset.price,
          vendor: asset.vendor,
          processor: asset.specs.processor || null,
          ramSize: asset.specs.ram || null,
          storageSize: asset.specs.storage || null,
          osVersion: asset.specs.os || null,
          ipAddress: asset.specs.ipAddress || null,
          updatedAt: new Date().toISOString()
        });
      },
      updateAsset: async (id, updates) => {
        get().addAuditLog('ASSET_UPDATED', `Asset updated`);
        set({ assets: get().assets.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a) });

        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.serialNumber !== undefined) dbUpdates.serialNumber = updates.serialNumber;
        if (updates.location !== undefined) dbUpdates.location = updates.location;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.purchaseDate !== undefined) dbUpdates.purchaseDate = updates.purchaseDate;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.vendor !== undefined) dbUpdates.vendor = updates.vendor;
        if (updates.specs !== undefined) {
          dbUpdates.processor = updates.specs.processor || null;
          dbUpdates.ramSize = updates.specs.ram || null;
          dbUpdates.storageSize = updates.specs.storage || null;
          dbUpdates.osVersion = updates.specs.os || null;
          dbUpdates.ipAddress = updates.specs.ipAddress || null;
        }
        dbUpdates.updatedAt = new Date().toISOString();
        await get().enqueueWrite('Asset', 'update', dbUpdates, 'id', id);
      },
      deleteAsset: async (id) => {
        const a = get().assets.find(a => a.id === id);
        get().addAuditLog('ASSET_DELETED', `Asset "${a?.name}" deleted`);
        set({ assets: get().assets.filter(a => a.id !== id) });
        await get().enqueueWrite('Asset', 'delete', null, 'id', id);
      },

      // KNOWLEDGE BASE (KB)
      addArticle: async (data) => {
        const cu = get().currentUser;
        const article = {
          id: uuidv4(), title: data.title || 'New Article', content: data.content || '',
          category: data.category || 'General', isPublic: data.isPublic ?? true,
          authorId: cu?.id || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        set({ articles: [...get().articles, article] });
        await get().enqueueWrite('Article', 'insert', article);
      },
      updateArticle: async (id, updates) => {
        set({ articles: get().articles.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a) });
        await get().enqueueWrite('Article', 'update', { ...updates, updatedAt: new Date().toISOString() }, 'id', id);
      },
      deleteArticle: async (id) => {
        set({ articles: get().articles.filter(a => a.id !== id) });
        await get().enqueueWrite('Article', 'delete', null, 'id', id);
      },

      // PART REQUEST & STOCK REQUEST CUSTOM WORKFLOWS
      addPartRequest: async (inventoryId, quantity, notes, taskId, ticketId) => {
        const cu = get().currentUser;
        const newRequest = {
          id: uuidv4(),
          inventoryId,
          quantity,
          status: 'PENDING',
          requestedBy: cu?.id || 'unknown',
          ticketId: ticketId || null,
          taskId: taskId || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        set({ partRequests: [newRequest, ...get().partRequests] });
        await get().enqueueWrite('PartRequest', 'insert', newRequest);
        get().addAuditLog('PART_REQUESTED', `Requested ${quantity} of inventory item`);

        // Trigger Telegram alert for part request
        const invItem = get().inventories.find(i => i.id === inventoryId);
        const itemName = invItem ? invItem.name : 'Unknown Item';
        get().triggerTelegramAlert(
          `🔧 Permintaan Part Baru`,
          `Boss, ada permintaan part/suku cadang baru oleh **${cu?.name || 'Unknown'}**:\n\n**Barang:** ${itemName}\n**Jumlah:** ${quantity}\n**Catatan:** ${notes || '-'}`,
          'INFO'
        );
      },

      addStockRequest: async (data) => {
        const cu = get().currentUser;
        const newRequest = {
          id: uuidv4(),
          requestNumber: 'SR-' + uuidv4().slice(0, 8).toUpperCase(),
          type: data.type,
          inventoryId: data.inventoryId || null,
          itemName: data.itemName,
          itemDescription: data.itemDescription || '',
          category: data.category || 'General',
          quantity: data.quantity,
          estimatedPrice: data.estimatedPrice || 0,
          reason: data.reason,
          urgency: 'MEDIUM',
          status: 'PENDING',
          requestedById: cu?.id || 'unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        set({ stockRequests: [newRequest, ...get().stockRequests] });
        await get().enqueueWrite('StockRequest', 'insert', newRequest);
        get().addAuditLog('STOCK_REQUESTED', `Stock request for ${data.itemName} created`);
      },

      approvePartRequest: async (id) => {
        const cu = get().currentUser;
        const req = await assetService.getPartRequestById(id);
        if (!req) return;

        // Fetch current inventory
        const inv = await assetService.getInventoryById(req.inventoryId);
        if (inv) {
          const newQty = inv.quantity - req.quantity;
          await assetService.updateInventoryQuantity(req.inventoryId, newQty);
          // Log Transaction with referenceId
          await assetService.insertInventoryTransaction({
            id: uuidv4(),
            type: 'OUT',
            quantity: req.quantity,
            previousQty: inv.quantity,
            newQty: newQty,
            notes: `Approved PartRequest for Task/Ticket`,
            inventoryId: req.inventoryId,
            userId: cu?.id || 'system',
            referenceId: req.ticketId || req.taskId || req.id
          });

          if (newQty < inv.minStock) {
            get().addAuditLog('LOW_STOCK_ALERT', `Stock for "${inv.name}" dropped below minimum threshold (${inv.minStock}). Current: ${newQty}`);
            
            const recipientUsers = get().users.filter(u => u.role !== 'EMPLOYEE');
            const newDbNotifs = recipientUsers.map(u => ({
              id: uuidv4(),
              userId: u.id,
              title: 'Low Stock Alert ⚠️',
              message: `${inv.name} stock is low: ${newQty} ${inv.unit} left (minimum threshold is ${inv.minStock}).`,
              type: 'STOCK_ALERT',
              isRead: false,
              createdAt: new Date().toISOString()
            }));
            if (newDbNotifs.length > 0) {
              await userService.insertNotifications(newDbNotifs);
            }

            get().triggerTelegramAlert(
              `⚠️ Peringatan Stok Rendah: ${inv.name}`,
              `Boss, stok barang "${inv.name}" sudah menipis!\n\n**Sisa Stok:** ${newQty} ${inv.unit}\n**Ambang Minimum:** ${inv.minStock} ${inv.unit}\n**Lokasi:** ${inv.location || 'Warehouse'}`,
              'WARN'
            );
          }
        }

        await assetService.updatePartRequestStatus(id, {
          status: 'APPROVED',
          approvedBy: cu?.id || 'system'
        });

        const dbPartRequests = await assetService.getPartRequests();
        const dbInventories = await assetService.getInventories();
        set({ partRequests: dbPartRequests || [], inventories: dbInventories || [] });
        await get().loadAllData();
      },

      approveStockRequest: async (id, newStatus) => {
        const cu = get().currentUser;
        const req = await assetService.getStockRequestById(id);
        if (!req) return;

        if (newStatus === 'RECEIVED') {
          if (req.type === 'RESTOCK' && req.inventoryId) {
            const inv = await assetService.getInventoryById(req.inventoryId);
            if (inv) {
              const newQty = inv.quantity + req.quantity;
              await assetService.updateInventoryQuantity(req.inventoryId, newQty);
              await assetService.insertInventoryTransaction({
                id: uuidv4(),
                type: 'IN',
                quantity: req.quantity,
                previousQty: inv.quantity,
                newQty: newQty,
                notes: `Restock via StockRequest approved`,
                inventoryId: req.inventoryId,
                userId: cu?.id || 'system',
                referenceId: req.id
              });
            }
          } else if (req.type === 'NEW_ITEM') {
            const newInvId = uuidv4();
            await assetService.insertInventory({
              id: newInvId,
              name: req.itemName,
              description: req.itemDescription,
              sku: 'SKU-' + uuidv4().slice(0, 8).toUpperCase(),
              quantity: req.quantity,
              unit: 'pcs',
              location: 'Warehouse',
              isVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            await assetService.insertInventoryTransaction({
              id: uuidv4(),
              type: 'IN',
              quantity: req.quantity,
              previousQty: 0,
              newQty: req.quantity,
              notes: `New Item registered via StockRequest approval`,
              inventoryId: newInvId,
              userId: cu?.id || 'system',
              referenceId: req.id
            });
          }
        }

        await assetService.updateStockRequestStatus(id, {
          status: newStatus,
          approvedById: cu?.id || 'system'
        });

        const dbReqs = await assetService.getStockRequests();
        const dbInventories = await assetService.getInventories();
        set({ stockRequests: dbReqs || [], inventories: dbInventories || [] });
      },

      // CHAT SYSTEM (SYNCED WITH SUPABASE)
      createChatSession: async () => {
        const cu = get().currentUser; if (!cu) return;

        // Check if there is already an active session for this user in local state
        const existingLocal = get().chatSessions.find(s => s.employeeId === cu.id && s.status !== 'CLOSED');
        if (existingLocal) return;

        // Query database to prevent 409 conflict
        const dbSessions = await chatService.getActiveSessionByEmployee(cu.id);

        if (dbSessions && dbSessions.length > 0) {
          const activeSession = dbSessions[0];
          const dbMsgs = await chatService.getMessagesBySessionId(activeSession.id);

          if (!dbMsgs || dbMsgs.length === 0) {
            const msgId = uuidv4();
            const now = new Date().toISOString();
            await chatService.insertChatMessage({
              id: msgId,
              sessionId: activeSession.id,
              senderId: 'system',
              senderName: 'System',
              senderRole: 'SYSTEM',
              content: `Welcome ${cu.name}! How can we help you today?`,
              isSystem: true,
              createdAt: now
            });
          }

          await get().loadAllData();
          return;
        }

        const sessionId = uuidv4();
        const now = new Date().toISOString();
        const session: ChatSession = { 
          id: sessionId, 
          employeeId: cu.id, 
          employeeName: cu.name, 
          handlerId: null, 
          handlerName: null, 
          status: 'OPEN', 
          closeRequestedBy: null,
          closeRequestedAt: null,
          createdAt: now, 
          updatedAt: now 
        };
        const msg: ChatMessage = { 
          id: uuidv4(), 
          sessionId: session.id, 
          senderId: 'system', 
          senderName: 'System', 
          content: `Welcome ${cu.name}! How can we help you today?`, 
          isSystem: true, 
          createdAt: now 
        };

        set({ 
          chatSessions: [session, ...get().chatSessions], 
          chatMessages: [...get().chatMessages, msg] 
        });

        chatService.insertChatSession({
          id: session.id,
          employeeId: session.employeeId,
          employeeName: session.employeeName,
          status: 'OPEN',
          createdAt: now,
          updatedAt: now
        }).then(() => {
          return chatService.insertChatMessage({
            id: msg.id,
            sessionId: msg.sessionId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderRole: 'SYSTEM',
            content: msg.content,
            isSystem: true,
            createdAt: now
          });
        }).catch(err => {
          console.error("Error inserting chat session or welcome message:", err);
        });
      },
      
      sendChatMessage: async (sessionId, content, fileDetails) => {
        const cu = get().currentUser; if (!cu) return;
        const now = new Date().toISOString();
        const msg: ChatMessage = { 
          id: uuidv4(), 
          sessionId, 
          senderId: cu.id, 
          senderName: cu.name, 
          content, 
          isSystem: false, 
          createdAt: now,
          ...fileDetails
        };

        set({ chatMessages: [...get().chatMessages, msg] });

        chatService.insertChatMessage({
          id: msg.id,
          sessionId: msg.sessionId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: cu.role,
          content: msg.content,
          isSystem: false,
          createdAt: now,
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          fileSize: msg.fileSize || null
        }).catch(err => console.error("Error inserting user chat message:", err));

        if (msg.senderId !== 'agent') {
          setTimeout(async () => {
            const replies = [
              'Terima kasih, kami akan segera memproses permintaan Anda.', 
              'Baik, saya akan cek dulu ya.', 
              'Sudah kami teruskan ke tim terkait.', 
              'Apakah ada detail tambahan yang bisa Anda berikan?'
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            const replyNow = new Date().toISOString();
            const replyMsg: ChatMessage = { 
              id: uuidv4(), 
              sessionId, 
              senderId: 'agent', 
              senderName: 'IT Support', 
              content: reply, 
              isSystem: false, 
              createdAt: replyNow 
            };

            set({ chatMessages: [...get().chatMessages, replyMsg] });

            chatService.insertChatMessage({
              id: replyMsg.id,
              sessionId: replyMsg.sessionId,
              senderId: replyMsg.senderId,
              senderName: replyMsg.senderName,
              senderRole: 'TECHNICIAN',
              content: replyMsg.content,
              isSystem: false,
              createdAt: replyNow
            }).catch(err => console.error("Error inserting agent chat reply:", err));
          }, 1500);
        }
      },

      closeChatSession: async (sessionId) => {
        const cu = get().currentUser;
        const now = new Date().toISOString();
        await chatService.updateChatSession(sessionId, {
          status: 'CLOSED',
          closedAt: now,
          closeRequestedBy: null,
          closeRequestedAt: null
        });

        const closeMsg: ChatMessage = {
          id: uuidv4(),
          sessionId,
          senderId: 'system',
          senderName: 'System',
          content: `Sesi obrolan telah ditutup oleh ${cu?.name || 'Sistem'}.`,
          isSystem: true,
          createdAt: now
        };

        await chatService.insertChatMessage({
          id: closeMsg.id,
          sessionId: closeMsg.sessionId,
          senderId: closeMsg.senderId,
          senderName: closeMsg.senderName,
          senderRole: 'SYSTEM',
          content: closeMsg.content,
          isSystem: true,
          createdAt: now
        });

        set({ 
          chatSessions: get().chatSessions.map(s => s.id === sessionId ? { ...s, status: 'CLOSED', closeRequestedBy: null, closeRequestedAt: null, updatedAt: now } : s),
          chatMessages: [...get().chatMessages, closeMsg]
        });
      },

      requestCloseChatSession: async (sessionId) => {
        const cu = get().currentUser;
        const now = new Date().toISOString();
        await chatService.updateChatSession(sessionId, {
          status: 'CLOSE_REQUESTED',
          closeRequestedBy: cu?.id || 'system',
          closeRequestedAt: now
        });

        const msg: ChatMessage = {
          id: uuidv4(),
          sessionId,
          senderId: 'system',
          senderName: 'System',
          content: `${cu?.name || 'IT Support'} requested to close this chat. Waiting for employee confirmation.`,
          isSystem: true,
          createdAt: now
        };

        await chatService.insertChatMessage({
          id: msg.id,
          sessionId: msg.sessionId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: 'SYSTEM',
          content: msg.content,
          isSystem: true,
          createdAt: now
        });

        set({
          chatSessions: get().chatSessions.map(s => s.id === sessionId ? {
            ...s,
            status: 'CLOSE_REQUESTED',
            closeRequestedBy: cu?.id || 'system',
            closeRequestedAt: now,
            updatedAt: now
          } : s),
          chatMessages: [...get().chatMessages, msg]
        });
      },

      confirmCloseChatSession: async (sessionId) => {
        const cu = get().currentUser;
        const now = new Date().toISOString();
        await chatService.updateChatSession(sessionId, {
          status: 'CLOSED',
          closedAt: now,
          closeRequestedBy: null,
          closeRequestedAt: null
        });

        const msg: ChatMessage = {
          id: uuidv4(),
          sessionId,
          senderId: 'system',
          senderName: 'System',
          content: `Sesi obrolan telah ditutup oleh ${cu?.name || 'Employee'} (mutual agreement).`,
          isSystem: true,
          createdAt: now
        };

        await chatService.insertChatMessage({
          id: msg.id,
          sessionId: msg.sessionId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: 'SYSTEM',
          content: msg.content,
          isSystem: true,
          createdAt: now
        });

        set({
          chatSessions: get().chatSessions.map(s => s.id === sessionId ? {
            ...s,
            status: 'CLOSED',
            closedAt: now,
            closeRequestedBy: null,
            closeRequestedAt: null,
            updatedAt: now
          } : s),
          chatMessages: [...get().chatMessages, msg]
        });
      },

      rejectCloseChatSession: async (sessionId) => {
        const cu = get().currentUser;
        const now = new Date().toISOString();
        await chatService.updateChatSession(sessionId, {
          status: 'IN_PROGRESS',
          closeRequestedBy: null,
          closeRequestedAt: null
        });

        const msg: ChatMessage = {
          id: uuidv4(),
          sessionId,
          senderId: 'system',
          senderName: 'System',
          content: `${cu?.name || 'Employee'} rejected the close request. Chat continues.`,
          isSystem: true,
          createdAt: now
        };

        await chatService.insertChatMessage({
          id: msg.id,
          sessionId: msg.sessionId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: 'SYSTEM',
          content: msg.content,
          isSystem: true,
          createdAt: now
        });

        set({
          chatSessions: get().chatSessions.map(s => s.id === sessionId ? {
            ...s,
            status: 'IN_PROGRESS',
            closeRequestedBy: null,
            closeRequestedAt: null,
            updatedAt: now
          } : s),
          chatMessages: [...get().chatMessages, msg]
        });
      },

      claimChatSession: async (sessionId) => {
        const cu = get().currentUser; if (!cu) return;
        const now = new Date().toISOString();
        await chatService.updateChatSession(sessionId, {
          handlerId: cu.id,
          handlerName: cu.name,
          status: 'IN_PROGRESS',
          firstResponseAt: now
        });

        const msg: ChatMessage = {
          id: uuidv4(),
          sessionId,
          senderId: 'system',
          senderName: 'System',
          content: `${cu.name} has joined the chat.`,
          isSystem: true,
          createdAt: now
        };

        await chatService.insertChatMessage({
          id: msg.id,
          sessionId: msg.sessionId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: 'SYSTEM',
          content: msg.content,
          isSystem: true,
          createdAt: now
        });

        set({
          chatSessions: get().chatSessions.map(s => s.id === sessionId ? {
            ...s,
            handlerId: cu.id,
            handlerName: cu.name,
            status: 'IN_PROGRESS',
            updatedAt: now
          } : s),
          chatMessages: [...get().chatMessages, msg]
        });
      },

      sendChatReply: async (sessionId, content, fileDetails) => {
        const cu = get().currentUser; if (!cu) return;
        const now = new Date().toISOString();
        const msg: ChatMessage = {
          id: uuidv4(),
          sessionId,
          senderId: cu.id,
          senderName: cu.name,
          content,
          isSystem: false,
          createdAt: now,
          ...fileDetails
        };

        set({ chatMessages: [...get().chatMessages, msg] });

        chatService.insertChatMessage({
          id: msg.id,
          sessionId: msg.sessionId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: cu.role,
          content: msg.content,
          isSystem: false,
          createdAt: now,
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          fileSize: msg.fileSize || null
        }).catch(err => console.error("Error inserting chat message:", err));
      },

      subscribeChatMessages: (sessionId, onMessageReceived) => {
        const channel = supabase
          .channel(`chat-messages-${sessionId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ChatMessage',
              filter: `sessionId=eq.${sessionId}`
            },
            (payload) => {
              const newMsg = payload.new as ChatMessage;
              if (newMsg.sessionId === sessionId) {
                const exists = get().chatMessages.some(m => m.id === newMsg.id);
                if (!exists) {
                  set({ chatMessages: [...get().chatMessages, newMsg] });
                  if (onMessageReceived) {
                    onMessageReceived(newMsg);
                  }
                }
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      subscribeChatSessions: () => {
        const channel = supabase
          .channel('chat-sessions-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ChatSession'
            },
            (payload) => {
              const session = payload.new as ChatSession;
              if (payload.eventType === 'INSERT') {
                const exists = get().chatSessions.some(s => s.id === session.id);
                if (!exists) {
                  set({ chatSessions: [session, ...get().chatSessions] });
                }
              } else if (payload.eventType === 'UPDATE') {
                set({
                  chatSessions: get().chatSessions.map(s => s.id === session.id ? session : s)
                });
              } else if (payload.eventType === 'DELETE') {
                set({
                  chatSessions: get().chatSessions.filter(s => s.id !== (payload.old as any).id)
                });
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      convertChatToTicket: async (sessionId) => {
        const session = get().chatSessions.find(s => s.id === sessionId);
        if (!session) return;
        
        const sessionMsgs = get().chatMessages.filter(m => m.sessionId === sessionId && !m.isSystem);
        const chatContext = sessionMsgs.map(m => `[${m.senderName}]: ${m.content}`).join('\n');

        const ticketId = uuidv4();
        const ticketNumber = ticketId.slice(0, 8).toUpperCase();
        const now = new Date().toISOString();

        // 1. Insert system message explaining ticket conversion
        const systemMsg: ChatMessage = {
          id: uuidv4(),
          sessionId,
          senderId: 'system',
          senderName: 'System',
          content: `Percakapan ini telah dialihkan menjadi tiket bantuan resmi dengan nomor tiket #TK-${ticketNumber}. Sesi chat akan ditutup.`,
          isSystem: true,
          createdAt: now
        };

        await chatService.insertChatMessage({
          id: systemMsg.id,
          sessionId: systemMsg.sessionId,
          senderId: systemMsg.senderId,
          senderName: systemMsg.senderName,
          senderRole: 'SYSTEM',
          content: systemMsg.content,
          isSystem: true,
          createdAt: now
        });

        // 2. Close session (this will also add the closed session system message)
        await get().closeChatSession(sessionId);

        // 3. Add Ticket
        const slaDeadline = calculateSlaDeadline('MEDIUM', now);
        const ticket: Ticket = {
          id: ticketId,
          title: `Chat Session with ${session.employeeName}`,
          description: `Converted from chat session.\n\nChat Log:\n${chatContext}`,
          status: 'OPEN',
          priority: 'MEDIUM',
          reporterId: session.employeeId,
          assigneeId: session.handlerId,
          category: 'General',
          slaDeadline,
          createdAt: now,
          updatedAt: now,
          resolvedAt: null,
        };
        get().addAuditLog('TICKET_CREATED', `Ticket "${ticket.title}" created`);
        
        await ticketService.createTicket({
          id: ticket.id,
          ticketNumber: ticketNumber,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          reporterId: sanitizeDbId(ticket.reporterId, get().users),
          assigneeId: sanitizeNullableDbId(ticket.assigneeId),
          category: ticket.category,
          slaDeadline: ticket.slaDeadline,
          updatedAt: now
        });

        set({ 
          tickets: [...get().tickets, ticket],
          chatMessages: [...get().chatMessages, systemMsg] 
        });

        // Resolve valid spaceId and listId (Opsi E)
        let defSpaceId = '';
        let defListId = '';

        const mockSpaceIds = ['space-1', 'space-2', 'space-3'];
        const validSpaces = get().spaces.filter(s => !mockSpaceIds.includes(s.id));
        if (validSpaces.length > 0) {
          defSpaceId = validSpaces[0].id;
          const matchingList = get().lists.find(l => l.spaceId === defSpaceId && !['list-1', 'list-2', 'list-3', 'list-4'].includes(l.id));
          if (matchingList) {
            defListId = matchingList.id;
          }
        }

        // If not found in state, query database via taskService
        if (!defSpaceId) {
          try {
            const result = await taskService.getDefaultSpaceAndList();
            if (result.spaceId) {
              defSpaceId = result.spaceId;
              if (result.listId) {
                defListId = result.listId;
              }
            }
          } catch (err) {
            console.error("Error fetching default space/list from taskService:", err);
          }
        }

        // Final fallback to state defaults if database is completely empty
        if (!defSpaceId && get().spaces.length > 0) {
          defSpaceId = get().spaces[0].id;
          const matchingList = get().lists.find(l => l.spaceId === defSpaceId);
          if (matchingList) {
            defListId = matchingList.id;
          }
        }

        const taskPriority = ticket.priority === 'CRITICAL' ? 'urgent' :
                             ticket.priority === 'HIGH' ? 'high' :
                             ticket.priority === 'MEDIUM' ? 'normal' : 'low';

        await get().addTask({
          title: `Ticket #TK-${ticketNumber}: ${ticket.title}`,
          description: ticket.description,
          status: 'todo',
          priority: taskPriority,
          assigneeIds: ticket.assigneeId ? [ticket.assigneeId] : [],
          spaceId: defSpaceId || null as any,
          listId: defListId || null as any,
          ticketId: ticket.id
        });
      },

      // EQUIPMENT CHECKOUT (SYNCED WITH SUPABASE)
      addEquipmentCheckout: async (data) => {
        const cu = get().currentUser; if (!cu) return;
        const checkoutId = uuidv4();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const checkoutNumber = `CHK-${dateStr}-${uuidv4().slice(0, 4).toUpperCase()}`;
        const now = new Date().toISOString();

        const newCheckout: EquipmentCheckout = {
          id: checkoutId,
          checkoutNumber,
          technicianId: cu.id,
          ticketId: null,
          taskId: null,
          purpose: data.purpose,
          status: 'PENDING_APPROVAL',
          expectedReturn: data.expectedReturn || null,
          actualReturn: null,
          notes: null,
          createdAt: now,
          updatedAt: now
        };

        await get().enqueueWrite('EquipmentCheckout', 'insert', {
          id: newCheckout.id,
          checkoutNumber: newCheckout.checkoutNumber,
          technicianId: newCheckout.technicianId,
          ticketId: null,
          taskId: null,
          purpose: newCheckout.purpose,
          status: 'PENDING_APPROVAL',
          approvalStatus: 'PENDING',
          expectedReturn: newCheckout.expectedReturn,
          createdAt: now,
          updatedAt: now
        });

        const checkoutItems: CheckoutItem[] = [];
        for (const item of data.items) {
          const itemId = uuidv4();
          await get().enqueueWrite('CheckoutItem', 'insert', {
            id: itemId,
            checkoutId,
            assetId: item.assetId,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            scannedOut: false,
            scannedIn: false
          });
          checkoutItems.push({
            id: itemId,
            checkoutId,
            assetId: item.assetId,
            inventoryId: item.inventoryId,
            quantity: item.quantity
          });
        }

        newCheckout.items = checkoutItems;
        set({
          equipmentCheckouts: [newCheckout, ...get().equipmentCheckouts]
        });

        get().addAuditLog('CHECKOUT_REQUESTED', `Equipment checkout request ${checkoutNumber} submitted`);

        // Trigger Telegram alert for equipment checkout
        const itemDescriptions = data.items.map(item => {
          if (item.assetId) {
            const asset = get().assets.find(a => a.id === item.assetId);
            return `- Asset: ${asset?.name || 'Unknown Asset'} (Qty: ${item.quantity})`;
          } else if (item.inventoryId) {
            const inv = get().inventories.find(i => i.id === item.inventoryId);
            return `- Barang: ${inv?.name || 'Unknown Inventory'} (Qty: ${item.quantity})`;
          }
          return `- Unknown Item (Qty: ${item.quantity})`;
        }).join('\n');

        get().triggerTelegramAlert(
          `⚙️ Permintaan Checkout Alat: ${checkoutNumber}`,
          `Boss, ada permintaan checkout peralatan baru oleh **${cu.name}**:\n\n**Tujuan/Keperluan:** ${newCheckout.purpose}\n**Batas Waktu Pengembalian:** ${newCheckout.expectedReturn}\n\n**Daftar Barang:**\n${itemDescriptions}`,
          'INFO'
        );
      },

      approveEquipmentCheckout: async (id) => {
        const cu = get().currentUser; if (!cu) return;
        const now = new Date().toISOString();
        const checkout = get().equipmentCheckouts.find(c => c.id === id);
        if (!checkout) return;

        await operationsService.updateEquipmentCheckout(id, {
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approverId: cu.id,
          approvedAt: now
        });

        if (checkout.items) {
          for (const item of checkout.items) {
            if (item.assetId) {
              await assetService.updateAsset(item.assetId, {
                status: 'DEPLOYED',
                assignedToId: checkout.technicianId
              });
            }
            if (item.inventoryId) {
              const inv = await assetService.getInventoryById(item.inventoryId);
              if (inv) {
                const newQty = inv.quantity - item.quantity;
                await assetService.updateInventoryQuantity(item.inventoryId, newQty);

                await assetService.insertInventoryTransaction({
                  id: uuidv4(),
                  type: 'OUT',
                  quantity: item.quantity,
                  previousQty: inv.quantity,
                  newQty: newQty,
                  notes: `Checkout approved for ${checkout.checkoutNumber}`,
                  inventoryId: item.inventoryId,
                  userId: cu.id,
                  referenceId: checkout.ticketId || checkout.taskId || checkout.id
                });

                if (newQty < inv.minStock) {
                  get().addAuditLog('LOW_STOCK_ALERT', `Stock for "${inv.name}" dropped below minimum threshold (${inv.minStock}) during checkout approval. Current: ${newQty}`);
                  
                  const recipientUsers = get().users.filter(u => u.role !== 'EMPLOYEE');
                  const newDbNotifs = recipientUsers.map(u => ({
                    id: uuidv4(),
                    userId: u.id,
                    title: 'Low Stock Alert ⚠️',
                    message: `${inv.name} stock is low: ${newQty} ${inv.unit} left (minimum threshold is ${inv.minStock}).`,
                    type: 'STOCK_ALERT',
                    isRead: false,
                    createdAt: new Date().toISOString()
                  }));
                  if (newDbNotifs.length > 0) {
                    await userService.insertNotifications(newDbNotifs);
                  }

                  get().triggerTelegramAlert(
                    `⚠️ Peringatan Stok Rendah: ${inv.name}`,
                    `Boss, stok barang "${inv.name}" sudah menipis!\n\n**Sisa Stok:** ${newQty} ${inv.unit}\n**Ambang Minimum:** ${inv.minStock} ${inv.unit}\n**Lokasi:** ${inv.location || 'Warehouse'}`,
                    'WARN'
                  );
                }
              }
            }
          }
        }

        set({
          equipmentCheckouts: get().equipmentCheckouts.map(c => c.id === id ? {
            ...c,
            status: 'APPROVED',
            updatedAt: now
          } : c)
        });

        get().addAuditLog('CHECKOUT_APPROVED', `Equipment checkout ${checkout.checkoutNumber} approved`);
        await get().loadAllData();
      },

      returnEquipmentItem: async (checkoutId, itemId, condition, notes) => {
        const cu = get().currentUser; if (!cu) return;
        const now = new Date().toISOString();

        try {
          await operationsService.updateCheckoutItem(itemId, {
            scannedIn: true,
            scannedInAt: now,
            conditionIn: condition,
            damageNotes: notes || null
          });
        } catch (itemErr) {
          console.error("Error updating CheckoutItem:", itemErr);
          return;
        }

        try {
          const itemData = await operationsService.getCheckoutItemById(itemId);
          if (itemData && itemData.assetId) {
            const newAssetStatus = (condition === 'DAMAGED' || condition === 'BROKEN') ? 'MAINTENANCE' : 'IN_STORAGE';
            await assetService.updateAsset(itemData.assetId, {
              status: newAssetStatus
            });
          }

          const remainingItems = await operationsService.getRemainingCheckoutItems(checkoutId);
          const isAllReturned = !remainingItems || remainingItems.length === 0;
          const newStatus = isAllReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';

          await operationsService.updateEquipmentCheckout(checkoutId, {
            status: newStatus,
            actualReturn: isAllReturned ? now : null
          });
        } catch (err) {
          console.error("Error during returnEquipmentItem operations:", err);
        }

        get().addAuditLog('CHECKOUT_ITEM_RETURNED', `Returned checkout item. Condition: ${condition}`);
        await get().loadAllData();
      },

      // GOODS RECEIPT (SYNCED WITH SUPABASE)
      addGoodsReceipt: async (data) => {
        const cu = get().currentUser; if (!cu) return;
        const receiptId = uuidv4();
        const now = new Date().toISOString();

        let targetInventoryId = data.inventoryId || null;
        let isNewInventoryItem = false;
        let newInvItem = null;

        if (data.destinationType === 'INVENTORY' && !data.inventoryId) {
          isNewInventoryItem = true;
          targetInventoryId = uuidv4();
          newInvItem = {
            id: targetInventoryId,
            name: data.itemName,
            description: data.notes || `Created via Goods Receipt ${data.receiptNumber}`,
            sku: 'SKU-' + uuidv4().slice(0, 8).toUpperCase(),
            quantity: 0, // Starts at 0 until verified by Manager
            unit: 'pcs',
            location: 'Warehouse',
            isVerified: false, // Pending verification
            createdAt: now,
            updatedAt: now,
            createdById: cu.id
          };
        }

        const newReceipt: GoodsReceipt = {
          id: receiptId,
          receiptNumber: data.receiptNumber,
          purchaseRequestId: data.purchaseRequestId || null,
          itemName: data.itemName,
          quantityOrdered: data.quantityOrdered,
          quantityReceived: data.quantityReceived,
          destinationType: data.destinationType,
          inventoryId: targetInventoryId,
          assetId: data.assetId || null,
          receivedById: cu.id,
          receivedAt: now,
          condition: data.condition,
          notes: data.notes || null,
          assetSerialNumber: data.assetSerialNumber || null,
          assetLocation: data.assetLocation || null,
          createdAt: now,
          updatedAt: now,
          price: data.price || 0
        };

        set({ goodsReceipts: [newReceipt, ...get().goodsReceipts] });

        await get().enqueueWrite('GoodsReceipt', 'insert', newReceipt);

        if (data.purchaseRequestId) {
          set({
            stockRequests: get().stockRequests.map(r => r.id === data.purchaseRequestId ? { ...r, status: 'RECEIVED', updatedAt: now } : r)
          });
          await get().enqueueWrite('StockRequest', 'update', {
            status: 'RECEIVED',
            approvedById: cu.id,
            updatedAt: now
          }, 'id', data.purchaseRequestId);
        }

        if (data.destinationType === 'INVENTORY') {
          if (!isNewInventoryItem && targetInventoryId) {
            const inv = get().inventories.find(i => i.id === targetInventoryId);
            if (inv) {
              const newQty = inv.quantity + data.quantityReceived;
              set({
                inventories: get().inventories.map(i => i.id === targetInventoryId ? { ...i, quantity: newQty, updatedAt: now } : i)
              });

              await get().enqueueWrite('Inventory', 'update', {
                quantity: newQty,
                updatedAt: now
              }, 'id', targetInventoryId);

              await get().enqueueWrite('InventoryTransaction', 'insert', {
                id: uuidv4(),
                type: 'IN',
                quantity: data.quantityReceived,
                previousQty: inv.quantity,
                newQty: newQty,
                notes: `Received stock via receipt ${data.receiptNumber}`,
                inventoryId: targetInventoryId,
                userId: cu.id,
                referenceId: data.purchaseRequestId || data.receiptNumber
              });
            }
          } else if (newInvItem) {
            set({
              inventories: [...get().inventories, newInvItem]
            });
            await get().enqueueWrite('Inventory', 'insert', newInvItem);
          }
        } else if (data.destinationType === 'ASSET') {
          await get().addAsset({
            name: data.itemName,
            brand: '',
            type: 'Hardware',
            serialNumber: data.assetSerialNumber || uuidv4().slice(0, 8).toUpperCase(),
            location: data.assetLocation || 'IT Room',
            status: 'IN_STORAGE',
            price: data.price || 0,
            vendor: 'Unknown'
          });
        }

        get().addAuditLog('GOODS_RECEIVED', `Goods receipt ${data.receiptNumber} recorded`);
        if (navigator.onLine) {
          await get().loadAllData();
        }
      },

      addInventoryMaster: async (data) => {
        const cu = get().currentUser; if (!cu) return;
        const now = new Date().toISOString();
        const newId = uuidv4();
        const newItem = {
          id: newId,
          name: data.name,
          sku: data.sku,
          quantity: 0,
          minStock: data.minStock || 5,
          unit: data.unit || 'pcs',
          location: data.location || 'Warehouse',
          description: data.description || '',
          isVerified: true, // Direct Master Creation is verified immediately
          createdAt: now,
          updatedAt: now,
          createdById: cu.id
        };

        set({ inventories: [...get().inventories, newItem] });
        await get().enqueueWrite('Inventory', 'insert', newItem);
        get().addAuditLog('INVENTORY_MASTER_CREATED', `Master item "${newItem.name}" registered`);
      },

      updateInventoryMaster: async (id, updates) => {
        const now = new Date().toISOString();
        const previousInventories = get().inventories;

        set({
          inventories: get().inventories.map(i => i.id === id ? { ...i, ...updates, updatedAt: now } : i)
        });

        try {
          const dbUpdates: any = { updatedAt: now };
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
          if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
          if (updates.location !== undefined) dbUpdates.location = updates.location;
          if (updates.minStock !== undefined) dbUpdates.minStock = updates.minStock;
          if (updates.description !== undefined) dbUpdates.description = updates.description;

          await get().enqueueWrite('Inventory', 'update', dbUpdates, 'id', id);
          get().addAuditLog('INVENTORY_MASTER_UPDATED', `Master item updated`);
        } catch (error) {
          console.error("Failed to update inventory master. Rolling back.", error);
          set({ inventories: previousInventories });
          throw error;
        }
      },

      deleteInventoryMaster: async (id) => {
        set({
          inventories: get().inventories.filter(i => i.id !== id)
        });
        await get().enqueueWrite('Inventory', 'delete', null, 'id', id);
        get().addAuditLog('INVENTORY_MASTER_DELETED', `Master item deleted`);
      },

      verifyInventoryItem: async (id) => {
        const cu = get().currentUser; if (!cu) return;
        const now = new Date().toISOString();
        const inv = get().inventories.find(i => i.id === id);
        if (!inv) return;

        // Find associated GoodsReceipts to fetch quantity received
        const receipts = get().goodsReceipts.filter(r => r.inventoryId === id);
        const totalReceived = receipts.reduce((sum, r) => sum + r.quantityReceived, 0);

        set({
          inventories: get().inventories.map(i => i.id === id ? { ...i, isVerified: true, quantity: totalReceived, updatedAt: now } : i)
        });

        await get().enqueueWrite('Inventory', 'update', {
          isVerified: true,
          quantity: totalReceived,
          updatedAt: now
        }, 'id', id);

        // Record the transaction
        await get().enqueueWrite('InventoryTransaction', 'insert', {
          id: uuidv4(),
          type: 'IN',
          quantity: totalReceived,
          previousQty: 0,
          newQty: totalReceived,
          notes: `Verified and Activated via Manager Approval`,
          inventoryId: id,
          userId: cu.id,
          referenceId: receipts[0]?.id || id
        });

        get().addAuditLog('INVENTORY_VERIFIED', `Inventory item "${inv.name}" verified and activated`);
      },

      // AUDIT & UI MANAGEMENT
      addAuditLog: async (action, details) => {
        const cu = get().currentUser;
        const newLog = { 
          id: uuidv4(), 
          action, 
          details: details || '', 
          userId: cu?.id || 'system', 
          createdAt: new Date().toISOString() 
        };
        set({ auditLogs: [newLog, ...get().auditLogs].slice(0, 200) });
        try {
          await userService.insertAuditLog(newLog);
        } catch (e) {
          console.error("Error inserting audit log to Supabase:", e);
        }
      },
      markNotificationRead: async (id) => {
        set({ notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n) });
        if (!id.startsWith('default-') && !id.startsWith('low-stock-')) {
          await userService.markNotificationRead(id);
        }
      },
      markAllNotificationsRead: async () => {
        set({ notifications: get().notifications.map(n => ({ ...n, read: true })) });
        const cu = get().currentUser;
        if (cu) {
          await userService.markAllNotificationsRead(cu.id);
        }
      },
      clearNotifications: async () => {
        set({ notifications: [] });
        const cu = get().currentUser;
        if (cu) {
          await userService.clearNotifications(cu.id);
        }
      },
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),
      setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),
      setShowTaskModal: (show) => set({ showTaskModal: show, selectedTaskId: show ? get().selectedTaskId : null }),
      setShowTicketModal: (show) => set({ showTicketModal: show, selectedTicketId: show ? get().selectedTicketId : null }),
      setShowCreateTaskModal: (show) => set({ showCreateTaskModal: show }),
      setShowCreateTicketModal: (show) => set({ showCreateTicketModal: show }),
      setShowNotifications: (show) => set({ showNotifications: show }),
      setShowSettingsModal: (show, tab) => set({ showSettingsModal: show, settingsActiveTab: tab || 'profile' }),
      setShowChatWidget: (show) => set({ showChatWidget: show }),
      loadAllArchivedTickets: async () => {
        try {
          const dbTickets = await ticketService.getArchivedTickets();
          const mappedArchived = dbTickets.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status as any,
            priority: t.priority as any,
            reporterId: t.reporterId,
            assigneeId: t.assigneeId,
            category: t.category || 'General',
            assetId: t.assetId || null,
            slaDeadline: t.slaDeadline || null,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            resolvedAt: t.resolvedAt,
            isArchived: t.isArchived || false,
            isDeleteRequested: t.isDeleteRequested || false,
            csatRating: t.csatRating || null,
            csatFeedback: t.csatFeedback || null
          }));

          const currentTickets = get().tickets;
          const merged = [...currentTickets];
          
          mappedArchived.forEach(archivedTicket => {
            const index = merged.findIndex(t => t.id === archivedTicket.id);
            if (index >= 0) {
              merged[index] = archivedTicket;
            } else {
              merged.push(archivedTicket);
            }
          });

          set({ tickets: merged, archivedTicketsLoaded: true });
        } catch (e) {
          console.error("Error loading archived tickets:", e);
          throw e;
        }
      },

      addMaintenanceSchedule: async (schedule) => {
        const now = new Date().toISOString();
        const newSchedule: MaintenanceSchedule = {
          id: schedule.id || uuidv4(),
          assetId: schedule.assetId || '',
          title: schedule.title || '',
          description: schedule.description || null,
          frequency: schedule.frequency || 'WEEKLY',
          scheduledDate: schedule.scheduledDate || now,
          lastPerformed: null,
          isActive: schedule.isActive !== undefined ? schedule.isActive : true,
          notifyDaysBefore: schedule.notifyDaysBefore || 7,
          createdAt: now,
          updatedAt: now,
          checklistTemplateId: schedule.checklistTemplateId || null
        };
        set({ maintenanceSchedules: [newSchedule, ...get().maintenanceSchedules] });
        await get().enqueueWrite('MaintenanceSchedule', 'insert', newSchedule);
        get().addAuditLog('PM_SCHEDULE_CREATED', `Jadwal PM "${newSchedule.title}" dibuat untuk aset ${newSchedule.assetId}`);
      },
      updateMaintenanceSchedule: async (id, updates) => {
        const now = new Date().toISOString();
        set({
          maintenanceSchedules: get().maintenanceSchedules.map(s => s.id === id ? { ...s, ...updates, updatedAt: now } : s)
        });
        await get().enqueueWrite('MaintenanceSchedule', 'update', { ...updates, updatedAt: now }, 'id', id);
        get().addAuditLog('PM_SCHEDULE_UPDATED', `Jadwal PM ID ${id} diperbarui`);
      },
      deleteMaintenanceSchedule: async (id) => {
        const schedule = get().maintenanceSchedules.find(s => s.id === id);
        set({
          maintenanceSchedules: get().maintenanceSchedules.filter(s => s.id !== id)
        });
        await get().enqueueWrite('MaintenanceSchedule', 'delete', null, 'id', id);
        get().addAuditLog('PM_SCHEDULE_DELETED', `Jadwal PM "${schedule?.title || id}" dihapus`);
      },
      processMaintenanceSchedules: async () => {
        const schedules = get().maintenanceSchedules || [];
        const now = new Date();
        
        for (const schedule of schedules) {
          if (!schedule.isActive) continue;
          
          const scheduledDate = new Date(schedule.scheduledDate);
          if (scheduledDate <= now) {
            // 1. Resolve default Space and List IDs
            let defSpaceId = '';
            let defListId = '';
            const mockSpaceIds = ['space-1', 'space-2', 'space-3'];
            const validSpaces = get().spaces.filter(s => !mockSpaceIds.includes(s.id));
            if (validSpaces.length > 0) {
              defSpaceId = validSpaces[0].id;
              const matchingList = get().lists.find(l => l.spaceId === defSpaceId && !['list-1', 'list-2', 'list-3', 'list-4'].includes(l.id));
              if (matchingList) {
                defListId = matchingList.id;
              }
            }

            if (!defSpaceId || !defListId) {
              console.warn("Could not find default Space or List for PM Task.");
              continue;
            }

            // 2. Create the Ticket and the Task
            const ticketId = uuidv4();
            const ticketNumber = ticketId.slice(0, 8).toUpperCase();
            const ticketTitle = `PM: ${schedule.title} - ${scheduledDate.toLocaleDateString('id-ID')}`;
            const ticketDescription = `Tugas pemeliharaan preventif otomatis.\nAset: ${get().assets.find(a => a.id === schedule.assetId)?.name || schedule.assetId}\nFrekuensi: ${schedule.frequency}\nDeskripsi: ${schedule.description || '-'}`;
            
            const newTicket: Ticket = {
              id: ticketId,
              title: ticketTitle,
              description: ticketDescription,
              status: 'OPEN',
              priority: 'MEDIUM',
              type: 'Service Request',
              reporterId: get().currentUser?.id || 'user-system',
              assigneeId: null,
              category: 'Maintenance',
              assetId: schedule.assetId,
              slaDeadline: calculateSlaDeadline('MEDIUM', now.toISOString()),
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              resolvedAt: null,
            };

            set({ tickets: [...get().tickets, newTicket] });
            await get().enqueueWrite('Ticket', 'insert', {
              id: newTicket.id,
              ticketNumber,
              title: newTicket.title,
              description: newTicket.description,
              status: newTicket.status,
              priority: newTicket.priority,
              type: newTicket.type,
              reporterId: sanitizeDbId(newTicket.reporterId, get().users),
              assigneeId: null,
              category: newTicket.category,
              assetId: newTicket.assetId,
              slaDeadline: newTicket.slaDeadline,
              updatedAt: now.toISOString()
            });

            get().addAuditLog('TICKET_CREATED', `Ticket "${newTicket.title}" created automatically from PM schedule`);

            const taskId = uuidv4();
            const newTask: Task = {
              id: taskId,
              title: `Ticket #TK-${ticketNumber}: ${newTicket.title}`,
              description: newTicket.description,
              status: 'todo',
              priority: 'normal',
              assigneeIds: [],
              tags: [],
              subtasks: [],
              dueDate: scheduledDate.toISOString(),
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              spaceId: defSpaceId,
              listId: defListId,
              order: 0,
              timeEstimate: 0,
              timeTracked: 0,
              ticketId: newTicket.id,
              checklistTemplateId: schedule.checklistTemplateId || null
            };

            // Save Task to Supabase Staging and state
            set({ tasks: [newTask, ...get().tasks] });
            await get().enqueueWrite('Task', 'insert', {
              id: newTask.id,
              title: newTask.title,
              description: newTask.description,
              status: 'TODO',
              priority: 'MEDIUM',
              spaceId: newTask.spaceId,
              listId: newTask.listId,
              dueDate: newTask.dueDate,
              createdAt: newTask.createdAt,
              updatedAt: newTask.updatedAt,
              ticketId: newTask.ticketId,
              checklistTemplateId: newTask.checklistTemplateId
            });

            // 3. Calculate next scheduledDate
            const nextDate = new Date(scheduledDate);
            if (schedule.frequency === 'DAILY') {
              nextDate.setDate(nextDate.getDate() + 1);
            } else if (schedule.frequency === 'WEEKLY') {
              nextDate.setDate(nextDate.getDate() + 7);
            } else if (schedule.frequency === 'MONTHLY') {
              nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (schedule.frequency === 'YEARLY') {
              nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            // 4. Update the Schedule
            const updatedSchedule = {
              ...schedule,
              scheduledDate: nextDate.toISOString(),
              lastPerformed: now.toISOString(),
              updatedAt: now.toISOString()
            };

            set({
              maintenanceSchedules: get().maintenanceSchedules.map(s => s.id === schedule.id ? updatedSchedule : s)
            });

            await get().enqueueWrite('MaintenanceSchedule', 'update', {
              scheduledDate: updatedSchedule.scheduledDate,
              lastPerformed: updatedSchedule.lastPerformed,
              updatedAt: updatedSchedule.updatedAt
            }, 'id', schedule.id);

            // 5. Trigger Telegram Alert
            const assetName = get().assets.find(a => a.id === schedule.assetId)?.name || 'Aset';
            get().triggerTelegramAlert(
              `🔧 PM Otomatis Dipicu: ${schedule.title}`,
              `Boss, jadwal PM rutin "${schedule.title}" untuk aset **${assetName}** telah jatuh tempo. Tugas IT baru telah dibuat di papan tugas.`,
              'INFO'
            );
          }
        }
      },

      // COMPUTED / GETTERS
      getFilteredTasks: () => {
        const { tasks, selectedSpaceId, selectedListId, searchQuery, filterPriority, filterAssignee, activePage, currentUser } = get();
        return tasks.filter(task => {
          if (currentUser) {
            const isAdmin = ['ROOT', 'SUPER_ADMIN', 'ADMIN'].includes(currentUser.role);
            if (!isAdmin) {
              const isAssignedToMe = task.assigneeIds.includes(currentUser.id);
              const isUnassigned = task.assigneeIds.length === 0;
              // User cannot see other people's tasks (only their own or unassigned)
              if (!isAssignedToMe && !isUnassigned) return false;
            }
          }
          if (activePage === 'spaces') {
            if (selectedSpaceId && task.spaceId !== selectedSpaceId) return false;
            if (selectedListId && task.listId !== selectedListId) return false;
          }
          if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
          if (filterAssignee !== 'all' && !task.assigneeIds.includes(filterAssignee)) return false;
          return true;
        });
      },
      getTasksByStatus: (status) => get().getFilteredTasks().filter(t => t.status === status).sort((a, b) => a.order - b.order),
      getTaskComments: (taskId) => get().comments.filter(c => c.taskId === taskId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      getSpaceLists: (spaceId) => get().lists.filter(l => l.spaceId === spaceId).sort((a, b) => a.order - b.order),
      getUserById: (id) => get().users.find(u => u.id === id),
      getTagById: (id) => get().tags.find(t => t.id === id),
      getUnreadNotificationCount: () => get().notifications.filter(n => !n.read).length,
      getMyTasks: () => {
        const cu = get().currentUser;
        return cu ? get().tasks.filter(t => t.assigneeIds.includes(cu.id)) : [];
      },
      getInboxItems: () => {
        const { comments, tasks, currentUser } = get();
        if (!currentUser) return [];
        const myTaskIds = tasks.filter(t => t.assigneeIds.includes(currentUser.id)).map(t => t.id);
        return comments.filter(c => myTaskIds.includes(c.taskId) && c.userId !== currentUser.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(c => ({ ...c, task: tasks.find(t => t.id === c.taskId) }));
      },
      getTicketsByStatus: (status: TicketStatus) => get().tickets.filter(t => t.status === status),
      hasRole: (roles) => { const cu = get().currentUser; return cu ? roles.includes(cu.role) : false; },
    }),
    { name: 'clickhub-storage' }
  )
);
