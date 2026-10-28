import React from 'react';
import { X, ShieldCheck, Cpu, DollarSign, Activity, Lock } from 'lucide-react';
import { AiUsageStats } from '../../types';

interface UsageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  usage: AiUsageStats | null;
}

export const UsageDrawer: React.FC<UsageDrawerProps> = ({ isOpen, onClose, usage }) => {
  if (!isOpen || !usage) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-bento-card dark:bg-bento-darkCard h-full shadow-2xl p-6 flex flex-col justify-between border-l border-white/60 dark:border-bento-darkBorder animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-bento-text dark:text-bento-darkText">
                  AI Governance & Budget Control
                </h3>
                <p className="text-[11px] text-bento-muted">Real-time spend and token limits</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-4 mt-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-bento-muted block">Active Provider</span>
              <span className="text-sm font-bold text-brand-indigo mt-0.5 block">{usage.provider_in_use}</span>
              <p className="text-[11px] text-bento-muted mt-1">Automatic provider fallback with exponential jitter enabled.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-bento-muted">Daily Token Allowance</span>
                <span className="text-xs font-mono font-bold">{usage.budget_used_pct}% Used</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-brand-indigo rounded-full transition-bento"
                  style={{ width: `${Math.max(4, usage.budget_used_pct)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-bento-muted font-mono mt-2">
                <span>{usage.tokens_used_today.toLocaleString()} tokens used</span>
                <span>Limit: {usage.daily_budget_tokens.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-bento-muted block">Spend Today</span>
                <span className="text-base font-bold font-mono text-bento-text dark:text-bento-darkText mt-1 block">
                  ${usage.estimated_cost_today_usd.toFixed(4)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-bento-muted block">Month Spend Cap</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  ${usage.monthly_spend_cap_usd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Security Guardrails Check */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-brand-indigo">
                <ShieldCheck className="w-4 h-4" /> Active Security Guardrails
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                • Zero Raw SQL Permission: All queries use verified analytical tools.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                • PII Masking: Automatic redaction of customer identifiers and Brazilian CPFs.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                • Token-Bucket Limiter: Enforces {usage.rate_limit_per_minute} rpm ceiling per client.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-bento-text dark:text-bento-darkText transition-bento"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
