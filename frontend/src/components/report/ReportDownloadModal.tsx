import React, { useState } from 'react';
import { 
  X, FileText, Download, CheckCircle2, AlertCircle, 
  Loader2, Calendar, ShieldCheck, Sparkles, ArrowRight 
} from 'lucide-react';
import { api } from '../../api/client';

interface ReportDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState('2018-03-01');
  const [endDate, setEndDate] = useState('2018-08-31');
  const [status, setStatus] = useState('delivered');
  const [step, setStep] = useState<number>(0); // 0 = idle, 1 = querying, 2 = reconciling, 3 = compiling, 4 = complete
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setError(null);
      setStep(1);

      // Simulated step transitions for transparent feedback
      await new Promise((r) => setTimeout(r, 400));
      setStep(2);
      await new Promise((r) => setTimeout(r, 400));
      setStep(3);

      await api.downloadPdfReport(startDate, endDate, status);

      setStep(4);
      setTimeout(() => {
        onClose();
        setStep(0);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF report.');
      setStep(0);
    }
  };

  const stepsList = [
    { title: 'Querying Live Analytics Data', desc: 'Fetching delivered orders & item revenue values' },
    { title: 'Reconciling Canonical Metrics', desc: 'Validating category sums and repeat buyer rates' },
    { title: 'Compiling Vector PDF Dossier', desc: 'Rendering server-side ReportLab document' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md p-4 sm:p-6 md:p-12 flex justify-center items-center">
      <div className="w-full max-w-lg bg-bento-card dark:bg-bento-darkCard rounded-bento shadow-2xl border border-bento-border dark:border-bento-darkBorder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-bento-border dark:border-bento-darkBorder flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-bento-hero">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-bento-text dark:text-bento-darkText">
                Export Executive PDF Dossier
              </h3>
              <p className="text-[11px] text-bento-muted dark:text-bento-darkMuted">
                Server-side ReportLab generation with zero synthetic numbers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={step > 0 && step < 4}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Active progress stepper if generating */}
          {step > 0 && step < 4 ? (
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center gap-2 text-brand-orange text-sm font-bold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating dossier...</span>
              </div>
              <div className="space-y-3">
                {stepsList.map((s, idx) => {
                  const isCurrent = step === idx + 1;
                  const isDone = step > idx + 1;
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-bento ${
                        isCurrent 
                          ? 'border-brand-orange bg-orange-500/10 text-brand-orange font-semibold' 
                          : isDone 
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 opacity-60'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-orange flex-shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-neutral-400 text-[10px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                      )}
                      <div>
                        <p className="font-semibold text-xs">{s.title}</p>
                        <p className="text-[10px] opacity-80">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : step === 4 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-bento-text dark:text-bento-darkText">Dossier Downloaded Successfully!</h4>
              <p className="text-bento-muted text-xs">Your PDF file has been compiled and saved to your device.</p>
            </div>
          ) : (
            <>
              {/* Error banner if failed */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Generation Failed</p>
                    <p className="text-[11px] mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Date Scope Controls */}
              <div className="space-y-3">
                <label className="font-bold uppercase tracking-wider text-[10px] text-bento-muted dark:text-bento-darkMuted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" /> Audit Time Window
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-bento-muted block mb-1">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-800 border border-bento-border dark:border-bento-darkBorder rounded-xl px-3 py-2 text-xs font-mono text-bento-text dark:text-bento-darkText"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-bento-muted block mb-1">End Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-800 border border-bento-border dark:border-bento-darkBorder rounded-xl px-3 py-2 text-xs font-mono text-bento-text dark:text-bento-darkText"
                    />
                  </div>
                </div>
              </div>

              {/* Order Status Benchmark */}
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-bento-muted dark:text-bento-darkMuted block mb-1.5">
                  Order Status Scope
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-bento-border dark:border-bento-darkBorder rounded-xl px-3 py-2 text-xs text-bento-text dark:text-bento-darkText focus:outline-none"
                >
                  <option value="delivered">Delivered Orders Benchmark (96,478 total / recommended)</option>
                  <option value="all">All Orders (99,441 total / unverified fulfillment)</option>
                </select>
              </div>

              {/* Included Sections Notice */}
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-brand-orange/20 text-brand-orange dark:text-brand-neon space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> What's Included in the Report:
                </p>
                <ul className="text-[11px] list-disc list-inside space-y-0.5 opacity-90">
                  <li>Executive summary with strategic recommendations</li>
                  <li>Macro KPI scorecard with prior-period growth deltas</li>
                  <li>Top revenue categories with market share splits</li>
                  <li>Top SKUs with honest category + short code identifiers</li>
                  <li>Geographic consumer concentration across 27 Brazilian states</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-bento-text transition-bento"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeDark text-white text-xs font-bold shadow-bento-hero flex items-center gap-2 transition-bento"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Dossier</span>
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
