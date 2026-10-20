import { createPortal } from "react-dom";
import { useState, useEffect, useRef, FormEvent } from "react";
import { db } from "../lib/firebase";
import { collection, runTransaction, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Receipt, Pencil, Eye, Trash2, MoreVertical, AlertTriangle, X, Filter, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useSearch } from "../context/SearchContext";
import InvoiceModal from "../components/InvoiceModal";
import { cn, formatNaira, getLocalDateString } from "../lib/utils";
import { CustomDropdown } from "../components/CustomDropdown";
import { Headphones, Smartphone, Laptop, Settings, TriangleAlert, Layers, Clock, Calendar, Wallet } from "lucide-react";
import { logActivity } from "../lib/activityLogger";

export default function Sales() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { searchQuery } = useSearch();

  const isSalesFull = user?.role === 'Admin' || user?.permissions?.Sales === 'Full';
  const isAdmin = user?.role === 'Admin';

  const tableRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Action menu state (anchored dropdown & mobile action sheet)
  const [activeActionSaleId, setActiveActionSaleId] = useState<string | null>(null);
  const [activeMobileActionSale, setActiveMobileActionSale] = useState<any | null>(null);

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [invoiceFilter, setInvoiceFilter] = useState<string>("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");

  // Selection state for row checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Raw sales
  const [sales, setSales] = useState<any[]>([]);

  // New Sale Form State
  const [newItemName, setNewItemName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState("Card");
  const [newPaymentStatus, setNewPaymentStatus] = useState<"Paid" | "Part-paid" | "Unpaid">("Paid");
  const [newAmountPaid, setNewAmountPaid] = useState<number>(0);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-dropdown-container')) {
        setActiveActionSaleId(null);
      }
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) && !(e.target as Element).closest('.filter-btn')) {
        setIsFilterPanelOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fetch sales from firestore with error & loading state
  const fetchSales = () => {
    setLoading(true);
    setError(null);
    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setError(null);
    }, (err) => {
      setLoading(false);
      if (err.code === 'permission-denied') {
        setError("You do not have permission to view sales records. Please contact your system administrator.");
      } else {
        setError("Failed to load sales invoices. Please check your connection.");
      }
      console.error("Sales snapshot error:", err);
    });
  };

  useEffect(() => {
    const unsub = fetchSales();
    return unsub;
  }, []);

  // Auto-sync amount paid for new sale
  useEffect(() => {
    const total = Number(newQty) * Number(newPrice);
    if (newPaymentStatus === "Paid") {
      setNewAmountPaid(total);
    } else if (newPaymentStatus === "Unpaid") {
      setNewAmountPaid(0);
    }
  }, [newQty, newPrice, newPaymentStatus]);

  // Handle single delete
  const handleDeleteSale = (id: string) => {
    if (!isAdmin) return;
    setDeletingSaleId(id);
    setDropdownConfig(null);
  };

  const confirmDelete = async () => {
    if (!deletingSaleId) return;
    try {
      const saleToDelete = sales.find(s => s.id === deletingSaleId);
      await deleteDoc(doc(db, "sales", deletingSaleId));
      
      await logActivity({
        action: 'Sale Deleted',
        actorUid: user?.uid || 'admin',
        actorName: user?.name || user?.username || 'Admin',
        actorRole: user?.role || 'Admin',
        targetId: deletingSaleId,
        targetName: saleToDelete ? `#${saleToDelete.invoiceNumber}` : deletingSaleId,
        details: saleToDelete 
          ? `Deleted sales invoice #${saleToDelete.invoiceNumber} (${saleToDelete.item}, ${formatNaira(saleToDelete.totalPrice)})`
          : `Deleted sales invoice ${deletingSaleId}`
      });

      setSelectedIds(prev => prev.filter(id => id !== deletingSaleId));
      setDeletingSaleId(null);
      toastSuccess("Invoice deleted successfully");
    } catch (err) {
      console.error(err);
      toastError("Failed to delete invoice");
    }
  };

  // Handle bulk delete
  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0 || !isAdmin) return;
    const count = selectedIds.length;
    try {
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "sales", id))));

      await logActivity({
        action: 'Sale Deleted',
        actorUid: user?.uid || 'admin',
        actorName: user?.name || user?.username || 'Admin',
        actorRole: user?.role || 'Admin',
        details: `Bulk deleted ${count} sales invoices`
      });

      setSelectedIds([]);
      setIsBulkDeleting(false);
      toastSuccess(`Deleted ${count} invoices successfully`);
    } catch (err) {
      console.error(err);
      toastError("Failed to delete selected invoices");
    }
  };

  // Record New Sale
  const handleRecordSale = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toastError("Item name is required");
      return;
    }
    if (!newCategory) {
      toastError("Category is required. Please select a category.");
      return;
    }
    const qtyVal = Math.floor(Number(newQty));
    if (isNaN(qtyVal) || qtyVal < 1) {
      toastError("Quantity must be a whole number of at least 1");
      return;
    }
    const priceVal = Number(newPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      toastError("Unit price must be greater than 0");
      return;
    }

    const totalAmount = qtyVal * priceVal;
    let actualPaid = Number(newAmountPaid);
    if (newPaymentStatus === "Paid") actualPaid = totalAmount;
    if (newPaymentStatus === "Unpaid") actualPaid = 0;
    if (newPaymentStatus === "Part-paid" && (actualPaid <= 0 || actualPaid >= totalAmount)) {
      toastError(`For Part-paid, amount paid must be between ₦1.00 and ₦${(totalAmount - 1).toFixed(2)}`);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "sales");
        const counterSnap = await transaction.get(counterRef);
        let nextCount = 1;
        if (counterSnap.exists()) {
          nextCount = (counterSnap.data().count || 0) + 1;
        }
        const invoiceId = `INV-${String(nextCount).padStart(5, '0')}`;
        const newSaleRef = doc(db, "sales", invoiceId);

        transaction.set(counterRef, { count: nextCount });
        transaction.set(newSaleRef, {
          item: newItemName.trim(),
          category: newCategory,
          qty: qtyVal,
          amount: totalAmount,
          unitPrice: priceVal,
          paymentMethod: newPaymentMethod,
          paymentStatus: newPaymentStatus,
          amountPaid: actualPaid,
          date: getLocalDateString(new Date()),
          createdAt: serverTimestamp()
        });
      });

      // Reset
      setNewItemName("");
      setNewCategory("");
      setNewQty(1);
      setNewPrice(0);
      setNewPaymentMethod("Card");
      setNewPaymentStatus("Paid");
      setNewAmountPaid(0);
      setIsNewSaleOpen(false);
      toastSuccess("Sales invoice created successfully!");
    } catch (err) {
      console.error(err);
      toastError("Error recording sale");
    }
  };

  // Update Existing Sale
  const handleUpdateSale = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    if (!editingSale.item?.trim()) {
      toastError("Item name is required");
      return;
    }
    if (!editingSale.category) {
      toastError("Category is required");
      return;
    }
    const qtyVal = Math.floor(Number(editingSale.qty));
    if (isNaN(qtyVal) || qtyVal < 1) {
      toastError("Quantity must be a whole number of at least 1");
      return;
    }
    const priceVal = Number(editingSale.unitPrice || (editingSale.amount / (editingSale.qty || 1)));
    if (isNaN(priceVal) || priceVal <= 0) {
      toastError("Unit price must be greater than 0");
      return;
    }

    const totalAmount = qtyVal * priceVal;
    let actualPaid = Number(editingSale.amountPaid || 0);
    if (editingSale.paymentStatus === "Paid") actualPaid = totalAmount;
    if (editingSale.paymentStatus === "Unpaid") actualPaid = 0;

    try {
      await updateDoc(doc(db, "sales", editingSale.id), {
        item: editingSale.item.trim(),
        category: editingSale.category,
        qty: qtyVal,
        amount: totalAmount,
        unitPrice: priceVal,
        paymentMethod: editingSale.paymentMethod,
        paymentStatus: editingSale.paymentStatus || 'Paid',
        amountPaid: actualPaid,
      });

      setEditingSale(null);
      toastSuccess("Invoice updated successfully!");
    } catch (err) {
      console.error(err);
      toastError("Error updating invoice");
    }
  };

  const CATEGORY_OPTIONS = [
    { value: "Accessories", label: "Accessories", icon: <Headphones size={16} /> },
    { value: "Smartphones", label: "Smartphones", icon: <Smartphone size={16} /> },
    { value: "Computers", label: "Computers", icon: <Laptop size={16} /> },
    { value: "Parts", label: "Parts", icon: <Settings size={16} /> },
  ];

  const INVOICE_FILTER_OPTIONS = [
    { value: "all", label: "All Invoices", icon: <Layers size={16} />, iconColor: "text-[#1A1A1A]", bgColor: "bg-gray-100", textColor: "text-[#1A1A1A]" },
    { value: "outstanding", label: "Outstanding (Unpaid/Part-paid)", icon: <TriangleAlert size={16} />, iconColor: "text-[#F15F36]", bgColor: "bg-[#FFF4ED]", textColor: "text-[#F15F36]" },
    { value: "overdue", label: "Overdue", icon: <Clock size={16} />, iconColor: "text-red-500", bgColor: "bg-red-50", textColor: "text-red-600" },
    { value: "scheduled", label: "Scheduled", icon: <Calendar size={16} />, iconColor: "text-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-600" },
    { value: "paid", label: "Paid", icon: <Wallet size={16} />, iconColor: "text-green-500", bgColor: "bg-green-50", textColor: "text-green-600" },
  ];

  const todayStr = getLocalDateString(new Date());

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const pStatus = sale.paymentStatus || "Paid";

    // 1. Invoice status filter dropdown
    if (invoiceFilter === "outstanding" && pStatus === "Paid") return false;
    if (invoiceFilter === "paid" && pStatus !== "Paid") return false;
    if (invoiceFilter === "overdue" && (pStatus === "Paid" || !sale.date || sale.date >= todayStr)) return false;
    if (invoiceFilter === "scheduled" && (!sale.date || sale.date <= todayStr)) return false;

    // 2. Filter panel (Date Range & Payment Method)
    if (filterPaymentMethod !== "all" && sale.paymentMethod?.toLowerCase() !== filterPaymentMethod.toLowerCase()) {
      return false;
    }
    if (filterStartDate && sale.date && sale.date < filterStartDate) {
      return false;
    }
    if (filterEndDate && sale.date && sale.date > filterEndDate) {
      return false;
    }

    // 3. Global Header Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = sale.id?.toLowerCase().includes(q);
      const matchItem = sale.item?.toLowerCase().includes(q);
      const matchCat = sale.category?.toLowerCase().includes(q);
      const matchMethod = sale.paymentMethod?.toLowerCase().includes(q);
      const matchStatus = pStatus.toLowerCase().includes(q);
      if (!matchId && !matchItem && !matchCat && !matchMethod && !matchStatus) {
        return false;
      }
    }

    return true;
  });

  // Checkbox helpers
  const isAllSelected = filteredSales.length > 0 && selectedIds.length === filteredSales.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSales.map(s => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const s = status || "Paid";
    switch (s) {
      case "Paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Part-paid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Unpaid":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">Sales</h1>
          <p className="text-sm text-[#71717A] font-medium">Create invoices, manage transactions, and view sales history.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => {
              tableRef.current?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="flex-1 sm:flex-none justify-center px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-[#1A1A1A] transition-colors"
          >
            <Receipt className="w-4 h-4" />
            View Invoices
          </button>
          
          {/* New Sales Invoice button (only shown if user has write/Full permissions) */}
          {isSalesFull && (
            <button 
              type="button"
              onClick={() => setIsNewSaleOpen(true)} 
              className="flex-1 sm:flex-none justify-center px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-black transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Sales Invoice
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table Container */}
      <div ref={tableRef} className="bg-white rounded-[24px] border border-[#E5E5E5] shadow-sm flex flex-col">
        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-bold text-[#1A1A1A]">Invoices</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
              {filteredSales.length} {filteredSales.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Invoice filter dropdown */}
            <div className="w-full sm:w-[260px]">
              <CustomDropdown 
                options={INVOICE_FILTER_OPTIONS}
                value={invoiceFilter}
                onChange={setInvoiceFilter}
                placeholder="Filter by status..."
              />
            </div>

            {/* Filter icon button with Popover */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsFilterPanelOpen(prev => !prev)}
                className={cn(
                  "filter-btn w-10 h-10 flex items-center justify-center rounded-xl border transition-all",
                  (filterStartDate || filterEndDate || filterPaymentMethod !== "all" || isFilterPanelOpen)
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-700"
                )}
                title="Filter by date range and payment method"
              >
                <Filter size={18} />
              </button>

              {/* Filter Panel Popover */}
              {isFilterPanelOpen && (
                <div 
                  ref={filterPanelRef}
                  className="absolute right-0 top-12 w-80 bg-white border border-[#E5E5E5] rounded-2xl shadow-xl p-5 z-40 animate-in fade-in zoom-in-95"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Filter Options</h3>
                    {(filterStartDate || filterEndDate || filterPaymentMethod !== "all") && (
                      <button 
                        type="button"
                        onClick={() => {
                          setFilterStartDate("");
                          setFilterEndDate("");
                          setFilterPaymentMethod("all");
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                      >
                        <RotateCcw size={12} /> Reset
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Payment Method</label>
                      <select 
                        value={filterPaymentMethod}
                        onChange={(e) => setFilterPaymentMethod(e.target.value)}
                        className="w-full text-xs h-9 px-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                      >
                        <option value="all">All Methods</option>
                        <option value="Card">Card</option>
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">From Date</label>
                      <input 
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full text-xs h-9 px-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">To Date</label>
                      <input 
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full text-xs h-9 px-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setIsFilterPanelOpen(false)}
                        className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Actions for Admins */}
            {isAdmin && selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBulkDeleting(true)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Error Alert State */}
        {error && (
          <div className="m-4 sm:m-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3 text-red-800 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-900">Access or Connection Error</h3>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchSales()}
              className="min-h-[36px] px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-semibold transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton State */}
        {loading && (
          <div className="p-4 sm:p-6 space-y-4 animate-pulse">
            {/* Desktop skeleton */}
            <div className="hidden md:block space-y-3">
              <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 border border-gray-100 rounded-xl w-full flex items-center px-4 gap-4">
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  <div className="w-12 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            {/* Mobile skeleton cards */}
            <div className="block md:hidden space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex justify-between">
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSales.length === 0 && (
          <div className="p-8 sm:p-14 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <Receipt className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
              {sales.length === 0 ? "No Sales Recorded Yet" : "No Matching Invoices Found"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-sm mb-6">
              {sales.length === 0 
                ? "Start recording sales transactions, items sold, and printing customer receipts to see your records here."
                : "Try adjusting your search terms, date range, or payment method filters to find what you're looking for."}
            </p>
            {sales.length === 0 && isSalesFull ? (
              <button
                type="button"
                onClick={() => setIsNewSaleOpen(true)}
                className="min-h-[44px] px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Record First Sale
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setInvoiceFilter("all");
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setFilterPaymentMethod("all");
                }}
                className="min-h-[44px] px-5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Real Desktop Table (md and up) */}
        {!loading && filteredSales.length > 0 && (
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-gray-900 min-w-[850px]">
              <thead className="text-gray-600 font-semibold border-b border-gray-200 bg-gray-50/75 text-xs uppercase tracking-wider">
                <tr>
                  {isAdmin && (
                    <th className="px-6 py-4 w-12 font-normal">
                      <div className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-3">
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-black cursor-pointer" 
                          aria-label="Select all invoices"
                        />
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-4 font-semibold">Invoice ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Item & Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Qty</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Payment</th>
                  <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map((sale) => {
                  const isSelected = selectedIds.includes(sale.id);
                  const paymentStatus = sale.paymentStatus || "Paid";
                  return (
                    <tr key={sale.id} className={cn("hover:bg-gray-50/75 transition-colors group", isSelected && "bg-indigo-50/30")}>
                      {isAdmin && (
                        <td className="px-6 py-3.5">
                          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectRow(sale.id)}
                              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-black cursor-pointer" 
                              aria-label={`Select invoice ${sale.id}`}
                            />
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-3.5 font-mono font-medium text-gray-600">#{sale.id}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-gray-700">{sale.date}</td>
                      <td className="px-6 py-3.5 min-w-[180px]">
                        <div className="font-semibold text-gray-900">{sale.item}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{sale.category}</div>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-gray-700">{sale.qty}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-gray-900">{formatNaira(sale.amount)}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border", getPaymentStatusBadge(paymentStatus))}>
                          {paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", sale.paymentMethod?.toLowerCase() === "cash" ? "bg-green-500" : "bg-blue-500")} />
                          {sale.paymentMethod || 'Card'}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 relative action-dropdown-container">
                          {/* Quick View */}
                          <button 
                            type="button"
                            onClick={() => setSelectedInvoice(sale)} 
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Receipt"
                            aria-label="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Edit */}
                          {isSalesFull && (
                            <button 
                              type="button"
                              onClick={() => setEditingSale({
                                ...sale,
                                unitPrice: sale.unitPrice || (sale.amount / (sale.qty || 1)),
                                paymentStatus: sale.paymentStatus || 'Paid',
                                amountPaid: sale.amountPaid !== undefined ? sale.amountPaid : sale.amount
                              })} 
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Invoice"
                              aria-label="Edit Invoice"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {/* More dropdown trigger */}
                          <button 
                            type="button"
                            onClick={() => setActiveActionSaleId(activeActionSaleId === sale.id ? null : sale.id)} 
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More options"
                            aria-label="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Anchored Popover - Moves cleanly with scrolling */}
                          {activeActionSaleId === sale.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 text-left">
                              <button 
                                type="button"
                                onClick={() => { setSelectedInvoice(sale); setActiveActionSaleId(null); }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                <Receipt className="w-4 h-4 text-gray-500" /> Print Receipt
                              </button>
                              {isAdmin && (
                                <button 
                                  type="button"
                                  onClick={() => { handleDeleteSale(sale.id); setActiveActionSaleId(null); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete Invoice
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Responsive Mobile Cards View (< 768px) */}
        {!loading && filteredSales.length > 0 && (
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredSales.map((sale) => {
              const isSelected = selectedIds.includes(sale.id);
              const paymentStatus = sale.paymentStatus || "Paid";
              return (
                <div key={sale.id} className={cn("p-4 bg-white space-y-3 transition-colors", isSelected && "bg-indigo-50/30")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <div className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 -my-2">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectRow(sale.id)}
                            className="w-5 h-5 rounded border-gray-300 text-black cursor-pointer"
                            aria-label={`Select invoice ${sale.id}`}
                          />
                        </div>
                      )}
                      <div>
                        <span className="font-mono text-xs font-bold text-gray-700">#{sale.id}</span>
                        <p className="text-xs text-gray-500">{sale.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", getPaymentStatusBadge(paymentStatus))}>
                        {paymentStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveMobileActionSale(sale)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
                        aria-label="Actions for invoice"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-base leading-snug">{sale.item}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{sale.category}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Qty: <strong className="text-gray-900">{sale.qty}</strong></span>
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <span className={cn("w-2 h-2 rounded-full", sale.paymentMethod?.toLowerCase() === "cash" ? "bg-green-500" : "bg-blue-500")} />
                        {sale.paymentMethod || 'Card'}
                      </span>
                    </div>
                    <div>
                      <span className="text-base font-bold text-gray-900">{formatNaira(sale.amount)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Action Bottom Sheet */}
      {activeMobileActionSale && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm sm:hidden animate-in fade-in"
          onClick={() => setActiveMobileActionSale(null)}
        >
          <div 
            className="bg-white rounded-t-2xl p-4 space-y-2 border-t border-gray-200 animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight">{activeMobileActionSale.item}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Invoice #{activeMobileActionSale.id} • {formatNaira(activeMobileActionSale.amount)}</p>
              </div>
              <button 
                onClick={() => setActiveMobileActionSale(null)} 
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-xl"
                aria-label="Close action menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <button 
                type="button"
                onClick={() => {
                  setSelectedInvoice(activeMobileActionSale);
                  setActiveMobileActionSale(null);
                }}
                className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <Receipt className="w-5 h-5 text-gray-600" />
                View & Print Receipt
              </button>

              {isSalesFull && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingSale({
                      ...activeMobileActionSale,
                      unitPrice: activeMobileActionSale.unitPrice || (activeMobileActionSale.amount / (activeMobileActionSale.qty || 1)),
                      paymentStatus: activeMobileActionSale.paymentStatus || 'Paid',
                      amountPaid: activeMobileActionSale.amountPaid !== undefined ? activeMobileActionSale.amountPaid : activeMobileActionSale.amount
                    });
                    setActiveMobileActionSale(null);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-5 h-5 text-gray-600" />
                  Edit Invoice Details
                </button>
              )}

              {isAdmin && (
                <button 
                  type="button"
                  onClick={() => {
                    handleDeleteSale(activeMobileActionSale.id);
                    setActiveMobileActionSale(null);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: New Sales Invoice Modal */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] animate-in slide-in-from-bottom duration-200">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0 bg-white">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">New Sales Invoice</h2>
              <button 
                type="button"
                onClick={() => setIsNewSaleOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSale} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={newItemName} 
                    onChange={(e) => setNewItemName(e.target.value)} 
                    required 
                    className="h-11 px-3.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]" 
                    placeholder="e.g. iPhone 14 Silicon Case" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown 
                    options={CATEGORY_OPTIONS}
                    value={newCategory}
                    onChange={setNewCategory}
                    placeholder="Select category..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      step="1"
                      value={newQty} 
                      onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))} 
                      required 
                      className="h-11 px-3.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0561FC]" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Unit Price (₦) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-mono">₦</span>
                      <input 
                        type="number" 
                        min="0.01"
                        step="0.01" 
                        value={newPrice || ""} 
                        onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)} 
                        required 
                        className="h-11 pl-8 pr-3.5 w-full rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0561FC]" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Card', 'Cash', 'Transfer'].map((method) => (
                      <button 
                        key={method} 
                        type="button" 
                        onClick={() => setNewPaymentMethod(method)} 
                        className={cn(
                          "min-h-[44px] px-3 border rounded-xl text-sm font-semibold transition-colors",
                          newPaymentMethod === method ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Status</label>
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                      className="h-11 px-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0561FC] bg-white"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Part-paid">Part-paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  {newPaymentStatus === "Part-paid" && (
                    <div className="flex flex-col gap-1.5 animate-in fade-in">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount Paid (₦)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max={Number(newQty) * Number(newPrice)}
                        value={newAmountPaid} 
                        onChange={(e) => setNewAmountPaid(parseFloat(e.target.value) || 0)} 
                        required 
                        className="h-11 px-3.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0561FC]" 
                      />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Total Invoice Amount</span>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{formatNaira(Number(newQty) * Number(newPrice))}</p>
                  </div>
                  {newPaymentStatus === "Part-paid" && (
                    <div className="text-right">
                      <span className="text-xs text-rose-600 font-semibold">Balance Due</span>
                      <p className="text-base sm:text-lg font-bold text-rose-700">{formatNaira((Number(newQty) * Number(newPrice)) - newAmountPaid)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer for Save / Cancel */}
              <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 shrink-0 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewSaleOpen(false)}
                  className="min-h-[44px] px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors shadow-sm"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Sales Invoice Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] animate-in slide-in-from-bottom duration-200">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0 bg-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Edit Invoice</h2>
                <p className="text-xs font-mono text-gray-500">#{editingSale.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingSale(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSale} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Name</label>
                  <input 
                    type="text" 
                    value={editingSale.item || ""} 
                    onChange={(e) => setEditingSale({ ...editingSale, item: e.target.value })} 
                    required 
                    className="h-11 px-3.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-[#0561FC]" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</label>
                  <CustomDropdown 
                    options={CATEGORY_OPTIONS}
                    value={editingSale.category || "Accessories"}
                    onChange={(val) => setEditingSale({ ...editingSale, category: val })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      step="1"
                      value={editingSale.qty || 1} 
                      onChange={(e) => setEditingSale({ ...editingSale, qty: Math.max(1, parseInt(e.target.value) || 1) })} 
                      required 
                      className="h-11 px-3.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0561FC]" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Price (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-mono">₦</span>
                      <input 
                        type="number" 
                        min="0.01"
                        step="0.01" 
                        value={editingSale.unitPrice || ""} 
                        onChange={(e) => setEditingSale({ ...editingSale, unitPrice: parseFloat(e.target.value) || 0 })} 
                        required 
                        className="h-11 pl-8 pr-3.5 w-full rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0561FC]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Method</label>
                    <select
                      value={editingSale.paymentMethod || "Card"}
                      onChange={(e) => setEditingSale({ ...editingSale, paymentMethod: e.target.value })}
                      className="h-11 px-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 bg-white"
                    >
                      <option value="Card">Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Status</label>
                    <select
                      value={editingSale.paymentStatus || "Paid"}
                      onChange={(e) => {
                        const newStat = e.target.value;
                        const tot = (editingSale.qty || 1) * (editingSale.unitPrice || 0);
                        setEditingSale({ 
                          ...editingSale, 
                          paymentStatus: newStat,
                          amountPaid: newStat === "Paid" ? tot : (newStat === "Unpaid" ? 0 : editingSale.amountPaid)
                        });
                      }}
                      className="h-11 px-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 bg-white"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Part-paid">Part-paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>

                {editingSale.paymentStatus === "Part-paid" && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount Paid (₦)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={editingSale.amountPaid || 0} 
                      onChange={(e) => setEditingSale({ ...editingSale, amountPaid: parseFloat(e.target.value) || 0 })} 
                      className="h-11 px-3.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0561FC]" 
                    />
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Updated Total</span>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{formatNaira((editingSale.qty || 1) * (editingSale.unitPrice || 0))}</p>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 shrink-0 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="min-h-[44px] px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Single Invoice Details Modal & Receipt */}
      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* MODAL 4: Single Delete Confirmation */}
      {deletingSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Invoice</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete invoice <span className="font-mono font-semibold text-gray-900">#{deletingSaleId}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={() => setDeletingSaleId(null)}
                className="flex-1 min-h-[44px] flex items-center justify-center bg-white border border-gray-300 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="flex-1 min-h-[44px] flex items-center justify-center bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Bulk Delete Confirmation */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bulk Delete Invoices</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-bold text-red-600">{selectedIds.length}</span> selected invoices? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={() => setIsBulkDeleting(false)}
                className="flex-1 min-h-[44px] flex items-center justify-center bg-white border border-gray-300 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmBulkDelete}
                className="flex-1 min-h-[44px] flex items-center justify-center bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete All ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
