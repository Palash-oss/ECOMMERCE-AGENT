import React from 'react';
import { Sparkles, AlertTriangle, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { ExecutiveSummary } from '../../types';

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary | null;
  onAskAi: (prompt: string) => void;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ summary, onAskAi }) => {
  if (!summary) return null;

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/10 transition-bento"></div>

      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-brand-orange dark:text-brand-neon flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-bento-text dark:text-bento-darkText flex items-center gap-2">
              Autonomous AI Executive Synthesis
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-brand-orange dark:text-brand-neon uppercase tracking-wider">
                Audited Telemetry
              </span>
            </h3>
            <p className="text-xs font-semibold text-brand-orange dark:text-brand-neon mt-0.5">{summary.headline}</p>
          </div>
        </div>

        <button
          onClick={() => onAskAi("Elaborate on the risks and recommended actions from the executive summary")}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-brand-orange hover:bg-orange-500/10 transition-bento flex items-center gap-1.5 shadow-sm"
        >
          <span>Elaborate with AI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 relative z-10">
        {/* Insights */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-bento-muted dark:text-bento-darkMuted uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Key Insights
          </p>
          <ul className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
            {summary.insights.slice(0, 2).map((ins, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-brand-orange font-bold">•</span>
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
          <ul className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
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
          <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Actions
          </p>
          <ul className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
            {summary.actions.slice(0, 2).map((act, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
