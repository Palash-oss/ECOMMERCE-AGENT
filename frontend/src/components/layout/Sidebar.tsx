import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, ShoppingCart, Bot, 
  FileText, ShieldCheck, Zap, ChevronLeft, ChevronRight 
} from 'lucide-react';

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

  return (
    <aside 
      style={{ 
        width: collapsed ? 80 : 240, 
        transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)' 
      }}
      className={`hidden md:flex flex-col justify-between flex-shrink-0 select-none overflow-hidden ${
        collapsed ? 'p-2' : 'p-3.5'
      }`}
    >
      {/* Floating rounded bento card */}
      <div 
        className={`bg-bento-card dark:bg-bento-darkCard rounded-bento shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col h-full relative ${
          collapsed ? 'p-2 items-center' : 'p-3.5'
        }`}
      >
        
        {/* Brand Header */}
        <div className={`flex items-center gap-3 mb-6 ${collapsed ? 'justify-center w-full' : 'px-1.5'}`}>
          <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white shadow-bento-hero flex-shrink-0">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <h1 className="font-bold text-sm tracking-tight text-bento-text dark:text-bento-darkText flex items-center">
                Nexus<span className="text-brand-orange">Commerce</span>
              </h1>
              <p className="text-[10px] text-bento-muted dark:text-bento-darkMuted font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Intelligence
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`space-y-2 flex-1 w-full ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {navItems.map((item) => {
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
                title={item.label}
                className={`transition-all duration-200 relative group flex items-center ${
                  collapsed
                    ? `w-11 h-11 justify-center rounded-xl ${
                        isActive
                          ? 'bg-brand-orange text-white shadow-bento-hero ring-2 ring-brand-orange/30'
                          : 'text-bento-muted dark:text-bento-darkMuted hover:text-bento-text dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`
                    : `w-full gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-brand-orange text-white shadow-bento-hero'
                          : 'text-bento-muted dark:text-bento-darkMuted hover:text-bento-text dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40'
                      }`
                }`}
              >
                <Icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-brand-orange'}`} />
                
                {!collapsed && (
                  <>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">
                      {item.label}
                    </span>

                    {item.isSpecial && (
                      <span 
                        className="flex items-center gap-1 flex-shrink-0 ml-auto"
                        title="AI Assistant Ready"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-orange-500/15 text-brand-orange dark:text-brand-neon">
                          LIVE
                        </span>
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle button */}
        <div className={`pt-2 pb-1 border-t border-neutral-100 dark:border-neutral-800/80 w-full flex items-center ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!collapsed && (
            <span className="text-[10px] text-bento-muted font-mono px-2 overflow-hidden whitespace-nowrap">
              Press <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold">[</kbd>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`rounded-lg text-neutral-400 hover:text-brand-orange hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-bento ${
              collapsed ? 'w-9 h-9 flex items-center justify-center' : 'p-1.5'
            }`}
            title={collapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Security & Cluster Status Footer */}
        <div className={`pt-2 border-t border-neutral-100 dark:border-neutral-800 w-full ${collapsed ? 'flex justify-center' : 'px-1'}`}>
          <div 
            className={`flex items-center gap-1.5 text-[11px] font-medium text-bento-muted dark:text-bento-darkMuted ${collapsed ? 'justify-center w-9 h-9' : ''}`}
            title="Verified Live Telemetry · Fully Audited"
          >
            <ShieldCheck className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-500 flex-shrink-0`} />
            {!collapsed && (
              <span className="truncate overflow-hidden whitespace-nowrap">
                Live Data · Audited
              </span>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
