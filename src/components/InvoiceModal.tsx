import { Cancel01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "./HugeIcon";

interface InvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:bg-white print:backdrop-blur-none">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none"
      >
        {/* Header - hidden when printing */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex justify-between items-center print:hidden">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Invoice Details</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium hover:bg-gray-50 text-[#1A1A1A] transition-colors"
            >
              <HugeIcon icon={PrinterIcon} className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-[#71717A] hover:text-[#1A1A1A] hover:bg-gray-50 rounded-lg transition-colors"
            >
              <HugeIcon icon={Cancel01Icon} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="invoice-print-area" className="p-8 overflow-y-auto print:overflow-visible">
          <div className="flex justify-between items-start mb-8">
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
            <div className="text-right">
              <h2 className="text-2xl font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">Invoice</h2>
              <p className="text-sm font-medium text-[#1A1A1A]">#{invoice.id}</p>
              <p className="text-sm text-[#71717A] mt-1">Date: {invoice.date}</p>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAFAFA] text-[#71717A] uppercase text-[10px] font-bold tracking-wider border-y border-[#E5E5E5]">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                <tr>
                  <td className="px-4 py-4">
                    <div className="font-medium text-[#1A1A1A]">{invoice.item}</div>
                    <div className="text-xs text-[#71717A] mt-0.5">{invoice.category}</div>
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-[#1A1A1A]">{invoice.qty}</td>
                  <td className="px-4 py-4 text-right font-medium text-[#1A1A1A]">${(invoice.amount / invoice.qty).toFixed(2)}</td>
                  <td className="px-4 py-4 text-right font-medium text-[#1A1A1A]">${invoice.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-8">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm text-[#71717A]">
                <span>Subtotal</span>
                <span>${invoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#71717A]">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1A1A1A] pt-3 border-t border-[#E5E5E5]">
                <span>Total</span>
                <span>${invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#E5E5E5] text-center text-xs text-[#71717A]">
            <p className="font-medium text-[#1A1A1A] mb-1">Thank you for your business!</p>
            <p>Payment Method: {invoice.paymentMethod}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
