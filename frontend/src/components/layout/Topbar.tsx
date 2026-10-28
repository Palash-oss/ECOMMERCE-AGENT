import React, { useState } from 'react';
import { 
  Search, Moon, Sun, Download, Bell, Sparkles, 
  Calendar, CheckCircle2, Loader2 
} from 'lucide-react';
import { api } from '../../api/client';

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenChat: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenCommandPalette,
  onOpenChat,
  darkMode,
  setDarkMode
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      await api.downloadPdfReport();
    } catch (err) {
      alert('Report download error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      {/* Left: Greeting & Date Range */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-bento-text dark:text-bento-darkText">
            E-Commerce Performance
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-brand-emerald">
            <CheckCircle2 className="w-3 h-3" /> 99,441 Orders
          </span>
        </div>
        <p className="text-xs text-bento-muted mt-0.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Audit Period: <b>2016-09-15</b> to <b>2018-08-29</b></span>
        </p>
      </div>

      {/* Center/Right: Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Command Palette Trigger Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 px-3.5 py-2 bg-bento-card dark:bg-bento-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 text-bento-muted text-xs font-medium rounded-xl border border-slate-200/80 dark:border-bento-darkBorder shadow-bento transition-bento"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search SKUs, categories...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 rounded font-mono text-slate-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Download Server-Side PDF Report */}
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center gap-2 px-3.5 py-2 bg-bento-card dark:bg-bento-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 text-bento-text dark:text-bento-darkText text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-bento-darkBorder shadow-bento transition-bento"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-indigo" />
          ) : (
            <Download className="w-3.5 h-3.5 text-brand-indigo" />
          )}
          <span className="hidden sm:inline">Download Report</span>
        </button>

        {/* Launch AI Assistant Quick Pill */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-bento-hero transition-bento"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Agent</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 rounded-xl bg-bento-card dark:bg-bento-darkCard flex items-center justify-center text-bento-muted hover:text-bento-text dark:hover:text-white border border-slate-200/80 dark:border-bento-darkBorder shadow-bento transition-bento"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            P
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold leading-none text-bento-text dark:text-bento-darkText">Palash</p>
            <p className="text-[10px] text-brand-indigo font-semibold mt-0.5">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};
