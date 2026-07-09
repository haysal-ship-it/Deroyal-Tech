import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Plus, Receipt, Pencil, MoreVertical, Eye } from "lucide-react";
import InvoiceModal from "../components/InvoiceModal";
import { cn } from "../lib/utils";
import { CustomDropdown } from "../components/CustomDropdown";
import { Headphones, Smartphone, Laptop, Settings, TriangleAlert, Layers, Clock, Calendar, Wallet, Filter } from "lucide-react";

export default function Sales() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [category, setCategory] = useState<string>("");
  const [invoiceFilter, setInvoiceFilter] = useState<string>("outstanding");

  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Snapshot error:", error);
      }
    });
    return unsub;
  }, []);

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;
    try {
      await addDoc(collection(db, "sales"), {
        item: itemName,
        category: category || "Accessories",
        qty: Number(qty),
        amount: Number(qty) * Number(price),
        paymentMethod,
        date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
        createdAt: serverTimestamp()
      });
      setItemName("");
      setQty(1);
      setPrice(0);
    } catch (err) {
      console.error(err);
      alert("Error recording sale");
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
    { value: "outstanding", label: "Outstanding invoices", icon: <TriangleAlert size={16} />, iconColor: "text-[#F15F36]", bgColor: "bg-[#FFF4ED]", textColor: "text-[#F15F36]" },
    { value: "overdue", label: "Overdue", icon: <Clock size={16} />, iconColor: "text-[#1A1A1A]", bgColor: "bg-gray-100", textColor: "text-[#1A1A1A]" },
    { value: "scheduled", label: "Scheduled", icon: <Calendar size={16} />, iconColor: "text-[#1A1A1A]", bgColor: "bg-gray-100", textColor: "text-[#1A1A1A]" },
    { value: "paid", label: "Paid", icon: <Wallet size={16} />, iconColor: "text-[#1A1A1A]", bgColor: "bg-gray-100", textColor: "text-[#1A1A1A]" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full h-full pb-[40px]">
      {/* Header section with Actions */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">Sales</h1>
          <p className="text-sm text-[#71717A] font-medium">Create invoices and view sales history.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-[#1A1A1A]">
            <Receipt className="w-4 h-4" />
            View Invoices
          </button>
          <button className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-black">
            <Plus className="w-4 h-4" />
            New Sales Invoice
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Sales Entry Form Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Record New Sale</h2>
          
          <form onSubmit={handleRecordSale} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label htmlFor="itemName" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Item Name</label>
              <input id="itemName" type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} required className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] placeholder:text-[#A1A1AA]" placeholder="e.g. iPhone 14 Case" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Category</label>
              <CustomDropdown 
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
                placeholder="Select category..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="qty" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Quantity</label>
              <input id="qty" type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} required className="h-10 px-3 rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="price" className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Unit Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] font-mono">₦</span>
                <input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required className="h-10 pl-7 pr-3 w-full rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] placeholder:text-[#A1A1AA]" placeholder="0.00" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Payment Method</label>
              <div className="flex gap-2">
                {['Card', 'Cash', 'Transfer'].map((method) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`h-10 px-6 border rounded-lg text-sm font-medium transition-colors ${paymentMethod === method ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F5F5]'}`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex items-end justify-between lg:justify-end gap-6">
              <div className="flex flex-col mb-1 lg:mb-0 lg:text-right">
                <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Total</span>
                <span className="text-2xl font-bold text-[#1A1A1A] mt-1">₦{(Number(qty) * Number(price)).toFixed(2)}</span>
              </div>
              <button type="submit" className="h-10 px-6 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-black transition-colors whitespace-nowrap">
                Record Sale
              </button>
            </div>
          </form>
        </div>

        {/* Sales Table Box */}
        <div className="bg-white rounded-[24px] border border-[#E5E5E5] shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-[#E5E5E5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-[20px] font-bold text-[#1A1A1A]">Invoices</h2>
            <div className="flex items-center gap-2">
              <div className="w-[240px]">
                <CustomDropdown 
                  options={INVOICE_FILTER_OPTIONS}
                  value={invoiceFilter}
                  onChange={setInvoiceFilter}
                  placeholder="Select filter..."
                />
              </div>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                 <Filter size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[13px] text-[#1A1A1A]">
              <thead className="text-[#8B8D97] font-medium border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-6 py-4 w-12 font-normal"><input type="checkbox" className="w-4 h-4 rounded border-[#D1D1D1] text-[#1A1A1A] focus:ring-black" /></th>
                  <th className="px-6 py-4 font-normal">Invoice ID</th>
                  <th className="px-6 py-4 font-normal">Date</th>
                  <th className="px-6 py-4 font-normal whitespace-nowrap">Item & Category</th>
                  <th className="px-6 py-4 font-normal text-right">Qty</th>
                  <th className="px-6 py-4 font-normal text-right">Amount</th>
                  <th className="px-6 py-4 font-normal">Payment</th>
                  <th className="px-6 py-4 font-normal text-right text-transparent whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-[#D1D1D1] text-[#1A1A1A] focus:ring-black opacity-50 group-hover:opacity-100 transition-opacity" /></td>
                    <td className="px-6 py-4 text-[#8B8D97]">{sale.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#1A1A1A]">{sale.date}</td>
                    <td className="px-6 py-4 min-w-[180px]">
                      <div className="font-medium">{sale.item}</div>
                      <div className="text-[12px] text-[#A1A1AA] mt-0.5">{sale.category}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{sale.qty}</td>
                    <td className="px-6 py-4 text-right font-medium">₦{sale.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", sale.paymentMethod.toLowerCase() === "cash" ? "bg-green-500" : "bg-blue-500")} />
                        {sale.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedInvoice(sale)}
                          className="hover:text-[#1A1A1A]"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="hover:text-[#1A1A1A]">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="hover:text-[#1A1A1A]">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}
