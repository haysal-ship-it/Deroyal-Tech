import { useState, useEffect, FormEvent } from "react";
import { createPortal } from "react-dom";
import { db } from "../lib/firebase";
import { collection, runTransaction, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Pencil, MoreVertical, Trash2, Eye, X, Check, Clock, Activity, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useSearch } from "../context/SearchContext";
import RepairModal from "../components/RepairModal";
import { cn, formatNaira, isValidNigerianPhone } from "../lib/utils";
import { CustomDropdown } from "../components/CustomDropdown";
import { logActivity } from "../lib/activityLogger";

const TABS = ["All", "Pending", "In Progress", "Completed", "Collected"];

export default function Repairs() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { searchQuery } = useSearch();

  const isRepairFull = user?.role === 'Admin' || user?.permissions?.Repair === 'Full';
  const isAdmin = user?.role === 'Admin';

  const [viewingRepair, setViewingRepair] = useState<any>(null);
  const [editingRepair, setEditingRepair] = useState<any>(null);
  const [dropdownConfig, setDropdownConfig] = useState<{ id: string, top: number, right: number } | null>(null);
  const [deletingRepairId, setDeletingRepairId] = useState<string | null>(null);

  // Form state for logging new job
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [issue, setIssue] = useState("");
  const [cost, setCost] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>("Pending");

  // Repairs list
  const [repairs, setRepairs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-dropdown-container') && !(e.target as Element).closest('.portal-dropdown')) {
        setDropdownConfig(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    const handleScroll = () => setDropdownConfig(null);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setRepairs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      if (err.code !== 'permission-denied') {
        console.error("Repairs snapshot error:", err);
      }
    });
    return unsub;
  }, []);

  const handleDeleteRepair = (id: string) => {
    if (!isAdmin) return;
    setDeletingRepairId(id);
    setDropdownConfig(null);
  };

  const confirmDelete = async () => {
    if (!deletingRepairId) return;
    try {
      const repairToDelete = repairs.find(r => r.id === deletingRepairId);
      await deleteDoc(doc(db, "repairs", deletingRepairId));

      await logActivity({
        action: 'Repair Deleted',
        actorUid: user?.uid || 'admin',
        actorName: user?.name || user?.username || 'Admin',
        actorRole: user?.role || 'Admin',
        targetId: deletingRepairId,
        targetName: repairToDelete ? `#${repairToDelete.jobId}` : deletingRepairId,
        details: repairToDelete 
          ? `Deleted repair job #${repairToDelete.jobId} (${repairToDelete.device}, Customer: ${repairToDelete.customer})`
          : `Deleted repair job ${deletingRepairId}`
      });

      setDeletingRepairId(null);
      toastSuccess("Repair job deleted successfully");
    } catch (err) {
      console.error(err);
      toastError("Error deleting repair job");
    }
  };

  const handleLogJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      toastError("Customer name is required");
      return;
    }
    if (!phone.trim()) {
      toastError("Phone number is required");
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      toastError("Please enter a valid Nigerian phone number (e.g. 0803 000 0000 or +234...)");
      return;
    }
    if (!deviceType.trim()) {
      toastError("Device type is required");
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "repairs");
        const counterSnap = await transaction.get(counterRef);
        let nextCount = 1;
        if (counterSnap.exists()) {
          nextCount = (counterSnap.data().count || 0) + 1;
        }
        const jobId = `DRT-${String(nextCount).padStart(5, '0')}`;
        const newJobRef = doc(db, "repairs", jobId);

        const initialHistory = [{
          status: jobStatus,
          timestamp: new Date().toISOString(),
          updatedBy: user?.name || user?.email || 'Staff'
        }];

        transaction.set(counterRef, { count: nextCount });
        transaction.set(newJobRef, {
          customer: customer.trim(),
          phone: phone.trim(),
          device: deviceType.trim(),
          issue: issue.trim(),
          cost: Number(cost) || 0,
          status: jobStatus,
          statusHistory: initialHistory,
          createdAt: serverTimestamp()
        });
      });

      setCustomer("");
      setPhone("");
      setDeviceType("");
      setIssue("");
      setCost(0);
      setJobStatus("Pending");
      toastSuccess("Repair job logged successfully!");
    } catch (err) {
      console.error(err);
      toastError("Error logging repair job");
    }
  };

  // Full Edit Submission
  const handleSaveEditRepair = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRepair) return;

    if (!editingRepair.customer?.trim()) {
      toastError("Customer name is required");
      return;
    }
    if (!editingRepair.phone?.trim()) {
      toastError("Phone number is required");
      return;
    }
    if (!isValidNigerianPhone(editingRepair.phone)) {
      toastError("Please enter a valid Nigerian phone number (e.g. 0803 000 0000)");
      return;
    }
    if (!editingRepair.device?.trim()) {
      toastError("Device type is required");
      return;
    }

    try {
      const origRepair = repairs.find(r => r.id === editingRepair.id);
      let updatedHistory = Array.isArray(origRepair?.statusHistory) ? [...origRepair.statusHistory] : [];

      // If status changed, record timestamped status entry
      if (origRepair && origRepair.status !== editingRepair.status) {
        updatedHistory.push({
          status: editingRepair.status,
          timestamp: new Date().toISOString(),
          updatedBy: user?.name || user?.email || 'Staff'
        });
      }

      await updateDoc(doc(db, "repairs", editingRepair.id), {
        customer: editingRepair.customer.trim(),
        phone: editingRepair.phone.trim(),
        device: editingRepair.device.trim(),
        issue: editingRepair.issue?.trim() || "",
        cost: Number(editingRepair.cost) || 0,
        status: editingRepair.status,
        statusHistory: updatedHistory,
        updatedAt: serverTimestamp()
      });

      setEditingRepair(null);
      toastSuccess("Repair job updated successfully!");
    } catch (err) {
      console.error(err);
      toastError("Error updating repair job");
    }
  };

  const STATUS_OPTIONS = [
    { value: "Pending", label: "Pending", icon: <Clock size={16} />, iconColor: "text-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-600" },
    { value: "In Progress", label: "In Progress", icon: <Activity size={16} />, iconColor: "text-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-600" },
    { value: "Completed", label: "Completed", icon: <Check size={16} />, iconColor: "text-green-500", bgColor: "bg-green-50", textColor: "text-green-600" },
    { value: "Collected", label: "Collected", icon: <Check size={16} />, iconColor: "text-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-600" },
  ];

  const getDotColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-orange-400";
      case "In Progress":
        return "bg-blue-500";
      case "Completed":
        return "bg-green-500";
      case "Collected":
        return "bg-purple-500";
      default:
        return "bg-gray-400";
    }
  };

  // Filter repairs by Tab and Header Search Query
  const filteredRepairs = repairs.filter((repair) => {
    if (activeTab !== "All" && repair.status !== activeTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = repair.id?.toLowerCase().includes(q);
      const matchCust = repair.customer?.toLowerCase().includes(q);
      const matchPhone = repair.phone?.toLowerCase().includes(q);
      const matchDev = repair.device?.toLowerCase().includes(q);
      const matchIssue = repair.issue?.toLowerCase().includes(q);
      const matchStatus = repair.status?.toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchPhone && !matchDev && !matchIssue && !matchStatus) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">Repair Jobs</h1>
          <p className="text-sm text-[#71717A] font-medium">Log devices, update progress, and track repair queues.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Log Job Form Card (Hidden if user is View-only) */}
        {isRepairFull && (
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Log New Job</h2>
            
            <form onSubmit={handleLogJob} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="customer" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input 
                  id="customer" 
                  type="text" 
                  value={customer} 
                  onChange={e => setCustomer(e.target.value)} 
                  required 
                  className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" 
                  placeholder="e.g. Adebayo Ogunlesi" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input 
                  id="phone" 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" 
                  placeholder="0803 000 0000" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="deviceType" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                  Device Type <span className="text-red-500">*</span>
                </label>
                <input 
                  id="deviceType" 
                  type="text" 
                  value={deviceType} 
                  onChange={e => setDeviceType(e.target.value)} 
                  required 
                  className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" 
                  placeholder="e.g. iPhone 13 Pro Max" 
                />
              </div>

              <div className="flex flex-col gap-1.5 lg:col-span-3">
                <label htmlFor="issue" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Reported Issue</label>
                <input 
                  id="issue" 
                  type="text" 
                  value={issue} 
                  onChange={e => setIssue(e.target.value)} 
                  className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" 
                  placeholder="Describe screen damage, battery issue, etc..." 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cost" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Est. Cost (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] font-mono">₦</span>
                  <input 
                    id="cost" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={cost || ""} 
                    onChange={e => setCost(parseFloat(e.target.value) || 0)} 
                    className="h-10 pl-8 pr-3 w-full rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="jobStatus" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Initial Status</label>
                <CustomDropdown 
                  options={STATUS_OPTIONS}
                  value={jobStatus}
                  onChange={setJobStatus}
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="w-full h-10 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-black transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  Log Job
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Jobs Table Box */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-[#E5E5E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#1A1A1A] text-lg">Repair Queue</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                {filteredRepairs.length}
              </span>
            </div>
            <div className="flex bg-[#F5F5F5] p-1 border border-[#E5E5E5] rounded-xl overflow-x-auto whitespace-nowrap max-w-full hide-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                    activeTab === tab
                      ? "bg-white text-[#1A1A1A] shadow-sm"
                      : "text-[#71717A] hover:text-[#1A1A1A]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[13px] text-[#1A1A1A] min-w-[850px]">
              <thead className="text-[#8B8D97] font-medium border-b border-[#E5E5E5] bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 font-normal">Job ID</th>
                  <th className="px-6 py-4 font-normal">Customer</th>
                  <th className="px-6 py-4 font-normal">Phone</th>
                  <th className="px-6 py-4 font-normal">Device</th>
                  <th className="px-6 py-4 font-normal">Issue</th>
                  <th className="px-6 py-4 font-normal text-right">Est. Cost</th>
                  <th className="px-6 py-4 font-normal">Status</th>
                  <th className="px-6 py-4 font-normal text-right text-transparent whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-[#8B8D97]">{repair.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{repair.customer}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{repair.phone}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{repair.device}</td>
                    <td className="px-6 py-4 text-[#71717A] max-w-[200px] truncate" title={repair.issue}>
                      {repair.issue || "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatNaira(repair.cost)}</td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", getDotColor(repair.status))} />
                        <span className="capitalize">{repair.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3 text-[#A1A1AA] transition-opacity relative action-dropdown-container">
                        {/* Edit Button: Full edit modal */}
                        {isRepairFull && (
                          <button 
                            type="button"
                            onClick={() => setEditingRepair({ ...repair })} 
                            className="hover:text-[#1A1A1A] p-1 rounded-md transition-colors" 
                            title="Edit Repair Job"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* More options dropdown button */}
                        <button 
                          type="button"
                          onClick={(e) => { 
                            const rect = e.currentTarget.getBoundingClientRect(); 
                            setDropdownConfig(dropdownConfig?.id === repair.id ? null : { id: repair.id, top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right }); 
                          }} 
                          className="hover:text-[#1A1A1A] p-1 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {dropdownConfig?.id === repair.id && createPortal(
                          <div 
                            className="fixed z-[9999] w-36 bg-white border border-[#E5E5E5] rounded-xl shadow-lg overflow-hidden portal-dropdown py-1"
                            style={{ top: dropdownConfig.top + 4, right: dropdownConfig.right }}
                          >
                            <button 
                              type="button"
                              onClick={() => { setViewingRepair(repair); setDropdownConfig(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-[#1A1A1A] hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> Full view
                            </button>
                            {isAdmin && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteRepair(repair.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            )}
                          </div>,
                          document.body
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRepairs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#71717A] font-medium">
                      No repair jobs found matching the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: View Repair Details & Print Ticket */}
      {viewingRepair && (
        <RepairModal repair={viewingRepair} onClose={() => setViewingRepair(null)} />
      )}

      {/* MODAL 2: Full Edit Repair Job */}
      {editingRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Edit Repair Job</h2>
                <p className="text-xs font-mono text-gray-500">#{editingRepair.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingRepair(null)} 
                className="p-2 text-[#71717A] hover:text-[#1A1A1A] hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRepair} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Customer Name</label>
                  <input 
                    type="text" 
                    value={editingRepair.customer || ""} 
                    onChange={e => setEditingRepair({ ...editingRepair, customer: e.target.value })} 
                    required 
                    className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="tel" 
                    value={editingRepair.phone || ""} 
                    onChange={e => setEditingRepair({ ...editingRepair, phone: e.target.value })} 
                    required 
                    placeholder="0803 000 0000"
                    className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Device</label>
                  <input 
                    type="text" 
                    value={editingRepair.device || ""} 
                    onChange={e => setEditingRepair({ ...editingRepair, device: e.target.value })} 
                    required 
                    className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Estimated Cost (₦)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] font-mono">₦</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={editingRepair.cost || ""} 
                      onChange={e => setEditingRepair({ ...editingRepair, cost: parseFloat(e.target.value) || 0 })} 
                      className="h-10 pl-8 pr-3 w-full rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A]" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Reported Issue</label>
                <textarea 
                  rows={3}
                  value={editingRepair.issue || ""} 
                  onChange={e => setEditingRepair({ ...editingRepair, issue: e.target.value })} 
                  className="px-3 py-2 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Status</label>
                <select
                  value={editingRepair.status}
                  onChange={e => setEditingRepair({ ...editingRepair, status: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingRepair(null)}
                  className="px-5 py-2.5 border border-[#E5E5E5] text-[#1A1A1A] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deletingRepairId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Delete Repair Job</h3>
            <p className="text-sm text-[#71717A] mb-6">
              Are you sure you want to delete repair job <span className="font-mono font-semibold text-gray-900">#{deletingRepairId}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={() => setDeletingRepairId(null)}
                className="flex-1 h-10 flex items-center justify-center bg-white border border-[#E5E5E5] text-[#1A1A1A] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="flex-1 h-10 flex items-center justify-center bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
