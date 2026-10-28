import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
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
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200 mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center justify-between gap-4 text-indigo-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-indigo"></span> Sales:
              </span>
              <span className="font-mono font-bold">R$ {Number(payload[0].value).toLocaleString()}</span>
            </p>
            <p className="flex items-center justify-between gap-4 text-orange-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-orange"></span> Freight:
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
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-white/70 dark:border-bento-darkBorder flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
            Sales & Logistics Velocity
          </h3>
          <p className="text-xs text-bento-muted mt-0.5">Monthly merchandise revenue vs freight overhead</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-indigo"></span> Sales
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange"></span> Freight
          </span>
        </div>
      </div>

      <div className="w-full h-72 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.06} />
            <XAxis 
              dataKey="display_name" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: '#94A3B8' }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" name="Sales" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="freight" name="Freight" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
