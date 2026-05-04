import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Rectangle } from "recharts";
import { PERFORMANCE_DATA } from "../data/mockData";
import { HugeIcon } from "./HugeIcon";
import { MoreIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";

const PerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 min-w-[200px] border border-gray-100">
        <p className="text-[13px] font-medium text-[#71717A] mb-3">{data.date}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              <span className="text-[13px] font-medium text-[#71717A]">Total Sales</span>
            </div>
            <span className="text-[14px] font-bold text-[#1A1A1A]">{data.sales}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
              <span className="text-[13px] font-medium text-[#71717A]">Total Revenue</span>
            </div>
            <span className="text-[14px] font-bold text-[#1A1A1A]">${(data.revenue / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function PerformanceOverviewChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseMove = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      setActiveIndex(state.activeTooltipIndex);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E5E5E5] flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[#1A1A1A] text-[18px] font-bold">Performance Overview</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E5E5] text-[13px] font-medium text-[#1A1A1A] cursor-pointer hover:bg-gray-50 transition-colors">
            This Week
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart 
            data={PERFORMANCE_DATA} 
            margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            barGap={8}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
              <pattern id="blue-stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#3B82F6" />
                <rect width="4" height="8" fill="#60A5FA" />
              </pattern>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fill: '#A1A1AA', fontWeight: 500 }} 
              dy={15} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fill: '#A1A1AA', fontWeight: 500 }} 
              dx={-15}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            />
            <Tooltip 
               content={<PerformanceTooltip />}
               cursor={{ fill: 'transparent' }}
            />
            <Bar 
              dataKey="sales" 
              radius={6}
            >
              {PERFORMANCE_DATA.map((entry, index) => {
                // If no hover, index 3 is highlighted by default to match design
                const isActive = activeIndex !== null ? index === activeIndex : index === 3;
                return <Cell key={`sales-${index}`} fill={isActive ? "url(#blue-stripe)" : "#F3F4F6"} style={{ transition: 'all 0.2s ease' }} />;
              })}
            </Bar>
            <Bar 
              dataKey="revenue" 
              radius={6}
            >
              {PERFORMANCE_DATA.map((entry, index) => {
                const isActive = activeIndex !== null ? index === activeIndex : index === 3;
                return <Cell key={`rev-${index}`} fill={isActive ? "#6366f1" : "#E5E7EB"} style={{ transition: 'all 0.2s ease' }} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const GAUGE_COLORS = [
  "#0040A1", "#0552CA", "#1667EA", "#2B7BFF", "#438DFF",
  "#5A9FFF", "#72B1FF", "#8BC3FF", "#A4D5FF", "#BEE7FF", "#D8F8FF"
];

export function SalesOverviewGauge() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const GAUGE_DATA = Array.from({ length: 15 }).map((_, i) => ({
    value: 1,
    index: i,
    fill: i < 11 ? GAUGE_COLORS[i] : "#F3F4F6",
    isActive: i < 11
  }));

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E5E5E5] flex flex-col w-full h-full relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#1A1A1A] text-[18px] font-bold">Sales Overview</h2>
        <div className="w-8 h-8 rounded-full border border-[#E5E5E5] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <HugeIcon icon={MoreIcon} className="w-4 h-4 text-[#A1A1AA]" />
        </div>
      </div>
      
      <div className="flex-1 w-full relative flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-full relative flex-1 min-h-[160px] -mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={GAUGE_DATA}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius="65%"
                outerRadius="95%"
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {GAUGE_DATA.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill} 
                    opacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.4}
                    style={{ 
                      transition: 'opacity 0.2s ease, transform 0.2s ease', 
                      transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)', 
                      transformOrigin: '50% 100%',
                      cursor: entry.isActive ? 'pointer' : 'default'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0].payload.isActive) {
                    const idx = payload[0].payload.index;
                    return (
                      <div className="bg-[#1A1A1A] px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold shadow-lg">
                         Target Area {idx + 1}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'transparent' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute left-[50%] bottom-0 -translate-x-1/2 flex flex-col items-center justify-end text-center mb-4 pointer-events-none">
            <h3 className="text-4xl font-bold text-[#1A1A1A] leading-tight">70.8%</h3>
            <p className="text-[13px] font-medium text-[#71717A] mt-1">Sales Growth</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full mt-auto pt-8">
          <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#F3F4F6] hover:border-[#E5E7EB] transition-colors cursor-default">
            <p className="text-[12px] font-medium text-[#71717A] mb-2">Number of Sales</p>
            <div className="flex items-center justify-between">
              <span className="text-[18px] font-bold text-[#1A1A1A]">2,343</span>
              <span className="text-[#D97706] bg-[#FFF9EA] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                4.5% <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
              </span>
            </div>
          </div>
          <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#F3F4F6] hover:border-[#E5E7EB] transition-colors cursor-default">
             <p className="text-[12px] font-medium text-[#71717A] mb-2">Total Revenue</p>
             <div className="flex items-center justify-between">
               <span className="text-[18px] font-bold text-[#1A1A1A]">$30.9k</span>
               <span className="text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                 4.5% <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

