import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'right' | 'left' | 'bottom' | 'top';
}

export default function TourGuide() {
  const { activePage, setActivePage, setShowSettingsModal } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  const steps: TourStep[] = [
    {
      target: '#tour-nav-home',
      title: '🏠 Beranda Utama',
      description: 'Halaman utama untuk melihat ringkasan aktivitas, status cepat operasional, dan grafik statistik harian Anda.',
      position: 'right'
    },
    {
      target: '#tour-nav-inbox',
      title: '📥 Kotak Masuk (Inbox)',
      description: 'Tempat Anda menerima seluruh notifikasi penugasan tiket, perubahan status tugas, atau kolaborasi asisten teknisi.',
      position: 'right'
    },
    {
      target: '#tour-nav-my_tasks',
      title: '📋 Tugas Saya (My Tasks)',
      description: 'Daftar tugas rutin, tugas maintenance, and checklist inspeksi harian yang ditugaskan khusus untuk Anda.',
      position: 'right'
    },
    {
      target: '#tour-nav-tickets',
      title: '🎫 Tiket Helpdesk IT',
      description: 'Kelola seluruh tiket pengaduan gangguan user, klaim pengerjaan tiket, and pantau kepatuhan SLA pelayanan.',
      position: 'right'
    },
    {
      target: '#tour-nav-assets',
      title: '💻 Manajemen Aset',
      description: 'Registri inventaris perangkat keras, jadwal PM (Preventive Maintenance), pencetakan label stiker QR, dan pelacakan depresiasi nilai aset.',
      position: 'right'
    },
    {
      target: '#tour-nav-knowledge',
      title: '📚 Knowledge Base',
      description: 'Pustaka artikel solusi teknis, SOP operasional IT, and draf solusi yang diterbitkan langsung dari tiket selesai.',
      position: 'right'
    },
    {
      target: '#tour-nav-reports',
      title: '📊 Reports & Analytics',
      description: 'Analisis mendalam mengenai Depreciation Aset, CAPEX, performa SLA tim, dan Laporan Leaderboard Kinerja Beban Kerja Teknisi.',
      position: 'right'
    },
    {
      target: '#tour-nav-settings',
      title: '⚙️ Pengaturan Sistem',
      description: 'Ubah preferensi aplikasi, aktifkan mode gelap/terang, serta atur nama perusahaan and logo branding fisik stiker Anda.',
      position: 'right'
    }
  ];

  // Listen to custom event to start tour
  useEffect(() => {
    const handleStartTour = (e: Event) => {
      const customEvt = e as CustomEvent;
      const stepIndex = customEvt.detail?.step ?? 0;
      setIsOpen(true);
      setCurrentStep(stepIndex);
      localStorage.removeItem('clickhub-tour-completed');
    };

    window.addEventListener('start-clickhub-tour', handleStartTour);

    // Auto-start for first time users
    const completed = localStorage.getItem('clickhub-tour-completed');
    if (!completed) {
      // Delay slightly to ensure UI is fully loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('start-clickhub-tour', handleStartTour);
    };
  }, []);

  // Track the coordinates of the target element
  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      if (checkInterval.current) clearInterval(checkInterval.current);
      return;
    }

    const updateCoords = () => {
      const step = steps[currentStep];
      if (!step) return;

      // Automatically change pages in background to make target element visible if needed
      if (step.target === '#tour-nav-reports' && activePage !== 'reports') {
        setActivePage('reports');
      } else if (step.target === '#tour-nav-assets' && activePage !== 'assets') {
        setActivePage('assets');
      } else if (step.target === '#tour-nav-tickets' && activePage !== 'tickets') {
        setActivePage('tickets');
      } else if (step.target === '#tour-nav-home' && activePage !== 'home') {
        setActivePage('home');
      }

      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      } else {
        // Fallback to center of screen if element is not found
        setCoords(null);
      }
    };

    updateCoords();

    // Poll to keep coordinate synced during transitions/layout changes
    checkInterval.current = setInterval(updateCoords, 500);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [isOpen, currentStep, activePage]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem('clickhub-tour-completed', 'true');
    // If setting modal was open, don't close it, but ensure we return home or clean up
  };

  if (!isOpen) return null;

  const currentTourStep = steps[currentStep];

  // Calculate popover positioning
  let popoverStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 9999,
  };

  if (coords) {
    const gap = 12;
    if (currentTourStep.position === 'right') {
      popoverStyle.top = coords.top + coords.height / 2 - 100; // Center vertically relative to element
      popoverStyle.left = coords.left + coords.width + gap;
    } else if (currentTourStep.position === 'bottom') {
      popoverStyle.top = coords.top + coords.height + gap;
      popoverStyle.left = coords.left + coords.width / 2 - 150;
    }
  } else {
    // Center of screen fallback
    popoverStyle.top = '50%';
    popoverStyle.left = '50%';
    popoverStyle.transform = 'translate(-50%, -50%)';
    popoverStyle.position = 'fixed';
  }

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-none font-sans">
      {/* Overlay Backdrop - Highlights the target element */}
      <div 
        className="absolute inset-0 bg-black/65 transition-all duration-300 pointer-events-auto"
        style={{
          clipPath: coords 
            ? `polygon(
                0% 0%, 0% 100%, 
                ${coords.left}px 100%, 
                ${coords.left}px ${coords.top}px, 
                ${coords.left + coords.width}px ${coords.top}px, 
                ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                ${coords.left}px ${coords.top + coords.height}px, 
                ${coords.left}px 100%, 
                100% 100%, 100% 0%
              )` 
            : undefined
        }}
      />

      {/* Target Highlight Border */}
      {coords && (
        <div 
          className="absolute border-2 border-violet-500 rounded-xl pointer-events-none animate-pulse z-[9995] shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300"
          style={{
            top: coords.top - 4,
            left: coords.left - 4,
            width: coords.width + 8,
            height: coords.height + 8,
          }}
        />
      )}

      {/* Popover Card Card */}
      <div 
        style={popoverStyle}
        className="w-[320px] rounded-2xl border border-gray-800 bg-gray-950/95 backdrop-blur-xl p-5 shadow-2xl shadow-black/80 pointer-events-auto transition-all duration-300 animate-fade-in text-gray-150"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 text-violet-400 font-extrabold text-[10px] uppercase tracking-wider">
            <Sparkles size={12} className="animate-spin-slow" />
            <span>Panduan ClickHub</span>
          </div>
          <button 
            onClick={handleComplete} 
            className="text-gray-500 hover:text-white rounded-lg p-1 hover:bg-gray-900 transition-colors pointer-events-auto"
            title="Lewati Panduan"
          >
            <X size={14} />
          </button>
        </div>

        <h3 className="text-sm font-black text-white mt-2.5 flex items-center gap-2">
          {currentTourStep.title}
        </h3>

        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          {currentTourStep.description}
        </p>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-gray-900 mt-5 pt-4">
          <span className="text-[10px] font-bold text-gray-500">
            Langkah {currentStep + 1} dari {steps.length}
          </span>

          <div className="flex gap-1.5">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center justify-center gap-1 rounded-lg bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 text-[10px] font-extrabold px-2.5 py-1.5 transition-all active:scale-95"
              >
                <ChevronLeft size={12} />
                Kembali
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center justify-center gap-1 rounded-lg bg-violet-650 hover:bg-violet-600 text-white text-[10px] font-extrabold px-3 py-1.5 transition-all active:scale-95 shadow-md shadow-violet-600/25"
            >
              {currentStep === steps.length - 1 ? 'Selesai' : 'Lanjut'}
              {currentStep < steps.length - 1 && <ChevronRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
