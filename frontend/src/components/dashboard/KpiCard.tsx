import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Users, Package } from 'lucide-react';
import { KpiMetric } from '../../types';

interface KpiCardProps {
  data: KpiMetric;
  iconType: 'gmv' | 'orders' | 'customers' | 'products';
}

export const KpiCard: React.FC<KpiCardProps> = ({ data, iconType }) => {
  const isPositive = data.delta.direction === 'positive';

  const icons = {
    gmv: DollarSign,
    orders: ShoppingBag,
    customers: Users,
    products: Package
  };
  const Icon = icons[iconType] || DollarSign;

  // Render SVG mini sparkline
  const renderSparkline = (color: string) => {
    if (!data.sparkline || data.sparkline.length < 2) return null;
    const min = Math.min(...data.sparkline);
    const max = Math.max(...data.sparkline);
    const range = max - min || 1;
    const height = 30;
    const width = 80;

    const points = data.sparkline
      .map((val, idx) => {
        const x = (idx / (data.sparkline.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  if (data.is_hero) {
    return (
      <div className="bg-gradient-to-br from-brand-indigo to-brand-indigoDark rounded-bento p-6 text-white shadow-bento-hero relative overflow-hidden transition-bento hover:scale-[1.01]">
        {/* Subtle decorative circles */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {data.delta.percentage > 0 ? `+${data.delta.percentage}%` : `${data.delta.percentage}%`}
          </span>
        </div>

        <p className="text-xs font-medium text-white/80 uppercase tracking-wider">{data.title}</p>
        <div className="flex items-baseline justify-between mt-1">
          <h3 className="text-3xl font-extrabold tracking-tight font-mono">{data.formatted}</h3>
          <div>{renderSparkline('#FFFFFF')}</div>
        </div>
        <p className="text-[11px] text-white/70 mt-2">vs prior period (R$ {data.previous_value.toLocaleString()})</p>
      </div>
    );
  }

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-white/70 dark:border-bento-darkBorder transition-bento hover:shadow-bento-hover hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
          <Icon className="w-5 h-5" />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
          isPositive ? 'bg-emerald-500/10 text-brand-emerald' : 'bg-rose-500/10 text-brand-rose'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {data.delta.percentage > 0 ? `+${data.delta.percentage}%` : `${data.delta.percentage}%`}
        </span>
      </div>

      <p className="text-xs font-medium text-bento-muted uppercase tracking-wider">{data.title}</p>
      <div className="flex items-baseline justify-between mt-1">
        <h3 className="text-2xl font-bold tracking-tight text-bento-text dark:text-bento-darkText font-mono">
          {data.formatted}
        </h3>
        <div>{renderSparkline(isPositive ? '#10B981' : '#EF4444')}</div>
      </div>
      <p className="text-[11px] text-bento-muted mt-2">
        {data.note ? data.note : `vs prior period (${data.previous_value.toLocaleString()})`}
      </p>
    </div>
  );
};
