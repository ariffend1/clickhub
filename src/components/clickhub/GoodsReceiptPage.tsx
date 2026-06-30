import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Truck, Plus, User, X, Camera } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import BarcodeScannerModal from './BarcodeScannerModal';
import { toast } from 'sonner';

export default function GoodsReceiptPage() {
  const {
    goodsReceipts,
    stockRequests,
    inventories,
    addGoodsReceipt,
    users
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [purchaseRequestId, setPurchaseRequestId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantityOrdered, setQuantityOrdered] = useState(0);
  const [quantityReceived, setQuantityReceived] = useState(0);
  const [destinationType, setDestinationType] = useState<'ASSET' | 'INVENTORY'>('INVENTORY');
  const [inventoryId, setInventoryId] = useState('');
  const [condition, setCondition] = useState<'GOOD' | 'DAMAGED' | 'INCOMPLETE'>('GOOD');
  const [notes, setNotes] = useState('');
  const [assetSerialNumber, setAssetSerialNumber] = useState('');
  const [assetLocation, setAssetLocation] = useState('');
  const [scanTarget, setScanTarget] = useState<'receipt-inventory' | 'receipt-asset-sn' | null>(null);

  // Filter approved stock requests
  const approvedRequests = stockRequests.filter(req => req.status === 'APPROVED');

  const handleSelectRequest = (reqId: string) => {
    setPurchaseRequestId(reqId);
    const req = stockRequests.find(r => r.id === reqId);
    if (req) {
      setItemName(req.itemName);
      setQuantityOrdered(req.quantity);
      setQuantityReceived(req.quantity);
      setDestinationType(req.type === 'NEW_ITEM' ? 'ASSET' : 'INVENTORY');
      setInventoryId(req.inventoryId || '');
    }
  };

  const handleOpenForm = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setReceiptNumber(`GR-${dateStr}-${uuidv4().slice(0, 4).toUpperCase()}`);
    setPurchaseRequestId('');
    setItemName('');
    setQuantityOrdered(1);
    setQuantityReceived(1);
    setDestinationType('INVENTORY');
    setInventoryId('');
    setCondition('GOOD');
    setNotes('');
    setAssetSerialNumber('');
    setAssetLocation('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptNumber || !itemName || quantityReceived <= 0) return;

    await addGoodsReceipt({
      receiptNumber,
      purchaseRequestId,
      itemName,
      quantityOrdered,
      quantityReceived,
      destinationType,
      inventoryId: destinationType === 'INVENTORY' ? inventoryId : null,
      condition,
      notes: notes.trim(),
      assetSerialNumber: destinationType === 'ASSET' ? assetSerialNumber : null,
      assetLocation: destinationType === 'ASSET' ? assetLocation : null
    });

    setShowForm(false);
  };

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Unknown User';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Controls (Only actions remaining) */}
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 transition-all shadow-md shadow-violet-950/20"
          >
            <Plus size={14} />
            Record Incoming Goods
          </button>
        </div>
      )}

      {/* Incoming Goods Receipt Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900/10 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl space-y-6 animate-slide-up">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h2 className="text-sm font-bold text-white">Record Incoming Goods</h2>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Receipt Number</label>
                <input
                  required
                  readOnly
                  type="text"
                  value={receiptNumber}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/30 px-4 py-2.5 text-xs text-gray-400 cursor-not-allowed outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Link Approved Purchase Request (Optional)</label>
                <select
                  value={purchaseRequestId}
                  onChange={e => handleSelectRequest(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                >
                  <option value="">-- Choose Stock Request --</option>
                  {approvedRequests.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.requestNumber} - {r.itemName} (Qty: {r.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Item Name</label>
                <input
                  required
                  type="text"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. UTP Cat6 Cable"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Qty Ordered</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={quantityOrdered}
                    onChange={e => setQuantityOrdered(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white outline-none focus:border-violet-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Qty Received</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={quantityReceived}
                    onChange={e => setQuantityReceived(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-l border-gray-800 pl-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Destination Type</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center text-xs text-gray-300">
                    <input
                      type="radio"
                      name="destType"
                      checked={destinationType === 'INVENTORY'}
                      onChange={() => setDestinationType('INVENTORY')}
                      className="mr-2"
                    />
                    Add to Inventory / Parts
                  </label>
                  <label className="inline-flex items-center text-xs text-gray-300">
                    <input
                      type="radio"
                      name="destType"
                      checked={destinationType === 'ASSET'}
                      onChange={() => setDestinationType('ASSET')}
                      className="mr-2"
                    />
                    Register as Fixed Asset
                  </label>
                </div>
              </div>

              {destinationType === 'INVENTORY' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Stock Item</label>
                  <div className="relative">
                    <select
                      value={inventoryId}
                      onChange={e => setInventoryId(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-gray-950 pl-3 pr-8 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                    >
                      <option value="">-- Choose Stock Item to Update --</option>
                      {inventories.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.name} (SKU: {inv.sku})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setScanTarget('receipt-inventory')}
                      className="absolute right-3 top-[11px] text-gray-500 hover:text-white transition-colors"
                      title="Scan SKU"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Serial Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={assetSerialNumber}
                        onChange={e => setAssetSerialNumber(e.target.value)}
                        placeholder="e.g. SN-XYZ-123"
                        className="w-full rounded-xl border border-gray-800 bg-gray-950/60 pl-4 pr-9 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setScanTarget('receipt-asset-sn')}
                        className="absolute right-3 top-[11px] text-gray-500 hover:text-white transition-colors"
                        title="Scan Serial Number"
                      >
                        <Camera size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Location placement</label>
                    <input
                      type="text"
                      value={assetLocation}
                      onChange={e => setAssetLocation(e.target.value)}
                      placeholder="e.g. Server Room D"
                      className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Shipment Condition</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                >
                  <option value="GOOD">Good / Complete</option>
                  <option value="DAMAGED">Damaged / Defect</option>
                  <option value="INCOMPLETE">Incomplete Parts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Verification Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe details regarding shipment, vendor logs or packages"
                  rows={2}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-gray-950 border border-gray-800 hover:bg-gray-900 text-gray-400 text-xs font-bold px-4 py-2 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 transition-all shadow-md shadow-violet-950/20"
            >
              Confirm Receipt
            </button>
          </div>
        </form>
      )}

      {/* Goods Receipts Log Table */}
      <div className="bg-gray-900/10 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-sm font-bold text-white mb-4">Receipt Transaction Log</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                <th className="py-2.5">Receipt No</th>
                <th className="py-2.5">Item Name</th>
                <th className="py-2.5">Qty Received</th>
                <th className="py-2.5">Destination</th>
                <th className="py-2.5">Received By</th>
                <th className="py-2.5">Received At</th>
                <th className="py-2.5">Condition</th>
                <th className="py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300">
              {goodsReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No goods receipts registered in Supabase.
                  </td>
                </tr>
              ) : (
                goodsReceipts.map(receipt => (
                  <tr key={receipt.id} className="hover:bg-gray-900/10">
                    <td className="py-3 font-semibold text-white font-mono">{receipt.receiptNumber}</td>
                    <td className="py-3 font-semibold text-white">{receipt.itemName}</td>
                    <td className="py-3">
                      <span className="font-bold text-violet-400">
                        {receipt.quantityReceived}
                      </span>
                      {receipt.quantityOrdered > 0 && (
                        <span className="text-[10px] text-gray-500 ml-1">/ {receipt.quantityOrdered}</span>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-gray-400 font-mono text-[10px]">
                      {receipt.destinationType}
                    </td>
                    <td className="py-3 text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={10} className="text-gray-500" />
                        {getUserName(receipt.receivedById)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-550">{new Date(receipt.receivedAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                        receipt.condition === 'GOOD' ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-rose-600/10 text-rose-400 border border-rose-500/20"
                      )}>
                        {receipt.condition}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 max-w-[200px] truncate">{receipt.notes || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {scanTarget && (
          <BarcodeScannerModal
            isOpen={!!scanTarget}
            onClose={() => setScanTarget(null)}
            onScan={(code) => {
              let cleanCode = code.trim();
              if (cleanCode.startsWith('CH:AST:')) {
                cleanCode = cleanCode.replace('CH:AST:', '');
              } else if (cleanCode.startsWith('CH:INV:')) {
                cleanCode = cleanCode.replace('CH:INV:', '');
              }

              if (scanTarget === 'receipt-inventory') {
                const matched = inventories.find(
                  i => i.sku?.toLowerCase() === cleanCode.toLowerCase() || 
                       i.name?.toLowerCase() === cleanCode.toLowerCase() ||
                       i.id?.toLowerCase() === cleanCode.toLowerCase()
                );
                if (matched) {
                  setInventoryId(matched.id);
                  toast.success(`Barang "${matched.name}" berhasil terpilih!`);
                } else {
                  toast.error(`Barang dengan SKU atau Nama "${cleanCode}" tidak ditemukan di database.`);
                }
              } else if (scanTarget === 'receipt-asset-sn') {
                setAssetSerialNumber(cleanCode);
                toast.success(`Serial Number "${cleanCode}" berhasil disalin!`);
              }
              setScanTarget(null);
            }}
            title={
              scanTarget === 'receipt-inventory' 
                ? "Scan SKU Barang Inventaris" 
                : "Scan Serial Number Aset Baru"
            }
          />
        )}
      </div>
    </div>
  );
}
