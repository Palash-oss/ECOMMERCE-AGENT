import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CategoryBreakdown } from '../../types';

interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
}

const COLORS = ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#94A3B8'];

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
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200">{item.name}</p>
          <p className="text-indigo-300 font-mono mt-1">R$ {Number(item.value).toLocaleString()}</p>
          <p className="text-slate-400 text-[10px]">{item.payload.share}% of total catalog</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-white/70 dark:border-bento-darkBorder flex flex-col h-full">
      <div className="mb-3">
        <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
          Product Statistics
        </h3>
        <p className="text-xs text-bento-muted mt-0.5">Revenue distribution across 73 categories</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
        {/* Donut Chart */}
        <div className="w-44 h-44 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
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
            <span className="text-lg font-bold font-mono text-bento-text dark:text-bento-darkText">73</span>
            <span className="text-[10px] text-bento-muted uppercase tracking-wider font-semibold">Categories</span>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 space-y-2.5 w-full">
          {topCategories.map((c, i) => (
            <div key={c.category} className="text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate max-w-[140px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  {c.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <span className="font-mono font-bold text-bento-text dark:text-bento-darkText">
                  {c.share_pct}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-bento"
                  style={{ width: `${Math.min(100, c.share_pct * 8)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
