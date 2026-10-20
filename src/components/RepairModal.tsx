import { X, Printer, Clock } from "lucide-react";
import { formatNaira, cn } from "../lib/utils";

interface RepairModalProps {
  repair: any;
  onClose: () => void;
}

export default function RepairModal({ repair, onClose }: RepairModalProps) {
  if (!repair) return null;

  const cost = Number(repair.cost || 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Collected":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const statusHistory = Array.isArray(repair.statusHistory) ? repair.statusHistory : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/50 backdrop-blur-sm print:bg-white print:backdrop-blur-none p-0 sm:p-4">
      <div 
        className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] print:h-auto print:max-h-none print:shadow-none print:rounded-none animate-in slide-in-from-bottom duration-200"
      >
        {/* Header - hidden when printing */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-gray-200 flex justify-between items-center print:hidden shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Repair Job Details</h2>
            <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border", getStatusBadge(repair.status))}>
              {repair.status}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-900 transition-colors min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="repair-print-area" className="p-4 sm:p-8 overflow-y-auto flex-1 print:overflow-visible text-gray-900 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-gray-100 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">DeRoyal Tech</h1>
              </div>
              <p className="text-xs text-gray-600">Repair & Maintenance Service Center</p>
              <p className="text-xs text-gray-600 mt-1">support@deroyaltech.com</p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 uppercase tracking-wider">Job Ticket</h2>
              <p className="text-sm font-mono font-bold text-[#0561FC] mt-0.5">#{repair.id}</p>
              <p className="text-xs text-gray-600 mt-1">
                Date: {repair.createdAt?.toDate ? repair.createdAt.toDate().toLocaleDateString() : 'N/A'}
              </p>
              <div className="mt-2">
                <span className={cn("inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border uppercase tracking-wider", getStatusBadge(repair.status))}>
                  {repair.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-3">Customer Information</th>
                  <th className="px-3 sm:px-4 py-3">Device & Problem Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 sm:px-4 py-4 align-top w-1/2">
                    <div className="font-semibold text-gray-900 mb-1">{repair.customer}</div>
                    <div className="text-xs text-gray-600">{repair.phone}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-4 align-top w-1/2">
                    <div className="font-semibold text-gray-900 mb-1">{repair.device}</div>
                    <div className="text-xs text-gray-600 whitespace-pre-wrap">{repair.issue || "None specified"}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-72 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Estimated Repair Cost</span>
                <span className="text-[#0561FC] text-base font-bold">{formatNaira(cost)}</span>
              </div>
            </div>
          </div>

          {/* Status History (visible on screen and in print) */}
          {statusHistory.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Status History
              </h3>
              <div className="space-y-2">
                {statusHistory.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-semibold border", getStatusBadge(item.status))}>
                        {item.status}
                      </span>
                      {item.updatedBy && <span className="text-gray-600">by {item.updatedBy}</span>}
                    </div>
                    <span className="text-gray-500 font-mono text-xs">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
            <p className="font-semibold text-gray-900 mb-1">Thank you for choosing DeRoyal Tech!</p>
            <p>Please present this receipt ticket when picking up your repaired device.</p>
          </div>
        </div>

        {/* Sticky Mobile Footer */}
        <div className="sm:hidden p-3.5 border-t border-gray-200 bg-white flex items-center justify-end gap-2 shrink-0 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Ticket
          </button>
          <button 
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
