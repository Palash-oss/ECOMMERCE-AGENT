import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { Sparkles, RotateCcw } from 'lucide-react';
import { TimeseriesPoint } from '../../types';

interface CustomerHabitsChartProps {
  data: TimeseriesPoint[];
  selectedMonth?: string | null;
  onSelectMonth?: (monthKey: string, monthLabel: string) => void;
  onClearFilter?: () => void;
}

export const CustomerHabitsChart: React.FC<CustomerHabitsChartProps> = ({ 
  data,
  selectedMonth,
  onSelectMonth,
  onClearFilter
}) => {
  // Format for last 10 points
  const chartData = data.slice(-10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121214] text-white p-3.5 rounded-2xl shadow-xl border border-[#26262B] text-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="font-bold text-neutral-200">{label}</p>
            <span className="text-[10px] text-brand-orange bg-orange-500/10 px-1.5 py-0.5 rounded font-mono">
              Click to drill down
            </span>
          </div>
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

  const handleChartClick = (e: any) => {
    if (e && e.activePayload && e.activePayload.length && onSelectMonth) {
      const p = e.activePayload[0].payload;
      if (selectedMonth === p.period && onClearFilter) {
        onClearFilter();
      } else {
        onSelectMonth(p.period, p.display_name);
      }
    }
  };

  const selectedPoint = chartData.find((p) => p.period === selectedMonth);

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col h-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
              Sales & Logistics Velocity
            </h3>
            {selectedMonth && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-brand-orange border border-orange-500/30">
                Drilldown: {selectedPoint ? selectedPoint.display_name : selectedMonth}
              </span>
            )}
          </div>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">
            Click any monthly bar to drill down and dynamically filter dashboard metrics
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {selectedMonth && onClearFilter && (
            <button
              onClick={onClearFilter}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-brand-orange bg-neutral-100 dark:bg-neutral-800 rounded-lg transition-bento"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          )}
          <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange"></span> Sales
          </span>
          <span className="flex items-center gap-1.5 font-medium text-neutral-500 dark:text-neutral-400">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400"></span> Freight
          </span>
        </div>
      </div>

      <div className="w-full h-72 flex-1 cursor-pointer">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            onClick={handleChartClick}
          >
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
            
            <Bar dataKey="sales" name="Sales" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, index) => {
                const isSelected = selectedMonth === entry.period;
                return (
                  <Cell 
                    key={`sales-cell-${index}`} 
                    fill={isSelected ? '#FF7E47' : '#FF5A1F'}
                    stroke={isSelected ? '#FFFFFF' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                );
              })}
            </Bar>

            <Bar dataKey="freight" name="Freight" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, index) => {
                const isSelected = selectedMonth === entry.period;
                return (
                  <Cell 
                    key={`freight-cell-${index}`} 
                    fill={isSelected ? '#9CA3AF' : '#71717A'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
