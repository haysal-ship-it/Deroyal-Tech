import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { useState } from "react";

const PerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 min-w-[200px] border border-gray-100 transform transition-all duration-200 scale-105">
        <p className="text-[13px] font-medium text-[#71717A] mb-3">{data.date}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              <span className="text-[13px] font-medium text-[#71717A]">Total Sales</span>
            </div>
            <span className="text-[14px] font-bold text-[#1A1A1A]">{data.sales}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
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

interface ChartData {
  name: string;
  date: string;
  sales: number;
  revenue: number;
}

export function PerformanceOverviewChart({ data }: { data: ChartData[] }) {
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
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E5E5E5] flex flex-col w-full h-full hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[#1A1A1A] text-[18px] font-bold">Performance Overview</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E5E5] text-[13px] font-medium text-[#1A1A1A] cursor-pointer hover:bg-gray-50 hover:border-indigo-200 transition-all active:scale-95">
            This Week
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart 
            data={data} 
            margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
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
               cursor={{ stroke: '#E5E7EB', strokeWidth: 2, strokeDasharray: '4 4' }}
               isAnimationActive={true}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#6366f1" 
              strokeWidth={4}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#6366f1" }}
              activeDot={{ r: 8, strokeWidth: 0, fill: "#6366f1", }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#3b82f6" 
              strokeWidth={4}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
              activeDot={{ r: 8, strokeWidth: 0, fill: "#3b82f6", }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
