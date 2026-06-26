import { useState } from 'react';
import { X, HelpCircle, BookOpen, Lightbulb } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HelpConfig {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
}

const HELP_DATA: Record<string, HelpConfig> = {
  home: {
    title: 'Dashboard Utama',
    description: 'Pusat kendali untuk memantau ringkasan statistik dan aktivitas terbaru sistem ClickHub.',
    steps: [
      'Pantau jumlah tiket aktif, aset, dan tugas dari kartu ringkasan di bagian atas.',
      'Lihat tren penyelesaian masalah dan efisiensi waktu respon pada chart performa.',
      'Periksa daftar aktivitas terbaru anggota tim pada bagian riwayat log aktivitas.'
    ],
    tips: [
      'Klik shortcut cepat di dashboard untuk navigasi instan ke fitur tujuan.',
      'Data diperbarui secara real-time untuk koordinasi tim yang optimal.'
    ]
  },
  inbox: {
    title: 'Kotak Masuk',
    description: 'Pusat komunikasi internal dan notifikasi penting tim ClickHub.',
    steps: [
      'Baca pesan masuk dari anggota tim lainnya pada daftar pesan.',
      'Kirim pesan baru atau balas pesan yang ada dengan cepat.',
      'Gunakan filter untuk mengorganisasi percakapan penting Anda.'
    ],
    tips: [
      'Tandai percakapan yang selesai ditangani agar inbox tetap rapi.',
      'Gunakan pencarian jika ingin mencari riwayat chat lama.'
    ]
  },
  my_tasks: {
    title: 'Manajemen Tugas',
    description: 'Kelola alur kerja, penugasan, dan tugas operasional tim IT secara kolaboratif.',
    steps: [
      'Buat tugas baru dengan mengklik tombol "New Task" di kanan atas.',
      'Geser kartu tugas antar kolom (Todo, In Progress, Done) untuk memperbarui status.',
      'Tetapkan penanggung jawab dan tenggat waktu penyelesaian pada detail tugas.'
    ],
    tips: [
      'Hubungkan tugas langsung dengan nomor tiket terkait untuk ketertelusuran yang lebih baik.',
      'Gunakan view mode (Board, List, Calendar) sesuai kenyamanan kerja Anda.'
    ]
  },
  tickets: {
    title: 'Tiket Helpdesk',
    description: 'Kelola permintaan bantuan, laporan masalah, dan pelacakan SLA dari pengguna.',
    steps: [
      'Klik "New Ticket" untuk membuat tiket bantuan baru.',
      'Pilih prioritas sesuai urgensi masalah (Low, Medium, High, Critical).',
      'Tetapkan teknisi utama dan helper tambahan yang akan menangani kendala.',
      'Perbarui status secara berkala sesuai dengan progres penyelesaian di lapangan.'
    ],
    tips: [
      'Tiket dengan prioritas HIGH/CRITICAL memiliki SLA dengan batas waktu lebih ketat.',
      'Gunakan filter status atau kategori untuk menyaring daftar tiket tertentu.'
    ]
  },
  assets: {
    title: 'Inventaris Aset',
    description: 'Kelola data aset perangkat keras dan lunak milik perusahaan dengan tertata rapi.',
    steps: [
      'Daftarkan aset baru beserta spesifikasi, kategori, dan nomor serinya.',
      'Lakukan peminjaman (Checkout) aset kepada karyawan yang membutuhkan.',
      'Monitor status kondisi aset (Aktif, Rusak, Sedang Diperbaiki).'
    ],
    tips: [
      'Selalu lakukan verifikasi kondisi fisik aset sebelum menyetujui pengembalian (Checkin).',
      'Gunakan pencarian barcode/QR Code untuk mempermudah audit fisik aset.'
    ]
  },
  knowledge: {
    title: 'Kamus Pengetahuan',
    description: 'Dokumentasi panduan teknis dan solusi mandiri untuk kendala umum (Self-Service).',
    steps: [
      'Cari artikel solusi menggunakan kolom pencarian cepat di bagian atas.',
      'Baca panduan langkah-demi-langkah (Runbook) yang telah terverifikasi.',
      'Buat artikel baru untuk mendokumentasikan kendala baru yang berhasil diselesaikan.'
    ],
    tips: [
      'Bagikan tautan artikel kepada pengguna agar mereka dapat menyelesaikan kendala minor secara mandiri.',
      'Perbarui artikel secara berkala jika ada perubahan langkah teknis.'
    ]
  },
  reports: {
    title: 'Laporan & Analisis',
    description: 'Analisis performa penyelesaian kendala, pencapaian SLA, dan kepuasan pengguna.',
    steps: [
      'Pilih rentang waktu analisis laporan yang ingin dievaluasi.',
      'Pantau persentase pencapaian SLA tim dan rata-rata waktu penyelesaian.',
      'Ekspor data laporan dalam format CSV atau PDF untuk kebutuhan presentasi.'
    ],
    tips: [
      'Evaluasi umpan balik CSAT dengan rating rendah untuk meningkatkan kualitas layanan IT Helpdesk.',
      'Gunakan grafik visual untuk melihat jam-jam sibuk masuknya laporan tiket.'
    ]
  }
};

interface PageHelpProps {
  pageKey: string;
  className?: string;
}

export default function PageHelp({ pageKey, className }: PageHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = HELP_DATA[pageKey];

  if (!config) return null;

  return (
    <>
      {/* Help Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center justify-center rounded-full hover:bg-gray-800/60 text-gray-400 hover:text-white transition duration-200 focus:outline-none cursor-pointer w-6 h-6 ml-2",
          className
        )}
        title={`Buka Panduan ${config.title}`}
        aria-label={`Buka Panduan ${config.title}`}
      >
        <HelpCircle size={16} className="text-gray-400 hover:text-violet-400 transition-colors" />
      </button>

      {/* Elegant Help Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-100"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700/80 bg-[#1e2028]/95 p-6 shadow-2xl backdrop-blur-xl animate-slide-up relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-800/80 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {config.title}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                    Panduan Penggunaan
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white hover:bg-gray-800/50 p-1.5 rounded-lg transition"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {config.description}
            </p>

            {/* Cara Penggunaan Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
                <span>➔</span> Cara Penggunaan
              </h4>
              <div className="space-y-2.5">
                {config.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                      {index + 1}
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Section (Amber background alert box) */}
            {config.tips.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                  <Lightbulb size={14} className="shrink-0" />
                  Tips
                </h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  {config.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-gray-300 leading-relaxed pl-1">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm button */}
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-semibold text-white transition-all duration-200 shadow-lg shadow-blue-600/10 hover:shadow-blue-600/25 active:scale-[0.98] cursor-pointer text-center"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
