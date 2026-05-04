import { useState } from "react";
import { HugeIcon } from "../components/HugeIcon";
import { Settings01Icon, Add01Icon, CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("staff");
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Settings</h1>
        <p className="text-[#71717A] mt-1 text-sm">Manage your team, permissions, and dashboard preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                activeTab === "staff"
                  ? "bg-white text-[#1A1A1A] shadow-sm border border-[#E5E5E5]"
                  : "text-[#71717A] hover:bg-white hover:text-[#1A1A1A] border border-transparent"
              }`}
            >
              Staff & Permissions
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-white text-[#1A1A1A] shadow-sm border border-[#E5E5E5]"
                  : "text-[#71717A] hover:bg-white hover:text-[#1A1A1A] border border-transparent"
              }`}
            >
              Dashboard View
            </button>
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === "staff" && (
            <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Sales Staff</h2>
                  <p className="text-sm text-[#71717A] mt-1">Manage user accounts and their roles.</p>
                </div>
                <button className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-black transition-colors">
                   {/* Using Settings01Icon temporarily, need a Plus icon or Add Team */}
                  Add New Staff
                </button>
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider bg-[#FAFAFA] border-b border-[#E5E5E5]">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    <tr className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4 font-medium text-[#1A1A1A]">Admin User</td>
                      <td className="px-6 py-4 text-[#71717A]">admin@admin.com</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#FFF9EA] text-[#D97706]">
                          Admin
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[#10B981] text-xs font-medium">
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4 font-medium text-[#1A1A1A]">Staff User</td>
                      <td className="px-6 py-4 text-[#71717A]">staff@staff.com</td>
                      <td className="px-6 py-4">
                         <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#F5F5F5] text-[#71717A]">
                          Staff
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[#10B981] text-xs font-medium">
                          Active
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden p-6">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Customize Dashboard</h2>
              <p className="text-sm text-[#71717A] mt-1 mb-6">Select which widgets are visible on the main dashboard.</p>
              
              <div className="space-y-4">
                {['Total Revenue', 'Open Repairs', 'Completed Jobs', 'New Sales', 'Sales Analytics Chart', 'Recent Transactions'].map((widget, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[#E5E5E5]">
                    <div className="font-medium text-[#1A1A1A]">{widget}</div>
                    <div className="w-10 h-5 bg-[#10B981] rounded-full flex items-center p-0.5 justify-end cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
