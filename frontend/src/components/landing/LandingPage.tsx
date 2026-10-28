import React, { useEffect, useRef, useState } from 'react';
import { 
  Zap, ArrowRight, ShieldCheck,
  BarChart3, Sparkles, FileText, 
  ExternalLink, Activity, Bot, Database, Lock,
  TrendingUp, Award, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'kpis' | 'agent' | 'categories'>('kpis');

  // Full-screen fixed canvas with interactive mouse constellation & neural particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    interface Dot {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; pulseSpeed: number;
    }

    const dotCount = Math.min(110, Math.floor(window.innerWidth / 14));
    const dots: Dot[] = Array.from({ length: dotCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2.2 + 0.8,
      alpha: Math.random() * 0.45 + 0.15,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update dots
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        d.alpha += Math.sin(Date.now() * d.pulseSpeed) * 0.005;

        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 106, 43, ${Math.max(0.1, Math.min(0.8, d.alpha))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 90, 31, 0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Connect nearby dots with glowing links
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            const lineAlpha = (1 - dist / 110) * 0.18;
            ctx.strokeStyle = `rgba(255, 120, 50, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        // Connect to mouse cursor
        const mdx = dots[i].x - mouseX;
        const mdy = dots[i].y - mouseY;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 140) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(mouseX, mouseY);
          const mAlpha = (1 - mDist / 140) * 0.45;
          ctx.strokeStyle = `rgba(255, 150, 70, ${mAlpha})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // GSAP hero animations + preview tilt
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-anim', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });

      gsap.from('.feature-card', {
        y: 35,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.feature-card',
          start: 'top 85%',
        }
      });

      // 3D mouse tilt on preview card
      const previewEl = previewRef.current;
      if (previewEl) {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = previewEl.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(previewEl, {
            rotationY: x * 0.015,
            rotationX: -y * 0.015,
            transformPerspective: 1200,
            duration: 0.4,
            ease: 'power1.out',
          });
        };
        const handleMouseLeave = () => {
          gsap.to(previewEl, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.7,
            ease: 'elastic.out(1, 0.6)',
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
    { label: 'Audited 6M GMV', value: 'R$ 6.41M', sub: 'Reconciled 2018-03 to 2018-08' },
    { label: 'Delivered Orders', value: '96,478', sub: '99,441 verified lifecycle' },
    { label: 'Unique Buyers', value: '93,358', sub: 'Zero duplicate counts' },
    { label: 'Repeat Buyer Rate', value: '3.00%', sub: '2,801 retention accounts' },
    { label: 'Active SKUs', value: '32,951', sub: 'Across 73 product categories' },
  ];

  return (
    <div ref={heroRef} className="min-h-screen bg-[#070709] text-neutral-100 selection:bg-brand-orange selection:text-white relative overflow-x-hidden font-sans">
      
      {/* === FIXED INTERACTIVE CONSTELLATION CANVAS === */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{ opacity: 0.75 }}
      />

      {/* === AMBIENT NEON GLOW ORBS === */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-orange-600/25 to-amber-500/10 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[550px] right-[-150px] w-[600px] h-[600px] bg-orange-500/15 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[1200px] left-[-150px] w-[600px] h-[600px] bg-amber-600/12 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* === FUTURISTIC CYBER GRID OVERLAY === */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,106,43,0.035) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(255,106,43,0.035) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.1) 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.1) 90%)'
        }}
      />

      {/* === LANDING NAVBAR === */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,90,31,0.6)]">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center">
              Nexus<span className="text-brand-orange">Commerce</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono block">Enterprise AI Intelligence</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-300">
          <a href="#metrics" className="hover:text-brand-orange transition-colors duration-200">Reconciled Metrics</a>
          <a href="#features" className="hover:text-brand-orange transition-colors duration-200">Architecture</a>
          <a href="#pipeline" className="hover:text-brand-orange transition-colors duration-200">AI Agent Engine</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReportModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-xs font-semibold border border-neutral-700/60 text-neutral-200 transition-all duration-200 hover:border-brand-orange/50 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-brand-orange" />
            <span>Export Dossier</span>
          </button>

          <button
            onClick={onLaunchDashboard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-white text-xs font-bold shadow-[0_0_25px_rgba(255,90,31,0.5)] hover:shadow-[0_0_35px_rgba(255,90,31,0.7)] transition-all duration-200 group"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* === HERO SECTION === */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center relative z-10">
        
        {/* Security & Intelligence Badge */}
        <div className="hero-anim inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-orange-500/10 border border-brand-orange/40 text-orange-300 text-xs font-semibold mb-8 shadow-[0_0_25px_rgba(255,106,43,0.2)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Enterprise Telemetry</span>
          <span className="opacity-40">|</span>
          <span className="text-neutral-300">Autonomous AI Agent</span>
          <span className="opacity-40">|</span>
          <span className="text-emerald-400 font-mono">100% Parameterized</span>
        </div>

        {/* Headline */}
        <h1 className="hero-anim text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6">
          Autonomous E-Commerce
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-amber-300 drop-shadow-[0_0_35px_rgba(255,120,40,0.5)]">
            Intelligence Platform
          </span>
        </h1>

        {/* Subhead */}
        <p className="hero-anim text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Grounded directly in <strong className="text-neutral-200 font-semibold">99,441 verified orders</strong>, <strong className="text-neutral-200 font-semibold">73 catalog categories</strong>, and <strong className="text-neutral-200 font-semibold">27 Brazilian state hubs</strong>. Powered by autonomous agentic tools with zero hardcoding and zero SQL injection surface.
        </p>

        {/* Primary CTAs */}
        <div className="hero-anim flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onLaunchDashboard}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-orange hover:bg-orange-500 text-white font-bold text-sm shadow-[0_0_35px_rgba(255,90,31,0.5)] hover:shadow-[0_0_50px_rgba(255,90,31,0.7)] flex items-center justify-center gap-2.5 transition-all duration-200 group"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Live Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenReportModal}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 font-semibold text-sm border border-neutral-700/60 hover:border-brand-orange/40 flex items-center justify-center gap-2 transition-all duration-200 backdrop-blur-md shadow-lg"
          >
            <FileText className="w-4 h-4 text-brand-orange" />
            <span>Generate PDF Dossier</span>
          </button>
        </div>

        {/* Floating Live Telemetry Cards */}
        <div className="hero-anim flex flex-wrap items-center justify-center gap-3 mb-12">
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-[11px] font-mono text-neutral-300 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>Autonomous SQL Agent: <b className="text-brand-orange">Active</b></span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-[11px] font-mono text-neutral-300 flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mathematical Reconciliation: <b className="text-emerald-400">100%</b></span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-[11px] font-mono text-neutral-300 flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PII Masking: <b className="text-neutral-200">Enforced</b></span>
          </div>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div id="metrics" className="hero-anim grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {stats.map((s) => (
            <div key={s.label} className="p-3 text-left relative group cursor-default">
              <div className="absolute inset-0 rounded-xl bg-brand-orange/0 group-hover:bg-brand-orange/10 transition-colors duration-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                {s.label}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1 block group-hover:text-orange-300 transition-colors duration-200">
                {s.value}
              </span>
              <span className="text-[10px] text-neutral-500 truncate block mt-0.5">
                {s.sub}
              </span>
            </div>
          ))}
        </div>

      </section>

      {/* === INTERACTIVE DASHBOARD SHOWCASE === */}
      <section className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div 
          ref={previewRef}
          className="rounded-3xl p-5 sm:p-7 bg-neutral-900/80 border border-neutral-800/80 shadow-[0_0_80px_rgba(255,90,31,0.2)] transition-all duration-300 hover:border-brand-orange/50 backdrop-blur-md relative overflow-hidden"
        >
          {/* Mock Window Bar with Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-neutral-800 text-xs text-neutral-400 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="font-mono text-[11px] ml-2 text-neutral-400">nexuscommerce.ai/app</span>
            </div>

            {/* Interactive Showcase Tabs */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={(e) => { e.stopPropagation(); setActivePreviewTab('kpis'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activePreviewTab === 'kpis' ? 'bg-brand-orange text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Macro Scorecard
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActivePreviewTab('agent'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activePreviewTab === 'agent' ? 'bg-brand-orange text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Bot className="w-3 h-3" /> AI Assistant Turn
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActivePreviewTab('categories'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activePreviewTab === 'categories' ? 'bg-brand-orange text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Category Matrix
              </button>
            </div>
          </div>

          {/* Tab 1: Macro Scorecard Preview */}
          {activePreviewTab === 'kpis' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-black/60 border border-neutral-800/80">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400">
                  <span>6M Gross Merchandise Value</span>
                  <span className="text-emerald-400 font-mono">Audited</span>
                </div>
                <h3 className="text-2xl font-bold font-mono text-white mt-1.5">R$ 6,407,528.90</h3>
                <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                  <span>▲ +10.9% vs prior 6-month period</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/60 border border-neutral-800/80">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400">
                  <span>Delivered Order Fulfillment</span>
                  <span className="text-emerald-400 font-mono">100% Exact</span>
                </div>
                <h3 className="text-2xl font-bold font-mono text-white mt-1.5">96,478 Orders</h3>
                <p className="text-[11px] text-neutral-400 mt-2">
                  Reconciled against 99,441 lifetime order entries
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                <span className="text-[10px] font-bold uppercase text-brand-orange flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Strategic AI Synthesis
                </span>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  "Health & Beauty leads revenue with R$ 689k (10.76% share). 68% of 1-star reviews correlate directly with transit delays outside SP corridor."
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Live AI Assistant Turn */}
          {activePreviewTab === 'agent' && (
            <div className="p-5 rounded-2xl bg-black/70 border border-neutral-800 space-y-3 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-neutral-400 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-brand-orange" />
                  <span>Prompt: "What are our top 3 categories by revenue?"</span>
                </span>
                <span className="text-emerald-400 text-[10px]">Tool: sales_by_category(limit=3)</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/80 text-neutral-200 space-y-1.5 font-sans">
                <p className="font-bold text-orange-400 text-xs">🎯 Executive Headline:</p>
                <p className="text-xs text-neutral-300">
                  Health & Beauty (R$ 689,357.61), Watches & Gifts (R$ 603,953.23), and Bed, Bath & Table (R$ 482,384.98) represent 27.72% of total audited GMV.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Category Matrix */}
          {activePreviewTab === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
              {[
                { name: 'Health & Beauty', rev: 'R$ 689,357.61', share: '10.76%', units: '4,572 units' },
                { name: 'Watches & Gifts', rev: 'R$ 603,953.23', share: '9.43%', units: '2,949 units' },
                { name: 'Bed, Bath & Table', rev: 'R$ 482,384.98', share: '7.53%', units: '4,289 units' },
              ].map((c) => (
                <div key={c.name} className="p-4 rounded-xl bg-black/60 border border-neutral-800">
                  <p className="text-xs font-bold text-white">{c.name}</p>
                  <p className="text-base font-bold font-mono text-brand-orange mt-1">{c.rev}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{c.share} GMV · {c.units}</p>
                </div>
              ))}
            </div>
          )}

          {/* Click to launch bar */}
          <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Experience all 5 interactive modules with live drilldowns
            </span>
            <button
              onClick={onLaunchDashboard}
              className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* === FEATURE BENTO GRID === */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Enterprise Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Engineered for Mathematical & Operational Rigor
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl mx-auto">
            Traditional AI dashboards fabricate numbers or risk SQL injection. NexusCommerce enforces mathematical integrity and parameter verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: 'Zero Arbitrary SQL Surface',
              desc: 'The AI agent interacts through typed, parameterized tools. No LLM hallucinated query can alter or execute destructive operations.',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500/20',
            },
            {
              icon: BarChart3,
              title: '100% Mathematical Reconciliation',
              desc: 'Every KPI reconciles exactly across category tables, regional heatmaps, and monthly timeseries (R$ 6,407,528.90).',
              color: 'text-brand-orange',
              bg: 'bg-orange-500/10',
              border: 'border-brand-orange/20',
            },
            {
              icon: FileText,
              title: 'Vector PDF Report Compilation',
              desc: 'Server-side ReportLab document generation creates two-page executive dossiers complete with audited scorecards and strategic steps.',
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
              border: 'border-blue-500/20',
            },
          ].map((f, i) => (
            <div 
              key={i}
              className={`feature-card p-6 rounded-3xl bg-neutral-900/60 border ${f.border} space-y-3 hover:bg-neutral-900/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm`}
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} ${f.color} flex items-center justify-center`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">{f.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === PIPELINE FLOW === */}
      <section id="pipeline" className="max-w-6xl mx-auto px-6 py-16 border-t border-neutral-900/80 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Autonomous Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            How The Agentic Intelligence Pipeline Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Intent & Tool Selection', desc: 'Agent analyzes query intent and dispatches typed parameters to live database tools.' },
            { step: '02', title: 'Memoized Telemetry Query', desc: 'Queries execute securely with deduplication and PII redaction across all identifiers.' },
            { step: '03', title: 'Structured Grounding', desc: 'Facts JSON validates synthesized metrics against ground truth to prevent hallucinations.' },
            { step: '04', title: 'Streaming Executive Answer', desc: 'Rendered directly via SSE stream with executive headline, verified table, and actions.' },
          ].map((item) => (
            <div 
              key={item.step} 
              className="feature-card p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 hover:border-brand-orange/40 hover:bg-neutral-900/80 transition-all duration-300 group"
            >
              <span className="font-mono text-xs font-bold text-brand-orange block mb-2">{item.step}</span>
              <h4 className="font-bold text-sm text-white group-hover:text-orange-200 transition-colors">{item.title}</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-neutral-900/80 py-8 px-6 text-center text-xs text-neutral-500 relative z-10">
        <p>© 2026 NexusCommerce AI · Enterprise Analytics Platform · Audited Live Telemetry</p>
      </footer>
    </div>
  );
};
