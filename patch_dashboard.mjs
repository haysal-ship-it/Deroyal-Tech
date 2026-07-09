import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace mockData imports
content = content.replace(
  'import { MOCK_KPI_DATA, RECENT_ACTIVITY } from "../data/mockData";',
  `import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { useState, useEffect } from "react";`
);

content = content.replace(
  /export default function Dashboard\(\) \{/,
  `export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    const qSales = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'sale' })));
    });

    const qRepairs = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
    const unsubRepairs = onSnapshot(qRepairs, (snap) => {
      setRepairs(snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'repair' })));
    });

    return () => {
      unsubSales();
      unsubRepairs();
    };
  }, []);

  // Compute stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === todayStr || (s.createdAt && new Date(s.createdAt.toDate()).toISOString().split('T')[0] === todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  const openRepairs = repairs.filter(r => r.status !== 'Completed' && r.status !== 'Collected').length;
  const completedJobs = repairs.filter(r => r.status === 'Completed' || r.status === 'Collected').length;
  const newSales = todaySales.length;

  const allActivity = [...sales, ...repairs]
    .filter(a => a.createdAt)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, 4)
    .map(a => ({
      id: a.id,
      type: a._type,
      message: a._type === 'sale' ? \`\${a.item} sold\` : \`\${a.device} logged (\${a.status})\`,
      date: new Date(a.createdAt.toDate()).toLocaleString(),
      amount: a._type === 'sale' ? Number(a.amount) : Number(a.cost)
    }));`
);

content = content.replace(
  /MOCK_KPI_DATA\.todayRevenue/g,
  'todayRevenue'
);
content = content.replace(
  /MOCK_KPI_DATA\.openRepairs/g,
  'openRepairs'
);
content = content.replace(
  /MOCK_KPI_DATA\.completedJobs/g,
  'completedJobs'
);
content = content.replace(
  /MOCK_KPI_DATA\.newSales/g,
  'newSales'
);
content = content.replace(
  /RECENT_ACTIVITY\.slice\(0, 4\)/g,
  'allActivity'
);
content = content.replace(
  /RECENT_ACTIVITY/g,
  'allActivity'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
