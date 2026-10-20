import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useRef, useEffect } from "react";
import { formatNaira } from "../lib/utils";
import { ChevronDown, Check } from "lucide-react";

export type TimeframeOption = "today" | "7days" | "30days";

const PerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 min-w-[200px] border border-gray-100 transform transition-all duration-200">
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
            <span className="text-[14px] font-bold text-[#1A1A1A]">{formatNaira(data.revenue)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export interface ChartDataPoint {
  name: string;
  date: string;
  sales: number;
  revenue: number;
}

interface PerformanceOverviewChartProps {
  data: ChartDataPoint[];
  timeframe: TimeframeOption;
  onTimeframeChange: (tf: TimeframeOption) => void;
}

export function PerformanceOverviewChart({ data, timeframe, onTimeframeChange }: PerformanceOverviewChartProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const TIMEFRAME_LABELS: Record<TimeframeOption, string> = {
    today: "Today",
    "7days": "7 days",
    "30days": "30 days"
  };

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E5E5E5] flex flex-col w-full h-full hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-center mb-8 relative">
        <h2 className="text-[#1A1A1A] text-[18px] font-bold">Performance Overview</h2>
        
        {/* Dropdown selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E5E5] text-[13px] font-medium text-[#1A1A1A] cursor-pointer hover:bg-gray-50 hover:border-indigo-200 transition-all active:scale-95"
          >
            <span>{TIMEFRAME_LABELS[timeframe]}</span>
            <ChevronDown size={14} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95">
              {(["today", "7days", "30days"] as TimeframeOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onTimeframeChange(opt);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                    timeframe === opt ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {TIMEFRAME_LABELS[opt]}
                  {timeframe === opt && <Check size={14} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart 
            data={data} 
            margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#A1A1AA', fontWeight: 500 }} 
              dy={15} 
              height={40}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#A1A1AA', fontWeight: 500 }} 
              dx={-10}
              tickFormatter={(value) => value >= 1000 ? `₦${(value / 1000).toFixed(0)}k` : `₦${value}`}
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
              strokeWidth={3.5}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#6366f1" }}
              activeDot={{ r: 7, strokeWidth: 0, fill: "#6366f1" }}
              animationDuration={1000}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#3b82f6" 
              strokeWidth={3.5}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
              activeDot={{ r: 7, strokeWidth: 0, fill: "#3b82f6" }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
