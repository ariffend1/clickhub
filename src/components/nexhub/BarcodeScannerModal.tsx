import { useEffect, useRef, useState } from 'react';
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "nexhub-barcode-reader";

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setCameraPermission('unknown');
    let isMounted = true;

    // Start scanner after component mounts the target div
    const startScanner = async () => {
      try {
        // Wait briefly for DOM node to render
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        // Try environment camera first, fallback to user camera
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              // Create a box relative to container size
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // Success
            onScan(decodedText);
            handleClose();
          },
          () => {
            // Ignored standard verbose scan errors
          }
        );
        
        if (isMounted) {
          setCameraPermission('granted');
        }
      } catch (err: any) {
        console.error("Scanner start error:", err);
        if (isMounted) {
          setError(err.message || "Failed to access camera.");
          setCameraPermission('denied');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Failed to stop scanner:", err);
        }
      }
      scannerRef.current = null;
    }
  };

  const handleClose = async () => {
    await cleanupScanner();
    onClose();
  };

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
        /* Override html5-qrcode styling to fit NexHub dark mode theme */
        #nexhub-barcode-reader {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
          background: #000;
        }
        #nexhub-barcode-reader video {
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
          <div id={containerId} className="w-full h-full" />

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
