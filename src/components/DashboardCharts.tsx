import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Rectangle, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
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
              height={40}
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

export function SalesOverviewGauge() {
  const RADIAL_DATA = [
    { name: 'Inner', value: 45, fill: '#F15F36' },
    { name: 'Middle', value: 65, fill: '#3E8662' },
    { name: 'Outer', value: 85, fill: '#2A6347' }
  ];

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E5E5E5] flex flex-col w-full h-full relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <div>
           <h2 className="text-[#1A1A1A] text-[18px] font-bold">Product statistic</h2>
           <p className="text-[#A1A1AA] text-[13px] mt-0.5">Track your product sales</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[12px] font-medium text-[#71717A] cursor-pointer hover:bg-gray-50 transition-colors">
          Today
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-col lg:flex-row items-center justify-between gap-2 mt-4 mb-6">
        <div className="relative w-[180px] h-[180px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" cy="50%" 
              innerRadius="45%" outerRadius="100%" 
              barSize={12} 
              data={RADIAL_DATA}
              startAngle={50}
              endAngle={310}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                background={{ fill: '#F4F4F5' }}
                dataKey="value"
                cornerRadius={100}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#1A1A1A] px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold shadow-lg">
                         {payload[0].value}%
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left mr-4">
          <h3 className="text-[36px] font-bold text-[#1A1A1A] leading-tight tracking-tight">8.564</h3>
          <p className="text-[13px] font-medium text-[#A1A1AA] mt-0 mb-3">Product Sales</p>
          <span className="bg-[#86efac] text-[#14532d] px-3 py-1 rounded-md text-[13px] font-bold">
            +6.4%
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-gray-50">
        <div className="flex items-center justify-between bg-white hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F4F4F5] rounded-xl flex items-center justify-center text-[#71717A]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
            </div>
            <span className="text-[15px] font-semibold text-[#1A1A1A]">Electronic</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[15px] font-bold text-[#1A1A1A]">3.250</span>
             <span className="bg-[#86efac] text-[#14532d] px-2 py-0.5 rounded text-[12px] font-bold w-[52px] text-center">
               +2.4%
             </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-white hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F4F4F5] rounded-xl flex items-center justify-center text-[#71717A]">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </div>
            <span className="text-[15px] font-semibold text-[#1A1A1A]">Furniture</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[15px] font-bold text-[#1A1A1A]">5.250</span>
             <span className="bg-[#86efac] text-[#14532d] px-2 py-0.5 rounded text-[12px] font-bold w-[52px] text-center">
               +1.7%
             </span>
          </div>
        </div>
      </div>
      
    </div>
  );
}

