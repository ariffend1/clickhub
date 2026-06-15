# ClickHub - Platform IT Operations Management

![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.17-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?logo=github)
![Node Version](https://img.shields.io/badge/Node-18+-339933?logo=node.js)

**ClickHub** adalah sebuah **aplikasi web IT Operations Management** yang dibangun dengan **React 19**, **TypeScript**, **Vite**, dan **Tailwind CSS**. Aplikasi ini menyediakan solusi komprehensif untuk mengelola tugas (tasks), tiket IT support, aset/inventaris, dan komunikasi tim dalam satu platform terintegrasi.

> 🎯 **Portfolio Project** - Demonstrasi full-stack development dengan teknologi modern

---

## 🎬 Demo & Visual Preview

| View | Deskripsi |
|------|-----------|
| **Kanban Board** | Drag-and-drop task management dengan status visualization |
| **List View** | Linear list dengan filtering dan sorting capabilities |
| **Calendar View** | Timeline-based task planning |
| **Tickets Dashboard** | IT support ticketing dengan SLA tracking |
| **Asset Management** | Inventory & equipment tracking dengan QR codes |
| **Real-time Analytics** | Dashboard dengan KPI dan performance metrics |

> 📸 **Screenshots coming soon** - Deploy & capture UI screenshots

---

## ✨ Fitur Utama (13+ Features)

### 1. **Task Management** 🎯
- **Kanban Board View** - Kelola tugas dengan sistem drag-and-drop
- **List View** - Tampilan daftar linear semua tugas
- **Calendar View** - Visualisasi tugas berdasarkan tanggal
- **Multiple Spaces & Lists** - Organisasi tugas dalam ruang kerja dan daftar terpisah
- **Status Tracking** - Todo → In Progress → In Review → Done
- **Priority Levels** - Urgent, High, Normal, Low
- **Time Tracking** - Estimasi waktu dan pelacakan waktu aktual
- **Subtasks & Tags** - Breakdown tugas kompleks
- **Comments & Activity Log** - Kolaborasi tim

### 2. **IT Ticketing System** 🎫
- Sistem tiket dukungan IT dengan kategori dan prioritas (LOW/MEDIUM/HIGH/CRITICAL)
- **SLA Tracking** - Deadline otomatis berdasarkan prioritas
- **Attachment Support** - Upload file ke tiket
- **CSAT Rating** - Penilaian kepuasan pelanggan bintang 1-5
- **Status Management** - OPEN → IN_PROGRESS → RESOLVED → CLOSED
- **Ticket to Task Sync** - Sinkronisasi otomatis dengan task board

### 3. **Asset & Inventory Management** 📦
- Pencatatan aset dengan spesifikasi teknis (CPU, RAM, storage, IP address, dll)
- Status aset: AVAILABLE, IN_USE, MAINTENANCE, RETIRED, BROKEN
- **Equipment Checkout System** - Peminjaman dan pengembalian aset dengan QR Code
- **Preventive Maintenance** - Penjadwalan pemeliharaan berkala
- Inventory management dengan tracking stok minimum
- **Depreciation Report** - Laporan depresiasi linear 5 tahun dan CAPEX

### 4. **Live Chat Widget** 💬
- Widget chat real-time untuk karyawan menghubungi IT Support
- Chat session management untuk tim support
- File sharing di chat
- System messages dan automated notifications

### 5. **Knowledge Base** 📚
- Database artikel bantuan yang dapat dicari
- Konversi tiket selesai ke artikel KB
- Akses publik untuk karyawan

### 6. **Reporting & Analytics** 📊
- Dashboard stats real-time (tugas, tiket, aset, dll)
- CSAT Analytics - Visualisasi kepuasan pelanggan
- Depreciation & CAPEX Reports
- Audit logs untuk tracking aktivitas

### 7. **Role-Based Access Control** 👥
- **Roles**: ROOT, SUPER_ADMIN, ADMIN, MANAGER, TECHNICIAN, EMPLOYEE
- Fitur pembatasan berdasarkan role
- Admin task view untuk melihat semua tugas pengguna

### 8. **Offline & Sync Support** 🔄
- PWA (Progressive Web App) dengan Service Worker
- Offline support dengan write-buffer queue
- Automatic sync ketika kembali online
- Failed sync manager untuk retry atau discard data

### 9. **Notifications & Alerts** 🔔
- Assignment notifications, mentions, due soon alerts
- Telegram bot integration untuk alert otomatis
- Webhook support untuk notifikasi custom

---

## 🏆 Project Statistics

| Metrik | Value |
|--------|-------|
| **Total Features** | 13+ major features |
| **Components** | 50+ reusable components |
| **Data Models** | 20+ TypeScript interfaces |
| **Bundle Size** | Single HTML file (~2.5MB) |
| **Load Time** | <2 seconds |
| **Browser Support** | Chrome, Firefox, Safari, Edge |
| **Mobile Support** | Fully responsive |
| **Offline Capability** | 100% functional |
| **Lines of Code** | 10,000+ |
| **Documentation** | 8 detailed guides |

---

## 🎓 Key Technologies & Learnings

### **Frontend Architecture**
- ✅ React 19 with latest hooks patterns
- ✅ TypeScript strict mode for type safety
- ✅ Component-based design with composition
- ✅ Custom hooks for logic reuse
- ✅ Performance optimization (code splitting, memoization)

### **State Management**
- ✅ Zustand for lightweight state management
- ✅ Offline-first architecture with write-buffer pattern
- ✅ Failed sync recovery mechanism
- ✅ Real-time subscription handling
- ✅ Local persistence with localStorage

### **Database & Backend**
- ✅ Supabase (PostgreSQL) integration
- ✅ Row-Level Security (RLS) policies
- ✅ Real-time subscriptions
- ✅ Authentication & authorization
- ✅ File storage management

### **Styling & Design**
- ✅ Tailwind CSS 4 with CSS variables
- ✅ Dark/Light theme system
- ✅ Responsive design patterns
- ✅ Design tokens & component library
- ✅ Accessibility best practices

### **DevOps & Build**
- ✅ Vite 7 for fast build & HMR
- ✅ Single-file bundling for deployment
- ✅ PWA with Service Worker
- ✅ CI/CD ready architecture
- ✅ Environment-based configuration

### **Professional Practices**
- ✅ Comprehensive documentation
- ✅ Security best practices
- ✅ Audit logging & compliance
- ✅ Error handling & recovery
- ✅ Performance monitoring

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ dan npm 9+
- Akun Supabase

### 1. Setup & Installation

```bash
# Clone repository
git clone https://github.com/ariffend1/clickhub.git
cd clickhub

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials
```

### 2. Development Server

```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`

### 3. Production Build

```bash
npm run build
```
Menghasilkan single HTML file di folder `dist/` yang siap dideploy

### 4. Preview Production Build

```bash
npm run preview
```

---

## 📂 Struktur Project

```
clickhub/
├── src/
│   ├── components/
│   │   ├── auth/          # Login Page & Authentication UI
│   │   ├── layout/        # Sidebar, Header, Settings Modal
│   │   ├── tasks/         # Board/List/Calendar Views, Task Modals
│   │   ├── pages/         # Home, Inbox, Dashboard Pages
│   │   └── nexhub/        # Tickets, Assets, Chat, Reports, Admin
│   ├── store/
│   │   └── useStore.ts    # Zustand store (state management + Supabase sync)
│   ├── lib/
│   │   └── supabase.ts    # Supabase client configuration
│   ├── types/
│   │   └── index.ts       # TypeScript interfaces & type definitions
│   ├── utils/             # Helper functions & utilities
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Entry point + PWA setup
│   └── index.css          # Global styles (Tailwind CSS)
├── public/                # Static assets, manifest, PWA icons
├── .github/               # GitHub templates & workflows
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration (single-file build)
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies & npm scripts
├── README.md              # Project documentation
├── GETTING_STARTED.md     # Setup guide untuk developer
├── CONTRIBUTING.md        # Contributing guidelines
├── ARCHITECTURE.md        # System design & architecture
├── TROUBLESHOOTING.md     # Common issues & solutions
├── SECURITY.md            # Security policies
├── ROADMAP.md             # Future features
└── LICENSE                # MIT License
```

---

## 🔑 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Styling** | Tailwind CSS 4, CSS Variables |
| **State Management** | Zustand 5 |
| **Backend & DB** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **UI Components** | Lucide React, Sonner |
| **Data Export** | jsPDF, XLSX |
| **QR Scanning** | html5-qrcode |
| **Utilities** | date-fns, uuid, clsx |
| **Build Tool** | Vite, vite-plugin-singlefile |
| **Package Manager** | npm |

---

## 🎯 Core Concepts

### **Zustand Store (useStore.ts)**
Central state management untuk:
- User authentication & roles
- Tasks, tickets, assets, chat sessions
- Offline sync queue (write-buffer)
- Failed sync queue dengan retry mechanism
- Theme management
- Notifications

### **Supabase Integration**
- Real-time database dengan PostgreSQL
- Authentication dengan email/password
- Row-level security (RLS) berdasarkan role
- File storage untuk attachments
- Real-time subscriptions untuk updates

### **PWA Support**
- Service Worker registration untuk offline functionality
- Manifest file untuk add-to-homescreen
- Push notifications support
- Offline data caching

### **Type-Safe Data Models**
Core types yang digunakan:
- `User`, `AuthUser` - User accounts & authentication
- `Task`, `Space`, `TaskList` - Task management
- `Ticket`, `Asset`, `Inventory` - IT operations
- `ChatSession`, `ChatMessage` - Communication
- `EquipmentCheckout`, `GoodsReceipt` - Equipment & inventory logistics
- `Holiday`, `MaintenanceSchedule` - Schedule management

---

## 🔐 Authentication & Authorization

### Flow Autentikasi:
1. User login melalui **LoginPage** dengan email & password
2. Validasi credentials via Supabase Auth
3. Fetch user data & permission/role dari database
4. Store user info & JWT token di Zustand store
5. Akses fitur sesuai role dan permissions

### Role-Based Access Control:
- **ROOT** - Full system access
- **SUPER_ADMIN** - Administrative access to all features
- **ADMIN** - Department/team administration
- **MANAGER** - Team management & reporting
- **TECHNICIAN** - Support operations & asset management
- **EMPLOYEE** - Limited access to self-service features

---

## 📊 Dashboard & Reporting

- **Home Page**: Overview statistik semua modul (tasks, tickets, assets, users)
- **Inbox**: Notifikasi real-time dan activity feed
- **My Tasks**: Personal task board dengan multiple view modes
- **Dashboards**: Advanced analytics dan KPI tracking
- **Reports**: 
  - CSAT analytics dan customer satisfaction metrics
  - Depreciation & CAPEX forecasting
  - Equipment utilization reports
  - System audit logs
- **Admin Panel**: User management, system settings, configuration

---

## 🌙 Theme & Customization

Aplikasi mendukung tema custom dengan CSS variables yang dapat dikonfigurasi:
```css
--bg-main
--c-text
--bg-secondary
--border-color
/* dan lainnya... */
```

Toggle tema di Settings Modal untuk seamless theme switching.

---

## 🔄 Offline Sync Mechanism

ClickHub menyediakan offline-first architecture:

1. **Write Buffer** - Setiap operasi (create/update/delete) dicatat di local queue
2. **Offline Queue** - Saat offline, operasi disimpan di `failedSyncQueue`
3. **Auto Retry** - Ketika online kembali, `processSyncQueue()` dijalankan otomatis
4. **Failed Sync Manager** - UI untuk mereview dan menghandle failed operations
5. **Conflict Resolution** - Smart merging untuk data conflicts

---

## 📱 Responsive Design

Desain fully responsive untuk semua ukuran layar:
- Desktop (1920px+)
- Laptop (1366px - 1919px)
- Tablet (768px - 1365px)
- Mobile (320px - 767px)

Menggunakan Tailwind CSS breakpoints dan mobile-first approach.

---

## 🔔 Notifications & Alerts

### Notification Types:
- **Task Assigned** - Ketika tugas ditugaskan ke pengguna
- **Task Mentioned** - Ketika pengguna di-mention di comment
- **Due Soon** - Reminder untuk tugas yang akan jatuh tempo
- **Status Changed** - Ketika status tugas/tiket berubah
- **Ticket Assigned** - Ketika tiket ditugaskan
- **Asset Alert** - Maintenance reminders, low stock alerts
- **System Messages** - Important system notifications

### Delivery Channels:
- In-app toast notifications (Sonner)
- Telegram bot integration
- Webhook endpoints
- Email (via Supabase)

---

## 📈 Version History

**Current Version**: v1.3.1 (June 15, 2026)

### Recent Updates:
- ✅ Historical data boundary optimization
- ✅ Relational loading optimization  
- ✅ Load archived tickets functionality
- ✅ Changelog tab in Settings
- ✅ Failed sync queue UI improvements
- ✅ Cloud sync status indicator
- ✅ Notification channels configuration
- ✅ Comprehensive documentation added

Lihat [CHANGELOG.md](./CHANGELOG.md) untuk riwayat lengkap fitur, bug fixes, dan improvements.

---

## 📖 Documentation

ClickHub memiliki dokumentasi lengkap untuk berbagai aspek:

- **[README.md](./README.md)** - Overview dan fitur utama (file ini)
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Setup guide untuk developer baru
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & technical architecture
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guidelines untuk kontribusi
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues & solutions
- **[SECURITY.md](./SECURITY.md)** - Security policies & best practices
- **[ROADMAP.md](./ROADMAP.md)** - Future features & planning
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

---

## 🛠️ Development Tips

### Hot Module Replacement (HMR)
Vite menyediakan HMR yang sangat cepat - perubahan file akan langsung reflect tanpa reload

### Debugging Store
```typescript
// Di console browser
window.useStore.getState(); // Inspect current state
window.useStore.getState().tasks; // Check specific data
```

### Database Queries
Semua database queries melalui Supabase client di `src/lib/supabase.ts`

### Adding New Components
1. Create component di folder yang sesuai
2. Define types di `src/types/index.ts`
3. Add state management di `src/store/useStore.ts`
4. Import dan gunakan di parent component

---

## 📦 Build & Deployment

### Single File Build
Menggunakan `vite-plugin-singlefile` untuk menghasilkan single HTML file:
```bash
npm run build
# Output: dist/index.html (complete standalone app)
```

### Deploy Options:
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **Docker**: Create Dockerfile untuk containerization
- **Server**: Deploy HTML file ke any web server (Apache, Nginx, Node.js)

### Deployment Checklist:
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Security headers configured
- [ ] SSL/HTTPS enabled
- [ ] Monitoring & logging setup
- [ ] Backup strategy implemented

---

## 🤝 Contributing

Kontribusi welcome! Silakan ikuti panduan di [CONTRIBUTING.md](./CONTRIBUTING.md):

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

Project ini menggunakan **MIT License** - bebas untuk digunakan secara komersial maupun personal.

Lihat [LICENSE](./LICENSE) untuk detail lengkap.

---

## 📧 Support & Contact

Untuk pertanyaan, issue, atau saran:
- 📌 **GitHub Issues**: [Open an Issue](https://github.com/ariffend1/clickhub/issues)
- 📧 **Email**: ariffend1@gmail.com
- 🌐 **Repository**: [ariffend1/clickhub](https://github.com/ariffend1/clickhub)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ariffend1/clickhub/discussions)

---

## 🎉 Acknowledgments

Terima kasih kepada:
- React & TypeScript community
- Supabase team untuk backend excellence
- Tailwind CSS untuk utility-first approach
- Semua open source libraries yang digunakan

---

## 📊 Project Stats

![GitHub License](https://img.shields.io/badge/license-MIT-blue)
![Made with React](https://img.shields.io/badge/made%20with-React-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict%20mode-3178C6)
![Code Quality](https://img.shields.io/badge/code%20quality-production%20ready-brightgreen)

---

**Made with ❤️ by [Arif Fendi](https://github.com/ariffend1)**

**Happy coding! 🚀**