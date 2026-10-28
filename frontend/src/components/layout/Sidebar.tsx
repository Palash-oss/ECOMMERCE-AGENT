import React from 'react';
import { 
  LayoutDashboard, ShoppingBag, ShoppingCart, Bot, 
  FileText, Settings, ShieldCheck, Zap 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenChat }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, isSpecial: true },
    { id: 'report', label: 'PDF Report', icon: FileText },
  ];

  return (
    <aside className="w-64 flex flex-col justify-between p-4 hidden md:flex">
      {/* Floating rounded card */}
      <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-white/60 dark:border-bento-darkBorder flex flex-col h-full">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-violet flex items-center justify-center text-white shadow-bento-hero">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-bento-text dark:text-bento-darkText">
              Nexus<span className="text-brand-indigo">Commerce</span>
            </h1>
            <p className="text-[11px] text-bento-muted font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
              CockroachDB Live
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'assistant') {
                    onOpenChat();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-bento relative ${
                  isActive
                    ? 'bg-brand-indigo text-white shadow-bento-hero'
                    : 'text-bento-muted hover:text-bento-text dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.isSpecial && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-300">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Security & Access Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 px-2">
          <div className="flex items-center gap-2 text-xs text-bento-muted">
            <ShieldCheck className="w-4 h-4 text-brand-emerald" />
            <span className="font-medium">Read-Only Session</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Cluster: AWS ap-south-1</p>
        </div>
      </div>
    </aside>
  );
};
