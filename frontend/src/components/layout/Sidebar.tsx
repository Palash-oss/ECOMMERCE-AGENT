import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBag, ShoppingCart, Bot, 
  FileText, ShieldCheck, Zap, ChevronLeft, ChevronRight 
} from 'lucide-react';
import gsap from 'gsap';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenChat: () => void;
  onOpenReportModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenChat,
  onOpenReportModal
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const textLabelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const pillRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, isSpecial: true },
    { id: 'report', label: 'PDF Report', icon: FileText },
  ];

  // Keyboard shortcut '[' to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '[' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // GSAP animation on collapse toggle
  useEffect(() => {
    if (!sidebarRef.current) return;

    const ctx = gsap.context(() => {
      const targetWidth = collapsed ? 76 : 240;

      gsap.to(sidebarRef.current, {
        width: targetWidth,
        duration: 0.35,
        ease: 'power3.out',
      });

      if (collapsed) {
        gsap.to(textLabelsRef.current, {
          opacity: 0,
          x: -10,
          duration: 0.15,
          stagger: 0.02,
          display: 'none',
        });
      } else {
        gsap.to(textLabelsRef.current, {
          display: 'inline-block',
          opacity: 1,
          x: 0,
          duration: 0.25,
          delay: 0.1,
          stagger: 0.03,
          ease: 'power2.out',
        });
      }
    }, sidebarRef);

    return () => ctx.revert();
  }, [collapsed]);

  const activeIndex = navItems.findIndex((item) => item.id === activeTab);

  return (
    <aside 
      ref={sidebarRef}
      style={{ width: collapsed ? 76 : 240 }}
      className="hidden md:flex flex-col justify-between p-3.5 flex-shrink-0 transition-all select-none"
    >
      {/* Floating rounded bento card */}
      <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-3.5 shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col h-full relative overflow-hidden">
        
        {/* Brand Header */}
        <div className={`flex items-center gap-3 mb-6 px-1.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white shadow-bento-hero flex-shrink-0">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-bold text-sm tracking-tight text-bento-text dark:text-bento-darkText flex items-center">
                Nexus<span className="text-brand-orange">Commerce</span>
              </h1>
              <p className="text-[10px] text-bento-muted dark:text-bento-darkMuted font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                CockroachDB Live
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links with animated active indicator */}
        <nav className="space-y-1.5 flex-1 relative">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'assistant') {
                    onOpenChat();
                  } else if (item.id === 'report' && onOpenReportModal) {
                    onOpenReportModal();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-bento relative group ${
                  isActive
                    ? 'bg-brand-orange text-white shadow-bento-hero'
                    : 'text-bento-muted dark:text-bento-darkMuted hover:text-bento-text dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-brand-orange'}`} />
                
                {!collapsed && (
                  <span 
                    ref={(el) => (textLabelsRef.current[idx] = el)}
                    className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left"
                  >
                    {item.label}
                  </span>
                )}

                {item.isSpecial && (
                  <span 
                    className={`flex items-center gap-1.5 flex-shrink-0 ${collapsed ? 'absolute top-1 right-1' : 'ml-auto'}`}
                    title="AI Assistant Ready"
                  >
                    <span className="w-2 h-2 rounded-full bg-brand-orange dark:bg-brand-neon animate-ping"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange dark:bg-brand-neon absolute"></span>
                    {!collapsed && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-orange-500/15 text-brand-orange dark:text-brand-neon">
                        LIVE
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle button */}
        <div className="pt-2 pb-1 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          {!collapsed && (
            <span className="text-[10px] text-bento-muted font-mono px-2">
              Press <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold">[</kbd>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-brand-orange hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-bento ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Security & Cluster Status Footer */}
        <div className={`pt-2 px-1 border-t border-neutral-100 dark:border-neutral-800 ${collapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-medium text-bento-muted dark:text-bento-darkMuted ${collapsed ? 'justify-center' : ''}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            {!collapsed && <span className="truncate">Read-only · ap-south-1</span>}
          </div>
          {!collapsed && (
            <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono truncate">
              CockroachDB DefaultDB
            </p>
          )}
        </div>

      </div>
    </aside>
  );
};
