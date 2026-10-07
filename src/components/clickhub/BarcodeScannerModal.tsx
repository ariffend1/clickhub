import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode / QR Code"
}: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [activeContainerId, setActiveContainerId] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  const cleanupScanner = useCallback(async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner.isScanning && !isStoppingRef.current) {
        isStoppingRef.current = true;
        try {
          await scanner.stop();
          await scanner.clear();
        } catch (err) {
          console.error("Failed to stop scanner:", err);
        } finally {
          isStoppingRef.current = false;
        }
      } else {
        try {
          await scanner.clear();
        } catch (err) {
          // ignore clear error
        }
      }
    }
  }, []);

  const handleClose = useCallback(async () => {
    await cleanupScanner();
    onClose();
  }, [cleanupScanner, onClose]);

  // Callback ref guarantees the container DOM node is mounted before initializing
  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setActiveContainerId(node.id);
    } else {
      setActiveContainerId(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !activeContainerId) return;

    setError(null);
    setCameraPermission('unknown');
    let isCancelled = false;

    const startScanner = async () => {
      // Ensure any existing scanner instance is cleaned up first
      await cleanupScanner();
      if (isCancelled) return;

      const targetEl = document.getElementById(activeContainerId);
      if (!targetEl) return;

      try {
        const html5QrCode = new Html5Qrcode(activeContainerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (isCancelled) return;
            onScan(decodedText);
            handleClose();
          },
          () => {
            // Ignored standard verbose scan frames
          }
        );

        if (!isCancelled) {
          setCameraPermission('granted');
        } else {
          await cleanupScanner();
        }
      } catch (err: any) {
        console.error("Scanner start error:", err);
        if (!isCancelled) {
          setError(err.message || "Failed to access camera.");
          setCameraPermission('denied');
        }
      }
    };

    startScanner();

    return () => {
      isCancelled = true;
      cleanupScanner();
    };
  }, [isOpen, activeContainerId, cleanupScanner, onScan, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <style>{`
        @keyframes scanLineAnimation {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scan-line {
          height: 3px;
          background: linear-gradient(to right, transparent, #8b5cf6, #d8b4fe, #8b5cf6, transparent);
          position: absolute;
          width: 100%;
          z-index: 10;
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.8);
          animation: scanLineAnimation 3s ease-in-out infinite;
        }
        /* Override html5-qrcode styling to fit ClickHub dark mode theme */
        #clickhub-barcode-reader {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
          background: #000;
        }
        #clickhub-barcode-reader video {
          object-fit: cover !important;
          border-radius: 12px;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-800 bg-[#1e2028] p-6 shadow-2xl animate-slide-up flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="text-violet-400" size={16} />
            {title}
          </h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Info text */}
        <p className="text-[11px] text-gray-400">
          Arahkan kamera ke barcode/QR Code barang untuk memindai secara otomatis.
        </p>

        {/* Viewport Container */}
        <div className="relative aspect-square w-full rounded-xl border border-gray-700 bg-black flex items-center justify-center overflow-hidden">
          {/* Animated Scan Line (Only show when camera is active and no error) */}
          {cameraPermission === 'granted' && !error && (
            <div className="scan-line" />
          )}

          {/* html5-qrcode rendering target */}
          <div ref={containerRefCallback} id="clickhub-barcode-reader" className="w-full h-full" />

          {/* Loading or Perm state */}
          {cameraPermission === 'unknown' && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#13151a]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-xs text-gray-400">Mengakses Kamera...</p>
            </div>
          )}

          {/* Error & Instruction State */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 bg-[#1a1c23]">
              <AlertCircle className="text-rose-500" size={32} />
              <p className="text-xs font-semibold text-white">Gagal Mengakses Kamera</p>
              <p className="text-[10px] text-gray-500 max-w-[250px]">
                {error.includes("NotAllowedError") || error.includes("Permission denied")
                  ? "Izin akses kamera ditolak. Harap izinkan kamera di browser Anda untuk menggunakan pemindai ini."
                  : error}
              </p>
              <button 
                onClick={() => {
                  setError(null);
                  setCameraPermission('unknown');
                  // Trigger restart of scanning
                  onClose();
                  setTimeout(() => {
                    onScan(""); // triggering refresh flow
                  }, 100);
                }}
                className="mt-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white text-[10px] font-semibold px-3 py-1.5 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-gray-950 border border-gray-800 hover:bg-gray-900 text-gray-400 text-xs font-bold px-4 py-2 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
