import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { useState, useEffect } from "react";
import { DollarSign, Wrench, CheckCircle2, Package, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { PerformanceOverviewChart } from "../components/DashboardCharts";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    const qSales = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'sale' })));
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });

    const qRepairs = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
    const unsubRepairs = onSnapshot(qRepairs, (snap) => {
      setRepairs(snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'repair' })));
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
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
      message: a._type === 'sale' ? `${a.item} sold` : `${a.device} logged (${a.status})`,
      date: new Date(a.createdAt.toDate()).toLocaleString(),
      amount: a._type === 'sale' ? Number(a.amount) : Number(a.cost)
    }));
  // Generate last 7 days chart data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chartData = last7Days.map(date => {
    // We match by local YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDate = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

    const daySales = sales.filter(s => {
      if (s.createdAt) return new Date(s.createdAt.toDate()).toISOString().split('T')[0] === dateStr;
      return s.date === dateStr;
    });

    const dayRepairs = repairs.filter(r => {
      if (r.createdAt) return new Date(r.createdAt.toDate()).toISOString().split('T')[0] === dateStr;
      return false;
    });

    const totalSalesCount = daySales.length + dayRepairs.length;
    const totalSalesRev = daySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const totalRepairRev = dayRepairs.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
    const totalRevenue = totalSalesRev + totalRepairRev;

    return {
      name: dayName,
      date: fullDate,
      sales: totalSalesCount,
      revenue: totalRevenue
    };
  });

  const { user } = useAuth();

  const kpis = [
    { label: "Today's Revenue", value: `₦${todayRevenue.toFixed(2)}`, delta: "12.5%", isPositive: true, icon: DollarSign, subtext: "+₦150 from yesterday" },
    { label: "Open Repairs", value: openRepairs, delta: "2.1%", isPositive: false, icon: Wrench, subtext: "-2 from yesterday" },
    { label: "Completed Jobs", value: completedJobs, delta: "4.0%", isPositive: true, icon: CheckCircle2, subtext: "92% goal reached" },
    { label: "New Sales", value: newSales, delta: "24.5%", isPositive: true, icon: Package, subtext: "Avg. ₦45 / sale" },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#1A1A1A] mb-1 leading-tight flex flex-wrap items-center gap-2"><span className="truncate max-w-[200px] sm:max-w-[400px]">Hi, {user?.name?.split(' ')[0] || user?.username || 'User'}</span> <span className="text-xl shrink-0">👋</span></h1>
          <p className="text-[14px] text-[#A1A1AA] font-medium">Let's look the overview here.</p>
        </div>
      </div>

      {/* KPI Tiles Carousel/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#6C5DD3] bg-[#F4F2FF]">
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-[14px] font-medium text-[#71717A]">{kpi.label}</p>
            </div>
            <div className="flex items-end gap-3 mb-5">
              <h2 className="text-2xl font-bold text-[#1A1A1A] leading-none">{kpi.value}</h2>
              <div className="flex items-center gap-0.5 mb-1">
                {kpi.isPositive ? <ArrowUp className="w-3 h-3 text-[#10B981]" /> : <ArrowDown className="w-3 h-3 text-[#EF4444]" />}
                <span className={cn("text-xs font-medium leading-none", kpi.isPositive ? "text-[#10B981]" : "text-[#EF4444]")}>
                  {kpi.delta}
                </span>
              </div>
            </div>
            <div className="pt-3 mt-auto flex items-center justify-between border-t border-[#E5E5E5] hover:cursor-pointer group">
              <span className="text-[13px] text-[#71717A] group-hover:text-[#1A1A1A] transition-colors">{kpi.subtext}</span>
              <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#1A1A1A] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start">
        <div className="w-full">
          <PerformanceOverviewChart data={chartData} />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Recent Activity</h2>
          <a href="#" className="text-[13px] font-medium text-[#71717A] hover:underline hover:text-[#1A1A1A]">View All</a>
        </div>
        
        <div className="bg-white rounded-[24px] p-2 border border-[#E5E5E5] shadow-sm flex flex-col gap-2">
          {allActivity.map((activity, idx) => {
            const isIncoming = activity.type === "sale" || activity.message.includes("completed");
            return (
              <div key={activity.id} className="flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
                    isIncoming ? "bg-[#EC4899]/10 text-[#EC4899]" : "bg-[#3B82F6]/10 text-[#3B82F6]"
                  )}>
                    {activity.type === "sale" ? (
                      <Package className="w-5 h-5" />
                    ) : (
                      <Wrench className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1A1A1A] line-clamp-1">{activity.message}</p>
                    <p className="text-[12px] text-[#A1A1AA] mt-0.5">{activity.date}</p>
                  </div>
                </div>
                <div className="text-[14px] font-bold text-[#1A1A1A]">
                  {isIncoming ? "+" : ""}₦{activity.amount.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
