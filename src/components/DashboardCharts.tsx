import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Rectangle, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { PERFORMANCE_DATA } from "../data/mockData";
import { MoreVertical } from "lucide-react";
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
            <span className="text-[14px] font-bold text-[#1A1A1A]">₦{(data.revenue / 1000).toFixed(1)}k</span>
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

  const handleMouseLeave = () => {
    setActiveIndex(null);
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
            margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
            barGap={8}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
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
              height={40}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fill: '#A1A1AA', fontWeight: 500 }} 
              dx={-15}
              tickFormatter={(value) => value >= 1000 ? `₦${(value / 1000).toFixed(0)}k` : value}
            />
            <Tooltip 
               content={<PerformanceTooltip />}
               cursor={{ fill: 'transparent' }}
            />
            <Bar 
              dataKey="sales" 
              radius={6}
              activeBar={false}
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
              activeBar={false}
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



