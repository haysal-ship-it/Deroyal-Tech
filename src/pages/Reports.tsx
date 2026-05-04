import { REVENUE_CHART_DATA } from "../data/mockData";
import { Dollar01Icon, Tick01Icon, Activity01Icon, ArrowUp01Icon, ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "../components/HugeIcon";
import { PerformanceOverviewChart, SalesOverviewGauge } from "../components/DashboardCharts";
import { cn } from "../lib/utils";

export default function Reports() {
  const summaries = [
    { label: "Total Revenue (7d)", value: "$9,700.00", icon: Dollar01Icon, delta: "7.52%", isPositive: true, subtext: "+$3,256 from last month" },
    { label: "Repairs Completed", value: "32", icon: Tick01Icon, delta: "3.56%", isPositive: true, subtext: "+12 from last month" },
    { label: "Avg Repair Value", value: "$135.50", icon: Activity01Icon, delta: "1.20%", isPositive: false, subtext: "-$5 from last month" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full h-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">Reports</h1>
          <p className="text-sm text-[#71717A] font-medium">Analytics and business performance.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaries.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#6C5DD3] bg-[#F4F2FF]">
                <HugeIcon icon={s.icon} className="w-4 h-4" />
              </div>
              <p className="text-[14px] font-medium text-[#71717A]">{s.label}</p>
            </div>
            <div className="flex items-end gap-3 mb-5">
              <h2 className="text-2xl font-bold text-[#1A1A1A] leading-none">{s.value}</h2>
              <div className="flex items-center gap-0.5 mb-1">
                {s.isPositive ? <HugeIcon icon={ArrowUp01Icon} className="w-3 h-3 text-[#10B981]" /> : <HugeIcon icon={ArrowDown01Icon} className="w-3 h-3 text-[#EF4444]" />}
                <span className={cn("text-xs font-medium leading-none", s.isPositive ? "text-[#10B981]" : "text-[#EF4444]")}>
                  {s.delta}
                </span>
              </div>
            </div>
            <div className="pt-3 mt-auto flex items-center justify-between border-t border-[#E5E5E5] hover:cursor-pointer group">
              <span className="text-[13px] text-[#71717A] group-hover:text-[#1A1A1A] transition-colors">{s.subtext}</span>
              <HugeIcon icon={ArrowRight01Icon} className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#1A1A1A] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 flex-1">
        <div className="lg:col-span-2 min-h-[400px]">
          <PerformanceOverviewChart />
        </div>
        <div className="min-h-[400px]">
          <SalesOverviewGauge />
        </div>
      </div>
    </div>
  );
}
