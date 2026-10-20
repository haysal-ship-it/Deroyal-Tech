import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useState, useEffect } from "react";
import { DollarSign, Wrench, CheckCircle2, Package, ArrowUp, ArrowDown, ArrowRight, X, Search } from "lucide-react";
import { PerformanceOverviewChart, TimeframeOption, ChartDataPoint } from "../components/DashboardCharts";
import { cn, formatNaira, getLocalDateString, getDateStringFromTimestamp } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("7days");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");

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

  // Compute stats using local dates
  const todayStr = getLocalDateString(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayObj);

  // Helper to extract date from sale
  const getSaleDateStr = (s: any) => {
    if (s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)) return s.date;
    if (s.createdAt) return getDateStringFromTimestamp(s.createdAt);
    return s.date || '';
  };

  // Helper to extract date from repair
  const getRepairDateStr = (r: any) => {
    return getDateStringFromTimestamp(r.createdAt);
  };

  // 1. Sales & Revenue
  const todaySales = sales.filter(s => getSaleDateStr(s) === todayStr);
  const yesterdaySales = sales.filter(s => getSaleDateStr(s) === yesterdayStr);

  const todaySalesRevenue = todaySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  const yesterdaySalesRevenue = yesterdaySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

  // Repairs revenue (completed or collected repairs)
  const isRepairCompletedOn = (r: any, targetDate: string) => {
    if (r.status !== 'Completed' && r.status !== 'Collected') return false;
    if (Array.isArray(r.statusHistory)) {
      const match = r.statusHistory.find((h: any) => (h.status === 'Completed' || h.status === 'Collected') && h.timestamp);
      if (match?.timestamp && getDateStringFromTimestamp(match.timestamp) === targetDate) return true;
    }
    return getRepairDateStr(r) === targetDate;
  };

  const todayRepairRevenue = repairs.filter(r => isRepairCompletedOn(r, todayStr)).reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
  const yesterdayRepairRevenue = repairs.filter(r => isRepairCompletedOn(r, yesterdayStr)).reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

  const todayTotalRevenue = todaySalesRevenue + todayRepairRevenue;
  const yesterdayTotalRevenue = yesterdaySalesRevenue + yesterdayRepairRevenue;

  // Revenue Delta & Subtext
  const revDiff = todayTotalRevenue - yesterdayTotalRevenue;
  let revDelta = "0.0%";
  let revIsPositive = true;
  if (yesterdayTotalRevenue > 0) {
    const pct = ((todayTotalRevenue - yesterdayTotalRevenue) / yesterdayTotalRevenue) * 100;
    revDelta = `${Math.abs(pct).toFixed(1)}%`;
    revIsPositive = pct >= 0;
  } else if (todayTotalRevenue > 0) {
    revDelta = "+100%";
    revIsPositive = true;
  }
  const revSubtext = (todayTotalRevenue === 0 && yesterdayTotalRevenue === 0) 
    ? "—" 
    : `${revDiff >= 0 ? "+" : "-"}${formatNaira(Math.abs(revDiff))} from yesterday`;

  // 2. Open Repairs
  const openRepairs = repairs.filter(r => r.status !== 'Completed' && r.status !== 'Collected').length;
  const todayOpenRepairsLogged = repairs.filter(r => (r.status !== 'Completed' && r.status !== 'Collected') && getRepairDateStr(r) === todayStr).length;
  const yesterdayOpenRepairsLogged = repairs.filter(r => (r.status !== 'Completed' && r.status !== 'Collected') && getRepairDateStr(r) === yesterdayStr).length;
  const openRepairsDiff = todayOpenRepairsLogged - yesterdayOpenRepairsLogged;
  let openDelta = "0.0%";
  if (yesterdayOpenRepairsLogged > 0) {
    openDelta = `${Math.abs((openRepairsDiff / yesterdayOpenRepairsLogged) * 100).toFixed(1)}%`;
  } else if (todayOpenRepairsLogged > 0) {
    openDelta = "+100%";
  }
  const openSubtext = (todayOpenRepairsLogged === 0 && yesterdayOpenRepairsLogged === 0)
    ? "—"
    : `${openRepairsDiff >= 0 ? `+${openRepairsDiff}` : `${openRepairsDiff}`} from yesterday`;

  // 3. Completed Jobs
  const completedJobs = repairs.filter(r => r.status === 'Completed' || r.status === 'Collected').length;
  const todayCompleted = repairs.filter(r => isRepairCompletedOn(r, todayStr)).length;
  const yesterdayCompleted = repairs.filter(r => isRepairCompletedOn(r, yesterdayStr)).length;
  const compDiff = todayCompleted - yesterdayCompleted;
  let compDelta = "0.0%";
  let compIsPositive = true;
  if (yesterdayCompleted > 0) {
    const pct = ((todayCompleted - yesterdayCompleted) / yesterdayCompleted) * 100;
    compDelta = `${Math.abs(pct).toFixed(1)}%`;
    compIsPositive = pct >= 0;
  } else if (todayCompleted > 0) {
    compDelta = "+100%";
    compIsPositive = true;
  }
  const compSubtext = (todayCompleted === 0 && yesterdayCompleted === 0)
    ? "—"
    : `${compDiff >= 0 ? `+${compDiff}` : `${compDiff}`} from yesterday`;

  // 4. New Sales
  const newSales = todaySales.length;
  const newSalesDiff = todaySales.length - yesterdaySales.length;
  let salesDelta = "0.0%";
  let salesIsPositive = true;
  if (yesterdaySales.length > 0) {
    const pct = ((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100;
    salesDelta = `${Math.abs(pct).toFixed(1)}%`;
    salesIsPositive = pct >= 0;
  } else if (todaySales.length > 0) {
    salesDelta = "+100%";
    salesIsPositive = true;
  }
  const avgSaleSubtext = todaySales.length > 0 
    ? `Avg. ${formatNaira(todaySalesRevenue / todaySales.length)} / sale` 
    : "—";

  // Build real Chart Data according to selected timeframe
  let chartData: ChartDataPoint[] = [];

  if (timeframe === "today") {
    // 6 time blocks throughout today: 00-04, 04-08, 08-12, 12-16, 16-20, 20-24
    const blocks = [
      { label: "12 AM", startHour: 0, endHour: 4 },
      { label: "4 AM", startHour: 4, endHour: 8 },
      { label: "8 AM", startHour: 8, endHour: 12 },
      { label: "12 PM", startHour: 12, endHour: 16 },
      { label: "4 PM", startHour: 16, endHour: 20 },
      { label: "8 PM", startHour: 20, endHour: 24 }
    ];

    chartData = blocks.map(block => {
      const blockSales = todaySales.filter(s => {
        if (!s.createdAt?.toDate) return true;
        const h = s.createdAt.toDate().getHours();
        return h >= block.startHour && h < block.endHour;
      });
      const blockRepairs = repairs.filter(r => {
        if (getRepairDateStr(r) !== todayStr) return false;
        if (!r.createdAt?.toDate) return true;
        const h = r.createdAt.toDate().getHours();
        return h >= block.startHour && h < block.endHour;
      });

      const sRev = blockSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      const rRev = blockRepairs.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

      return {
        name: block.label,
        date: `Today, ${block.label}`,
        sales: blockSales.length + blockRepairs.length,
        revenue: sRev + rRev
      };
    });
  } else {
    const daysCount = timeframe === "30days" ? 30 : 7;
    const days = Array.from({ length: daysCount }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - ((daysCount - 1) - i));
      return d;
    });

    chartData = days.map(date => {
      const dateStr = getLocalDateString(date);
      const dayName = daysCount <= 7 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' });
      const fullDate = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

      const daySales = sales.filter(s => getSaleDateStr(s) === dateStr);
      const dayRepairs = repairs.filter(r => getRepairDateStr(r) === dateStr);

      const totalSalesCount = daySales.length + dayRepairs.length;
      const totalSalesRev = daySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      const totalRepairRev = dayRepairs.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

      return {
        name: dayName,
        date: fullDate,
        sales: totalSalesCount,
        revenue: totalSalesRev + totalRepairRev
      };
    });
  }

  // All activities
  const allActivity = [...sales, ...repairs]
    .filter(a => a.createdAt)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .map(a => {
      const dateObj = a.createdAt.toDate();
      return {
        id: a.id,
        type: a._type,
        status: a._type === 'repair' ? a.status : undefined,
        message: a._type === 'sale' ? `${a.item} sold` : `${a.device} logged (${a.status})`,
        customer: a._type === 'repair' ? a.customer : (a.customer || 'Direct customer'),
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        amount: a._type === 'sale' ? Number(a.amount || 0) : Number(a.cost || 0)
      };
    });

  const recentFourActivity = allActivity.slice(0, 4);

  const filteredAllActivity = allActivity.filter(a => {
    if (!activitySearch) return true;
    const q = activitySearch.toLowerCase();
    return a.message.toLowerCase().includes(q) || (a.customer && a.customer.toLowerCase().includes(q)) || a.id.toLowerCase().includes(q);
  });

  const kpis = [
    { label: "Today's Revenue", value: formatNaira(todayTotalRevenue), delta: revDelta, isPositive: revIsPositive, icon: DollarSign, subtext: revSubtext },
    { label: "Open Repairs", value: openRepairs, delta: openDelta, isPositive: openRepairsDiff <= 0, icon: Wrench, subtext: openSubtext },
    { label: "Completed Jobs", value: completedJobs, delta: compDelta, isPositive: compIsPositive, icon: CheckCircle2, subtext: compSubtext },
    { label: "New Sales", value: newSales, delta: salesDelta, isPositive: salesIsPositive, icon: Package, subtext: avgSaleSubtext },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#1A1A1A] mb-1 leading-tight flex flex-wrap items-center gap-2">
            <span className="truncate max-w-[200px] sm:max-w-[400px]">Hi, {user?.name?.split(' ')[0] || user?.username || 'User'}</span>
            <span className="text-xl shrink-0">👋</span>
          </h1>
          <p className="text-[14px] text-[#A1A1AA] font-medium">Let's look at the overview here.</p>
        </div>
      </div>

      {/* KPI Tiles */}
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
            <div className="pt-3 mt-auto flex items-center justify-between border-t border-[#E5E5E5] group">
              <span className="text-[13px] text-[#71717A] group-hover:text-[#1A1A1A] transition-colors">{kpi.subtext}</span>
              <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#1A1A1A] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart with Dropdown */}
      <div className="grid grid-cols-1 items-start">
        <div className="w-full">
          <PerformanceOverviewChart 
            data={chartData} 
            timeframe={timeframe} 
            onTimeframeChange={setTimeframe} 
          />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Recent Activity</h2>
          <button 
            type="button" 
            onClick={() => setIsActivityModalOpen(true)}
            className="text-[13px] font-medium text-[#71717A] hover:underline hover:text-[#1A1A1A] transition-colors"
          >
            View All
          </button>
        </div>
        
        <div className="bg-white rounded-[24px] p-2 border border-[#E5E5E5] shadow-sm flex flex-col gap-2">
          {recentFourActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No recent activity found.
            </div>
          ) : (
            recentFourActivity.map((activity) => {
              // Exact fix: check repair status field for Completed / Collected
              const isIncoming = activity.type === "sale" || activity.status === "Completed" || activity.status === "Collected";
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
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
                    {isIncoming ? "+" : ""}{formatNaira(activity.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Activity List Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">All Activity</h2>
                <p className="text-xs text-gray-500">Complete log of sales and repair events</p>
              </div>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-2 text-[#71717A] hover:text-[#1A1A1A] hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search activity by item, device, or ID..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
              {filteredAllActivity.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No matching activities found.
                </div>
              ) : (
                filteredAllActivity.map((activity) => {
                  const isIncoming = activity.type === "sale" || activity.status === "Completed" || activity.status === "Collected";
                  return (
                    <div key={activity.id} className="py-3 px-2 flex items-center justify-between hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", 
                          isIncoming ? "bg-[#EC4899]/10 text-[#EC4899]" : "bg-[#3B82F6]/10 text-[#3B82F6]"
                        )}>
                          {activity.type === "sale" ? (
                            <Package className="w-4 h-4" />
                          ) : (
                            <Wrench className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">{activity.message}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="font-mono text-gray-400">#{activity.id}</span>
                            <span>•</span>
                            <span>{activity.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#1A1A1A]">
                        {isIncoming ? "+" : ""}{formatNaira(activity.amount)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
