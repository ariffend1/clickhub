import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Plus, Search, X, Monitor, Laptop, Server, Printer, Wifi, Camera, Cpu, Box, Network, Layers, GitFork, Globe, Database, HardDrive, Webhook, MessageSquare, ShieldAlert, Key, FileCheck, Phone, PhoneCall, Package, ClipboardList, Truck, FolderGit, FileText, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import type { AssetStatus, Asset, ConfigType } from '../../types';
import BarcodeScannerModal from './BarcodeScannerModal';
import EquipmentCheckoutPage from './EquipmentCheckoutPage';
import GoodsReceiptPage from './GoodsReceiptPage';
import PageHelp from '../layout/PageHelpModal';
import SearchableDropdown from '../common/SearchableDropdown';

const statusConfig: Record<AssetStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  IN_STORAGE: { label: 'In Storage', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  DEPLOYED: { label: 'Deployed', color: 'text-green-400', bg: 'bg-green-500/20' },
  MAINTENANCE: { label: 'Maintenance', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  RETIRED: { label: 'Retired', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const typeIcons: Record<string, React.ReactNode> = {
  Laptop: <Laptop size={16} />, Desktop: <Monitor size={16} />, Server: <Server size={16} />,
  Printer: <Printer size={16} />, Switch: <Wifi size={16} />,
};

export default function AssetsPage() {
  const { 
    assets, addAsset, updateAsset, deleteAsset, getUserById, hasRole,
    inventories, partRequests, stockRequests, addPartRequest, addStockRequest,
    approvePartRequest, approveStockRequest, users, equipmentCheckouts,
    maintenanceSchedules, addMaintenanceSchedule, updateMaintenanceSchedule, deleteMaintenanceSchedule,
    directoryCategories, directoryEntries, addDirectoryConfig, deleteDirectoryConfig,
    requestDeleteDirectoryConfig, approveDeleteDirectoryConfig, rejectDeleteDirectoryConfig, deleteDirectoryCategory,
    checklistTemplates,
    addInventoryMaster, updateInventoryMaster, deleteInventoryMaster, verifyInventoryItem,
    auditLogs,
    locations, masterData, addLocation, addMasterDataItem, bulkAddAssets, bulkAddInventories
  } = useStore();

  const assetTypes = masterData.filter(m => m.category === 'ASSET_TYPE' && m.isVerified !== false).map(m => m.name);
  const brandOptions = masterData.filter(m => m.category === 'BRAND' && m.isVerified !== false).map(m => m.name);
  const vendorOptions = masterData.filter(m => m.category === 'VENDOR' && m.isVerified !== false).map(m => m.name);
  const unitOptions = masterData.filter(m => m.category === 'UNIT' && m.isVerified !== false).map(m => m.name);
  const locationOptions = locations.filter(l => l.isVerified !== false).map(l => l.name);

  // Calculations for Visual Widget
  const totalAssetsCount = assets.length;
  
  // 1. Condition/Status Health Chart
  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = assets.filter(a => a.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  // 2. Sebaran Lokasi Chart (top 5 locations, rest as other)
  const locationCounts = assets.reduce((acc, a) => {
    const loc = a.location || 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const colorsPalette = [
    'bg-violet-500',
    'bg-sky-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-gray-500'
  ];

  const [activeTab, setActiveTab] = useState<'assets' | 'inventory' | 'requests' | 'checkout' | 'receipt' | 'configs' | 'audit'>('assets');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [form, setForm] = useState({ name: '', brand: '', type: 'Laptop', serialNumber: '', location: '', price: '', vendor: '', processor: '', ram: '', storage: '', os: '' });
  const [scanTarget, setScanTarget] = useState<'assets-search' | 'inventory-search' | 'form-sn' | null>(null);
  const [modalTab, setModalTab] = useState<'specs' | 'audit' | 'maintenance' | 'qr_label' | 'depreciation'>('specs');

  // Inventory Master Forms state
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [showEditMaster, setShowEditMaster] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [masterForm, setMasterForm] = useState({ name: '', sku: '', unit: 'pcs', location: 'Warehouse', minStock: 5, description: '' });

  // IT Configuration Directory & Configs integration with Supabase
  const categories = directoryCategories.length > 0 
    ? directoryCategories.map(c => c.name)
    : ['Server / VM', 'Jaringan / IP', 'Telepon / Ekstensi', 'Kredensial / Akun'];

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const configs = directoryEntries.map(e => {
    const [typeStr, linkedAssetId] = e.location ? e.location.split(':') : ['SERVER_PHYSICAL', ''];
    const categoryName = directoryCategories.find(cat => cat.id === e.categoryId)?.name || 'Other';
    return {
      id: e.id,
      name: e.name,
      type: (typeStr || 'SERVER_PHYSICAL') as ConfigType,
      category: categoryName,
      value: e.value,
      linkedAssetId: linkedAssetId || '',
      notes: e.description || ''
    };
  });

  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [auditUserFilter, setAuditUserFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditDateRange, setAuditDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [newConfig, setNewConfig] = useState({ name: '', type: 'SERVER_PHYSICAL' as ConfigType, category: 'Server / VM', value: '', notes: '', linkedAssetId: '' });
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const handleCreateConfig = async () => {
    if (!newConfig.name.trim() || !newConfig.value.trim()) return;
    
    let finalCategory = newConfig.category;
    if (isCustomCategory && customCategoryInput.trim()) {
      finalCategory = customCategoryInput.trim();
    }

    try {
      await addDirectoryConfig(
        newConfig.name.trim(),
        newConfig.type,
        finalCategory,
        newConfig.value.trim(),
        newConfig.notes.trim(),
        newConfig.linkedAssetId
      );
      
      // Reset form fields
      setNewConfig({ name: '', type: 'SERVER_PHYSICAL', category: categories[0] || 'Server / VM', value: '', notes: '', linkedAssetId: '' });
      setCustomCategoryInput('');
      setIsCustomCategory(false);
      setShowCreateConfig(false);
    } catch (e) {
      alert("Gagal menambahkan konfigurasi: " + (e as any).message);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    const isAdmin = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']);
    const confirmMsg = isAdmin 
      ? 'Apakah Anda yakin ingin menghapus konfigurasi ini secara PERMANEN?' 
      : 'Apakah Anda yakin ingin mengajukan PERMINTAAN PENGHAPUSAN untuk konfigurasi ini?';
      
    if (confirm(confirmMsg)) {
      try {
        if (isAdmin) {
          await deleteDirectoryConfig(id);
        } else {
          await requestDeleteDirectoryConfig(id);
          alert("Permintaan penghapusan telah dikirim ke Admin/Manager.");
        }
      } catch (e) {
        alert("Gagal memproses penghapusan: " + (e as any).message);
      }
    }
  };

  const handleApproveDelete = async (id: string) => {
    if (confirm('Setujui penghapusan data ini secara permanen?')) {
      try {
        await approveDeleteDirectoryConfig(id);
      } catch (e) {
        alert("Gagal menyetujui penghapusan: " + (e as any).message);
      }
    }
  };

  const handleRejectDelete = async (id: string) => {
    try {
      await rejectDeleteDirectoryConfig(id);
    } catch (e) {
      alert("Gagal menolak penghapusan: " + (e as any).message);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    const categoryObj = directoryCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (!categoryObj) return;

    if (confirm(`Apakah Anda yakin ingin menghapus Golongan/Grup "${catName}" secara PERMANEN? Semua data konfigurasi di dalamnya juga akan terhapus!`)) {
      try {
        await deleteDirectoryCategory(categoryObj.id);
      } catch (e) {
        alert("Gagal menghapus golongan: " + (e as any).message);
      }
    }
  };

  const filteredConfigs = configs.filter(c => {
    // Filter by category
    if (selectedCategoryFilter !== 'all' && c.category !== selectedCategoryFilter) {
      return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.value.toLowerCase().includes(s) || (c.notes || '').toLowerCase().includes(s) || c.category.toLowerCase().includes(s);
  });

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ title: '', description: '', frequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY', scheduledDate: '', checklistTemplateId: '' });

  // Direct Bon & Stock Request states
  const [showDirectBon, setShowDirectBon] = useState(false);
  const [directBonForm, setDirectBonForm] = useState({ inventoryId: '', quantity: 1, notes: '' });

  const [showStockRequest, setShowStockRequest] = useState(false);
  const [stockForm, setStockForm] = useState({
    type: 'RESTOCK' as 'RESTOCK' | 'NEW_ITEM',
    inventoryId: '',
    itemName: '',
    itemDescription: '',
    category: 'General',
    quantity: 1,
    estimatedPrice: '',
    reason: ''
  });

  useEffect(() => {
    const parseUrlParams = (urlStr: string) => {
      try {
        const url = new URL(urlStr, window.location.origin);
        const tab = url.searchParams.get('tab');
        const action = url.searchParams.get('action');
        if (tab === 'requests') {
          setActiveTab('requests');
          if (action === 'restock') {
            const invId = url.searchParams.get('inventoryId') || '';
            const itemName = url.searchParams.get('itemName') || '';
            const qty = parseInt(url.searchParams.get('quantity') || '5', 10);
            
            setStockForm({
              type: 'RESTOCK',
              inventoryId: invId,
              itemName: itemName,
              itemDescription: `Restock otomatis untuk item "${itemName}" karena stok menipis.`,
              category: 'General',
              quantity: qty,
              estimatedPrice: '',
              reason: 'Restock Otomatis (Low Stock Alert)'
            });
            setShowStockRequest(true);
          }
        }
      } catch (err) {
        console.error('URL parse error:', err);
      }
    };

    parseUrlParams(window.location.href);

    const handleRouteChange = (e: any) => {
      if (e.detail?.link) {
        parseUrlParams(e.detail.link);
      }
    };

    window.addEventListener('app-route-change', handleRouteChange);
    return () => {
      window.removeEventListener('app-route-change', handleRouteChange);
    };
  }, []);

  const handleExportAssetsCSV = () => {
    const headers = ['Name', 'Brand', 'Type', 'Serial Number', 'Location', 'Price', 'Vendor', 'Status'];
    const rows = filteredAssets.map(a => [
      a.name,
      a.brand || '',
      a.type,
      a.serialNumber,
      a.location || '',
      a.price.toString(),
      a.vendor || '',
      a.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assets_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Assets exported successfully!');
  };

  const handleImportAssetsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          toast.error('File CSV kosong atau tidak memiliki data.');
          return;
        }

        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const expectedHeaders = ['name', 'brand', 'type', 'serial number', 'location', 'price', 'vendor', 'status'];
        const missing = expectedHeaders.filter(h => !headers.includes(h));
        if (missing.length > 0) {
          toast.error(`Format CSV salah. Kolom hilang: ${missing.join(', ')}`);
          return;
        }

        const assetsToImport = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const name = cols[headers.indexOf('name')] || '';
          const brand = cols[headers.indexOf('brand')] || '';
          const type = cols[headers.indexOf('type')] || 'Laptop';
          const serialNumber = cols[headers.indexOf('serial number')] || '';
          const location = cols[headers.indexOf('location')] || '';
          const price = parseFloat(cols[headers.indexOf('price')] || '0') || 0;
          const vendor = cols[headers.indexOf('vendor')] || '';
          const status = (cols[headers.indexOf('status')] || 'AVAILABLE') as AssetStatus;

          if (!name || !serialNumber) {
            continue;
          }
          assetsToImport.push({
            name,
            brand,
            type,
            serialNumber,
            location,
            price,
            vendor,
            status,
            specs: {},
            purchaseDate: new Date().toISOString()
          });
        }

        if (assetsToImport.length === 0) {
          toast.error('Tidak ada data aset valid untuk diimpor.');
          return;
        }

        await bulkAddAssets(assetsToImport);
        toast.success(`Berhasil mengimpor ${assetsToImport.length} aset!`);
      } catch (err: any) {
        toast.error(`Gagal mengimpor CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportInventoryCSV = () => {
    const headers = ['Name', 'SKU', 'Unit', 'Location', 'Quantity', 'MinStock', 'Description'];
    const rows = inventories.map(i => [
      i.name,
      i.sku,
      i.unit,
      i.location,
      i.quantity.toString(),
      i.minStock.toString(),
      i.description || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory exported successfully!');
  };

  const handleImportInventoryCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          toast.error('File CSV kosong atau tidak memiliki data.');
          return;
        }

        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const expectedHeaders = ['name', 'sku', 'unit', 'location', 'quantity', 'minstock', 'description'];
        const missing = expectedHeaders.filter(h => !headers.includes(h));
        if (missing.length > 0) {
          toast.error(`Format CSV salah. Kolom hilang: ${missing.join(', ')}`);
          return;
        }

        const itemsToImport = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const name = cols[headers.indexOf('name')] || '';
          const sku = cols[headers.indexOf('sku')] || '';
          const unit = cols[headers.indexOf('unit')] || 'pcs';
          const location = cols[headers.indexOf('location')] || 'Warehouse';
          const quantity = parseInt(cols[headers.indexOf('quantity')] || '0', 10) || 0;
          const minStock = parseInt(cols[headers.indexOf('minstock')] || '5', 10) || 5;
          const description = cols[headers.indexOf('description')] || '';

          if (!name || !sku) {
            continue;
          }
          itemsToImport.push({
            name,
            sku,
            unit,
            location,
            quantity,
            minStock,
            description
          });
        }

        if (itemsToImport.length === 0) {
          toast.error('Tidak ada data inventaris valid untuk diimpor.');
          return;
        }

        await bulkAddInventories(itemsToImport);
        toast.success(`Berhasil mengimpor ${itemsToImport.length} item inventaris!`);
      } catch (err: any) {
        toast.error(`Gagal mengimpor CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const handleToggleSelectAsset = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAssetIds([...selectedAssetIds, id]);
    } else {
      setSelectedAssetIds(selectedAssetIds.filter(x => x !== id));
    }
  };

  const handlePrintLabels = (assetsToPrint: Asset[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print labels.');
      return;
    }

    const labelsHtml = assetsToPrint.map(asset => {
      const qrData = encodeURIComponent(`https://clickhub-id.vercel.app/assets?id=${asset.id}`);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
      return `
        <div class="label-card" style="width: 260px; height: 140px; border: 2px solid #000; border-radius: 6px; padding: 8px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #fff; page-break-inside: avoid;">
          <div class="label-header" style="font-size: 10px; font-weight: 800; text-align: center; border-bottom: 1px solid #000; padding-bottom: 3px; letter-spacing: 1px;">CLICKHUB IT ASSET</div>
          <div class="label-body" style="display: flex; flex: 1; margin-top: 6px; gap: 8px; min-height: 0;">
            <div class="label-info" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;">
              <div class="asset-name" style="font-size: 11px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${asset.name}</div>
              <div class="info-row" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Brand: ${asset.brand || '-'}</div>
              <div class="info-row font-mono" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: Courier, monospace;">S/N: ${asset.serialNumber}</div>
              <div class="info-row" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Loc: ${asset.location}</div>
              <div class="info-row" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Status: ${asset.status}</div>
            </div>
            <div class="label-qr" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; align-self: center;">
              <img src="${qrUrl}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" onload="window.checkImagesLoaded()" />
            </div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Asset Labels</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #fff;
              color: #000;
            }
            .label-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              justify-content: center;
            }
          </style>
          <script>
            let loadedImages = 0;
            const totalImages = ${assetsToPrint.length};
            window.checkImagesLoaded = function() {
              loadedImages++;
              if (loadedImages === totalImages) {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              }
            }
            // Fail-safe timeout
            setTimeout(() => {
              window.print();
              window.close();
            }, 5000);
          </script>
        </head>
        <body>
          <div class="label-grid">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const canManage = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN']);
  const isAdminOrManager = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']);

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditUserFilter !== 'all' && log.userId !== auditUserFilter) return false;
    if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(q);
      const detailsMatch = log.details.toLowerCase().includes(q);
      const userObj = users.find(u => u.id === log.userId);
      const userMatch = userObj ? userObj.name.toLowerCase().includes(q) : false;
      if (!actionMatch && !detailsMatch && !userMatch) return false;
    }
    if (auditDateRange !== 'all') {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      if (auditDateRange === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (logDate < todayStart) return false;
      } else if (auditDateRange === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (logDate < oneWeekAgo) return false;
      } else if (auditDateRange === 'month') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (logDate < oneMonthAgo) return false;
      }
    }
    return true;
  });
  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  const filteredAssets = assets.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.serialNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    addAsset({
      name: form.name.trim(), brand: form.brand, type: form.type, serialNumber: form.serialNumber,
      location: form.location, price: parseFloat(form.price) || 0, vendor: form.vendor,
      specs: { processor: form.processor, ram: form.ram, storage: form.storage, os: form.os },
    });
    setForm({ name: '', brand: '', type: 'Laptop', serialNumber: '', location: '', price: '', vendor: '', processor: '', ram: '', storage: '', os: '' });
    setShowCreate(false);
  };

  const handleDirectBon = () => {
    if (!directBonForm.inventoryId || directBonForm.quantity <= 0) return;
    addPartRequest(directBonForm.inventoryId, directBonForm.quantity, directBonForm.notes);
    setDirectBonForm({ inventoryId: '', quantity: 1, notes: '' });
    setShowDirectBon(false);
  };

  const handleStockRequest = () => {
    if (stockForm.type === 'RESTOCK' && !stockForm.inventoryId) return;
    if (stockForm.type === 'NEW_ITEM' && !stockForm.itemName.trim()) return;
    if (stockForm.quantity <= 0) return;

    const finalItemName = stockForm.type === 'RESTOCK'
      ? inventories.find(i => i.id === stockForm.inventoryId)?.name || ''
      : stockForm.itemName;

    addStockRequest({
      type: stockForm.type,
      inventoryId: stockForm.type === 'RESTOCK' ? stockForm.inventoryId : undefined,
      itemName: finalItemName,
      itemDescription: stockForm.itemDescription,
      category: stockForm.category,
      quantity: stockForm.quantity,
      estimatedPrice: parseFloat(stockForm.estimatedPrice) || 0,
      reason: stockForm.reason
    });

    setStockForm({
      type: 'RESTOCK',
      inventoryId: '',
      itemName: '',
      itemDescription: '',
      category: 'General',
      quantity: 1,
      estimatedPrice: '',
      reason: ''
    });
    setShowStockRequest(false);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-xs text-gray-500 font-medium">Manage hardware assets, spare parts inventory, and procurement requests.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-850 pb-3">
        <button
          onClick={() => { setActiveTab('assets'); setSearch(''); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border",
            activeTab === 'assets'
              ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/5 font-bold"
              : "bg-gray-900/20 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
          )}
        >
          <Laptop size={14} className={cn("transition-transform", activeTab === 'assets' && "scale-110")} />
          <span>Hardware Assets</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-bold border ml-0.5",
            activeTab === 'assets'
              ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
              : "bg-gray-800 border-gray-700 text-gray-500"
          )}>
            {assets.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('inventory'); setSearch(''); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border",
            activeTab === 'inventory'
              ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/5 font-bold"
              : "bg-gray-900/20 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
          )}
        >
          <Package size={14} className={cn("transition-transform", activeTab === 'inventory' && "scale-110")} />
          <span>Inventory / Spare Parts</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-bold border ml-0.5",
            activeTab === 'inventory'
              ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
              : "bg-gray-800 border-gray-700 text-gray-500"
          )}>
            {inventories.length}
          </span>
        </button>
        {canManage && (
          <button
            onClick={() => { setActiveTab('configs'); setSearch(''); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border",
              activeTab === 'configs'
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/5 font-bold"
                : "bg-gray-900/20 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
            )}
          >
            <FolderGit size={14} className={cn("transition-transform", activeTab === 'configs' && "scale-110")} />
            <span>IT Directory & Configs</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold border ml-0.5",
              activeTab === 'configs'
                ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                : "bg-gray-800 border-gray-700 text-gray-500"
            )}>
              {configs.length}
            </span>
          </button>
        )}
        {canManage && (
          <button
            onClick={() => { setActiveTab('checkout'); setSearch(''); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border",
              activeTab === 'checkout'
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/5 font-bold"
                : "bg-gray-900/20 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
            )}
          >
            <ClipboardList size={14} className={cn("transition-transform", activeTab === 'checkout' && "scale-110")} />
            <span>Equipment Checkout</span>
          </button>
        )}
        {canManage && (
          <button
            onClick={() => { setActiveTab('receipt'); setSearch(''); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border",
              activeTab === 'receipt'
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/5 font-bold"
                : "bg-gray-900/20 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
            )}
          >
            <Truck size={14} className={cn("transition-transform", activeTab === 'receipt' && "scale-110")} />
            <span>Goods Receipt</span>
          </button>
        )}
        <button
          onClick={() => { setActiveTab('requests'); setSearch(''); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border",
            activeTab === 'requests'
              ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/5 font-bold"
              : "bg-gray-900/20 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
          )}
        >
          <FileText size={14} className={cn("transition-transform", activeTab === 'requests' && "scale-110")} />
          <span>Requests</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-bold border ml-0.5",
            activeTab === 'requests'
              ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
              : "bg-gray-800 border-gray-700 text-gray-500"
          )}>
            {partRequests.filter(r => r.status === 'PENDING').length + stockRequests.filter(r => r.status === 'PENDING').length}
          </span>
        </button>
        {isAdminOrManager && (
          <button
            onClick={() => { setActiveTab('audit'); setSearch(''); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border",
              activeTab === 'audit'
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/5 font-bold"
                : "bg-gray-900/20 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
            )}
          >
            <ShieldCheck size={14} className={cn("transition-transform", activeTab === 'audit' && "scale-110")} />
            <span>Audit Logs</span>
          </button>
        )}
      </div>

      {/* Assets Tab View */}
      {activeTab === 'assets' && (
        <>
          {/* Visual Dashboard Widgets */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left">
            {/* Condition Health Widget */}
            <div className="lg:col-span-1 rounded-2xl border border-gray-800 bg-[#282c34] p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asset Health Indicator</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">Live Status</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black text-white">
                    {totalAssetsCount > 0 
                      ? Math.round(((statusCounts['AVAILABLE'] || 0) + (statusCounts['IN_USE'] || 0)) / totalAssetsCount * 100) 
                      : 100}%
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Operational Rate</span>
                </div>
                {/* Custom multi-color progress bar */}
                <div className="h-2.5 w-full rounded-full bg-gray-800 flex overflow-hidden">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const count = statusCounts[status] || 0;
                    const percent = totalAssetsCount > 0 ? (count / totalAssetsCount) * 100 : 0;
                    if (percent === 0) return null;
                    const bgClass = status === 'AVAILABLE' ? 'bg-green-500' :
                                    status === 'IN_USE' ? 'bg-blue-550' :
                                    status === 'BROKEN' ? 'bg-red-550' :
                                    status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-gray-500';
                    return (
                      <div 
                        key={status} 
                        style={{ width: `${percent}%` }} 
                        className={`${bgClass} h-full`}
                        title={`${config.label}: ${count} (${Math.round(percent)}%)`}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const count = statusCounts[status] || 0;
                    const bgClass = status === 'AVAILABLE' ? 'bg-green-500' :
                                    status === 'IN_USE' ? 'bg-blue-500' :
                                    status === 'BROKEN' ? 'bg-red-500' :
                                    status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-gray-500';
                    return (
                      <div key={status} className="flex items-center gap-1.5 text-gray-400">
                        <span className={`w-2 h-2 rounded-full ${bgClass}`} />
                        <span>{config.label} ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Location Distribution Widget */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-[#282c34] p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location Sebaran Aset</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">Top Locations</span>
              </div>
              <div className="space-y-3">
                <div className="flex h-3 w-full rounded-full bg-gray-850 overflow-hidden">
                  {sortedLocations.map(([loc, count], idx) => {
                    const percent = totalAssetsCount > 0 ? (count / totalAssetsCount) * 100 : 0;
                    return (
                      <div 
                        key={loc}
                        style={{ width: `${percent}%` }}
                        className={`${colorsPalette[idx % colorsPalette.length]} h-full`}
                        title={`${loc}: ${count} assets`}
                      />
                    );
                  })}
                  {/* Remainder as other */}
                  {(() => {
                    const topSum = sortedLocations.reduce((sum, [, count]) => sum + count, 0);
                    const remainder = totalAssetsCount - topSum;
                    const percent = totalAssetsCount > 0 ? (remainder / totalAssetsCount) * 100 : 0;
                    if (percent <= 0) return null;
                    return (
                      <div 
                        style={{ width: `${percent}%` }}
                        className="bg-gray-700 h-full"
                        title={`Lainnya: ${remainder} assets`}
                      />
                    );
                  })()}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-gray-400 pt-1">
                  {sortedLocations.map(([loc, count], idx) => (
                    <div key={loc} className="flex items-center gap-1.5 font-medium">
                      <span className={`w-2.5 h-2.5 rounded ${colorsPalette[idx % colorsPalette.length]}`} />
                      <span className="font-semibold text-gray-300">{loc}</span>
                      <span>({count})</span>
                    </div>
                  ))}
                  {(() => {
                    const topSum = sortedLocations.reduce((sum, [, count]) => sum + count, 0);
                    const remainder = totalAssetsCount - topSum;
                    if (remainder <= 0) return null;
                    return (
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded bg-gray-700" />
                        <span className="font-semibold text-gray-300">Lainnya</span>
                        <span>({remainder})</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="rounded-xl border border-gray-800 bg-[#282c34] p-4 text-center shadow-lg">
                <p className={cn("text-2xl font-bold", config.color)}>{assets.filter(a => a.status === status).length}</p>
                <p className="text-xs text-gray-500 font-medium">{config.label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 py-2 pl-9 pr-10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <button
                type="button"
                onClick={() => setScanTarget('assets-search')}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                title="Scan Barcode Aset"
              >
                <Camera size={14} />
              </button>
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-white outline-none">
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-white outline-none">
              <option value="all">All Types</option>
              {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {canManage && selectedAssetIds.length > 0 && (
              <button 
                onClick={() => {
                  const assetsToPrint = assets.filter(a => selectedAssetIds.includes(a.id));
                  handlePrintLabels(assetsToPrint);
                }} 
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow"
                id="print-selected-labels-btn"
              >
                Print Labels ({selectedAssetIds.length})
              </button>
            )}
            {canManage && (
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer">
                  📥 Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportAssetsCSV}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportAssetsCSV}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  📤 Export CSV
                </button>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors cursor-pointer">
                  <Plus size={12} /> Add Asset
                </button>
              </div>
            )}
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map(asset => {
              const assignee = asset.assignedToId ? getUserById(asset.assignedToId) : null;
              const sConfig = statusConfig[asset.status];
              return (
                <div key={asset.id} className="relative group">
                  {canManage && (
                    <input 
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={e => handleToggleSelectAsset(asset.id, e.target.checked)}
                      className="absolute top-4 right-4 z-10 h-4 w-4 rounded border-gray-700 bg-gray-800 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  )}
                  <button onClick={() => { setSelected(asset); setModalTab('specs'); }}
                    className="w-full h-full rounded-xl border border-gray-700/50 bg-[#282c34] p-4 text-left hover:border-gray-600 transition shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{typeIcons[asset.type] || <Monitor size={16} />}</span>
                          <span className="text-sm font-semibold text-white">{asset.name}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>{asset.brand} • {asset.type}</p>
                        <p>S/N: {asset.serialNumber}</p>
                        <p>📍 {asset.location}</p>
                        {assignee && <p>👤 {assignee.name}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-400">{formatPrice(asset.price)}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold", sConfig.bg, sConfig.color)}>{sConfig.label}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Inventory Tab View */}
      {activeTab === 'inventory' && (
        <div>
          {/* Pending Verifications (Barang Baru dari Penerimaan) */}
          {hasRole(['ROOT', 'ADMIN', 'MANAGER']) && inventories.some(i => !i.isVerified) && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-bold text-amber-400 uppercase mb-3 flex items-center gap-1.5">
                <ShieldAlert size={14} /> PENDING VERIFICATION (Merek/SKU Baru Menunggu Persetujuan)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventories.filter(i => !i.isVerified).map(inv => {
                  // Find receipt for this new item to show details
                  const receipt = useStore.getState().goodsReceipts.find(r => r.inventoryId === inv.id);
                  return (
                    <div key={inv.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between hover:border-amber-500/30 transition shadow-md">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-amber-400 font-mono font-semibold">SKU PENDING</span>
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Pending: {receipt?.quantityReceived || 0} {inv.unit}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1">{inv.name}</h4>
                        <p className="text-[10px] text-gray-400 mb-1">{inv.description}</p>
                        {receipt && (
                          <div className="text-[10px] text-amber-400/80 bg-amber-950/20 rounded p-1.5 mb-3">
                            <p>Penerima: {users.find(u => u.id === receipt.receivedById)?.name || 'Unknown'}</p>
                            <p>Catatan GR: {receipt.notes || '-'}</p>
                            {receipt.price > 0 && <p>Harga Satuan: Rp {Number(receipt.price).toLocaleString('id-ID')}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 border-t border-amber-500/10 pt-3">
                        <button
                          onClick={() => {
                            if (confirm(`Setujui & Verifikasi barang baru "${inv.name}" ke dalam inventaris?`)) {
                              verifyInventoryItem(inv.id);
                            }
                          }}
                          className="flex-1 text-center py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-colors"
                        >
                          Verify & Activate Stock
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus pengajuan barang baru "${inv.name}"?`)) {
                              deleteInventoryMaster(inv.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/20 text-red-400 text-[10px] font-bold transition-colors"
                          title="Hapus Pengajuan"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inventory Toolbar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search inventory..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 py-2 pl-9 pr-10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" 
              />
              <button
                type="button"
                onClick={() => setScanTarget('inventory-search')}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                title="Scan SKU Barang"
              >
                <Camera size={14} />
              </button>
            </div>
            {hasRole(['ROOT', 'ADMIN', 'MANAGER']) && (
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer">
                  📥 Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportInventoryCSV}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportInventoryCSV}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  📤 Export CSV
                </button>
                <button 
                  onClick={() => {
                    setMasterForm({ name: '', sku: '', unit: 'pcs', location: 'Warehouse', minStock: 5, description: '' });
                    setShowAddMaster(true);
                  }} 
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-950/20 cursor-pointer"
                >
                  <Plus size={12} /> Register Master Item
                </button>
              </div>
            )}
            <button 
              onClick={() => setShowDirectBon(true)} 
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              <Plus size={12} /> Form Bon Barang
            </button>
            <button 
              onClick={() => setShowStockRequest(true)} 
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
            >
              <Plus size={12} /> Ajukan Pengadaan Barang
            </button>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventories
              .filter(inv => inv.isVerified !== false)
              .filter(inv => !search || inv.name.toLowerCase().includes(search.toLowerCase()) || inv.sku.toLowerCase().includes(search.toLowerCase()))
              .map(inv => (
                <div 
                  key={inv.id} 
                  className="rounded-xl border border-gray-700/50 bg-[#282c34] p-4 flex flex-col justify-between hover:border-gray-600 transition shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-violet-400 font-mono font-semibold">{inv.sku}</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-semibold border",
                        inv.quantity > inv.minStock ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        inv.quantity > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {inv.quantity > inv.minStock ? `In Stock: ${inv.quantity} ${inv.unit}` :
                         inv.quantity > 0 ? `Low Stock: ${inv.quantity} ${inv.unit}` : 'Out of Stock'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{inv.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">{inv.description || 'No description provided.'}</p>
                  </div>
                  <div className="text-[11px] text-gray-500 border-t border-gray-800/80 pt-2 flex items-center justify-between">
                    <span>📍 {inv.location || 'Warehouse'}</span>
                    {hasRole(['ROOT', 'ADMIN', 'MANAGER']) ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMasterId(inv.id);
                            setMasterForm({
                              name: inv.name,
                              sku: inv.sku,
                              unit: inv.unit,
                              location: inv.location || 'Warehouse',
                              minStock: inv.minStock,
                              description: inv.description || ''
                            });
                            setShowEditMaster(true);
                          }}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                          title="Edit Master Data"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus master data barang "${inv.name}"? Tindakan ini tidak dapat dibatalkan!`)) {
                              deleteInventoryMaster(inv.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Hapus Master Data"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <span>Verifikasi: ✓ Verified</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Requests Tab View */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-fade-in">
          {/* Part Requests (Bon) Section */}
          <div id="part-requests-container">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              📦 Permintaan Bon Barang (Part Requests)
            </h2>
            <div className="space-y-3">
              {partRequests.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No part requests found.</p>
              ) : (
                partRequests.map(pr => {
                  const inv = inventories.find(i => i.id === pr.inventoryId);
                  const requester = users.find(u => u.id === pr.requestedBy);
                  const taskObj = pr.taskId ? useStore.getState().tasks.find(t => t.id === pr.taskId) : null;
                  const ticketObj = pr.ticketId ? useStore.getState().tickets.find(t => t.id === pr.ticketId) : null;
                  const isPending = pr.status === 'PENDING';
                  const canApprove = hasRole(['ROOT', 'ADMIN', 'MANAGER']);

                  return (
                    <div 
                      key={pr.id} 
                      className="rounded-xl border border-gray-700 bg-[#282c34] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{inv?.name || 'Unknown Item'}</span>
                          <span className="text-xs text-gray-400">({pr.quantity} pcs)</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                            pr.status === 'APPROVED' ? "bg-green-500/10 text-green-400" :
                            pr.status === 'REJECTED' ? "bg-red-500/10 text-red-400" :
                            "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {pr.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Reason: {pr.notes || 'No notes'}</p>
                        <p className="text-[10px] text-gray-500">
                          Requested by: <span className="text-gray-400">{requester?.name || pr.requestedBy}</span>
                          {taskObj && ` | Task: ${taskObj.title}`}
                          {ticketObj && ` | Ticket: ${ticketObj.title}`}
                          {!taskObj && !ticketObj && ` | Direct Request`}
                        </p>
                      </div>
                      {isPending && canApprove && (
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button
                            onClick={() => approvePartRequest(pr.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow font-semibold"
                          >
                            Approve & Deduct Stock
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Stock Requests (Purchase) Section */}
          <div id="stock-requests-container" className="border-t border-gray-800 pt-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              🛒 Pengajuan Pengadaan / Restock Barang (Stock Requests)
            </h2>
            <div className="space-y-3">
              {stockRequests.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No purchase or restock requests found.</p>
              ) : (
                stockRequests.map(sr => {
                  const requester = users.find(u => u.id === sr.requestedById);
                  const isPending = sr.status === 'PENDING';
                  const canApprove = hasRole(['ROOT', 'ADMIN', 'MANAGER']);

                  return (
                    <div 
                      key={sr.id} 
                      className="rounded-xl border border-gray-700 bg-[#282c34] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{sr.itemName}</span>
                          <span className="text-xs text-gray-400">({sr.quantity} pcs)</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                            sr.status === 'RECEIVED' ? "bg-green-500/10 text-green-400" :
                            sr.status === 'APPROVED' ? "bg-blue-500/10 text-blue-400" :
                            sr.status === 'REJECTED' ? "bg-red-500/10 text-red-400" :
                            "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {sr.status}
                          </span>
                          <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[9px] text-gray-400 uppercase font-semibold">
                            {sr.type}
                          </span>
                        </div>
                        {sr.itemDescription && <p className="text-xs text-gray-400">{sr.itemDescription}</p>}
                        <p className="text-xs text-gray-400">Reason: {sr.reason || 'No reason'}</p>
                        <p className="text-[10px] text-gray-500">
                          Requested by: <span className="text-gray-400">{requester?.name || sr.requestedById}</span> | Est. Price: {formatPrice(sr.estimatedPrice)}
                        </p>
                      </div>
                      {isPending && canApprove && (
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button
                            onClick={() => approveStockRequest(sr.id, 'APPROVED')}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors shadow font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => approveStockRequest(sr.id, 'REJECTED')}
                            className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 transition-colors shadow font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {sr.status === 'APPROVED' && canApprove && (
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button
                            onClick={() => approveStockRequest(sr.id, 'RECEIVED')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow font-semibold"
                          >
                            Mark Received (Update Inventory)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equipment Checkout Tab View */}
      {activeTab === 'checkout' && (
        <div className="animate-fade-in">
          <EquipmentCheckoutPage />
        </div>
      )}

      {/* Goods Receipt Tab View */}
      {activeTab === 'receipt' && (
        <div className="animate-fade-in">
          <GoodsReceiptPage />
        </div>
      )}

      {/* Add Asset Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-[#1e2028] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-white">Add New Asset</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Asset name *"
                className="col-span-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <SearchableDropdown
                options={brandOptions.map(b => ({ value: b, label: b }))}
                value={form.brand}
                onChange={val => setForm({ ...form, brand: val })}
                onAddNew={q => {
                  const n = q || window.prompt('Masukkan nama merek baru:') || '';
                  if (n.trim()) addMasterDataItem('BRAND', n.trim()).then(() => setForm({ ...form, brand: n.trim() })).catch(() => {});
                }}
                placeholder="Pilih merek..."
                searchPlaceholder="Cari merek..."
                addNewLabel="＋ Tambah Merek Baru"
              />
              <SearchableDropdown
                options={assetTypes.map(t => ({ value: t, label: t }))}
                value={form.type}
                onChange={val => setForm({ ...form, type: val })}
                onAddNew={q => {
                  const n = q || window.prompt('Masukkan tipe aset baru:') || '';
                  if (n.trim()) addMasterDataItem('ASSET_TYPE', n.trim()).then(() => setForm({ ...form, type: n.trim() })).catch(() => {});
                }}
                placeholder="Pilih tipe..."
                searchPlaceholder="Cari tipe..."
                addNewLabel="＋ Tambah Tipe Baru"
              />
              <div className="relative">
                <input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} placeholder="Serial Number"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800/50 pl-3 pr-9 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
                <button
                  type="button"
                  onClick={() => setScanTarget('form-sn')}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  title="Scan Serial Number"
                >
                  <Camera size={14} />
                </button>
              </div>
              <SearchableDropdown
                options={locationOptions.map(l => ({ value: l, label: l }))}
                value={form.location}
                onChange={val => setForm({ ...form, location: val })}
                onAddNew={q => {
                  const n = q || window.prompt('Masukkan lokasi baru:') || '';
                  if (n.trim()) addLocation(n.trim()).then(() => setForm({ ...form, location: n.trim() })).catch(() => {});
                }}
                placeholder="Pilih lokasi..."
                searchPlaceholder="Cari lokasi..."
                addNewLabel="＋ Tambah Lokasi Baru"
              />
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price" type="number"
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <SearchableDropdown
                options={vendorOptions.map(v => ({ value: v, label: v }))}
                value={form.vendor}
                onChange={val => setForm({ ...form, vendor: val })}
                onAddNew={q => {
                  const n = q || window.prompt('Masukkan vendor baru:') || '';
                  if (n.trim()) addMasterDataItem('VENDOR', n.trim()).then(() => setForm({ ...form, vendor: n.trim() })).catch(() => {});
                }}
                placeholder="Pilih vendor..."
                searchPlaceholder="Cari vendor..."
                addNewLabel="＋ Tambah Vendor Baru"
              />
            </div>
            <p className="mt-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Specifications (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.processor} onChange={e => setForm({ ...form, processor: e.target.value })} placeholder="Processor"
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <input value={form.ram} onChange={e => setForm({ ...form, ram: e.target.value })} placeholder="RAM"
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <input value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} placeholder="Storage"
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <input value={form.os} onChange={e => setForm({ ...form, os: e.target.value })} placeholder="OS"
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleCreate} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">Add Asset</button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setSelected(null); setShowAddSchedule(false); }} id="asset-detail-modal-overlay">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-700 bg-[#1e2028] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{selected.name}</h2>
              <button onClick={() => { setSelected(null); setShowAddSchedule(false); }} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            
            {/* Modal Tabs */}
            <div className="mb-4 flex gap-4 border-b border-gray-800 pb-px">
              <button
                onClick={() => setModalTab('specs')}
                className={cn(
                  "pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 px-1 -mb-px",
                  modalTab === 'specs'
                    ? "border-violet-500 text-violet-400 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                Specifications
              </button>
              <button
                onClick={() => setModalTab('maintenance')}
                className={cn(
                  "pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 px-1 -mb-px",
                  modalTab === 'maintenance'
                    ? "border-violet-500 text-violet-400 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
                id="asset-maintenance-tab-btn"
              >
                Maintenance
              </button>
              <button
                onClick={() => setModalTab('audit')}
                className={cn(
                  "pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 px-1 -mb-px",
                  modalTab === 'audit'
                    ? "border-violet-500 text-violet-400 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                Audit Trail
              </button>
              <button
                onClick={() => setModalTab('qr_label')}
                className={cn(
                  "pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 px-1 -mb-px asset-qr-tab-btn",
                  modalTab === 'qr_label'
                    ? "border-violet-500 text-violet-400 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                QR Label
              </button>
              <button
                onClick={() => setModalTab('depreciation')}
                className={cn(
                  "pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 px-1 -mb-px",
                  modalTab === 'depreciation'
                    ? "border-violet-500 text-violet-400 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                Depreciation (ISO 55001)
              </button>
            </div>

            {modalTab === 'specs' && (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-500">Brand:</span> <span className="text-gray-300">{selected.brand}</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="text-gray-300">{selected.type}</span></div>
                  <div><span className="text-gray-500">S/N:</span> <span className="text-gray-300">{selected.serialNumber}</span></div>
                  <div><span className="text-gray-500">Location:</span> <span className="text-gray-300">{selected.location}</span></div>
                  <div><span className="text-gray-500">Status:</span> <span className={statusConfig[selected.status].color}>{statusConfig[selected.status].label}</span></div>
                  <div><span className="text-gray-500">Price:</span> <span className="text-gray-300">{formatPrice(selected.price)}</span></div>
                  <div><span className="text-gray-500">Vendor:</span> <span className="text-gray-300">{selected.vendor}</span></div>
                  <div><span className="text-gray-500">Assigned To:</span> <span className="text-gray-300">{selected.assignedToId ? getUserById(selected.assignedToId)?.name : 'N/A'}</span></div>
                </div>
                {Object.keys(selected.specs).length > 0 && (
                  <div className="mt-3 rounded-lg bg-gray-800/30 p-3">
                    <p className="mb-2 text-xs font-medium text-gray-400">Specifications</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selected.specs.processor && <div><span className="text-gray-500">CPU:</span> <span className="text-gray-300">{selected.specs.processor}</span></div>}
                      {selected.specs.ram && <div><span className="text-gray-500">RAM:</span> <span className="text-gray-300">{selected.specs.ram}</span></div>}
                      {selected.specs.storage && <div><span className="text-gray-500">Storage:</span> <span className="text-gray-300">{selected.specs.storage}</span></div>}
                      {selected.specs.os && <div><span className="text-gray-500">OS:</span> <span className="text-gray-300">{selected.specs.os}</span></div>}
                      {selected.specs.ipAddress && <div><span className="text-gray-500">IP:</span> <span className="text-gray-300">{selected.specs.ipAddress}</span></div>}
                    </div>
                  </div>
                )}
              </>
            )}

            {modalTab === 'maintenance' && (
              <div className="space-y-4">
                {/* Header with Add Button */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Jadwal Perawatan (PM)</h3>
                  {canManage && (
                    <button
                      onClick={() => {
                        setShowAddSchedule(!showAddSchedule);
                        setScheduleForm({ title: '', description: '', frequency: 'WEEKLY', scheduledDate: new Date().toISOString().split('T')[0], checklistTemplateId: '' });
                      }}
                      className="flex items-center gap-1 rounded bg-violet-600/30 px-2 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-600/40 transition-colors"
                      id="add-pm-schedule-btn"
                    >
                      <Plus size={10} /> {showAddSchedule ? 'Batal' : 'Tambah Jadwal'}
                    </button>
                  )}
                </div>

                {/* Add Schedule Form */}
                {showAddSchedule && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-3">
                    <p className="text-[11px] font-semibold text-white">Buat Jadwal Baru</p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nama Pemeliharaan (misal: Bersihkan Kipas)"
                        value={scheduleForm.title}
                        onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                        className="w-full rounded border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500 font-medium"
                        id="pm-title-input"
                      />
                      <input
                        type="text"
                        placeholder="Deskripsi langkah (opsional)"
                        value={scheduleForm.description}
                        onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                        className="w-full rounded border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500 font-medium"
                      />
                      <div>
                        <label className="block text-[10px] text-gray-500 font-medium mb-1">Checklist Inspeksi (Terintegrasi)</label>
                        <select
                          value={scheduleForm.checklistTemplateId}
                          onChange={e => setScheduleForm({ ...scheduleForm, checklistTemplateId: e.target.value })}
                          className="w-full rounded border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500 font-medium"
                        >
                          <option value="">-- Tanpa Checklist Inspeksi --</option>
                          {checklistTemplates.map(tpl => (
                            <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 font-medium mb-1">Frekuensi</label>
                          <select
                            value={scheduleForm.frequency}
                            onChange={e => setScheduleForm({ ...scheduleForm, frequency: e.target.value as any })}
                            className="w-full rounded border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500 font-medium"
                            id="pm-frequency-select"
                          >
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 font-medium mb-1">Tanggal Mulai</label>
                          <input
                            type="date"
                            value={scheduleForm.scheduledDate}
                            onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                            className="w-full rounded border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500 font-medium"
                            id="pm-date-input"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          if (!scheduleForm.title.trim() || !scheduleForm.scheduledDate) return;
                          addMaintenanceSchedule({
                            assetId: selected.id,
                            title: scheduleForm.title.trim(),
                            description: scheduleForm.description || null,
                            frequency: scheduleForm.frequency,
                            scheduledDate: new Date(scheduleForm.scheduledDate).toISOString(),
                            isActive: true,
                            notifyDaysBefore: 7,
                            checklistTemplateId: scheduleForm.checklistTemplateId || null
                          });
                          setShowAddSchedule(false);
                        }}
                        className="rounded bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-500 transition shadow"
                        id="save-pm-schedule-btn"
                      >
                        Simpan Jadwal
                      </button>
                    </div>
                  </div>
                )}

                {/* Schedules List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(() => {
                    const schedules = maintenanceSchedules.filter(s => s.assetId === selected.id);
                    if (schedules.length === 0) {
                      return <p className="text-xs text-gray-500 italic text-center py-4">Belum ada jadwal pemeliharaan rutin untuk aset ini.</p>;
                    }
                    return schedules.map(s => (
                      <div key={s.id} className="rounded-lg border border-gray-850 bg-[#282c34]/50 p-3 flex items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-white">{s.title}</p>
                            <span className="rounded bg-gray-800 px-1 py-0.5 text-[9px] font-semibold text-violet-400 uppercase tracking-wider">{s.frequency}</span>
                            <span className={cn(
                              "rounded-full px-1.5 py-0.2 text-[8px] font-bold",
                              s.isActive ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-850 text-gray-400"
                            )}>
                              {s.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {s.description && <p className="text-[11px] text-gray-400">{s.description}</p>}
                          <div className="text-[10px] text-gray-500 space-y-0.5 pt-1">
                            <p>Jatuh Tempo: <span className="text-gray-300 font-medium">{new Date(s.scheduledDate).toLocaleDateString()}</span></p>
                            {s.lastPerformed && <p>Terakhir Dilakukan: <span className="text-gray-300 font-medium">{new Date(s.lastPerformed).toLocaleDateString()}</span></p>}
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateMaintenanceSchedule(s.id, { isActive: !s.isActive })}
                              className="text-[10px] rounded px-1.5 py-0.5 bg-gray-850 hover:bg-gray-800 text-gray-300 transition"
                            >
                              {s.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => deleteMaintenanceSchedule(s.id)}
                              className="text-[10px] rounded px-1.5 py-0.5 bg-red-950 hover:bg-red-900 text-red-400 transition"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {modalTab === 'audit' && (
              <div className="max-h-60 overflow-y-auto space-y-4 pr-1">
                {(() => {
                  const assetCheckouts = equipmentCheckouts.filter(c =>
                    c.items?.some(item => item.assetId === selected.id)
                  );
                  if (assetCheckouts.length === 0) {
                    return <p className="text-xs text-gray-500 italic">No audit logs found for this asset.</p>;
                  }
                  return (
                    <div className="relative border-l border-gray-800 pl-4 ml-2 space-y-4">
                      {assetCheckouts.map(c => {
                        const item = c.items?.find(i => i.assetId === selected.id);
                        const tech = getUserById(c.technicianId);
                        const isReturned = c.status === 'RETURNED' || item?.scannedIn;
                        return (
                          <div key={c.id} className="relative">
                            {/* Timeline dot */}
                            <div className={cn(
                              "absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-[#1e2028]",
                              isReturned ? "bg-green-500" : "bg-blue-500"
                            )} />
                            <div className="text-xs">
                              <div className="flex justify-between text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">
                                <span>{c.checkoutNumber}</span>
                                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-white font-medium">Checked out by <span className="text-violet-400">{tech?.name || c.technicianId}</span></p>
                              <p className="text-gray-400 mt-0.5"><span className="text-gray-500">Purpose:</span> {c.purpose}</p>
                              <p className="text-gray-400"><span className="text-gray-500">Expected Return:</span> {new Date(c.expectedReturn).toLocaleDateString()}</p>
                              
                              {item?.scannedIn ? (
                                <div className="mt-1 bg-green-500/10 border border-green-500/20 rounded p-1.5 text-[11px] text-green-400">
                                  <p className="font-semibold font-mono">Returned on {item.scannedInAt ? new Date(item.scannedInAt).toLocaleDateString() : 'N/A'}</p>
                                  <p><span className="text-gray-400">Condition:</span> <span className="font-medium">{item.conditionIn || 'GOOD'}</span></p>
                                  {item.damageNotes && <p><span className="text-gray-400">Damage Notes:</span> {item.damageNotes}</p>}
                                </div>
                              ) : (
                                <div className="mt-1 bg-blue-500/10 border border-blue-500/20 rounded p-1.5 text-[11px] text-blue-400 flex items-center justify-between">
                                  <span>Not returned yet ({c.status})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {modalTab === 'qr_label' && (
              <div className="flex flex-col items-center justify-center p-4 bg-gray-900/40 rounded-xl border border-gray-800 space-y-4">
                <p className="text-xs text-gray-400 text-center font-medium">Pratinjau Stiker Label Thermal Aset</p>
                
                <div className="label-sticker-preview w-64 h-36 border border-gray-600 bg-white rounded-md p-3 text-black flex flex-col justify-between shadow-lg font-sans">
                  <div className="text-[9px] font-black text-center border-b border-black pb-1 uppercase tracking-wider">
                    CLICKHUB IT ASSET
                  </div>
                  <div className="flex flex-1 mt-1.5 gap-2 min-h-0">
                    <div className="flex-1 flex flex-col justify-between text-left min-w-0">
                      <div className="text-[10px] font-bold truncate leading-tight">{selected.name}</div>
                      <div className="text-[8px] text-gray-800 leading-tight">Brand: {selected.brand || '-'}</div>
                      <div className="text-[8px] font-mono font-bold leading-tight">S/N: {selected.serialNumber}</div>
                      <div className="text-[8px] text-gray-800 leading-tight font-medium">Loc: {selected.location}</div>
                      <div className="text-[8px] text-gray-800 leading-tight">Status: {selected.status}</div>
                    </div>
                    <div className="w-16 h-16 flex items-center justify-center self-center shrink-0 border border-gray-200">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selected.serialNumber)}`} 
                        alt="QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full justify-center">
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (!printWindow) {
                        alert('Pop-up blocked! Please allow pop-ups to print labels.');
                        return;
                      }
                      const qrData = encodeURIComponent(selected.serialNumber);
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
                      const labelHtml = `
                        <div class="label-card" style="width: 260px; height: 140px; border: 2px solid #000; border-radius: 6px; padding: 8px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #fff; page-break-inside: avoid;">
                          <div class="label-header" style="font-size: 10px; font-weight: 800; text-align: center; border-bottom: 1px solid #000; padding-bottom: 3px; letter-spacing: 1px;">CLICKHUB IT ASSET</div>
                          <div class="label-body" style="display: flex; flex: 1; margin-top: 6px; gap: 8px; min-height: 0;">
                            <div class="label-info" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;">
                              <div class="asset-name" style="font-size: 11px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${selected.name}</div>
                              <div class="info-row" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Brand: ${selected.brand || '-'}</div>
                              <div class="info-row font-mono" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: Courier, monospace;">S/N: ${selected.serialNumber}</div>
                              <div class="info-row" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Loc: ${selected.location}</div>
                              <div class="info-row" style="font-size: 9px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Status: ${selected.status}</div>
                            </div>
                            <div class="label-qr" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; align-self: center;">
                              <img src="${qrUrl}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" onload="window.checkImagesLoaded()" />
                            </div>
                          </div>
                        </div>
                      `;
                      
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print Asset Label</title>
                            <style>
                              @page {
                                size: auto;
                                margin: 0mm;
                              }
                              body {
                                margin: 0;
                                padding: 10px;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                background: #fff;
                                color: #000;
                              }
                              .label-card {
                                margin: 0 auto;
                              }
                              @media print {
                                body {
                                  padding: 0;
                                }
                              }
                            </style>
                            <script>
                              window.checkImagesLoaded = function() {
                                setTimeout(function() {
                                  window.print();
                                  window.close();
                                }, 500);
                              };
                            </script>
                          </head>
                          <body>
                            ${labelHtml}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }}
                    className="rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow flex items-center gap-1.5 btn-print-single-qr"
                  >
                    <span>🖨️ Print Label</span>
                  </button>
                </div>
              </div>
            )}

            {modalTab === 'depreciation' && (() => {
              const initialPrice = selected.price || 0;
              const purchaseDate = selected.purchaseDate ? new Date(selected.purchaseDate) : null;
              const now = new Date();
              let ageYears = 0;
              if (purchaseDate) {
                ageYears = Math.max(0, (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
              }
              const rate = 0.20;
              const linearCurrentValue = Math.max(0, initialPrice * (1 - ageYears * rate));
              
              return (
                <div className="space-y-4 p-4 bg-gray-900/40 rounded-xl border border-gray-800 text-left">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Asset Depreciation & ISO 55001 Value Tracking</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold border border-violet-500/20">ISO 55001 Compliance</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1e222b] p-3 rounded-lg border border-gray-850">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Acquisition Price (Harga Awal)</span>
                      <span className="text-lg font-black text-white">{formatPrice(initialPrice)}</span>
                    </div>
                    <div className="bg-[#1e222b] p-3 rounded-lg border border-gray-850">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Acquisition Date (Tanggal Perolehan)</span>
                      <span className="text-sm font-semibold text-gray-300">
                        {purchaseDate ? purchaseDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1e222b] p-3 rounded-lg border border-gray-850">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Asset Age (Umur Aset)</span>
                      <span className="text-lg font-black text-violet-450">{ageYears.toFixed(1)} <span className="text-xs text-gray-500 font-bold">Years</span></span>
                    </div>
                    <div className="bg-[#1e222b] p-3 rounded-lg border border-gray-850">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Estimated Current Value (Nilai Buku Saat Ini)</span>
                      <span className="text-lg font-black text-emerald-400">{formatPrice(linearCurrentValue)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-950/20 p-3 rounded-lg border border-gray-850/50 space-y-2 text-[11px] text-gray-400">
                    <div className="flex justify-between">
                      <span>Standard Annual Rate:</span>
                      <span className="font-bold text-white">20.0% (Linear/Straight Line)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accumulated Depreciation:</span>
                      <span className="font-bold text-rose-400">{formatPrice(Math.max(0, initialPrice - linearCurrentValue))}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-800/80 pt-1.5 mt-1.5">
                      <span>Depreciation Method:</span>
                      <span className="font-medium text-gray-450">Straight Line Method (SLM)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {canManage && (
              <div className="mt-4 flex justify-between gap-2">
                <div className="flex gap-2">
                  <select value={selected.status} onChange={e => { updateAsset(selected.id, { status: e.target.value as AssetStatus }); setSelected({ ...selected, status: e.target.value as AssetStatus }); }}
                    className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none">
                    {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select
                    value={selected.location || ''}
                    onChange={async (e) => {
                      const newLoc = e.target.value;
                      if (newLoc === selected.location) return;
                      const reason = prompt('Masukkan alasan pemindahan lokasi aset:');
                      if (reason !== null) {
                        try {
                          await updateAsset(selected.id, { 
                            location: newLoc,
                            _relocationReason: reason.trim() || 'Location updated'
                          } as any);
                          setSelected({ ...selected, location: newLoc });
                          toast.success(`Aset berhasil dipindahkan ke "${newLoc}"`);
                        } catch (err) {
                          toast.error('Gagal memindahkan lokasi aset');
                        }
                      }
                    }}
                    className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Pilih lokasi...</option>
                    {locationOptions.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <button onClick={() => handlePrintLabels([selected])}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow cursor-pointer">
                    Print Label
                  </button>
                </div>
                <button onClick={() => { deleteAsset(selected.id); setSelected(null); }}
                  className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/30 cursor-pointer">Delete</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct Bon Modal */}
      {showDirectBon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDirectBon(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#1e2028] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Direct Bon Request</h2>
              <button onClick={() => setShowDirectBon(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Select Part/Item</label>
                <select 
                  value={directBonForm.inventoryId}
                  onChange={e => setDirectBonForm({ ...directBonForm, inventoryId: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 font-medium"
                >
                  <option value="">Select Part...</option>
                  {inventories.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (Stock: {inv.quantity} {inv.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Qty</label>
                  <input 
                    type="number" 
                    min="1"
                    value={directBonForm.quantity}
                    onChange={e => setDirectBonForm({ ...directBonForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Notes / Usage</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Server Room D"
                    value={directBonForm.notes}
                    onChange={e => setDirectBonForm({ ...directBonForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowDirectBon(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleDirectBon} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow">Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Request Modal */}
      {showStockRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowStockRequest(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-[#1e2028] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Purchase / Restock Request</h2>
              <button onClick={() => setShowStockRequest(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Request Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="stockType"
                      checked={stockForm.type === 'RESTOCK'}
                      onChange={() => setStockForm({ ...stockForm, type: 'RESTOCK' })}
                      className="accent-violet-600"
                    />
                    Restock Existing Item
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="stockType"
                      checked={stockForm.type === 'NEW_ITEM'}
                      onChange={() => setStockForm({ ...stockForm, type: 'NEW_ITEM' })}
                      className="accent-violet-600"
                    />
                    Request New Item
                  </label>
                </div>
              </div>

              {stockForm.type === 'RESTOCK' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Select Item to Restock</label>
                  <select 
                    value={stockForm.inventoryId}
                    onChange={e => setStockForm({ ...stockForm, inventoryId: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 font-medium"
                  >
                    <option value="">Select Item...</option>
                    {inventories.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Current Stock: {inv.quantity})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cat6 LAN Cable 300m"
                      value={stockForm.itemName}
                      onChange={e => setStockForm({ ...stockForm, itemName: e.target.value })}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cables"
                      value={stockForm.category}
                      onChange={e => setStockForm({ ...stockForm, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Description</label>
                    <input 
                      type="text" 
                      placeholder="Specs, links, etc."
                      value={stockForm.itemDescription}
                      onChange={e => setStockForm({ ...stockForm, itemDescription: e.target.value })}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Quantity Requested</label>
                  <input 
                    type="number" 
                    min="1"
                    value={stockForm.quantity}
                    onChange={e => setStockForm({ ...stockForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Estimated Price (IDR)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500000"
                    value={stockForm.estimatedPrice}
                    onChange={e => setStockForm({ ...stockForm, estimatedPrice: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Reason for Request</label>
                <textarea 
                  placeholder="Why do we need this item/restock?"
                  rows={2}
                  value={stockForm.reason}
                  onChange={e => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowStockRequest(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleStockRequest} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors shadow">Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IT Configurations Directory Tab View */}
      {activeTab === 'configs' && (
        <div className="rounded-xl border border-gray-800 bg-[#282c34] p-5 shadow-sm animate-fade-in text-left">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-2 w-full justify-between items-center">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2 text-gray-500" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Cari konfigurasi..."
                  className="rounded-lg border border-gray-750 bg-gray-800 px-3 py-1.5 pl-8 text-xs text-white placeholder-gray-505 outline-none focus:border-violet-500 w-48" 
                />
              </div>
              <button 
                onClick={() => setShowCreateConfig(true)}
                className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition shadow"
              >
                <Plus size={12} /> Tambah Data
              </button>
            </div>
          </div>

          {/* Category/Golongan Filters */}
          <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-800 pb-3">
            <button 
              onClick={() => setSelectedCategoryFilter('all')}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium border transition-colors",
                selectedCategoryFilter === 'all'
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-gray-800/40 border-gray-700 text-gray-400 hover:text-white"
              )}
            >
              📂 Semua Golongan
            </button>
            {categories.map(cat => {
              const isAdmin = hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']);
              return (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-medium border transition-colors flex items-center gap-1.5",
                    selectedCategoryFilter === cat
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-gray-800/40 border-gray-700 text-gray-400 hover:text-white"
                  )}
                >
                  <span>{cat}</span>
                  {isAdmin && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat);
                      }}
                      className="text-[10px] text-gray-400 hover:text-red-400 font-bold px-1 py-0.5 hover:bg-gray-800 rounded transition ml-1 cursor-pointer"
                      title={`Hapus Golongan ${cat}`}
                    >
                      ×
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Create Config Popup */}
          {showCreateConfig && (
            <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/30 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">Tambah Konfigurasi Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400">Nama Konfigurasi / Target</label>
                  <input 
                    type="text" 
                    value={newConfig.name} 
                    onChange={e => setNewConfig({ ...newConfig, name: e.target.value })}
                    placeholder="Contoh: Proxmox Host ERP"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400">Tipe Konfigurasi</label>
                  <select 
                    value={newConfig.type} 
                    onChange={e => setNewConfig({ ...newConfig, type: e.target.value as any })}
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <optgroup label="🖥️ Compute & Virtualization" className="bg-gray-800 text-gray-400 font-semibold">
                      <option value="SERVER_PHYSICAL" className="text-white">🖥️ Server Fisik / Host</option>
                      <option value="SERVER_VM" className="text-white">⚡ Virtual Machine</option>
                      <option value="CONTAINER_POD" className="text-white">📦 Container / Pod</option>
                    </optgroup>
                    <optgroup label="🌐 Networking & IP Management" className="bg-gray-800 text-gray-400 font-semibold">
                      <option value="NET_DEVICE" className="text-white">🔌 Perangkat Jaringan (Switch/Router)</option>
                      <option value="NET_SUBNET" className="text-white">🌐 IP Subnet / VLAN</option>
                      <option value="NET_ROUTING" className="text-white">↗️ Routing & VPN Tunnel</option>
                      <option value="NET_DNS_DOMAIN" className="text-white">📛 Domain & DNS Record</option>
                    </optgroup>
                    <optgroup label="🗄️ Data & Storage" className="bg-gray-800 text-gray-400 font-semibold">
                      <option value="DATABASE_INSTANCE" className="text-white">🗄️ Basis Data / DB Instance</option>
                      <option value="STORAGE_VOLUME" className="text-white">💾 NAS / SAN Storage</option>
                    </optgroup>
                    <optgroup label="🔗 Software & Services" className="bg-gray-800 text-gray-400 font-semibold">
                      <option value="SERVICE_ENDPOINT" className="text-white">🔗 API / Web Service Endpoint</option>
                      <option value="INTEGRATION_QUEUE" className="text-white">✉️ Message Queue</option>
                    </optgroup>
                    <optgroup label="🔒 Security & Credentials" className="bg-gray-800 text-gray-400 font-semibold">
                      <option value="CRED_CERTIFICATE" className="text-white">🔒 Sertifikat SSL / TLS</option>
                      <option value="CRED_ACCOUNT" className="text-white">🔑 Akun / API Key / Token</option>
                      <option value="CRED_LICENSE" className="text-white">🎫 Lisensi Perangkat Lunak</option>
                    </optgroup>
                    <optgroup label="📞 Telephony & Operations" className="bg-gray-800 text-gray-400 font-semibold">
                      <option value="TELEPHONY_SIP" className="text-white">📞 PABX / VoIP / SIP Trunk</option>
                      <option value="OPERATIONS_CONTACT" className="text-white">🚨 Emergency Contact / Vendor PIC</option>
                      <option value="OFFICE_ENDPOINT" className="text-white">🖨️ Office Shared Device (Printer/CCTV)</option>
                    </optgroup>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400">Golongan (Group)</label>
                  <select 
                    value={isCustomCategory ? "CUSTOM" : newConfig.category} 
                    onChange={e => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setNewConfig({ ...newConfig, category: e.target.value });
                      }
                    }}
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="CUSTOM">➕ Buat Golongan Baru...</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400">Hubungkan Aset Fisik (Opsional)</label>
                  <select 
                    value={newConfig.linkedAssetId} 
                    onChange={e => setNewConfig({ ...newConfig, linkedAssetId: e.target.value })}
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="">Tidak terhubung ke aset</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.brand} {a.name} ({a.serialNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              {isCustomCategory && (
                <div className="flex flex-col gap-1 max-w-sm">
                  <label className="text-[10px] text-violet-400 font-bold">Nama Golongan Baru</label>
                  <input 
                    type="text" 
                    value={customCategoryInput} 
                    onChange={e => setCustomCategoryInput(e.target.value)}
                    placeholder="Contoh: Telepon Ekstensi"
                    className="rounded-lg border border-violet-500/50 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500" 
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400">Nilai Konfigurasi (Value)</label>
                  <input 
                    type="text" 
                    value={newConfig.value} 
                    onChange={e => setNewConfig({ ...newConfig, value: e.target.value })}
                    placeholder="Contoh: IP: 192.168.10.15 | Port: 22 | User: root"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400">Catatan / Detail Tambahan</label>
                  <input 
                    type="text" 
                    value={newConfig.notes} 
                    onChange={e => setNewConfig({ ...newConfig, notes: e.target.value })}
                    placeholder="Catatan tambahan di lapangan..."
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => { setShowCreateConfig(false); setIsCustomCategory(false); }} className="rounded px-3 py-1.5 text-xs text-gray-400 hover:text-white">Batal</button>
                <button onClick={handleCreateConfig} className="rounded bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition">Simpan Konfigurasi</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-700/50 bg-[#1e2028]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/60 uppercase tracking-wider text-gray-500 font-semibold text-[10px]">
                  <th className="px-4 py-3">Nama Konfigurasi</th>
                  <th className="px-4 py-3">Golongan / Grup</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Rincian / Value</th>
                  <th className="px-4 py-3">Terkait Aset Fisik</th>
                  <th className="px-4 py-3">Catatan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">Data konfigurasi tidak ditemukan.</td>
                  </tr>
                ) : (
                   filteredConfigs.map(c => {
                    const typeBadge: Record<ConfigType, string> = {
                      SERVER_PHYSICAL: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                      SERVER_VM: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                      CONTAINER_POD: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                      NET_DEVICE: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                      NET_SUBNET: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                      NET_ROUTING: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                      NET_DNS_DOMAIN: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                      DATABASE_INSTANCE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      STORAGE_VOLUME: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      SERVICE_ENDPOINT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      INTEGRATION_QUEUE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      CRED_CERTIFICATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      CRED_ACCOUNT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      CRED_LICENSE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      TELEPHONY_SIP: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                      OPERATIONS_CONTACT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                      OFFICE_ENDPOINT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    };

                    const typeLabel: Record<ConfigType, string> = {
                      SERVER_PHYSICAL: 'Physical Server',
                      SERVER_VM: 'Virtual Machine',
                      CONTAINER_POD: 'Container / Pod',
                      NET_DEVICE: 'Network Device',
                      NET_SUBNET: 'Subnet / VLAN',
                      NET_ROUTING: 'Routing & VPN',
                      NET_DNS_DOMAIN: 'Domain / DNS',
                      DATABASE_INSTANCE: 'Database Instance',
                      STORAGE_VOLUME: 'NAS / SAN Storage',
                      SERVICE_ENDPOINT: 'API / Web Service',
                      INTEGRATION_QUEUE: 'Message Queue',
                      CRED_CERTIFICATE: 'SSL Certificate',
                      CRED_ACCOUNT: 'Account / Token',
                      CRED_LICENSE: 'Software License',
                      TELEPHONY_SIP: 'PABX / VoIP',
                      OPERATIONS_CONTACT: 'Emergency Contact',
                      OFFICE_ENDPOINT: 'Office Endpoint',
                    };

                    const typeIcon: Record<ConfigType, React.ReactNode> = {
                      SERVER_PHYSICAL: <Server size={11} className="inline mr-1 text-indigo-400" />,
                      SERVER_VM: <Cpu size={11} className="inline mr-1 text-indigo-400" />,
                      CONTAINER_POD: <Box size={11} className="inline mr-1 text-indigo-400" />,
                      NET_DEVICE: <Network size={11} className="inline mr-1 text-sky-400" />,
                      NET_SUBNET: <Layers size={11} className="inline mr-1 text-sky-400" />,
                      NET_ROUTING: <GitFork size={11} className="inline mr-1 text-sky-400" />,
                      NET_DNS_DOMAIN: <Globe size={11} className="inline mr-1 text-sky-400" />,
                      DATABASE_INSTANCE: <Database size={11} className="inline mr-1 text-blue-400" />,
                      STORAGE_VOLUME: <HardDrive size={11} className="inline mr-1 text-blue-400" />,
                      SERVICE_ENDPOINT: <Webhook size={11} className="inline mr-1 text-emerald-400" />,
                      INTEGRATION_QUEUE: <MessageSquare size={11} className="inline mr-1 text-emerald-400" />,
                      CRED_CERTIFICATE: <ShieldAlert size={11} className="inline mr-1 text-amber-400" />,
                      CRED_ACCOUNT: <Key size={11} className="inline mr-1 text-amber-400" />,
                      CRED_LICENSE: <FileCheck size={11} className="inline mr-1 text-amber-400" />,
                      TELEPHONY_SIP: <Phone size={11} className="inline mr-1 text-rose-400" />,
                      OPERATIONS_CONTACT: <PhoneCall size={11} className="inline mr-1 text-rose-400" />,
                      OFFICE_ENDPOINT: <Printer size={11} className="inline mr-1 text-rose-400" />,
                    };

                    const linkedAsset = c.linkedAssetId ? assets.find(a => a.id === c.linkedAssetId) : null;
                    return (
                      <tr key={c.id} className={cn("border-b border-gray-800 hover:bg-gray-800/20", c.isDeleteRequested && "bg-yellow-950/10 border-yellow-950/30")}>
                        <td className="px-4 py-3 font-semibold text-white">
                          <div className="flex flex-col">
                            <span>{c.name}</span>
                            {c.isDeleteRequested && (
                              <span className="text-[9px] text-yellow-500 font-medium animate-pulse mt-0.5">
                                ⚠️ Tunggu Persetujuan Hapus
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-gray-800 px-2 py-0.5 text-[9px] font-semibold text-gray-300 border border-gray-700">
                            {c.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-[9px] font-semibold flex items-center w-fit gap-0.5", typeBadge[c.type])}>
                            {typeIcon[c.type]}
                            {typeLabel[c.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-300 select-all">{c.value}</td>
                        <td className="px-4 py-3">
                          {linkedAsset ? (
                            <span className="text-violet-400 font-medium">{linkedAsset.brand} {linkedAsset.name} ({linkedAsset.serialNumber})</span>
                          ) : (
                            <span className="text-gray-600 italic">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 italic">{c.notes || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {c.isDeleteRequested ? (
                            hasRole(['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER']) ? (
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleApproveDelete(c.id)}
                                  className="rounded bg-green-950/40 px-2.5 py-1 text-green-400 hover:bg-green-900/40 hover:text-green-300 transition-colors text-[10px] font-bold border border-green-800/30 shadow-sm"
                                  title="Setujui Hapus Permanen"
                                >
                                  ✓ Setujui
                                </button>
                                <button 
                                  onClick={() => handleRejectDelete(c.id)}
                                  className="rounded bg-gray-800 px-2.5 py-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-[10px] border border-gray-700 shadow-sm"
                                  title="Batal / Tolak Hapus"
                                >
                                  × Batal
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9px] text-gray-500 font-semibold italic bg-gray-800/40 px-2 py-1 rounded border border-gray-700">
                                Pending Approval
                              </span>
                            )
                          ) : (
                            <button 
                              onClick={() => handleDeleteConfig(c.id)}
                              className="rounded bg-red-950/20 p-1.5 text-red-400 hover:text-red-300 transition-colors"
                              title="Hapus Konfigurasi"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab View */}
      {activeTab === 'audit' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-150 flex items-center gap-2">
                <ShieldCheck className="text-violet-500" size={22} />
                Audit Trail & ISO 27001 Compliance
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Security event logging and configuration changes tracker for regulatory compliance.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ISO 27001 Compliant
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#1e222b] p-4 rounded-xl border border-gray-800 shadow-md">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search action or details..."
                className="w-full bg-[#282c34] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Filter User */}
            <div>
              <select
                value={auditUserFilter}
                onChange={e => setAuditUserFilter(e.target.value)}
                className="w-full bg-[#282c34] border border-gray-700 rounded-lg py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
                <option value="system">System</option>
              </select>
            </div>

            {/* Filter Action */}
            <div>
              <select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                className="w-full bg-[#282c34] border border-gray-700 rounded-lg py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Actions</option>
                {Array.from(new Set(auditLogs.map(l => l.action))).map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            {/* Filter Date Range */}
            <div className="flex gap-2">
              <select
                value={auditDateRange}
                onChange={e => setAuditDateRange(e.target.value as any)}
                className="flex-1 bg-[#282c34] border border-gray-700 rounded-lg py-2 px-3 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              {(auditSearch || auditUserFilter !== 'all' || auditActionFilter !== 'all' || auditDateRange !== 'all') && (
                <button
                  onClick={() => {
                    setAuditSearch('');
                    setAuditUserFilter('all');
                    setAuditActionFilter('all');
                    setAuditDateRange('all');
                  }}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                  title="Reset Filters"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-xl border border-gray-800 bg-[#282c34] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 text-gray-400 font-bold border-b border-gray-800">
                    <th className="px-5 py-4 w-48">Timestamp</th>
                    <th className="px-5 py-4 w-48">User</th>
                    <th className="px-5 py-4 w-60">Action</th>
                    <th className="px-5 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map(log => {
                      const user = log.userId === 'system' ? { name: 'System', role: 'SYSTEM' } : users.find(u => u.id === log.userId);
                      const actionColor = log.action.includes('ALERT') || log.action.includes('DELETE') || log.action.includes('REJECT')
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : log.action.includes('CREATE') || log.action.includes('VERIFIED') || log.action.includes('APPROVE')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : log.action.includes('UPDATE')
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-violet-500/10 text-violet-400 border border-violet-500/20';

                      return (
                        <tr key={log.id} className="hover:bg-gray-900/10 transition-colors">
                          <td className="px-5 py-4 font-mono text-[11px] text-gray-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-200">{user?.name || 'Unknown User'}</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wide">{user?.role || 'USER'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase font-mono", actionColor)}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-300 font-medium">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-gray-500">
                        No audit logs matching the current criteria were found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Master Inventory */}
      {showAddMaster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#1e222b] p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
              <h3 className="text-sm font-bold text-white">Register New Master Item</h3>
              <button onClick={() => setShowAddMaster(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await addInventoryMaster(masterForm);
              setShowAddMaster(false);
            }} className="space-y-4 text-xs text-gray-300">
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-2">Item Name</label>
                <input required type="text" value={masterForm.name} onChange={e => setMasterForm({...masterForm, name: e.target.value})} placeholder="e.g. Cisco Switch 2960" className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">SKU (Barcode/Label)</label>
                  <input required type="text" value={masterForm.sku} onChange={e => setMasterForm({...masterForm, sku: e.target.value})} placeholder="e.g. CS-2960-24" className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">Unit (Satuan)</label>
                  <SearchableDropdown
                    options={unitOptions.map(u => ({ value: u, label: u }))}
                    value={masterForm.unit}
                    onChange={val => setMasterForm({...masterForm, unit: val})}
                    onAddNew={q => {
                      const n = q || window.prompt('Masukkan satuan baru:') || '';
                      if (n.trim()) addMasterDataItem('UNIT', n.trim()).then(() => setMasterForm({...masterForm, unit: n.trim()})).catch(() => {});
                    }}
                    placeholder="Pilih satuan..."
                    searchPlaceholder="Cari satuan..."
                    addNewLabel="＋ Tambah Satuan Baru"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">Location</label>
                  <SearchableDropdown
                    options={locationOptions.map(l => ({ value: l, label: l }))}
                    value={masterForm.location}
                    onChange={val => setMasterForm({...masterForm, location: val})}
                    onAddNew={q => {
                      const n = q || window.prompt('Masukkan lokasi baru:') || '';
                      if (n.trim()) addLocation(n.trim()).then(() => setMasterForm({...masterForm, location: n.trim()})).catch(() => {});
                    }}
                    placeholder="Pilih lokasi..."
                    searchPlaceholder="Cari lokasi..."
                    addNewLabel="＋ Tambah Lokasi Baru"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">Min Stock</label>
                  <input required type="number" min={1} value={masterForm.minStock} onChange={e => setMasterForm({...masterForm, minStock: parseInt(e.target.value) || 5})} className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-2">Description</label>
                <textarea rows={2} value={masterForm.description} onChange={e => setMasterForm({...masterForm, description: e.target.value})} placeholder="Specs, models, details..." className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-800/80 pt-4">
                <button type="button" onClick={() => setShowAddMaster(false)} className="rounded-lg bg-gray-950 border border-gray-800 px-4 py-2 text-gray-400 font-bold">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white font-bold hover:bg-blue-500">Register Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Master Inventory */}
      {showEditMaster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#1e222b] p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
              <h3 className="text-sm font-bold text-white">Edit Master Item</h3>
              <button onClick={() => setShowEditMaster(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (selectedMasterId) {
                await updateInventoryMaster(selectedMasterId, masterForm);
              }
              setShowEditMaster(false);
            }} className="space-y-4 text-xs text-gray-300">
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-2">Item Name</label>
                <input required type="text" value={masterForm.name} onChange={e => setMasterForm({...masterForm, name: e.target.value})} className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">SKU (Barcode/Label)</label>
                  <input required type="text" value={masterForm.sku} onChange={e => setMasterForm({...masterForm, sku: e.target.value})} className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">Unit (Satuan)</label>
                  <SearchableDropdown
                    options={unitOptions.map(u => ({ value: u, label: u }))}
                    value={masterForm.unit}
                    onChange={val => setMasterForm({...masterForm, unit: val})}
                    onAddNew={q => {
                      const n = q || window.prompt('Masukkan satuan baru:') || '';
                      if (n.trim()) addMasterDataItem('UNIT', n.trim()).then(() => setMasterForm({...masterForm, unit: n.trim()})).catch(() => {});
                    }}
                    placeholder="Pilih satuan..."
                    searchPlaceholder="Cari satuan..."
                    addNewLabel="＋ Tambah Satuan Baru"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">Location</label>
                  <SearchableDropdown
                    options={locationOptions.map(l => ({ value: l, label: l }))}
                    value={masterForm.location}
                    onChange={val => setMasterForm({...masterForm, location: val})}
                    onAddNew={q => {
                      const n = q || window.prompt('Masukkan lokasi baru:') || '';
                      if (n.trim()) addLocation(n.trim()).then(() => setMasterForm({...masterForm, location: n.trim()})).catch(() => {});
                    }}
                    placeholder="Pilih lokasi..."
                    searchPlaceholder="Cari lokasi..."
                    addNewLabel="＋ Tambah Lokasi Baru"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-2">Min Stock</label>
                  <input required type="number" min={1} value={masterForm.minStock} onChange={e => setMasterForm({...masterForm, minStock: parseInt(e.target.value) || 5})} className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-2">Description</label>
                <textarea rows={2} value={masterForm.description} onChange={e => setMasterForm({...masterForm, description: e.target.value})} className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-white outline-none focus:border-violet-500" />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-800/80 pt-4">
                <button type="button" onClick={() => setShowEditMaster(false)} className="rounded-lg bg-gray-950 border border-gray-800 px-4 py-2 text-gray-400 font-bold">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white font-bold hover:bg-blue-500">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scanTarget && (
        <BarcodeScannerModal
          isOpen={!!scanTarget}
          onClose={() => setScanTarget(null)}
          onScan={(code) => {
            if (scanTarget === 'assets-search' || scanTarget === 'inventory-search') {
              setSearch(code);
            } else if (scanTarget === 'form-sn') {
              setForm(f => ({ ...f, serialNumber: code }));
            }
            setScanTarget(null);
          }}
          title={
            scanTarget === 'form-sn'
              ? "Scan Serial Number Aset"
              : scanTarget === 'assets-search'
              ? "Scan Serial Number untuk Cari"
              : "Scan SKU Barang untuk Cari"
          }
        />
      )}
    </div>
  );
}
