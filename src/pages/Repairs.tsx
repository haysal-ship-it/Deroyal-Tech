import { useState } from "react";
import { REPAIR_DATA } from "../data/mockData";
import { Add01Icon, PencilEdit02Icon, MoreIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "../components/HugeIcon";
import { cn } from "../lib/utils";
import { CustomDropdown } from "../components/CustomDropdown";
import { Clock, Activity } from "lucide-react";

const TABS = ["All", "Pending", "In Progress", "Completed", "Collected"];

export default function Repairs() {
  const [activeTab, setActiveTab] = useState("All");
  const [jobStatus, setJobStatus] = useState<string>("Pending");

  const STATUS_OPTIONS = [
    { value: "Pending", label: "Pending", icon: <Clock size={16} />, iconColor: "text-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-600" },
    { value: "In Progress", label: "In Progress", icon: <Activity size={16} />, iconColor: "text-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-600" },
  ];

  const filteredRepairs = REPAIR_DATA.filter((repair) => 
    activeTab === "All" ? true : repair.status === activeTab
  );

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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">Repair Jobs</h1>
          <p className="text-sm text-[#71717A] font-medium">Log and track customer devices.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Log Job Form Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Log New Job</h2>
          
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customer" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Customer Name</label>
              <input id="customer" type="text" className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="First Last" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Phone Number</label>
              <input id="phone" type="tel" className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="(555) 000-0000" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="deviceType" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Device Type</label>
              <input id="deviceType" type="text" className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="e.g. iPhone 13 Pro" />
            </div>

            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label htmlFor="issue" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Reported Issue</label>
              <input id="issue" type="text" className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="Briefly describe the problem..." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cost" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Est. Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] font-mono">$</span>
                <input id="cost" type="number" step="0.01" className="h-10 pl-7 pr-3 w-full rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" placeholder="0.00" />
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
                <HugeIcon icon={Add01Icon} className="w-4 h-4" />
                Log Job
              </button>
            </div>
          </form>
        </div>

        {/* Jobs Table Box */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
            <h2 className="font-semibold text-[#1A1A1A]">Repair Queue</h2>
            <div className="flex bg-[#F5F5F5] p-1 border border-[#E5E5E5] rounded-lg">
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
            <table className="w-full text-left text-[13px] text-[#1A1A1A]">
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
                    <td className="px-6 py-4 text-right font-medium">${repair.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", getDotColor(repair.status))} />
                        {repair.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="hover:text-[#1A1A1A]">
                          <HugeIcon icon={PencilEdit02Icon} className="w-4 h-4" />
                        </button>
                        <button className="hover:text-[#1A1A1A]">
                          <HugeIcon icon={MoreIcon} className="w-4 h-4" />
                        </button>
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
    </div>
  );
}
