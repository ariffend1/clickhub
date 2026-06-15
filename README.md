# ClickHub - Platform IT Operations Management

![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.17-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?logo=github)
![Node Version](https://img.shields.io/badge/Node-18+-339933?logo=node.js)

**[🇬🇧 English](#english-version) | [🇮🇩 Bahasa Indonesia](#versi-bahasa-indonesia)**

---

# English Version

## Overview

**ClickHub** is a comprehensive **IT Operations Management web application** built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. It provides an all-in-one solution for managing IT operations, task management, asset tracking, and customer support with offline capabilities.

> 🎯 **Portfolio Project** - Demonstrating full-stack development with modern technologies

---

## 🎬 Demo & Visual Preview

| View | Description |
|------|-------------|
| **Kanban Board** | Drag-and-drop task management with status visualization |
| **List View** | Linear list with filtering and sorting capabilities |
| **Calendar View** | Timeline-based task planning |
| **Tickets Dashboard** | IT support ticketing with SLA tracking |
| **Asset Management** | Inventory & equipment tracking with QR codes |
| **Real-time Analytics** | Dashboard with KPI and performance metrics |

> 📸 **Screenshots coming soon** - Deploy & capture UI screenshots

---

## ✨ Key Features (13+)

### 1. **Task Management** 🎯
- Kanban Board View with drag-and-drop
- List View with linear task layout
- Calendar View for timeline-based planning
- Multiple Spaces & Lists for organization
- Status Tracking (Todo → In Progress → In Review → Done)
- Priority Levels (Urgent, High, Normal, Low)
- Time Tracking with estimation
- Subtasks & Tags for complex breakdowns
- Comments & Activity Log for collaboration

### 2. **IT Ticketing System** 🎫
- Support ticket queue with categories
- Priority Management (LOW/MEDIUM/HIGH/CRITICAL)
- SLA Tracking with automatic deadlines
- File Attachment Support
- CSAT Rating (1-5 star feedback)
- Status Management (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- Automatic Ticket-to-Task Sync

### 3. **Asset & Inventory Management** 📦
- Asset tracking with technical specs (CPU, RAM, Storage, IP, etc)
- Asset Status: AVAILABLE, IN_USE, MAINTENANCE, RETIRED, BROKEN
- Equipment Checkout System with QR Codes
- Preventive Maintenance Scheduling
- Inventory management with minimum stock tracking
- Depreciation & CAPEX Reporting

### 4. **Live Chat Widget** 💬
- Real-time chat for employee support requests
- Chat session management for support team
- File sharing capabilities
- System messages and automated notifications

### 5. **Knowledge Base** 📚
- Searchable help article database
- Convert resolved tickets to KB articles
- Public access for employees

### 6. **Reporting & Analytics** 📊
- Real-time dashboard statistics
- CSAT Analytics visualization
- Depreciation & CAPEX Reports
- Audit logs for activity tracking

### 7. **Role-Based Access Control** 👥
- 6-tier role system (ROOT, SUPER_ADMIN, ADMIN, MANAGER, TECHNICIAN, EMPLOYEE)
- Feature-based permissions
- Admin unified task view

### 8. **Offline & Sync Support** 🔄
- PWA (Progressive Web App) with Service Worker
- Offline-first with write-buffer queue
- Automatic sync on reconnection
- Failed sync manager with retry/discard

### 9. **Notifications & Alerts** 🔔
- Task assignments and mentions
- Due date reminders
- Telegram bot integration
- Webhook support for custom alerts

---

## 🏆 Project Statistics

| Metric | Value |
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
- Node.js 18+ and npm 9+
- Supabase account

### 1. Clone & Setup

```bash
git clone https://github.com/ariffend1/clickhub.git
cd clickhub
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 2. Run Development Server

```bash
npm run dev
```
Visit `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```
Single HTML file in `dist/` ready to deploy

### 4. Preview Build

```bash
npm run preview
```

---

## 📂 Project Structure

```
clickhub/
├── src/
│   ├── components/       # React components (50+)
│   ├── store/           # Zustand state management
│   ├── lib/             # External library configs
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Helper functions
│   ├── App.tsx
│   └── main.tsx
├── public/              # Static assets & PWA
├── .github/             # GitHub templates
├── Documentation files (8 guides)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔑 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Styling** | Tailwind CSS 4, CSS Variables |
| **State** | Zustand 5 |
| **Backend & DB** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **UI** | Lucide React, Sonner |
| **Export** | jsPDF, XLSX |
| **QR Scanning** | html5-qrcode |
| **Utilities** | date-fns, uuid, clsx |

---

## 📖 Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contributing guidelines
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues
- **[SECURITY.md](./SECURITY.md)** - Security policies
- **[ROADMAP.md](./ROADMAP.md)** - Future features
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📝 License

MIT License - Free for commercial and personal use. See [LICENSE](./LICENSE) for details.

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/ariffend1/clickhub/issues)
- **Repo**: [ariffend1/clickhub](https://github.com/ariffend1/clickhub)

---

---

# Versi Bahasa Indonesia

## Ringkasan

**ClickHub** adalah aplikasi web **Manajemen Operasi IT** yang komprehensif, dibangun dengan **React 19**, **TypeScript**, **Vite**, dan **Tailwind CSS**. Aplikasi ini menyediakan solusi all-in-one untuk mengelola operasi IT, manajemen tugas, tracking aset, dan dukungan pelanggan dengan kemampuan offline.

> 🎯 **Proyek Portfolio** - Mendemonstrasikan full-stack development dengan teknologi modern

---

## 🎬 Demo & Preview Visual

| View | Deskripsi |
|------|-----------|
| **Kanban Board** | Manajemen tugas dengan drag-and-drop dan visualisasi status |
| **List View** | Tampilan daftar linear dengan filtering dan sorting |
| **Calendar View** | Perencanaan tugas berbasis timeline |
| **Tickets Dashboard** | Ticketing IT support dengan SLA tracking |
| **Asset Management** | Tracking inventaris dan peralatan dengan QR code |
| **Real-time Analytics** | Dashboard dengan KPI dan performance metrics |

> 📸 **Screenshots segera hadir** - Deploy & capture UI screenshots

---

## ✨ Fitur Utama (13+)

### 1. **Manajemen Tugas** 🎯
- Kanban Board dengan drag-and-drop
- List View dengan layout linear
- Calendar View untuk perencanaan timeline
- Multiple Spaces & Lists untuk organisasi
- Status Tracking (Todo → In Progress → In Review → Done)
- Priority Levels (Urgent, High, Normal, Low)
- Time Tracking dengan estimasi waktu
- Subtasks & Tags untuk breakdown kompleks
- Comments & Activity Log untuk kolaborasi

### 2. **Sistem IT Ticketing** 🎫
- Antrian tiket support dengan kategori
- Manajemen Prioritas (LOW/MEDIUM/HIGH/CRITICAL)
- SLA Tracking dengan deadline otomatis
- Dukungan File Attachment
- CSAT Rating (feedback bintang 1-5)
- Manajemen Status (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- Sinkronisasi Ticket-to-Task otomatis

### 3. **Manajemen Aset & Inventaris** 📦
- Tracking aset dengan spesifikasi teknis (CPU, RAM, Storage, IP, dll)
- Status Aset: AVAILABLE, IN_USE, MAINTENANCE, RETIRED, BROKEN
- Equipment Checkout System dengan QR Code
- Penjadwalan Preventive Maintenance
- Manajemen inventaris dengan tracking stok minimum
- Reporting Depreciation & CAPEX

### 4. **Live Chat Widget** 💬
- Chat real-time untuk request support karyawan
- Chat session management untuk tim support
- Sharing file capabilities
- System messages dan automated notifications

### 5. **Knowledge Base** 📚
- Database artikel bantuan yang searchable
- Konversi tiket selesai ke KB articles
- Public access untuk karyawan

### 6. **Reporting & Analytics** 📊
- Statistik dashboard real-time
- Visualisasi CSAT Analytics
- Reporting Depreciation & CAPEX
- Audit logs untuk tracking aktivitas

### 7. **Role-Based Access Control** 👥
- Sistem role 6-tier (ROOT, SUPER_ADMIN, ADMIN, MANAGER, TECHNICIAN, EMPLOYEE)
- Permission berbasis fitur
- Unified task view untuk admin

### 8. **Offline & Sync Support** 🔄
- PWA (Progressive Web App) dengan Service Worker
- Offline-first dengan write-buffer queue
- Automatic sync saat reconnection
- Failed sync manager dengan retry/discard

### 9. **Notifications & Alerts** 🔔
- Task assignments dan mentions
- Reminders due date
- Integrasi Telegram bot
- Webhook support untuk custom alerts

---

## 🏆 Statistik Proyek

| Metrik | Nilai |
|--------|-------|
| **Total Fitur** | 13+ fitur utama |
| **Components** | 50+ reusable components |
| **Data Models** | 20+ TypeScript interfaces |
| **Ukuran Bundle** | Single HTML file (~2.5MB) |
| **Load Time** | <2 seconds |
| **Browser Support** | Chrome, Firefox, Safari, Edge |
| **Mobile Support** | Fully responsive |
| **Offline Capability** | 100% fungsional |
| **Lines of Code** | 10,000+ |
| **Dokumentasi** | 8 panduan lengkap |

---

## 🎓 Teknologi & Pembelajaran Utama

### **Frontend Architecture**
- ✅ React 19 dengan latest hooks patterns
- ✅ TypeScript strict mode untuk type safety
- ✅ Component-based design dengan composition
- ✅ Custom hooks untuk logic reuse
- ✅ Performance optimization (code splitting, memoization)

### **State Management**
- ✅ Zustand untuk lightweight state management
- ✅ Offline-first architecture dengan write-buffer pattern
- ✅ Failed sync recovery mechanism
- ✅ Real-time subscription handling
- ✅ Local persistence dengan localStorage

### **Database & Backend**
- ✅ Supabase (PostgreSQL) integration
- ✅ Row-Level Security (RLS) policies
- ✅ Real-time subscriptions
- ✅ Authentication & authorization
- ✅ File storage management

### **Styling & Design**
- ✅ Tailwind CSS 4 dengan CSS variables
- ✅ Dark/Light theme system
- ✅ Responsive design patterns
- ✅ Design tokens & component library
- ✅ Accessibility best practices

### **DevOps & Build**
- ✅ Vite 7 untuk fast build & HMR
- ✅ Single-file bundling untuk deployment
- ✅ PWA dengan Service Worker
- ✅ CI/CD ready architecture
- ✅ Environment-based configuration

### **Professional Practices**
- ✅ Dokumentasi komprehensif
- ✅ Security best practices
- ✅ Audit logging & compliance
- ✅ Error handling & recovery
- ✅ Performance monitoring

---

## 🚀 Quick Start

### Persyaratan
- Node.js 18+ dan npm 9+
- Akun Supabase

### 1. Clone & Setup

```bash
git clone https://github.com/ariffend1/clickhub.git
cd clickhub
npm install
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials Anda
```

### 2. Jalankan Development Server

```bash
npm run dev
```
Kunjungi `http://localhost:5173`

### 3. Build untuk Production

```bash
npm run build
```
Single HTML file di `dist/` siap dideploy

### 4. Preview Build

```bash
npm run preview
```

---

## 📂 Struktur Project

```
clickhub/
├── src/
│   ├── components/       # React components (50+)
│   ├── store/           # Zustand state management
│   ├── lib/             # External library configs
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Helper functions
│   ├── App.tsx
│   └── main.tsx
├── public/              # Static assets & PWA
├── .github/             # GitHub templates
├── Dokumentasi files (8 panduan)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔑 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Styling** | Tailwind CSS 4, CSS Variables |
| **State** | Zustand 5 |
| **Backend & DB** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **UI** | Lucide React, Sonner |
| **Export** | jsPDF, XLSX |
| **QR Scanning** | html5-qrcode |
| **Utilities** | date-fns, uuid, clsx |

---

## 📖 Dokumentasi

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Panduan setup
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Desain sistem
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Panduan kontribusi
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Masalah umum
- **[SECURITY.md](./SECURITY.md)** - Kebijakan keamanan
- **[ROADMAP.md](./ROADMAP.md)** - Fitur masa depan
- **[CHANGELOG.md](./CHANGELOG.md)** - Riwayat versi

---

## 🤝 Berkontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/FeatureBaru`)
3. Commit changes (`git commit -m 'feat: tambah fitur baru'`)
4. Push ke branch (`git push origin feature/FeatureBaru`)
5. Buka Pull Request

Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) untuk panduan lengkap.

---

## 📝 Lisensi

MIT License - Bebas untuk penggunaan komersial maupun personal. Lihat [LICENSE](./LICENSE) untuk detail.

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/ariffend1/clickhub/issues)
- **Repo**: [ariffend1/clickhub](https://github.com/ariffend1/clickhub)

---

## 📊 Project Stats

![GitHub License](https://img.shields.io/badge/license-MIT-blue)
![Made with React](https://img.shields.io/badge/made%20with-React-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict%20mode-3178C6)
![Code Quality](https://img.shields.io/badge/code%20quality-production%20ready-brightgreen)

---

**Made with ❤️ by [Ariffendi](https://github.com/ariffend1)**

**Happy coding! 🚀**
