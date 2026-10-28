import React, { useState } from 'react';
import { 
  Search, Moon, Sun, Download, Sparkles, 
  Calendar, CheckCircle2, Loader2, ArrowUpRight 
} from 'lucide-react';
import { api } from '../../api/client';

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenChat: () => void;
  onOpenReportModal?: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenCommandPalette,
  onOpenChat,
  onOpenReportModal,
  darkMode,
  setDarkMode
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    if (onOpenReportModal) {
      onOpenReportModal();
      return;
    }
    try {
      setDownloading(true);
      await api.downloadPdfReport('2018-03-01', '2018-08-31', 'delivered');
    } catch (err) {
      alert('Report download error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      {/* Left: Reconciled Date Range & Delivered Proof */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-bento-text dark:text-bento-darkText">
            E-Commerce Performance
          </h2>
          <span 
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            title="Delivered orders benchmark (96,478) reconciled against all lifetime orders (99,441)"
          >
            <CheckCircle2 className="w-3 h-3" /> Delivered: 96,478 <span className="opacity-70 font-normal">(all: 99,441)</span>
          </span>
        </div>
        <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5 flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-brand-orange" />
          <span>Active Audit Window: <b className="text-bento-text dark:text-bento-darkText">2018-03-01</b> to <b className="text-bento-text dark:text-bento-darkText">2018-08-31</b> <span className="opacity-75">(Last 6 complete months)</span></span>
        </p>
      </div>

      {/* Center/Right: Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Command Palette Trigger Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 px-3.5 py-2 bg-bento-card dark:bg-bento-darkCard hover:bg-neutral-50 dark:hover:bg-neutral-800 text-bento-muted dark:text-bento-darkMuted text-xs font-medium rounded-xl border border-bento-border dark:border-bento-darkBorder shadow-bento transition-bento"
        >
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Search SKUs, categories...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-neutral-500 border border-neutral-200 dark:border-neutral-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Download Server-Side PDF Report */}
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center gap-2 px-3.5 py-2 bg-bento-card dark:bg-bento-darkCard hover:bg-neutral-50 dark:hover:bg-neutral-800 text-bento-text dark:text-bento-darkText text-xs font-semibold rounded-xl border border-bento-border dark:border-bento-darkBorder shadow-bento transition-bento hover:border-brand-orange/40"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" />
          ) : (
            <Download className="w-3.5 h-3.5 text-brand-orange" />
          )}
          <span className="hidden sm:inline">Generate PDF</span>
        </button>

        {/* Launch AI Assistant Button */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-orange hover:bg-brand-orangeDark text-white text-xs font-semibold rounded-xl shadow-bento-hero transition-bento"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Agent</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 rounded-xl bg-bento-card dark:bg-bento-darkCard flex items-center justify-center text-bento-muted hover:text-bento-text dark:hover:text-white border border-bento-border dark:border-bento-darkBorder shadow-bento transition-bento"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>
      </div>
    </header>
  );
};
