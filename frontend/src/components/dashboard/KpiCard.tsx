import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Users, Package } from 'lucide-react';
import { KpiMetric } from '../../types';

interface KpiCardProps {
  data: KpiMetric;
  iconType: 'gmv' | 'orders' | 'customers' | 'products';
}

export const KpiCard: React.FC<KpiCardProps> = ({ data, iconType }) => {
  const hasDelta = Boolean(data.delta && data.delta.has_data !== false && data.previous_value !== null);
  const isPositive = data.delta?.direction === 'positive';

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
        <title>Complete monthly trend</title>
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

  const displayValue = data.compact || data.formatted;
  const tooltipText = `Exact value: ${data.formatted}`;

  if (data.is_hero) {
    return (
      <div 
        className="bg-[#0A0A0B] rounded-bento p-6 text-white shadow-bento-hero relative overflow-hidden transition-bento hover:scale-[1.01] border border-[#26262B] group"
        title={tooltipText}
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-orange/20 rounded-full blur-2xl pointer-events-none group-hover:bg-brand-orange/30 transition-bento"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center text-brand-neon shadow-[0_0_15px_rgba(255,106,43,0.3)]">
            <Icon className="w-5 h-5 text-brand-neon" />
          </div>
          {hasDelta && data.delta ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-orange/20 text-brand-neon border border-brand-orange/30">
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {data.delta.percentage > 0 ? `+${data.delta.percentage}%` : `${data.delta.percentage}%`}
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/80">
              Audit Window
            </span>
          )}
        </div>

        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{data.title}</p>
        <div className="flex items-baseline justify-between mt-1 gap-2 flex-nowrap overflow-hidden">
          <h3 className="text-3xl font-extrabold tracking-tight font-mono text-white whitespace-nowrap truncate" title={data.formatted}>
            {displayValue}
          </h3>
          <div className="flex-shrink-0">{renderSparkline('#FF6A2B')}</div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 truncate">
          {hasDelta && data.previous_value !== null
            ? `vs prior 6M (R$ ${data.previous_value.toLocaleString()})`
            : "Anchored to verified audit window data"}
        </p>
      </div>
    );
  }

  return (
    <div 
      className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder transition-bento hover:shadow-bento-hover hover:-translate-y-0.5"
      title={tooltipText}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center text-brand-orange dark:text-brand-neon">
          <Icon className="w-5 h-5" />
        </div>
        {hasDelta && data.delta ? (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-brand-emerald' : 'bg-rose-500/10 text-brand-rose'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {data.delta.percentage > 0 ? `+${data.delta.percentage}%` : `${data.delta.percentage}%`}
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-bento-muted">
            Benchmark
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-bento-muted uppercase tracking-wider">{data.title}</p>
      <div className="flex items-baseline justify-between mt-1 gap-2 flex-nowrap overflow-hidden">
        <h3 className="text-2xl font-bold tracking-tight text-bento-text dark:text-bento-darkText font-mono whitespace-nowrap truncate" title={data.formatted}>
          {displayValue}
        </h3>
        <div className="flex-shrink-0">{renderSparkline(isPositive ? '#10B981' : '#EF4444')}</div>
      </div>
      <p className="text-[11px] text-bento-muted mt-2 truncate">
        {data.reconciliation_subtitle
          ? data.reconciliation_subtitle
          : data.note
          ? data.note
          : hasDelta && data.previous_value !== null
          ? `vs prior 6M (${data.previous_value.toLocaleString()})`
          : "Verified live analytics"}
      </p>
    </div>
  );
};
