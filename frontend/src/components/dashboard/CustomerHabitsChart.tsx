import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { TimeseriesPoint } from '../../types';

interface CustomerHabitsChartProps {
  data: TimeseriesPoint[];
}

export const CustomerHabitsChart: React.FC<CustomerHabitsChartProps> = ({ data }) => {
  // Format for last 10 points
  const chartData = data.slice(-10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121214] text-white p-3.5 rounded-2xl shadow-xl border border-[#26262B] text-xs">
          <p className="font-bold text-neutral-200 mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center justify-between gap-4 text-orange-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-orange"></span> Sales:
              </span>
              <span className="font-mono font-bold">R$ {Number(payload[0].value).toLocaleString()}</span>
            </p>
            <p className="flex items-center justify-between gap-4 text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-500"></span> Freight:
              </span>
              <span className="font-mono font-bold">R$ {Number(payload[1].value).toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
            Sales & Logistics Velocity
          </h3>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5" title="Partial months (Sep/Oct 2016, Sep/Oct 2018) excluded to prevent artificial velocity dips.">
            Monthly merchandise revenue vs freight overhead <span className="opacity-75 cursor-help underline decoration-dotted text-[11px]">(complete months only)</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange"></span> Sales
          </span>
          <span className="flex items-center gap-1.5 font-medium text-neutral-500 dark:text-neutral-400">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400"></span> Freight
          </span>
        </div>
      </div>

      <div className="w-full h-72 flex-1">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.06} />
            <XAxis 
              dataKey="display_name" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: '#71717A' }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: '#71717A' }}
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" name="Sales" fill="#FF5A1F" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="freight" name="Freight" fill="#71717A" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
