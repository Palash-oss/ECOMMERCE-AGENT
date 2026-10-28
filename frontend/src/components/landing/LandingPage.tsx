import React, { useEffect, useRef } from 'react';
import { 
  Zap, ArrowRight, ShieldCheck, Database, CheckCircle2, 
  BarChart3, Sparkles, FileText, ChevronRight, Lock, 
  ExternalLink, Layers, Terminal, Activity 
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onLaunchDashboard: () => void;
  onOpenReportModal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchDashboard,
  onOpenReportModal,
  darkMode,
  setDarkMode
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero elements fade up
      gsap.from('.hero-anim', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // Interactive 3D mouse tilt on preview card
      const previewEl = previewRef.current;
      if (previewEl) {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = previewEl.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(previewEl, {
            rotationY: x * 0.02,
            rotationX: -y * 0.02,
            transformPerspective: 1000,
            duration: 0.5,
            ease: 'power1.out',
          });
        };
        const handleMouseLeave = () => {
          gsap.to(previewEl, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.7,
            ease: 'power2.out',
          });
        };
        previewEl.addEventListener('mousemove', handleMouseMove);
        previewEl.addEventListener('mouseleave', handleMouseLeave);

        return () => {
          previewEl.removeEventListener('mousemove', handleMouseMove);
          previewEl.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { label: '6-Month GMV', value: 'R$ 6.41M', sub: 'Audited 2018-03 to 2018-08' },
    { label: 'Delivered Orders', value: '96,478', sub: '99,441 Lifetime orders' },
    { label: 'Unique Customers', value: '93,358', sub: 'Delivered buyers' },
    { label: 'Repeat Buyer Rate', value: '3.00%', sub: '2,801 returning buyers' },
    { label: 'Catalog Categories', value: '73', sub: '100% Brazilian hubs mapped' },
  ];

  return (
    <div ref={heroRef} className="min-h-screen bg-[#0A0A0B] text-neutral-100 selection:bg-brand-orange selection:text-white relative overflow-hidden font-sans">
      
      {/* Background radial neon glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-brand-orange/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Landing Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white shadow-bento-hero">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center">
              Nexus<span className="text-brand-orange">Commerce</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono block">CockroachDB Enterprise Telemetry</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-300">
          <a href="#metrics" className="hover:text-brand-orange transition-bento">Audited Metrics</a>
          <a href="#features" className="hover:text-brand-orange transition-bento">Agent Guardrails</a>
          <a href="#architecture" className="hover:text-brand-orange transition-bento">Read-Only Safety</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReportModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold border border-neutral-800 text-neutral-300 transition-bento"
          >
            <FileText className="w-3.5 h-3.5 text-brand-orange" />
            <span>PDF Dossier</span>
          </button>

          <button
            onClick={onLaunchDashboard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeDark text-white text-xs font-bold shadow-bento-hero transition-bento group"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center relative z-10">
        
        {/* Security badge pill */}
        <div className="hero-anim inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-brand-orange/30 text-brand-neon text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4 text-brand-neon" />
          <span>Strictly Read-Only Live CockroachDB • Zero Hallucinations</span>
        </div>

        {/* Headline */}
        <h1 className="hero-anim text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Enterprise E-Commerce Analytics, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-orange-400 to-amber-300">
            Powered by Autonomous AI
          </span>
        </h1>

        {/* Subhead */}
        <p className="hero-anim text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Reconciled data intelligence across <strong>99,441 orders</strong>, <strong>73 product categories</strong>, and <strong>27 Brazilian states</strong>. Built with parameterized AI tools, strict guardrails, and zero raw SQL vulnerabilities.
        </p>

        {/* CTA Buttons */}
        <div className="hero-anim flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onLaunchDashboard}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-orange hover:bg-brand-orangeDark text-white font-bold text-sm shadow-bento-hero flex items-center justify-center gap-2 transition-bento"
          >
            <span>Open Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenReportModal}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 font-semibold text-sm border border-neutral-800 flex items-center justify-center gap-2 transition-bento"
          >
            <FileText className="w-4 h-4 text-brand-orange" />
            <span>Generate Executive PDF</span>
          </button>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div ref={tickerRef} id="metrics" className="hero-anim grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-md">
          {stats.map((s) => (
            <div key={s.label} className="p-3 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                {s.label}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1 block">
                {s.value}
              </span>
              <span className="text-[10px] text-neutral-500 truncate block mt-0.5">
                {s.sub}
              </span>
            </div>
          ))}
        </div>

      </section>

      {/* Bento Dashboard Interactive Preview */}
      <section className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div 
          ref={previewRef}
          onClick={onLaunchDashboard}
          className="rounded-3xl p-4 sm:p-6 bg-neutral-900/80 border border-neutral-800 shadow-[0_0_60px_rgba(255,106,43,0.20)] cursor-pointer transition-all hover:border-brand-orange/40 group relative overflow-hidden"
        >
          {/* Top Mock Window Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="font-mono text-[11px] ml-2 text-neutral-500">nexuscommerce-ai.cloud/app</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-brand-neon">
              <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
              <span>CockroachDB DefaultDB Live</span>
            </div>
          </div>

          {/* Bento Mock Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-none">
            {/* Card 1: Hero GMV */}
            <div className="p-5 rounded-2xl bg-black border border-neutral-800">
              <span className="text-[10px] font-bold uppercase text-neutral-400">6M Verified GMV</span>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">R$ 6,407,528.90</h3>
              <p className="text-[11px] text-brand-neon mt-2 flex items-center gap-1">
                <span>+10.9% vs prior 6M</span>
              </p>
            </div>

            {/* Card 2: Orders */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Delivered Orders</span>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">40,845</h3>
              <p className="text-[11px] text-emerald-400 mt-2">+10.8% vs prior 6M</p>
            </div>

            {/* Card 3: AI Executive Signal */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] font-bold uppercase text-brand-neon flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Agent Verdict
              </span>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                "Healthy velocity with R$ 6.41M GMV in 6M window. São Paulo leads with 41.8% demand; repeat rate steady at 3.00%."
              </p>
            </div>
          </div>

          {/* Floating Hover Indicator */}
          <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-5 py-2.5 rounded-full bg-brand-orange text-white text-xs font-bold shadow-2xl flex items-center gap-2">
              Click to Open Full Interactive Dashboard <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" ref={featuresRef} className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Architecture & Security</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Engineered for Commercial Rigor
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl mx-auto">
            Traditional AI dashboards hallucinate numbers or execute dangerous arbitrary SQL. NexusCommerce enforces mathematical integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Zero Raw SQL Execution</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The AI agent communicates strictly through typed, parameterized Python functions. No LLM can craft destructive SQL queries or inject drops.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Canonical 100% Reconciliation</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Delivered GMV perfectly reconciles across category totals, state totals, and monthly timeseries (R$ 6,407,528.90). All verified by automated tests.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Server-Side PDF Dossiers</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Clean server-side ReportLab compilation. Generates complete A4 reports with exact scorecards, category splits, top items, and AI insights.
            </p>
          </div>

        </div>
      </section>

      {/* 4-Step Pipeline Flow */}
      <section id="architecture" ref={flowRef} className="max-w-6xl mx-auto px-6 py-16 border-t border-neutral-900 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Pipeline</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            How NexusCommerce AI Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Parameterized Query', desc: 'Agent triggers typed tools for date-bounded aggregates on CockroachDB.' },
            { step: '02', title: 'Data Reconciliation', desc: 'Metrics Service checks category sums against timeseries and macro totals.' },
            { step: '03', title: 'Number Validation', desc: 'Facts JSON validates LLM output before presentation to prevent hallucinations.' },
            { step: '04', title: '4-Part Response', desc: 'Output rendered cleanly with headline, metrics table, drivers, and next actions.' },
          ].map((item) => (
            <div key={item.step} className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
              <span className="font-mono text-xs font-bold text-brand-orange block mb-2">{item.step}</span>
              <h4 className="font-bold text-sm text-white">{item.title}</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="border-t border-neutral-900 py-8 px-6 text-center text-xs text-neutral-500">
        <p>© 2026 NexusCommerce AI. Strictly read-only connection to CockroachDB Cloud (AWS ap-south-1).</p>
      </footer>

    </div>
  );
};
