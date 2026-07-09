import fs from 'fs';
let content = fs.readFileSync('src/pages/Sales.tsx', 'utf8');

const regex = /export default function Sales\(\) \{[\s\S]*?const INVOICE_FILTER_OPTIONS = \[/;
const replacement = `export default function Sales() {
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
      console.error("Sales snapshot error:", error);
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

  const INVOICE_FILTER_OPTIONS = [`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Sales.tsx', content);
