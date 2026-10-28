import React from 'react';
import { Sparkles, AlertTriangle, ArrowRight, Lightbulb, CheckCircle } from 'lucide-react';
import { ExecutiveSummary } from '../../types';

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary | null;
  onAskAi: (prompt: string) => void;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ summary, onAskAi }) => {
  if (!summary) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 dark:from-slate-900/80 dark:via-bento-darkCard dark:to-slate-900/80 rounded-bento p-6 shadow-bento border border-indigo-100/80 dark:border-indigo-900/30">
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-violet text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-bento-text dark:text-bento-darkText flex items-center gap-2">
              Autonomous AI Executive Synthesis
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-brand-indigo uppercase tracking-wider">
                Live Data Audit
              </span>
            </h3>
            <p className="text-xs font-semibold text-brand-indigo mt-0.5">{summary.headline}</p>
          </div>
        </div>

        <button
          onClick={() => onAskAi("Elaborate on the risks and recommended actions from the executive summary")}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-brand-indigo hover:bg-indigo-50 dark:hover:bg-slate-700 transition-bento flex items-center gap-1.5 shadow-sm"
        >
          <span>Elaborate with AI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800">
        {/* Insights */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-bento-muted uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Key Insights
          </p>
          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
            {summary.insights.slice(0, 2).map((ins, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-brand-indigo font-bold">•</span>
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Operational Risks
          </p>
          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
            {summary.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strategic Actions */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Recommended Actions
          </p>
          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
            {summary.actions.slice(0, 2).map((act, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-brand-emerald font-bold">•</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
