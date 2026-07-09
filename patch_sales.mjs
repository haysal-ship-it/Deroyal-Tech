import fs from 'fs';

let content = fs.readFileSync('src/pages/Sales.tsx', 'utf8');

// Replace imports
content = content.replace(
  'import { SALES_DATA } from "../data/mockData";',
  `import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";`
);

// Add missing React hooks if not there
if (!content.includes('useEffect')) {
  content = content.replace(
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";'
  );
}

// Replace Sales component body
content = content.replace(
  /export default function Sales\(\) \{\n  const \[category, setCategory\] = useState\("Accessories"\);\n  const \[invoiceFilter, setInvoiceFilter\] = useState\("All"\);\n  const \[selectedInvoice, setSelectedInvoice\] = useState<any \| null>\(null\);/,
  `export default function Sales() {
  const [category, setCategory] = useState("Accessories");
  const [invoiceFilter, setInvoiceFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;
    try {
      await addDoc(collection(db, "sales"), {
        item: itemName,
        category,
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
  };`
);

// Form replacement
content = content.replace(
  /<form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">/,
  `<form onSubmit={handleRecordSale} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">`
);

content = content.replace(
  /<input id="itemName" type="text"/,
  `<input id="itemName" type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} required`
);

content = content.replace(
  /<input id="qty" type="number" min="1" defaultValue="1"/,
  `<input id="qty" type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} required`
);

content = content.replace(
  /<input id="price" type="number" step="0\.01"/,
  `<input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required`
);

content = content.replace(
  /\{(\['Card', 'Cash', 'Transfer'\])\.map\(\(method\) => \(\n\s*<button key=\{method\} type="button"/g,
  `{['Card', 'Cash', 'Transfer'].map((method) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={\`h-10 px-6 border rounded-lg text-sm font-medium transition-colors \${paymentMethod === method ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F5F5]'}\`}>
                    {method}
                  </button>
                ))}`
);

// We need to clean out the old button mapping if it didn't match perfectly.
// Let's replace the block for payment methods
const paymentMethodBlockRegex = /\{(\['Card', 'Cash', 'Transfer'\])\.map\(\(method\) => \([\s\S]*?<\/button>\n\s*\)\)\}/;
content = content.replace(paymentMethodBlockRegex, 
`{['Card', 'Cash', 'Transfer'].map((method) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={\`h-10 px-6 border rounded-lg text-sm font-medium transition-colors \${paymentMethod === method ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F5F5]'}\`}>
                    {method}
                  </button>
                ))}`);

content = content.replace(
  /<span className="text-2xl font-bold text-\[#1A1A1A\] mt-1">₦0\.00<\/span>/,
  `<span className="text-2xl font-bold text-[#1A1A1A] mt-1">₦{(Number(qty) * Number(price)).toFixed(2)}</span>`
);

content = content.replace(
  /SALES_DATA/g,
  `sales`
);

fs.writeFileSync('src/pages/Sales.tsx', content);
