import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CategoryBreakdown } from '../../types';

interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
}

const COLORS = ['#FF5A1F', '#FF7E47', '#F59E0B', '#10B981', '#06B6D4', '#71717A'];

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ data }) => {
  const topCategories = data.slice(0, 5);
  const pieData = topCategories.map((c, i) => ({
    name: c.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: c.revenue,
    share: c.share_pct,
    color: COLORS[i % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-[#121214] text-white p-3 rounded-2xl shadow-xl border border-[#26262B] text-xs">
          <p className="font-bold text-neutral-200">{item.name}</p>
          <p className="text-orange-400 font-mono mt-1 font-bold">R$ {Number(item.value).toLocaleString()}</p>
          <p className="text-neutral-400 text-[10px]">{item.payload.share}% of total catalog</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col h-full">
      <div className="mb-3">
        <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
          Product Categories Breakdown
        </h3>
        <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">Revenue distribution across 73 categories</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
        {/* Donut Chart */}
        <div className="w-44 h-44 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={pieData}
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-bento-muted dark:text-bento-darkMuted">Top 5</span>
            <span className="text-xs font-bold text-bento-text dark:text-bento-darkText font-mono">Share</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 w-full text-xs">
          {pieData.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="truncate text-bento-text dark:text-bento-darkText font-medium">
                  {entry.name}
                </span>
              </div>
              <span className="font-mono text-bento-muted dark:text-bento-darkMuted text-[11px] font-semibold">
                {entry.share}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
