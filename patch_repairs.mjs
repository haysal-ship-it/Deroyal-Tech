import fs from 'fs';

let content = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

content = content.replace(
  'import { REPAIR_DATA } from "../data/mockData";',
  `import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";`
);

if (!content.includes('useEffect')) {
  content = content.replace(
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";'
  );
}

// Extract component body part to replace
content = content.replace(
  /export default function Repairs\(\) \{\n  const \[activeTab, setActiveTab\] = useState\("All"\);\n  const \[jobStatus, setJobStatus\] = useState\("Pending"\);\n\n  const filteredRepairs = activeTab === "All" \? REPAIR_DATA : REPAIR_DATA\.filter\(r => r\.status === activeTab\);/,
  `export default function Repairs() {
  const [activeTab, setActiveTab] = useState("All");
  const [jobStatus, setJobStatus] = useState("Pending");

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
    });
    return unsub;
  }, []);

  const handleLogJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !deviceType) return;
    try {
      await addDoc(collection(db, "repairs"), {
        customer,
        phone,
        device: deviceType,
        issue,
        cost: Number(cost),
        status: jobStatus,
        createdAt: serverTimestamp()
      });
      setCustomer("");
      setPhone("");
      setDeviceType("");
      setIssue("");
      setCost(0);
      setJobStatus("Pending");
    } catch (err) {
      console.error(err);
      alert("Error logging job");
    }
  };

  const filteredRepairs = activeTab === "All" ? repairs : repairs.filter(r => r.status === activeTab);`
);


// Replace form
content = content.replace(
  /<form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">/,
  `<form onSubmit={handleLogJob} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`
);

content = content.replace(
  /<input id="customer" type="text" className="h-10 px-3/g,
  `<input id="customer" type="text" value={customer} onChange={e => setCustomer(e.target.value)} required className="h-10 px-3`
);

content = content.replace(
  /<input id="phone" type="tel" className="h-10 px-3/g,
  `<input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="h-10 px-3`
);

content = content.replace(
  /<input id="deviceType" type="text" className="h-10 px-3/g,
  `<input id="deviceType" type="text" value={deviceType} onChange={e => setDeviceType(e.target.value)} required className="h-10 px-3`
);

content = content.replace(
  /<input id="issue" type="text" className="h-10 px-3/g,
  `<input id="issue" type="text" value={issue} onChange={e => setIssue(e.target.value)} required className="h-10 px-3`
);

content = content.replace(
  /<input id="cost" type="number" step="0\.01" className="h-10 pl-7/g,
  `<input id="cost" type="number" step="0.01" value={cost} onChange={e => setCost(Number(e.target.value))} required className="h-10 pl-7`
);

fs.writeFileSync('src/pages/Repairs.tsx', content);
