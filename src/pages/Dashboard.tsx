import { MOCK_KPI_DATA, RECENT_ACTIVITY } from "../data/mockData";
import { Dollar01Icon, Wrench01Icon, CheckmarkCircle01Icon, Package01Icon, ArrowUp01Icon, ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "../components/HugeIcon";
import { PerformanceOverviewChart, SalesOverviewGauge } from "../components/DashboardCharts";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const kpis = [
    { label: "Today's Revenue", value: `$${MOCK_KPI_DATA.todayRevenue.toFixed(2)}`, delta: "12.5%", isPositive: true, icon: Dollar01Icon, subtext: "+$150.00 from yesterday" },
    { label: "Open Repairs", value: MOCK_KPI_DATA.openRepairs, delta: "2.1%", isPositive: false, icon: Wrench01Icon, subtext: "-2 from yesterday" },
    { label: "Completed Jobs", value: MOCK_KPI_DATA.completedJobs, delta: "4.0%", isPositive: true, icon: CheckmarkCircle01Icon, subtext: "92% goal reached" },
    { label: "New Sales", value: MOCK_KPI_DATA.newSales, delta: "24.5%", isPositive: true, icon: Package01Icon, subtext: "Avg. $45 / sale" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">Overview</h1>
          <p className="text-sm text-[#71717A] font-medium">Here's your shop overview for today.</p>
        </div>
      </div>

      {/* KPI Tiles Carousel/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#6C5DD3] bg-[#F4F2FF]">
                <HugeIcon icon={kpi.icon} className="w-4 h-4" />
              </div>
              <p className="text-[14px] font-medium text-[#71717A]">{kpi.label}</p>
            </div>
            <div className="flex items-end gap-3 mb-5">
              <h2 className="text-2xl font-bold text-[#1A1A1A] leading-none">{kpi.value}</h2>
              <div className="flex items-center gap-0.5 mb-1">
                {kpi.isPositive ? <HugeIcon icon={ArrowUp01Icon} className="w-3 h-3 text-[#10B981]" /> : <HugeIcon icon={ArrowDown01Icon} className="w-3 h-3 text-[#EF4444]" />}
                <span className={cn("text-xs font-medium leading-none", kpi.isPositive ? "text-[#10B981]" : "text-[#EF4444]")}>
                  {kpi.delta}
                </span>
              </div>
            </div>
            <div className="pt-3 mt-auto flex items-center justify-between border-t border-[#E5E5E5] hover:cursor-pointer group">
              <span className="text-[13px] text-[#71717A] group-hover:text-[#1A1A1A] transition-colors">{kpi.subtext}</span>
              <HugeIcon icon={ArrowRight01Icon} className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#1A1A1A] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[400px]">
          <PerformanceOverviewChart />
        </div>
        <div className="min-h-[400px]">
          <SalesOverviewGauge />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Recent Activity</h2>
          <a href="#" className="text-[13px] font-medium text-[#71717A] hover:underline hover:text-[#1A1A1A]">View All</a>
        </div>
        
        <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col">
          {RECENT_ACTIVITY.map((activity, idx) => {
            const isIncoming = activity.type === "sale" || activity.message.includes("completed");
            return (
              <div key={activity.id} className={cn("flex items-center justify-between p-4 transition-colors", idx !== 0 ? "border-t border-[#F0F0F0]" : "")}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", 
                    isIncoming ? "bg-[#F5F5F5]" : "bg-[#F5F5F5]"
                  )}>
                    {activity.type === "sale" ? (
                      <HugeIcon icon={Package01Icon} className="w-4 h-4 text-[#1A1A1A]" />
                    ) : (
                      <HugeIcon icon={Wrench01Icon} className="w-4 h-4 text-[#1A1A1A]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{activity.message}</p>
                    <p className="text-xs text-[#71717A] mt-0.5">{activity.date}</p>
                  </div>
                </div>
                <div className="text-sm font-bold text-[#1A1A1A]">
                  {isIncoming ? "+" : ""}${activity.amount.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
