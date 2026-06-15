import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { 
  FileText, Download, BarChart2, Briefcase, 
  Layers, Package, Calendar, Database 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const { 
    tasks, 
    tickets, 
    assets, 
    inventories, 
    chatSessions,
    currentUser,
    addAuditLog,
    getUserById
  } = useStore();

  const [activeTab, setActiveTab] = useState<'kpi' | 'capex' | 'assets' | 'tickets' | 'inventory'>('kpi');
  
  // Date filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Date filtering logic
  const filteredTasks = tasks.filter(t => {
    if (!t.createdAt) return true;
    const createdDate = new Date(t.createdAt);
    if (startDate && createdDate < new Date(startDate)) return false;
    if (endDate && createdDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const filteredTickets = tickets.filter(t => {
    if (!t.createdAt) return true;
    const createdDate = new Date(t.createdAt);
    if (startDate && createdDate < new Date(startDate)) return false;
    if (endDate && createdDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const filteredAssets = assets.filter(a => {
    if (!a.createdAt) return true;
    const createdDate = new Date(a.createdAt);
    if (startDate && createdDate < new Date(startDate)) return false;
    if (endDate && createdDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const filteredInventories = inventories.filter(i => {
    if (!i.createdAt) return true;
    const createdDate = new Date(i.createdAt);
    if (startDate && createdDate < new Date(startDate)) return false;
    if (endDate && createdDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const filteredChatSessions = chatSessions.filter(s => {
    if (!s.createdAt) return true;
    const createdDate = new Date(s.createdAt);
    if (startDate && createdDate < new Date(startDate)) return false;
    if (endDate && createdDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const getAssetDepreciation = (asset: any) => {
    if (!asset.purchaseDate || !asset.price) return { age: 0, currentValue: 0, status: 'Optimal' as const };
    
    const now = new Date();
    const purchaseDate = new Date(asset.purchaseDate);
    const age = Math.max(0, (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    
    const usefulLife = 5; // 5 years
    const currentValue = Math.max(0, asset.price * (1 - age / usefulLife));
    
    let status: 'Optimal' | 'Monitoring' | 'Replacement Due' = 'Optimal';
    if (age >= 4) {
      status = 'Replacement Due';
    } else if (age >= 3) {
      status = 'Monitoring';
    }
    
    return {
      age: Number(age.toFixed(1)),
      currentValue: Math.round(currentValue),
      status
    };
  };

  // Stats calculators
  const stats = {
    totalTasks: filteredTasks.length,
    completedTasks: filteredTasks.filter(t => t.status === 'done').length,
    totalTickets: filteredTickets.length,
    resolvedTickets: filteredTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    totalAssets: filteredAssets.length,
    assetsInUse: filteredAssets.filter(a => a.status === 'IN_USE').length,
    totalInventory: filteredInventories.reduce((sum, item) => sum + (item.quantity || 0), 0),
    activeChats: filteredChatSessions.filter(s => s.status !== 'CLOSED').length
  };

  // Watermark details
  const userEmail = currentUser?.email || 'anonymous@clickhub.com';

  // CSAT Stats Calculations
  const csatTickets = filteredTickets.filter(t => t.csatRating !== null && t.csatRating !== undefined);
  const totalCsat = csatTickets.reduce((sum, t) => sum + (t.csatRating || 0), 0);
  const avgCsat = csatTickets.length ? (totalCsat / csatTickets.length).toFixed(1) : '0.0';
  
  const csatBreakdown = {
    5: csatTickets.filter(t => t.csatRating === 5).length,
    4: csatTickets.filter(t => t.csatRating === 4).length,
    3: csatTickets.filter(t => t.csatRating === 3).length,
    2: csatTickets.filter(t => t.csatRating === 2).length,
    1: csatTickets.filter(t => t.csatRating === 1).length,
  };

  // Helper for formatting IDR currency
  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  // 1. SLA & MTTR Calculations
  const resolvedTicketsData = filteredTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const slaMetCount = resolvedTicketsData.filter(t => {
    if (!t.slaDeadline) return true;
    const deadline = new Date(t.slaDeadline).getTime();
    const resolvedTime = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime();
    return resolvedTime <= deadline;
  }).length;
  const slaComplianceRate = resolvedTicketsData.length ? Math.round((slaMetCount / resolvedTicketsData.length) * 100) : 100;

  const mttrHours = (() => {
    if (resolvedTicketsData.length === 0) return '0.0';
    const totalDurationMs = resolvedTicketsData.reduce((sum, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime();
      return sum + (end - start);
    }, 0);
    return (totalDurationMs / (1000 * 60 * 60) / resolvedTicketsData.length).toFixed(1);
  })();

  // 2. Ticket Category Trend & RCA
  const totalTicketsCount = filteredTickets.length;
  const categoriesList = ['General', 'Network', 'Hardware', 'Software', 'Server', 'Security', 'Policy'];
  const categoryBreakdown = categoriesList.reduce((acc, cat) => {
    const count = filteredTickets.filter(t => t.category === cat).length;
    const pct = totalTicketsCount ? Math.round((count / totalTicketsCount) * 100) : 0;
    acc[cat] = { count, pct };
    return acc;
  }, {} as Record<string, { count: number, pct: number }>);

  const rcaRecommendation = (() => {
    if (totalTicketsCount === 0) return null;
    const dominantCat = Object.entries(categoryBreakdown).find(([_, data]) => data.pct > 30);
    if (dominantCat) {
      return {
        category: dominantCat[0],
        pct: dominantCat[1].pct,
        message: `⚠️ Rekomendasi RCA Proaktif: Kategori "${dominantCat[0]}" mendominasi sebesar ${dominantCat[1].pct}% dari total tiket. Disarankan untuk melakukan audit menyeluruh pada infrastruktur/layanan terkait guna meminimalisir kendala berulang.`
      };
    }
    return null;
  })();

  // 3. Asset Lifecycle & CAPEX Depreciation
  const totalCapex = filteredAssets.reduce((sum, a) => sum + (a.price || 0), 0);
  const assetLifeCycle = (() => {
    if (filteredAssets.length === 0) return { avgAge: '0.0', currentBookValue: 0, warningCount: 0 };
    let totalAgeYears = 0;
    let totalBookValue = 0;
    let warningCount = 0;
    const currentYear = new Date().getFullYear();

    filteredAssets.forEach(a => {
      const purchaseYear = a.purchaseDate ? new Date(a.purchaseDate).getFullYear() : currentYear;
      const ageYears = Math.max(0, currentYear - purchaseYear);
      totalAgeYears += ageYears;

      // Depreciation: 20% per year, min 10% scrap value
      const depRate = Math.min(1, ageYears * 0.20);
      const scrapValue = a.price * 0.10;
      const depreciatedValue = a.price * (1 - depRate);
      const finalBookValue = Math.max(scrapValue, depreciatedValue);
      totalBookValue += finalBookValue;

      if (ageYears >= 4) {
        warningCount++;
      }
    });

    return {
      avgAge: (totalAgeYears / filteredAssets.length).toFixed(1),
      currentBookValue: Math.round(totalBookValue),
      warningCount
    };
  })();

  // 4. Inventory Velocity & Forecast
  const lowStockForecastList = filteredInventories
    .filter(inv => inv.quantity <= inv.minStock)
    .map(inv => {
      const percentage = inv.minStock ? Math.round((inv.quantity / inv.minStock) * 100) : 0;
      return {
        ...inv,
        percentage,
        status: inv.quantity === 0 ? 'Kritis (Habis)' : (percentage <= 50 ? 'Mendesak' : 'Peringatan')
      };
    })
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  // 5. Technician Performance Leaderboard
  const technicianStats = resolvedTicketsData.reduce((acc, t) => {
    const assigneeId = t.assigneeId || 'unassigned';
    if (!acc[assigneeId]) {
      acc[assigneeId] = {
        id: assigneeId,
        name: assigneeId === 'unassigned' ? 'Unassigned' : (getUserById(assigneeId)?.name || 'Unknown User'),
        resolvedCount: 0,
        totalMttrMs: 0,
        slaMetCount: 0,
        totalCsatRating: 0,
        csatCount: 0,
      };
    }
    acc[assigneeId].resolvedCount += 1;
    
    const start = new Date(t.createdAt).getTime();
    const end = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime();
    acc[assigneeId].totalMttrMs += (end - start);
    
    const isSlaMet = (() => {
      if (!t.slaDeadline) return true;
      const deadline = new Date(t.slaDeadline).getTime();
      return end <= deadline;
    })();
    if (isSlaMet) {
      acc[assigneeId].slaMetCount += 1;
    }
    
    if (t.csatRating !== null && t.csatRating !== undefined) {
      acc[assigneeId].totalCsatRating += t.csatRating;
      acc[assigneeId].csatCount += 1;
    }
    
    return acc;
  }, {} as Record<string, {
    id: string;
    name: string;
    resolvedCount: number;
    totalMttrMs: number;
    slaMetCount: number;
    totalCsatRating: number;
    csatCount: number;
  }>);

  const technicianLeaderboard = Object.values(technicianStats)
    .map(tech => ({
      ...tech,
      avgMttrHours: tech.resolvedCount ? (tech.totalMttrMs / (1000 * 60 * 60) / tech.resolvedCount).toFixed(1) : '0.0',
      slaComplianceRate: tech.resolvedCount ? Math.round((tech.slaMetCount / tech.resolvedCount) * 100) : 100,
      avgCsat: tech.csatCount ? (tech.totalCsatRating / tech.csatCount).toFixed(1) : 'N/A'
    }))
    .sort((a, b) => b.resolvedCount - a.resolvedCount);

  // 6. Deep MTTR calculations
  const mttrByCategory = Object.keys(categoryBreakdown).map(cat => {
    const catTickets = resolvedTicketsData.filter(t => t.category === cat);
    const totalDurationMs = catTickets.reduce((sum, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime();
      return sum + (end - start);
    }, 0);
    const avgHours = catTickets.length ? (totalDurationMs / (1000 * 60 * 60) / catTickets.length).toFixed(1) : '0.0';
    return {
      category: cat,
      count: catTickets.length,
      avgHours
    };
  }).sort((a, b) => parseFloat(b.avgHours) - parseFloat(a.avgHours));

  const priorityList: ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const mttrByPriority = priorityList.map(pri => {
    const priTickets = resolvedTicketsData.filter(t => t.priority === pri);
    const totalDurationMs = priTickets.reduce((sum, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime();
      return sum + (end - start);
    }, 0);
    const avgHours = priTickets.length ? (totalDurationMs / (1000 * 60 * 60) / priTickets.length).toFixed(1) : '0.0';
    return {
      priority: pri,
      count: priTickets.length,
      avgHours
    };
  });

  // Export functions

  const exportToExcel = (data: any[], sheetName: string, filename: string) => {
    if (data.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Add watermark metadata
    workbook.Props = {
      Title: filename,
      Subject: "IT Operations Data Export",
      Author: userEmail,
      CreatedDate: new Date()
    };

    XLSX.writeFile(workbook, `${filename}_${Date.now()}.xlsx`);
  };

  const exportToPDF = (headers: string[], rows: any[][], title: string, filename: string) => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(30, 27, 75); // Dark Indigo
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 15, 20);

    // Export Meta Info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated by: ${userEmail}`, 140, 15);
    doc.text(`Date: ${new Date().toLocaleString()}`, 140, 22);

    // Table Content
    (doc as any).autoTable({
      startY: 40,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    // Forensic Watermarking on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Page number
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 10);
      
      // Email footprint
      doc.text(`SECURE EXPORT FOOTPRINT: ${userEmail}`, 15, doc.internal.pageSize.getHeight() - 10);

      // Light transparent diagonal watermark in the middle
      doc.setFontSize(28);
      doc.setTextColor(230, 230, 230);
      // Drawing diagonal text manually for cross-version compatibility
      doc.text(`CONFIDENTIAL - EXPORTED BY ${userEmail.toUpperCase()}`, 15, 120, { angle: 315 });
    }

    doc.save(`${filename}_${Date.now()}.pdf`);
  };

  // Data Preparation for Exports
  const getAssetData = () => filteredAssets.map(a => ({
    ID: a.id.slice(0, 8),
    Name: a.name,
    Brand: a.brand,
    Type: a.type,
    SerialNumber: a.serialNumber,
    Location: a.location,
    Status: a.status,
    Price: a.price,
    Vendor: a.vendor,
    PurchaseDate: a.purchaseDate || 'N/A'
  }));

  const getCapexData = () => filteredAssets.map(a => {
    const dep = getAssetDepreciation(a);
    return {
      ID: a.id.slice(0, 8),
      Name: a.name,
      Brand: a.brand || '',
      Type: a.type,
      PurchaseDate: a.purchaseDate || 'N/A',
      AgeYears: dep.age,
      InitialPrice: a.price,
      CurrentValue: dep.currentValue,
      Status: dep.status
    };
  });

  const getTicketData = () => filteredTickets.map(t => ({
    ID: t.id.slice(0, 8),
    Title: t.title,
    Category: t.category,
    Priority: t.priority,
    Status: t.status,
    Reporter: t.reporterId,
    Created: new Date(t.createdAt).toLocaleDateString(),
    Resolved: t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : 'Pending'
  }));

  const getInventoryData = () => filteredInventories.map(i => ({
    ID: i.id.slice(0, 8),
    SKU: i.sku || 'N/A',
    Name: i.name,
    Description: i.description || '',
    Quantity: i.quantity,
    Unit: i.unit,
    Location: i.location || 'Warehouse',
    Verified: i.isVerified ? 'Yes' : 'No'
  }));

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="text-violet-500" size={24} />
            Reports & Analytics Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Export secure operational data sheets with digital forensic watermarks
          </p>
        </div>
        
        {/* Verification Status Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 px-3 py-1 text-[10px] font-bold text-violet-400">
          <Database size={12} />
          Active Database: hjgmrkgjstklrxcejlfk
        </div>
      </div>

      {/* Date Filter Panel */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-950/20 border border-gray-800 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-violet-400" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Date Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-bold px-3 py-1.5 transition-all border border-gray-750"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/10 backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-gray-900/30 hover:shadow-xl hover:shadow-indigo-950/5 group">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Helpdesk Tickets</span>
            <span className="rounded-lg bg-indigo-600/10 p-1.5 text-indigo-400 border border-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
              <FileText size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white transition-all duration-300 group-hover:text-indigo-400">{stats.totalTickets}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stats.resolvedTickets} Resolved / Closed</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/10 backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-gray-900/30 hover:shadow-xl hover:shadow-emerald-950/5 group">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Assets</span>
            <span className="rounded-lg bg-emerald-600/10 p-1.5 text-emerald-400 border border-emerald-500/20 transition-transform duration-300 group-hover:scale-110">
              <Briefcase size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white transition-all duration-300 group-hover:text-emerald-400">{stats.totalAssets}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stats.assetsInUse} Currently In Use</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/10 backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:bg-gray-900/30 hover:shadow-xl hover:shadow-amber-950/5 group">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Spare Parts Stock</span>
            <span className="rounded-lg bg-amber-600/10 p-1.5 text-amber-400 border border-amber-500/20 transition-transform duration-300 group-hover:scale-110">
              <Package size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white transition-all duration-300 group-hover:text-amber-400">{stats.totalInventory}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Total items inside storage</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/10 backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/40 hover:bg-gray-900/30 hover:shadow-xl hover:shadow-pink-950/5 group">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Support Chat</span>
            <span className="rounded-lg bg-pink-600/10 p-1.5 text-pink-400 border border-pink-500/20 transition-transform duration-300 group-hover:scale-110">
              <Layers size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white transition-all duration-300 group-hover:text-pink-400">{stats.activeChats}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Unresolved IT Support chatrooms</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-gray-800 flex gap-2">
        <button
          onClick={() => setActiveTab('kpi')}
          className={cn(
            "pb-3 text-xs font-bold transition-all px-2 relative",
            activeTab === 'kpi' ? "text-violet-400 border-b-2 border-violet-500" : "text-gray-400 hover:text-white"
          )}
        >
          Overview KPI
        </button>
        <button
          onClick={() => setActiveTab('capex')}
          className={cn(
            "pb-3 text-xs font-bold transition-all px-2 relative",
            activeTab === 'capex' ? "text-violet-400 border-b-2 border-violet-500" : "text-gray-400 hover:text-white"
          )}
          id="report-capex-tab-btn"
        >
          Depreciation & CAPEX
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={cn(
            "pb-3 text-xs font-bold transition-all px-2 relative",
            activeTab === 'assets' ? "text-violet-400 border-b-2 border-violet-500" : "text-gray-400 hover:text-white"
          )}
        >
          Asset Registry ({filteredAssets.length})
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={cn(
            "pb-3 text-xs font-bold transition-all px-2 relative",
            activeTab === 'tickets' ? "text-violet-400 border-b-2 border-violet-500" : "text-gray-400 hover:text-white"
          )}
        >
          Tickets Log ({filteredTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "pb-3 text-xs font-bold transition-all px-2 relative",
            activeTab === 'inventory' ? "text-violet-400 border-b-2 border-violet-500" : "text-gray-400 hover:text-white"
          )}
        >
          Spare Parts Inventory ({filteredInventories.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-gray-900/10 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
        {activeTab === 'kpi' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">System Performance Summary</h2>
              <span className="text-[10px] text-gray-500 font-semibold italic">Forensic imprint matches: {userEmail}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20">
                <h3 className="text-xs font-bold text-gray-300">Ticket Resolution Rate</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold text-white">
                    {stats.totalTickets ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) : 0}%
                  </span>
                  <span className="text-xs text-gray-500 pb-1">Resolved vs Opened tickets</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.totalTickets ? (stats.resolvedTickets / stats.totalTickets) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20">
                <h3 className="text-xs font-bold text-gray-300">Task Completion Ratio</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold text-white">
                    {stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                  </span>
                  <span className="text-xs text-gray-500 pb-1">Tasks marked Done</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* CSAT Average Card */}
              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20">
                <h3 className="text-xs font-bold text-gray-300">Customer Satisfaction (CSAT)</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold text-white csat-average-val">{avgCsat} <span className="text-sm text-gray-500 font-semibold">/ 5.0 ★</span></span>
                  <span className="text-xs text-gray-500 pb-1">Based on {csatTickets.length} reviews</span>
                </div>
                {/* Horizontal progress bar */}
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500 csat-progress-bar" 
                    style={{ width: `${(Number(avgCsat) / 5) * 100}%` }}
                  />
                </div>
                
                {/* Rating Breakdown Bars */}
                <div className="space-y-2 mt-4 pt-2 border-t border-gray-800/40">
                  {[5, 4, 3, 2, 1].map(stars => {
                    const count = csatBreakdown[stars as 5|4|3|2|1] || 0;
                    const pct = csatTickets.length ? Math.round((count / csatTickets.length) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-gray-400 font-semibold">{stars} ★</span>
                        <div className="flex-1 bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-500 font-semibold">{pct}%</span>
                        <span className="text-gray-650 text-[10px]">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent CSAT Feedback comments */}
              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-300 mb-3">Recent Customer Feedback</h3>
                  <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                    {csatTickets.length === 0 ? (
                      <p className="text-xs text-gray-500 italic text-center py-8">No CSAT feedback submitted yet.</p>
                    ) : (
                      csatTickets.map(ticket => (
                        <div key={ticket.id} className="rounded-lg bg-gray-900/40 border border-gray-850 p-2.5 text-xs csat-feedback-item">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-gray-300 truncate max-w-[150px]">{getUserById(ticket.reporterId)?.name || 'User'}</span>
                            <span className="text-amber-400 font-semibold font-mono text-[10px]">{'★'.repeat(ticket.csatRating || 0)}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium line-clamp-1 mb-0.5">Ref: {ticket.title}</p>
                          <p className="text-xs text-gray-300 italic">"{ticket.csatFeedback || 'No comment provided'}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: SLA & MTTR + Ticket Categories Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* SLA & MTTR Card */}
              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20">
                <h3 className="text-xs font-bold text-gray-300">SLA & MTTR Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/40 border border-gray-850 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">SLA Compliance</span>
                    <h4 className="text-2xl font-extrabold text-white mt-1">{slaComplianceRate}%</h4>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold mt-2 border",
                      slaComplianceRate >= 90 ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      slaComplianceRate >= 80 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {slaComplianceRate >= 90 ? 'Healthy ✓' : slaComplianceRate >= 80 ? 'Warning ⚠️' : 'Critical Out of SLA ✗'}
                    </span>
                  </div>
                  <div className="bg-gray-900/40 border border-gray-850 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Mean Time to Resolution</span>
                    <h4 className="text-2xl font-extrabold text-white mt-1">{mttrHours}h</h4>
                    <span className="text-[9px] text-gray-500 block mt-2">Average time per ticket</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-800/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Total Tiket Diselesaikan:</span>
                    <span className="font-semibold text-white">{resolvedTicketsData.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Memenuhi SLA:</span>
                    <span className="font-semibold text-green-400">{slaMetCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Melebihi SLA:</span>
                    <span className="font-semibold text-red-400">{resolvedTicketsData.length - slaMetCount}</span>
                  </div>
                </div>

                {/* MTTR Bottlenecks (Category) */}
                <div className="mt-4 pt-3 border-t border-gray-800/40">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">MTTR Bottlenecks (Category)</h4>
                  <div className="space-y-1.5">
                    {mttrByCategory.slice(0, 3).map(cat => (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{cat.avgHours}h</span>
                          <span className="text-[10px] text-gray-500">({cat.count} tkt)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MTTR by Priority */}
                <div className="mt-4 pt-3 border-t border-gray-800/40">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">MTTR by Priority</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {mttrByPriority.map(pri => (
                      <div key={pri.priority} className="flex justify-between items-center text-xs bg-gray-900/30 border border-gray-850/60 rounded-lg p-2">
                        <span className={cn(
                          "font-semibold text-[10px] uppercase",
                          pri.priority === 'CRITICAL' ? "text-red-400" :
                          pri.priority === 'HIGH' ? "text-orange-400" :
                          pri.priority === 'MEDIUM' ? "text-yellow-400" : "text-gray-400"
                        )}>{pri.priority}</span>
                        <span className="font-bold font-mono text-white">{pri.avgHours}h <span className="text-[9px] text-gray-500 font-normal">({pri.count})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ticket Categories Trend & RCA Card */}
              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-300 mb-3">Ticket Category Distribution</h3>
                  <div className="space-y-2">
                    {categoriesList.map(cat => {
                      const data = categoryBreakdown[cat] || { count: 0, pct: 0 };
                      return (
                        <div key={cat} className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-gray-400 font-semibold truncate" title={cat}>{cat}</span>
                          <div className="flex-1 bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full transition-all" 
                              style={{ width: `${data.pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-gray-300 font-semibold">{data.pct}%</span>
                          <span className="text-gray-650 text-[10px]">({data.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {rcaRecommendation && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-[11px] text-amber-400">
                    <p className="font-semibold mb-0.5">{rcaRecommendation.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Asset Life Cycle & Financials + Inventory Velocity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Asset Lifecycle & Capex Depreciation */}
              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20">
                <h3 className="text-xs font-bold text-gray-300">Asset Lifecycle & Depreciation (CAPEX)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/40 border border-gray-850 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Total Investasi Aset</span>
                    <h4 className="text-xl font-extrabold text-white mt-1 truncate" title={formatPrice(totalCapex)}>{formatPrice(totalCapex)}</h4>
                  </div>
                  <div className="bg-gray-900/40 border border-gray-850 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Nilai Buku Saat Ini</span>
                    <h4 className="text-xl font-extrabold text-emerald-400 mt-1 truncate" title={formatPrice(assetLifeCycle.currentBookValue)}>{formatPrice(assetLifeCycle.currentBookValue)}</h4>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-800/40 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rata-rata Umur Aset Fisik:</span>
                    <span className="font-semibold text-white">{assetLifeCycle.avgAge} tahun</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Aset Usia Kritis (&gt;4 tahun):</span>
                    <span className="font-semibold text-amber-400">{assetLifeCycle.warningCount} unit</span>
                  </div>
                  {assetLifeCycle.warningCount > 0 && (
                    <div className="mt-2 bg-violet-600/10 border border-violet-500/20 rounded p-1.5 text-[10px] text-violet-400">
                      💡 <strong>Saran:</strong> Terdapat {assetLifeCycle.warningCount} perangkat keras berumur kritis. Rencanakan CAPEX penggantian di kuartal berikutnya.
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Velocity & Forecast */}
              <div className="space-y-4 border border-gray-800/60 rounded-xl p-4 bg-gray-950/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-300 mb-2">Restock Forecast Alert</h3>
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {lowStockForecastList.length === 0 ? (
                      <p className="text-xs text-gray-500 italic text-center py-6">Semua stok suku cadang dalam kondisi aman.</p>
                    ) : (
                      lowStockForecastList.map(inv => (
                        <div key={inv.id} className="rounded-lg bg-gray-900/40 border border-gray-850 p-2.5 text-xs flex justify-between items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-semibold text-white truncate max-w-[150px]">{inv.name}</span>
                              <span className="text-[9px] text-gray-500 font-mono font-bold">({inv.sku})</span>
                            </div>
                            <p className="text-[10px] text-gray-400">Stok: {inv.quantity} / {inv.minStock} {inv.unit}</p>
                          </div>
                          <span className={cn(
                            "rounded px-2 py-0.5 text-[9px] font-bold uppercase border",
                            inv.status === 'Kritis (Habis)' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            inv.status === 'Mendesak' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          )}>
                            {inv.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Technician Performance Leaderboard */}
            <div className="border border-gray-800/60 rounded-xl p-6 bg-gray-950/20 mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Technician Performance Leaderboard</h3>
                <span className="text-[10px] text-gray-500 font-semibold uppercase">Based on resolved tickets</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-850 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Technician</th>
                      <th className="py-3 px-4 text-center">Tickets Resolved</th>
                      <th className="py-3 px-4 text-center">Avg MTTR</th>
                      <th className="py-3 px-4 text-center">SLA Compliance</th>
                      <th className="py-3 px-4 text-center">Avg CSAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/50">
                    {technicianLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 italic">No tickets resolved by any technician.</td>
                      </tr>
                    ) : (
                      technicianLeaderboard.map((tech, idx) => (
                        <tr key={tech.id} className="hover:bg-gray-900/20 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-400">
                            {idx === 0 ? '🏆 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">{tech.name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block bg-indigo-600/15 text-indigo-400 rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-indigo-500/10">
                              {tech.resolvedCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium font-mono text-gray-300">{tech.avgMttrHours}h</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-850 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div 
                                  className={cn(
                                    "h-full rounded-full",
                                    tech.slaComplianceRate >= 90 ? "bg-green-500" :
                                    tech.slaComplianceRate >= 80 ? "bg-amber-500" : "bg-red-500"
                                  )} 
                                  style={{ width: `${tech.slaComplianceRate}%` }}
                                />
                              </div>
                              <span className={cn(
                                "font-bold font-mono",
                                tech.slaComplianceRate >= 90 ? "text-green-400" :
                                tech.slaComplianceRate >= 80 ? "text-amber-400" : "text-red-400"
                              )}>{tech.slaComplianceRate}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-amber-400 font-mono">
                            {tech.avgCsat !== 'N/A' ? `${tech.avgCsat} ★` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'capex' && (
          <div className="space-y-6 animate-fade-in" id="report-capex-container">
            {/* Header with Export buttons */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Asset Lifecycle & Depreciation (CAPEX) Report</h2>
                <p className="text-xs text-gray-500">Analisis penyusutan nilai aset secara linear (estimasi masa pakai 5 tahun) dan peramalan kebutuhan penggantian perangkat.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    exportToExcel(getCapexData(), 'CAPEX', 'capex_depreciation_report');
                    addAuditLog('REPORT_EXPORTED', `Exported CAPEX Depreciation report to Excel`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 transition-all border border-gray-700/60"
                >
                  <Download size={12} />
                  Excel
                </button>
                <button
                  onClick={() => {
                    const data = getCapexData();
                    const headers = ['ID', 'Name', 'Brand', 'Type', 'Purchase Date', 'Age (Yrs)', 'Initial Price', 'Current Value', 'Status'];
                    const rows = data.map(a => [a.ID, a.Name, a.Brand, a.Type, a.PurchaseDate, String(a.AgeYears), formatPrice(a.InitialPrice), formatPrice(a.CurrentValue), a.Status]);
                    exportToPDF(headers, rows, 'CAPEX & Depreciation Report', 'capex_depreciation_report');
                    addAuditLog('REPORT_EXPORTED', `Exported CAPEX Depreciation report to PDF`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 transition-all"
                >
                  <Download size={12} />
                  PDF (Secure)
                </button>
              </div>
            </div>

            {/* Financial KPI stats */}
            {(() => {
              const capexStats = filteredAssets.reduce((acc, a) => {
                const dep = getAssetDepreciation(a);
                acc.totalInitial += (a.price || 0);
                acc.totalDepreciated += dep.currentValue;
                if (dep.status === 'Replacement Due') {
                  acc.totalOverdueCost += (a.price || 0);
                }
                return acc;
              }, { totalInitial: 0, totalDepreciated: 0, totalOverdueCost: 0 });

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-800 bg-[#282c34]/30 p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Investasi CAPEX Awal</p>
                    <h3 className="text-xl font-bold text-white mt-1">{formatPrice(capexStats.totalInitial)}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Nilai perolehan historis seluruh aset</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#282c34]/30 p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nilai Buku Saat Ini</p>
                    <h3 className="text-xl font-bold text-emerald-400 mt-1">{formatPrice(capexStats.totalDepreciated)}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Nilai buku setelah akumulasi penyusutan</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#282c34]/30 p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Anggaran Penggantian Aset Kritis</p>
                    <h3 className="text-xl font-bold text-rose-400 mt-1">{formatPrice(capexStats.totalOverdueCost)}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Estimasi biaya penggantian aset berumur &gt; 4 tahun</p>
                  </div>
                </div>
              );
            })()}

            {/* Layout for Table & Roadmap Forecast side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Depreciation Table */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-xs font-bold text-gray-300">Daftar Depresiasi & Status Aset</h3>
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-gray-800/60 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 font-semibold bg-gray-900/40">
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Tgl Pembelian</th>
                        <th className="p-2.5">Umur (Thn)</th>
                        <th className="p-2.5">Harga Awal</th>
                        <th className="p-2.5">Nilai Buku</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850 text-gray-300">
                      {filteredAssets.map(asset => {
                        const dep = getAssetDepreciation(asset);
                        return (
                          <tr key={asset.id} className="hover:bg-gray-900/10">
                            <td className="p-2.5 font-semibold text-white truncate max-w-[150px]" title={asset.name}>{asset.name}</td>
                            <td className="p-2.5">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</td>
                            <td className="p-2.5 font-mono">{dep.age}</td>
                            <td className="p-2.5">{formatPrice(asset.price)}</td>
                            <td className="p-2.5 font-semibold text-emerald-400">{formatPrice(dep.currentValue)}</td>
                            <td className="p-2.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold border",
                                dep.status === 'Optimal' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                dep.status === 'Monitoring' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
                              )}>
                                {dep.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quarter replacement Forecast Roadmap */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-300">Proyeksi Anggaran Penggantian (Roadmap)</h3>
                <div className="rounded-xl border border-gray-800 bg-gray-950/20 p-4 space-y-4">
                  <p className="text-[10px] text-gray-500 leading-relaxed">Berikut adalah proyeksi pengeluaran CAPEX penggantian hardware baru berdasarkan jadwal kadaluarsa 4 tahun semenjak tanggal pembelian aset:</p>
                  
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const forecastMap: Record<string, number> = {};
                    
                    filteredAssets.forEach(a => {
                      if (!a.purchaseDate) return;
                      const pDate = new Date(a.purchaseDate);
                      const repDate = new Date(pDate.setFullYear(pDate.getFullYear() + 4));
                      const year = repDate.getFullYear();
                      const month = repDate.getMonth();
                      const quarter = Math.floor(month / 3) + 1;
                      const key = `${year}-Q${quarter}`;
                      
                      if (year >= currentYear) {
                        forecastMap[key] = (forecastMap[key] || 0) + (a.price || 0);
                      }
                    });
                    
                    const sortedForecast = Object.entries(forecastMap)
                      .map(([key, cost]) => ({ key, cost }))
                      .sort((a, b) => a.key.localeCompare(b.key))
                      .slice(0, 5); // next 5 quarters

                    if (sortedForecast.length === 0) {
                      return <p className="text-xs text-gray-500 italic text-center py-6">Tidak ada proyeksi penggantian aset dalam jangka pendek.</p>;
                    }

                    return (
                      <div className="space-y-3">
                        {sortedForecast.map(f => (
                          <div key={f.key} className="flex justify-between items-center bg-gray-900/40 border border-gray-850 p-2.5 rounded-lg text-xs">
                            <div>
                              <span className="font-bold text-white block">{f.key}</span>
                              <span className="text-[10px] text-gray-500">Jadwal Penggantian</span>
                            </div>
                            <span className="font-semibold text-violet-400">{formatPrice(f.cost)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Asset Inventory Report</h2>
                <p className="text-xs text-gray-500">Hardware assets currently tracked in active operations.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    exportToExcel(getAssetData(), 'Assets', 'asset_inventory_report');
                    addAuditLog('REPORT_EXPORTED', `Exported Asset Inventory report to Excel`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 transition-all border border-gray-700/60"
                >
                  <Download size={12} />
                  Excel
                </button>
                <button
                  onClick={() => {
                    const data = getAssetData();
                    const headers = ['ID', 'Name', 'Brand', 'Type', 'Serial Number', 'Location', 'Status', 'Price'];
                    const rows = data.map(a => [a.ID, a.Name, a.Brand, a.Type, a.SerialNumber, a.Location, a.Status, String(a.Price)]);
                    exportToPDF(headers, rows, 'Asset Inventory Report', 'asset_inventory_report');
                    addAuditLog('REPORT_EXPORTED', `Exported Asset Inventory report to PDF`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 transition-all"
                >
                  <Download size={12} />
                  PDF (Secure)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Brand</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Serial Number</th>
                    <th className="py-2.5">Location</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-gray-900/10">
                      <td className="py-3 font-semibold text-white">{asset.name}</td>
                      <td className="py-3">{asset.brand}</td>
                      <td className="py-3">{asset.type}</td>
                      <td className="py-3 font-mono">{asset.serialNumber}</td>
                      <td className="py-3">{asset.location}</td>
                      <td className="py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          asset.status === 'AVAILABLE' ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" :
                          asset.status === 'IN_USE' ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" :
                          "bg-amber-600/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">IT Tickets Report Log</h2>
                <p className="text-xs text-gray-500">History log of helpdesk and hardware failure tickets.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    exportToExcel(getTicketData(), 'Tickets', 'tickets_report_log');
                    addAuditLog('REPORT_EXPORTED', `Exported Tickets report to Excel`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 transition-all border border-gray-700/60"
                >
                  <Download size={12} />
                  Excel
                </button>
                <button
                  onClick={() => {
                    const data = getTicketData();
                    const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Created', 'Resolved'];
                    const rows = data.map(t => [t.ID, t.Title, t.Category, t.Priority, t.Status, t.Created, t.Resolved]);
                    exportToPDF(headers, rows, 'IT Helpdesk Ticket Log', 'tickets_report_log');
                    addAuditLog('REPORT_EXPORTED', `Exported Tickets report to PDF`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 transition-all"
                >
                  <Download size={12} />
                  PDF (Secure)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                    <th className="py-2.5">Title</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Priority</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300">
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gray-900/10">
                      <td className="py-3 font-semibold text-white">{ticket.title}</td>
                      <td className="py-3">{ticket.category}</td>
                      <td className="py-3 font-semibold">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? "bg-rose-600/10 text-rose-400 border border-rose-500/20" :
                          ticket.priority === 'MEDIUM' ? "bg-amber-600/10 text-amber-400 border border-amber-500/20" :
                          "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                        )}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          ticket.status === 'OPEN' ? "bg-violet-600/10 text-violet-400 border border-violet-500/20" :
                          ticket.status === 'IN_PROGRESS' ? "bg-amber-600/10 text-amber-400 border border-amber-500/20" :
                          "bg-gray-800 text-gray-400"
                        )}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Spare Parts Inventory Report</h2>
                <p className="text-xs text-gray-500">Warehouse storage tracking for spares, cables, and components.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    exportToExcel(getInventoryData(), 'Inventory', 'spare_parts_inventory_report');
                    addAuditLog('REPORT_EXPORTED', `Exported Inventory report to Excel`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 transition-all border border-gray-700/60"
                >
                  <Download size={12} />
                  Excel
                </button>
                <button
                  onClick={() => {
                    const data = getInventoryData();
                    const headers = ['ID', 'SKU', 'Name', 'Description', 'Quantity', 'Unit', 'Location', 'Verified'];
                    const rows = data.map(i => [i.ID, i.SKU, i.Name, i.Description, String(i.Quantity), i.Unit, i.Location, i.Verified]);
                    exportToPDF(headers, rows, 'Spare Parts Inventory Report', 'spare_parts_inventory_report');
                    addAuditLog('REPORT_EXPORTED', `Exported Inventory report to PDF`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 transition-all"
                >
                  <Download size={12} />
                  PDF (Secure)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5">Quantity</th>
                    <th className="py-2.5">Location</th>
                    <th className="py-2.5">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300">
                  {filteredInventories.map(item => (
                    <tr key={item.id} className="hover:bg-gray-900/10">
                      <td className="py-3 font-semibold text-white">{item.name}</td>
                      <td className="py-3 font-mono text-gray-400">{item.sku || 'N/A'}</td>
                      <td className="py-3 text-gray-400 max-w-[200px] truncate">{item.description || 'N/A'}</td>
                      <td className="py-3 font-semibold">{item.quantity} {item.unit}</td>
                      <td className="py-3">{item.location || 'Warehouse'}</td>
                      <td className="py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          item.isVerified ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-800 text-gray-400"
                        )}>
                          {item.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
