import { useState, useEffect, FormEvent } from "react";
import { db } from "../lib/firebase";
import { collection, runTransaction, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Pencil, MoreVertical, Trash2, Eye, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import RepairModal from "../components/RepairModal";
import { cn } from "../lib/utils";
import { CustomDropdown } from "../components/CustomDropdown";
import { Clock, Activity, AlertTriangle } from "lucide-react";

const TABS = ["All", "Pending", "In Progress", "Completed", "Collected"];

export default function Repairs() {
  const { user } = useAuth();
  const [viewingRepair, setViewingRepair] = useState<any>(null);
  const [editingRepair, setEditingRepair] = useState<any>(null);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const [deletingRepairId, setDeletingRepairId] = useState<string | null>(null);
  
  const handleDeleteRepair = (id: string) => {
    if (user?.role !== 'Admin') return;
    setDeletingRepairId(id);
    setDropdownOpenId(null);
  };

  const confirmDelete = async () => {
    if (!deletingRepairId) return;
    try {
      await deleteDoc(doc(db, "repairs", deletingRepairId));
      setDeletingRepairId(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting repair job");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "repairs", id), { status: newStatus });
      setEditingRepair(null);
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-dropdown-container')) {
        setDropdownOpenId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const [activeTab, setActiveTab] = useState("All");
  const [jobStatus, setJobStatus] = useState<string>("Pending");

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [issue, setIssue] = useState("");
  const [cost, setCost] = useState(0);
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setRepairs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Repairs snapshot error:", err);
    });
    return unsub;
  }, []);

  const handleLogJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer || !deviceType) return;
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

        transaction.set(counterRef, { count: nextCount });
        transaction.set(newJobRef, {
          customer,
          phone,
          device: deviceType,
          issue,
          cost: Number(cost),
          status: jobStatus,
          createdAt: serverTimestamp()
        });
      });
      setCustomer("");
      setPhone("");
      setDeviceType("");
      setIssue("");
      setCost(0);
      setJobStatus("Pending");
      alert("Job logged successfully!");
    } catch (err) {
      console.error(err);
      alert("Error logging job");
    }
  };

  const filteredRepairs = repairs.filter((repair) => 
    activeTab === "All" ? true : repair.status === activeTab
  );

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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full h-full pb-[40px]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">Repair Jobs</h1>
          <p className="text-sm text-[#71717A] font-medium">Log and track customer devices.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Log Job Form Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Log New Job</h2>
          
          <form onSubmit={handleLogJob} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customer" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Customer Name</label>
              <input id="customer" type="text" value={customer} onChange={e => setCustomer(e.target.value)} required className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="First Last" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Phone Number</label>
              <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="(555) 000-0000" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="deviceType" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Device Type</label>
              <input id="deviceType" type="text" value={deviceType} onChange={e => setDeviceType(e.target.value)} required className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="e.g. iPhone 13 Pro" />
            </div>

            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label htmlFor="issue" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Reported Issue</label>
              <input id="issue" type="text" value={issue} onChange={e => setIssue(e.target.value)} required className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="Briefly describe the problem..." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cost" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Est. Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] font-mono">₦</span>
                <input id="cost" type="number" step="0.01" value={cost} onChange={e => setCost(Number(e.target.value))} required className="h-10 pl-7 pr-3 w-full rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="0.00" />
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
              <button type="submit" className="w-full h-10 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-black transition-colors">
                <Plus className="w-4 h-4" />
                Log Job
              </button>
            </div>
          </form>
        </div>

        {/* Jobs Table Box */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-[#1A1A1A]">Repair Queue</h2>
            <div className="flex bg-[#F5F5F5] p-1 border border-[#E5E5E5] rounded-lg overflow-x-auto whitespace-nowrap max-w-[calc(100vw-3rem)] sm:max-w-md hide-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors",
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
            <table className="w-full text-left text-[13px] text-[#1A1A1A] min-w-[800px]">
              <thead className="text-[#8B8D97] font-medium border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-6 py-4 w-12 font-normal"><input type="checkbox" className="w-4 h-4 rounded border-[#D1D1D1] text-[#1A1A1A] focus:ring-black" /></th>
                  <th className="px-6 py-4 font-normal">Job ID</th>
                  <th className="px-6 py-4 font-normal">Customer</th>
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
                    <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-[#D1D1D1] text-[#1A1A1A] focus:ring-black opacity-50 group-hover:opacity-100" /></td>
                    <td className="px-6 py-4 text-[#8B8D97]">{repair.id}</td>
                    <td className="px-6 py-4 font-medium">{repair.customer}</td>
                    <td className="px-6 py-4">{repair.device}</td>
                    <td className="px-6 py-4 text-[#71717A] max-w-[150px] truncate">{repair.issue}</td>
                    <td className="px-6 py-4 text-right font-medium">₦{repair.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", getDotColor(repair.status))} />
                        {repair.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3 text-[#A1A1AA] transition-opacity relative action-dropdown-container">
                        <button onClick={() => setEditingRepair(repair)} className="hover:text-[#1A1A1A]" title="Edit Status">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDropdownOpenId(dropdownOpenId === repair.id ? null : repair.id)} 
                          className="hover:text-[#1A1A1A]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {dropdownOpenId === repair.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 overflow-hidden">
                            <button 
                              onClick={() => { setViewingRepair(repair); setDropdownOpenId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-[#1A1A1A] hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> Full view
                            </button>
                            {user?.role === 'Admin' && (
                              <button 
                                onClick={() => handleDeleteRepair(repair.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRepairs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#71717A] font-medium">
                      No repair jobs found in this status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewingRepair && (
        <RepairModal repair={viewingRepair} onClose={() => setViewingRepair(null)} />
      )}

      {editingRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Update Status</h2>
              <button onClick={() => setEditingRepair(null)} className="p-2 text-[#71717A] hover:text-[#1A1A1A] hover:bg-gray-50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleUpdateStatus(editingRepair.id, opt.value)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left",
                    editingRepair.status === opt.value 
                      ? "bg-[#1A1A1A] text-white" 
                      : "hover:bg-gray-50 text-[#1A1A1A] border border-[#E5E5E5]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", opt.iconColor || "bg-gray-400")} />
                    {opt.label}
                  </div>
                  {editingRepair.status === opt.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {deletingRepairId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Delete Repair Job</h3>
            <p className="text-sm text-[#71717A] mb-6">
              Are you sure you want to delete this repair job? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeletingRepairId(null)}
                className="flex-1 h-10 flex items-center justify-center bg-white border border-[#E5E5E5] text-[#1A1A1A] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
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
