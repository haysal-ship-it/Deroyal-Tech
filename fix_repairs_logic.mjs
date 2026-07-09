import fs from 'fs';
let content = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

const regex = /export default function Repairs\(\) \{[\s\S]*?const STATUS_OPTIONS = \[/;
const replacement = `export default function Repairs() {
  const [activeTab, setActiveTab] = useState("All");
  const [jobStatus, setJobStatus] = useState<string>("Pending");

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
    }, (err) => {
      console.error("Repairs snapshot error:", err);
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

  const filteredRepairs = repairs.filter((repair) => 
    activeTab === "All" ? true : repair.status === activeTab
  );

  const STATUS_OPTIONS = [`;

content = content.replace(regex, replacement);

content = content.replace(
  /const filteredRepairs = REPAIR_DATA\.filter\(\(repair\) =>[\s\S]*?activeTab === "All" \? true : repair\.status === activeTab\s*\);/,
  ''
);

fs.writeFileSync('src/pages/Repairs.tsx', content);
