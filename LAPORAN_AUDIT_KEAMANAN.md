# LAPORAN HASIL AUDIT KEAMANAN - CLICKHUB

**Tanggal Audit**: June 2026
**Auditor**: Jules, Software Engineer
**Aplikasi**: ClickHub (IT Operations Management Platform)
**Status**: Rahasia / Internal Only

---

## 📌 Ringkasan Eksekutif

Kami telah melakukan analisis keamanan mendalam (Deep Security Audit) terhadap repositori kode sumber ClickHub, struktur database (`clickhub_schema.sql`), manajemen autentikasi, kriptografi lokal, penanganan unggahan file, serta dependensi pihak ketiga (`package.json`).

Berdasarkan hasil analisis kami, ClickHub memiliki arsitektur dasar yang solid yang terintegrasi dengan Supabase dan menyediakan fitur pencatatan log audit (Audit Logging) yang cukup komprehensif. Namun, kami menemukan beberapa celah keamanan kritikal (High & Medium Severity) yang berpotensi membahayakan data produksi apabila aplikasi ini dideploy tanpa langkah-langkah mitigasi lanjutan.

Berikut adalah ringkasan temuan utama dan rekomendasi perbaikannya.

---

## 🔍 Temuan Audit & Analisis Risiko

### 1. Kredensial Super Admin Default di Dalam Database Seed (`clickhub_schema.sql`)
* **Tingkat Keparahan**: 🔴 **Kritis (Critical)**
* **Deskripsi Masalah**:
  Di dalam berkas `clickhub_schema.sql` pada bagian inisialisasi tabel, terdapat query `INSERT` langsung untuk membuat user superadmin default:
  * **Email**: `support@clickhub.com`
  * **Password**: `support1234` (dihash menggunakan `crypt` bawaan pgcrypto).
* **Dampak**:
  Jika skema ini dieksekusi di database produksi dan kredensial tersebut tidak dihapus atau diganti segera setelah setup awal, penyerang luar dapat dengan mudah masuk ke dalam sistem sebagai `SUPER_ADMIN` dan mengontrol seluruh infrastruktur IT organisasi, mengakses data aset sensitif, mematikan sistem, atau mengekstrak data PII karyawan.
* **Saran Perbaikan**:
  1. Hapus entri inisialisasi query sql default admin di `clickhub_schema.sql` untuk deployment produksi, atau buat generator password acak pada saat pertama kali inisialisasi.
  2. Implementasikan prosedur penggantian kata sandi wajib (Password Change Enforcement) pada saat login pertama kali bagi akun administrasi default.

---

### 2. Mekanisme Bypass Autentikasi Frontend (`VITE_BYPASS_AUTH`)
* **Tingkat Keparahan**: 🔴 **Tinggi (High)**
* **Deskripsi Masalah**:
  Variabel lingkungan `VITE_BYPASS_AUTH` digunakan di frontend untuk memotong (bypass) proses login konvensional. Jika flag ini diatur ke `'true'`, sistem akan mencocokkan email dengan daftar `registeredUsers` lokal (hardcoded di frontend) tanpa memvalidasi kata sandi sesungguhnya di database Supabase Auth, serta menampilkan widget login cepat (Quick Login) secara publik di halaman masuk (`LoginPage.tsx`).
* **Dampak**:
  Apabila flag ini secara tidak sengaja diatur ke `true` di lingkungan staging atau produksi, siapa saja dapat mengakses akun manapun hanya dengan mengetahui alamat emailnya. Ini merupakan bypass autentikasi total.
* **Saran Perbaikan**:
  1. Pastikan variabel `VITE_BYPASS_AUTH` **tidak pernah** diatur ke `'true'` di file `.env.production` atau konfigurasi server CI/CD lingkungan produksi.
  2. Tambahkan pemeriksaan build step (linter/CI check) untuk memblokir build produksi apabila flag bypass autentikasi ini bernilai aktif.

---

### 3. Kriptografi Lokal Lemah Menggunakan XOR Cipher Statis (`src/utils/crypto.ts`)
* **Tingkat Keparahan**: 🟡 **Sedang (Medium)**
* **Deskripsi Masalah**:
  Aplikasi menyimpan data sensitif seperti Token Bot Telegram (`VITE_TELEGRAM_BOT_TOKEN`), Chat ID Telegram, dan URL Webhook di `localStorage` dengan mengobfuskasikannya menggunakan algoritma XOR Cipher sederhana yang menggunakan kunci statis hardcoded:
  ```typescript
  const SECRET_KEY = 'clickhub_secret_key_10g_network_upgrade';
  ```
* **Dampak**:
  XOR Cipher dengan kunci statis **bukan** merupakan enkripsi tingkat industri (tidak aman). Siapa pun yang memiliki akses fisik atau akses tidak sah melalui serangan Cross-Site Scripting (XSS) ke LocalStorage dapat dengan mudah memecahkan kunci XOR ini dan mencuri kredensial bot Telegram serta endpoint webhook. Hal ini dapat berujung pada eksploitasi bot untuk mengirim pesan spam, phishing, atau penyusupan data.
* **Saran Perbaikan**:
  1. Jangan simpan kredensial bot Telegram atau token API sensitif di tingkat client-side/LocalStorage.
  2. Alihkan fungsi pengiriman Telegram dan penanganan webhook ke sisi backend (misalnya menggunakan **Supabase Edge Functions**) di mana rahasia / secret token disimpan dengan aman di environment variables backend.

---

### 4. Pembatasan Unggahan Berkas Berbahaya Hanya di Tingkat Client (`isForbiddenFile` di Frontend)
* **Tingkat Keparahan**: 🟡 **Sedang (Medium)**
* **Deskripsi Masalah**:
  Fungsi filter validasi untuk mencegah unggahan berkas berbahaya (seperti `.exe`, `.bat`, `.html`, `.svg`, `.sh`) diletakkan di dalam modul `useStore.ts` menggunakan fungsi `isForbiddenFile`.
* **Dampak**:
  Validasi di sisi frontend sangat mudah dilewati (bypass) oleh pengguna berniat jahat dengan memodifikasi request API secara langsung (menggunakan tools seperti Postman, Burp Suite, atau script cURL). Hal ini memungkinkan pelaku mengunggah berkas berbahaya (misal HTML berisi malware XSS, SVG dengan payload XML, atau webshell) langsung ke Supabase Storage.
* **Saran Perbaikan**:
  1. Implementasikan validasi tipe file dan ekstensi yang ketat di sisi backend (misal menggunakan PostgreSQL trigger di Supabase, atau policy pada Supabase Storage).
  2. Konfigurasikan Security Headers di Supabase Storage, seperti mematikan eksekusi script untuk folder publik dan memaksa header `Content-Disposition: attachment` untuk berkas yang berisiko.

---

### 5. Kerentanan Dependensi Pihak Ketiga (Third-Party Vulnerabilities)
* **Tingkat Keparahan**: 🟡 **Sedang (Medium)**
* **Deskripsi Masalah**:
  Berdasarkan audit dependensi (`npm audit`), ditemukan 4 kerentanan pada pustaka pihak ketiga:
  1. `dompurify` (<=3.4.12): Mengalami kerentanan bypass pada hook `IN_PLACE` yang dapat dimanfaatkan untuk serangan Cross-Site Scripting (XSS).
  2. `nanoid` (<=3.3.16): Generator non-aman dapat menyebabkan infinite loop.
  3. `postcss` (<=8.5.22): Pengungkapan berkas peta sumber (.map) akibat path traversal yang tidak sepenuhnya diperbaiki.
  4. `xlsx` (Semua Versi): Kerentanan Prototype Pollution dan ReDoS (Regular Expression Denial of Service).
* **Dampak**:
  Serangan XSS melalui input yang tidak dibersihkan dengan benar, atau Denial of Service (DoS) yang dapat membuat server / client crash.
* **Saran Perbaikan**:
  1. Jalankan perintah `npm audit fix` untuk menaikkan versi dependensi ke patch rilis aman terbaru secara otomatis.
  2. Lakukan update berkala untuk `dompurify`, `nanoid`, dan `postcss`.
  3. Untuk paket `xlsx` (SheetJS) yang tidak memiliki perbaikan otomatis via npm, pastikan input parsing berkas spreadsheet diisolasi atau divalidasi dengan ketat sebelum diproses di client-side.

---

## 🛠️ Matriks Rencana Aksi (Action Plan Checklist)

| No | Temuan / Area | Langkah Mitigasi | Status Prioritas | PIC |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Superadmin Seed | Hapus akun default dari database sql, buat proses force-change password saat instalasi awal. | 🔴 Kritis | Admin DB / DevOps |
| 2 | Bypass Autentikasi | Nonaktifkan `VITE_BYPASS_AUTH` di lingkungan non-dev. | 🔴 Tinggi | Frontend Lead |
| 3 | XOR Cipher | Migrasi penyimpanan token Bot Telegram dari LocalStorage ke Supabase Edge Functions. | 🟡 Sedang | Backend Dev |
| 4 | Upload Filter | Terapkan RLS policies / triggers pada Supabase Storage untuk membatasi ekstensi file. | 🟡 Sedang | Security / DB Dev |
| 5 | Dependensi | Jalankan `npm audit fix` dan perbarui paket-paket ke rilis stabil terbaru. | 🟡 Sedang | SysAdmin |

---

## 🔒 Kesimpulan & Komitmen Keamanan

Meskipun ClickHub kaya akan fitur operasional IT, mengabaikan temuan keamanan di atas pada deployment produksi akan sangat berisiko. Kami menyarankan agar organisasi segera menerapkan langkah-langkah mitigasi di atas, khususnya **menghapus kredensial default di script SQL** dan **menonaktifkan fitur Bypass Autentikasi** sebelum merilis aplikasi ke tahap produksi atau staging publik.
