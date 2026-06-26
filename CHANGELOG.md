# Changelog - ClickHub

Format versi mengikuti prinsip: `vEDITION.MAJOR.MINOR`.
- **EDITION**: 1 (Vite Single-File Client Integration)
- **MAJOR**: Peningkatan modul atau fitur besar
- **MINOR**: Bug fix, peningkatan performa, pembenahan keamanan

---

## [v1.4.1] - 2026-06-25
### Added
- **Inspeksi Harian Dinamis (Checklist Templates)**: Desain template checklist harian yang dinamis, dapat dibuat dan diatur oleh Admin secara kustom per kategori/divisi kerja.
- **Auto-Ticketing Terintegrasi**: Pemicu pembuatan tiket otomatis (`Ticket`) secara dinamis dengan kategori dan prioritas terpilih apabila ada item pemeriksaan yang ditandai bermasalah (FAIL).
- **Kolaborasi Eskalasi Tiket**: Tombol "Minta Bantuan" di panel tiket untuk menugaskan teknisi bantuan tambahan dan merekam log kerja sama tim.
- **Dashboard & Cetak Laporan PDF Beban Kerja**: Grafik komparatif beban kerja teknisi dan tabel metrik detail pada Reports Page, lengkap dengan tombol ekspor PDF format Global Bulanan dan Filter Kustom.
- **Koreksi Hak Akses Pengaturan**: Membatasi tab *Branding & Labels* serta *Notifications* di Settings Modal hanya untuk role `ROOT`, `SUPER_ADMIN`, dan `ADMIN`. Role `MANAGER` kini dibatasi.

---

## [v1.4.0] - 2026-06-25
### Added
- **Fitur Recurring/Renewal Tasks**: Mendukung perulangan tugas secara otomatis ketika task ditandai selesai (`done`).
- **Database Trigger Automation**: Memindahkan logika perulangan dan perhitungan tanggal jatuh tempo ke tingkat database PostgreSQL menggunakan database trigger demi keamanan transaksi atomik, penanganan offline sync yang andal, dan pencegahan timezone shift.
- **Konfigurasi UI Fleksibel**: Menambahkan opsi pengaturan perulangan (interval harian/mingguan/bulanan/tahunan, serta perilaku kloning task baru vs reset status) pada `CreateTaskModal` dan `TaskDetailModal`.

---

## [v1.3.2] - 2026-06-17
### Added
- **Otorisasi Penghapusan Space & List**: Membatasi hak akses penghapusan Space dan List hanya untuk role `ROOT`, `SUPER_ADMIN`, `ADMIN`, dan `MANAGER` (Opsi A - menyembunyikan menu klik kanan untuk pengguna biasa).
- **Dialog Konfirmasi Keamanan**: Menambahkan pop-up konfirmasi `window.confirm` sebelum menghapus Space atau List untuk mencegah tindakan tidak sengaja yang dapat merusak data.

---

## [v1.3.1] - 2026-06-09
### Added
- **Historical Data Boundary**: Pemuatan tugas selesai terbatas 15 hari, tiket selesai 30 hari, sesi chat selesai 7 hari.
- **Relational Loading Optimization**: Checklist & Chat Messages dimuat menggunakan operator `.in()` berbasis ID aktif, memangkas download bulk data.
- **Load Archived Tickets UI**: Banner penarikan tiket lama secara manual pada tab Archive.
- **Changelog Tab**: Ditambahkan tab Changelog di Settings Modal untuk memantau detail rilis, pembaruan, dan tambalan/patch.
- **Interactive Version Click**: Mengklik versi di Sidebar sekarang langsung membuka tab Changelog di Settings Modal.

### Fixed
- **Optimisasi Startup Loading**: Kecepatan initial load meningkat signifikan dengan pemangkasan query database.

---

## [v1.3.0] - 2026-06-09
### Added
- **Failed Sync Queue (Resiliensi Offline)**: Penampungan data gagal sinkron akibat constraint/validation server di Zustand store.
- **Failed Sync Manager UI**: Panel peninjauan data gagal sinkron dengan opsi *Retry*, *Discard*, *Retry All*, dan *Clear All* di tab "Data" pada Settings Modal.
- **Cloud Sync Status**: Indikator status jaringan dan sinkronisasi reaktif di Header (Synced, Syncing, Sync Error, Offline).
- **Settings tab "Notifications"**: Input mandiri Telegram Bot Token, Telegram Chat ID, dan Webhook URL untuk admin/manager di Settings Modal.
- **Test Alert**: Fitur pengetesan pengiriman pesan ke Telegram secara langsung dari Settings Modal.

### Fixed
- **Keamanan Token Telegram**: Menghapus token bot Telegram default yang hardcoded dari client bundle.
- **Proteksi LoginPage**: Menyembunyikan demo quick login panel secara kondisional jika bypass auth dinonaktifkan (`VITE_BYPASS_AUTH !== 'true'`).

---

## [v1.2.1] - 2026-06-08
### Added
- **Preventive Maintenance**: Tab penjadwalan pemeliharaan aset berkala di detail modal aset.
- **Depreciation & CAPEX Report**: Grafik linear depreciation aset (linear 5 tahun), status penggantian, roadmap quarter, dan ekspor laporan di Reports Page.
- **Admin Task View Customization**: Admin/Manager sekarang dapat melihat tugas semua pengguna di board "My Tasks".
- **Task Seeding**: Penambahan script `seed_tasks.js` untuk migrasi data dummy 30 tugas.

---

## [v1.2.0] - 2026-06-05
### Added
- **QR Code Asset Labels**: Pemuatan label QR Code aset untuk pencetakan masal dan individual.
- **CSAT Rating & Feedback**: Formulir penilaian bintang 1-5 dan catatan ulasan untuk reporter tiket yang telah selesai.
- **CSAT Analytics**: Visualisasi rata-rata rating dan grafik breakdown CSAT di Reports Page.
- **Knowledge Base Search**: Pencarian reaktif artikel bantuan di modal detail tiket serta tombol konversi tiket selesai menjadi draf artikel KB baru.
- **SLA Countdown Tracker**: Lencana visual countdown target penyelesaian tiket real-time (SLA Met/Missed) berdasarkan tingkat prioritas.
- **Telegram Alert Integrasi**: Pemicu pesan notifikasi Telegram otomatis saat stok barang minimum tercapai, permintaan hapus tiket, dan CSAT buruk.

---

## [v1.1.0] - 2026-06-03
### Added
- **IT Tickets Board**: Modul antrean tiket dukungan IT terintegrasi dengan kategori tiket.
- **Asset & Inventory Management**: Pencatatan spesifikasi aset, lokasi, tab bon barang (*Part Requests*), dan pengadaan (*Stock Requests*).
- **Live Chat Widget**: Widget obrolan bantuan IT bagi karyawan untuk terhubung dengan Teknisi.
- **Ticket to Task Sync (Opsi E)**: Sinkronisasi dua arah otomatis antara status/assignee tiket dengan tugas padanannya di board tasks.

---

## [v1.0.0] - 2026-06-02
### Added
- **Release Awal ClickHub**: Struktur dasar modul Task & Project Management (Kanban Board, List View, Calendar View, Space/List Creation).
- **Zustand Offline Store**: Sinkronisasi state lokal dengan database PostgreSQL Supabase berbasis antrean penulisan write-buffer.
