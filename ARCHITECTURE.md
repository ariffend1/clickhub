# ClickHub Architecture

Comprehensive overview of ClickHub's system design, component architecture, and data flow.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Components  │  │  Zustand     │  │  PWA Features    │  │
│  │  (UI Layer)  │→ │  Store       │→ │  (Offline Sync)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────┬──────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
   ┌────▼─────┐            ┌────────▼──────┐
   │  Supabase │◄──────────►│   PostgreSQL   │
   │ (Auth +   │    REST    │   Database     │
   │  Real-    │    API     │                │
   │  time)    │            │                │
   └──────────┘            └────────────────┘
        │
        ├─→ Authentication
        ├─→ File Storage
        └─→ Real-time Subscriptions
```

## 📦 Layered Architecture

### 1. **Presentation Layer** (src/components/)
User interface components organized by feature:

```
components/
├── auth/              # Authentication UI
│   └── LoginPage
├── layout/            # App shell components
│   ├── Sidebar
│   ├── Header
│   └── SettingsModal
├── tasks/             # Task management
│   ├── BoardView
│   ├── ListView
│   ├── CalendarView
│   └── TaskDetailModal
├── pages/             # Full page components
│   ├── HomePage
│   ├── InboxPage
│   └── DashboardsPage
└── nexhub/            # IT operations modules
    ├── TicketsPage
    ├── AssetsPage
    ├── ChatWidget
    └── ReportsPage
```

### 2. **State Management Layer** (src/store/)
Centralized state using Zustand:

```typescript
// useStore.ts contains:
- User authentication state
- Tasks, tickets, assets data
- UI state (modals, view modes)
- Offline sync queues
- Theme preferences
```

**Key Features:**
- Persistent storage (localStorage)
- Offline support with write-buffer
- Failed sync recovery
- Real-time subscriptions

### 3. **Type System** (src/types/)
TypeScript interfaces for all entities:

```typescript
// Core types:
User, Task, Ticket, Asset, ChatSession
Spacee, TaskList, Comment, Notification
EquipmentCheckout, GoodsReceipt, etc.
```

### 4. **Integration Layer** (src/lib/)
External service configurations:

```typescript
// supabase.ts - Supabase client initialization
- Authentication
- Database queries
- File uploads
- Real-time listeners
```

### 5. **Utility Layer** (src/utils/)
Helper functions for common operations:

```
utils/
├── formatters.ts      # Date, time, number formatting
├── validators.ts      # Input validation
├── transformers.ts    # Data transformation
└── constants.ts       # App constants
```

## 🔄 Data Flow

### User Interaction Flow

```
User Input (Click, Form)
    ↓
Component Event Handler
    ↓
Update Zustand Store
    ↓
Local State Update (Instant UI feedback)
    ↓
Async Supabase Operation
    ↓
┌─ Success ─────────────────┐
│ Store synced with DB      │
│ Possible real-time update │
└───────────────────────────┘
    │
    ↓
UI Updates from Store
```

### Offline Sync Flow

```
User Action
    ↓
App Offline?
    ├─ YES → Queue in Write-Buffer
    │          └─ Show "Syncing" status
    │
    └─ NO → Direct Supabase Operation
            └─ Real-time update

App Back Online
    ↓
Process Sync Queue
    ↓
┌─ Successful ──────────────┐
│ All operations synced      │
│ Show "Synced" indicator    │
└────────────────────────────┘
    │
    ├─ Failed Operations?
    │  └─ Move to Failed Queue
    │     └─ User can Retry/Discard
```

## 🎯 Component Hierarchy

```
App (main entry)
├── LoginPage (if !isAuthenticated)
│
├── Sidebar
│   ├── Navigation links
│   ├── User profile
│   └── Theme toggle
│
├── Header
│   ├── Search bar
│   ├── Notifications
│   ├── Sync status
│   └── Settings
│
├── MainContent (based on activePage)
│   ├── HomePage
│   ├── TaskBoard/List/Calendar
│   ├── TicketsPage
│   ├── AssetsPage
│   ├── ReportsPage
│   └── ...
│
├── Modals
│   ├── TaskDetailModal
│   ├── CreateTaskModal
│   └── SettingsModal
│
└── ChatWidget
```

## 🗄️ Database Schema (Simplified)

### Core Tables

```sql
users
├── id, email, password, role
├── name, avatar, color
└── department, phone, isActive

tasks
├── id, title, description, status
├── priority, spaceId, listId
├── assigneeIds[], dueDate
├── timeEstimate, timeTracked
└── createdAt, updatedAt

tickets
├── id, title, description, status
├── priority, reporterId, assigneeId
├── category, assetId, slaDeadline
└── csatRating, resolution

assets
├── id, name, type, serialNumber
├── status, location, price
├── assignedToId, specs
└── purchaseDate, createdAt

chat_sessions
├── id, employeeId, handlerId
├── status, createdAt, updatedAt
└── messages[]
```

## 🔐 Security Architecture

### Authentication Flow

```
┌─ Login Page
│  ├─ Email & Password input
│  └─ Submit to Supabase Auth
│
├─ Supabase Auth Validation
│  └─ JWT token issued
│
├─ Fetch User Profile
│  └─ Check role & permissions
│
└─ Store JWT & User Data
   └─ Set authentication state
```

### Authorization

```
Role-Based Access Control (RBAC)
├── ROOT - All access
├── SUPER_ADMIN - Admin functions
├── ADMIN - Department administration
├── MANAGER - Team management
├── TECHNICIAN - Support operations
└── EMPLOYEE - Limited self-service

Row-Level Security (RLS)
└─ Supabase policies enforce data access
```

## 🔄 State Management Structure

### Zustand Store Organization

```typescript
const useStore = create<StoreState>((set, get) => ({
  // 1. Auth State
  isAuthenticated: boolean,
  currentUser: User | null,
  userRole: UserRole,

  // 2. Data State
  tasks: Task[],
  tickets: Ticket[],
  assets: Asset[],
  chatSessions: ChatSession[],

  // 3. UI State
  activePage: ActivePage,
  viewMode: ViewMode,
  showTaskModal: boolean,
  theme: 'light' | 'dark',

  // 4. Sync State
  syncQueue: Operation[],
  failedSyncQueue: FailedOperation[],
  isSyncing: boolean,

  // 5. Actions
  login: (email, password) => Promise<void>,
  logout: () => void,
  createTask: (task) => Promise<void>,
  updateTask: (id, updates) => Promise<void>,
  processSyncQueue: () => Promise<void>,
  // ... more actions
}))
```

## 🌐 API Integration

### Supabase REST API Usage

```typescript
// Examples from useStore.ts

// Read
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('spaceId', spaceId);

// Create
const { data, error } = await supabase
  .from('tasks')
  .insert([newTask])
  .select();

// Update
const { data, error } = await supabase
  .from('tasks')
  .update({ status: 'done' })
  .eq('id', taskId);

// Real-time subscription
supabase
  .channel('tasks')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => { /* update state */ }
  )
  .subscribe();
```

## 📱 PWA Architecture

### Service Worker

```
Service Worker (sw.js)
├── Cache static assets
├── Handle offline requests
├── Background sync
└── Push notifications

Manifest (manifest.json)
├── App metadata
├── Icons
├── Theme colors
└── Display mode
```

### Offline Support

```
Write Operations (Online)
  ↓
Immediate Zustand Update
  ↓
Async Supabase Operation

Write Operations (Offline)
  ↓
Queue in Zustand Store
  ↓
Show "Offline" indicator
  ↓
When Online → Process Queue
```

## 🎨 Theme System

### CSS Variables Architecture

```css
/* Root theme variables */
:root[data-theme="light"] {
  --bg-main: #ffffff;
  --c-text: #000000;
  --border-color: #e5e7eb;
  /* ... more variables ... */
}

:root[data-theme="dark"] {
  --bg-main: #1a1a1a;
  --c-text: #ffffff;
  --border-color: #333333;
  /* ... */
}

/* Component usage */
.component {
  background: var(--bg-main);
  color: var(--c-text);
}
```

## 🔔 Notification System

### Architecture

```
Notification Trigger
  ├─ Task assigned
  ├─ Comment mentioned
  ├─ Due date approaching
  └─ Ticket status changed
    ↓
Zustand Store Update
    ↓
┌─ In-app Toast (Sonner) ────┐
│ Instant user feedback       │
├─────────────────────────────┤
│ External Channel (Optional) │
│ ├─ Telegram Bot             │
│ ├─ Webhook                  │
│ └─ Email (via Supabase)     │
└─────────────────────────────┘
```

## 📊 Performance Optimization

### Strategies

1. **Code Splitting**
   - Route-based splitting with React.lazy()
   - Component lazy loading

2. **Bundle Optimization**
   - Tree-shaking unused code
   - Single-file build for deployment

3. **State Optimization**
   - Selective subscriptions
   - Normalized state structure

4. **Caching**
   - Browser cache with Service Worker
   - Supabase response caching

## 🚀 Build & Deployment Pipeline

### Development
```
npm run dev
  ↓
Vite Dev Server (HMR enabled)
  ↓
Browser at http://localhost:5173
```

### Production
```
npm run build
  ↓
Vite Build + Tailwind
  ↓
vite-plugin-singlefile
  ↓
Single dist/index.html
  ↓
Deploy to static hosting
```

## 📈 Scalability Considerations

1. **Database Scaling**
   - Use Supabase replication
   - Implement read replicas if needed

2. **Frontend Scaling**
   - Virtualize long lists
   - Paginate large datasets

3. **Caching Strategy**
   - Cache frequently accessed data
   - Implement TTL for fresh data

4. **Real-time Optimization**
   - Debounce updates
   - Batch operations

---

**For more details, see:**
- [README.md](./README.md) - Feature overview
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup guide
- [src/types/index.ts](./src/types/index.ts) - Type definitions