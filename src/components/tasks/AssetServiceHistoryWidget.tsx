import { useStore } from '../../store/useStore';

import { History, AlertTriangle, Clock, Wrench } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AssetServiceHistoryWidgetProps {
  assetId: string | null | undefined;
}

export default function AssetServiceHistoryWidget({ assetId }: AssetServiceHistoryWidgetProps) {
  const { assets, serviceReports, tasks, users } = useStore();

  if (!assetId) return null;

  const asset = (assets || []).find(a => a.id === assetId);
  if (!asset) return null;

  // Filter submitted service reports for this asset
  const historyReports = (serviceReports || []).filter(r => r.assetId === assetId && !r.isDraft);
  const frequentFailureWarning = historyReports.length >= 3;

  return (
    <div className="mb-6 rounded-xl border border-gray-800 bg-[#161820] p-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-violet-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
            Riwayat Servis Aset: <span className="text-violet-300">{asset.name}</span> ({asset.serialNumber || asset.id.slice(0, 8)})
          </h4>
        </div>
        <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400 border border-violet-500/20">
          {historyReports.length} Kali Diservis
        </span>
      </div>

      {frequentFailureWarning && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
          <AlertTriangle size={15} className="shrink-0 text-amber-400" />
          <span>PERINGATAN: Aset ini telah mengalami {historyReports.length}x perbaikan. Pertimbangkan evaluasi penggantian unit.</span>
        </div>
      )}

      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
        {historyReports.length === 0 ? (
          <p className="text-[11px] italic text-gray-500">Belum ada riwayat perbaikan sebelumnya untuk aset ini.</p>
        ) : (
          historyReports.map(report => {
            const task = (tasks || []).find(t => t.id === report.taskId);
            const technician = (users || []).find(u => u.id === report.submittedById);
            const dateStr = report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

            return (
              <div key={report.id} className="rounded-lg border border-gray-800/80 bg-gray-900/40 p-2.5 hover:bg-gray-900/70 transition-all">
                <div className="flex justify-between items-start text-[11px]">
                  <span className="font-semibold text-gray-300 flex items-center gap-1">
                    <Wrench size={11} className="text-violet-400" />
                    {task?.title || 'Penanganan Servis'}
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock size={10} /> {dateStr}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-gray-400">
                  <strong className="text-gray-300">Diagnosa:</strong> {report.diagnosa}
                </p>

                {report.usedParts && report.usedParts.length > 0 && (
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    🔧 Part Diganti: {report.usedParts.length} item
                  </p>
                )}

                <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-800/50">
                  <span>Teknisi: <strong className="text-gray-400">{technician?.name || 'Teknisi'}</strong></span>
                  <span className={cn(
                    "font-bold",
                    report.finalStatus === 'COMPLETED_NORMAL' ? "text-green-400" :
                    report.finalStatus === 'TEMPORARY_DONE' ? "text-amber-400" : "text-red-400"
                  )}>
                    {report.finalStatus === 'COMPLETED_NORMAL' ? '✅ Selesai Normal' :
                     report.finalStatus === 'TEMPORARY_DONE' ? '⚠️ Selesai Sementara' : report.finalStatus}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
