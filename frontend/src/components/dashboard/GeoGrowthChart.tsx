import React from 'react';
import { MapPin, TrendingUp } from 'lucide-react';
import { GeoRegion } from '../../types';

interface GeoGrowthChartProps {
  data: GeoRegion[];
}

export const GeoGrowthChart: React.FC<GeoGrowthChartProps> = ({ data }) => {
  const topStates = data.slice(0, 5);
  const totalCustomers = topStates.reduce((acc, curr) => acc + curr.customers, 0);

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-white/70 dark:border-bento-darkBorder flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
            Customer Growth by Location
          </h3>
          <p className="text-xs text-bento-muted mt-0.5">Top demographic consumer hubs in Brazil</p>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <MapPin className="w-3 h-3 text-brand-indigo" /> 27 States
        </span>
      </div>

      <div className="space-y-3.5 flex-1 justify-center flex flex-col">
        {topStates.map((st) => {
          const share = totalCustomers > 0 ? Math.round((st.customers / totalCustomers) * 100) : 0;
          return (
            <div key={st.state_code} className="flex items-center gap-3">
              {/* Flag/State Badge */}
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-brand-indigo">
                {st.state_code}
              </div>

              {/* State & Metrics */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-bento-text dark:text-bento-darkText truncate">
                    {st.state_name}
                  </span>
                  <span className="font-mono text-bento-muted text-[11px]">
                    {st.customers.toLocaleString()} buyers ({share}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-indigo to-brand-violet rounded-full transition-bento"
                    style={{ width: `${Math.max(12, share)}%` }}
                  ></div>
                </div>
              </div>

              {/* Freight Overhead */}
              <div className="text-right text-[11px] font-mono text-slate-500 hidden sm:block">
                R$ {st.avg_freight.toFixed(1)}/ship
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
