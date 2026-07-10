import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Plus, Clipboard, ShieldCheck, User, X, Camera } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import { toast } from 'sonner';
import SearchableDropdown from '../common/SearchableDropdown';

interface SelectedItem {
  type: 'ASSET' | 'INVENTORY';
  id: string; // Asset ID or Inventory ID
  name: string;
  quantity: number;
}

export default function EquipmentCheckoutPage() {
  const {
    equipmentCheckouts,
    assets,
    inventories,
    currentUser,
    addEquipmentCheckout,
    approveEquipmentCheckout,
    returnEquipmentItem,
    users
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [activeAssetId, setActiveAssetId] = useState('');
  const [activeInventoryId, setActiveInventoryId] = useState('');
  const [activeQuantity, setActiveQuantity] = useState(1);
  const [scanTarget, setScanTarget] = useState<'checkout-asset' | 'checkout-inventory' | null>(null);

  // Return modal state variables
  const [returnModalCheckoutId, setReturnModalCheckoutId] = useState<string | null>(null);
  const [returnModalItem, setReturnModalItem] = useState<any | null>(null);
  const [returnCondition, setReturnCondition] = useState<'GOOD' | 'DAMAGED' | 'BROKEN'>('GOOD');
  const [returnNotes, setReturnNotes] = useState('');

  const isHandler = currentUser ? ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role) : false;

  // Filter available assets and inventory
  const availableAssets = assets.filter(a => a.status === 'AVAILABLE');
  const availableInventories = inventories.filter(i => i.quantity > 0);

  const handleAddItem = () => {
    if (activeAssetId) {
      const asset = assets.find(a => a.id === activeAssetId);
      if (asset) {
        // Prevent duplicate
        if (selectedItems.some(i => i.id === asset.id)) return;
        setSelectedItems([...selectedItems, {
          type: 'ASSET',
          id: asset.id,
          name: `${asset.name} (S/N: ${asset.serialNumber})`,
          quantity: 1
        }]);
        setActiveAssetId('');
      }
    } else if (activeInventoryId) {
      const inv = inventories.find(i => i.id === activeInventoryId);
      if (inv) {
        if (selectedItems.some(i => i.id === inv.id)) return;
        setSelectedItems([...selectedItems, {
          type: 'INVENTORY',
          id: inv.id,
          name: `${inv.name} (${inv.unit})`,
          quantity: Math.min(activeQuantity, inv.quantity)
        }]);
        setActiveInventoryId('');
        setActiveQuantity(1);
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || selectedItems.length === 0) return;

    const items = selectedItems.map(item => ({
      assetId: item.type === 'ASSET' ? item.id : null,
      inventoryId: item.type === 'INVENTORY' ? item.id : null,
      quantity: item.quantity
    }));

    await addEquipmentCheckout({
      items,
      purpose: purpose.trim(),
      expectedReturn
    });

    // Reset Form
    setPurpose('');
    setExpectedReturn('');
    setSelectedItems([]);
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
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 transition-all shadow-md shadow-violet-950/20"
          >
            <Plus size={14} />
            New Checkout Request
          </button>
        </div>
      )}

      {/* Main Request Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900/10 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h2 className="text-sm font-bold text-white">Create Lend & Checkout Request</h2>
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
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Purpose of Lend</label>
                <input
                  required
                  type="text"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="e.g. Setting up fiber link in Room B"
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Expected Return Date (Optional)</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={expectedReturn}
                    onChange={e => setExpectedReturn(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-l border-gray-800 pl-6">
              <h3 className="text-xs font-bold text-white uppercase">Add Items / Assets</h3>
              
              {/* Item selection grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Select Hardware Asset</label>
                    <button
                      type="button"
                      onClick={() => setScanTarget('checkout-asset')}
                      className="text-gray-500 hover:text-white transition-colors"
                      title="Scan Asset"
                    >
                      <Camera size={12} />
                    </button>
                  </div>
                  <SearchableDropdown
                    options={availableAssets.map(a => ({
                      value: a.id,
                      label: a.name,
                      sublabel: `${a.brand} · S/N: ${a.serialNumber}`
                    }))}
                    value={activeAssetId}
                    onChange={val => { setActiveAssetId(val); setActiveInventoryId(''); }}
                    placeholder="-- Choose Asset --"
                    searchPlaceholder="Cari nama, merek, S/N..."
                    emptyLabel="-- Pilih Asset --"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Or Select Inventory Parts</label>
                    <button
                      type="button"
                      onClick={() => setScanTarget('checkout-inventory')}
                      className="text-gray-500 hover:text-white transition-colors"
                      title="Scan SKU"
                    >
                      <Camera size={12} />
                    </button>
                  </div>
                  <SearchableDropdown
                    options={availableInventories.map(i => ({
                      value: i.id,
                      label: i.name,
                      sublabel: `SKU: ${i.sku} · Stok: ${i.quantity} ${i.unit}`
                    }))}
                    value={activeInventoryId}
                    onChange={val => { setActiveInventoryId(val); setActiveAssetId(''); }}
                    placeholder="-- Choose Inventory --"
                    searchPlaceholder="Cari nama atau SKU..."
                    emptyLabel="-- Pilih Inventory --"
                  />
                </div>
              </div>

              {activeInventoryId && (
                <div>
                  <label className="block text-[10px] text-gray-400 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={activeQuantity}
                    onChange={e => setActiveQuantity(parseInt(e.target.value) || 1)}
                    className="w-24 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-500"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleAddItem}
                disabled={!activeAssetId && !activeInventoryId}
                className="w-full rounded-lg bg-gray-800 border border-gray-700/60 hover:bg-gray-700/80 text-white text-xs font-semibold py-2 transition-all"
              >
                Add Item to Basket
              </button>

              {/* Basket list */}
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-gray-950/40 rounded-lg border border-gray-800">
                    <span className="text-gray-300 font-medium truncate max-w-[200px]">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-violet-400">Qty: {item.quantity}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-500 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
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
              disabled={selectedItems.length === 0}
              className="rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 transition-all shadow-md shadow-violet-950/20"
            >
              Submit Lend Request
            </button>
          </div>
        </form>
      )}

      {/* Lending Requests Table */}
      <div className="bg-gray-900/10 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-sm font-bold text-white mb-4">Lending Requests Log</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                <th className="py-2.5">Checkout No</th>
                <th className="py-2.5">Technician</th>
                <th className="py-2.5">Purpose</th>
                <th className="py-2.5">Lent Items</th>
                <th className="py-2.5">Return Date</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300">
              {equipmentCheckouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No equipment checkout logs registered in Supabase.
                  </td>
                </tr>
              ) : (
                equipmentCheckouts.map(checkout => (
                  <tr key={checkout.id} className="hover:bg-gray-900/10">
                    <td className="py-3 font-semibold text-white font-mono">{checkout.checkoutNumber}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-500" />
                        {getUserName(checkout.technicianId)}
                      </span>
                    </td>
                     <td className="py-3 font-medium text-gray-400">{checkout.purpose}</td>
                    <td className="py-3 max-w-[250px]">
                      <div className="flex flex-col gap-1.5">
                        {checkout.items?.map((item, idx) => {
                          const itemName = item.assetId
                            ? (assets.find(a => a.id === item.assetId)?.name || `Asset (${item.assetId})`)
                            : (inventories.find(i => i.id === item.inventoryId)?.name || `Inventory (${item.inventoryId})`);
                          return (
                            <div key={item.id || idx} className="flex items-center justify-between gap-2 bg-gray-950/40 border border-gray-850 px-2 py-1 rounded">
                              <span className="text-[10px] text-gray-300 truncate max-w-[120px]" title={itemName}>
                                {itemName} (x{item.quantity})
                              </span>
                              {item.scannedIn ? (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  Returned
                                </span>
                              ) : (checkout.status === 'APPROVED' || checkout.status === 'PARTIALLY_RETURNED') ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReturnModalCheckoutId(checkout.id);
                                    setReturnModalItem(item);
                                    setReturnCondition('GOOD');
                                    setReturnNotes('');
                                  }}
                                  className="text-[9px] font-bold bg-violet-600 hover:bg-violet-500 text-white px-2 py-0.5 rounded transition-all"
                                >
                                  Return
                                </button>
                              ) : (
                                <span className="text-[9px] text-gray-500">
                                  Pending
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(checkout.expectedReturn).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                        checkout.status === 'PENDING_APPROVAL' ? "bg-amber-600/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                        checkout.status === 'APPROVED' ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" :
                        checkout.status === 'PARTIALLY_RETURNED' ? "bg-orange-605/10 text-orange-400 border border-orange-500/20" :
                        checkout.status === 'RETURNED' ? "bg-emerald-650/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-gray-800 text-gray-400"
                      )}>
                        {checkout.status === 'PENDING_APPROVAL' ? 'PENDING' : checkout.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {(checkout.status === 'PENDING_APPROVAL' && isHandler) && (
                        <button
                          onClick={() => approveEquipmentCheckout(checkout.id)}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded transition-all"
                        >
                          <ShieldCheck size={12} />
                          Approve Checkout
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal */}
      {returnModalCheckoutId && returnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#1e2028] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">Return Item</h3>
              <button onClick={() => { setReturnModalCheckoutId(null); setReturnModalItem(null); }} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Item Name</p>
              <p className="text-xs text-white mt-1">
                {returnModalItem.assetId 
                  ? (assets.find(a => a.id === returnModalItem.assetId)?.name || `Asset (${returnModalItem.assetId})`)
                  : (inventories.find(i => i.id === returnModalItem.inventoryId)?.name || `Inventory (${returnModalItem.inventoryId})`)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase">Condition on Return</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="returnCondition"
                    value="GOOD"
                    checked={returnCondition === 'GOOD'}
                    onChange={() => setReturnCondition('GOOD')}
                    className="h-4 w-4 border-gray-850 text-violet-600 focus:ring-violet-650"
                  />
                  <span>Good (Baik)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="returnCondition"
                    value="DAMAGED"
                    checked={returnCondition === 'DAMAGED'}
                    onChange={() => setReturnCondition('DAMAGED')}
                    className="h-4 w-4 border-gray-850 text-rose-600 focus:ring-rose-650"
                  />
                  <span>Damaged (Rusak Ringan)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="returnCondition"
                    value="BROKEN"
                    checked={returnCondition === 'BROKEN'}
                    onChange={() => setReturnCondition('BROKEN')}
                    className="h-4 w-4 border-gray-850 text-red-600 focus:ring-red-650"
                  />
                  <span>Broken (Rusak Parah)</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase">Damage Notes (Optional)</label>
              <textarea
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                placeholder="Describe any wear and tear or damage..."
                className="w-full rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-violet-600 transition-colors"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => { setReturnModalCheckoutId(null); setReturnModalItem(null); }}
                className="rounded-lg bg-gray-950 border border-gray-800 hover:bg-gray-900 text-gray-400 text-xs font-bold px-4 py-2 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await returnEquipmentItem(returnModalCheckoutId, returnModalItem.id, returnCondition, returnNotes);
                  setReturnModalCheckoutId(null);
                  setReturnModalItem(null);
                }}
                className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 transition-all shadow-md shadow-violet-950/20"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
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

            if (scanTarget === 'checkout-asset') {
              const matched = availableAssets.find(
                a => a.serialNumber?.toLowerCase() === cleanCode.toLowerCase() || 
                     a.name?.toLowerCase() === cleanCode.toLowerCase() ||
                     a.id?.toLowerCase() === cleanCode.toLowerCase()
              );
              if (matched) {
                setActiveAssetId(matched.id);
                setActiveInventoryId('');
                toast.success(`Aset "${matched.name}" berhasil terpilih!`);
              } else {
                toast.error(`Aset dengan S/N atau Nama "${cleanCode}" tidak ditemukan atau sedang tidak tersedia.`);
              }
            } else if (scanTarget === 'checkout-inventory') {
              const matched = availableInventories.find(
                i => i.sku?.toLowerCase() === cleanCode.toLowerCase() || 
                     i.name?.toLowerCase() === cleanCode.toLowerCase() ||
                     i.id?.toLowerCase() === cleanCode.toLowerCase()
              );
              if (matched) {
                setActiveInventoryId(matched.id);
                setActiveAssetId('');
                toast.success(`Barang "${matched.name}" berhasil terpilih!`);
              } else {
                toast.error(`Barang dengan SKU atau Nama "${cleanCode}" tidak ditemukan atau stok kosong.`);
              }
            }
            setScanTarget(null);
          }}
          title={
            scanTarget === 'checkout-asset' 
              ? "Scan Barcode Aset" 
              : "Scan SKU Barang Inventaris"
          }
        />
      )}
    </div>
  );
}
