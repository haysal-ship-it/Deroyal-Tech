import { X, Printer } from "lucide-react";

interface RepairModalProps {
  repair: any;
  onClose: () => void;
}

export default function RepairModal({ repair, onClose }: RepairModalProps) {
  if (!repair) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:bg-white print:backdrop-blur-none">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none"
      >
        {/* Header - hidden when printing */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex justify-between items-center print:hidden">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Repair Details</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium hover:bg-gray-50 text-[#1A1A1A] transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-[#71717A] hover:text-[#1A1A1A] hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="repair-print-area" className="p-4 sm:p-8 overflow-y-auto print:overflow-visible">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">DeRoyalTech</h1>
              </div>
              <p className="text-sm text-[#71717A]">123 Tech Avenue, Suite 100</p>
              <p className="text-sm text-[#71717A]">San Francisco, CA 94105</p>
              <p className="text-sm text-[#71717A]">contact@deroyaltech.com</p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-2xl font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">Repair Job</h2>
              <p className="text-sm font-medium text-[#1A1A1A]">#{repair.id}</p>
              <p className="text-sm text-[#71717A] mt-1">Status: {repair.status}</p>
              <p className="text-sm text-[#71717A] mt-1">Logged: {repair.createdAt ? new Date(repair.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="mt-8 border border-[#E5E5E5] rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAFAFA] text-[#71717A] uppercase text-[10px] font-bold tracking-wider border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-4 py-3">Customer Info</th>
                  <th className="px-4 py-3">Device Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                <tr>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-[#1A1A1A] mb-1">{repair.customer}</div>
                    <div className="text-xs text-[#71717A]">{repair.phone}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-[#1A1A1A] mb-1">{repair.device}</div>
                    <div className="text-xs text-[#71717A]">{repair.issue}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-8">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-base font-bold text-[#1A1A1A] pt-3 border-t border-[#E5E5E5]">
                <span>Estimated Cost</span>
                <span>₦{Number(repair.cost || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#E5E5E5] text-center text-xs text-[#71717A]">
            <p className="font-medium text-[#1A1A1A] mb-1">Thank you for choosing DeRoyalTech!</p>
            <p>Please bring this receipt when collecting your device.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
