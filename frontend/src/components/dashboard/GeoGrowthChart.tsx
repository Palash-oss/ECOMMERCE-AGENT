import React, { useState } from 'react';
import { MapPin, Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { GeoRegion } from '../../types';

interface GeoGrowthChartProps {
  data: GeoRegion[];
  onAskAiPrompt?: (prompt: string) => void;
}

export const GeoGrowthChart: React.FC<GeoGrowthChartProps> = ({ data, onAskAiPrompt }) => {
  const [viewMode, setViewMode] = useState<'top5' | 'all27'>('top5');
  const [searchQuery, setSearchQuery] = useState('');

  // Total national buyers across all returned states
  const totalNationalCustomers = data.reduce((acc, curr) => acc + curr.customers, 0);

  // Filtered list
  const filteredData = data.filter((st) => 
    st.state_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.state_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayStates = viewMode === 'top5' ? filteredData.slice(0, 5) : filteredData;
  const maxBuyers = data.length > 0 ? data[0].customers : 1;

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col h-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
              Regional Customer Demand
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono">
              27 Brazilian Hubs
            </span>
          </div>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">
            Verified buyer volume and carrier shipping overhead across all Brazilian states
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px] font-medium border border-neutral-200 dark:border-neutral-700/60">
            <button
              onClick={() => setViewMode('top5')}
              className={`px-2.5 py-1 rounded-md transition-bento ${
                viewMode === 'top5'
                  ? 'bg-brand-orange text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Top 5 Hubs
            </button>
            <button
              onClick={() => setViewMode('all27')}
              className={`px-2.5 py-1 rounded-md transition-bento ${
                viewMode === 'all27'
                  ? 'bg-brand-orange text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              All 27 States ({data.length})
            </button>
          </div>

          {onAskAiPrompt && (
            <button
              onClick={() => onAskAiPrompt('Explain the regional demand concentration in São Paulo versus remote states and the freight disparity across all 27 Brazilian states.')}
              className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-brand-orange hover:text-brand-orangeDark transition-bento px-2 py-1 rounded-lg bg-orange-500/10"
              title="Ask AI to analyze geographic disparity"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input when viewing all 27 */}
      {viewMode === 'all27' && (
        <div className="relative mb-3 animate-in fade-in duration-150">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search state name or code (e.g. Amazonas, SP, Bahia)..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-bento-border dark:border-bento-darkBorder text-xs text-bento-text dark:text-bento-darkText focus:outline-none focus:border-brand-orange"
          />
        </div>
      )}

      {/* States List */}
      <div 
        className={`space-y-3 flex-1 overflow-y-auto pr-1 ${
          viewMode === 'all27' ? 'max-h-[340px]' : 'justify-center flex flex-col'
        }`}
      >
        {displayStates.length === 0 ? (
          <p className="text-center py-6 text-xs text-bento-muted">
            No states found matching "{searchQuery}".
          </p>
        ) : (
          displayStates.map((st, idx) => {
            const share = totalNationalCustomers > 0 
              ? Math.round((st.customers / totalNationalCustomers) * 100) 
              : 0;
            const barWidth = Math.max(6, Math.round((st.customers / maxBuyers) * 100));

            return (
              <div 
                key={st.state_code} 
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-bento"
              >
                {/* State Rank & Code Badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="w-4 text-[10px] font-mono text-neutral-400 text-right">
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 flex items-center justify-center font-bold text-xs text-brand-orange dark:text-brand-neon font-mono">
                    {st.state_code}
                  </div>
                </div>

                {/* State & Metrics */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-bento-text dark:text-bento-darkText truncate">
                      {st.state_name}
                    </span>
                    <span className="font-mono text-bento-muted dark:text-bento-darkMuted text-[11px]">
                      <b className="text-bento-text dark:text-bento-darkText">{st.customers.toLocaleString()}</b> buyers ({share}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-brand-orange rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,106,43,0.35)]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Freight Overhead */}
                <div className="text-right text-[11px] font-mono text-neutral-500 flex-shrink-0 min-w-[70px]">
                  R$ {st.avg_freight.toFixed(1)}<span className="text-[9px] opacity-70">/ship</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info when viewing Top 5 */}
      {viewMode === 'top5' && (
        <div className="pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-bento-muted dark:text-bento-darkMuted">
          <span>Top 5 hubs account for 90% of national volume</span>
          <button
            onClick={() => setViewMode('all27')}
            className="text-brand-orange font-semibold hover:underline flex items-center gap-1"
          >
            <span>View all 27 states</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
