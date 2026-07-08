export type Priority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'pending' | 'in_review' | 'done';
export type ViewMode = 'board' | 'list' | 'calendar';
export type ActivePage = 'home' | 'inbox' | 'my_tasks' | 'dashboards' | 'spaces' | 'tickets' | 'assets' | 'knowledge' | 'admin' | 'chat_admin' | 'reports' | 'checkout' | 'receipt';
export type UserRole = 'ROOT' | 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'EMPLOYEE';

export interface AuthUser extends User {
  password: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive: boolean;
  title?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeIds: string[];
  tags: string[];
  subtasks: Subtask[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  spaceId: string;
  listId: string;
  order: number;
  timeEstimate: number;
  timeTracked: number;
  ticketId?: string | null;
  isRecurring: boolean;
  recurInterval?: number;
  recurUnit?: 'days' | 'weeks' | 'months' | 'years';
  recurBehavior?: 'create_new' | 'reset_status';
  checklistTemplateId?: string | null;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  spaceId: string;
  order: number;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}

export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'moved' | 'commented' | 'completed';
  taskId: string;
  userId: string;
  description: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: any;
  title: string;
  message: string;
  taskId?: string;
  ticketId?: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  ticketId: string;
  uploadedAt: string;
  isDeleteRequested?: boolean;
  deleteReason?: string;
  deleteRequestedById?: string;
  originalSize?: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: 'Incident' | 'Service Request';
  reporterId: string;
  assigneeId: string | null;
  helperAssigneeIds?: string[];
  category: string;
  assetId?: string | null;
  slaDeadline?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  inProgressAt?: string | null;
  isArchived?: boolean;
  isDeleteRequested?: boolean;
  csatRating?: number | null;
  csatFeedback?: string | null;
  resolution?: string | null;
  attachments?: Attachment[];
}


export type AssetStatus = 'DRAFT' | 'IN_STORAGE' | 'DEPLOYED' | 'MAINTENANCE' | 'RETIRED';

export interface Asset {
  id: string;
  name: string;
  brand: string;
  type: string;
  serialNumber: string;
  location: string;
  status: AssetStatus;
  purchaseDate: string | null;
  price: number;
  vendor: string;
  assignedToId: string | null;
  specs: {
    processor?: string;
    ram?: string;
    storage?: string;
    os?: string;
    ipAddress?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublic: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export type ChatStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSE_REQUESTED' | 'CLOSED';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export interface ChatSession {
  id: string;
  employeeId: string;
  employeeName: string;
  handlerId: string | null;
  handlerName: string | null;
  status: ChatStatus;
  closeRequestedBy: string | null;
  closeRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  createdAt: string;
}

export interface CheckoutItem {
  id: string;
  checkoutId: string;
  assetId: string | null;
  inventoryId: string | null;
  quantity: number;
  scannedIn?: boolean;
  scannedInAt?: string | null;
  conditionIn?: 'GOOD' | 'DAMAGED' | 'BROKEN' | null;
  damageNotes?: string | null;
}

export interface EquipmentCheckout {
  id: string;
  checkoutNumber: string;
  technicianId: string;
  ticketId: string | null;
  taskId: string | null;
  purpose: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | 'OVERDUE' | 'PARTIALLY_RETURNED' | 'LOST';
  expectedReturn: string;
  actualReturn: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: CheckoutItem[];
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseRequestId: string | null;
  itemName: string;
  quantityOrdered: number;
  quantityReceived: number;
  destinationType: 'ASSET' | 'INVENTORY';
  inventoryId: string | null;
  assetId: string | null;
  receivedById: string;
  receivedAt: string;
  condition: 'GOOD' | 'DAMAGED' | 'INCOMPLETE';
  notes: string | null;
  assetSerialNumber?: string | null;
  assetLocation?: string | null;
  createdAt?: string;
  updatedAt?: string;
  price?: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  isNational: boolean;
  isCutiBersama: boolean;
}

export interface Inventory {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  quantity: number;
  quantityInService: number;
  minStock: number;
  unit: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  createdById?: string | null;
  verifiedById?: string | null;
  verifiedAt?: string | null;
}

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  scheduledDate: string;
  lastPerformed: string | null;
  isActive: boolean;
  notifyDaysBefore: number;
  createdAt: string;
  updatedAt: string;
  checklistTemplateId?: string | null;
}

export interface DirectoryCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order?: number;
  visibility?: 'PUBLIC' | 'INTERNAL';
  createdAt?: string;
  updatedAt?: string;
}

export interface DirectoryEntry {
  id: string;
  categoryId: string;
  name: string;
  value: string;
  description?: string | null;
  location?: string | null;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ConfigType = 
  | 'SERVER_PHYSICAL' | 'SERVER_VM' | 'CONTAINER_POD'
  | 'NET_DEVICE' | 'NET_SUBNET' | 'NET_ROUTING' | 'NET_DNS_DOMAIN'
  | 'DATABASE_INSTANCE' | 'STORAGE_VOLUME'
  | 'SERVICE_ENDPOINT' | 'INTEGRATION_QUEUE'
  | 'CRED_CERTIFICATE' | 'CRED_ACCOUNT' | 'CRED_LICENSE'
  | 'TELEPHONY_SIP' | 'OPERATIONS_CONTACT' | 'OFFICE_ENDPOINT';

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  items?: ChecklistTemplateItem[];
}

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  question: string;
  priorityOnFailure: TicketPriority;
  category: string;
  order: number;
}

export interface ChecklistSubmission {
  id: string;
  taskId: string;
  templateId: string;
  submittedById: string;
  submittedAt: string;
  values?: ChecklistSubmissionValue[];
}

export interface ChecklistSubmissionValue {
  id: string;
  submissionId: string;
  itemId: string;
  value: 'OK' | 'FAIL';
  notes?: string | null;
  createdTicketId?: string | null;
}


