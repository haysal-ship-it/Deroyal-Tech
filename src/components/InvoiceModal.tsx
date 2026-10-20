import { X, Printer } from "lucide-react";
import { formatNaira, cn } from "../lib/utils";

interface InvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  if (!invoice) return null;

  const totalAmount = Number(invoice.amount) || 0;
  const paymentStatus = invoice.paymentStatus || 'Paid';
  const amountPaid = invoice.amountPaid !== undefined ? Number(invoice.amountPaid) : totalAmount;
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  const getStatusBadge = (status: string) => {
    switch (status) {
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/50 backdrop-blur-sm print:bg-white print:backdrop-blur-none p-0 sm:p-4">
      <div 
        className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] print:h-auto print:max-h-none print:shadow-none print:rounded-none animate-in slide-in-from-bottom duration-200"
      >
        {/* Header - hidden when printing */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-gray-200 flex justify-between items-center print:hidden shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Invoice Details</h2>
            <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border", getStatusBadge(paymentStatus))}>
              {paymentStatus}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-900 transition-colors min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button 
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div id="invoice-print-area" className="p-4 sm:p-8 overflow-y-auto flex-1 print:overflow-visible text-gray-900 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-gray-100 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">DeRoyal Tech</h1>
              </div>
              <p className="text-xs text-gray-600">Computer & Smartphone Sales & Repairs</p>
              <p className="text-xs text-gray-600 mt-1">support@deroyaltech.com</p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 uppercase tracking-wider">Sales Receipt</h2>
              <p className="text-sm font-mono font-bold text-[#0561FC] mt-0.5">#{invoice.id}</p>
              <p className="text-xs text-gray-600 mt-1">Date: {invoice.date}</p>
              <div className="mt-2">
                <span className={cn("inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border uppercase tracking-wider", getStatusBadge(paymentStatus))}>
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[300px]">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold tracking-wider border-y border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-3">Description</th>
                  <th className="px-3 sm:px-4 py-3 text-center">Qty</th>
                  <th className="px-3 sm:px-4 py-3 text-right">Unit Price</th>
                  <th className="px-3 sm:px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 sm:px-4 py-4">
                    <div className="font-semibold text-gray-900">{invoice.item}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{invoice.category}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-4 text-center font-medium text-gray-900">{invoice.qty}</td>
                  <td className="px-3 sm:px-4 py-4 text-right font-medium text-gray-900">{formatNaira(totalAmount / (invoice.qty || 1))}</td>
                  <td className="px-3 sm:px-4 py-4 text-right font-bold text-gray-900">{formatNaira(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-72 space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total Amount</span>
                <span className="font-semibold text-gray-900">{formatNaira(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Amount Paid</span>
                <span className="font-semibold text-emerald-700">{formatNaira(amountPaid)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Balance Due</span>
                <span className="font-semibold text-rose-700">{formatNaira(balanceDue)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2.5 border-t border-gray-200">
                <span>Payment Method</span>
                <span>{invoice.paymentMethod || 'Cash'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
            <p className="font-semibold text-gray-900 mb-1">Thank you for your purchase!</p>
            <p>Retain this receipt as your official proof of payment.</p>
          </div>
        </div>

        {/* Sticky Mobile Footer */}
        <div className="sm:hidden p-3.5 border-t border-gray-200 bg-white flex items-center justify-end gap-2 shrink-0 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
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
