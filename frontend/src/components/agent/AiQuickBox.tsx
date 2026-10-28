import React from 'react';
import { Cpu, DollarSign, Maximize2 } from 'lucide-react';
import { AiUsageStats } from '../../types';

interface AiQuickBoxProps {
  usage: AiUsageStats | null;
  onExpand: () => void;
}

export const AiQuickBox: React.FC<AiQuickBoxProps> = ({ usage, onExpand }) => {
  if (!usage) return null;

  return (
    <div 
      onClick={onExpand}
      className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-bento-border dark:border-bento-darkBorder cursor-pointer transition-bento hover:shadow-bento-hover hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-brand-orange flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-bento-text dark:text-bento-darkText">AI Usage & Limits</h4>
            <p className="text-[10px] text-bento-muted dark:text-bento-darkMuted">{usage.provider_in_use}</p>
          </div>
        </div>
        <button className="text-neutral-400 hover:text-brand-orange p-1">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Rate Limit Circular/Pill Progress */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl">
          <span className="text-[10px] font-semibold text-bento-muted dark:text-bento-darkMuted block uppercase tracking-wider">
            Rate Capacity
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm font-bold font-mono text-bento-text dark:text-bento-darkText">
              {usage.requests_today}
            </span>
            <span className="text-[10px] text-bento-muted font-mono">
              / {usage.rate_limit_per_minute} rpm
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-brand-orange rounded-full transition-bento"
              style={{ width: `${Math.min(100, (usage.requests_today / usage.rate_limit_per_minute) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Daily Token Budget */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl">
          <span className="text-[10px] font-semibold text-bento-muted dark:text-bento-darkMuted block uppercase tracking-wider">
            Daily Budget
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm font-bold font-mono text-bento-text dark:text-bento-darkText">
              {(usage.tokens_used_today / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-bento-muted font-mono">
              / {(usage.daily_budget_tokens / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-bento"
              style={{ width: `${Math.max(4, usage.budget_used_pct)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Spend Tracker Footer */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
        <span className="text-[11px] text-bento-muted flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-brand-orange" /> Est. Spend Today:
        </span>
        <span className="font-mono font-bold text-bento-text dark:text-bento-darkText">
          ${usage.estimated_cost_today_usd.toFixed(4)}
        </span>
      </div>
    </div>
  );
};
