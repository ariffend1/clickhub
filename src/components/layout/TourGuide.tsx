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
      console.log(`[TourGuide] handleStartTour triggered with stepIndex: ${stepIndex}`);
      setIsOpen(true);
      setCurrentStep(stepIndex);
      localStorage.removeItem('clickhub-tour-completed');
    };

    window.addEventListener('start-clickhub-tour', handleStartTour);

    // Auto-start for first time users
    const completed = localStorage.getItem('clickhub-tour-completed');
    if (!completed) {
      console.log("[TourGuide] Auto-start tour for first-time user");
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      console.log("[TourGuide] Removing start-clickhub-tour event listener");
      window.removeEventListener('start-clickhub-tour', handleStartTour);
    };
  }, []);

  // Track the coordinates of the target element
  useEffect(() => {
    console.log(`[TourGuide] coordinates effect run. isOpen: ${isOpen}, currentStep: ${currentStep}, activePage: ${activePage}`);
    if (!isOpen) {
      setCoords(null);
      if (checkInterval.current) clearInterval(checkInterval.current);
      return;
    }

    const updateCoords = () => {
      const step = steps[currentStep];
      if (!step) {
        console.log(`[TourGuide] step at index ${currentStep} not found`);
        return;
      }

      console.log(`[TourGuide] target step element: ${step.target}`);

      // Automatically change pages in background to make target element visible if needed
      if (step.target === '#tour-nav-reports' && activePage !== 'reports') {
        console.log("[TourGuide] Redirecting page to reports");
        setActivePage('reports');
      } else if (step.target === '#tour-nav-assets' && activePage !== 'assets') {
        console.log("[TourGuide] Redirecting page to assets");
        setActivePage('assets');
      } else if (step.target === '#tour-nav-tickets' && activePage !== 'tickets') {
        console.log("[TourGuide] Redirecting page to tickets");
        setActivePage('tickets');
      } else if (step.target === '#tour-nav-home' && activePage !== 'home') {
        console.log("[TourGuide] Redirecting page to home");
        setActivePage('home');
      } else if (step.target === '#tour-nav-inbox' && activePage !== 'inbox') {
        console.log("[TourGuide] Redirecting page to inbox");
        setActivePage('inbox');
      } else if (step.target === '#tour-nav-my_tasks' && activePage !== 'my_tasks') {
        console.log("[TourGuide] Redirecting page to my_tasks");
        setActivePage('my_tasks');
      } else if (step.target === '#tour-nav-knowledge' && activePage !== 'knowledge') {
        console.log("[TourGuide] Redirecting page to knowledge");
        setActivePage('knowledge');
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
          className="absolute border-2 border-violet-500 rounded-xl pointer-events-none animate-pulse-glow z-[9995] transition-all duration-300"
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
        className="w-[320px] overflow-hidden rounded-2xl border border-gray-800/60 bg-gray-950/90 backdrop-blur-xl p-5 shadow-2xl shadow-black/80 pointer-events-auto transition-all duration-300 animate-fade-in text-gray-150 relative"
      >
        {/* Horizontal Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-900/50">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
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
